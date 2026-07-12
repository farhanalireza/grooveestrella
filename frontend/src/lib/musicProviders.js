// src/lib/musicProviders.js
import { fetchSpotifyDataServer, searchSpotifyTrackServer } from './spotifyServer';
import axios from 'axios';

// Regex parsers for different platforms supporting track, album, and artist types
const SPOTIFY_REGEX = /https?:\/\/(?:open|play)\.spotify\.com\/(track|album|artist)\/([a-zA-Z0-9]{22})/i;
const YOUTUBE_TRACK_REGEX = /https?:\/\/(?:(?:www|music)\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/i;
const YOUTUBE_SHORT_REGEX = /https?:\/\/youtu\.be\/([a-zA-Z0-9_-]{11})/i;
const APPLE_MUSIC_REGEX = /https?:\/\/music\.apple\.com\/[a-z]{2}\/(album|artist)\/[^\/]+\/(\d+)(?:\?i=(\d+))?/i;

/**
 * Parses a music URL to identify the platform, type (track, album, artist), and ID.
 * @param {string} url 
 * @returns {{platform: string, type: string, id: string} | null}
 */
export function parseMusicUrl(url) {
  if (!url) return null;

  // Spotify
  let match = url.match(SPOTIFY_REGEX);
  if (match) {
    return { platform: 'spotify', type: match[1], id: match[2] };
  }

  // YouTube (Videos are treated as videos, not tracks)
  match = url.match(YOUTUBE_TRACK_REGEX) || url.match(YOUTUBE_SHORT_REGEX);
  if (match) {
    return { platform: 'youtube', type: 'video', id: match[1] };
  }

  // Apple Music
  match = url.match(APPLE_MUSIC_REGEX);
  if (match) {
    const amType = match[1]; // 'album' or 'artist'
    const id = match[2];
    const trackId = match[3];

    if (amType === 'album' && trackId) {
      return { platform: 'apple_music', type: 'track', id: trackId };
    } else if (amType === 'album') {
      return { platform: 'apple_music', type: 'album', id: id };
    } else if (amType === 'artist') {
      return { platform: 'apple_music', type: 'artist', id: id };
    }
  }

  return null;
}

/**
 * Fetches metadata for a track, album, or artist from the specified platform.
 * @param {string} platform 
 * @param {string} type 
 * @param {string} id 
 */
export async function getTrackMetadata(platform, type = 'track', id) {
  try {
    if (platform === 'spotify') {
      const data = await fetchSpotifyDataServer(type, id);
      if (!data) return null;
      
      if (type === 'track') {
        return {
          type: 'track',
          title: data.name,
          artist: data.artists?.map(a => a.name).join(', ') || 'Unknown Artist',
          album: data.album?.name || '',
          coverArt: data.album?.images?.[0]?.url || 'https://placehold.co/300x300?text=No+Cover',
          releaseYear: data.album?.release_date ? new Date(data.album.release_date).getFullYear() : null,
          durationMs: data.duration_ms || 0,
          originalPlatform: 'spotify',
          originalId: id
        };
      }
      
      if (type === 'album') {
        return {
          type: 'album',
          title: data.name,
          artist: data.artists?.map(a => a.name).join(', ') || 'Unknown Artist',
          album: 'Album',
          coverArt: data.images?.[0]?.url || 'https://placehold.co/300x300?text=No+Cover',
          releaseYear: data.release_date ? new Date(data.release_date).getFullYear() : null,
          durationMs: 0,
          originalPlatform: 'spotify',
          originalId: id
        };
      }

      if (type === 'artist') {
        return {
          type: 'artist',
          title: data.name,
          artist: 'Artist',
          album: 'Artist Profile',
          coverArt: data.images?.[0]?.url || 'https://placehold.co/300x300?text=No+Image',
          releaseYear: null,
          durationMs: 0,
          originalPlatform: 'spotify',
          originalId: id
        };
      }
    }
    
    if (platform === 'youtube') {
      try {
        const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`;
        const oembedResponse = await axios.get(oembedUrl);
        const rawTitle = oembedResponse.data?.title || 'Unknown Video';
        const coverArt = oembedResponse.data?.thumbnail_url || 'https://placehold.co/300x300?text=YouTube';
        
        let title = rawTitle;
        let artist = 'YouTube Creator';
        
        if (rawTitle.includes(' - ')) {
          const parts = rawTitle.split(' - ');
          artist = parts[0].trim();
          title = parts[1]
            .replace(/\((?:official|music|lyric)?\s*video\)/gi, '')
            .replace(/\[(?:official|music|lyric)?\s*video\]/gi, '')
            .replace(/\((?:audio|lyrics|offizielle|clip)\)/gi, '')
            .trim();
        }
        
        return {
          type: 'video',
          title,
          artist,
          album: 'YouTube Video',
          coverArt,
          releaseYear: new Date().getFullYear(),
          durationMs: 0,
          originalPlatform: 'youtube',
          originalId: id
        };
      } catch (err) {
        console.warn('Failed to fetch YouTube OEmbed metadata in getTrackMetadata:', err.message);
        return {
          type: 'video',
          title: 'YouTube Video',
          artist: 'YouTube Video',
          album: 'YouTube',
          coverArt: 'https://placehold.co/300x300?text=YouTube',
          releaseYear: new Date().getFullYear(),
          durationMs: 0,
          originalPlatform: 'youtube',
          originalId: id
        };
      }
    }
    
    if (platform === 'apple_music') {
      return {
        type: type,
        title: type === 'artist' ? 'Apple Music Artist' : 'Apple Music Album',
        artist: 'Apple Music',
        album: 'Apple Music',
        coverArt: 'https://placehold.co/300x300?text=Apple+Music',
        releaseYear: new Date().getFullYear(),
        durationMs: 0,
        originalPlatform: 'apple_music',
        originalId: id
      };
    }

    return null;
  } catch (error) {
    console.error('Error fetching track metadata:', error);
    return null;
  }
}

/**
 * Searches Spotify using a text query to fetch high-quality canonical metadata.
 */
export async function resolveMetadataFromQuery(query) {
  const track = await searchSpotifyTrackServer(query);
  if (!track) return null;

  return {
    type: 'track',
    title: track.name,
    artist: track.artists?.map(a => a.name).join(', ') || 'Unknown Artist',
    album: track.album?.name || '',
    coverArt: track.album?.images?.[0]?.url || 'https://placehold.co/300x300?text=No+Cover',
    releaseYear: track.album?.release_date ? new Date(track.album.release_date).getFullYear() : null,
    durationMs: track.duration_ms || 0,
    originalPlatform: 'spotify',
    originalId: track.id
  };
}

/**
 * Generates external links / search links for all platforms based on metadata.
 */
export function generatePlatformLinks(metadata) {
  const { title, artist, type, originalPlatform, originalId } = metadata;
  
  // Set query modifiers based on item type
  const queryModifier = type === 'album' ? ' album' : type === 'artist' ? ' artist' : '';
  const query = `${title} ${artist}${queryModifier}`;
  const encodedQuery = encodeURIComponent(query);

  const links = {
    spotify: originalPlatform === 'spotify' 
      ? `https://open.spotify.com/${type}/${originalId}`
      : `https://open.spotify.com/search/${encodedQuery}`,
      
    apple_music: `https://music.apple.com/us/search?term=${encodedQuery}`,
    
    youtube_music: `https://music.youtube.com/search?q=${encodedQuery}`,
    
    youtube: originalPlatform === 'youtube' && type === 'track'
      ? `https://www.youtube.com/watch?v=${originalId}`
      : `https://www.youtube.com/results?search_query=${encodedQuery}`,
      
    deezer: `https://www.deezer.com/search/${encodedQuery}`,
    
    tidal: `https://listen.tidal.com/search?q=${encodedQuery}`,
    
    soundcloud: `https://soundcloud.com/search?q=${encodedQuery}`
  };

  return links;
}
