#!/usr/bin/env python3
"""
Load CSV data into pooled_posts_all table
This consolidates all data from different batches into one pool
"""
import csv
import sys
import os
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

# Database config
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'port': int(os.getenv('DB_PORT', 5432)),
    'database': os.getenv('DB_NAME', 'chicom_dashboard'),
    'user': os.getenv('DB_USER', 'postgres'),
    'password': os.getenv('DB_PASSWORD', ''),
}


def load_csv_to_pooled(csv_file: Path, month_year: str = None) -> bool:
    """Load CSV file into pooled_posts_all"""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()

        print(f"Reading {csv_file.name}...")

        # First, create batch record
        batch_name = csv_file.stem
        if month_year is None:
            # Try to extract from filename
            if 'april' in csv_file.name.lower() or 'apr' in csv_file.name.lower():
                month_year = '2026-04'
            elif 'q1' in csv_file.name.lower():
                month_year = '2026-01'
            else:
                month_year = '2026-01'

        cur.execute(
            """
            INSERT INTO data_batches (batch_name, month_year, source, status, uploaded_at)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id
            """,
            (batch_name, f'{month_year}-01', 'import', 'PROCESSING', datetime.now()),
        )
        batch_id = cur.fetchone()[0]
        conn.commit()
        print(f"✓ Created batch {batch_id}: {batch_name}")

        # Read CSV and insert
        rows_read = 0
        rows_relevant = 0
        pooled_data = []

        with open(csv_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)

            for row_num, row in enumerate(reader, 1):
                rows_read += 1

                # Check if relevant
                is_relevant = row.get('relevant', '').lower() in ('true', '1', 'yes')
                if is_relevant:
                    rows_relevant += 1

                # Map CSV columns to pooled_posts_all columns
                try:
                    created_date = row.get('created_date', '')
                    # Try to parse date - handle various formats
                    if created_date:
                        try:
                            dt = datetime.strptime(created_date, '%Y-%m-%d')
                        except:
                            try:
                                dt = datetime.strptime(created_date, '%Y-%m-%d %H:%M:%S')
                            except:
                                dt = None
                    else:
                        dt = None

                    pooled_data.append(
                        (
                            batch_id,
                            row.get('id', f'post_{row_num}'),
                            dt,
                            row.get('content', '')[:10000],  # Limit content size
                            row.get('master_topic', ''),
                            row.get('sub_topic', ''),
                            row.get('persona', ''),
                            is_relevant,
                        )
                    )
                except Exception as e:
                    print(f"  Warning: Row {row_num} skipped - {e}")
                    continue

                if row_num % 5000 == 0:
                    print(f"  Processed {row_num} rows...")

        print(f"  Total rows read: {rows_read}")
        print(f"  Relevant rows: {rows_relevant}")

        # Bulk insert
        if pooled_data:
            print(f"  Inserting {len(pooled_data)} rows into pooled_posts_all...")

            execute_values(
                cur,
                """
                INSERT INTO pooled_posts_all
                  (batch_id, post_id, created_date, content, master_topic, sub_topic, persona, is_relevant)
                VALUES %s
                ON CONFLICT (post_id) DO NOTHING
                """,
                pooled_data,
                page_size=1000,
            )

            conn.commit()
            print(f"  ✓ Inserted {len(pooled_data)} rows (duplicates skipped)")

        # Update batch stats
        cur.execute(
            """
            SELECT
              COUNT(*) as total,
              COUNT(CASE WHEN is_relevant = true THEN 1 END) as relevant
            FROM pooled_posts_all
            WHERE batch_id = %s
            """,
            (batch_id,),
        )

        total, relevant = cur.fetchone()

        cur.execute(
            """
            UPDATE data_batches
            SET total_posts = %s, posts_relevant = %s, status = %s
            WHERE id = %s
            """,
            (total, relevant, 'COMPLETED', batch_id),
        )
        conn.commit()

        print(f"✓ Batch {batch_id} completed: {relevant}/{total} posts")

        cur.close()
        conn.close()
        return True

    except Exception as e:
        print(f"✗ Error loading {csv_file.name}: {e}")
        import traceback

        traceback.print_exc()
        return False


def main():
    """Load all CSV files from output/filtered/"""
    base_dir = Path(__file__).parent.parent / 'output' / 'filtered'

    if not base_dir.exists():
        print(f"Error: Directory not found: {base_dir}")
        sys.exit(1)

    # List of files to load
    files_to_load = [
        (base_dir / 'Q1_2026_classified_combined_cleaned.csv', '2026-01'),
        (base_dir / 'Apr_2026_classified_combined_cleaned.csv', '2026-04'),
    ]

    success_count = 0
    for csv_file, month_year in files_to_load:
        if csv_file.exists():
            print(f"\n{'='*60}")
            print(f"Loading {csv_file.name}...")
            print('=' * 60)
            if load_csv_to_pooled(csv_file, month_year):
                success_count += 1
        else:
            print(f"⊘ File not found: {csv_file}")

    print(f"\n{'='*60}")
    print(f"✓ Loaded {success_count} files successfully")
    print('=' * 60)


if __name__ == '__main__':
    if len(sys.argv) > 1:
        # Load specific file
        csv_file = Path(sys.argv[1])
        month_year = sys.argv[2] if len(sys.argv) > 2 else None
        if load_csv_to_pooled(csv_file, month_year):
            sys.exit(0)
        else:
            sys.exit(1)
    else:
        main()
