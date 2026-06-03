# Quick Reference Guide

Fast answers to common tasks.

---

## Deployment

**Start fresh:**
```bash
# 1. Create tables
psql -U postgres -d chicom_dashboard < nextjs/schema.sql

# 2. Load CSV data
python backend/load_to_pooled.py

# 3. Seed Q1 & April pages
python backend/seed_pages.py

# 4. Generate data files
python backend/generate_data_files.py

# 5. Deploy Next.js
cd nextjs && npm install && npm run build
pm2 start npm --name admin -- start

# 6. Verify dashboard
curl http://localhost/q1
```

---

## Common Tasks

### Add Q1 & April Data
```bash
python backend/load_to_pooled.py
python backend/seed_pages.py
python backend/generate_data_files.py
```

### Create New Report
```bash
# Via API
curl -X POST http://localhost:3000/api/pages/create \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Custom Q1",
    "timeStart": "2026-01-01",
    "timeEnd": "2026-03-31"
  }'

# Or via web UI
# Visit http://localhost/overview
```

### Regenerate a Page's Data
```bash
python backend/generate_data_files.py --slug q1
```

### Regenerate All Pages
```bash
python backend/generate_data_files.py
```

### Check Database Status
```bash
# Post counts
psql -d chicom_dashboard -c "
  SELECT COUNT(*) as total, 
         COUNT(CASE WHEN is_relevant THEN 1 END) as relevant 
  FROM pooled_posts_all;"

# Pages
psql -d chicom_dashboard -c "
  SELECT page_slug, page_name, total_posts FROM pages;"

# Insights
psql -d chicom_dashboard -c "
  SELECT page_slug, keys(insights) FROM page_insights;"
```

### Check Data Files
```bash
# List all
ls -la /var/www/dashboard/pages/

# Check specific file
wc -l /var/www/dashboard/pages/q1.js
file /var/www/dashboard/pages/q1.js
head -10 /var/www/dashboard/pages/q1.js

# Verify content
grep -c "window.ChiComData" /var/www/dashboard/pages/q1.js
# Should return 1
```

### Debug Dashboard Loading
```bash
# In browser console
console.log(window.ChiComData)
console.log(window.INSIGHTS)

# Or via curl
curl http://localhost/q1 2>&1 | grep "pageSlug ="
curl http://localhost/pages/q1.js | head -5
```

### Restart Services
```bash
# Next.js admin app
pm2 restart admin

# Nginx
sudo systemctl restart nginx

# PostgreSQL
sudo systemctl restart postgresql

# All
pm2 restart admin && sudo systemctl restart nginx && sudo systemctl restart postgresql
```

### View Logs
```bash
# Next.js
pm2 logs admin

# Nginx access
sudo tail -50 /var/log/nginx/access.log

# Nginx error
sudo tail -50 /var/log/nginx/error.log

# PostgreSQL (if configured)
sudo journalctl -u postgresql -n 50
```

---

## Troubleshooting

### Dashboard shows no data
1. Check data file exists:
   ```bash
   ls -la /var/www/dashboard/pages/q1.js
   ```
2. Check file has content:
   ```bash
   wc -l /var/www/dashboard/pages/q1.js
   # Should be 50+ lines
   ```
3. Check database has posts:
   ```bash
   psql -d chicom_dashboard -c "SELECT COUNT(*) FROM pooled_posts_all;"
   ```

### API returns error 500
1. Check Next.js logs:
   ```bash
   pm2 logs admin | tail -20
   ```
2. Check DB connection:
   ```bash
   psql -h localhost -U postgres -d chicom_dashboard -c "SELECT 1;"
   ```
3. Restart app:
   ```bash
   pm2 restart admin
   ```

### Data file not created
1. Check permissions:
   ```bash
   ls -la /var/www/dashboard/pages/
   sudo chmod 755 /var/www/dashboard/pages
   ```
2. Check Python dependencies:
   ```bash
   pip list | grep psycopg2
   # Install if missing: pip install psycopg2-binary
   ```
3. Run script manually with output:
   ```bash
   python backend/generate_data_files.py --slug q1 -v
   ```

### Duplicate page names
Handled automatically with numbering:
```
"Q1" → slug "q1"
"Q1" (again) → slug "q1(1)" → name "Q1(1)"
"Q1" (3rd) → slug "q1(2)" → name "Q1(2)"
```

### Delete a page
```bash
# Via SQL (careful!)
DELETE FROM pages WHERE page_slug = 'q1-old';
DELETE FROM page_insights WHERE page_slug = 'q1-old';
rm /var/www/dashboard/pages/q1-old.js
```

