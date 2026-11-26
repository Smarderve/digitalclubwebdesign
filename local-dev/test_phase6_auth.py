"""Phase 6 verification: session authentication and account lifecycle.

Covers the JSON endpoints AU2–AU7 and the identity projection ME1, plus the
regression that matters most: the existing Jinja login form still works after
account creation moved into ``app.services.accounts``.

Runs against an isolated temporary SQLite database. It never opens
``instance/dev_local.db`` and never touches production. Accounts created here
exist only inside the temp file, which is recreated on each run.

Run from the parent project root:
    current-website/DIgital-Club/.venv/Scripts/python.exe local-dev/test_phase6_auth.py -v
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
DB_PATH = ARTIFACTS / 'test_phase6.sqlite'
if DB_PATH.exists():
    DB_PATH.unlink()

os.environ.update(
    {
        'FLASK_ENV': 'development',
        'SECRET_KEY': 'phase6-test-secret',
        'DATABASE_URL': 'sqlite:///' + DB_PATH.as_posix(),
        'QUIZ_REMINDER_RUN_ON_REQUEST': '0',
        'RATELIMIT_ENABLED': '1',
        'SESSION_COOKIE_SECURE': '0',
        'TURNSTILE_SITE_KEY': '1x00000000000000000000AA',
        'TURNSTILE_SECRET_KEY': '1x0000000000000000000000000000000AA',
    }
)

sys.path.insert(0, str(BACKEND))
os.chdir(BACKEND)

import app.models  # noqa: E402,F401  (registers every table on db.metadata)
from app import create_app, db  # noqa: E402
from app.api.ratelimit import reset_rate_limits  # noqa: E402
from app.models import Member, SystemSettings, User  # noqa: E402
from app.routes import auth as auth_routes  # noqa: E402

app = create_app()
app.config.update(TESTING=False, PROPAGATE_EXCEPTIONS=False, RATELIMIT_ENABLED=True)

# Keep digital-ID rendering out of the repository and out of the test's way.
UPLOADS = ARTIFACTS / 'uploads'
(UPLOADS / 'digital_ids').mkdir(parents=True, exist_ok=True)
(UPLOADS / 'digital_ids' / 'test-id.png').write_bytes(b'\x89PNG\r\n\x1a\n')
app.config['UPLOAD_FOLDER'] = str(UPLOADS)

APPROVED_EMAIL = 'student.approved@test.local'
# Created before this change, when registration still required approval:
# the legacy flag must no longer block sign-in.
LEGACY_EMAIL = 'student.legacy.unapproved@test.local'
INACTIVE_EMAIL = 'student.inactive@test.local'
ADMIN_EMAIL = 'admin.phase6@test.local'
PASSWORD = 'phase6-password'


def _make_user(email, *, role='student', approved=True, active=True, with_member=True):
    user = User(email=email, role=role, is_approved=approved, is_active_account=active)
    user.set_password(PASSWORD)
    db.session.add(user)
    db.session.flush()
    if with_member:
        db.session.add(
            Member(
                user_id=user.id,
                full_name='Test Student',
                phone='+255700000000',
                course='Bachelor of Computer Science',
                year='Year 2',
                digital_id_path='test-id.png',
            )
        )
    db.session.commit()
    return user.id


def seed():
    with app.app_context():
        db.create_all()
        ids = {
            'approved': _make_user(APPROVED_EMAIL),
            'legacy': _make_user(LEGACY_EMAIL, approved=False),
            'inactive': _make_user(INACTIVE_EMAIL, active=False),
            'admin': _make_user(ADMIN_EMAIL, role='admin', with_member=False),
        }
        return ids


IDS = seed()


class Base(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()
        reset_rate_limits()
        self.turnstile = patch('app.routes.auth._verify_turnstile', return_value=True)
        self.turnstile.start()
        self.addCleanup(self.turnstile.stop)

    def csrf(self):
        response = self.client.get('/api/v1/auth/csrf')
        self.assertEqual(response.status_code, 200)
        return response.get_json()['data']['csrf_token']

    def post(self, path, payload, token=None):
        headers = {}
        if token:
            headers['X-CSRF-Token'] = token
        return self.client.post(path, json=payload, headers=headers)

    def login(self, email=APPROVED_EMAIL, password=PASSWORD, remember=True):
        return self.post(
            '/api/v1/auth/login',
            {
                'email': email,
                'password': password,
                'remember': remember,
                'turnstile_token': 'test-token',
            },
            self.csrf(),
        )


class LoginTests(Base):
    def test_login_succeeds_and_returns_identity_and_fresh_csrf(self):
        response = self.login()
        self.assertEqual(response.status_code, 200)
        data = response.get_json()['data']
        self.assertEqual(data['user']['email'], APPROVED_EMAIL)
        self.assertEqual(data['user']['role'], 'student')
        self.assertEqual(data['user']['status'], 'approved')
        self.assertIn('full_name', data['user'])
        self.assertTrue(data['csrf_token'])
        self.assertEqual(response.headers['Cache-Control'], 'no-store')
        # No password material may appear anywhere in the body.
        self.assertNotIn('password', response.get_data(as_text=True).lower())

    def test_login_establishes_the_session(self):
        self.assertEqual(self.login().status_code, 200)
        me = self.client.get('/api/v1/me')
        self.assertEqual(me.status_code, 200)
        self.assertEqual(me.get_json()['data']['user']['email'], APPROVED_EMAIL)

    def test_wrong_password_is_401(self):
        response = self.login(password='wrong-password')
        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.get_json()['error']['code'], 'INVALID_CREDENTIALS')

    def test_unknown_email_is_401_with_the_same_message(self):
        response = self.login(email='nobody@test.local')
        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.get_json()['error']['code'], 'INVALID_CREDENTIALS')

    def test_legacy_unapproved_account_can_sign_in(self):
        """The legacy is_approved flag is not consulted any more."""
        response = self.login(email=LEGACY_EMAIL)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()['data']['user']['status'], 'approved')

    def test_inactive_account_is_403(self):
        response = self.login(email=INACTIVE_EMAIL)
        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.get_json()['error']['code'], 'ACCOUNT_INACTIVE')

    def test_admin_without_member_row_can_sign_in(self):
        response = self.login(email=ADMIN_EMAIL)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()['data']['user']['role'], 'admin')

    def test_missing_csrf_is_rejected(self):
        response = self.post(
            '/api/v1/auth/login',
            {'email': APPROVED_EMAIL, 'password': PASSWORD, 'turnstile_token': 'x'},
        )
        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.get_json()['error']['code'], 'CSRF_TOKEN_INVALID')

    def test_failed_human_verification_is_400(self):
        with patch('app.routes.auth._verify_turnstile', return_value=False):
            response = self.login()
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.get_json()['error']['code'], 'TURNSTILE_FAILED')

    def test_unconfigured_turnstile_refuses_rather_than_allows(self):
        original = app.config['TURNSTILE_SECRET_KEY']
        app.config['TURNSTILE_SECRET_KEY'] = ''
        try:
            response = self.login()
        finally:
            app.config['TURNSTILE_SECRET_KEY'] = original
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.get_json()['error']['code'], 'TURNSTILE_FAILED')

    def test_validation_error_lists_the_field(self):
        token = self.csrf()
        response = self.post('/api/v1/auth/login', {'email': APPROVED_EMAIL}, token)
        self.assertEqual(response.status_code, 422)
        body = response.get_json()['error']
        self.assertEqual(body['code'], 'VALIDATION_ERROR')
        self.assertIn('password', body['details'])

    def test_login_is_rate_limited(self):
        original = app.config['API_RATE_LIMITS']
        app.config['API_RATE_LIMITS'] = dict(original, auth_login=(2, 60))
        try:
            token = self.csrf()
            payload = {
                'email': APPROVED_EMAIL,
                'password': 'wrong-password',
                'turnstile_token': 'x',
            }
            self.assertEqual(self.post('/api/v1/auth/login', payload, token).status_code, 401)
            self.assertEqual(self.post('/api/v1/auth/login', payload, token).status_code, 401)
            limited = self.post('/api/v1/auth/login', payload, token)
        finally:
            app.config['API_RATE_LIMITS'] = original
            reset_rate_limits()
        self.assertEqual(limited.status_code, 429)
        self.assertEqual(limited.get_json()['error']['code'], 'RATE_LIMITED')


class SessionTests(Base):
    def test_logout_ends_the_session(self):
        login = self.login()
        token = login.get_json()['data']['csrf_token']
        response = self.post('/api/v1/auth/logout', {}, token)
        self.assertEqual(response.status_code, 204)
        self.assertEqual(response.get_data(as_text=True), '')
        self.assertEqual(self.client.get('/api/v1/me').status_code, 401)

    def test_logout_requires_a_session(self):
        response = self.post('/api/v1/auth/logout', {}, self.csrf())
        self.assertEqual(response.status_code, 401)

    def test_sign_in_replaces_the_anonymous_session(self):
        """Session fixation: the pre-login CSRF token must not survive sign-in."""
        old_token = self.csrf()
        response = self.login()
        self.assertEqual(response.status_code, 200)
        new_token = response.get_json()['data']['csrf_token']
        self.assertNotEqual(old_token, new_token)

        stale = self.post('/api/v1/auth/logout', {}, old_token)
        self.assertEqual(stale.status_code, 403)
        self.assertEqual(stale.get_json()['error']['code'], 'CSRF_TOKEN_INVALID')

        self.assertEqual(self.post('/api/v1/auth/logout', {}, new_token).status_code, 204)


class RegisterTests(Base):
    def payload(self, **overrides):
        base = {
            'full_name': 'amina juma',
            'email': 'amina.new@test.local',
            'password': 'a-strong-password',
            'course': 'Bachelor of Computer Science',
            'year': 'Year 1',
            'phone': '+255712345678',
            'turnstile_token': 'test-token',
        }
        base.update(overrides)
        return base

    def test_registration_activates_the_account_immediately(self):
        with patch('app.api.accounts._send_welcome_notifications'):
            response = self.post(
                '/api/v1/auth/register',
                self.payload(email='active.created@test.local'),
                self.csrf(),
            )
        self.assertEqual(response.status_code, 201)
        data = response.get_json()['data']['user']
        self.assertEqual(data['status'], 'approved')
        self.assertTrue(data['can_sign_in'])

        with app.app_context():
            user = User.query.filter_by(email='active.created@test.local').first()
            self.assertIsNotNone(user)
            self.assertTrue(user.is_approved)
            self.assertTrue(user.is_active_account)
            self.assertEqual(user.member.full_name, 'Amina Juma')
            self.assertEqual(user.member.course, 'Bachelor of Computer Science')

    def test_registered_account_can_sign_in_and_reach_the_member_panel(self):
        with patch('app.api.accounts._send_welcome_notifications'):
            self.post('/api/v1/auth/register', self.payload(), self.csrf())
        response = self.login(email='amina.new@test.local', password='a-strong-password')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()['data']['user']['status'], 'approved')

        # The session persists across requests (a page refresh) and the HTML
        # member panel is reachable with no administrator action.
        self.assertEqual(self.client.get('/api/v1/me').status_code, 200)
        self.assertEqual(self.client.get('/member/').status_code, 200)

    def test_manual_approval_setting_no_longer_blocks_registration(self):
        """A stale registration_approval_mode row has no effect any more."""
        with app.app_context():
            setting = SystemSettings.query.filter_by(
                setting_key='registration_approval_mode'
            ).first()
            if setting is None:
                setting = SystemSettings(
                    setting_key='registration_approval_mode', setting_value='manual'
                )
                db.session.add(setting)
            previous = setting.setting_value
            setting.setting_value = 'manual'
            db.session.commit()
        try:
            with patch('app.api.accounts._send_welcome_notifications'):
                response = self.post(
                    '/api/v1/auth/register',
                    self.payload(email='manual.setting@test.local'),
                    self.csrf(),
                )
            self.assertEqual(response.status_code, 201)
            self.assertEqual(response.get_json()['data']['user']['status'], 'approved')
            self.assertEqual(
                self.login(
                    email='manual.setting@test.local', password='a-strong-password'
                ).status_code,
                200,
            )
        finally:
            with app.app_context():
                setting = SystemSettings.query.filter_by(
                    setting_key='registration_approval_mode'
                ).first()
                setting.setting_value = previous
                db.session.commit()

    def test_welcome_notification_is_always_sent(self):
        with patch('app.api.accounts._send_welcome_notifications') as sender:
            response = self.post(
                '/api/v1/auth/register',
                self.payload(email='notified@test.local'),
                self.csrf(),
            )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(sender.call_count, 1)

    def test_duplicate_email_is_409(self):
        response = self.post(
            '/api/v1/auth/register', self.payload(email=APPROVED_EMAIL), self.csrf()
        )
        self.assertEqual(response.status_code, 409)
        self.assertEqual(response.get_json()['error']['code'], 'EMAIL_IN_USE')

    def test_course_must_come_from_the_fixed_list(self):
        response = self.post(
            '/api/v1/auth/register', self.payload(course='Underwater Basket Weaving'), self.csrf()
        )
        self.assertEqual(response.status_code, 422)
        self.assertIn('course', response.get_json()['error']['details'])

    def test_year_must_come_from_the_fixed_list(self):
        response = self.post(
            '/api/v1/auth/register', self.payload(year='Year 9'), self.csrf()
        )
        self.assertEqual(response.status_code, 422)
        self.assertIn('year', response.get_json()['error']['details'])

    def test_short_password_is_rejected(self):
        response = self.post(
            '/api/v1/auth/register', self.payload(password='short'), self.csrf()
        )
        self.assertEqual(response.status_code, 422)
        self.assertIn('password', response.get_json()['error']['details'])

    def test_registration_does_not_start_a_session(self):
        with patch('app.api.accounts._send_welcome_notifications'):
            self.post(
                '/api/v1/auth/register',
                self.payload(email='no.session@test.local'),
                self.csrf(),
            )
        self.assertEqual(self.client.get('/api/v1/me').status_code, 401)


class ApprovalStatusTests(Base):
    def test_authenticated_member_sees_own_status(self):
        self.login()
        response = self.client.get('/api/v1/auth/approval-status')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()['data']['status'], 'approved')

    def test_anonymous_check_reports_an_active_account_as_approved(self):
        response = self.client.get(
            '/api/v1/auth/approval-status', query_string={'email': LEGACY_EMAIL}
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()['data']['status'], 'approved')

    def test_deactivated_account_reports_rejected(self):
        response = self.client.get(
            '/api/v1/auth/approval-status', query_string={'email': INACTIVE_EMAIL}
        )
        self.assertEqual(response.get_json()['data']['status'], 'rejected')

    def test_unknown_email_is_404_and_leaks_nothing(self):
        response = self.client.get(
            '/api/v1/auth/approval-status', query_string={'email': 'ghost@test.local'}
        )
        self.assertEqual(response.status_code, 404)
        self.assertNotIn('ghost', response.get_data(as_text=True))

    def test_missing_email_is_422(self):
        self.assertEqual(self.client.get('/api/v1/auth/approval-status').status_code, 422)


class PasswordResetTests(Base):
    def test_forgot_password_returns_the_same_body_for_known_and_unknown(self):
        with patch('app.api.accounts._send_reset_link') as sender:
            known = self.post(
                '/api/v1/auth/password/forgot',
                {'email': APPROVED_EMAIL, 'turnstile_token': 'x'},
                self.csrf(),
            )
            unknown = self.post(
                '/api/v1/auth/password/forgot',
                {'email': 'nobody@test.local', 'turnstile_token': 'x'},
                self.csrf(),
            )
        self.assertEqual(known.status_code, 202)
        self.assertEqual(unknown.status_code, 202)
        self.assertEqual(known.get_json()['data'], unknown.get_json()['data'])
        self.assertEqual(sender.call_count, 1)

    def test_reset_token_changes_the_password(self):
        with app.app_context():
            user = User.query.filter_by(email=APPROVED_EMAIL).first()
            token = auth_routes.generate_password_reset_token(user)

        response = self.post(
            '/api/v1/auth/password/reset',
            {'token': token, 'password': 'brand-new-password'},
            self.csrf(),
        )
        self.assertEqual(response.status_code, 204)

        signed_in = self.login(password='brand-new-password')
        self.assertEqual(signed_in.status_code, 200)

        with app.app_context():
            user = User.query.filter_by(email=APPROVED_EMAIL).first()
            user.set_password(PASSWORD)
            db.session.commit()

    def test_invalid_token_is_400(self):
        response = self.post(
            '/api/v1/auth/password/reset',
            {'token': 'not-a-token', 'password': 'brand-new-password'},
            self.csrf(),
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.get_json()['error']['code'], 'TOKEN_INVALID')

    def test_short_password_is_422(self):
        with app.app_context():
            user = User.query.filter_by(email=APPROVED_EMAIL).first()
            token = auth_routes.generate_password_reset_token(user)
        response = self.post(
            '/api/v1/auth/password/reset', {'token': token, 'password': 'short'}, self.csrf()
        )
        self.assertEqual(response.status_code, 422)


class MeProjectionTests(Base):
    def test_me_reports_role_status_capabilities_and_completion(self):
        self.login()
        data = self.client.get('/api/v1/me').get_json()['data']
        self.assertEqual(data['user']['role'], 'student')
        self.assertEqual(data['user']['status'], 'approved')
        self.assertIn('member.panel', data['capabilities'])
        self.assertNotIn('admin.panel', data['capabilities'])
        self.assertEqual(data['member']['course'], 'Bachelor of Computer Science')
        self.assertEqual(data['profile_completion']['percent'], 100)
        self.assertNotIn('password', str(data).lower())

    def test_me_never_exposes_member_contact_details(self):
        self.login()
        text = self.client.get('/api/v1/me').get_data(as_text=True)
        self.assertNotIn('+255700000000', text)
        self.assertNotIn('password_hash', text)

    def test_admin_capability(self):
        self.login(email=ADMIN_EMAIL)
        data = self.client.get('/api/v1/me').get_json()['data']
        self.assertIn('admin.panel', data['capabilities'])
        self.assertIsNone(data['member'])

    def test_missing_profile_fields_are_reported(self):
        with app.app_context():
            user = User(email='incomplete@test.local', role='student', is_approved=True)
            user.set_password(PASSWORD)
            db.session.add(user)
            db.session.flush()
            db.session.add(Member(user_id=user.id, full_name='Incomplete Profile'))
            db.session.commit()
        self.login(email='incomplete@test.local')
        data = self.client.get('/api/v1/me').get_json()['data']
        self.assertTrue(data['profile_completion']['required'])
        self.assertIn('course', data['profile_completion']['missing_fields'])
        self.assertIn('phone', data['profile_completion']['missing_fields'])


class HtmlCompatibilityTests(unittest.TestCase):
    """The Jinja pages keep working after account creation was extracted."""

    def setUp(self):
        self.client = app.test_client()
        reset_rate_limits()

    def html_token(self, path='/auth/login'):
        html = self.client.get(path).get_data(as_text=True)
        import re

        match = re.search(r'name="csrf_token"[^>]*value="([^"]+)"', html)
        self.assertIsNotNone(match)
        return match.group(1)

    def test_html_login_still_works(self):
        token = self.html_token()
        with patch('app.routes.auth._verify_turnstile', return_value=True):
            response = self.client.post(
                '/auth/login',
                data={
                    'email': APPROVED_EMAIL,
                    'password': PASSWORD,
                    'cf-turnstile-response': 'test',
                    'csrf_token': token,
                },
            )
        self.assertEqual(response.status_code, 302)

    def test_html_register_still_creates_an_account(self):
        token = self.html_token('/auth/register')
        with patch('app.routes.auth._verify_turnstile', return_value=True):
            response = self.client.post(
                '/auth/register',
                data={
                    'full_name': 'html user',
                    'email': 'html.user@test.local',
                    'password': 'a-strong-password',
                    'confirm_password': 'a-strong-password',
                    'course': 'Bachelor of Computer Science',
                    'year': 'Year 1',
                    'phone': '+255713000000',
                    'cf-turnstile-response': 'test',
                    'csrf_token': token,
                },
            )
        self.assertEqual(response.status_code, 302)
        with app.app_context():
            user = User.query.filter_by(email='html.user@test.local').first()
            self.assertIsNotNone(user)
            self.assertTrue(user.is_active_account)

    def test_html_register_then_login_reaches_the_member_panel(self):
        """End-to-end Jinja flow: register, sign in, open the dashboard."""
        token = self.html_token('/auth/register')
        with patch('app.routes.auth._verify_turnstile', return_value=True):
            registered = self.client.post(
                '/auth/register',
                data={
                    'full_name': 'html e2e',
                    'email': 'html.e2e@test.local',
                    'password': 'a-strong-password',
                    'confirm_password': 'a-strong-password',
                    'course': 'Bachelor of Computer Science',
                    'year': 'Year 2',
                    'phone': '+255713000001',
                    'cf-turnstile-response': 'test',
                    'csrf_token': token,
                },
            )
        self.assertEqual(registered.status_code, 302)
        self.assertTrue(registered.headers['Location'].endswith('/auth/login'))

        login_token = self.html_token()
        with patch('app.routes.auth._verify_turnstile', return_value=True):
            signed_in = self.client.post(
                '/auth/login',
                data={
                    'email': 'html.e2e@test.local',
                    'password': 'a-strong-password',
                    'cf-turnstile-response': 'test',
                    'csrf_token': login_token,
                },
            )
        self.assertEqual(signed_in.status_code, 302)
        self.assertTrue(signed_in.headers['Location'].endswith('/member/'))
        self.assertEqual(self.client.get('/member/').status_code, 200)

    def test_admin_deactivation_blocks_sign_in_and_restore_allows_it(self):
        with app.app_context():
            member_id = _make_user('toggle.target@test.local')
            member = User.query.filter_by(email='toggle.target@test.local').first().member
            member_row_id = member.id
            self.assertEqual(member.user_id, member_id)

        admin_token = self.html_token()
        with patch('app.routes.auth._verify_turnstile', return_value=True):
            admin_login = self.client.post(
                '/auth/login',
                data={
                    'email': ADMIN_EMAIL,
                    'password': PASSWORD,
                    'cf-turnstile-response': 'test',
                    'csrf_token': admin_token,
                },
            )
        self.assertEqual(admin_login.status_code, 302)

        # Admin pages that describe registration still render after the
        # approval views were replaced with account-status views.
        self.assertEqual(self.client.get('/admin/').status_code, 200)
        self.assertEqual(self.client.get('/admin/users').status_code, 200)

        members_page = self.client.get('/admin/members')
        self.assertEqual(members_page.status_code, 200)
        import re

        admin_csrf = re.search(
            r'name="csrf_token"[^>]*value="([^"]+)"', members_page.get_data(as_text=True)
        ).group(1)

        toggled = self.client.post(
            f'/admin/members/{member_row_id}/toggle-active',
            data={'csrf_token': admin_csrf, 'admin_password': PASSWORD},
        )
        self.assertEqual(toggled.status_code, 302)
        with app.app_context():
            user = User.query.filter_by(email='toggle.target@test.local').first()
            self.assertFalse(user.is_active_account)

        fresh = app.test_client()
        with patch('app.routes.auth._verify_turnstile', return_value=True):
            csrf = fresh.get('/api/v1/auth/csrf').get_json()['data']['csrf_token']
            blocked = fresh.post(
                '/api/v1/auth/login',
                json={
                    'email': 'toggle.target@test.local',
                    'password': PASSWORD,
                    'turnstile_token': 'test-token',
                },
                headers={'X-CSRF-Token': csrf},
            )
        self.assertEqual(blocked.status_code, 403)
        self.assertEqual(blocked.get_json()['error']['code'], 'ACCOUNT_INACTIVE')

        restored = self.client.post(
            f'/admin/members/{member_row_id}/toggle-active',
            data={'csrf_token': admin_csrf, 'admin_password': PASSWORD},
        )
        self.assertEqual(restored.status_code, 302)
        with patch('app.routes.auth._verify_turnstile', return_value=True):
            csrf = fresh.get('/api/v1/auth/csrf').get_json()['data']['csrf_token']
            signed_in = fresh.post(
                '/api/v1/auth/login',
                json={
                    'email': 'toggle.target@test.local',
                    'password': PASSWORD,
                    'turnstile_token': 'test-token',
                },
                headers={'X-CSRF-Token': csrf},
            )
        self.assertEqual(signed_in.status_code, 200)

    def test_html_login_page_still_renders(self):
        self.assertEqual(self.client.get('/auth/login').status_code, 200)


if __name__ == '__main__':
    print(f'backed by temp database: {DB_PATH}')
    with app.app_context():
        from sqlalchemy import inspect

        print(f'tables created in temp database: {len(inspect(db.engine).get_table_names())}')
    unittest.main(verbosity=2)
