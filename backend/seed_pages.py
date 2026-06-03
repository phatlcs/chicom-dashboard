#!/usr/bin/env python3
"""
Seed the pages table with Q1 and April predefined pages
Run this on startup to initialize the system
"""
import json
import os
import sys
from datetime import datetime

try:
    import psycopg2
except ImportError:
    print("Installing psycopg2...")
    import subprocess
    subprocess.check_call([sys.executable, '-m', 'pip', 'install', '-q', 'psycopg2-binary'])
    import psycopg2

# Database config
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'port': int(os.getenv('DB_PORT', 5432)),
    'database': os.getenv('DB_NAME', 'chicom_dashboard'),
    'user': os.getenv('DB_USER', 'postgres'),
    'password': os.getenv('DB_PASSWORD', ''),
}

PREDEFINED_PAGES = [
    {
        'slug': 'q1',
        'name': 'Q1 2026 Report',
        'time_start': '2026-01-01',
        'time_end': '2026-03-31',
        'description': 'Q1 (Jan-Mar) 2026 Analysis',
    },
    {
        'slug': 'april',
        'name': 'April 2026 Report',
        'time_start': '2026-04-01',
        'time_end': '2026-04-30',
        'description': 'April 2026 Analysis',
    },
]


def seed_pages():
    """Create predefined pages"""
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()

    try:
        for page_def in PREDEFINED_PAGES:
            # Check if page already exists
            cur.execute('SELECT id FROM pages WHERE page_slug = %s', (page_def['slug'],))
            if cur.fetchone():
                print(f"✓ Page '{page_def['slug']}' already exists")
                continue

            # Get post counts for this time range
            cur.execute(
                """
                SELECT
                  COUNT(*) as total,
                  COUNT(CASE WHEN is_relevant = true THEN 1 END) as relevant
                FROM pooled_posts_all
                WHERE created_date >= %s AND created_date <= %s
                """,
                (page_def['time_start'], page_def['time_end']),
            )

            counts = cur.fetchone()
            total_posts = counts[0] if counts else 0
            relevant_posts = counts[1] if counts else 0

            # Create page
            cur.execute(
                """
                INSERT INTO pages
                  (page_slug, page_name, time_range_start, time_range_end, page_type, total_posts, relevant_posts, status)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id
                """,
                (
                    page_def['slug'],
                    page_def['name'],
                    page_def['time_start'],
                    page_def['time_end'],
                    'predefined',
                    total_posts,
                    relevant_posts,
                    'ACTIVE',
                ),
            )

            page_id = cur.fetchone()[0]

            # Create insights entry
            cur.execute(
                """
                INSERT INTO page_insights (page_id, page_slug, insights, sample_post_ids)
                VALUES (%s, %s, %s, %s)
                """,
                (
                    page_id,
                    page_def['slug'],
                    json.dumps({}),
                    json.dumps({}),
                ),
            )

            conn.commit()
            print(f"✓ Created page '{page_def['slug']}' (ID: {page_id}, Posts: {relevant_posts}/{total_posts})")

        print("\n✓ Pages seeding complete!")

    except Exception as e:
        conn.rollback()
        print(f"✗ Error seeding pages: {e}")
        sys.exit(1)
    finally:
        cur.close()
        conn.close()


if __name__ == '__main__':
    print("Seeding predefined pages...")
    seed_pages()
