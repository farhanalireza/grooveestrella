// src/app/api/login/route.js
import { NextResponse } from 'next/server';

const SCOPES = [
  'user-read-private',
  'user-follow-read',
  'playlist-read-private',
  'playlist-read-collaborative',
  'streaming',
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing',
  'user-library-read'
].join(' ');

export async function GET(request) {
  const host = request.headers.get('host') || 'localhost:3000';
  const proto = request.headers.get('x-forwarded-proto') || 'http';
  
  // Dynamic redirect URI fallback
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI || `${proto}://${host}/callback`;
  const clientId = process.env.SPOTIFY_CLIENT_ID || 'b122c002e81948f1934fcdc254dfdbe1';

  const spotifyAuthUrl = new URL('https://accounts.spotify.com/authorize');
  spotifyAuthUrl.searchParams.append('response_type', 'code');
  spotifyAuthUrl.searchParams.append('client_id', clientId);
  spotifyAuthUrl.searchParams.append('scope', SCOPES);
  spotifyAuthUrl.searchParams.append('redirect_uri', redirectUri);

  return NextResponse.redirect(spotifyAuthUrl.toString());
}
