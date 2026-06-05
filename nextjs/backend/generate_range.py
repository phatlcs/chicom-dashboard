"""
Called by the Next.js API to generate a self-contained dashboard HTML for a date range.
Usage: python generate_range.py <start> <end> <out_slug>
Writes public/<out_slug>.html (and public/dashboard/pages/<out_slug>.js)
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
        print("Usage: generate_range.py <start> <end> <slug>", file=sys.stderr)
        sys.exit(1)

    start, end, slug = sys.argv[1], sys.argv[2], sys.argv[3]

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
    # compute.py uses integer group_ids (SOA_IDS = [1, 2])
    df["group_id"] = pd.to_numeric(df["group_id"], errors="coerce").fillna(0).astype(int)

    js_str, info = compute_mod.compute_all(df)

    # Write data js file
    pages_dir = os.path.join(ROOT, "public", "dashboard", "pages")
    os.makedirs(pages_dir, exist_ok=True)
    js_path = os.path.join(pages_dir, f"{slug}.js")
    with open(js_path, "w", encoding="utf-8") as f:
        f.write(js_str)

    # Load expert insights if available
    expert_path = os.path.join(ROOT, "public", "dashboard", "expert_insights.json")
    expert_json = "{}"
    if os.path.exists(expert_path):
        with open(expert_path, encoding="utf-8") as f:
            expert_json = f.read()

    # Load the HTML template
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
    # Replace the placeholder inline script
    html = template.replace(
        "<script>\n  // Expose globals so JSX files can access D and D2 without relying on\n"
        "  // Babel's const-to-var transpilation to leak across script boundaries.\n"
        "  window.D = window.ChiComData;\n"
        "  window.D2 = window.ChiComData2;\n"
        "</script>",
        injected
    )

    html_path = os.path.join(ROOT, "public", f"{slug}.html")
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(html)
    os.chmod(html_path, 0o644)

    print(f"OK:{html_path}:{info.get('totalPosts',0)}:{info.get('relevantPosts',0)}")

if __name__ == "__main__":
    main()
