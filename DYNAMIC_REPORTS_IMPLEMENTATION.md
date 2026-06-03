# Dynamic Report Generation System - Implementation Document

## 1. Overview

A system that allows users to generate custom reports by:
- Selecting a time range and data filters
- Running LLM analysis on the selected data
- Creating a new dynamically-routed page with unique naming (auto-increment on duplicates)
- Serving insights via the dashboard

---

## 2. Architecture

### 2.1 High-Level Flow

```
User Input (Name, Date Range, Filters)
    ↓
Validate Unique Name (auto-increment if duplicate)
    ↓
Query PostgreSQL for data in range
    ↓
Sample representative posts
    ↓
Call Claude Haiku LLM for insights (14 Q-answers)
    ↓
Store report metadata + insights in DB
    ↓
Generate data_computed.js for this report
    ↓
Create dynamic route /[report-slug]
    ↓
Serve dashboard with new data
```

### 2.2 Key Components

| Component | Purpose | Tech |
|-----------|---------|------|
| **Report Manager API** | Create, list, update reports | Next.js API route |
| **LLM Service** | Generate insights for data | Claude Haiku 4.5 |
| **Dynamic Router** | Serve /overview and /[slug] pages | Next.js catch-all routes |
| **Database** | Store reports, insights, cached data | PostgreSQL |
| **Data Serializer** | Generate data_computed.js format | Python/Node |

---

## 3. Database Schema

### 3.1 New Tables

```sql
-- ============================================================================
-- CORE: One big pooled data table (all months)
-- ============================================================================
CREATE TABLE pooled_posts_all (
  id BIGSERIAL PRIMARY KEY,
  post_id VARCHAR(255) NOT NULL,
  group_id INTEGER,
  batch_id INTEGER NOT NULL REFERENCES data_batches(id),
  created_date TIMESTAMP,
  content TEXT,
  post_type VARCHAR(50),
  master_topic VARCHAR(255),
  sub_topic VARCHAR(255),
  persona VARCHAR(100),
  is_relevant BOOLEAN DEFAULT TRUE,
  month DATE,  -- First day of month (2026-01-01, 2026-04-01, etc)
  year_month VARCHAR(7),  -- '2026-01', '2026-04' for easy filtering
  ingested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_month (year_month),
  INDEX idx_batch (batch_id),
  INDEX idx_topic (master_topic),
  INDEX idx_relevant (is_relevant)
);

-- ============================================================================
-- INSIGHTS: One record per report page (stores all 14 questions)
-- ============================================================================
CREATE TABLE page_insights (
  id SERIAL PRIMARY KEY,
  page_slug VARCHAR(255) NOT NULL UNIQUE,  -- 'q1', 'april', 'q1-1', etc
  page_name VARCHAR(255) NOT NULL,  -- 'Q1 2026', 'April 2026', etc
  time_range_start DATE NOT NULL,
  time_range_end DATE NOT NULL,
  
  -- All insights as JSONB (Q1-Q14 keys)
  insights JSONB,  -- {
              -- "Q1": "insight text...",
              -- "Q2": "insight text...",
              -- ...
              -- "Q14": "insight text..."
              -- }
  
  -- Sample posts used for generation
  sample_posts JSONB,  -- {
               -- "Q1": [{post data}, {post data}, ...],
               -- "Q2": [{post data}, ...],
               -- ...
               -- }
  
  status VARCHAR(50),  -- 'DRAFT', 'GENERATING', 'PUBLISHED', 'FAILED'
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255),
  
  INDEX idx_slug (page_slug),
  INDEX idx_status (status)
);

-- ============================================================================
-- REPORTS: Track custom report generation jobs
-- ============================================================================
CREATE TABLE generated_reports (
  id SERIAL PRIMARY KEY,
  page_slug VARCHAR(255) NOT NULL REFERENCES page_insights(page_slug),
  report_name VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,  -- User input before auto-increment
  status VARCHAR(50),  -- 'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255),
  
  INDEX idx_status (status),
  INDEX idx_created (created_at DESC)
);

-- ============================================================================
-- NAME TRACKING: Auto-increment for duplicate names
-- ============================================================================
CREATE TABLE report_name_index (
  id SERIAL PRIMARY KEY,
  base_name VARCHAR(255) NOT NULL UNIQUE,
  max_version INTEGER DEFAULT 0,
  last_used TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3.2 Example Data Flow

```
PostgreSQL:

