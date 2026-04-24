"""
Spam filter pipeline. Takes a raw Excel input and produces
<base>_annotated.csv (+.xlsx) and <base>_cleaned.csv (+.xlsx)
in output/filtered/.

Usage as script:
    python run_spam_filter.py                           # uses default v2 input
    python run_spam_filter.py path/to/input.xlsx       # custom input

Usable as a module — `build_data.py` imports `run()` and invokes it
conditionally when the annotated CSV is missing or stale.
"""

from __future__ import annotations

import os
import re
import subprocess
import sys
from collections import Counter
from pathlib import Path
from typing import Tuple
from urllib.parse import urlparse


FOLDER = Path(__file__).resolve().parent
DEFAULT_RAW_FILE = 'docs/all_groups_final_v2.xlsx'

BLACKLIST_DIR = FOLDER / 'output' / 'blacklist'
FILTERED_DIR  = FOLDER / 'output' / 'filtered'
BLACKLIST_DIR.mkdir(parents=True, exist_ok=True)
FILTERED_DIR.mkdir(parents=True, exist_ok=True)

BLACKLIST_PATH = BLACKLIST_DIR / 'blacklist.xlsx'
WHITELIST_PATH = BLACKLIST_DIR / 'white_list.xlsx'


def _ensure_packages():
    try:
        import emoji  # noqa: F401
        import openpyxl  # noqa: F401
    except ImportError:
        subprocess.check_call([sys.executable, '-m', 'pip', 'install', '-q', 'emoji', 'openpyxl'])


# ── Whitelist / spam-domain helpers ────────────────────────────────────────

DEFAULT_WHITELIST = [
    {'domain': 'amazon.com', 'reason': 'Amazon official'},
    {'domain': 'sellercentral.amazon.com', 'reason': 'Amazon Seller Central'},
    {'domain': 'advertising.amazon.com', 'reason': 'Amazon Advertising'},
    {'domain': 'brandregistry.amazon.com', 'reason': 'Amazon Brand Registry'},
    {'domain': 'services.amazon.com', 'reason': 'Amazon Services'},
    {'domain': 'sell.amazon.com', 'reason': 'Amazon Sell'},
    {'domain': 'accelerate.amazon.com', 'reason': 'Amazon Accelerate'},
    {'domain': 'amazonservices.com', 'reason': 'Amazon Services portal'},
    {'domain': 'amazonglobalselling.com', 'reason': 'Amazon Global Selling'},
    {'domain': 'amzn.to', 'reason': 'Amazon short link'},
    {'domain': 'amazonaws.com', 'reason': 'Amazon AWS'},
    {'domain': 'aws.amazon.com', 'reason': 'Amazon AWS'},
    {'domain': 'amazon.co.uk', 'reason': 'Amazon UK'},
    {'domain': 'amazon.de', 'reason': 'Amazon Germany'},
    {'domain': 'amazon.fr', 'reason': 'Amazon France'},
    {'domain': 'amazon.it', 'reason': 'Amazon Italy'},
    {'domain': 'amazon.es', 'reason': 'Amazon Spain'},
    {'domain': 'amazon.nl', 'reason': 'Amazon Netherlands'},
    {'domain': 'amazon.pl', 'reason': 'Amazon Poland'},
    {'domain': 'amazon.se', 'reason': 'Amazon Sweden'},
    {'domain': 'amazon.co.jp', 'reason': 'Amazon Japan'},
    {'domain': 'amazon.com.au', 'reason': 'Amazon Australia'},
    {'domain': 'amazon.ca', 'reason': 'Amazon Canada'},
    {'domain': 'amazon.in', 'reason': 'Amazon India'},
    {'domain': 'amazon.com.mx', 'reason': 'Amazon Mexico'},
    {'domain': 'amazon.com.br', 'reason': 'Amazon Brazil'},
    {'domain': 'amazon.ae', 'reason': 'Amazon UAE'},
    {'domain': 'amazon.sg', 'reason': 'Amazon Singapore'},
    {'domain': 'amazon.sa', 'reason': 'Amazon Saudi Arabia'},
    {'domain': 'facebook.com', 'reason': 'Facebook'},
    {'domain': 'fb.com', 'reason': 'Facebook short link'},
    {'domain': 'm.facebook.com', 'reason': 'Facebook mobile'},
    {'domain': 'fbcdn.net', 'reason': 'Facebook CDN'},
    {'domain': 'forms.gle', 'reason': 'Google Forms'},
    {'domain': 'google.com', 'reason': 'Google'},
    {'domain': 'drive.google.com', 'reason': 'Google Drive'},
    {'domain': 'docs.google.com', 'reason': 'Google Docs'},
]


def _extract_domain(url: str) -> str:
    try:
        if not url.startswith('http'):
            url = 'http://' + url
        return urlparse(url).netloc.lower().replace('www.', '')
    except Exception:
        return ''


# ── Spam detection keyword banks ───────────────────────────────────────────

