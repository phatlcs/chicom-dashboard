"""
LLM-powered insight generator for the Boost dashboard.

For each of the 14 research questions, assemble:
  - the aggregated numbers already computed by compute.py
  - a small sample of representative raw Vietnamese posts from the CSV

and ask Claude Haiku 4.5 to write a structured analysis in English.
Cached on disk by content-hash so rebuilds with unchanged data
pay zero LLM cost.

Becomes a no-op (returns {Q1: None, ...}) when ANTHROPIC_API_KEY is
unset or skip_llm=True.
"""

from __future__ import annotations

import hashlib
import json
import os
import re
import sys
import time
from pathlib import Path
from typing import Any, Callable

import pandas as pd


# ── Config ──────────────────────────────────────────────────────────────────

_BACKEND_DIR = Path(__file__).resolve().parent
_PROJECT_DIR = _BACKEND_DIR.parent

MODEL_ID        = "claude-haiku-4-5-20251001"
MAX_TOKENS      = 1200
TEMPERATURE     = 0.3
SAMPLES_PER_Q   = 8
SAMPLE_CHARS    = 300
CACHE_PATH      = Path(os.getenv("INSIGHT_CACHE_PATH",
                                 _PROJECT_DIR / ".insight_cache.json"))
# Hand-written insights used as a fallback when no API key is available.
# Loaded into INSIGHTS for any Q that has a non-empty string here.
MANUAL_PATH     = _BACKEND_DIR / "insights_manual.json"


def _load_manual() -> dict:
    if not MANUAL_PATH.is_file():
        return {}
    try:
        data = json.loads(MANUAL_PATH.read_text(encoding="utf-8"))
        # Drop comment keys, keep only Q-prefixed entries with non-empty strings
        return {
            k: v.strip() for k, v in data.items()
            if k.startswith("Q") and isinstance(v, str) and v.strip()
        }
    except Exception as e:
        print(f"  [insight] failed to read {MANUAL_PATH.name}: {e}", file=sys.stderr)
        return {}


# ── Utility helpers ─────────────────────────────────────────────────────────

def _load_env() -> None:
    """Tiny .env loader so callers don't need python-dotenv as a hard dep."""
    for candidate in (_BACKEND_DIR / ".env", _PROJECT_DIR / ".env"):
        if not candidate.is_file():
            continue
        for line in candidate.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, _, v = line.partition("=")
            k = k.strip()
            v = v.strip().strip('"').strip("'")
            os.environ.setdefault(k, v)


def _load_cache() -> dict:
    if not CACHE_PATH.is_file():
        return {}
    try:
        return json.loads(CACHE_PATH.read_text(encoding="utf-8"))
    except Exception:
        return {}


