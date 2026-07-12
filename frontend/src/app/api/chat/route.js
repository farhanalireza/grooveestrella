// src/app/api/chat/route.js
import { query } from '@/lib/db';
import { MusicNLPProcessor } from '@/lib/nlpProcessor';
import { NextResponse } from 'next/server';

const nlpProcessor = new MusicNLPProcessor();

async function getRandomSongsByGenre(genre, limit) {
  try {
    const songs = await query(
      `SELECT ${genre} FROM music_recommendations WHERE ${genre} IS NOT NULL AND ${genre} != '' ORDER BY RAND() LIMIT ?`,
      [limit]
    );
    return songs.map(row => row[genre]).filter(Boolean);
  } catch (error) {
    console.error(`Error fetching random songs for genre ${genre}:`, error);
    return [];
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const userMessage = data.message || '';

    if (!userMessage) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Process user message using our ported NLP processor
    const analysis = nlpProcessor.process_user_message(userMessage);
    const response = nlpProcessor.generate_response(analysis, userMessage);

    const recommendedSongs = [];
    const responseGenres = response.genres || [];
    const songsPerGenre = Math.max(2, Math.floor(12 / (responseGenres.length || 1)));

    for (const genre of responseGenres) {
      const genreSongs = await getRandomSongsByGenre(genre, songsPerGenre);
      recommendedSongs.push(...genreSongs);
    }

    // Shuffle the array of recommended songs to mix genres
    for (let i = recommendedSongs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [recommendedSongs[i], recommendedSongs[j]] = [recommendedSongs[j], recommendedSongs[i]];
    }

    // Remove duplicates while maintaining the shuffled order
    const uniqueSongs = Array.from(new Set(recommendedSongs));

    return NextResponse.json({
      bot_message: response.message,
      recommended_songs: uniqueSongs.slice(0, 10),
      genres: responseGenres,
      follow_up: response.follow_up || '',
      analysis: {
        emotions: analysis.emotions,
        activities: analysis.activities,
        confidence: analysis.confidence
      },
      randomization_seed: Math.floor(Math.random() * 9000) + 1000
    });
  } catch (error) {
    console.error('API Error /api/chat:', error);
    return NextResponse.json({ error: `Chat processing failed: ${error.message}` }, { status: 500 });
  }
}
