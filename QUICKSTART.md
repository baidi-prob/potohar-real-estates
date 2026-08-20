# Quick Start Guide

## 🚀 Get Started in 2 Minutes

### Development Mode
```bash
npm run dev
```
Open: http://localhost:3000

### Production Build
```bash
npm run build
npm start
```

---

## 📋 What's Included

✅ Complete Next.js 14 project with React 18  
✅ Tailwind CSS styling  
✅ Supabase integration (optional)  
✅ Authentication system  
✅ Property listing system  
✅ Search & filter functionality  
✅ Favorites/wishlist  
✅ Responsive design  

---

## 🔧 Optional: Setup Database

1. Create account at https://app.supabase.com
2. Create new project
3. Copy SQL from `supabase/schema.sql`
4. Paste in Supabase SQL Editor and run
5. Get credentials and add to `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=your-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
```

6. Reload and features will sync to database

---

## 🌐 Deploy to Vercel (Free)

1. Push to GitHub
2. Go to https://vercel.com
3. Import repository
4. Add environment variables
5. Deploy (automatic on every git push)

---

## 📂 Key Files

- `app/page.jsx` - Home page
- `components/JustGulbergApp.jsx` - Main app with all features
- `lib/listings.js` - Database operations
- `supabase/schema.sql` - Database setup

---

## ✨ Features

- Browse properties in Gulberg
- Search and filter listings
- List new properties
- Save favorites
- User authentication
- Edit/delete your listings

---

Ready to go! Run `npm run dev` to start building.
