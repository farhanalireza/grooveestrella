// src/app/api/search/route.js
import { NextResponse } from 'next/server';
import { 
  searchMusicBrainzTracksServer, 
  searchMusicBrainzArtistsServer, 
  searchMusicBrainzAlbumsServer 
} from '@/lib/musicbrainzServer';
import { 
  searchItunesTracks, 
  searchItunesAlbums, 
  searchItunesArtists 
} from '@/lib/itunesSearch';

/**
 * Search Provider Toggle:
 * Set to 'itunes' to test the Apple iTunes Search API.
 * Set to 'musicbrainz' or set process.env.SEARCH_PROVIDER='musicbrainz' to revert back instantly.
 */
export const DEFAULT_SEARCH_PROVIDER = process.env.SEARCH_PROVIDER || 'itunes';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const type = searchParams.get('type') || 'track';
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    // Allow query-level override for side-by-side testing: e.g. ?provider=musicbrainz
    const provider = (searchParams.get('provider') || DEFAULT_SEARCH_PROVIDER).toLowerCase();

    if (!query || !query.trim()) {
      return NextResponse.json({ results: [] });
    }

    const cleanQuery = query.trim();
    let results = [];

    if (provider === 'itunes') {
      if (type === 'artist') {
        results = await searchItunesArtists(cleanQuery, limit);
      } else if (type === 'album') {
        results = await searchItunesAlbums(cleanQuery, limit);
      } else {
        // Default to track search
        results = await searchItunesTracks(cleanQuery, limit);
      }

      // If iTunes returns zero results, fallback gracefully to MusicBrainz
      if (!results || results.length === 0) {
        if (type === 'artist') {
          results = await searchMusicBrainzArtistsServer(cleanQuery, limit);
        } else if (type === 'album') {
          results = await searchMusicBrainzAlbumsServer(cleanQuery, limit);
        } else {
          results = await searchMusicBrainzTracksServer(cleanQuery, limit);
        }
      }
    } else {
      // MusicBrainz search provider
      if (type === 'artist') {
        results = await searchMusicBrainzArtistsServer(cleanQuery, limit);
      } else if (type === 'album') {
        results = await searchMusicBrainzAlbumsServer(cleanQuery, limit);
      } else {
        results = await searchMusicBrainzTracksServer(cleanQuery, limit);
      }
    }

    return NextResponse.json({ results, type, query: cleanQuery, provider });
  } catch (error) {
    console.error('Search API Route Error:', error);
    return NextResponse.json({ error: 'Server error searching music catalog', results: [] }, { status: 500 });
  }
}
