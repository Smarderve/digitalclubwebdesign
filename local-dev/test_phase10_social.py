"""Phase 10 social graph: follow, private-profile requests, blocks.

Isolated SQLite database under ``.test-artifacts``; the development database is
never opened. Each test starts from empty social tables.
"""
from __future__ import annotations

import os
import sys
import unittest
from pathlib import Path
from unittest.mock import patch

BACKEND = Path(__file__).resolve().parent.parent / 'current-website' / 'DIgital-Club'
ARTIFACTS = Path(__file__).resolve().parent / '.test-artifacts'
ARTIFACTS.mkdir(exist_ok=True)
DB_PATH = ARTIFACTS / 'test_phase10_social.sqlite'
if DB_PATH.exists():
    DB_PATH.unlink()

os.environ.update(
    {
        'FLASK_ENV': 'development',
        'SECRET_KEY': 'phase10-test-secret',
        'DATABASE_URL': 'sqlite:///' + DB_PATH.as_posix(),
        'RATELIMIT_ENABLED': '1',
        'SESSION_COOKIE_SECURE': '0',
        'TURNSTILE_SITE_KEY': '1x00000000000000000000AA',
        'TURNSTILE_SECRET_KEY': '1x0000000000000000000000000000000AA',
    }
)

sys.path.insert(0, str(BACKEND))
os.chdir(BACKEND)

import app.models  # noqa: E402,F401
from app import create_app, db  # noqa: E402
from app.api.ratelimit import reset_rate_limits  # noqa: E402
from app.models import Member, MemberBlock, MemberFollow, MemberFollowRequest, User  # noqa: E402

app = create_app()
app.config.update(TESTING=True, PROPAGATE_EXCEPTIONS=False, RATELIMIT_ENABLED=True)

PASSWORD = 'phase10-password'
ALICE = 'alice.phase10@test.local'
BOB = 'bob.phase10@test.local'
CAROL = 'carol.phase10@test.local'
EVE = 'eve.phase10@test.local'


def _user(email, name, *, approved=True, active=True, public=False, member=True):
    user = User(email=email, is_approved=approved, is_active_account=active)
    user.set_password(PASSWORD)
    db.session.add(user)
    db.session.flush()
    row = None
    if member:
        row = Member(
            user_id=user.id,
            full_name=name,
            course='Bachelor of Computer Science',
            year='Year 2',
            status='student',
            profile_visibility='public' if public else 'private',
            discoverable=public,
            member_id_number=f'DC-2026-S{user.id:03d}',
        )
        db.session.add(row)
        db.session.flush()
    return user, row


def seed():
    with app.app_context():
        db.create_all()
        _, alice = _user(ALICE, 'Alice Mushi', public=True)
        _, bob = _user(BOB, 'Bob Mwita', public=True)
        _, carol = _user(CAROL, 'Carol Juma')  # private by default
        _, eve = _user(EVE, 'Eve Ndosi')  # private by default
        _, disabled = _user('disabled.phase10@test.local', 'Disabled Person', active=False, public=True)
        _, unapproved = _user('pending.phase10@test.local', 'Pending Person', approved=False, public=True)
        _user('admin.phase10@test.local', 'Admin Person', member=False)
        db.session.commit()
        return {
            'alice': alice.id,
            'bob': bob.id,
            'carol': carol.id,
            'eve': eve.id,
            'disabled': disabled.id,
            'unapproved': unapproved.id,
        }


IDS = seed()