PROMO_KEYWORDS = [
    'giảm giá', 'siêu giảm', 'giảm lên đến', 'sale lớn', 'sale hot',
    'khuyến mãi', 'ưu đãi', 'chốt ngay', 'độc quyền', 'nhà phân phối',
    'giá chỉ', 'chỉ còn', 'tin cực hot', 'deal hot', 'ưu đãi hiếm',
    'gói tháng', 'gói năm',
]
SERVICE_KEYWORDS = [
    'nhận đky', 'nhận đăng ký', 'nhận order', 'nhận ship', 'nhận làm',
    'combo', 'llc', 'ein', 'báo giá', 'hỗ trợ đky', 'nhận setup',
    'giải pháp vận chuyển', 'dịch vụ vận chuyển', 'fulfillment', 'epacket',
    'freight', 'thông quan', 'kho hàng', 'giao hàng fba',
]
CONTACT_KEYWORDS = [
    'liên hệ', 'lien he', 'zalo', 'hotline', 'sđt', 'điện thoại',
    'ib/', 'call/', 'inbox', 'nhắn tin', 'tư vấn & báo giá',
    'tư vấn và báo giá',
]
VISUAL_SYMBOLS = set('✔✅❌❎⭕🔴🔵🟢🟡⚡🌟💥🔥✨⚠️📌📍🎯🎁🎉🎊💎👉👈👇👆🤝💪🚀🌐📞📲💰💵💴💶💷')
PHONE_RE = re.compile(r'0\d{1,3}[\s.\-]\d{1,4}[\s.\-]\d{3,5}|0\d{9}')
ATTACHMENT_RE = re.compile(r'^with attachments?:\s*(https?://\S+)?\s*$', re.IGNORECASE)


