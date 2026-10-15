// src/app/api/search/route.js
import { NextResponse } from 'next/server';
import { 
  searchMusicBrainzTracksServer, 
  searchMusicBrainzArtistsServer, 
  searchMusicBrainzAlbumsServer 
} from '@/lib/musicbrainzServer';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const type = searchParams.get('type') || 'track';
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    if (!query || !query.trim()) {
      return NextResponse.json({ results: [] });
    }

    const cleanQuery = query.trim();
    let results = [];

    if (type === 'artist') {
      results = await searchMusicBrainzArtistsServer(cleanQuery, limit);
    } else if (type === 'album') {
      results = await searchMusicBrainzAlbumsServer(cleanQuery, limit);
    } else {
      // Default to track search
      results = await searchMusicBrainzTracksServer(cleanQuery, limit);
    }

    return NextResponse.json({ results, type, query: cleanQuery });
  } catch (error) {
    console.error('Search API Route Error:', error);
    return NextResponse.json({ error: 'Server error searching music catalog', results: [] }, { status: 500 });
  }
}
