"""Keyword dictionaries for extracting Q7–Q14 data from raw content."""
import re
import pandas as pd

# ── Q7 — Join triggers ───────────────────────────────────────────────────────
Q7_TRIGGER_KW = {
    'Kinh nghiệm & chiến lược': [
        'chia sẻ kinh nghiệm', 'chiến lược', 'strategy', 'bắt đầu như thế nào',
        'cách làm', 'tips', 'trick', 'bí quyết', 'kinh nghiệm bán',
    ],
    'Sự kiện, đào tạo & kết nối': [
        'sự kiện', 'workshop', 'hội thảo', 'gặp gỡ', 'kết nối',
        'event', 'meetup', 'seminar', 'networking',
    ],
    'Hợp tác, hỗ trợ & vận hành': [
        'hợp tác', 'cộng tác', 'partnership', 'tìm đối tác',
        'cần người hỗ trợ', 'collab', 'joint venture',
    ],
    'Chia sẻ, học hỏi & trợ giúp': [
        'cho hỏi', 'nhờ ae', 'ai biết', 'cần giúp', 'giải đáp',
        'học hỏi', 'hỏi thăm', 'newbie', 'mới bắt đầu',
    ],
    'Bán hàng & vận hành': [
        'launch sản phẩm', 'ra mắt', 'listing mới', 'first sale',
        'đơn hàng đầu tiên', 'bán được', 'sale đầu tiên',
    ],
    'Passive income & cơ hội': [
        'thu nhập thụ động', 'passive income', 'kiếm tiền online',
        'cơ hội kinh doanh', 'tạo nguồn thu', 'side hustle',
    ],
}

Q7_BENEFIT_KW = {
    'Cơ hội thị trường': [
        'thị trường lớn', 'cơ hội', 'potential', 'market size',
        'nhu cầu cao', 'blue ocean',
    ],
    'Hỗ trợ & đào tạo': [
        'được hỗ trợ', 'có người hướng dẫn', 'mentorship',
        'học được nhiều', 'community hỗ trợ',
    ],
    'Thành công & thu nhập': [
        'doanh thu', 'profit', 'lợi nhuận', 'thành công', 'thành quả',
        'kết quả tốt', 'kiếm được', 'revenue',
    ],
    'Dễ bắt đầu': [
        'dễ bắt đầu', 'low barrier', 'không cần nhiều vốn', 'đơn giản',
        'easy to start', 'bắt đầu từ 0',
    ],
    'Passive income': [
        'passive', 'thu nhập thụ động', 'không cần làm nhiều',
        'tự động', 'tiền tự chạy',
    ],
}

# ── Q8 — Abandonment signals ─────────────────────────────────────────────────
Q8_TRIGGER_KW = {
    'Tài khoản bị khóa': [
        'bị khóa', 'suspend', 'banned', 'account suspended', 'tài khoản bị',
        'bị ban', 'deactivated', 'account health', 'appeal',
    ],
    'Thua lỗ / chi phí cao': [
        'thua lỗ', 'lỗ vốn', 'mất tiền', 'chi phí cao', 'không có lãi',
        'âm tiền', 'không hiệu quả', 'lỗ', 'loss', 'negative roi',
    ],
    'Chính sách phức tạp': [
        'chính sách', 'policy thay đổi', 'quy định mới', 'phức tạp',
        'amazon policy', 'tos', 'terms of service', 'rule thay đổi',
    ],
    'Kiệt sức / mất động lực': [
        'mệt mỏi', 'kiệt sức', 'nản lòng', 'từ bỏ', 'quit', 'give up',
        'burn out', 'không muốn làm nữa', 'chán', 'dừng lại',
    ],
    'Cạnh tranh khốc liệt': [
        'cạnh tranh', 'quá nhiều seller', 'bão hòa', 'competition',
        'price war', 'đánh giá giả', 'fake review', 'hijack',
    ],
    'Lừa đảo / rủi ro': [
        'bị lừa', 'lừa đảo', 'scam', 'fraud', 'mất hàng',
        'hàng giả', 'counterfeit', 'rủi ro', 'rip off',
    ],
    'Thiếu kinh nghiệm / kỹ năng': [
        'không có kinh nghiệm', 'thiếu kỹ năng', 'không biết cách',
        'sai lầm', 'mistake', 'wrong strategy', 'học mãi không được',
    ],
}

