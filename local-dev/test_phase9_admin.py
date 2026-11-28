"""Phase 9 admin reads: guards, genuine metrics, directory filters.

Runs against its own SQLite database under ``.test-artifacts``; the development
database is never opened.
"""
from __future__ import annotations

import os
import sys
import unittest
from datetime import date, datetime, timedelta
from pathlib import Path
from unittest.mock import patch

BACKEND = Path(__file__).resolve().parent.parent / 'current-website' / 'DIgital-Club'
ARTIFACTS = Path(__file__).resolve().parent / '.test-artifacts'
ARTIFACTS.mkdir(exist_ok=True)
DB_PATH = ARTIFACTS / 'test_phase9.sqlite'
if DB_PATH.exists():
    DB_PATH.unlink()

os.environ.update(
    {
        'FLASK_ENV': 'development',
        'SECRET_KEY': 'phase9-test-secret',
        'DATABASE_URL': 'sqlite:///' + DB_PATH.as_posix(),
        'RATELIMIT_ENABLED': '1',
        'SESSION_COOKIE_SECURE': '0',
        'TURNSTILE_SITE_KEY': '1x00000000000000000000AA',
        'TURNSTILE_SECRET_KEY': '1x0000000000000000000000000000000AA',
    }
)

sys.path.insert(0, str(BACKEND))
os.chdir(BACKEND)

from app.time_utils import app_now_naive  # noqa: E402

import app.models  # noqa: E402,F401
from app import create_app, db  # noqa: E402
from app.api.ratelimit import reset_rate_limits  # noqa: E402
from app.models import (  # noqa: E402
    DailyActiveUser,
    Event,
    Member,
    News,
    Newsletter,
    Project,
    User,
)

app = create_app()
app.config.update(TESTING=True, PROPAGATE_EXCEPTIONS=False, RATELIMIT_ENABLED=True)

PASSWORD = 'phase9-password'
EMAIL_ADMIN = 'admin.phase9@test.local'
EMAIL_QUIZMASTER = 'quizmaster.phase9@test.local'
EMAIL_STUDENT = 'amina.phase9@test.local'
EMAIL_PENDING = 'pending.phase9@test.local'


def _user(email, name, *, role='student', approved=True, active=True, member=True):
    user = User(email=email, role=role, is_approved=approved, is_active_account=active)
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
            phone='+255700000001',
            member_id_number=f'DC-2026-A{user.id:03d}',
            created_at=datetime(2025, 10, 4),
        )
        db.session.add(row)
        db.session.flush()
    return user, row


