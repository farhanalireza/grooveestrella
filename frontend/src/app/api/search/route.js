// src/app/api/search/route.js
import { NextResponse } from 'next/server';
import { 
  searchMusicBrainzTracksServer, 
  searchMusicBrainzArtistsServer, 
  searchMusicBrainzAlbumsServer 
} from '@/lib/musicbrainzServer';
import { createClient, isSupabaseServerConfigured } from '@/lib/supabase/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const type = searchParams.get('type') || 'track';
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    if (!query || !query.trim()) {
      return NextResponse.json({ results: [] });
    }

    const cleanQuery = query.trim();
    let results = [];

    if (type === 'artist') {
      results = await searchMusicBrainzArtistsServer(cleanQuery, limit);
    } else if (type === 'album') {
      results = await searchMusicBrainzAlbumsServer(cleanQuery, limit);
    } else if (type === 'user') {
      if (isSupabaseServerConfigured()) {
        const supabase = await createClient();
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url, bio, created_at')
          .or(`username.ilike.%${cleanQuery}%,display_name.ilike.%${cleanQuery}%`)
          .limit(limit);

        if (!error && Array.isArray(profiles)) {
          const profileIds = profiles.map((p) => p.id);
          const followerCountMap = {};

          if (profileIds.length > 0) {
            const { data: followsData } = await supabase
              .from('follows')
              .select('following_id')
              .in('following_id', profileIds);

            if (followsData) {
              for (const f of followsData) {
                followerCountMap[f.following_id] = (followerCountMap[f.following_id] || 0) + 1;
              }
            }
          }

          results = profiles.map((p) => ({
            id: p.id,
            type: 'user',
            username: p.username || '',
            title: p.display_name || p.username || 'Critic',
            name: p.display_name || p.username || 'Critic',
            url: p.avatar_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(p.username || p.id)}`,
            bio: p.bio || '',
            followers: followerCountMap[p.id] || 0,
          }));
        }
      }
    } else {
      // Default to track search
      results = await searchMusicBrainzTracksServer(cleanQuery, limit);
    }

    return NextResponse.json({ results, type, query: cleanQuery });
  } catch (error) {
    console.error('Search API Route Error:', error);
    return NextResponse.json({ error: 'Server error searching music catalog', results: [] }, { status: 500 });
  }
}
