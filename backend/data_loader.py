"""
Data loader for ChiCom Dashboard PostgreSQL backend.
Handles XLSX uploads, Esuit/Automa integrations, and data batch processing.
"""

import os
import json
from datetime import datetime
from pathlib import Path
from typing import Optional, Tuple
import pandas as pd
import psycopg2
from psycopg2.extras import execute_values
from dotenv import load_dotenv

load_dotenv()

# Database connection
DB_HOST = os.getenv('DB_HOST', 'localhost')
DB_PORT = os.getenv('DB_PORT', '5432')
DB_NAME = os.getenv('DB_NAME', 'chicom_dashboard')
DB_USER = os.getenv('DB_USER', 'postgres')
DB_PASSWORD = os.getenv('DB_PASSWORD', '')

def get_db_connection():
    """Create and return a PostgreSQL connection."""
    return psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        database=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD
    )

def create_data_batch(
    batch_name: str,
    month_year: datetime,
    source: str,
    uploaded_by: str,
    total_posts: int
) -> int:
    """
    Create a data batch record.
    Returns: batch_id
    """
    conn = get_db_connection()
    cur = conn.cursor()

    try:
        cur.execute(
            """
            INSERT INTO data_batches
            (batch_name, month_year, source, total_posts, uploaded_by, status)
            VALUES (%s, %s, %s, %s, %s, 'PROCESSING')
            RETURNING id
            """,
            (batch_name, month_year, source, total_posts, uploaded_by)
        )
        batch_id = cur.fetchone()[0]
        conn.commit()
        return batch_id
    finally:
        cur.close()
        conn.close()

def load_xlsx_data(
    file_path: str,
    month_year: datetime,
    uploaded_by: str = 'manual_upload'
) -> Tuple[int, dict]:
    """
    Load XLSX file into the database.

    Expected columns in XLSX:
    - group_id, author_name, author_id, created_date, content, title,
      depth, post_type, link, context, master_topic, sub_topic, sentiment,
      persona, brand_mentions, product_category, recommendation, granular_topic,
      trigger_to_leave, relevant, irrelevant_type

    Returns: (batch_id, stats_dict)
    """
    # Read XLSX
    df = pd.read_excel(file_path)

    # Validate required columns
    required_cols = ['group_id', 'content', 'created_date']
    missing_cols = [col for col in required_cols if col not in df.columns]
    if missing_cols:
        raise ValueError(f"Missing required columns: {missing_cols}")

    # Clean data
    df = df.fillna('')
    df['created_date'] = pd.to_datetime(df['created_date'], errors='coerce')

    batch_name = f"{month_year.strftime('%B_%Y')}_upload"
    batch_id = create_data_batch(
        batch_name=batch_name,
        month_year=month_year,
        source='XLSX_UPLOAD',
        uploaded_by=uploaded_by,
        total_posts=len(df)
    )

    conn = get_db_connection()
    cur = conn.cursor()

    try:
        # Insert posts
        post_inserts = []
        for _, row in df.iterrows():
            post_inserts.append((
                row.get('post_id', f"xlsx_{batch_id}_{len(post_inserts)}"),
                int(row['group_id']),
                row.get('author_name', ''),
                row.get('author_id', ''),
                row['created_date'],
                row['content'],
                row.get('title', ''),
                int(row['depth']) if pd.notna(row.get('depth')) else None,
                row.get('post_type', 'post'),
                row.get('link', ''),
                row.get('context', ''),
                batch_id
            ))

        execute_values(
            cur,
            """
            INSERT INTO posts
            (post_id, group_id, author_name, author_id, created_date,
             content, title, depth, post_type, link, context, data_batch_id)
            VALUES %s
            RETURNING id, post_id
            """,
            post_inserts,
            page_size=1000
        )

        # Collect post IDs for classification inserts
        post_mappings = {}
        for post_id_db, post_id_orig in cur.fetchall():
            post_mappings[post_id_orig] = post_id_db

        # Insert classifications
        classification_inserts = []
        for _, row in df.iterrows():
            post_id_orig = row.get('post_id', f"xlsx_{batch_id}_{len(classification_inserts)}")
            post_id_db = post_mappings.get(post_id_orig)

            if post_id_db:
                relevant = row.get('relevant', True)
                if isinstance(relevant, str):
                    relevant = relevant.lower() in ('true', '1', 'yes', 'y')

                classification_inserts.append((
                    post_id_db,
                    row.get('master_topic', ''),
                    row.get('sub_topic', ''),
                    row.get('sentiment', ''),
                    row.get('persona', ''),
                    row.get('brand_mentions', ''),
                    row.get('product_category', ''),
                    row.get('recommendation', ''),
                    row.get('granular_topic', ''),
                    row.get('trigger_to_leave', ''),
                    relevant,
                    row.get('irrelevant_type', '')
                ))

        if classification_inserts:
            execute_values(
                cur,
                """
                INSERT INTO post_classifications
                (post_id, master_topic, sub_topic, sentiment, persona,
                 brand_mentions, product_category, recommendation, granular_topic,
                 trigger_to_leave, relevant, irrelevant_type)
                VALUES %s
                """,
                classification_inserts,
                page_size=1000
            )

        conn.commit()

        # Update batch stats
        cur.execute(
            """
            UPDATE data_batches
            SET posts_relevant = (
                SELECT COUNT(*) FROM post_classifications
                WHERE post_id IN (
                    SELECT id FROM posts WHERE data_batch_id = %s
                ) AND relevant = TRUE
            ),
            status = 'COMPLETED',
            processing_completed_at = CURRENT_TIMESTAMP
            WHERE id = %s
            """,
            (batch_id, batch_id)
        )
        conn.commit()

        stats = {
            'batch_id': batch_id,
            'total_posts': len(df),
            'posts_classified': len([c for c in classification_inserts if c[1]]),
            'posts_relevant': len([c for c in classification_inserts if c[10]]),
            'upload_time': datetime.now().isoformat()
        }

        return batch_id, stats

    except Exception as e:
        conn.rollback()
        # Mark batch as failed
        cur.execute(
            """
            UPDATE data_batches
            SET status = 'FAILED', error_message = %s
            WHERE id = %s
            """,
            (str(e), batch_id)
        )
        conn.commit()
        raise
    finally:
        cur.close()
        conn.close()

