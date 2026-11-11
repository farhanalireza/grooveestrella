// src/app/artist/[id]/page.jsx
import { cache } from 'react';
import { fetchMusicBrainzArtistServer, searchMusicBrainzArtistsServer } from '@/lib/musicbrainzServer';
import ArtistDetailClient from './ArtistDetailClient';

// Enable Incremental Static Regeneration (ISR) at Vercel Edge for 24 hours
// Instant < 100ms response time on all cached visits
export const revalidate = 86400;

// Deduplicate server fetch between generateMetadata and Page component
const getArtistData = cache(async (id) => {
  if (!id) return null;
  let artist = await fetchMusicBrainzArtistServer(id);
  if (!artist && id) {
    try {
      const searchRes = await searchMusicBrainzArtistsServer(decodeURIComponent(id), 1);
      if (searchRes && searchRes.length > 0) {
        artist = await fetchMusicBrainzArtistServer(searchRes[0].id);
      }
    } catch (_) {}
  }
  return artist;
});

export async function generateMetadata({ params }) {
  const { id } = await params;
  let artist = null;

  try {
    artist = await Promise.race([
      getArtistData(id),
      new Promise((res) => setTimeout(() => res(null), 4000)),
    ]);
  } catch (_) {}

  const artistName = (artist?.name || decodeURIComponent(id || 'Artist')).replace(/[-_]/g, ' ').trim();
  const genresStr = artist?.genres?.slice(0, 3).join(', ');
  const descDisplay = genresStr
    ? `Explore ${artistName} on GrooveEstrella • ${genresStr}. View discography, top tracks, pressings & create custom GrooveCards.`
    : `Explore ${artistName} on GrooveEstrella. View discography, top tracks, pressings & create custom GrooveCards.`;

  const rawCover = artist?.images?.[0]?.url || artist?.coverArt || artist?.url;
  const coverUrl = (rawCover && typeof rawCover === 'string' && rawCover.startsWith('http'))
    ? rawCover
    : 'https://groove.amplecen.com/icon-512.png';

  const canonicalUrl = `https://groove.amplecen.com/artist/${encodeURIComponent(id)}`;

  return {
    title: `${artistName} | GrooveEstrella`,
    description: descDisplay,
    openGraph: {
      title: `${artistName} on GrooveEstrella`,
      description: descDisplay,
      url: canonicalUrl,
      siteName: 'GrooveEstrella',
      images: [
        {
          url: coverUrl,
          width: 640,
          height: 640,
          alt: artistName,
        },
      ],
      type: 'profile',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${artistName} on GrooveEstrella`,
      description: descDisplay,
      images: [coverUrl],
    },
  };
}

export default async function Page({ params }) {
  const { id } = await params;
  const artistData = await getArtistData(id);

  return (
    <ArtistDetailClient 
      id={id} 
      initialArtist={artistData} 
      initialTopTracks={artistData?.topTracks || []} 
      initialAlbums={artistData?.albums || []} 
    />
  );
}
