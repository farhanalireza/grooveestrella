// src/app/artist/[id]/page.jsx
// Explorer Page Route: 'id' represents a Spotify artist ID exclusively in v1.
import { fetchSpotifyDataServer, getSpotifyToken } from '@/lib/spotifyServer';
import ArtistDetailClient from './ArtistDetailClient';
import axios from 'axios';

async function fetchArtistExtras(id) {
  const token = await getSpotifyToken();
  if (!token) return { topTracks: [], albums: [] };

  try {
    const [topTracksRes, albumsRes] = await Promise.all([
      axios.get(`https://api.spotify.com/v1/artists/${id}/top-tracks?market=US`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      axios.get(`https://api.spotify.com/v1/artists/${id}/albums?include_groups=album,single&market=US`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ]);

    // De-duplicate albums by name
    const uniqueAlbums = [];
    const seen = new Set();
    for (const album of albumsRes.data.items) {
      if (!seen.has(album.name)) {
        uniqueAlbums.push(album);
        seen.add(album.name);
      }
    }

    return {
      topTracks: topTracksRes.data.tracks || [],
      albums: uniqueAlbums.slice(0, 12),
    };
  } catch (err) {
    console.error('Failed to fetch artist extra data on server:', err.message);
    return { topTracks: [], albums: [] };
  }
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const artist = await fetchSpotifyDataServer('artist', id);

  if (!artist) {
    return {
      title: 'Artist Not Found | GrooveEstrella',
      description: 'The requested artist could not be found on GrooveEstrella.',
    };
  }

  const coverUrl = artist.images?.[0]?.url || 'https://placehold.co/600x600?text=No+Image';

  return {
    title: `${artist.name} | GrooveEstrella`,
    description: `Explore "${artist.name}" on GrooveEstrella. View discography, top tracks, and share artist cards with custom designs.`,
    openGraph: {
      title: artist.name,
      description: `Followers: ${artist.followers?.total?.toLocaleString()} • Genres: ${artist.genres?.join(', ')}`,
      images: [{ url: coverUrl, width: 640, height: 640 }],
      type: 'profile',
    },
    twitter: {
      card: 'summary_large_image',
      title: artist.name,
      description: `Discover ${artist.name} on GrooveEstrella`,
      images: [coverUrl],
    }
  };
}

export default async function Page({ params }) {
  const { id } = await params;
  const initialArtist = await fetchSpotifyDataServer('artist', id);
  const { topTracks, albums } = await fetchArtistExtras(id);

  return (
    <ArtistDetailClient 
      id={id} 
      initialArtist={initialArtist} 
      initialTopTracks={topTracks} 
      initialAlbums={albums} 
    />
  );
}
