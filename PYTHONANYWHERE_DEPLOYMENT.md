# PythonAnywhere Deployment Guide - Senior Backend Developer

**Project**: Health Monitor Django Backend  
**Framework**: Django 5.1+ with DRF  
**Database**: PostgreSQL/Supabase (Port 6543)  
**Web Server**: PythonAnywhere (Apache + WSGI)  

---

## 📋 Prerequisites

- ✅ PythonAnywhere account (paid plan recommended: ~$5-7/month for production)
- ✅ GitHub repository with backend code
- ✅ Supabase PostgreSQL database (Port 6543 pooled connection)
- ✅ Environment variables ready (DATABASE_URL, SECRET_KEY, etc.)

---

## 🚀 Step 1: PythonAnywhere Account Setup

1. Sign up at **https://www.pythonanywhere.com**
2. Go to **Web** tab → **Add a new web app**
3. Choose:
   - Framework: **Django**
   - Python Version: **3.13** (matches runtime.txt)
   - Project Name: `healthmonitor`

This auto-generates WSGI config - we'll customize it.

---

## 📂 Step 2: Clone Repository & Setup

### 2.1 Open Bash Console
- Dashboard → **Consoles** → **Bash**

### 2.2 Clone Repository
```bash
cd ~
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd YOUR_REPO/Backend
```

### 2.3 Create Virtual Environment
```bash
mkvirtualenv --python=/usr/bin/python3.13 healthmonitor
pip install --upgrade pip
```

### 2.4 Install Dependencies
```bash
pip install -r requirements.txt

# If issues with psycopg2:
pip install psycopg2-binary

# Verify critical packages
python -c "import django; import psycopg2; import dj_database_url; print('✅ All imports OK')"
```

---

## 🔐 Step 3: Environment Variables

### 3.1 Create `.env` File
```bash
nano ~/.env
```

Add these variables:
```
# Django Settings
DJANGO_SETTINGS_MODULE=backend.settings.prod
DEBUG=False
SECRET_KEY=your-very-long-random-secret-key-here-at-least-50-chars

# Database (Supabase PostgreSQL)
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:6543/postgres?sslmode=require&prepared_statements=false

# Allowed Hosts
ALLOWED_HOSTS=yourusername.pythonanywhere.com

# CORS Origins
CORS_ALLOWED_ORIGINS=https://your-frontend-url.vercel.app

# Security
SECURE_SSL_REDIRECT=True
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True
CSRF_TRUSTED_ORIGINS=https://your-frontend-url.vercel.app
```

Save: `Ctrl+X` → `Y` → `Enter`

### 3.2 Set Permissions
```bash
chmod 600 ~/.env
```

---

## 🐍 Step 4: Django Configuration

### 4.1 Update WSGI File
- PythonAnywhere Dashboard → **Web** tab
- Click your web app → **WSGI configuration file**
- Edit to:

```python
import os
import sys
from pathlib import Path

# Add project to path
project_home = '/home/yourusername/YOUR_REPO/Backend'
if project_home not in sys.path:
    sys.path.insert(0, project_home)

# Load environment variables
from pathlib import Path
env_path = Path.home() / '.env'

def load_env():
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#'):
                key, value = line.split('=', 1)
                os.environ[key] = value

load_env()

# Set Django settings module
os.environ['DJANGO_SETTINGS_MODULE'] = 'backend.settings.prod'

# Import Django WSGI app
from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()
```

### 4.2 Update Settings File Paths
In `Backend/backend/settings/base.py`, ensure:

```python
# Static files
STATIC_ROOT = '/home/yourusername/YOUR_REPO/Backend/staticfiles'
STATIC_URL = '/static/'

# Media files (if needed)
MEDIA_ROOT = '/home/yourusername/YOUR_REPO/Backend/media'
MEDIA_URL = '/media/'
```

---

## 📦 Step 5: Run Migrations & Collect Static Files

