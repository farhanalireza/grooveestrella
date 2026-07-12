// src/app/api/me/albums/route.js
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
    const offset = searchParams.get('offset') || '0';

    const res = await axios.get(`https://api.spotify.com/v1/me/albums?limit=${limit}&offset=${offset}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    return NextResponse.json(res.data);
  } catch (error) {
    console.error('API Error /api/me/albums:', error.response?.data || error.message);
    return NextResponse.json(
      { error: 'Failed to fetch user albums', details: error.response?.data || error.message },
      { status: error.response?.status || 500 }
    );
  }
}
