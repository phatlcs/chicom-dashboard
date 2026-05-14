# -*- coding: utf-8 -*-
"""
Audit dashboard/expert_insights.json against dashboard/data_computed.js.

For each Q1..Q14 panel:
  1. Strip HTML, extract every numeric token (counts and percentages) from
     scope/stats/findings/callouts/recommendations.
  2. Check whether each token appears in the underlying data (parsed from
     data_computed.js).
  3. For stats with a numeric `value` and a textual `note`, cross-check the
     value against the data row identified by the note's leading label.
  4. Emit a per-Q report — FOUND / NOT FOUND / CHECK details — and a summary.

Output: writes _audit_report.md and prints summary.
"""

from __future__ import annotations

import json
import re
import sys
from html import unescape
from pathlib import Path
from typing import Any

BASE = Path(__file__).resolve().parent.parent
JS_PATH = BASE / 'dashboard' / 'data_computed.js'
INS_PATH = BASE / 'dashboard' / 'expert_insights.json'
OUT_PATH = BASE / '_audit_report.md'


# ─────────────────────────────────────────────────────────────────────────────
# Parsers
# ─────────────────────────────────────────────────────────────────────────────

def parse_data_js(path: Path) -> dict:
    """Extract every `const NAME = <json>;` block from data_computed.js."""
    txt = path.read_text(encoding='utf-8')
    out: dict[str, Any] = {}
    # Match: const NAME = { ... };   OR   const NAME = [ ... ];
    pattern = re.compile(
        r'^\s*const\s+(\w+)\s*=\s*([\[{][\s\S]*?\])\s*;',
        flags=re.MULTILINE,
    )
    # Simpler: scan token-by-token using brace depth
    i = 0
    n = len(txt)
    while True:
        m = re.search(r'\bconst\s+(\w+)\s*=\s*', txt[i:])
        if not m:
            break
        name = m.group(1)
        start = i + m.end()
        if start >= n:
            break
        ch0 = txt[start]
        if ch0 not in '{[':
            i = start
            continue
        depth = 0
        j = start
        in_str = False
        esc = False
        while j < n:
            c = txt[j]
            if in_str:
                if esc:
                    esc = False
                elif c == '\\':
                    esc = True
                elif c == '"':
                    in_str = False
            else:
                if c == '"':
                    in_str = True
                elif c in '{[':
                    depth += 1
                elif c in '}]':
                    depth -= 1
                    if depth == 0:
                        j += 1
                        break
            j += 1
        body = txt[start:j]
        try:
            out[name] = json.loads(body)
        except json.JSONDecodeError as e:
            print(f'  WARN: could not parse {name}: {e}', file=sys.stderr)
        i = j
    return out


def load_insights(path: Path) -> dict:
    return json.loads(path.read_text(encoding='utf-8'))


# ─────────────────────────────────────────────────────────────────────────────
# Indexing
# ─────────────────────────────────────────────────────────────────────────────

def flatten(obj: Any, path: str = '') -> list[tuple[str, Any]]:
    """Yield (json-pointer-ish path, scalar) pairs."""
    rows: list[tuple[str, Any]] = []
    if isinstance(obj, dict):
        for k, v in obj.items():
            rows.extend(flatten(v, f'{path}.{k}'))
    elif isinstance(obj, list):
        for idx, v in enumerate(obj):
            rows.extend(flatten(v, f'{path}[{idx}]'))
    else:
        rows.append((path, obj))
    return rows


def build_number_index(data: dict) -> dict[float, list[tuple[str, Any]]]:
    """Map every numeric scalar in data → list of (path, neighbouring label).

    For a row {name: 'Foo', count: 80}, the count=80 entry will be tagged with
    the sibling 'Foo' for context.
    """
    idx: dict[float, list[tuple[str, Any]]] = {}
    # Walk every dict/list and for numeric values capture nearby labels.
    def walk(obj: Any, path: str, parent_label: str = ''):
        if isinstance(obj, dict):
            label = (
                obj.get('name')
                or obj.get('label')
                or obj.get('vn')
                or obj.get('en')
                or parent_label
            )
            for k, v in obj.items():
                walk(v, f'{path}.{k}', f'{label} · {k}' if label else k)
        elif isinstance(obj, list):
            for i, v in enumerate(obj):
                walk(v, f'{path}[{i}]', parent_label)
        elif isinstance(obj, (int, float)) and not isinstance(obj, bool):
            idx.setdefault(float(obj), []).append((path, parent_label))
    for k, v in data.items():
        walk(v, k, k)
    return idx


