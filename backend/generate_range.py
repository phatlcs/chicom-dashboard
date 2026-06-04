"""
Called by the Next.js API to generate dashboard data for a date range from Postgres.
Usage: python generate_range.py <start> <end> <out_slug>
Writes public/dashboard/pages/<out_slug>.js
"""
import sys
import os
import pandas as pd
import psycopg2

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)

from backend import compute as compute_mod

def main():
    if len(sys.argv) < 4:
        print("Usage: generate_range.py <start> <end> <slug>", file=sys.stderr)
        sys.exit(1)

    start, end, slug = sys.argv[1], sys.argv[2], sys.argv[3]

    conn = psycopg2.connect(dbname="chicom_dashboard", user="postgres", host="localhost")
    df = pd.read_sql(f"""
        SELECT
            id::text             AS id,
            group_id,
            created_date         AS created_date,
            content,
            master_topic,
            sub_topic,
            persona,
            sentiment,
            is_relevant          AS relevant,
            batch_label
        FROM pooled_posts_all
        WHERE created_date BETWEEN '{start}'::date AND '{end}'::date
    """, conn)
    conn.close()

    if df.empty:
        print(f"No data for {start} to {end}", file=sys.stderr)
        sys.exit(2)

    # rename columns to match what compute expects
    df = df.rename(columns={"relevant": "relevant"})
    df["created_date"] = pd.to_datetime(df["created_date"])
    df["group_id"] = df["group_id"].fillna("").astype(str)

    js_str, info = compute_mod.compute_all(df, skip_llm=True)

    out_dir = os.path.join(ROOT, "nextjs", "public", "dashboard", "pages")
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, f"{slug}.js")
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(js_str)

    print(f"OK:{out_path}:{info.get('total',0)}:{info.get('relevant',0)}")

if __name__ == "__main__":
    main()
