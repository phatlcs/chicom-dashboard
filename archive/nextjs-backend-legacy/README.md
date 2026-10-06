# nextjs/backend — archived 2026-10-06

A second, **dead** copy of the Python backend.

## Why it is dead

Every Next.js API route invokes the *root* backend, never this one:

```ts
// nextjs/app/api/generate/route.ts
const root = process.cwd()                    // .../app/nextjs
const projectRoot = join(root, '..')          // .../app
const script = join(projectRoot, 'backend', 'generate_range.py')
```

`insights`, `report-data`, `report-v2`, `upload-data`, `export-raw` all resolve
`<repo>/backend/*.py` the same way. Nothing in the repo (code, docs, deploy
scripts, workflows) references `nextjs/backend` after 2026-06-05.

It was created by `d48d23b` (2026-06-05, "include backend python scripts in
nextjs sync so they survive deploys") and then evolved on its own branch of
history until 2026-08-10, while the root `backend/` kept receiving the real
fixes (dynamic group universe, Q9 `id_source` self-heal, `skip_llm`, MT/LNK
code bans, month-filtered KB rows).

## Fixes that only ever landed here

Port these to `backend/` **only after deciding they are still wanted** — they
change production output, which is why they were archived rather than merged:

| Commit | Date | Change | Status on the live backend |
| --- | --- | --- | --- |
| `e687096` | 2026-07-10 | Convert UTC → Vietnam time (UTC+7) before the Q5/Q6 day-of-week and hour-of-day aggregation | **Absent.** `backend/compute.py` aggregates `created_date` as stored. Porting shifts every Q5/Q6 chart by 7h — confirm the stored timestamps really are UTC first. |
| `1a79570` | 2026-07-10 | `date_range` argument + "never use Q1/Q2/Q3/Q4 as a time label" prompt rule | Equivalent exists: live backend passes `period` and has prompt rule 7. |
| `527fc31` | 2026-07-12 | MT legend (`mt1 = Others`) injected into the prompt | Superseded by `_scrub_mt_codes()` in the live backend. |
| `f88ac64` | 2026-07-10 | `.env` lookup also checks the project parent | Unneeded: live backend finds `.env` at repo root and `backend/`. |
| `22f523c` | 2026-08-10 | KB context schema v5 (`knowledge_base.csv`, `background_context`) | Live backend uses `AGS_Knowledge_Base.csv` filtered by report month (schema `v4-kb-period`). Both are valid; only one should survive. |
| `1a79570` | 2026-07-10 | Write `expert_insights.json` to `public/dashboard/` | Live backend writes `dashboard/expert_insights.json`, which `generate_range.py` reads. |

`compute.py` here also predates `GROUPS_PRESENT`, `skip_llm`, and the Q9
thread self-heal — do **not** revive this copy wholesale.
