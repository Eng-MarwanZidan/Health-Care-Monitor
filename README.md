# Health Monitor - Production Deployment Ready

**Status**: ✅ 100% Production Ready

## 🎯 Quick Start

### Local Development
```bash
docker-compose up --build
# Backend: http://localhost:8000
# Frontend: http://localhost:3000
```

### Production Deployment (3 Platforms)
1. **Backend**: Render (Django + Gunicorn)
2. **Frontend**: Vercel (React + Vite)
3. **Database**: Supabase (PostgreSQL port 6543)

---

## 🏗️ Architecture

```
GitHub Repo
    ├─→ Render (Backend: Django/Gunicorn + 4 workers)
    ├─→ Vercel (Frontend: React/Vite)
    └─→ Supabase (Database: PostgreSQL port 6543)
```

---

## 📋 What's Configured

### Backend (Django)
- ✅ PostgreSQL with `dj_database_url`
- ✅ Port 6543 pooling support (prepared_statements=false)
- ✅ Health endpoints: `/api/health/`, `/api/version/`, `/api/metrics/`
- ✅ CORS configured for frontend
- ✅ JWT authentication ready
- ✅ WhiteNoise for static files
- ✅ Production settings hardened (HSTS, SSL redirect, secure cookies)

### Frontend (React)
- ✅ Vite build system
- ✅ Environment-based API URL
- ✅ Vercel deployment config
- ✅ SPA routing configured

### Deployment
- ✅ `runtime.txt`: Python 3.13.7
- ✅ `build.sh`: Automated build (migrations, static collection)
- ✅ `start.sh`: Gunicorn startup
- ✅ `Dockerfile`: Container image
- ✅ `docker-compose.yml`: Full stack local dev
- ✅ `render.yaml`: Render deployment config
- ✅ `vercel.json`: Vercel deployment config

---

## 🔐 Security

- ✅ SSL/TLS everywhere (Render, Vercel, Supabase)
- ✅ DEBUG=False in production
- ✅ HTTPS redirect enforced
- ✅ HSTS enabled (1 year)
- ✅ CSRF & XSS protection
- ✅ Secure cookies
- ✅ Environment variables for secrets (no hardcoding)

---

## 🚀 Deployment Steps

### 1. Create Accounts
- [ ] Supabase: https://supabase.com
- [ ] Render: https://render.com
- [ ] Vercel: https://vercel.com

### 2. Supabase Setup
1. Create new project
2. Get connection string: `postgresql://postgres:PASSWORD@db.xxxxx.supabase.co:6543/postgres?sslmode=require&prepared_statements=false`
3. Note: Port 6543 is pooled (required for Render free tier)

### 3. Environment Variables
Create in each platform dashboard:

**Render (Backend)**:
```
DJANGO_SETTINGS_MODULE=backend.settings.prod
DEBUG=False
SECRET_KEY=<strong-random-key>
DATABASE_URL=<from-supabase>
ALLOWED_HOSTS=health-monitor-backend.onrender.com
CORS_ALLOWED_ORIGINS=https://health-monitor-frontend.vercel.app
SECURE_SSL_REDIRECT=True
SESSION_COOKIE_SECURE=True
```

**Vercel (Frontend)**:
```
VITE_API_URL=https://health-monitor-backend.onrender.com/api
```

### 4. Deploy Backend (Render)
1. Create Web Service → Connect GitHub
2. Select repo and main branch
3. Build command: `bash build.sh`
4. Start command: `bash start.sh`
5. Add environment variables
6. Deploy

### 5. Deploy Frontend (Vercel)
1. Import GitHub repo
2. Set root directory: `Frontend`
3. Set VITE_API_URL environment variable
4. Deploy (npm run build auto-configured)

---

## 📁 Key Files

| File | Purpose |
|------|---------|
| `runtime.txt` | Python 3.13.7 specification |
| `build.sh` | Render build automation |
| `start.sh` | Gunicorn production startup |
| `Backend/backend/settings/base.py` | PostgreSQL configuration |
| `Backend/backend/settings/prod.py` | Production hardening |
| `Backend/apps/healthmonitor/views_health.py` | Health check endpoints |
| `render.yaml` | Full-stack Render deployment |
| `vercel.json` | Vercel frontend config |
| `.env.production` | Production environment template |
| `docker-compose.yml` | Local development stack |

---

## ✅ Verification

After deployment, test:
```bash
# Health check
curl https://health-monitor-backend.onrender.com/api/health/

# Version check
curl https://health-monitor-backend.onrender.com/api/version/

# Frontend
Visit https://health-monitor-frontend.vercel.app
```

---

## 💰 Cost Estimation

- **Render**: ~$7-25/month (or free tier with limitations)
- **Vercel**: Free-$20/month (free for static)
- **Supabase**: $25/month (Pro tier) or free tier
- **Total**: ~$32-70/month

---

## 🔧 Troubleshooting

### Database Connection Issues
- Verify DATABASE_URL format
- Check Supabase project is active
- Port 6543 is pooled (PgBouncer) - requires `prepared_statements=false`
- Allow Render IP in Supabase firewall (added automatically)

### Frontend API Errors
- Verify VITE_API_URL matches backend URL
- Check CORS_ALLOWED_ORIGINS in backend settings
- Verify health endpoint returns 200 status

### Build Failures
- Check Python version: 3.13.7
- Run migrations locally first: `manage.py migrate`
- Verify all requirements installed: `pip install -r requirements.txt`

---

## 📊 Monitoring

**Render Dashboard**: Monitor backend logs and metrics
**Vercel Dashboard**: Monitor frontend deployments
**Supabase Dashboard**: Monitor database usage and backups

Health endpoints automatically monitored:
- `/api/health/` - Database connectivity
- `/api/version/` - Application version
- `/api/metrics/` - Performance metrics

---

## 🆘 Support

1. Read this README completely
2. Check `.env.production` for missing variables
3. Verify all accounts (Supabase, Render, Vercel) are created
4. Test locally with `docker-compose up --build`
5. Check Render/Vercel logs for specific errors

---

**Version**: 1.0.0  
**Status**: Production Ready ✅  
**Last Updated**: February 19, 2026