def run(raw_xlsx_path: str | Path = None) -> Tuple[Path, Path]:
    """
    Run the spam filter on the given xlsx. Returns (annotated_csv, cleaned_csv).
    """
    _ensure_packages()
    import pandas as pd
    import emoji

    raw_path = Path(raw_xlsx_path) if raw_xlsx_path else (FOLDER / DEFAULT_RAW_FILE)
    if not raw_path.is_absolute():
        raw_path = FOLDER / raw_path

    # Whitelist
    if not WHITELIST_PATH.exists():
        pd.DataFrame(DEFAULT_WHITELIST).to_excel(WHITELIST_PATH, index=False)
    df_whitelist = pd.read_excel(WHITELIST_PATH)
    whitelist_domains = set(df_whitelist['domain'].str.lower().str.strip())

    def is_whitelisted(domain: str) -> bool:
        return any(domain == wd or domain.endswith('.' + wd) for wd in whitelist_domains)

    # Load raw
    print(f'[spam] Reading {raw_path.name}…')
    df_raw = pd.read_excel(raw_path, sheet_name=0)
    print(f'[spam]   {len(df_raw):,} rows × {len(df_raw.columns)} cols')

    # Domain scan
    url_rows: list[str] = []
    for content in df_raw['content'].fillna('').astype(str):
        for url in re.findall(r'https?://\S+|www\.\S+', content, re.IGNORECASE):
            d = _extract_domain(url)
            if d:
                url_rows.append(d)
    domain_counts = Counter(url_rows)
    spam_domains = {d for d, c in domain_counts.items() if c >= 10 and not is_whitelisted(d)}
    print(f'[spam]   Domains: {len(domain_counts):,} unique | {len(spam_domains)} auto-flagged')

    def count_visual_emoji(text: str) -> int:
        return sum(1 for ch in str(text) if ch in emoji.EMOJI_DATA or ch in VISUAL_SYMBOLS)

    def detect_spam(row):
        content = str(row.get('content', '') or '').strip()
        score = 0
        reasons: list[str] = []
        content_lower = content.lower()

        if len(content) < 2:
            return pd.Series({'spam_score': 10, 'is_spam': True,
                              'spam_category': 'low_value', 'spam_reasons': 'too_short'})

        stripped = re.sub(r'https?://\S+', '', content).strip()
        if ATTACHMENT_RE.match(content) or (
            'with attachment' in content_lower
            and len(stripped.replace('with attachments:', '').replace('with attachment:', '').strip()) < 3
        ):
            return pd.Series({'spam_score': 10, 'is_spam': True,
                              'spam_category': 'attachment_only', 'spam_reasons': 'attachment_only'})

        for url in re.findall(r'https?://\S+|www\.\S+', content, re.IGNORECASE):
            d = _extract_domain(url)
            if is_whitelisted(d):
                continue
            if d in spam_domains:
                score += 6
                reasons.append(f'spam_domain:{d}')
            else:
                score += 1
                reasons.append('unknown_url')

        visual_count = count_visual_emoji(content)
        if visual_count >= 5:
            score += 3
            reasons.append(f'emoji_count:{visual_count}')

        has_phone = bool(PHONE_RE.search(content))
        has_contact = any(k in content_lower for k in CONTACT_KEYWORDS)
        is_long = len(content) >= 200
        if has_phone and has_contact and is_long:
            score += 4; reasons.append('phone_contact_ad')
        elif has_phone and has_contact:
            score += 2; reasons.append('phone_contact')
        elif has_phone and visual_count >= 5:
            score += 2; reasons.append('phone_emoji_listing')

        if len([k for k in SERVICE_KEYWORDS if k in content_lower]) >= 2:
            score += 2; reasons.append('service_ad')

        promo_hits = [k for k in PROMO_KEYWORDS if k in content_lower]
        if len(promo_hits) >= 2:
            score += 2; reasons.append('promo_keywords')
        elif len(promo_hits) == 1 and score > 0:
            score += 1; reasons.append('promo_keyword')

        if len(re.findall(r'#\w+', content)) >= 3:
            score += 2; reasons.append('hashtag_spam')

        mentions = re.findall(r'@[\w.]+', content)
        if len(mentions) >= 2 and len(re.sub(r'@[\w.]+', '', content).strip()) < 15:
            score += 4; reasons.append('name_tag_only')

        is_spam = score >= 5
        if is_spam:
            if any('spam_domain' in r for r in reasons):
                category = 'promotion_link'
            elif 'phone_contact_ad' in reasons or 'service_ad' in reasons:
                category = 'service_ad'
            elif 'phone_emoji_listing' in reasons:
                category = 'product_listing'
            elif 'name_tag_only' in reasons:
                category = 'name_tag_only'
            elif any('unknown_url' in r for r in reasons) and 'promo_keywords' in reasons:
                category = 'promotion_link'
            else:
                category = 'spam'
        else:
            category = ''

        return pd.Series({
            'spam_score': score, 'is_spam': is_spam,
            'spam_category': category, 'spam_reasons': ', '.join(reasons),
        })

    print('[spam] Detecting…')
    detection = df_raw.apply(detect_spam, axis=1)
    df_detected = pd.concat([df_raw, detection], axis=1)
    flagged = df_detected[df_detected['is_spam']]
    print(f'[spam]   Flagged {len(flagged):,} ({len(flagged)/len(df_detected)*100:.1f}%)')

    # Save blacklist
    blacklist_df = flagged[['id', 'spam_category', 'spam_score', 'spam_reasons',
                            'Type', 'created_date', 'content']].copy()
    blacklist_df.columns = ['id', 'irrelevant_type', 'spam_score', 'detection_reasons',
                            'Type', 'created_date', 'content']
    blacklist_df['source'] = 'auto'
    blacklist_df.to_excel(BLACKLIST_PATH, index=False)

    # Apply + dedupe
    df2 = df_raw.copy()
    bl_map = dict(zip(blacklist_df['id'].astype(str), blacklist_df['irrelevant_type'].astype(str)))
    df2['irrelevant_type'] = df2['id'].astype(str).map(bl_map).fillna('')
    df2['relevant'] = ~df2['id'].astype(str).isin(bl_map)

    spam_content = set(df2.loc[~df2['relevant'], 'content'].dropna())
    clean_idx = df2[df2['relevant']].index
    dupes_mask = df2.loc[clean_idx].duplicated(subset='content', keep='first')
    duplicate_ids = df2.loc[clean_idx][dupes_mask].index
    spam_dupes  = [i for i in duplicate_ids if df2.loc[i, 'content'] in spam_content]
    legit_dupes = [i for i in duplicate_ids if df2.loc[i, 'content'] not in spam_content]

    df2.loc[spam_dupes,  'relevant'] = False
    if spam_dupes:
        df2.loc[spam_dupes, 'irrelevant_type'] = df2.loc[spam_dupes, 'content'].map(
            df2[~df2['relevant']].drop_duplicates('content').set_index('content')['irrelevant_type']
        ).fillna('promotion_link')
    df2.loc[legit_dupes, 'relevant'] = False
    df2.loc[legit_dupes, 'irrelevant_type'] = 'duplicate'

    n_removed = (~df2['relevant']).sum()
    n_clean   = df2['relevant'].sum()
    print(f'[spam]   Removed {n_removed:,} · {n_clean:,} clean ({n_clean/len(df2)*100:.1f}%)')

    # Emit
    base = raw_path.stem
    annotated_csv  = FILTERED_DIR / f'{base}_annotated.csv'
    annotated_xlsx = FILTERED_DIR / f'{base}_annotated.xlsx'
    df2.to_csv(annotated_csv, index=False, encoding='utf-8-sig')
    df2.to_excel(annotated_xlsx, index=False)

    cleaned = df2[df2['relevant']].copy()
    cleaned_csv  = FILTERED_DIR / f'{base}_cleaned.csv'
    cleaned_xlsx = FILTERED_DIR / f'{base}_cleaned.xlsx'
    cleaned.to_csv(cleaned_csv, index=False, encoding='utf-8-sig')
    cleaned.to_excel(cleaned_xlsx, index=False)

    print(f'[spam]   → {annotated_csv.name}, {cleaned_csv.name}')
    return annotated_csv, cleaned_csv


if __name__ == '__main__':
    arg = sys.argv[1] if len(sys.argv) > 1 else None
    run(arg)
