#!/usr/bin/env python3
"""
Generate static data files for pages
Called when a page is created, or manually to regenerate
"""
import json
import sys
import os
from pathlib import Path

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

# Dashboard output directory
DASHBOARD_DIR = os.getenv('DASHBOARD_DIR', '/var/www/dashboard/pages')


def query_q1(conn, time_start: str, time_end: str) -> dict:
    """Master Topics distribution"""
    cur = conn.cursor()
    cur.execute(
        """
        SELECT master_topic, COUNT(*) as count
        FROM pooled_posts_all
        WHERE is_relevant = true
        AND created_date >= %s AND created_date <= %s
        GROUP BY master_topic
        ORDER BY count DESC
        """,
        (time_start, time_end),
    )

    result = {}
    for row in cur.fetchall():
        if row[0]:  # master_topic
            result[row[0]] = row[1]
    cur.close()
    return result


def query_q2(conn, time_start: str, time_end: str) -> dict:
    """Master Topics by Persona"""
    cur = conn.cursor()
    cur.execute(
        """
        SELECT master_topic, persona, COUNT(*) as count
        FROM pooled_posts_all
        WHERE is_relevant = true
        AND created_date >= %s AND created_date <= %s
        GROUP BY master_topic, persona
        ORDER BY master_topic, count DESC
        """,
        (time_start, time_end),
    )

    result = {}
    for row in cur.fetchall():
        topic, persona, count = row
        if topic and persona:
            if topic not in result:
                result[topic] = {}
            result[topic][persona] = count
    cur.close()
    return result


def query_q3(conn, time_start: str, time_end: str) -> dict:
    """Sub-topics distribution"""
    cur = conn.cursor()
    cur.execute(
        """
        SELECT sub_topic, COUNT(*) as count
        FROM pooled_posts_all
        WHERE is_relevant = true
        AND created_date >= %s AND created_date <= %s
        GROUP BY sub_topic
        ORDER BY count DESC
        """,
        (time_start, time_end),
    )

    result = {}
    for row in cur.fetchall():
        if row[0]:  # sub_topic
            result[row[0]] = row[1]
    cur.close()
    return result


def query_post_count(conn, time_start: str, time_end: str) -> tuple:
    """Total and relevant post counts"""
    cur = conn.cursor()
    cur.execute(
        """
        SELECT
          COUNT(*) as total,
          COUNT(CASE WHEN is_relevant = true THEN 1 END) as relevant
        FROM pooled_posts_all
        WHERE created_date >= %s AND created_date <= %s
        """,
        (time_start, time_end),
    )
    row = cur.fetchone()
    cur.close()
    return row


def generate_data_file(page_slug: str, time_start: str, time_end: str, page_name: str = None) -> bool:
    """Generate JS data file for a page"""
    try:
        conn = psycopg2.connect(**DB_CONFIG)

        # Query aggregates
        total, relevant = query_post_count(conn, time_start, time_end)
        q1_data = query_q1(conn, time_start, time_end)
        q2_data = query_q2(conn, time_start, time_end)
        q3_data = query_q3(conn, time_start, time_end)

        # Get insights from DB
        cur = conn.cursor()
        cur.execute(
            'SELECT insights FROM page_insights WHERE page_slug = %s',
            (page_slug,),
        )
        row = cur.fetchone()
        cur.close()

        insights_data = {}
        if row and row[0]:
            insights_data = row[0]

        # Build JS content
        chicom_data = {
            'metadata': {
                'name': page_name or f'Report {page_slug}',
                'timeStart': time_start,
                'timeEnd': time_end,
                'totalPosts': total,
                'relevantPosts': relevant,
            },
            'Q1': q1_data,
            'Q2': q2_data,
            'Q3': q3_data,
            'Q4': {},  # TODO: Implement Q4-Q14
            'Q5': {},
            'Q6': {},
        }

        chicom_data2 = {
            'Q7': {},
            'Q8': {},
            'Q9': {},
            'Q10': {},
            'Q11': {},
            'Q12': {},
            'Q13': {},
            'Q14': {},
        }

        # Default insights if not in DB
        default_insights = {
            'Q1': 'Insight generation in progress...',
            'Q2': '',
            'Q3': '',
            'Q4': '',
            'Q5': '',
            'Q6': '',
            'Q7': '',
            'Q8': '',
            'Q9': '',
            'Q10': '',
            'Q11': '',
            'Q12': '',
            'Q13': '',
            'Q14': '',
        }

        if not insights_data:
            insights_data = default_insights
        else:
            # Merge defaults for missing questions
            for q in [f'Q{i}' for i in range(1, 15)]:
                if q not in insights_data:
                    insights_data[q] = ''

        # Build file content
        js_content = f'''// Generated data file for page: {page_slug}
// Time range: {time_start} to {time_end}
// Generated at: {__import__('datetime').datetime.now().isoformat()}

window.ChiComData = {json.dumps(chicom_data, indent=2, ensure_ascii=False)};

window.ChiComData2 = {json.dumps(chicom_data2, indent=2, ensure_ascii=False)};

window.INSIGHTS = {json.dumps(insights_data, indent=2, ensure_ascii=False)};
'''

        # Ensure directory exists
        Path(DASHBOARD_DIR).mkdir(parents=True, exist_ok=True)

        # Write file
        filepath = Path(DASHBOARD_DIR) / f'{page_slug}.js'
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(js_content)

        print(f'✓ Generated {filepath}')
        conn.close()
        return True

    except Exception as e:
        print(f'✗ Error generating data file for {page_slug}: {e}')
        return False


def generate_all_pages() -> None:
    """Generate data files for all pages in the DB"""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()

        # Get all pages
        cur.execute(
            'SELECT page_slug, time_range_start, time_range_end, page_name FROM pages WHERE status = %s',
            ('ACTIVE',),
        )

        pages = cur.fetchall()
        cur.close()
        conn.close()

        if not pages:
            print('No active pages found')
            return

        print(f'Found {len(pages)} active pages\n')

        success_count = 0
        for page_slug, time_start, time_end, page_name in pages:
            if generate_data_file(page_slug, str(time_start), str(time_end), page_name):
                success_count += 1

        print(f'\n✓ Generated {success_count}/{len(pages)} data files')

    except Exception as e:
        print(f'✗ Error: {e}')
        sys.exit(1)


if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == '--slug':
        # Generate specific page
        if len(sys.argv) < 3:
            print('Usage: python generate_data_files.py --slug <page_slug>')
            sys.exit(1)

        page_slug = sys.argv[2]
        print(f'Generating data file for page: {page_slug}\n')

        # Get page details from DB
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        cur.execute(
            'SELECT time_range_start, time_range_end, page_name FROM pages WHERE page_slug = %s',
            (page_slug,),
        )
        row = cur.fetchone()
        cur.close()
        conn.close()

        if not row:
            print(f'✗ Page not found: {page_slug}')
            sys.exit(1)

        time_start, time_end, page_name = row
        if generate_data_file(page_slug, str(time_start), str(time_end), page_name):
            sys.exit(0)
        else:
            sys.exit(1)
    else:
        # Generate all pages
        print('Generating data files for all pages...\n')
        generate_all_pages()