def seed():
    with app.app_context():
        db.create_all()
        now = app_now_naive()

        admin, _ = _user(EMAIL_ADMIN, 'Admin Person', role='admin', member=False)
        _user(EMAIL_QUIZMASTER, 'Quiz Master', role='quizmaster', member=False)
        student_user, student_member = _user(EMAIL_STUDENT, 'Amina Juma')
        _user('baraka.phase9@test.local', 'Baraka Mwita')
        _user(EMAIL_PENDING, 'Pending Person', approved=False)
        _user('disabled.phase9@test.local', 'Disabled Person', active=False)

        db.session.add_all(
            [
                News(
                    title='Hackathon registration open',
                    content='<p>Join us.</p>',
                    author_id=admin.id,
                    published_date=now - timedelta(days=1),
                ),
                News(
                    title='Lab hours extended',
                    content='<p>Open late.</p>',
                    author_id=admin.id,
                    published_date=now,
                ),
                Event(
                    title='Upcoming workshop',
                    event_date=now + timedelta(days=3),
                    location='Lab 1',
                ),
                Event(
                    title='Past workshop',
                    event_date=now - timedelta(days=3),
                    location='Lab 2',
                ),
                Newsletter(email='a@test.local', is_active=True),
                Newsletter(email='b@test.local', is_active=True),
                Newsletter(email='c@test.local', is_active=False),
                DailyActiveUser(user_id=student_user.id, activity_date=now.date()),
                Project(
                    title='Smart Campus Navigator',
                    description='Wayfinding',
                    member_id=student_member.id,
                    is_public=True,
                    technologies='React, Flask',
                ),
            ]
        )
        db.session.commit()
        return {
            'admin_id': admin.id,
            'admin_no_member_id': admin.id,
            'student_user_id': student_user.id,
            'student_member_id': student_member.id,
            'student_number': student_member.member_id_number,
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

    def login(self, email=EMAIL_ADMIN):
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

    def data(self, path, status=200):
        response = self.client.get(path)
        self.assertEqual(response.status_code, status, response.get_data(as_text=True))
        return response.get_json()['data']

    def meta(self, path):
        response = self.client.get(path)
        self.assertEqual(response.status_code, 200, response.get_data(as_text=True))
        return response.get_json()['meta']

    def code(self, response):
        return response.get_json()['error']['code']


ADMIN_READS = (
    '/api/v1/admin/dashboard',
    '/api/v1/admin/members',
    '/api/v1/admin/members/1',
    '/api/v1/admin/approvals',
)


class Guards(Base):
    def test_anonymous_is_401(self):
        for path in ADMIN_READS:
            with self.subTest(path=path):
                response = self.client.get(path)
                self.assertEqual(response.status_code, 401)
                self.assertEqual(self.code(response), 'AUTH_REQUIRED')

    def test_student_is_403(self):
        self.login(EMAIL_STUDENT)
        for path in ADMIN_READS:
            with self.subTest(path=path):
                response = self.client.get(path)
                self.assertEqual(response.status_code, 403)
                self.assertEqual(self.code(response), 'FORBIDDEN')

    def test_quizmaster_is_403(self):
        self.login(EMAIL_QUIZMASTER)
        assert_blocked = self.client.get('/api/v1/admin/dashboard')
        self.assertEqual(assert_blocked.status_code, 403)


class DashboardTests(Base):
    def test_metrics_are_counted_from_rows(self):
        self.login()
        data = self.data('/api/v1/admin/dashboard')
        # Members: Amina, Baraka, Pending, Disabled (the two staff have no row).
        self.assertEqual(data['members']['total'], 3)
        self.assertEqual(data['members']['approved'], 2)
        self.assertEqual(data['members']['pending_approval'], 1)
        self.assertEqual(data['members']['deactivated'], 1)
        self.assertEqual(data['events']['upcoming'], 1)
        self.assertEqual(data['newsletter']['active_subscribers'], 2)
        self.assertEqual(data['activity']['daily_active_users'], 1)
        # No open period is seeded, so finance is absent rather than zeroed.
        self.assertIsNone(data['finance'])
        self.assertEqual([row['title'] for row in data['recent']['news']][0], 'Lab hours extended')
        self.assertEqual(len(data['recent']['signups']), 4)

    def test_finance_appears_only_with_an_open_period(self):
        from app.models import FinancialPeriod

        with app.app_context():
            admin_id = IDS['admin_id']
            db.session.add(
                FinancialPeriod(
                    name='2026/27',
                    start_date=date(2026, 1, 1),
                    end_date=date(2026, 12, 31),
                    status='open',
                    opened_by=admin_id,
                )
            )
            db.session.commit()
        try:
            self.login()
            finance = self.data('/api/v1/admin/dashboard')['finance']
            self.assertEqual(finance['period_name'], '2026/27')
            self.assertEqual(finance['revenue'], 0.0)
            self.assertEqual(finance['balance'], 0.0)
        finally:
            with app.app_context():
                FinancialPeriod.query.filter_by(name='2026/27').delete()
                db.session.commit()


class MemberDirectoryTests(Base):
    def test_lists_every_account_with_pagination_meta(self):
        self.login()
        rows = self.data('/api/v1/admin/members')
        self.assertEqual(len(rows), 6)
        meta = self.meta('/api/v1/admin/members')
        self.assertEqual(meta['pagination']['total'], 6)
        self.assertEqual(meta['pagination']['pages'], 1)
        self.assertEqual(
            set(rows[0]),
            {
                'user_id',
                'member_id',
                'email',
                'display_name',
                'course',
                'year',
                'student_status',
                'role',
                'is_approved',
                'is_active',
                'is_super_admin',
                'member_number',
                'avatar_url',
                'registered_at',
            },
        )
        self.assertNotIn('password_hash', str(rows))

    def test_approval_filter(self):
        self.login()
        pending = self.data('/api/v1/admin/members?approval=pending')
        self.assertEqual([row['email'] for row in pending], [EMAIL_PENDING])
        approved = self.data('/api/v1/admin/members?approval=approved')
        self.assertEqual(len(approved), 5)

    def test_role_account_and_status_filters(self):
        self.login()
        self.assertEqual(len(self.data('/api/v1/admin/members?role=admin')), 1)
        self.assertEqual(len(self.data('/api/v1/admin/members?account=deactivated')), 1)
        self.assertEqual(self.data('/api/v1/admin/members?status=alumni'), [])

    def test_search_by_name_email_and_member_number(self):
        self.login()
        by_name = self.data('/api/v1/admin/members?q=Baraka')
        self.assertEqual([row['display_name'] for row in by_name], ['Baraka Mwita'])
        by_email = self.data('/api/v1/admin/members?q=pending.phase9')
        self.assertEqual(len(by_email), 1)
        by_number = self.data(f"/api/v1/admin/members?q={IDS['student_number']}")
        self.assertEqual(
            [row['display_name'] for row in by_number], ['Amina Juma']
        )

    def test_invalid_filter_is_422(self):
        self.login()
        response = self.client.get('/api/v1/admin/members?approval=maybe')
        self.assertEqual(response.status_code, 422)
        self.assertIn('approval', response.get_json()['error']['details'])


class MemberDetailTests(Base):
    def test_member_detail_has_real_aggregates(self):
        self.login()
        data = self.data(f"/api/v1/admin/members/{IDS['student_user_id']}")
        self.assertEqual(data['display_name'], 'Amina Juma')
        self.assertEqual(data['email'], EMAIL_STUDENT)
        self.assertIn('state', data['membership'])
        self.assertEqual(data['points']['total'], 0)
        self.assertEqual(data['counts']['projects'], 1)
        self.assertEqual(data['privacy']['profile_visibility'], 'private')

    def test_admin_without_member_row(self):
        self.login()
        data = self.data(f"/api/v1/admin/members/{IDS['admin_no_member_id']}")
        self.assertIsNone(data['member_id'])
        self.assertIsNone(data['membership'])
        self.assertIsNone(data['counts'])

    def test_unknown_account_is_404(self):
        self.login()
        response = self.client.get('/api/v1/admin/members/99999')
        self.assertEqual(response.status_code, 404)
        self.assertEqual(self.code(response), 'NOT_FOUND')


class ApprovalQueueTests(Base):
    def test_lists_only_pending_accounts(self):
        self.login()
        rows = self.data('/api/v1/admin/approvals')
        self.assertEqual([row['email'] for row in rows], [EMAIL_PENDING])
        self.assertFalse(rows[0]['is_approved'])
        self.assertNotIn('password_hash', str(rows))


if __name__ == '__main__':
    unittest.main(verbosity=2)
