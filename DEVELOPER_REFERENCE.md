# Developer Reference Guide

## Project Architecture Overview

```
Just Gulberg Marketplace
│
├─ Frontend (Next.js 14 + React 18)
│  ├─ JustGulbergApp.jsx (Main component with all features)
│  ├─ AuthPage.jsx (Authentication)
│  └─ Tailwind CSS + Lucide Icons
│
├─ Backend (Supabase - Optional)
│  ├─ PostgreSQL Database
│  ├─ Row-Level Security (RLS)
│  ├─ Storage (Images)
│  └─ Authentication
│
└─ Deployment (Vercel)
   └─ Automatic CI/CD on git push
```

---

## Available Functions

### Database Operations (`lib/listings.js`)

```javascript
// Fetch all listings for current user
fetchListingsFromDb(currentUserId)

// Create new listing
insertListing(listing, userId)

// Update existing listing
updateListing(id, listing, userId)

// Delete listing
removeListing(id)

// Upload property image
uploadPropertyImage(file, userId)

// Get user profile
getProfile(userId)

// Get user's favorite listings
fetchFavoritesFromDb(userId)

// Add/remove favorite
toggleFavoriteInDb(userId, propertyId, isCurrentlyFav)

// Update user profile
upsertProfile(userId, { fullName, phone, email })
```

### Formatting Utilities (`lib/format.js`)

```javascript
// Convert crores/lakhs to display price
buildDisplayPrice(crores, lakhs)  // Returns: "2 Crore 50 Lakh"

// Convert crores/lakhs to PKR amount
buildPricePKR(crores, lakhs)  // Returns: 25000000 (PKR)

// Format relative dates
formatRelativeDate(dateStr)  // Returns: "2 hours ago"
```

### Supabase Client (`lib/supabase/client.js`)

```javascript
// Check if Supabase is configured
isSupabaseConfigured()  // Returns: boolean

// Get Supabase client instance
getSupabase()  // Returns: SupabaseClient
```

---

## Component Props & State

### JustGulbergApp Component

**Main Navigation States**
- `'home'` - Browse listings
- `'list_now'` - Create new listing
- `'my_listings'` - View user's listings
- `'account'` - User profile & settings

**Key State Variables**

```javascript
// Authentication
const [isLoggedIn, setIsLoggedIn] = useState(false)
const [currentUser, setCurrentUser] = useState(null)
const [authUserId, setAuthUserId] = useState(null)

// Listings
const [listings, setListings] = useState([])
const [favorites, setFavorites] = useState([])

// Filters
const [searchQuery, setSearchQuery] = useState('')
const [sectorFilter, setSectorFilter] = useState('All')
const [blockFilter, setBlockFilter] = useState('All')
const [sizeFilter, setSizeFilter] = useState('All')
const [typeFilter, setTypeFilter] = useState('All')
const [featureFilter, setFeatureFilter] = useState('All Features')
const [maxPrice, setMaxPrice] = useState(400000000)
const [sortOrder, setSortOrder] = useState('newest')

// Form
const [newListing, setNewListing] = useState({...})
```

### AuthPage Component

**Props**
```javascript
{
  isOpen: boolean,                    // Show/hide modal
  onClose: function,                  // Close handler
  onAuthSuccess: function,            // Success callback
  reason: 'list_property' | 'my_listings' | 'account',
  initialMode: 'signup' | 'login'
}
```

---

## Database Schema

### Tables

#### `profiles`
- `id` (UUID, Primary Key, FK to auth.users)
- `full_name` (Text)
- `phone` (Text)
- `email` (Text)
- `avatar_url` (Text)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

#### `listings`
- `id` (UUID, Primary Key)
- `user_id` (UUID, FK to profiles)
- `title` (Text, Required)
- `sector` (Text, Required)
- `block` (Text, Required)
- `size` (Text, Required)
- `type` (Text, Required)
- `feature` (Text, Default: 'Standard')
- `price_pkr` (Integer, Required)
- `display_price` (Text, Required)
- `location` (Text, Required)
- `description` (Text)
- `seller_name` (Text, Required)
- `seller_phone` (Text, Required)
- `image_url` (Text, Required)
- `status` (Text, Default: 'active')
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

#### `favorites`
- `user_id` (UUID, FK to profiles)
- `property_id` (UUID, FK to listings)
- `created_at` (Timestamp)
- **Primary Key**: (user_id, property_id)

