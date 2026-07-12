// src/app/api/token/route.js
import { getSpotifyToken } from '@/lib/spotifyServer';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const token = await getSpotifyToken();
    if (!token) {
      return NextResponse.json({ error: 'Failed to retrieve Spotify token' }, { status: 500 });
    }
    return NextResponse.json({ access_token: token });
  } catch (error) {
    console.error('API Error /api/token:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