---

## File Locations

**Dashboard (static):**
```
/var/www/dashboard/
├── index.html              ← Main entry point
├── *.jsx                   ← Components
├── *.css                   ← Styles
└── pages/
    ├── q1.js               ← Generated data
    ├── april.js            ← Generated data
    └── q1-custom.js        ← Generated data
```

**Admin (Next.js):**
```
~/admin/nextjs/
├── app/
│   ├── api/pages/          ← API endpoints
│   ├── overview/           ← Report management
│   └── layout.tsx
├── lib/
│   ├── db.ts              ← Database pool
│   └── generate-data.ts   ← Data generation
└── package.json
```

**Backend (Python):**
```
~/admin/backend/
├── load_to_pooled.py              ← Load CSV data
├── seed_pages.py                  ← Create Q1 & April
├── generate_data_files.py         ← Create JS files
└── generate_page_insights.py      ← LLM insights
```

**CSV Data (source):**
```
~/AGS dashboard/output/filtered/
├── Q1_2026_classified_combined_cleaned.csv
└── Apr_2026_classified_combined_cleaned.csv
```

---

## Environment Variables

**Next.js (.env):**
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=chicom_dashboard
DB_USER=postgres
DB_PASSWORD=chicom2024
ANTHROPIC_API_KEY=sk-ant-xxx  # Optional for LLM insights
```

**Python (auto-read from .env or env vars):**
```
DB_HOST
DB_PORT
DB_NAME
DB_USER
DB_PASSWORD
ANTHROPIC_API_KEY
DASHBOARD_DIR  # Default: /var/www/dashboard/pages
```

---

## API Quick Reference

### GET /api/pages
List all pages.
```bash
curl http://localhost:3000/api/pages
```
Response:
```json
{
  "status": "success",
  "pages": [
    {
      "slug": "q1",
      "name": "Q1 2026",
      "type": "predefined",
      "totalPosts": 40255,
      "relevantPosts": 40255
    }
  ]
}
```

### POST /api/pages/create
Create new page.
```bash
curl -X POST http://localhost:3000/api/pages/create \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Q1 Analysis",
    "timeStart": "2026-01-01",
    "timeEnd": "2026-03-31",
    "filters": {}
  }'
```
Response:
```json
{
  "status": "success",
  "slug": "q1-analysis",
  "name": "Q1 Analysis",
  "url": "/q1-analysis"
}
```

---

## Useful Commands

```bash
# SSH into EC2
ssh -i ~/boost.pem ubuntu@ec2-18-141-25-84.ap-southeast-1.compute.amazonaws.com

# Check disk space
df -h
# Check specific directory
du -sh /var/www/dashboard/pages/

# Monitor Next.js
pm2 monit

# Kill a port (if stuck)
sudo lsof -i :3000
sudo kill -9 <pid>

# Test API response time
time curl http://localhost:3000/api/pages

# Generate 100 test pages
for i in {1..100}; do
  curl -X POST http://localhost:3000/api/pages/create \
    -H "Content-Type: application/json" \
    -d "{
      \"name\": \"Test $i\",
      \"timeStart\": \"2026-01-01\",
      \"timeEnd\": \"2026-03-31\"
    }"
  echo "Created Test $i"
done
```

---

## Monitoring

**Real-time PM2 dashboard:**
```bash
pm2 monit
```

**Database growth:**
```bash
psql -d chicom_dashboard << 'SQL'
SELECT 
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname='public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
SQL
```

**Pages directory size:**
```bash
du -sh /var/www/dashboard/pages/
```

---

## Performance Tips

1. **Cache data files in Nginx:**
   ```nginx
   location /pages/ {
     expires 30d;
     add_header Cache-Control "public, immutable";
   }
   ```

2. **Gzip JS files:**
   ```bash
   gzip -9 /var/www/dashboard/pages/*.js
   ```

3. **Monitor database:**
   ```bash
   # Slow query log
   psql -d chicom_dashboard -c "ALTER SYSTEM SET log_min_duration_statement = 1000;"
   sudo systemctl restart postgresql
   ```

4. **Backup data regularly:**
   ```bash
   pg_dump -d chicom_dashboard > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

---

## Useful Links

- **Next.js Docs:** https://nextjs.org/docs
- **PostgreSQL Docs:** https://www.postgresql.org/docs
- **PM2 Docs:** https://pm2.keymetrics.io/docs
- **Nginx Docs:** https://nginx.org/en/docs
- **Claude API:** https://docs.anthropic.com

---

**Last Updated:** 2026-06-03  
**Version:** 1.0 - Initial Release
