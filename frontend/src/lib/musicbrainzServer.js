// src/lib/musicbrainzServer.js
import axios from 'axios';

const USER_AGENT = 'GrooveEstrella/2.0 ( https://github.com/farhanalireza/grooveestrella )';
const MUSICBRAINZ_BASE = 'https://musicbrainz.org/ws/2';
const CACHE_TTL_MS = 1000 * 60 * 60 * 4; // 4 hours in-memory cache

// In-memory cache
const memoryCache = new Map();

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

// Chained sequential queue for MusicBrainz to strictly adhere to 1 request per second
let requestQueue = Promise.resolve();
let lastRequestTime = 0;
const MIN_INTERVAL_MS = 1050;

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
        timeout: 12000,
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
 * Queries iTunes API (600x600 Apple CDN) -> Deezer API -> Cover Art Archive -> Fallback SVG
 */
export async function resolveOpenTrackCover(title, artist = '', rgId = null, relId = null) {
  const cleanTitle = (title || '').trim();
  const cleanArtist = (artist || '').trim();
  const query = `${cleanTitle} ${cleanArtist}`.trim();
  const cacheKey = `img_track_${query.toLowerCase()}_${rgId || relId || ''}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  // 1. Try iTunes Store API (Ultra-fast Apple CDN, no key needed, 600x600 artwork)
  try {
    const itunesRes = await axios.get('https://itunes.apple.com/search', {
      params: {
        term: query || cleanTitle,
        entity: 'song',
        limit: 1,
      },
      timeout: 3000,
    });
    const item = itunesRes.data?.results?.[0];
    if (item?.artworkUrl100) {
      const highRes = item.artworkUrl100.replace('100x100bb.jpg', '600x600bb.jpg');
      setCached(cacheKey, highRes);
      return highRes;
    }
  } catch (_) {
    // continue
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

  // 3. Cover Art Archive
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

  // 4. Fallback SVG
  const fallback = getPlaceholderCover(cleanTitle, cleanArtist);
  setCached(cacheKey, fallback);
  return fallback;
}

/**
 * Open Artwork Resolver for Artists:
 * Queries Deezer artist photography -> iTunes song artwork -> Fallback SVG
 */
export async function resolveOpenArtistPhoto(artistName, mbid = null) {
  const name = (artistName || '').trim();
  if (!name) return getPlaceholderCover('Artist', 'GrooveEstrella');
  const cacheKey = `img_artist_${name.toLowerCase()}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  // 1. Try Deezer artist search (returns authentic artist photography)
  try {
    const deezerRes = await axios.get('https://api.deezer.com/search/artist', {
      params: { q: name, limit: 1 },
      timeout: 3000,
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

  // 2. Try iTunes artist search (find top song artwork as artist visual)
  try {
    const itunesRes = await axios.get('https://itunes.apple.com/search', {
      params: { term: name, entity: 'song', limit: 1 },
      timeout: 3000,
    });
    const song = itunesRes.data?.results?.[0];
    if (song?.artworkUrl100) {
      const highRes = song.artworkUrl100.replace('100x100bb.jpg', '600x600bb.jpg');
      setCached(cacheKey, highRes);
      return highRes;
    }
  } catch (_) {
    // continue
  }

  // 3. Fallback SVG
  const fallback = getPlaceholderCover(name, 'Artist');
  setCached(cacheKey, fallback);
  return fallback;
}

/**
 * Open Artwork Resolver for Albums:
 * Queries iTunes album search -> Deezer album search -> Cover Art Archive -> Fallback SVG
 */
export async function resolveOpenAlbumCover(albumTitle, artistName = '', rgId = null) {
  const query = `${albumTitle} ${artistName}`.trim();
  const cacheKey = `img_album_${query.toLowerCase()}_${rgId || ''}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  // 1. Try iTunes album search
  try {
    const itunesRes = await axios.get('https://itunes.apple.com/search', {
      params: {
        term: query || albumTitle,
        entity: 'album',
        limit: 1,
      },
      timeout: 3000,
    });
    const item = itunesRes.data?.results?.[0];
    if (item?.artworkUrl100) {
      const highRes = item.artworkUrl100.replace('100x100bb.jpg', '600x600bb.jpg');
      setCached(cacheKey, highRes);
      return highRes;
    }
  } catch (_) {
    // continue
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

  // 3. Cover Art Archive
  if (rgId) {
    const caa = `https://coverartarchive.org/release-group/${rgId}/front-500`;
    setCached(cacheKey, caa);
    return caa;
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
  // 1. Resolve via Wikidata -> Wikipedia
  if (wikidataId) {
    try {
      const wdRes = await axios.get(`https://www.wikidata.org/wiki/Special:EntityData/${wikidataId}.json`, {
        headers: { 'User-Agent': USER_AGENT },
        timeout: 3500,
      });
      const entity = wdRes.data?.entities?.[wikidataId];
      const wikiTitle = entity?.sitelinks?.enwiki?.title;
      if (wikiTitle) {
        const sumRes = await axios.get(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wikiTitle)}`, {
          headers: { 'User-Agent': USER_AGENT },
          timeout: 3500,
        });
        if (sumRes.data?.extract) {
          return sumRes.data.extract;
        }
      }
    } catch (_) {}
  }

  // 2. Direct Wikipedia search by title / artist
  const searchTarget = name || title;
  if (searchTarget) {
    try {
      const sumRes = await axios.get(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(searchTarget)}`, {
        headers: { 'User-Agent': USER_AGENT },
        timeout: 3000,
      });
      if (sumRes.data?.extract && sumRes.data?.type !== 'disambiguation') {
        return sumRes.data.extract;
      }
    } catch (_) {}
  }

  // 3. Annotation
  if (annotation && typeof annotation === 'string' && annotation.trim().length > 10) {
    return annotation.trim();
  }

  // 4. Synthesized descriptive summary
  if (tags && tags.length > 0) {
    const topTags = tags.slice(0, 4).join(', ');
    return `An acclaimed release by ${artist || name || 'the artist'}, featuring recognized styles in ${topTags}.`;
  }

  const primaryName = title || name || 'This release';
  const primaryArtist = artist ? ` by ${artist}` : '';
  return `${primaryName} is a celebrated musical work${primaryArtist}. Explore its full catalog, tracklist, community ratings, and universal streaming links on GrooveEstrella.`;
}

/**
 * Fetches recording (track) details by MBID with complete metadata and real artwork
 */
export async function fetchMusicBrainzTrackServer(id) {
  if (!id) return null;
  const cacheKey = `track_detail_${id}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const response = await rateLimitedGet(`${MUSICBRAINZ_BASE}/recording/${id}`, {
      inc: 'artists+releases+release-groups+ratings+tags+url-rels+annotation',
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
      genres: tags.slice(0, 5),
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

    setCached(cacheKey, trackData);
    return trackData;
  } catch (error) {
    console.error(`Failed to fetch MusicBrainz track for ID "${id}":`, error.message);
    return null;
  }
}

/**
 * Fetches artist details, top recordings, and discography by MBID with real artist photography
 */
export async function fetchMusicBrainzArtistServer(id) {
  if (!id) return null;
  const cacheKey = `artist_detail_${id}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    // Sequentially queue to strictly respect rate limit
    const artistRes = await rateLimitedGet(`${MUSICBRAINZ_BASE}/artist/${id}`, { inc: 'tags+ratings+url-rels+annotation' });
    const releaseGroupsRes = await rateLimitedGet(`${MUSICBRAINZ_BASE}/release-group`, {
      artist: id,
      type: 'album|single',
      limit: 12,
    });
    const recordingsRes = await rateLimitedGet(`${MUSICBRAINZ_BASE}/recording`, {
      artist: id,
      limit: 10,
    });

    const artistData = artistRes.data;
    if (!artistData || !artistData.name) return null;

    const tags = artistData.tags?.map((t) => t.name) || [];
    const allTags = artistData.tags?.map((t) => ({ name: t.name, count: t.count || 0 })) || [];
    const queryForLinks = artistData.name;

    // Resolve real artist photography
    const coverUrl = await resolveOpenArtistPhoto(artistData.name, artistData.id);

    // Extract Wikidata ID if available
    const wikidataRel = artistData.relations?.find((r) => r.type === 'wikidata' || r.url?.resource?.includes('wikidata.org'));
    const wikidataId = wikidataRel?.url?.resource?.split('/')?.filter(Boolean)?.pop() || null;

    // Resolve rich description / bio
    const description = await resolveDescription(artistData.name, artistData.name, artistData.name, wikidataId, artistData.annotation, tags);

    // Parse external links
    const externalLinks = parseExternalLinks(artistData.relations, {
      title: artistData.name,
      artist: artistData.name,
      type: 'artist',
      mbid: artistData.id,
    });

    // Rating / Reviews info
    const rating = artistData.rating
      ? {
          value: artistData.rating.value !== undefined ? artistData.rating.value : null,
          votesCount: artistData.rating['votes-count'] || 0,
        }
      : null;

    // Format top albums with real album covers
    const rawRgs = releaseGroupsRes.data?.['release-groups'] || [];
    const seenNames = new Set();
    const albums = [];
    for (const rg of rawRgs) {
      if (!seenNames.has(rg.title)) {
        seenNames.add(rg.title);
        const albumCover = await resolveOpenAlbumCover(rg.title, artistData.name, rg.id);
        let releaseDate = rg['first-release-date'] || null;
        let releaseYear = null;
        if (releaseDate) {
          const parsed = new Date(releaseDate).getFullYear();
          if (!isNaN(parsed)) releaseYear = parsed;
        }

        albums.push({
          id: rg.id,
          title: rg.title,
          name: rg.title,
          url: albumCover,
          image: albumCover,
          coverArt: albumCover,
          artist: [{ name: artistData.name, id: artistData.id }],
          artists: [{ name: artistData.name, id: artistData.id }],
          releaseDate: releaseDate,
          releaseYear: releaseYear,
          trackURI: `musicbrainz:album:${rg.id}`,
          type: 'album',
        });
      }
    }

    // Format top recordings with real track artwork
    const rawRecs = recordingsRes.data?.recordings || [];
    const topTracks = await Promise.all(
      rawRecs.map(async (rec) => {
        const primaryRel = rec.releases?.[0];
        const trackCover = await resolveOpenTrackCover(rec.title, artistData.name, primaryRel?.['release-group']?.id, primaryRel?.id);
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
          popularity: 85,
          explicit: false,
          spoURL: `https://open.spotify.com/search/${encodeURIComponent(rec.title + ' ' + artistData.name)}`,
          YTURL: `https://www.youtube.com/results?search_query=${encodeURIComponent(rec.title + ' ' + artistData.name)}`,
          trackURI: `musicbrainz:track:${rec.id}`,
          type: 'track',
        };
      })
    );

    const formatted = {
      id: artistData.id,
      name: artistData.name,
      title: artistData.name,
      country: artistData.country || 'Global',
      type: artistData.type || 'Artist',
      genres: tags.slice(0, 6),
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
      topTracks: topTracks,
      albums: albums,
    };

    setCached(cacheKey, formatted);
    return formatted;
  } catch (error) {
    console.error(`Failed to fetch MusicBrainz artist for ID "${id}":`, error.message);
    return null;
  }
}

