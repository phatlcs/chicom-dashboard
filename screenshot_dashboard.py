"""
Screenshot each individual chart (.card) inside every Q section of the
dashboard. Produces one PNG per chart so the PPT exporter can arrange
them 2-per-slide with standardized dimensions.

Output layout:
    screenshots/Q1_1.png, Q1_2.png, Q1_3.png, …
    screenshots/Q2_1.png, …
    screenshots/overview_1.png, overview_2.png, …
    screenshots/manifest.json    — {section_id: [{file, width, height}, …]}

Run after `python build_data.py`.
"""

from __future__ import annotations

import contextlib
import http.server
import json
import socketserver
import threading
from pathlib import Path

from playwright.sync_api import sync_playwright

BASE = Path(__file__).resolve().parent
DASHBOARD_DIR = BASE / "dashboard"
OUT_DIR = BASE / "screenshots"

SECTIONS = [
    "overview",
    "Q1", "Q2", "Q3", "Q4", "Q5", "Q6",
    "Q7", "Q8", "Q9", "Q10", "Q11", "Q12", "Q13", "Q14",
]


@contextlib.contextmanager
def _serve(root: Path, port: int = 0):
    handler = _make_handler(str(root))
    with socketserver.TCPServer(("127.0.0.1", port), handler) as httpd:
        thread = threading.Thread(target=httpd.serve_forever, daemon=True)
        thread.start()
        try:
            yield f"http://127.0.0.1:{httpd.server_address[1]}"
        finally:
            httpd.shutdown()


def _make_handler(directory: str):
    class Handler(http.server.SimpleHTTPRequestHandler):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory=directory, **kwargs)

        def log_message(self, *args):
            pass

    return Handler


def _clean_dir(p: Path) -> None:
    p.mkdir(exist_ok=True)
    for old in p.glob("*.png"):
        old.unlink()
    for old in p.glob("*.json"):
        old.unlink()


def main() -> None:
    _clean_dir(OUT_DIR)
    print("[shot] starting local HTTP server for dashboard/…")
    with _serve(DASHBOARD_DIR) as url:
        dashboard_url = f"{url}/index.html"
        print(f"[shot] serving at {dashboard_url}")

        with sync_playwright() as p:
            browser = p.chromium.launch()
            ctx = browser.new_context(
                viewport={"width": 1440, "height": 900},
                device_scale_factor=2,
            )
            page = ctx.new_page()
            print("[shot] loading dashboard…")
            page.goto(dashboard_url, wait_until="networkidle")

            page.wait_for_selector("section#Q1 .card", timeout=30_000)
            page.wait_for_timeout(2000)  # buffer for heatmaps + dynamic SVG

            manifest: dict[str, list[dict]] = {}

            for sec_id in SECTIONS:
                section = page.locator(f"#{sec_id}")
                if section.count() == 0:
                    print(f"[shot] #{sec_id}: selector not found, skipping")
                    continue

                section.first.scroll_into_view_if_needed()
                page.wait_for_timeout(300)

                # Enumerate each .card inside this section
                cards = section.first.locator(".card")
                n = cards.count()
                if n == 0:
                    # Fallback: screenshot the whole section as one image
                    n = 1
                    targets = [section.first]
                else:
                    targets = [cards.nth(i) for i in range(n)]

                print(f"[shot] #{sec_id}: {n} card(s)")
                manifest[sec_id] = []

                for i, tgt in enumerate(targets, start=1):
                    tgt.scroll_into_view_if_needed()
                    page.wait_for_timeout(250)
                    out = OUT_DIR / f"{sec_id}_{i}.png"
                    try:
                        tgt.screenshot(path=str(out))
                    except Exception as e:
                        print(f"  [skip] {sec_id}_{i}: {e}")
                        continue
                    box = tgt.bounding_box()
                    w = int(box["width"]) if box else 0
                    h = int(box["height"]) if box else 0
                    size_kb = out.stat().st_size / 1024
                    print(f"  → {out.name}  {w}×{h}  ({size_kb:.1f} KB)")
                    manifest[sec_id].append({
                        "file": out.name,
                        "width": w,
                        "height": h,
                        "aspect": round(w / h, 3) if h else 0,
                    })

            # Save manifest for the PPT exporter
            (OUT_DIR / "manifest.json").write_text(
                json.dumps(manifest, ensure_ascii=False, indent=2),
                encoding="utf-8",
            )
            browser.close()

    total = sum(len(v) for v in manifest.values())
    print(f"[shot] done — {total} chart images + manifest in {OUT_DIR}")


if __name__ == "__main__":
    main()
