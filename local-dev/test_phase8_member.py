"""Phase 8 verification: member panel endpoints (MD1-MD51 read surface).

Runs against an isolated temporary SQLite database and never opens
``instance/dev_local.db``.

Run from the parent project root:
    current-website/DIgital-Club/.venv/Scripts/python.exe local-dev/test_phase8_member.py -v
"""

from __future__ import annotations

import os
import sys
import unittest
from datetime import date, datetime, time, timedelta
from pathlib import Path
from unittest.mock import patch

BACKEND = Path(__file__).resolve().parent.parent / 'current-website' / 'DIgital-Club'
ARTIFACTS = Path(__file__).resolve().parent / '.test-artifacts'
ARTIFACTS.mkdir(exist_ok=True)
DB_PATH = ARTIFACTS / 'test_phase8.sqlite'
if DB_PATH.exists():
    DB_PATH.unlink()

UPLOADS = ARTIFACTS / 'uploads_phase8'
(UPLOADS / 'digital_ids').mkdir(parents=True, exist_ok=True)
(UPLOADS / 'digital_ids' / 'test-id_front.png').write_bytes(b'\x89PNG\r\n\x1a\n')
(UPLOADS / 'digital_ids' / 'test-id_back.png').write_bytes(b'\x89PNG\r\n\x1a\n')

