#!/bin/bash
# ChiCom Dashboard - EC2 Setup Script
# Usage: bash setup-ec2.sh

set -e  # Exit on error

echo "=== ChiCom Dashboard EC2 Setup ==="
echo "Region: ap-southeast-1 (Singapore)"
echo ""

# ============================================================================
# 1. Update System
# ============================================================================
echo "📦 Updating system packages..."
sudo dnf update -y
sudo dnf install -y git curl wget postgresql15-server postgresql15-contrib

# ============================================================================
# 2. Install Node.js 18
# ============================================================================
echo "📦 Installing Node.js 18..."
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo dnf install -y nodejs

echo "✅ Node.js version: $(node -v)"
echo "✅ NPM version: $(npm -v)"
echo "✅ Architecture: $(node -p 'process.arch')"

# ============================================================================
# 3. Setup PostgreSQL
# ============================================================================
echo ""
echo "🗄️  Setting up PostgreSQL..."

# Initialize database
sudo /usr/pgsql-15/bin/initdb -D /var/lib/pgsql/15/data

# Start and enable service
sudo systemctl start postgresql-15
sudo systemctl enable postgresql-15

echo "✅ PostgreSQL started"

# Wait for PostgreSQL to be ready
sleep 2

# Create database
sudo -u postgres createdb chicom_dashboard || echo "Database may already exist"

# Set default postgres user password
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'chicom2024';" || true

echo "✅ Database 'chicom_dashboard' created"

# ============================================================================
# 4. Clone Repository
# ============================================================================
echo ""
echo "📂 Cloning repository..."
cd /home/ec2-user
git clone https://github.com/phatlcs/chicom-dashboard.git || cd chicom-dashboard && git pull
cd chicom-dashboard

echo "✅ Repository cloned"

# ============================================================================
# 5. Setup Database Schema
# ============================================================================
echo ""
echo "📊 Loading database schema..."
sudo -u postgres psql -d chicom_dashboard -f backend/schema.sql

echo "✅ Database schema loaded"

# ============================================================================
# 6. Setup Next.js App
# ============================================================================
echo ""
echo "⚙️  Setting up Next.js application..."
cd nextjs

# Create environment file
cat > .env.local << EOF
DATABASE_URL=postgresql://postgres:chicom2024@localhost:5432/chicom_dashboard
DB_HOST=localhost
DB_PORT=5432
DB_NAME=chicom_dashboard
DB_USER=postgres
DB_PASSWORD=chicom2024
NODE_ENV=production
API_PORT=3000
NEXT_PUBLIC_API_URL=http://localhost:3000
EOF

echo "✅ Environment file created"

# Install dependencies
echo "📥 Installing NPM dependencies..."
npm install

# Build
echo "🏗️  Building Next.js app..."
npm run build

echo "✅ Next.js built successfully"

# ============================================================================
# 7. Setup PM2
# ============================================================================
echo ""
echo "🚀 Setting up PM2 process manager..."
sudo npm install -g pm2

# Start app
pm2 start npm --name "chicom-admin" -- start

# Save PM2 config
pm2 save

# Setup PM2 to restart on reboot
sudo env PATH=$PATH:/usr/bin /usr/local/lib/node_modules/pm2/bin/pm2 startup systemd -u ec2-user --hp /home/ec2-user

echo "✅ PM2 configured"

# ============================================================================
# 8. Setup Nginx
# ============================================================================
echo ""
echo "🌐 Setting up Nginx reverse proxy..."
sudo dnf install -y nginx

# Create Nginx config
sudo tee /etc/nginx/conf.d/chicom.conf > /dev/null << EOF
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Test Nginx config
sudo nginx -t

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

echo "✅ Nginx configured"

# ============================================================================
# 9. Verify Setup
# ============================================================================
echo ""
echo "=== ✅ Setup Complete ==="
echo ""
echo "🔍 Verification:"
echo "  Node.js:     $(node -v)"
echo "  NPM:         $(npm -v)"
echo "  PostgreSQL:  $(sudo -u postgres psql -c 'SELECT version;' | head -1 || echo 'Running')"
echo "  Nginx:       $(nginx -v 2>&1)"
echo "  PM2 apps:    $(pm2 list 2>/dev/null | grep -c 'online' || echo '1')"
echo ""
echo "🌐 Access your dashboard:"
echo "  http://ec2-18-141-25-84.ap-southeast-1.compute.amazonaws.com"
echo ""
echo "📊 Verify database:"
echo "  psql -U postgres -d chicom_dashboard -c 'SELECT COUNT(*) FROM groups;'"
echo ""
echo "💾 Database credentials:"
echo "  Host:     localhost"
echo "  Database: chicom_dashboard"
echo "  User:     postgres"
echo "  Password: chicom2024"
echo ""
echo "🚀 To restart app:"
echo "  pm2 restart chicom-admin"
echo ""
echo "📝 To view logs:"
echo "  pm2 logs chicom-admin"
