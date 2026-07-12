// src/lib/spotifyServer.js
import axios from 'axios';

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID || 'b122c002e81948f1934fcdc254dfdbe1';
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET || '7ab31e87bb824bdfb319c51c5e33d672';

let tokenCache = {
  token: null,
  expiresAt: 0
};

export async function getSpotifyToken() {
  if (tokenCache.token && Date.now() < tokenCache.expiresAt) {
    return tokenCache.token;
  }

  try {
    const authHeader = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
    const response = await axios.post(
      'https://accounts.spotify.com/api/token',
      'grant_type=client_credentials',
      {
        headers: {
          'Authorization': `Basic ${authHeader}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    tokenCache.token = response.data.access_token;
    tokenCache.expiresAt = Date.now() + (response.data.expires_in * 1000) - 60000;
    return tokenCache.token;
  } catch (error) {
    console.error('Failed to get Spotify token directly on server:', error.message);
    return null;
  }
}

export async function fetchSpotifyDataServer(type, id) {
  const token = await getSpotifyToken();
  if (!token) return null;

  try {
    const response = await axios.get(`https://api.spotify.com/v1/${type}s/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch ${type} details on server for ID ${id}:`, error.message);
    return null;
  }
}

export async function searchSpotifyTrackServer(query) {
  const token = await getSpotifyToken();
  if (!token) return null;

  try {
    const response = await axios.get(`https://api.spotify.com/v1/search`, {
      params: {
        q: query,
        type: 'track',
        limit: 1
      },
      headers: { Authorization: `Bearer ${token}` }
    });
    const items = response.data?.tracks?.items;
    return items && items.length > 0 ? items[0] : null;
  } catch (error) {
    console.error(`Failed to search Spotify track for query "${query}":`, error.message);
    return null;
  }
}

export async function searchSpotifyTracksServer(query, limit = 6) {
  const token = await getSpotifyToken();
  if (!token) return [];

  try {
    const response = await axios.get(`https://api.spotify.com/v1/search`, {
      params: {
        q: query,
        type: 'track',
        limit: limit
      },
      headers: { Authorization: `Bearer ${token}` }
    });
    const items = response.data?.tracks?.items || [];
    return items.map(track => ({
      id: track.id,
      title: track.name,
      artist: track.artists?.map(a => a.name).join(', ') || 'Unknown Artist',
      album: track.album?.name || '',
      coverArt: track.album?.images?.[0]?.url || 'https://placehold.co/300x300?text=No+Cover',
      releaseYear: track.album?.release_date ? new Date(track.album.release_date).getFullYear() : null,
      durationMs: track.duration_ms || 0
    }));
  } catch (error) {
    console.error(`Failed to search Spotify tracks for query "${query}":`, error.message);
    return [];
  }
}


