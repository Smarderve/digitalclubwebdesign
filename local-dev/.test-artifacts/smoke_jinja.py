"""Phase 12 smoke: the original Jinja frontend still serves public pages.

Runs against a copy of the schema-only development database, so the real file
is never opened for writing.
"""
import os
import shutil
import sys
from pathlib import Path

BACKEND = Path(__file__).resolve().parent.parent.parent / 'current-website' / 'DIgital-Club'
COPY = Path(__file__).resolve().parent / 'smoke.sqlite'
shutil.copyfile(BACKEND / 'instance' / 'dev_local.db', COPY)

os.environ.update(
    {
        'DATABASE_URL': 'sqlite:///' + COPY.as_posix(),
        'SECRET_KEY': 'smoke-secret',
        'FLASK_ENV': 'development',
    }
)

sys.path.insert(0, str(BACKEND))
os.chdir(BACKEND)

from app import create_app  # noqa: E402

app = create_app()
client = app.test_client()
for path in ('/', '/about', '/events', '/news', '/login', '/api/v1/health'):
    response = client.get(path)
    print(f'{path}: {response.status_code} {len(response.data)} bytes')
    assert response.status_code < 500, path
print('JINJA_SMOKE_OK')
