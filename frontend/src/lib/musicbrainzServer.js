// src/lib/musicbrainzServer.js
import axios from 'axios';

const USER_AGENT = 'GrooveEstrella/2.0 ( https://github.com/farhanalireza/grooveestrella )';
const MUSICBRAINZ_BASE = 'https://musicbrainz.org/ws/2';
const CACHE_TTL_MS = 1000 * 60 * 60 * 4; // 4 hours in-memory cache

// In-memory cache
const memoryCache = new Map();
// In-flight promise tracker to deduplicate identical concurrent requests (e.g. generateMetadata + Page)
const inFlightPromises = new Map();

function getCached(key) {
  const item = memoryCache.get(key);
  if (!item) return null;
  if (Date.now() - item.timestamp > CACHE_TTL_MS) {
    memoryCache.delete(key);
    return null;
  }
  return item.data;
}

function setCached(key, data) {
  // Cap cache size at 500 items to conserve memory
  if (memoryCache.size > 500) {
    const oldestKey = memoryCache.keys().next().value;
    memoryCache.delete(oldestKey);
  }
  memoryCache.set(key, { timestamp: Date.now(), data });
}

export function getCachedOrInFlight(key, fetcher) {
  const cached = getCached(key);
  if (cached) return Promise.resolve(cached);

  if (inFlightPromises.has(key)) {
    return inFlightPromises.get(key);
  }

  const promise = (async () => {
    try {
      const data = await fetcher();
      if (data) {
        setCached(key, data);
      }
      return data;
    } finally {
      inFlightPromises.delete(key);
    }
  })();

  inFlightPromises.set(key, promise);
  return promise;
}

// Chained sequential queue for MusicBrainz to strictly adhere to 1 request per second
let requestQueue = Promise.resolve();
let lastRequestTime = 0;
const MIN_INTERVAL_MS = 1020;

function rateLimitedGet(url, params = {}) {
  const executeWithRetry = async (attempt = 1) => {
    const now = Date.now();
    const timeSinceLast = now - lastRequestTime;
    if (timeSinceLast < MIN_INTERVAL_MS) {
      await new Promise((resolve) => setTimeout(resolve, MIN_INTERVAL_MS - timeSinceLast));
    }
    lastRequestTime = Date.now();

    try {
      return await axios.get(url, {
        params: {
          ...params,
          fmt: 'json',
        },
        headers: {
          'User-Agent': USER_AGENT,
          Accept: 'application/json',
        },
        timeout: 7000,
      });
    } catch (err) {
      const status = err.response?.status;
      if ((status === 503 || status === 429 || !err.response) && attempt < 3) {
        const backoff = attempt * 1200;
        console.warn(`MusicBrainz ${status || err.code || 'error'} on ${url}, retrying in ${backoff}ms (attempt ${attempt}/3)...`);
        await new Promise((resolve) => setTimeout(resolve, backoff));
        return executeWithRetry(attempt + 1);
      }
      throw err;
    }
  };

  const nextPromise = requestQueue.then(() => executeWithRetry(1), () => executeWithRetry(1));
  requestQueue = nextPromise;
  return nextPromise;
}

/**
 * Creates an elegant SVG data URL placeholder for songs/artists without album covers
 */
