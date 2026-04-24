# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

ChiCom is a static-first community-insights dashboard built for a one-shot analytics report. It ingests Vietnamese-language Facebook-group posts (9 communities: 2 SOA = Selling-on-Amazon, 7 EC = cross-border e-commerce), spam-filters them, classifies/aggregates into answers for 14 research questions, and renders the result as a single-page React dashboard. The same data also powers a PowerPoint export.

There is no build step for the frontend: the browser runs JSX through Babel Standalone at load time. All aggregates are pre-computed in Python and serialized into `dashboard/data_computed.js` as two `window.ChiComData*` globals that the JSX reads.

## Common commands

All Python commands run from the project root. There is no `package.json` — the frontend needs no build.

```bash
# One-shot: raw Excel → spam filter → compute + LLM insights → data_computed.js
python build_data.py                         # default raw: docs/all_groups_final_v2.xlsx
python build_data.py --raw my_dataset.xlsx   # different raw input
python build_data.py --force-filter          # re-run spam filter even if annotated CSV is current
python build_data.py --skip-filter           # reuse existing annotated CSV
python build_data.py --no-llm                # skip LLM insight generation (INSIGHTS.Qx = null)

# Interactive / local dev — FastAPI server serves dashboard + accepts CSV uploads
python backend/main.py                       # → http://localhost:8080
# uvicorn alternative (from backend/):
uvicorn main:app --reload --port 8080

# PPT export pipeline — screenshots must be taken before export
python screenshot_dashboard.py               # writes screenshots/overview.png, Q1.png … Q14.png
python export_to_ppt.py                      # writes chicom_report.pptx (or --out <path>)

# Install deps (see backend/requirements.txt). screenshot_dashboard.py also needs playwright
# browsers: `playwright install chromium`. export_to_ppt.py needs python-pptx + Pillow.
pip install -r backend/requirements.txt
```

There are no tests and no linter configured.

## Architecture

### Data build pipeline (`build_data.py` is the single entry point)

```
raw .xlsx → run_spam_filter.run() → output/filtered/<base>_annotated.csv
                                 ↓
                          backend/compute.compute_all(df)
                                 ↓
                   ┌─────────────┴────────────┐
                   ↓                          ↓
          aggregates (Q1..Q14)      backend/insights.generate(...)
                   └─────────────┬────────────┘
                                 ↓
                     dashboard/data_computed.js
```

`build_data.py:43-46` auto-skips the spam filter when the annotated CSV is newer than the raw xlsx — this is the fast-path for iterating on compute logic alone. Both the spam filter outputs (`output/`) and the raw/annotated data files are gitignored (see `.gitignore`); only `dashboard/data_computed.js` is committed as the hand-off artifact.

### compute.py is the brain

[backend/compute.py](backend/compute.py) owns all aggregation logic. Key contracts:

- **Taxonomies** are hard-coded constants at the top of the file: `GROUP_INFO` (9 communities), `TOPIC_MAP` / `MASTER_TOPICS` (9-topic canonical taxonomy — `mt9` is intentionally kept even when never emitted, so stakeholders see the full slot at 0%), `PERSONAS` (6 personas), `SUBTOPICS`, `Q3_SUBS_VN`.
- **`_normalize_master_topic` / `_normalize_sub_topics`**: defensive fuzzy-matching (`difflib`) that cleans up LLM typo artifacts in the `master_topic` / `sub_topic` columns before counts are taken. Don't strip these — the upstream classifier is imperfect and these functions absorb that noise.
- **SOA-only questions**: Q8, Q11, Q12, Q13, Q14 are filtered to `group_id ∈ SOA_IDS` (groups 1, 2). The frontend `<Section soaOnly>` prop surfaces a `ScopeBadge`; don't add EC data to these without coordinating with the JSX scope badge.
- **Output format**: `compute_all` returns `(js_string, info_dict)`. The js_string is not JSON — it's a JS file that defines two IIFEs (`window.ChiComData`, `window.ChiComData2`) with const-declared constants. The layout is hand-formatted around [backend/compute.py:540-615](backend/compute.py#L540-L615) — edit carefully.

