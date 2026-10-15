// src/app/track/[id]/page.jsx
import { fetchMusicBrainzTrackServer, searchMusicBrainzTrackServer } from '@/lib/musicbrainzServer';
import TrackDetailClient from './TrackDetailClient';

export async function generateMetadata({ params }) {
  const { id } = await params;
  let track = await fetchMusicBrainzTrackServer(id);
  if (!track) {
    track = await searchMusicBrainzTrackServer(decodeURIComponent(id));
  }

  if (!track) {
    return {
      title: 'Track Not Found | GrooveEstrella',
      description: 'The requested track could not be found on GrooveEstrella.',
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
  let initialData = await fetchMusicBrainzTrackServer(id);
  if (!initialData) {
    initialData = await searchMusicBrainzTrackServer(decodeURIComponent(id));
  }

  return <TrackDetailClient id={id} initialData={initialData} />;
}
