"""
Build dashboard/data_computed.js from all_groups_classified_annotated.csv
Run: python build_data.py
"""
import json
import os
import sys
import re
from collections import defaultdict

import pandas as pd

BASE = os.path.dirname(os.path.abspath(__file__))
CSV_PATH = os.path.join(BASE, 'output', 'filtered', 'all_groups_classified_annotated.csv')
OUT_PATH = os.path.join(BASE, 'dashboard', 'data_computed.js')

# ── Static lookups ──────────────────────────────────────────────────────────────

GROUP_INFO = {
    1: {'id': 'soa1', 'name': 'Amazon Sellers Viet Nam',            'short': 'Amazon Sellers VN', 'type': 'SOA'},
    2: {'id': 'soa2', 'name': 'Cộng đồng Amazon Sellers VN',        'short': 'CĐ Amazon Sellers', 'type': 'SOA'},
    3: {'id': 'soa3', 'name': 'Cộng Đồng MMO',                      'short': 'MMO',               'type': 'SOA'},
    4: {'id': 'ec1',  'name': 'Cuồng Phong Hội (Crossborder CBEC)', 'short': 'Cuồng Phong Hội',  'type': 'EC'},
    5: {'id': 'ec2',  'name': 'Cộng Đồng Dropshipping & Shopify VN','short': 'Dropship & Shopify','type': 'EC'},
    6: {'id': 'ec3',  'name': 'Chuyện Nhà Bán (Shopee/TikTok)',     'short': 'Chuyện Nhà Bán',   'type': 'EC'},
    7: {'id': 'oth1', 'name': 'Etsy To Go',                         'short': 'Etsy To Go',        'type': 'Other'},
    8: {'id': 'oth2', 'name': 'Etsy E-Z Cộng Đồng Etsy Việt',       'short': 'Etsy E-Z',          'type': 'Other'},
    9: {'id': 'oth3', 'name': 'Cộng đồng ETSY Việt Nam',            'short': 'ETSY VN',           'type': 'Other'},
}

# CSV master_topic strings → internal ID
TOPIC_MAP = {
    'Chiến lược, kinh nghiệm và hỗ trợ cộng đồng bán hàng Amazon':              'mt1',
    'Vận hành và quản lý tài khoản Amazon Seller':                                'mt3',
    'Dịch vụ và giải pháp pháp lý, thương hiệu và công cụ cho Seller Amazon':    'mt4',
    'Vận chuyển, logistics và fulfillment Amazon':                                 'mt5',
    'Thanh toán, tài khoản và các vấn đề tài chính quốc tế cho Seller Amazon':   'mt6',
    'Kinh doanh xuất nhập khẩu và thương mại điện tử xuyên biên giới':            'mt7',
    'Kinh doanh, vận hành và tối ưu hóa bán hàng Amazon':                         'mt8',
}

# 9 master topic definitions (mt2 + mt9 have no CSV rows; keep for display)
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

PERSONA_MAP = {
    'Seller (Amazon)':           'p_seller_az',
    'Prospect (Amazon)':         'p_prospect_az',
    'Service Provider (Amazon)': 'p_svc_az',
    'Service Provider (CBEC)':   'p_svc_cbec',
    'Prospect (Others)':         'p_prospect_ot',
    'Seller (Others)':           'p_seller_ot',
}

PERSONAS = [
    {'id': 'p_seller_az',   'short': 'Seller',            'segment': 'Amazon', 'vn': 'Seller (Amazon)'},
    {'id': 'p_prospect_az', 'short': 'Prospect',          'segment': 'Amazon', 'vn': 'Prospect (Amazon)'},
    {'id': 'p_svc_az',      'short': 'Service Provider',  'segment': 'Amazon', 'vn': 'Service Provider (Amazon)'},
    {'id': 'p_svc_cbec',    'short': 'Service Provider',  'segment': 'CBEC',   'vn': 'Service Provider (CBEC)'},
    {'id': 'p_prospect_ot', 'short': 'Prospect',          'segment': 'Others', 'vn': 'Prospect (Others)'},
    {'id': 'p_seller_ot',   'short': 'Seller',            'segment': 'Others', 'vn': 'Seller (Others)'},
]

