"""
Build the dashboard: spam-filter raw Excel → compute aggregates → emit
dashboard/data_computed.js.

Single entry point. Run `python build_data.py` after dropping a new
raw Excel into the project root (e.g. all_groups_final_v3.xlsx).

Flow:
  1. Check if the annotated CSV exists and is newer than the raw .xlsx.
     If not, invoke run_spam_filter.run() to produce it.
  2. Load the annotated CSV.
  3. Call backend/compute.compute_all(df) — this also runs the LLM
     insight generator inside (cached by content-hash).
  4. Write dashboard/data_computed.js.

Flags:
  --raw <file.xlsx>   Use a different raw xlsx (default: all_groups_final_v2.xlsx)
  --force-filter      Re-run the spam filter even if annotated CSV is up-to-date
  --skip-filter       Skip spam filter; require annotated CSV to exist already
  --no-llm            Skip LLM insight generation (useful for offline dev)
"""

from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

import pandas as pd

BASE = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE / 'backend'))

from compute import compute_all  # noqa: E402
from run_spam_filter import run as run_spam_filter, FILTERED_DIR  # noqa: E402


def annotated_path_for(raw_xlsx: Path) -> Path:
    return FILTERED_DIR / f'{raw_xlsx.stem}_annotated.csv'


def needs_filter(raw_xlsx: Path, annotated_csv: Path) -> bool:
    if not annotated_csv.is_file():
        return True
    return raw_xlsx.stat().st_mtime > annotated_csv.stat().st_mtime


def main() -> None:
    p = argparse.ArgumentParser(description='Build dashboard/data_computed.js from raw Excel.')
    p.add_argument('--raw', default='all_groups_final_v2.xlsx',
                   help='Raw Excel filename (relative to project root or absolute).')
    p.add_argument('--force-filter', action='store_true',
                   help='Re-run the spam filter even if the annotated CSV looks up-to-date.')
    p.add_argument('--skip-filter', action='store_true',
                   help='Skip the spam filter; requires the annotated CSV to already exist.')
    p.add_argument('--no-llm', action='store_true',
                   help='Skip LLM insight generation (returns empty INSIGHTS).')
    args = p.parse_args()

    raw_xlsx = Path(args.raw)
    if not raw_xlsx.is_absolute():
        raw_xlsx = BASE / raw_xlsx
    annotated_csv = annotated_path_for(raw_xlsx)

    # ── Step 1: spam filter (auto-run if needed) ───────────────────────────
    if args.skip_filter:
        if not annotated_csv.is_file():
            sys.exit(f'ERROR: --skip-filter set but {annotated_csv} does not exist.')
        print(f'[build] Skipping filter — using existing {annotated_csv.name}')
    elif args.force_filter or needs_filter(raw_xlsx, annotated_csv):
        if not raw_xlsx.is_file():
            sys.exit(f'ERROR: raw file not found: {raw_xlsx}')
        print(f'[build] Filter needs to run (source: {raw_xlsx.name})')
        annotated_csv, _ = run_spam_filter(raw_xlsx)
    else:
        print(f'[build] Annotated CSV is up-to-date — skipping filter.')

    # ── Step 2: load annotated CSV ─────────────────────────────────────────
    print(f'[build] Loading {annotated_csv.name}…')
    df = pd.read_csv(annotated_csv, encoding='utf-8-sig', low_memory=False)
    print(f'[build]   {len(df):,} rows')

    # ── Step 3: compute aggregates + insights ─────────────────────────────
    print('[build] Computing aggregates + insights…')
    if args.no_llm:
        os.environ['INSIGHTS_SKIP_LLM'] = '1'
    js, info = compute_all(df)

    # ── Step 4: write data_computed.js ────────────────────────────────────
    out_path = BASE / 'dashboard' / 'data_computed.js'
    out_path.write_text(js, encoding='utf-8')

    size_kb = out_path.stat().st_size / 1024
    print(f'[build] Wrote {out_path.relative_to(BASE)} ({size_kb:.1f} KB)')
    print(f'[build] KPI: {info["totalPosts"]:,} total · {info["relevantPosts"]:,} relevant')


if __name__ == '__main__':
    main()
