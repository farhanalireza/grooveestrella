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
      title: 'Track Not Found | GrooveLink',
      description: 'The requested music track could not be resolved.',
    };
  }

  const titleText = `${metadata.title} - ${metadata.artist}`;
  return {
    title: `${titleText} | Universal Music Link`,
    description: `Open and share "${metadata.title}" by ${metadata.artist} across Spotify, Apple Music, YouTube Music, TIDAL, Deezer and more.`,
    openGraph: {
      title: titleText,
      description: `Access "${metadata.title}" on your preferred streaming service instantly via GrooveLink.`,
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
    <main className="flex-grow flex items-center justify-center py-6 relative z-10">
      <TrackDetailsClient 
        metadata={metadata} 
        platformLinks={platformLinks} 
        currentUrl={currentUrl} 
      />
    </main>
  );
}