# ─────────────────────────────────────────────────────────────────────────────
# Extraction
# ─────────────────────────────────────────────────────────────────────────────

NUM_RE = re.compile(
    r'(?<![A-Za-z\d])'              # not preceded by letter/digit
    r'([+\-]?\d{1,3}(?:[,\d]{0,12})(?:\.\d+)?)'  # number with optional commas + decimals
    r'(\s*%|\s*pp|\s*pts|\s*mentions?|\s*posts?)?'
    r'(?![\d/])'                    # not part of a path like 12/14
)


def strip_html(s: str) -> str:
    return unescape(re.sub(r'<[^>]+>', ' ', s or ''))


def extract_numbers(text: str) -> list[tuple[float, str, str]]:
    """Return [(value, suffix, context_window)]. value is float; if a % sign was
    present, value is the percentage (e.g. 18.8 for "18.8%")."""
    text = strip_html(text)
    found: list[tuple[float, str, str]] = []
    for m in NUM_RE.finditer(text):
        raw = m.group(1).replace(',', '')
        try:
            v = float(raw)
        except ValueError:
            continue
        suffix = (m.group(2) or '').strip()
        start, end = m.span()
        window = text[max(0, start - 35): end + 35]
        found.append((v, suffix, window.strip()))
    return found


# ─────────────────────────────────────────────────────────────────────────────
# Verification
# ─────────────────────────────────────────────────────────────────────────────

def check_value(v: float, suffix: str, idx: dict[float, list]) -> tuple[str, list]:
    """Return ('FOUND', matches) or ('MISS', [])."""
    candidates = []
    # Exact match on the value
    candidates.extend(idx.get(v, []))
    # If a % was indicated, also accept the value as a fraction (e.g. 18.8 vs 0.188)
    if '%' in suffix:
        candidates.extend(idx.get(round(v / 100, 4), []))
    # Accept integer-valued floats matching int keys
    if v.is_integer():
        candidates.extend(idx.get(int(v), []))  # type: ignore[arg-type]
    return ('FOUND' if candidates else 'MISS', candidates[:4])


# ─────────────────────────────────────────────────────────────────────────────
# Per-Q stats cross-check  (stat.value vs data row identified by stat.note)
# ─────────────────────────────────────────────────────────────────────────────

def find_row_by_label(data: dict, q_keys: list[str], label_fragment: str) -> Any | None:
    """Look in each named list for a row whose name/label matches."""
    label_norm = re.sub(r'[\s/]+', ' ', label_fragment.lower()).strip()
    for k in q_keys:
        v = data.get(k)
        if isinstance(v, list):
            for row in v:
                if isinstance(row, dict):
                    candidates = [
                        row.get('name'), row.get('label'),
                        row.get('vn'),   row.get('en'),
                    ]
                    for c in candidates:
                        if c and label_norm in re.sub(r'[\s/]+', ' ', str(c).lower()):
                            return {'_source': k, **row}
    return None


