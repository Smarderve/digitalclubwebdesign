"""Phase 9 admin writes: role and access changes for member accounts.

Isolated database under ``.test-artifacts``; the development database is never
opened.
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
DB_PATH = ARTIFACTS / 'test_phase9_writes.sqlite'
if DB_PATH.exists():
    DB_PATH.unlink()

os.environ.update(
    {
        'FLASK_ENV': 'development',
        'SECRET_KEY': 'phase9-writes-secret',
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
from app.models import Member, User  # noqa: E402

app = create_app()
app.config.update(TESTING=True, PROPAGATE_EXCEPTIONS=False, RATELIMIT_ENABLED=True)

PASSWORD = 'admin-write-password'
ADMIN = 'admin.writes@test.local'
SUPER = 'super.writes@test.local'
SECOND_ADMIN = 'admin2.writes@test.local'
STUDENT = 'student.writes@test.local'
QUIZMASTER = 'quizmaster.writes@test.local'


def _user(email, name, *, role='student', member=True, super_admin=False):
    user = User(
        email=email,
        role=role,
        is_approved=True,
        is_active_account=True,
        is_super_admin=super_admin,
    )
    user.set_password(PASSWORD)
    db.session.add(user)
    db.session.flush()
    if member:
        db.session.add(
            Member(
                user_id=user.id,
                full_name=name,
                course='Bachelor of Computer Science',
                year='Year 2',
                status='student',
                member_id_number=f'DC-2026-W{user.id:03d}',
            )
        )
    return user


def seed():
    with app.app_context():
        db.create_all()
        admin = _user(ADMIN, 'Admin Writes', role='admin', member=False)
        super_admin = _user(SUPER, 'Super Writes', role='admin', member=False, super_admin=True)
        second = _user(SECOND_ADMIN, 'Second Admin', role='admin', member=False)
        student = _user(STUDENT, 'Student Writes')
        quizmaster = _user(QUIZMASTER, 'Quiz Writes', role='quizmaster')
        db.session.commit()
        return {
            'admin': admin.id,
            'super': super_admin.id,
            'second': second.id,
            'student': student.id,
            'quizmaster': quizmaster.id,
        }


IDS = seed()


class Base(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()
        reset_rate_limits()
        patcher = patch('app.routes.auth._verify_turnstile', return_value=True)
        patcher.start()
        self.addCleanup(patcher.stop)

    def csrf(self):
        response = self.client.get('/api/v1/auth/csrf')
        self.assertEqual(response.status_code, 200)
        return response.get_json()['data']['csrf_token']

    def login(self, email=ADMIN):
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

    def patch_member(self, user_id, body, status=200):
        response = self.client.patch(
            f'/api/v1/admin/members/{user_id}',
            json=body,
            headers={'X-CSRF-Token': self.csrf()},
        )
        self.assertEqual(response.status_code, status, response.get_data(as_text=True))
        return response.get_json().get('data') or {}

    def code(self, response):
        return response.get_json()['error']['code']


class Guards(Base):
    def test_anonymous_is_401(self):
        response = self.client.patch(
            f"/api/v1/admin/members/{IDS['student']}",
            json={'role': 'quizmaster'},
            headers={'X-CSRF-Token': self.csrf()},
        )
        self.assertEqual(response.status_code, 401)
        self.assertEqual(self.code(response), 'AUTH_REQUIRED')

    def test_student_is_403(self):
        self.login(STUDENT)
        response = self.client.patch(
            f"/api/v1/admin/members/{IDS['student']}",
            json={'role': 'quizmaster'},
            headers={'X-CSRF-Token': self.csrf()},
        )
        self.assertEqual(response.status_code, 403)
        self.assertEqual(self.code(response), 'FORBIDDEN')


class RoleTests(Base):
    def test_promote_and_revoke_quizmaster(self):
        self.login()
        data = self.patch_member(IDS['student'], {'role': 'quizmaster'})
        self.assertEqual(data['role'], 'quizmaster')
        self.assertEqual(
            self.client.get('/api/v1/admin/members?role=quizmaster').get_json()['meta']['pagination']['total'],
            2,
        )

        data = self.patch_member(IDS['student'], {'role': 'student'})
        self.assertEqual(data['role'], 'student')

    def test_invalid_role_is_422(self):
        self.login()
        data = self.patch_member(IDS['student'], {'role': 'root'}, status=422)
        self.assertEqual(data, {})

    def test_administrator_role_is_immutable_here(self):
        self.login()
        response = self.client.patch(
            f"/api/v1/admin/members/{IDS['second']}",
            json={'role': 'student'},
            headers={'X-CSRF-Token': self.csrf()},
        )
        self.assertEqual(response.status_code, 409)
        self.assertEqual(self.code(response), 'ADMIN_ROLE_IMMUTABLE')

    def test_unknown_account_is_404(self):
        self.login()
        response = self.client.patch(
            '/api/v1/admin/members/99999',
            json={'role': 'student'},
            headers={'X-CSRF-Token': self.csrf()},
        )
        self.assertEqual(response.status_code, 404)
        self.assertEqual(self.code(response), 'NOT_FOUND')

    def test_empty_body_is_422(self):
        self.login()
        response = self.client.patch(
            f"/api/v1/admin/members/{IDS['student']}",
            json={},
            headers={'X-CSRF-Token': self.csrf()},
        )
        self.assertEqual(response.status_code, 422)
        self.assertIn('body', response.get_json()['error']['details'])


class AccessTests(Base):
    def test_access_change_requires_the_admin_password(self):
        self.login()
        response = self.client.patch(
            f"/api/v1/admin/members/{IDS['student']}",
            json={'is_active': False},
            headers={'X-CSRF-Token': self.csrf()},
        )
        self.assertEqual(response.status_code, 422)
        self.assertIn('password', response.get_json()['error']['details'])

        response = self.client.patch(
            f"/api/v1/admin/members/{IDS['student']}",
            json={'is_active': False, 'password': 'wrong-password'},
            headers={'X-CSRF-Token': self.csrf()},
        )
        self.assertEqual(response.status_code, 403)
        self.assertEqual(self.code(response), 'PASSWORD_INVALID')

    def test_deactivate_and_restore(self):
        self.login()
        data = self.patch_member(
            IDS['student'], {'is_active': False, 'password': PASSWORD}
        )
        self.assertFalse(data['is_active'])

        data = self.patch_member(
            IDS['student'], {'is_active': True, 'password': PASSWORD}
        )
        self.assertTrue(data['is_active'])

    def test_cannot_change_own_access(self):
        self.login()
        response = self.client.patch(
            f"/api/v1/admin/members/{IDS['admin']}",
            json={'is_active': False, 'password': PASSWORD},
            headers={'X-CSRF-Token': self.csrf()},
        )
        self.assertEqual(response.status_code, 409)
        self.assertEqual(self.code(response), 'CANNOT_MODIFY_SELF')

    def test_super_admin_is_protected(self):
        self.login()
        response = self.client.patch(
            f"/api/v1/admin/members/{IDS['super']}",
            json={'is_active': False, 'password': PASSWORD},
            headers={'X-CSRF-Token': self.csrf()},
        )
        self.assertEqual(response.status_code, 409)
        self.assertEqual(self.code(response), 'SUPER_ADMIN_PROTECTED')

    def test_deactivated_account_cannot_sign_in(self):
        self.login()
        self.patch_member(IDS['quizmaster'], {'is_active': False, 'password': PASSWORD})
        try:
            client = app.test_client()
            token = client.get('/api/v1/auth/csrf').get_json()['data']['csrf_token']
            response = client.post(
                '/api/v1/auth/login',
                json={
                    'email': QUIZMASTER,
                    'password': PASSWORD,
                    'remember': False,
                    'turnstile_token': 'test-token',
                },
                headers={'X-CSRF-Token': token},
            )
            self.assertIn(response.status_code, (401, 403))
        finally:
            self.login()
            self.patch_member(IDS['quizmaster'], {'is_active': True, 'password': PASSWORD})


if __name__ == '__main__':
    unittest.main(verbosity=2)