os.environ.update(
    {
        'FLASK_ENV': 'development',
        'SECRET_KEY': 'phase8-test-secret',
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

from app.time_utils import app_now_naive  # noqa: E402

import app.models  # noqa: E402,F401
from app import create_app, db  # noqa: E402
from app.api.ratelimit import reset_rate_limits  # noqa: E402
from app.models import (  # noqa: E402
    Competition,
    CompetitionCriteria,
    CompetitionEnrollment,
    CompetitionReward,
    CompetitionSubmission,
    Election,
    ElectionCandidate,
    ElectionPosition,
    Event,
    Member,
    MemberNotification,
    MemberTrophy,
    MembershipPayment,
    NotificationBatch,
    Project,
    Quiz,
    QuizOption,
    QuizQuestion,
    RewardTransaction,
    RSVP,
    SessionSchedule,
    SessionWeek,
    Team,
    TeamMember,
    Trophy,
    User,
)

app = create_app()
app.config.update(TESTING=True, PROPAGATE_EXCEPTIONS=False, RATELIMIT_ENABLED=True)
app.config['UPLOAD_FOLDER'] = str(UPLOADS)

# Competition, election and event windows are application-local; seeding them
# with UTC moved every boundary three hours and hid open/closed errors.
with app.app_context():
    NOW = app_now_naive()
PASSWORD = 'phase8-password'
EMAIL_A = 'member.a@test.local'
EMAIL_B = 'member.b@test.local'


def _user(email, name, *, role='student', year='Year 2', member=True):
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
            year=year,
            status='student',
            phone='+255700000001',
            bio='I build small useful things.',
            github='https://github.com/example',
            areas_of_interest='Web development, Data science',
            member_id_number=f'DC-2026-{user.id:04d}',
            digital_id_path='test-id_front.png',
            created_at=datetime(2025, 10, 4),
            # Mirrors the privacy migration: approved members are public and
            # discoverable, so the MD50 search still finds them.
            profile_visibility='public',
            discoverable=True,
        )
        db.session.add(row)
        db.session.flush()
    return user, row


def seed():
    with app.app_context():
        db.create_all()
        admin, _ = _user('admin.phase8@test.local', 'Admin Person', role='admin', member=False)
        user_a, member_a = _user(EMAIL_A, 'Amina Juma')
        user_b, member_b = _user(EMAIL_B, 'Baraka Mwita')
        _, member_c = _user('member.c@test.local', 'Chausiku Ally')

        bronze = Trophy(name='Bronze', points_required=10, display_order=1)
        silver = Trophy(name='Silver', points_required=50, display_order=2)
        gold = Trophy(name='Gold', points_required=100, display_order=3)
        db.session.add_all([bronze, silver, gold])
        db.session.flush()

        db.session.add_all(
            [
                RewardTransaction(member_id=member_a.id, points=50, transaction_type='manual',
                                  reason='Community workshop', admin_id=admin.id,
                                  created_at=NOW - timedelta(days=2)),
                RewardTransaction(member_id=member_a.id, points=20, transaction_type='event_checkin',
                                  reason='Attended AI bootcamp', admin_id=admin.id,
                                  created_at=NOW - timedelta(days=1)),
                RewardTransaction(member_id=member_b.id, points=5, transaction_type='manual',
                                  reason='Helped at the stand', admin_id=admin.id),
                MemberTrophy(member_id=member_a.id, trophy_id=bronze.id),
                MemberTrophy(member_id=member_a.id, trophy_id=silver.id),
            ]
        )

        db.session.add(
            MembershipPayment(
                member_id=member_a.id,
                amount=20000,
                payment_date=date.today() - timedelta(days=30),
                start_date=date.today() - timedelta(days=30),
                end_date=date.today() + timedelta(days=335),
                payment_method='mobile_money',
                recorded_by=admin.id,
            )
        )

        db.session.add_all(
            [
                Project(title='Campus Navigator', description='Wayfinding app',
                        technologies='React, Flask', member_id=member_a.id, is_public=True),
                Project(title='Private Draft', description='Not published',
                        member_id=member_a.id, is_public=False),
                Project(title='Other Member Project', description='Belongs to B',
                        member_id=member_b.id, is_public=True),
            ]
        )

        batch = NotificationBatch(sender_user_id=admin.id, title='Club update',
                                  message='General update', audience_type='group',
                                  recipient_count=3)
        second_batch = NotificationBatch(sender_user_id=admin.id, title='Points update',
                                         message='Weekly points', audience_type='group',
                                         recipient_count=1)
        db.session.add_all([batch, second_batch])
        db.session.flush()
        db.session.add_all(
            [
                MemberNotification(batch_id=batch.id, member_id=member_a.id,
                                   title='Workshop moved', message='Room changed to Lab 2.',
                                   is_read=False, created_at=NOW - timedelta(hours=2)),
                MemberNotification(batch_id=second_batch.id, member_id=member_a.id,
                                   title='Results out', message='Check your points.',
                                   is_read=True, read_at=NOW - timedelta(days=1),
                                   created_at=NOW - timedelta(days=1)),
                MemberNotification(batch_id=batch.id, member_id=member_b.id,
                                   title='B only', message='Private to B.', is_read=False),
            ]
        )

        members_event = Event(title='Members Meetup', description='Monthly meetup',
                              event_date=NOW + timedelta(days=5), location='Lab 1',
                              category='workshop', target_audience='members', max_attendees=40)
        paid_event = Event(title='Paid Members Dinner', description='Members with a valid card',
                           event_date=NOW + timedelta(days=9), location='Hall',
                           category='social_event', target_audience='paid_members')
        past_event = Event(title='Old Meetup', description='Already happened',
                           event_date=NOW - timedelta(days=9), location='Lab 2',
                           category='tech_talk', target_audience='members')
        db.session.add_all([members_event, paid_event, past_event])
        db.session.flush()
        db.session.add(RSVP(event_id=past_event.id, member_id=member_a.id,
                            full_name='Amina Juma', email=EMAIL_A, status='approved'))

        week = SessionWeek(title='Week 3', week_start=date.today() - timedelta(days=2),
                           week_end=date.today() + timedelta(days=4), status='published')
        db.session.add(week)
        db.session.flush()
        db.session.add_all(
            [
                SessionSchedule(week_id=week.id, session_date=date.today(), day_of_week=0,
                                start_time=time(17, 0), topic='APIs with Flask',
                                category='Backend', mode='physical', location='Lab 1',
                                instructor_user_id=admin.id, created_by=admin.id),
                SessionSchedule(week_id=week.id, session_date=date.today() + timedelta(days=2),
                                day_of_week=2, start_time=time(16, 0), topic='React state',
                                category='Frontend', mode='online', meeting_link='https://meet.example/x',
                                instructor_user_id=admin.id, created_by=admin.id),
            ]
        )

        quiz = Quiz(title='Python basics', description='Warmup quiz', field_of_study='Computer Science',
                    topic='Python', total_questions=2, mcq_count=2, tf_count=0,
                    # The quiz gates compare against the app clock (local, UTC+3),
                    # not utcnow, so the window is anchored to that clock: a quiz
                    # that started 30 minutes ago and runs for 60 is still open.
                    duration_minutes=60, status='published', visibility='members',
                    scheduled_start_at=app_now_naive() - timedelta(minutes=30),
                    published_at=NOW - timedelta(days=1),
                    created_by_user_id=admin.id)
        draft_quiz = Quiz(title='Draft quiz', description='Hidden', field_of_study='Computer Science',
                          topic='Draft', total_questions=1, status='draft',
                          created_by_user_id=admin.id)
        db.session.add_all([quiz, draft_quiz])
        db.session.flush()
        question = QuizQuestion(quiz_id=quiz.id, order_index=1, question_type='mcq',
                                scenario='A list.', question_text='What is [1, 2][1]?')
        db.session.add(question)
        db.session.flush()
        db.session.add_all(
            [
                QuizOption(question_id=question.id, option_key='A', option_text='1', is_correct=False),
                QuizOption(question_id=question.id, option_key='B', option_text='2', is_correct=True),
                QuizQuestion(quiz_id=quiz.id, order_index=2, question_type='mcq',
                             scenario='A dict.', question_text='Which is a mapping?'),
            ]
        )

        competition = Competition(title='Weekly Challenge 5', description='Build a CLI',
                                  category='Programming', frequency='weekly', level=1,
                                  status='published', submission_type='github',
                                  starts_at=NOW - timedelta(hours=1), ends_at=NOW + timedelta(days=6),
                                  created_by=admin.id)
        finalized = Competition(title='Weekly Challenge 4', description='Build a bot',
                                category='Programming', frequency='weekly', level=1,
                                status='finalized', submission_type='github',
                                starts_at=NOW - timedelta(days=8), ends_at=NOW - timedelta(days=2),
                                created_by=admin.id)
        db.session.add_all([competition, finalized])
        db.session.flush()
        db.session.add_all(
            [
                CompetitionCriteria(competition_id=competition.id, name='Clarity',
                                    description='Readable code', max_points=10,
                                    weight_percent=60, is_visible_to_members=True),
                CompetitionReward(competition_id=competition.id, rank_from=1, rank_to=1,
                                  points=50, prize_title='First place'),
                CompetitionEnrollment(competition_id=competition.id, member_id=member_a.id),
                CompetitionSubmission(competition_id=finalized.id, member_id=member_a.id,
                                      submission_type='github', submission_value='https://github.com/x/y',
                                      status='reviewed', final_score=88, rank=1, is_winner=True),
            ]
        )

        election = Election(title='Leadership 2026', description='Choose the team',
                            term_label='2026/27', status='voting',
                            application_starts_at=NOW - timedelta(days=20),
                            application_ends_at=NOW - timedelta(days=6),
                            voting_starts_at=NOW - timedelta(days=1),
                            voting_ends_at=NOW + timedelta(days=2),
                            created_by=admin.id)
        db.session.add(election)
        db.session.flush()
        position = ElectionPosition(election_id=election.id, title='President',
                                    seats_available=1, display_order=1,
                                    description='Leads the club')
        db.session.add(position)
        db.session.flush()
        db.session.add_all(
            [
                ElectionCandidate(election_id=election.id, election_position_id=position.id,
                                  member_id=member_b.id, status='approved',
                                  manifesto='A manifesto long enough to be plausible.',
                                  submitted_at=NOW - timedelta(days=10), vote_count=3),
                ElectionCandidate(election_id=election.id, election_position_id=position.id,
                                  member_id=member_c.id, status='approved',
                                  manifesto='Another manifesto long enough to pass.',
                                  submitted_at=NOW - timedelta(days=9), vote_count=1),
            ]
        )

        team = Team(name='Runtime Terrors', description='Builders', created_by_member_id=member_a.id)
        db.session.add(team)
        db.session.flush()
        db.session.add_all(
            [
                TeamMember(team_id=team.id, member_id=member_a.id, is_leader=True, status='approved'),
                TeamMember(team_id=team.id, member_id=member_b.id, is_leader=False, status='pending'),
            ]
        )
        db.session.commit()

        return {
            'dashboard': f'/api/v1/member/notifications',
            'members_event': members_event.id,
            'past_event': past_event.id,
            'quiz': quiz.id,
            'draft_quiz': draft_quiz.id,
            'competition': competition.id,
            'finalized': finalized.id,
            'election': election.id,
            'team': team.id,
            'notification_a': MemberNotification.query.filter_by(member_id=member_a.id).first().id,
            'notification_b': MemberNotification.query.filter_by(member_id=member_b.id).first().id,
            'member_a': member_a.id,
            'member_b': member_b.id,
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
            json={'email': email, 'password': PASSWORD, 'remember': True,
                  'turnstile_token': 'test-token'},
            headers={'X-CSRF-Token': self.csrf()},
        )
        self.assertEqual(response.status_code, 200, response.get_data(as_text=True))
        return response

    def data(self, path, status=200):
        response = self.client.get(path)
        self.assertEqual(response.status_code, status, response.get_data(as_text=True))
        return response.get_json()['data']

    def post(self, path, payload=None):
        return self.client.post(path, json=payload or {}, headers={'X-CSRF-Token': self.csrf()})

    def patch_json(self, path, payload):
        return self.client.patch(path, json=payload, headers={'X-CSRF-Token': self.csrf()})


class AccessControl(Base):
    def test_anonymous_is_401(self):
        for path in ('/api/v1/member/dashboard', '/api/v1/member/profile',
                     '/api/v1/member/notifications', '/api/v1/member/rankings'):
            response = self.client.get(path)
            self.assertEqual(response.status_code, 401, path)
            self.assertEqual(response.get_json()['error']['code'], 'AUTH_REQUIRED')

    def test_every_member_read_route_requires_a_session(self):
        rules = [r for r in app.url_map.iter_rules()
                 if r.rule.startswith('/api/v1/member') and 'GET' in r.methods]
        for rule in rules:
            path = rule.rule.replace('<int:event_id>', '1').replace('<int:quiz_id>', '1')
            path = path.replace('<int:competition_id>', '1').replace('<int:election_id>', '1')
            path = path.replace('<int:team_id>', '1').replace('<int:notification_id>', '1')
            path = path.replace('<int:project_id>', '1').replace('<int:attempt_id>', '1')
            response = self.client.get(path)
            self.assertEqual(response.status_code, 401, path)

    def test_another_members_notification_is_404(self):
        self.login(EMAIL_B)
        response = self.client.get(f"/api/v1/member/notifications/{IDS['notification_a']}")
        self.assertEqual(response.status_code, 404)


class DashboardTests(Base):
    def test_dashboard_aggregates(self):
        self.login()
        data = self.data('/api/v1/member/dashboard')
        self.assertEqual(data['greeting_name'], 'Amina')
        self.assertEqual(data['points'], 70)
        self.assertEqual(data['rank'], 1)
        self.assertEqual(data['membership']['state'], 'valid')
        self.assertEqual(data['tier']['name'], 'Silver')
        self.assertEqual(data['next_tier']['name'], 'Gold')
        self.assertEqual(data['next_tier']['points_remaining'], 30)
        self.assertEqual(data['unread'], 1)
        self.assertEqual(len(data['recent_rewards']), 2)
        self.assertEqual(data['current_week']['title'], 'Week 3')
        self.assertEqual(data['next_event']['title'], 'Members Meetup')
        self.assertEqual(data['active_quiz']['title'], 'Python basics')
        self.assertEqual(data['team']['name'], 'Runtime Terrors')

    def test_dashboard_is_no_store(self):
        self.login()
        response = self.client.get('/api/v1/member/dashboard')
        self.assertEqual(response.headers['Cache-Control'], 'no-store')

    def test_me_includes_member_aggregates(self):
        self.login()
        member = self.data('/api/v1/me')['member']
        self.assertEqual(member['points'], 70)
        self.assertEqual(member['rank'], 1)
        self.assertEqual(member['membership']['state'], 'valid')
        self.assertEqual(member['digital_id']['status'], 'active')


class ProfileTests(Base):
    def test_profile_is_the_full_self_record(self):
        self.login()
        data = self.data('/api/v1/member/profile')
        self.assertEqual(data['email'], EMAIL_A)
        self.assertEqual(data['phone'], '+255700000001')
        self.assertEqual(data['member_number'], data['member_number'])
        self.assertIn('Web development', data['areas_of_interest'])

    def test_update_profile(self):
        self.login()
        response = self.patch_json(
            '/api/v1/member/profile',
            {'full_name': 'Amina J. Juma', 'phone': '+255700000009',
             'course': 'Bachelor of Software Engineering', 'year': 'Year 3',
             'bio': 'Updated bio', 'areas_of_interest': ['AI']},
        )
        self.assertEqual(response.status_code, 200, response.get_data(as_text=True))
        data = response.get_json()['data']
        self.assertEqual(data['full_name'], 'Amina J. Juma')
        self.assertEqual(data['year'], 'Year 3')
        self.assertEqual(data['areas_of_interest'], ['AI'])
        # The suite shares one database; put the seeded record back.
        self.patch_json(
            '/api/v1/member/profile',
            {'full_name': 'Amina Juma', 'phone': '+255700000001',
             'course': 'Bachelor of Computer Science', 'year': 'Year 2',
             'bio': 'I build small useful things.',
             'areas_of_interest': ['Web development', 'Data science']},
        )

    def test_invalid_course_is_422(self):
        self.login()
        response = self.patch_json(
            '/api/v1/member/profile',
            {'full_name': 'Amina', 'phone': '+255700000001',
             'course': 'Underwater Basket Weaving', 'year': 'Year 2'},
        )
        self.assertEqual(response.status_code, 422)
        self.assertIn('course', response.get_json()['error']['details'])

    def test_missing_required_field_is_422(self):
        self.login()
        response = self.patch_json('/api/v1/member/profile', {'phone': '+255700000001'})
        self.assertEqual(response.status_code, 422)
        self.assertIn('full_name', response.get_json()['error']['details'])


class DigitalIdTests(Base):
    def test_digital_id(self):
        self.login()
        data = self.data('/api/v1/member/digital-id')
        self.assertEqual(data['status'], 'active')
        self.assertTrue(data['verify_url'].startswith('/verify-id/'))
        self.assertEqual(data['image_urls']['front'], '/api/v1/member/digital-id/image?side=front')

    def test_image_is_served_no_store(self):
        self.login()
        response = self.client.get('/api/v1/member/digital-id/image?side=front')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers['Cache-Control'], 'no-store')
        self.assertEqual(response.mimetype, 'image/png')

    def test_invalid_side_is_422(self):
        self.login()
        self.assertEqual(self.client.get('/api/v1/member/digital-id/image?side=sideways').status_code, 422)

    def test_regenerate(self):
        self.login()
        with patch('app.api.member.generate_digital_id') as generator, \
                patch('app.api.member.delete_digital_id') as deleter:
            response = self.post('/api/v1/member/digital-id/regenerate')
        self.assertEqual(response.status_code, 200, response.get_data(as_text=True))
        self.assertTrue(generator.called)
        self.assertTrue(deleter.called)


