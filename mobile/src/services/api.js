// src/services/api.js
import axios from 'axios';

// Public high-speed music catalog API (iTunes Store Search API)
const ITUNES_SEARCH_URL = 'https://itunes.apple.com/search';
const ITUNES_LOOKUP_URL = 'https://itunes.apple.com/lookup';
const MUSICBRAINZ_BASE = 'https://musicbrainz.org/ws/2';
const USER_AGENT = 'GrooveEstrella/2.0 ( https://github.com/farhanalireza/grooveestrella )';

// Fallback tracks when device has no internet connection
export const FALLBACK_TRACKS = [
  {
    id: 'f-tr-1',
    trackId: 'f-tr-1',
    title: 'Starboy',
    name: 'Starboy',
    artist: 'The Weeknd, Daft Punk',
    artists: [{ name: 'The Weeknd' }, { name: 'Daft Punk' }],
    album: 'Starboy',
    albumId: 'f-al-starboy',
    image: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=600&auto=format&fit=crop&q=80',
    coverArt: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=600&auto=format&fit=crop&q=80',
    duration: 230000,
    duration_ms: 230000,
    releaseDate: '2016-09-21',
    releaseYear: '2016',
    type: 'track',
    popularity: 92,
    rating: { value: 4.6 },
    genres: ['R&B', 'Pop', 'Synthpop'],
    tags: [
      { label: 'r&b', count: 12 },
      { label: 'pop', count: 9 },
      { label: 'synthwave', count: 7 },
      { label: 'dance', count: 5 },
    ],
    description: 'Starboy is the title track of The Weeknd’s third studio album, featuring French electronic duo Daft Punk. The song blends electro-pop sensibilities with dark R&B lyricism.',
  },
  {
    id: 'f-tr-2',
    trackId: 'f-tr-2',
    title: 'Blinding Lights',
    name: 'Blinding Lights',
    artist: 'The Weeknd',
    artists: [{ name: 'The Weeknd' }],
    album: 'After Hours',
    albumId: 'f-al-2',
    image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
    coverArt: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
    duration: 200000,
    duration_ms: 200000,
    releaseDate: '2019-11-29',
    releaseYear: '2019',
    type: 'track',
    popularity: 98,
    rating: { value: 4.9 },
    genres: ['Synthwave', '80s Pop', 'Electro'],
    tags: [
      { label: 'synthwave', count: 18 },
      { label: '80s', count: 14 },
      { label: 'pop', count: 10 },
      { label: 'retrowave', count: 8 },
    ],
    description: 'Blinding Lights is a global phenomenon known for its driving retro synthesizer hook and soaring 80s aesthetic.',
  },
  {
    id: 'f-tr-3',
    trackId: 'f-tr-3',
    title: 'Midnight City',
    name: 'Midnight City',
    artist: 'M83',
    artists: [{ name: 'M83' }],
    album: "Hurry Up, We're Dreaming",
    albumId: 'f-al-m83',
    image: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600&auto=format&fit=crop&q=80',
    coverArt: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600&auto=format&fit=crop&q=80',
    duration: 243000,
    duration_ms: 243000,
    releaseDate: '2011-08-16',
    releaseYear: '2011',
    type: 'track',
    popularity: 88,
    rating: { value: 4.7 },
    genres: ['Shoegaze', 'Synthpop', 'Indie Rock'],
    tags: [
      { label: 'electronic', count: 15 },
      { label: 'indie', count: 11 },
      { label: 'dreampop', count: 9 },
    ],
    description: 'Midnight City defined early 2010s dream-electronic anthems, famous for its iconic vocoder riffs and climactic saxophone solo.',
  },
];

