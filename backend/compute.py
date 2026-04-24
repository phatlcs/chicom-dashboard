"""
Compute all dashboard aggregates from a DataFrame.
Returns (js_string, info_dict).
"""
import json
import math
import re
from collections import defaultdict

import pandas as pd

from keywords import (
    extract_q3_subs,
    extract_q7, extract_q8, extract_q9, extract_q9_personas,
    extract_q10, extract_q11, extract_q11_issues, extract_q11_satisfaction,
    extract_q12, extract_q13, extract_q14,
)

# ── Static lookups ──────────────────────────────────────────────────────────

GROUP_INFO = {
    1: {'id': 'soa1', 'name': 'Amazon Sellers Viet Nam',             'short': 'Amazon Sellers VN', 'type': 'SOA'},
    2: {'id': 'soa2', 'name': 'Cộng đồng Amazon Sellers VN',         'short': 'CĐ Amazon Sellers', 'type': 'SOA'},
    3: {'id': 'ec1',  'name': 'Cộng Đồng MMO',                       'short': 'MMO',                'type': 'EC'},
    4: {'id': 'ec2',  'name': 'Cuồng Phong Hội (Crossborder CBEC)',  'short': 'Cuồng Phong Hội',   'type': 'EC'},
    5: {'id': 'ec3',  'name': 'Cộng Đồng Dropshipping & Shopify VN', 'short': 'Dropship & Shopify', 'type': 'EC'},
    6: {'id': 'ec4',  'name': 'Chuyện Nhà Bán (Shopee/TikTok)',      'short': 'Chuyện Nhà Bán',    'type': 'EC'},
    7: {'id': 'ec5',  'name': 'Etsy To Go',                          'short': 'Etsy To Go',         'type': 'EC'},
    8: {'id': 'ec6',  'name': 'Etsy E-Z Cộng Đồng Etsy Việt',        'short': 'Etsy E-Z',           'type': 'EC'},
    9: {'id': 'ec7',  'name': 'Cộng đồng ETSY Việt Nam',             'short': 'ETSY VN',            'type': 'EC'},
}

TOPIC_MAP = {
    'Chiến lược, kinh nghiệm và hỗ trợ cộng đồng bán hàng Amazon':             'mt1',
    'Cảnh báo rủi ro và lừa đảo khi kinh doanh Amazon':                         'mt2',
    'Vận hành và quản lý tài khoản Amazon Seller':                               'mt3',
    'Dịch vụ và giải pháp pháp lý, thương hiệu và công cụ cho Seller Amazon':   'mt4',
    'Vận chuyển, logistics và fulfillment Amazon':                                'mt5',
    'Thanh toán, tài khoản và các vấn đề tài chính quốc tế cho Seller Amazon':  'mt6',
    'Kinh doanh xuất nhập khẩu và thương mại điện tử xuyên biên giới':           'mt7',
    'Kinh doanh, vận hành và tối ưu hóa bán hàng Amazon':                        'mt8',
}

# Official 9-topic taxonomy. MT9 stays in the list even though the current
# classifier never emits it — shown at 0% rather than hidden, so stakeholders
# see the full taxonomy and know the slot exists.
MASTER_TOPICS = [
    {'id': 'mt1', 'vn': 'Chiến lược, kinh nghiệm & hỗ trợ cộng đồng bán hàng',  'en': 'Strategy, experience & community support'},
    {'id': 'mt2', 'vn': 'Cảnh báo rủi ro & lừa đảo khi kinh doanh Amazon',        'en': 'Risk warnings & fraud'},
    {'id': 'mt3', 'vn': 'Vận hành và quản lý tài khoản Amazon Seller',             'en': 'Account operations & management'},
    {'id': 'mt4', 'vn': 'Dịch vụ & giải pháp pháp lý, thương hiệu',               'en': 'Legal, branding & services'},
    {'id': 'mt5', 'vn': 'Vận chuyển, logistics và fulfillment',                    'en': 'Shipping, logistics & fulfillment'},
    {'id': 'mt6', 'vn': 'Thanh toán, tài khoản và tài chính quốc tế',             'en': "Payment, accounts & int'l finance"},
    {'id': 'mt7', 'vn': 'Kinh doanh xuất nhập khẩu & TMĐT xuyên biên giới',       'en': 'Import-export & cross-border'},
    {'id': 'mt8', 'vn': 'Kinh doanh, vận hành và tối ưu hóa bán hàng Amazon',     'en': 'Business, ops & Amazon optimization'},
    {'id': 'mt9', 'vn': 'Khóa học và thách thức kinh doanh Amazon',               'en': 'Courses & Amazon challenges'},
]

PERSONAS = [
    {'id': 'p_seller_az',   'short': 'Seller',           'segment': 'Amazon', 'vn': 'Seller (Amazon)'},
    {'id': 'p_prospect_az', 'short': 'Prospect',         'segment': 'Amazon', 'vn': 'Prospect (Amazon)'},
    {'id': 'p_svc_az',      'short': 'Service Provider', 'segment': 'Amazon', 'vn': 'Service Provider (Amazon)'},
    {'id': 'p_svc_cbec',    'short': 'Service Provider', 'segment': 'CBEC',   'vn': 'Service Provider (CBEC)'},
    {'id': 'p_prospect_ot', 'short': 'Prospect',         'segment': 'Others', 'vn': 'Prospect (Others)'},
    {'id': 'p_seller_ot',   'short': 'Seller',           'segment': 'Others', 'vn': 'Seller (Others)'},
]

