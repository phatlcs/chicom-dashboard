# -*- coding: utf-8 -*-
"""
Verify the 25 unmatched insight numbers by recomputing them from the same
data that data_computed.js carries. Each block prints PASS/FAIL/INFO with the
recomputed value next to the claimed value.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

BASE = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE / 'scripts'))
from audit_insights import parse_data_js  # noqa: E402

data = parse_data_js(BASE / 'dashboard' / 'data_computed.js')
KPI = data['KPI']
out = []


def line(tag: str, claim: str, computed: str, ok: bool):
    mark = '[PASS]' if ok else '[FAIL]'
    out.append(f'{mark} {tag:<14} claim={claim:<20} computed={computed}')


def info(tag: str, msg: str):
    out.append(f'[INFO] {tag:<14} {msg}')


# ── Q2: Amazon-platform voice ───────────────────────────────────────────────
# claim: 10.2% and 89.8%
soaRel = KPI['soaRelevant']
relevant = KPI['relevantPosts']
pct = soaRel / relevant * 100
line('Q2:10.2%', '10.2%', f'{pct:.1f}% ({soaRel}/{relevant})', abs(pct - 10.2) < 0.15)
line('Q2:89.8%', '89.8%', f'{100-pct:.1f}%', abs((100-pct) - 89.8) < 0.15)

# Q2: MT5: 1,304 — Shipping/logistics for SOA? or for some group?
q1_master = data['Q1_MASTER']
shipping_row = next((r for r in q1_master if 'hipping' in (r.get('en') or '').lower()), None)
info('Q2:1304', f'Q1_MASTER Shipping/logistics total = {shipping_row.get("count") if shipping_row else "?"} '
     f'(claim says MT5:1,304 which should be Shipping x persona subset, '
     f'inspect Q2_MATRIX for the specific cell)')

# Inspect Q2_MATRIX for value 1304
def find_value(obj, target, path=''):
    hits = []
    if isinstance(obj, dict):
        for k, v in obj.items():
            hits.extend(find_value(v, target, f'{path}.{k}'))
    elif isinstance(obj, list):
        for i, v in enumerate(obj):
            hits.extend(find_value(v, target, f'{path}[{i}]'))
    elif isinstance(obj, (int, float)) and obj == target:
        hits.append(path)
    return hits

hits1304 = find_value(data, 1304)
info('Q2:1304', f'1304 found at: {hits1304 if hits1304 else "NOWHERE in data"}')

# ── Q5: 604/2543 = 23.7% — verify 604 is a real count ───────────────────────
q5_top = data['Q5_TOP_NEG']
total_neg = KPI['negativeMentions']
top1 = q5_top[0] if q5_top else None
if top1:
    info('Q5:604', f'Q5_TOP_NEG #1 = "{top1.get("en") or top1.get("name")}" count={top1.get("count")}')
hits604 = find_value(data, 604)
info('Q5:604', f'604 found at: {hits604 if hits604 else "NOWHERE in data"}')
# verify the ratio claim
if hits604:
    info('Q5:23.7%', f'604/{total_neg} = {604/total_neg*100:.2f}% (claim 23.7%)')

# ── Q5: 402 + 250 + 189 = 1,177? ───────────────────────────────────────────
arith = 402 + 250 + 189
line('Q5:1177', '1,177 (sum 402+250+189)', f'{arith}', arith == 1177)
# What sums to 1177? Try top 4 Q5_TOP_NEG
top_counts = [r.get('count', 0) for r in q5_top[:6]]
info('Q5:1177', f'Q5_TOP_NEG top counts: {top_counts}; sum-of-4={sum(top_counts[:4])}; sum-of-5={sum(top_counts[:5])}')

# ── Q5: ~399 — derived ──────────────────────────────────────────────────────
info('Q5:399', '"OTHER ~399 are scam warnings" — derived prose, no data field to match')

# ── Q6: 9-11am window = 613 ─────────────────────────────────────────────────
q6 = data['Q6_BY_HOUR']
# Find hours 9,10,11
def hour_count(hour):
    for r in q6:
        h = r.get('hour') if isinstance(r, dict) else None
        if h == hour:
            return r.get('count', 0)
    return None
h9, h10, h11 = hour_count(9), hour_count(10), hour_count(11)
total_911 = sum(x for x in (h9, h10, h11) if x is not None)
info('Q6:613', f'Q6_BY_HOUR 9am={h9} 10am={h10} 11am={h11} sum={total_911} (claim 613)')
line('Q6:613', '613', f'{total_911}', total_911 == 613)

# ── Q7: 419 trigger mentions, 632 benefit mentions ──────────────────────────
q7_topics = data['Q7_TOPICS']
q7_benefits = data['Q7_BENEFITS']
sum_triggers = sum(r.get('count', 0) for r in q7_topics)
sum_benefits = sum(r.get('count', 0) for r in q7_benefits)
info('Q7:419', f'sum(Q7_TOPICS counts) = {sum_triggers} (claim 419)')
info('Q7:632', f'sum(Q7_BENEFITS counts) = {sum_benefits} (claim 632)')
line('Q7:419', '419', f'{sum_triggers}', sum_triggers == 419)
line('Q7:632', '632', f'{sum_benefits}', sum_benefits == 632)

# 3.8x — ratio of #1 benefit (392) to #2 benefit
if len(q7_benefits) >= 2:
    b1 = q7_benefits[0].get('count', 0)
    b2 = q7_benefits[1].get('count', 0)
    ratio = b1 / b2 if b2 else 0
    line('Q7:3.8x', '3.8x', f'{ratio:.2f}x ({b1}/{b2})', abs(ratio - 3.8) < 0.15)

# ── Q8: 80.5% of churn-signal posts are Seller (Amazon) ────────────────────
q8_persona = data.get('Q8_PERSONA')
info('Q8:80.5%', f'Q8_PERSONA = {json.dumps(q8_persona, ensure_ascii=False)[:300]}')
if isinstance(q8_persona, list):
    total_q8 = sum(r.get('count', 0) for r in q8_persona)
    seller_amz = next((r for r in q8_persona if 'amazon' in (r.get('name') or '').lower() and 'seller' in (r.get('name') or '').lower()), None)
    if seller_amz:
        pct8 = seller_amz['count'] / total_q8 * 100 if total_q8 else 0
        line('Q8:80.5%', '80.5%', f'{pct8:.1f}% ({seller_amz["count"]}/{total_q8})', abs(pct8 - 80.5) < 0.5)
elif isinstance(q8_persona, dict):
    total_q8 = sum(v for v in q8_persona.values() if isinstance(v, (int, float)))
    seller_amz_count = None
    for k, v in q8_persona.items():
        if 'amazon' in k.lower() and 'seller' in k.lower():
            seller_amz_count = v
    if seller_amz_count is not None:
        pct8 = seller_amz_count / total_q8 * 100
        line('Q8:80.5%', '80.5%', f'{pct8:.1f}% ({seller_amz_count}/{total_q8})', abs(pct8 - 80.5) < 0.5)

# ── Q9: 377 / 414 ───────────────────────────────────────────────────────────
q9 = data['Q9_BARRIERS']
sum_q9 = sum(r.get('count', 0) for r in q9)
info('Q9:414', f'sum(Q9_BARRIERS counts) = {sum_q9} (claim 414)')
line('Q9:414', '414', f'{sum_q9}', sum_q9 == 414)
# 377 = top N barriers?
top_q9 = sorted([r.get('count', 0) for r in q9], reverse=True)
info('Q9:377', f'top-3 sum={sum(top_q9[:3])}, top-4={sum(top_q9[:4])}, top-5={sum(top_q9[:5])}')

# ── Q10: 30.8% Apparel, 16.6% Home/Kitchen, 162 remaining ──────────────────
q10 = data['Q10_TOP']
total_q10 = sum(r.get('count', 0) for r in q10)
info('Q10:total', f'sum(Q10_TOP counts) = {total_q10}')
for r in q10[:3]:
    name = r.get('en') or r.get('name')
    pct = r.get('count', 0) / total_q10 * 100 if total_q10 else 0
    info(f'Q10:{name}', f'count={r["count"]} pct={pct:.1f}%')
top3_sum = sum(r.get('count', 0) for r in q10[:3])
rest_sum = total_q10 - top3_sum
info('Q10:rest', f'remaining 7 categories share = {rest_sum} (claim 162)')
line('Q10:162', '162', f'{rest_sum}', rest_sum == 162)

# ── Q11: 166 use signals ───────────────────────────────────────────────────
q11 = data['Q11_TOOLS']
sum_q11 = sum(r.get('count', 0) for r in q11)
info('Q11:166', f'sum(Q11_TOOLS counts) = {sum_q11} (claim 166)')
line('Q11:166', '166', f'{sum_q11}', sum_q11 == 166)

# ── Q12: 1688 — brand name, not a data field ──────────────────────────────
info('Q12:1688', '"Alibaba, 1688, Yiwu networks" — 1688 is a brand name, not a stat')

# ── Q14: 68% mixed ─────────────────────────────────────────────────────────
q14 = data['Q14_GROWTH']
team_row = next((r for r in q14 if 'team' in (r.get('en') or '').lower()), None)
if team_row:
    info('Q14:68%', f'Team building row: {json.dumps(team_row, ensure_ascii=False)}')

# ── Write ──────────────────────────────────────────────────────────────────
out_path = BASE / '_derived_verification.md'
out_path.write_text('\n'.join(out), encoding='utf-8')
print(f'Wrote {out_path.name}')
print(f'PASS: {sum(1 for l in out if l.startswith("[PASS]"))}')
print(f'FAIL: {sum(1 for l in out if l.startswith("[FAIL]"))}')
print(f'INFO: {sum(1 for l in out if l.startswith("[INFO]"))}')
