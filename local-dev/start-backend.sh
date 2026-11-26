#!/usr/bin/env bash
# Start the Flask backend for local integration development.
#
# Uses the `app` factory (create_app) instead of main.py on purpose:
# main.py runs init_db() at import time, which creates a hardcoded
# admin@digitalclub.kiut.ac.tz / admin123 super-admin. Phase 4 forbids
# creating default administrator accounts, so the factory is started directly.
#
# Requires: local-dev/README.md steps 1-3 (venv + .env + schema).
set -euo pipefail
cd "$(dirname "$0")/../current-website/DIgital-Club"
exec .venv/Scripts/python.exe -m flask --app app run --host 127.0.0.1 --port 5051
