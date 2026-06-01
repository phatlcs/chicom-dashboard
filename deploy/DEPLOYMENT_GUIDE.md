# ChiCom Dashboard - EC2 Deployment Guide

## Your EC2 Instance

```
Instance ID:  i-0caf827d54e9a3a45
Name:         Boost-AGS
Region:       ap-southeast-1 (Singapore)
Type:         t4g.small (2 vCPU, 2GB RAM)
OS:           Amazon Linux 2023 ARM64
Key:          Boost.pem
Public IP:    ec2-18-141-25-84.ap-southeast-1.compute.amazonaws.com
```

---

## 🚀 Quick Setup (5 minutes)

### Step 1: SSH into EC2

```bash
# Make key readable
chmod 400 Boost.pem

# Connect
ssh -i Boost.pem ec2-user@ec2-18-141-25-84.ap-southeast-1.compute.amazonaws.com
```

### Step 2: Run Setup Script

```bash
# Clone repo
git clone https://github.com/phatlcs/chicom-dashboard.git
cd chicom-dashboard

# Run setup script
bash deploy/setup-ec2.sh
```

This will:
- ✅ Install Node.js 18
- ✅ Install PostgreSQL 15
- ✅ Create database & load schema
- ✅ Install Next.js dependencies
- ✅ Build the app
- ✅ Setup PM2 (process manager)
- ✅ Setup Nginx (reverse proxy)

**Takes ~3-5 minutes**

### Step 3: Verify

```bash
# View PM2 processes
pm2 list

# Check app logs
pm2 logs chicom-admin

# Verify PostgreSQL
psql -U postgres -d chicom_dashboard -c "SELECT COUNT(*) FROM groups;"
```

### Step 4: Access Dashboard

Open browser:
```
http://ec2-18-141-25-84.ap-southeast-1.compute.amazonaws.com
```

---

## 🔄 GitHub Actions Auto-Deploy

Automatically redeploy when you push to GitHub.

### Setup GitHub Secrets

1. Go to GitHub repo → **Settings** → **Secrets and variables** → **Actions**

2. Add these secrets:

| Secret | Value |
|--------|-------|
| `EC2_HOST` | `ec2-18-141-25-84.ap-southeast-1.compute.amazonaws.com` |
| `EC2_PRIVATE_KEY` | *(Copy contents of Boost.pem)* |
| `SLACK_WEBHOOK` | *(Optional: Slack notification URL)* |

### How to Copy EC2_PRIVATE_KEY:

```bash
# On your local machine
cat Boost.pem
# Copy the entire output (including BEGIN and END lines)
# Paste into GitHub secret
```

### Deploy Automatically

After setup, **every push to master/main/english_UI will automatically:**

1. ✅ Pull latest code from GitHub
2. ✅ Install dependencies (`npm install`)
3. ✅ Build app (`npm run build`)
4. ✅ Restart PM2 process
5. ✅ Your changes are live!

```bash
# Just push and it deploys
git push origin master
```

---

## 📊 Database Credentials

```
Host:     localhost
Port:     5432
Database: chicom_dashboard
User:     postgres
Password: chicom2024
```

### Connect from EC2:
```bash
psql -U postgres -d chicom_dashboard
```

### Connect from your laptop (tunneling):
```bash
ssh -i Boost.pem -L 5432:localhost:5432 ec2-user@ec2-18-141-25-84.ap-southeast-1.compute.amazonaws.com
# Then: psql -U postgres -d chicom_dashboard -h localhost
```

---

## 🔧 Common Commands

### Restart App
```bash
pm2 restart chicom-admin
```

### View Logs
```bash
pm2 logs chicom-admin
pm2 logs chicom-admin --lines 50  # Last 50 lines
```

### Check App Status
```bash
pm2 list
pm2 info chicom-admin
```

### Stop App
```bash
pm2 stop chicom-admin
```

### Start App
```bash
pm2 start chicom-admin
```

### View Nginx Logs
```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Restart Nginx
```bash
sudo systemctl restart nginx
```

### SSH Tunnel for Database
```bash
ssh -i Boost.pem -L 5432:localhost:5432 ec2-user@ec2-18-141-25-84.ap-southeast-1.compute.amazonaws.com
```

---

## 📈 Monitoring

### Check System Resources
```bash
free -h                 # Memory usage
df -h                   # Disk usage
top                     # Process monitor
```

### PostgreSQL Status
```bash
sudo systemctl status postgresql-15
sudo -u postgres psql -c "SELECT datname, pg_database_size(datname) FROM pg_database WHERE datname='chicom_dashboard';"
```

### Application Uptime
```bash
pm2 describe chicom-admin
```

---

## 🔐 Security Best Practices

### 1. Update Security Group
In AWS Console → EC2 → Security Groups:

Allow only:
- ✅ SSH (port 22) - Your IP only
- ✅ HTTP (port 80) - 0.0.0.0/0
- ✅ HTTPS (port 443) - 0.0.0.0/0 (when SSL added)

### 2. Setup SSL/TLS (Let's Encrypt)

```bash
# On EC2:
sudo dnf install -y certbot python3-certbot-nginx

# Get certificate (need domain name)
sudo certbot certify -d your-domain.com -d www.your-domain.com

# Auto-renew
sudo systemctl enable certbot-renew.timer
```

### 3. Strong Database Password
Change default password:
```bash
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'your_strong_password';"
```

Then update in `nextjs/.env.local`:
```env
DATABASE_URL=postgresql://postgres:your_strong_password@localhost:5432/chicom_dashboard
```

And restart:
```bash
pm2 restart chicom-admin
```

---

## 📋 Deployment Checklist

- [ ] SSH into EC2 and run setup script
- [ ] Verify app is running: `pm2 list`
- [ ] Access dashboard in browser
- [ ] Test database connection
- [ ] Setup GitHub Actions secrets
- [ ] Test auto-deploy by pushing code
- [ ] (Optional) Setup SSL certificate
- [ ] (Optional) Configure email backups

---

## 🚨 Troubleshooting

### App won't start
```bash
pm2 logs chicom-admin  # Check logs
pm2 delete chicom-admin
pm2 start npm --name "chicom-admin" -- start --cwd /home/ec2-user/chicom-dashboard/nextjs
```

### Port 3000 already in use
```bash
sudo lsof -i :3000
sudo kill -9 <PID>
```

### PostgreSQL won't start
```bash
sudo systemctl status postgresql-15
sudo systemctl restart postgresql-15
```

### Nginx issues
```bash
sudo nginx -t          # Test config
sudo systemctl restart nginx
sudo tail -f /var/log/nginx/error.log
```

### Out of disk space
```bash
df -h
sudo dnf clean all     # Clean package cache
pm2 flush              # Clear logs
```

---

## 📞 Support

For issues:
1. Check logs: `pm2 logs chicom-admin`
2. Check Nginx: `sudo tail -f /var/log/nginx/error.log`
3. SSH into EC2 and debug directly

---

## Next Steps

1. ✅ Run setup script
2. ✅ Verify app is running
3. ✅ Setup GitHub Actions
4. ✅ Test auto-deployment
5. ⏭️  Add SSL certificate
6. ⏭️  Configure domain name
7. ⏭️  Setup monitoring/alerts

**Questions?** Check logs and PM2 status first!
