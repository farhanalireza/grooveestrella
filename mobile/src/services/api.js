// src/services/api.js
import axios from 'axios';

// Public high-speed music catalog API (iTunes Store Search API)
const ITUNES_SEARCH_URL = 'https://itunes.apple.com/search';
const ITUNES_LOOKUP_URL = 'https://itunes.apple.com/lookup';

// Fallback tracks when device has no internet connection
export const FALLBACK_TRACKS = [
  {
    id: 'f-tr-1',
    trackId: 'f-tr-1',
    title: 'Starboy',
    artist: 'The Weeknd, Daft Punk',
    album: 'Starboy',
    image: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=600&auto=format&fit=crop&q=80',
    duration: 230000,
    releaseDate: '2016-09-21',
    releaseYear: '2016',
    type: 'track',
    popularity: 92,
  },
  {
    id: 'f-tr-2',
    trackId: 'f-tr-2',
    title: 'Blinding Lights',
    artist: 'The Weeknd',
    album: 'After Hours',
    image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
    duration: 200000,
    releaseDate: '2019-11-29',
    releaseYear: '2019',
    type: 'track',
    popularity: 98,
  },
  {
    id: 'f-tr-3',
    trackId: 'f-tr-3',
    title: 'Midnight City',
    artist: 'M83',
    album: "Hurry Up, We're Dreaming",
    image: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600&auto=format&fit=crop&q=80',
    duration: 243000,
    releaseDate: '2011-08-16',
    releaseYear: '2011',
    type: 'track',
    popularity: 88,
  },
  {
    id: 'f-tr-4',
    trackId: 'f-tr-4',
    title: 'Instant Crush',
    artist: 'Daft Punk ft. Julian Casablancas',
    album: 'Random Access Memories',
    image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80',
    duration: 337000,
    releaseDate: '2013-05-17',
    releaseYear: '2013',
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
];

export const FALLBACK_ARTISTS = [
  {
    id: 'f-ar-1',
    title: 'The Weeknd',
    artist: 'The Weeknd',
    name: 'The Weeknd',
    image: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=600&auto=format&fit=crop&q=80',
    followers: 84000000,
    type: 'artist',
  },
  {
    id: 'f-ar-2',
    title: 'Daft Punk',
    artist: 'Daft Punk',
    name: 'Daft Punk',
    image: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=600&auto=format&fit=crop&q=80',
    followers: 18000000,
    type: 'artist',
  },
];

// Helper to upscale iTunes low-res 100x100 artwork to crisp 600x600 or 1000x1000
function getHighResArtwork(url, size = 600) {
  if (!url) return 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80';
  return url.replace('100x100bb', `${size}x${size}bb`).replace('60x60bb', `${size}x${size}bb`);
}

// Generate cross-platform streaming links for any track title + artist
export function generateStreamingLinks(title, artist) {
  const query = encodeURIComponent(`${title || ''} ${artist || ''}`.trim());
  return {
    spotify: `https://open.spotify.com/search/${query}`,
    apple_music: `https://music.apple.com/us/search?term=${query}`,
    youtube: `https://www.youtube.com/results?search_query=${query}`,
    youtube_music: `https://music.youtube.com/search?q=${query}`,
    deezer: `https://www.deezer.com/search/${query}`,
    tidal: `https://listen.tidal.com/search?q=${query}`,
    soundcloud: `https://soundcloud.com/search?q=${query}`,
    musicbrainz: `https://musicbrainz.org/search?query=${query}&type=recording`,
  };
}

/**
 * Searches music catalog using the fast, public iTunes Search API
 * @param {string} query
 * @param {'track' | 'album' | 'artist' | 'playlist'} type
 * @param {number} limit
 */
export const searchCatalog = async (query = '', type = 'track', limit = 20) => {
  const cleanQuery = (query || '').trim();
  const searchKeyword = cleanQuery || 'Top Hits';

  try {
    let entity = 'song';
    if (type === 'album') entity = 'album';
    if (type === 'artist') entity = 'musicArtist';

    const response = await axios.get(ITUNES_SEARCH_URL, {
      params: {
        term: searchKeyword,
        entity,
        limit,
        media: 'music',
      },
      timeout: 8000,
    });

    const items = response.data?.results || [];
    if (!items.length) {
      return getFilteredFallbacks(cleanQuery, type);
    }

    if (type === 'album') {
      return items.map((item) => ({
        id: String(item.collectionId),
        title: item.collectionName || 'Untitled Album',
        artist: item.artistName || 'Unknown Artist',
        album: item.collectionName,
        releaseYear: item.releaseDate ? item.releaseDate.substring(0, 4) : '2024',
        releaseDate: item.releaseDate,
        image: getHighResArtwork(item.artworkUrl100, 600),
        url: getHighResArtwork(item.artworkUrl100, 600),
        type: 'album',
        trackCount: item.trackCount || 0,
      }));
    }

    if (type === 'artist') {
      return items.map((item, idx) => ({
        id: String(item.artistId),
        title: item.artistName || 'Unknown Artist',
        name: item.artistName || 'Unknown Artist',
        artist: item.artistName,
        genre: item.primaryGenreName || 'Music',
        image: FALLBACK_ARTISTS[idx % FALLBACK_ARTISTS.length].image,
        url: FALLBACK_ARTISTS[idx % FALLBACK_ARTISTS.length].image,
        type: 'artist',
      }));
    }

    // Default: Tracks
    return items.map((item) => ({
      id: String(item.trackId),
      trackId: String(item.trackId),
      title: item.trackName || 'Untitled Track',
      artist: item.artistName || 'Unknown Artist',
      album: item.collectionName || '',
      albumId: String(item.collectionId || ''),
      image: getHighResArtwork(item.artworkUrl100, 600),
      url: getHighResArtwork(item.artworkUrl100, 600),
      previewUrl: item.previewUrl,
      duration: item.trackTimeMillis || 0,
      releaseDate: item.releaseDate,
      releaseYear: item.releaseDate ? item.releaseDate.substring(0, 4) : '2024',
      type: 'track',
      trackURI: item.trackViewUrl,
    }));
  } catch (err) {
    console.warn('Catalog search error, returning fallback results:', err.message);
    return getFilteredFallbacks(cleanQuery, type);
  }
};

function getFilteredFallbacks(query, type) {
  const clean = (query || '').toLowerCase();
  if (type === 'artist') {
    return clean
      ? FALLBACK_ARTISTS.filter((a) => a.title.toLowerCase().includes(clean))
      : FALLBACK_ARTISTS;
  }
  if (type === 'album') {
    return clean
      ? FALLBACK_ALBUMS.filter((a) => a.title.toLowerCase().includes(clean))
      : FALLBACK_ALBUMS;
  }
  return clean
    ? FALLBACK_TRACKS.filter((t) => t.title.toLowerCase().includes(clean) || t.artist.toLowerCase().includes(clean))
    : FALLBACK_TRACKS;
}

/**
 * Fetch track by ID
 */
export const fetchTrack = async (id) => {
  if (!id) throw new Error('Track ID is required');

  try {
    const response = await axios.get(ITUNES_LOOKUP_URL, {
      params: { id, entity: 'song' },
      timeout: 8000,
    });
    const item = response.data?.results?.[0];
    if (item && item.trackName) {
      return {
        id: String(item.trackId),
        title: item.trackName,
        artist: item.artistName,
        album: item.collectionName,
        image: getHighResArtwork(item.artworkUrl100, 800),
        coverArt: getHighResArtwork(item.artworkUrl100, 800),
        previewUrl: item.previewUrl,
        duration: item.trackTimeMillis,
        releaseDate: item.releaseDate,
        releaseYear: item.releaseDate ? item.releaseDate.substring(0, 4) : '',
        type: 'track',
        platformLinks: generateStreamingLinks(item.trackName, item.artistName),
      };
    }
  } catch (err) {
    console.warn('Track lookup error:', err.message);
  }

  // Fallback to local item
  const found = FALLBACK_TRACKS.find((t) => t.id === id || t.trackId === id) || FALLBACK_TRACKS[0];
  return {
    ...found,
    platformLinks: generateStreamingLinks(found.title, found.artist),
  };
};

/**
 * Fetch album by ID
 */
export const fetchAlbum = async (id) => {
  if (!id) throw new Error('Album ID is required');

  try {
    const response = await axios.get(ITUNES_LOOKUP_URL, {
      params: { id, entity: 'song' },
      timeout: 8000,
    });
    const items = response.data?.results || [];
    const albumMeta = items[0] || {};
    const tracks = items.slice(1).map((t, idx) => ({
      id: String(t.trackId || idx),
      title: t.trackName || `Track ${idx + 1}`,
      artist: t.artistName || albumMeta.artistName || '',
      album: albumMeta.collectionName || '',
      image: getHighResArtwork(albumMeta.artworkUrl100, 400),
      duration: t.trackTimeMillis || 0,
      trackNumber: t.trackNumber || idx + 1,
      type: 'track',
    }));

    return {
      id: String(albumMeta.collectionId || id),
      title: albumMeta.collectionName || 'Album Details',
      artist: albumMeta.artistName || 'Unknown Artist',
      image: getHighResArtwork(albumMeta.artworkUrl100, 800),
      releaseDate: albumMeta.releaseDate,
      releaseYear: albumMeta.releaseDate ? albumMeta.releaseDate.substring(0, 4) : '2024',
      trackCount: albumMeta.trackCount || tracks.length,
      tracks,
    };
  } catch (err) {
    console.warn('Album lookup error:', err.message);
  }

  const found = FALLBACK_ALBUMS.find((a) => a.id === id) || FALLBACK_ALBUMS[0];
  return {
    ...found,
    tracks: FALLBACK_TRACKS,
  };
};

/**
 * Fetch artist by ID
 */
export const fetchArtist = async (id) => {
  if (!id) throw new Error('Artist ID is required');

  try {
    const response = await axios.get(ITUNES_LOOKUP_URL, {
      params: { id, entity: 'song', limit: 15 },
      timeout: 8000,
    });
    const items = response.data?.results || [];
    const artistMeta = items[0] || {};
    const topTracks = items.slice(1).map((t) => ({
      id: String(t.trackId),
      title: t.trackName,
      artist: t.artistName,
      album: t.collectionName,
      image: getHighResArtwork(t.artworkUrl100, 400),
      type: 'track',
    }));

    return {
      id: String(artistMeta.artistId || id),
      title: artistMeta.artistName || 'Artist Profile',
      name: artistMeta.artistName || 'Artist Profile',
      genre: artistMeta.primaryGenreName || 'Pop',
      image: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=800&auto=format&fit=crop&q=80',
      followers: 12000000,
      topTracks,
      albums: FALLBACK_ALBUMS,
    };
  } catch (err) {
    console.warn('Artist lookup error:', err.message);
  }

  const found = FALLBACK_ARTISTS.find((a) => a.id === id) || FALLBACK_ARTISTS[0];
  return {
    ...found,
    topTracks: FALLBACK_TRACKS,
    albums: FALLBACK_ALBUMS,
  };
};

export function isUrl(string) {
  if (!string || typeof string !== 'string') return false;
  return /^(https?:\/\/|www\.)[^\s/$.?#].[^\s]*$/i.test(string.trim());
}

/**
 * Converts music links to universal routing links
 */
export const convertUrl = async (url) => {
  if (!url || !url.trim()) throw new Error('Music link is required');
  const cleanUrl = url.trim();

  // Extract song keywords from common URL structures
  let term = cleanUrl;
  try {
    const parsed = new URL(cleanUrl);
    const pathname = parsed.pathname;
    const parts = pathname.split('/').filter(Boolean);
    if (parts.length > 0) {
      term = decodeURIComponent(parts[parts.length - 1]).replace(/[-_+]/g, ' ');
    }
  } catch {
    term = cleanUrl;
  }

  const results = await searchCatalog(term, 'track', 5);
  const track = results[0] || FALLBACK_TRACKS[0];

  return {
    success: true,
    redirectUrl: `/track/${track.id}`,
    track,
    platformLinks: generateStreamingLinks(track.title, track.artist),
  };
};

export const searchMusic = searchCatalog;
export const getTrack = fetchTrack;
export const getAlbum = fetchAlbum;
export const getArtist = fetchArtist;
export const convertLink = convertUrl;

export const ApiService = {
  searchCatalog,
  searchMusic,
  fetchTrack,
  getTrack,
  fetchAlbum,
  getAlbum,
  fetchArtist,
  getArtist,
  convertUrl,
  convertLink,
  isUrl,
  generateStreamingLinks,
};

export default ApiService;
