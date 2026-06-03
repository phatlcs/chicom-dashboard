-- ============================================================================
-- POOLED POSTS: Single pool of all posts across all months (no duplicates)
-- ============================================================================
CREATE TABLE IF NOT EXISTS pooled_posts_all (
  id BIGSERIAL PRIMARY KEY,
  post_id VARCHAR(255) NOT NULL UNIQUE,
  batch_id INTEGER NOT NULL REFERENCES data_batches(id),
  created_date TIMESTAMP,
  content TEXT,
  master_topic VARCHAR(255),
  sub_topic VARCHAR(255),
  persona VARCHAR(100),
  is_relevant BOOLEAN DEFAULT TRUE,
  pooled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_batch (batch_id),
  INDEX idx_topic (master_topic),
  INDEX idx_persona (persona),
  INDEX idx_date (created_date)
);

-- ============================================================================
-- PAGES: Registry of all pages (predefined + custom)
-- ============================================================================
CREATE TABLE IF NOT EXISTS pages (
  id SERIAL PRIMARY KEY,
  page_slug VARCHAR(255) NOT NULL UNIQUE,
  page_name VARCHAR(255) NOT NULL,
  time_range_start DATE NOT NULL,
  time_range_end DATE NOT NULL,
  filters JSONB DEFAULT '{}',
  page_type VARCHAR(50) DEFAULT 'custom',
  total_posts INTEGER DEFAULT 0,
  relevant_posts INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255),

  INDEX idx_slug (page_slug),
  INDEX idx_type (page_type)
);

-- ============================================================================
-- PAGE INSIGHTS: Stores all Q1-Q14 insights per page
-- ============================================================================
CREATE TABLE IF NOT EXISTS page_insights (
  id SERIAL PRIMARY KEY,
  page_id INTEGER NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  page_slug VARCHAR(255) NOT NULL UNIQUE,

  insights JSONB DEFAULT '{}',
  sample_post_ids JSONB DEFAULT '{}',

  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_slug (page_slug)
);

-- ============================================================================
-- NAME TRACKING: Auto-increment for duplicates
-- ============================================================================
CREATE TABLE IF NOT EXISTS report_name_index (
  base_name VARCHAR(255) NOT NULL UNIQUE,
  max_version INTEGER DEFAULT 0,
  last_used TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
