#!/usr/bin/env python3
"""
NEW dynamic-report store (Phase 1). The old static pipeline is left untouched:
generate_range.py still writes nextjs/public/<slug>.html exactly as before.

This script computes the SAME data and additionally persists a single
report_data row (JSONB) that the new /api/report-data/* routes serve, so a
report can be viewed without re-running the heavy Q1..Q14 aggregations.

Usage:
  python report_store.py <start> <end> <slug> [report_name] [--no-llm]

Examples:
  python report_store.py 2026-08-01 2026-08-31 aug-2026 "August 2026"
  python report_store.py 2026-08-01 2026-08-31 aug-2026 "August 2026" --no-llm
"""
import sys
import os
import json
import argparse
import subprocess

import pandas as pd
import psycopg2
from psycopg2.extras import Json

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)

from backend import compute as compute_mod

# The 14 research questions, exactly as rendered by dashboard/app.jsx.
QUESTIONS = {
    "Q1":  "Master Topics most discussed — share of relevant posts per group and overall",
    "Q2":  "Master Topic distribution per target persona",
    "Q3":  "Seller vs Prospect — Master Topic and sub-topic differences",
    "Q4":  "Master Topic trends across months, weeks and key events",
    "Q5":  "Negative discussion — busiest day of the week (with SOA/EC split)",
    "Q6":  "Negative discussion — busiest hour of the day (with SOA/EC split)",
    "Q7":  "Topics and benefits that encourage sellers to join Amazon",
    "Q8":  "Key indicators of sellers abandoning Amazon (SOA groups only)",
    "Q9":  "Top 10 most-engaged discussion threads",
    "Q10": "Top mentioned product categories / selection trends",
    "Q11": "Top mentioned Amazon tools, programs and seller pain points (SOA only)",
    "Q12": "3rd-party outsourcing services sellers need (SOA groups only)",
    "Q13": "Amazon course topics sellers are interested in (SOA groups only)",
    "Q14": "Business growth and P&L discussion — positive vs negative (SOA only)",
}

# Per-question key map: turns the computed ChiComData / ChiComData2 objects
# into the `queries` JSONB column (one object per Q, pre-sorted aggregates).
# Key names match compute.py's JS assembly exactly.
QUERY_KEYS = {
    "Q1":  ["ALL_GROUPS", "SOA_GROUPS", "EC_GROUPS", "MASTER_TOPICS",
            "Q1_MASTER", "Q1_WEIGHTS", "Q1_SUBTOPICS", "SUBTOPICS",
            "MASTER_TOPIC_COUNTS", "SOA_SCOPE"],
    "Q2":  ["Q2_MATRIX", "Q2_MATRIX_SOA", "Q2_MATRIX_EC", "PERSONAS", "PERSONA_BY_GROUP"],
    "Q3":  ["Q3_SELLER_PROSPECT", "Q3_SUBS"],
    "Q4":  ["MONTHS", "Q4_TRENDS", "WEEKS", "Q4_EVENTS", "Q4_WEEKLY"],
    "Q5":  ["Q5_BY_DAY", "Q5_BY_DAY_SOA", "Q5_BY_DAY_EC",
            "Q5_TOP_NEG", "Q5_TOP_NEG_SOA", "Q5_TOP_NEG_EC",
            "Q5_EARLY_DIST", "Q5_PEAK_WINDOW", "DAYS_VN", "DAYS_EN"],
    "Q6":  ["Q6_BY_HOUR", "Q6_BY_HOUR_SOA", "Q6_BY_HOUR_EC", "Q56_HEATMAP",
            "DAYS_VN", "DAYS_EN"],
    "Q7":  ["Q7_TOPICS", "Q7_TOPICS_SOA", "Q7_TOPICS_EC",
            "Q7_BENEFITS", "Q7_BENEFITS_SOA", "Q7_BENEFITS_EC",
            "Q7_SENTIMENT", "Q7_SENTIMENT_SOA", "Q7_SENTIMENT_EC",
            "Q7_POS_SUBS_SOA", "Q7_POS_SUBS_EC"],
    "Q8":  ["Q8_TRIGGERS", "Q8_PERSONA", "Q8_TREND", "SOA_SCOPE"],
    "Q9":  ["Q9_BARRIERS",
            "Q9_Q7_PERSONAS", "Q9_Q8_PERSONAS",
            "Q9_Q7_PERSONAS_SOA", "Q9_Q8_PERSONAS_SOA",
            "Q9_Q7_PERSONAS_EC", "Q9_Q8_PERSONAS_EC",
            "Q9_TOP_THREADS", "Q9_TOP_THREADS_SOA", "Q9_TOP_THREADS_EC"],
    "Q10": ["Q10_TOP", "Q10_TOP_SOA", "Q10_TOP_EC", "Q10_KEYWORDS",
            "Q10_WEEKS", "Q10_WEEKLY", "Q10_SUBS_SOA", "Q10_SUBS_EC"],
    "Q11": ["Q11_TOOLS", "Q11_ISSUES", "Q11_SATISFACTION", "SOA_SCOPE"],
    "Q12": ["Q12_SERVICES", "Q12_SERVICES_SOA", "Q12_SERVICES_EC", "SOA_SCOPE"],
    "Q13": ["Q13_COURSES", "Q13_COURSES_SOA", "Q13_COURSES_EC", "SOA_SCOPE"],
    "Q14": ["Q14_GROWTH", "Q14_GROWTH_SOA", "Q14_GROWTH_EC", "SOA_SCOPE", "KPI"],
}