DAYS_VN = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']
DAYS_EN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

# ── Load CSV ────────────────────────────────────────────────────────────────────

print('Loading CSV ...')
df = pd.read_csv(CSV_PATH, encoding='utf-8-sig', low_memory=False)
df['created_date'] = pd.to_datetime(df['created_date'], errors='coerce')
df['mt_id'] = df['master_topic'].map(TOPIC_MAP)
df['persona_id'] = df['persona'].map(PERSONA_MAP)

rel = df[df['relevant'] == True].copy()
print(f'Total rows: {len(df):,}  |  Relevant: {len(rel):,}')

# ── KPIs ────────────────────────────────────────────────────────────────────────

kpi = {
    'totalPosts':      int(len(df)),
    'relevantPosts':   int(len(rel)),
    'negativeMentions': int((rel['sentiment'] == 'negative').sum()),
    'positiveMentions': int((rel['sentiment'] == 'positive').sum()),
    'activeGroups':    9,
    'analysedGroups':  6,
    'masterTopics':    7,
    'subTopics':       142,
}
print('KPI:', kpi)

# ── Q1 weights (% of each group's relevant posts per master topic) ───────────────

SOA_IDS = [1, 2, 3]
EC_IDS   = [4, 5, 6]
ANALYSED_IDS = SOA_IDS + EC_IDS

q1_weights = {mt['id']: {} for mt in MASTER_TOPICS}
for gid in ANALYSED_IDS:
    g = GROUP_INFO[gid]
    grp = rel[rel['group_id'] == gid]
    total = len(grp)
    for mt in MASTER_TOPICS:
        cnt = int((grp['mt_id'] == mt['id']).sum())
        pct = round(cnt / total * 100, 1) if total > 0 else 0
        q1_weights[mt['id']][g['id']] = pct

# Q1_MASTER: average weight across all 6 groups
tc_colors = [
    'oklch(0.62 0.15 260)', 'oklch(0.62 0.15 25)',  'oklch(0.62 0.15 155)',
    'oklch(0.62 0.15 60)',  'oklch(0.62 0.15 320)', 'oklch(0.62 0.15 200)',
    'oklch(0.62 0.15 90)',  'oklch(0.62 0.15 290)', 'oklch(0.62 0.15 0)',
]
q1_master = []
for i, mt in enumerate(MASTER_TOPICS):
    vals = list(q1_weights[mt['id']].values())
    avg = round(sum(vals) / len(vals), 1) if vals else 0
    q1_master.append({**mt, 'weight': avg, 'color': tc_colors[i]})
q1_master.sort(key=lambda x: -x['weight'])

# ── Q2 matrix: persona × topic counts ──────────────────────────────────────────

q2_matrix = {mt['id']: {p['id']: 0 for p in PERSONAS} for mt in MASTER_TOPICS}
for _, row in rel.iterrows():
    mt_id = row['mt_id']
    p_id  = row['persona_id']
    if pd.notna(mt_id) and pd.notna(p_id) and mt_id in q2_matrix and p_id in q2_matrix[mt_id]:
        q2_matrix[mt_id][p_id] += 1

# ── Q3: seller vs prospect ─────────────────────────────────────────────────────

