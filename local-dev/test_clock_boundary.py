"""Clock boundary: schedules are local, audit stamps are UTC.

Seeds every schedule against ``app_now_naive()`` (the application clock) rather
than ``datetime.utcnow()``, so a comparison that accidentally uses the wrong
frame is off by the deployment's three-hour offset and fails here.

Two behaviours are pinned:

1. An event two hours in the past is past: it is excluded from upcoming
   listings, its RSVP state is closed, and RSVP is rejected.
2. An unscheduled quiz's computed end is derived from the UTC ``published_at``
   audit stamp converted to local time, so it is not three hours early.

Isolated database under ``.test-artifacts``; the development database is never
opened.
"""
from __future__ import annotations

import os
import sys
import unittest
from datetime import datetime, timedelta
from pathlib import Path
from unittest.mock import patch

BACKEND = Path(__file__).resolve().parent.parent / 'current-website' / 'DIgital-Club'
ARTIFACTS = Path(__file__).resolve().parent / '.test-artifacts'
ARTIFACTS.mkdir(exist_ok=True)
DB_PATH = ARTIFACTS / 'test_clock_boundary.sqlite'
if DB_PATH.exists():
    DB_PATH.unlink()

os.environ.update(
    {
        'FLASK_ENV': 'development',
        'SECRET_KEY': 'clock-boundary-secret',
        'DATABASE_URL': 'sqlite:///' + DB_PATH.as_posix(),
        'RATELIMIT_ENABLED': '1',
        'SESSION_COOKIE_SECURE': '0',
        'APP_UTC_OFFSET_HOURS': '3',
        'TURNSTILE_SITE_KEY': '1x00000000000000000000AA',
        'TURNSTILE_SECRET_KEY': '1x0000000000000000000000000000000AA',
    }
)

sys.path.insert(0, str(BACKEND))
os.chdir(BACKEND)

import app.models  # noqa: E402,F401
from app import create_app, db  # noqa: E402
from app.api.ratelimit import reset_rate_limits  # noqa: E402
from app.models import Event, Quiz, User  # noqa: E402
from app.services import quizzes as quiz_rules  # noqa: E402
from app.time_utils import (  # noqa: E402
    DEFAULT_APP_UTC_OFFSET_HOURS,
    app_now_naive,
    utc_now,
    utc_to_app_naive,
)

app = create_app()
app.config.update(TESTING=True, PROPAGATE_EXCEPTIONS=False, RATELIMIT_ENABLED=True)