# Evaluate the generated JS in Node to recover the exact payloads the static
# page would mount as window.TOPIC_COLORS / window.ChiComData / window.ChiComData2.
NODE_EXTRACT = r"""
const fs = require('fs');
global.window = {};
eval(fs.readFileSync(0, 'utf8'));
process.stdout.write(JSON.stringify({
  topicColors: global.window.TOPIC_COLORS || null,
  d1: global.window.ChiComData || null,
  d2: global.window.ChiComData2 || null,
}));
"""


def query_rows(start, end):
    conn = psycopg2.connect(dbname="chicom_dashboard", user="postgres", host="localhost")
    cur = conn.cursor()
    cur.execute("""
        SELECT id::text, group_id, created_date, content, master_topic,
               sub_topic, persona, sentiment, is_relevant, batch_label,
               post_type, post_id
        FROM pooled_posts_all
        WHERE created_date BETWEEN %s::date AND %s::date
    """, (start, end))
    rows = cur.fetchall()
    cols = [d[0] for d in cur.description]
    cur.close()
    conn.close()
    return rows, cols


def extract_payloads(js_str):
    proc = subprocess.run(
        ["node", "-e", NODE_EXTRACT], input=js_str,
        capture_output=True, text=True, encoding="utf-8",
    )
    if proc.returncode != 0:
        raise RuntimeError(f"node eval failed: {proc.stderr}")
    return json.loads(proc.stdout)


def build_queries(d1, d2):
    def get_key(k):
        if k in d1:
            return d1[k]
        if k in d2:
            return d2[k]
        return None

    queries = {}
    for qid, keys in QUERY_KEYS.items():
        qd = {k: get_key(k) for k in keys}
        queries[qid] = {k: v for k, v in qd.items() if v is not None}
    return queries


def main():
    p = argparse.ArgumentParser()
    p.add_argument("start")
    p.add_argument("end")
    p.add_argument("slug")
    p.add_argument("report_name", nargs="?", default=None)
    p.add_argument("--no-llm", action="store_true",
                   help="skip LLM analyst paragraphs (fast, no API calls)")
    args = p.parse_args()

    report_name = args.report_name or args.slug

    rows, cols = query_rows(args.start, args.end)
    df = pd.DataFrame(rows, columns=cols)
    df = df.rename(columns={"is_relevant": "relevant"})
    if df.empty:
        print(f"No data for {args.start} to {args.end}", file=sys.stderr)
        sys.exit(2)
    df["created_date"] = pd.to_datetime(df["created_date"])
    df["group_id"] = pd.to_numeric(df["group_id"], errors="coerce").astype("Int64")

    js_str, info = compute_mod.compute_all(df, skip_llm=args.no_llm)

    payload = extract_payloads(js_str)
    d1 = payload.get("d1") or {}
    d2 = payload.get("d2") or {}

    queries = build_queries(d1, d2)
    expert_insights = {k: v for k, v in (info.get("insights") or {}).items() if v}
    snapshot = {
        "topicColors": payload.get("topicColors"),
        "d1": d1,
        "d2": d2,
    }

    conn = psycopg2.connect(dbname="chicom_dashboard", user="postgres", host="localhost")
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO report_data
          (slug, report_name, time_start, time_end, total_posts, relevant_posts,
           months, groups, questions, queries, insights, snapshot, generator)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (slug) DO UPDATE SET
          report_name   = EXCLUDED.report_name,
          time_start    = EXCLUDED.time_start,
          time_end      = EXCLUDED.time_end,
          total_posts   = EXCLUDED.total_posts,
          relevant_posts= EXCLUDED.relevant_posts,
          months        = EXCLUDED.months,
          groups        = EXCLUDED.groups,
          questions     = EXCLUDED.questions,
          queries       = EXCLUDED.queries,
          insights      = EXCLUDED.insights,
          snapshot      = EXCLUDED.snapshot,
          generator     = EXCLUDED.generator,
          updated_at    = now()
        RETURNING id
    """, (args.slug, report_name, args.start, args.end,
          int(info.get("totalPosts") or 0), int(info.get("relevantPosts") or 0),
          Json(info.get("months") or []), Json(info.get("groups") or []),
          Json(QUESTIONS), Json(queries), Json(expert_insights), Json(snapshot),
          "report_store.py"))
    row = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()

    print(f"STORED:{row[0]}:{args.slug}:{args.start}:{args.end}:"
          f"{info.get('totalPosts', 0)}:{info.get('relevantPosts', 0)}:"
          f"insights={len(expert_insights)}")


if __name__ == "__main__":
    main()