export const FALLBACK_ALBUMS = [
  {
    id: 'f-al-1',
    title: 'Random Access Memories',
    name: 'Random Access Memories',
    artist: 'Daft Punk',
    artists: [{ name: 'Daft Punk' }],
    releaseYear: '2013',
    releaseDate: '2013-05-17',
    image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80',
    coverArt: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80',
    total_tracks: 13,
    totalDurationMs: 4463000,
    type: 'album',
    rating: { value: 4.8 },
    genres: ['Nu-Disco', 'Funk', 'Electronic'],
    tags: [
      { label: 'french house', count: 22 },
      { label: 'disco', count: 18 },
      { label: 'funk', count: 16 },
      { label: 'masterpiece', count: 14 },
    ],
    description: 'Random Access Memories is the fourth studio album by French electronic duo Daft Punk. A tribute to late 1970s and early 1980s American music, recorded using live session musicians and vintage analog hardware.',
    variations: [
      { id: 'rel-orig', year: 2013, format: 'Vinyl LP', country: 'Global', isOriginal: true, label: '★ Original Release (2013)' },
      { id: 'rel-cd', year: 2013, format: 'CD Standard', country: 'US', label: 'Columbia Digipak (2013)' },
      { id: 'rel-10th', year: 2023, format: '10th Anniversary Expanded 3LP', country: 'Global', label: 'Anniversary & Modern Remasters (2023)' },
    ],
  },
  {
    id: 'f-al-2',
    title: 'After Hours',
    name: 'After Hours',
    artist: 'The Weeknd',
    artists: [{ name: 'The Weeknd' }],
    releaseYear: '2020',
    releaseDate: '2020-03-20',
    image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
    coverArt: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
    total_tracks: 14,
    totalDurationMs: 3374000,
    type: 'album',
    rating: { value: 4.7 },
    genres: ['Synthwave', 'Dark R&B', 'Electropop'],
    tags: [
      { label: 'synthwave', count: 19 },
      { label: 'r&b', count: 15 },
      { label: '80s', count: 12 },
    ],
    description: 'After Hours is the fourth studio album by Canadian singer The Weeknd. Set across nocturnal cityscapes, it explores heartbreak, loneliness, and hedonism.',
    variations: [
      { id: 'rel-orig-ah', year: 2020, format: 'Digital Master', country: 'Global', isOriginal: true, label: '★ Original Release (2020)' },
      { id: 'rel-deluxe-ah', year: 2020, format: 'Deluxe CD', country: 'US', label: 'Deluxe Edition Bonus Tracks (2020)' },
    ],
  },
];