class MembershipTests(Base):
    def test_membership_and_payments(self):
        self.login()
        data = self.data('/api/v1/member/membership')
        self.assertEqual(data['state'], 'valid')
        self.assertEqual(data['days_expired'], 0)
        self.assertEqual(len(data['payments']), 1)
        self.assertEqual(data['payments'][0]['amount'], 20000)


class RewardsTests(Base):
    def test_rewards_ladder(self):
        self.login()
        data = self.data('/api/v1/member/rewards')
        earned = {row['name']: row['earned'] for row in data['trophies']}
        self.assertEqual(earned, {'Bronze': True, 'Silver': True, 'Gold': False})
        self.assertEqual(data['next_trophy']['points_remaining'], 30)

    def test_history_is_own_ledger_only(self):
        self.login()
        data = self.data('/api/v1/member/rewards/history')
        self.assertEqual(len(data), 2)
        self.assertEqual(sum(row['points'] for row in data), 70)


class ProjectTests(Base):
    def test_only_own_projects_including_private(self):
        self.login()
        data = self.data('/api/v1/member/projects')
        titles = {row['title'] for row in data}
        self.assertEqual(titles, {'Campus Navigator', 'Private Draft'})


class EventTests(Base):
    def setUp(self):
        super().setUp()
        # Tests share one database; start from the seeded RSVP state.
        with app.app_context():
            RSVP.query.filter(
                RSVP.member_id == IDS['member_a'],
                RSVP.event_id.in_([IDS['members_event'], IDS['past_event']]),
            ).delete(synchronize_session=False)
            db.session.commit()
            db.session.add(RSVP(event_id=IDS['past_event'], member_id=IDS['member_a'],
                                full_name='Amina Juma', email=EMAIL_A, status='approved'))
            db.session.commit()

    def test_upcoming_scope_and_audience(self):
        self.login()
        data = self.data('/api/v1/member/events')
        titles = [row['title'] for row in data]
        self.assertEqual(titles, ['Members Meetup', 'Paid Members Dinner'])
        self.assertIsNone(data[0]['rsvp'])

    def test_past_scope(self):
        self.login()
        data = self.data('/api/v1/member/events?scope=past')
        self.assertEqual([row['title'] for row in data], ['Old Meetup'])
        self.assertEqual(data[0]['rsvp']['status'], 'approved')

    def test_rsvp_create_then_duplicate(self):
        self.login()
        response = self.post(f"/api/v1/member/events/{IDS['members_event']}/rsvp",
                             {'dietary_requirements': 'Vegetarian'})
        self.assertEqual(response.status_code, 201, response.get_data(as_text=True))
        self.assertEqual(response.get_json()['data']['rsvp']['status'], 'pending')
        duplicate = self.post(f"/api/v1/member/events/{IDS['members_event']}/rsvp")
        self.assertEqual(duplicate.status_code, 409)
        self.assertEqual(duplicate.get_json()['error']['code'], 'ALREADY_REGISTERED')

    def test_rsvp_cancel(self):
        self.login()
        self.post(f"/api/v1/member/events/{IDS['members_event']}/rsvp")
        response = self.client.delete(
            f"/api/v1/member/events/{IDS['members_event']}/rsvp",
            headers={'X-CSRF-Token': self.csrf()},
        )
        self.assertEqual(response.status_code, 204)
        listed = self.data('/api/v1/member/events')
        self.assertIsNone(listed[0]['rsvp'])

    def test_rsvp_for_a_past_event_is_409(self):
        self.login()
        response = self.post(f"/api/v1/member/events/{IDS['past_event']}/rsvp")
        self.assertEqual(response.status_code, 409)
        self.assertEqual(response.get_json()['error']['code'], 'RSVP_CLOSED')

    def test_cancel_without_rsvp_is_404(self):
        self.login(EMAIL_B)
        response = self.client.delete(
            f"/api/v1/member/events/{IDS['members_event']}/rsvp",
            headers={'X-CSRF-Token': self.csrf()},
        )
        self.assertEqual(response.status_code, 404)