pooled_posts_all (40K Q1 posts + 14K April posts)
├── post_id: "fb_123456"
├── master_topic: "Brand Registry"
├── sub_topic: "Process & Policy"
├── persona: "Seller (Amazon)"
├── year_month: "2026-01"
└── month: 2026-01-01

page_insights (One record per page)
├── page_slug: "q1"
├── page_name: "Q1 2026"
├── time_range_start: 2026-01-01
├── time_range_end: 2026-03-31
├── insights: {
│   "Q1": "In Q1 2026, sellers primarily discussed...",
│   "Q2": "Across 6 personas, the distribution shows...",
│   "Q3": "Sub-topics analysis reveals...",
│   ... (Q1-Q14)
├── sample_posts: {
│   "Q1": [post obj, post obj, ...],
│   "Q2": [post obj, ...],
│   ...
```

---

## 4. API Endpoints

### 4.1 Get Page Data + Insights (PRIMARY)

**Endpoint:** `GET /api/pages/:slug`

**Examples:** `/api/pages/q1`, `/api/pages/april`, `/api/pages/q1-custom`

**Response:**
```json
{
  "page": {
    "slug": "q1",
    "name": "Q1 2026",
    "timeStart": "2026-01-01",
    "timeEnd": "2026-03-31"
  },
  "data": {
    "Q1": {
      "Master Topic 1": 1245,
      "Master Topic 2": 890,
      ...
    },
    "Q2": { ... },
    "Q3": { ... },
    ... (Q1-Q14)
  },
  "insights": {
    "Q1": "In Q1 2026, sellers discussed...",
    "Q2": "Across personas, distribution...",
    ... (Q1-Q14)
  },
  "metadata": {
    "totalPosts": 40255,
    "relevantPosts": 40255,
    "generated": "2026-06-03T10:00:00Z"
  }
}
```

### 4.2 Create New Report (Custom Page)

**Endpoint:** `POST /api/reports/create`

**Request:**
```json
{
  "name": "Q1 Custom Analysis",
  "timeStart": "2026-01-01",
  "timeEnd": "2026-03-31",
  "filters": {
    "topics": ["Brand Registry"],
    "personas": ["Seller (Amazon)"],
    "groups": [1, 2]
  }
}
```

**Response:**
```json
{
  "status": "success",
  "slug": "q1-custom-analysis",
  "name": "Q1 Custom Analysis",
  "status": "PROCESSING",
  "message": "Report generation started. Generating insights...",
  "estimatedTime": 180
}
```

### 4.3 Get Report Status

**Endpoint:** `GET /api/reports/:slug/status`

**Response:**
```json
{
  "slug": "q1-custom-analysis",
  "status": "PROCESSING",
  "progress": 45,
  "currentQuestion": 6,
  "message": "Generating insight for Q6..."
}
```

### 4.4 List All Pages/Reports

**Endpoint:** `GET /api/pages`

**Response:**
```json
{
  "pages": [
    {
      "slug": "q1",
      "name": "Q1 2026",
      "type": "predefined",
      "created": "2026-01-01T00:00:00Z"
    },
    {
      "slug": "april",
      "name": "April 2026",
      "type": "predefined",
      "created": "2026-04-01T00:00:00Z"
    },
    {
      "slug": "q1-custom-analysis",
      "name": "Q1 Custom Analysis",
      "type": "custom",
      "created": "2026-06-03T14:00:00Z"
    }
  ]
}
```

---

## 5. Name Uniqueness & Auto-Increment

### 5.1 Algorithm

```typescript
async function getUniqueSlug(baseName: string): Promise<{slug: string, finalName: string}> {
  // Convert to URL-safe slug: "Q1 Analysis" → "q1-analysis"
  const baseSlug = slugify(baseName)
  
  // Check if exists
  const existing = await db.query(
    'SELECT COUNT(*) FROM generated_reports WHERE slug = $1',
    [baseSlug]
  )
  
  if (existing.count === 0) {
    return { slug: baseSlug, finalName: baseName }
  }
  
  // Find next available version
  const versions = await db.query(
    'SELECT slug FROM generated_reports WHERE slug LIKE $1 ORDER BY slug DESC',
    [`${baseSlug}%`]
  )
  
  let nextVersion = 1
  for (const v of versions) {
    const match = v.slug.match(/-(\d+)$/)
    if (match) {
      nextVersion = Math.max(nextVersion, parseInt(match[1]) + 1)
    }
  }
  
  const finalSlug = `${baseSlug}-${nextVersion}`
  const finalName = `${baseName}(${nextVersion})`
  
  return { slug: finalSlug, finalName }
}
```

### 5.2 Example Scenarios

| User Input | Slug | Display Name | Notes |
|-----------|------|--------------|-------|
| "Q1 Analysis" | `q1-analysis` | Q1 Analysis | First time |
| "Q1 Analysis" (again) | `q1-analysis-1` | Q1 Analysis(1) | Auto-increment |
| "Q1 Analysis" (3rd time) | `q1-analysis-2` | Q1 Analysis(2) | Continues |

---

## 6. LLM Integration

### 6.1 Insight Generation Service

**File:** `backend/generate_insights.py`

```python
def generate_report_insights(report_id: int, data: dict):
    """
    Args:
        report_id: ID of the generated_reports record
        data: {
            'posts': [list of post objects],
            'month': 'Q1 2026',
            'filters': {...}
        }
    """
    
    # For each of 14 questions
    for q_num in range(1, 15):
        # Sample up to 8 representative posts
        samples = sample_posts_for_question(data['posts'], q_num)
        
        # Build prompt
        prompt = f"""
        Analyze the following {len(samples)} representative posts from {data['month']} 
        and answer Question {q_num}: {QUESTIONS[q_num]}
        
        Posts:
        {format_posts(samples)}
        
        Aggregated Data:
        - Total posts: {len(data['posts'])}
        - Topics: {data['topics']}
        - Personas: {data['personas']}
        
        Provide a 3-5 sentence Vietnamese analyst paragraph.
        """
        
        # Call Claude
        response = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=200,
            messages=[{"role": "user", "content": prompt}]
        )
        
        insight = response.content[0].text
        
        # Store in DB
        db.insert('report_insights', {
            'report_id': report_id,
            'question_number': q_num,
            'insight_text': insight,
            'sample_posts': samples
        })
```

### 6.2 Caching

- Cache insights by content hash (avoid duplicate API calls)
- Store in `.report_insight_cache.json`
- Format: `{hash: {Q1: "...", Q2: "...", ...}}`

---

## 7. Data Loading (Dynamic from PostgreSQL)

### 7.1 Page Data Aggregation

**File:** `backend/compute_page_data.py`

```python
def get_page_data(page_slug: str):
    """
    Query PostgreSQL to aggregate data for a page
    Returns Q1-Q14 aggregates + metadata
    """
    
    page = db.get_page_insights(page_slug)
    
    if not page:
        raise NotFoundError(f"Page {page_slug} not found")
    
    # Query aggregates from pooled_posts_all
    data = {}
    for q_num in range(1, 15):
        if q_num in [1, 2]:  # Master topics
            cur.execute("""
                SELECT master_topic, COUNT(*) as count
                FROM pooled_posts_all
                WHERE year_month BETWEEN %s AND %s
                  AND is_relevant = TRUE
                GROUP BY master_topic
                ORDER BY count DESC
            """, (page.time_range_start.strftime('%Y-%m'),
                  page.time_range_end.strftime('%Y-%m')))
            
            data[f'Q{q_num}'] = dict(cur.fetchall())
        
        elif q_num == 3:  # Sub-topics
            cur.execute("""
                SELECT sub_topic, COUNT(*) as count
                FROM pooled_posts_all
                WHERE year_month BETWEEN %s AND %s
                  AND is_relevant = TRUE
                GROUP BY sub_topic
                ORDER BY count DESC
            """, (...))
            
            data['Q3'] = dict(cur.fetchall())
        
        # ... etc for Q4-Q14
    
    # Load pre-generated insights from DB
    insights = json.loads(page.insights)
    
    return {
        "data": data,
        "insights": insights,
        "metadata": {
            "totalPosts": page.total_posts,
            "relevantPosts": page.relevant_posts,
            "generated": page.generated_at
        }
    }
```

### 7.2 No Static Files

- **No `data_computed.js` generation**
- **All data loaded on-demand** via `/api/pages/:slug`
- **Insights stored in `page_insights.insights` JSONB column**
- **Real-time aggregation** from `pooled_posts_all` table

---

## 8. Frontend Routes

### 8.1 Pages

| Route | Purpose | Component |
|-------|---------|-----------|
| `/overview` | List & create reports | ReportOverview.jsx |
| `/[slug]` | Dynamic report dashboard | ReportDashboard.jsx |
| `/[slug]/edit` | Edit report (future) | ReportEditor.jsx |

### 8.2 /overview Page

**Features:**
- List all generated reports (with status, created date)
- "Create New Report" button → modal with form
- Report name input + date range picker + filters
- "Generate Report" button
- Real-time progress indicator (polling /api/reports/:id)

**Code Structure:**
```tsx
// dashboard/pages/overview.jsx
export default function OverviewPage() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  
  useEffect(() => {
    // Fetch reports list
    fetch('/api/reports')
      .then(r => r.json())
      .then(data => setReports(data.reports))
  }, [])
  
  const handleCreateReport = async (formData) => {
    setLoading(true)
    const res = await fetch('/api/reports/generate', {
      method: 'POST',
      body: JSON.stringify(formData)
    })
    const data = await res.json()
    setReports([...reports, data])
    setShowCreateModal(false)
    setLoading(false)
  }
  
  return (
    <div>
      <h1>Report Generator</h1>
      <button onClick={() => setShowCreateModal(true)}>
        + Create New Report
      </button>
      
      <ReportList reports={reports} />
      
      {showCreateModal && (
        <CreateReportModal 
          onSubmit={handleCreateReport}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  )
}
```

### 8.3 /[slug] Page (Dynamic Report)

**Features:**
- Fetches data + insights from `/api/pages/:slug` on load
- Renders dashboard with Q1-Q14 sections
- Shows LLM insights alongside charts
- Identical UI to original dashboard
- Real-time data (no static files)

**Code Structure:**
```tsx
// dashboard/pages/[slug].jsx
'use client'

import { useEffect, useState } from 'react'

export default function ReportPage({ slug }) {
  const [data, setData] = useState(null)
  const [insights, setInsights] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  useEffect(() => {
    // Fetch from API on component mount
    fetch(`/api/pages/${slug}`)
      .then(r => {
        if (!r.ok) throw new Error(`Page ${slug} not found`)
        return r.json()
      })
      .then(response => {
        setData(response.data)
        setInsights(response.insights)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [slug])
  
  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>
  
  return (
    <div>
      {/* Use existing dashboard JSX components */}
      {/* Pass data + insights to each Q section */}
      <Section Q="1" data={data.Q1} insight={insights.Q1} />
      <Section Q="2" data={data.Q2} insight={insights.Q2} />
      <Section Q="3" data={data.Q3} insight={insights.Q3} />
      ... (Q4-Q14)
    </div>
  )
}

// Generate static paths for predefined pages (Q1, April, etc)
export async function generateStaticParams() {
  return [
    { slug: 'q1' },
    { slug: 'april' },
    { slug: 'may' },
    // ... add more as needed
  ]
}
```

---

## 9. Processing Pipeline

### 9.1 Background Job (using PM2 or Bull Queue)

**File:** `backend/report_processor.py`

```python
def process_report(report_id: int):
    """Background worker that processes a report end-to-end"""
    
    report = db.get_report(report_id)
    
    # Update status
    db.update_report(report_id, {'status': 'PROCESSING'})
    
    try:
        # 1. Query data from PostgreSQL
        posts = db.query_posts(
            date_range=(report.time_range_start, report.time_range_end),
            filters=report.filters
        )
        report.total_posts = len(posts)
        report.relevant_posts = len([p for p in posts if p['is_relevant']])
        db.update_report(report_id, report)
        
        # 2. Generate insights via LLM
        generate_report_insights(report_id, {
            'posts': posts,
            'month': report.report_name,
            'filters': report.filters
        })
        
        # 3. Serialize to data_computed.js
        js_output = serialize_report_to_js(report_id)
        write_report_data_file(report.slug, js_output)
        
        # 4. Mark as complete
        db.update_report(report_id, {
            'status': 'COMPLETED',
            'updated_at': datetime.now()
        })
        
    except Exception as e:
        db.update_report(report_id, {
            'status': 'FAILED',
            'error': str(e)
        })
        raise
```

---

## 10. Error Handling

### 10.1 Validation

```typescript
// Before creating report
validateReportRequest({
  name,
  timeStart,
  timeEnd,
  filters
}) {
  if (!name || name.trim().length === 0) {
    throw new Error("Report name is required")
  }
  if (name.length > 255) {
    throw new Error("Report name too long (max 255 chars)")
  }
  if (!isValidDate(timeStart) || !isValidDate(timeEnd)) {
    throw new Error("Invalid date format")
  }
  if (new Date(timeStart) >= new Date(timeEnd)) {
    throw new Error("Start date must be before end date")
  }
  if ((new Date(timeEnd) - new Date(timeStart)) > 365 * 24 * 60 * 60 * 1000) {
    throw new Error("Date range cannot exceed 1 year")
  }
  
  return true
}
```

### 10.2 LLM Failure Handling

```python
# If LLM call fails
def generate_insights_with_fallback(report_id, data):
    try:
        return generate_report_insights(report_id, data)
    except APIError as e:
        # Use manual templates instead
        insights = load_insights_manual(data)
        for q_num, text in insights.items():
            db.insert('report_insights', {
                'report_id': report_id,
                'question_number': q_num,
                'insight_text': text,
                'fallback': True
            })
        return insights
```

---

## 11. File Structure

```
dashboard/
├── pages/
│   ├── overview.jsx          # Report list & creator
│   ├── [slug].jsx            # Dynamic report page
│   ├── [slug]/
│   │   └── edit.jsx          # Future: edit report
│   └── api/
│       └── reports/
│           ├── generate.ts   # POST to create
│           ├── [id].ts       # GET/DELETE report
│           └── list.ts       # GET all reports
├── components/
│   ├── ReportOverview.jsx
│   ├── ReportDashboard.jsx
│   ├── CreateReportModal.jsx
│   ├── ReportList.jsx
│   └── ReportProgress.jsx    # Real-time status
├── reports/
│   └── [slug]/
│       └── data_computed.js  # Generated dynamically

backend/
├── generate_insights.py      # LLM calls
├── serialize_report.py       # JS output generation
├── report_processor.py       # Background worker
└── schema_additions.sql      # New tables
```

---

## 12. Implementation Timeline

| Phase | Tasks | Duration |
|-------|-------|----------|
| **1. Backend** | DB schema, API endpoints, LLM integration | 2-3 days |
| **2. Processing** | Background job setup, serializer | 1-2 days |
| **3. Frontend** | /overview page, dynamic [slug] routing | 2-3 days |
| **4. Testing** | E2E tests, error scenarios | 1-2 days |
| **5. Deploy** | Push to EC2, migrate data | 1 day |

---

## 13. Key Decisions

| Decision | Rationale |
|----------|-----------|
| **Auto-increment naming** | Prevents accidental overwrites; user-friendly display |
| **Background processing** | LLM calls take 30-60s; don't block user |
| **ISR in Next.js** | Revalidate reports hourly; balance freshness vs perf |
| **Slug-based URLs** | Human-readable, SEO-friendly |
| **Cache LLM responses** | Reduce API costs; re-generate on data change |
| **PostgreSQL for everything** | Single source of truth; easier backups |

---

## 14. Future Enhancements

- [ ] Report templates (pre-configured filters)
- [ ] Report sharing (public/private)
- [ ] Edit existing reports
- [ ] Scheduled report regeneration
- [ ] Export to PDF/PPT
- [ ] Multi-language insights
- [ ] Real-time collaboration on reports