export function getPlaceholderCover(title = 'Music', artist = 'GrooveEstrella') {
  const cleanTitle = (title || 'Track').slice(0, 24).replace(/[<>&"]/g, '');
  const cleanArtist = (artist || '').slice(0, 20).replace(/[<>&"]/g, '');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#17020B"/>
        <stop offset="50%" stop-color="#300918"/>
        <stop offset="100%" stop-color="#120208"/>
      </linearGradient>
    </defs>
    <rect width="400" height="400" fill="url(#g)" rx="24"/>
    <circle cx="200" cy="170" r="64" fill="#E8A87C" fill-opacity="0.2" stroke="#E8A87C" stroke-width="2"/>
    <path d="M190 145v45a18 18 0 1 1-12-17v-36l36-8v28a18 18 0 1 1-12-17v-5" fill="#E8A87C"/>
    <text x="200" y="275" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="700" fill="#f8fafc" text-anchor="middle">${cleanTitle}</text>
    <text x="200" y="305" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="500" fill="#E8A87C" text-anchor="middle" fill-opacity="0.8">${cleanArtist}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Open Artwork Resolver for Tracks:
 * Queries Cover Art Archive -> Deezer API -> Fallback SVG (strictly NO iTunes)
 */
export async function resolveOpenTrackCover(title, artist = '', rgId = null, relId = null) {
  const cleanTitle = (title || '').trim();
  const cleanArtist = (artist || '').trim();
  const query = `${cleanTitle} ${cleanArtist}`.trim();
  const cacheKey = `img_track_${query.toLowerCase()}_${rgId || relId || ''}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  // 1. Cover Art Archive
  if (rgId) {
    const caa = `https://coverartarchive.org/release-group/${rgId}/front-500`;
    setCached(cacheKey, caa);
    return caa;
  }
  if (relId) {
    const caa = `https://coverartarchive.org/release/${relId}/front-500`;
    setCached(cacheKey, caa);
    return caa;
  }

  // 2. Try Deezer public API
  try {
    const deezerRes = await axios.get('https://api.deezer.com/search', {
      params: { q: query || cleanTitle, limit: 1 },
      timeout: 3000,
    });
    const item = deezerRes.data?.data?.[0];
    if (item?.album?.cover_xl || item?.album?.cover_big || item?.album?.cover_medium) {
      const deezerCover = item.album.cover_xl || item.album.cover_big || item.album.cover_medium;
      setCached(cacheKey, deezerCover);
      return deezerCover;
    }
  } catch (_) {
    // continue
  }

  // 3. Fallback SVG
  const fallback = getPlaceholderCover(cleanTitle, cleanArtist);
  setCached(cacheKey, fallback);
  return fallback;
}

/**
 * Filters out numeric tags, year tags (e.g. #1973, 1973, 70s), and non-musical catalog metadata
 */
/**
 * Formats genre / tag name with proper capitalization, preserving acronyms like R&B, EDM, K-Pop, Lo-Fi
 */
export function formatGenreName(str) {
  if (!str) return '';
  const clean = String(str).replace(/^#+/, '').trim();
  if (/^r&b$/i.test(clean)) return 'R&B';
  if (/^edm$/i.test(clean)) return 'EDM';
  if (/^idm$/i.test(clean)) return 'IDM';
  if (/^k-?pop$/i.test(clean)) return 'K-Pop';
  if (/^j-?pop$/i.test(clean)) return 'J-Pop';
  if (/^lo-?fi$/i.test(clean)) return 'Lo-Fi';
  if (/^hip-?hop$/i.test(clean)) return 'Hip Hop';
  if (/^synth-?pop$/i.test(clean)) return 'Synthpop';
  return clean
    .split(/[\s-]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Sanitizes genre tags by strictly filtering out numbers/years and non-musical catalog clutter,
 * without dropping short genre names like Pop, Rap, Rock, Ska, Dub, R&B, EDM, Emo.
 */
export function sanitizeGenreTags(tags = []) {
  if (!Array.isArray(tags)) return [];
  const valid = [];
  const seen = new Set();

  for (const t of tags) {
    const raw = typeof t === 'string' ? t : (t?.name || '');
    if (!raw) continue;
    const clean = raw.trim();
    const lower = clean.toLowerCase();

    // Discard any tags that are purely numeric or year/decade patterns (e.g. 1973, 70s, 1980s, #1973)
    if (/^\d+$/.test(clean.replace(/#/g, ''))) continue;
    if (/^#?\d{2,4}s?$/i.test(clean)) continue;
    if (/^\d{1,2}\s*(st|nd|rd|th)?\s*(century|anniversary)/i.test(lower)) continue;

    // Discard non-musical catalog/status metadata
    const ignoredMetadata = new Set([
      'album', 'albums', 'ep', 'single', 'singles', 'lp', 'cd', 'vinyl', 'audio',
      'favorite', 'favourites', 'favorites', 'favourite', 'seen live',
      'owned', 'wishlist', 'my collection', 'all time favorite', 'classic', 'masterpiece'
    ]);
    if (ignoredMetadata.has(lower)) continue;

    // Preserves short genres (pop, rap, ska, r&b, dub, emo, rock)
    if (!seen.has(lower)) {
      seen.add(lower);
      valid.push(formatGenreName(clean));
    }
  }

  return valid;
}

/**
 * Divides incoming MusicBrainz genres and community tags into distinct categories:
 * - genres: Curated musical genres sorted by vote count (e.g. Progressive Rock, Rock, Psychedelic Rock)
 * - styles: Musical styles and subgenres from community tags (e.g. Album Rock, Space Rock, Atmospheric)
 * - themes: Concepts, moods, lore (e.g. Concept Album, Philosophy, Masterpiece)
 * - eras: Decade and year tags (e.g. 1970s, 70s, 1973)
 * - others: General community tags
 */
export function categorizeTags(rawTags = [], rawGenres = []) {
  // 1. Curated official genres from MusicBrainz genres
  const genreVoteMap = new Map();
  for (const g of rawGenres || []) {
    const name = typeof g === 'string' ? g : g?.name;
    if (!name) continue;
    const count = (typeof g === 'object' && g.count) || 1;
    genreVoteMap.set(name.toLowerCase(), (genreVoteMap.get(name.toLowerCase()) || 0) + count);
  }

  const sortedGenres = Array.from(genreVoteMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({
      name: formatGenreName(name),
      rawName: name,
      count: count,
      category: 'genre',
    }));

  const primaryGenreNames = new Set(sortedGenres.map((g) => g.rawName.toLowerCase()));

  // 2. Folksonomy community tags
  const styles = [];
  const themes = [];
  const eras = [];
  const others = [];
  const seenTags = new Set();

  const ignoredMetadata = new Set([
    'album', 'albums', 'ep', 'single', 'singles', 'lp', 'cd', 'vinyl', 'audio',
    'owned', 'wishlist', 'my collection', 'all time favorite', 'seen live', 'favourite', 'favorites'
  ]);

  for (const t of rawTags || []) {
    const raw = typeof t === 'string' ? t : t?.name;
    if (!raw) continue;
    const clean = raw.trim();
    const lower = clean.toLowerCase();
    const count = (typeof t === 'object' && t.count) || 1;

    if (seenTags.has(lower)) continue;
    seenTags.add(lower);

    if (ignoredMetadata.has(lower)) continue;
    if (primaryGenreNames.has(lower)) continue; // already in primary genres

    // Era / decade / year detection
    if (/^#?\d{2,4}s?$/i.test(clean) || /^\d{4}$/.test(clean)) {
      eras.push({ name: clean.replace(/^#/, ''), count, category: 'era' });
      continue;
    }

    // Themes / Moods / Lore detection
    const isTheme = /concept|masterpiece|soundtrack|audiophile|acoustic|live|instrumental|vocal|guitar|bass|solo|melanchol|dark|psychedelic|trippy|philosoph|space|lyric/i.test(lower);
    if (isTheme) {
      themes.push({ name: formatGenreName(clean), count, category: 'theme' });
      continue;
    }

    // Styles / subgenres (musical stylistic terms)
    const isStyle = /rock|pop|jazz|metal|folk|blues|wave|punk|electronic|ambient|reggae|disco|funk|soul|indie|alternative|prog|hop|rap|dance|r&b|techno|house|trance|country/i.test(lower);
    if (isStyle) {
      styles.push({ name: formatGenreName(clean), count, category: 'style' });
    } else {
      others.push({ name: formatGenreName(clean), count, category: 'other' });
    }
  }

  // Sort each category by vote count descending
  styles.sort((a, b) => b.count - a.count);
  themes.sort((a, b) => b.count - a.count);
  eras.sort((a, b) => b.count - a.count);
  others.sort((a, b) => b.count - a.count);

  const allWithCounts = [
    ...sortedGenres,
    ...styles,
    ...themes,
    ...eras,
    ...others,
  ];

  const allFlatNames = allWithCounts.map((t) => t.name);

  return {
    genres: sortedGenres,
    styles,
    themes,
    eras,
    others,
    allWithCounts,
    allFlatNames,
    totalCount: allWithCounts.length,
  };
}

/**
 * Open Artwork Resolver for Artists:
 * Queries Deezer artist photography -> Wikipedia summary photo -> Fallback SVG (strictly NO iTunes)
 */
export async function resolveOpenArtistPhoto(artistName, mbid = null) {
  const name = (artistName || '').trim();
  if (!name) return getPlaceholderCover('Artist', 'GrooveEstrella');
  const cacheKey = `img_artist_${name.toLowerCase()}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  // 1. Try Deezer artist search (authentic artist photography)
  try {
    const deezerRes = await axios.get('https://api.deezer.com/search/artist', {
      params: { q: name, limit: 1 },
      timeout: 2000,
    });
    const item = deezerRes.data?.data?.[0];
    if (item && (item.picture_xl || item.picture_big || item.picture_medium)) {
      const photo = item.picture_xl || item.picture_big || item.picture_medium;
      setCached(cacheKey, photo);
      return photo;
    }
  } catch (_) {
    // continue
  }

  // 2. Wikipedia summary candidate search in parallel
  const candidates = [name, `${name} (band)`, `${name} (musician)`];
  try {
    const wikiPhotos = await Promise.allSettled(
      candidates.map((cand) =>
        axios.get(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cand)}`, {
          headers: { 'User-Agent': USER_AGENT },
          timeout: 1800,
        }).then((res) => {
          const data = res.data;
          if (data && data.type !== 'disambiguation') {
            const photo = data.originalimage?.source || data.thumbnail?.source;
            if (photo && !photo.includes('Disambig') && !photo.includes('question_mark')) {
              return photo;
            }
          }
          return null;
        })
      )
    );
    for (const p of wikiPhotos) {
      if (p.status === 'fulfilled' && p.value) {
        setCached(cacheKey, p.value);
        return p.value;
      }
    }
  } catch (_) {}

  // 3. Fallback SVG
  const fallback = getPlaceholderCover(name, 'Artist');
  setCached(cacheKey, fallback);
  return fallback;
}

/**
 * Open Artwork Resolver for Albums:
 * Queries Cover Art Archive -> Deezer album search -> Fallback SVG (strictly NO iTunes)
 */
export async function resolveOpenAlbumCover(albumTitle, artistName = '', rgId = null, releaseId = null) {
  const query = `${albumTitle} ${artistName}`.trim();
  const cacheKey = `img_album_${query.toLowerCase()}_${releaseId || rgId || ''}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  // 1. If specific release/edition is requested, Cover Art Archive for that release takes precedence
  if (releaseId) {
    const caaRelease = `https://coverartarchive.org/release/${releaseId}/front-500`;
    setCached(cacheKey, caaRelease);
    return caaRelease;
  }

  // 1. Cover Art Archive
  if (rgId) {
    const caa = `https://coverartarchive.org/release-group/${rgId}/front-500`;
    setCached(cacheKey, caa);
    return caa;
  }

  // 2. Try Deezer album search
  try {
    const deezerRes = await axios.get('https://api.deezer.com/search/album', {
      params: { q: query || albumTitle, limit: 1 },
      timeout: 3000,
    });
    const item = deezerRes.data?.data?.[0];
    if (item && (item.cover_xl || item.cover_big || item.cover_medium)) {
      const cover = item.cover_xl || item.cover_big || item.cover_medium;
      setCached(cacheKey, cover);
      return cover;
    }
  } catch (_) {
    // continue
  }

  const fallback = getPlaceholderCover(albumTitle, artistName || 'Album');
  setCached(cacheKey, fallback);
  return fallback;
}

/**
 * Legacy Cover Art Archive URL resolver (kept for backward compatibility)
 */
export function getCoverArtUrl(releaseGroupId, releaseId, title = '', artist = '') {
  if (releaseGroupId) {
    return `https://coverartarchive.org/release-group/${releaseGroupId}/front-500`;
  }
  if (releaseId) {
    return `https://coverartarchive.org/release/${releaseId}/front-500`;
  }
  return getPlaceholderCover(title, artist);
}

/**
 * Searches MusicBrainz recordings and returns formatted tracks with rich metadata and real artwork
 */
export async function searchMusicBrainzTracksServer(query, limit = 10) {
  if (!query || !query.trim()) return [];
  const cacheKey = `search_track_${query.trim()}_${limit}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const cleanQuery = query.trim();
    const response = await rateLimitedGet(`${MUSICBRAINZ_BASE}/recording/`, {
      query: cleanQuery,
      limit: Math.max(limit, 5),
    });

    const recordings = response.data?.recordings || [];
    if (!recordings.length) return [];

    // Filter and map to unified track model with async artwork resolution
    const results = await Promise.all(
      recordings.slice(0, limit).map(async (rec) => {
        const artistCredit = rec['artist-credit']?.map((a) => a.name).join('') || 'Unknown Artist';
        const artistsList = rec['artist-credit']?.map((a) => ({
          name: a.name,
          id: a.artist?.id || a.id || '',
        })) || [{ name: artistCredit, id: '' }];

        const primaryRelease = rec.releases?.[0];
        const rgId = primaryRelease?.['release-group']?.id;
        const relId = primaryRelease?.id;
        const albumTitle = primaryRelease?.title || rec.title;
        const tags = rec.tags?.map((t) => t.name) || [];

        // Resolve real, high-resolution artwork
        const coverUrl = await resolveOpenTrackCover(rec.title, artistCredit, rgId, relId);

        let releaseDate = primaryRelease?.date || rec['first-release-date'] || null;
        let releaseYear = null;
        if (releaseDate) {
          const parsed = new Date(releaseDate).getFullYear();
          if (!isNaN(parsed)) releaseYear = parsed;
        }

        const queryForLinks = `${rec.title} ${artistCredit}`;

        return {
          id: rec.id,
          trackId: rec.id,
          title: rec.title,
          name: rec.title,
          artist: artistsList,
          artists: artistsList,
          album: albumTitle,
          albumID: rgId || relId || rec.id,
          coverArt: coverUrl,
          url: coverUrl,
          releaseDate: releaseDate,
          releaseYear: releaseYear,
          durationMs: rec.length || 0,
          genres: tags.slice(0, 5),
          popularity: rec.score ? Math.min(100, Math.max(60, rec.score)) : 80,
          explicit: false,
          spoURL: `https://open.spotify.com/search/${encodeURIComponent(queryForLinks)}`,
          YTURL: `https://www.youtube.com/results?search_query=${encodeURIComponent(queryForLinks)}`,
          trackURI: `musicbrainz:track:${rec.id}`,
          mbid: rec.id,
          type: 'track',
        };
      })
    );

    setCached(cacheKey, results);
    return results;
  } catch (error) {
    console.error(`MusicBrainz search tracks failed for "${query}":`, error.message);
    return [];
  }
}

/**
 * Searches a single canonical track on MusicBrainz (used for link conversion & resolvers)
 */
export async function searchMusicBrainzTrackServer(query) {
  if (!query || !query.trim()) return null;
  const results = await searchMusicBrainzTracksServer(query, 5);
  if (!results.length) return null;

  // Find best match if query contains artist name
  const queryWords = query.toLowerCase().split(/\s+/);
  const bestMatch = results.find((r) => {
    const artistName = (Array.isArray(r.artist) ? r.artist.map((a) => a.name).join(' ') : String(r.artist)).toLowerCase();
    return queryWords.some((w) => w.length > 2 && artistName.includes(w));
  }) || results[0];

  return bestMatch;
}

/**
 * Searches MusicBrainz artists and returns formatted artist cards with real artist photography
 */
export async function searchMusicBrainzArtistsServer(query, limit = 10) {
  if (!query || !query.trim()) return [];
  const cacheKey = `search_artist_${query.trim()}_${limit}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const response = await rateLimitedGet(`${MUSICBRAINZ_BASE}/artist/`, {
      query: query.trim(),
      limit: limit,
    });

    const artists = response.data?.artists || [];
    const results = await Promise.all(
      artists.map(async (art) => {
        const tags = art.tags?.map((t) => t.name) || [];
        const score = art.score || 80;
        const queryForLinks = art.name;

        // Resolve real artist photography
        const photoUrl = await resolveOpenArtistPhoto(art.name, art.id);

        return {
          id: art.id,
          title: art.name,
          name: art.name,
          artist: art.name,
          country: art.country || 'Global',
          type: 'artist',
          genres: tags.slice(0, 5),
          url: photoUrl,
          image: photoUrl,
          coverArt: photoUrl,
          followers: score ? score * 12500 : 85000,
          popularity: score,
          spoURL: `https://open.spotify.com/search/${encodeURIComponent(queryForLinks + ' artist')}`,
          YTURL: `https://www.youtube.com/results?search_query=${encodeURIComponent(queryForLinks + ' official')}`,
          trackURI: `musicbrainz:artist:${art.id}`,
          mbid: art.id,
        };
      })
    );

    setCached(cacheKey, results);
    return results;
  } catch (error) {
    console.error(`MusicBrainz search artists failed for "${query}":`, error.message);
    return [];
  }
}

