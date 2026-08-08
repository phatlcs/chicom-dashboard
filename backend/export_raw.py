"""
export_raw.py  <start> <end> <out_path>

Queries pooled_posts_all for the date range and writes an xlsx file
in the same column format as the classified input files.
"""
import sys, os
import pandas as pd
import psycopg2

def main():
    if len(sys.argv) != 4:
        print("usage: export_raw.py <start> <end> <out_path>", file=sys.stderr)
        sys.exit(1)

    start, end, out_path = sys.argv[1], sys.argv[2], sys.argv[3]

    from dotenv import load_dotenv
    for candidate in [
        os.path.join(os.path.dirname(__file__), '..', '.env'),
        os.path.join(os.path.dirname(__file__), '.env'),
    ]:
        if os.path.exists(candidate):
            load_dotenv(candidate)
            break

    conn = psycopg2.connect(
        host=os.getenv('DB_HOST', 'localhost'),
        port=int(os.getenv('DB_PORT', 5432)),
        dbname=os.getenv('DB_NAME', 'chicom_dashboard'),
        user=os.getenv('DB_USER', 'postgres'),
        password=os.getenv('DB_PASSWORD', 'chicom2024'),
    )

    df = pd.read_sql("""
        SELECT
            post_id,
            group_id,
            created_date,
            content,
            master_topic,
            sub_topic,
            persona,
            sentiment,
            post_type        AS "Type",
            is_relevant      AS relevant,
            batch_label
        FROM pooled_posts_all
        WHERE created_date BETWEEN %(start)s::date AND %(end)s::date
        ORDER BY
            group_id::int,
            created_date,
            post_id
    """, conn, params={'start': start, 'end': end})

    conn.close()

    df.to_excel(out_path, index=False, engine='openpyxl')
    print(f"OK:{len(df)}")

if __name__ == '__main__':
    main()
