import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getListingById, getAllListingIds } from '../../../lib/listings.server';
import { getSiteUrl } from '../../../lib/site';
import { Home, MapPin, Phone, MessageSquare } from 'lucide-react';

export const dynamicParams = true; // serve listings added after build on demand
export const revalidate = 3600;    // revalidate statically-generated pages hourly (ISR)

export async function generateStaticParams() {
  const ids = await getAllListingIds();
  return ids.map((id) => ({ id }));
}

export async function generateMetadata({ params }) {
  const listing = await getListingById(params.id);
  if (!listing) {
    return {
      title: 'Listing not found | Potohar Real Estates',
    };
  }

  const url = `${getSiteUrl()}/listings/${listing.id}`;

  return {
    title: `${listing.title} | Potohar Real Estates`,
    description: listing.description,
    alternates: { canonical: url },
    openGraph: {
      title: `${listing.title} | Potohar Real Estates`,
      description: listing.description,
      url,
      siteName: 'Potohar Real Estates',
      locale: 'en_PK',
      type: 'website',
      images: [{ url: listing.image, width: 800, height: 600, alt: listing.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${listing.title} | Potohar Real Estates`,
      description: listing.description,
      images: [listing.image],
    },
  };
}

export default async function ListingPage({ params }) {
  const listing = await getListingById(params.id);
  if (!listing) return notFound();

  const siteUrl = getSiteUrl();
  const pageUrl = `${siteUrl}/listings/${listing.id}`;
  const waNumber = (listing.sellerPhone || '').replace(/[^\d]/g, '');

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: listing.title,
    description: listing.description,
    url: pageUrl,
    image: [listing.image],
    datePosted: listing.createdAt || undefined,
    offers: {
      '@type': 'Offer',
      price: listing.pricePKR,
      priceCurrency: 'PKR',
      availability: 'https://schema.org/InStock',
    },
    address: {
      '@type': 'PostalAddress',
      streetAddress: listing.location,
      addressLocality: 'Islamabad',
      addressRegion: 'Islamabad',
      addressCountry: 'PK',
    },
  };

  return (
    <main className="min-h-screen w-full bg-slate-950 text-slate-100 font-sans pb-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-xl border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <Link href="/" className="text-xs font-bold text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors">
            <Home className="w-4 h-4 text-amber-400" />
            Potohar Real Estates
          </Link>
          <Link
            href="/"
            className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors"
          >
            ← Browse all listings
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-2xl">
          <div className="relative h-64 sm:h-80 w-full overflow-hidden bg-slate-800">
            <img
              src={listing.image}
              alt={listing.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
            <div className="absolute top-4 left-4 right-4 flex flex-wrap gap-2">
              <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold shadow-md ${
                listing.sector === 'Gulberg Greens' ? 'bg-emerald-600 text-white' : 'bg-indigo-600 text-white'
              }`}>
                {listing.sector}
              </span>
              <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-900/80 text-amber-400 border border-amber-500/30 backdrop-blur-md">
                {listing.block}
              </span>
              {listing.feature !== 'Standard' && (
                <span className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-amber-500 text-slate-950">
                  {listing.feature}
                </span>
              )}
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-5">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-2xl sm:text-3xl font-extrabold text-amber-400 font-mono">
                  PKR {listing.displayPrice}
                </span>
                <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
                  {listing.type} • {listing.size}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-white leading-snug">
                {listing.title}
              </h1>
              <p className="text-sm text-slate-400 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                {listing.location}
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                ['Sector', listing.sector],
                ['Block', listing.block],
                ['Size', listing.size],
                ['Type', listing.type],
                ['Feature', listing.feature],
                ['Listed', listing.date],
              ].map(([label, value]) => (
                <div key={label} className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">{label}</p>
                  <p className="text-xs font-semibold text-white">{value}</p>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Property Description</p>
              <p className="text-sm text-slate-300 leading-relaxed">{listing.description}</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Listed by</p>
                <p className="text-sm font-bold text-white">{listing.sellerName}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Contact</p>
                <p className="text-sm font-bold text-emerald-400 font-mono">{listing.sellerPhone}</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <a
                href={`tel:${listing.sellerPhone}`}
                className="flex-1 h-11 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-amber-500/20 transition-all"
              >
                <Phone className="w-4 h-4" />
                Call Seller
              </a>
              <a
                href={`https://wa.me/${waNumber}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 h-11 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all"
              >
                <MessageSquare className="w-4 h-4" />
                WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