/**
 * Searches MusicBrainz release-groups (albums/singles) and returns formatted albums with real album covers
 */
export async function searchMusicBrainzAlbumsServer(query, limit = 10) {
  if (!query || !query.trim()) return [];
  const cacheKey = `search_album_${query.trim()}_${limit}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const response = await rateLimitedGet(`${MUSICBRAINZ_BASE}/release-group/`, {
      query: query.trim(),
      limit: limit,
    });

    const releaseGroups = response.data?.['release-groups'] || [];
    const results = await Promise.all(
      releaseGroups.map(async (rg) => {
        const artistCredit = rg['artist-credit']?.map((a) => a.name).join('') || 'Various Artists';
        const artistsList = rg['artist-credit']?.map((a) => ({
          name: a.name,
          id: a.artist?.id || '',
        })) || [{ name: artistCredit, id: '' }];

        // Resolve real album cover
        const coverUrl = await resolveOpenAlbumCover(rg.title, artistCredit, rg.id);

        let releaseDate = rg['first-release-date'] || null;
        let releaseYear = null;
        if (releaseDate) {
          const parsed = new Date(releaseDate).getFullYear();
          if (!isNaN(parsed)) releaseYear = parsed;
        }

        return {
          id: rg.id,
          title: rg.title,
          name: rg.title,
          artist: artistsList,
          artists: artistsList,
          url: coverUrl,
          image: coverUrl,
          coverArt: coverUrl,
          type: 'album',
          primaryType: rg['primary-type'] || 'Album',
          releaseDate: releaseDate,
          releaseYear: releaseYear,
          trackURI: `musicbrainz:album:${rg.id}`,
          spoURL: `https://open.spotify.com/search/${encodeURIComponent(rg.title + ' ' + artistCredit + ' album')}`,
          mbid: rg.id,
        };
      })
    );

    setCached(cacheKey, results);
    return results;
  } catch (error) {
    console.error(`MusicBrainz search albums failed for "${query}":`, error.message);
    return [];
  }
}

/**
 * Normalizes and categorizes external relations into rich platform links
 */
export function parseExternalLinks(relations = [], { title = '', artist = '', type = 'track', mbid = '' } = {}) {
  const links = [];
  const seenUrls = new Set();

  const addLink = (platform, label, url, category = 'streaming') => {
    if (!url || seenUrls.has(url)) return;
    seenUrls.add(url);
    links.push({ platform, label, url, category });
  };

  // Map MusicBrainz URL relations
  for (const rel of relations || []) {
    const url = rel.url?.resource;
    const relType = (rel.type || '').toLowerCase();
    if (!url) continue;

    if (url.includes('wikipedia.org')) {
      addLink('wikipedia', 'Wikipedia', url, 'encyclopedia');
    } else if (url.includes('wikidata.org')) {
      addLink('wikidata', 'Wikidata', url, 'database');
    } else if (url.includes('discogs.com')) {
      addLink('discogs', 'Discogs', url, 'database');
    } else if (url.includes('allmusic.com')) {
      addLink('allmusic', 'AllMusic', url, 'review');
    } else if (url.includes('last.fm')) {
      addLink('lastfm', 'Last.fm', url, 'social');
    } else if (url.includes('rateyourmusic.com')) {
      addLink('rateyourmusic', 'RateYourMusic', url, 'review');
    } else if (url.includes('genius.com') || relType.includes('lyrics')) {
      addLink('genius', 'Genius Lyrics', url, 'lyrics');
    } else if (url.includes('bbc.co.uk') || relType.includes('review')) {
      addLink('bbc', 'BBC Review', url, 'review');
    } else if (relType.includes('official') || relType === 'homepage') {
      addLink('official', 'Official Website', url, 'official');
    } else if (url.includes('spotify.com')) {
      addLink('spotify', 'Spotify', url, 'streaming');
    } else if (url.includes('apple.com')) {
      addLink('applemusic', 'Apple Music', url, 'streaming');
    } else if (url.includes('youtube.com') || url.includes('youtu.be')) {
      addLink('youtube', 'YouTube', url, 'streaming');
    } else if (url.includes('deezer.com')) {
      addLink('deezer', 'Deezer', url, 'streaming');
    } else if (url.includes('tidal.com')) {
      addLink('tidal', 'TIDAL', url, 'streaming');
    } else if (url.includes('bandcamp.com')) {
      addLink('bandcamp', 'Bandcamp', url, 'purchase');
    } else if (url.includes('soundcloud.com')) {
      addLink('soundcloud', 'SoundCloud', url, 'streaming');
    } else if (url.includes('songkick.com')) {
      addLink('songkick', 'Songkick Live', url, 'live');
    }
  }

  // Ensure major platforms are present via smart search if not in relations
  const query = `${title || ''} ${artist || ''}`.trim();
  if (!links.some(l => l.platform === 'spotify') && query) {
    addLink('spotify', 'Spotify', `https://open.spotify.com/search/${encodeURIComponent(query)}`, 'streaming');
  }
  if (!links.some(l => l.platform === 'youtube') && query) {
    addLink('youtube', 'YouTube', `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`, 'streaming');
  }
  if (!links.some(l => l.platform === 'applemusic') && query) {
    addLink('applemusic', 'Apple Music', `https://music.apple.com/search?term=${encodeURIComponent(query)}`, 'streaming');
  }
  if (mbid && type) {
    addLink('musicbrainz', 'MusicBrainz', `https://musicbrainz.org/${type}/${mbid}`, 'database');
  }

  return links;
}

/**
 * Resolves informative overview / biography from Wikidata, Wikipedia, or MusicBrainz annotation
 */
