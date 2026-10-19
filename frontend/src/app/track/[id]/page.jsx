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
        new Promise((res) => setTimeout(() => res(null), 1200)),
      ]);
    }
  } catch (_) {}

  if (!track) {
    return {
      title: 'Track | GrooveEstrella',
      description: 'Discover tracks, explore MusicBrainz metadata, and stream across platforms on GrooveEstrella.',
    };
  }

  const artistsName = Array.isArray(track.artists)
    ? track.artists.map(a => a.name).join(', ')
    : (track.artist || 'Unknown Artist');
  const coverUrl = track.album?.images?.[0]?.url || track.coverArt || 'https://placehold.co/600x600/10141F/60A5FA?text=No+Cover';

  return {
    title: `${track.title || track.name} by ${artistsName} | GrooveEstrella`,
    description: `Discover "${track.title || track.name}" by ${artistsName} on GrooveEstrella. Explore MusicBrainz metadata, create GrooveCards, and stream across platforms.`,
    openGraph: {
      title: track.title || track.name,
      description: `Artist: ${artistsName} | Album: ${track.album?.name || track.album}`,
      images: [{ url: coverUrl, width: 640, height: 640 }],
      type: 'music.song',
    },
    twitter: {
      card: 'summary_large_image',
      title: track.title || track.name,
      description: `Discover ${track.title || track.name} by ${artistsName}`,
      images: [coverUrl],
    }
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
