"""Competition enrollment timestamps use the application-local clock.

``CompetitionEnrollment.enrolled_at`` is displayed as a wall-clock time in the
member pages and returned verbatim by the member API, so it is stored local
(like the other member-facing record columns), never UTC. Seeded against
``app_now_naive()`` so a UTC regression is off by the deployment offset and
fails here.

Isolated database under ``.test-artifacts``; the development database is never
opened.
"""
from __future__ import annotations

import os
import sys
import unittest
from datetime import timedelta
from pathlib import Path

BACKEND = Path(__file__).resolve().parent.parent / 'current-website' / 'DIgital-Club'
ARTIFACTS = Path(__file__).resolve().parent / '.test-artifacts'
ARTIFACTS.mkdir(exist_ok=True)
DB_PATH = ARTIFACTS / 'test_enrollment_clock.sqlite'
if DB_PATH.exists():
    DB_PATH.unlink()

os.environ.update(
    {
        'FLASK_ENV': 'development',
        'SECRET_KEY': 'enrollment-clock-secret',
        'DATABASE_URL': 'sqlite:///' + DB_PATH.as_posix(),
        'SESSION_COOKIE_SECURE': '0',
        'APP_UTC_OFFSET_HOURS': '3',
    }
)

sys.path.insert(0, str(BACKEND))
os.chdir(BACKEND)

import app.models  # noqa: E402,F401
from app import create_app, db  # noqa: E402
from app.api.member import _enrollment_payload  # noqa: E402
from app.models import Competition, CompetitionEnrollment, Member, User  # noqa: E402
from app.time_utils import app_now_naive, utc_now  # noqa: E402

app = create_app()
app.config.update(TESTING=True)


def seed():
    with app.app_context():
        db.create_all()
        admin = User(email='admin.enroll@test.local', role='admin', is_approved=True)
        admin.set_password('enroll-password')
        db.session.add(admin)
        db.session.flush()
        member = Member(
            user_id=admin.id,
            full_name='Enrollment Tester',
            course='Bachelor of Computer Science',
            year='Year 2',
            status='student',
            member_id_number='DC-2026-E001',
        )
        competition = Competition(
            title='Clock competition',
            description='Clock boundary fixture.',
            category='Programming',
            frequency='monthly',
            level=1,
            status='published',
            submission_type='link',
            starts_at=app_now_naive() - timedelta(days=1),
            ends_at=app_now_naive() + timedelta(days=1),
            created_by=admin.id,
        )
        db.session.add_all([member, competition])
        db.session.commit()
        return {'member': member.id, 'competition': competition.id}


IDS = seed()


class EnrollmentClockTests(unittest.TestCase):
    def setUp(self):
        # A clean table per test keeps the unique constraint out of the way.
        with app.app_context():
            CompetitionEnrollment.query.delete()
            db.session.commit()

    def test_default_is_application_local_not_utc(self):
        with app.app_context():
            enrollment = CompetitionEnrollment(
                competition_id=IDS['competition'], member_id=IDS['member']
            )
            db.session.add(enrollment)
            db.session.commit()

            local_delta = (enrollment.enrolled_at - app_now_naive()).total_seconds()
            self.assertLess(abs(local_delta), 5, 'enrolled_at is not on the app clock')

            utc_delta = (enrollment.enrolled_at - utc_now()).total_seconds()
            self.assertAlmostEqual(utc_delta, 3 * 3600, delta=5, msg='enrolled_at looks like UTC')

    def test_api_payload_returns_the_stored_local_time_without_conversion(self):
        with app.app_context():
            enrollment = CompetitionEnrollment(
                competition_id=IDS['competition'], member_id=IDS['member']
            )
            db.session.add(enrollment)
            db.session.commit()

            payload = _enrollment_payload(enrollment, 'individual')
            self.assertEqual(payload['enrolled_at'], enrollment.enrolled_at.isoformat())
            self.assertEqual(payload['mode'], 'individual')


if __name__ == '__main__':
    unittest.main(verbosity=2)
