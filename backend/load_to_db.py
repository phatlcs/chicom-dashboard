"""Load Q1 and April CSVs into pooled_posts_all on EC2."""
import pandas as pd
import psycopg2
import sys
import os

CONN = psycopg2.connect(
    dbname="chicom_dashboard", user="postgres", host="localhost"
)

FILES = [
    ("output/filtered/Q1_2026_classified_combined_cleaned.csv", "Q1_2026"),
    ("output/filtered/Apr_2026_classified_combined_cleaned.csv", "Apr_2026"),
]

def load(path, batch_label):
    df = pd.read_csv(path, low_memory=False)
    # Only relevant posts
    df = df[df["relevant"] == True].copy()
    df["post_id"] = df["id"].astype(str) + "_" + batch_label
    df["created_date"] = pd.to_datetime(df["created_date"], errors="coerce").dt.date
    df["group_id"] = df["group_id"].astype(str)
    df["batch_label"] = batch_label
    df["is_relevant"] = True

    cur = CONN.cursor()
    inserted = 0
    skipped = 0
    for _, row in df.iterrows():
        try:
            cur.execute("""
                INSERT INTO pooled_posts_all
                  (post_id, group_id, created_date, content, master_topic, sub_topic,
                   persona, sentiment, is_relevant, batch_label)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                ON CONFLICT (post_id) DO NOTHING
            """, (
                row["post_id"],
                row.get("group_id"),
                row.get("created_date"),
                str(row.get("content", ""))[:5000],
                row.get("master_topic"),
                row.get("sub_topic"),
                row.get("persona"),
                row.get("sentiment"),
                True,
                batch_label,
            ))
            if cur.rowcount > 0:
                inserted += 1
            else:
                skipped += 1
        except Exception as e:
            CONN.rollback()
            print(f"  Error on row: {e}")
            continue
    CONN.commit()
    cur.close()
    print(f"  {batch_label}: {inserted} inserted, {skipped} skipped")

for path, label in FILES:
    base = os.path.expanduser("~")
    full = os.path.join(base, path)
    print(f"Loading {label} from {full}...")
    load(full, label)

CONN.close()
print("Done.")
