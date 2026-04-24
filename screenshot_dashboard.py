"""
Screenshot each Q section of the dashboard for embedding in the PPT export.

Launches headless Chromium, opens dashboard/index.html via a short-lived
local HTTP server, waits for Babel to compile the JSX tree, then takes
one element screenshot per section.

Output: screenshots/overview.png, Q1.png, Q2.png, … Q14.png
"""

from __future__ import annotations

import contextlib
import http.server
import socketserver
import threading
from pathlib import Path

from playwright.sync_api import sync_playwright

BASE = Path(__file__).resolve().parent
DASHBOARD_DIR = BASE / "dashboard"
OUT_DIR = BASE / "screenshots"
OUT_DIR.mkdir(exist_ok=True)

SECTIONS = [
    "overview",
    "Q1", "Q2", "Q3", "Q4", "Q5", "Q6",
    "Q7", "Q8", "Q9", "Q10", "Q11", "Q12", "Q13", "Q14",
]


@contextlib.contextmanager
def _serve(root: Path, port: int = 0):
    """Serve `root` on localhost over a short-lived HTTP server."""
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
            pass  # suppress stdout spam

    return Handler


def main() -> None:
    print("[shot] starting local HTTP server for dashboard/…")
    with _serve(DASHBOARD_DIR) as url:
        dashboard_url = f"{url}/index.html"
        print(f"[shot] serving at {dashboard_url}")

        with sync_playwright() as p:
            browser = p.chromium.launch()
            ctx = browser.new_context(
                viewport={"width": 1440, "height": 900},
                device_scale_factor=2,  # retina-quality screenshots
            )
            page = ctx.new_page()
            print("[shot] loading dashboard…")
            page.goto(dashboard_url, wait_until="networkidle")

            # Wait for Babel to compile & React to render
            page.wait_for_selector("section#Q1 .card", timeout=30_000)
            page.wait_for_timeout(1500)  # extra buffer for heatmaps/SVG animations

            for sec_id in SECTIONS:
                print(f"[shot] {sec_id}…")
                locator = page.locator(f"#{sec_id}")
                if locator.count() == 0:
                    print(f"  → selector '#{sec_id}' not found, skipping")
                    continue
                locator.first.scroll_into_view_if_needed()
                page.wait_for_timeout(400)
                out = OUT_DIR / f"{sec_id}.png"
                locator.first.screenshot(path=str(out))
                size_kb = out.stat().st_size / 1024
                print(f"  → {out.name}  ({size_kb:.1f} KB)")

            browser.close()
    print(f"[shot] done — {len(list(OUT_DIR.glob('*.png')))} screenshots in {OUT_DIR}")


if __name__ == "__main__":
    main()
