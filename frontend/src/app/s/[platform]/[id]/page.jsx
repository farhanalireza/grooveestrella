// src/app/s/[platform]/[id]/page.jsx
import { redirect } from 'next/navigation';
import { getTrackMetadata } from '@/lib/musicProviders';

// Generate dynamic metadata for SEO and rich previews in social apps
export async function generateMetadata({ params }) {
  const { platform, id } = await params;
  let metadata = null;
  try {
    metadata = await Promise.race([
      getTrackMetadata(platform, id),
      new Promise((res) => setTimeout(() => res(null), 5000)),
    ]);
  } catch (_) {}

  const title = (metadata?.title || decodeURIComponent(id || 'Music')).replace(/[-_]/g, ' ').trim();
  const artist = (metadata?.artist || '').trim();
  const titleText = artist ? `${title} by ${artist}` : title;
  const descText = `Open and share "${title}" across Spotify, Apple Music, YouTube Music, TIDAL, and Deezer via GrooveLink.`;
  const rawCover = metadata?.coverArt;
  const coverUrl = (rawCover && typeof rawCover === 'string' && rawCover.startsWith('http'))
    ? rawCover
    : 'https://grooveestrella.com/icon-512.png';

  const canonicalUrl = `https://grooveestrella.com/s/${encodeURIComponent(platform)}/${encodeURIComponent(id)}`;

  return {
    title: `${titleText} | Universal Music Link`,
    description: descText,
    openGraph: {
      title: titleText,
      description: descText,
      url: canonicalUrl,
      siteName: 'GrooveEstrella',
      images: [
        {
          url: coverUrl,
          width: 640,
          height: 640,
          alt: `${title} album cover art`,
        },
      ],
      type: 'music.song',
    },
    twitter: {
      card: 'summary_large_image',
      title: titleText,
      description: descText,
      images: [coverUrl],
    },
  };
}

export default async function UniversalLinkPage({ params }) {
  const { id } = await params;
  if (id) {
    redirect(`/track/${encodeURIComponent(id)}?groovelink=true`);
  }
  redirect('/');
}