---

## Property Types & Constants

### Sectors
```javascript
const SECTORS = [
  'Gulberg Residencia',
  'Gulberg Greens'
]
```

### Residencia Blocks
```javascript
const RESIDENCIA_BLOCKS = [
  'Block A', 'Block B', 'Block C', 'Block E', 'Block F', 'Block G',
  'Block H', 'Block I', 'Block J', 'Block K', 'Block L', 'Block M',
  'Block N', 'Block O', 'Block P', 'Block Q', 'Block R', 'Block S',
  'Block T', 'Block V'
  // Note: Blocks D & U excluded per specification
]
```

### Greens Blocks
```javascript
const GREENS_BLOCKS = [
  'Executive Block', 'Block A', 'Block B', 'Block C', 'Block D', 'Block E'
]
```

### Property Sizes
```javascript
const RESIDENCIA_SIZES = [
  '5 Marla', '7 Marla', '10 Marla', '12 Marla', '1 Kanal', '2 Kanal'
]

const GREENS_SIZES = [
  '4 Kanal', '5 Kanal', '10 Kanal'
]
```

### Property Types
```javascript
const PROPERTY_TYPES = ['Plot', 'Built']
```

### Features
```javascript
const FEATURE_CATEGORIES = [
  'All Features',
  'Corner',
  'Main Road',
  'Park Side',
  'Corner + Park Side',
  'Standard'
]
```

---

## Environment Variables

### Required for Demo Mode
None - app works with default data

### Optional for Full Features
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

---

## API Endpoints (if needed for custom backend)

The app uses Supabase client library directly. To replace with custom API:

**Suggested endpoints:**
```
GET    /api/listings              # Fetch all listings
POST   /api/listings              # Create listing
GET    /api/listings/:id          # Get single listing
PATCH  /api/listings/:id          # Update listing
DELETE /api/listings/:id          # Delete listing

GET    /api/profile               # Get user profile
POST   /api/profile               # Update profile

GET    /api/favorites             # Get favorites
POST   /api/favorites/:propertyId # Add favorite
DELETE /api/favorites/:propertyId # Remove favorite

POST   /api/upload                # Upload image
```

---

## Performance Optimization Tips

1. **Image Optimization**
   - Next.js Image component for automatic optimization
   - Lazy loading for off-screen images
   - Responsive images with srcSet

2. **Bundle Size**
   - Current: ~79 kB (optimized)
   - Tree-shaking removes unused code
   - Dynamic imports for route-based code splitting

3. **Database Queries**
   - Use indexes on frequently filtered fields
   - Implement pagination for large datasets
   - Cache listings with revalidation

4. **Caching Strategy**
   - ISR (Incremental Static Regeneration) for listings
   - Client-side caching for frequently accessed data
   - Browser cache headers (max-age, etag)

---

## Debugging Tips

### Enable Supabase Logging
```javascript
const supabase = getSupabase()
supabase.removeAllSubscriptions()  // Clear subscriptions if needed
```

### Browser Console
- Use `isSupabaseConfigured()` to check setup
- Check auth state: `getSupabase().auth.getSession()`
- Monitor network requests in DevTools

### Common Issues

**"Supabase not configured"**
- Add credentials to `.env.local`
- Restart dev server
- App works in demo mode without credentials

**"Port already in use"**
```bash
npm start -- -p 3001
```

**"Dependencies conflict"**
```bash
npm install --legacy-peer-deps
```

---

## Testing Checklist

- [ ] Browse listings works
- [ ] Search filters correctly
- [ ] Sort by price works
- [ ] Authentication flow
- [ ] Create listing
- [ ] Edit listing
- [ ] Delete listing
- [ ] Add to favorites
- [ ] Sign out
- [ ] Mobile responsive
- [ ] Image loading
- [ ] Performance (< 3s load)

---

## Useful Libraries

| Package | Version | Purpose |
|---------|---------|---------|
| next | 14.2.25 | React framework |
| react | 18.2.0 | UI library |
| tailwindcss | 3.4.1 | Styling |
| lucide-react | 0.344.0 | Icons |
| @supabase/supabase-js | 2.49.1 | Backend |

---

**Created**: August 19, 2026  
**Status**: ✅ Complete