### 5.1 In Bash Console
```bash
cd ~/YOUR_REPO/Backend

# Activate virtual environment
workon healthmonitor

# Run migrations
python manage.py migrate --settings=backend.settings.prod

# Collect static files
python manage.py collectstatic --noinput --settings=backend.settings.prod

# Create superuser (optional)
python manage.py createsuperuser --settings=backend.settings.prod
```

### 5.2 Verify Static Files
```bash
ls -la staticfiles/
# Should contain: admin/, rest_framework/, etc.
```

---

## 🌐 Step 6: Configure PythonAnywhere Web App

### 6.1 Web App Settings
- Dashboard → **Web** tab → Click your app

### 6.2 Configure Virtualenv
- **Virtualenv**: `/home/yourusername/.virtualenvs/healthmonitor`

### 6.3 Configure Static Files Mapping
Add these mappings (under "Static files"):

```
URL Path: /static/
Directory: /home/yourusername/YOUR_REPO/Backend/staticfiles

URL Path: /media/
Directory: /home/yourusername/YOUR_REPO/Backend/media
```

### 6.4 WSGI Configuration
- **WSGI configuration file**: `/home/yourusername/YOUR_REPO/Backend/backend/wsgi.py`
  (Or use the auto-generated one from Step 4.1)

### 6.5 Security Settings
- **Force HTTPS**: ✅ Enable

---

## ✅ Step 7: Reload & Test

### 7.1 Reload Web App
- PythonAnywhere Dashboard → **Web** tab
- Click **Reload** button (green)

### 7.2 Test Health Endpoints
```bash
# From your local machine:
curl https://yourusername.pythonanywhere.com/api/health/
curl https://yourusername.pythonanywhere.com/api/version/

# Expected 200 OK with JSON response
```

### 7.3 Check Error Logs
If issues:
- Dashboard → **Web** tab
- **Error log**: Check for errors
- **Access log**: Check requests

---

## 🔧 Step 8: Database Connection Verification

### 8.1 Test Database Connection
```bash
workon healthmonitor
cd ~/YOUR_REPO/Backend

python manage.py shell --settings=backend.settings.prod
```

In Django shell:
```python
from django.db import connection
cursor = connection.cursor()
cursor.execute("SELECT 1")
print("✅ Database connection OK")
cursor.close()
```

### 8.2 Common Issues & Fixes

**Issue**: `Connection refused port 6543`
- Verify DATABASE_URL in `.env`
- Check Supabase firewall allows PythonAnywhere IP
- Verify SSL certificate: `?sslmode=require`

**Issue**: `Module not found: psycopg2`
```bash
pip install psycopg2-binary --force-reinstall
```

**Issue**: `Permission denied` on `.env`
```bash
chmod 600 ~/.env
```

---

## 📊 Step 9: Configure Scheduled Tasks (Optional)

For background jobs (email cleanup, data backup):

- Dashboard → **Scheduled Tasks**
- Example: Daily database cleanup
```bash
/home/yourusername/.virtualenvs/healthmonitor/bin/python /home/yourusername/YOUR_REPO/Backend/manage.py clearsessions --settings=backend.settings.prod
```

---

## 🔄 Step 10: Continuous Deployment (Optional)

### 10.1 Auto-Deploy on Git Push
Create `post_deploy.sh` in Backend root:

```bash
#!/bin/bash
cd ~/YOUR_REPO/Backend
git pull origin main
workon healthmonitor
pip install -r requirements.txt
python manage.py migrate --settings=backend.settings.prod
python manage.py collectstatic --noinput --settings=backend.settings.prod
touch /var/www/yourusername_pythonanywhere_com_wsgi.py
```

Make executable:
```bash
chmod +x post_deploy.sh
```

### 10.2 Add as PythonAnywhere Scheduled Task
```bash
/home/yourusername/YOUR_REPO/Backend/post_deploy.sh
```
(Run daily or on-demand)

---

## 📈 Performance Optimization

