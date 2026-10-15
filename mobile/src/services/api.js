import axios from 'axios';
import { Platform } from 'react-native';

// Configurable API BASE_URL, defaults to 'https://grooveestrella.com'
export const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://grooveestrella.com';

// Alias for backwards compatibility
export const API_BASE_URL = `${BASE_URL}/api`;

// Main axios instance pointing to the web app's API
export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

/**
 * Configure API base URL dynamically at runtime
 * @param {string} newBaseUrl
 */
export const setBaseUrl = (newBaseUrl) => {
  if (newBaseUrl) {
    api.defaults.baseURL = newBaseUrl;
  }
};

// Request interceptor
api.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
);

// Response interceptor for consistent error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      'An unexpected network error occurred';
    const enhancedError = new Error(message);
    enhancedError.status = error.response?.status;
    enhancedError.data = error.response?.data;
    enhancedError.originalError = error;
    return Promise.reject(enhancedError);
  }
);

// ==========================================
// Required Core Methods
// ==========================================

/**
 * Search tracks, albums, or artists
 * GET /api/search?q=query&type=type
 * @param {string} query Search query string
 * @param {'track' | 'album' | 'artist'} [type='track']
 * @param {object} [options] Optional params (e.g., limit)
 */
export const searchMusic = async (query, type = 'track', options = {}) => {
  if (!query || !query.trim()) {
    return { results: [], type, query: '' };
  }
  const response = await api.get('/api/search', {
    params: {
      q: query.trim(),
      type,
      ...options,
    },
  });
  return response.data;
};

/**
 * Convert music links between platforms
 * POST /api/convert with { url }
 * @param {string} url Streaming service or song URL
 */
export const convertLink = async (url) => {
  if (!url || !url.trim()) {
    throw new Error('Music URL is required');
  }
  const response = await api.post('/api/convert', {
    url: url.trim(),
  });
  return response.data;
};

/**
 * Fetch track details by ID or MBID
 * GET /api/track/[id]
 * @param {string} id MusicBrainz Recording ID or Track identifier
 */
export const getTrack = async (id) => {
  if (!id) throw new Error('Track ID is required');
  const response = await api.get(`/api/track/${encodeURIComponent(id)}`);
  return response.data;
};

/**
 * Fetch album details by ID or MBID
 * GET /api/album/[id]
 * @param {string} id MusicBrainz Release Group ID or Album identifier
 * @param {string} [releaseId] Optional release ID
 */
export const getAlbum = async (id, releaseId = null) => {
  if (!id) throw new Error('Album ID is required');
  const response = await api.get(`/api/album/${encodeURIComponent(id)}`, {
    params: releaseId ? { release: releaseId } : {},
  });
  return response.data;
};

/**
 * Fetch artist details by ID or MBID
 * GET /api/artist/[id]
 * @param {string} id MusicBrainz Artist ID or Artist identifier
 */
export const getArtist = async (id) => {
  if (!id) throw new Error('Artist ID is required');
  const response = await api.get(`/api/artist/${encodeURIComponent(id)}`);
  return response.data;
};

/**
 * Fetch songs filtered by genre
 * GET /api/songs/[genre]
 * @param {string} genre Genre slug (e.g. 'pop_music', 'rock_music', 'party_music')
 * @param {object} [options] Optional pagination params { offset, limit }
 */
export const getSongsByGenre = async (genre, options = {}) => {
  if (!genre) throw new Error('Genre parameter is required');
  const response = await api.get(`/api/songs/${encodeURIComponent(genre)}`, {
    params: {
      offset: options.offset || 0,
      limit: options.limit || 10,
      ...options,
    },
  });
  return response.data;
};

/**
 * Fetch songs recommended by mood description
 * GET /api/songs/by-mood?mood=mood
 * Gracefully falls back to POST if backend requires POST
 * @param {string} mood Mood description (e.g. 'late night drive chill')
 * @param {object} [options] Optional params (e.g. limit)
 */