class Base(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()
        reset_rate_limits()
        with app.app_context():
            MemberBlock.query.delete()
            MemberFollow.query.delete()
            MemberFollowRequest.query.delete()
            db.session.commit()
        patcher = patch('app.routes.auth._verify_turnstile', return_value=True)
        patcher.start()
        self.addCleanup(patcher.stop)

    def csrf(self):
        response = self.client.get('/api/v1/auth/csrf')
        self.assertEqual(response.status_code, 200)
        return response.get_json()['data']['csrf_token']

    def login(self, email=ALICE):
        response = self.client.post(
            '/api/v1/auth/login',
            json={
                'email': email,
                'password': PASSWORD,
                'remember': True,
                'turnstile_token': 'test-token',
            },
            headers={'X-CSRF-Token': self.csrf()},
        )
        self.assertEqual(response.status_code, 200, response.get_data(as_text=True))

    def post(self, path, status=201):
        response = self.client.post(path, json={}, headers={'X-CSRF-Token': self.csrf()})
        self.assertEqual(response.status_code, status, response.get_data(as_text=True))
        return response.get_json().get('data') if response.data else None

    def delete(self, path, status=204):
        response = self.client.delete(path, headers={'X-CSRF-Token': self.csrf()})
        self.assertEqual(response.status_code, status, response.get_data(as_text=True))

    def get(self, path, status=200):
        response = self.client.get(path)
        self.assertEqual(response.status_code, status, response.get_data(as_text=True))
        return response.get_json()['data']

    def code(self, response):
        return response.get_json()['error']['code']


class Guards(Base):
    def test_anonymous_is_401(self):
        for path in ('/api/v1/member/follows/followers', '/api/v1/member/follows/requests', '/api/v1/member/blocks'):
            with self.subTest(path=path):
                response = self.client.get(path)
                self.assertEqual(response.status_code, 401)
                self.assertEqual(self.code(response), 'AUTH_REQUIRED')
        # Writes are rejected by the global CSRF guard before authentication
        # (the session has no token), which is the Phase 5 contract.
        response = self.client.post(f"/api/v1/member/follows/{IDS['bob']}", json={})
        self.assertEqual(response.status_code, 403)
        self.assertEqual(self.code(response), 'CSRF_TOKEN_INVALID')

    def test_admin_without_member_row_is_profile_required(self):
        self.login('admin.phase10@test.local')
        response = self.client.get('/api/v1/member/follows/followers')
        self.assertEqual(response.status_code, 404)
        self.assertEqual(self.code(response), 'PROFILE_REQUIRED')


class FollowTests(Base):
    def test_follow_public_member_and_lists(self):
        self.login()
        data = self.post(f"/api/v1/member/follows/{IDS['bob']}")
        self.assertEqual(data['state'], 'following')
        following = self.get('/api/v1/member/follows/following')
        self.assertEqual([row['member_id'] for row in following], [IDS['bob']])
        self.assertIn('followed_at', following[0])

        self.login(BOB)
        followers = self.get('/api/v1/member/follows/followers')
        self.assertEqual([row['display_name'] for row in followers], ['Alice Mushi'])

    def test_duplicate_follow_is_rejected(self):
        self.login()
        self.post(f"/api/v1/member/follows/{IDS['bob']}")
        response = self.client.post(
            f"/api/v1/member/follows/{IDS['bob']}",
            json={},
            headers={'X-CSRF-Token': self.csrf()},
        )
        self.assertEqual(response.status_code, 409)
        self.assertEqual(self.code(response), 'ALREADY_FOLLOWING')

    def test_self_follow_is_422(self):
        self.login()
        response = self.client.post(
            f"/api/v1/member/follows/{IDS['alice']}",
            json={},
            headers={'X-CSRF-Token': self.csrf()},
        )
        self.assertEqual(response.status_code, 422)
        self.assertEqual(self.code(response), 'SELF_ACTION')

    def test_unknown_or_inactive_target_is_404(self):
        self.login()
        for member_id in (IDS['disabled'], IDS['unapproved'], 99999):
            with self.subTest(member_id=member_id):
                response = self.client.post(
                    f'/api/v1/member/follows/{member_id}',
                    json={},
                    headers={'X-CSRF-Token': self.csrf()},
                )
                self.assertEqual(response.status_code, 404)
                self.assertEqual(self.code(response), 'NOT_FOUND')

    def test_unfollow(self):
        self.login()
        self.post(f"/api/v1/member/follows/{IDS['bob']}")
        self.delete(f"/api/v1/member/follows/{IDS['bob']}")
        self.assertEqual(self.get('/api/v1/member/follows/following'), [])
        response = self.client.delete(
            f"/api/v1/member/follows/{IDS['bob']}",
            headers={'X-CSRF-Token': self.csrf()},
        )
        self.assertEqual(response.status_code, 409)
        self.assertEqual(self.code(response), 'NOT_FOLLOWING')


class FollowRequestTests(Base):
    def test_private_profile_requires_a_request(self):
        self.login()
        data = self.post(f"/api/v1/member/follows/{IDS['carol']}", status=202)
        self.assertEqual(data['state'], 'requested')
        self.assertEqual(self.get('/api/v1/member/follows/following'), [])

        self.login(CAROL)
        requests = self.get('/api/v1/member/follows/requests')
        self.assertEqual(len(requests), 1)
        self.assertEqual(requests[0]['member']['display_name'], 'Alice Mushi')
        self.assertEqual(requests[0]['id'], data['request_id'])

    def test_repeated_request_is_rejected(self):
        self.login()
        self.post(f"/api/v1/member/follows/{IDS['carol']}", status=202)
        response = self.client.post(
            f"/api/v1/member/follows/{IDS['carol']}",
            json={},
            headers={'X-CSRF-Token': self.csrf()},
        )
        self.assertEqual(response.status_code, 409)
        self.assertEqual(self.code(response), 'ALREADY_REQUESTED')

    def test_accept_creates_follow_once(self):
        self.login()
        request_id = self.post(f"/api/v1/member/follows/{IDS['carol']}", status=202)['request_id']

        self.login(CAROL)
        self.post(f'/api/v1/member/follows/requests/{request_id}/accept', status=200)
        self.assertEqual(
            [row['member_id'] for row in self.get('/api/v1/member/follows/followers')],
            [IDS['alice']],
        )
        self.assertEqual(self.get('/api/v1/member/follows/requests'), [])

        again = self.client.post(
            f'/api/v1/member/follows/requests/{request_id}/accept',
            json={},
            headers={'X-CSRF-Token': self.csrf()},
        )
        self.assertEqual(again.status_code, 409)
        self.assertEqual(self.code(again), 'NO_REQUEST')

        self.login()
        self.assertEqual(
            [row['member_id'] for row in self.get('/api/v1/member/follows/following')],
            [IDS['carol']],
        )

    def test_only_the_recipient_can_decide(self):
        self.login()
        request_id = self.post(f"/api/v1/member/follows/{IDS['carol']}", status=202)['request_id']
        self.login(EVE)
        response = self.client.post(
            f'/api/v1/member/follows/requests/{request_id}/accept',
            json={},
            headers={'X-CSRF-Token': self.csrf()},
        )
        self.assertEqual(response.status_code, 404)
        self.assertEqual(self.code(response), 'NOT_FOUND')

    def test_decline_leaves_no_follow(self):
        self.login()
        request_id = self.post(f"/api/v1/member/follows/{IDS['carol']}", status=202)['request_id']
        self.login(CAROL)
        self.post(f'/api/v1/member/follows/requests/{request_id}/decline', status=204)
        self.assertEqual(self.get('/api/v1/member/follows/followers'), [])

    def test_cancel_request_by_unfollowing(self):
        self.login()
        self.post(f"/api/v1/member/follows/{IDS['carol']}", status=202)
        self.delete(f"/api/v1/member/follows/{IDS['carol']}")
        self.login(CAROL)
        self.assertEqual(self.get('/api/v1/member/follows/requests'), [])

    def test_following_back_accepts_the_pending_request(self):
        self.login(EVE)
        request_id = self.post(f"/api/v1/member/follows/{IDS['carol']}", status=202)['request_id']

        self.login(CAROL)
        data = self.post(f"/api/v1/member/follows/{IDS['eve']}")
        self.assertEqual(data['request_id'], request_id)
        self.assertEqual(self.get('/api/v1/member/follows/requests'), [])
        self.assertEqual(
            sorted(row['member_id'] for row in self.get('/api/v1/member/follows/following')),
            [IDS['eve']],
        )

        self.login(EVE)
        self.assertEqual(
            [row['member_id'] for row in self.get('/api/v1/member/follows/followers')],
            [IDS['carol']],
        )


class BlockTests(Base):
    def _mutual_follow(self):
        self.login()
        self.post(f"/api/v1/member/follows/{IDS['bob']}")
        self.login(BOB)
        self.post(f"/api/v1/member/follows/{IDS['alice']}")

    def test_block_removes_relationships_both_ways(self):
        self._mutual_follow()
        self.login()
        data = self.post(f"/api/v1/member/blocks/{IDS['bob']}")
        self.assertTrue(data['blocked'])
        self.assertEqual(self.get('/api/v1/member/follows/following'), [])
        self.assertEqual(self.get('/api/v1/member/follows/followers'), [])
        self.assertEqual(
            [row['member_id'] for row in self.get('/api/v1/member/blocks')], [IDS['bob']]
        )

    def test_block_closes_follow_in_both_directions(self):
        self.login()
        self.post(f"/api/v1/member/blocks/{IDS['bob']}")
        self.login(BOB)
        response = self.client.post(
            f"/api/v1/member/follows/{IDS['alice']}",
            json={},
            headers={'X-CSRF-Token': self.csrf()},
        )
        self.assertEqual(response.status_code, 409)
        self.assertEqual(self.code(response), 'BLOCKED')

        self.login()
        response = self.client.post(
            f"/api/v1/member/follows/{IDS['bob']}",
            json={},
            headers={'X-CSRF-Token': self.csrf()},
        )
        self.assertEqual(response.status_code, 409)
        self.assertEqual(self.code(response), 'BLOCKED')

    def test_block_cancels_pending_requests(self):
        self.login()
        self.post(f"/api/v1/member/follows/{IDS['carol']}", status=202)
        self.post(f"/api/v1/member/blocks/{IDS['carol']}")
        self.login(CAROL)
        self.assertEqual(self.get('/api/v1/member/follows/requests'), [])

    def test_duplicate_block_and_unblock(self):
        self.login()
        self.post(f"/api/v1/member/blocks/{IDS['bob']}")
        response = self.client.post(
            f"/api/v1/member/blocks/{IDS['bob']}",
            json={},
            headers={'X-CSRF-Token': self.csrf()},
        )
        self.assertEqual(response.status_code, 409)
        self.assertEqual(self.code(response), 'ALREADY_BLOCKED')

        self.delete(f"/api/v1/member/blocks/{IDS['bob']}")
        self.assertEqual(self.get('/api/v1/member/blocks'), [])
        response = self.client.delete(
            f"/api/v1/member/blocks/{IDS['bob']}",
            headers={'X-CSRF-Token': self.csrf()},
        )
        self.assertEqual(response.status_code, 404)

        self.post(f"/api/v1/member/follows/{IDS['bob']}")


if __name__ == '__main__':
    unittest.main(verbosity=2)
