"""Seed a throwaway database for Phase 6 browser verification.

The preserved local database (``instance/dev_local.db``) must stay schema-only,
so this script builds a separate SQLite file under ``local-dev/.test-artifacts``
with three test accounts and prints their credentials.

Then start the backend against it:

    DATABASE_URL="sqlite:///.../browser_phase6.sqlite" \\
        .venv/Scripts/python.exe -m flask --app app run --host 127.0.0.1 --port 5051

Run from the parent project root:
    current-website/DIgital-Club/.venv/Scripts/python.exe local-dev/seed_phase6_browser.py
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

BACKEND = Path(__file__).resolve().parent.parent / 'current-website' / 'DIgital-Club'
ARTIFACTS = Path(__file__).resolve().parent / '.test-artifacts'
ARTIFACTS.mkdir(exist_ok=True)
DB_PATH = ARTIFACTS / 'browser_phase6.sqlite'
if DB_PATH.exists():
    DB_PATH.unlink()

os.environ.update(
    {
        'FLASK_ENV': 'development',
        'DATABASE_URL': 'sqlite:///' + DB_PATH.as_posix(),
        'QUIZ_REMINDER_RUN_ON_REQUEST': '0',
        'SESSION_COOKIE_SECURE': '0',
        'REMEMBER_COOKIE_SECURE': '0',
    }
)

sys.path.insert(0, str(BACKEND))
os.chdir(BACKEND)

import app.models  # noqa: E402,F401
from app import create_app, db  # noqa: E402
from app.models import Member, User  # noqa: E402

app = create_app()

UPLOADS = ARTIFACTS / 'browser-uploads'
(UPLOADS / 'digital_ids').mkdir(parents=True, exist_ok=True)
(UPLOADS / 'digital_ids' / 'seed-id.png').write_bytes(b'\x89PNG\r\n\x1a\n')
app.config['UPLOAD_FOLDER'] = str(UPLOADS)

PASSWORD = 'Phase6-test-pw'

ACCOUNTS = [
    ('amina.browser@test.local', 'Amina Juma', '+255712000001', 'Bachelor of Computer Science', 'Year 2', True, True),
    ('pending.browser@test.local', 'Pending Student', '+255712000002', 'Bachelor of Information Technology', 'Year 1', False, True),
    ('admin.browser@test.local', 'Daniel Mushi', '+255712000003', 'Bachelor of Computer Science', 'Year 4', True, True),
]

with app.app_context():
    db.create_all()
    for email, name, phone, course, year, approved, active in ACCOUNTS:
        role = 'admin' if email.startswith('admin.') else 'student'
        user = User(
            email=email,
            role=role,
            is_approved=approved,
            is_active_account=active,
            is_super_admin=role == 'admin',
        )
        user.set_password(PASSWORD)
        db.session.add(user)
        db.session.flush()
        db.session.add(
            Member(
                user_id=user.id,
                full_name=name,
                phone=phone,
                course=course,
                year=year,
                digital_id_path='seed-id.png',
            )
        )
    db.session.commit()

print(f'database: {DB_PATH}')
print(f'password for every account: {PASSWORD}')
for email, name, *_ in ACCOUNTS:
    print(f'  {email}  ({name})')
