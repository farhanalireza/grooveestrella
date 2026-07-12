// src/app/album/[id]/page.jsx
// Explorer Page Route: 'id' represents a Spotify album ID exclusively in v1.
import { fetchSpotifyDataServer } from '@/lib/spotifyServer';
import AlbumDetailClient from './AlbumDetailClient';
import axios from 'axios';
import { getSpotifyToken } from '@/lib/spotifyServer';

// Album tracks are fetched via album/tracks endpoint, so let's write a helper
async function fetchAlbumTracks(id) {
  const token = await getSpotifyToken();
  if (!token) return [];
  try {
    const res = await axios.get(`https://api.spotify.com/v1/albums/${id}/tracks`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data.items;
  } catch (err) {
    console.error('Failed to fetch album tracks on server:', err.message);
    return [];
  }
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const album = await fetchSpotifyDataServer('album', id);

  if (!album) {
    return {
      title: 'Album Not Found | GrooveEstrella',
      description: 'The requested album could not be found on GrooveEstrella.',
    };
  }

  const artistsName = album.artists.map(a => a.name).join(', ');
  const coverUrl = album.images?.[0]?.url || 'https://placehold.co/600x600?text=No+Cover';

  return {
    title: `${album.name} by ${artistsName} | GrooveEstrella`,
    description: `Discover the album "${album.name}" by ${artistsName} on GrooveEstrella. Explore tracks, customize GrooveCards, and stream on top services.`,
    openGraph: {
      title: album.name,
      description: `Artist: ${artistsName} • ${album.total_tracks} tracks`,
      images: [{ url: coverUrl, width: 640, height: 640 }],
      type: 'music.album',
    },
    twitter: {
      card: 'summary_large_image',
      title: album.name,
      description: `Album: ${album.name} by ${artistsName}`,
      images: [coverUrl],
    }
  };
}

export default async function Page({ params }) {
  const { id } = await params;
  const initialAlbum = await fetchSpotifyDataServer('album', id);
  const initialTracks = await fetchAlbumTracks(id);

  return <AlbumDetailClient id={id} initialAlbum={initialAlbum} initialTracks={initialTracks} />;
}
