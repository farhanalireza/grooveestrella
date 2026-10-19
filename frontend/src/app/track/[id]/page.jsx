// src/app/track/[id]/page.jsx
import { fetchMusicBrainzTrackServer, searchMusicBrainzTrackServer } from '@/lib/musicbrainzServer';
import TrackDetailClient from './TrackDetailClient';

export async function generateMetadata({ params }) {
  const { id } = await params;
  const cleanId = typeof id === 'string' ? id.trim() : '';
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanId);
  let track = null;

  try {
    if (isUUID) {
      track = await Promise.race([
        fetchMusicBrainzTrackServer(cleanId),
        new Promise((res) => setTimeout(() => res(null), 6000)),
      ]);
    }

    if (!track && cleanId && !cleanId.startsWith('local-')) {
      track = await Promise.race([
        searchMusicBrainzTrackServer(decodeURIComponent(cleanId)),
        new Promise((res) => setTimeout(() => res(null), 4000)),
      ]);
    }
  } catch (_) {}

  const trackTitle = (track?.title || track?.name || decodeURIComponent(cleanId || 'Track')).replace(/[-_]/g, ' ').trim();
  const artistsName = (
    Array.isArray(track?.artists)
      ? track.artists.map((a) => (typeof a === 'object' ? a.name : a)).join(', ')
      : typeof track?.artist === 'string'
      ? track.artist
      : ''
  ).trim();

  const albumName = track?.album?.name || track?.album;
  const titleDisplay = artistsName ? `${trackTitle} by ${artistsName}` : trackTitle;
  const descDisplay = artistsName
    ? `Listen to "${trackTitle}" by ${artistsName}${albumName ? ` from the album "${albumName}"` : ''} on GrooveEstrella. Explore lore, credits, and universal streaming links.`
    : `Explore "${trackTitle}" on GrooveEstrella with smart streaming links across Spotify, Apple Music & YouTube.`;

  const rawCover = track?.album?.images?.[0]?.url || track?.coverArt || track?.url;
  const coverUrl = (rawCover && typeof rawCover === 'string' && rawCover.startsWith('http'))
    ? rawCover
    : 'https://grooveestrella.com/icon-512.png';

  const canonicalUrl = `https://grooveestrella.com/track/${encodeURIComponent(cleanId)}`;

  return {
    title: `${titleDisplay} | GrooveEstrella`,
    description: descDisplay,
    openGraph: {
      title: titleDisplay,
      description: descDisplay,
      url: canonicalUrl,
      siteName: 'GrooveEstrella',
      images: [
        {
          url: coverUrl,
          width: 640,
          height: 640,
          alt: trackTitle,
        },
      ],
      type: 'music.song',
    },
    twitter: {
      card: 'summary_large_image',
      title: titleDisplay,
      description: descDisplay,
      images: [coverUrl],
    },
  };
}

export default async function Page({ params }) {
  const { id } = await params;
  const cleanId = typeof id === 'string' ? id.trim() : '';
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanId);
  let initialData = isUUID ? await fetchMusicBrainzTrackServer(cleanId) : null;
  if (!initialData && cleanId && !cleanId.startsWith('local-')) {
    initialData = await searchMusicBrainzTrackServer(decodeURIComponent(cleanId));
  }

  return <TrackDetailClient id={id} initialData={initialData} />;
}