export async function resolveDescription(name, title, artist, wikidataId, annotation, tags = []) {
  const targetName = (title || name || '').trim();
  const targetArtist = (artist || '').trim();
  const cacheKey = `desc_${wikidataId || ''}_${targetName.toLowerCase()}_${targetArtist.toLowerCase()}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const primaryName = targetName || 'This release';
  const primaryArtist = targetArtist ? ` by ${targetArtist}` : '';
  const fallback = (tags && tags.length > 0)
    ? `An acclaimed release by ${targetArtist || primaryName}, featuring recognized styles in ${tags.slice(0, 4).join(', ')}.`
    : `${primaryName} is a celebrated musical work${primaryArtist}. Explore its full catalog, tracklist, multiple pressings, community ratings, and universal streaming links on GrooveEstrella.`;

  // Fetch Wikipedia extract with a strict 1500ms timeout so it never stalls page load
  try {
    const fetchWikiExtract = async () => {
      // 1. Fast wbgetentities query using linked Wikidata ID
      if (wikidataId) {
        try {
          const wdRes = await axios.get('https://www.wikidata.org/w/api.php', {
            params: {
              action: 'wbgetentities',
              ids: wikidataId,
              props: 'sitelinks',
              sitefilter: 'enwiki',
              format: 'json',
            },
            headers: { 'User-Agent': USER_AGENT },
            timeout: 1200,
          });
          const wikiTitle = wdRes.data?.entities?.[wikidataId]?.sitelinks?.enwiki?.title;
          if (wikiTitle) {
            const sumRes = await axios.get(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wikiTitle)}`, {
              headers: { 'User-Agent': USER_AGENT },
              timeout: 1200,
            });
            const ext = sumRes.data?.extract;
            if (ext && sumRes.data?.type !== 'disambiguation') {
              return ext;
            }
          }
        } catch (_) {}
      }

      // 2. Contextual Wikipedia Search (avoids ambiguous matches like "Red" -> color, "21" -> number)
      if (targetName) {
        try {
          const searchQuery = `"${targetName}" ${targetArtist ? `"${targetArtist}"` : ''} album`.trim();
          const searchRes = await axios.get('https://en.wikipedia.org/w/api.php', {
            params: {
              action: 'query',
              list: 'search',
              srsearch: searchQuery,
              format: 'json',
            },
            headers: { 'User-Agent': USER_AGENT },
            timeout: 1200,
          });

          const items = searchRes.data?.query?.search || [];
          if (items.length > 0) {
            const lowerTarget = targetName.toLowerCase();
            const lowerArtist = targetArtist.toLowerCase();

            // Match prioritizing exact title, (album), or artist containing title
            const exact = items.find((it) => it.title.toLowerCase() === lowerTarget);
            const withAlbum = items.find((it) => it.title.toLowerCase() === `${lowerTarget} (album)`);
            const withArtistAlbum = items.find(
              (it) => it.title.toLowerCase().includes(lowerTarget) && it.title.toLowerCase().includes(lowerArtist)
            );
            const containsAlbum = items.find(
              (it) => it.title.toLowerCase().includes(lowerTarget) && it.title.toLowerCase().includes('album')
            );
            const containsTitle = items.find((it) => it.title.toLowerCase().includes(lowerTarget));

            const best = exact || withAlbum || withArtistAlbum || containsAlbum || containsTitle || items[0];

            if (best) {
              const sumRes = await axios.get(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(best.title)}`, {
                headers: { 'User-Agent': USER_AGENT },
                timeout: 1200,
              });
              const ext = sumRes.data?.extract || '';
              // Verify it's music-related and not a disambiguation page
              const isMusicRelated = /album|record|track|song|band|singer|musician|released|audio|studio|ep/i.test(ext);
              if (ext && sumRes.data?.type !== 'disambiguation' && isMusicRelated) {
                return ext;
              }
            }
          }
        } catch (_) {}
      }

      // 3. Meaningful MusicBrainz annotation (only if valid editorial lore, not technical matrix runouts)
      if (annotation && typeof annotation === 'string' && annotation.trim().length > 35) {
        const clean = annotation.trim();
        const isTechnical = /^(matrix|barcode|catalogue|cat#|cd matrix|runout|pressing plant|mastered by)/i.test(clean);
        if (!isTechnical) {
          // Clean basic wiki markup
          const stripped = clean.replace(/==.*?==/g, '').replace(/\[\[(?:[^|\]]*\|)?([^\]]+)\]\]/g, '$1').trim();
          if (stripped.length > 25) {
            return stripped;
          }
        }
      }

      return null;
    };

    const extract = await Promise.race([
      fetchWikiExtract(),
      new Promise((res) => setTimeout(() => res(null), 1500)),
    ]);

    if (extract) {
      setCached(cacheKey, extract);
      return extract;
    }
  } catch (_) {}

  setCached(cacheKey, fallback);
  return fallback;
}

/**
 * Fetches recording (track) details by MBID with complete metadata and real artwork
 */
export async function fetchMusicBrainzTrackServer(id) {
  if (!id) return null;
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  if (!isUUID) return null;

  const cacheKey = `track_detail_${id}`;
  return getCachedOrInFlight(cacheKey, async () => {
    try {
      const response = await rateLimitedGet(`${MUSICBRAINZ_BASE}/recording/${id}`, {
        inc: 'artists+releases+release-groups+ratings+tags+genres+url-rels+annotation',
      });

      const rec = response.data;
      if (!rec || !rec.title) return null;

      const artistCredit = rec['artist-credit']?.map((a) => a.name).join('') || 'Unknown Artist';
      const artistsList = rec['artist-credit']?.map((a) => ({
        name: a.name,
        id: a.artist?.id || a.id || '',
      })) || [{ name: artistCredit, id: '' }];

      const primaryRelease = rec.releases?.[0];
      const rgId = primaryRelease?.['release-group']?.id;
      const relId = primaryRelease?.id;
      const albumTitle = primaryRelease?.title || rec.title;
      const tags = rec.tags?.map((t) => t.name) || [];
      const allTags = rec.tags?.map((t) => ({ name: t.name, count: t.count || 0 })) || [];
      const rawGenres = rec.genres || [];
      const categorizedTags = categorizeTags(rec.tags || [], rawGenres);
      const primaryGenre = categorizedTags.genres[0]?.name || categorizedTags.styles[0]?.name || sanitizeGenreTags(tags)[0] || null;

      // Resolve authentic, high-res artwork
      const coverUrl = await resolveOpenTrackCover(rec.title, artistCredit, rgId, relId);

      let releaseDate = primaryRelease?.date || rec['first-release-date'] || null;
      let releaseYear = null;
      if (releaseDate) {
        const parsed = new Date(releaseDate).getFullYear();
        if (!isNaN(parsed)) releaseYear = parsed;
      }

      const queryForLinks = `${rec.title} ${artistCredit}`;

      // Extract Wikidata ID if available
      const wikidataRel = rec.relations?.find((r) => r.type === 'wikidata' || r.url?.resource?.includes('wikidata.org'));
      const wikidataId = wikidataRel?.url?.resource?.split('/')?.filter(Boolean)?.pop() || null;

      // Resolve rich description / background
      const description = await resolveDescription(rec.title, rec.title, artistCredit, wikidataId, rec.annotation, tags);

      // Parse external links
      const externalLinks = parseExternalLinks(rec.relations, {
        title: rec.title,
        artist: artistCredit,
        type: 'recording',
        mbid: rec.id,
      });

      // Rating / Reviews info
      const rating = rec.rating
        ? {
            value: rec.rating.value !== undefined ? rec.rating.value : null,
            votesCount: rec.rating['votes-count'] || 0,
          }
        : null;

      const trackData = {
        id: rec.id,
        trackId: rec.id,
        name: rec.title,
        title: rec.title,
        artists: artistsList,
        artist: artistsList,
        album: {
          id: rgId || relId || rec.id,
          name: albumTitle,
          title: albumTitle,
          images: [{ url: coverUrl, width: 600, height: 600 }],
          release_date: releaseDate || 'Unknown',
        },
        coverArt: coverUrl,
        url: coverUrl,
        releaseDate: releaseDate,
        releaseYear: releaseYear,
        duration_ms: rec.length || 0,
        durationMs: rec.length || 0,
        primaryGenre: primaryGenre,
        genres: categorizedTags.genres.length > 0 ? categorizedTags.genres.map((g) => g.name) : sanitizeGenreTags(tags).slice(0, 5),
        categorizedTags: categorizedTags,
        tags: tags,
        allTags: allTags,
        description: description,
        rating: rating,
        externalLinks: externalLinks,
        popularity: rec.score ? Math.min(100, Math.max(60, rec.score)) : 85,
        explicit: false,
        external_urls: {
          spotify: `https://open.spotify.com/search/${encodeURIComponent(queryForLinks)}`,
          musicbrainz: `https://musicbrainz.org/recording/${rec.id}`,
        },
        spoURL: `https://open.spotify.com/search/${encodeURIComponent(queryForLinks)}`,
        YTURL: `https://www.youtube.com/results?search_query=${encodeURIComponent(queryForLinks)}`,
        uri: `musicbrainz:track:${rec.id}`,
        trackURI: `musicbrainz:track:${rec.id}`,
        type: 'track',
        originalPlatform: 'musicbrainz',
        originalId: rec.id,
      };

      return trackData;
    } catch (error) {
      console.error(`Failed to fetch MusicBrainz track for ID "${id}":`, error.message);
      return null;
    }
  });
}

/**
 * Fetches artist details, top recordings, and discography by MBID with real artist photography
 */
