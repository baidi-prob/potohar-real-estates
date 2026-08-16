'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import AuthPage from './AuthPage';
import { getSupabase, isSupabaseConfigured } from '../lib/supabase/client';
import {
  fetchListingsFromDb,
  insertListing,
  updateListing,
  removeListing,
  uploadPropertyImage,
  getProfile,
  fetchFavoritesFromDb,
  toggleFavoriteInDb,
} from '../lib/listings';
import { buildDisplayPrice, buildPricePKR } from '../lib/format';
import {
  Home,
  PlusCircle,
  List,
  User,
  Search,
  Filter,
  MapPin,
  Phone,
  MessageSquare,
  ShieldCheck,
  Building,
  CheckCircle2,
  X,
  Plus,
  Trash2,
  Tag,
  SlidersHorizontal,
  LogOut,
  Sparkles,
  ChevronRight,
  Maximize2,
  Heart,
  Share2,
  PhoneCall,
  Info,
  LogIn,
  Edit3,
} from 'lucide-react';

// Exact Block Configurations as per User Specification
const RESIDENCIA_BLOCKS = [
  'Block A', 'Block B', 'Block C', 'Block E', 'Block F', 'Block G',
  'Block H', 'Block I', 'Block J', 'Block K', 'Block L', 'Block M',
  'Block N', 'Block O', 'Block P', 'Block Q', 'Block R', 'Block S',
  'Block T', 'Block V'
]; // Excluded D & U as instructed

const GREENS_BLOCKS = [
  'Executive Block', 'Block A', 'Block B', 'Block C', 'Block D', 'Block E'
];

const RESIDENCIA_SIZES = [
  '5 Marla', '7 Marla', '10 Marla', '12 Marla', '1 Kanal', '2 Kanal'
];

const GREENS_SIZES = [
  '4 Kanal', '5 Kanal', '10 Kanal'
];

const FEATURE_CATEGORIES = [
  'All Features', 'Corner', 'Main Road', 'Park Side', 'Corner + Park Side', 'Standard'
];

