# Deployment Checklist

Quick reference checklist for deploying the Nails Booking App. See `DEPLOYMENT.md` for detailed instructions.

## Pre-Deployment

- [ ] Code pushed to GitHub repository
- [ ] All tests passing locally
- [ ] Environment variables documented
- [ ] Database migrations tested locally

## Database Setup

- [ ] Create PostgreSQL database (Supabase or Railway)
- [ ] Copy `DATABASE_URL` connection string
- [ ] Run migrations: `cd server && npx prisma migrate deploy`
- [ ] Verify database schema in Prisma Studio

## Backend Deployment (Railway)

- [ ] Create Railway account and new project
- [ ] Connect GitHub repository
- [ ] Set root directory to `server`
- [ ] Add environment variables:
  - [ ] `DATABASE_URL`
  - [ ] `JWT_SECRET` (generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
  - [ ] `CORS_ORIGIN=http://localhost:5173` (temporary, will update later)
  - [ ] `NODE_ENV=production`
- [ ] Deploy and wait for build
- [ ] Generate public domain
- [ ] Test health endpoint: `https://your-app.railway.app/health`
- [ ] Copy backend URL for next step

## Frontend Deployment (Vercel)

- [ ] Create Vercel account and new project
- [ ] Import GitHub repository
- [ ] Set framework preset to **Vite**
- [ ] Add environment variable:
  - [ ] `VITE_API_URL=https://your-app.railway.app/api`
- [ ] Deploy and wait for build
- [ ] Copy Vercel URL (e.g., `https://your-app.vercel.app`)

## Update Backend CORS

- [ ] Go back to Railway → Variables
- [ ] Update `CORS_ORIGIN` to Vercel URL:
  ```
  CORS_ORIGIN=https://your-app.vercel.app
  ```
  Or multiple origins:
  ```
  CORS_ORIGIN=https://your-app.vercel.app,https://yourdomain.com
  ```
- [ ] Railway auto-redeploys with new config

## Post-Deployment Setup

- [ ] Create admin user (Supabase Auth or SQL)
- [ ] Set admin role in profiles table
- [ ] Log in as admin
- [ ] Add treatments (Admin → Treatments)
- [ ] Set availability (Admin → Available Times)
- [ ] Test booking flow end-to-end

## Testing

- [ ] Frontend loads without errors
- [ ] Backend health check returns 200 OK
- [ ] Admin can log in
- [ ] Admin can create treatments
- [ ] Admin can set availability
- [ ] Admin can create appointments
- [ ] Customer can view available slots
- [ ] Customer can book appointment
- [ ] Booked slots appear disabled
- [ ] Admin can view appointments list
- [ ] Admin can cancel appointments

## Monitoring Setup

- [ ] Set up uptime monitoring (UptimeRobot, Better Uptime)
- [ ] Configure alerts for downtime
- [ ] Bookmark Railway and Vercel dashboards
- [ ] Test log access for both services

## Security Verification

- [ ] JWT_SECRET is strong (32+ chars)
- [ ] No secrets in source code
- [ ] CORS only allows your domains
- [ ] HTTPS enabled (automatic)
- [ ] Database credentials secure
- [ ] Environment variables not exposed in frontend

## Optional Enhancements

- [ ] Custom domain setup
- [ ] SSL certificate configured (automatic with Vercel)
- [ ] Email notifications setup
- [ ] Backup strategy for database
- [ ] CDN for images (if using local images)

## Documentation

- [ ] Share app URL with stakeholders
- [ ] Document admin credentials securely
- [ ] Save all environment variables securely
- [ ] Note Railway and Vercel project URLs

## Rollback Plan

- [ ] Know how to rollback frontend (Vercel → Deployments → Promote)
- [ ] Know how to rollback backend (Railway → Deployments → Redeploy)
- [ ] Database backup taken before migrations

---

## Quick Commands

```bash
# Test production build locally
pnpm run build && pnpm run preview

# Build backend
cd server && npm run build

# Run migrations
cd server && npx prisma migrate deploy

# Generate JWT secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# View database
cd server && npx prisma studio
```

---

## Emergency Contacts

**Vercel Support**: https://vercel.com/support
**Railway Support**: https://railway.app/help
**Supabase Support**: https://supabase.com/support

---

## Estimated Time

- Database setup: ~10 minutes
- Backend deployment: ~15 minutes
- Frontend deployment: ~10 minutes
- Post-deployment setup: ~15 minutes
- **Total: ~50 minutes**

---

✅ **Deployment Complete!** Your app is live at: `https://your-app.vercel.app`
