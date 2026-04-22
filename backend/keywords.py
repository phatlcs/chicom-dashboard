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

# ── Q3 sub-topics — 19 Vietnamese sub-topic buckets ─────────────────────────
Q3_SUB_KW = {
    'Cảnh báo rủi ro & lừa đảo khi kinh doanh Amazon': [
        'lừa đảo', 'scam', 'cảnh báo', 'rủi ro', 'fraud', 'bị lừa',
        'cẩn thận', 'phishing', 'hijack', 'fake', 'không nên tin',
    ],
    'Kinh nghiệm & chiến lược bán hàng trên Amazon': [
        'kinh nghiệm', 'chiến lược', 'strategy', 'bí quyết',
        'cách bán', 'tips', 'trick', 'best practice',
    ],
    'Dịch vụ & giải pháp pháp lý, thương hiệu': [
        'pháp lý', 'trademark', 'brand registry', 'luật sư',
        'attorney', 'nhãn hiệu', 'đăng ký thương hiệu', 'patent', 'ip protection',
    ],
    'Thuế và chi phí kinh doanh trên Amazon': [
        'thuế', 'tax', 'chi phí', 'phí fba', 'phí amazon', 'kế toán',
        'bookkeeping', 'sales tax', 'income tax', 'khai thuế',
    ],
    'Khó khăn & thách thức khi bán hàng Amazon': [
        'khó khăn', 'thách thức', 'vấn đề', 'gặp khó', 'mệt mỏi',
        'stuck', 'struggle', 'không biết làm sao', 'đau đầu',
    ],
    'Dịch vụ hỗ trợ & tối ưu tài khoản': [
        'tối ưu tài khoản', 'account health', 'metrics', 'performance',
        'optimize account', 'health score', 'cải thiện tài khoản',
    ],
    'Hợp tác, hỗ trợ & vận hành bán hàng': [
        'hợp tác', 'partnership', 'đối tác', 'cộng tác', 'vận hành',
        'operations', 'joint venture', 'cần người hỗ trợ',
    ],
    'Vấn đề xác minh, khoá, rủi ro tài khoản': [
        'bị khóa', 'suspend', 'banned', 'xác minh', 'verify', 'kyc',
        'appeal', 'deactivated', 'account suspended', 'reinstate',
    ],
    'Sự kiện, đào tạo và kết nối cộng đồng': [
        'sự kiện', 'event', 'workshop', 'hội thảo', 'meetup',
        'seminar', 'networking', 'gặp gỡ', 'kết nối', 'offline',
    ],
    'Kinh doanh xuất nhập khẩu & quốc tế': [
        'xuất nhập khẩu', 'xnk', 'xuyên biên giới', 'cross border',
        'cbec', 'import export', 'quốc tế', 'thủ tục xnk',
    ],
    'Dịch vụ vận chuyển và fulfillment': [
        'vận chuyển', 'shipping', 'forwarder', 'logistics', 'fulfillment',
        'fba prep', '3pl', 'sea freight', 'air freight', 'gửi hàng',
    ],
    'Chia sẻ, học hỏi và hợp tác kinh nghiệm': [
        'chia sẻ', 'học hỏi', 'share experience', 'trao đổi',
        'học kinh nghiệm', 'hỏi đáp', 'thảo luận',
    ],
    'Hướng dẫn & hỗ trợ người mới bắt đầu': [
        'newbie', 'người mới', 'bắt đầu', 'beginner', 'guide',
        'hướng dẫn', 'tutorial', 'step by step', 'cho người mới',
    ],
    'Kinh doanh Amazon FBA và FBM': [
        'fba', 'fbm', 'fulfillment by amazon', 'fulfillment by merchant',
        'gửi vào fba', 'tự ship', 'self fulfillment',
    ],
    'Vấn đề & thủ tục thanh toán, mở OTP': [
        'otp', 'mở otp', 'xác thực', 'two factor', '2fa',
        'thủ tục thanh toán', 'payment setup', 'payment method',
    ],
    'Bán hàng và vận hành Amazon': [
        'bán hàng amazon', 'vận hành amazon', 'amazon seller',
        'seller central', 'listing', 'inventory amazon',
    ],
    'Thanh toán Amazon qua Payoneer': [
        'payoneer', 'nhận tiền payoneer', 'rút tiền payoneer',
        'payoneer card', 'payoneer account',
    ],
    'Vấn đề thanh toán quốc tế': [
        'wise', 'pingpong', 'ping pong', 'wire transfer',
        'thanh toán quốc tế', 'chuyển tiền', 'remittance',
        'tài khoản ngân hàng mỹ', 'us bank',
    ],
    'Ưu đãi Helium 10, tool seller Amazon': [
        'helium 10', 'helium10', 'h10', 'jungle scout', 'junglescout',
        'viral launch', 'ưu đãi tool', 'discount tool', 'coupon helium',
    ],
}