/**
 * Fetches album (release-group or release) details and tracklist by MBID with real album artwork
 */
export async function fetchMusicBrainzAlbumServer(id, targetReleaseId = null) {
  if (!id) return { album: null, tracks: [] };
  const cacheKey = targetReleaseId ? `album_detail_${id}_${targetReleaseId}` : `album_detail_${id}`;
  const cached = getCached(cacheKey);
  if (cached && cached.tracks && cached.tracks.length > 0) return cached;

  try {
    // First try lookup as a release-group
    let rgData = null;
    let releases = [];
    try {
      const rgRes = await rateLimitedGet(`${MUSICBRAINZ_BASE}/release-group/${id}`, {
        inc: 'artists+releases+tags+ratings+url-rels+annotation',
      });
      rgData = rgRes.data;
      releases = rgData.releases || [];
    } catch (_) {
      // If not a release-group, might be a release ID directly
    }

    let albumTitle = rgData?.title;
    let artistCredit = rgData?.['artist-credit']?.map((a) => a.name).join('') || 'Various Artists';
    let artistsList = rgData?.['artist-credit']?.map((a) => ({
      name: a.name,
      id: a.artist?.id || '',
    })) || [{ name: artistCredit, id: '' }];

    // Prioritize the original standard release matching first-release-date
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

    // Format available variations/editions for this album with fixed isOriginal
    const variations = releases.map((r) => {
      const isOriginal = (firstReleaseDate && r.date === firstReleaseDate) || r.id === canonicalOriginalId;
      const year = r.date ? new Date(r.date).getFullYear() : null;
      return {
        id: r.id,
        title: r.title,
        date: r.date || 'Unknown',
        year: year,
        country: r.country || 'Global',
        status: r.status || 'Official',
        isOriginal: isOriginal,
        label: isOriginal ? `Original Release (${year || 'Classic'})` : `${year ? `${year} ` : ''}${r.country ? `[${r.country}] ` : ''}Edition`.trim(),
      };
    });

    // Determine release candidates: targetReleaseId takes precedence, followed by siblings of the same year
    let releaseCandidates = [];
    if (targetReleaseId) {
      const targetRelObj = releases.find((r) => r.id === targetReleaseId);
      const targetYear = targetRelObj?.date ? new Date(targetRelObj.date).getFullYear() : null;
      const sameYearSiblings = targetYear
        ? releases.filter((r) => r.id !== targetReleaseId && r.date && new Date(r.date).getFullYear() === targetYear).map((r) => r.id)
        : [];
      releaseCandidates = [
        targetReleaseId,
        ...sameYearSiblings,
        ...canonicalSorted.filter((r) => r.id !== targetReleaseId && !sameYearSiblings.includes(r.id)).map((r) => r.id),
      ];
    } else {
      releaseCandidates = canonicalSorted.map((r) => r.id);
      if (!rgData && !releaseCandidates.includes(id)) {
        releaseCandidates.unshift(id);
      }
    }

    // Fetch the tracks of the release (try up to 3 candidate releases)
    let tracks = [];
    let relData = null;
    let successfulReleaseId = null;

    for (const candId of releaseCandidates.slice(0, 3)) {
      try {
        const relRes = await rateLimitedGet(`${MUSICBRAINZ_BASE}/release/${candId}`, {
          inc: 'recordings+artist-credits+tags+ratings+url-rels+annotation',
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

            candidateTracks.push({
              id: recId,
              trackID: recId,
              trackId: recId,
              title: trackTitle,
              name: trackTitle,
              pos: t.position || candidateTracks.length + 1,
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

    // Resolve real album artwork
    const coverUrl = await resolveOpenAlbumCover(albumTitle, artistCredit, rgData?.id || primaryReleaseId);

    // Set active release date and year based on the selected release that was successfully fetched
    const activeReleaseDate = relData?.date || canonicalOriginalDate || firstReleaseDate || null;
    let activeReleaseYear = null;
    if (activeReleaseDate) {
      const parsed = new Date(activeReleaseDate).getFullYear();
      if (!isNaN(parsed)) activeReleaseYear = parsed;
    }

    // Combine relations & tags
    const allRelations = [...(rgData?.relations || []), ...(relData?.relations || [])];
    const allTagsList = [...(rgData?.tags || []), ...(relData?.tags || [])];
    const tagMap = new Map();
    for (const t of allTagsList) {
      const name = typeof t === 'string' ? t : t.name;
      if (!name) continue;
      const count = (typeof t === 'object' && t.count) || 1;
      tagMap.set(name, (tagMap.get(name) || 0) + count);
    }
    const allTags = Array.from(tagMap.entries()).map(([name, count]) => ({ name, count }));
    const tags = Array.from(tagMap.keys());

    // Calculate total duration in milliseconds
    const totalDurationMs = tracks.reduce((acc, t) => acc + (t.duration_ms || t.duration || 0), 0);

    // Extract Wikidata ID if available
    const wikidataRel = allRelations.find((r) => r.type === 'wikidata' || r.url?.resource?.includes('wikidata.org'));
    const wikidataId = wikidataRel?.url?.resource?.split('/')?.filter(Boolean)?.pop() || null;

    // Resolve rich description / review background
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

    const album = {
      id: id,
      name: albumTitle || 'Album',
      title: albumTitle || 'Album',
      artists: artistsList,
      artist: artistsList,
      images: [{ url: coverUrl, width: 600, height: 600 }],
      coverArt: coverUrl,
      url: coverUrl,
      release_date: activeReleaseDate || 'Unknown',
      releaseDate: activeReleaseDate || null,
      releaseYear: activeReleaseYear,
      originalReleaseDate: canonicalOriginalDate || firstReleaseDate || null,
      originalReleaseYear: canonicalOriginalYear,
      total_tracks: tracks.length,
      totalDurationMs: totalDurationMs,
      genres: tags.slice(0, 6),
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
      selectedReleaseId: successfulReleaseId || targetReleaseId || canonicalOriginalId,
      variations: variations,
    };

    const result = { album, tracks };
    if (tracks && tracks.length > 0) {
      setCached(cacheKey, result);
    }
    return result;
  } catch (error) {
    console.error(`Failed to fetch MusicBrainz album for ID "${id}":`, error.message);
    return { album: null, tracks: [] };
  }
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
