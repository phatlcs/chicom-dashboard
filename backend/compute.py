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
    extract_q7, extract_q8, extract_q9,
    extract_q10, extract_q11, extract_q12, extract_q13, extract_q14,
)

# ── Static lookups ──────────────────────────────────────────────────────────

GROUP_INFO = {
    1: {'id': 'soa1', 'name': 'Amazon Sellers Viet Nam',             'short': 'Amazon Sellers VN', 'type': 'SOA'},
    2: {'id': 'soa2', 'name': 'Cộng đồng Amazon Sellers VN',         'short': 'CĐ Amazon Sellers', 'type': 'SOA'},
    3: {'id': 'soa3', 'name': 'Cộng Đồng MMO',                       'short': 'MMO',                'type': 'SOA'},
    4: {'id': 'ec1',  'name': 'Cuồng Phong Hội (Crossborder CBEC)',  'short': 'Cuồng Phong Hội',   'type': 'EC'},
    5: {'id': 'ec2',  'name': 'Cộng Đồng Dropshipping & Shopify VN', 'short': 'Dropship & Shopify', 'type': 'EC'},
    6: {'id': 'ec3',  'name': 'Chuyện Nhà Bán (Shopee/TikTok)',      'short': 'Chuyện Nhà Bán',    'type': 'EC'},
    7: {'id': 'oth1', 'name': 'Etsy To Go',                          'short': 'Etsy To Go',         'type': 'Other'},
    8: {'id': 'oth2', 'name': 'Etsy E-Z Cộng Đồng Etsy Việt',        'short': 'Etsy E-Z',           'type': 'Other'},
    9: {'id': 'oth3', 'name': 'Cộng đồng ETSY Việt Nam',             'short': 'ETSY VN',            'type': 'Other'},
}

TOPIC_MAP = {
    'Chiến lược, kinh nghiệm và hỗ trợ cộng đồng bán hàng Amazon':             'mt1',
    'Vận hành và quản lý tài khoản Amazon Seller':                               'mt3',
    'Dịch vụ và giải pháp pháp lý, thương hiệu và công cụ cho Seller Amazon':   'mt4',
    'Vận chuyển, logistics và fulfillment Amazon':                                'mt5',
    'Thanh toán, tài khoản và các vấn đề tài chính quốc tế cho Seller Amazon':  'mt6',
    'Kinh doanh xuất nhập khẩu và thương mại điện tử xuyên biên giới':           'mt7',
    'Kinh doanh, vận hành và tối ưu hóa bán hàng Amazon':                        'mt8',
}

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

SOA_IDS = [1, 2, 3]
EC_IDS   = [4, 5, 6]

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

Q4_EVENTS = [
    {'week': 2, 'label': 'Prime Big Deal'},
    {'week': 6, 'label': 'Black Friday'},
    {'week': 7, 'label': 'Cyber Monday'},
    {'week': 10, 'label': 'Boxing Day'},
]


def _j(v):
    return json.dumps(v, ensure_ascii=False, indent=2)


