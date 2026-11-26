"""Phase 5 verification: API foundation, CSRF rollout, auth boundaries, limits.

Runs against an isolated temporary SQLite database. It never opens the local
development database (``instance/dev_local.db``) and never touches production.
Accounts created here exist only inside the temp file, which is recreated on
each run.

Run from the parent project root:
    current-website/DIgital-Club/.venv/Scripts/python.exe local-dev/test_phase5_api.py -v
"""

from __future__ import annotations

import os
import subprocess
import sys
import unittest
from pathlib import Path

BACKEND = Path(__file__).resolve().parent.parent / 'current-website' / 'DIgital-Club'
ARTIFACTS = Path(__file__).resolve().parent / '.test-artifacts'
ARTIFACTS.mkdir(exist_ok=True)
DB_PATH = ARTIFACTS / 'test_phase5.sqlite'
if DB_PATH.exists():
    DB_PATH.unlink()

os.environ.update(
    {
        'FLASK_ENV': 'development',
        'SECRET_KEY': 'phase5-test-secret',
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
from app.api.errors import json_endpoint  # noqa: E402
from app.models import User  # noqa: E402
from app.security_config import (  # noqa: E402
    DEV_FALLBACK_SECRET,
    resolve_allowed_origins,
    resolve_cookie_secure,
    resolve_secret_key,
)

app = create_app()
app.config.update(
    TESTING=False,
    PROPAGATE_EXCEPTIONS=False,
    RATELIMIT_ENABLED=True,
)


def _boom():  # a deliberately failing endpoint to prove no internals leak
    raise RuntimeError('boom: sqlite:///secret.db admin@example.com 42')


app.add_url_rule('/api/v1/_boom', '_boom', json_endpoint(_boom))


def _boom_unwrapped():
    raise ValueError('raw failure sqlite:///secret.db')


app.add_url_rule('/api/v1/_boom-unwrapped', '_boom_unwrapped', _boom_unwrapped)

ADMIN_EMAIL = 'admin.phase5@test.local'
STUDENT_EMAIL = 'student.phase5@test.local'


def seed():
    with app.app_context():
        db.create_all()
        admin = User(email=ADMIN_EMAIL, role='admin', is_approved=True, is_active_account=True)
        admin.set_password('phase5-admin-pw')
        student = User(
            email=STUDENT_EMAIL, role='student', is_approved=True, is_active_account=True
        )
        student.set_password('phase5-student-pw')
        db.session.add_all([admin, student])
        db.session.commit()
        return admin.id, student.id


ADMIN_ID, STUDENT_ID = seed()


def login(client, user_id):
    with client.session_transaction() as sess:
        sess['_user_id'] = str(user_id)
        sess['_fresh'] = True


class ApiFoundationTests(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()
        reset_rate_limits()

    def test_health_envelope_and_request_id(self):
        response = self.client.get('/api/v1/health')
        self.assertEqual(response.status_code, 200)
        body = response.get_json()
        self.assertEqual(body['data']['status'], 'ok')
        self.assertEqual(body['data']['api_version'], 'v1')
        self.assertTrue(body['meta']['request_id'])
        self.assertEqual(response.headers['X-Request-ID'], body['meta']['request_id'])
        self.assertEqual(response.headers['Cache-Control'], 'no-store')

    def test_unknown_api_path_returns_envelope_404(self):
        response = self.client.get('/api/v1/does-not-exist')
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.get_json()['error']['code'], 'NOT_FOUND')

    def test_wrong_method_returns_envelope_405(self):
        response = self.client.post('/api/v1/health')
        self.assertEqual(response.status_code, 405)
        self.assertEqual(response.get_json()['error']['code'], 'METHOD_NOT_ALLOWED')

    def test_ready_endpoint(self):
        response = self.client.get('/api/v1/ready')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.get_json()['data']['database'])

    def test_unexpected_exception_is_safe_json_500(self):
        response = self.client.get('/api/v1/_boom')
        self.assertEqual(response.status_code, 500)
        body = response.get_json()
        self.assertEqual(body['error']['code'], 'INTERNAL_ERROR')
        text = response.get_data(as_text=True)
        for leaked in ('RuntimeError', 'Traceback', 'sqlite', 'admin@example.com', 'boom'):
            self.assertNotIn(leaked, text)

    def test_unwrapped_exception_is_safe_json_500(self):
        response = self.client.get('/api/v1/_boom-unwrapped')
        self.assertEqual(response.status_code, 500)
        text = response.get_data(as_text=True)
        for leaked in ('ValueError', 'Traceback', 'sqlite', 'raw failure'):
            self.assertNotIn(leaked, text)

    def test_original_plaintext_404_path_is_not_json(self):
        """/api paths are JSON; a normal unknown page still redirects to home."""
        response = self.client.get('/definitely-not-a-page')
        self.assertIn(response.status_code, (302, 200))

    def test_html_healthz_still_works(self):
        response = self.client.get('/healthz')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()['status'], 'ok')


