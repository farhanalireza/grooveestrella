// src/app/api/album/[id]/route.js
import { NextResponse } from 'next/server';
import { fetchMusicBrainzAlbumServer, searchMusicBrainzAlbumsServer } from '@/lib/musicbrainzServer';
import { lookupItunesAlbum } from '@/lib/itunesSearch';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Album ID required' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const releaseId = searchParams.get('release');
    const cleanId = typeof id === 'string' ? id.trim() : '';

    let album = null;
    let tracks = [];

    // 1. If numeric or iTunes URI, check iTunes provider first
    if (/^\d+$/.test(cleanId) || cleanId.startsWith('itunes:')) {
      const itunesData = await lookupItunesAlbum(cleanId);
      album = itunesData.album;
      tracks = itunesData.tracks;
    }

    // 2. MusicBrainz lookup
    if (!album) {
      const mbData = await fetchMusicBrainzAlbumServer(id, releaseId);
      album = mbData.album;
      tracks = mbData.tracks;
    }

    // 3. Search fallback
    if (!album) {
      const searchRes = await searchMusicBrainzAlbumsServer(decodeURIComponent(id), 1);
      if (searchRes.length > 0) {
        const found = await fetchMusicBrainzAlbumServer(searchRes[0].id, releaseId);
        album = found.album;
        tracks = found.tracks;
      }
    }

    // 4. Fallback to iTunes lookup if not yet checked
    if (!album && !/^\d+$/.test(cleanId)) {
      const itunesData = await lookupItunesAlbum(cleanId);
      album = itunesData.album;
      tracks = itunesData.tracks;
    }

    if (!album) {
      return NextResponse.json({ error: 'Album not found' }, { status: 404 });
    }

    return NextResponse.json({ album, tracks });
  } catch (err) {
    console.error('API album lookup error:', err);
    return NextResponse.json({ error: 'Server error retrieving album' }, { status: 500 });
  }
}
