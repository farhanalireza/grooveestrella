// src/app/api/search/route.js
import { NextResponse } from 'next/server';
import { searchSpotifyTracksServer } from '@/lib/spotifyServer';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || !query.trim()) {
      return NextResponse.json({ results: [] });
    }

    const results = await searchSpotifyTracksServer(query.trim(), 6);
    return NextResponse.json({ results });
  } catch (error) {
    console.error('Search API Route Error:', error);
    return NextResponse.json({ error: 'Server error searching tracks' }, { status: 500 });
  }
}
