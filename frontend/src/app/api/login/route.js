// src/app/api/login/route.js
import { NextResponse } from 'next/server';

export async function GET(request) {
  const host = request.headers.get('host') || 'localhost:3000';
  const proto = request.headers.get('x-forwarded-proto') || 'http';
  
  // Spotify login is retired in favor of open MusicBrainz catalog.
  // Seamlessly redirect to the Account dashboard.
  return NextResponse.redirect(`${proto}://${host}/account`);
}
