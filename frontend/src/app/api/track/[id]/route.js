// src/app/api/track/[id]/route.js
import { NextResponse } from 'next/server';
import { fetchMusicBrainzTrackServer, searchMusicBrainzTrackServer } from '@/lib/musicbrainzServer';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Track ID required' }, { status: 400 });
    }

    let track = await fetchMusicBrainzTrackServer(id);
    if (!track) {
      // Try resolving as text search if it's not a direct MBID
      track = await searchMusicBrainzTrackServer(decodeURIComponent(id));
    }

    if (!track) {
      return NextResponse.json({ error: 'Track not found' }, { status: 404 });
    }

    return NextResponse.json(track);
  } catch (err) {
    console.error('API track lookup error:', err);
    return NextResponse.json({ error: 'Server error retrieving track' }, { status: 500 });
  }
}
