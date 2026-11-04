// src/app/api/track/[id]/route.js
import { NextResponse } from 'next/server';
import axios from 'axios';
import { fetchMusicBrainzTrackServer, searchMusicBrainzTrackServer } from '@/lib/musicbrainzServer';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Track ID required' }, { status: 400 });
    }

    const cleanId = decodeURIComponent(id).trim();
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanId);

    // 1. Direct MusicBrainz UUID lookup
    if (isUUID) {
      const track = await fetchMusicBrainzTrackServer(cleanId);
      if (track) return NextResponse.json(track);
    }

    // 2. iTunes Track ID lookup (e.g., 'itunes-1499378607' or numeric '1499378607')
    const itunesMatch = cleanId.match(/^(?:itunes-)?(\d{6,})$/i);
    if (itunesMatch) {
      const itunesId = itunesMatch[1];
      try {
        const itunesRes = await axios.get(`https://itunes.apple.com/lookup?id=${itunesId}`, { timeout: 6000 });
        const item = itunesRes.data?.results?.[0];
        if (item) {
          const trackTitle = item.trackName || item.trackCensoredName;
          const artistName = item.artistName;

          // Attempt MusicBrainz cross-match first for rich relations and credits
          let mbTrack = null;
          try {
            mbTrack = await searchMusicBrainzTrackServer(`${trackTitle} ${artistName}`);
          } catch (_) {}

          if (mbTrack) {
            const itunesCover = item.artworkUrl100?.replace('100x100bb', '600x600bb');
            if (!mbTrack.coverArt && itunesCover) mbTrack.coverArt = itunesCover;
            if (!mbTrack.url && itunesCover) mbTrack.url = itunesCover;
            if (item.previewUrl && !mbTrack.preview_url) mbTrack.preview_url = item.previewUrl;
            return NextResponse.json(mbTrack);
          }

          // Build canonical track object directly from iTunes data
          const coverArt = item.artworkUrl100?.replace('100x100bb', '600x600bb') || 'https://groove.amplecen.com/icon-512.png';
          return NextResponse.json({
            id: `itunes-${item.trackId}`,
            trackId: `itunes-${item.trackId}`,
            name: trackTitle,
            title: trackTitle,
            artist: artistName,
            artists: [{ name: artistName, id: item.artistId ? `itunes-artist-${item.artistId}` : null }],
            album: {
              id: item.collectionId ? `itunes-album-${item.collectionId}` : null,
              name: item.collectionName,
              images: [{ url: coverArt, width: 600, height: 600 }],
            },
            coverArt,
            url: coverArt,
            duration: item.trackTimeMillis,
            duration_ms: item.trackTimeMillis,
            releaseDate: item.releaseDate,
            releaseYear: item.releaseDate ? new Date(item.releaseDate).getFullYear() : null,
            explicit: item.trackExplicitness === 'explicit',
            popularity: 88,
            genres: item.primaryGenreName ? [item.primaryGenreName] : [],
            tags: item.primaryGenreName ? [item.primaryGenreName] : [],
            preview_url: item.previewUrl,
            spoURL: `https://open.spotify.com/search/${encodeURIComponent(trackTitle + ' ' + artistName)}`,
            YTURL: `https://www.youtube.com/results?search_query=${encodeURIComponent(trackTitle + ' ' + artistName)}`,
            external_urls: {
              apple_music: item.trackViewUrl,
              spotify: `https://open.spotify.com/search/${encodeURIComponent(trackTitle + ' ' + artistName)}`,
            },
          });
        }
      } catch (itunesErr) {
        console.warn('iTunes track lookup fallback error:', itunesErr.message);
      }
    }

    // 3. Fallback: text search in MusicBrainz catalog
    let track = await searchMusicBrainzTrackServer(cleanId);
    if (track) {
      return NextResponse.json(track);
    }

    return NextResponse.json({ error: 'Track not found' }, { status: 404 });
  } catch (err) {
    console.error('API track lookup error:', err);
    return NextResponse.json({ error: 'Server error retrieving track' }, { status: 500 });
  }
}