export const getSongsByMood = async (mood, options = {}) => {
  if (!mood || !mood.trim()) {
    throw new Error('Mood description is required');
  }

  const cleanMood = mood.trim();
  const limit = options.limit || 10;

  try {
    const response = await api.get('/api/songs/by-mood', {
      params: {
        mood: cleanMood,
        limit,
        ...options,
      },
    });
    return response.data;
  } catch (error) {
    if (error.status === 405 || error.status === 404) {
      const postResponse = await api.post('/api/songs/by-mood', {
        mood: cleanMood,
        limit,
        ...options,
      });
      return postResponse.data;
    }
    throw error;
  }
};

// ==========================================
// URL Parsing & Direct MusicBrainz Utilities
// ==========================================

const MUSICBRAINZ_BASE = 'https://musicbrainz.org/ws/2';
const USER_AGENT = 'GrooveEstrellaMobile/1.0.0 (https://grooveestrella.com)';

const SPOTIFY_REGEX = /https?:\/\/(?:open|play)\.spotify\.com\/(track|album|artist)\/([a-zA-Z0-9]{22})/i;
const YOUTUBE_TRACK_REGEX = /https?:\/\/(?:(?:www|music)\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/i;
const YOUTUBE_SHORT_REGEX = /https?:\/\/youtu\.be\/([a-zA-Z0-9_-]{11})/i;
const APPLE_MUSIC_REGEX = /https?:\/\/music\.apple\.com\/[a-z]{2}\/(album|artist)\/[^\/]+\/(\d+)(?:\?i=(\d+))?/i;
const MUSICBRAINZ_REGEX = /https?:\/\/(?:(?:www|beta)\.)?musicbrainz\.org\/(recording|release-group|release|artist)\/([0-9a-fA-F-]{36})/i;

export function isUrl(string) {
  if (!string || typeof string !== 'string') return false;
  return /^(https?:\/\/|www\.)[^\s/$.?#].[^\s]*$/i.test(string.trim());
}

export function parseMusicUrl(url) {
  if (!url) return null;

  let match = url.match(MUSICBRAINZ_REGEX);
  if (match) {
    const rawType = match[1].toLowerCase();
    const type = rawType === 'recording' ? 'track' : (rawType === 'release-group' || rawType === 'release') ? 'album' : 'artist';
    return { platform: 'musicbrainz', type, id: match[2] };
  }

  match = url.match(SPOTIFY_REGEX);
  if (match) {
    return { platform: 'spotify', type: match[1], id: match[2] };
  }

  match = url.match(YOUTUBE_TRACK_REGEX) || url.match(YOUTUBE_SHORT_REGEX);
  if (match) {
    return { platform: 'youtube', type: 'track', id: match[1] };
  }

  match = url.match(APPLE_MUSIC_REGEX);
  if (match) {
    const amType = match[1];
    const id = match[2];
    const trackId = match[3];
    if (amType === 'album' && trackId) {
      return { platform: 'apple_music', type: 'track', id: trackId };
    } else if (amType === 'album') {
      return { platform: 'apple_music', type: 'album', id };
    } else {
      return { platform: 'apple_music', type: 'artist', id };
    }
  }

  return null;
}

// ==========================================
// Fallback Catalog & Backwards Compatibility
// ==========================================

export const FALLBACK_TRACKS = [
  {
    id: 'f-tr-1',
    title: 'Starboy',
    artist: 'The Weeknd, Daft Punk',
    album: 'Starboy',
    image: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=600&auto=format&fit=crop&q=80',
    duration: 230000,
    releaseDate: '2016-09-21',
    type: 'track',
    popularity: 92,
  },
  {
    id: 'f-tr-2',
    title: 'Blinding Lights',
    artist: 'The Weeknd',
    album: 'After Hours',
    image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
    duration: 200000,
    releaseDate: '2019-11-29',
    type: 'track',
    popularity: 98,
  },
  {
    id: 'f-tr-3',
    title: 'Midnight City',
    artist: 'M83',
    album: "Hurry Up, We're Dreaming",
    image: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600&auto=format&fit=crop&q=80',
    duration: 243000,
    releaseDate: '2011-08-16',
    type: 'track',
    popularity: 88,
  },
  {
    id: 'f-tr-4',
    title: 'Instant Crush',
    artist: 'Daft Punk ft. Julian Casablancas',
    album: 'Random Access Memories',
    image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80',
    duration: 337000,
    releaseDate: '2013-05-17',
    type: 'track',
    popularity: 90,
  },
];

export const FALLBACK_ALBUMS = [
  {
    id: 'f-al-1',
    title: 'Random Access Memories',
    artist: 'Daft Punk',
    releaseYear: '2013',
    image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80',
    total_tracks: 13,
    type: 'album',
  },
  {
    id: 'f-al-2',
    title: 'After Hours',
    artist: 'The Weeknd',
    releaseYear: '2020',
    image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
    total_tracks: 14,
    type: 'album',
  },
  {
    id: 'f-al-3',
    title: 'Currents',
    artist: 'Tame Impala',
    releaseYear: '2015',
    image: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&auto=format&fit=crop&q=80',
    total_tracks: 13,
    type: 'album',
  },
];

export const FALLBACK_ARTISTS = [
  {
    id: 'f-ar-1',
    title: 'The Weeknd',
    artist: 'The Weeknd',
    image: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=600&auto=format&fit=crop&q=80',
    followers: 84000000,
    type: 'artist',
  },
  {
    id: 'f-ar-2',
    title: 'Daft Punk',
    artist: 'Daft Punk',
    image: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=600&auto=format&fit=crop&q=80',
    followers: 18000000,
    type: 'artist',
  },
  {
    id: 'f-ar-3',
    title: 'Tame Impala',
    artist: 'Tame Impala',
    image: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=600&auto=format&fit=crop&q=80',
    followers: 12500000,
    type: 'artist',
  },
];

export const FALLBACK_PLAYLISTS = [
  {
    id: 'f-pl-1',
    title: 'Cosmic Sunset Beats',
    name: 'Cosmic Sunset Beats',
    creator: 'Groove Editorial',
    trackCount: 34,
    image: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600&auto=format&fit=crop&q=80',
    type: 'playlist',
  },
  {
    id: 'f-pl-2',
    title: 'Late Night Synthwave',
    name: 'Late Night Synthwave',
    creator: 'CyberSpace Records',
    trackCount: 48,
    image: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=600&auto=format&fit=crop&q=80',
    type: 'playlist',
  },
];

// Backwards-compatible aliases
export const convertUrl = convertLink;
export const fetchTrack = getTrack;
export const fetchAlbum = getAlbum;
export const fetchArtist = getArtist;
export const searchCatalog = async (query, type = 'track', limit = 15) => {
  try {
    const data = await searchMusic(query, type, { limit });
    return data?.results || [];
  } catch (err) {
    const clean = (query || '').toLowerCase();
    if (type === 'artist') return FALLBACK_ARTISTS.filter(a => a.title.toLowerCase().includes(clean));
    if (type === 'album') return FALLBACK_ALBUMS.filter(a => a.title.toLowerCase().includes(clean));
    return FALLBACK_TRACKS.filter(t => t.title.toLowerCase().includes(clean));
  }
};

export const ApiService = {
  convertUrl,
  convertLink,
  searchCatalog,
  searchMusic,
  fetchTrack,
  getTrack,
  fetchAlbum,
  getAlbum,
  fetchArtist,
  getArtist,
  getSongsByGenre,
  getSongsByMood,
  parseMusicUrl,
  isUrl,
  BASE_URL,
  setBaseUrl,
};

export default {
  api,
  BASE_URL,
  setBaseUrl,
  searchMusic,
  convertLink,
  getTrack,
  getAlbum,
  getArtist,
  getSongsByGenre,
  getSongsByMood,
  convertUrl,
  searchCatalog,
  fetchTrack,
  fetchAlbum,
  fetchArtist,
  parseMusicUrl,
  isUrl,
  FALLBACK_TRACKS,
  FALLBACK_ALBUMS,
  FALLBACK_ARTISTS,
  FALLBACK_PLAYLISTS,
};
