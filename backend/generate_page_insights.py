#!/usr/bin/env python3
"""
Generate insights for a page via LLM (Claude Haiku)
Called by Next.js API when a new page is created
"""
import json
import sys
from datetime import datetime
import os

try:
    import anthropic
    import psycopg2
except ImportError:
    print("Installing dependencies...")
    import subprocess
    subprocess.check_call([sys.executable, '-m', 'pip', 'install', '-q', 'anthropic', 'psycopg2-binary'])
    import anthropic
    import psycopg2

# Database config
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'port': int(os.getenv('DB_PORT', 5432)),
    'database': os.getenv('DB_NAME', 'chicom_dashboard'),
    'user': os.getenv('DB_USER', 'postgres'),
    'password': os.getenv('DB_PASSWORD', ''),
}

QUESTIONS = {
    'Q1': 'Master Topics: What are the main topics sellers discuss? (Brand/Niche, Sourcing, Supply Chain, etc.)',
    'Q2': 'Master Topics by Persona: How do different personas (sellers, buyers, etc.) discuss master topics?',
    'Q3': 'Sub-topics Distribution: What detailed sub-topics appear in discussions?',
    'Q4': 'Sentiment Analysis by Topic: What is the sentiment around different topics?',
    'Q5': 'Pain Points Frequency: What are the top pain points mentioned?',
    'Q6': 'Solution Mentions: What solutions do sellers seek or discuss?',
    'Q7': 'Time Trends: How have topics evolved over the time period?',
    'Q8': 'Amazon-specific Issues: SOA-only - What are Amazon-specific seller pain points?',
    'Q9': 'Community Engagement: Which topics generate most discussion?',
    'Q10': 'Product Categories: What product categories are discussed?',
    'Q11': 'Amazon Seller Tools: SOA-only - Which Amazon tools are discussed?',
    'Q12': 'Competitive Dynamics: SOA-only - What competitive concerns exist?',
    'Q13': 'Regulatory Compliance: SOA-only - What compliance/policy issues arise?',
    'Q14': 'Growth Opportunities: SOA-only - What growth strategies are mentioned?',
}


def get_sample_posts(db_conn, time_start: str, time_end: str, question_num: int, limit: int = 8):
    """Get sample posts for insight generation"""
    cur = db_conn.cursor()

    if question_num == 1:
        # Q1: Sample posts by master topic
        query = """
            SELECT id, content, master_topic
            FROM pooled_posts_all
            WHERE is_relevant = true
            AND created_date >= %s AND created_date <= %s
            ORDER BY RANDOM()
            LIMIT %s
        """
    elif question_num == 3:
        # Q3: Sample posts by sub topic
        query = """
            SELECT id, content, sub_topic
            FROM pooled_posts_all
            WHERE is_relevant = true
            AND created_date >= %s AND created_date <= %s
            ORDER BY RANDOM()
            LIMIT %s
        """
    else:
        # Default: just sample relevant posts
        query = """
            SELECT id, content, master_topic
            FROM pooled_posts_all
            WHERE is_relevant = true
            AND created_date >= %s AND created_date <= %s
            ORDER BY RANDOM()
            LIMIT %s
        """

    cur.execute(query, (time_start, time_end, limit))
    return cur.fetchall()


def generate_insight(
    page_slug: str,
    time_start: str,
    time_end: str,
    question_num: int,
    aggregates: dict,
):
    """Call Claude Haiku to generate insight for a question"""
    client = anthropic.Anthropic()

    sample_posts = []  # TODO: fetch from DB
    q_desc = QUESTIONS.get(f'Q{question_num}', '')

    prompt = f"""You are a Vietnamese e-commerce analyst.

Question {question_num}: {q_desc}

Time Period: {time_start} to {time_end}

Aggregates for this question:
{json.dumps(aggregates, indent=2, ensure_ascii=False)}

Sample posts (for context):
{json.dumps(sample_posts, indent=2, ensure_ascii=False)}

Provide a concise 3-5 sentence analysis in Vietnamese about this question, based on the data above.
Focus on key insights and patterns."""

    try:
        message = client.messages.create(
            model='claude-haiku-4.5-20251001',
            max_tokens=300,
            messages=[{'role': 'user', 'content': prompt}],
        )
        return message.content[0].text
    except Exception as e:
        print(f"Error generating insight for Q{question_num}: {e}")
        return f"Insight generation failed for Q{question_num}"


def generate_all_insights(page_slug: str, time_start: str, time_end: str, aggregates: dict):
    """Generate insights for all Q1-Q14"""
    insights = {}

    for q_num in range(1, 15):
        print(f"  Generating Q{q_num} insight...")
        q_key = f'Q{q_num}'
        q_data = aggregates.get(q_key, {})
        insights[q_key] = generate_insight(page_slug, time_start, time_end, q_num, q_data)

    return insights


def update_page_insights(page_slug: str, insights: dict):
    """Store generated insights in database"""
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()

    try:
        cur.execute(
            """
            UPDATE page_insights
            SET insights = %s, generated_at = %s
            WHERE page_slug = %s
            """,
            (json.dumps(insights), datetime.now(), page_slug),
        )
        conn.commit()
        print(f"✓ Stored insights for page: {page_slug}")
    except Exception as e:
        conn.rollback()
        print(f"✗ Error storing insights: {e}")
    finally:
        cur.close()
        conn.close()


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python generate_page_insights.py <page_slug>")
        sys.exit(1)

    page_slug = sys.argv[1]
    print(f"\nGenerating insights for page: {page_slug}")

    # TODO: Fetch page data and aggregates from DB
    # For now, just demonstrate the flow
    aggregates = {
        'Q1': {'Brand/Niche Selection': 150, 'Product Sourcing': 200},
        'Q2': {'Seller (Amazon)': 100, 'Buyer': 50},
        'Q3': {'Logistics': 75, 'Pricing': 60},
    }

    print("  Aggregates loaded")
    insights = generate_all_insights(page_slug, '2026-01-01', '2026-03-31', aggregates)
    update_page_insights(page_slug, insights)
    print("✓ Done!")
