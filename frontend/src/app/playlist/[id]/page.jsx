// src/app/playlist/[id]/page.jsx
import { fetchSpotifyDataServer } from '@/lib/spotifyServer';
import PlaylistDetailClient from './PlaylistDetailClient';

export async function generateMetadata({ params }) {
  const { id } = await params;

  if (id && id.startsWith('custom-')) {
    return {
      title: 'Custom Playlist | GrooveEstrella',
      description: 'Your custom playlist collection on GrooveEstrella.',
      openGraph: {
        title: 'Custom Playlist | GrooveEstrella',
        description: 'Listen and explore custom playlists on GrooveEstrella.',
        siteName: 'GrooveEstrella',
        images: [{ url: 'https://grooveestrella.com/icon-512.png', width: 512, height: 512, alt: 'Custom Playlist' }],
      },
      twitter: {
        card: 'summary_large_image',
        title: 'Custom Playlist | GrooveEstrella',
        images: ['https://grooveestrella.com/icon-512.png'],
      }
    };
  }

  let playlist = null;
  try {
    playlist = await Promise.race([
      fetchSpotifyDataServer('playlist', id),
      new Promise((res) => setTimeout(() => res(null), 5000)),
    ]);
  } catch (_) {}

  const playlistName = (playlist?.name || decodeURIComponent(id || 'Playlist')).trim();
  const ownerName = playlist?.owner?.display_name || 'Spotify';
  const rawCover = playlist?.images?.[0]?.url;
  const coverUrl = (rawCover && typeof rawCover === 'string' && rawCover.startsWith('http'))
    ? rawCover
    : 'https://grooveestrella.com/icon-512.png';

  const descDisplay = `Open and explore "${playlistName}" on GrooveEstrella by ${ownerName}${playlist?.tracks?.total ? ` • ${playlist.tracks.total} tracks` : ''}.`;
  const canonicalUrl = `https://grooveestrella.com/playlist/${encodeURIComponent(id)}`;

  return {
    title: `${playlistName} by ${ownerName} | GrooveEstrella`,
    description: descDisplay,
    openGraph: {
      title: playlistName,
      description: descDisplay,
      url: canonicalUrl,
      siteName: 'GrooveEstrella',
      images: [{ url: coverUrl, width: 640, height: 640, alt: playlistName }],
      type: 'music.playlist',
    },
    twitter: {
      card: 'summary_large_image',
      title: playlistName,
      description: descDisplay,
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
