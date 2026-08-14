import './globals.css';
import { getSiteUrl } from '../lib/site';

export const metadata = {
  title: 'Potohar Real Estates | Gulberg Islamabad Properties',
  description: 'Buy and sell plots, built houses, and luxury farmhouses in Gulberg Greens & Gulberg Residencia, Islamabad. Real estate ko asaan banayen.',
  keywords: [
    'Gulberg Islamabad',
    'Gulberg Greens',
    'Gulberg Residencia',
    'Islamabad plots for sale',
    'Islamabad farmhouses',
    'Potohar Real Estates',
    'Pakistan real estate marketplace',
  ],
  authors: [{ name: 'Potohar Real Estates' }],
  openGraph: {
    title: 'Potohar Real Estates | Gulberg Islamabad Properties',
    description: 'Buy and sell plots, built houses, and luxury farmhouses in Gulberg Greens & Gulberg Residencia, Islamabad.',
    url: getSiteUrl(),
    siteName: 'Potohar Real Estates',
    locale: 'en_PK',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Potohar Real Estates | Gulberg Islamabad Properties',
    description: 'Buy and sell plots, built houses, and luxury farmhouses in Gulberg Greens & Gulberg Residencia, Islamabad.',
  },
  metadataBase: new URL(getSiteUrl()),
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-amber-500 selection:text-slate-950">
        <div className="min-h-screen w-full flex flex-col relative bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">
          {children}
        </div>
      </body>
    </html>
  );
}
