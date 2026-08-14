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

### Authentication (modal — `AuthPage.jsx`)
Plain-language sign-in flow. Opens when listing, viewing My Listings, or opening Account while signed out.

- **New account** vs **Already registered** tabs
- **How it works** 3-step guide when listing a property
- **Sign in with Google** (simulated)
- **Email** or **Mobile** sign-in (Pakistan +92 for phone)
- Simple labels: your name, email, password, mobile number
- **Enter your code** step: 6-digit code with paste support and resend timer
- On-screen code notification with **Use this code** helper (demo mode)
- Forgot password flow (simulated)
- **Just trying? Skip sign-in (demo mode)** link at the bottom for quick testing

### Account dashboard
- Verified seller badge and profile avatar
- Account status, region scope, and active listing count
- Quick actions: Post New Listing · Sign Out

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **UI:** React 18, Tailwind CSS 3
- **Icons:** Lucide React
- **Fonts:** Plus Jakarta Sans, JetBrains Mono (via Google Fonts)
- **State:** React hooks + Supabase (Postgres) backend — auth, listings, and favorites are stored in the database, not local state.

## Project Structure

```
app/
  layout.jsx          # Root layout, metadata, dark theme
  page.jsx            # Home page → JustGulbergApp
  globals.css         # Tailwind + glass card / animation utilities
components/
  JustGulbergApp.jsx  # Marketplace UI, filters, property detail modal, listings
  AuthPage.jsx        # Layman-friendly sign-in / register modal with code verification
```

## Getting Started

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

## Quick Test Flow

1. Open the app and browse sample listings on **Home** without signing in.
2. **Click a property card** to see full details (price, specs, description, seller).
3. Use sector buttons and filters; sort from the **Filter Properties** row.
4. Click **Contact Seller** or use Call / WhatsApp from the detail modal.
5. Click **List Now (+)** → sign-in modal opens with the simple 3-step guide.
6. Use **Skip sign-in (demo mode)** or complete email/mobile + code flow.
7. Fill the listing form and publish → listing appears under **My Listings**.
8. Delete your listing from the card or detail modal, or manage account under **Account**.

## Notes

- Listings and auth are backed by **Supabase** (Postgres + Auth). Set the env vars in `.env.local` (see `.env.local.example`) and run the SQL in `supabase/schema.sql` (or `supabase/migrations/`) to enable the live backend.
- The database starts empty — listings are created by signed-in users through the app.
- Listing detail pages are statically generated (`/listings/[id]`) with per-listing metadata, Open Graph tags, JSON-LD structured data, and a dynamic `sitemap.xml`.

---

© 2026 Potohar Real Estates · Gulberg Greens & Residencia Portal