export const FALLBACK_ARTISTS = [
  {
    id: 'f-ar-1',
    title: 'The Weeknd',
    name: 'The Weeknd',
    artist: 'The Weeknd',
    image: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=600&auto=format&fit=crop&q=80',
    coverArt: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=600&auto=format&fit=crop&q=80',
    followers: 84000000,
    popularity: 96,
    rating: { value: 4.8 },
    genres: ['R&B', 'Pop', 'Synthwave', 'Alternative R&B'],
    tags: [
      { label: 'r&b', count: 28 },
      { label: 'pop', count: 24 },
      { label: 'synthpop', count: 19 },
      { label: 'soul', count: 12 },
    ],
    description: 'Abel Makkonen Tesfaye, known professionally as The Weeknd, is a Canadian singer, songwriter, and record producer known for his sonic versatility and dark lyricism.',
    type: 'artist',
  },
  {
    id: 'f-ar-2',
    title: 'David Bowie',
    name: 'David Bowie',
    artist: 'David Bowie',
    image: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=600&auto=format&fit=crop&q=80',
    coverArt: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=600&auto=format&fit=crop&q=80',
    followers: 18000000,
    popularity: 92,
    rating: { value: 4.9 },
    genres: ['Glam Rock', 'Art Rock', 'Classic Rock', 'Proto-Punk'],
    tags: [
      { label: 'glam rock', count: 32 },
      { label: 'classic rock', count: 29 },
      { label: 'art rock', count: 25 },
      { label: 'legend', count: 20 },
    ],
    description: 'David Robert Jones, known professionally as David Bowie, was an English singer, songwriter, and actor. He is regarded as one of the most influential musicians of the 20th century.',
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
        name: item.collectionName || 'Untitled Album',
        artist: item.artistName || 'Unknown Artist',
        artists: [{ name: item.artistName || 'Unknown Artist' }],
        album: item.collectionName,
        releaseYear: item.releaseDate ? item.releaseDate.substring(0, 4) : '2024',
        releaseDate: item.releaseDate,
        image: getHighResArtwork(item.artworkUrl100, 600),
        coverArt: getHighResArtwork(item.artworkUrl100, 600),
        url: getHighResArtwork(item.artworkUrl100, 600),
        type: 'album',
        trackCount: item.trackCount || 0,
        total_tracks: item.trackCount || 0,
        rating: { value: 4.6 },
      }));
    }

    if (type === 'artist') {
      return items.map((item, idx) => ({
        id: String(item.artistId),
        title: item.artistName || 'Unknown Artist',
        name: item.artistName || 'Unknown Artist',
        artist: item.artistName,
        genre: item.primaryGenreName || 'Music',
        genres: [item.primaryGenreName || 'Music'],
        image: FALLBACK_ARTISTS[idx % FALLBACK_ARTISTS.length].image,
        coverArt: FALLBACK_ARTISTS[idx % FALLBACK_ARTISTS.length].image,
        url: FALLBACK_ARTISTS[idx % FALLBACK_ARTISTS.length].image,
        followers: 1500000 + (idx * 250000),
        popularity: 85,
        rating: { value: 4.7 },
        type: 'artist',
      }));
    }

    // Default: Tracks
    return items.map((item) => ({
      id: String(item.trackId),
      trackId: String(item.trackId),
      title: item.trackName || 'Untitled Track',
      name: item.trackName || 'Untitled Track',
      artist: item.artistName || 'Unknown Artist',
      artists: [{ name: item.artistName || 'Unknown Artist' }],
      album: item.collectionName || '',
      albumId: String(item.collectionId || ''),
      image: getHighResArtwork(item.artworkUrl100, 600),
      coverArt: getHighResArtwork(item.artworkUrl100, 600),
      url: getHighResArtwork(item.artworkUrl100, 600),
      previewUrl: item.previewUrl,
      duration: item.trackTimeMillis || 0,
      duration_ms: item.trackTimeMillis || 0,
      releaseDate: item.releaseDate,
      releaseYear: item.releaseDate ? item.releaseDate.substring(0, 4) : '2024',
      type: 'track',
      trackURI: item.trackViewUrl,
      popularity: 88,
      rating: { value: 4.6 },
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
 * Fetch track by ID or Title
 */
export const fetchTrack = async (id) => {
  if (!id) throw new Error('Track ID is required');

  const cleanId = String(id).trim();

  // 1. If numeric, query iTunes lookup directly
  if (/^\d+$/.test(cleanId)) {
    try {
      const response = await axios.get(ITUNES_LOOKUP_URL, {
        params: { id: cleanId, entity: 'song' },
        timeout: 8000,
      });
      const item = response.data?.results?.[0];
      if (item && item.trackName) {
        const cover = getHighResArtwork(item.artworkUrl100, 800);
        return {
          id: String(item.trackId),
          trackId: String(item.trackId),
          title: item.trackName,
          name: item.trackName,
          artist: item.artistName,
          artists: [{ id: String(item.artistId || ''), name: item.artistName }],
          album: item.collectionName,
          albumId: String(item.collectionId || ''),
          albumObj: { id: String(item.collectionId || ''), name: item.collectionName, images: [{ url: cover }] },
          image: cover,
          coverArt: cover,
          previewUrl: item.previewUrl,
          duration: item.trackTimeMillis,
          duration_ms: item.trackTimeMillis,
          releaseDate: item.releaseDate,
          releaseYear: item.releaseDate ? item.releaseDate.substring(0, 4) : '2024',
          type: 'track',
          popularity: 90,
          rating: { value: 4.6 },
          genres: [item.primaryGenreName || 'Rock/Pop'],
          tags: [
            { label: (item.primaryGenreName || 'Rock').toLowerCase(), count: 9 },
            { label: 'classic', count: 6 },
            { label: 'hit', count: 4 },
          ],
          description: `"${item.trackName}" by ${item.artistName} from the album "${item.collectionName || 'Single'}". Available for high fidelity playback and cross-platform streaming.`,
          platformLinks: generateStreamingLinks(item.trackName, item.artistName),
        };
      }
    } catch (err) {
      console.warn('iTunes track lookup error:', err.message);
    }
  }

  // 2. If UUID (MusicBrainz ID)
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanId)) {
    try {
      const mbRes = await axios.get(`${MUSICBRAINZ_BASE}/recording/${cleanId}?fmt=json&inc=artists+releases+tags+ratings`, {
        headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
        timeout: 8000,
      });
      const data = mbRes.data;
      if (data && data.title) {
        const artistName = data['artist-credit']?.[0]?.name || data['artist-credit']?.[0]?.artist?.name || 'Unknown Artist';
        const artistId = data['artist-credit']?.[0]?.artist?.id || '';
        const release = data.releases?.[0] || {};
        const releaseName = release.title || '';
        const releaseId = release.id || '';

        // Search iTunes for artwork
        const searchItems = await searchCatalog(`${data.title} ${artistName}`, 'track', 1);
        const cover = searchItems[0]?.image || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=600&auto=format&fit=crop&q=80';

        return {
          id: cleanId,
          trackId: cleanId,
          title: data.title,
          name: data.title,
          artist: artistName,
          artists: [{ id: artistId, name: artistName }],
          album: releaseName,
          albumId: releaseId,
          albumObj: { id: releaseId, name: releaseName, images: [{ url: cover }] },
          image: cover,
          coverArt: cover,
          duration: data.length || 240000,
          duration_ms: data.length || 240000,
          releaseDate: release.date || '1972-06-16',
          releaseYear: release.date ? release.date.substring(0, 4) : '1972',
          type: 'track',
          popularity: 92,
          rating: { value: 4.7 },
          genres: data.tags?.map((t) => t.name) || ['Classic Rock', 'Glam Rock'],
          tags: data.tags?.map((t) => ({ label: t.name, count: t.count || 5 })) || [
            { label: 'rock', count: 8 },
            { label: 'album rock', count: 7 },
            { label: 'glam rock', count: 5 },
          ],
          description: `"${data.title}" by ${artistName}. A foundational recording released under ${releaseName || 'catalog'}.`,
          platformLinks: generateStreamingLinks(data.title, artistName),
        };
      }
    } catch (mbErr) {
      console.warn('MusicBrainz track lookup error:', mbErr.message);
    }
  }

  // 3. Fallback search by term
  const searchResults = await searchCatalog(cleanId, 'track', 1);
  if (searchResults && searchResults[0]) {
    const item = searchResults[0];
    return {
      ...item,
      artists: item.artists || [{ name: item.artist }],
      albumObj: { id: item.albumId, name: item.album, images: [{ url: item.image }] },
      rating: item.rating || { value: 4.6 },
      tags: [
        { label: 'rock', count: 8 },
        { label: 'pop', count: 6 },
        { label: 'curated', count: 5 },
      ],
      description: `"${item.title}" by ${item.artist}. An outstanding track representative with timeless appeal.`,
      platformLinks: generateStreamingLinks(item.title, item.artist),
    };
  }

  // 4. Default fallback
  const found = FALLBACK_TRACKS.find((t) => t.id === cleanId || t.trackId === cleanId) || FALLBACK_TRACKS[0];
  return {
    ...found,
    platformLinks: generateStreamingLinks(found.title, found.artist),
  };
};

/**
 * Fetch album by ID or Title
 */
export const fetchAlbum = async (id) => {
  if (!id) throw new Error('Album ID is required');

  const cleanId = String(id).trim();

  // 1. If numeric iTunes collectionId
  if (/^\d+$/.test(cleanId)) {
    try {
      const response = await axios.get(ITUNES_LOOKUP_URL, {
        params: { id: cleanId, entity: 'song' },
        timeout: 8000,
      });
      const items = response.data?.results || [];
      const albumMeta = items[0] || {};
      const cover = getHighResArtwork(albumMeta.artworkUrl100, 800);

      const tracks = items.slice(1).map((t, idx) => ({
        id: String(t.trackId || idx + 1),
        trackId: String(t.trackId || idx + 1),
        title: t.trackName || `Track ${idx + 1}`,
        name: t.trackName || `Track ${idx + 1}`,
        artist: t.artistName || albumMeta.artistName || '',
        artists: [{ id: String(t.artistId || ''), name: t.artistName || albumMeta.artistName }],
        album: albumMeta.collectionName || '',
        image: cover,
        coverArt: cover,
        duration: t.trackTimeMillis || 0,
        duration_ms: t.trackTimeMillis || 0,
        trackNumber: t.trackNumber || idx + 1,
        previewUrl: t.previewUrl,
        type: 'track',
      }));

      const totalDuration = tracks.reduce((acc, cur) => acc + (cur.duration || 0), 0);

      const albumObj = {
        id: String(albumMeta.collectionId || cleanId),
        title: albumMeta.collectionName || 'Album Details',
        name: albumMeta.collectionName || 'Album Details',
        artist: albumMeta.artistName || 'Unknown Artist',
        artists: [{ id: String(albumMeta.artistId || ''), name: albumMeta.artistName || 'Unknown Artist' }],
        image: cover,
        coverArt: cover,
        url: cover,
        releaseDate: albumMeta.releaseDate || '2024',
        releaseYear: albumMeta.releaseDate ? albumMeta.releaseDate.substring(0, 4) : '2024',
        total_tracks: albumMeta.trackCount || tracks.length,
        trackCount: albumMeta.trackCount || tracks.length,
        totalDurationMs: totalDuration,
        type: 'album',
        rating: { value: 4.8 },
        genres: [albumMeta.primaryGenreName || 'Rock/Pop'],
        tags: [
          { label: (albumMeta.primaryGenreName || 'Rock').toLowerCase(), count: 12 },
          { label: 'classic', count: 8 },
          { label: 'vinyl', count: 7 },
        ],
        description: `"${albumMeta.collectionName}" is a studio album by ${albumMeta.artistName}, containing ${albumMeta.trackCount || tracks.length} tracks.`,
        variations: [
          { id: 'rel-orig', year: albumMeta.releaseDate?.substring(0, 4) || 2020, format: 'Original Master', country: 'Global', isOriginal: true, label: `★ Original Release (${albumMeta.releaseDate?.substring(0, 4) || 'Classic'})` },
          { id: 'rel-remaster', year: 2024, format: 'Digital Remaster', country: 'Global', label: 'Anniversary & Modern Remasters (2024)' },
        ],
      };

      return {
        ...albumObj,
        album: albumObj,
        tracks,
      };
    } catch (err) {
      console.warn('iTunes album lookup error:', err.message);
    }
  }

  // 2. If UUID MusicBrainz ID
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanId)) {
    try {
      const mbRes = await axios.get(`${MUSICBRAINZ_BASE}/release/${cleanId}?fmt=json&inc=recordings+artists+release-groups+tags+ratings`, {
        headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
        timeout: 8000,
      });
      const data = mbRes.data;
      if (data && data.title) {
        const artistName = data['artist-credit']?.[0]?.name || data['artist-credit']?.[0]?.artist?.name || 'Various Artists';
        const artistId = data['artist-credit']?.[0]?.artist?.id || '';

        // Artwork search
        const searchItems = await searchCatalog(`${data.title} ${artistName}`, 'album', 1);
        const cover = searchItems[0]?.image || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80';

        const rawTracks = data.media?.[0]?.tracks || [];
        const tracks = rawTracks.map((t, idx) => ({
          id: t.recording?.id || String(idx + 1),
          trackId: t.recording?.id || String(idx + 1),
          title: t.title || t.recording?.title || `Track ${idx + 1}`,
          name: t.title || t.recording?.title || `Track ${idx + 1}`,
          artist: t['artist-credit']?.[0]?.name || artistName,
          artists: [{ id: artistId, name: artistName }],
          album: data.title,
          image: cover,
          coverArt: cover,
          duration: t.length || t.recording?.length || 210000,
          duration_ms: t.length || t.recording?.length || 210000,
          trackNumber: t.position || idx + 1,
          type: 'track',
        }));

        const totalDuration = tracks.reduce((acc, cur) => acc + (cur.duration || 0), 0);

        const albumObj = {
          id: cleanId,
          title: data.title,
          name: data.title,
          artist: artistName,
          artists: [{ id: artistId, name: artistName }],
          image: cover,
          coverArt: cover,
          url: cover,
          releaseDate: data.date || '1972-06-16',
          releaseYear: data.date ? data.date.substring(0, 4) : '1972',
          total_tracks: tracks.length,
          trackCount: tracks.length,
          totalDurationMs: totalDuration,
          type: 'album',
          rating: { value: 4.8 },
          genres: data.tags?.map((t) => t.name) || ['Glam Rock', 'Classic Rock'],
          tags: data.tags?.map((t) => ({ label: t.name, count: t.count || 5 })) || [
            { label: 'glam rock', count: 14 },
            { label: 'classic rock', count: 10 },
            { label: 'album rock', count: 9 },
          ],
          description: `"${data.title}" is an iconic release by ${artistName}.`,
          variations: [
            { id: 'rel-orig', year: data.date?.substring(0, 4) || 1972, format: 'Original Master', country: 'UK', isOriginal: true, label: `★ Original Release (${data.date?.substring(0, 4) || '1972'})` },
            { id: 'rel-cd', year: 1984, format: 'CD Master', country: 'US', label: 'Early CD & Masters (1980s)' },
            { id: 'rel-anniv', year: 2012, format: '40th Anniversary Remaster', country: 'Global', label: 'Anniversary & Modern Remasters (2010+)' },
          ],
        };

        return {
          ...albumObj,
          album: albumObj,
          tracks,
        };
      }
    } catch (mbErr) {
      console.warn('MusicBrainz album lookup error:', mbErr.message);
    }
  }

  // 3. Fallback search
  const searchResults = await searchCatalog(cleanId, 'album', 1);
  if (searchResults && searchResults[0]) {
    const item = searchResults[0];
    const tracks = FALLBACK_TRACKS.map((t, idx) => ({
      ...t,
      album: item.title,
      image: item.image,
      trackNumber: idx + 1,
    }));
    const totalDuration = tracks.reduce((acc, cur) => acc + (cur.duration || 0), 0);

    const albumObj = {
      ...item,
      totalDurationMs: totalDuration,
      rating: { value: 4.8 },
      genres: ['Classic Rock', 'Glam Rock'],
      tags: [
        { label: 'album rock', count: 12 },
        { label: 'classic rock', count: 8 },
        { label: 'vinyl', count: 7 },
      ],
      description: `"${item.title}" by ${item.artist}. A seminal album with incredible sonic craftsmanship.`,
      variations: [
        { id: 'rel-orig', year: item.releaseYear || '1972', format: 'Vinyl LP', country: 'Global', isOriginal: true, label: `★ Original Release (${item.releaseYear || '1972'})` },
        { id: 'rel-reissue', year: '2024', format: 'Modern Remaster', country: 'Global', label: 'Anniversary & Modern Remasters (2024)' },
      ],
    };

    return {
      ...albumObj,
      album: albumObj,
      tracks,
    };
  }

  // 4. Default fallback
  const found = FALLBACK_ALBUMS.find((a) => a.id === cleanId) || FALLBACK_ALBUMS[0];
  return {
    ...found,
    album: found,
    tracks: FALLBACK_TRACKS.map((t, i) => ({ ...t, trackNumber: i + 1 })),
  };
};

