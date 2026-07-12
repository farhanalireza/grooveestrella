// src/app/s/[platform]/[id]/page.jsx
import React from 'react';
import { getTrackMetadata, generatePlatformLinks } from '@/lib/musicProviders';
import TrackDetailsClient from '@/Components/TrackDetailsClient';
import { Music, Settings } from 'lucide-react';
import Link from 'next/link';

// Generate dynamic metadata for SEO and rich previews in social apps
export async function generateMetadata({ params }) {
  const { platform, id } = await params;
  const metadata = await getTrackMetadata(platform, id);

  if (!metadata) {
    return {
      title: 'Track Not Found | GrooveEstrella',
      description: 'The requested music track could not be resolved.',
    };
  }

  const titleText = `${metadata.title} - ${metadata.artist}`;
  return {
    title: `${titleText} | Universal Music Link`,
    description: `Open and share "${metadata.title}" by ${metadata.artist} across Spotify, Apple Music, YouTube Music, TIDAL, Deezer and more.`,
    openGraph: {
      title: titleText,
      description: `Access "${metadata.title}" on your preferred streaming service instantly via GrooveEstrella.`,
      images: [
        {
          url: metadata.coverArt,
          width: 500,
          height: 500,
          alt: `${metadata.title} album cover art`,
        },
      ],
      type: 'music.song',
    },
    twitter: {
      card: 'summary_large_image',
      title: titleText,
      description: `Access "${metadata.title}" on your preferred streaming service instantly.`,
      images: [metadata.coverArt],
    },
  };
}

export default async function UniversalLinkPage({ params }) {
  const { platform, id } = await params;
  const metadata = await getTrackMetadata(platform, id);

  // Determine current absolute URL for sharing (fallback to relative if headers not available)
  let currentUrl = '';
  if (typeof window !== 'undefined') {
    currentUrl = window.location.href;
  } else {
    // Next.js server-side, fallback to domain structure
    const host = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
    currentUrl = `${host}/s/${platform}/${id}`;
  }

  if (!metadata) {
    return (
      <div className="min-h-screen bg-[#09090b] text-white flex flex-col items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full p-8 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl text-center shadow-2xl">
          <div className="w-16 h-16 bg-red-500/10 border border-red-500/35 rounded-full flex items-center justify-center mx-auto mb-6">
            <Music className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight mb-2">Track Not Resolved</h1>
          <p className="text-zinc-400 text-sm mb-6">
            We couldn't fetch track metadata for this ID. It may be invalid, or the streaming API might be temporarily unavailable.
          </p>
          <Link 
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-white text-black font-semibold text-sm hover:bg-zinc-200 transition"
          >
            Go back Home
          </Link>
        </div>
      </div>
    );
  }

  const platformLinks = generatePlatformLinks(metadata);

  return (
    <div className="min-h-screen bg-black/65 text-white flex flex-col justify-between font-sans relative overflow-hidden">

      {/* Header */}
      <header className="border-b border-white/5 bg-black/20 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-95 transition">
            <img src="/in.svg" alt="GrooveEstrella" className="w-8 h-8 object-contain" />
            <span className="font-bold tracking-tight text-white font-display text-lg">GrooveEstrella</span>
          </Link>

          <Link 
            href="/settings" 
            className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-white/5 transition"
            title="Redirect Settings"
          >
            <Settings className="w-5 h-5" />
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center py-6 relative z-10">
        <TrackDetailsClient 
          metadata={metadata} 
          platformLinks={platformLinks} 
          currentUrl={currentUrl} 
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-black/10 py-6 text-center text-xs text-zinc-500 relative z-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} GrooveEstrella. The easiest way to share music.</p>
          <div className="flex gap-4">
            <Link href="/" className="hover:text-zinc-300 transition">Converter</Link>
            <Link href="/settings" className="hover:text-zinc-300 transition">Preferences</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
