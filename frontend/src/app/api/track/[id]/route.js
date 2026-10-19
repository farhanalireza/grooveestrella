// src/app/api/track/[id]/route.js
import { NextResponse } from 'next/server';
import { fetchMusicBrainzTrackServer, searchMusicBrainzTrackServer } from '@/lib/musicbrainzServer';
import { lookupItunesTrack } from '@/lib/itunesSearch';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Track ID required' }, { status: 400 });
    }

    const cleanId = typeof id === 'string' ? id.trim() : '';
    let track = null;

    // 1. If numeric or iTunes URI, check iTunes provider first
    if (/^\d+$/.test(cleanId) || cleanId.startsWith('itunes:')) {
      track = await lookupItunesTrack(cleanId);
    }

    // 2. MusicBrainz UUID lookup
    if (!track) {
      track = await fetchMusicBrainzTrackServer(cleanId);
    }

    // 3. Fallback search by title/query
    if (!track && !cleanId.startsWith('local-')) {
      track = await searchMusicBrainzTrackServer(decodeURIComponent(cleanId));
    }

    // 4. Fallback to iTunes lookup if not yet checked
    if (!track && !/^\d+$/.test(cleanId)) {
      track = await lookupItunesTrack(cleanId);
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