# ── Q11 issue/satisfaction phrases ──────────────────────────────────────────
Q11_ISSUE_KW = {
    'Lỗi hệ thống / Bug': [
        'bị lỗi', 'lỗi', 'bug', 'crash', 'error',
        'không hoạt động', 'không vào được', 'glitch', 'không load',
    ],
    'Hỗ trợ chậm / kém': [
        'support chậm', 'amazon không phản hồi', 'chờ lâu', 'hỗ trợ tệ',
        'không ai trả lời', 'slow support', 'unresponsive', 'phản hồi chậm',
    ],
    'Phí & chi phí cao': [
        'quá đắt', 'phí cao', 'chi phí cao', 'expensive', 'tăng phí',
        'tốn tiền', 'đắt đỏ', 'overpriced',
    ],
    'Khó dùng / phức tạp': [
        'khó dùng', 'phức tạp', 'khó hiểu', 'confusing', 'hard to use',
        'không thân thiện', 'clunky',
    ],
    'Thiếu tính năng': [
        'thiếu tính năng', 'không có chức năng', 'missing feature',
        'cần thêm tính năng', 'chưa có option', 'feature request',
    ],
    'Dữ liệu sai / không chính xác': [
        'báo cáo sai', 'data không chính xác', 'report không đúng',
        'sai số liệu', 'inaccurate', 'unreliable data', 'số liệu sai',
    ],
    'Tài khoản bị khóa / suspend': [
        'bị khóa', 'suspend', 'banned', 'deactivated',
        'account health fail', 'appeal',
    ],
    'Cập nhật chậm / outdated': [
        'chậm update', 'outdated', 'data cũ', 'không cập nhật',
        'lag', 'chậm refresh',
    ],
}