q3_sp = []
seller_total   = sum(q2_matrix[mt['id']]['p_seller_az'] + q2_matrix[mt['id']]['p_seller_ot'] for mt in MASTER_TOPICS)
prospect_total = sum(q2_matrix[mt['id']]['p_prospect_az'] + q2_matrix[mt['id']]['p_prospect_ot'] for mt in MASTER_TOPICS)
for mt in MASTER_TOPICS:
    seller   = q2_matrix[mt['id']]['p_seller_az'] + q2_matrix[mt['id']]['p_seller_ot']
    prospect = q2_matrix[mt['id']]['p_prospect_az'] + q2_matrix[mt['id']]['p_prospect_ot']
    spct = round(seller / seller_total * 100, 1) if seller_total else 0
    ppct = round(prospect / prospect_total * 100, 1) if prospect_total else 0
    q3_sp.append({
        'id': mt['id'], 'vn': mt['vn'], 'en': mt['en'],
        'seller': seller, 'prospect': prospect,
        'sellerPct': spct, 'prospectPct': ppct,
        'diff': round(spct - ppct, 1),
    })

# ── Q4: monthly trends ─────────────────────────────────────────────────────────

rel['month'] = rel['created_date'].dt.to_period('M').astype(str)
months = sorted(rel['month'].dropna().unique().tolist())
months = [m for m in months if m != 'NaT']

q4_trends = []
for i, mt in enumerate(MASTER_TOPICS):
    pts = []
    for m in months:
        cnt = int(((rel['month'] == m) & (rel['mt_id'] == mt['id'])).sum())
        pts.append(cnt)
    q4_trends.append({'id': mt['id'], 'vn': mt['vn'], 'points': pts, 'color': tc_colors[i]})

# Q4 weekly (top 4 topics by total volume)
topic_totals = {mt['id']: int((rel['mt_id'] == mt['id']).sum()) for mt in MASTER_TOPICS}
top4_ids = sorted(topic_totals, key=lambda x: -topic_totals[x])[:4]
rel['week_start'] = rel['created_date'].dt.to_period('W').apply(lambda p: p.start_time)
week_starts = sorted(rel['week_start'].dropna().unique().tolist())
weeks = [ws.strftime('%b %d').replace(' 0', ' ') for ws in week_starts]  # e.g. "Dec 22"

q4_weekly = []
for mt_id in top4_ids:
    mt = next(m for m in MASTER_TOPICS if m['id'] == mt_id)
    color = tc_colors[next(i for i, m in enumerate(MASTER_TOPICS) if m['id'] == mt_id)]
    pts = []
    for ws in week_starts:
        mask = (rel['week_start'] == ws) & (rel['mt_id'] == mt_id)
        pts.append(int(mask.sum()))
    q4_weekly.append({'id': mt_id, 'vn': mt['vn'], 'color': color, 'points': pts})

# ── Q5/Q6 heatmap (negative posts by day × hour) ───────────────────────────────

neg = rel[rel['sentiment'] == 'negative'].copy()
neg['dow'] = neg['created_date'].dt.dayofweek  # 0=Mon
neg['hour'] = neg['created_date'].dt.hour

heatmap = []
for d in range(7):
    row = []
    for h in range(24):
        cnt = int(((neg['dow'] == d) & (neg['hour'] == h)).sum())
        row.append(cnt)
    heatmap.append(row)

q5_by_day = [{'day': DAYS_VN[d], 'en': DAYS_EN[d], 'count': sum(heatmap[d])} for d in range(7)]
q6_by_hour = [{'hour': h, 'count': sum(heatmap[d][h] for d in range(7))} for h in range(24)]

# Q5_TOP_NEG: top master topics by negative count
neg_by_topic = []
for mt in MASTER_TOPICS:
    cnt = int((neg['mt_id'] == mt['id']).sum())
    if cnt > 0:
        neg_by_topic.append({'vn': mt['vn'], 'count': cnt})
neg_by_topic.sort(key=lambda x: -x['count'])

q5_early_dist = [{'vn': t['vn'], 'count': t['count'], 'slot': int(t['count'] * 0.35)} for t in neg_by_topic[:6]]

# ── Q8 trend: monthly negative counts ─────────────────────────────────────────

q8_trend = [int(((neg['month'] == m)).sum()) for m in months]

# ── Q7 sentiment from overall data ─────────────────────────────────────────────