def seed():
    with app.app_context():
        db.create_all()
        admin = User(email='admin.clock@test.local', role='admin', is_approved=True)
        admin.set_password('clock-password')
        db.session.add(admin)
        db.session.flush()

        past_event = Event(
            title='Two hours ago',
            description='Already started.',
            # Schedule columns are application-local: seed them with the app clock.
            event_date=app_now_naive() - timedelta(hours=2),
            location='Lab 1',
            target_audience='everyone',
        )
        fresh_quiz = Quiz(
            title='Unscheduled warmup',
            field_of_study='Computer Science',
            topic='Algorithms',
            status='published',
            duration_minutes=60,
            # published_at is an audit column stored in UTC.
            published_at=utc_now(),
            created_at=utc_now(),
            created_by_user_id=admin.id,
        )
        ended_quiz = Quiz(
            title='Started thirty minutes ago',
            field_of_study='Computer Science',
            topic='Networks',
            status='published',
            duration_minutes=15,
            published_at=utc_now() - timedelta(minutes=30),
            created_at=utc_now() - timedelta(minutes=30),
            created_by_user_id=admin.id,
        )
        db.session.add_all([past_event, fresh_quiz, ended_quiz])
        db.session.commit()
        return {
            'past_event': past_event.id,
            'fresh_quiz': fresh_quiz.id,
            'ended_quiz': ended_quiz.id,
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

    def get_data(self, path, status=200):
        response = self.client.get(path)
        self.assertEqual(response.status_code, status, response.get_data(as_text=True))
        return response.get_json()['data']


class EventClockTests(Base):
    def test_event_two_hours_in_the_past_reports_as_past(self):
        with app.app_context():
            event = Event.query.get(IDS['past_event'])
            self.assertFalse(event.is_upcoming())
            # It started two hours ago, which the app counts as ongoing (24h window).
            self.assertTrue(event.is_ongoing())

        past = self.get_data('/api/v1/public/events?scope=past')
        self.assertIn(IDS['past_event'], [item['id'] for item in past])

        upcoming = self.get_data('/api/v1/public/events?scope=upcoming')
        self.assertNotIn(IDS['past_event'], [item['id'] for item in upcoming])

        detail = self.get_data(f"/api/v1/public/events/{IDS['past_event']}")
        self.assertEqual(detail['rsvp']['state'], 'closed')

    def test_event_in_the_past_rejects_rsvp(self):
        response = self.client.post(
            f"/api/v1/public/events/{IDS['past_event']}/rsvp",
            json={},
            headers={'X-CSRF-Token': self.csrf()},
        )
        self.assertEqual(response.status_code, 409, response.get_data(as_text=True))
        self.assertEqual(response.get_json()['error']['code'], 'RSVP_CLOSED')


class QuizClockTests(Base):
    def test_unscheduled_quiz_end_is_not_three_hours_early(self):
        with app.app_context():
            quiz = Quiz.query.get(IDS['fresh_quiz'])
            end = quiz_rules.end_at(quiz)
            now = app_now_naive()
            self.assertIsNotNone(end)

            # 60-minute quiz published just now: the end is about an hour ahead,
            # not 120 minutes behind (UTC read as local would give now-120).
            minutes_ahead = (end - now).total_seconds() / 60
            self.assertAlmostEqual(minutes_ahead, 60, delta=2)
            self.assertGreater(minutes_ahead, 0)

            self.assertEqual(
                end,
                utc_to_app_naive(quiz.published_at) + timedelta(minutes=60),
            )
            self.assertFalse(quiz_rules.has_ended(quiz))
            # No schedule and already published: the quiz is live.
            self.assertTrue(quiz_rules.is_live(quiz))

    def test_quiz_that_ran_out_has_ended(self):
        with app.app_context():
            quiz = Quiz.query.get(IDS['ended_quiz'])
            end = quiz_rules.end_at(quiz)
            minutes_ahead = (end - app_now_naive()).total_seconds() / 60
            # Published 30 minutes ago + 15 minutes duration = 15 minutes ago.
            # A UTC/local mix-up would report -195.
            self.assertAlmostEqual(minutes_ahead, -15, delta=2)
            self.assertTrue(quiz_rules.has_ended(quiz))
            # ``is_live`` only answers "published and not scheduled in the
            # future"; the member endpoints combine it with ``has_ended``. The
            # combination must be false for a quiz whose window has closed.
            self.assertFalse(quiz_rules.is_live(quiz) and not quiz_rules.has_ended(quiz))


class DetachedEventTests(unittest.TestCase):
    """The helpers must still answer when no application context exists.

    ``app_now_naive()`` reads ``current_app.config``. A detached Event cannot,
    so the model falls back to the deployment default offset (UTC+3) rather
    than UTC. These tests run with no app or request context pushed.
    """

    @staticmethod
    def _local_now():
        return datetime.utcnow() + timedelta(hours=DEFAULT_APP_UTC_OFFSET_HOURS)

    def test_two_hours_ago_is_past_without_an_app_context(self):
        event = Event(title='Detached past', event_date=self._local_now() - timedelta(hours=2))
        self.assertFalse(event.is_upcoming())
        self.assertTrue(event.is_ongoing())

    def test_two_hours_ahead_is_upcoming_without_an_app_context(self):
        event = Event(title='Detached future', event_date=self._local_now() + timedelta(hours=2))
        self.assertTrue(event.is_upcoming())
        self.assertFalse(event.is_ongoing())


if __name__ == '__main__':
    unittest.main(verbosity=2)
