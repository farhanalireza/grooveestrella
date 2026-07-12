// src/app/api/me/artists/route.js
import { getSpotifyAccessToken } from '@/lib/spotifyUser';
import axios from 'axios';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const token = await getSpotifyAccessToken();
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '20';
    const after = searchParams.get('after') || '';

    let url = `https://api.spotify.com/v1/me/following?type=artist&limit=${limit}`;
    if (after) {
      url += `&after=${after}`;
    }

    const res = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` }
    });

    return NextResponse.json(res.data);
  } catch (error) {
    console.error('API Error /api/me/artists:', error.response?.data || error.message);
    return NextResponse.json(
      { error: 'Failed to fetch user followed artists', details: error.response?.data || error.message },
      { status: error.response?.status || 500 }
    );
  }
}
