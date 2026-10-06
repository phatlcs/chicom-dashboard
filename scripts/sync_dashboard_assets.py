# -*- coding: utf-8 -*-
"""
Keep the served dashboard copy identical to the source copy.

The same frontend ships from two directories:

  dashboard/                  source of truth (CLAUDE.md, local FastAPI, Vercel)
  nextjs/public/dashboard/    the copy Next.js / nginx actually serve at
                              /dashboard/* (every generated report loads it)

They drifted in both directions before 2026-10-06 — the Q6 no-time-data guard
and the Q9 empty-state card existed only in the served copy, the Q4
single-week guard only in the source — so a fix applied to one copy silently
missed the other. All writes therefore go through this script.

Usage:
  python scripts/sync_dashboard_assets.py            # copy source -> served
  python scripts/sync_dashboard_assets.py --check    # exit 1 if out of sync
"""
from __future__ import annotations

import sys
from pathlib import Path

BASE = Path(__file__).resolve().parent.parent
SRC = BASE / "dashboard"
DST = BASE / "nextjs" / "public" / "dashboard"
# EC2 deploy layout: CI rsyncs nextjs/public/ -> ~/app/public/, and
# backend/generate_range.py reads its template from <repo>/public/dashboard/.
ALT_DST = BASE / "public" / "dashboard"

ASSETS = (
    "index.html",
    "styles.css",
    "app.jsx",
    "shell.jsx",
    "q1_q2.jsx",
    "q3_q4.jsx",
    "q5_q6.jsx",
    "q7_q9.jsx",
    "q10_q14.jsx",
    "upload_panel.jsx",
)


def _destinations() -> list[Path]:
    return [DST] + ([ALT_DST] if ALT_DST.is_dir() else [])


def main() -> int:
    check = "--check" in sys.argv[1:]
    stale: list[str] = []

    for name in ASSETS:
        src = SRC / name
        if not src.is_file():
            print(f"MISSING source {src}", file=sys.stderr)
            return 2
        data = src.read_bytes()
        for dst_root in _destinations():
            dst = dst_root / name
            same = dst.is_file() and dst.read_bytes() == data
            if check:
                if not same:
                    stale.append(str(dst.relative_to(BASE)))
            elif not same:
                dst.parent.mkdir(parents=True, exist_ok=True)
                dst.write_bytes(data)
                print(f"synced {dst.relative_to(BASE)}")

    if check:
        if stale:
            print("dashboard assets out of sync with nextjs/public/dashboard:", file=sys.stderr)
            for s in stale:
                print(f"  {s}", file=sys.stderr)
            print("run: python scripts/sync_dashboard_assets.py", file=sys.stderr)
            return 1
        print(f"OK: {len(ASSETS)} dashboard assets in sync")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