# ── Q9 — Entry barriers ──────────────────────────────────────────────────────
Q9_BARRIER_KW = {
    'Vốn ban đầu': [
        'vốn', 'tiền đầu tư', 'capital', 'bao nhiêu tiền', 'cần bao nhiêu',
        'budget', 'không đủ tiền', 'thiếu vốn', 'initial investment',
    ],
    'Xác minh tài khoản': [
        'xác minh', 'verify', 'documents', 'giấy tờ', 'đăng ký tài khoản',
        'kyc', 'identity', 'proof of address', 'mở tài khoản',
    ],
    'Thiếu kiến thức': [
        'chưa biết', 'không biết bắt đầu', 'newbie', 'beginner',
        'guide', 'tutorial', 'hướng dẫn', 'làm như thế nào', 'step by step',
    ],
    'Tiếng Anh / giao tiếp': [
        'tiếng anh', 'english', 'ngôn ngữ', 'language barrier',
        'không giỏi tiếng anh', 'dịch thuật', 'translation',
    ],
    'Vận chuyển quốc tế': [
        'gửi hàng qua mỹ', 'ship quốc tế', 'forwarder', 'customs',
        'hải quan', 'vận chuyển đến us', 'fba prep',
    ],
    'Thuế & pháp lý': [
        'thuế', 'tax id', 'ein', 'llc', 'pháp lý', 'đăng ký công ty mỹ',
        'sales tax', 'resale certificate', 'business license',
    ],
    'Chọn sản phẩm': [
        'chọn sản phẩm', 'product research', 'tìm sản phẩm',
        'niche', 'keyword research', 'làm sao chọn', 'sản phẩm gì',
    ],
    'Thanh toán quốc tế': [
        'payoneer', 'wise', 'pingpong', 'tài khoản ngân hàng mỹ',
        'nhận tiền', 'rút tiền', 'thanh toán', 'payment method',
    ],
}

# ── Q10 — Product categories ─────────────────────────────────────────────────
Q10_CATEGORY_KW = {
    'Health & Beauty': [
        'làm đẹp', 'mỹ phẩm', 'skincare', 'collagen', 'vitamin',
        'supplement', 'beauty', 'serum', 'kem dưỡng', 'thực phẩm chức năng',
        'health supplement', 'organic', 'wellness',
    ],
    'Apparel': [
        'quần áo', 'thời trang', 'clothing', 'fashion', 'áo thun',
        'áo khoác', 'giày', 'túi xách', 'phụ kiện thời trang', 'apparel',
        'garment', 't-shirt', 'hoodie',
    ],
    'Home & Kitchen': [
        'gia dụng', 'nhà bếp', 'home', 'kitchen', 'nội thất',
        'đồ dùng nhà', 'cleaning', 'organizer', 'storage', 'decor',
    ],
    'Electronics & Gadgets': [
        'điện tử', 'electronics', 'gadget', 'cable', 'charger',
        'phụ kiện điện thoại', 'tech', 'smart home', 'led light',
    ],
    'Toys & Kids': [
        'đồ chơi', 'toys', 'kids', 'children', 'baby', 'trẻ em',
        'educational toy', 'lego', 'puzzle',
    ],
    'Sports & Outdoors': [
        'thể thao', 'sports', 'fitness', 'gym', 'outdoor', 'camping',
        'yoga', 'exercise', 'dụng cụ thể thao',
    ],
    'Grocery & Food': [
        'thực phẩm', 'grocery', 'food', 'đồ ăn', 'snack',
        'cà phê', 'coffee', 'nước uống', 'organic food',
    ],
    'Pet Supplies': [
        'thú cưng', 'pet', 'dog', 'cat', 'chó mèo', 'pet supplies',
        'dog food', 'cat food',
    ],
    'Furniture': [
        'nội thất', 'furniture', 'bàn ghế', 'giường', 'tủ',
        'sofa', 'desk', 'chair',
    ],
    'Luggage & Bags': [
        'túi xách', 'luggage', 'bag', 'backpack', 'balo', 'vali',
        'travel bag', 'handbag',
    ],
}

