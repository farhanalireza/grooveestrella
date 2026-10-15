// src/app/api/token/route.js
import { NextResponse } from 'next/server';

export async function GET() {
  // Public open token for MusicBrainz session compatibility
  return NextResponse.json({
    access_token: 'musicbrainz-public-token',
    provider: 'musicbrainz',
    status: 'active'
  });
}
