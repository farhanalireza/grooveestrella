// src/app/api/album/[id]/route.js
import { NextResponse } from 'next/server';
import { fetchMusicBrainzAlbumServer, searchMusicBrainzAlbumsServer } from '@/lib/musicbrainzServer';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Album ID required' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const releaseId = searchParams.get('release');

    let { album, tracks } = await fetchMusicBrainzAlbumServer(id, releaseId);
    if (!album) {
      const searchRes = await searchMusicBrainzAlbumsServer(decodeURIComponent(id), 1);
      if (searchRes.length > 0) {
        const found = await fetchMusicBrainzAlbumServer(searchRes[0].id, releaseId);
        album = found.album;
        tracks = found.tracks;
      }
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