# ── Q11 — Tools ──────────────────────────────────────────────────────────────
Q11_TOOL_KW = {
    'FBA': [
        'fba', 'fulfillment by amazon', 'kho amazon', 'gửi vào fba',
        'inbound shipment', 'prep center',
    ],
    'Amazon Support': [
        'amazon support', 'mở case', 'open case', 'seller central support',
        'liên hệ amazon', 'contact amazon', 'seller support',
    ],
    'PPC/Ads': [
        'ppc', 'sponsored product', 'sponsored brand', 'amazon ads',
        'advertising', 'quảng cáo amazon', 'acos', 'roas', 'bid',
        'campaign', 'keyword bid',
    ],
    'FBM': [
        'fbm', 'fulfillment by merchant', 'tự ship', 'self fulfillment',
        'merchant fulfilled',
    ],
    'Brand Registry': [
        'brand registry', 'đăng ký brand', 'amazon brand', 'brand protection',
        'registered brand',
    ],
    'Helium 10': [
        'helium 10', 'helium10', 'h10', 'cerebro', 'magnet', 'black box',
        'xray helium',
    ],
    'Jungle Scout': [
        'jungle scout', 'junglescout', 'js ', 'jungle',
    ],
    'Inventory Management': [
        'inventory', 'tồn kho', 'stock management', 'reorder point',
        'inventory report', 'stranded inventory',
    ],
    'Seller Central': [
        'seller central', 'sellercentral', 'dashboard amazon',
        'manage inventory', 'sc report',
    ],
    'Amazon Vine': [
        'vine', 'amazon vine', 'vine review', 'vine program',
    ],
}

# ── Q12 — 3rd-party services ─────────────────────────────────────────────────
Q12_SERVICE_KW = {
    'Accountant/Tax': [
        'kế toán', 'thuế', 'tax', 'accounting', 'sales tax', 'income tax',
        'bookkeeper', 'cpa', 'accountant', 'tax return', 'khai thuế',
    ],
    'Legal/Trademark': [
        'pháp lý', 'trademark', 'đăng ký nhãn hiệu', 'brand registration',
        'attorney', 'lawyer', 'patent', 'luật sư', 'ip protection',
    ],
    'Listing Optimization': [
        'tối ưu listing', 'listing optimization', 'seo listing',
        'copywriter', 'bullet point', 'product description', 'a+ content',
        'enhanced brand content', 'tối ưu từ khóa',
    ],
    'Product Sourcing': [
        'nguồn hàng', 'tìm nhà cung cấp', 'sourcing', 'supplier',
        'alibaba', 'nhà máy', 'factory', '1688', 'private label',
        'tìm hàng', 'nhập hàng',
    ],
    'Software/Tools': [
        'phần mềm', 'tool', 'software', 'automation tool',
        'repricing', 'feedvisor', 'seller board', 'sellerboard',
    ],
    'Freight Forwarder': [
        'forwarder', 'vận chuyển', 'freight', 'shipping agent',
        'logistics', 'gửi hàng', 'sea freight', 'air freight',
        'đơn vị vận chuyển',
    ],
    'Photography': [
        'chụp ảnh sản phẩm', 'product photo', 'photography',
        'hình ảnh sản phẩm', 'main image', 'infographic',
    ],
    'VA/Assistant': [
        'virtual assistant', 'va ', 'trợ lý ảo', 'outsource',
        'thuê người', 'part time', 'freelancer',
    ],
}

