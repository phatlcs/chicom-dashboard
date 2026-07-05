"""
Import CSV or XLSX data directly into the chicom_dashboard postgres DB.
Deduplicates by post_id (ON CONFLICT DO NOTHING).

Usage: python import_data.py <filepath> [batch_label]
Output: OK:<inserted>:<skipped>:<total>  (stdout)
        ERROR:<message>                   (stderr + exit 1)
"""
import sys
import os
import json

import pandas as pd
import psycopg2

REQUIRED_COLS = {'post_id', 'group_id', 'created_date', 'content'}

def coerce_bool(val) -> bool:
    if isinstance(val, bool):
        return val
    if isinstance(val, (int, float)):
        return bool(val)
    s = str(val).strip().lower()
    return s in ('1', 'true', 'yes', 't')

def main():
    if len(sys.argv) < 2:
        print("Usage: import_data.py <filepath> [batch_label]", file=sys.stderr)
        sys.exit(1)

    filepath = sys.argv[1]
    batch_label = sys.argv[2] if len(sys.argv) > 2 else os.path.basename(filepath)

    # --- load file ---
    try:
        ext = os.path.splitext(filepath)[1].lower()
        if ext in ('.xlsx', '.xls'):
            df = pd.read_excel(filepath)
        else:
            # Try UTF-8 then fall back to UTF-8-sig (BOM)
            try:
                df = pd.read_csv(filepath, encoding='utf-8')
            except UnicodeDecodeError:
                df = pd.read_csv(filepath, encoding='utf-8-sig')
    except Exception as e:
        print(f"ERROR:cannot read file: {e}", file=sys.stderr)
        sys.exit(1)

    # --- validate columns ---
    missing = REQUIRED_COLS - set(df.columns)
    if missing:
        print(f"ERROR:missing required columns: {sorted(missing)}", file=sys.stderr)
        sys.exit(1)

    # --- normalise ---
    df['post_id'] = df['post_id'].astype(str).str.strip()
    df['created_date'] = pd.to_datetime(df['created_date'], errors='coerce').dt.date
    df['is_relevant'] = df['is_relevant'].apply(coerce_bool) if 'is_relevant' in df.columns else True

    optional = ['master_topic', 'sub_topic', 'persona', 'sentiment', 'batch_label']
    for col in optional:
        if col not in df.columns:
            df[col] = None

    df['batch_label'] = df['batch_label'].fillna(batch_label)

    # Drop rows with no post_id or bad date
    df = df[df['post_id'].notna() & (df['post_id'] != '') & df['created_date'].notna()]

    # --- insert ---
    try:
        conn = psycopg2.connect(dbname="chicom_dashboard", user="postgres", host="localhost")
        cur = conn.cursor()
    except Exception as e:
        print(f"ERROR:db connect failed: {e}", file=sys.stderr)
        sys.exit(1)

    inserted = skipped = errors = 0
    for _, row in df.iterrows():
        try:
            cur.execute(
                """
                INSERT INTO pooled_posts_all
                  (post_id, group_id, created_date, content,
                   master_topic, sub_topic, persona, sentiment,
                   is_relevant, batch_label)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (post_id) DO NOTHING
                """,
                (
                    str(row['post_id']),
                    str(row['group_id']) if pd.notna(row.get('group_id')) else None,
                    row['created_date'],
                    str(row['content']) if pd.notna(row.get('content')) else '',
                    str(row['master_topic']) if pd.notna(row.get('master_topic')) else None,
                    str(row['sub_topic']) if pd.notna(row.get('sub_topic')) else None,
                    str(row['persona']) if pd.notna(row.get('persona')) else None,
                    str(row['sentiment']) if pd.notna(row.get('sentiment')) else None,
                    coerce_bool(row['is_relevant']),
                    str(row['batch_label']) if pd.notna(row.get('batch_label')) else batch_label,
                ),
            )
            if cur.rowcount > 0:
                inserted += 1
            else:
                skipped += 1
        except Exception as e:
            errors += 1
            if errors <= 5:
                print(f"  row error: {e}", file=sys.stderr)

    conn.commit()
    cur.close()
    conn.close()

    total = inserted + skipped
    print(f"OK:{inserted}:{skipped}:{total}:{errors}")

if __name__ == '__main__':
    main()
