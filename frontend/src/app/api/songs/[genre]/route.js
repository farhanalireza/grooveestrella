// src/app/api/songs/[genre]/route.js
import { query } from '@/lib/db';
import { FALLBACK_SONGS } from '@/lib/fallbackSongs';
import { NextResponse } from 'next/server';

const ALLOWED_GENRES = new Set([
  "sad_music",
  "romantic_music",
  "party_music",
  "happy_music",
  "melancholy_music",
  "focus_music",
  "instrumental_music",
  "k_pop_music",
  "electronic_music",
  "rnb_music",
  "blues_music",
  "personal_fav",
  "native_music",
  "classical_music",
  "workout_music",
  "rock_music",
  "rap_music",
  "pop_music",
  "jazz_music",
  "motivational_music",
  "trending_music",
  "latest_music",
  "top_music",
  "hidden_gems_music",
  "developers_choice_music",
]);

export async function GET(request, { params }) {
  try {
    const { genre } = await params;

    if (!ALLOWED_GENRES.has(genre)) {
      return NextResponse.json({ error: 'Invalid genre' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    let results = [];
    let totalItems = 0;

    try {
      // Count total non-null, non-empty tracks for the genre
      const countResult = await query(
        `SELECT COUNT(${genre}) as total FROM music_recommendations WHERE ${genre} IS NOT NULL AND ${genre} != ''`
      );
      totalItems = countResult[0]?.total || 0;

      // Fetch songs for this genre page
      const songs = await query(
        `SELECT ${genre} FROM music_recommendations WHERE ${genre} IS NOT NULL AND ${genre} != '' LIMIT ? OFFSET ?`,
        [limit, offset]
      );

      results = songs.map(row => row[genre]);
    } catch (dbError) {
      console.warn(`Database query failed for genre ${genre}, falling back to static list:`, dbError.message);
      const allGenreSongs = FALLBACK_SONGS[genre] || [];
      totalItems = allGenreSongs.length;
      results = allGenreSongs.slice(offset, offset + limit);
    }

    const nextOffset = offset + limit;
    const prevOffset = Math.max(0, offset - limit);

    const base_url = `${request.headers.get('x-forwarded-proto') || 'http'}://${request.headers.get('host')}/api/songs/${genre}`;
    const nextUrl = nextOffset < totalItems ? `${base_url}?offset=${nextOffset}&limit=${limit}` : null;
    const prevUrl = offset > 0 ? `${base_url}?offset=${prevOffset}&limit=${limit}` : null;

    return NextResponse.json({
      results,
      next_offset: nextOffset,
      total_items: totalItems,
      has_more: nextOffset < totalItems,
      length: results.length,
      next: nextUrl,
      prev: prevUrl,
    });
  } catch (error) {
    console.error('API Error /api/songs/[genre]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