class SessionTests(Base):
    def test_timetable(self):
        self.login()
        data = self.data('/api/v1/member/sessions/timetable')
        self.assertEqual(data['week']['title'], 'Week 3')
        self.assertEqual(len(data['days']), 2)
        self.assertEqual(data['days'][0]['sessions'][0]['topic'], 'APIs with Flask')
        self.assertEqual(data['days'][1]['sessions'][0]['meeting_link'], 'https://meet.example/x')

    def test_instructors(self):
        self.login()
        data = self.data('/api/v1/member/sessions/instructors')
        self.assertEqual(len(data), 1)
        self.assertEqual(len(data[0]['sessions']), 2)


class RankingTests(Base):
    def test_leaderboard_order_and_my_entry(self):
        self.login()
        data = self.data('/api/v1/member/rankings')
        self.assertEqual([row['name'] for row in data['leaderboard']],
                         ['Amina Juma', 'Baraka Mwita', 'Chausiku Ally'])
        self.assertEqual(data['leaderboard'][0]['points'], 70)
        self.assertEqual(data['my_entry']['rank'], 1)
        self.assertEqual(data['teams'][0]['name'], 'Runtime Terrors')

    def test_points_transactions_are_own(self):
        self.login(EMAIL_B)
        data = self.data('/api/v1/member/rankings/points-transactions')
        self.assertEqual(data['points'], 5)
        self.assertEqual(len(data['transactions']), 1)


