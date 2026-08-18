# Potohar Real Estates

**Real estate ko asaan banayen**

A Next.js property marketplace for **Gulberg Greens** (farmhouses) and **Gulberg Residencia** (plots & built houses) in Islamabad. Built for **Potohar Real Estates** — browse listings as a guest, sign in to list and manage your own properties.

## What This App Does

| Area | Description |
|------|-------------|
| **Home** | Browse properties with search, filters, and sorting |
| **List Now (+)** | Post a new plot, house, or farmhouse (requires sign-in) |
| **My Listings** | View and delete your own published ads (requires sign-in) |
| **Account** | Seller profile, active listing count, sign out |

**Guest access:** Anyone can search, browse, and open full property details without an account.  
**Seller access:** Create a free account to post or manage your ads.

## Property Coverage

### Gulberg Residencia (Blocks A–V)
Blocks: A, B, C, E, F, G, H, I, J, K, L, M, N, O, P, Q, R, S, T, V *(D & U excluded)*  
Sizes: 5 Marla, 7 Marla, 10 Marla, 12 Marla, 1 Kanal, 2 Kanal  
Types: Plots and built houses

### Gulberg Greens (Farmhouses)
Blocks: Executive Block, Block A, B, C, D, E  
Sizes: 4 Kanal, 5 Kanal, 10 Kanal  
Types: Plots and built farmhouses

### Feature categories
Corner · Main Road · Park Side · Corner + Park Side · Standard

## Features

### Marketplace & discovery
- Sticky header with quick search (desktop) and mobile search bar
- Center-aligned **Potohar Real Estates** hero branding
- Sector toggles: All Sectors · Gulberg Residencia · Gulberg Greens
- Filters: block, size, property type (Plot / Built), feature category
- **Sort by** control in the Filter Properties header (newest, price high → low, price low → high)
- Reset-all-filters control
- Property cards with sector/block badges, feature tags, favorites (heart), and listing metadata
- **Click any property card** to open a full-detail modal (image, specs, description, seller info)
- Detail modal: rounded card, Call Seller, WhatsApp, favorite, and delete (for your own listings)
- Empty state when no properties match filters
- Contact Seller quick modal with direct **Call** and **WhatsApp** actions

### List a property
- Full listing form: title, sector, block, size, type, feature, price (Crores + Lakhs in PKR), location, description, contact phone (+92)
- Auto-generated title fallback if left blank
- Success message and redirect to My Listings after publish
- Seller phone pre-filled from logged-in account when available

### Authentication (sign-in link — `AuthPage.jsx`)
Real **Supabase Auth** with passwordless email sign-in links (magic links). No passwords, no Google.

- **New account** vs **Already registered** tabs
- **How it works** 3-step guide when listing a property
- New account collects name, email, and mobile number (Pakistan `+92`)
- Sends a one-time **sign-in link** to the email — click it to be signed in
- Check-your-email screen with a **Resend link** option (60s cooldown)
- Sessions last 1 hour and auto-refresh in the background
- Signed-in users get their profile stored in Supabase, and the auth modal auto-closes

> Note: On the Supabase free plan, email templates can't be edited without custom SMTP, so the email shows a link rather than a 6-digit code. The sign-in link flow works on the default templates. (If custom SMTP is added later, the Magic Link template can be changed to show `{{ .Token }}` for a typed-code experience.)

### Account dashboard
- Verified seller badge and profile avatar
- Account status, region scope, and active listing count
- Quick actions: Post New Listing · Sign Out

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **UI:** React 18, Tailwind CSS 3
- **Icons:** Lucide React
- **Fonts:** Plus Jakarta Sans, JetBrains Mono (via Google Fonts)
- **Backend:** Supabase (Postgres + Auth) — auth, listings, favorites, and profiles are stored in the database, not local state.

## Project Structure

```
app/
  layout.jsx          # Root layout, metadata, dark theme
  page.jsx            # Home page → JustGulbergApp
  listings/[id]/      # Statically generated listing detail pages (SEO)
  sitemap.js          # Dynamic sitemap.xml
  robots.js           # robots.txt
  globals.css         # Tailwind + glass card / animation utilities
components/
  JustGulbergApp.jsx  # Marketplace UI, filters, property detail modal, listings
  AuthPage.jsx        # Sign-in link auth modal (Supabase magic link)
lib/
  supabase/client.js  # Browser Supabase client (singleton)
  supabase/server.js  # Server-side client for SSR/static generation
  supabase/config.js  # Config detection (placeholder values = not configured)
  listings.js         # DB helpers: listings, favorites, profiles
  listings.server.js  # Server-side listing fetch for /listings/[id]
  site.js             # getSiteUrl() for redirects / OpenGraph / sitemap
supabase/
  schema.sql          # Tables, RLS policies, triggers
  migrations/         # Versioned SQL migrations
```

## Getting Started

### 1. Configure Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Run the SQL in `supabase/schema.sql` (or the migrations in `supabase/migrations/`) in the **SQL Editor** to create the tables and RLS policies.
3. **Authentication → Sign In / Providers → User Signups:** turn **OFF** *Confirm email*. This makes new accounts get the sign-in-link email immediately instead of a "confirm your email" email. (Optional: under the Email provider, set *Email OTP length* to `6`.)
4. **Authentication → URL Configuration:** set the **Site URL** to your production domain (e.g. `https://potohar-real-estates.vercel.app`) and add your local/preview URLs to **Redirect URLs**.
5. **Project Settings → API:** copy the project URL and the public anon key.

### 2. Environment variables

Copy the example file and fill in your values:

```bash
cp .env.example .env.local
```

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

The same three variables must be added in **Vercel → Project Settings → Environment Variables** for production (with `NEXT_PUBLIC_SITE_URL` set to the production domain).

### 3. Run locally

Install dependencies (if needed):

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

Build for production:

```bash
npm run build
npm start
```

## Deploying to Vercel

1. Push this repository to GitHub.
2. In Vercel, **Add New → Project** and import the repo (framework auto-detected as Next.js).
3. Add the three `NEXT_PUBLIC_*` environment variables.
4. Deploy. Vercel auto-rebuilds on every push to `main`.

## Quick Test Flow

1. Open the app and browse listings on **Home** without signing in.
2. **Click a property card** to see full details (price, specs, description, seller).
3. Use sector buttons and filters; sort from the **Filter Properties** row.
4. Click **Contact Seller** or use Call / WhatsApp from the detail modal.
5. Click **List Now (+)** → the sign-in modal opens with the 3-step guide.
6. Enter your email (name + phone for a new account) → **Email me a sign-in link**.
7. Open the email and click **Sign in** → you're signed in and the modal closes.
8. Fill the listing form and publish → listing appears under **My Listings**.
9. Delete your listing from the card or detail modal, or manage your account under **Account**.

## Notes

- Listings, profiles, and favorites are stored in **Supabase** and protected by Row Level Security.
- The database starts empty — listings are created by signed-in users through the app.
- Listing detail pages are statically generated (`/listings/[id]`) with per-listing metadata, Open Graph tags, JSON-LD structured data, and a dynamic `sitemap.xml`.
- Sign-in links redirect back to whatever origin the user signed in from, so the flow works on `localhost`, the platform preview, and the production domain alike.

---

© 2026 Potohar Real Estates · Gulberg Greens & Residencia Portal
