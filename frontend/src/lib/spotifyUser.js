// src/lib/spotifyUser.js
import axios from 'axios';
import { cookies } from 'next/headers';

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID || 'b122c002e81948f1934fcdc254dfdbe1';
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET || '7ab31e87bb824bdfb319c51c5e33d672';

export async function getSpotifyAccessToken() {
  const cookieStore = await cookies();
  let accessToken = cookieStore.get('spotify_access_token')?.value;

  if (accessToken) {
    return accessToken;
  }

  const refreshToken = cookieStore.get('spotify_refresh_token')?.value;
  if (!refreshToken) {
    return null;
  }

  try {
    const authHeader = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
    const response = await axios.post(
      'https://accounts.spotify.com/api/token',
      new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      }).toString(),
      {
        headers: {
          'Authorization': `Basic ${authHeader}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    const tokens = response.data;
    
    cookieStore.set('spotify_access_token', tokens.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: tokens.expires_in
    });

    if (tokens.refresh_token) {
      cookieStore.set('spotify_refresh_token', tokens.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 30 * 24 * 60 * 60
      });
    }

    return tokens.access_token;
  } catch (error) {
    console.error('Failed to refresh Spotify user access token:', error.response?.data || error.message);
    return null;
  }
}