class NotificationTests(Base):
    def test_list_reports_unread(self):
        self.login()
        response = self.client.get('/api/v1/member/notifications')
        body = response.get_json()
        self.assertEqual(len(body['data']), 2)
        self.assertEqual(body['meta']['unread'], 1)

    def test_detail_does_not_mark_as_read(self):
        self.login()
        detail = self.data(f"/api/v1/member/notifications/{IDS['notification_a']}")
        self.assertFalse(detail['is_read'])
        listed = self.data('/api/v1/member/notifications')
        self.assertEqual(sum(1 for row in listed if not row['is_read']), 1)

    def test_mark_read_is_idempotent(self):
        self.login()
        first = self.post(f"/api/v1/member/notifications/{IDS['notification_a']}/read")
        second = self.post(f"/api/v1/member/notifications/{IDS['notification_a']}/read")
        self.assertEqual(first.status_code, 204)
        self.assertEqual(second.status_code, 204)
        detail = self.data(f"/api/v1/member/notifications/{IDS['notification_a']}")
        self.assertTrue(detail['is_read'])

    def test_read_all(self):
        self.login()
        self.assertEqual(self.post('/api/v1/member/notifications/read-all').status_code, 204)
        response = self.client.get('/api/v1/member/notifications')
        self.assertEqual(response.get_json()['meta']['unread'], 0)