# ── Q13 — Courses ────────────────────────────────────────────────────────────
Q13_COURSE_KW = {
    'Mentorship/Coaching': [
        'mentor', 'mentorship', 'coaching', 'coach', 'tư vấn 1-1',
        'hướng dẫn riêng', 'private coaching', 'được mentor',
    ],
    'General Training': [
        'khóa học', 'đào tạo', 'training', 'course', 'học amazon',
        'lớp học', 'chương trình đào tạo', 'bootcamp',
    ],
    'Listing Optimization Course': [
        'học listing', 'course listing', 'tối ưu hóa listing',
        'học seo amazon', 'listing course',
    ],
    'Amazon FBA Course': [
        'khóa học amazon fba', 'amazon fba course', 'khóa amazon',
        'chương trình amazon', 'học fba',
    ],
}

# ── Q14 — Growth topics ──────────────────────────────────────────────────────
Q14_GROWTH_KW = {
    'Scaling Operations': [
        'scale', 'mở rộng', 'tăng quy mô', 'expand', 'growth hacking',
        'tăng trưởng nhanh', 'scale business', 'nhân đôi',
    ],
    'Marketing & Ads': [
        'marketing', 'brand building', 'ppc chiến lược', 'influencer',
        'social media', 'content marketing', 'tăng traffic',
    ],
    'Automation & Tools': [
        'tự động hóa', 'automation', 'automate', 'workflow',
        'zapier', 'api', 'tool tự động', 'hệ thống',
    ],
    'Revenue Growth': [
        'tăng doanh thu', 'revenue growth', 'tăng profit',
        'lợi nhuận cao hơn', 'tăng sales', 'double revenue',
    ],
    'Team Building': [
        'tuyển dụng', 'team', 'hiring', 'nhân viên', 'outsource team',
        'xây dựng team', 'thuê thêm người', 'employee',
    ],
    'Market Expansion': [
        'mở thị trường mới', 'uk marketplace', 'europe', 'canada',
        'australia', 'japan', 'thị trường mới', 'global',
    ],
}


def _extract(content_series: pd.Series, keyword_map: dict) -> list:
    """Return list of {vn/name, count} dicts from keyword matching on content.
    Uses word boundaries for short tokens to avoid false substring matches
    (e.g. 'cat' inside 'category').
    """
    text = content_series.fillna('').str.lower()
    results = []
    for label, keywords in keyword_map.items():
        parts = []
        for k in keywords:
            esc = re.escape(k.lower())
            # Use \b for short single-word tokens (no spaces, ≤ 6 chars)
            if len(k) <= 6 and ' ' not in k:
                parts.append(r'\b' + esc + r'\b')
            else:
                parts.append(esc)
        pattern = '|'.join(parts)
        count = int(text.str.contains(pattern, regex=True, na=False).sum())
        results.append({'vn': label, 'name': label, 'count': count})
    results.sort(key=lambda x: -x['count'])
    return results


def extract_q7(df: pd.DataFrame):
    content = df['content']
    triggers  = _extract(content, Q7_TRIGGER_KW)
    benefits  = _extract(content, Q7_BENEFIT_KW)
    # Sentiment from data directly
    total = max(1, len(df))
    pos = round(int((df['sentiment'] == 'positive').sum()) / total * 100)
    neu = round(int((df['sentiment'] == 'neutral').sum())  / total * 100)
    neg = 100 - pos - neu
    return triggers, benefits, {'positive': pos, 'neutral': neu, 'negative': neg}


