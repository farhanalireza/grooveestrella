// src/app/api/entity/sync/route.js
import { NextResponse } from 'next/server';
import { ensureMusicEntity, getOrFetchMusicEntity, saveGrooveLinksForEntity } from '@/lib/supabase/musicEntities';

export async function POST(request) {
  try {
    const body = await request.json();
    const { mbid, type = 'album', title, artist, year, cover_art_url, groovelink = {} } = body;

    if (!mbid) {
      return NextResponse.json({ error: 'MBID is required' }, { status: 400 });
    }

    const entity = await ensureMusicEntity({
      mbid,
      type,
      title,
      artist,
      year: Number.isInteger(year) ? year : undefined,
      cover_art_url,
      groovelink,
    });

    if (!entity) {
      return NextResponse.json({ error: 'Could not resolve or sync music entity' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      entity,
    });
  } catch (error) {
    console.error('API /api/entity/sync error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to sync music entity' },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const mbid = searchParams.get('mbid') || searchParams.get('id');
    const type = searchParams.get('type') || 'album';

    if (!mbid) {
      return NextResponse.json({ error: 'MBID is required' }, { status: 400 });
    }

    const entity = await getOrFetchMusicEntity(mbid, type);
    if (!entity) {
      return NextResponse.json({ error: 'Entity not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      entity,
    });
  } catch (error) {
    console.error('API GET /api/entity/sync error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch music entity' },
      { status: 500 }
    );
  }
}
