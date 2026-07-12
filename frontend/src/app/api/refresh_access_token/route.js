// src/app/api/refresh_access_token/route.js
import { getSpotifyAccessToken } from '@/lib/spotifyUser';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const token = await getSpotifyAccessToken();
    
    if (!token) {
      return NextResponse.json({ error: 'No refresh token available' }, { status: 401 });
    }

    return NextResponse.json({ access_token: token });
  } catch (error) {
    console.error('API Error /api/refresh_access_token:', error.message);
    return NextResponse.json({ error: 'Failed to refresh token' }, { status: 500 });
  }
}
