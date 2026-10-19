// src/app/api/artist/[id]/route.js
import { NextResponse } from 'next/server';
import { fetchMusicBrainzArtistServer, searchMusicBrainzArtistsServer } from '@/lib/musicbrainzServer';
import { lookupItunesArtist } from '@/lib/itunesSearch';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Artist ID required' }, { status: 400 });
    }

    const cleanId = typeof id === 'string' ? id.trim() : '';
    let artist = null;

    // 1. If numeric or iTunes URI, check iTunes provider first
    if (/^\d+$/.test(cleanId) || cleanId.startsWith('itunes:')) {
      artist = await lookupItunesArtist(cleanId);
    }

    // 2. MusicBrainz lookup
    if (!artist) {
      artist = await fetchMusicBrainzArtistServer(id);
    }

    // 3. Search fallback
    if (!artist) {
      const searchRes = await searchMusicBrainzArtistsServer(decodeURIComponent(id), 1);
      if (searchRes.length > 0) {
        artist = await fetchMusicBrainzArtistServer(searchRes[0].id);
      }
    }

    // 4. Fallback to iTunes lookup if not yet checked
    if (!artist && !/^\d+$/.test(cleanId)) {
      artist = await lookupItunesArtist(cleanId);
    }

    if (!artist) {
      return NextResponse.json({ error: 'Artist not found' }, { status: 404 });
    }

    return NextResponse.json(artist);
  } catch (err) {
    console.error('API artist lookup error:', err);
    return NextResponse.json({ error: 'Server error retrieving artist' }, { status: 500 });
  }
}
