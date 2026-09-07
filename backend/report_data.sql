-- report_data.sql — NEW dynamic-report storage (Phase 1).
-- One row per generated report (slug). The old static pipeline
-- (generate_range.py → nextjs/public/<slug>.html → /api/report/[slug])
-- is untouched and keeps working.
--
-- Columns:
--   questions = raw text of the 14 research questions (and their answer keys)
--   queries   = per-question precomputed/pre-sorted data (exactly the aggregate
--               objects the heavy Q1..Q14 queries produced once, at store time)
--   insights  = Q1..Q14 LLM analyst paragraphs (expert insights)
--   snapshot  = full ChiComData + ChiComData2 + TOPIC_COLORS payloads for
--               exact render parity with the static pages
--
-- A write to this table happens when a report is generated. Reading a report
-- only reads this table back — no re-aggregation over pooled_posts_all.

CREATE TABLE IF NOT EXISTS report_data (
  id              BIGSERIAL PRIMARY KEY,
  slug            TEXT NOT NULL UNIQUE,
  report_name     TEXT NOT NULL,
  time_start      DATE NOT NULL,
  time_end        DATE NOT NULL,
  total_posts     INTEGER NOT NULL DEFAULT 0,
  relevant_posts  INTEGER NOT NULL DEFAULT 0,
  months          JSONB,
  groups          JSONB,
  questions       JSONB NOT NULL,
  queries         JSONB NOT NULL,
  insights        JSONB NOT NULL DEFAULT '{}',
  snapshot        JSONB,
  generator       TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_report_data_slug   ON report_data (slug);
CREATE INDEX IF NOT EXISTS idx_report_data_period ON report_data (time_start, time_end);