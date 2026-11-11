// src/app/track/[id]/page.jsx
import { cache } from 'react';
import { fetchMusicBrainzTrackServer, searchMusicBrainzTrackServer } from '@/lib/musicbrainzServer';
import TrackDetailClient from './TrackDetailClient';

// Enable Incremental Static Regeneration (ISR) at Vercel Edge for 24 hours
export const revalidate = 86400;

const getTrackData = cache(async (cleanId) => {
  if (!cleanId) return null;
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanId);
  let track = isUUID ? await fetchMusicBrainzTrackServer(cleanId) : null;

  if (!track && cleanId && !cleanId.startsWith('local-')) {
    const itunesMatch = cleanId.match(/^(?:itunes-)?(\d{6,})$/i);
    if (itunesMatch) {
      try {
        const res = await fetch(`https://itunes.apple.com/lookup?id=${itunesMatch[1]}`);
        const json = await res.json();
        const item = json.results?.[0];
        if (item) {
          track = {
            title: item.trackName || item.trackCensoredName,
            artist: item.artistName,
            album: { name: item.collectionName, images: [{ url: item.artworkUrl100?.replace('100x100bb', '600x600bb') }] },
            coverArt: item.artworkUrl100?.replace('100x100bb', '600x600bb'),
          };
        }
      } catch (_) {}
    }

    if (!track) {
      try {
        track = await Promise.race([
          searchMusicBrainzTrackServer(decodeURIComponent(cleanId)),
          new Promise((res) => setTimeout(() => res(null), 3000)),
        ]);
      } catch (_) {}
    }
  }
  return track;
});

export async function generateMetadata({ params }) {
  const { id } = await params;
  const cleanId = typeof id === 'string' ? id.trim() : '';
  let track = null;

  try {
    track = await Promise.race([
      getTrackData(cleanId),
      new Promise((res) => setTimeout(() => res(null), 4000)),
    ]);
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
    : 'https://groove.amplecen.com/icon-512.png';

  const canonicalUrl = `https://groove.amplecen.com/track/${encodeURIComponent(cleanId)}`;

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
  const initialData = await getTrackData(cleanId);

  return <TrackDetailClient id={id} initialData={initialData} />;
}