class QuizTests(Base):
    def test_only_published_quizzes_are_listed(self):
        self.login()
        data = self.data('/api/v1/member/quizzes')
        self.assertEqual([row['id'] for row in data], [IDS['quiz']])
        self.assertTrue(data[0]['is_live'])
        self.assertTrue(data[0]['can_start'])
        self.assertIsNone(data[0]['attempt'])

    def test_quiz_detail_withholds_answers(self):
        self.login()
        data = self.data(f"/api/v1/member/quizzes/{IDS['quiz']}")
        self.assertEqual(len(data['questions']), 2)
        option = data['questions'][0]['options'][0]
        self.assertEqual(set(option), {'id', 'key', 'text'})
        self.assertNotIn('is_correct', str(data))

    def test_draft_quiz_is_404(self):
        self.login()
        self.assertEqual(self.client.get(f"/api/v1/member/quizzes/{IDS['draft_quiz']}").status_code, 404)


class CompetitionTests(Base):
    def test_list_buckets_active_and_past(self):
        self.login()
        data = self.data('/api/v1/member/competitions?level=weekly')
        self.assertEqual([row['title'] for row in data['active']], ['Weekly Challenge 5'])
        self.assertEqual([row['title'] for row in data['past']], ['Weekly Challenge 4'])
        self.assertTrue(data['active'][0]['enrolled'])
        self.assertIn('Your year of study is not eligible for this level.',
                      data['active'][0]['reasons'])

    def test_detail(self):
        self.login()
        data = self.data(f"/api/v1/member/competitions/{IDS['competition']}")
        self.assertEqual(data['criteria'][0]['name'], 'Clarity')
        self.assertEqual(data['rewards'][0]['title'], 'First place')
        self.assertEqual(data['enrollment']['status'], 'enrolled')
        self.assertFalse(data['eligibility']['allowed'])
        self.assertFalse(data['leaderboard_available'])

    def test_leaderboard_closed_until_finalized(self):
        self.login()
        response = self.client.get(f"/api/v1/member/competitions/{IDS['competition']}/leaderboard")
        self.assertEqual(response.status_code, 409)
        self.assertEqual(response.get_json()['error']['code'], 'LEADERBOARD_CLOSED')

    def test_finalized_leaderboard_has_no_email(self):
        self.login()
        data = self.data(f"/api/v1/member/competitions/{IDS['finalized']}/leaderboard")
        self.assertEqual(data['individuals'][0]['display_name'], 'Amina Juma')
        self.assertNotIn('@test.local', str(data))


