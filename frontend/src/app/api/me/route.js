// src/app/api/me/route.js
import { getSpotifyAccessToken } from '@/lib/spotifyUser';
import axios from 'axios';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const token = await getSpotifyAccessToken();

    if (!token) {
      return NextResponse.json({ error: 'No access token found' }, { status: 401 });
    }

    const [profileRes, playlistsRes] = await Promise.all([
      axios.get('https://api.spotify.com/v1/me', {
        headers: { Authorization: `Bearer ${token}` }
      }),
      axios.get('https://api.spotify.com/v1/me/playlists', {
        headers: { Authorization: `Bearer ${token}` }
      })
    ]);

    const profile = profileRes.data;
    const playlists = playlistsRes.data;

    return NextResponse.json({
      profile: {
        display_name: profile.display_name,
        image: profile.images?.[0]?.url || null,
        country: profile.country,
        product: profile.product,
        id: profile.id
      },
      playlists: playlists
    });
  } catch (error) {
    console.error('API Error /api/me:', error.response?.data || error.message);
    return NextResponse.json(
      { error: 'Failed to fetch user profile', details: error.response?.data || error.message },
      { status: error.response?.status || 500 }
    );
  }
}