export default function JustGulbergApp() {
  const supabaseLive = isSupabaseConfigured();

  // Navigation State: 'home' | 'list_now' | 'my_listings' | 'account'
  const [activeTab, setActiveTab] = useState('home');

  // Auth & session
  const [authUserId, setAuthUserId] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalReason, setAuthModalReason] = useState('list_property');
  const [listingsLoading, setListingsLoading] = useState(supabaseLive);
  const [isPublishing, setIsPublishing] = useState(false);
  const [listingImageFile, setListingImageFile] = useState(null);

  // Trigger Auth Modal for Listing Property
  const handleListNowClick = () => {
    if (!isLoggedIn) {
      setAuthModalReason('list_property');
      setShowAuthModal(true);
    } else {
      setActiveTab('list_now');
    }
  };

  // Trigger Auth Modal for My Listings
  const handleMyListingsClick = () => {
    if (!isLoggedIn) {
      setAuthModalReason('my_listings');
      setShowAuthModal(true);
    } else {
      setActiveTab('my_listings');
    }
  };

  // Trigger Auth Modal for Account / Sign In
  const handleAccountClick = () => {
    if (!isLoggedIn) {
      setAuthModalReason('account');
      setShowAuthModal(true);
    } else {
      setActiveTab('account');
    }
  };

  // Handle successful login/signup from Auth Modal
  const handleAuthSuccess = (userData) => {
    setIsLoggedIn(true);
    setCurrentUser(userData);
    setAuthUserId(userData?.id || null);
    setShowAuthModal(false);

    if (userData?.phone) {
      setNewListing((prev) => ({
        ...prev,
        sellerPhone: userData.phone.replace('+92 ', '').replace('+92', '').trim(),
        sellerName: userData.name || 'Verified Owner',
      }));
    }

    if (authModalReason === 'list_property') {
      setActiveTab('list_now');
    } else if (authModalReason === 'my_listings') {
      setActiveTab('my_listings');
    } else {
      setActiveTab('account');
    }
  };

  // Handle user Sign Out
  const handleUserSignOut = async () => {
    const supabase = getSupabase();
    if (supabase) await supabase.auth.signOut();
    setIsLoggedIn(false);
    setCurrentUser(null);
    setAuthUserId(null);
    setActiveTab('home');
  };

  // Listings State
  const [listings, setListings] = useState([]);
  const [favorites, setFavorites] = useState([]);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [sectorFilter, setSectorFilter] = useState('All'); // 'All' | 'Gulberg Residencia' | 'Gulberg Greens'
  const [blockFilter, setBlockFilter] = useState('All');
  const [sizeFilter, setSizeFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All'); // 'All' | 'Plot' | 'Built'
  const [featureFilter, setFeatureFilter] = useState('All Features');
  const [maxPrice, setMaxPrice] = useState(400000000); // Max PKR
  const [sortOrder, setSortOrder] = useState('newest'); // 'newest' | 'price_high' | 'price_low'

  // Always fetch from the database; all filtering/sorting runs in Postgres.
  // Kept in a ref so the auth listener always calls the latest version.
  const refreshRef = useRef(null);
  refreshRef.current = async () => {
    if (!supabaseLive) {
      setListings([]);
      setListingsLoading(false);
      return;
    }
    setListingsLoading(true);
    try {
      const myListingsOnly = activeTab === 'my_listings';
      const data = await fetchListingsFromDb({
        currentUserId: authUserId,
        sector: sectorFilter,
        block: blockFilter,
        size: sizeFilter,
        type: typeFilter,
        feature: featureFilter,
        maxPrice,
        searchQuery,
        sortOrder,
        myListingsOnly,
      });
      if (data) setListings(data);
      if (authUserId) {
        const favs = await fetchFavoritesFromDb(authUserId);
        setFavorites(favs);
      }
    } catch (err) {
      console.error('Failed to load listings:', err);
    } finally {
      setListingsLoading(false);
    }
  };

  // Debounced refetch whenever filters / sort / tab / signed-in user change
  useEffect(() => {
    if (!supabaseLive) {
      setListings([]);
      setListingsLoading(false);
      return undefined;
    }
    setListingsLoading(true);
    const t = setTimeout(() => {
      if (refreshRef.current) refreshRef.current();
    }, 300);
    return () => clearTimeout(t);
  }, [supabaseLive, authUserId, activeTab, sectorFilter, blockFilter, sizeFilter, typeFilter, featureFilter, maxPrice, searchQuery, sortOrder]);

  // Session restore + live auth state listener
  useEffect(() => {
    if (!supabaseLive) return undefined;

    const supabase = getSupabase();
    if (!supabase) return undefined;

    let cancelled = false;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return;
      if (session?.user) {
        const uid = session.user.id;
        setAuthUserId(uid);
        setIsLoggedIn(true);
        getProfile(uid).then((profile) => {
          if (cancelled) return;
          setCurrentUser({
            id: uid,
            email: session.user.email,
            phone: profile?.phone || session.user.user_metadata?.phone || '',
            name: profile?.full_name || session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
          });
        });
      }
      if (refreshRef.current) refreshRef.current();
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      console.log('[AUTH-DEBUG] event:', event, 'session:', !!session, session ? `expires_at=${session.expires_at} now=${Date.now() / 1000}` : '');
      if (session?.user) {
        setAuthUserId(session.user.id);
        setIsLoggedIn(true);
      } else if (event === 'SIGNED_OUT') {
        console.log('[AUTH-DEBUG] SIGNED_OUT fired with no session');
        setAuthUserId(null);
        setIsLoggedIn(false);
        setCurrentUser(null);
        setFavorites([]);
      }
      if (refreshRef.current) refreshRef.current();
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [supabaseLive]);

  // Contact Seller Modal State
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [selectedProperty, setSelectedProperty] = useState(null);

  // New Listing Form State
  const [newListing, setNewListing] = useState({
    title: '',
    sector: 'Gulberg Residencia',
    block: 'Block A',
    size: '10 Marla',
    type: 'Plot',
    feature: 'Standard',
    priceCrores: '',
    priceLakhs: '',
    location: '',
    description: '',
    sellerName: 'Property Owner',
    sellerPhone: '+92 300 1234567',
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80'
  });
  const [listingSuccessMsg, setListingSuccessMsg] = useState('');

  // Available Blocks based on Sector choice
  const availableBlocks = useMemo(() => {
    if (sectorFilter === 'Gulberg Residencia') return RESIDENCIA_BLOCKS;
    if (sectorFilter === 'Gulberg Greens') return GREENS_BLOCKS;
    return [...RESIDENCIA_BLOCKS, ...GREENS_BLOCKS];
  }, [sectorFilter]);

  // Available Sizes based on Sector choice
  const availableSizes = useMemo(() => {
    if (sectorFilter === 'Gulberg Residencia') return RESIDENCIA_SIZES;
    if (sectorFilter === 'Gulberg Greens') return GREENS_SIZES;
    return [...RESIDENCIA_SIZES, ...GREENS_SIZES];
  }, [sectorFilter]);

  // Toggle Favorite
  const toggleFavorite = async (id) => {
    if (!isLoggedIn || !authUserId) {
      setAuthModalReason('account');
      setShowAuthModal(true);
      return;
    }

    const isCurrentlyFav = favorites.includes(id);
    setFavorites((prev) =>
      isCurrentlyFav ? prev.filter((item) => item !== id) : [...prev, id]
    );

    if (supabaseLive && authUserId) {
      try {
        await toggleFavoriteInDb(authUserId, id, isCurrentlyFav);
      } catch (err) {
        console.error('Failed to update favorite in database:', err);
      }
    }
  };

  // Edit Listing State
  const [editingProperty, setEditingProperty] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [editImageFile, setEditImageFile] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editSuccessMsg, setEditSuccessMsg] = useState('');

  const handleOpenEditModal = (item) => {
    setEditingProperty(item);
    const pkr = item.pricePKR || 0;
    const crores = Math.floor(pkr / 10000000);
    const remainderLakhs = Math.round((pkr % 10000000) / 100000);

    setEditForm({
      title: item.title,
      sector: item.sector,
      block: item.block,
      size: item.size,
      type: item.type,
      feature: item.feature,
      priceCrores: crores > 0 ? crores.toString() : '',
      priceLakhs: remainderLakhs > 0 ? remainderLakhs.toString() : '',
      location: item.location,
      description: item.description,
      sellerName: item.sellerName,
      sellerPhone: item.sellerPhone?.replace('+92 ', '').replace('+92', '').trim() || '',
      image: item.image,
    });
  };

  const handleUpdateListing = async (e) => {
    e.preventDefault();
    if (!editingProperty || !editForm) return;

    const totalPKR = buildPricePKR(editForm.priceCrores, editForm.priceLakhs);
    if (totalPKR <= 0) {
      alert('Please enter a valid property price.');
      return;
    }

    const displayP = buildDisplayPrice(editForm.priceCrores, editForm.priceLakhs);
    const phoneRaw = editForm.sellerPhone.trim();
    const sellerPhone = phoneRaw.startsWith('+92') ? phoneRaw : `+92 ${phoneRaw}`;

    const listingPayload = {
      title: editForm.title || `${editForm.size} ${editForm.type} in ${editForm.block}`,
      sector: editForm.sector,
      block: editForm.block,
      size: editForm.size,
      type: editForm.type,
      feature: editForm.feature,
      pricePKR: totalPKR,
      displayPrice: displayP,
      location: editForm.location || `${editForm.block}, ${editForm.sector}, Islamabad`,
      description: editForm.description || 'Verified seller listing in Gulberg Islamabad.',
      sellerName: editForm.sellerName || currentUser?.name || 'Verified Owner',
      sellerPhone,
      image: editForm.image,
    };

    setIsUpdating(true);

    try {
      let imageUrl = listingPayload.image;
      if (editImageFile) {
        imageUrl = await uploadPropertyImage(editImageFile, authUserId);
      }
      listingPayload.image = imageUrl;

      const updated = await updateListing(editingProperty.id, listingPayload, authUserId);
      setListings((prev) => prev.map((item) => (item.id === editingProperty.id ? updated : item)));
      setSelectedProperty((prev) => (prev?.id === editingProperty.id ? updated : prev));

      setEditSuccessMsg('Property listing updated successfully!');
      setTimeout(() => {
        setEditSuccessMsg('');
        setEditingProperty(null);
        setEditForm(null);
        setEditImageFile(null);
      }, 1200);
    } catch (err) {
      console.error(err);
      alert(err.message || 'Could not update listing. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Submit New Listing Form
  const handleCreateListing = async (e) => {
    e.preventDefault();

    const totalPKR = buildPricePKR(newListing.priceCrores, newListing.priceLakhs);

    if (totalPKR <= 0) {
      alert('Please enter a valid property price.');
      return;
    }

    const displayP = buildDisplayPrice(newListing.priceCrores, newListing.priceLakhs);
    const phoneRaw = newListing.sellerPhone.trim();
    const sellerPhone = phoneRaw.startsWith('+92') ? phoneRaw : `+92 ${phoneRaw}`;

    const listingPayload = {
      title: newListing.title || `${newListing.size} ${newListing.type} in ${newListing.block}`,
      sector: newListing.sector,
      block: newListing.block,
      size: newListing.size,
      type: newListing.type,
      feature: newListing.feature,
      pricePKR: totalPKR,
      displayPrice: displayP,
      location: newListing.location || `${newListing.block}, ${newListing.sector}, Islamabad`,
      description: newListing.description || 'Verified seller listing in Gulberg Islamabad.',
      sellerName: newListing.sellerName || currentUser?.name || 'Verified Owner',
      sellerPhone,
      image: newListing.image,
    };

    setIsPublishing(true);

    try {
      if (!supabaseLive) {
        alert('Supabase is not connected yet. Add the Supabase keys to .env.local first.');
        return;
      }

      let imageUrl = listingPayload.image;
      if (listingImageFile) {
        imageUrl = await uploadPropertyImage(listingImageFile, authUserId);
      }
      listingPayload.image = imageUrl;
      const created = await insertListing(listingPayload, authUserId);
      setListings((prev) => [created, ...prev]);

      setListingSuccessMsg('Your property has been published on Potohar Real Estates!');
      setListingImageFile(null);

      setTimeout(() => {
        setListingSuccessMsg('');
        setActiveTab('my_listings');
      }, 1500);

      setNewListing({
        title: '',
        sector: 'Gulberg Residencia',
        block: 'Block A',
        size: '10 Marla',
        type: 'Plot',
        feature: 'Standard',
        priceCrores: '',
        priceLakhs: '',
        location: '',
        description: '',
        sellerName: currentUser?.name || 'Property Owner',
        sellerPhone: currentUser?.phone?.replace('+92 ', '') || '300 1234567',
        image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80',
      });
    } catch (err) {
      console.error(err);
      alert(err.message || 'Could not publish listing. Please try again.');
    } finally {
      setIsPublishing(false);
    }
  };

  // Delete User's Own Listing
  const handleDeleteListing = async (id) => {
    if (!confirm('Are you sure you want to delete this property listing?')) return;

    try {
      await removeListing(id);
      setListings((prev) => prev.filter((item) => item.id !== id));
      setSelectedProperty((prev) => (prev?.id === id ? null : prev));
    } catch (err) {
      alert(err.message || 'Could not delete listing.');
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* HEADER / NAVIGATION BAR */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-xl border-b border-slate-800 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between gap-4 py-3">
          


          {/* Quick Search Input */}
          <div className="hidden md:flex flex-1 max-w-md mx-4 relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Block A, 1 Kanal plot, Farmhouse..."
              className="w-full h-10 pl-10 pr-4 rounded-xl bg-slate-800/80 border border-slate-700/80 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-amber-500/80"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setActiveTab('home')}
              className={`px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                activeTab === 'home'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>Home</span>
            </button>

            <button
              onClick={handleListNowClick}
              className={`px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                activeTab === 'list_now'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span>List Now (+)</span>
            </button>

            <button
              onClick={handleMyListingsClick}
              className={`px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                activeTab === 'my_listings'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">My Listings</span>
              {listings.filter((l) => l.isMyListing).length > 0 && (
                <span className="ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] bg-slate-800 text-amber-400 font-bold border border-amber-500/30">
                  {listings.filter((l) => l.isMyListing).length}
                </span>
              )}
            </button>

            {isLoggedIn ? (
              <button
                onClick={handleAccountClick}
                className={`p-2 sm:px-3 sm:py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                  activeTab === 'account'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <User className="w-4 h-4 text-emerald-400" />
                <span className="hidden md:inline font-bold">
                  {currentUser?.name || currentUser?.email?.split('@')[0] || 'Account'}
                </span>
              </button>
            ) : (
              <button
                onClick={handleAccountClick}
                className="px-3 py-2 sm:px-4 sm:py-2 rounded-xl text-xs font-extrabold bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In / Register</span>
              </button>
            )}
          </nav>
        </div>
      </header>

      {/* MOBILE SEARCH BAR */}
      <div className="md:hidden px-4 py-2.5 bg-slate-900 border-b border-slate-800">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Block A, 1 Kanal plot, Farmhouse..."
            className="w-full h-10 pl-9 pr-4 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs placeholder-slate-500 focus:outline-none"
          />
        </div>
      </div>

      {/* TAB 1: HOME & MARKETPLACE FEED */}
      {(activeTab === 'home' || activeTab === 'my_listings') && (
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
          
          {/* Hero Banner / Page Intro */}
          <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 border border-slate-800 relative shadow-2xl text-center">
            <div className="absolute -top-24 -right-24 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 space-y-2">
              <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white uppercase whitespace-nowrap">
                Potohar Real Estates
              </h1>
              <p className="text-xs sm:text-sm md:text-base font-semibold text-amber-400 tracking-[0.25em] uppercase font-mono border-t border-amber-500/30 pt-3 mt-1">
                Real estate ko asaan banayen
              </p>
            </div>
          </div>

          {/* ADVANCED FILTER SYSTEM */}
          {activeTab === 'home' && (
            <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
              
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 gap-3">
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <SlidersHorizontal className="w-4 h-4 text-amber-400" />
                  Filter Properties
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {(sectorFilter !== 'All' || blockFilter !== 'All' || sizeFilter !== 'All' || typeFilter !== 'All' || featureFilter !== 'All Features') && (
                    <button
                      onClick={() => {
                        setSectorFilter('All');
                        setBlockFilter('All');
                        setSizeFilter('All');
                        setTypeFilter('All');
                        setFeatureFilter('All Features');
                        setMaxPrice(400000000);
                        setSearchQuery('');
                      }}
                      className="text-xs text-amber-400 hover:text-amber-300 font-medium transition-colors"
                    >
                      Reset All Filters
                    </button>
                  )}
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-500 shrink-0">Sort by:</span>
                    <select
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value)}
                      className="h-8 px-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs font-medium focus:outline-none focus:border-amber-500 cursor-pointer"
                    >
                      <option value="newest">📅 Newest First</option>
                      <option value="price_high">💰 Price: High → Low</option>
                      <option value="price_low">💰 Price: Low → High</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTOR TOGGLE BUTTONS */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => { setSectorFilter('All'); setBlockFilter('All'); setSizeFilter('All'); }}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                    sectorFilter === 'All'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  All Sectors
                </button>
                <button
                  onClick={() => { setSectorFilter('Gulberg Residencia'); setBlockFilter('All'); setSizeFilter('All'); }}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    sectorFilter === 'Gulberg Residencia'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <Building className="w-3.5 h-3.5" />
                  Gulberg Residencia (A-V)
                </button>
                <button
                  onClick={() => { setSectorFilter('Gulberg Greens'); setBlockFilter('All'); setSizeFilter('All'); }}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    sectorFilter === 'Gulberg Greens'
                      ? 'bg-emerald-500 text-slate-950 font-bold shadow-md'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Gulberg Greens (Farmhouses)
                </button>
              </div>

              {/* FILTER DROPDOWNS GRID */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                
                {/* Block Selector */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Select Block
                  </label>
                  <select
                    value={blockFilter}
                    onChange={(e) => setBlockFilter(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500 font-medium"
                  >
                    <option value="All">All Blocks</option>
                    {availableBlocks.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                {/* Size Selector */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Select Size
                  </label>
                  <select
                    value={sizeFilter}
                    onChange={(e) => setSizeFilter(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500 font-medium"
                  >
                    <option value="All">All Sizes</option>
                    {availableSizes.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                {/* Property Type (Plot vs Built) */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Property Type
                  </label>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500 font-medium"
                  >
                    <option value="All">All Types (Plot & Built)</option>
                    <option value="Plot">Plot Only</option>
                    <option value="Built">Built Property Only</option>
                  </select>
                </div>

                {/* Category Feature (Corner, Main Road, Park Side) */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Feature Category
                  </label>
                  <select
                    value={featureFilter}
                    onChange={(e) => setFeatureFilter(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500 font-medium"
                  >
                    {FEATURE_CATEGORIES.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'my_listings' && (
            <div className="flex items-center justify-end gap-2 text-xs">
              <span className="text-slate-500 shrink-0">Sort by:</span>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="h-8 px-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs font-medium focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="newest">📅 Newest First</option>
                <option value="price_high">💰 Price: High → Low</option>
                <option value="price_low">💰 Price: Low → High</option>
              </select>
            </div>
          )}

          {/* PROPERTY GRID */}
          {!supabaseLive && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm text-center">
              Supabase is not connected yet. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local to load live listings.
            </div>
          )}
          {listingsLoading ? (
            <div className="text-center py-16 text-slate-400 text-sm">Loading properties...</div>
          ) : listings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedProperty(item)}
                  className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden hover:border-slate-700 transition-all hover:-translate-y-1 shadow-xl flex flex-col group cursor-pointer"
                >
                  {/* Property Image & Badges */}
                  <div className="relative h-52 w-full overflow-hidden bg-slate-800">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/30" />
                    
                    {/* Sector Badge */}
                    <span className={`absolute top-3 left-3 px-2.5 py-1 rounded-lg text-[11px] font-bold shadow-md ${
                      item.sector === 'Gulberg Greens'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-indigo-600 text-white'
                    }`}>
                      {item.sector}
                    </span>

                    {/* Block Badge */}
                    <span className="absolute top-3 right-3 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-900/80 text-amber-400 border border-amber-500/30 backdrop-blur-md">
                      {item.block}
                    </span>

                    {/* Favorite Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(item.id);
                      }}
                      className="absolute bottom-3 right-3 p-2 rounded-xl bg-slate-900/80 hover:bg-slate-900 text-white backdrop-blur-md transition-colors"
                    >
                      <Heart
                        className={`w-4 h-4 ${
                          favorites.includes(item.id) ? 'fill-red-500 text-red-500' : 'text-slate-300'
                        }`}
                      />
                    </button>

                    {/* Feature Badge */}
                    {item.feature !== 'Standard' && (
                      <span className="absolute bottom-3 left-3 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-500 text-slate-950">
                        {item.feature}
                      </span>
                    )}
                  </div>

                  {/* Property Details */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xl font-extrabold text-amber-400 font-mono">
                          PKR {item.displayPrice}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300">
                          {item.type} • {item.size}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-white line-clamp-1 group-hover:text-amber-400 transition-colors">
                        <Link
                          href={`/listings/${item.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="hover:text-amber-400 transition-colors"
                        >
                          {item.title}
                        </Link>
                      </h3>

                      <p className="text-xs text-slate-400 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="truncate">{item.location}</span>
                      </p>

                      <p className="text-xs text-slate-400 line-clamp-2 pt-1 leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    {/* Seller Footer Actions */}
                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                      <div>
                        <p className="text-[10px] text-slate-500">Listed by</p>
                        <p className="text-xs font-semibold text-slate-200 truncate max-w-[120px]">
                          {item.sellerName}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Link
                          href={`/listings/${item.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-medium flex items-center gap-1 transition-colors"
                          title="View full property page"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                          View
                        </Link>
                        {item.isMyListing ? (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEditModal(item);
                              }}
                              className="px-2.5 py-1.5 rounded-xl bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/30 text-xs font-medium flex items-center gap-1 transition-colors"
                              title="Edit listing"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              Edit
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteListing(item.id);
                              }}
                              className="px-2.5 py-1.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30 text-xs font-medium flex items-center gap-1 transition-colors"
                              title="Delete listing"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Delete
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedSeller(item);
                            }}
                            className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all"
                          >
                            <PhoneCall className="w-3.5 h-3.5" />
                            Contact Seller
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="text-center py-16 px-4 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">No properties found</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Try adjusting your block, size, or feature filters to discover available properties in Gulberg Islamabad.
              </p>
            </div>
          )}
        </main>
      )}

      {/* TAB 2: LIST NOW (+) FORM */}
      {activeTab === 'list_now' && (
        <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-8">
          {!isLoggedIn ? (
            <div className="rounded-3xl bg-slate-900 border border-slate-800 p-8 text-center space-y-5 shadow-2xl animate-fadeIn">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/20 shadow-lg">
                <PlusCircle className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-white">Sign In or Register to List Your Property</h2>
                <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                  First-time property sellers must register or log in before publishing listings on Potohar Real Estates. Anyone can browse properties freely without signing in!
                </p>
              </div>
              <button
                onClick={handleListNowClick}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-amber-500/20 inline-flex items-center gap-2 transition-all cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In / Register First Time Now</span>
              </button>
            </div>
          ) : (
            <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
              
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-slate-950 flex items-center justify-center font-bold">
                  <Plus className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">List Your Property in Gulberg</h2>
                  <p className="text-xs text-slate-400">Post your house, plot, or farmhouse for buyers in Gulberg Greens & Residencia.</p>
                </div>
              </div>

              {listingSuccessMsg && (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-popIn">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>{listingSuccessMsg}</span>
                </div>
              )}

              <form onSubmit={handleCreateListing} className="space-y-4">
                
                {/* Title */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Property Title
                  </label>
                  <input
                    type="text"
                    value={newListing.title}
                    onChange={(e) => setNewListing({ ...newListing, title: e.target.value })}
                    placeholder="e.g. 10 Marla Corner Plot in Block A, Gulberg Residencia"
                    required
                    className="w-full h-11 px-4 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Sector Selection */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Sector Location
                    </label>
                    <select
                      value={newListing.sector}
                      onChange={(e) => {
                        const sec = e.target.value;
                        const firstBlock = sec === 'Gulberg Residencia' ? RESIDENCIA_BLOCKS[0] : GREENS_BLOCKS[0];
                        const firstSize = sec === 'Gulberg Residencia' ? RESIDENCIA_SIZES[0] : GREENS_SIZES[0];
                        setNewListing({ ...newListing, sector: sec, block: firstBlock, size: firstSize });
                      }}
                      className="w-full h-11 px-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-medium focus:outline-none focus:border-amber-500"
                    >
                      <option value="Gulberg Residencia">Gulberg Residencia (A-V)</option>
                      <option value="Gulberg Greens">Gulberg Greens (Farmhouses)</option>
                    </select>
                  </div>

                  {/* Block Selector */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Block
                    </label>
                    <select
                      value={newListing.block}
                      onChange={(e) => setNewListing({ ...newListing, block: e.target.value })}
                      className="w-full h-11 px-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-medium focus:outline-none focus:border-amber-500"
                    >
                      {(newListing.sector === 'Gulberg Residencia' ? RESIDENCIA_BLOCKS : GREENS_BLOCKS).map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Size & Type */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Plot / House Size
                    </label>
                    <select
                      value={newListing.size}
                      onChange={(e) => setNewListing({ ...newListing, size: e.target.value })}
                      className="w-full h-11 px-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-medium focus:outline-none focus:border-amber-500"
                    >
                      {(newListing.sector === 'Gulberg Residencia' ? RESIDENCIA_SIZES : GREENS_SIZES).map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Property Type
                    </label>
                    <select
                      value={newListing.type}
                      onChange={(e) => setNewListing({ ...newListing, type: e.target.value })}
                      className="w-full h-11 px-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-medium focus:outline-none focus:border-amber-500"
                    >
                      <option value="Plot">Plot</option>
                      <option value="Built">Built House / Farmhouse</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Category Feature
                    </label>
                    <select
                      value={newListing.feature}
                      onChange={(e) => setNewListing({ ...newListing, feature: e.target.value })}
                      className="w-full h-11 px-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-medium focus:outline-none focus:border-amber-500"
                    >
                      {FEATURE_CATEGORIES.filter((f) => f !== 'All Features').map((f) => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Price PKR */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Price in Crores (PKR)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={newListing.priceCrores}
                      onChange={(e) => setNewListing({ ...newListing, priceCrores: e.target.value })}
                      placeholder="e.g. 2.5 (for 2.5 Crore)"
                      className="w-full h-11 px-4 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Price in Lakhs (PKR)
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={newListing.priceLakhs}
                      onChange={(e) => setNewListing({ ...newListing, priceLakhs: e.target.value })}
                      placeholder="e.g. 50 (for 50 Lakh)"
                      className="w-full h-11 px-4 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                </div>

                {/* Contact Phone */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Contact Phone Number (+92)
                  </label>
                  <div className="flex gap-2">
                    <span className="h-11 px-3 rounded-xl bg-slate-800 border border-slate-700 text-indigo-300 font-mono font-bold text-xs flex items-center">
                      🇵🇰 +92
                    </span>
                    <input
                      type="tel"
                      value={newListing.sellerPhone}
                      onChange={(e) => setNewListing({ ...newListing, sellerPhone: e.target.value })}
                      placeholder="300 1234567"
                      required
                      className="flex-1 h-11 px-4 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                {/* Property photo */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Property photo (optional)
                  </label>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => setListingImageFile(e.target.files?.[0] || null)}
                    className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-slate-800 file:text-slate-200 file:text-xs file:font-medium"
                  />
                  {listingImageFile && (
                    <p className="text-[11px] text-emerald-400 mt-1">Photo selected: {listingImageFile.name}</p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Property Description & Details
                  </label>
                  <textarea
                    rows={3}
                    value={newListing.description}
                    onChange={(e) => setNewListing({ ...newListing, description: e.target.value })}
                    placeholder="Mention plot number, street width, near boulevard/park, facing direction, etc."
                    className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                >
                  <PlusCircle className="w-5 h-5" />
                  <span>Publish Property Listing Now</span>
                </button>
              </form>
            </div>
          )}
        </main>
      )}

      {/* TAB 3: ACCOUNT & VERIFIED SECURITY */}
      {activeTab === 'account' && (
        <main className="flex-1 max-w-2xl w-full mx-auto px-4 sm:px-6 py-8">
          <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 space-y-6 shadow-2xl text-center">
            
            {isLoggedIn ? (
              <>
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-500 to-emerald-500 text-slate-950 font-black text-2xl flex items-center justify-center mx-auto shadow-xl shadow-amber-500/20">
                  {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : (currentUser?.email ? currentUser.email.charAt(0).toUpperCase() : 'JG')}
                </div>

                <div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Verified Property Seller
                  </span>
                  <h2 className="text-xl font-bold text-white mt-2">
                    {currentUser?.name || currentUser?.email || 'Just Gulberg Member'}
                  </h2>
                  <p className="text-xs text-slate-400 mt-1 font-mono">
                    Mobile: {currentUser?.phone || '+92 300 8559922'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 text-left space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-700/50">
                    <span className="text-slate-400">Account Status:</span>
                    <span className="text-amber-400 font-semibold">Active Seller (Logged In)</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-700/50">
                    <span className="text-slate-400">Region Scope:</span>
                    <span className="text-slate-200 font-medium">Gulberg Greens & Residencia (+92)</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Active Listings:</span>
                    <span className="text-emerald-400 font-bold">{listings.filter((l) => l.isMyListing).length} Published</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    onClick={handleListNowClick}
                    className="flex-1 h-11 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Post New Listing Now</span>
                  </button>
                  <button
                    onClick={handleUserSignOut}
                    className="h-11 px-5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="py-6 space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/20">
                  <User className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-bold text-white">Sign In to Your Account</h2>
                <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                  Browse all property listings & details freely as a guest. Sign in or register for the first time when you want to list your property or manage ads.
                </p>
                <button
                  onClick={handleAccountClick}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 inline-flex items-center gap-2 cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In / Register First Time</span>
                </button>
              </div>
            )}
          </div>
        </main>
      )}

      {/* PROPERTY DETAIL MODAL */}
      {selectedProperty && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm animate-fadeIn overflow-y-auto"
          onClick={() => setSelectedProperty(null)}
        >
          <div className="min-h-full flex items-center justify-center p-4 sm:p-6">
            <div
              className="w-full max-w-2xl rounded-3xl bg-slate-900 border border-slate-800 relative shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedProperty(null)}
                className="absolute top-4 right-4 z-20 p-2 rounded-xl bg-slate-900/90 text-slate-400 hover:text-white border border-slate-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Hero Image */}
              <div className="relative h-56 sm:h-72 w-full overflow-hidden rounded-t-3xl bg-slate-800">
                <img
                  src={selectedProperty.image}
                  alt={selectedProperty.title}
                  className="w-full h-full object-cover rounded-t-3xl"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent rounded-t-3xl" />
                <div className="absolute top-4 left-4 right-16 flex flex-wrap gap-2">
                  <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold shadow-md ${
                    selectedProperty.sector === 'Gulberg Greens'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-indigo-600 text-white'
                  }`}>
                    {selectedProperty.sector}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-900/80 text-amber-400 border border-amber-500/30 backdrop-blur-md">
                    {selectedProperty.block}
                  </span>
                  {selectedProperty.feature !== 'Standard' && (
                    <span className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-amber-500 text-slate-950">
                      {selectedProperty.feature}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => toggleFavorite(selectedProperty.id)}
                  className="absolute top-4 right-4 p-2 rounded-xl bg-slate-900/80 hover:bg-slate-900 text-white backdrop-blur-md transition-colors"
                >
                  <Heart
                    className={`w-4 h-4 ${
                      favorites.includes(selectedProperty.id) ? 'fill-red-500 text-red-500' : 'text-slate-300'
                    }`}
                  />
                </button>
              </div>

            <div className="p-6 sm:p-8 space-y-5 rounded-b-3xl bg-slate-900">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-2xl sm:text-3xl font-extrabold text-amber-400 font-mono">
                    PKR {selectedProperty.displayPrice}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
                    {selectedProperty.type} • {selectedProperty.size}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white leading-snug">
                  {selectedProperty.title}
                </h2>
                <p className="text-sm text-slate-400 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                  {selectedProperty.location}
                </p>
              </div>

              {/* Property specs */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Sector</p>
                  <p className="text-xs font-semibold text-white">{selectedProperty.sector}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Block</p>
                  <p className="text-xs font-semibold text-white">{selectedProperty.block}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Size</p>
                  <p className="text-xs font-semibold text-white">{selectedProperty.size}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Type</p>
                  <p className="text-xs font-semibold text-white">{selectedProperty.type}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Feature</p>
                  <p className="text-xs font-semibold text-white">{selectedProperty.feature}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Listed</p>
                  <p className="text-xs font-semibold text-white">{selectedProperty.date || 'Recently'}</p>
                </div>
              </div>

              {/* Full description */}
              <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5" />
                  Property Description
                </p>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {selectedProperty.description}
                </p>
              </div>

              {/* Seller info */}
              <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Listed by</p>
                    <p className="text-sm font-bold text-white">{selectedProperty.sellerName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Contact</p>
                    <p className="text-sm font-bold text-emerald-400 font-mono">{selectedProperty.sellerPhone}</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <Link
                href={`/listings/${selectedProperty.id}`}
                onClick={() => setSelectedProperty(null)}
                className="w-full h-11 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <Maximize2 className="w-4 h-4" />
                View Full Property Page
              </Link>
              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                {selectedProperty.isMyListing ? (
                  <div className="flex gap-2 flex-1">
                    <button
                      onClick={() => {
                        const prop = selectedProperty;
                        setSelectedProperty(null);
                        handleOpenEditModal(prop);
                      }}
                      className="flex-1 h-11 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-4 h-4" />
                      Edit Listing
                    </button>
                    <button
                      onClick={() => {
                        handleDeleteListing(selectedProperty.id);
                        setSelectedProperty(null);
                      }}
                      className="flex-1 h-11 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Listing
                    </button>
                  </div>
                ) : (
                  <>
                    <a
                      href={`tel:${selectedProperty.sellerPhone}`}
                      className="flex-1 h-11 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-amber-500/20 transition-all"
                    >
                      <Phone className="w-4 h-4" />
                      Call Seller
                    </a>
                    <a
                      href={`https://wa.me/${(selectedProperty.sellerPhone || '').replace(/[^\d]/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 h-11 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all"
                    >
                      <MessageSquare className="w-4 h-4" />
                      WhatsApp
                    </a>
                    <button
                      onClick={() => {
                        setSelectedSeller(selectedProperty);
                        setSelectedProperty(null);
                      }}
                      className="flex-1 h-11 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                    >
                      <PhoneCall className="w-4 h-4" />
                      Contact Details
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        </div>
      )}

      {/* CONTACT SELLER MODAL */}
      {selectedSeller && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-5 relative shadow-2xl">
            
            <button
              onClick={() => setSelectedSeller(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto mb-2 border border-amber-500/20">
                <PhoneCall className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Contact Property Seller</h3>
              <p className="text-xs text-slate-400 mt-1 line-clamp-1 font-semibold">
                {selectedSeller.title}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Listing Price:</span>
                <span className="text-amber-400 font-bold font-mono">PKR {selectedSeller.displayPrice}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Location:</span>
                <span className="text-white font-medium">{selectedSeller.block}, {selectedSeller.sector}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Seller Name:</span>
                <span className="text-slate-200 font-semibold">{selectedSeller.sellerName}</span>
              </div>
              <div className="pt-2 border-t border-slate-700/60 text-center">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Direct Phone Number</p>
                <p className="text-base font-extrabold text-emerald-400 font-mono tracking-wider">
                  {selectedSeller.sellerPhone}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <a
                href={`tel:${selectedSeller.sellerPhone}`}
                className="w-full h-11 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-amber-500/20 transition-all"
              >
                <Phone className="w-4 h-4" />
                Call Seller Direct
              </a>

              <a
                href={`https://wa.me/${(selectedSeller.sellerPhone || '').replace(/[^\d]/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all"
              >
                <MessageSquare className="w-4 h-4" />
                Chat on WhatsApp
              </a>
            </div>
          </div>
        </div>
      )}

      {/* EDIT PROPERTY MODAL */}
      {editingProperty && editForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-fadeIn">
          <div className="w-full max-w-xl my-auto relative z-10 animate-slideUp">
            <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 relative shadow-2xl space-y-5">
              <button
                onClick={() => {
                  setEditingProperty(null);
                  setEditForm(null);
                  setEditImageFile(null);
                }}
                className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold border border-amber-500/20">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Edit Property Listing</h2>
                  <p className="text-xs text-slate-400">Update your property details, price, or description.</p>
                </div>
              </div>

              {editSuccessMsg && (
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{editSuccessMsg}</span>
                </div>
              )}

              <form onSubmit={handleUpdateListing} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Property Title</label>
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    required
                    className="w-full h-10 px-3.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Sector</label>
                    <select
                      value={editForm.sector}
                      onChange={(e) => {
                        const sec = e.target.value;
                        const firstBlock = sec === 'Gulberg Residencia' ? RESIDENCIA_BLOCKS[0] : GREENS_BLOCKS[0];
                        const firstSize = sec === 'Gulberg Residencia' ? RESIDENCIA_SIZES[0] : GREENS_SIZES[0];
                        setEditForm({ ...editForm, sector: sec, block: firstBlock, size: firstSize });
                      }}
                      className="w-full h-10 px-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
                    >
                      <option value="Gulberg Residencia">Gulberg Residencia (A-V)</option>
                      <option value="Gulberg Greens">Gulberg Greens (Farmhouses)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Block</label>
                    <select
                      value={editForm.block}
                      onChange={(e) => setEditForm({ ...editForm, block: e.target.value })}
                      className="w-full h-10 px-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
                    >
                      {(editForm.sector === 'Gulberg Residencia' ? RESIDENCIA_BLOCKS : GREENS_BLOCKS).map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Size</label>
                    <select
                      value={editForm.size}
                      onChange={(e) => setEditForm({ ...editForm, size: e.target.value })}
                      className="w-full h-10 px-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
                    >
                      {(editForm.sector === 'Gulberg Residencia' ? RESIDENCIA_SIZES : GREENS_SIZES).map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Type</label>
                    <select
                      value={editForm.type}
                      onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                      className="w-full h-10 px-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
                    >
                      <option value="Plot">Plot</option>
                      <option value="Built">Built House / Farmhouse</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Feature</label>
                    <select
                      value={editForm.feature}
                      onChange={(e) => setEditForm({ ...editForm, feature: e.target.value })}
                      className="w-full h-10 px-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
                    >
                      {FEATURE_CATEGORIES.filter((f) => f !== 'All Features').map((f) => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Price (Crores PKR)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editForm.priceCrores}
                      onChange={(e) => setEditForm({ ...editForm, priceCrores: e.target.value })}
                      placeholder="e.g. 2.5"
                      className="w-full h-10 px-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Price (Lakhs PKR)</label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={editForm.priceLakhs}
                      onChange={(e) => setEditForm({ ...editForm, priceLakhs: e.target.value })}
                      placeholder="e.g. 50"
                      className="w-full h-10 px-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Contact Mobile Number</label>
                  <div className="flex gap-2">
                    <span className="h-10 px-3 rounded-xl bg-slate-800 border border-slate-700 text-amber-400 font-mono text-xs flex items-center">
                      🇵🇰 +92
                    </span>
                    <input
                      type="tel"
                      value={editForm.sellerPhone}
                      onChange={(e) => setEditForm({ ...editForm, sellerPhone: e.target.value })}
                      placeholder="300 1234567"
                      required
                      className="flex-1 h-10 px-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Update Photo (optional)</label>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => setEditImageFile(e.target.files?.[0] || null)}
                    className="w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-slate-800 file:text-slate-200 file:text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingProperty(null);
                      setEditForm(null);
                      setEditImageFile(null);
                    }}
                    className="flex-1 h-11 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="flex-1 h-11 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-amber-500/20 disabled:opacity-50 transition-all"
                  >
                    {isUpdating ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* AUTHENTICATION MODAL */}
      <AuthPage
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={handleAuthSuccess}
        reason={authModalReason}
      />

      {/* FOOTER */}
      <footer className="bg-slate-900 border-t border-slate-800 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col items-center justify-center gap-2 text-center">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2">
            <span className="font-bold text-amber-400">Potohar Real Estates</span>
            <span>• "Real estate ko asaan banayen" • Gulberg Greens & Residencia Portal</span>
          </div>
          <p>© 2026 Potohar Real Estates. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
