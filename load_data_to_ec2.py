#!/usr/bin/env python3
"""
Load local CSV data directly into EC2 PostgreSQL database
"""
import csv
import sys
from pathlib import Path
from datetime import datetime

try:
    import psycopg2
    from psycopg2.extras import execute_values
except ImportError:
    print("Installing psycopg2...")
    import subprocess
    subprocess.check_call([sys.executable, '-m', 'pip', 'install', '-q', 'psycopg2-binary'])
    import psycopg2
    from psycopg2.extras import execute_values

# EC2 Database config
DB_HOST = "ec2-18-141-25-84.ap-southeast-1.compute.amazonaws.com"
DB_PORT = 5432
DB_NAME = "chicom_dashboard"
DB_USER = "postgres"
DB_PASSWORD = "chicom2024"

def load_data(csv_file, month_year, source="upload"):
    """Load CSV data into PostgreSQL"""

    conn = psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        database=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD
    )
    cur = conn.cursor()

    try:
        # Read CSV
        print(f"Reading {csv_file.name}...")
        rows = []
        total_rows = 0
        relevant_rows = 0

        with open(csv_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                total_rows += 1

                # Only include relevant posts
                if row.get('relevant') == 'True' or row.get('relevant') == 'true' or row.get('relevant') == '1':
                    relevant_rows += 1

                rows.append(row)

        print(f"  Total rows: {total_rows}, Relevant: {relevant_rows}")

        # Create batch record
        batch_name = f"{csv_file.stem}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

        cur.execute("""
            INSERT INTO data_batches (batch_name, month_year, source, total_posts, posts_relevant, status, uploaded_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (batch_name, f"{month_year}-01", source, total_rows, relevant_rows, 'COMPLETED', datetime.now()))

        batch_id = cur.fetchone()[0]
        print(f"Created batch {batch_id}: {batch_name}")

        # Insert posts and classifications
        posts_data = []
        classifications_data = []

        for row in rows:
            # Insert into posts table
            posts_data.append((
                batch_id,
                row.get('id', ''),
                row.get('group_id', ''),
                row.get('created_date', ''),
                row.get('content', '')[:5000],  # Limit content
                row.get('Type', '')
            ))

            # Insert into classifications
            is_relevant = row.get('relevant') in ('True', 'true', '1')
            classifications_data.append((
                batch_id,
                row.get('id', ''),
                row.get('master_topic', ''),
                row.get('sub_topic', ''),
                row.get('persona', ''),
                is_relevant
            ))

        # Bulk insert posts
        if posts_data:
            execute_values(cur, """
                INSERT INTO posts (batch_id, post_id, group_id, created_date, content, post_type)
                VALUES %s
                ON CONFLICT (post_id) DO NOTHING
            """, posts_data, page_size=1000)
            print(f"  Inserted {len(posts_data)} posts")

        # Bulk insert classifications
        if classifications_data:
            execute_values(cur, """
                INSERT INTO post_classifications (batch_id, post_id, master_topic, sub_topic, persona, is_relevant)
                VALUES %s
                ON CONFLICT (batch_id, post_id) DO NOTHING
            """, classifications_data, page_size=1000)
            print(f"  Inserted {len(classifications_data)} classifications")

        conn.commit()
        print(f"✓ Successfully loaded {csv_file.name} to batch {batch_id}")
        return True

    except Exception as e:
        conn.rollback()
        print(f"✗ Error loading {csv_file.name}: {e}")
        return False
    finally:
        cur.close()
        conn.close()

if __name__ == '__main__':
    base_dir = Path(__file__).parent / 'output' / 'filtered'

    # Load April 2026 data
    april_file = base_dir / 'Apr_2026_classified_combined_cleaned.csv'
    if april_file.exists():
        print(f"\n{'='*60}")
        print("Loading April 2026 data...")
        print('='*60)
        load_data(april_file, '2026-04')

    # Load Q1 2026 data
    q1_file = base_dir / 'Q1_2026_classified_combined_cleaned.csv'
    if q1_file.exists():
        print(f"\n{'='*60}")
        print("Loading Q1 2026 data...")
        print('='*60)
        load_data(q1_file, '2026-01')

    print(f"\n{'='*60}")
    print("✓ Data loading complete!")
    print('='*60)
