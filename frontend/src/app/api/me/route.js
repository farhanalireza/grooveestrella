// src/app/api/me/route.js
import { NextResponse } from 'next/server';

export async function GET() {
  // Public open explorer profile (Spotify authentication pulled)
  return NextResponse.json({
    profile: {
      display_name: 'Music Explorer',
      image: null,
      country: 'Global',
      product: 'MusicBrainz Open Catalog',
      id: 'music-explorer',
    },
    playlists: {
      items: [],
      total: 0
    }
  });
}
