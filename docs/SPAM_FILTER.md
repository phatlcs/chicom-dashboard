# ChiCom Spam Filter — Reference Doc

Self-contained explanation of how `run_spam_filter.py` cleans the raw Facebook-group Excel before the dashboard pipeline consumes it. Written so another agent can re-derive the behavior without reading the code line by line.

---

## 1. Where things live

| Path | Role |
|---|---|
| `c:\Users\LECOO\Downloads\AGS dashboard\` | Project root (`FOLDER` in code) |
| `run_spam_filter.py` | The filter itself — single file, self-contained |
| `build_data.py` | Entry point. Calls `run_spam_filter.run()` conditionally, then `compute_all()` |
| `docs/all_groups_final_v2.xlsx` | **Default raw input.** Constant `DEFAULT_RAW_FILE = 'docs/all_groups_final_v2.xlsx'` |
| `output/blacklist/` | Auto-created. Stores `blacklist.xlsx` (flagged ids) + `white_list.xlsx` (allowlist of domains) |
| `output/blacklist/blacklist.xlsx` | Output: every flagged id with category + score + reasons |
| `output/blacklist/white_list.xlsx` | Input: domains that should never be flagged (Amazon, Facebook, Google etc.). Seeded with `DEFAULT_WHITELIST` on first run |
| `output/filtered/<base>_annotated.csv` (and .xlsx) | Output: **all** rows from the input + 4 extra columns: `irrelevant_type`, `relevant`, `spam_score`, `spam_reasons`. This is the hand-off to `compute.py`. |
| `output/filtered/<base>_cleaned.csv` (and .xlsx) | Output: only rows where `relevant=True` |
| `output/filtered/filter_rate_report.xlsx` | Older diagnostic, not produced by current code (legacy from earlier run) |

`<base>` is the input file's stem. For `docs/all_groups_final_v2.xlsx` you get `all_groups_final_v2_annotated.csv` etc.

The raw Excel files and the `output/` directory are **gitignored**. Only `dashboard/data_computed.js` is committed as the artifact.

---

## 2. Pipeline at a glance

```
docs/all_groups_final_v2.xlsx                            (raw 46k+ rows)
        ↓ pd.read_excel(sheet_name=0)
        ↓ scan all URLs → count per domain
        ↓ "spam_domains" = domains appearing ≥ 10 times AND not whitelisted
        ↓ row-by-row: detect_spam(row) → spam_score, is_spam, category, reasons
        ↓ rows with is_spam = True → blacklist.xlsx
        ↓ dedupe content (mark every duplicate after the first as irrelevant)
        ↓ produce 'irrelevant_type' + 'relevant' columns on every row
        ↓ write annotated_csv (everything) and cleaned_csv (relevant only)
```

The filter is **two-pass**: pass 1 builds the global `spam_domains` set (used by pass 2 to score each row), then pass 2 scores each row and a final dedupe step folds in content-level duplicates.

---

## 3. Detection logic (`detect_spam`)

Each row gets a `spam_score` (int). If `score ≥ 5` → `is_spam = True`. Reasons accumulate as a comma-joined string in `spam_reasons` so each flag is auditable.

### Hard rules (immediate score = 10, no further scoring)

1. **Too short** — `len(content) < 2` → category `'low_value'`, reason `'too_short'`
2. **Attachment-only** — content matches `^with attachments?:\s*(URL)?\s*$` OR contains "with attachment" and the residual text is < 3 chars → category `'attachment_only'`

### Additive rules (each adds to the score)

| Signal | Trigger | Score | Reason tag |
|---|---|---|---|
| Spam domain | URL whose domain is in `spam_domains` (i.e. appears ≥10× in corpus and not whitelisted) | +6 each | `spam_domain:<d>` |
| Unknown URL | URL with a non-whitelisted, non-spam-domain host | +1 each | `unknown_url` |
| Lots of emojis | `count_visual_emoji(content) ≥ 5` (uses Python `emoji` package + a custom `VISUAL_SYMBOLS` set with ✔✅⚡🔥💰📞 etc.) | +3 | `emoji_count:<n>` |
| Phone + contact + long | phone regex matches + any `CONTACT_KEYWORDS` + `len ≥ 200` | +4 | `phone_contact_ad` |
| Phone + contact | (without the length req) | +2 | `phone_contact` |
| Phone + emojis | phone + `visual_count ≥ 5` (no contact keyword) | +2 | `phone_emoji_listing` |
| Service-ad keywords | ≥ 2 of `SERVICE_KEYWORDS` present | +2 | `service_ad` |
| Promo keywords | ≥ 2 of `PROMO_KEYWORDS` present | +2 | `promo_keywords` |
| 1 promo + already-scoring | exactly 1 promo keyword AND `score > 0` already | +1 | `promo_keyword` |
| Hashtag spam | ≥ 3 `#hashtag` occurrences | +2 | `hashtag_spam` |
| Name-tag only | ≥ 2 `@mentions` AND residual text < 15 chars | +4 | `name_tag_only` |