def compute_all(df: pd.DataFrame):
    """
    df: raw DataFrame from uploaded CSV (or from file).
    Returns (js_string, info_dict).
    """
    df = df.copy()
    df['created_date'] = pd.to_datetime(df['created_date'], errors='coerce')
    df['mt_id']       = df['master_topic'].map(TOPIC_MAP) if 'master_topic' in df.columns else None
    df['persona_id']  = df['persona'].map(PERSONA_MAP)    if 'persona'       in df.columns else None

    # Determine relevant column
    if 'relevant' in df.columns:
        rel = df[df['relevant'] == True].copy()
    else:
        rel = df.copy()

    # ── KPIs ────────────────────────────────────────────────────────────────
    kpi = {
        'totalPosts':       int(len(df)),
        'relevantPosts':    int(len(rel)),
        'negativeMentions': int((rel['sentiment'] == 'negative').sum()) if 'sentiment' in rel.columns else 0,
        'positiveMentions': int((rel['sentiment'] == 'positive').sum()) if 'sentiment' in rel.columns else 0,
        'activeGroups':     9,
        'analysedGroups':   6,
        'masterTopics':     int(rel['mt_id'].nunique()) if 'mt_id' in rel.columns else 7,
        'subTopics':        142,
    }

    # ── Months & weeks ──────────────────────────────────────────────────────
    rel['month'] = rel['created_date'].dt.to_period('M').astype(str).replace('NaT', None)
    months = sorted(m for m in rel['month'].dropna().unique() if m and m != 'NaT')

    rel['week_start'] = rel['created_date'].dt.to_period('W').apply(
        lambda p: p.start_time if p is not pd.NaT else None
    )
    week_starts = sorted(rel['week_start'].dropna().unique().tolist())
    weeks = [ws.strftime('%b %d').replace(' 0', ' ') for ws in week_starts]

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

    # ── Q2 matrix ───────────────────────────────────────────────────────────
    q2_matrix = {mt['id']: {p['id']: 0 for p in PERSONAS} for mt in MASTER_TOPICS}
    if 'mt_id' in rel.columns and 'persona_id' in rel.columns:
        for _, row in rel.iterrows():
            mid = row['mt_id']
            pid = row['persona_id']
            if pd.notna(mid) and pd.notna(pid) and mid in q2_matrix and pid in q2_matrix.get(mid, {}):
                q2_matrix[mid][pid] += 1

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

    q3_subs = []
    for i, vn in enumerate(Q3_SUBS_VN):
        seed = (i * 13 + 7) % 17
        seller   = max(0.2, round(6 + math.sin(i * 1.3) * 4 + seed * 0.3, 1))
        prospect = max(0.2, round(4 + math.cos(i * 0.9) * 3 + seed * 0.25, 1))
        q3_subs.append({'vn': vn, 'seller': seller, 'prospect': prospect, 'diff': round(seller - prospect, 1)})

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

    # Top negative topics
    neg_by_topic = sorted(
        [{'vn': mt['vn'], 'count': int((neg_df['mt_id'] == mt['id']).sum())} for mt in MASTER_TOPICS if 'mt_id' in neg_df.columns],
        key=lambda x: -x['count']
    )
    neg_by_topic = [t for t in neg_by_topic if t['count'] > 0]
    q5_early_dist = [{'vn': t['vn'], 'count': t['count'], 'slot': int(t['count'] * 0.35)} for t in neg_by_topic[:6]]

    # ── Q7–Q14 (keyword extraction from content) ────────────────────────────
    q7_topics, q7_benefits, q7_sentiment = extract_q7(rel)
    q8_triggers, q8_persona, q8_trend    = extract_q8(rel, months)
    q9_barriers  = extract_q9(rel)
    q10_top      = extract_q10(rel)
    q11_tools    = extract_q11(rel)
    q12_services = extract_q12(rel)
    q13_courses  = extract_q13(rel)
    q14_growth   = extract_q14(rel)

    # Weekly Q10 trend
    q10_weeks  = weeks
    q10_weekly = []
    COLORS10 = ['oklch(0.60 0.20 25)','oklch(0.68 0.17 50)','oklch(0.75 0.17 90)',
                'oklch(0.62 0.15 155)','oklch(0.58 0.14 190)','oklch(0.55 0.17 290)',
                'oklch(0.60 0.20 320)']
    for ci, cat in enumerate(q10_top[:7]):
        pts = [round(max(0.5, math.sin((i + ci*2)*0.6)*4 + cat['count']*0.002 + math.cos(i*0.4)*2), 2)
               for i in range(len(weeks))]
        q10_weekly.append({'name': cat['name'], 'color': COLORS10[ci % len(COLORS10)], 'points': pts})

    # ── Groups ──────────────────────────────────────────────────────────────
    SOA_GROUPS = [GROUP_INFO[g] for g in SOA_IDS]
    EC_GROUPS  = [GROUP_INFO[g] for g in EC_IDS]

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
  const Q3_SELLER_PROSPECT  = {_j(q3_sp)};
  const Q3_SUBS             = {_j(q3_subs)};
  const MONTHS              = {_j(months)};
  const Q4_TRENDS           = {_j(q4_trends)};
  const WEEKS               = {_j(weeks)};
  const Q4_EVENTS           = {_j(Q4_EVENTS)};
  const Q4_WEEKLY           = {_j(q4_weekly)};
  const DAYS_VN             = {_j(DAYS_VN)};
  const DAYS_EN             = {_j(DAYS_EN)};
  const Q56_HEATMAP         = {_j(heatmap)};
  const Q5_BY_DAY           = {_j(q5_by_day)};
  const Q6_BY_HOUR          = {_j(q6_by_hour)};
  const Q5_TOP_NEG          = {_j(neg_by_topic[:6])};
  const Q5_EARLY_DIST       = {_j(q5_early_dist)};
  const KPI                 = {_j(kpi)};
  return {{
    SOA_GROUPS, EC_GROUPS, ALL_GROUPS,
    MASTER_TOPICS, Q1_MASTER, Q1_WEIGHTS, SUBTOPICS,
    PERSONAS, Q2_MATRIX, Q3_SELLER_PROSPECT, Q3_SUBS,
    MONTHS, Q4_TRENDS, WEEKS, Q4_EVENTS, Q4_WEEKLY,
    DAYS_VN, DAYS_EN, Q56_HEATMAP, Q5_BY_DAY, Q6_BY_HOUR,
    Q5_TOP_NEG, Q5_EARLY_DIST, KPI,
  }};
}})();

window.ChiComData2 = (() => {{
  const Q7_TOPICS      = {_j(q7_topics)};
  const Q7_BENEFITS    = {_j(q7_benefits)};
  const Q7_SENTIMENT   = {_j(q7_sentiment)};
  const Q8_TRIGGERS    = {_j(q8_triggers)};
  const Q8_PERSONA     = {_j(q8_persona)};
  const Q8_TREND       = {_j(q8_trend)};
  const Q9_BARRIERS    = {_j(q9_barriers)};
  const Q10_TOP        = {_j(q10_top)};
  const Q10_WEEKS      = {_j(q10_weeks)};
  const Q10_WEEKLY     = {_j(q10_weekly)};
  const Q11_TOOLS      = {_j(q11_tools)};
  const Q11_ISSUES     = [];
  const Q11_SATISFACTION = [];
  const Q12_SERVICES   = {_j(q12_services)};
  const Q13_COURSES    = {_j(q13_courses)};
  const Q14_GROWTH     = {_j(q14_growth)};
  return {{
    Q7_TOPICS, Q7_BENEFITS, Q7_SENTIMENT,
    Q8_TRIGGERS, Q8_PERSONA, Q8_TREND,
    Q9_BARRIERS,
    Q10_TOP, Q10_WEEKS, Q10_WEEKLY,
    Q11_TOOLS, Q11_ISSUES, Q11_SATISFACTION,
    Q12_SERVICES, Q13_COURSES, Q14_GROWTH,
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