PERSONA_MAP = {
    'Seller (Amazon)':           'p_seller_az',
    'Prospect (Amazon)':         'p_prospect_az',
    'Service Provider (Amazon)': 'p_svc_az',
    'Service Provider (CBEC)':   'p_svc_cbec',
    'Prospect (Others)':         'p_prospect_ot',
    'Seller (Others)':           'p_seller_ot',
}

TC = [
    'oklch(0.62 0.15 260)', 'oklch(0.62 0.15 25)',  'oklch(0.62 0.15 155)',
    'oklch(0.62 0.15 60)',  'oklch(0.62 0.15 320)', 'oklch(0.62 0.15 200)',
    'oklch(0.62 0.15 90)',  'oklch(0.62 0.15 290)', 'oklch(0.62 0.15 0)',
]

DAYS_VN = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']
DAYS_EN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

SOA_IDS = [1, 2]
EC_IDS  = [3, 4, 5, 6, 7, 8, 9]

SUBTOPICS = {
    'mt1': ['Chia sẻ chiến lược Amazon','Kinh nghiệm launch SP mới','Hỗ trợ seller mới bắt đầu','Networking seller VN'],
    'mt2': ['Cảnh báo scam Amazon','Lừa đảo PPC agency','Rủi ro suspension','Phishing & hijack'],
    'mt3': ['Tạo & verify tài khoản','Health score & metrics','Tool quản lý listing','Xử lý A-Z claim'],
    'mt4': ['Brand registry','Kế toán US','Pháp lý LLC','Trademark & IP'],
    'mt5': ['FBA vs FBM','Forwarder VN→US','Cước vận chuyển','Kho 3PL ở Mỹ'],
    'mt6': ['Payoneer & tài khoản US','Thẻ Visa virtual','Quy đổi USD→VND','Hoàn thuế VAT EU'],
    'mt7': ['TMĐT xuyên biên giới','Dropshipping CBEC','Nguồn hàng TQ','Thủ tục XNK'],
    'mt8': ['PPC optimization','SEO listing','A/B test main image','Tối ưu CVR'],
    'mt9': ['Khóa học mentor','Thử thách 30 ngày','Bootcamp PPC','Coaching 1-1'],
}

Q3_SUBS_VN = [
    'Cảnh báo rủi ro & lừa đảo khi kinh doanh Amazon',
    'Kinh nghiệm & chiến lược bán hàng trên Amazon',
    'Dịch vụ & giải pháp pháp lý, thương hiệu',
    'Thuế và chi phí kinh doanh trên Amazon',
    'Khó khăn & thách thức khi bán hàng Amazon',
    'Dịch vụ hỗ trợ & tối ưu tài khoản',
    'Hợp tác, hỗ trợ & vận hành bán hàng',
    'Vấn đề xác minh, khoá, rủi ro tài khoản',
    'Sự kiện, đào tạo và kết nối cộng đồng',
    'Kinh doanh xuất nhập khẩu & quốc tế',
    'Dịch vụ vận chuyển và fulfillment',
    'Chia sẻ, học hỏi và hợp tác kinh nghiệm',
    'Hướng dẫn & hỗ trợ người mới bắt đầu',
    'Kinh doanh Amazon FBA và FBM',
    'Vấn đề & thủ tục thanh toán, mở OTP',
    'Bán hàng và vận hành Amazon',
    'Thanh toán Amazon qua Payoneer',
    'Vấn đề thanh toán quốc tế',
    'Ưu đãi Helium 10, tool seller Amazon',
]

def _j(v):
    return json.dumps(v, ensure_ascii=False, indent=2)


def _normalize_master_topic(series: pd.Series) -> pd.Series:
    """Strip numbered prefixes ('6. …') and fuzzy-merge typo variants
    ('rủi ko/zo' → 'rủi ro', 'tài khoán' → 'tài khoản', etc.) into the
    canonical TOPIC_MAP keys so they all route to the right mt_id."""
    import difflib
    clean = series.fillna('').astype(str).str.strip()
    # Strip leading "N. " or "N) " numbering
    clean = clean.str.replace(r'^\d+\s*[\.\)]\s*', '', regex=True)

    canonical_keys = list(TOPIC_MAP.keys())

    def match(val: str) -> str:
        if not val or val in TOPIC_MAP:
            return val
        # Try fuzzy match against the canonical MT labels
        m = difflib.get_close_matches(val, canonical_keys, n=1, cutoff=0.82)
        return m[0] if m else val

    return clean.map(match)


def _normalize_sub_topics(series: pd.Series) -> pd.Series:
    """Cluster near-duplicate sub_topic values (LLM typo artifacts).
    Walks from highest-count label down; for each, pulls in variants with
    difflib similarity >= 0.88 and re-labels them to the dominant form."""
    import difflib
    clean = series.fillna('').astype(str).str.strip()
    vc = clean[clean != ''].value_counts()
    labels = list(vc.index)
    canonical = {}
    unassigned = set(labels)
    for label in labels:  # descending by count
        if label not in unassigned:
            continue
        canonical[label] = label
        unassigned.discard(label)
        close = difflib.get_close_matches(label, list(unassigned), n=20, cutoff=0.88)
        for m in close:
            canonical[m] = label
            unassigned.discard(m)
    return clean.map(lambda x: canonical.get(x, x) if x else x)


