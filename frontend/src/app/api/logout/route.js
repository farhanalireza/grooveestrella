// src/app/api/logout/route.js
import { NextResponse } from 'next/server';

export async function GET() {
  const response = NextResponse.json({ message: 'Logged out successfully' });

  // Delete cookies by setting them with maxAge: 0
  response.cookies.set('spotify_access_token', '', { path: '/', maxAge: 0 });
  response.cookies.set('spotify_refresh_token', '', { path: '/', maxAge: 0 });

  return response;
}
export async function POST() {
  return GET();
}
