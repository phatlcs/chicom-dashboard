CREATE TABLE IF NOT EXISTS pooled_posts_all (
  id BIGSERIAL PRIMARY KEY,
  post_id VARCHAR(255) NOT NULL UNIQUE,
  group_id VARCHAR(50),
  created_date TIMESTAMP,
  content TEXT,
  master_topic VARCHAR(255),
  sub_topic VARCHAR(255),
  persona VARCHAR(100),
  sentiment VARCHAR(50),
  is_relevant BOOLEAN DEFAULT TRUE,
  batch_label VARCHAR(100),
  pooled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pooled_date ON pooled_posts_all(created_date);
CREATE INDEX IF NOT EXISTS idx_pooled_topic ON pooled_posts_all(master_topic);
CREATE INDEX IF NOT EXISTS idx_pooled_persona ON pooled_posts_all(persona);
CREATE INDEX IF NOT EXISTS idx_pooled_batch ON pooled_posts_all(batch_label);
