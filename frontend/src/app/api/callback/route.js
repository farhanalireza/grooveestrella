// src/app/api/callback/route.js
import axios from 'axios';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json({ error: 'Missing code parameter' }, { status: 400 });
    }

    const host = request.headers.get('host') || 'localhost:3000';
    const proto = request.headers.get('x-forwarded-proto') || 'http';
    const redirectUri = process.env.SPOTIFY_REDIRECT_URI || `${proto}://${host}/callback`;
    
    const clientId = process.env.SPOTIFY_CLIENT_ID || 'b122c002e81948f1934fcdc254dfdbe1';
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET || '7ab31e87bb824bdfb319c51c5e33d672';

    const tokenUrl = 'https://accounts.spotify.com/api/token';
    const payload = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: redirectUri,
    });

    const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    
    const res = await axios.post(tokenUrl, payload.toString(), {
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const tokens = res.data;

    // Set secure HTTP-only cookies for tokens
    const response = NextResponse.json(tokens);
    
    response.cookies.set('spotify_access_token', tokens.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: tokens.expires_in, // expires when token expires
    });

    if (tokens.refresh_token) {
      response.cookies.set('spotify_refresh_token', tokens.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 30 * 24 * 60 * 60, // 30 days
      });
    }

    return response;
  } catch (error) {
    console.error('Spotify token exchange failed:', error.response?.data || error.message);
    return NextResponse.json(
      { error: 'Token exchange failed', details: error.response?.data || error.message },
      { status: 500 }
    );
  }
}
