# Deployment Checklist: Static Pages System

Complete this checklist to deploy the dynamic report system on EC2.

---

## Phase 1: Database Setup

- [ ] **SSH into EC2**
  ```bash
  ssh -i ~/Downloads/boost.pem ubuntu@ec2-18-141-25-84.ap-southeast-1.compute.amazonaws.com
  ```

- [ ] **Verify PostgreSQL is running**
  ```bash
  sudo systemctl status postgresql
  # If not running:
  sudo systemctl start postgresql
  ```

- [ ] **Create database (if not exists)**
  ```bash
  sudo -u postgres psql -c "CREATE DATABASE chicom_dashboard;"
  ```

- [ ] **Create schema tables**
  ```bash
  sudo -u postgres psql -d chicom_dashboard < /home/ubuntu/admin/nextjs/schema.sql
  ```

  Verify:
  ```bash
  sudo -u postgres psql -d chicom_dashboard -c "\dt"
  # Should show: data_batches, pooled_posts_all, pages, page_insights, report_name_index
  ```

---

## Phase 2: Load Data into Pooled Table

- [ ] **Ensure CSV files exist**
  ```bash
  ls -la ~/AGS\ dashboard/output/filtered/
  # Should show:
  # - Q1_2026_classified_combined_cleaned.csv
  # - Apr_2026_classified_combined_cleaned.csv
  ```

- [ ] **Load CSV data into pooled_posts_all**
  ```bash
  cd ~/admin/backend
  python load_to_pooled.py
  ```

  Expected output:
  ```
  ✓ Loaded 2 files successfully
  ```

- [ ] **Verify data loaded**
  ```bash
  sudo -u postgres psql -d chicom_dashboard -c "
    SELECT COUNT(*), COUNT(CASE WHEN is_relevant THEN 1 END) 
    FROM pooled_posts_all;"
  # Should show: ~54K total, ~40K relevant
  ```

---

## Phase 3: Seed Predefined Pages

- [ ] **Create Q1 and April page entries**
  ```bash
  cd ~/admin/backend
  python seed_pages.py
  ```

  Expected output:
  ```
  ✓ Created page 'q1' (ID: 1, Posts: 40255/40255)
  ✓ Created page 'april' (ID: 2, Posts: 14381/14381)
  ```

- [ ] **Verify pages created**
  ```bash
  sudo -u postgres psql -d chicom_dashboard -c "
    SELECT page_slug, page_name, total_posts FROM pages;"
  ```

---

## Phase 4: Generate Initial Data Files

- [ ] **Install Python dependencies**
  ```bash
  cd ~/admin
  pip install psycopg2-binary
  ```

- [ ] **Generate data files for all pages**
  ```bash
  cd ~/admin/backend
  python generate_data_files.py
  ```

  Expected output:
  ```
  ✓ Generated /var/www/dashboard/pages/q1.js
  ✓ Generated /var/www/dashboard/pages/april.js
  ✓ Generated 2/2 data files
  ```

- [ ] **Verify files exist and have content**
  ```bash
  ls -lah /var/www/dashboard/pages/
  wc -l /var/www/dashboard/pages/q1.js
  # Should be 100+ lines
  ```

- [ ] **Check file format**
  ```bash
  head -5 /var/www/dashboard/pages/q1.js
  # Should start with: // Generated data file...
  tail -5 /var/www/dashboard/pages/q1.js
  # Should end with: window.INSIGHTS = {...}
  ```

---

## Phase 5: Update Dashboard

- [ ] **Update dashboard index.html**
  ```bash
  # Copy updated index.html to EC2
  scp -i ~/Downloads/boost.pem ~/Downloads/AGS\ dashboard/dashboard/index.html \
    ubuntu@ec2-18-141-25-84.ap-southeast-1.compute.amazonaws.com:/var/www/dashboard/
  ```

  Or manually edit:
  ```bash
  sudo nano /var/www/dashboard/index.html
  
  # Replace the <script src="data_computed.js"> section with:
  # <script>
  #   const path = window.location.pathname;
  #   const pageSlug = path.split('/').filter(Boolean)[0] || 'q1';
  #   
  #   const script = document.createElement('script');
  #   script.src = `/pages/${pageSlug}.js`;
  #   script.onerror = () => {
  #     console.error(`Failed to load page: ${pageSlug}`);
  #     window.ChiComData = {};
  #     window.ChiComData2 = {};
  #     window.INSIGHTS = {};
  #   };
  #   document.head.appendChild(script);
  # </script>
  ```

- [ ] **Verify Nginx can serve pages directory**
  ```bash
  curl http://localhost/pages/q1.js | head -5
  # Should return JS content starting with "// Generated data file"
  ```

---

## Phase 6: Deploy Next.js Admin App

- [ ] **Create .env file for Next.js**
  ```bash
  cd ~/admin/nextjs
  cat > .env << 'EOF'
DB_HOST=localhost
DB_PORT=5432
DB_NAME=chicom_dashboard
DB_USER=postgres
DB_PASSWORD=chicom2024
EOF
  ```

- [ ] **Install dependencies**
  ```bash
  cd ~/admin/nextjs
  npm install
  ```

- [ ] **Build Next.js app**
  ```bash
  cd ~/admin/nextjs
  npm run build
  ```

- [ ] **Stop old Next.js instance (if any)**
  ```bash
  pm2 delete admin 2>/dev/null || true
  ```

- [ ] **Start with PM2**
  ```bash
  cd ~/admin/nextjs
  pm2 start npm --name "admin" -- start
  pm2 save
  ```

- [ ] **Verify running**
  ```bash
  pm2 status
  # Should show: admin | npm start | online
  
  pm2 logs admin | tail -20
  # Should show: ready - started server on 0.0.0.0:3000
  ```

