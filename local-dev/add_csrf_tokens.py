"""One-off: add the hidden CSRF field to every POST <form> in app/templates.

Flask-WTF's CSRFProtect is enabled application-wide (decision D5), so each
server-rendered form must carry a token or it will be rejected with 400.
This script is idempotent: forms that already contain ``csrf_token`` are skipped.

Usage (from the backend repo root):
    python local-dev/add_csrf_tokens.py           # apply
    python local-dev/add_csrf_tokens.py --check   # report only, exit 1 if missing
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent / 'current-website' / 'DIgital-Club' / 'app' / 'templates'
TOKEN = '<input type="hidden" name="csrf_token" value="{{ csrf_token() }}">'

FORM_OPEN = re.compile(r'<form\b', re.IGNORECASE)
METHOD_POST = re.compile(r'\bmethod\s*=\s*["\']?\s*post\b', re.IGNORECASE)
FORM_CLOSE = re.compile(r'</form\s*>', re.IGNORECASE)


def find_tag_end(text: str, start: int) -> int:
    """Index of the ``>`` closing the tag that starts at ``start``."""
    quote = None
    i = start
    while i < len(text):
        ch = text[i]
        if quote:
            if ch == quote:
                quote = None
        elif ch in ('"', "'"):
            quote = ch
        elif ch == '>':
            return i
        i += 1
    return -1


def indent_for(text: str, form_start: int, newline: str) -> str:
    line_start = text.rfind('\n', 0, form_start) + 1
    line = text[line_start:form_start]
    leading = line[: len(line) - len(line.lstrip())]
    return leading + '    '


def process(path: Path, check_only: bool) -> tuple[int, int]:
    text = path.read_text(encoding='utf-8')
    newline = '\r\n' if '\r\n' in text else '\n'
    out = text
    added = skipped = 0
    # Walk backwards so earlier insertion points stay valid.
    spans = []
    for match in FORM_OPEN.finditer(text):
        tag_end = find_tag_end(text, match.end())
        if tag_end == -1:
            continue
        tag = text[match.start(): tag_end + 1]
        if not METHOD_POST.search(tag):
            continue
        close = FORM_CLOSE.search(text, tag_end)
        body = text[tag_end + 1: close.start() if close else len(text)]
        if 'csrf_token' in body:
            skipped += 1
            continue
        spans.append((tag_end + 1, match.start()))

    for insert_at, form_start in reversed(spans):
        indent = indent_for(text, form_start, newline)
        out = out[:insert_at] + newline + indent + TOKEN + out[insert_at:]
        added += 1

    if added and not check_only:
        path.write_text(out, encoding='utf-8')
    return added, skipped


def main() -> int:
    check_only = '--check' in sys.argv
    total_added = total_skipped = 0
    files_changed = []
    for path in sorted(ROOT.rglob('*.html')):
        added, skipped = process(path, check_only)
        if added:
            files_changed.append((path.relative_to(ROOT).as_posix(), added))
        total_added += added
        total_skipped += skipped

    mode = 'MISSING' if check_only else 'ADDED'
    for name, added in files_changed:
        print(f'{mode} {added:>2}  {name}')
    print(f'\nforms with token already: {total_skipped}')
    print(f'forms {"missing a token" if check_only else "given a token"}: {total_added}')
    if check_only and total_added:
        return 1
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