def load_esuit_data(
    esuit_api_key: str,
    month_year: datetime
) -> Tuple[int, dict]:
    """
    Load data from Esuit API.
    TODO: Implement Esuit API integration
    """
    raise NotImplementedError("Esuit integration coming soon")

def load_automa_data(
    automa_webhook_url: str,
    month_year: datetime
) -> Tuple[int, dict]:
    """
    Load data from Automa webhook/API.
    TODO: Implement Automa integration
    """
    raise NotImplementedError("Automa integration coming soon")

def get_batch_summary(batch_id: int) -> dict:
    """Get summary stats for a data batch."""
    conn = get_db_connection()
    cur = conn.cursor()

    try:
        cur.execute(
            """
            SELECT
              batch_name,
              month_year,
              source,
              total_posts,
              posts_relevant,
              status,
              uploaded_at,
              processing_completed_at
            FROM data_batches
            WHERE id = %s
            """,
            (batch_id,)
        )

        row = cur.fetchone()
        if not row:
            return None

        return {
            'batch_id': batch_id,
            'name': row[0],
            'month': row[1].strftime('%Y-%m'),
            'source': row[2],
            'total_posts': row[3],
            'relevant_posts': row[4],
            'status': row[5],
            'uploaded_at': row[6].isoformat(),
            'completed_at': row[7].isoformat() if row[7] else None
        }
    finally:
        cur.close()
        conn.close()

def list_batches(month_year: Optional[datetime] = None) -> list:
    """List all data batches, optionally filtered by month."""
    conn = get_db_connection()
    cur = conn.cursor()

    try:
        if month_year:
            cur.execute(
                """
                SELECT id, batch_name, month_year, source, total_posts,
                       posts_relevant, status, uploaded_at
                FROM data_batches
                WHERE month_year = %s
                ORDER BY uploaded_at DESC
                """,
                (month_year,)
            )
        else:
            cur.execute(
                """
                SELECT id, batch_name, month_year, source, total_posts,
                       posts_relevant, status, uploaded_at
                FROM data_batches
                ORDER BY month_year DESC, uploaded_at DESC
                """
            )

        batches = []
        for row in cur.fetchall():
            batches.append({
                'id': row[0],
                'name': row[1],
                'month': row[2].strftime('%Y-%m'),
                'source': row[3],
                'total': row[4],
                'relevant': row[5],
                'status': row[6],
                'uploaded': row[7].isoformat()
            })
        return batches
    finally:
        cur.close()
        conn.close()

if __name__ == '__main__':
    # Example usage
    from datetime import date

    # Test: Load sample XLSX
    xlsx_path = 'output/filtered/Q1_2026_classified_combined_annotated.xlsx'
    if os.path.exists(xlsx_path):
        try:
            batch_id, stats = load_xlsx_data(
                xlsx_path,
                month_year=datetime(2026, 1, 1),
                uploaded_by='admin'
            )
            print(f"Successfully loaded batch {batch_id}")
            print(json.dumps(stats, indent=2))
        except Exception as e:
            print(f"Error: {e}")
