# Deployment Guide - Nails Booking App

This guide provides step-by-step instructions for deploying the Nails Booking App to production.

## Architecture Overview

- **Frontend**: React + Vite → Deployed to **Vercel**
- **Backend**: Node.js + Express + Prisma → Deployed to **Railway** (or Render)
- **Database**: PostgreSQL (Docker locally, Railway/managed PostgreSQL in production)

---

## Prerequisites

Before starting, ensure you have:

- [ ] GitHub account (for repository hosting)
- [ ] Vercel account (sign up at https://vercel.com)
- [ ] Railway account (sign up at https://railway.app) OR Render account
- [ ] Docker installed locally (for local development)
- [ ] Your code pushed to a GitHub repository

---

## Part 1: Database Setup

### Local Development (Docker)

The project uses Docker Compose for local PostgreSQL:

1. **Start PostgreSQL with Docker**
   ```bash
   # In project root
   docker-compose up -d
   ```

2. **Verify Database is Running**
   ```bash
   docker ps
   # Should show postgres container running on port 5432
   ```

3. **Run Migrations**
   ```bash
   cd server
   npx prisma generate
   npx prisma migrate deploy

   # Optional: Seed initial data
   npx prisma db seed
   ```

4. **Local DATABASE_URL**
   ```bash
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/nailsapp"
   ```

### Production (Railway PostgreSQL)

Railway will automatically provision PostgreSQL when deploying the backend (see Part 2).

---

## Part 2: Backend Deployment (Railway)

### Step 1: Prepare Backend for Deployment

1. **Update `package.json` in `/server` directory**

   Ensure you have these scripts:
   ```json
   {
     "scripts": {
       "start": "node dist/index.js",
       "build": "tsc",
       "postinstall": "prisma generate",
       "migrate:deploy": "prisma migrate deploy"
     }
   }
   ```

2. **Create `.railwayignore` in `/server` directory**
   ```
   node_modules
   .env
   dist
   *.log
   ```

3. **Ensure TypeScript is configured correctly**

   Check `server/tsconfig.json` has:
   ```json
   {
     "compilerOptions": {
       "outDir": "./dist",
       "rootDir": "./src"
     }
   }
   ```

### Step 2: Deploy to Railway

1. **Go to Railway Dashboard**
   - Visit https://railway.app/dashboard
   - Click **"New Project"**

2. **Choose Deployment Method**
   - Select **"Deploy from GitHub repo"**
   - Authorize Railway to access your GitHub
   - Select your repository

3. **Configure Service**
   - Railway will detect your app
   - Click on the service card
   - Go to **Settings** tab

4. **Set Root Directory**
   - In Settings → **Root Directory**: enter `server`
   - **Start Command**: `npm run migrate:deploy && npm start`
   - **Build Command**: `npm run build`

5. **Add PostgreSQL Database**
   - Click **"+ New"** → **"Database"** → **"Add PostgreSQL"**
   - Railway will automatically create a `DATABASE_URL` environment variable

6. **Configure Environment Variables**

   Go to **Variables** tab and add:

   ```bash
   # Database (Railway auto-generates DATABASE_URL)
   DATABASE_URL=postgresql://postgres:password@host:5432/postgres

   # JWT Secret (generate a secure random string)
   JWT_SECRET=your-super-secure-random-string-here-min-32-chars

   # CORS Origin (will be updated after Vercel deployment)
   CORS_ORIGIN=http://localhost:5173

   # Node Environment
   NODE_ENV=production

   # Port (Railway sets this automatically, but you can specify)
   PORT=3001
   ```

   **Generate a secure JWT_SECRET:**
   ```bash
   # In your terminal
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

7. **Deploy**
   - Click **"Deploy"** (Railway auto-deploys on git push)
   - Wait for build to complete (~2-3 minutes)
   - Once deployed, click **"Settings"** → **"Networking"**
   - Click **"Generate Domain"** to get a public URL
   - **Copy your backend URL** (e.g., `https://your-app.railway.app`)

8. **Verify Backend is Running**
   - Visit `https://your-app.railway.app/health` (should return `{"status":"ok"}`)
   - If you get 502 or 503, check the logs in Railway dashboard

---

## Part 3: Frontend Deployment (Vercel)

### Step 1: Prepare Frontend

1. **Update API URL Configuration**

   Create or update `/.env.production` in your project root:
   ```bash
   VITE_API_URL=https://your-app.railway.app/api
   ```

   Replace `your-app.railway.app` with your actual Railway backend URL.

2. **Update `vercel.json` Configuration**

   Create `vercel.json` in project root:
   ```json
   {
     "buildCommand": "pnpm install && pnpm run build",
     "outputDirectory": "dist",
     "devCommand": "pnpm run dev",
     "installCommand": "pnpm install",
     "framework": "vite",
     "rewrites": [
       {
         "source": "/(.*)",
         "destination": "/index.html"
       }
     ]
   }
   ```

3. **Update Vite Config for Production**

   Ensure `vite.config.ts` has:
   ```typescript
   export default defineConfig({
     plugins: [react()],
     base: '/',
     build: {
       outDir: 'dist',
       sourcemap: false,
       rollupOptions: {
         output: {
           manualChunks: {
             vendor: ['react', 'react-dom', 'react-router-dom'],
           },
         },
       },
     },
   });
   ```

### Step 2: Deploy to Vercel

1. **Go to Vercel Dashboard**
   - Visit https://vercel.com/dashboard
   - Click **"Add New..."** → **"Project"**

2. **Import Repository**
   - Click **"Import Git Repository"**
   - Select your nails booking app repository
   - Click **"Import"**

3. **Configure Project**

   **Framework Preset**: Vite

   **Root Directory**: `./` (leave as root)

   **Build & Development Settings**:
   - Build Command: `pnpm run build`
   - Output Directory: `dist`
   - Install Command: `pnpm install`

4. **Environment Variables**

   Click **"Environment Variables"** and add:
   ```bash
   VITE_API_URL=https://your-app.railway.app/api
   ```

   Replace with your actual Railway backend URL.

5. **Deploy**
   - Click **"Deploy"**
   - Wait for deployment to complete (~1-2 minutes)
   - You'll get a URL like `https://your-app.vercel.app`

6. **Set Custom Domain (Optional)**
   - Go to **Settings** → **Domains**
   - Add your custom domain
   - Follow DNS configuration instructions

### Step 3: Update Backend CORS Settings

1. **Go back to Railway Dashboard**
   - Open your backend service
   - Go to **Variables** tab
   - Update `CORS_ORIGIN` to your Vercel URL:
     ```bash
     CORS_ORIGIN=https://your-app.vercel.app
     ```
   - If you have multiple domains (e.g., custom domain), use comma-separated:
     ```bash
     CORS_ORIGIN=https://your-app.vercel.app,https://yourdomain.com
     ```

2. **Redeploy Backend**
   - Railway will automatically redeploy with new environment variables
   - Or manually trigger redeploy from Railway dashboard

---

## Part 4: Post-Deployment Setup

### 1. Create Admin User

Create an admin user directly in the database:

**Using Railway PostgreSQL Console:**

1. Go to Railway Dashboard → PostgreSQL service
2. Click **"Data"** tab (or connect via CLI)
3. Run the following SQL:

```sql
-- First, create a user record (simulating registration)
INSERT INTO "User" (id, email, password, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'admin@yoursalon.com',
  -- You'll need to hash the password using bcrypt
  -- For now, use a temporary password and change it after first login
  '$2b$10$...',  -- Replace with bcrypt hash
  NOW(),
  NOW()
);

-- Then create the profile with admin role
INSERT INTO "Profile" (id, email, role, "createdAt")
VALUES (
  (SELECT id FROM "User" WHERE email = 'admin@yoursalon.com'),
  'admin@yoursalon.com',
  'admin',
  NOW()
);
```

**Alternative: Create via Registration + SQL Update:**

1. Register a new user via the frontend login page
2. Go to Railway PostgreSQL console
3. Update the user's role:

```sql
UPDATE "Profile"
SET role = 'admin'
WHERE email = 'your-registered-email@example.com';
```

### 2. Add Treatments

1. Log in as admin
2. Go to Admin Dashboard → Treatments
3. Add your nail salon treatments with:
   - Names in Arabic, Hebrew, and English
   - Duration in minutes
   - Price in ILS (₪)

### 3. Set Availability

1. Go to Admin Dashboard → Available Times
2. Add availability rules:
   - Select dates
   - Set working hours (e.g., 09:00 - 18:00)
   - Set slot interval (e.g., 30 minutes)

### 4. Test Booking Flow

1. Open your app in incognito/private browser
2. Go through the booking flow:
   - Select date and time
   - Choose treatment
   - Enter customer details
   - Confirm booking
3. Verify appointment appears in admin dashboard
4. Check that booked slots are disabled for other customers

---

## Part 5: Environment Variables Reference

### Backend Environment Variables (Railway)

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string (auto-generated by Railway) | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET` | Secret for JWT tokens (min 32 chars) | `a1b2c3d4e5f6...` |
| `CORS_ORIGIN` | Allowed frontend origins | `https://app.vercel.app` |
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Server port | `3001` |

### Frontend Environment Variables (Vercel)

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `https://api.railway.app/api` |

---

## Part 6: Continuous Deployment

### Automatic Deployments

Both Vercel and Railway support automatic deployments:

1. **Push to GitHub** → Automatically triggers deployment
2. **Preview Deployments**: Every PR gets a preview URL (Vercel)
3. **Production Branch**: Deployments from `main` branch go to production

### Manual Deployment

**Railway:**
- Go to service → Click **"Redeploy"**

**Vercel:**
- Go to project → **Deployments** → Click **"Redeploy"**

---

## Part 7: Monitoring & Logs

### Railway Logs

1. Go to your service in Railway dashboard
2. Click **"Deployments"** tab
3. Click on a deployment to see logs
4. Use the search/filter to find specific errors

### Vercel Logs

1. Go to your project in Vercel dashboard
2. Click **"Deployments"**
3. Click on a deployment → **"View Function Logs"**
4. Or use **"Runtime Logs"** for real-time monitoring

### Database Monitoring

**Railway PostgreSQL:**
- Go to PostgreSQL service → **"Metrics"** tab
- Monitor connections, queries, and storage

### Uptime Monitoring (Optional)

Use a service like:
- **UptimeRobot** (free tier)
- **Better Uptime**
- **Pingdom**

Set up monitoring for:
- `https://your-backend.railway.app/health`
- `https://your-app.vercel.app`

---

## Part 8: Troubleshooting

### Common Issues

#### 1. **"Failed to fetch" or CORS errors**

**Cause**: CORS not configured correctly

**Fix**:
- Verify `CORS_ORIGIN` in Railway matches your Vercel URL exactly
- Include `https://` in the URL
- Redeploy backend after changing environment variables

#### 2. **"502 Bad Gateway" on backend**

**Cause**: Backend failed to start

**Fix**:
- Check Railway logs for startup errors
- Verify `DATABASE_URL` is correct
- Ensure Prisma migrations ran successfully:
  ```bash
  # In Railway service logs, you should see:
  "Running migrations..."
  "Starting server on port 3001..."
  ```

#### 3. **"Prisma Client Not Generated"**

**Cause**: Prisma client wasn't generated during build

**Fix**:
- Ensure `postinstall` script in `server/package.json`:
  ```json
  "postinstall": "prisma generate"
  ```
- Redeploy backend

#### 4. **Database connection fails**

**Cause**: Invalid `DATABASE_URL` or database not accessible

**Fix**:
- Verify connection string format:
  ```
  postgresql://USER:PASSWORD@HOST:PORT/DATABASE
  ```
- Check database is running in Railway dashboard
- Ensure no firewall blocking connections
- For Railway, the DATABASE_URL is auto-generated when you add PostgreSQL

#### 5. **Frontend shows blank page**

**Cause**: Build failed or routing issue

**Fix**:
- Check Vercel build logs for errors
- Verify `vercel.json` rewrites are configured
- Check browser console for JavaScript errors
- Ensure `VITE_API_URL` is set correctly

#### 6. **Environment variables not updating**

**Cause**: Deployment cached old values

**Fix**:
- Update environment variable
- Manually trigger redeploy
- Clear build cache (Vercel: **Settings** → **General** → **Clear Cache**)

#### 7. **Docker PostgreSQL won't start locally**

**Cause**: Port 5432 already in use or container conflict

**Fix**:
```bash
# Check if port is in use
lsof -i :5432

# Stop and remove existing containers
docker-compose down -v

# Restart
docker-compose up -d
```

---

## Part 9: Database Migrations (After Deployment)

When you make schema changes:

### 1. Create Migration Locally

```bash
cd server
npx prisma migrate dev --name your_migration_name
```

### 2. Push Changes to GitHub

```bash
git add .
git commit -m "Add database migration"
git push
```

### 3. Railway Auto-Migration

Railway will automatically run `npm run migrate:deploy` on deployment.

### 4. Manual Migration (if needed)

If auto-migration fails:

1. Go to Railway dashboard → Your service
2. Click **"Variables"** → Copy `DATABASE_URL`
3. Run locally:
   ```bash
   export DATABASE_URL="your-railway-database-url"
   npx prisma migrate deploy
   ```

---

## Part 10: Rollback Strategy

### Rollback Frontend (Vercel)

1. Go to Vercel project → **Deployments**
2. Find a previous working deployment
3. Click **"..."** → **"Promote to Production"**

### Rollback Backend (Railway)

1. Go to Railway service → **Deployments**
2. Find a previous working deployment
3. Click **"..."** → **"Redeploy"**

### Rollback Database

⚠️ **Database rollbacks are complex!**

**Best practice**: Before risky migrations, create a backup:

```bash
# Backup Railway PostgreSQL
# 1. Get DATABASE_URL from Railway
# 2. Run pg_dump
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Restore from backup
psql $DATABASE_URL < backup-20260217.sql
```

**Railway Backups:**
- Railway doesn't provide automatic backups on free tier
- Consider upgrading to a paid plan for automated backups
- Or set up manual backup cron jobs

---

## Part 11: Performance Optimization

### Frontend Optimization

1. **Enable Caching**
   - Vercel automatically caches static assets
   - Use `Cache-Control` headers for API responses

2. **Image Optimization**
   - Use Vercel's Image Optimization
   - Or use a CDN like Cloudinary

3. **Code Splitting**
   - Already configured in Vite
   - Review bundle size: `pnpm run build` → check `dist` folder size

### Backend Optimization

1. **Database Indexes**
   - Already configured in Prisma schema
   - Review indexes on `appointments.start_datetime` and `appointments.status`

2. **Connection Pooling**
   - Railway PostgreSQL has built-in connection pooling
   - Configure Prisma connection limit in `schema.prisma`:
     ```prisma
     datasource db {
       provider = "postgresql"
       url      = env("DATABASE_URL")
     }

     generator client {
       provider = "prisma-client-js"
       previewFeatures = ["fullTextSearch"]
     }
     ```

3. **Query Optimization**
   - Use Prisma's `select` to fetch only needed fields
   - Add indexes for frequently queried fields
   - Monitor slow queries in Railway metrics

4. **Caching Strategy**
   - Cache availability rules (they rarely change)
   - Consider Redis for session management (future enhancement)

---

## Part 12: Security Checklist

- [ ] JWT_SECRET is a strong random string (32+ characters)
- [ ] Database credentials are not in source code
- [ ] CORS is configured to allow only your frontend domain
- [ ] HTTPS is enabled (automatic with Vercel/Railway)
- [ ] Environment variables are not exposed in frontend build
- [ ] Rate limiting is enabled (consider adding to backend)
- [ ] SQL injection protection (Prisma handles this)
- [ ] XSS protection (React handles this)
- [ ] User input validation on both frontend and backend
- [ ] PostgreSQL in production has strong password (Railway auto-generates)

---

## Part 13: Cost Estimation

### Free Tier Limits

**Vercel** (Hobby Plan - Free):
- Unlimited deployments
- 100 GB bandwidth/month
- Serverless function execution: 100 GB-hours

**Railway** (Free Trial):
- $5 credit/month (limited time)
- After trial: ~$5-10/month for small apps
- PostgreSQL included in service cost

**Estimated Monthly Cost**: $5-15 for a small production app

### Cost Optimization Tips

1. **Railway**: Monitor resource usage in dashboard
2. **Vercel**: Optimize images and bundle size
3. **Database**: Clean up old data periodically
4. **Monitoring**: Use free tiers of monitoring services

---

## Part 14: Local Development with Docker

### Docker Compose Configuration

The `docker-compose.yml` in project root:

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15-alpine
    container_name: nailsapp-postgres
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: nailsapp
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### Useful Docker Commands

```bash
# Start database
docker-compose up -d

# Stop database
docker-compose down

# Stop and remove volumes (fresh start)
docker-compose down -v

# View logs
docker-compose logs -f postgres

# Access PostgreSQL shell
docker exec -it nailsapp-postgres psql -U postgres -d nailsapp

# Backup local database
docker exec nailsapp-postgres pg_dump -U postgres nailsapp > backup.sql

# Restore local database
docker exec -i nailsapp-postgres psql -U postgres nailsapp < backup.sql
```

---

## Support & Updates

### Getting Help

- **GitHub Issues**: Report bugs or request features
- **Documentation**: Check README.md for app-specific docs
- **Deployment Issues**: Check provider documentation
  - Vercel: https://vercel.com/docs
  - Railway: https://docs.railway.app
  - PostgreSQL: https://www.postgresql.org/docs/

### Staying Updated

- Watch your GitHub repository for issues
- Monitor Vercel/Railway status pages
- Keep dependencies updated:
  ```bash
  pnpm update
  ```

---

## Quick Reference Commands

```bash
# Build frontend locally
pnpm run build

# Build backend locally
cd server && npm run build

# Run migrations
cd server && npx prisma migrate deploy

# Generate Prisma client
cd server && npx prisma generate

# View Prisma Studio (database GUI)
cd server && npx prisma studio

# Check TypeScript errors
cd server && npx tsc --noEmit

# Test production build locally
pnpm run build && pnpm run preview

# Start local PostgreSQL
docker-compose up -d

# View database in Prisma Studio
cd server && npx prisma studio
```

---

## Next Steps After Deployment

1. ✅ Set up domain (if using custom domain)
2. ✅ Configure email notifications (future enhancement)
3. ✅ Set up monitoring and alerts
4. ✅ Create admin user
5. ✅ Add initial treatments
6. ✅ Set availability schedule
7. ✅ Test complete booking flow
8. ✅ Share app URL with users!

---

**Deployment Complete! 🎉**

Your nails booking app is now live and ready to accept bookings!