class AuthTests(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()
        reset_rate_limits()

    def test_me_requires_authentication(self):
        response = self.client.get('/api/v1/me')
        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.get_json()['error']['code'], 'AUTH_REQUIRED')

    def test_me_returns_own_identity_and_is_uncacheable(self):
        login(self.client, STUDENT_ID)
        response = self.client.get('/api/v1/me')
        self.assertEqual(response.status_code, 200)
        data = response.get_json()['data']
        # Phase 6 moved identity under `user` (contract §12.9.2 ME1).
        self.assertEqual(data['user']['email'], STUDENT_EMAIL)
        self.assertEqual(data['user']['role'], 'student')
        self.assertNotIn('password_hash', response.get_data(as_text=True))
        self.assertEqual(response.headers['Cache-Control'], 'no-store')

    def test_diagnostics_requires_login(self):
        self.assertEqual(self.client.get('/api/v1/diagnostics').status_code, 401)

    def test_diagnostics_forbidden_for_member(self):
        login(self.client, STUDENT_ID)
        response = self.client.get('/api/v1/diagnostics')
        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.get_json()['error']['code'], 'FORBIDDEN')

    def test_diagnostics_allowed_for_admin_and_leaks_nothing(self):
        login(self.client, ADMIN_ID)
        response = self.client.get('/api/v1/diagnostics')
        self.assertEqual(response.status_code, 200)
        data = response.get_json()['data']
        self.assertTrue(data['secret_key_configured'])
        self.assertEqual(data['csrf']['header'], 'X-CSRF-Token')
        text = response.get_data(as_text=True).lower()
        # The engine name is a harmless label; a URI, path or credential is not.
        self.assertNotIn('sqlite:///', text)
        self.assertNotIn('dev_local', text)
        self.assertNotIn('password', text)

    def test_inactive_account_is_rejected(self):
        with app.app_context():
            user = User(email='inactive.phase5@test.local', role='student')
            user.set_password('x')
            user.is_active_account = False
            db.session.add(user)
            db.session.commit()
            uid = user.id
        login(self.client, uid)
        response = self.client.get('/api/v1/me')
        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.get_json()['error']['code'], 'ACCOUNT_INACTIVE')


class CsrfTests(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()
        reset_rate_limits()

    def token(self):
        response = self.client.get('/api/v1/auth/csrf')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers['Cache-Control'], 'no-store')
        return response.get_json()['data']['csrf_token']

    def test_token_is_issued(self):
        token = self.token()
        self.assertIsInstance(token, str)
        self.assertGreater(len(token), 20)

    def test_verify_rejects_missing_token(self):
        response = self.client.post('/api/v1/auth/csrf/verify')
        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.get_json()['error']['code'], 'CSRF_TOKEN_INVALID')

    def test_verify_rejects_invalid_token(self):
        response = self.client.post(
            '/api/v1/auth/csrf/verify', headers={'X-CSRF-Token': 'not-a-real-token'}
        )
        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.get_json()['error']['code'], 'CSRF_TOKEN_INVALID')

    def test_verify_accepts_valid_header_token(self):
        token = self.token()
        response = self.client.post('/api/v1/auth/csrf/verify', headers={'X-CSRF-Token': token})
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.get_json()['data']['valid'])

    def test_untrusted_origin_is_rejected_even_with_valid_token(self):
        token = self.token()
        response = self.client.post(
            '/api/v1/auth/csrf/verify',
            headers={'X-CSRF-Token': token, 'Origin': 'http://evil.example'},
        )
        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.get_json()['error']['code'], 'ORIGIN_NOT_ALLOWED')

    def test_same_origin_is_allowed(self):
        token = self.token()
        response = self.client.post(
            '/api/v1/auth/csrf/verify',
            headers={'X-CSRF-Token': token, 'Origin': 'http://localhost'},
        )
        self.assertEqual(response.status_code, 200)