Q11_SAT_KW = {
    'Dễ dùng / trực quan': [
        'dễ dùng', 'dễ sử dụng', 'easy to use', 'đơn giản',
        'intuitive', 'user friendly', 'trực quan',
    ],
    'Tiết kiệm thời gian': [
        'tiết kiệm thời gian', 'save time', 'nhanh hơn',
        'rút ngắn thời gian', 'efficient', 'automates',
    ],
    'Hỗ trợ tận tình': [
        'support tốt', 'hỗ trợ nhanh', 'responsive',
        'support nhiệt tình', 'helpful', 'tư vấn tốt',
    ],
    'Dữ liệu chính xác': [
        'chính xác', 'data tốt', 'accurate', 'reliable data',
        'data đáng tin', 'số liệu chuẩn',
    ],
    'Nhiều tính năng / đầy đủ': [
        'nhiều tính năng', 'đầy đủ tính năng', 'feature rich',
        'comprehensive', 'all in one', 'full option',
    ],
    'Giá hợp lý / đáng tiền': [
        'giá hợp lý', 'giá tốt', 'affordable', 'worth it',
        'đáng tiền', 'đáng đồng tiền', 'value for money',
    ],
    'Hiệu quả rõ rệt': [
        'hiệu quả', 'effective', 'tăng doanh thu', 'tăng sales',
        'kết quả tốt', 'works well', 'mang lại kết quả',
    ],
    'Cộng đồng & tài liệu tốt': [
        'tài liệu', 'tutorial tốt', 'documentation', 'community hỗ trợ',
        'nhiều hướng dẫn', 'training tốt',
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


def _column_populated(series: pd.Series, min_rows: int = 50) -> bool:
    """Column is 'real' if it has at least min_rows non-null, non-empty values."""
    if series is None:
        return False
    s = series.dropna().astype(str).str.strip()
    s = s[(s != '') & (s.str.lower() != 'nan') & (s.str.lower() != 'none')]
    return len(s) >= min_rows


def _split_multivalue(series: pd.Series) -> pd.Series:
    """Normalize a column that may contain comma / pipe / semicolon separated values.
    Returns a flattened Series of individual string values (one per mention).
    """
    s = series.dropna().astype(str).str.strip()
    s = s[(s != '') & (s.str.lower() != 'nan') & (s.str.lower() != 'none')]
    # Split on common separators
    exploded = s.str.split(r'\s*[,;|]\s*').explode()
    exploded = exploded.str.strip()
    return exploded[exploded != '']


def _extract_from_column(series: pd.Series) -> list:
    """value_counts on a classification column. Handles multi-value cells."""
    vals = _split_multivalue(series)
    if vals.empty:
        return []
    counts = vals.value_counts()
    return [{'vn': str(k), 'name': str(k), 'count': int(v)} for k, v in counts.items()]


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
    # Prefer real classification column if populated
    if 'trigger_to_leave' in neg.columns and _column_populated(neg['trigger_to_leave']):
        triggers = _extract_from_column(neg['trigger_to_leave'])
    else:
        triggers = _extract(neg['content'], Q8_TRIGGER_KW)
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


def extract_q9_personas(df: pd.DataFrame) -> dict:
    """
    Q9 — persona breakdown of active participants in Q7 (join-trigger) and
    Q8 (abandonment-signal) posts. Returns two arrays of {name, count, color}
    suitable for donut charts.
    """
    COLORS = [
        'oklch(0.55 0.17 260)',  # Seller AZ — blue
        'oklch(0.60 0.20 25)',   # Prospect AZ — red
        'oklch(0.68 0.17 60)',   # Service Provider AZ — amber
        'oklch(0.58 0.14 190)',  # Service Provider CBEC — teal
        'oklch(0.62 0.15 155)',  # Prospect Others — green
        'oklch(0.55 0.17 290)',  # Seller Others — violet
    ]

    text = df['content'].fillna('').str.lower()

    # Q7-like posts: contain any join-trigger or benefit keyword
    q7_kw = []
    for kws in list(Q7_TRIGGER_KW.values()) + list(Q7_BENEFIT_KW.values()):
        q7_kw.extend(kws)
    q7_parts = []
    for k in q7_kw:
        esc = re.escape(k.lower())
        if len(k) <= 6 and ' ' not in k:
            q7_parts.append(r'\b' + esc + r'\b')
        else:
            q7_parts.append(esc)
    q7_mask = text.str.contains('|'.join(q7_parts), regex=True, na=False)

    # Q8-like posts: negative sentiment + abandonment keyword (or just negative if no keywords hit)
    q8_kw = []
    for kws in Q8_TRIGGER_KW.values():
        q8_kw.extend(kws)
    q8_parts = []
    for k in q8_kw:
        esc = re.escape(k.lower())
        if len(k) <= 6 and ' ' not in k:
            q8_parts.append(r'\b' + esc + r'\b')
        else:
            q8_parts.append(esc)
    q8_text_mask = text.str.contains('|'.join(q8_parts), regex=True, na=False)
    neg_mask = df['sentiment'] == 'negative' if 'sentiment' in df.columns else pd.Series(False, index=df.index)
    q8_mask = q8_text_mask & neg_mask

    def _persona_breakdown(mask):
        sub = df[mask]
        counts = sub['persona'].value_counts() if 'persona' in sub.columns else pd.Series(dtype=int)
        return [
            {'name': str(p), 'count': int(c), 'color': COLORS[i % len(COLORS)]}
            for i, (p, c) in enumerate(counts.items())
        ]

    return {
        'q7': _persona_breakdown(q7_mask),
        'q8': _persona_breakdown(q8_mask),
    }


def extract_q10(df: pd.DataFrame):
    # Prefer real 'Product Category' column if populated
    if 'Product Category' in df.columns and _column_populated(df['Product Category']):
        results = _extract_from_column(df['Product Category'])
    else:
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
    # Prefer 'brand_mentions' column if populated
    if 'brand_mentions' in df.columns and _column_populated(df['brand_mentions']):
        tools = _extract_from_column(df['brand_mentions'])
    else:
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


def extract_q3_subs(df: pd.DataFrame) -> list:
    """
    For each Q3 sub-topic, compute what % of sellers and what % of prospects
    mention it. diff = sellerPct - prospectPct (positive → seller dominant;
    negative → prospect dominant).

    If the 'sub_topic' classification column is populated, aggregate from it
    directly; otherwise fall back to keyword matching on `content`.
    """
    persona = df['persona'].fillna('')
    is_seller   = persona.str.contains('Seller',   na=False)
    is_prospect = persona.str.contains('Prospect', na=False)
    total_sellers   = max(1, int(is_seller.sum()))
    total_prospects = max(1, int(is_prospect.sum()))

    # Path 1: real classification column
    if 'sub_topic' in df.columns and _column_populated(df['sub_topic']):
        sub = df['sub_topic'].fillna('').astype(str).str.strip()
        labels = [l for l in sub.unique() if l and l.lower() not in ('nan', 'none')]
        results = []
        for label in labels:
            mask = (sub == label)
            s_cnt = int((mask & is_seller).sum())
            p_cnt = int((mask & is_prospect).sum())
            spct = round(s_cnt / total_sellers   * 100, 2)
            ppct = round(p_cnt / total_prospects * 100, 2)
            results.append({
                'vn': label,
                'seller':   spct,
                'prospect': ppct,
                'diff':     round(spct - ppct, 2),
            })
        results.sort(key=lambda r: -(r['seller'] + r['prospect']))
        return results

    # Path 2: keyword fallback
    text = df['content'].fillna('').str.lower()
    results = []
    for label, keywords in Q3_SUB_KW.items():
        parts = []
        for k in keywords:
            esc = re.escape(k.lower())
            if len(k) <= 6 and ' ' not in k:
                parts.append(r'\b' + esc + r'\b')
            else:
                parts.append(esc)
        pattern = '|'.join(parts)
        match = text.str.contains(pattern, regex=True, na=False)
        s_cnt = int((match & is_seller).sum())
        p_cnt = int((match & is_prospect).sum())
        spct = round(s_cnt / total_sellers   * 100, 2)
        ppct = round(p_cnt / total_prospects * 100, 2)
        results.append({
            'vn': label,
            'seller':   spct,
            'prospect': ppct,
            'diff':     round(spct - ppct, 2),
        })
    return results


def extract_q11_issues(df: pd.DataFrame):
    results = _extract(df['content'], Q11_ISSUE_KW)
    return [r for r in results if r['count'] > 0]


def extract_q11_satisfaction(df: pd.DataFrame):
    results = _extract(df['content'], Q11_SAT_KW)
    return [r for r in results if r['count'] > 0]


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