def _save_cache(cache: dict) -> None:
    try:
        CACHE_PATH.write_text(
            json.dumps(cache, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
    except Exception as e:
        print(f"  [insight] cache write failed: {e}", file=sys.stderr)


def _hash_payload(payload: Any) -> str:
    blob = json.dumps(payload, ensure_ascii=False, sort_keys=True,
                      default=str).encode("utf-8")
    return hashlib.sha256(blob).hexdigest()


_URL_RE = re.compile(r"https?://\S+|www\.\S+", re.IGNORECASE)


def _clean_snippet(text: str, max_chars: int = SAMPLE_CHARS) -> str:
    if not isinstance(text, str):
        return ""
    s = _URL_RE.sub("", text)
    s = re.sub(r"\s+", " ", s).strip()
    if len(s) > max_chars:
        s = s[: max_chars - 1].rstrip() + "…"
    return s


def _sample_from(series: pd.Series, n: int = SAMPLES_PER_Q) -> list[str]:
    """Return up to n cleaned, deduplicated content snippets."""
    if series is None or len(series) == 0:
        return []
    cleaned = (
        series.fillna("").astype(str)
        .map(_clean_snippet)
    )
    cleaned = cleaned[cleaned != ""].drop_duplicates()
    if len(cleaned) == 0:
        return []
    if len(cleaned) > n:
        cleaned = cleaned.sample(n=n, random_state=42)
    return cleaned.tolist()


def _mask_by_keywords(text_lower: pd.Series, keywords: list[str]) -> pd.Series:
    parts = []
    for k in keywords:
        esc = re.escape(k.lower())
        if len(k) <= 6 and " " not in k:
            parts.append(r"\b" + esc + r"\b")
        else:
            parts.append(esc)
    pattern = "|".join(parts) if parts else None
    if pattern is None:
        return pd.Series(False, index=text_lower.index)
    return text_lower.str.contains(pattern, regex=True, na=False)


# ── Sampling strategies per Q ──────────────────────────────────────────────

def _samples_q1(rel: pd.DataFrame, agg: dict) -> list[str]:
    q1_master = agg.get("q1_master", [])
    top_mts = [m["id"] for m in q1_master[:3]]
    if "mt_id" not in rel.columns:
        return _sample_from(rel.get("content"))
    pool = rel[rel["mt_id"].isin(top_mts)] if top_mts else rel
    return _sample_from(pool.get("content"))


def _samples_q2(rel: pd.DataFrame, agg: dict) -> list[str]:
    q2_matrix = agg.get("q2_matrix", {})
    best_mt, best_p, best_v = None, None, -1
    for mt_id, row in q2_matrix.items():
        for p_id, v in row.items():
            if v > best_v:
                best_mt, best_p, best_v = mt_id, p_id, v
    if best_mt is None:
        return _sample_from(rel.get("content"))
    pool = rel
    if "mt_id" in pool.columns:
        pool = pool[pool["mt_id"] == best_mt]
    if "persona_id" in pool.columns:
        pool = pool[pool["persona_id"] == best_p]
    return _sample_from(pool.get("content"))


def _samples_q3(rel: pd.DataFrame, agg: dict) -> list[str]:
    subs = agg.get("q3_subs", [])
    if not subs or "sub_topic" not in rel.columns:
        return _sample_from(rel.get("content"))
    seller_top   = sorted(subs, key=lambda s: -s["diff"])[:2]
    prospect_top = sorted(subs, key=lambda s:  s["diff"])[:2]
    persona = rel["persona"].fillna("")
    out: list[str] = []
    for entry in seller_top:
        pool = rel[(rel["sub_topic"] == entry["vn"]) & persona.str.contains("Seller", na=False)]
        out.extend(_sample_from(pool.get("content"), n=2))
    for entry in prospect_top:
        pool = rel[(rel["sub_topic"] == entry["vn"]) & persona.str.contains("Prospect", na=False)]
        out.extend(_sample_from(pool.get("content"), n=2))
    return out[:SAMPLES_PER_Q]


def _samples_q4(rel: pd.DataFrame, agg: dict) -> list[str]:
    q4_events = agg.get("q4_events", [])
    week_starts = agg.get("week_starts", [])
    if not q4_events or not week_starts:
        return _sample_from(rel.get("content"))
    idx = q4_events[0]["week"]
    if idx >= len(week_starts):
        return _sample_from(rel.get("content"))
    ws = week_starts[idx]
    pool = rel[rel["week_start"] == ws] if "week_start" in rel.columns else rel
    return _sample_from(pool.get("content"))


def _samples_q5_q6(rel: pd.DataFrame, agg: dict) -> list[str]:
    neg = rel[rel.get("sentiment") == "negative"] if "sentiment" in rel.columns else rel.iloc[0:0]
    peak = agg.get("peak_window", {})
    hours = peak.get("hours") or list(range(24))
    if "hour" in neg.columns:
        neg = neg[neg["hour"].isin(hours)]
    return _sample_from(neg.get("content"))


def _samples_q7(rel: pd.DataFrame, agg: dict) -> list[str]:
    from keywords import Q7_TRIGGER_KW, Q7_BENEFIT_KW
    if "content" not in rel.columns:
        return []
    text = rel["content"].fillna("").str.lower()
    kws: list[str] = []
    for v in list(Q7_TRIGGER_KW.values()) + list(Q7_BENEFIT_KW.values()):
        kws.extend(v)
    mask = _mask_by_keywords(text, kws)
    pos_mask = (rel.get("sentiment") == "positive") if "sentiment" in rel.columns else pd.Series(False, index=rel.index)
    pool = rel[mask & pos_mask]
    if len(pool) < SAMPLES_PER_Q:
        pool = rel[mask]
    return _sample_from(pool.get("content"))


def _samples_q8(soa_rel: pd.DataFrame, agg: dict) -> list[str]:
    from keywords import Q8_TRIGGER_KW
    if "content" not in soa_rel.columns:
        return []
    text = soa_rel["content"].fillna("").str.lower()
    kws: list[str] = []
    for v in Q8_TRIGGER_KW.values():
        kws.extend(v)
    mask = _mask_by_keywords(text, kws)
    neg_mask = (soa_rel.get("sentiment") == "negative") if "sentiment" in soa_rel.columns else pd.Series(False, index=soa_rel.index)
    pool = soa_rel[mask & neg_mask]
    return _sample_from(pool.get("content"))


def _samples_q9(rel: pd.DataFrame, agg: dict) -> list[str]:
    q7p = agg.get("q9_q7_personas", [])
    q8p = agg.get("q9_q8_personas", [])
    picks: list[str] = []
    for entry in ((q7p[0] if q7p else None), (q8p[0] if q8p else None)):
        if not entry:
            continue
        pool = rel[rel.get("persona") == entry["name"]] if "persona" in rel.columns else rel.iloc[0:0]
        picks.extend(_sample_from(pool.get("content"), n=4))
    return picks[:SAMPLES_PER_Q] or _sample_from(rel.get("content"))


def _samples_q10(rel: pd.DataFrame, agg: dict) -> list[str]:
    from keywords import Q10_CATEGORY_KW
    q10_top = agg.get("q10_top", [])
    names = [c["name"] for c in q10_top[:2]]
    if "content" not in rel.columns:
        return []
    text = rel["content"].fillna("").str.lower()
    kws: list[str] = []
    for n in names:
        kws.extend(Q10_CATEGORY_KW.get(n, []))
    mask = _mask_by_keywords(text, kws) if kws else pd.Series(False, index=text.index)
    return _sample_from(rel[mask].get("content")) or _sample_from(rel.get("content"))


def _samples_q11(soa_rel: pd.DataFrame, agg: dict) -> list[str]:
    from keywords import Q11_TOOL_KW
    q11_tools = agg.get("q11_tools", [])
    names = [t["name"] for t in q11_tools[:2]]
    if "content" not in soa_rel.columns:
        return []
    text = soa_rel["content"].fillna("").str.lower()
    kws: list[str] = []
    for n in names:
        kws.extend(Q11_TOOL_KW.get(n, []))
    mask = _mask_by_keywords(text, kws) if kws else pd.Series(False, index=text.index)
    pool = soa_rel[mask]
    if "sentiment" not in pool.columns or len(pool) == 0:
        return _sample_from(pool.get("content"))
    pos_s = _sample_from(pool[pool["sentiment"] == "positive"].get("content"), n=4)
    neg_s = _sample_from(pool[pool["sentiment"] == "negative"].get("content"), n=4)
    return (pos_s + neg_s)[:SAMPLES_PER_Q] or _sample_from(pool.get("content"))


def _samples_q12(soa_rel: pd.DataFrame, agg: dict) -> list[str]:
    from keywords import Q12_SERVICE_KW, SEEK_PHRASES
    q12_services = agg.get("q12_services", [])
    names = [s["name"] for s in q12_services[:3]]
    if "content" not in soa_rel.columns:
        return []
    text = soa_rel["content"].fillna("").str.lower()
    svc_kws: list[str] = []
    for n in names:
        svc_kws.extend(Q12_SERVICE_KW.get(n, []))
    svc_mask = _mask_by_keywords(text, svc_kws) if svc_kws else pd.Series(False, index=text.index)
    seek_mask = _mask_by_keywords(text, SEEK_PHRASES)
    pool = soa_rel[svc_mask & seek_mask]
    if len(pool) == 0:
        pool = soa_rel[svc_mask]
    return _sample_from(pool.get("content"))


def _samples_q13(soa_rel: pd.DataFrame, agg: dict) -> list[str]:
    from keywords import Q13_COURSE_KW
    if "content" not in soa_rel.columns:
        return []
    text = soa_rel["content"].fillna("").str.lower()
    kws: list[str] = []
    for v in Q13_COURSE_KW.values():
        kws.extend(v)
    mask = _mask_by_keywords(text, kws)
    return _sample_from(soa_rel[mask].get("content"))


def _samples_q14(soa_rel: pd.DataFrame, agg: dict) -> list[str]:
    from keywords import Q14_GROWTH_KW
    if "content" not in soa_rel.columns:
        return []
    text = soa_rel["content"].fillna("").str.lower()
    kws: list[str] = []
    for v in Q14_GROWTH_KW.values():
        kws.extend(v)
    mask = _mask_by_keywords(text, kws)
    pool = soa_rel[mask]
    if "sentiment" not in pool.columns or len(pool) == 0:
        return _sample_from(pool.get("content"))
    mix: list[str] = []
    for s in ("positive", "negative", "neutral"):
        mix.extend(_sample_from(pool[pool["sentiment"] == s].get("content"), n=3))
    return mix[:SAMPLES_PER_Q] or _sample_from(pool.get("content"))


# (question_id, title_for_prompt, sampler, scope)
Q_SPECS: list[tuple[str, str, Callable, str]] = [
    ("Q1",  "Master Topics — tỉ trọng tổng thể và phân bố theo community",     _samples_q1,   "rel"),
    ("Q2",  "Ma trận Persona × Master Topics — nhóm nào thảo luận topic nào",  _samples_q2,   "rel"),
    ("Q3",  "Seller vs Prospect — khác biệt Master Topics + sub-topics",       _samples_q3,   "rel"),
    ("Q4",  "Xu hướng Master Topics theo tháng + tuần đỉnh (auto-detect)",     _samples_q4,   "rel"),
    ("Q5",  "Sub-topic tiêu cực × ngày trong tuần",                            _samples_q5_q6, "rel"),
    ("Q6",  "Khung giờ cao điểm thảo luận tiêu cực",                           _samples_q5_q6, "rel"),
    ("Q7",  "Lý do + benefit khiến seller gia nhập Amazon",                    _samples_q7,   "rel"),
    ("Q8",  "Dấu hiệu rời bỏ Amazon + persona đang rời bỏ (SOA only)",         _samples_q8,   "soa_rel"),
    ("Q9",  "Phân bố persona trong thảo luận gia nhập vs rời bỏ",              _samples_q9,   "rel"),
    ("Q10", "Top ngành hàng được thảo luận",                                   _samples_q10,  "rel"),
    ("Q11", "Mức sử dụng tool Amazon + hài lòng vs vấn đề (SOA only)",         _samples_q11,  "soa_rel"),
    ("Q12", "Dịch vụ bên thứ 3 seller đang cần (SOA only)",                    _samples_q12,  "soa_rel"),
    ("Q13", "Khóa học seller quan tâm (SOA only)",                             _samples_q13,  "soa_rel"),
    ("Q14", "Chủ đề tăng trưởng + P&L polarity (SOA only)",                    _samples_q14,  "soa_rel"),
]


# ── LLM call ────────────────────────────────────────────────────────────────

_SYSTEM_PROMPT = """\
You are an expert analyst for the Vietnamese e-commerce community, writing insights for an internal dashboard for the Amazon Vietnam team.

Input:
- `title`: The research question being analyzed.
- `period`: The time period for the data (e.g., 'April 2026' or 'Q1 2026').
- `aggregate`: Pre-computed numbers and top items from a dataset.
- `samples`: 4-8 real post snippets from users.

Task:
Produce a structured analysis in JSON format. The language of the analysis MUST be English.
Follow the existing expert_insights.json schema:

{
  "scope": "Brief string describing the data scope (e.g., 'Scope: SOA (5,461 mentions) · EC (34,794 mentions) · April 2026')",
  "stats": [
    { "label": "Short label", "value": "Number/Percentage", "variant": "warn|danger|soa|ec|both", "note": "Brief context like 'Others (1,234)'" }
  ],
  "findings": [
    {
      "variant": "warn|danger|soa|ec|both",
      "label": "Punchy headline with emoji",
      "html": "<p>Detailed analysis paragraph using <strong>bolding</strong> for emphasis. Refer to specific numbers from aggregate data. Explain the 'why' based on the samples.</p>"
    }
  ],
  "recommendations": [
    "Concrete, actionable advice #1",
    "Concrete, actionable advice #2"
  ]
}

Constraints:
1. Stick strictly to the numbers in `aggregate`. Do not invent data.
2. Use `samples` to provide qualitative color and identify specific pain points.
3. Use the `period` provided for the scope and all temporal references.
4. Output ONLY the JSON object. No preamble, no markdown blocks.
5. Ensure 'variant' choices align with the content (e.g., 'soa' for Amazon-specific findings).
6. Always provide exactly 4 stats and exactly 3 findings.
7. Ensure all strings in JSON are correctly escaped.
"""


def _call_claude(title: str, period: str, payload: dict, api_key: str) -> dict | None:
    """Make one LLM call. Returns dict or None on failure."""
    try:
        from anthropic import Anthropic
    except ImportError:
        print("  [insight] anthropic package not installed — pip install anthropic",
              file=sys.stderr)
        return None

    client = Anthropic(api_key=api_key)
    user_text = (
        f"title: {title}\n"
        f"period: {period}\n\n"
        f"aggregate:\n{json.dumps(payload['aggregate'], ensure_ascii=False, indent=2)}\n\n"
        f"samples:\n"
        + "\n".join(f"- {s}" for s in payload.get("samples", []))
    )

    try:
        resp = client.messages.create(
            model=MODEL_ID,
            max_tokens=MAX_TOKENS,
            temperature=TEMPERATURE,
            system=[
                {
                    "type": "text",
                    "text": _SYSTEM_PROMPT,
                    "cache_control": {"type": "ephemeral"},
                }
            ],
            messages=[
                {"role": "user", "content": user_text},
            ],
        )
        text = "".join(
            b.text for b in resp.content if getattr(b, "type", None) == "text"
        ).strip()
        
        # Strip potential markdown blocks if LLM ignored instructions
        if text.startswith("```"):
            text = re.sub(r"^```json\s*|\s*```$", "", text, flags=re.MULTILINE)
        
        return json.loads(text)
    except Exception as e:
        print(f"  [insight] API error ({title}): {e}", file=sys.stderr)
        return None


# ── Public entry point ─────────────────────────────────────────────────────

def generate_insights_for_all_qs(
    rel: pd.DataFrame,
    soa_rel: pd.DataFrame,
    aggregates: dict,
    skip_llm: bool = False,
) -> tuple[dict, dict]:
    """
    Return (insights_dict, expert_insights_dict) for all 14 Q sections.
    """
    _load_env()
    api_key = os.getenv("ANTHROPIC_API_KEY")

    if os.getenv("INSIGHTS_SKIP_LLM") == "1":
        skip_llm = True

    if skip_llm or not api_key:
        reason = "skip_llm=True" if skip_llm else "ANTHROPIC_API_KEY not set"
        print(f"  [insight] {reason} — skipping LLM insights")
        return {q_id: None for q_id, *_ in Q_SPECS}, {}

    # Determine period
    start = rel["created_date"].min()
    end = rel["created_date"].max()
    if pd.notna(start) and pd.notna(end):
        if start.month == end.month and start.year == end.year:
            period = start.strftime("%B %Y")
        else:
            # Check if it spans a quarter
            q = (start.month - 1) // 3 + 1
            period = f"Q{q} {start.year}"
    else:
        period = "Recent Period"

    cache = _load_cache()
    plain_results: dict = {}
    expert_results: dict = {}
    hits = 0
    misses = 0
    t0 = time.time()

    for q_id, title, sampler, scope in Q_SPECS:
        frame = soa_rel if scope == "soa_rel" else rel
        try:
            samples = sampler(frame, aggregates)
        except Exception as e:
            print(f"  [insight] {q_id} sampling failed: {e}", file=sys.stderr)
            samples = []

        agg_for_q = aggregates.get(q_id, {})
        payload = {"aggregate": agg_for_q, "samples": samples}
        # Include a version/schema flag in the hash so refactors trigger a rebuild
        key = _hash_payload({
            "model": MODEL_ID, 
            "payload": payload, 
            "title": title, 
            "period": period,
            "schema": "v3-structured-en-period"
        })

        cached = cache.get(q_id)
        if cached and cached.get("hash") == key and cached.get("expert"):
            expert_results[q_id] = cached["expert"]
            findings = cached["expert"].get("findings", [])
            plain_results[q_id] = findings[0].get("html", "") if findings else ""
            hits += 1
            continue

        structured = _call_claude(title, period, payload, api_key)
        if structured:
            cache[q_id] = {"hash": key, "expert": structured}
            expert_results[q_id] = structured
            findings = structured.get("findings", [])
            plain_results[q_id] = findings[0].get("html", "") if findings else ""
            misses += 1
        else:
            # Don't pop cache if it's a transient failure, but for this build we want results
            expert_results[q_id] = None
            plain_results[q_id] = None

    _save_cache(cache)
    
    # Write to expert_insights.json
    total_relevant = len(rel)
    header = {
        "_comment": f"Expert analyst panels — auto-generated by insights.py ({total_relevant:,} relevant rows). Re-run build_data.py to refresh."
    }
    final_expert = {**header, **expert_results}
    
    out_path = _PROJECT_DIR / "dashboard" / "expert_insights.json"
    try:
        out_path.write_text(json.dumps(final_expert, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"  [insight] updated {out_path.name}")
    except Exception as e:
        print(f"  [insight] failed to write expert_insights.json: {e}", file=sys.stderr)

    print(f"  [insight] {hits} cache hits, {misses} API calls, "
          f"{time.time() - t0:.1f}s")
    
    return plain_results, expert_results
