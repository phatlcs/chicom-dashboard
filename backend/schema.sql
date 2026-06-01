-- PostgreSQL Schema for ChiCom Dashboard
-- Supports monthly data pooling from XLSX uploads and Esuit/Automa integrations

-- ============================================================================
-- 1. Core Data Tables
-- ============================================================================

-- Groups/Communities
CREATE TABLE groups (
  id SERIAL PRIMARY KEY,
  group_id INTEGER NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  short_name VARCHAR(100),
  type VARCHAR(50) NOT NULL, -- 'SOA' or 'EC'
  platform VARCHAR(50) DEFAULT 'Facebook',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Raw posts (before classification)
CREATE TABLE posts (
  id BIGSERIAL PRIMARY KEY,
  post_id VARCHAR(255) NOT NULL UNIQUE,
  group_id INTEGER NOT NULL REFERENCES groups(group_id),
  author_name VARCHAR(255),
  author_id VARCHAR(255),
  created_date TIMESTAMP NOT NULL,
  content TEXT NOT NULL,
  title VARCHAR(500),
  depth INTEGER,
  post_type VARCHAR(50), -- 'post', 'comment', etc.
  platform VARCHAR(50) DEFAULT 'Facebook',
  link VARCHAR(500),
  context TEXT, -- nested context
  imported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  data_batch_id INTEGER, -- FK to data_batches for audit trail
  FOREIGN KEY (data_batch_id) REFERENCES data_batches(id)
);

-- Classification data (after LLM processing)
CREATE TABLE post_classifications (
  id BIGSERIAL PRIMARY KEY,
  post_id BIGINT NOT NULL UNIQUE REFERENCES posts(id),
  master_topic VARCHAR(255),
  sub_topic VARCHAR(255),
  sentiment VARCHAR(50), -- 'positive', 'negative', 'neutral'
  persona VARCHAR(100), -- 'Seller (Amazon)', 'Service Provider (CBEC)', etc.
  brand_mentions TEXT, -- CSV or JSON array of brands
  product_category VARCHAR(255), -- For Q10
  recommendation TEXT,
  granular_topic VARCHAR(255),
  trigger_to_leave VARCHAR(50), -- Binary flag
  relevant BOOLEAN DEFAULT TRUE,
  irrelevant_type VARCHAR(100),
  classified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  llm_model VARCHAR(100),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

-- Data batches (import history & metadata)
CREATE TABLE data_batches (
  id SERIAL PRIMARY KEY,
  batch_name VARCHAR(255) NOT NULL,
  month_year DATE NOT NULL, -- e.g., 2026-04-01 for April 2026
  source VARCHAR(50) NOT NULL, -- 'XLSX_UPLOAD', 'ESUIT', 'AUTOMA'
  total_posts INTEGER,
  posts_classified INTEGER DEFAULT 0,
  posts_relevant INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'PENDING', -- 'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'
  uploaded_by VARCHAR(255),
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processing_started_at TIMESTAMP,
  processing_completed_at TIMESTAMP,
  error_message TEXT,
  UNIQUE(month_year, source)
);

-- ============================================================================
-- 2. Aggregation & Computed Results
-- ============================================================================

-- Monthly aggregates (Q1-Q14 computed data)
CREATE TABLE monthly_aggregates (
  id SERIAL PRIMARY KEY,
  batch_id INTEGER NOT NULL REFERENCES data_batches(id),
  question_number INTEGER NOT NULL, -- 1-14
  aggregation_data JSONB NOT NULL, -- Q1: subtopics, Q2: persona matrix, etc.
  computed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(batch_id, question_number)
);

-- Monthly insights (LLM-generated analyst paragraphs)
CREATE TABLE monthly_insights (
  id SERIAL PRIMARY KEY,
  batch_id INTEGER NOT NULL REFERENCES data_batches(id),
  question_number INTEGER NOT NULL,
  insight_text TEXT NOT NULL,
  language VARCHAR(10) DEFAULT 'vi', -- 'vi' for Vietnamese, 'en' for English
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(batch_id, question_number, language)
);

-- ============================================================================
-- 3. Configuration & Admin
-- ============================================================================

-- Persona definitions (dropdown reference)
CREATE TABLE personas (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  short_name VARCHAR(50),
  category VARCHAR(50), -- 'Seller', 'Service Provider', 'Prospect'
  segment VARCHAR(50), -- 'Amazon', 'CBEC', 'Others'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Master topics (taxonomy reference)
CREATE TABLE master_topics (
  id SERIAL PRIMARY KEY,
  vn_name VARCHAR(255) NOT NULL,
  en_name VARCHAR(255) NOT NULL,
  order_index INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(en_name)
);

-- Sub-topics (taxonomy reference)
CREATE TABLE sub_topics (
  id SERIAL PRIMARY KEY,
  master_topic_id INTEGER NOT NULL REFERENCES master_topics(id),
  vn_name VARCHAR(255) NOT NULL,
  en_name VARCHAR(255) NOT NULL,
  order_index INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(master_topic_id, en_name)
);

-- Product categories (Q10 reference)
CREATE TABLE product_categories (
  id SERIAL PRIMARY KEY,
  vn_name VARCHAR(255) NOT NULL,
  en_name VARCHAR(255) NOT NULL UNIQUE,
  order_index INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 4. Indexes for Performance
-- ============================================================================

CREATE INDEX idx_posts_group_id ON posts(group_id);
CREATE INDEX idx_posts_created_date ON posts(created_date);
CREATE INDEX idx_posts_batch_id ON posts(data_batch_id);
CREATE INDEX idx_classifications_master_topic ON post_classifications(master_topic);
CREATE INDEX idx_classifications_sentiment ON post_classifications(sentiment);
CREATE INDEX idx_classifications_persona ON post_classifications(persona);
CREATE INDEX idx_classifications_relevant ON post_classifications(relevant);
CREATE INDEX idx_batches_month_year ON data_batches(month_year);
CREATE INDEX idx_batches_status ON data_batches(status);
CREATE INDEX idx_aggregates_batch_question ON monthly_aggregates(batch_id, question_number);
CREATE INDEX idx_insights_batch_question ON monthly_insights(batch_id, question_number);

-- ============================================================================
-- 5. Views for Dashboard
-- ============================================================================

-- View: Monthly summary stats
CREATE VIEW monthly_summary AS
SELECT
  db.month_year,
  db.source,
  COUNT(p.id) as total_posts,
  COUNT(CASE WHEN pc.relevant = TRUE THEN 1 END) as relevant_posts,
  COUNT(DISTINCT p.group_id) as groups_represented,
  db.status,
  db.uploaded_at
FROM data_batches db
LEFT JOIN posts p ON db.id = p.data_batch_id
LEFT JOIN post_classifications pc ON p.id = pc.post_id
GROUP BY db.id, db.month_year, db.source, db.status, db.uploaded_at;

-- View: Master topic distribution by month
CREATE VIEW topic_distribution_monthly AS
SELECT
  db.month_year,
  mt.en_name as master_topic,
  COUNT(pc.id) as count,
  ROUND(100.0 * COUNT(pc.id) / SUM(COUNT(pc.id)) OVER (PARTITION BY db.month_year), 2) as percentage
FROM data_batches db
JOIN posts p ON db.id = p.data_batch_id
JOIN post_classifications pc ON p.id = pc.post_id
JOIN master_topics mt ON pc.master_topic = mt.vn_name
WHERE pc.relevant = TRUE
GROUP BY db.month_year, mt.id, mt.en_name;

-- View: Persona distribution by month
CREATE VIEW persona_distribution_monthly AS
SELECT
  db.month_year,
  COALESCE(pc.persona, 'Unclassified') as persona,
  COUNT(pc.id) as count,
  ROUND(100.0 * COUNT(pc.id) / SUM(COUNT(pc.id)) OVER (PARTITION BY db.month_year), 2) as percentage
FROM data_batches db
JOIN posts p ON db.id = p.data_batch_id
LEFT JOIN post_classifications pc ON p.id = pc.post_id
GROUP BY db.month_year, pc.persona;

-- ============================================================================
-- 6. Initial Data
-- ============================================================================

-- Insert groups
INSERT INTO groups (group_id, name, short_name, type) VALUES
(1, 'Amazon Sellers Viet Nam', 'Amazon Sellers VN', 'SOA'),
(2, 'Cộng đồng Amazon Sellers VN', 'CĐ Amazon Sellers', 'SOA'),
(3, 'Cộng Đồng MMO', 'MMO', 'EC'),
(4, 'Cuồng Phong Hội (Crossborder CBEC)', 'Cuồng Phong Hội', 'EC'),
(5, 'Cộng Đồng Dropshipping & Shopify VN', 'Dropship & Shopify', 'EC'),
(6, 'Chuyện Nhà Bán (Shopee/TikTok)', 'Chuyện Nhà Bán', 'EC'),
(7, 'Etsy To Go', 'Etsy To Go', 'EC'),
(8, 'Etsy E-Z Cộng Đồng Etsy Việt', 'Etsy E-Z', 'EC'),
(9, 'Cộng đồng ETSY Việt Nam', 'ETSY VN', 'EC');

-- Insert personas
INSERT INTO personas (name, short_name, category, segment) VALUES
('Seller (Amazon)', 'Seller AZ', 'Seller', 'Amazon'),
('Prospect (Amazon)', 'Prospect AZ', 'Prospect', 'Amazon'),
('Service Provider (Amazon)', 'SVC AZ', 'Service Provider', 'Amazon'),
('Service Provider (CBEC)', 'SVC CBEC', 'Service Provider', 'CBEC'),
('Prospect (Others)', 'Prospect Ot', 'Prospect', 'Others'),
('Seller (Others)', 'Seller Ot', 'Seller', 'Others');

-- Insert master topics
INSERT INTO master_topics (vn_name, en_name, order_index) VALUES
('Khác', 'Others', 1),
('Bán hàng trên Amazon (SOA)', 'Selling on Amazon (SOA)', 2),
('Vận chuyển & Logistics', 'Logistics & fulfillment', 3),
('Sức khỏe tài khoản', 'Account health', 4),
('Dịch vụ bên thứ ba', 'Third-party services', 5),
('Tạo tài khoản', 'Account creation', 6),
('Quảng cáo', 'Advertising', 7),
('Danh sách & Danh mục', 'Listing & catalog', 8),
('Đăng ký thương hiệu', 'Brand Registry & IP', 9);

-- Insert product categories (Q10)
INSERT INTO product_categories (vn_name, en_name, order_index) VALUES
('Làm đẹp & Sức khỏe / Supplements', 'Health & Beauty / Supplements', 1),
('Nhãn hiệu riêng (chưa tiết lộ)', 'Private Label (undisclosed)', 2),
('Thời trang & Quần áo', 'Apparel & Fashion', 3),
('Nhà & Vườn', 'Home & Garden', 4),
('Điện tử (Nguồn Trung Quốc)', 'Electronics (China-sourced)', 5),
('Đồ chơi & Trò chơi', 'Toys & Games', 6),
('Nhà bếp & Đồ dùng', 'Kitchen & Home Goods', 7),
('Trang sức & Phụ kiện', 'Jewelry & Accessories', 8),
('Sản phẩm Thú cưng', 'Pet Products', 9),
('Sản phẩm Nông nghiệp USDA', 'USDA Agricultural Products', 10);