### Frontend (`dashboard/`)

No bundler. `dashboard/index.html` loads React + Babel from unpkg, then each section as a `<script type="text/babel">` tag. Order matters: `data_computed.js` → `shell.jsx` → question files → `app.jsx`.

- [dashboard/app.jsx](dashboard/app.jsx) is the page shell. It wires `window.Qn` components into `<window.Section>` containers with an `indication` prop (Vietnamese analyst copy) and the `soaOnly` flag.
- [dashboard/shell.jsx](dashboard/shell.jsx) owns the cross-cutting primitives: `useTooltip`, `Sparkline`, `heatColor`/`binColor`, `TopBar`, `Section`, `ScopeBadge`, `TimeRangeBadge`, `KpiStrip`, `SectionBanner`, `OverviewPanel`, `AnchorRail`. Each Q-file reads `window.ChiComData` / `window.ChiComData2` directly.
- Question files group 1-3 questions per file: `q1_q2.jsx`, `q3_q4.jsx`, `q5_q6.jsx`, `q7_q9.jsx`, `q10_q14.jsx`. Two older split files (`q7_q10.jsx`, `q11_q14.jsx`) exist on disk but are NOT loaded by `index.html` — treat them as legacy unless you intentionally swap them in.
- The `TweaksPanel` in app.jsx hides behind an iframe postMessage handshake (`__activate_edit_mode`) and persists theme/accent via an `EDITMODE-BEGIN`/`EDITMODE-END` comment sentinel that an external editor patches. Leave those comments intact.

### FastAPI backend (optional)

[backend/main.py](backend/main.py) serves the same dashboard but dynamically. On CSV upload it re-runs `compute_all` in-memory and patches `GET /data_computed.js` to return the fresh JS. The frontend [dashboard/upload_panel.jsx](dashboard/upload_panel.jsx) probes `GET /api/status` on mount and hides itself entirely on Vercel / any static host where that endpoint 404s. This is how the same `dashboard/` directory works both statically (Vercel, see `vercel.json`) and live.

### LLM insight generation

[backend/insights.py](backend/insights.py) runs at the end of `compute_all`. For each Q it samples up to 8 representative posts plus the aggregated numbers, asks Claude Haiku 4.5 for a 3-5 sentence Vietnamese analyst paragraph, and content-hash-caches results in `.insight_cache.json` so unchanged data pays zero API cost. Set `ANTHROPIC_API_KEY` in `.env` to enable. Without the key, `INSIGHTS.Q1..Q14` come out `null` and the JSX falls back to terse templates OR to the hand-written `backend/insights_manual.json` (any Q-prefixed, non-empty string there wins).

### PPT export

[export_to_ppt.py](export_to_ppt.py) stitches per-section PNGs from `screenshots/` (produced by `screenshot_dashboard.py`, which spins up a local HTTP server → headless Chromium → per-section element screenshot) together with editable text boxes sourced from `backend/insights_manual.json` / `.insight_cache.json`. If `screenshots/` is missing, run the screenshotter first.

## Conventions

- **UI copy is Vietnamese.** Dashboard labels, `indication` strings in app.jsx, and LLM insight prompts are all in Vietnamese — don't anglicize them casually.
- **Two-tier frontend data object**: core taxonomies + Q1-Q6 live on `window.ChiComData`; Q7-Q14 live on `window.ChiComData2`. Keep that split when adding fields, since the JSX reads `const D = window.ChiComData` / `const D2 = window.ChiComData2` in each file.
- **Never hand-edit `dashboard/data_computed.js`.** It's regenerated on every `build_data.py` run.
- **Keep `mt9` in `MASTER_TOPICS`** even though the current classifier never emits it — the 0% slot is deliberate so stakeholders see the full 9-topic taxonomy.
