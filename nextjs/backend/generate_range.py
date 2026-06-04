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
    cur = conn.cursor()
    cur.execute("""
        SELECT id::text, group_id, created_date, content, master_topic,
               sub_topic, persona, sentiment, is_relevant, batch_label
        FROM pooled_posts_all
        WHERE created_date BETWEEN %s::date AND %s::date
    """, (start, end))
    rows = cur.fetchall()
    cols = [d[0] for d in cur.description]
    cur.close(); conn.close()
    df = pd.DataFrame(rows, columns=cols)
    df = df.rename(columns={"is_relevant": "relevant"})

    if df.empty:
        print(f"No data for {start} to {end}", file=sys.stderr)
        sys.exit(2)

    df["created_date"] = pd.to_datetime(df["created_date"])
    df["group_id"] = df["group_id"].fillna("").astype(str)

    js_str, info = compute_mod.compute_all(df)

    out_dir = os.path.join(ROOT, "public", "dashboard", "pages")
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, f"{slug}.js")
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(js_str)

    print(f"OK:{out_path}:{info.get('totalPosts',0)}:{info.get('relevantPosts',0)}")

if __name__ == "__main__":
    main()
