// src/lib/musicProviders.js
import { 
  fetchMusicBrainzTrackServer, 
  fetchMusicBrainzAlbumServer, 
  fetchMusicBrainzArtistServer, 
  searchMusicBrainzTrackServer 
} from './musicbrainzServer';
import axios from 'axios';

// Regex parsers for different platforms supporting track, album, and artist types
const MUSICBRAINZ_REGEX = /https?:\/\/(?:(?:www|beta)\.)?musicbrainz\.org\/(recording|release-group|release|artist)\/([0-9a-fA-F-]{36})/i;
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

  // MusicBrainz
  let match = url.match(MUSICBRAINZ_REGEX);
  if (match) {
    const rawType = match[1].toLowerCase();
    const type = rawType === 'recording' ? 'track' : (rawType === 'release-group' || rawType === 'release') ? 'album' : 'artist';
    return { platform: 'musicbrainz', type, id: match[2] };
  }

  // Spotify
  match = url.match(SPOTIFY_REGEX);
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
    // Support 2-arg signature: getTrackMetadata(platform, id)
    if (id === undefined) {
      id = type;
      type = 'track';
    }

    if (platform === 'musicbrainz' || platform === 'spotify') {
      if (type === 'track') {
        const data = await fetchMusicBrainzTrackServer(id);
        if (data) {
          const artistsStr = Array.isArray(data.artists)
            ? data.artists.map(a => a.name).join(', ')
            : (data.artist || 'Unknown Artist');

          return {
            type: 'track',
            title: data.title || data.name,
            artist: artistsStr,
            album: data.album?.name || data.album?.title || data.album || '',
            coverArt: data.coverArt || data.url || 'https://placehold.co/500x500/10141F/60A5FA?text=No+Cover',
            releaseDate: data.releaseDate || data.album?.release_date || (data.releaseYear ? String(data.releaseYear) : null),
            releaseYear: data.releaseYear || (data.album?.release_date ? new Date(data.album.release_date).getFullYear() : null),
            durationMs: data.duration_ms || data.durationMs || 0,
            genres: data.genres || [],
            externalLinks: data.externalLinks || [],
            originalPlatform: platform,
            originalId: id,
            mbid: data.id,
            popularity: data.popularity || 80
          };
        }
      }

      if (type === 'album') {
        const { album } = await fetchMusicBrainzAlbumServer(id);
        if (album) {
          const artistsStr = Array.isArray(album.artists)
            ? album.artists.map(a => a.name).join(', ')
            : 'Various Artists';

          return {
            type: 'album',
            title: album.name || album.title,
            artist: artistsStr,
            album: album.name || 'Album',
            coverArt: album.images?.[0]?.url || album.coverArt || 'https://placehold.co/500x500/10141F/60A5FA?text=No+Cover',
            releaseDate: album.releaseDate || album.release_date || (album.releaseYear ? String(album.releaseYear) : null),
            releaseYear: album.releaseYear || (album.release_date ? new Date(album.release_date).getFullYear() : null),
            durationMs: 0,
            genres: album.genres || [],
            externalLinks: album.externalLinks || [],
            trackCount: album.total_tracks || 0,
            originalPlatform: platform,
            originalId: id,
            mbid: album.id,
            popularity: 85
          };
        }
      }

      if (type === 'artist') {
        const artist = await fetchMusicBrainzArtistServer(id);
        if (artist) {
          return {
            type: 'artist',
            title: artist.name,
            artist: artist.name,
            album: 'Artist Profile',
            coverArt: artist.images?.[0]?.url || artist.coverArt || 'https://placehold.co/500x500/10141F/60A5FA?text=Artist',
            releaseDate: null,
            releaseYear: null,
            durationMs: 0,
            genres: artist.genres || [],
            externalLinks: artist.externalLinks || [],
            country: artist.country || 'Global',
            originalPlatform: platform,
            originalId: id,
            mbid: artist.id,
            popularity: artist.popularity || 85
          };
        }
      }
    }
    
    if (platform === 'youtube') {
      try {
        const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`;
        const oembedResponse = await axios.get(oembedUrl);
        const rawTitle = oembedResponse.data?.title || 'Unknown Video';
        const coverArt = oembedResponse.data?.thumbnail_url || 'https://placehold.co/500x500?text=YouTube';
        
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
          coverArt: 'https://placehold.co/500x500?text=YouTube',
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
        coverArt: 'https://placehold.co/500x500?text=Apple+Music',
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
 * Searches MusicBrainz using a text query to fetch high-quality canonical metadata.
 */
export async function resolveMetadataFromQuery(query) {
  const track = await searchMusicBrainzTrackServer(query);
  if (!track) return null;

  const artistsStr = Array.isArray(track.artists)
    ? track.artists.map(a => a.name).join(', ')
    : (track.artist || 'Unknown Artist');

  return {
    type: 'track',
    title: track.title,
    artist: artistsStr,
    album: track.album || '',
    coverArt: track.coverArt || track.url || 'https://placehold.co/500x500/10141F/60A5FA?text=No+Cover',
    releaseYear: track.releaseYear || null,
    durationMs: track.durationMs || 0,
    originalPlatform: 'musicbrainz',
    originalId: track.id,
    mbid: track.id,
    popularity: track.popularity || 80
  };
}

/**
 * Generates external links / search links for all platforms based on metadata.
 */
export function generatePlatformLinks(metadata) {
  const { title, artist, type, originalPlatform, originalId, mbid } = metadata;
  
  // Set query modifiers based on item type
  const queryModifier = type === 'album' ? ' album' : type === 'artist' ? ' artist' : '';
  const query = `${title} ${artist}${queryModifier}`;
  const encodedQuery = encodeURIComponent(query);
  const musicBrainzId = mbid || (originalPlatform === 'musicbrainz' ? originalId : null);

  const links = {
    musicbrainz: musicBrainzId 
      ? `https://musicbrainz.org/${type === 'album' ? 'release-group' : type === 'artist' ? 'artist' : 'recording'}/${musicBrainzId}`
      : `https://musicbrainz.org/search?query=${encodedQuery}&type=${type === 'album' ? 'release_group' : type === 'artist' ? 'artist' : 'recording'}&method=indexed`,

    youtube: originalPlatform === 'youtube' && type === 'track'
      ? `https://www.youtube.com/watch?v=${originalId}`
      : `https://www.youtube.com/results?search_query=${encodedQuery}`,

    youtube_music: `https://music.youtube.com/search?q=${encodedQuery}`,

    apple_music: `https://music.apple.com/us/search?term=${encodedQuery}`,

    spotify: originalPlatform === 'spotify' 
      ? `https://open.spotify.com/${type}/${originalId}`
      : `https://open.spotify.com/search/${encodedQuery}`,

    deezer: `https://www.deezer.com/search/${encodedQuery}`,
    
    tidal: `https://listen.tidal.com/search?q=${encodedQuery}`,
    
    soundcloud: `https://soundcloud.com/search?q=${encodedQuery}`
  };

  return links;
}