def compute_all(df: pd.DataFrame):
    """
    df: raw DataFrame from uploaded CSV (or from file).
    Returns (js_string, info_dict).
    """
    df = df.copy()
    df['created_date'] = pd.to_datetime(df['created_date'], errors='coerce')
    if 'master_topic' in df.columns:
        df['master_topic'] = _normalize_master_topic(df['master_topic'])
    df['mt_id']       = df['master_topic'].map(TOPIC_MAP) if 'master_topic' in df.columns else None
    df['persona_id']  = df['persona'].map(PERSONA_MAP)    if 'persona'       in df.columns else None
    if 'sub_topic' in df.columns:
        df['sub_topic'] = _normalize_sub_topics(df['sub_topic'])

    # Determine relevant column
    if 'relevant' in df.columns:
        rel = df[df['relevant'] == True].copy()
    else:
        rel = df.copy()

    # ── KPIs ────────────────────────────────────────────────────────────────
    # Real sub-topic count (after fuzzy normalization, excluding blanks)
    if 'sub_topic' in rel.columns:
        st = rel['sub_topic'].dropna().astype(str).str.strip()
        n_sub = int(st[st != ''].nunique())
    else:
        n_sub = 0

    kpi = {
        'totalPosts':       int(len(df)),
        'relevantPosts':    int(len(rel)),
        'negativeMentions': int((rel['sentiment'] == 'negative').sum()) if 'sentiment' in rel.columns else 0,
        'positiveMentions': int((rel['sentiment'] == 'positive').sum()) if 'sentiment' in rel.columns else 0,
        'activeGroups':     len(GROUP_INFO),
        'analysedGroups':   len(SOA_IDS) + len(EC_IDS),
        'soaGroups':        len(SOA_IDS),
        'ecGroups':         len(EC_IDS),
        'masterTopics':     len(MASTER_TOPICS),
        'subTopics':        n_sub,
    }

    # ── Months & weeks ──────────────────────────────────────────────────────
    rel['month'] = rel['created_date'].dt.to_period('M').astype(str).replace('NaT', None)
    months = sorted(m for m in rel['month'].dropna().unique() if m and m != 'NaT')

    rel['week_start'] = rel['created_date'].dt.to_period('W').apply(
        lambda p: p.start_time if p is not pd.NaT else None
    )
    week_starts = sorted(rel['week_start'].dropna().unique().tolist())
    weeks = [ws.strftime('%b %d').replace(' 0', ' ') for ws in week_starts]

    # Auto-detect spike weeks (volume > 1.5× average baseline)
    weekly_totals = [int((rel['week_start'] == ws).sum()) for ws in week_starts]
    q4_events = []
    if weekly_totals:
        avg = sum(weekly_totals) / len(weekly_totals)
        threshold = avg * 1.5
        for i, cnt in enumerate(weekly_totals):
            if cnt > threshold and i < len(weeks):
                pct = round((cnt / avg - 1) * 100)
                q4_events.append({
                    'week':  i,
                    'label': f'Spike {weeks[i]} · +{pct}%',
                })
        q4_events = sorted(q4_events, key=lambda e: -weekly_totals[e['week']])[:5]
        q4_events.sort(key=lambda e: e['week'])

    # ── Overview (community + persona breakdowns, SOV narrative) ───────────
    comm_counts = []
    for gid, info in GROUP_INFO.items():
        cnt = int((rel['group_id'] == gid).sum()) if 'group_id' in rel.columns else 0
        comm_counts.append({**info, 'count': cnt})
    comm_counts.sort(key=lambda x: -x['count'])

    total_rel = max(1, sum(c['count'] for c in comm_counts))
    soa_total = sum(c['count'] for c in comm_counts if c['type'] == 'SOA')
    ec_total  = sum(c['count'] for c in comm_counts if c['type'] == 'EC')
    top_comm  = comm_counts[0] if comm_counts else {'name': '—', 'count': 0}

    persona_counts = []
    for p in PERSONAS:
        cnt = int((rel['persona_id'] == p['id']).sum()) if 'persona_id' in rel.columns else 0
        persona_counts.append({**p, 'count': cnt, 'pct': round(cnt / total_rel * 100, 1)})
    persona_counts.sort(key=lambda x: -x['count'])

    overview = {
        'communities':      comm_counts,
        'personas':         persona_counts,
        'totalRelevant':    int(total_rel),
        'soaTotal':         int(soa_total),
        'ecTotal':          int(ec_total),
        'soaPct':           round(soa_total / total_rel * 100),
        'ecPct':            round(ec_total  / total_rel * 100),
        'soaGroupCount':    len(SOA_IDS),
        'ecGroupCount':     len(EC_IDS),
        'monthsCount':      len(months),
        'topCommunity':     top_comm,
        'topCommunityPct':  round(top_comm['count'] / total_rel * 100, 1),
        'topPersona':       persona_counts[0] if persona_counts else None,
        'secondPersona':    persona_counts[1] if len(persona_counts) > 1 else None,
    }

    # ── Q1 weights ──────────────────────────────────────────────────────────
    q1_weights = {mt['id']: {} for mt in MASTER_TOPICS}
    for gid in SOA_IDS + EC_IDS:
        g = GROUP_INFO[gid]
        grp = rel[rel['group_id'] == gid] if 'group_id' in rel.columns else rel.iloc[0:0]
        total = max(1, len(grp))
        for mt in MASTER_TOPICS:
            cnt = int((grp['mt_id'] == mt['id']).sum()) if 'mt_id' in grp.columns else 0
            q1_weights[mt['id']][g['id']] = round(cnt / total * 100, 1)

    q1_master = []
    for i, mt in enumerate(MASTER_TOPICS):
        vals = list(q1_weights[mt['id']].values())
        avg = round(sum(vals) / max(1, len(vals)), 1)
        q1_master.append({**mt, 'weight': avg, 'color': TC[i]})
    q1_master.sort(key=lambda x: -x['weight'])

    # ── Q2 matrix (global + per-segment SOA/EC) ─────────────────────────────
    q2_matrix     = {mt['id']: {p['id']: 0 for p in PERSONAS} for mt in MASTER_TOPICS}
    q2_matrix_soa = {mt['id']: {p['id']: 0 for p in PERSONAS} for mt in MASTER_TOPICS}
    q2_matrix_ec  = {mt['id']: {p['id']: 0 for p in PERSONAS} for mt in MASTER_TOPICS}
    if 'mt_id' in rel.columns and 'persona_id' in rel.columns:
        has_gid = 'group_id' in rel.columns
        for _, row in rel.iterrows():
            mid = row['mt_id']
            pid = row['persona_id']
            if pd.notna(mid) and pd.notna(pid) and mid in q2_matrix and pid in q2_matrix.get(mid, {}):
                q2_matrix[mid][pid] += 1
                if has_gid:
                    gid = row['group_id']
                    if gid in SOA_IDS:
                        q2_matrix_soa[mid][pid] += 1
                    elif gid in EC_IDS:
                        q2_matrix_ec[mid][pid] += 1

    # ── Q3 ──────────────────────────────────────────────────────────────────
    seller_total   = sum(q2_matrix[mt['id']].get('p_seller_az', 0) + q2_matrix[mt['id']].get('p_seller_ot', 0)   for mt in MASTER_TOPICS)
    prospect_total = sum(q2_matrix[mt['id']].get('p_prospect_az', 0) + q2_matrix[mt['id']].get('p_prospect_ot', 0) for mt in MASTER_TOPICS)
    q3_sp = []
    for mt in MASTER_TOPICS:
        seller   = q2_matrix[mt['id']].get('p_seller_az', 0) + q2_matrix[mt['id']].get('p_seller_ot', 0)
        prospect = q2_matrix[mt['id']].get('p_prospect_az', 0) + q2_matrix[mt['id']].get('p_prospect_ot', 0)
        spct = round(seller   / max(1, seller_total)   * 100, 1)
        ppct = round(prospect / max(1, prospect_total) * 100, 1)
        q3_sp.append({'id': mt['id'], 'vn': mt['vn'], 'en': mt['en'],
                      'seller': seller, 'prospect': prospect,
                      'sellerPct': spct, 'prospectPct': ppct, 'diff': round(spct - ppct, 1)})

    q3_subs = extract_q3_subs(rel) if 'content' in rel.columns and 'persona' in rel.columns else []

    # ── Q4 trends ───────────────────────────────────────────────────────────
    q4_trends = []
    for i, mt in enumerate(MASTER_TOPICS):
        pts = []
        for m in months:
            cnt = int(((rel['month'] == m) & (rel['mt_id'] == mt['id'])).sum()) if 'mt_id' in rel.columns else 0
            pts.append(cnt)
        q4_trends.append({'id': mt['id'], 'vn': mt['vn'], 'points': pts, 'color': TC[i]})

    topic_totals = {mt['id']: int((rel['mt_id'] == mt['id']).sum()) if 'mt_id' in rel.columns else 0 for mt in MASTER_TOPICS}
    top4_ids = sorted(topic_totals, key=lambda x: -topic_totals[x])[:4]
    q4_weekly = []
    for mt_id in top4_ids:
        mt    = next(m for m in MASTER_TOPICS if m['id'] == mt_id)
        color = TC[next(i for i, m in enumerate(MASTER_TOPICS) if m['id'] == mt_id)]
        pts = []
        for ws in week_starts:
            mask = (rel['week_start'] == ws) & (rel['mt_id'] == mt_id) if 'mt_id' in rel.columns else pd.Series(False, index=rel.index)
            pts.append(int(mask.sum()))
        q4_weekly.append({'id': mt_id, 'vn': mt['vn'], 'color': color, 'points': pts})

    # ── Q5/Q6 heatmap ───────────────────────────────────────────────────────
    neg_df = rel[rel['sentiment'] == 'negative'].copy() if 'sentiment' in rel.columns else rel.iloc[0:0].copy()
    neg_df['dow']  = neg_df['created_date'].dt.dayofweek
    neg_df['hour'] = neg_df['created_date'].dt.hour
    heatmap = [[int(((neg_df['dow'] == d) & (neg_df['hour'] == h)).sum()) for h in range(24)] for d in range(7)]
    q5_by_day  = [{'day': DAYS_VN[d], 'en': DAYS_EN[d], 'count': sum(heatmap[d])} for d in range(7)]
    q6_by_hour = [{'hour': h, 'count': sum(heatmap[d][h] for d in range(7))} for h in range(24)]

    # SOA/EC split of the weekday and hour distributions (Q5 / Q6 charts need this)
    if 'group_id' in neg_df.columns:
        neg_df_soa = neg_df[neg_df['group_id'].isin(SOA_IDS)]
        neg_df_ec  = neg_df[neg_df['group_id'].isin(EC_IDS)]
    else:
        neg_df_soa = neg_df.iloc[0:0]
        neg_df_ec  = neg_df.iloc[0:0]

    def _by_dow(df):
        return [{'day': DAYS_VN[d], 'en': DAYS_EN[d],
                 'count': int((df['dow'] == d).sum()) if 'dow' in df.columns else 0}
                for d in range(7)]

    def _by_hour(df):
        return [{'hour': h, 'count': int((df['hour'] == h).sum()) if 'hour' in df.columns else 0}
                for h in range(24)]

    q5_by_day_soa  = _by_dow(neg_df_soa)
    q5_by_day_ec   = _by_dow(neg_df_ec)
    q6_by_hour_soa = _by_hour(neg_df_soa)
    q6_by_hour_ec  = _by_hour(neg_df_ec)

    # Top negative topics — use sub_topic when populated (Q5/Q6 ask for sub-topic level),
    # fall back to master_topic when not
    from keywords import _column_populated
    use_subtopic = 'sub_topic' in neg_df.columns and _column_populated(neg_df['sub_topic'])

    def _top_neg(df, limit=15):
        if use_subtopic and 'sub_topic' in df.columns:
            sub = df['sub_topic'].fillna('').astype(str).str.strip()
            sub = sub[sub != ''].value_counts().head(limit)
            arr = [{'vn': k, 'count': int(v)} for k, v in sub.items()]
        else:
            arr = sorted(
                [{'vn': mt['vn'], 'count': int((df['mt_id'] == mt['id']).sum())}
                 for mt in MASTER_TOPICS if 'mt_id' in df.columns],
                key=lambda x: -x['count'],
            )
        return [t for t in arr if t['count'] > 0]

    neg_by_topic     = _top_neg(neg_df)
    q5_top_neg_soa   = _top_neg(neg_df_soa)
    q5_top_neg_ec    = _top_neg(neg_df_ec)

    # ── Auto-detect peak-hour window for negative posts ────────────────────
    # Both WINDOW SIZE and POSITION are data-driven:
    # 1) hourly histogram of negative posts (24 bins, across all 7 days)
    # 2) threshold = mean hourly count × 1.3 (hours above = "peak hours")
    # 3) find the longest contiguous run of above-threshold hours; that IS the
    #    peak window. Natural for concentrated data (narrow) or flat (wide).
    # 4) wraparound-safe (handles midnight-spanning peaks)
    # Fallback: if nothing exceeds threshold (flat hourly distribution),
    # default to the top-6 contiguous window by raw sum.
    hourly = [int((neg_df['hour'] == h).sum()) for h in range(24)] if 'hour' in neg_df.columns else [0] * 24
    total_neg = sum(hourly)

    if total_neg > 0:
        avg = total_neg / 24
        threshold = avg * 1.3
        # Double the hourly array so we can detect runs crossing midnight
        ext = hourly + hourly
        runs = []  # (start, length, sum)
        i = 0
        while i < 48:
            if ext[i] >= threshold:
                j = i
                while j < 48 and ext[j] >= threshold and (j - i) < 24:
                    j += 1
                runs.append((i % 24, j - i, sum(ext[i:j])))
                i = j
            else:
                i += 1

        if runs:
            peak_start, peak_len, _ = max(runs, key=lambda r: r[2])
        else:
            # Fallback: largest contiguous 6-hour block
            WINDOW = 6
            best_s, best_sum = 0, -1
            for s in range(24):
                ssum = sum(hourly[(s + k) % 24] for k in range(WINDOW))
                if ssum > best_sum:
                    best_sum, best_s = ssum, s
            peak_start, peak_len = best_s, WINDOW
    else:
        peak_start, peak_len = 0, 0

    peak_hours = [(peak_start + k) % 24 for k in range(peak_len)]
    peak_end   = (peak_start + peak_len) % 24  # exclusive
    peak_hour_mask = neg_df['hour'].isin(peak_hours) if 'hour' in neg_df.columns else pd.Series(False, index=neg_df.index)
    peak_window = {
        'startHour':     int(peak_start),
        'endHour':       int(peak_end),
        'hours':         [int(h) for h in peak_hours],
        'windowSize':    int(peak_len),
        'totalMentions': int(peak_hour_mask.sum()),
        'hourlyCounts':  hourly,  # full 24-bin histogram, for reference
    }

    # Topic distribution within the real peak window
    vn_to_id = {mt['vn']: mt['id'] for mt in MASTER_TOPICS}
    q5_early_dist = []
    for t in neg_by_topic[:6]:
        if use_subtopic:
            mask = (neg_df['sub_topic'] == t['vn']) & peak_hour_mask
            slot = int(mask.sum())
        else:
            mt_id = vn_to_id.get(t['vn'])
            if mt_id and 'mt_id' in neg_df.columns:
                slot = int(((neg_df['mt_id'] == mt_id) & peak_hour_mask).sum())
            else:
                slot = 0
        q5_early_dist.append({'vn': t['vn'], 'count': t['count'], 'slot': slot})

    # If peak-window slots are all zero (no data), fall back to overall count ratio
    if q5_early_dist and sum(e['slot'] for e in q5_early_dist) == 0:
        for e in q5_early_dist:
            e['slot'] = max(1, int(e['count'] * 0.1))

    # ── Q7–Q14 (keyword extraction from content) ────────────────────────────
    # Per team spec: Q8, Q11, Q12, Q13, Q14 are SOA-only (Amazon-seller specific).
    # Compute those from SOA-filtered subset so they reflect only SOA community discussion.
    # Q7, Q9, Q12, Q13, Q14 also get per-segment splits so the UI can show SOA vs EC
    # side-by-side (remixed analysis had both tracks).
    if 'group_id' in rel.columns:
        soa_rel = rel[rel['group_id'].isin(SOA_IDS)].copy()
        ec_rel  = rel[rel['group_id'].isin(EC_IDS)].copy()
    else:
        soa_rel = rel.iloc[0:0].copy()
        ec_rel  = rel.iloc[0:0].copy()

    q7_topics, q7_benefits, q7_sentiment                = extract_q7(rel)
    q7_topics_soa, q7_benefits_soa, q7_sentiment_soa    = extract_q7(soa_rel)
    q7_topics_ec,  q7_benefits_ec,  q7_sentiment_ec     = extract_q7(ec_rel)

    # Q7 NEW: sub-topic breakdown of positive-sentiment posts per segment.
    # (Replaces the older keyword-matched Q7_TOPICS chart — remixed HTML
    # uses sub-topic positive-sentiment counts directly.)
    def _pos_sub_counts(df, limit=10):
        if 'sub_topic' not in df.columns or 'sentiment' not in df.columns:
            return []
        pos = df[df['sentiment'] == 'positive']
        sub = pos['sub_topic'].fillna('').astype(str).str.strip()
        sub = sub[sub != ''].value_counts().head(limit)
        return [{'vn': k, 'count': int(v)} for k, v in sub.items()]

    q7_pos_subs_soa = _pos_sub_counts(soa_rel)
    q7_pos_subs_ec  = _pos_sub_counts(ec_rel)

    # Q10 NEW: sub-topics per segment filtered for "product context" only.
    # Account-lifecycle sub-topics (xác minh/khoá/hỗ trợ xử lý tài khoản)
    # get excluded — they're about fixing the seller's account, not about
    # the products being discussed. Matches the curated list in the remixed
    # analyst report.
    Q10_EXCLUDE_PREFIXES = [
        'Vấn đề xác minh',                      # incl. typo variant "rủi ko"
        'Dịch vụ hỗ trợ và xử lý tài khoản',    # account recovery services
    ]

    def _product_sub_counts(df, limit=10):
        if 'sub_topic' not in df.columns:
            return []
        sub = df['sub_topic'].fillna('').astype(str).str.strip()
        sub = sub[sub != '']
        for pat in Q10_EXCLUDE_PREFIXES:
            sub = sub[~sub.str.startswith(pat)]
        sub = sub.value_counts().head(limit)
        return [{'vn': k, 'count': int(v)} for k, v in sub.items()]

    q10_subs_soa = _product_sub_counts(soa_rel)
    q10_subs_ec  = _product_sub_counts(ec_rel)
    q8_triggers, q8_persona, q8_trend    = extract_q8(soa_rel, months)     # SOA only
    q9_barriers  = extract_q9(rel)
    q9_personas      = extract_q9_personas(rel)
    q9_personas_soa  = extract_q9_personas(soa_rel)
    q9_personas_ec   = extract_q9_personas(ec_rel)
    q10_top      = extract_q10(rel)
    q11_tools         = extract_q11(soa_rel)                                # SOA only
    q11_issues        = extract_q11_issues(soa_rel)                         # SOA only
    q11_satisfaction  = extract_q11_satisfaction(soa_rel)                   # SOA only
    q12_services     = extract_q12(soa_rel)                                 # SOA only (primary)
    q12_services_soa = q12_services
    q12_services_ec  = extract_q12(ec_rel)                                  # EC companion (for side-by-side view)
    q13_courses      = extract_q13(soa_rel)                                 # SOA only (primary)
    q13_courses_soa  = q13_courses
    q13_courses_ec   = extract_q13(ec_rel)                                  # EC companion
    q14_growth       = extract_q14(soa_rel)                                 # SOA only (primary)
    q14_growth_soa   = q14_growth
    q14_growth_ec    = extract_q14(ec_rel)                                  # EC companion

    # Expose SOA-only totals so UI can show 'Tính trên X bài SOA'
    soa_scope = {
        'totalRelevant': int(len(soa_rel)),
        'groupIds':      list(SOA_IDS),
        'groupNames':    [GROUP_INFO[g]['short'] for g in SOA_IDS],
    }

    # Weekly Q10 trend — use real 'Product Category' column if populated,
    # otherwise fall back to keyword matching on content
    from keywords import Q10_CATEGORY_KW, _column_populated
    q10_weeks  = weeks
    q10_weekly = []
    COLORS10 = ['oklch(0.60 0.20 25)','oklch(0.68 0.17 50)','oklch(0.75 0.17 90)',
                'oklch(0.62 0.15 155)','oklch(0.58 0.14 190)','oklch(0.55 0.17 290)',
                'oklch(0.60 0.20 320)']

    use_pc_col = 'Product Category' in rel.columns and _column_populated(rel['Product Category'])
    content_lc = rel['content'].fillna('').str.lower() if 'content' in rel.columns else pd.Series([], dtype=str)
    pc_col = rel['Product Category'].fillna('').astype(str).str.strip() if use_pc_col else None

    for ci, cat in enumerate(q10_top[:7]):
        if use_pc_col:
            # Match rows whose Product Category contains this label (multi-value safe)
            esc = re.escape(cat['name'])
            match = pc_col.str.contains(rf'(?:^|[,;|]\s*){esc}(?:\s*[,;|]|$)', regex=True, na=False)
            if not match.any():
                match = pc_col == cat['name']
        else:
            kws = Q10_CATEGORY_KW.get(cat['name'], [])
            parts = []
            for k in kws:
                kesc = re.escape(k.lower())
                if len(k) <= 6 and ' ' not in k:
                    parts.append(r'\b' + kesc + r'\b')
                else:
                    parts.append(kesc)
            pattern = '|'.join(parts) if parts else None
            match = content_lc.str.contains(pattern, regex=True, na=False) if pattern is not None and not content_lc.empty else None

        pts = []
        for ws in week_starts:
            if match is None:
                pts.append(0)
            else:
                week_mask = rel['week_start'] == ws
                pts.append(int((match & week_mask).sum()))
        q10_weekly.append({'name': cat['name'], 'color': COLORS10[ci % len(COLORS10)], 'points': pts})

    # ── Groups ──────────────────────────────────────────────────────────────
    SOA_GROUPS = [GROUP_INFO[g] for g in SOA_IDS]
    EC_GROUPS  = [GROUP_INFO[g] for g in EC_IDS]

    # ── LLM insights (cached by content-hash, skipped if API key missing) ──
    # Assemble the aggregates dict that insights.py consumes per-Q.
    rel_for_sampling = rel.copy()
    if 'hour' not in rel_for_sampling.columns and 'created_date' in rel_for_sampling.columns:
        rel_for_sampling['hour'] = rel_for_sampling['created_date'].dt.hour
    soa_rel_for_sampling = rel_for_sampling[rel_for_sampling['group_id'].isin(SOA_IDS)].copy() \
        if 'group_id' in rel_for_sampling.columns else rel_for_sampling.iloc[0:0]

    insight_aggregates = {
        'Q1':  {'q1_master': q1_master, 'top_groups': SOA_IDS[:2]},
        'Q2':  {'q2_matrix': q2_matrix, 'top_persona': None},
        'Q3':  {'q3_seller_prospect': q3_sp, 'q3_subs': q3_subs},
        'Q4':  {'q4_events': q4_events, 'week_starts': [str(w) for w in week_starts]},
        'Q5':  {'q5_top_neg': neg_by_topic[:6], 'q5_by_day': q5_by_day,
                'q6_by_hour': q6_by_hour, 'peak_window': peak_window},
        'Q7':  {'q7_topics': q7_topics, 'q7_benefits': q7_benefits, 'q7_sentiment': q7_sentiment},
        'Q8':  {'q8_triggers': q8_triggers, 'q8_persona': q8_persona, 'q8_trend': q8_trend,
                'soa_total': int(len(soa_rel))},
        'Q9':  {'q9_q7_personas': q9_personas['q7'], 'q9_q8_personas': q9_personas['q8']},
        'Q10': {'q10_top': q10_top},
        'Q11': {'q11_tools': q11_tools, 'q11_issues': q11_issues,
                'q11_satisfaction': q11_satisfaction, 'soa_total': int(len(soa_rel))},
        'Q12': {'q12_services': q12_services, 'soa_total': int(len(soa_rel))},
        'Q13': {'q13_courses': q13_courses, 'soa_total': int(len(soa_rel))},
        'Q14': {'q14_growth': q14_growth, 'soa_total': int(len(soa_rel))},
    }

    try:
        from insights import generate_insights_for_all_qs
        insights = generate_insights_for_all_qs(
            rel_for_sampling, soa_rel_for_sampling, insight_aggregates,
        )
    except Exception as e:
        import sys as _sys
        print(f'  [insight] generation failed ({e}) — returning empty', file=_sys.stderr)
        insights = {q_id: None for q_id in insight_aggregates.keys()}

    # ── Assemble JS ─────────────────────────────────────────────────────────
    js = f"""// Auto-generated by ChiCom backend — do not edit
window.TOPIC_COLORS = {_j(TC)};

window.ChiComData = (() => {{
  const SOA_GROUPS = {_j(SOA_GROUPS)};
  const EC_GROUPS  = {_j(EC_GROUPS)};
  const ALL_GROUPS = [...SOA_GROUPS, ...EC_GROUPS];
  const MASTER_TOPICS       = {_j(MASTER_TOPICS)};
  const Q1_WEIGHTS          = {_j(q1_weights)};
  const Q1_MASTER           = {_j(q1_master)};
  const SUBTOPICS           = {_j(SUBTOPICS)};
  const PERSONAS            = {_j(PERSONAS)};
  const Q2_MATRIX           = {_j(q2_matrix)};
  const Q2_MATRIX_SOA       = {_j(q2_matrix_soa)};
  const Q2_MATRIX_EC        = {_j(q2_matrix_ec)};
  const Q3_SELLER_PROSPECT  = {_j(q3_sp)};
  const Q3_SUBS             = {_j(q3_subs)};
  const MONTHS              = {_j(months)};
  const Q4_TRENDS           = {_j(q4_trends)};
  const WEEKS               = {_j(weeks)};
  const Q4_EVENTS           = {_j(q4_events)};
  const Q4_WEEKLY           = {_j(q4_weekly)};
  const DAYS_VN             = {_j(DAYS_VN)};
  const DAYS_EN             = {_j(DAYS_EN)};
  const Q56_HEATMAP         = {_j(heatmap)};
  const Q5_BY_DAY           = {_j(q5_by_day)};
  const Q5_BY_DAY_SOA       = {_j(q5_by_day_soa)};
  const Q5_BY_DAY_EC        = {_j(q5_by_day_ec)};
  const Q6_BY_HOUR          = {_j(q6_by_hour)};
  const Q6_BY_HOUR_SOA      = {_j(q6_by_hour_soa)};
  const Q6_BY_HOUR_EC       = {_j(q6_by_hour_ec)};
  const Q5_TOP_NEG          = {_j(neg_by_topic[:6])};
  const Q5_TOP_NEG_SOA      = {_j(q5_top_neg_soa[:6])};
  const Q5_TOP_NEG_EC       = {_j(q5_top_neg_ec[:6])};
  const Q5_EARLY_DIST       = {_j(q5_early_dist)};
  const Q5_PEAK_WINDOW      = {_j(peak_window)};
  const KPI                 = {_j(kpi)};
  const OVERVIEW            = {_j(overview)};
  const SOA_SCOPE           = {_j(soa_scope)};
  const INSIGHTS            = {_j(insights)};
  const DATE_RANGE          = {_j({
      'start': str(rel['created_date'].min().date()) if len(rel) and pd.notna(rel['created_date'].min()) else None,
      'end':   str(rel['created_date'].max().date()) if len(rel) and pd.notna(rel['created_date'].max()) else None,
      'monthsCount': len(months),
  })};
  return {{
    SOA_GROUPS, EC_GROUPS, ALL_GROUPS,
    MASTER_TOPICS, Q1_MASTER, Q1_WEIGHTS, SUBTOPICS,
    PERSONAS, Q2_MATRIX, Q2_MATRIX_SOA, Q2_MATRIX_EC, Q3_SELLER_PROSPECT, Q3_SUBS,
    MONTHS, Q4_TRENDS, WEEKS, Q4_EVENTS, Q4_WEEKLY,
    DAYS_VN, DAYS_EN, Q56_HEATMAP,
    Q5_BY_DAY, Q5_BY_DAY_SOA, Q5_BY_DAY_EC,
    Q6_BY_HOUR, Q6_BY_HOUR_SOA, Q6_BY_HOUR_EC,
    Q5_TOP_NEG, Q5_TOP_NEG_SOA, Q5_TOP_NEG_EC,
    Q5_EARLY_DIST, Q5_PEAK_WINDOW, KPI,
    OVERVIEW, DATE_RANGE, SOA_SCOPE, INSIGHTS,
  }};
}})();

window.ChiComData2 = (() => {{
  const Q7_TOPICS         = {_j(q7_topics)};
  const Q7_TOPICS_SOA     = {_j(q7_topics_soa)};
  const Q7_TOPICS_EC      = {_j(q7_topics_ec)};
  const Q7_BENEFITS       = {_j(q7_benefits)};
  const Q7_BENEFITS_SOA   = {_j(q7_benefits_soa)};
  const Q7_BENEFITS_EC    = {_j(q7_benefits_ec)};
  const Q7_SENTIMENT      = {_j(q7_sentiment)};
  const Q7_SENTIMENT_SOA  = {_j(q7_sentiment_soa)};
  const Q7_SENTIMENT_EC   = {_j(q7_sentiment_ec)};
  const Q7_POS_SUBS_SOA   = {_j(q7_pos_subs_soa)};
  const Q7_POS_SUBS_EC    = {_j(q7_pos_subs_ec)};
  const Q8_TRIGGERS    = {_j(q8_triggers)};
  const Q8_PERSONA     = {_j(q8_persona)};
  const Q8_TREND       = {_j(q8_trend)};
  const Q9_BARRIERS        = {_j(q9_barriers)};
  const Q9_Q7_PERSONAS     = {_j(q9_personas['q7'])};
  const Q9_Q8_PERSONAS     = {_j(q9_personas['q8'])};
  const Q9_Q7_PERSONAS_SOA = {_j(q9_personas_soa['q7'])};
  const Q9_Q8_PERSONAS_SOA = {_j(q9_personas_soa['q8'])};
  const Q9_Q7_PERSONAS_EC  = {_j(q9_personas_ec['q7'])};
  const Q9_Q8_PERSONAS_EC  = {_j(q9_personas_ec['q8'])};
  const Q10_TOP        = {_j(q10_top)};
  const Q10_WEEKS      = {_j(q10_weeks)};
  const Q10_WEEKLY     = {_j(q10_weekly)};
  const Q10_SUBS_SOA   = {_j(q10_subs_soa)};
  const Q10_SUBS_EC    = {_j(q10_subs_ec)};
  const Q11_TOOLS        = {_j(q11_tools)};
  const Q11_ISSUES       = {_j(q11_issues)};
  const Q11_SATISFACTION = {_j(q11_satisfaction)};
  const Q12_SERVICES     = {_j(q12_services)};
  const Q12_SERVICES_SOA = {_j(q12_services_soa)};
  const Q12_SERVICES_EC  = {_j(q12_services_ec)};
  const Q13_COURSES      = {_j(q13_courses)};
  const Q13_COURSES_SOA  = {_j(q13_courses_soa)};
  const Q13_COURSES_EC   = {_j(q13_courses_ec)};
  const Q14_GROWTH       = {_j(q14_growth)};
  const Q14_GROWTH_SOA   = {_j(q14_growth_soa)};
  const Q14_GROWTH_EC    = {_j(q14_growth_ec)};
  return {{
    Q7_TOPICS, Q7_TOPICS_SOA, Q7_TOPICS_EC,
    Q7_BENEFITS, Q7_BENEFITS_SOA, Q7_BENEFITS_EC,
    Q7_SENTIMENT, Q7_SENTIMENT_SOA, Q7_SENTIMENT_EC,
    Q7_POS_SUBS_SOA, Q7_POS_SUBS_EC,
    Q8_TRIGGERS, Q8_PERSONA, Q8_TREND,
    Q9_BARRIERS,
    Q9_Q7_PERSONAS, Q9_Q8_PERSONAS,
    Q9_Q7_PERSONAS_SOA, Q9_Q8_PERSONAS_SOA,
    Q9_Q7_PERSONAS_EC,  Q9_Q8_PERSONAS_EC,
    Q10_TOP, Q10_WEEKS, Q10_WEEKLY, Q10_SUBS_SOA, Q10_SUBS_EC,
    Q11_TOOLS, Q11_ISSUES, Q11_SATISFACTION,
    Q12_SERVICES, Q12_SERVICES_SOA, Q12_SERVICES_EC,
    Q13_COURSES,  Q13_COURSES_SOA,  Q13_COURSES_EC,
    Q14_GROWTH,   Q14_GROWTH_SOA,   Q14_GROWTH_EC,
  }};
}})();
"""

    info = {
        'filename':      'uploaded',
        'totalPosts':    kpi['totalPosts'],
        'relevantPosts': kpi['relevantPosts'],
        'months':        months,
        'groups':        kpi['activeGroups'],
    }
    return js, info
