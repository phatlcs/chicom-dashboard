"""
Called by the Next.js API to generate a self-contained dashboard HTML for a date range.
Usage: python generate_range.py <start> <end> <out_slug> [insights]
Pass "insights" as the 4th arg to generate the 14 per-Q LLM analyst paragraphs
(slower, ~30-90s extra). Omit it for raw-data-only generation (fast, no LLM calls).
Writes nextjs/public/<out_slug>.html
"""
import sys
import os
import json
import pandas as pd
import psycopg2

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)

from backend import compute as compute_mod

def main():
    if len(sys.argv) < 4:
        print("Usage: generate_range.py <start> <end> <slug> [insights]", file=sys.stderr)
        sys.exit(1)

    start, end, slug = sys.argv[1], sys.argv[2], sys.argv[3]
    with_insights = len(sys.argv) > 4 and sys.argv[4] == "insights"

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
    # compute.py's SOA_IDS/EC_IDS are plain ints — group_id must match that type,
    # not the string the Postgres VARCHAR column round-trips as.
    df["group_id"] = pd.to_numeric(df["group_id"], errors="coerce").astype("Int64")

    js_str, info = compute_mod.compute_all(df, skip_llm=not with_insights)

    # The visible "Insights & Recommendations" panel reads window.ExpertInsights,
    # not window.ChiComData.INSIGHTS (that one only feeds the disabled per-chart
    # AI Insight box — see shell.jsx's SHOW_INSIGHT flag). Reuse the same LLM
    # output for both so the panel actually shows something when insights run.
    insights = info.get('insights') or {}
    expert_json = json.dumps({k: v for k, v in insights.items() if v}, ensure_ascii=False)

    # Load the HTML template from the nginx-served public directory
    template_path = os.path.join(ROOT, "public", "dashboard", "index.html")
    with open(template_path, encoding="utf-8") as f:
        template = f.read()

    # Inject data + expert insights into the template
    injected = (
        f"<script>\n{js_str}\n"
        f"window.D = window.ChiComData;\n"
        f"window.D2 = window.ChiComData2;\n"
        f"window.ExpertInsights = {expert_json};\n"
        f"</script>"
    )
    html = template.replace(
        "<script>\n  // Expose globals so JSX files can access D and D2 without relying on\n"
        "  // Babel's const-to-var transpilation to leak across script boundaries.\n"
        "  window.D = window.ChiComData;\n"
        "  window.D2 = window.ChiComData2;\n"
        "</script>",
        injected
    )

    # Write to nextjs/public/ — that's the directory Next.js actually serves
    # static files from at runtime (pm2 runs `npm start` with cwd app/nextjs)
    out_dir = os.path.join(ROOT, "nextjs", "public")
    os.makedirs(out_dir, exist_ok=True)
    html_path = os.path.join(out_dir, f"{slug}.html")
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(html)

    print(f"OK:{html_path}:{info.get('totalPosts',0)}:{info.get('relevantPosts',0)}")

if __name__ == "__main__":
    main()
