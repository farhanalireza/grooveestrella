// src/app/playlist/[id]/page.jsx
import { fetchSpotifyDataServer } from '@/lib/spotifyServer';
import PlaylistDetailClient from './PlaylistDetailClient';

export async function generateMetadata({ params }) {
  const { id } = await params;

  if (id && id.startsWith('custom-')) {
    return {
      title: 'Custom Playlist | GrooveEstrella',
      description: 'Your custom playlist collection on GrooveEstrella.',
    };
  }

  const playlist = await fetchSpotifyDataServer('playlist', id);

  if (!playlist) {
    return {
      title: 'Playlist Not Found | GrooveEstrella',
      description: 'The requested playlist could not be found on GrooveEstrella.',
    };
  }

  const ownerName = playlist.owner?.display_name || 'Spotify User';
  const coverUrl = playlist.images?.[0]?.url || 'https://placehold.co/600x600?text=No+Cover';

  return {
    title: `${playlist.name} by ${ownerName} | GrooveEstrella`,
    description: `Open and explore "${playlist.name}" on GrooveEstrella. Discover tracks, customize GrooveCards, and stream on top services.`,
    openGraph: {
      title: playlist.name,
      description: `Created by: ${ownerName} • ${playlist.tracks?.total} tracks`,
      images: [{ url: coverUrl, width: 640, height: 640 }],
      type: 'music.playlist',
    },
    twitter: {
      card: 'summary_large_image',
      title: playlist.name,
      description: `Playlist: ${playlist.name} by ${ownerName}`,
      images: [coverUrl],
    }
  };
}

export default async function Page({ params }) {
  const { id } = await params;

  if (id && id.startsWith('custom-')) {
    return <PlaylistDetailClient id={id} initialPlaylist={null} />;
  }

  const initialPlaylist = await fetchSpotifyDataServer('playlist', id);

  return <PlaylistDetailClient id={id} initialPlaylist={initialPlaylist} />;
}
