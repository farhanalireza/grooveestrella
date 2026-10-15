// src/app/api/artist/[id]/route.js
import { NextResponse } from 'next/server';
import { fetchMusicBrainzArtistServer, searchMusicBrainzArtistsServer } from '@/lib/musicbrainzServer';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Artist ID required' }, { status: 400 });
    }

    let artist = await fetchMusicBrainzArtistServer(id);
    if (!artist) {
      const searchRes = await searchMusicBrainzArtistsServer(decodeURIComponent(id), 1);
      if (searchRes.length > 0) {
        artist = await fetchMusicBrainzArtistServer(searchRes[0].id);
      }
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
