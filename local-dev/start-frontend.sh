#!/usr/bin/env bash
# Start the React/Vite frontend for local integration development.
# API calls to /api/* and /healthz are proxied to the Flask backend on :5051
# by vite.config.ts, so the browser only ever talks to one origin.
set -euo pipefail
cd "$(dirname "$0")/../new-website-design"
exec npm run dev
