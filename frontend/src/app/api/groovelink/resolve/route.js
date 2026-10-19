// src/app/api/groovelink/resolve/route.js
import { NextResponse } from 'next/server';
import { resolveDirectPlatformLinks } from '@/lib/groovelinkResolver';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const title = searchParams.get('title') || '';
    const artist = searchParams.get('artist') || '';
    const type = searchParams.get('type') || 'track';
    const mbid = searchParams.get('mbid') || searchParams.get('id') || '';

    if (!title && !artist) {
      return NextResponse.json({ error: 'Title or artist required' }, { status: 400 });
    }

    const { links, isDirect } = await resolveDirectPlatformLinks({
      title,
      artist,
      type,
      mbid,
    });

    return NextResponse.json({
      success: true,
      links,
      isDirect,
    });
  } catch (error) {
    console.error('GrooveLink resolve API error:', error);
    return NextResponse.json({ error: 'Failed to resolve streaming links' }, { status: 500 });
  }
}
