// src/app/api/songs/by-mood/route.js
import { query } from '@/lib/db';
import { FALLBACK_SONGS } from '@/lib/fallbackSongs';
import { MusicNLPProcessor } from '@/lib/nlpProcessor';
import { NextResponse } from 'next/server';

const nlpProcessor = new MusicNLPProcessor();

export async function POST(request) {
  try {
    const data = await request.json();
    const moodText = data.mood || '';
    const limit = data.limit || 10;

    if (!moodText) {
      return NextResponse.json({ error: 'Mood text is required' }, { status: 400 });
    }

    const analysis = nlpProcessor.process_user_message(moodText);
    const genres = analysis.recommended_genres || [];

    const allSongs = [];
    const limitPerGenre = Math.floor(limit / (genres.length || 1)) + 2;

    for (const genre of genres) {
      try {
        const songs = await query(
          `SELECT ${genre} FROM music_recommendations WHERE ${genre} IS NOT NULL AND ${genre} != '' LIMIT ?`,
          [limitPerGenre]
        );
        const genreSongs = songs.map(row => row[genre]).filter(Boolean);
        allSongs.push(...genreSongs);
      } catch (dbErr) {
        console.warn(`Database query failed for genre ${genre} during mood analysis, using fallback:`, dbErr.message);
        const allGenreSongs = FALLBACK_SONGS[genre] || [];
        // Take a random selection or slice up to limitPerGenre
        const genreSongs = allGenreSongs.slice(0, limitPerGenre);
        allSongs.push(...genreSongs);
      }
    }

    const uniqueSongs = Array.from(new Set(allSongs));

    // Shuffle the songs
    for (let i = uniqueSongs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [uniqueSongs[i], uniqueSongs[j]] = [uniqueSongs[j], uniqueSongs[i]];
    }

    return NextResponse.json({
      songs: uniqueSongs.slice(0, limit),
      detected_emotions: analysis.emotions,
      confidence: analysis.confidence,
      recommended_genres: genres
    });
  } catch (error) {
    console.error('API Error /api/songs/by-mood:', error);
    return NextResponse.json({ error: `Mood analysis failed: ${error.message}` }, { status: 500 });
  }
}
