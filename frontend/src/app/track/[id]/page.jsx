// src/app/track/[id]/page.jsx
// Explorer Page Route: 'id' represents a Spotify track ID exclusively in v1.
import { fetchSpotifyDataServer } from '@/lib/spotifyServer';
import TrackDetailClient from './TrackDetailClient';

export async function generateMetadata({ params }) {
  const { id } = await params;
  const track = await fetchSpotifyDataServer('track', id);

  if (!track) {
    return {
      title: 'Track Not Found | GrooveEstrella',
      description: 'The requested track could not be found on GrooveEstrella.',
    };
  }

  const artistsName = track.artists.map(a => a.name).join(', ');
  const coverUrl = track.album?.images?.[0]?.url || 'https://placehold.co/600x600?text=No+Cover';

  return {
    title: `${track.name} by ${artistsName} | GrooveEstrella`,
    description: `Discover "${track.name}" by ${artistsName} on GrooveEstrella. Scan QR, customize GrooveCards, and stream on Spotify, Apple Music, and YouTube.`,
    openGraph: {
      title: track.name,
      description: `Artist: ${artistsName} | Album: ${track.album?.name}`,
      images: [{ url: coverUrl, width: 640, height: 640 }],
      type: 'music.song',
    },
    twitter: {
      card: 'summary_large_image',
      title: track.name,
      description: `Discover ${track.name} by ${artistsName}`,
      images: [coverUrl],
    }
  };
}

export default async function Page({ params }) {
  const { id } = await params;
  const initialData = await fetchSpotifyDataServer('track', id);

  return <TrackDetailClient id={id} initialData={initialData} />;
}
