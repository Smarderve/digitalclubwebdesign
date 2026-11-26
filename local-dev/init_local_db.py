"""Local-only schema bootstrap for the KIUT Digital Club Flask backend.

Why this exists
---------------
`flask db upgrade` cannot build an empty database in this repository. The first
Alembic revision (b033ca5044ab, down_revision = None) is an
`ALTER TABLE user ...` with no baseline `CREATE TABLE` migration, so on a fresh
database Alembic fails with `NoSuchTableError: user` before any table exists.
Every later revision only adds tables that post-date the original schema.

This script therefore builds the *current* schema from the SQLAlchemy models and
stamps Alembic at head, which is the standard local workaround for a missing
baseline migration. It creates no rows and no accounts.

Guards (deliberate, do not remove):
  * only a `sqlite:///` DATABASE_URL is accepted;
  * the resolved file must live inside the backend repository;
  * nothing is dropped, truncated or deleted;
  * `create_all()` is idempotent, so re-running is harmless.

It is NOT a production migration strategy and does not alter migration history.
Production/other environments must already have the baseline schema; the missing
baseline is recorded as a risk (R10/R16) in INTEGRATION_AUDIT.md.

Usage (from the backend directory, with the local .env in place):
    .venv/Scripts/python.exe ../../local-dev/init_local_db.py
"""

import os
import sys
from pathlib import Path

BACKEND = Path(__file__).resolve().parents[1] / "current-website" / "DIgital-Club"
sys.path.insert(0, str(BACKEND))
os.chdir(BACKEND)

from dotenv import load_dotenv  # noqa: E402

load_dotenv(BACKEND / ".env")

url = os.environ.get("DATABASE_URL", "")
if not url:
    sys.exit("refusing: DATABASE_URL is not set (create .env from local-dev/backend.env.example)")
if not url.startswith("sqlite:///"):
    sys.exit(f"refusing: DATABASE_URL is not a local sqlite URL: {url.split(':', 1)[0]}:...")

raw_path = url[len("sqlite:///"):]
db_path = Path(raw_path) if Path(raw_path).is_absolute() else BACKEND / "instance" / raw_path
db_path = db_path.resolve()
if BACKEND.resolve() not in db_path.parents:
    sys.exit(f"refusing: database path is outside the backend repository: {db_path}")

from app import create_app, db  # noqa: E402
from app import models  # noqa: E402,F401  (registers the model metadata)
from flask_migrate import stamp  # noqa: E402

app = create_app()
with app.app_context():
    db.create_all()
    stamp()

import sqlite3  # noqa: E402

with sqlite3.connect(db_path) as conn:
    tables = [r[0] for r in conn.execute(
        "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
    ).fetchall()]
    version = conn.execute("SELECT version_num FROM alembic_version").fetchone()
    user_rows = conn.execute("SELECT COUNT(*) FROM user").fetchone()[0] if "user" in tables else None
    member_rows = conn.execute("SELECT COUNT(*) FROM member").fetchone()[0] if "member" in tables else None

print(f"database: {db_path}")
print(f"tables:   {len(tables)}")
print(f"alembic:  {version[0] if version else 'unstamped'}")
print(f"rows:     user={user_rows} member={member_rows} (schema only, no accounts created)")
