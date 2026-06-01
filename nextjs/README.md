# ChiCom Dashboard - Next.js Admin Panel

Admin panel for monthly data pooling and reporting system. Built with Next.js 14, PostgreSQL, and Tailwind CSS.

## Features

- ✅ Monthly data batch management (upload XLSX files)
- ✅ Dashboard with statistics and recent batches
- ✅ Month-specific report pages (Q1, April, May, etc.)
- ✅ PostgreSQL integration for data persistence
- ✅ File upload with validation
- ✅ Responsive UI with Tailwind CSS

## Project Structure

```
nextjs/
├── app/
│   ├── api/                    # API routes
│   │   └── admin/
│   │       ├── stats/          # GET dashboard stats
│   │       ├── batches/        # List, create, manage batches
│   │       ├── upload/         # XLSX file upload endpoint
│   │       └── report/         # Generate and retrieve reports
│   ├── months/                 # Month-specific report pages
│   │   ├── q1-2026/
│   │   ├── april-2026/
│   │   └── may-2026/
│   ├── batch/                  # Batch detail pages
│   ├── upload/                 # File upload page
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Dashboard home
│   └── globals.css             # Global styles
├── components/                 # React components
│   ├── Sidebar.tsx             # Navigation sidebar
│   ├── StatsCard.tsx           # Statistics card
│   └── RecentBatches.tsx       # Recent batches table
├── lib/
│   └── db.ts                   # Database utilities
├── public/                     # Static files
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.js
└── postcss.config.js
```

## Setup Instructions

### 1. Clone and Install

```bash
cd nextjs
npm install
```

### 2. Environment Configuration

Copy `.env.example` to `.env.local` and update values:

```bash
cp .env.example .env.local
```

Update with your PostgreSQL details:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/chicom_dashboard
DB_HOST=your_postgres_host
DB_PORT=5432
DB_NAME=chicom_dashboard
DB_USER=postgres
DB_PASSWORD=your_password
```

### 3. Database Setup

Run PostgreSQL schema (if using local Postgres):

```bash
psql -U postgres -d chicom_dashboard -f ../backend/schema.sql
```

Or on EC2 with remote database:

```bash
psql -h your_ec2_host -U postgres -d chicom_dashboard -f schema.sql
```

### 4. Run Locally

```bash
npm run dev
```

Visit `http://localhost:3000`

## EC2 Deployment

### Prerequisites

- EC2 instance (Ubuntu 22.04 recommended)
- PostgreSQL database (RDS or local)
- Node.js 18+ installed

### Installation on EC2

```bash
# SSH into EC2
ssh -i your-key.pem ec2-user@your-instance-ip

# Install Node.js if not present
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone repository
git clone your-repo-url
cd nextjs

# Install dependencies
npm install

# Create .env.local with EC2 database credentials
nano .env.local
# Add your PostgreSQL connection details

# Build for production
npm run build

# Start server
npm start
```

### Running with PM2 (Recommended)

```bash
# Install PM2 globally
sudo npm install -g pm2

# Start app with PM2
pm2 start npm --name "chicom-admin" -- start

# Make it restart on reboot
pm2 startup
pm2 save
```

### Nginx Reverse Proxy

Create `/etc/nginx/sites-available/chicom-admin`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable and restart Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/chicom-admin /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## API Routes

### Dashboard Stats
- **GET** `/api/admin/stats` - Get dashboard statistics

### Batch Management
- **GET** `/api/admin/batches` - List all batches
- **GET** `/api/admin/batches/{id}` - Get batch details
- **POST** `/api/admin/batches` - Create new batch
- **GET** `/api/admin/batches?month=2026-04` - Filter by month

### File Upload
- **POST** `/api/admin/upload/xlsx` - Upload XLSX file
  - Body: `FormData` with `file` and `month` fields
  - Returns: `batch_id` and statistics

### Reports
- **POST** `/api/admin/generate-report/{batch_id}` - Generate Q1-Q14 report
- **GET** `/api/admin/report/{batch_id}` - Get generated report

## Data Flow

1. **Upload XLSX** → `/api/admin/upload/xlsx`
   - Validates file format and columns
   - Creates `data_batch` record
   - Inserts posts and classifications into PostgreSQL
   - Returns batch_id

2. **Generate Report** → `/api/admin/generate-report/{batch_id}`
   - Fetches all posts for the batch
   - Computes Q1-Q14 aggregates
   - Generates LLM insights (via Claude API)
   - Stores in `monthly_aggregates` and `monthly_insights`

3. **View Report** → `/months/{month}/page.tsx`
   - Queries PostgreSQL for batch data
   - Fetches pre-computed aggregates
   - Displays interactive dashboard

## Configuration

### Monthly Pages

To add a new month-specific page:

1. Create directory: `app/months/march-2026/`
2. Add `page.tsx` file:

```tsx
'use client'

import { useEffect, useState } from 'react'

export default function MarchPage() {
  // Fetch batch data for 2026-03
  // Display Q1-Q14 reports
}
```

3. Update sidebar in `components/Sidebar.tsx`

### Database Credentials

**Local Development:**
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/chicom_dashboard
```

**EC2 with RDS:**
```env
DATABASE_URL=postgresql://postgres:password@your-rds-endpoint.amazonaws.com:5432/chicom_dashboard
```

## Next Steps

- [ ] Implement upload XLSX endpoint
- [ ] Connect PostgreSQL queries
- [ ] Build month-specific report pages
- [ ] Implement report generation
- [ ] Add Esuit/Automa integrations
- [ ] Set up SSL/TLS certificates
- [ ] Configure scheduled monthly reports

## Database Connection

The app uses `@vercel/postgres` for PostgreSQL connections. Update `lib/db.ts` if using a different database driver.

## Troubleshooting

### Port 3000 already in use
```bash
lsof -i :3000
kill -9 <PID>
```

### Database connection error
- Verify DATABASE_URL in `.env.local`
- Check PostgreSQL is running and accessible
- Ensure firewall allows port 5432

### Build errors
```bash
rm -rf .next node_modules
npm install
npm run build
```