### 11.1 Enable GZIP Compression
In `backend/settings/prod.py`:
```python
MIDDLEWARE = [
    'django.middleware.gzip.GZipMiddleware',
    # ... rest of middleware
]
```

### 11.2 Enable Database Query Caching
```python
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'unique-snowflake',
    }
}
```

### 11.3 Optimize Database Connection Pool
In `.env`:
```
DATABASE_URL=postgresql://...?connect_timeout=10&sslmode=require&prepared_statements=false&pool_size=5&max_overflow=10
```

---

## 🆘 Troubleshooting Checklist

| Issue | Solution |
|-------|----------|
| `500 Error` | Check error log, verify DATABASE_URL, check migrations |
| `404 on /static/` | Run `collectstatic`, verify STATIC_ROOT path |
| `CORS Error` | Add frontend URL to CORS_ALLOWED_ORIGINS |
| `Module not found` | Run `pip install -r requirements.txt`, verify virtualenv |
| `Database connection failed` | Check Supabase IP whitelist, verify SSL, test credentials |
| `Import error in WSGI` | Verify project path in WSGI file, check virtualenv path |
| `Static files not loading` | Reload web app, clear browser cache, check log |

---

## 📊 Monitoring & Maintenance

### 12.1 Daily Checks
- ✅ Check error log for exceptions
- ✅ Monitor API response times
- ✅ Verify health endpoints return 200 OK

### 12.2 Weekly Tasks
- ✅ Check database connection pool stats
- ✅ Review access logs for suspicious activity
- ✅ Backup database (Supabase handles this)

### 12.3 Monthly Tasks
- ✅ Update dependencies: `pip list --outdated`
- ✅ Review Django security updates
- ✅ Analyze error logs for patterns
- ✅ Test disaster recovery procedures

---

## 💾 Backup & Disaster Recovery

### 13.1 Manual Backup
```bash
# From PythonAnywhere Bash console
pg_dump postgresql://user:pass@host/db > backup.sql

# Download from PythonAnywhere Files tab
```

### 13.2 Restore from Backup
```bash
psql postgresql://user:pass@host/db < backup.sql
```

**Note**: Supabase provides automatic daily backups (free plan + 7 days retention)

---

## 🎯 Production Checklist

- [ ] SECRET_KEY is strong (50+ random chars)
- [ ] DEBUG=False in production settings
- [ ] ALLOWED_HOSTS configured correctly
- [ ] CORS_ALLOWED_ORIGINS has frontend URL only
- [ ] Database migrations run successfully
- [ ] Static files collected and loading
- [ ] HTTPS enabled and enforced
- [ ] Error log checked and cleared
- [ ] Health endpoints return 200 OK
- [ ] Frontend can connect to API
- [ ] Database backups configured
- [ ] Monitor email alerts enabled

---

## 🚀 Launch Verification

After deployment, verify:

```bash
# 1. Test API endpoints
curl -H "Accept: application/json" https://yourusername.pythonanywhere.com/api/health/

# 2. Test CORS
curl -H "Origin: https://your-frontend-url.vercel.app" \
     -H "Access-Control-Request-Method: GET" \
     https://yourusername.pythonanywhere.com/api/health/

# 3. Test with frontend
Visit: https://your-frontend-url.vercel.app
- Test login
- Test API calls
- Check browser console for CORS errors
```

---

## 📞 Support Resources

- **PythonAnywhere Docs**: https://help.pythonanywhere.com/
- **Django Docs**: https://docs.djangoproject.com/
- **Supabase Docs**: https://supabase.com/docs
- **DRF Docs**: https://www.django-rest-framework.org/

---

## 🎉 Success Indicators

✅ Backend deployed on PythonAnywhere  
✅ Health endpoint returns: `{"status": "healthy", "db": "connected"}`  
✅ Frontend can login and fetch data  
✅ No CORS errors in browser console  
✅ Static files loading properly  
✅ Error log shows no critical errors  

---

**Version**: 1.0.0  
**Last Updated**: February 19, 2026  
**Status**: Production Ready ✅