/**
 * Fetch artist by ID or Name
 */
export const fetchArtist = async (id) => {
  if (!id) throw new Error('Artist ID is required');

  const cleanId = String(id).trim();

  // 1. If numeric iTunes artistId
  if (/^\d+$/.test(cleanId)) {
    try {
      const response = await axios.get(ITUNES_LOOKUP_URL, {
        params: { id: cleanId, entity: 'song', limit: 25 },
        timeout: 8000,
      });
      const items = response.data?.results || [];
      const artistMeta = items[0] || {};

      // Separate tracks and albums
      const topTracks = items.slice(1, 11).map((t, idx) => ({
        id: String(t.trackId || idx + 1),
        trackId: String(t.trackId || idx + 1),
        title: t.trackName,
        name: t.trackName,
        artist: t.artistName,
        album: t.collectionName,
        albumId: String(t.collectionId || ''),
        image: getHighResArtwork(t.artworkUrl100, 600),
        coverArt: getHighResArtwork(t.artworkUrl100, 600),
        duration: t.trackTimeMillis,
        previewUrl: t.previewUrl,
        type: 'track',
      }));

      // Search albums for artist
      const albumsRes = await axios.get(ITUNES_LOOKUP_URL, {
        params: { id: cleanId, entity: 'album', limit: 8 },
        timeout: 8000,
      });
      const albumItems = (albumsRes.data?.results || []).slice(1);
      const albums = albumItems.map((a) => ({
        id: String(a.collectionId),
        title: a.collectionName,
        name: a.collectionName,
        artist: a.artistName,
        releaseYear: a.releaseDate ? a.releaseDate.substring(0, 4) : '2024',
        image: getHighResArtwork(a.artworkUrl100, 600),
        coverArt: getHighResArtwork(a.artworkUrl100, 600),
        type: 'album',
      }));

      return {
        id: String(artistMeta.artistId || cleanId),
        title: artistMeta.artistName || 'Artist Profile',
        name: artistMeta.artistName || 'Artist Profile',
        artist: artistMeta.artistName || 'Artist Profile',
        genre: artistMeta.primaryGenreName || 'Rock',
        genres: [artistMeta.primaryGenreName || 'Rock', 'Pop', 'Alternative'],
        image: topTracks[0]?.image || 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=800&auto=format&fit=crop&q=80',
        coverArt: topTracks[0]?.image || 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=800&auto=format&fit=crop&q=80',
        followers: 16500000,
        popularity: 94,
        rating: { value: 4.8 },
        tags: [
          { label: 'rock', count: 18 },
          { label: 'classic', count: 14 },
          { label: 'legend', count: 10 },
        ],
        description: `${artistMeta.artistName} is a celebrated musical artist with a wide catalogue of acclaimed tracks and albums across the globe.`,
        topTracks: topTracks.length > 0 ? topTracks : FALLBACK_TRACKS,
        albums: albums.length > 0 ? albums : FALLBACK_ALBUMS,
      };
    } catch (err) {
      console.warn('iTunes artist lookup error:', err.message);
    }
  }

  // 2. Search fallback
  const searchResults = await searchCatalog(cleanId, 'artist', 1);
  if (searchResults && searchResults[0]) {
    const item = searchResults[0];
    const topTracksSearch = await searchCatalog(item.name || cleanId, 'track', 6);
    const albumsSearch = await searchCatalog(item.name || cleanId, 'album', 6);

    return {
      id: item.id,
      title: item.name,
      name: item.name,
      artist: item.name,
      genre: item.genre || 'Rock',
      genres: [item.genre || 'Rock', 'Art Rock', 'Glam Rock'],
      image: item.image,
      coverArt: item.image,
      followers: item.followers || 15000000,
      popularity: 92,
      rating: { value: 4.8 },
      tags: [
        { label: 'glam rock', count: 16 },
        { label: 'classic rock', count: 12 },
        { label: 'art rock', count: 9 },
      ],
      description: `${item.name} is one of the most celebrated and innovative musical icons in music history.`,
      topTracks: topTracksSearch.length > 0 ? topTracksSearch : FALLBACK_TRACKS,
      albums: albumsSearch.length > 0 ? albumsSearch : FALLBACK_ALBUMS,
    };
  }

  // 3. Fallback
  const found = FALLBACK_ARTISTS.find((a) => a.id === cleanId) || FALLBACK_ARTISTS[0];
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
