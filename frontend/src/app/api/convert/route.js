// src/app/api/convert/route.js
import { NextResponse } from 'next/server';
import { parseMusicUrl } from '@/lib/musicProviders';
import { searchMusicBrainzTrackServer } from '@/lib/musicbrainzServer';
import axios from 'axios';

export async function POST(request) {
  try {
    const { url } = await request.json();
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const parsed = parseMusicUrl(url);
    if (!parsed) {
      // If we couldn't parse it as a standard track URL, let's treat the text as a raw query
      // and search MusicBrainz for it.
      const cleanedUrl = url.trim();
      if (cleanedUrl.length > 0) {
        const trackMatch = await searchMusicBrainzTrackServer(cleanedUrl);
        if (trackMatch) {
          return NextResponse.json({
            success: true,
            platform: 'musicbrainz',
            type: 'track',
            id: trackMatch.id,
            redirectUrl: `/s/musicbrainz/track/${trackMatch.id}`
          });
        }
      }
      return NextResponse.json({ error: 'Invalid or unsupported music link' }, { status: 400 });
    }

    const { platform, type, id } = parsed;

    if (platform === 'musicbrainz') {
      return NextResponse.json({
        success: true,
        platform: 'musicbrainz',
        type: type,
        id: id,
        redirectUrl: `/s/musicbrainz/${type}/${id}`
      });
    }

    if (platform === 'spotify') {
      return NextResponse.json({
        success: true,
        platform: 'spotify',
        type: type,
        id: id,
        redirectUrl: `/s/spotify/${type}/${id}`
      });
    }

    if (platform === 'youtube') {
      try {
        // Query free YouTube OEmbed endpoint to get the video title
        const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`;
        const oembedResponse = await axios.get(oembedUrl);
        const title = oembedResponse.data?.title;
        
        if (title) {
          // Search MusicBrainz using the video title to see if we can find the canonical track
          const cleanTitle = title
            .replace(/\((?:official|music|lyric)?\s*video\)/gi, '')
            .replace(/\[(?:official|music|lyric)?\s*video\]/gi, '')
            .replace(/\((?:audio|lyrics|offizielle|clip)\)/gi, '')
            .trim();
            
          const trackMatch = await searchMusicBrainzTrackServer(cleanTitle);
          if (trackMatch) {
            return NextResponse.json({
              success: true,
              platform: 'musicbrainz',
              type: 'track',
              id: trackMatch.id,
              redirectUrl: `/s/musicbrainz/track/${trackMatch.id}`,
              note: 'Matched to MusicBrainz canonical track'
            });
          }
        }
      } catch (err) {
        console.warn('Failed to fetch YouTube OEmbed or search MusicBrainz:', err.message);
      }

      // If MusicBrainz search fails, route to YouTube specific landing page
      return NextResponse.json({
        success: true,
        platform: 'youtube',
        type: 'track',
        id: id,
        redirectUrl: `/s/youtube/track/${id}`
      });
    }

    if (platform === 'apple_music') {
      return NextResponse.json({
        success: true,
        platform: 'apple_music',
        type: type,
        id: id,
        redirectUrl: `/s/apple_music/${type}/${id}`
      });
    }

    return NextResponse.json({ error: 'Unsupported music platform' }, { status: 400 });
  } catch (error) {
    console.error('Link conversion API error:', error);
    return NextResponse.json({ error: 'Server error processing link' }, { status: 500 });
  }
}