---

## Phase 7: Test Admin API

- [ ] **Test list pages endpoint**
  ```bash
  curl http://localhost:3000/api/pages
  # Should return: { "status": "success", "pages": [...] }
  ```

- [ ] **Test create page endpoint (dry run)**
  ```bash
  curl -X POST http://localhost:3000/api/pages/create \
    -H "Content-Type: application/json" \
    -d '{
      "name": "Test Report",
      "timeStart": "2026-01-15",
      "timeEnd": "2026-02-15"
    }'
  # Should return: { "status": "success", "slug": "test-report", ... }
  ```

- [ ] **Verify data file was created**
  ```bash
  ls -la /var/www/dashboard/pages/test-report.js
  # Should exist and have content
  ```

---

## Phase 8: Test Dashboard Loading

- [ ] **Test Q1 dashboard**
  ```bash
  curl http://localhost/q1 | head -30
  # Should return HTML that includes:
  # <script>
  #   const pageSlug = 'q1';
  #   ...
  # </script>
  ```

- [ ] **Open in browser**
  - Visit: `http://<ec2-ip>/q1`
  - Should load dashboard
  - Browser console should show: `✓ Loaded data for page: q1`
  - Charts should render with Q1 data

- [ ] **Test April dashboard**
  - Visit: `http://<ec2-ip>/april`
  - Should load dashboard with April data

- [ ] **Test custom report redirect**
  - Visit: `http://<ec2-ip>/overview`
  - Create new report: "Test Analysis", dates 2026-01-15 to 2026-02-15
  - Should redirect to new page
  - URL should be: `/test-analysis`
  - Should show that data

---

## Phase 9: Verify Logging & Monitoring

- [ ] **Check Next.js logs**
  ```bash
  pm2 logs admin | tail -50
  # Should show request logs, no errors
  ```

- [ ] **Check Nginx logs**
  ```bash
  sudo tail -50 /var/log/nginx/access.log
  # Should show requests to /api/pages, /pages/*.js
  ```

- [ ] **Monitor dashboard directory**
  ```bash
  ls -la /var/www/dashboard/pages/ | wc -l
  # Should increase as you create more reports
  ```

---

## Phase 10: Cleanup & Documentation

- [ ] **Remove test data (optional)**
  ```bash
  sudo -u postgres psql -d chicom_dashboard << 'SQL'
  DELETE FROM pages WHERE page_slug = 'test-report';
  DELETE FROM page_insights WHERE page_slug = 'test-report';
  SQL
  
  rm -f /var/www/dashboard/pages/test-report.js
  ```

- [ ] **Create backup of working state**
  ```bash
  sudo -u postgres pg_dump -d chicom_dashboard > ~/chicom_backup_$(date +%Y%m%d).sql
  ```

- [ ] **Document access points**
  ```
  Admin Panel: http://<ec2-ip>/admin
  Overview/Create Reports: http://<ec2-ip>/overview
  Q1 Dashboard: http://<ec2-ip>/q1
  April Dashboard: http://<ec2-ip>/april
  API - List Pages: http://<ec2-ip>:3000/api/pages
  API - Create Page: POST http://<ec2-ip>:3000/api/pages/create
  ```

---

## Troubleshooting

### Data files not loading
```bash
# Check file permissions
sudo chmod 644 /var/www/dashboard/pages/*.js

# Check Nginx config can serve them
curl -v http://localhost/pages/q1.js 2>&1 | grep -i "content-length\|200 OK"

# Check file content
file /var/www/dashboard/pages/q1.js
# Should say: JavaScript source code
```

### Database connection error
```bash
# Test connection
psql -h localhost -U postgres -d chicom_dashboard -c "SELECT COUNT(*) FROM pages;"

# Check env vars in PM2
pm2 env admin | grep DB_

# Restart Next.js
pm2 restart admin
```

### Dashboard shows no data
```bash
# Check browser console for errors
# Open DevTools → Console → Look for errors

# Check data file is loading
curl http://localhost/pages/q1.js | wc -l
# Should be 50+ lines

# Check window variables are set
curl http://localhost/pages/q1.js | grep -c "window.ChiComData"
# Should return 1
```

### Create report fails
```bash
# Check Next.js logs
pm2 logs admin | grep -i error | tail -20

# Test API directly
curl -X POST http://localhost:3000/api/pages/create \
  -H "Content-Type: application/json" \
  -d '{"name":"Debug","timeStart":"2026-01-01","timeEnd":"2026-03-31"}' \
  -v

# Check database has the page
sudo -u postgres psql -d chicom_dashboard -c "SELECT * FROM pages ORDER BY id DESC LIMIT 1;"
```

---

## Success Indicators

✅ All tables created in PostgreSQL  
✅ 54K posts loaded in pooled_posts_all  
✅ Q1 and April pages created in `pages` table  
✅ q1.js and april.js files exist in /var/www/dashboard/pages/  
✅ Next.js admin app running on port 3000  
✅ Dashboard loads and displays Q1 data  
✅ Dashboard loads and displays April data  
✅ Can create custom reports via /overview  
✅ Custom report pages load with correct data  
✅ API endpoints working  

---

## Next Steps

1. **Enable LLM Insights** (optional)
   - Set `ANTHROPIC_API_KEY` in .env
   - Update `backend/generate_page_insights.py` to call Claude
   - Insights will be auto-generated on page creation

2. **Add Advanced Filters** (future)
   - Update page creation form to accept persona/topic filters
   - Modify SQL queries to apply WHERE filters
   - Generate filtered aggregates

3. **Monitor & Scale**
   - Set up PM2 log rotation
   - Configure Nginx caching for /pages/*.js
   - Monitor disk space for growing pages directory

---

Done! 🚀 The system is ready for production use.