# Map Q-number → list of data_computed.js keys associated with it
Q_DATA_KEYS = {
    'Q1':  ['Q1_MASTER', 'Q1_SUBTOPICS', 'MASTER_TOPIC_COUNTS'],
    'Q2':  ['Q2_MATRIX', 'Q2_MATRIX_SOA', 'Q2_MATRIX_EC', 'PERSONA_BY_GROUP'],
    'Q3':  ['Q3_SELLER_PROSPECT', 'Q3_SUBS'],
    'Q4':  ['Q4_TRENDS', 'Q4_EVENTS', 'Q4_WEEKLY'],
    'Q5':  ['Q5_BY_DAY', 'Q5_BY_DAY_SOA', 'Q5_BY_DAY_EC',
            'Q5_TOP_NEG', 'Q5_TOP_NEG_SOA', 'Q5_TOP_NEG_EC',
            'Q5_EARLY_DIST', 'Q5_PEAK_WINDOW', 'Q56_HEATMAP'],
    'Q6':  ['Q6_BY_HOUR', 'Q6_BY_HOUR_SOA', 'Q6_BY_HOUR_EC'],
    'Q7':  ['Q7_TOPICS', 'Q7_TOPICS_SOA', 'Q7_TOPICS_EC',
            'Q7_BENEFITS', 'Q7_BENEFITS_SOA', 'Q7_BENEFITS_EC',
            'Q7_SENTIMENT', 'Q7_SENTIMENT_SOA', 'Q7_SENTIMENT_EC',
            'Q7_POS_SUBS_SOA', 'Q7_POS_SUBS_EC'],
    'Q8':  ['Q8_TRIGGERS', 'Q8_PERSONA', 'Q8_TREND'],
    'Q9':  ['Q9_BARRIERS', 'Q9_Q7_PERSONAS', 'Q9_Q8_PERSONAS',
            'Q9_TOP_THREADS', 'Q9_TOP_THREADS_SOA', 'Q9_TOP_THREADS_EC'],
    'Q10': ['Q10_TOP', 'Q10_TOP_SOA', 'Q10_TOP_EC',
            'Q10_KEYWORDS', 'Q10_WEEKLY', 'Q10_SUBS_SOA', 'Q10_SUBS_EC'],
    'Q11': ['Q11_TOOLS', 'Q11_ISSUES', 'Q11_SATISFACTION'],
    'Q12': ['Q12_SERVICES', 'Q12_SERVICES_SOA', 'Q12_SERVICES_EC'],
    'Q13': ['Q13_COURSES', 'Q13_COURSES_SOA', 'Q13_COURSES_EC'],
    'Q14': ['Q14_GROWTH', 'Q14_GROWTH_SOA', 'Q14_GROWTH_EC'],
}


def audit_q(qkey: str, qins: dict, data: dict, num_idx: dict) -> dict:
    lines: list[str] = []
    nums_total = 0
    nums_found = 0
    misses: list[tuple[float, str, str]] = []

    # Walk every text field
    sources: list[tuple[str, str]] = []
    if isinstance(qins.get('scope'), str):
        sources.append(('scope', qins['scope']))
    for sec in ('stats', 'findings', 'callouts'):
        for i, item in enumerate(qins.get(sec) or []):
            if isinstance(item, dict):
                for fld in ('label', 'value', 'note', 'html'):
                    val = item.get(fld)
                    if isinstance(val, str):
                        sources.append((f'{sec}[{i}].{fld}', val))
            elif isinstance(item, str):
                sources.append((f'{sec}[{i}]', item))
    for i, rec in enumerate(qins.get('recommendations') or []):
        if isinstance(rec, str):
            sources.append((f'recommendations[{i}]', rec))

    for src_path, text in sources:
        for v, suffix, window in extract_numbers(text):
            # Skip year tokens — they're prose dates, not data claims.
            if v.is_integer() and 2020 <= v <= 2030 and not suffix:
                continue
            nums_total += 1
            status, matches = check_value(v, suffix, num_idx)
            if status == 'FOUND':
                nums_found += 1
            else:
                misses.append((v, suffix, window))
                lines.append(f'    - MISS  {v:g}{suffix or ""}  @ {src_path}  («{window}»)')

    # Cross-check stats: when label+value+note are all present
    cross_lines: list[str] = []
    q_keys = Q_DATA_KEYS.get(qkey, [])
    for i, stat in enumerate(qins.get('stats') or []):
        if not isinstance(stat, dict):
            continue
        val_str = str(stat.get('value', ''))
        note = str(stat.get('note', ''))
        label = str(stat.get('label', ''))
        # try numeric value extraction
        val_nums = extract_numbers(val_str)
        note_nums = extract_numbers(note)
        # Try to identify a data row from the note's leading label
        name_match = re.match(r'\s*([^()·\d]+?)(?:\s*\(|\s*·|\s*$)', note)
        row_label = (name_match.group(1).strip() if name_match else '')
        row = find_row_by_label(data, q_keys, row_label) if row_label else None
        if row:
            row_value_hits = []
            for vv, suf, _ in val_nums + note_nums:
                # Check if vv matches any numeric in row
                for fld_name, fld_val in row.items():
                    if fld_name.startswith('_'):
                        continue
                    if isinstance(fld_val, (int, float)) and not isinstance(fld_val, bool):
                        if float(fld_val) == vv or (suf and '%' in suf and float(fld_val) == vv):
                            row_value_hits.append((vv, fld_name, fld_val))
            cross_lines.append(
                f'    · stat[{i}] "{label}" → matched data row from {row["_source"]}: '
                f'{row.get("name") or row.get("label")} → '
                f'{[h for h in row_value_hits] if row_value_hits else "no field-level match"}'
            )

    return {
        'nums_total': nums_total,
        'nums_found': nums_found,
        'misses': misses,
        'miss_lines': lines,
        'cross_lines': cross_lines,
    }


