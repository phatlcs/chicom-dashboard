"""
Export the ChiCom dashboard to a PowerPoint deck.

Two inputs per slide:
  - Chart area  → screenshot from screenshots/Qx.png (pixel-accurate,
    matches what the dashboard renders)
  - Insight box → editable text box with the Vietnamese analyst
    paragraph from backend/insights_manual.json (or .insight_cache.json
    when LLM is enabled)

If screenshots/ is missing, run `python screenshot_dashboard.py` first.

Usage:
    python export_to_ppt.py
    python export_to_ppt.py --out chicom_report.pptx
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.enum.shapes import MSO_SHAPE
from PIL import Image

BASE = Path(__file__).resolve().parent
SCREENSHOT_DIR = BASE / "screenshots"


# ── Colors ────────────────────────────────────────────────────────────────

ACCENT     = RGBColor(0x3A, 0x56, 0xC9)
PURPLE     = RGBColor(0x6E, 0x41, 0xA6)
DARK_TEXT  = RGBColor(0x1C, 0x20, 0x2C)
MUTED_TEXT = RGBColor(0x66, 0x6C, 0x78)
GRAY       = RGBColor(0x80, 0x80, 0x80)

SLIDE_W = Inches(13.333)
SLIDE_H = Inches(7.5)


# ── Small helpers ─────────────────────────────────────────────────────────

def _blank_slide(prs: Presentation):
    return prs.slides.add_slide(prs.slide_layouts[6])


def _set_para(p, text: str, *, size: int, bold: bool = False,
              color: RGBColor = DARK_TEXT, font: str = "Inter"):
    p.text = text
    run = p.runs[0]
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.color.rgb = color
    run.font.name = font


def _header_bar(slide, title: str, subtitle: str = ""):
    stripe = slide.shapes.add_shape(
        MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), SLIDE_W, Inches(0.16)
    )
    stripe.line.fill.background()
    stripe.fill.solid()
    stripe.fill.fore_color.rgb = ACCENT

    title_box = slide.shapes.add_textbox(Inches(0.5), Inches(0.24), Inches(12.5), Inches(0.6))
    tf = title_box.text_frame
    tf.word_wrap = True
    tf.margin_left = Emu(0)
    _set_para(tf.paragraphs[0], title, size=22, bold=True)

    if subtitle:
        sub = slide.shapes.add_textbox(Inches(0.5), Inches(0.80), Inches(12.5), Inches(0.3))
        sub.text_frame.margin_left = Emu(0)
        _set_para(sub.text_frame.paragraphs[0], subtitle, size=11, color=MUTED_TEXT)


def _footer(slide, page: int, total: int, date_range: dict):
    start = (date_range or {}).get("start") or "—"
    end = (date_range or {}).get("end") or "—"
    foot = slide.shapes.add_textbox(Inches(0.5), Inches(7.18), Inches(12.5), Inches(0.3))
    foot.text_frame.margin_left = Emu(0)
    _set_para(
        foot.text_frame.paragraphs[0],
        f"ChiCom · Community Insights  ·  {start} → {end}  ·  trang {page}/{total}",
        size=9, color=GRAY,
    )


def _fitted_image_size(img_path: Path, max_w_in: float, max_h_in: float) -> tuple[float, float]:
    with Image.open(img_path) as im:
        w, h = im.size
    aspect = w / h
    if (max_w_in / max_h_in) > aspect:
        fit_h = max_h_in
        fit_w = fit_h * aspect
    else:
        fit_w = max_w_in
        fit_h = fit_w / aspect
    return fit_w, fit_h


def _insight_box(slide, paragraph: str, *, top: float, height: float,
                 label: str = "AI INSIGHT — chỉnh sửa tự do"):
    """Editable text box with an accent bar on the left."""
    if not paragraph:
        return
    # Accent bar
    bar = slide.shapes.add_shape(
        MSO_SHAPE.RECTANGLE,
        Inches(0.5), Inches(top), Inches(0.08), Inches(height)
    )
    bar.line.fill.background()
    bar.fill.solid()
    bar.fill.fore_color.rgb = PURPLE

    # Text box
    body = slide.shapes.add_textbox(
        Inches(0.7), Inches(top), Inches(12.2), Inches(height)
    )
    tf = body.text_frame
    tf.word_wrap = True
    tf.margin_left = Emu(0)
    tf.margin_right = Emu(0)
    tf.margin_top = Emu(30000)

    # Header
    _set_para(tf.paragraphs[0], label, size=9, bold=True, color=PURPLE)
    # Paragraph (single run, editable)
    p = tf.add_paragraph()
    p.space_before = Pt(4)
    _set_para(p, paragraph, size=12, color=DARK_TEXT)


def _chart_image(slide, image_path: Path, *, top: float, max_h: float,
                 max_w: float = 12.33):
    """Place a centered image under the header with a light border."""
    fit_w, fit_h = _fitted_image_size(image_path, max_w, max_h)
    left = (13.333 - fit_w) / 2
    pic = slide.shapes.add_picture(
        str(image_path),
        Inches(left), Inches(top),
        width=Inches(fit_w), height=Inches(fit_h),
    )
    pic.line.color.rgb = RGBColor(0xE0, 0xE0, 0xE0)
    pic.line.width = Pt(0.5)
    return pic


# ── Slide builders ────────────────────────────────────────────────────────

def slide_title(prs: Presentation, info: dict, date_range: dict):
    slide = _blank_slide(prs)
    bar = slide.shapes.add_shape(
        MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), SLIDE_W, Inches(1.3)
    )
    bar.line.fill.background()
    bar.fill.solid()
    bar.fill.fore_color.rgb = ACCENT

    title = slide.shapes.add_textbox(Inches(0.7), Inches(2.4), Inches(12), Inches(1.0))
    _set_para(title.text_frame.paragraphs[0],
              "ChiCom — Community Insights Report",
              size=40, bold=True)

    subtitle = slide.shapes.add_textbox(Inches(0.7), Inches(3.5), Inches(12), Inches(0.6))
    relevant = info.get("relevantPosts") or 0
    _set_para(
        subtitle.text_frame.paragraphs[0],
        f"Phân tích {relevant:,} Lượt Thảo Luận từ 9 cộng đồng seller Việt Nam · 14 câu hỏi nghiên cứu",
        size=16, color=MUTED_TEXT,
    )

    meta = slide.shapes.add_textbox(Inches(0.7), Inches(5.8), Inches(12), Inches(0.5))
    start = (date_range or {}).get("start") or "—"
    end = (date_range or {}).get("end") or "—"
    months = (date_range or {}).get("monthsCount") or 0
    _set_para(
        meta.text_frame.paragraphs[0],
        f"Khoảng thời gian: {start} → {end}  ·  {months} tháng  ·  2 nhóm SOA + 7 nhóm EC",
        size=12, color=GRAY,
    )


def slide_section_banner(prs: Presentation, title: str, subtitle: str = ""):
    """Full-slide banner between sections."""
    slide = _blank_slide(prs)
    # Gradient-ish background
    bg = slide.shapes.add_shape(
        MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), SLIDE_W, SLIDE_H
    )
    bg.line.fill.background()
    bg.fill.solid()
    bg.fill.fore_color.rgb = RGBColor(0xF4, 0xF6, 0xFC)

    bar = slide.shapes.add_shape(
        MSO_SHAPE.RECTANGLE, Inches(0), Inches(3.2), SLIDE_W, Inches(0.08)
    )
    bar.line.fill.background()
    bar.fill.solid()
    bar.fill.fore_color.rgb = ACCENT

    t = slide.shapes.add_textbox(Inches(0.7), Inches(3.4), Inches(12), Inches(1))
    _set_para(t.text_frame.paragraphs[0], title, size=34, bold=True)

    if subtitle:
        s = slide.shapes.add_textbox(Inches(0.7), Inches(4.3), Inches(12), Inches(0.5))
        _set_para(s.text_frame.paragraphs[0], subtitle, size=14, color=MUTED_TEXT)


def slide_with_screenshot(prs: Presentation, header_title: str,
                          screenshot: Path | None, insight: str | None,
                          *, subtitle: str = ""):
    slide = _blank_slide(prs)
    _header_bar(slide, header_title, subtitle)

    # Chart area (top ~4.3 inches under header at y=1.2)
    chart_top = 1.3
    chart_max_h = 4.2

    if screenshot and screenshot.is_file():
        _chart_image(slide, screenshot, top=chart_top, max_h=chart_max_h)
    else:
        missing = slide.shapes.add_textbox(
            Inches(0.5), Inches(chart_top + chart_max_h / 2 - 0.2),
            Inches(12.33), Inches(0.4),
        )
        _set_para(missing.text_frame.paragraphs[0],
                  f"(ảnh chart không khả dụng — chạy `python screenshot_dashboard.py`)",
                  size=12, color=GRAY, bold=True)
        missing.text_frame.paragraphs[0].alignment = PP_ALIGN.CENTER

    # Insight box (bottom)
    _insight_box(slide, insight or "", top=5.7, height=1.4)


# ── Data capture ──────────────────────────────────────────────────────────

def _compute_info_and_date_range() -> tuple[dict, dict]:
    """Run the backend pipeline once to get KPI info + date range."""
    sys.path.insert(0, str(BASE / "backend"))
    import re
    import pandas as pd
    from compute import compute_all

    csv_path = BASE / "output" / "filtered" / "all_groups_final_v2_annotated.csv"
    if not csv_path.is_file():
        sys.exit(f"ERROR: CSV not found at {csv_path}. Run `python build_data.py` first.")

    df = pd.read_csv(csv_path, encoding="utf-8-sig", low_memory=False)
    js, info = compute_all(df)

    def _extract(name: str) -> dict | None:
        m = re.search(rf"const {name}\s*=\s*(\{{[\s\S]*?\n\s*\}});", js)
        if not m:
            return None
        try:
            return json.loads(m.group(1))
        except Exception:
            return None

    return info, _extract("DATE_RANGE") or {}


def _load_insights() -> dict[str, str]:
    out: dict[str, str] = {}
    manual = BASE / "backend" / "insights_manual.json"
    if manual.is_file():
        data = json.loads(manual.read_text(encoding="utf-8"))
        for k, v in data.items():
            if k.startswith("Q") and isinstance(v, str) and v.strip():
                out[k] = v.strip()
    cache = BASE / ".insight_cache.json"
    if cache.is_file():
        try:
            c = json.loads(cache.read_text(encoding="utf-8"))
            for k, entry in c.items():
                if entry and entry.get("insight"):
                    out[k] = entry["insight"]  # LLM-generated wins over manual
        except Exception:
            pass
    return out


# ── Slide deck layout ────────────────────────────────────────────────────

SECTIONS: list[tuple[str, str, str, str | None]] = [
    # (section_id_for_screenshot, header_title, subtitle, insight_q_id)
    ("overview", "Phần 1 — Thông tin sơ bộ",
     "SOV community · Phân bố persona · Tổng quan dataset", None),
    ("Q1",  "Q1 — Master Topics: tỉ trọng tổng thể",
     "% đề cập trung bình qua các nhóm", "Q1"),
    ("Q2",  "Q2 — Master Topics × Persona",
     "Heatmap cross-tab", "Q2"),
    ("Q3",  "Q3 — Seller vs Prospect",
     "Master topics + sub-topics diverging", "Q3"),
    ("Q4",  "Q4 — Xu hướng Master Topics theo tháng",
     "Monthly + stacked % + weekly spikes", "Q4"),
    ("Q5",  "Q5 / Q6 — Chủ đề tiêu cực theo thời gian",
     "Day × hour heatmap · khung giờ cao điểm auto-detect", "Q5"),
    ("Q7",  "Q7 — Lý do gia nhập Amazon + benefit",
     "Top triggers · top benefits · sentiment split", "Q7"),
    ("Q8",  "Q8 — Dấu hiệu rời bỏ Amazon (SOA)",
     "Top lý do · persona rời bỏ · monthly trend", "Q8"),
    ("Q9",  "Q9 — Nhóm tham gia Q7 vs Q8",
     "Persona donuts side-by-side", "Q9"),
    ("Q10", "Q10 — Top ngành hàng được thảo luận",
     "Top 10 categories · weekly trend", "Q10"),
    ("Q11", "Q11 — Mức sử dụng tool Amazon (SOA)",
     "Tool usage + hài lòng vs vấn đề", "Q11"),
    ("Q12", "Q12 — Dịch vụ bên thứ 3 seller cần (SOA)",
     "Mentions vs Need · demand % · satisfaction", "Q12"),
    ("Q13", "Q13 — Khóa học seller quan tâm (SOA)",
     "Mentions · seeking · interest · sentiment", "Q13"),
    ("Q14", "Q14 — Chủ đề tăng trưởng + P&L (SOA)",
     "Distribution · top topics · sentiment breakdown", "Q14"),
]


def build_deck(out_path: Path) -> None:
    print("[ppt] capturing metadata (KPI, date range)…")
    info, date_range = _compute_info_and_date_range()
    insights = _load_insights()

    if not SCREENSHOT_DIR.is_dir() or not any(SCREENSHOT_DIR.glob("*.png")):
        print("[ppt] WARNING: no screenshots found — run `python screenshot_dashboard.py` first.")

    prs = Presentation()
    prs.slide_width = SLIDE_W
    prs.slide_height = SLIDE_H

    print("[ppt] assembling slides…")
    slide_title(prs, info, date_range)
    slide_section_banner(
        prs, "Phần 1 — Thông tin sơ bộ",
        "Community volume · persona split · baseline KPIs"
    )

    for sec_id, header, subtitle, q_id in SECTIONS:
        if sec_id == "overview":
            banner_title = "Phần 2 — Thông tin chi tiết"  # falls after overview
            if banner_title not in {s.shapes.title.text if s.shapes.title else "" for s in prs.slides}:
                pass  # (we'll insert the Section-2 banner explicitly below)

        screenshot = SCREENSHOT_DIR / f"{sec_id}.png"
        slide_with_screenshot(
            prs, header,
            screenshot if screenshot.is_file() else None,
            insights.get(q_id) if q_id else None,
            subtitle=subtitle,
        )

        # Insert the Section-2 banner right after the overview slide
        if sec_id == "overview":
            slide_section_banner(
                prs, "Phần 2 — Thông tin chi tiết",
                "14 câu hỏi nghiên cứu — từng bài có chart + AI insight editable",
            )

    total = len(prs.slides)
    for i, slide in enumerate(prs.slides, start=1):
        _footer(slide, i, total, date_range)

    prs.save(out_path)
    size_kb = out_path.stat().st_size / 1024
    print(f"[ppt] wrote {out_path}  ({size_kb:.1f} KB, {total} slides)")


if __name__ == "__main__":
    p = argparse.ArgumentParser(description="Export the ChiCom dashboard to PPTX.")
    p.add_argument("--out", default="ChiCom_Report.pptx",
                   help="Output PPTX filename (default: ChiCom_Report.pptx)")
    args = p.parse_args()

    out = Path(args.out)
    if not out.is_absolute():
        out = BASE / out
    build_deck(out)
