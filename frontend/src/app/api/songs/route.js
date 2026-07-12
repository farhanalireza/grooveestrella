import { query } from '@/lib/db';
import { FALLBACK_SONGS } from '@/lib/fallbackSongs';
import { NextResponse } from 'next/server';

const GENRES = Object.keys(FALLBACK_SONGS);

export async function GET() {
  try {
    const songs = await query('SELECT * FROM music_recommendations');
    
    const formatted = songs.map(song => {
      const row = { id: song.id };
      GENRES.forEach(g => {
        row[g] = song[g];
      });
      return row;
    });

    return NextResponse.json(formatted);
  } catch (error) {
    console.warn('Database connection failed, using high-quality Spotify suggestions fallback:', error.message);
    
    // Construct 10 fallback rows, one song from each genre list per row
    const formatted = Array.from({ length: 10 }, (_, i) => {
      const row = { id: i + 1 };
      GENRES.forEach(genre => {
        row[genre] = FALLBACK_SONGS[genre][i] || FALLBACK_SONGS[genre][0];
      });
      return row;
    });

    return NextResponse.json(formatted);
  }
}