# ─────────────────────────────────────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────────────────────────────────────

def main() -> None:
    print('Parsing data_computed.js …')
    data = parse_data_js(JS_PATH)
    print(f'  parsed {len(data)} const blocks')

    print('Building number index …')
    num_idx = build_number_index(data)
    print(f'  indexed {sum(len(v) for v in num_idx.values()):,} numeric occurrences, '
          f'{len(num_idx):,} unique values')

    print('Loading expert_insights.json …')
    ins = load_insights(INS_PATH)

    report = ['# Insight audit — `dashboard/expert_insights.json` vs `dashboard/data_computed.js`',
              '',
              f'- Data file consts parsed: **{len(data)}**',
              f'- Distinct numeric values in data: **{len(num_idx):,}**',
              '',
              '## Per-Q results',
              '']

    overall_total = 0
    overall_found = 0
    per_q_summary: list[tuple[str, int, int, int]] = []

    for q in [f'Q{i}' for i in range(1, 15)]:
        qins = ins.get(q)
        if not qins:
            continue
        r = audit_q(q, qins, data, num_idx)
        overall_total += r['nums_total']
        overall_found += r['nums_found']
        misses_n = r['nums_total'] - r['nums_found']
        per_q_summary.append((q, r['nums_total'], r['nums_found'], misses_n))

        report.append(f'### {q}')
        report.append(f'- numbers extracted: **{r["nums_total"]}**')
        report.append(f'- matched in data: **{r["nums_found"]}** '
                      f'({(r["nums_found"]/max(r["nums_total"],1))*100:.0f}%)')
        report.append(f'- unmatched: **{misses_n}**')
        if r['miss_lines']:
            report.append('')
            report.append('  Unmatched numbers:')
            report.extend(r['miss_lines'])
        if r['cross_lines']:
            report.append('')
            report.append('  Stat→data row cross-check:')
            report.extend(r['cross_lines'])
        report.append('')

    report.insert(5, '')
    report.insert(5, f'**Overall: {overall_found}/{overall_total} insight numbers '
                    f'({overall_found/max(overall_total,1)*100:.0f}%) matched a value in data_computed.js.**')

    OUT_PATH.write_text('\n'.join(report), encoding='utf-8')
    print(f'\nWrote {OUT_PATH.name} ({OUT_PATH.stat().st_size/1024:.1f} KB)')
    print(f'\nSummary:')
    print(f'  Overall: {overall_found}/{overall_total} matched '
          f'({overall_found/max(overall_total,1)*100:.1f}%)')
    print(f'  Per-Q:')
    for q, t, f_, m in per_q_summary:
        pct = (f_ / max(t, 1)) * 100
        flag = '' if m == 0 else f'  ! {m} unmatched'
        print(f'    {q}: {f_}/{t} ({pct:.0f}%){flag}'.encode('ascii', 'replace').decode())


if __name__ == '__main__':
    main()