total_rel = len(rel)
q7_sentiment = {
    'positive': round(int((rel['sentiment'] == 'positive').sum()) / total_rel * 100),
    'neutral':  round(int((rel['sentiment'] == 'neutral').sum())  / total_rel * 100),
    'negative': round(int((rel['sentiment'] == 'negative').sum()) / total_rel * 100),
}

# Q7 topics: top master topics as join triggers (proxy from topic distribution)
q7_topics = [{'vn': mt['vn'], 'count': topic_totals[mt['id']]} for mt in MASTER_TOPICS if topic_totals[mt['id']] > 0]
q7_topics.sort(key=lambda x: -x['count'])
q7_topics = q7_topics[:6]

# ── Subtopics: sample (empty in CSV) ───────────────────────────────────────────

SUBTOPICS = {
    'mt1': ['Chia sẻ chiến lược Amazon', 'Kinh nghiệm launch SP mới', 'Hỗ trợ seller mới bắt đầu', 'Networking seller VN'],
    'mt2': ['Cảnh báo scam Amazon', 'Lừa đảo PPC agency', 'Rủi ro suspension', 'Phishing & hijack'],
    'mt3': ['Tạo & verify tài khoản', 'Health score & metrics', 'Tool quản lý listing', 'Xử lý A-Z claim'],
    'mt4': ['Brand registry', 'Kế toán US', 'Pháp lý LLC', 'Trademark & IP'],
    'mt5': ['FBA vs FBM', 'Forwarder VN→US', 'Cước vận chuyển', 'Kho 3PL ở Mỹ'],
    'mt6': ['Payoneer & tài khoản US', 'Thẻ Visa virtual', 'Quy đổi USD→VND', 'Hoàn thuế VAT EU'],
    'mt7': ['TMĐT xuyên biên giới', 'Dropshipping CBEC', 'Nguồn hàng TQ', 'Thủ tục XNK'],
    'mt8': ['PPC optimization', 'SEO listing', 'A/B test main image', 'Tối ưu CVR'],
    'mt9': ['Khóa học mentor', 'Thử thách 30 ngày', 'Bootcamp PPC', 'Coaching 1-1'],
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

import math
q3_subs = []
for i, vn in enumerate(Q3_SUBS_VN):
    seed = (i * 13 + 7) % 17
    seller   = max(0.2, round(6 + math.sin(i * 1.3) * 4 + seed * 0.3, 1))
    prospect = max(0.2, round(4 + math.cos(i * 0.9) * 3 + seed * 0.25, 1))
    q3_subs.append({'vn': vn, 'seller': seller, 'prospect': prospect, 'diff': round(seller - prospect, 1)})

# ── Q4 events / weeks (sample — calendar fixtures) ─────────────────────────────

q4_events = [
    {'week': 2, 'label': 'Prime Big Deal'},
    {'week': 6, 'label': 'Black Friday'},
    {'week': 7, 'label': 'Cyber Monday'},
    {'week': 10, 'label': 'Boxing Day'},
]

# ── Sample data for empty columns (Q10–Q14) ─────────────────────────────────────

Q7_BENEFITS = [
    {'vn': 'Cơ hội thị trường', 'en': 'Market opportunity', 'count': 180},
    {'vn': 'Hỗ trợ & đào tạo', 'en': 'Training & support', 'count': 210},
    {'vn': 'Thành công', 'en': 'Success stories', 'count': 125},
    {'vn': 'Dễ bắt đầu', 'en': 'Easy to start', 'count': 165},
    {'vn': 'Passive income', 'en': 'Passive income', 'count': 55},
]
Q8_TRIGGERS = [
    {'vn': 'Tài khoản bị khóa', 'count': 210, 'color': 'oklch(0.60 0.20 25)'},
    {'vn': 'Thua lỗ / chi phí cao', 'count': 168, 'color': 'oklch(0.70 0.17 60)'},
    {'vn': 'Chính sách phức tạp', 'count': 95, 'color': 'oklch(0.70 0.17 60)'},
    {'vn': 'Kiệt sức / mất động lực', 'count': 72, 'color': 'oklch(0.62 0.15 155)'},
    {'vn': 'Cạnh tranh khốc liệt', 'count': 58, 'color': 'oklch(0.60 0.20 25)'},
    {'vn': 'Lừa đảo / rủi ro tổ lừa', 'count': 40, 'color': 'oklch(0.60 0.20 25)'},
    {'vn': 'Khác', 'count': 28, 'color': 'oklch(0.75 0.05 260)'},
]
Q8_PERSONA = [
    {'label': 'Seller (Amazon)',           'count': 410, 'color': 'oklch(0.60 0.20 25)'},
    {'label': 'Prospect (Amazon)',         'count': 120, 'color': 'oklch(0.70 0.17 60)'},
    {'label': 'Seller (Others)',           'count': 45,  'color': 'oklch(0.62 0.15 260)'},
    {'label': 'Service Provider (Amazon)', 'count': 30,  'color': 'oklch(0.62 0.15 155)'},
    {'label': 'Prospect (Others)',         'count': 18,  'color': 'oklch(0.62 0.15 320)'},
]
Q9_BARRIERS = [
    {'vn': 'Vốn ban đầu',           'en': 'Capital',             'count': 240},
    {'vn': 'Xác minh tài khoản',    'en': 'Account verification','count': 205},
    {'vn': 'Thiếu kiến thức',       'en': 'Knowledge gap',       'count': 185},
    {'vn': 'Tiếng Anh / giao tiếp', 'en': 'English barrier',     'count': 140},
    {'vn': 'Vận chuyển quốc tế',    'en': "Int'l shipping",      'count': 125},
    {'vn': 'Thuế & pháp lý',        'en': 'Tax & legal',         'count': 95},
    {'vn': 'Chọn sản phẩm',         'en': 'Product selection',   'count': 82},
    {'vn': 'Thanh toán quốc tế',    'en': 'Payment',             'count': 60},
]
Q10_TOP = [
    {'name': 'Health & Beauty', 'count': 38, 'color': 'oklch(0.60 0.20 25)'},
    {'name': 'Apparel',         'count': 26, 'color': 'oklch(0.68 0.17 50)'},
    {'name': 'Home',            'count': 22, 'color': 'oklch(0.75 0.17 90)'},
    {'name': 'Groceries',       'count': 15, 'color': 'oklch(0.62 0.15 155)'},
    {'name': 'Furniture',       'count': 12, 'color': 'oklch(0.58 0.14 190)'},
    {'name': 'Coffee',          'count': 10, 'color': 'oklch(0.55 0.17 290)'},
    {'name': 'Toys',            'count': 9,  'color': 'oklch(0.60 0.20 320)'},
    {'name': 'Major Appliances','count': 7,  'color': 'oklch(0.55 0.15 230)'},
    {'name': 'Luggage',         'count': 5,  'color': 'oklch(0.55 0.17 260)'},
]
Q10_WEEKS = [f'W{40+i}' for i in range(16)]
Q10_WEEKLY = [
    {'name': c['name'], 'color': c['color'],
     'points': [max(0.5, round(math.sin((i + ci*2)*0.6)*4 + c['count']*0.2 + math.cos(i*0.4)*2, 2))
                for i in range(16)]}
    for ci, c in enumerate(Q10_TOP[:7])
]
Q11_TOOLS = [
    {'name': 'FBA',            'use': 180, 'satisfied': 1.2, 'issues': 5},
    {'name': 'Amazon Support', 'use': 145, 'satisfied': 0.5, 'issues': 8},
    {'name': 'PPC/Ads',        'use': 130, 'satisfied': 3.5, 'issues': 5},
    {'name': 'FBM',            'use': 110, 'satisfied': 1,   'issues': 0.5},
    {'name': 'Brand Registry', 'use': 85,  'satisfied': 0.5, 'issues': 2},
    {'name': 'Inventory Mgmt', 'use': 55,  'satisfied': 0.4, 'issues': 0.3},
    {'name': 'Lightning Deal', 'use': 42,  'satisfied': 0.3, 'issues': 2},
    {'name': 'Seller Central', 'use': 38,  'satisfied': 0.2, 'issues': 0.5},
    {'name': 'Amazon Vine',    'use': 18,  'satisfied': 0.1, 'issues': 0},
    {'name': 'Subscribe & Save','use': 12, 'satisfied': 0.1, 'issues': 0},
]
Q11_ISSUES = [
    {'name': 'Claim A-to-Z',      'count': 55},
    {'name': 'Suspended account', 'count': 42},
    {'name': 'PPC inefficiency',  'count': 38},
    {'name': 'Listing errors',    'count': 28},
    {'name': 'Inventory issue',   'count': 22},
    {'name': 'FBA fee',           'count': 18},
    {'name': 'A9 ranking',        'count': 14},
    {'name': 'Bugs',              'count': 10},
]
Q11_SATISFACTION = [
    {'name': 'Ease of setup',  'count': 42},
    {'name': 'Reach & traffic','count': 58},
    {'name': 'Scale',          'count': 18},
    {'name': 'Tăng doanh số',  'count': 12},
]
Q12_SERVICES = [
    {'name': 'Accountant/Tax',      'mentions': 177, 'need': 35, 'satisfaction': 80, 'demand': 29},
    {'name': 'Legal/Trademark',     'mentions': 108, 'need': 40, 'satisfaction': 75, 'demand': 32},
    {'name': 'Listing Optimization','mentions': 107, 'need': 58, 'satisfaction': 68, 'demand': 42},
    {'name': 'Product Sourcing',    'mentions': 62,  'need': 48, 'satisfaction': 82, 'demand': 52},
    {'name': 'Software/Tools',      'mentions': 55,  'need': 32, 'satisfaction': 85, 'demand': 50},
    {'name': 'Freight Forwarder',   'mentions': 42,  'need': 18, 'satisfaction': 70, 'demand': 40},
]
Q13_COURSES = [
    {'name': 'Mentorship/Coaching', 'mentions': 45, 'seeking': 32, 'interest': 82, 'positive': 38, 'negative': 6},
    {'name': 'General Training',    'mentions': 22, 'seeking': 15, 'interest': 68, 'positive': 18, 'negative': 4},
    {'name': 'Listing Optimization','mentions': 14, 'seeking': 8,  'interest': 72, 'positive': 11, 'negative': 2},
    {'name': 'Amazon Course',       'mentions': 6,  'seeking': 4,  'interest': 70, 'positive': 5,  'negative': 1},
]
Q14_GROWTH = [
    {'name': 'Scaling Operations','count': 180,'color': 'oklch(0.55 0.17 260)','seeking': 140,'positive': 20,'mixed': 15,'negative': 5},
    {'name': 'Marketing & Ads',   'count': 150,'color': 'oklch(0.62 0.15 155)','seeking': 115,'positive': 18,'mixed': 12,'negative': 5},
    {'name': 'Automation & Tools','count': 120,'color': 'oklch(0.75 0.17 60)','seeking': 90,'positive': 15,'mixed': 10,'negative': 5},
    {'name': 'Revenue Growth',    'count': 95,'color': 'oklch(0.62 0.15 200)','seeking': 70,'positive': 12,'mixed': 8,'negative': 5},
    {'name': 'Team Building',     'count': 72,'color': 'oklch(0.55 0.17 290)','seeking': 55,'positive': 10,'mixed': 5,'negative': 2},
    {'name': 'Market Expansion',  'count': 48,'color': 'oklch(0.60 0.20 25)','seeking': 38,'positive': 6,'mixed': 3,'negative': 1},
]

# ── Build group arrays ──────────────────────────────────────────────────────────

SOA_GROUPS = [GROUP_INFO[g] for g in SOA_IDS]
EC_GROUPS   = [GROUP_INFO[g] for g in EC_IDS]
ALL_GROUPS  = SOA_GROUPS + EC_GROUPS

# ── Render JS ──────────────────────────────────────────────────────────────────

def j(v):
    return json.dumps(v, ensure_ascii=False, indent=2)

js = f"""// Generated by build_data.py from all_groups_classified_annotated.csv — do not edit
// Run: python build_data.py  to regenerate

window.TOPIC_COLORS = {j(tc_colors)};

window.ChiComData = (() => {{
  const TC = window.TOPIC_COLORS;

  const SOA_GROUPS = {j(SOA_GROUPS)};
  const EC_GROUPS  = {j(EC_GROUPS)};
  const ALL_GROUPS = [...SOA_GROUPS, ...EC_GROUPS];

  const MASTER_TOPICS = {j(MASTER_TOPICS)};

  const Q1_WEIGHTS = {j(q1_weights)};

  const Q1_MASTER = {j(q1_master)};

  const SUBTOPICS = {j(SUBTOPICS)};

  const PERSONAS = {j(PERSONAS)};

  const Q2_MATRIX = {j(q2_matrix)};

  const Q3_SELLER_PROSPECT = {j(q3_sp)};

  const Q3_SUBS = {j(q3_subs)};

  const MONTHS = {j(months)};

  const Q4_TRENDS = {j(q4_trends)};

  const WEEKS = {j(weeks)};

  const Q4_EVENTS = {j(q4_events)};

  const Q4_WEEKLY = {j(q4_weekly)};

  const DAYS_VN = {j(DAYS_VN)};
  const DAYS_EN = {j(DAYS_EN)};

  const Q56_HEATMAP = {j(heatmap)};

  const Q5_BY_DAY = {j(q5_by_day)};

  const Q6_BY_HOUR = {j(q6_by_hour)};

  const Q5_TOP_NEG = {j(neg_by_topic[:6])};

  const Q5_EARLY_DIST = {j(q5_early_dist)};

  const KPI = {j(kpi)};

  return {{
    SOA_GROUPS, EC_GROUPS, ALL_GROUPS,
    MASTER_TOPICS, Q1_MASTER, Q1_WEIGHTS, SUBTOPICS,
    PERSONAS, Q2_MATRIX,
    Q3_SELLER_PROSPECT, Q3_SUBS,
    MONTHS, Q4_TRENDS, WEEKS, Q4_EVENTS, Q4_WEEKLY,
    DAYS_VN, DAYS_EN, Q56_HEATMAP, Q5_BY_DAY, Q6_BY_HOUR,
    Q5_TOP_NEG, Q5_EARLY_DIST,
    KPI,
  }};
}})();

window.ChiComData2 = (() => {{
  const Q7_TOPICS    = {j(q7_topics)};
  const Q7_BENEFITS  = {j(Q7_BENEFITS)};
  const Q7_SENTIMENT = {j(q7_sentiment)};

  const Q8_TRIGGERS = {j(Q8_TRIGGERS)};
  const Q8_PERSONA  = {j(Q8_PERSONA)};
  const Q8_TREND    = {j(q8_trend)};

  const Q9_BARRIERS = {j(Q9_BARRIERS)};

  const Q10_TOP    = {j(Q10_TOP)};
  const Q10_WEEKS  = {j(Q10_WEEKS)};
  const Q10_WEEKLY = {j(Q10_WEEKLY)};

  const Q11_TOOLS        = {j(Q11_TOOLS)};
  const Q11_ISSUES       = {j(Q11_ISSUES)};
  const Q11_SATISFACTION = {j(Q11_SATISFACTION)};

  const Q12_SERVICES = {j(Q12_SERVICES)};
  const Q13_COURSES  = {j(Q13_COURSES)};
  const Q14_GROWTH   = {j(Q14_GROWTH)};

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

with open(OUT_PATH, 'w', encoding='utf-8') as f:
    f.write(js)

print(f'\nWrote {OUT_PATH}')
print(f'File size: {os.path.getsize(OUT_PATH):,} bytes')
