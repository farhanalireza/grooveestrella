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
      new Promise((res) => setTimeout(() => res(null), 1200)),
    ]);
  } catch (_) {}

  if (!metadata) {
    return {
      title: 'GrooveLink | Universal Music Link',
      description: 'Open and share music across Spotify, Apple Music, YouTube Music, TIDAL, and Deezer.',
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
  const { id } = await params;
  if (id) {
    redirect(`/track/${encodeURIComponent(id)}?groovelink=true`);
  }
  redirect('/');
}