export async function fetchMusicBrainzArtistServer(id) {
  if (!id) return null;
  const cacheKey = `artist_detail_${id}`;

  return getCachedOrInFlight(cacheKey, async () => {
    try {
      // 1. Fetch artist core info
      const artistRes = await rateLimitedGet(`${MUSICBRAINZ_BASE}/artist/${id}`, {
        inc: 'tags+genres+ratings+url-rels+annotation',
      });

      const artistData = artistRes.data;
      if (!artistData || !artistData.name) return null;

      const tags = artistData.tags?.map((t) => t.name) || [];
      const allTags = artistData.tags?.map((t) => ({ name: t.name, count: t.count || 0 })) || [];
      const rawGenres = artistData.genres || [];
      const categorizedTags = categorizeTags(artistData.tags || [], rawGenres);
      const primaryGenre = categorizedTags.genres[0]?.name || categorizedTags.styles[0]?.name || sanitizeGenreTags(tags)[0] || null;
      const queryForLinks = artistData.name;

      // Extract Wikidata ID if available
      const wikidataRel = artistData.relations?.find((r) => r.type === 'wikidata' || r.url?.resource?.includes('wikidata.org'));
      const wikidataId = wikidataRel?.url?.resource?.split('/')?.filter(Boolean)?.pop() || null;

      // Rating / Reviews info
      const rating = artistData.rating
        ? {
            value: artistData.rating.value !== undefined ? artistData.rating.value : null,
            votesCount: artistData.rating['votes-count'] || 0,
          }
        : null;

      // Parse external links
      const externalLinks = parseExternalLinks(artistData.relations, {
        title: artistData.name,
        artist: artistData.name,
        type: 'artist',
        mbid: artistData.id,
      });

      // 2. Concurrently fetch release-groups, photo, description, and Deezer top tracks!
      const fetchDeezerTracks = async () => {
        try {
          const deezerArtistRes = await axios.get('https://api.deezer.com/search/artist', {
            params: { q: artistData.name, limit: 1 },
            timeout: 2500,
          });
          const deezerArtist = deezerArtistRes.data?.data?.[0];
          if (deezerArtist?.id) {
            const deezerTopRes = await axios.get(`https://api.deezer.com/artist/${deezerArtist.id}/top`, {
              params: { limit: 10 },
              timeout: 2500,
            });
            const deezerSongs = deezerTopRes.data?.data || [];
            if (deezerSongs.length > 0) {
              return deezerSongs.map((s) => {
                const songCover = s.album?.cover_xl || s.album?.cover_big || s.album?.cover_medium;
                let songYear = null;
                if (s.album?.release_date) {
                  const parsed = new Date(s.album.release_date).getFullYear();
                  if (!isNaN(parsed)) songYear = parsed;
                }
                return {
                  id: `dz-${s.id}`,
                  trackId: `dz-${s.id}`,
                  title: s.title,
                  name: s.title,
                  url: songCover,
                  coverArt: songCover,
                  artists: [{ name: artistData.name, id: artistData.id }],
                  artist: [{ name: artistData.name, id: artistData.id }],
                  album: s.album?.title || '',
                  albumID: s.album?.id ? `dz-${s.album.id}` : '',
                  releaseDate: s.album?.release_date || null,
                  releaseYear: songYear,
                  durationMs: (s.duration || 0) * 1000,
                  duration_ms: (s.duration || 0) * 1000,
                  duration: (s.duration || 0) * 1000,
                  popularity: s.rank ? Math.min(100, Math.round(s.rank / 10000)) : 88,
                  explicit: !!s.explicit_lyrics,
                  spoURL: `https://open.spotify.com/search/${encodeURIComponent(s.title + ' ' + artistData.name)}`,
                  YTURL: `https://www.youtube.com/results?search_query=${encodeURIComponent(s.title + ' ' + artistData.name)}`,
                  trackURI: `deezer:track:${s.id}`,
                  type: 'track',
                };
              });
            }
          }
        } catch (_) {}
        return [];
      };

      const [releaseGroupsRes, coverUrl, description, deezerTopTracks] = await Promise.all([
        rateLimitedGet(`${MUSICBRAINZ_BASE}/release-group`, {
          artist: id,
          type: 'album|ep|single',
          limit: 100,
        }),
        resolveOpenArtistPhoto(artistData.name, artistData.id),
        resolveDescription(artistData.name, artistData.name, artistData.name, wikidataId, artistData.annotation, tags),
        fetchDeezerTracks(),
      ]);

      let topTracks = deezerTopTracks;

      // Only if Deezer top tracks unavailable, fallback to MusicBrainz recordings
      if (!topTracks || topTracks.length === 0) {
        try {
          const recordingsRes = await rateLimitedGet(`${MUSICBRAINZ_BASE}/recording`, {
            artist: id,
            limit: 10,
          });
          const rawRecs = recordingsRes.data?.recordings || [];
          topTracks = rawRecs.map((rec) => {
            const primaryRel = rec.releases?.[0];
            const rgId = primaryRel?.['release-group']?.id;
            const relId = primaryRel?.id;
            const trackCover = rgId
              ? `https://coverartarchive.org/release-group/${rgId}/front-500`
              : relId
              ? `https://coverartarchive.org/release/${relId}/front-500`
              : coverUrl;

            let releaseDate = primaryRel?.date || rec['first-release-date'] || null;
            let releaseYear = null;
            if (releaseDate) {
              const parsed = new Date(releaseDate).getFullYear();
              if (!isNaN(parsed)) releaseYear = parsed;
            }

            return {
              id: rec.id,
              trackId: rec.id,
              title: rec.title,
              name: rec.title,
              url: trackCover,
              coverArt: trackCover,
              artists: [{ name: artistData.name, id: artistData.id }],
              artist: [{ name: artistData.name, id: artistData.id }],
              album: primaryRel?.title || '',
              albumID: primaryRel?.id || '',
              releaseDate: releaseDate,
              releaseYear: releaseYear,
              durationMs: rec.length || 0,
              duration_ms: rec.length || 0,
              duration: rec.length || 0,
              popularity: 85,
              explicit: false,
              spoURL: `https://open.spotify.com/search/${encodeURIComponent(rec.title + ' ' + artistData.name)}`,
              YTURL: `https://www.youtube.com/results?search_query=${encodeURIComponent(rec.title + ' ' + artistData.name)}`,
              trackURI: `musicbrainz:track:${rec.id}`,
              type: 'track',
            };
          });
        } catch (_) {}
      }

      // Process all releases and categorize into studio albums vs other release types
      const rawRgs = releaseGroupsRes.data?.['release-groups'] || [];
      const seenTitles = new Set();
      const studioAlbums = [];
      const allReleases = [];

      for (const rg of rawRgs) {
        const cleanTitle = (rg.title || '').trim();
        const primaryType = rg['primary-type'] || 'Album';
        const secondaryTypes = rg['secondary-types'] || [];
        const normKey = `${cleanTitle.toLowerCase()}_${primaryType.toLowerCase()}`;

        if (!seenTitles.has(normKey)) {
          seenTitles.add(normKey);
          const releaseDate = rg['first-release-date'] || null;
          let releaseYear = null;
          if (releaseDate) {
            const parsed = new Date(releaseDate).getFullYear();
            if (!isNaN(parsed)) releaseYear = parsed;
          }

          const isCompilation = secondaryTypes.some((s) => (s || '').toLowerCase().includes('compilation'));
          const isLive = secondaryTypes.some((s) => (s || '').toLowerCase().includes('live'));
          const isRemix = secondaryTypes.some((s) => (s || '').toLowerCase().includes('remix'));

          let typeCategory = 'album';
          if (isCompilation) typeCategory = 'compilation';
          else if (isLive) typeCategory = 'live';
          else if (isRemix) typeCategory = 'remix';
          else if (primaryType.toLowerCase() === 'single') typeCategory = 'single';
          else if (primaryType.toLowerCase() === 'ep') typeCategory = 'ep';

          const albumCover = rg.id
            ? `https://coverartarchive.org/release-group/${rg.id}/front-500`
            : getPlaceholderCover(cleanTitle, artistData.name);

          const releaseObj = {
            id: rg.id,
            title: cleanTitle,
            name: cleanTitle,
            url: albumCover,
            image: albumCover,
            coverArt: albumCover,
            artist: [{ name: artistData.name, id: artistData.id }],
            artists: [{ name: artistData.name, id: artistData.id }],
            releaseDate: releaseDate,
            releaseYear: releaseYear,
            trackURI: `musicbrainz:album:${rg.id}`,
            primaryType: primaryType,
            secondaryTypes: secondaryTypes,
            typeCategory: typeCategory,
            type: 'album',
            explicit: false,
          };

          allReleases.push(releaseObj);

          // Strict Studio Albums: Primary type Album, no compilations, no live recordings, no remixes
          if (primaryType.toLowerCase() === 'album' && !isCompilation && !isLive && !isRemix) {
            studioAlbums.push(releaseObj);
          }
        }
      }

      // Sort studio albums strictly in REVERSE CHRONOLOGICAL ORDER (newest first)
      studioAlbums.sort((a, b) => {
        const ya = a.releaseYear || 0;
        const yb = b.releaseYear || 0;
        if (ya !== yb) return yb - ya;
        return (b.releaseDate || '').localeCompare(a.releaseDate || '');
      });

      // Sort all releases strictly in REVERSE CHRONOLOGICAL ORDER
      allReleases.sort((a, b) => {
        const ya = a.releaseYear || 0;
        const yb = b.releaseYear || 0;
        if (ya !== yb) return yb - ya;
        return (b.releaseDate || '').localeCompare(a.releaseDate || '');
      });

      const formatted = {
        id: artistData.id,
        name: artistData.name,
        title: artistData.name,
        country: artistData.country || 'Global',
        type: artistData.type || 'Artist',
        genres: categorizedTags.genres.length > 0 ? categorizedTags.genres.map((g) => g.name) : sanitizeGenreTags(tags).slice(0, 6),
        primaryGenre: primaryGenre,
        categorizedTags: categorizedTags,
        tags: tags,
        allTags: allTags,
        description: description,
        rating: rating,
        externalLinks: externalLinks,
        followers: { total: 450000 },
        popularity: 88,
        images: [{ url: coverUrl, width: 600, height: 600 }],
        coverArt: coverUrl,
        url: coverUrl,
        external_urls: {
          spotify: `https://open.spotify.com/search/${encodeURIComponent(queryForLinks + ' artist')}`,
          musicbrainz: `https://musicbrainz.org/artist/${artistData.id}`,
        },
        uri: `musicbrainz:artist:${artistData.id}`,
        trackURI: `musicbrainz:artist:${artistData.id}`,
        topTracks: topTracks || [],
        albums: studioAlbums,
        studioAlbums: studioAlbums,
        allReleases: allReleases,
        discography: allReleases,
      };

      return formatted;
    } catch (error) {
      console.error(`Failed to fetch MusicBrainz artist for ID "${id}":`, error.message);
    }
  });
}