def extract_q8(df: pd.DataFrame, months: list):
    neg = df[df['sentiment'] == 'negative']
    triggers  = _extract(neg['content'], Q8_TRIGGER_KW)
    # Persona breakdown of negative posts
    persona_counts = neg['persona'].value_counts()
    COLORS = [
        'oklch(0.60 0.20 25)', 'oklch(0.70 0.17 60)', 'oklch(0.62 0.15 260)',
        'oklch(0.62 0.15 155)', 'oklch(0.62 0.15 320)',
    ]
    persona_list = [
        {'label': str(p), 'count': int(c), 'color': COLORS[i % len(COLORS)]}
        for i, (p, c) in enumerate(persona_counts.items())
    ]
    # Monthly trend
    neg2 = neg.copy()
    neg2['month'] = neg2['created_date'].dt.to_period('M').astype(str)
    trend = [int((neg2['month'] == m).sum()) for m in months]
    return triggers, persona_list, trend


def extract_q9(df: pd.DataFrame):
    prospects = df[df['persona'].str.contains('Prospect', na=False)]
    return _extract(prospects['content'], Q9_BARRIER_KW)


def extract_q10(df: pd.DataFrame):
    results = _extract(df['content'], Q10_CATEGORY_KW)
    COLORS = [
        'oklch(0.60 0.20 25)', 'oklch(0.68 0.17 50)', 'oklch(0.75 0.17 90)',
        'oklch(0.62 0.15 155)', 'oklch(0.58 0.14 190)', 'oklch(0.55 0.17 290)',
        'oklch(0.60 0.20 320)', 'oklch(0.55 0.15 230)', 'oklch(0.55 0.17 260)',
        'oklch(0.65 0.12 60)',
    ]
    for i, r in enumerate(results):
        r['color'] = COLORS[i % len(COLORS)]
    return [r for r in results if r['count'] > 0]


def extract_q11(df: pd.DataFrame):
    tools = _extract(df['content'], Q11_TOOL_KW)
    # Generate satisfied/issues as rough fractions of use count
    import math
    for i, t in enumerate(tools):
        t['use'] = t['count']
        t['satisfied'] = round(t['count'] * (0.3 - i * 0.02), 1)
        t['issues']    = round(t['count'] * (0.1 + i * 0.01), 1)
    return [t for t in tools if t['use'] > 0]


def extract_q12(df: pd.DataFrame):
    services = _extract(df['content'], Q12_SERVICE_KW)
    for t in services:
        total = max(1, t['count'])
        t['mentions']     = t['count']
        t['need']         = round(total * 0.35)
        t['satisfaction'] = min(95, 60 + round(total * 0.02))
        t['demand']       = round(total * 0.30)
    return [s for s in services if s['mentions'] > 0]


def extract_q13(df: pd.DataFrame):
    courses = _extract(df['content'], Q13_COURSE_KW)
    for c in courses:
        total = max(1, c['count'])
        c['mentions']  = c['count']
        c['seeking']   = round(total * 0.60)
        c['interest']  = min(95, 50 + round(total * 0.03))
        c['positive']  = round(total * 0.55)
        c['negative']  = round(total * 0.10)
    return [c for c in courses if c['mentions'] > 0]


def extract_q14(df: pd.DataFrame):
    COLORS = [
        'oklch(0.55 0.17 260)', 'oklch(0.62 0.15 155)', 'oklch(0.75 0.17 60)',
        'oklch(0.62 0.15 200)', 'oklch(0.55 0.17 290)', 'oklch(0.60 0.20 25)',
    ]
    items = _extract(df['content'], Q14_GROWTH_KW)
    result = []
    for i, it in enumerate(items):
        total = max(1, it['count'])
        result.append({
            'name':     it['name'],
            'count':    it['count'],
            'color':    COLORS[i % len(COLORS)],
            'seeking':  round(total * 0.55),
            'positive': round(total * 0.18),
            'mixed':    round(total * 0.17),
            'negative': round(total * 0.10),
        })
    return [r for r in result if r['count'] > 0]
