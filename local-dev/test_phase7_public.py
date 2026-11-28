"""Phase 7 verification: public website endpoints PU1–PU23.

Runs against an isolated temporary SQLite database and never opens
``instance/dev_local.db``. Content is seeded inside the temp file only.

Run from the parent project root:
    current-website/DIgital-Club/.venv/Scripts/python.exe local-dev/test_phase7_public.py -v
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
DB_PATH = ARTIFACTS / 'test_phase7.sqlite'
if DB_PATH.exists():
    DB_PATH.unlink()

os.environ.update(
    {
        'FLASK_ENV': 'development',
        'SECRET_KEY': 'phase7-test-secret',
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
    Blog,
    Competition,
    Election,
    ElectionCandidate,
    ElectionPosition,
    Event,
    Gallery,
    Leader,
    Member,
    News,
    Newsletter,
    Project,
    SessionWeek,
    SystemSettings,
    Technology,
    Topic,
    Trophy,
    User,
)

app = create_app()
app.config.update(TESTING=True, PROPAGATE_EXCEPTIONS=False, RATELIMIT_ENABLED=True)

# Window columns (event dates, election windows) are application-local; seed
# them on the same clock the API rules compare against.
with app.app_context():
    NOW = app_now_naive()


def _user(email, name, *, approved=True, role='student', visibility='public'):
    user = User(email=email, role=role, is_approved=approved)
    user.set_password('phase7-password')
    db.session.add(user)
    db.session.flush()
    member = Member(
        user_id=user.id,
        full_name=name,
        course='Bachelor of Computer Science',
        year='Year 2',
        status='student',
        phone='+255700000001',
        bio='Builder of small useful things.',
        github='https://github.com/example',
        areas_of_interest='Web development, Data science',
        member_id_number=f'DC-2026-{user.id:04d}',
        created_at=datetime(2025, 10, 4),
        # Mirrors the privacy migration: approved members are public, and a
        # new profile would default to private.
        profile_visibility=visibility,
        discoverable=visibility == 'public',
    )
    db.session.add(member)
    db.session.flush()
    return user, member


def seed():
    with app.app_context():
        db.create_all()
        admin, _ = _user('admin.phase7@test.local', 'Admin Person', role='admin')
        student, student_member = _user('student.phase7@test.local', 'Amina Juma')
        alumni_user, alumni_member = _user('alumni.phase7@test.local', 'Old Graduate')
        alumni_member.status = 'alumni'
        alumni_member.year = 'Graduate'
        pending, pending_member = _user('pending.phase7@test.local', 'Pending Person', approved=False)
        _, private_member = _user('private.phase7@test.local', 'Private Person', visibility='private')
        _, partial_member = _user('partial.phase7@test.local', 'Partial Person')
        partial_member.privacy_sections = '{"bio": false, "links": false}'

        news = News(
            title='Hackathon registration open',
            content='<p>Join the <strong>hackathon</strong> this term.</p>',
            image='news/banner.png',
            category='hackathon',
            published_date=NOW - timedelta(days=1),
            author_id=admin.id,
        )
        db.session.add(news)

        blog = Blog(
            title='Python in 2025',
            slug='python-in-2025',
            content='<h2>Start here</h2><p>Hello <script>alert(1)</script>world.</p>',
            excerpt='A beginner tutorial.',
            author_id=admin.id,
            tags='Python, Beginners',
            is_published=True,
            published_date=NOW - timedelta(days=2),
            views=10,
        )
        draft_blog = Blog(
            title='Draft article',
            slug='draft-article',
            content='<p>Not published.</p>',
            author_id=admin.id,
            is_published=False,
        )
        db.session.add_all([blog, draft_blog])

        public_event = Event(
            title='AI Bootcamp',
            description='Practical AI skills.',
            event_date=NOW + timedelta(days=7),
            location='Computer Lab 1',
            category='workshop',
            target_audience='everyone',
            max_attendees=200,
        )
        past_event = Event(
            title='Old Meetup',
            description='Already happened.',
            event_date=NOW - timedelta(days=7),
            location='Tech Lab',
            category='tech_talk',
            target_audience='everyone',
        )
        members_event = Event(
            title='Members Only',
            description='Private event.',
            event_date=NOW + timedelta(days=3),
            location='Tech Lab',
            category='workshop',
            target_audience='members',
        )
        db.session.add_all([public_event, past_event, members_event])

        public_project = Project(
            title='Smart Campus Navigator',
            description='A mobile app that helps students navigate campus.',
            image='projects/navigator.png',
            technologies='React Native, Node.js',
            github_link='https://github.com/example/navigator',
            member_id=student_member.id,
            is_public=True,
            is_featured=True,
            created_at=datetime(2025, 5, 1),
        )
        private_project = Project(
            title='Secret Draft',
            description='Not ready.',
            technologies='Python',
            member_id=student_member.id,
            is_public=False,
        )
        admin_project = Project(
            title='Club Website',
            description='The club website itself.',
            technologies='Flask, React',
            is_public=True,
            is_admin_project=True,
            team_members='Web Team',
        )
        db.session.add_all([public_project, private_project, admin_project])

        db.session.add_all(
            [
                Gallery(type='image', url='gallery/one.jpg', caption='Workshop day'),
                Gallery(type='video', url='gallery/two.mp4', caption='Competition recap'),
            ]
        )

        db.session.add(Leader(user_id=alumni_user.id, position='Chairperson', display_order=1))

        db.session.add_all(
            [
                Topic(name='Python Programming', description='From basics to advanced'),
                Technology(name='React', category='web', icon='fa-react', is_active=True),
                Technology(name='Old Tech', category='other', is_active=False),
            ]
        )

        election = Election(
            title='Leadership Election 2026',
            description='Annual leadership election.',
            term_label='2026/2027',
            status='voting',
            application_starts_at=NOW - timedelta(days=30),
            application_ends_at=NOW - timedelta(days=10),
            voting_starts_at=NOW - timedelta(days=1),
            voting_ends_at=NOW + timedelta(days=2),
            requires_paid_membership=False,
            created_by=admin.id,
        )
        draft_election = Election(title='Draft Election', status='draft', created_by=admin.id)
        db.session.add_all([election, draft_election])
        db.session.flush()
        position = ElectionPosition(
            election_id=election.id, title='Chairperson', seats_available=1, display_order=1
        )
        db.session.add(position)
        db.session.flush()
        db.session.add(
            ElectionCandidate(
                election_id=election.id,
                election_position_id=position.id,
                member_id=student_member.id,
                status='approved',
                manifesto='Build more things together.',
                submitted_at=NOW - timedelta(days=20),
            )
        )

        trophy = Trophy(name='First Steps', description='Earned the first badge.', points_required=10)
        db.session.add(trophy)
        db.session.flush()
        from app.models import MemberTrophy

        db.session.add(MemberTrophy(member_id=student_member.id, trophy_id=trophy.id))

        db.session.add(SystemSettings(setting_key='contact_email', setting_value='club@test.local'))
        db.session.add(SystemSettings(setting_key='club_name', setting_value='KIUT Digital Club'))

        db.session.add(
            Competition(
                title='Weekly Challenge',
                description='A weekly coding challenge.',
                category='coding',
                frequency='weekly',
                level=1,
                status='published',
                submission_type='github',
                starts_at=NOW - timedelta(days=2),
                ends_at=NOW + timedelta(days=5),
                created_by=admin.id,
            )
        )
        db.session.add(
            SessionWeek(
                title='Week 1',
                week_start=(NOW - timedelta(days=3)).date(),
                week_end=(NOW + timedelta(days=4)).date(),
                status='published',
            )
        )
        db.session.commit()
        return {
            'student_slug': f'amina-juma-{student_member.id}',
            'member_number': student_member.member_id_number,
            'public_event_id': public_event.id,
            'past_event_id': past_event.id,
            'election_id': election.id,
            'draft_election_id': draft_election.id,
            'public_project_id': public_project.id,
            'private_project_id': private_project.id,
            'pending_slug': f'pending-person-{pending_member.id}',
            'pending_email': pending.email,
            'private_slug': f'private-person-{private_member.id}',
            'partial_slug': f'partial-person-{partial_member.id}',
        }


IDS = seed()


class Base(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()
        reset_rate_limits()
        self.turnstile = patch('app.routes.main._verify_turnstile', return_value=True)
        self.turnstile.start()
        self.addCleanup(self.turnstile.stop)

    def get(self, path):
        return self.client.get(path)

    def data(self, path, status=200):
        response = self.client.get(path)
        self.assertEqual(response.status_code, status, response.get_data(as_text=True))
        return response.get_json()['data']

    def csrf(self):
        response = self.client.get('/api/v1/auth/csrf')
        self.assertEqual(response.status_code, 200)
        return response.get_json()['data']['csrf_token']

    def post(self, path, payload):
        return self.client.post(
            path, json=payload, headers={'X-CSRF-Token': self.csrf()}
        )


class HomeAndStats(Base):
    def test_home_excludes_private_projects(self):
        data = self.data('/api/v1/public/home')
        titles = [item['title'] for item in data['featured_projects']]
        self.assertIn('Smart Campus Navigator', titles)
        self.assertNotIn('Secret Draft', titles)
        self.assertLessEqual(len(data['featured_projects']), 3)
        self.assertLessEqual(len(data['upcoming_events']), 3)
        self.assertTrue(all(item['target_audience'] if 'target_audience' in item else True for item in data['upcoming_events']))

    def test_home_excludes_members_only_events(self):
        data = self.data('/api/v1/public/home')
        self.assertNotIn('Members Only', [item['title'] for item in data['upcoming_events']])

    def test_stats_counts(self):
        data = self.data('/api/v1/public/stats')
        # admin has no member; Amina + Old Graduate, plus the two MD5 fixtures
        # (one private profile, one with hidden sections).
        self.assertEqual(data['members']['total'], 5)
        self.assertEqual(data['members']['students'], 4)
        self.assertEqual(data['members']['alumni'], 1)
        self.assertEqual(data['projects']['total'], 3)
        self.assertEqual(data['projects']['published'], 2)
        self.assertEqual(data['competitions']['total'], 1)
        self.assertEqual(data['sessions']['total'], 1)

    def test_stats_is_no_store(self):
        response = self.client.get('/api/v1/public/stats')
        self.assertEqual(response.headers['Cache-Control'], 'no-store')

    def test_content_is_cached(self):
        response = self.client.get('/api/v1/public/news')
        self.assertEqual(response.headers['Cache-Control'], 'public, max-age=60')


class NewsEndpoints(Base):
    def test_list_and_search(self):
        data = self.data('/api/v1/public/news')
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]['title'], 'Hackathon registration open')
        self.assertNotIn('content', data[0])
        self.assertEqual(self.data('/api/v1/public/news?q=nothing'), [])

    def test_detail(self):
        data = self.data('/api/v1/public/news/1')
        self.assertIn('hackathon', data['body'])
        self.assertEqual(data['author']['display_name'], 'Admin Person')

    def test_missing_returns_404(self):
        response = self.client.get('/api/v1/public/news/9999')
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.get_json()['error']['code'], 'NOT_FOUND')


class BlogEndpoints(Base):
    def test_list_excludes_unpublished(self):
        data = self.data('/api/v1/public/blogs')
        self.assertEqual([item['slug'] for item in data], ['python-in-2025'])

    def test_detail_sanitises_html_and_counts_view(self):
        before = self.data('/api/v1/public/blogs/python-in-2025')['views']
        data = self.data('/api/v1/public/blogs/python-in-2025')
        self.assertNotIn('<script', data['body_html_sanitised'])
        self.assertNotIn('alert(1)', data['body_html_sanitised'])
        self.assertIn('<h2>Start here</h2>', data['body_html_sanitised'])
        self.assertEqual(data['views'], before + 1)

    def test_unpublished_or_missing_404(self):
        self.assertEqual(self.client.get('/api/v1/public/blogs/draft-article').status_code, 404)

    def test_tag_filter(self):
        self.assertEqual(len(self.data('/api/v1/public/blogs?tag=Python')), 1)
        self.assertEqual(len(self.data('/api/v1/public/blogs?tag=Rust')), 0)


class EventEndpoints(Base):
    def test_scope_and_audience(self):
        upcoming = self.data('/api/v1/public/events')
        titles = [item['title'] for item in upcoming]
        self.assertIn('AI Bootcamp', titles)
        self.assertNotIn('Old Meetup', titles)
        self.assertNotIn('Members Only', titles)
        past = self.data('/api/v1/public/events?scope=past')
        self.assertEqual([item['title'] for item in past], ['Old Meetup'])

    def test_detail(self):
        data = self.data(f"/api/v1/public/events/{IDS['public_event_id']}")
        self.assertEqual(data['capacity'], 200)
        self.assertEqual(data['registered_count'], 0)
        self.assertEqual(data['rsvp']['state'], 'open')

    def test_private_audience_404(self):
        response = self.client.get('/api/v1/public/events/3')
        self.assertEqual(response.status_code, 404)

    def test_rsvp_success_and_duplicate(self):
        payload = {
            'full_name': 'Guest Person',
            'email': 'guest@test.local',
            'phone': '+255700000009',
            'turnstile_token': 'test-token',
        }
        response = self.post(f"/api/v1/public/events/{IDS['public_event_id']}/rsvp", payload)
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.get_json()['data']['rsvp']['status'], 'pending')
        duplicate = self.post(f"/api/v1/public/events/{IDS['public_event_id']}/rsvp", payload)
        self.assertEqual(duplicate.status_code, 409)
        self.assertEqual(duplicate.get_json()['error']['code'], 'ALREADY_REGISTERED')

    def test_rsvp_closed(self):
        response = self.post(
            f"/api/v1/public/events/{IDS['past_event_id']}/rsvp",
            {
                'full_name': 'Guest Person',
                'email': 'guest2@test.local',
                'turnstile_token': 'test-token',
            },
        )
        self.assertEqual(response.status_code, 409)
        self.assertEqual(response.get_json()['error']['code'], 'RSVP_CLOSED')

    def test_rsvp_turnstile_failure(self):
        with patch('app.routes.main._verify_turnstile', return_value=False):
            response = self.post(
                f"/api/v1/public/events/{IDS['public_event_id']}/rsvp",
                {
                    'full_name': 'Guest Person',
                    'email': 'guest3@test.local',
                    'turnstile_token': 'bad',
                },
            )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.get_json()['error']['code'], 'TURNSTILE_FAILED')

    def test_rsvp_requires_csrf(self):
        response = self.client.post(
            f"/api/v1/public/events/{IDS['public_event_id']}/rsvp",
            json={'full_name': 'X', 'email': 'x@test.local'},
        )
        self.assertEqual(response.status_code, 403)


class ProjectEndpoints(Base):
    def test_only_public_projects(self):
        data = self.data('/api/v1/public/projects')
        titles = [item['title'] for item in data]
        self.assertIn('Smart Campus Navigator', titles)
        self.assertIn('Club Website', titles)
        self.assertNotIn('Secret Draft', titles)

    def test_filters(self):
        self.assertEqual(len(self.data('/api/v1/public/projects?technology=React')), 2)
        self.assertEqual(len(self.data('/api/v1/public/projects?year=2025')), 1)
        self.assertEqual(len(self.data('/api/v1/public/projects?course=Computer')), 1)

    def test_detail_links_and_private_404(self):
        data = self.data(f"/api/v1/public/projects/{IDS['public_project_id']}")
        self.assertEqual(data['links'][0]['label'], 'GitHub')
        self.assertEqual(data['owner_display_name'], 'Amina Juma')
        self.assertEqual(
            self.client.get(
                f"/api/v1/public/projects/{IDS['private_project_id']}"
            ).status_code,
            404,
        )


class StaticContentEndpoints(Base):
    def test_gallery(self):
        data = self.data('/api/v1/public/gallery')
        self.assertEqual(len(data), 2)
        self.assertEqual(data[0]['category'], 'video')

    def test_leaders(self):
        data = self.data('/api/v1/public/leaders')
        self.assertEqual(data[0]['name'], 'Old Graduate')
        self.assertEqual(data[0]['position'], 'Chairperson')

    def test_topics_excludes_inactive_technology(self):
        data = self.data('/api/v1/public/topics')
        self.assertEqual([item['name'] for item in data['topics']], ['Python Programming'])
        self.assertEqual([item['name'] for item in data['technologies']], ['React'])


class ElectionEndpoints(Base):
    def test_list_excludes_draft(self):
        data = self.data('/api/v1/public/elections')
        self.assertEqual([item['id'] for item in data], [IDS['election_id']])
        self.assertEqual(data[0]['positions_count'], 1)

    def test_detail_by_id_and_slug(self):
        by_id = self.data(f"/api/v1/public/elections/{IDS['election_id']}")
        by_slug = self.data('/api/v1/public/elections/leadership-election-2026')
        self.assertEqual(by_id['id'], by_slug['id'])
        self.assertEqual(by_id['positions'][0]['candidates'][0]['display_name'], 'Amina Juma')
        self.assertEqual(by_id['eligibility'], 'Open to approved club members')

    def test_draft_404(self):
        self.assertEqual(
            self.client.get(f"/api/v1/public/elections/{IDS['draft_election_id']}").status_code,
            404,
        )


class MemberEndpoints(Base):
    def test_directory_privacy(self):
        data = self.data('/api/v1/public/members')
        names = [item['display_name'] for item in data]
        self.assertIn('Amina Juma', names)
        self.assertIn('Old Graduate', names)
        self.assertNotIn('Pending Person', names)
        for item in data:
            self.assertEqual(
                set(item),
                {'public_slug', 'display_name', 'course', 'year', 'status', 'avatar_url'},
            )

    def test_status_filter(self):
        alumni = self.data('/api/v1/public/members?status=alumni')
        self.assertEqual([item['display_name'] for item in alumni], ['Old Graduate'])

    def test_profile(self):
        data = self.data(f"/api/v1/public/members/{IDS['student_slug']}")
        self.assertEqual(data['display_name'], 'Amina Juma')
        self.assertEqual(data['joined_year'], 2025)
        self.assertEqual(data['interests'], ['Web development', 'Data science'])
        self.assertIn('React Native', data['skills'])
        self.assertEqual(data['links']['github'], 'https://github.com/example')
        self.assertEqual(len(data['projects']), 1)
        self.assertEqual(data['achievements'][0]['name'], 'First Steps')
        self.assertNotIn('email', data)
        self.assertNotIn('phone', data)
        self.assertNotIn('member_number', data)

    def test_private_or_unapproved_404(self):
        self.assertEqual(
            self.client.get(f"/api/v1/public/members/{IDS['pending_slug']}").status_code, 404
        )
        self.assertEqual(
            self.client.get(f"/api/v1/public/members/{IDS['private_slug']}").status_code, 404
        )
        self.assertEqual(self.client.get('/api/v1/public/members/unknown-1').status_code, 404)

    def test_private_profile_is_not_listed(self):
        names = [item['display_name'] for item in self.data('/api/v1/public/members')]
        self.assertNotIn('Private Person', names)
        self.assertIn('Partial Person', names)

    def test_hidden_sections_carry_no_data(self):
        data = self.data(f"/api/v1/public/members/{IDS['partial_slug']}")
        self.assertIsNone(data['bio'])
        self.assertEqual(data['links'], {})
        # A section that was not hidden still shows.
        self.assertEqual(data['interests'], ['Web development', 'Data science'])
        self.assertEqual(data['display_name'], 'Partial Person')


class VerifyEndpoints(Base):
    def test_valid(self):
        data = self.data(f"/api/v1/public/verify-id/{IDS['member_number']}")
        self.assertTrue(data['valid'])
        self.assertEqual(data['member']['display_name'], 'Amina Juma')
        self.assertNotIn('phone', data['member'])
        self.assertNotIn('email', data['member'])

    def test_invalid_shape(self):
        data = self.data('/api/v1/public/verify-id/DC-0000-0000')
        self.assertEqual(data, {'valid': False})

    def test_no_store(self):
        response = self.client.get(f"/api/v1/public/verify-id/{IDS['member_number']}")
        self.assertEqual(response.headers['Cache-Control'], 'no-store')


class SettingsAndNewsletter(Base):
    def test_contact_uses_settings(self):
        data = self.data('/api/v1/public/contact')
        self.assertEqual(data['email'], 'club@test.local')
        self.assertTrue(data['address'])

    def test_site(self):
        data = self.data('/api/v1/public/site')
        self.assertEqual(data['club_name'], 'KIUT Digital Club')
        self.assertNotIn('membership_fee', data)

    def test_newsletter_subscribe_and_duplicate(self):
        response = self.post('/api/v1/public/newsletter/subscribe', {'email': 'news@test.local'})
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.get_json()['data'], {'subscribed': True})
        duplicate = self.post('/api/v1/public/newsletter/subscribe', {'email': 'news@test.local'})
        self.assertEqual(duplicate.status_code, 409)
        self.assertEqual(duplicate.get_json()['error']['code'], 'ALREADY_SUBSCRIBED')
        with app.app_context():
            self.assertEqual(Newsletter.query.filter_by(email='news@test.local').count(), 1)


class SearchEndpoints(Base):
    def test_short_query(self):
        response = self.client.get('/api/v1/public/search?q=a')
        self.assertEqual(response.status_code, 422)
        self.assertEqual(response.get_json()['error']['code'], 'QUERY_TOO_SHORT')

    def test_grouped_results(self):
        data = self.data('/api/v1/public/search?q=campus')
        self.assertEqual([item['type'] for item in data['results']['projects']], ['projects'])
        self.assertEqual(data['results']['projects'][0]['url'], '/projects#1')

    def test_member_results_obey_public_fields(self):
        data = self.data('/api/v1/public/search?q=Amina&types=members')
        result = data['results']['members'][0]
        self.assertEqual(result['title'], 'Amina Juma')
        self.assertNotIn('email', result)
        self.assertNotIn('phone', result)


if __name__ == '__main__':
    unittest.main(verbosity=2)