### Phone regex
`0\d{1,3}[\s.\-]\d{1,4}[\s.\-]\d{3,5}|0\d{9}` — catches Vietnamese phone numbers with or without separators.

### Keyword banks (literals — lowercased before matching)

**`PROMO_KEYWORDS`** (Vietnamese deal/sale lingo):
> giảm giá, siêu giảm, giảm lên đến, sale lớn, sale hot, khuyến mãi, ưu đãi, chốt ngay, độc quyền, nhà phân phối, giá chỉ, chỉ còn, tin cực hot, deal hot, ưu đãi hiếm, gói tháng, gói năm

**`SERVICE_KEYWORDS`** (3rd-party service pitches — accounting, fulfillment, logistics):
> nhận đky, nhận đăng ký, nhận order, nhận ship, nhận làm, combo, llc, ein, báo giá, hỗ trợ đky, nhận setup, giải pháp vận chuyển, dịch vụ vận chuyển, fulfillment, epacket, freight, thông quan, kho hàng, giao hàng fba

**`CONTACT_KEYWORDS`** (call-to-action / DM-me phrasing):
> liên hệ, lien he, zalo, hotline, sđt, điện thoại, ib/, call/, inbox, nhắn tin, tư vấn & báo giá, tư vấn và báo giá

### Category assignment (after `is_spam = True`)

Mutually exclusive, evaluated top-to-bottom:

1. If any reason contains `spam_domain` → `promotion_link`
2. Else if `phone_contact_ad` or `service_ad` in reasons → `service_ad`
3. Else if `phone_emoji_listing` in reasons → `product_listing`
4. Else if `name_tag_only` in reasons → `name_tag_only`
5. Else if any `unknown_url` AND `promo_keywords` in reasons → `promotion_link`
6. Else → `spam` (generic catch-all)

### Spam-domain auto-flagging

Before per-row scoring, the filter scans **every URL in every row's `content` column**, counts unique domains, and any domain appearing **≥ 10 times** that is NOT in the whitelist gets added to `spam_domains`. This is what catches mass-posted promo links.

`_extract_domain(url)` strips `www.` and lowercases. `is_whitelisted(d)` allows exact match OR subdomain match against any whitelist entry.

### Whitelist seed

`DEFAULT_WHITELIST` contains all Amazon regional TLDs (`amazon.com`, `amazon.co.uk`, `amazon.de` …), Amazon subsystems (`sellercentral.amazon.com`, `advertising.amazon.com`, `brandregistry.amazon.com` …), `facebook.com` + variants, and `google.com` + `drive.google.com` + `docs.google.com`. Written to `white_list.xlsx` on first run; edit that file to add/remove entries without touching code.

---

## 4. Dedupe step (after per-row spam detection)

After spam scoring is done and the blacklist is written, the filter does a **content-level dedupe** on the rows that survived spam detection:

1. Build `bl_map = {id → irrelevant_type}` from the blacklist.
2. For every row in the raw frame: if its `id` is in `bl_map`, mark `relevant=False` and copy the category.
3. Among the *remaining* rows (relevant=True so far), find duplicates by exact `content` match.
4. Split duplicates two ways:
   - **`spam_dupes`** — content also appears among rows already marked spam → mark `relevant=False`, inherit the spam category from the original (`promotion_link` if ambiguous).
   - **`legit_dupes`** — content does NOT appear in spam → mark `relevant=False`, category = `'duplicate'`.

So `irrelevant_type` values in the final annotated CSV are:

- `''` (empty) → relevant
- `low_value`, `attachment_only`, `service_ad`, `product_listing`, `promotion_link`, `name_tag_only`, `spam` → spam category
- `duplicate` → exact-content duplicate of an earlier legitimate row

For the v2 dataset (46,636 raw rows), the resulting breakdown is approximately:
- 40,258 relevant
- 3,552 duplicate
- 1,566 service_ad
- 516 attachment_only
- 493 promotion_link
- 189 product_listing
- 62 spam (generic)

---

## 5. Outputs

After a successful run, four files exist in `output/filtered/`:

| File | Contains | Used by |
|---|---|---|
| `<base>_annotated.csv` | All rows + `relevant`, `irrelevant_type`, `spam_score`, `spam_reasons` | `build_data.py` → `compute.py` reads this and filters `relevant=True` |
| `<base>_annotated.xlsx` | Same as above, Excel format | Human review |
| `<base>_cleaned.csv` | Only rows where `relevant=True` | Downstream consumers that want pre-filtered data |
| `<base>_cleaned.xlsx` | Same, Excel format | Human review |

Plus `output/blacklist/blacklist.xlsx` — the explicit flag log with one row per spam-detected `id`, columns: `id, irrelevant_type, spam_score, detection_reasons, Type, created_date, content, source='auto'`.

