# Deployment Checklist

## Pre-Deployment

- [x] Project builds successfully
- [x] No TypeScript/ESLint errors
- [x] All dependencies installed
- [x] Environment variables configured
- [x] Database schema prepared (Supabase SQL migrations 0001–0005)
- [x] Meta tags and OpenGraph in `app/layout.jsx`
- [x] Dynamic sitemap in `app/sitemap.js`
- [x] Search engine indexing in `app/robots.js`
- [x] Custom brand favicon in `app/icon.svg`

## Vercel Deployment

### Step 1: Repository Status
Repository is connected to GitHub:
```bash
git remote -v
# origin  https://github.com/baidi-prob/potohar-real-estates.git
```

### Step 2: Connect to Vercel
- [ ] Sign up/in at https://vercel.com
- [ ] Connect GitHub account
- [ ] Import repository `baidi-prob/potohar-real-estates`

### Step 3: Configure Environment
Add the following in Vercel **Project Settings → Environment Variables**:
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `NEXT_PUBLIC_SITE_URL` (e.g. `https://potohar-real-estates.vercel.app`)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` (server-only)
- [ ] `OTP_HASH_SECRET` (server-only)
- [ ] `RESEND_API_KEY` (server-only)
- [ ] `RESEND_FROM_EMAIL` (server-only, e.g. `Potohar Real Estates <noreply@yourdomain.com>`)

### Step 4: Deploy
- [ ] Click "Deploy"
- [ ] Wait for build to complete (~2 minutes)
- [ ] Visit deployed URL
- [ ] Test all features

## Post-Deployment

### Testing Checklist
- [ ] Homepage loads correctly
- [ ] Search functionality works
- [ ] Filters work properly
- [ ] Authentication modal appears
- [ ] Demo mode works without Supabase
- [ ] Favorites feature works
- [ ] Property listing form functions
- [ ] Images load correctly
- [ ] Responsive on mobile
- [ ] Performance metrics acceptable

### Supabase Setup (if using database)
- [ ] Database tables created
- [ ] Row-level security policies enabled
- [ ] Google OAuth configured
- [ ] Email templates customized
- [ ] Backups enabled

### Domain & SSL
- [ ] Custom domain configured
- [ ] SSL certificate active
- [ ] Redirects working (www → non-www)
- [ ] Security headers set

### Monitoring
- [ ] Enable Vercel Analytics
- [ ] Set up error tracking (Sentry recommended)
- [ ] Monitor performance metrics
- [ ] Set up uptime monitoring

### SEO
- [ ] Sitemap indexed
- [ ] robots.txt configured
- [ ] Meta tags optimized
- [ ] OG images set
- [ ] Schema markup added

## Maintenance

### Weekly
- [ ] Check for errors in logs
- [ ] Monitor performance metrics
- [ ] Review user feedback

### Monthly
- [ ] Update dependencies: `npm update`
- [ ] Audit for vulnerabilities: `npm audit`
- [ ] Backup database (Supabase)
- [ ] Review analytics

### Quarterly
- [ ] Plan new features
- [ ] Optimize performance
- [ ] Security audit
- [ ] Refresh content

## Scaling (When Needed)

- [ ] Set up CDN for images (Cloudinary/ImgIX)
- [ ] Implement caching strategies
- [ ] Optimize database queries
- [ ] Add rate limiting
- [ ] Set up payment integration
- [ ] Implement advanced search (Algolia)

---

## Quick Commands Reference

```bash
# Development
npm run dev          # Start dev server

# Production
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Lint code

# Database
# - Run supabase/schema.sql in Supabase dashboard

# Deployment
git push origin main # Push to trigger Vercel deployment
```

---

## Deployed URLs

- **Production**: https://just-gulberg.vercel.app (example)
- **Staging**: https://just-gulberg-staging.vercel.app (optional)
- **GitHub**: https://github.com/yourusername/just-gulberg

---

**Last Updated**: August 19, 2026  
**Build Status**: ✅ Ready for Deployment