/**
 * Clusters raw MusicBrainz releases into curated, distinct editions.
 * Combines identical regional pressings (e.g. US, UK, DE, JP pressings of the same master)
 * into a single cohesive edition card with aggregated country badges and labels.
 */
export function clusterEditions(releases = [], albumTitle = 'Album', firstReleaseDate = '', canonicalOriginalId = null) {
  if (!releases || releases.length === 0) return [];

  // Sort raw releases: Official first, earliest date first
  const sorted = [...releases].sort((a, b) => {
    if (a.status === 'Official' && b.status !== 'Official') return -1;
    if (b.status === 'Official' && a.status !== 'Official') return 1;
    if (firstReleaseDate) {
      if (a.date === firstReleaseDate && b.date !== firstReleaseDate) return -1;
      if (b.date === firstReleaseDate && a.date !== firstReleaseDate) return 1;
    }
    return (a.date || '9999').localeCompare(b.date || '9999');
  });

  const resolvedCanonicalId = canonicalOriginalId || sorted[0]?.id;
  const canonicalRelease = sorted.find((r) => r.id === resolvedCanonicalId) || sorted[0];
  const canonicalTrackCount = (canonicalRelease?.media || []).reduce((acc, m) => acc + (m['track-count'] || 0), 0) || 10;
  const canonicalYear = canonicalRelease?.date ? parseInt(canonicalRelease.date.slice(0, 4), 10) : (firstReleaseDate ? parseInt(firstReleaseDate.slice(0, 4), 10) : null);

  const map = new Map();

  for (const r of sorted) {
    const date = r.date || '';
    const year = date ? parseInt(date.slice(0, 4), 10) : null;
    const media = r.media || [];
    const discCount = media.length || 1;
    const totalTracks = media.reduce((acc, m) => acc + (m['track-count'] || 0), 0) || canonicalTrackCount;
    const rawFormat = media.map((m) => m.format).filter(Boolean)[0] || 'CD';

    let formatFamily = 'CD';
    if (/vinyl|lp|12"/i.test(rawFormat)) formatFamily = 'Vinyl';
    else if (/sacd|hybrid/i.test(rawFormat)) formatFamily = 'SACD';
    else if (/cassette|tape/i.test(rawFormat)) formatFamily = 'Cassette';
    else if (/digital|file|stream/i.test(rawFormat)) formatFamily = 'Digital';

    const cleanTitle = (r.title || albumTitle).trim();
    const disambig = (r.disambiguation || '').trim();
    const combo = `${cleanTitle} ${disambig}`.toLowerCase();

    // Check if original
    const isOriginal = (r.id === resolvedCanonicalId) || (
      canonicalYear && year === canonicalYear && !disambig && (
        formatFamily === 'Vinyl' || formatFamily === 'Cassette' || formatFamily === (canonicalRelease?.media?.[0]?.format?.includes('Vinyl') ? 'Vinyl' : formatFamily)
      )
    );

    // Determine category
    let category = 'Standard';
    const annivMatch = combo.match(/(\d+)(?:th|st|nd|rd)?\s+anniversary/i);
    if (isOriginal) {
      category = 'Original';
    } else if (annivMatch) {
      category = 'Anniversary';
    } else if (combo.includes('immersion') || combo.includes('box set') || combo.includes('deluxe') || combo.includes('experience') || totalTracks > canonicalTrackCount + 3) {
      category = 'Deluxe';
    } else if (combo.includes('remaster') || combo.includes('mobile fidelity') || combo.includes('mfsl') || combo.includes('ultradisc')) {
      category = 'Remaster';
    } else if (combo.includes('quad') || combo.includes('surround') || combo.includes('5.1')) {
      category = 'Surround';
    } else if (combo.includes('live')) {
      category = 'Live';
    }

    // Determine clean human-readable name
    let editionName = '';
    if (category === 'Original') {
      editionName = `Original ${year || ''} Pressing (${formatFamily})`.trim();
    } else if (annivMatch) {
      editionName = `${annivMatch[1]}th Anniversary Edition${totalTracks > canonicalTrackCount ? ' (Expanded)' : ''}`;
    } else if (combo.includes('immersion')) {
      editionName = 'Immersion Box Set (Multi-Disc Edition)';
    } else if (combo.includes('experience')) {
      editionName = `${year ? `${year} ` : ''}Experience Edition (Live & Expanded)`;
    } else if (combo.includes('deluxe') || category === 'Deluxe') {
      editionName = `${year ? `${year} ` : ''}Deluxe Edition (${totalTracks} Tracks)`;
    } else if (combo.includes('mobile fidelity') || combo.includes('mfsl')) {
      editionName = 'Mobile Fidelity Sound Lab Original Master';
    } else if (category === 'Surround') {
      editionName = `Quadraphonic Surround Mix (${formatFamily})`;
    } else if (category === 'Remaster') {
      editionName = `${year ? `${year} ` : ''}Digital Remaster (${formatFamily})`;
    } else if (disambig && disambig.length < 35) {
      editionName = `${year ? `${year} ` : ''}${disambig} (${formatFamily})`;
    } else {
      editionName = `${year ? `${year} ` : ''}${formatFamily} Pressing`;
    }

    // Clustering key: Combine identical regional pressings into one edition
    let clusterKey = '';
    if (category === 'Original') {
      clusterKey = `ORIGINAL_${formatFamily}`;
    } else if (annivMatch) {
      clusterKey = `ANNIV_${annivMatch[1]}_${totalTracks > canonicalTrackCount ? 'EXP' : 'STD'}_${formatFamily}`;
    } else if (combo.includes('immersion')) {
      clusterKey = 'IMMERSION_BOX_SET';
    } else if (combo.includes('experience')) {
      clusterKey = `EXP_EDITION_${totalTracks}`;
    } else if (combo.includes('mobile fidelity') || combo.includes('mfsl')) {
      clusterKey = `MFSL_${formatFamily}`;
    } else if (category === 'Surround') {
      clusterKey = `SURROUND_${formatFamily}`;
    } else if (category === 'Remaster') {
      const era = year ? Math.floor(year / 5) * 5 : 'REM';
      clusterKey = `REMASTER_${era}_${formatFamily}_${totalTracks}`;
    } else {
      const decade = year ? Math.floor(year / 10) * 10 : 'UNK';
      const titleVariant = cleanTitle.toLowerCase() !== albumTitle.toLowerCase() ? cleanTitle.slice(0, 10) : '';
      clusterKey = `REISSUE_${decade}s_${formatFamily}_${totalTracks}_${titleVariant}`;
    }

    if (!map.has(clusterKey)) {
      map.set(clusterKey, {
        id: r.id,
        title: cleanTitle,
        editionName: editionName,
        category: category,
        isOriginal: category === 'Original',
        year: year,
        date: date,
        format: rawFormat,
        formatFamily: formatFamily,
        discCount: discCount,
        totalTracks: totalTracks,
        bonusTracks: totalTracks > canonicalTrackCount ? totalTracks - canonicalTrackCount : 0,
        disambiguation: disambig,
        countries: [],
        labels: [],
        coverArt: `https://coverartarchive.org/release/${r.id}/front-500`,
        status: r.status || 'Official',
        pressingsCount: 0,
        hasOfficial: r.status === 'Official',
      });
    }

    const ed = map.get(clusterKey);
    ed.pressingsCount++;
    if (r.country && !ed.countries.includes(r.country)) {
      ed.countries.push(r.country);
    }
    const labelNames = (r['label-info'] || []).map((l) => l.label?.name).filter(Boolean);
    labelNames.forEach((l) => {
      if (!ed.labels.includes(l)) ed.labels.push(l);
    });

    // Prefer the release that has Official status
    if (r.status === 'Official' && !ed.hasOfficial) {
      ed.id = r.id;
      ed.hasOfficial = true;
      ed.coverArt = `https://coverartarchive.org/release/${r.id}/front-500`;
    }
    // Track earliest year
    if (year && (!ed.year || year < ed.year)) {
      ed.year = year;
    }
  }

  const editions = Array.from(map.values());
  // Sort editions: Original first, then Anniversary, Deluxe, Remasters, Surround, Live, Standard
  editions.sort((a, b) => {
    if (a.isOriginal && !b.isOriginal) return -1;
    if (b.isOriginal && !a.isOriginal) return 1;
    const catPriority = { 'Original': 1, 'Anniversary': 2, 'Deluxe': 3, 'Remaster': 4, 'Surround': 5, 'Live': 6, 'Standard': 7 };
    const pA = catPriority[a.category] || 9;
    const pB = catPriority[b.category] || 9;
    if (pA !== pB) return pA - pB;
    return (b.year || 0) - (a.year || 0); // Recent first within same category
  });

  return editions;
}

/**
 * Fetches album (release-group or release) details and tracklist by MBID with real album artwork
 */
export async function fetchMusicBrainzAlbumServer(id, targetReleaseId = null) {
  if (!id) return { album: null, tracks: [] };
  const cacheKey = targetReleaseId ? `album_detail_${id}_${targetReleaseId}` : `album_detail_${id}`;

  return getCachedOrInFlight(cacheKey, async () => {
    try {
      let rgData = null;
      let releases = [];
      let resolvedRgId = id;

      // 1. Try lookup as a release-group, and fetch up to 100 releases in parallel
      try {
        const [rgRes, relListRes] = await Promise.all([
          rateLimitedGet(`${MUSICBRAINZ_BASE}/release-group/${id}`, {
            inc: 'artists+tags+genres+ratings+url-rels+annotation',
          }).catch(() => null),
          rateLimitedGet(`${MUSICBRAINZ_BASE}/release`, {
            'release-group': id,
            limit: 100,
            inc: 'media+labels',
          }).catch(() => null),
        ]);

        if (rgRes?.data) {
          rgData = rgRes.data;
          releases = relListRes?.data?.releases || rgData.releases || [];
        }
      } catch (_) {}

      // 2. If not a release-group, it might be a direct release ID
      if (!rgData) {
        try {
          const directRel = await rateLimitedGet(`${MUSICBRAINZ_BASE}/release/${id}`, {
            inc: 'artists+tags+genres+ratings+url-rels+annotation+media+labels',
          });
          if (directRel?.data) {
            const directData = directRel.data;
            resolvedRgId = directData['release-group']?.id;
            if (resolvedRgId) {
              const [parentRg, siblingRels] = await Promise.all([
                rateLimitedGet(`${MUSICBRAINZ_BASE}/release-group/${resolvedRgId}`, {
                  inc: 'artists+tags+genres+ratings+url-rels+annotation',
                }).catch(() => null),
                rateLimitedGet(`${MUSICBRAINZ_BASE}/release`, {
                  'release-group': resolvedRgId,
                  limit: 100,
                  inc: 'media+labels',
                }).catch(() => null),
              ]);
              rgData = parentRg?.data || null;
              releases = siblingRels?.data?.releases || [directData];
            } else {
              releases = [directData];
            }
          }
        } catch (_) {}
      }

      let albumTitle = rgData?.title;
      let artistCredit = rgData?.['artist-credit']?.map((a) => a.name).join('') || 'Various Artists';
      let artistsList = rgData?.['artist-credit']?.map((a) => ({
        name: a.name,
        id: a.artist?.id || '',
      })) || [{ name: artistCredit, id: '' }];

      // Determine canonical original release
      const firstReleaseDate = rgData?.['first-release-date'] || '';
      const canonicalSorted = [...releases].sort((a, b) => {
        if (a.status === 'Official' && b.status !== 'Official') return -1;
        if (b.status === 'Official' && a.status !== 'Official') return 1;
        if (firstReleaseDate) {
          if (a.date === firstReleaseDate && b.date !== firstReleaseDate) return -1;
          if (b.date === firstReleaseDate && a.date !== firstReleaseDate) return 1;
        }
        return (a.date || '9999').localeCompare(b.date || '9999');
      });

      const canonicalOriginal = canonicalSorted[0];
      const canonicalOriginalId = canonicalOriginal?.id;
      const canonicalOriginalDate = canonicalOriginal?.date || firstReleaseDate || null;
      const canonicalOriginalYear = canonicalOriginalDate ? new Date(canonicalOriginalDate).getFullYear() : null;

      // Build clustered, deduplicated editions
      const editions = clusterEditions(releases, albumTitle, firstReleaseDate, canonicalOriginalId);

      // Backwards-compatible variations list
      const variations = editions.map((e) => ({
        id: e.id,
        title: e.title,
        date: e.date || 'Unknown',
        year: e.year,
        country: e.countries?.[0] || 'Global',
        status: e.status || 'Official',
        isOriginal: e.isOriginal,
        label: e.editionName,
      }));

      // Determine release candidates: targetReleaseId takes precedence, followed by canonical releases
      let releaseCandidates = [];
      if (targetReleaseId) {
        releaseCandidates = [targetReleaseId, ...canonicalSorted.filter((r) => r.id !== targetReleaseId).map((r) => r.id)];
      } else {
        releaseCandidates = canonicalSorted.map((r) => r.id);
        if (!rgData && !releaseCandidates.includes(id)) {
          releaseCandidates.unshift(id);
        }
      }

      // Fetch the tracks of the release (try candidate releases)
      let tracks = [];
      let relData = null;
      let successfulReleaseId = null;

      for (const candId of releaseCandidates.slice(0, 3)) {
        try {
          const relRes = await rateLimitedGet(`${MUSICBRAINZ_BASE}/release/${candId}`, {
            inc: 'recordings+artist-credits+tags+genres+ratings+url-rels+annotation+media',
          });
          const currentRel = relRes.data;
          if (!relData) relData = currentRel;
          if (!albumTitle) albumTitle = currentRel.title;
          if (!artistCredit || artistCredit === 'Various Artists') {
            artistCredit = currentRel['artist-credit']?.map((a) => a.name).join('') || 'Various Artists';
            artistsList = currentRel['artist-credit']?.map((a) => ({
              name: a.name,
              id: a.artist?.id || '',
            })) || [{ name: artistCredit, id: '' }];
          }

          const candidateTracks = [];
          const media = currentRel.media || [];
          for (const m of media) {
            for (const t of m.tracks || []) {
              const recId = t.recording?.id || t.id;
              const trackTitle = t.title || t.recording?.title || 'Track';
              const trackArtists = (t['artist-credit'] && t['artist-credit'].length > 0)
                ? t['artist-credit'].map((a) => ({ name: a.name, id: a.artist?.id || '' }))
                : artistsList;

              let side = null;
              let sideNumber = null;
              const rawNum = String(t.number || '').trim();
              const sideAlphaNumMatch = rawNum.match(/^([A-Za-z])(\d+)$/);
              const sideAlphaMatch = rawNum.match(/^([A-Za-z])$/);
              if (sideAlphaNumMatch) {
                side = sideAlphaNumMatch[1].toUpperCase();
                sideNumber = parseInt(sideAlphaNumMatch[2], 10);
              } else if (sideAlphaMatch) {
                side = sideAlphaMatch[1].toUpperCase();
                sideNumber = t.position || 1;
              }

              candidateTracks.push({
                id: recId,
                trackID: recId,
                trackId: recId,
                title: trackTitle,
                name: trackTitle,
                pos: t.position || candidateTracks.length + 1,
                trackNumber: t.number || String(t.position || candidateTracks.length + 1),
                side: side,
                sideNumber: sideNumber,
                sideLabel: side ? `Side ${side}` : null,
                disc: m.position || 1,
                discTitle: m.title || '',
                discFormat: m.format || 'Disc',
                duration: t.length || t.recording?.length || 0,
                duration_ms: t.length || t.recording?.length || 0,
                artist: trackArtists,
                artists: trackArtists,
                trackURI: `musicbrainz:track:${recId}`,
                spoURL: `https://open.spotify.com/search/${encodeURIComponent(trackTitle + ' ' + artistCredit)}`,
                YTURL: `https://www.youtube.com/results?search_query=${encodeURIComponent(trackTitle + ' ' + artistCredit)}`,
              });
            }
          }

          if (candidateTracks.length > 0) {
            tracks = candidateTracks;
            relData = currentRel;
            successfulReleaseId = candId;
            break;
          }
        } catch (relErr) {
          console.warn(`Could not load release tracks for ${candId}:`, relErr.message);
        }
      }

      // Extra fallback: query recordings by release-group or album name if tracks still empty
      if (tracks.length === 0 && (albumTitle || rgData?.id)) {
        try {
          const queryTerm = rgData?.id ? `rgid:${rgData.id}` : `release:"${albumTitle}" AND artist:"${artistCredit}"`;
          const recSearch = await rateLimitedGet(`${MUSICBRAINZ_BASE}/recording`, {
            query: queryTerm,
            limit: 30,
          });
          const foundRecordings = recSearch.data?.recordings || [];
          tracks = foundRecordings.map((rec, idx) => ({
            id: rec.id,
            trackID: rec.id,
            trackId: rec.id,
            title: rec.title,
            name: rec.title,
            pos: idx + 1,
            duration: rec.length || 0,
            duration_ms: rec.length || 0,
            artist: artistsList,
            artists: artistsList,
            trackURI: `musicbrainz:track:${rec.id}`,
            spoURL: `https://open.spotify.com/search/${encodeURIComponent(rec.title + ' ' + artistCredit)}`,
            YTURL: `https://www.youtube.com/results?search_query=${encodeURIComponent(rec.title + ' ' + artistCredit)}`,
          }));
        } catch (_) {}
      }

      // Resolve real album artwork: Main canonical release-group cover takes precedence when page is opened
      const targetCoverRgId = rgData?.id || relData?.['release-group']?.id || relData?.id || resolvedRgId || id;
      const mainCoverUrl = await resolveOpenAlbumCover(albumTitle, artistCredit, targetCoverRgId, null);

      // Only resolve edition-specific cover if the user explicitly requested a specific target release
      let coverUrl = mainCoverUrl;
      let editionCoverUrl = null;
      if (targetReleaseId) {
        editionCoverUrl = await resolveOpenAlbumCover(albumTitle, artistCredit, targetCoverRgId, targetReleaseId);
        coverUrl = editionCoverUrl || mainCoverUrl;
      }

      // Active release date & year based on the selected release
      const activeReleaseDate = relData?.date || canonicalOriginalDate || firstReleaseDate || null;
      let activeReleaseYear = null;
      if (activeReleaseDate) {
        const parsed = new Date(activeReleaseDate).getFullYear();
        if (!isNaN(parsed)) activeReleaseYear = parsed;
      }

      // Combine relations, tags & official curated genres
      const allRelations = [...(rgData?.relations || []), ...(relData?.relations || [])];
      const allTagsList = [...(rgData?.tags || []), ...(relData?.tags || [])];
      const allGenresList = [...(rgData?.genres || []), ...(relData?.genres || [])];

      const categorizedTags = categorizeTags(allTagsList, allGenresList);
      const primaryGenre = categorizedTags.genres[0]?.name || categorizedTags.styles[0]?.name || sanitizeGenreTags(allTagsList)[0] || null;
      const albumGenres = categorizedTags.genres.length > 0
        ? categorizedTags.genres.map((g) => g.name)
        : sanitizeGenreTags(allTagsList).slice(0, 6);

      const tagMap = new Map();
      for (const t of allTagsList) {
        const name = typeof t === 'string' ? t : t.name;
        if (!name) continue;
        const count = (typeof t === 'object' && t.count) || 1;
        tagMap.set(name, (tagMap.get(name) || 0) + count);
      }
      const allTags = categorizedTags.allWithCounts || Array.from(tagMap.entries()).map(([name, count]) => ({ name, count }));
      const tags = categorizedTags.allFlatNames || Array.from(tagMap.keys());

      // Calculate total duration in milliseconds
      const totalDurationMs = tracks.reduce((acc, t) => acc + (t.duration_ms || t.duration || 0), 0);

      // Extract Wikidata ID prioritizing canonical release-group relation
      const wikidataRel = (rgData?.relations || allRelations).find((r) => r.type === 'wikidata' || r.url?.resource?.includes('wikidata.org'));
      const wikidataId = wikidataRel?.url?.resource?.split('/')?.filter(Boolean)?.pop() || null;

      // Resolve rich description / review background (music-aware with fast timeout)
      const description = await resolveDescription(albumTitle, albumTitle, artistCredit, wikidataId, rgData?.annotation || relData?.annotation, tags);

      // Parse external links
      const externalLinks = parseExternalLinks(allRelations, {
        title: albumTitle,
        artist: artistCredit,
        type: rgData ? 'release-group' : 'release',
        mbid: id,
      });

      // Rating / Reviews info
      const rawRating = rgData?.rating || relData?.rating;
      const rating = rawRating
        ? {
            value: rawRating.value !== undefined ? rawRating.value : null,
            votesCount: rawRating['votes-count'] || 0,
          }
        : null;

      const activeEditionObj = editions.find((e) => e.id === successfulReleaseId) ||
        editions.find((e) => e.id === targetReleaseId) ||
        editions[0] || null;

      const album = {
        id: id,
        name: albumTitle || 'Album',
        title: albumTitle || 'Album',
        artists: artistsList,
        artist: artistsList,
        images: [
          { url: coverUrl, width: 600, height: 600 },
          ...(mainCoverUrl && mainCoverUrl !== coverUrl ? [{ url: mainCoverUrl, width: 600, height: 600 }] : [])
        ],
        coverArt: coverUrl,
        mainCoverArt: mainCoverUrl,
        editionCoverArt: editionCoverUrl,
        url: coverUrl,
        release_date: activeReleaseDate || 'Unknown',
        releaseDate: activeReleaseDate || null,
        releaseYear: activeReleaseYear,
        originalReleaseDate: canonicalOriginalDate || firstReleaseDate || null,
        originalReleaseYear: canonicalOriginalYear,
        total_tracks: tracks.length,
        totalDurationMs: totalDurationMs,
        primaryGenre: primaryGenre,
        genres: albumGenres,
        categorizedTags: categorizedTags,
        tags: tags,
        allTags: allTags,
        description: description,
        rating: rating,
        externalLinks: externalLinks,
        external_urls: {
          spotify: `https://open.spotify.com/search/${encodeURIComponent((albumTitle || '') + ' ' + artistCredit + ' album')}`,
          musicbrainz: `https://musicbrainz.org/${rgData ? 'release-group' : 'release'}/${id}`,
        },
        uri: `musicbrainz:album:${id}`,
        selectedReleaseId: targetReleaseId || null,
        activeEdition: activeEditionObj,
        editions: editions,
        variations: variations,
      };

      return { album, tracks };
    } catch (error) {
      console.error(`Failed to fetch MusicBrainz album for ID "${id}":`, error.message);
      return { album: null, tracks: [] };
    }
  });
}

/**
 * Recommendations generator using MusicBrainz genre/tag queries with real artwork
 */
export async function getMusicBrainzRecommendations(genre = 'pop', limit = 12) {
  const cleanGenre = (genre || 'pop').replace(/_music$/i, '').replace(/_/g, ' ');
  const cacheKey = `rec_genre_${cleanGenre}_${limit}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const response = await rateLimitedGet(`${MUSICBRAINZ_BASE}/recording/`, {
      query: `tag:"${cleanGenre}"`,
      limit: limit,
    });

    const recordings = response.data?.recordings || [];
    if (!recordings.length) {
      // Fallback search without tag prefix
      return searchMusicBrainzTracksServer(cleanGenre, limit);
    }

    const results = await Promise.all(
      recordings.map(async (rec) => {
        const artistCredit = rec['artist-credit']?.map((a) => a.name).join('') || 'Unknown Artist';
        const artistsList = rec['artist-credit']?.map((a) => ({
          name: a.name,
          id: a.artist?.id || a.id || '',
        })) || [{ name: artistCredit, id: '' }];

        const primaryRelease = rec.releases?.[0];
        const rgId = primaryRelease?.['release-group']?.id;
        const relId = primaryRelease?.id;
        const coverUrl = await resolveOpenTrackCover(rec.title, artistCredit, rgId, relId);

        let releaseDate = primaryRelease?.date || rec['first-release-date'] || null;
        let releaseYear = null;
        if (releaseDate) {
          const parsed = new Date(releaseDate).getFullYear();
          if (!isNaN(parsed)) releaseYear = parsed;
        }

        const queryForLinks = `${rec.title} ${artistCredit}`;

        return {
          id: rec.id,
          trackId: rec.id,
          title: rec.title,
          name: rec.title,
          artist: artistsList,
          artists: artistsList,
          album: primaryRelease?.title || rec.title,
          albumID: rgId || relId || rec.id,
          coverArt: coverUrl,
          url: coverUrl,
          releaseDate: releaseDate,
          releaseYear: releaseYear,
          durationMs: rec.length || 0,
          popularity: rec.score ? Math.min(100, Math.max(60, rec.score)) : 80,
          explicit: false,
          spoURL: `https://open.spotify.com/search/${encodeURIComponent(queryForLinks)}`,
          YTURL: `https://www.youtube.com/results?search_query=${encodeURIComponent(queryForLinks)}`,
          trackURI: `musicbrainz:track:${rec.id}`,
          type: 'track',
        };
      })
    );

    setCached(cacheKey, results);
    return results;
  } catch (error) {
    console.error(`Failed to fetch MusicBrainz recommendations for genre "${genre}":`, error.message);
    return [];
  }
}

// Backward-compatible Spotify aliases (pulled plug, machinery intact)
export async function getSpotifyToken() {
  return 'musicbrainz-public-session';
}

export async function fetchSpotifyDataServer(type, id) {
  if (type === 'track') {
    return await fetchMusicBrainzTrackServer(id);
  }
  if (type === 'artist') {
    return await fetchMusicBrainzArtistServer(id);
  }
  if (type === 'album') {
    const { album } = await fetchMusicBrainzAlbumServer(id);
    return album;
  }
  if (type === 'playlist') {
    return null;
  }
  return null;
}

export async function searchSpotifyTrackServer(query) {
  return await searchMusicBrainzTrackServer(query);
}

export async function searchSpotifyTracksServer(query, limit = 6) {
  return await searchMusicBrainzTracksServer(query, limit);
}
