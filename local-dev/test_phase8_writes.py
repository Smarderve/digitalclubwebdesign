"""Phase 8 verification: member panel write endpoints (MD4, MD13-MD15, MD21,
MD29-MD34, MD37-MD38, MD42-MD44, MD47-MD49).

Runs against an isolated temporary SQLite database and never opens
``instance/dev_local.db``.

Run from the parent project root:
    current-website/DIgital-Club/.venv/Scripts/python.exe local-dev/test_phase8_writes.py -v
"""

from __future__ import annotations

import io
import os
import sys
import unittest
from datetime import date, datetime, time, timedelta
from pathlib import Path
from unittest.mock import patch

BACKEND = Path(__file__).resolve().parent.parent / 'current-website' / 'DIgital-Club'
ARTIFACTS = Path(__file__).resolve().parent / '.test-artifacts'
ARTIFACTS.mkdir(exist_ok=True)
DB_PATH = ARTIFACTS / 'test_phase8_writes.sqlite'
if DB_PATH.exists():
    DB_PATH.unlink()

UPLOADS = ARTIFACTS / 'uploads_phase8_writes'
for folder in ('profiles', 'competitions', 'digital_ids'):
    (UPLOADS / folder).mkdir(parents=True, exist_ok=True)

os.environ.update(
    {
        'FLASK_ENV': 'development',
        'SECRET_KEY': 'phase8-writes-secret',
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

import app.models  # noqa: E402,F401
from app import create_app, db  # noqa: E402
from app.api.ratelimit import reset_rate_limits  # noqa: E402
from app.time_utils import app_now_naive  # noqa: E402
from app.models import (  # noqa: E402
    Competition,
    CompetitionEnrollment,
    Election,
    ElectionCandidate,
    ElectionPosition,
    ElectionVote,
    Member,
    Project,
    Quiz,
    QuizAttempt,
    QuizAttemptAnswer,
    QuizLeaderboard,
    QuizOption,
    QuizQuestion,
    SessionReport,
    SessionSchedule,
    SessionWeek,
    Team,
    TeamMember,
    User,
)

app = create_app()
app.config.update(TESTING=True, PROPAGATE_EXCEPTIONS=False, RATELIMIT_ENABLED=True)
app.config['UPLOAD_FOLDER'] = str(UPLOADS)

with app.app_context():
    NOW = app_now_naive()

# ``NOW`` above uses ``app_now_naive``: the app compares quiz windows against
# that clock, so a UTC fixture would make every seeded quiz look finished.
PASSWORD = 'phase8-writes-password'
EMAIL_A = 'writer.a@test.local'
EMAIL_B = 'writer.b@test.local'
EMAIL_C = 'writer.c@test.local'
EMAIL_ADMIN = 'writer.admin@test.local'

MANIFESTO = (
    'I will run weekly build nights, keep the lab open later and publish a '
    'monthly report of what every team shipped.'
)


def _user(email, name, *, role='student', member=True):
    user = User(email=email, role=role, is_approved=True)
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
            member_id_number=f'DC-2026-W{user.id:03d}',
            created_at=datetime(2025, 10, 4),
        )
        db.session.add(row)
        db.session.flush()
    return user, row


def seed():
    with app.app_context():
        db.create_all()
        admin, _ = _user(EMAIL_ADMIN, 'Instructor Admin', role='admin', member=False)
        user_a, member_a = _user(EMAIL_A, 'Amina Juma')
        user_b, member_b = _user(EMAIL_B, 'Baraka Mwita')
        user_c, member_c = _user(EMAIL_C, 'Chausiku Ally')

        week = SessionWeek(
            title='Week 4',
            week_start=date.today(),
            week_end=date.today() + timedelta(days=6),
            status='published',
        )
        db.session.add(week)
        db.session.flush()
        session = SessionSchedule(
            week_id=week.id,
            session_date=date.today(),
            day_of_week=0,
            start_time=time(17, 0),
            topic='Testing APIs',
            category='Backend',
            mode='physical',
            location='Lab 1',
            instructor_user_id=admin.id,
            created_by=admin.id,
        )
        db.session.add(session)

        live_quiz = Quiz(
            title='Live warmup',
            description='Answer two questions',
            field_of_study='Computer Science',
            topic='Python',
            total_questions=2,
            mcq_count=2,
            tf_count=0,
            duration_minutes=60,
            status='published',
            visibility='members',
            scheduled_start_at=NOW - timedelta(minutes=5),
            published_at=NOW - timedelta(days=1),
            created_by_user_id=admin.id,
        )
        ended_quiz = Quiz(
            title='Ended warmup',
            description='Already finished',
            field_of_study='Computer Science',
            topic='Flask',
            total_questions=1,
            mcq_count=1,
            tf_count=0,
            duration_minutes=30,
            status='published',
            visibility='members',
            scheduled_start_at=NOW - timedelta(days=2),
            published_at=NOW - timedelta(days=3),
            created_by_user_id=admin.id,
        )
        own_quiz = Quiz(
            title='Admin owned quiz',
            description='Created by the instructor account',
            field_of_study='Computer Science',
            topic='Owner',
            total_questions=1,
            mcq_count=1,
            tf_count=0,
            duration_minutes=30,
            status='published',
            visibility='members',
            scheduled_start_at=NOW - timedelta(minutes=5),
            published_at=NOW - timedelta(days=1),
            created_by_user_id=admin.id,
        )
        db.session.add_all([live_quiz, ended_quiz, own_quiz])
        db.session.flush()

        q1 = QuizQuestion(
            quiz_id=live_quiz.id,
            order_index=1,
            question_type='mcq',
            scenario='A list.',
            question_text='What is [10, 20][1]?',
        )
        q2 = QuizQuestion(
            quiz_id=live_quiz.id,
            order_index=2,
            question_type='mcq',
            scenario='A dict.',
            question_text='Which type maps keys to values?',
        )
        db.session.add_all([q1, q2])
        db.session.flush()
        opt_1_wrong = QuizOption(question_id=q1.id, option_key='A', option_text='10', is_correct=False)
        opt_1_right = QuizOption(question_id=q1.id, option_key='B', option_text='20', is_correct=True)
        opt_2_right = QuizOption(question_id=q2.id, option_key='A', option_text='dict', is_correct=True)
        opt_2_wrong = QuizOption(question_id=q2.id, option_key='B', option_text='list', is_correct=False)
        db.session.add_all([opt_1_wrong, opt_1_right, opt_2_right, opt_2_wrong])
        db.session.flush()

        ended_q = QuizQuestion(
            quiz_id=ended_quiz.id,
            order_index=1,
            question_type='mcq',
            scenario='Routing.',
            question_text='Which decorator registers a route?',
        )
        db.session.add(ended_q)
        db.session.flush()
        ended_right = QuizOption(question_id=ended_q.id, option_key='A', option_text='@app.route', is_correct=True)
        db.session.add(ended_right)
        db.session.flush()
        # A finished attempt for B and C so the leaderboard can be released.
        for member in (member_b, member_c):
            attempt = QuizAttempt(
                quiz_id=ended_quiz.id,
                member_id=member.id,
                status='submitted',
                started_at=NOW - timedelta(days=2),
                submitted_at=NOW - timedelta(days=2) + timedelta(minutes=10),
                expires_at=NOW - timedelta(days=2) + timedelta(minutes=30),
                score=100,
                correct_count=1,
                total_count=1,
                confidence_adjusted_score=100,
            )
            db.session.add(attempt)
            db.session.flush()
            db.session.add(
                QuizAttemptAnswer(
                    attempt_id=attempt.id,
                    question_id=ended_q.id,
                    selected_option_id=ended_right.id,
                    is_correct=True,
                )
            )

        enroll_open = Competition(
            title='Open Challenge',
            description='Enrolment open',
            category='Programming',
            frequency='weekly',
            level=1,
            status='published',
            submission_type='github',
            starts_at=NOW - timedelta(hours=1),
            ends_at=NOW + timedelta(days=5),
            requires_paid_membership=False,
            eligibility_rule='custom',
            eligibility_years='Year 1,Year 2,Year 3,Year 4',
            created_by=admin.id,
        )
        team_open = Competition(
            title='Team Challenge',
            description='Team enrolment',
            category='Programming',
            frequency='monthly',
            level=2,
            status='published',
            submission_type='github',
            starts_at=NOW - timedelta(hours=1),
            ends_at=NOW + timedelta(days=5),
            requires_paid_membership=False,
            eligibility_rule='custom',
            eligibility_years='Year 1,Year 2,Year 3,Year 4',
            created_by=admin.id,
        )
        closed_competition = Competition(
            title='Closed Challenge',
            description='Window passed',
            category='Programming',
            frequency='weekly',
            level=1,
            status='published',
            submission_type='github',
            starts_at=NOW - timedelta(days=9),
            ends_at=NOW - timedelta(days=2),
            requires_paid_membership=False,
            eligibility_rule='custom',
            eligibility_years='Year 1,Year 2,Year 3,Year 4',
            created_by=admin.id,
        )
        submit_open = Competition(
            title='Submit Challenge',
            description='Enrolled member may submit once',
            category='Programming',
            frequency='weekly',
            level=1,
            status='published',
            submission_type='github',
            starts_at=NOW - timedelta(hours=1),
            ends_at=NOW + timedelta(days=5),
            requires_paid_membership=False,
            eligibility_rule='custom',
            eligibility_years='Year 1,Year 2,Year 3,Year 4',
            created_by=admin.id,
        )
        db.session.add_all([enroll_open, team_open, closed_competition, submit_open])
        db.session.flush()
        db.session.add(
            CompetitionEnrollment(
                competition_id=submit_open.id,
                member_id=member_a.id,
                status='enrolled',
                enrolled_at=NOW - timedelta(hours=2),
            )
        )

        apply_election = Election(
            title='Applications 2026',
            description='Nominations are open',
            term_label='2026/27',
            status='nominations',
            application_starts_at=NOW - timedelta(days=2),
            application_ends_at=NOW + timedelta(days=5),
            voting_starts_at=NOW + timedelta(days=6),
            voting_ends_at=NOW + timedelta(days=9),
            requires_paid_membership=False,
            created_by=admin.id,
        )
        vote_election = Election(
            title='Voting 2026',
            description='Voting is open',
            term_label='2026/27',
            status='voting',
            application_starts_at=NOW - timedelta(days=20),
            application_ends_at=NOW - timedelta(days=6),
            voting_starts_at=NOW - timedelta(days=1),
            voting_ends_at=NOW + timedelta(days=2),
            requires_paid_membership=False,
            created_by=admin.id,
        )
        db.session.add_all([apply_election, vote_election])
        db.session.flush()
        apply_position = ElectionPosition(
            election_id=apply_election.id,
            title='President',
            seats_available=1,
            display_order=1,
        )
        vote_position = ElectionPosition(
            election_id=vote_election.id,
            title='President',
            seats_available=1,
            display_order=1,
        )
        self_position = ElectionPosition(
            election_id=vote_election.id,
            title='Secretary',
            seats_available=1,
            display_order=2,
        )
        db.session.add_all([apply_position, vote_position, self_position])
        db.session.flush()
        db.session.add_all(
            [
                ElectionCandidate(
                    election_id=vote_election.id,
                    election_position_id=vote_position.id,
                    member_id=member_b.id,
                    status='approved',
                    manifesto=MANIFESTO,
                    submitted_at=NOW - timedelta(days=10),
                ),
                ElectionCandidate(
                    election_id=vote_election.id,
                    election_position_id=vote_position.id,
                    member_id=member_c.id,
                    status='approved',
                    manifesto=MANIFESTO,
                    submitted_at=NOW - timedelta(days=9),
                ),
                ElectionCandidate(
                    election_id=vote_election.id,
                    election_position_id=self_position.id,
                    member_id=member_a.id,
                    status='approved',
                    manifesto=MANIFESTO,
                    submitted_at=NOW - timedelta(days=8),
                ),
            ]
        )

        leaders_team = Team(
            name='Lead Team', description='A leads', created_by_member_id=member_a.id
        )
        open_team = Team(
            name='Open Team', description='C leads', created_by_member_id=member_c.id
        )
        db.session.add_all([leaders_team, open_team])
        db.session.flush()
        db.session.add_all(
            [
                TeamMember(
                    team_id=leaders_team.id,
                    member_id=member_a.id,
                    is_leader=True,
                    status='approved',
                ),
                TeamMember(
                    team_id=open_team.id,
                    member_id=member_c.id,
                    is_leader=True,
                    status='approved',
                ),
            ]
        )

        db.session.commit()
        return {
            'session': session.id,
            'live_quiz': live_quiz.id,
            'ended_quiz': ended_quiz.id,
            'own_quiz': own_quiz.id,
            'q1': q1.id,
            'q2': q2.id,
            'opt_1_right': opt_1_right.id,
            'opt_1_wrong': opt_1_wrong.id,
            'opt_2_right': opt_2_right.id,
            'opt_2_wrong': opt_2_wrong.id,
            'enroll_open': enroll_open.id,
            'team_open': team_open.id,
            'closed_competition': closed_competition.id,
            'submit_open': submit_open.id,
            'apply_election': apply_election.id,
            'apply_position': apply_position.id,
            'vote_election': vote_election.id,
            'vote_position': vote_position.id,
            'self_position': self_position.id,
            'candidate_b': ElectionCandidate.query.filter_by(
                election_id=vote_election.id, member_id=member_b.id
            ).first().id,
            'candidate_a': ElectionCandidate.query.filter_by(
                election_id=vote_election.id, member_id=member_a.id
            ).first().id,
            'leaders_team': leaders_team.id,
            'open_team': open_team.id,
            'member_a': member_a.id,
            'member_b': member_b.id,
            'member_c': member_c.id,
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

    def login(self, email=EMAIL_A):
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
        return response

    def data(self, path, status=200):
        response = self.client.get(path)
        self.assertEqual(response.status_code, status, response.get_data(as_text=True))
        return response.get_json()['data']

    def post(self, path, payload=None):
        return self.client.post(
            path, json=payload or {}, headers={'X-CSRF-Token': self.csrf()}
        )

    def patch_json(self, path, payload):
        return self.client.patch(
            path, json=payload, headers={'X-CSRF-Token': self.csrf()}
        )

    def delete(self, path):
        return self.client.delete(path, headers={'X-CSRF-Token': self.csrf()})

    def post_form(self, path, data=None, files=None):
        payload = dict(data or {})
        if files:
            payload.update(files)
        return self.client.post(
            path,
            data=payload,
            headers={'X-CSRF-Token': self.csrf()},
            content_type='multipart/form-data',
        )

    def code(self, response):
        return response.get_json()['error']['code']


class AccessControl(Base):
    def test_anonymous_write_is_401(self):
        token = self.csrf()
        for path in (
            '/api/v1/member/projects',
            f"/api/v1/member/quizzes/{IDS['live_quiz']}/attempts",
            f"/api/v1/member/competitions/{IDS['enroll_open']}/enroll",
            f"/api/v1/member/teams/{IDS['open_team']}/requests",
        ):
            response = self.client.post(
                path, json={}, headers={'X-CSRF-Token': token}
            )
            self.assertEqual(response.status_code, 401, path)
            self.assertEqual(self.code(response), 'AUTH_REQUIRED')

    def test_write_without_csrf_is_rejected(self):
        self.login()
        response = self.client.post('/api/v1/member/projects', json={'title': 'No token'})
        self.assertEqual(response.status_code, 403)


class AvatarTests(Base):
    def test_upload_replaces_the_avatar(self):
        self.login()
        with patch('app.api.member.generate_digital_id') as generator:
            response = self.post_form(
                '/api/v1/member/profile/avatar',
                files={'avatar': (io.BytesIO(b'\x89PNG\r\n\x1a\nDATA'), 'me.png')},
            )
        self.assertEqual(response.status_code, 201, response.get_data(as_text=True))
        url = response.get_json()['data']['avatar_url']
        self.assertTrue(url.startswith('/static/uploads/'))
        self.assertTrue(generator.called)
        with app.app_context():
            member = db.session.get(Member, IDS['member_a'])
            stored = member.profile_image
        self.assertTrue((UPLOADS / 'profiles' / stored).exists())

    def test_invalid_type_is_422(self):
        self.login()
        response = self.post_form(
            '/api/v1/member/profile/avatar',
            files={'avatar': (io.BytesIO(b'#!/bin/sh'), 'script.sh')},
        )
        self.assertEqual(response.status_code, 422)
        self.assertIn('avatar', response.get_json()['error']['details'])

    def test_missing_file_is_422(self):
        self.login()
        response = self.post_form('/api/v1/member/profile/avatar')
        self.assertEqual(response.status_code, 422)


class ProjectWriteTests(Base):
    def test_create_read_update_delete(self):
        self.login()
        created = self.post(
            '/api/v1/member/projects',
            {
                'title': 'Timetable bot',
                'description': 'Posts the week to WhatsApp',
                'technologies': ['Flask', 'Twilio'],
                'is_public': False,
            },
        )
        self.assertEqual(created.status_code, 201, created.get_data(as_text=True))
        project = created.get_json()['data']
        self.assertEqual(project['technologies'], ['Flask', 'Twilio'])
        self.assertFalse(project['is_public'])

        detail = self.data(f"/api/v1/member/projects/{project['id']}")
        self.assertEqual(detail['title'], 'Timetable bot')

        updated = self.patch_json(
            f"/api/v1/member/projects/{project['id']}",
            {'title': 'Timetable bot v2', 'is_public': True},
        )
        self.assertEqual(updated.status_code, 200)
        self.assertTrue(updated.get_json()['data']['is_public'])

        published = self.post(f"/api/v1/member/projects/{project['id']}/submit")
        self.assertEqual(published.status_code, 202, published.get_data(as_text=True))
        self.assertEqual(published.get_json()['data']['status'], 'published')

        removed = self.delete(f"/api/v1/member/projects/{project['id']}")
        self.assertEqual(removed.status_code, 204)
        self.assertEqual(
            self.client.get(f"/api/v1/member/projects/{project['id']}").status_code, 404
        )

    def test_missing_title_is_422(self):
        self.login()
        response = self.post('/api/v1/member/projects', {'description': 'No title'})
        self.assertEqual(response.status_code, 422)
        self.assertIn('title', response.get_json()['error']['details'])

    def test_another_members_project_is_404(self):
        self.login(EMAIL_B)
        self.assertEqual(
            self.client.get("/api/v1/member/projects/1").status_code, 404
        )
        self.assertEqual(
            self.patch_json("/api/v1/member/projects/1", {'title': 'Hijack'}).status_code,
            404,
        )
        self.assertEqual(self.delete("/api/v1/member/projects/1").status_code, 404)


class SessionReportTests(Base):
    def test_only_the_assigned_instructor_can_report(self):
        self.login()
        response = self.post(
            f"/api/v1/member/sessions/{IDS['session']}/report",
            {'winner_username': 'amina', 'participant_count': 12},
        )
        self.assertEqual(response.status_code, 403)
        self.assertEqual(self.code(response), 'NOT_INSTRUCTOR')

    def test_instructor_files_a_report(self):
        self.login(EMAIL_ADMIN)
        response = self.post(
            f"/api/v1/member/sessions/{IDS['session']}/report",
            {
                'winner_username': 'amina',
                'participant_count': 18,
                'notes': 'Good turnout',
            },
        )
        # 201 on first write, 200 when updating a still-pending report.
        self.assertIn(response.status_code, (200, 201), response.get_data(as_text=True))
        self.assertEqual(response.get_json()['data']['status'], 'pending')

    def test_approved_report_is_locked(self):
        self.login(EMAIL_ADMIN)
        with app.app_context():
            if SessionReport.query.filter_by(session_id=IDS['session']).first() is None:
                db.session.add(
                    SessionReport(
                        session_id=IDS['session'],
                        instructor_user_id=User.query.filter_by(email=EMAIL_ADMIN).first().id,
                        winner_username='amina',
                        participant_count=10,
                        status='pending',
                    )
                )
                db.session.commit()
            report = SessionReport.query.filter_by(session_id=IDS['session']).first()
            report.status = 'approved'
            db.session.commit()
        response = self.post(
            f"/api/v1/member/sessions/{IDS['session']}/report",
            {'winner_username': 'amina'},
        )
        self.assertEqual(response.status_code, 409)
        self.assertEqual(self.code(response), 'REPORT_APPROVED')
        with app.app_context():
            report = SessionReport.query.filter_by(session_id=IDS['session']).first()
            report.status = 'pending'
            db.session.commit()


class QuizAttemptTests(Base):
    def setUp(self):
        super().setUp()
        # Tests share one database; each quiz test starts from no attempt.
        with app.app_context():
            QuizAttempt.query.filter(
                QuizAttempt.quiz_id == IDS['live_quiz'],
                QuizAttempt.member_id.in_([IDS['member_a'], IDS['member_c']]),
            ).delete(synchronize_session=False)
            db.session.commit()

    def _start(self, email=EMAIL_A):
        self.login(email)
        response = self.post(f"/api/v1/member/quizzes/{IDS['live_quiz']}/attempts")
        self.assertEqual(response.status_code, 201, response.get_data(as_text=True))
        return response.get_json()['data']['attempt_id']

    def test_start_creates_one_attempt(self):
        self.login()
        started = self.post(f"/api/v1/member/quizzes/{IDS['live_quiz']}/attempts")
        self.assertEqual(started.status_code, 201, started.get_data(as_text=True))
        data = started.get_json()['data']
        self.assertEqual(data['status'], 'in_progress')
        self.assertIsNotNone(data['expires_at'])

        duplicate = self.post(f"/api/v1/member/quizzes/{IDS['live_quiz']}/attempts")
        self.assertEqual(duplicate.status_code, 409)
        self.assertEqual(self.code(duplicate), 'ALREADY_ATTEMPTED')

    def test_listing_reports_an_ended_quiz_as_not_live(self):
        self.login()
        rows = {row['id']: row for row in self.data('/api/v1/member/quizzes')}
        self.assertTrue(rows[IDS['live_quiz']]['is_live'])
        self.assertTrue(rows[IDS['live_quiz']]['can_start'])
        self.assertFalse(rows[IDS['ended_quiz']]['is_live'])
        self.assertFalse(rows[IDS['ended_quiz']]['can_start'])
        detail = self.data(f"/api/v1/member/quizzes/{IDS['ended_quiz']}")
        self.assertFalse(detail['is_live'])
        self.assertFalse(detail['can_start'])

    def test_closed_quiz_is_409(self):
        self.login(EMAIL_B)
        response = self.post(f"/api/v1/member/quizzes/{IDS['ended_quiz']}/attempts")
        self.assertEqual(response.status_code, 409)
        self.assertEqual(self.code(response), 'QUIZ_CLOSED')

    def test_owner_cannot_attempt(self):
        self.login(EMAIL_ADMIN)
        response = self.post(f"/api/v1/member/quizzes/{IDS['own_quiz']}/attempts")
        self.assertEqual(response.status_code, 403)
        self.assertEqual(self.code(response), 'QUIZ_OWNER')

    def test_answers_score_on_the_server_and_survive_submit(self):
        attempt_id = self._start()

        # A forged is_correct must be ignored; only the stored option counts.
        saved = self.patch_json(
            f'/api/v1/member/attempts/{attempt_id}/answers',
            {
                'answers': [
                    {
                        'question_id': IDS['q1'],
                        'choice_id': IDS['opt_1_right'],
                        'is_correct': False,
                    },
                    {'question_id': IDS['q2'], 'choice_id': IDS['opt_2_wrong']},
                ]
            },
        )
        self.assertEqual(saved.status_code, 200, saved.get_data(as_text=True))
        self.assertEqual(saved.get_json()['data']['saved'], 2)

        submitted = self.post(f'/api/v1/member/attempts/{attempt_id}/submit')
        self.assertEqual(submitted.status_code, 201, submitted.get_data(as_text=True))
        result = submitted.get_json()['data']
        self.assertEqual(result['status'], 'submitted')
        self.assertEqual(result['correct_count'], 1)
        self.assertEqual(result['total_count'], 2)
        self.assertEqual(result['score'], 50.0)

        with app.app_context():
            answers = QuizAttemptAnswer.query.filter_by(attempt_id=attempt_id).all()
            self.assertEqual(
                {row.question_id: row.is_correct for row in answers},
                {IDS['q1']: True, IDS['q2']: False},
            )

    def test_answer_after_submit_is_409(self):
        attempt_id = self._start()
        self.assertEqual(
            self.post(f'/api/v1/member/attempts/{attempt_id}/submit').status_code, 201
        )
        response = self.patch_json(
            f'/api/v1/member/attempts/{attempt_id}/answers',
            {'answers': [{'question_id': IDS['q1'], 'choice_id': IDS['opt_1_wrong']}]},
        )
        self.assertEqual(response.status_code, 409)
        self.assertEqual(self.code(response), 'ATTEMPT_SUBMITTED')

    def test_unknown_option_is_422(self):
        attempt_id = self._start()
        response = self.patch_json(
            f'/api/v1/member/attempts/{attempt_id}/answers',
            {'answers': [{'question_id': IDS['q1'], 'choice_id': 99999}]},
        )
        self.assertEqual(response.status_code, 422)
        self.assertIn('answers.0.choice_id', response.get_json()['error']['details'])

    def test_violations_reduce_remaining_and_auto_submit(self):
        attempt_id = self._start(EMAIL_C)
        for expected_remaining in (2, 1):
            response = self.post(
                f'/api/v1/member/attempts/{attempt_id}/violation',
                {'kind': 'tab_switch'},
            )
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.get_json()['data']['remaining'], expected_remaining)
            self.assertFalse(response.get_json()['data']['auto_submitted'])

        final = self.post(
            f'/api/v1/member/attempts/{attempt_id}/violation', {'kind': 'paste'}
        )
        self.assertEqual(final.status_code, 200)
        self.assertTrue(final.get_json()['data']['auto_submitted'])
        self.assertEqual(final.get_json()['data']['status'], 'auto_submitted')

        after = self.post(
            f'/api/v1/member/attempts/{attempt_id}/violation', {'kind': 'blur'}
        )
        self.assertEqual(after.status_code, 409)
        self.assertEqual(self.code(after), 'ATTEMPT_SUBMITTED')

        invalid = self.post(
            f'/api/v1/member/attempts/{attempt_id}/violation', {'kind': 'existential'}
        )
        self.assertEqual(invalid.status_code, 422)

    def test_result_withholds_review_until_release(self):
        attempt_id = self._start()
        self.post(f'/api/v1/member/attempts/{attempt_id}/submit')
        data = self.data(f'/api/v1/member/attempts/{attempt_id}')
        self.assertFalse(data['results_released'])
        self.assertIsNone(data['review'])

    def test_another_members_attempt_is_404(self):
        attempt_id = self._start()
        self.login(EMAIL_B)
        self.assertEqual(
            self.client.get(f'/api/v1/member/attempts/{attempt_id}').status_code, 404
        )

    def test_leaderboard_is_released_for_a_finished_quiz(self):
        self.login()
        data = self.data(f"/api/v1/member/quizzes/{IDS['ended_quiz']}/leaderboard")
        self.assertEqual(data['participant_count'], 2)
        self.assertEqual(data['rows'][0]['rank'], 1)
        self.assertEqual(len(data['rows']), 2)
        self.assertNotIn('@test.local', str(data))
        with app.app_context():
            self.assertEqual(
                QuizLeaderboard.query.filter_by(quiz_id=IDS['ended_quiz']).count(), 2
            )

    def test_live_quiz_leaderboard_is_closed(self):
        self.login()
        response = self.client.get(
            f"/api/v1/member/quizzes/{IDS['live_quiz']}/leaderboard"
        )
        self.assertEqual(response.status_code, 409)
        self.assertEqual(self.code(response), 'LEADERBOARD_CLOSED')


class CompetitionWriteTests(Base):
    def test_enrol_requires_terms(self):
        self.login(EMAIL_B)
        response = self.post(f"/api/v1/member/competitions/{IDS['enroll_open']}/enroll", {})
        self.assertEqual(response.status_code, 422)
        self.assertIn('agree_terms', response.get_json()['error']['details'])

    def test_enrol_then_duplicate(self):
        self.login(EMAIL_B)
        response = self.post(
            f"/api/v1/member/competitions/{IDS['enroll_open']}/enroll",
            {'agree_terms': True},
        )
        self.assertEqual(response.status_code, 201, response.get_data(as_text=True))
        self.assertEqual(response.get_json()['data']['mode'], 'individual')

        duplicate = self.post(
            f"/api/v1/member/competitions/{IDS['enroll_open']}/enroll",
            {'agree_terms': True},
        )
        self.assertEqual(duplicate.status_code, 409)
        self.assertEqual(self.code(duplicate), 'ALREADY_ENROLLED')

    def test_closed_competition_is_409(self):
        self.login(EMAIL_C)
        response = self.post(
            f"/api/v1/member/competitions/{IDS['closed_competition']}/enroll",
            {'agree_terms': True},
        )
        self.assertEqual(response.status_code, 409)
        self.assertEqual(self.code(response), 'ENROLLMENT_CLOSED')

    def test_team_enrol_by_leader(self):
        self.login(EMAIL_C)
        response = self.post(
            f"/api/v1/member/competitions/{IDS['team_open']}/enroll",
            {'agree_terms': True, 'mode': 'team'},
        )
        self.assertEqual(response.status_code, 201, response.get_data(as_text=True))
        data = response.get_json()['data']
        self.assertEqual(data['mode'], 'team')
        self.assertEqual(data['team']['name'], 'Open Team')

    def test_submission_then_duplicate(self):
        self.login()
        response = self.post(
            f"/api/v1/member/competitions/{IDS['submit_open']}/submissions",
            {'submission_url': 'https://github.com/amina/challenge'},
        )
        self.assertEqual(response.status_code, 201, response.get_data(as_text=True))
        self.assertEqual(
            response.get_json()['data']['value'],
            'https://github.com/amina/challenge',
        )

        duplicate = self.post(
            f"/api/v1/member/competitions/{IDS['submit_open']}/submissions",
            {'submission_url': 'https://github.com/amina/second'},
        )
        self.assertEqual(duplicate.status_code, 409)
        self.assertEqual(self.code(duplicate), 'ALREADY_SUBMITTED')

    def test_submission_without_enrolment_is_409(self):
        self.login(EMAIL_B)
        response = self.post(
            f"/api/v1/member/competitions/{IDS['submit_open']}/submissions",
            {'submission_url': 'https://github.com/baraka/challenge'},
        )
        self.assertEqual(response.status_code, 409)
        self.assertEqual(self.code(response), 'NOT_ENROLLED')

    def test_missing_submission_url_is_422(self):
        # Enrol member C, then submit an empty JSON body.
        self.login(EMAIL_C)
        enrolled = self.post(
            f"/api/v1/member/competitions/{IDS['enroll_open']}/enroll",
            {'agree_terms': True},
        )
        self.assertIn(enrolled.status_code, (201, 409))
        response = self.post(
            f"/api/v1/member/competitions/{IDS['enroll_open']}/submissions", {}
        )
        self.assertEqual(response.status_code, 422)
        self.assertIn('submission_url', response.get_json()['error']['details'])


class ElectionWriteTests(Base):
    def test_apply_requires_a_manifesto_and_passport(self):
        self.login()
        short = self.post_form(
            f"/api/v1/member/elections/{IDS['apply_election']}/apply/{IDS['apply_position']}",
            data={'manifesto': 'Too short'},
        )
        self.assertEqual(short.status_code, 422)
        self.assertIn('manifesto', short.get_json()['error']['details'])

        no_passport = self.post_form(
            f"/api/v1/member/elections/{IDS['apply_election']}/apply/{IDS['apply_position']}",
            data={'manifesto': MANIFESTO},
        )
        self.assertEqual(no_passport.status_code, 422)
        self.assertIn('passport_image', no_passport.get_json()['error']['details'])

    def test_apply_then_withdraw(self):
        self.login()
        with patch(
            'app.api.member.save_election_passport', return_value=('passport-a.png', '')
        ):
            created = self.post_form(
                f"/api/v1/member/elections/{IDS['apply_election']}/apply/{IDS['apply_position']}",
                data={'manifesto': MANIFESTO},
                files={'passport_image': (io.BytesIO(b'\x89PNG\r\n\x1a\n'), 'pass.png')},
            )
        self.assertEqual(created.status_code, 201, created.get_data(as_text=True))
        candidate = created.get_json()['data']
        self.assertEqual(candidate['status'], 'submitted')

        with patch(
            'app.api.member.save_election_passport', return_value=('passport-b.png', '')
        ):
            duplicate = self.post_form(
                f"/api/v1/member/elections/{IDS['apply_election']}/apply/{IDS['apply_position']}",
                data={'manifesto': MANIFESTO},
                files={'passport_image': (io.BytesIO(b'\x89PNG\r\n\x1a\n'), 'pass.png')},
            )
        self.assertEqual(duplicate.status_code, 200, duplicate.get_data(as_text=True))

        withdrawn = self.post(
            f"/api/v1/member/elections/{IDS['apply_election']}/withdraw/{candidate['id']}"
        )
        self.assertEqual(withdrawn.status_code, 204)
        self.assertEqual(
            self.post(
                f"/api/v1/member/elections/{IDS['apply_election']}/withdraw/{candidate['id']}"
            ).status_code,
            204,
        )

    def test_apply_when_window_closed_is_409(self):
        self.login()
        response = self.post_form(
            f"/api/v1/member/elections/{IDS['vote_election']}/apply/{IDS['vote_position']}",
            data={'manifesto': MANIFESTO},
        )
        self.assertEqual(response.status_code, 409)
        self.assertEqual(self.code(response), 'APPLICATION_CLOSED')

    def test_cannot_vote_for_yourself(self):
        self.login()
        response = self.post(
            f"/api/v1/member/elections/{IDS['vote_election']}/vote",
            {
                'votes': [
                    {
                        'position_id': IDS['self_position'],
                        'candidate_id': IDS['candidate_a'],
                    }
                ]
            },
        )
        self.assertEqual(response.status_code, 409)
        self.assertEqual(self.code(response), 'SELF_VOTE')
        with app.app_context():
            self.assertEqual(
                ElectionVote.query.filter_by(
                    election_id=IDS['vote_election'], voter_member_id=IDS['member_a']
                ).count(),
                0,
            )

    def test_vote_then_duplicate(self):
        self.login()
        response = self.post(
            f"/api/v1/member/elections/{IDS['vote_election']}/vote",
            {
                'votes': [
                    {
                        'position_id': IDS['vote_position'],
                        'candidate_id': IDS['candidate_b'],
                    }
                ]
            },
        )
        self.assertEqual(response.status_code, 201, response.get_data(as_text=True))
        self.assertEqual(
            response.get_json()['data']['voted_positions'], [IDS['vote_position']]
        )

        duplicate = self.post(
            f"/api/v1/member/elections/{IDS['vote_election']}/vote",
            {
                'votes': [
                    {
                        'position_id': IDS['vote_position'],
                        'candidate_id': IDS['candidate_b'],
                    }
                ]
            },
        )
        self.assertEqual(duplicate.status_code, 409)
        self.assertEqual(self.code(duplicate), 'ALREADY_VOTED')
        with app.app_context():
            self.assertEqual(
                ElectionVote.query.filter_by(
                    election_id=IDS['vote_election'], voter_member_id=IDS['member_a']
                ).count(),
                1,
            )

    def test_rejects_a_candidate_from_another_position(self):
        self.login(EMAIL_B)
        response = self.post(
            f"/api/v1/member/elections/{IDS['vote_election']}/vote",
            {
                'votes': [
                    {
                        'position_id': IDS['vote_position'],
                        'candidate_id': IDS['candidate_a'],
                    }
                ]
            },
        )
        self.assertEqual(response.status_code, 422)
        self.assertIn('votes.0.candidate_id', response.get_json()['error']['details'])


class TeamWriteTests(Base):
    def test_member_already_in_a_team_cannot_request(self):
        self.login()
        response = self.post(f"/api/v1/member/teams/{IDS['open_team']}/requests")
        self.assertEqual(response.status_code, 409)
        self.assertEqual(self.code(response), 'ALREADY_IN_TEAM')

    def test_request_decision_and_removal(self):
        self.login(EMAIL_B)
        requested = self.post(f"/api/v1/member/teams/{IDS['open_team']}/requests")
        self.assertEqual(requested.status_code, 201, requested.get_data(as_text=True))
        request_id = requested.get_json()['data']['id']
        self.assertEqual(requested.get_json()['data']['status'], 'pending')

        duplicate = self.post(f"/api/v1/member/teams/{IDS['open_team']}/requests")
        self.assertEqual(duplicate.status_code, 409)
        self.assertEqual(self.code(duplicate), 'ALREADY_REQUESTED')

        self.assertEqual(self.post('/api/v1/auth/logout').status_code, 204)
        self.login(EMAIL_C)
        decided = self.post(
            f"/api/v1/member/teams/{IDS['open_team']}/requests/{request_id}/decision",
            {'decision': 'approve'},
        )
        self.assertEqual(decided.status_code, 200, decided.get_data(as_text=True))
        self.assertEqual(decided.get_json()['data']['status'], 'approved')

        again = self.post(
            f"/api/v1/member/teams/{IDS['open_team']}/requests/{request_id}/decision",
            {'decision': 'approve'},
        )
        self.assertEqual(again.status_code, 409)
        self.assertEqual(self.code(again), 'REQUEST_DECIDED')

        removed = self.delete(
            f"/api/v1/member/teams/{IDS['open_team']}/members/{IDS['member_b']}"
        )
        self.assertEqual(removed.status_code, 204)
        with app.app_context():
            self.assertIsNone(
                TeamMember.query.filter_by(
                    team_id=IDS['open_team'], member_id=IDS['member_b']
                ).first()
            )

    def test_non_leader_cannot_decide_or_remove(self):
        self.login(EMAIL_B)
        response = self.post(
            f"/api/v1/member/teams/{IDS['open_team']}/requests/1/decision",
            {'decision': 'approve'},
        )
        self.assertEqual(response.status_code, 403)
        self.assertEqual(self.code(response), 'NOT_TEAM_LEADER')
        self.assertEqual(
            self.delete(
                f"/api/v1/member/teams/{IDS['open_team']}/members/{IDS['member_c']}"
            ).status_code,
            403,
        )

    def test_leader_cannot_be_removed(self):
        self.login(EMAIL_C)
        response = self.delete(
            f"/api/v1/member/teams/{IDS['open_team']}/members/{IDS['member_c']}"
        )
        self.assertEqual(response.status_code, 409)
        self.assertEqual(self.code(response), 'LEADER_CANNOT_BE_REMOVED')

    def test_invalid_decision_is_422(self):
        self.login(EMAIL_C)
        response = self.post(
            f"/api/v1/member/teams/{IDS['open_team']}/requests/9999/decision",
            {'decision': 'maybe'},
        )
        self.assertEqual(response.status_code, 422)


class CapabilityTests(Base):
    def test_new_capabilities_are_advertised(self):
        self.login()
        capabilities = set(self.data('/api/v1/me')['capabilities'])
        for name in (
            'member.projects.write',
            'member.sessions.report',
            'member.quizzes.attempt',
            'member.competitions.write',
            'member.elections.write',
            'member.teams.write',
        ):
            self.assertIn(name, capabilities)


class ProfilePrivacyTests(Base):
    def put_json(self, path, payload):
        return self.client.put(path, json=payload, headers={'X-CSRF-Token': self.csrf()})

    def test_new_profile_defaults_to_private(self):
        self.login(EMAIL_A)
        privacy = self.data('/api/v1/member/profile')['privacy']
        self.assertEqual(privacy['profile_visibility'], 'private')
        self.assertFalse(privacy['discoverable'])
        self.assertTrue(all(privacy['sections'].values()))

    def test_put_privacy_persists_and_is_returned(self):
        self.login(EMAIL_C)
        response = self.put_json(
            '/api/v1/member/profile/privacy',
            {
                'profile_visibility': 'public',
                'discoverable': True,
                'sections': {'bio': False, 'links': False},
            },
        )
        self.assertEqual(response.status_code, 200, response.get_data(as_text=True))
        body = response.get_json()['data']
        self.assertEqual(body['profile_visibility'], 'public')
        self.assertTrue(body['discoverable'])
        self.assertFalse(body['sections']['bio'])
        self.assertTrue(body['sections']['projects'])

        with app.app_context():
            row = db.session.get(Member, IDS['member_c'])
            stored = row.get_privacy()
        self.assertEqual(stored['profile_visibility'], 'public')
        self.assertFalse(stored['sections']['links'])
        self.assertFalse(self.data('/api/v1/member/profile')['privacy']['sections']['bio'])

    def test_invalid_privacy_values_are_422(self):
        self.login(EMAIL_C)
        bad_visibility = self.put_json(
            '/api/v1/member/profile/privacy', {'profile_visibility': 'friends'}
        )
        self.assertEqual(bad_visibility.status_code, 422)
        self.assertEqual(
            bad_visibility.get_json()['error']['details']['profile_visibility'],
            "Expected 'public' or 'private'.",
        )
        unknown_section = self.put_json(
            '/api/v1/member/profile/privacy', {'sections': {'passport': True}}
        )
        self.assertEqual(unknown_section.status_code, 422)

    def test_md50_lists_only_discoverable_members(self):
        # Everyone starts private, so a name search finds nobody.
        self.login(EMAIL_A)
        self.assertEqual(self.data('/api/v1/member/search?q=Amina'), [])

        self.login(EMAIL_B)
        opted_in = self.put_json(
            '/api/v1/member/profile/privacy',
            {'profile_visibility': 'public', 'discoverable': True},
        )
        self.assertEqual(opted_in.status_code, 200, opted_in.get_data(as_text=True))

        self.login(EMAIL_A)
        rows = self.data('/api/v1/member/search?q=Baraka')
        self.assertEqual([row['display_name'] for row in rows], ['Baraka Mwita'])


if __name__ == '__main__':
    unittest.main(verbosity=2)