---

## 6. How to invoke

**As a script** (interactive use):
```bash
python run_spam_filter.py                          # uses default v2 input
python run_spam_filter.py path/to/input.xlsx       # custom input
```

**As a library** (what `build_data.py` does):
```python
from run_spam_filter import run as run_spam_filter, FILTERED_DIR
annotated_csv, cleaned_csv = run_spam_filter('docs/all_groups_final_v2.xlsx')
```

**Via the build pipeline** (most common):
```bash
python build_data.py                  # auto-decides if filter needs re-running
python build_data.py --force-filter   # re-run even if CSV looks current
python build_data.py --skip-filter    # use existing annotated CSV, skip filter
python build_data.py --raw foo.xlsx   # different raw input
```

`build_data.py:43-46` defines `needs_filter()` which compares modification times:
- If the annotated CSV doesn't exist → run filter
- If `raw.xlsx.mtime > annotated.csv.mtime` (i.e. raw was modified after the cached output) → run filter
- Otherwise reuse the cached annotated CSV

This is what makes iterating on the compute / dashboard logic fast — you don't pay the 30-60s filter cost on every rebuild.

---

## 7. Inputs the filter expects

It reads `sheet_name=0` of the input xlsx via `pd.read_excel`. The schema it relies on:

| Column | Used for |
|---|---|
| `id` | dedupe key, blacklist key |
| `content` | the text the entire filter scores on |
| `Type` | written through to blacklist for review (typically `fbGroupTopic` or `fbGroupComment`) |
| `created_date` | written through to blacklist for review |

Other columns pass through untouched (`group_id`, `link`, `mention_type`, `platform`, `context`, `sentiment`, `persona`, `master_topic`, etc.).

---

## 8. Output schema additions

The annotated CSV adds these four columns to whatever the raw input had:

| Column | Type | Meaning |
|---|---|---|
| `irrelevant_type` | string | Empty if relevant; otherwise one of `low_value, attachment_only, service_ad, product_listing, promotion_link, name_tag_only, spam, duplicate` |
| `relevant` | bool | `True` if the row survived all filters |
| `spam_score` | int | The accumulated score (≥ 5 = flagged). Useful for tuning thresholds |
| `spam_reasons` | string | Comma-joined detection reasons — audit trail for why this row was flagged |

`compute.py` reads only `relevant` (filters to True) and ignores the other three for its aggregates. The remaining diagnostic columns are there for humans tuning the filter.

---

## 9. Tuning knobs (no code change needed)

**To allowlist a new domain** — open `output/blacklist/white_list.xlsx`, add a row with `domain` and `reason`. Delete `output/filtered/*_annotated.csv` and rerun.

**To force re-filter** — `python build_data.py --force-filter` (or touch the raw xlsx so its mtime is newer than the annotated csv).

**To inspect why a specific id was flagged** — open `output/blacklist/blacklist.xlsx` and grep its `id`. The `detection_reasons` column shows every signal that fired.

---

## 10. Tuning knobs (require code edit)

- **Spam threshold**: `is_spam = score >= 5` (`detect_spam` body, around line 222 of `run_spam_filter.py`)
- **Spam-domain cutoff**: 10 occurrences (`run()`, around line 156: `if c >= 10 and not is_whitelisted(d)`)
- **Phone+contact long-post bonus length**: 200 chars (`detect_spam`, around line 198: `is_long = len(content) >= 200`)
- **Keyword banks**: edit `PROMO_KEYWORDS`, `SERVICE_KEYWORDS`, `CONTACT_KEYWORDS`, `VISUAL_SYMBOLS` near the top of the file (lines 100-117)

After any code edit, rerun with `--force-filter`.

---

## 11. Edge cases / known behavior

- **The filter only looks at the `content` column.** Many comments carry a `context` field (parent post body) that isn't scanned. A comment like *"thanks bạn"* on an obvious spam post will be flagged as `duplicate` if it matches another row, but won't inherit the parent post's spam status otherwise.
- **No language detection.** Vietnamese and English keywords are both in the banks; mixed posts work.
- **No regex word boundaries in keyword scanning.** Keywords like `'lien he'` will substring-match inside longer words. This is mostly OK for the Vietnamese phrases (which are multi-word) but can occasionally false-positive on short English tokens.
- **Whitelist is exact-or-subdomain match.** Adding `amazon.com` allows `something.amazon.com` automatically. Adding `aws.amazon.com` does NOT allow `amazon.com`.
- **The filter is deterministic.** Same input + same whitelist = same output every time. Re-running just re-emits the same CSVs.
- **`output/blacklist/blacklist.xlsx` is overwritten on every run**, so manual edits don't persist. If you want a permanent allowlist exception, add the row to `white_list.xlsx`, not the blacklist.
