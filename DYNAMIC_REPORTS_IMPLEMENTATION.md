# Dynamic Report Generation System - Implementation Document

## FINAL ARCHITECTURE: Static Files by Page Slug

Keep the existing Vercel dashboard code unchanged. Generate pre-computed data files named after page slugs.

---

## 1. Overview

```
User creates report "Q1 Analysis"
    ↓
Server generates Q1-Q14 aggregates + LLM insights
    ↓
Server writes: /var/www/dashboard/q1-analysis.js
    ↓
User visits /q1-analysis
    ↓
Frontend loads ONLY q1-analysis.js (matching page slug)
    ↓
Dashboard renders with that data
```

---

## 2. Database Schema

### Core Tables

```sql
-- ============================================================================
-- ALL POSTS: Single pool (no duplicates)
-- ============================================================================
CREATE TABLE pooled_posts_all (
  id BIGSERIAL PRIMARY KEY,
  post_id VARCHAR(255) NOT NULL UNIQUE,
  batch_id INTEGER NOT NULL REFERENCES data_batches(id),
  created_date TIMESTAMP,
  content TEXT,
  master_topic VARCHAR(255),
  sub_topic VARCHAR(255),
  persona VARCHAR(100),
  is_relevant BOOLEAN DEFAULT TRUE,
  pooled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_topic (master_topic),
  INDEX idx_persona (persona)
);

-- ============================================================================
-- PAGES: Registry of all pages (predefined + custom)
-- ============================================================================
CREATE TABLE pages (
  id SERIAL PRIMARY KEY,
  page_slug VARCHAR(255) NOT NULL UNIQUE,  -- 'q1', 'april', 'q1-analysis'
  page_name VARCHAR(255) NOT NULL,         -- 'Q1 2026', 'April 2026'
  time_range_start DATE NOT NULL,
  time_range_end DATE NOT NULL,
  filters JSONB,                           -- {topics: [], personas: []}
  page_type VARCHAR(50),                   -- 'predefined' or 'custom'
  total_posts INTEGER,
  relevant_posts INTEGER,
  status VARCHAR(50),                      -- 'ACTIVE', 'ARCHIVED'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255),
  
  INDEX idx_slug (page_slug)
);

-- ============================================================================
-- PAGE INSIGHTS: Stores all Q1-Q14 insights per page
-- ============================================================================
CREATE TABLE page_insights (
  id SERIAL PRIMARY KEY,
  page_id INTEGER NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  page_slug VARCHAR(255) NOT NULL UNIQUE,
  
  -- All insights as JSONB: {"Q1": "text...", "Q2": "text...", ...}
  insights JSONB,
  
  -- Sample post IDs used for generation: {"Q1": [id1, id2], ...}
  sample_post_ids JSONB,
  
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_slug (page_slug)
);

-- ============================================================================
-- NAME TRACKING: Auto-increment for duplicates (Q1 → Q1(1) → Q1(2))
-- ============================================================================
CREATE TABLE report_name_index (
  base_name VARCHAR(255) NOT NULL UNIQUE,
  max_version INTEGER DEFAULT 0,
  last_used TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 3. File Structure

```
/var/www/dashboard/
├── index.html           (unchanged)
├── app.jsx              (unchanged)
├── shell.jsx            (unchanged)
├── q1_q2.jsx            (unchanged)
├── ... (all dashboard files unchanged)
│
└── pages/               ← NEW: Page-specific data files
    ├── q1.js           ← Data for /q1 page
    ├── april.js        ← Data for /april page
    ├── may.js          ← Data for /may page
    └── q1-custom.js    ← Data for /q1-custom page
```

---

## 4. Data File Format

Each `{slug}.js` file contains:

```javascript
// q1.js
window.ChiComData = {
  metadata: {
    name: "Q1 2026",
    month: "Jan-Mar",
    totalPosts: 40255,
    relevantPosts: 40255
  },
  Q1: { "Master Topic 1": 1245, "Master Topic 2": 890, ... },
  Q2: { "Seller (Amazon)": {...}, "Service Provider": {...}, ... },
  Q3: { "Sub Topic 1": 523, "Sub Topic 2": 412, ... },
  // ... Q4-Q14
};

window.ChiComData2 = {
  // Q7-Q14 data
};

window.INSIGHTS = {
  Q1: "In Q1 2026, sellers discussed...",
  Q2: "Across personas, distribution shows...",
  Q3: "Sub-topics analysis reveals...",
  // ... Q4-Q14
};
```

---

## 5. Frontend Loading

**Update `index.html` to load only the required page:**

```html
<script>
  // Extract page slug from URL
  const path = window.location.pathname;
  const pageSlug = path.split('/').filter(Boolean)[0] || 'q1';
  
  // Load ONLY the data file for this page
  const script = document.createElement('script');
  script.src = `/pages/${pageSlug}.js`;
  script.onerror = () => {
    console.error(`Failed to load page: ${pageSlug}`);
    window.location.href = '/q1'; // fallback to Q1
  };
  document.head.appendChild(script);
</script>