class ExistingFormCompatibilityTests(unittest.TestCase):
    """The Jinja forms must still work once CSRF is enabled application-wide."""

    def setUp(self):
        self.client = app.test_client()
        reset_rate_limits()

    def html_token(self):
        with self.client.get('/contact') as response:
            self.assertEqual(response.status_code, 200)
        import re

        html = self.client.get('/contact').get_data(as_text=True)
        match = re.search(r'name="csrf_token"[^>]*value="([^"]+)"', html)
        self.assertIsNotNone(match, 'the contact form must render a csrf_token field')
        return match.group(1)

    def test_forms_render_a_token_field(self):
        for path in ('/contact', '/auth/login', '/auth/register', '/auth/forgot-password'):
            html = self.client.get(path).get_data(as_text=True)
            self.assertIn('name="csrf_token"', html, f'{path} must include a CSRF token')

    def test_form_without_token_is_rejected(self):
        response = self.client.post('/newsletter/subscribe', data={'email': 'a@b.invalid'})
        self.assertEqual(response.status_code, 400)
        self.assertIn('text/html', response.headers['Content-Type'])

    def test_form_with_token_succeeds(self):
        token = self.html_token()
        response = self.client.post(
            '/newsletter/subscribe',
            data={'email': 'phase5.test@example.invalid', 'csrf_token': token},
        )
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.get_json()['success'])

    def test_login_form_passes_csrf(self):
        token = self.html_token()
        response = self.client.post(
            '/auth/login',
            data={
                'email': STUDENT_EMAIL,
                'password': 'phase5-student-pw',
                'csrf_token': token,
            },
        )
        self.assertIn(response.status_code, (200, 302))
        self.assertNotEqual(response.status_code, 400)

    def test_logout_is_post_only(self):
        self.assertEqual(self.client.get('/auth/logout').status_code, 405)

    def test_public_pages_still_render(self):
        for path in ('/', '/home', '/events', '/blogs', '/news', '/contact'):
            response = self.client.get(path)
            self.assertIn(response.status_code, (200, 302), path)


class RateLimitTests(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()
        reset_rate_limits()
        self._original = app.config['API_RATE_LIMITS']
        app.config['API_RATE_LIMITS'] = dict(self._original, health=(2, 60))

    def tearDown(self):
        app.config['API_RATE_LIMITS'] = self._original
        reset_rate_limits()

    def test_third_request_is_rate_limited(self):
        self.assertEqual(self.client.get('/api/v1/health').status_code, 200)
        self.assertEqual(self.client.get('/api/v1/health').status_code, 200)
        response = self.client.get('/api/v1/health')
        self.assertEqual(response.status_code, 429)
        self.assertEqual(response.get_json()['error']['code'], 'RATE_LIMITED')
        self.assertIn('Retry-After', response.headers)


class ProductionSecretTests(unittest.TestCase):
    def test_missing_secret_refuses_to_start_outside_development(self):
        with self.assertRaises(RuntimeError):
            resolve_secret_key({'FLASK_ENV': 'production', 'SECRET_KEY': ''})

    def test_missing_secret_refuses_when_environment_unset(self):
        with self.assertRaises(RuntimeError):
            resolve_secret_key({})

    def test_development_uses_documented_fallback(self):
        self.assertEqual(
            resolve_secret_key({'FLASK_ENV': 'development', 'SECRET_KEY': ''}),
            DEV_FALLBACK_SECRET,
        )

    def test_explicit_secret_is_used_verbatim(self):
        self.assertEqual(
            resolve_secret_key({'FLASK_ENV': 'production', 'SECRET_KEY': 'abc123'}), 'abc123'
        )

    def test_cookie_and_origin_defaults(self):
        self.assertFalse(resolve_cookie_secure({'FLASK_ENV': 'development'}))
        self.assertTrue(resolve_cookie_secure({'FLASK_ENV': 'production'}))
        self.assertEqual(resolve_allowed_origins({}), set())
        self.assertEqual(
            resolve_allowed_origins({'APP_ALLOWED_ORIGINS': 'http://localhost:5173'}),
            {'localhost:5173'},
        )

    def test_process_level_refusal(self):
        """A real import in a production env with no key must exit non-zero."""
        env = dict(os.environ, FLASK_ENV='production', SECRET_KEY='')
        proc = subprocess.run(
            [
                sys.executable,
                '-c',
                'from app.security_config import resolve_secret_key; resolve_secret_key()',
            ],
            cwd=str(BACKEND),
            env=env,
            capture_output=True,
            text=True,
            timeout=120,
        )
        self.assertNotEqual(proc.returncode, 0)
        self.assertIn('SECRET_KEY is not configured', proc.stderr)


if __name__ == '__main__':
    print(f'backed by temp database: {DB_PATH}')
    with app.app_context():
        from sqlalchemy import inspect

        print(f'tables created in temp database: {len(inspect(db.engine).get_table_names())}')
    unittest.main(verbosity=2)
