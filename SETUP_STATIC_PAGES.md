# Static Pages Setup Guide

This guide walks through deploying the dynamic report system with static pre-generated data files.

---

## Quick Start Checklist

- [ ] Create database tables (schema.sql)
- [ ] Update Next.js environment variables
- [ ] Install Python dependencies (generate_page_insights.py)
- [ ] Seed predefined pages (Q1, April)
- [ ] Generate initial data files (q1.js, april.js)
- [ ] Deploy and test

---

## 1. Create Database Tables

On EC2, run the schema:

```bash
psql -U postgres -d chicom_dashboard < /path/to/nextjs/schema.sql
```

This creates:
- `pooled_posts_all` — Master table of all posts (no duplicates)
- `pages` — Registry of predefined + custom report pages
- `page_insights` — Stores Q1-Q14 insights per page
- `report_name_index` — Tracks auto-increment name versions

---

## 2. Environment Variables

Update `.env` in the Next.js root:

```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=chicom_dashboard
DB_USER=postgres
DB_PASSWORD=chicom2024

# LLM (for insight generation)
ANTHROPIC_API_KEY=sk-ant-xxx
```

---

## 3. Load Data into Pooled Table

First, load your CSV data into `pooled_posts_all`:

```python
# Example: Load Q1 and April data
python backend/load_to_pooled.py
```

This:
- Reads cleaned CSV files from `output/filtered/`
- Inserts posts into `pooled_posts_all` (skips duplicates)
- Creates `data_batches` entries for tracking

```sql
-- Verify data loaded:
SELECT COUNT(*) FROM pooled_posts_all;
-- Should show combined Q1 + April posts (~54K)
```

---

## 4. Seed Predefined Pages

Create the Q1 and April page entries:

```bash
python backend/seed_pages.py
```

This creates:
- Page `q1`: Jan-Mar, 40K posts
- Page `april`: April only, 14K posts

Verify:
```sql
SELECT page_slug, page_name, total_posts FROM pages;
```

---

## 5. Generate Initial Data Files

Now generate the actual data files that the dashboard loads:

```bash
# Generate q1.js and april.js
python backend/generate_data_files.py
```

This outputs:
- `/var/www/dashboard/pages/q1.js` — Q1 data
- `/var/www/dashboard/pages/april.js` — April data

Each file contains:
```javascript
window.ChiComData = { metadata, Q1, Q2, Q3, Q4, Q5, Q6 }
window.ChiComData2 = { Q7, Q8, ..., Q14 }
window.INSIGHTS = { Q1: "...", Q2: "...", ... }
```

---

## 6. Deploy Next.js App

```bash
cd nextjs

# Install dependencies
npm install

# Build
npm run build

# Start with PM2
pm2 start npm --name "admin" -- start
pm2 save
```

Verify:
- Visit `http://localhost:3000/admin` → See admin panel
- Visit `http://localhost:3000/overview` → See all pages
- Next.js API at `http://localhost:3000/api/pages` → Returns page list

---

## 7. Verify Dashboard Loading

```bash
# Dashboard at /var/www/dashboard loads pages dynamically
curl http://localhost/q1
# Should serve dashboard HTML that loads /pages/q1.js
```

Browser console should show:
```
✓ Loaded data for page: q1
```

---

## 8. Create a Custom Report (Test)

```bash
curl -X POST http://localhost:3000/api/pages/create \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Q1 Custom",
    "timeStart": "2026-01-15",
    "timeEnd": "2026-02-15",
    "filters": {}
  }'

# Response:
# {
#   "status": "success",
#   "slug": "q1-custom",
#   "url": "/q1-custom"
# }
```

Then:
- Visit `http://localhost/q1-custom`
- Dashboard should load `/pages/q1-custom.js`

---

## 9. Data Flow Diagram

```
User creates report via /overview
    ↓
POST /api/pages/create
    ↓
Next.js validates & creates page row
    ↓
Query pooled_posts_all for time range
    ↓
Call backend/generate_page_data.py
    ↓
Generate {slug}.js file
    ↓
Store in /var/www/dashboard/pages/
    ↓
User visits /{slug}
    ↓
Dashboard index.html loads pages/{slug}.js
    ↓
React renders with that data
```

---

## 10. File Locations

```
/var/www/dashboard/
├── index.html               ← Updated to load pages/{slug}.js
├── app.jsx, shell.jsx, etc. ← Unchanged
└── pages/                   ← NEW: Page-specific data files
    ├── q1.js                ← Data for /q1
    ├── april.js             ← Data for /april
    └── q1-custom.js         ← Data for custom reports

/home/ubuntu/admin/nextjs/
├── lib/db.ts                ← Database connection pool
├── lib/generate-data.ts     ← Data file generation
├── app/api/pages/           ← API endpoints
│   ├── route.ts             ← GET /api/pages (list)
│   └── create/route.ts      ← POST /api/pages/create
└── app/overview/page.tsx    ← Report management UI
```

---

## 11. Troubleshooting

### Data file not loading
```bash
# Check file exists
ls -la /var/www/dashboard/pages/q1.js

# Check permissions
chmod 644 /var/www/dashboard/pages/*.js

# Check Nginx serving correctly
curl http://localhost/pages/q1.js | head -20
```

### Page creation fails
```bash
# Check DB connectivity
psql -U postgres -d chicom_dashboard -c "SELECT COUNT(*) FROM pages;"

# Check API logs
pm2 logs admin | tail -50
```

### No data showing up
```bash
# Verify pooled_posts_all has data
psql -U postgres -d chicom_dashboard -c "SELECT COUNT(*) FROM pooled_posts_all WHERE created_date >= '2026-01-01';"

# Regenerate data file
python backend/generate_data_files.py --slug q1
```

---

## 12. Next Steps

### Future: LLM Insights
When `ANTHROPIC_API_KEY` is set:
1. Page creation triggers `backend/generate_page_insights.py`
2. Claude Haiku generates Q1-Q14 insights
3. Stored in `page_insights.insights` JSONB
4. Loaded into dashboard as `window.INSIGHTS`

### Future: Advanced Filters
Page creation can accept:
```json
{
  "name": "Q1 Sellers Only",
  "timeStart": "2026-01-01",
  "timeEnd": "2026-03-31",
  "filters": {
    "personas": ["Seller (Amazon)"],
    "topics": ["Supply Chain", "Product Sourcing"]
  }
}
```

Query adjusts WHERE clause:
```sql
WHERE created_date >= %s AND created_date <= %s
  AND persona IN ('Seller (Amazon)')
  AND master_topic IN ('Supply Chain', 'Product Sourcing')
```

---

## 12. Summary

✅ One data file per page (`q1.js`, `april.js`, `q1-custom.js`, etc.)  
✅ Dashboard code 100% unchanged  
✅ Pre-computed at page creation time  
✅ Static serving → fast, no DB queries on dashboard load  
✅ Scalable to hundreds of custom reports  

Done! 🚀