<!-- Then load the rest of the dashboard -->
<script src="./shell.jsx"></script>
<script src="./app.jsx"></script>
```

---

## 6. API Endpoints

### Create Report

**POST `/api/pages/create`**

```json
{
  "name": "Q1 Custom Analysis",
  "timeStart": "2026-01-01",
  "timeEnd": "2026-03-31",
  "filters": {"topics": [], "personas": []}
}
```

**Response:**
```json
{
  "status": "success",
  "slug": "q1-custom-analysis",
  "name": "Q1 Custom Analysis",
  "url": "/q1-custom-analysis",
  "message": "Report created and data file generated"
}
```

### List Pages

**GET `/api/pages`**

**Response:**
```json
{
  "pages": [
    {"slug": "q1", "name": "Q1 2026", "type": "predefined"},
    {"slug": "april", "name": "April 2026", "type": "predefined"},
    {"slug": "q1-custom-analysis", "name": "Q1 Custom Analysis", "type": "custom"}
  ]
}
```

---

## 7. Implementation Steps

### Step 1: Generate Data Files

```python
# backend/generate_page_data.py

def generate_page_data(page_slug: str, page_id: int):
    """
    Query aggregates from pooled_posts_all
    Generate LLM insights
    Write {slug}.js file
    """
    
    page = db.get_page(page_slug)
    
    # Query aggregates for Q1-Q14
    aggregates = {}
    for q_num in range(1, 15):
        if q_num == 1:  # Master Topics
            aggregates['Q1'] = query_aggregates(
                f"SELECT master_topic, COUNT(*) FROM pooled_posts_all "
                f"WHERE {page.time_range_filter()} GROUP BY master_topic"
            )
        # ... Q2-Q14 similar
    
    # Get insights from database
    insights_row = db.query(
        'SELECT insights FROM page_insights WHERE page_slug = %s',
        [page_slug]
    )
    insights = json.loads(insights_row['insights'])
    
    # Write JS file
    js_content = f"""
    window.ChiComData = {json.dumps(aggregates['Q1-Q6'])};
    window.ChiComData2 = {json.dumps(aggregates['Q7-Q14'])};
    window.INSIGHTS = {json.dumps(insights)};
    """
    
    with open(f'/var/www/dashboard/pages/{page_slug}.js', 'w') as f:
        f.write(js_content)
    
    print(f"✓ Generated {page_slug}.js")
```

### Step 2: Create API Endpoint

```typescript
// nextjs/app/api/pages/create/route.ts

export async function POST(req: Request) {
  const { name, timeStart, timeEnd, filters } = await req.json()
  
  // Validate unique name (auto-increment if duplicate)
  const { slug, finalName } = await getUniqueSlug(name)
  
  // Create page in DB
  const page = await db.query(
    'INSERT INTO pages (page_slug, page_name, time_range_start, time_range_end, filters, page_type) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
    [slug, finalName, timeStart, timeEnd, JSON.stringify(filters), 'custom']
  )
  
  // Generate insights via LLM
  const insights = await generateInsights(page.id, slug, timeStart, timeEnd)
  
  // Store insights
  await db.query(
    'INSERT INTO page_insights (page_id, page_slug, insights, sample_post_ids) VALUES ($1, $2, $3, $4)',
    [page.id, slug, JSON.stringify(insights), JSON.stringify({})]
  )
  
  // Generate & write JS file
  await generatePageData(slug, page.id)
  
  return Response.json({
    status: 'success',
    slug,
    name: finalName,
    url: `/${slug}`
  })
}
```

### Step 3: Seed Q1 & April Pages

```bash
# Generate predefined pages on startup
python3 backend/seed_pages.py

# Creates:
# - pages table entries for 'q1' and 'april'
# - Generates q1.js and april.js
```

---

## 8. Key Points

✅ **Frontend unchanged** - uses existing dashboard code  
✅ **One file per page** - `q1.js`, `april.js`, `q1-custom.js`  
✅ **Static serving** - no runtime queries, just load JS  
✅ **Pre-computed** - aggregates generated once, reused forever  
✅ **Regeneratable** - can recreate JS if data changes  
✅ **Traceable** - page metadata in DB, raw posts in pool  
✅ **No duplicates** - posts stored once, associated via filters  

---

## 9. Flow: User Creates Custom Report

```
1. User visits /overview
2. Submits form: "Q1 Custom", date range, filters
3. POST /api/pages/create called
4. Server:
   - Creates 'q1-custom' slug (auto-increment if needed)
   - Inserts into pages table
   - Queries pooled_posts_all with time/filters
   - Calls Claude LLM for Q1-Q14 insights
   - Stores insights in page_insights
   - Generates q1-custom.js file
   - Returns slug + URL
5. Frontend redirects to /q1-custom
6. index.html extracts 'q1-custom' from URL
7. Loads ONLY q1-custom.js
8. Dashboard renders with that data
```

---

## 10. Deployment

```bash
# 1. Create tables in PostgreSQL (EC2)
psql -U postgres -d chicom_dashboard < schema.sql

# 2. Seed Q1 & April pages
python3 backend/seed_pages.py

# 3. Deploy Next.js API
npm run build && pm2 start npm --name "admin" -- start

# 4. Nginx already configured to serve /var/www/dashboard
# (index.html loads pages/{slug}.js)
```