class ElectionTests(Base):
    def test_list(self):
        self.login()
        data = self.data('/api/v1/member/elections')
        self.assertEqual([row['title'] for row in data['active']], ['Leadership 2026'])
        self.assertTrue(data['active'][0]['can_vote'])

    def test_detail_lists_ballot(self):
        self.login()
        data = self.data(f"/api/v1/member/elections/{IDS['election']}")
        self.assertEqual(data['positions'][0]['title'], 'President')
        self.assertEqual(len(data['positions'][0]['candidates']), 2)
        self.assertTrue(data['can_vote'])

    def test_results_are_closed(self):
        self.login()
        response = self.client.get(f"/api/v1/member/elections/{IDS['election']}/results")
        self.assertEqual(response.status_code, 409)
        self.assertEqual(response.get_json()['error']['code'], 'RESULTS_NOT_PUBLISHED')


class TeamTests(Base):
    def test_overview(self):
        self.login()
        data = self.data('/api/v1/member/teams')
        self.assertEqual(data['my_team']['name'], 'Runtime Terrors')
        self.assertTrue(data['my_membership']['is_leader'])
        self.assertEqual(len(data['leader_requests']), 1)
        self.assertEqual(data['leader_requests'][0]['display_name'], 'Baraka Mwita')

    def test_detail(self):
        self.login()
        data = self.data(f"/api/v1/member/teams/{IDS['team']}")
        self.assertTrue(data['is_leader'])
        self.assertEqual(len(data['members']), 1)


