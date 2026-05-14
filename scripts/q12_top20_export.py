# -*- coding: utf-8 -*-
"""
Export top-20 longest accounting/tax-related posts from an annotated dataset,
split into two sheets — SOA (groups 1, 2) and EC (groups 3-9) — matching the
schema of docs/q12_accounting_tax_top20.xlsx.

Default input:  docs/all_groups_llm_classified_apr2026_annotated_v2.xlsx
Default output: docs/q12_accounting_tax_top20_apr2026.xlsx (+ per-sheet .csv)

Uses the same word-boundary keyword logic as the dashboard
(backend/keywords.py _mask_any + Q12_SERVICE_KW), so SOA/EC totals match the
counts shown in Q12 on the dashboard.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import pandas as pd

BASE = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE / 'backend'))

from keywords import Q12_SERVICE_KW, _mask_any  # noqa: E402

ACCOUNTING_TAX_KWS = next(iter(Q12_SERVICE_KW.values()))

SOA_IDS = [1, 2]
EC_IDS = [3, 4, 5, 6, 7, 8, 9]

OUT_COLUMNS = [
    '#', 'Persona', 'Sentiment', 'Type', 'Date',
    'Content (comment / post)', 'Context (parent post)', 'Link',
]

SHEET_SOA = 'SOA (Amazon sellers)'
SHEET_EC = 'EC (cross-border)'


def load(path: Path) -> pd.DataFrame:
    if path.suffix.lower() == '.csv':
        return pd.read_csv(path, encoding='utf-8-sig', low_memory=False)
    return pd.read_excel(path)


def top_n(df: pd.DataFrame, n: int) -> pd.DataFrame:
    d = df.copy()
    d['_len'] = d['content'].fillna('').astype(str).str.len()
    d = d.sort_values('_len', ascending=False).head(n).reset_index(drop=True)
    return pd.DataFrame({
        '#': range(1, len(d) + 1),
        'Persona':                  d.get('persona', ''),
        'Sentiment':                d.get('sentiment', ''),
        'Type':                     d.get('Type', d.get('type', '')),
        'Date':                     d.get('created_date', ''),
        'Content (comment / post)': d['content'],
        'Context (parent post)':    d.get('context', ''),
        'Link':                     d.get('link', ''),
    })[OUT_COLUMNS]


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument('--src', default='docs/all_groups_llm_classified_apr2026_annotated_v2.xlsx')
    p.add_argument('--out-stem', default='docs/q12_accounting_tax_top20_apr2026')
    p.add_argument('--n', type=int, default=20)
    args = p.parse_args()

    src = (BASE / args.src) if not Path(args.src).is_absolute() else Path(args.src)
    print(f'[q12] loading {src.name}')
    df = load(src)
    print(f'[q12]   {len(df):,} rows total')

    if 'relevant' in df.columns:
        df = df[df['relevant'] == True].copy()
        print(f'[q12]   {len(df):,} relevant')

    text = df['content'].fillna('').astype(str).str.lower()
    mask = _mask_any(text, ACCOUNTING_TAX_KWS)
    hits = df[mask].copy()
    print(f'[q12]   {len(hits):,} match accounting/tax (word-boundary, matches dashboard)')

    soa = hits[hits['group_id'].isin(SOA_IDS)]
    ec = hits[hits['group_id'].isin(EC_IDS)]
    print(f'[q12]     SOA (groups 1,2): {len(soa):,}')
    print(f'[q12]     EC  (groups 3-9): {len(ec):,}')

    soa_top = top_n(soa, args.n)
    ec_top = top_n(ec, args.n)

    out_stem = (BASE / args.out_stem) if not Path(args.out_stem).is_absolute() else Path(args.out_stem)
    out_xlsx = out_stem.with_suffix('.xlsx')
    out_csv_soa = out_stem.with_name(out_stem.name + '_SOA').with_suffix('.csv')
    out_csv_ec = out_stem.with_name(out_stem.name + '_EC').with_suffix('.csv')

    with pd.ExcelWriter(out_xlsx, engine='openpyxl') as w:
        soa_top.to_excel(w, sheet_name=SHEET_SOA, index=False)
        ec_top.to_excel(w, sheet_name=SHEET_EC, index=False)

    soa_top.to_csv(out_csv_soa, index=False, encoding='utf-8-sig')
    ec_top.to_csv(out_csv_ec, index=False, encoding='utf-8-sig')

    print(f'[q12] wrote {out_xlsx.relative_to(BASE)} ({out_xlsx.stat().st_size/1024:.1f} KB, 2 sheets)')
    print(f'[q12] wrote {out_csv_soa.relative_to(BASE)}')
    print(f'[q12] wrote {out_csv_ec.relative_to(BASE)}')


if __name__ == '__main__':
    main()
