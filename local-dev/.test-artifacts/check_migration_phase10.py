"""Synthetic migration check for e20261127130000 (social graph).

Builds the ORM schema, drops the three new tables, stamps the previous revision,
then runs the real ``flask db upgrade`` and ``flask db downgrade``.
"""
import os
import subprocess
import sys
from pathlib import Path

BACKEND = Path(__file__).resolve().parent.parent.parent / 'current-website' / 'DIgital-Club'
DB = Path(__file__).resolve().parent / 'mig10.sqlite'
if DB.exists():
    DB.unlink()

URL = 'sqlite:///' + DB.as_posix()
# Must be set before the app is created, otherwise create_app() opens the
# development database.
os.environ['DATABASE_URL'] = URL
os.environ['SECRET_KEY'] = 'migration-check'
env = dict(os.environ, DATABASE_URL=URL, SECRET_KEY='migration-check', FLASK_ENV='development')
env.pop('FLASK_APP', None)

sys.path.insert(0, str(BACKEND))
os.chdir(BACKEND)

from app import create_app, db  # noqa: E402
from sqlalchemy import inspect, text  # noqa: E402

app = create_app()
with app.app_context():
    print('DB:', db.engine.url)
    assert str(db.engine.url).endswith('/mig10.sqlite'), 'refusing to touch another database'
    db.create_all()
    for table in ('member_follow', 'member_follow_request', 'member_block'):
        db.session.execute(text(f'DROP TABLE {table}'))
    db.session.execute(text('CREATE TABLE alembic_version (version_num VARCHAR(32) NOT NULL)'))
    db.session.execute(
        text("INSERT INTO alembic_version VALUES ('d20261127120000')")
    )
    db.session.commit()


def run(*args):
    result = subprocess.run(
        [sys.executable, '-m', 'flask', '--app', 'app:create_app', *args],
        cwd=BACKEND,
        env=env,
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        print(result.stdout)
        print(result.stderr)
        raise SystemExit(f'FAILED: flask {" ".join(args)}')
    return result.stdout.strip()


def tables():
    with app.app_context():
        return set(inspect(db.engine).get_table_names())


print(run('db', 'upgrade'))
after_upgrade = tables()
for table in ('member_follow', 'member_follow_request', 'member_block'):
    assert table in after_upgrade, f'{table} missing after upgrade'
print('UPGRADE_OK', sorted(t for t in after_upgrade if t.startswith('member_')))

print(run('db', 'downgrade', 'd20261127120000'))
after_downgrade = tables()
for table in ('member_follow', 'member_follow_request', 'member_block'):
    assert table not in after_downgrade, f'{table} still present after downgrade'
print('DOWNGRADE_OK')
