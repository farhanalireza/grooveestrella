// src/app/api/convert/route.js
import { NextResponse } from 'next/server';
import { resolveSharedLink } from '@/lib/groovelinkResolver';

export async function POST(request) {
  try {
    const { url } = await request.json();
    if (!url || typeof url !== 'string' || !url.trim()) {
      return NextResponse.json({ error: 'URL or text is required' }, { status: 400 });
    }

    const result = await resolveSharedLink(url.trim());

    if (!result || !result.success) {
      return NextResponse.json(
        { error: result?.error || 'Could not find or match music from this link' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      platform: result.platform,
      type: result.type,
      id: result.id,
      redirectUrl: result.redirectUrl,
      matchedTitle: result.matchedTitle,
      sourceEntity: result.sourceEntity,
    });
  } catch (error) {
    console.error('Link conversion API error:', error);
    return NextResponse.json({ error: 'Server error processing link' }, { status: 500 });
  }
}