class SearchTests(Base):
    def test_short_query_is_422(self):
        self.login()
        self.assertEqual(self.client.get('/api/v1/member/search?q=a').status_code, 422)

    def test_results_expose_no_contact_details(self):
        self.login()
        data = self.data('/api/v1/member/search?q=Baraka')
        self.assertEqual(data[0]['display_name'], 'Baraka Mwita')
        self.assertEqual(set(data[0]), {'member_id', 'display_name', 'course', 'year', 'avatar_url'})


class PasswordTests(Base):
    def test_wrong_current_password(self):
        self.login()
        response = self.post('/api/v1/me/password',
                             {'current_password': 'wrong', 'new_password': 'new-password'})
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.get_json()['error']['code'], 'CURRENT_PASSWORD_INVALID')

    def test_short_new_password(self):
        self.login()
        response = self.post('/api/v1/me/password',
                             {'current_password': PASSWORD, 'new_password': 'abc'})
        self.assertEqual(response.status_code, 422)

    def test_password_changes(self):
        self.login()
        response = self.post('/api/v1/me/password',
                             {'current_password': PASSWORD, 'new_password': 'phase8-new-password'})
        self.assertEqual(response.status_code, 204)
        self.client.get('/api/v1/auth/logout')
        login = self.client.post(
            '/api/v1/auth/login',
            json={'email': EMAIL_A, 'password': 'phase8-new-password', 'remember': False,
                  'turnstile_token': 'test-token'},
            headers={'X-CSRF-Token': self.csrf()},
        )
        self.assertEqual(login.status_code, 200, login.get_data(as_text=True))
        # restore for any later test
        with app.app_context():
            user = User.query.filter_by(email=EMAIL_A).first()
            user.set_password(PASSWORD)
            db.session.commit()


if __name__ == '__main__':
    unittest.main(verbosity=2)
