// src/lib/groovelinkResolver.js
import axios from 'axios';
import {
  searchMusicBrainzTracksServer,
  searchMusicBrainzAlbumsServer,
  searchMusicBrainzArtistsServer,
} from './musicbrainzServer.js';

// In-memory cache for resolved links and platform entities
const resolverCache = new Map();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

function getFromCache(key) {
  const item = resolverCache.get(key);
  if (item && Date.now() - item.timestamp < CACHE_TTL_MS) {
    return item.data;
  }
  return null;
}

function setToCache(key, data) {
  if (resolverCache.size > 2000) {
    const firstKey = resolverCache.keys().next().value;
    resolverCache.delete(firstKey);
  }
  resolverCache.set(key, { data, timestamp: Date.now() });
}

/**
 * Normalizes text and tokenizes into clean, lowercase words without punctuation or accents.
 * @param {string} text
 * @returns {string[]}
 */
export function tokenizeWords(text) {
  if (!text || typeof text !== 'string') return [];
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .replace(/[^\p{L}\p{N}\s]/gu, ' ') // strip punctuation to spaces
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 0);
}

/**
 * Calculates a word-by-word match score between target words and candidate words.
 * Returns a score between 0 and 1.
 */
export function calculateWordMatchScore(targetText, candidateText) {
  const targetWords = tokenizeWords(targetText);
  const candidateWords = tokenizeWords(candidateText);

  if (targetWords.length === 0 || candidateWords.length === 0) return 0;

  const candidateSet = new Set(candidateWords);
  let matchedCount = 0;

  for (const word of targetWords) {
    if (candidateSet.has(word)) {
      matchedCount += 1.0;
    } else {
      // Allow slight prefix match if both are >= 4 chars
      const hasPrefixMatch = candidateWords.some(
        (cw) => cw.length >= 4 && word.length >= 4 && (cw.startsWith(word) || word.startsWith(cw))
      );
      if (hasPrefixMatch) {
        matchedCount += 0.8;
      }
    }
  }

  const recall = matchedCount / targetWords.length;
  const precision = Math.min(1, targetWords.length / candidateWords.length);

  return recall * 0.75 + precision * 0.25;
}

/**
 * Scores a candidate against target title and artist one word by one word.
 */
export function scoreCandidate(target, candidate) {
  const titleScore = calculateWordMatchScore(target.title || '', candidate.title || '');
  const artistScore = calculateWordMatchScore(target.artist || '', candidate.artist || '');

  // If artist is specified in both but matches very poorly (< 0.25), reject to avoid wrong-artist matches
  if (target.artist && candidate.artist && artistScore < 0.25) {
    return 0;
  }

  if (!target.artist) {
    return titleScore;
  }

  // Weighted combo: 60% title, 40% artist
  return titleScore * 0.6 + artistScore * 0.4;
}

/**
 * Extracts a URL from a text string (useful when mobile apps share "Check this out https://...").
 */
export function extractUrlFromString(text) {
  if (!text || typeof text !== 'string') return null;
  const match = text.match(/https?:\/\/[^\s]+/i);
  return match ? match[0] : null;
}

/**
 * Parses any incoming music link into platform, type, and IDs.
 */
export function parseSharedMusicUrl(rawInput) {
  if (!rawInput) return null;
  const url = extractUrlFromString(rawInput) || rawInput.trim();

  // 1. Apple Music
  // Formats:
  // - https://music.apple.com/us/album/song-name/269572838?i=269573364
  // - https://music.apple.com/us/song/song-name/269573364
  // - https://music.apple.com/us/album/album-name/269572838
  // - https://music.apple.com/us/artist/artist-name/32940
  // - https://music.apple.com/us/playlist/playlist-name/pl.u-XYZ
  const amMatch = url.match(/https?:\/\/music\.apple\.com\/[a-z]{2}\/(album|artist|playlist|song)\/([^\/?#]+)(?:\/(\d+|pl\.[a-zA-Z0-9_-]+))?(?:\?i=(\d+))?/i);
  if (amMatch) {
    const rawKind = amMatch[1].toLowerCase();
    const slug = amMatch[2];
    const pathId = amMatch[3] || (!isNaN(slug) ? slug : '');
    const trackParamId = amMatch[4];

    if (trackParamId || rawKind === 'song') {
      return {
        platform: 'apple_music',
        type: 'track',
        id: trackParamId || pathId,
        albumId: pathId,
        slug,
        rawUrl: url,
      };
    }
    if (rawKind === 'album') {
      return {
        platform: 'apple_music',
        type: 'album',
        id: pathId,
        slug,
        rawUrl: url,
      };
    }
    if (rawKind === 'artist') {
      return {
        platform: 'apple_music',
        type: 'artist',
        id: pathId,
        slug,
        rawUrl: url,
      };
    }
    if (rawKind === 'playlist') {
      return {
        platform: 'apple_music',
        type: 'playlist',
        id: pathId,
        slug,
        rawUrl: url,
      };
    }
  }

  // 2. Spotify
  // Formats:
  // - https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT
  // - https://open.spotify.com/album/2up3OPMp9Tb4dAKM2erWXQ
  // - https://open.spotify.com/artist/0OdUWJ0sBjDrqHygGUXeCF
  // - https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M
  const spMatch = url.match(/https?:\/\/(?:open|play)\.spotify\.com\/(track|album|artist|playlist)\/([a-zA-Z0-9]{22})/i);
  if (spMatch) {
    return {
      platform: 'spotify',
      type: spMatch[1].toLowerCase(),
      id: spMatch[2],
      rawUrl: url,
    };
  }

  // 3. YouTube / YouTube Music
  // Formats:
  // - https://music.youtube.com/watch?v=dQw4w9WgXcQ
  // - https://www.youtube.com/watch?v=dQw4w9WgXcQ
  // - https://youtu.be/dQw4w9WgXcQ
  // - https://music.youtube.com/playlist?list=OLAK5uy_... (albums on YT Music are playlists)
  // - https://www.youtube.com/playlist?list=PL...
  // - https://music.youtube.com/watch?v=dQw4w9WgXcQ&list=OLAK5uy_...
  const isYtMusic = url.includes('music.youtube.com');
  const ytListMatch = url.match(/[?&]list=([a-zA-Z0-9_-]+)/i);
  const ytVideoMatch = url.match(/(?:watch\?v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/i);

  if (ytListMatch && (!ytVideoMatch || url.includes('/playlist'))) {
    const listId = ytListMatch[1];
    const isAlbum = listId.startsWith('OLAK5uy_') || listId.startsWith('RD');
    return {
      platform: isYtMusic ? 'youtube_music' : 'youtube',
      type: isAlbum ? 'album' : 'playlist',
      id: listId,
      playlistId: listId,
      videoId: ytVideoMatch ? ytVideoMatch[1] : null,
      rawUrl: url,
    };
  }

  if (ytVideoMatch) {
    return {
      platform: isYtMusic ? 'youtube_music' : 'youtube',
      type: 'track',
      id: ytVideoMatch[1],
      videoId: ytVideoMatch[1],
      playlistId: ytListMatch ? ytListMatch[1] : null,
      rawUrl: url,
    };
  }

  // 4. MusicBrainz
  const mbMatch = url.match(/https?:\/\/(?:(?:www|beta)\.)?musicbrainz\.org\/(recording|release-group|release|artist)\/([0-9a-fA-F-]{36})/i);
  if (mbMatch) {
    const rawKind = mbMatch[1].toLowerCase();
    const type = rawKind === 'recording' ? 'track' : (rawKind === 'release-group' || rawKind === 'release') ? 'album' : 'artist';
    return {
      platform: 'musicbrainz',
      type,
      id: mbMatch[2],
      rawUrl: url,
    };
  }

  return null;
}

/**
 * Cleans YouTube video titles by removing standard promotional suffixes.
 */
function cleanVideoTitle(rawTitle) {
  if (!rawTitle) return { title: '', artist: '' };
  let clean = rawTitle
    .replace(/\((?:official|music|lyric|audio|video|visualizer|clip|4k|hd|remastered)?\s*(?:video|audio|remaster)?\)/gi, '')
    .replace(/\[(?:official|music|lyric|audio|video|visualizer|clip|4k|hd|remastered)?\s*(?:video|audio|remaster)?\]/gi, '')
    .replace(/\|.*$/g, '')
    .trim();

  let artist = '';
  let title = clean;

  if (clean.includes(' - ')) {
    const parts = clean.split(' - ');
    artist = parts[0].trim();
    title = parts.slice(1).join(' - ').trim();
  } else if (clean.includes(': ')) {
    const parts = clean.split(': ');
    artist = parts[0].trim();
    title = parts.slice(1).join(': ').trim();
  }

  return { title, artist };
}

/**
 * Fetches canonical entity metadata from the originating streaming platform.
 */
export async function fetchPlatformEntity(parsed) {
  const { platform, type, id, slug, rawUrl, videoId, playlistId } = parsed;
  const cacheKey = `platform_entity_${platform}_${type}_${id}`;
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  // 1. APPLE MUSIC -> iTunes API lookup & search
  if (platform === 'apple_music') {
    try {
      if (id && !isNaN(id)) {
        const entityParam = type === 'album' ? '&entity=song' : type === 'artist' ? '&entity=musicArtist' : '';
        const lookupUrl = `https://itunes.apple.com/lookup?id=${id}${entityParam}`;
        const res = await axios.get(lookupUrl, { timeout: 6000 });
        const results = res.data?.results || [];

        if (results.length > 0) {
          const main = results[0];
          const coverArt = main.artworkUrl100
            ? main.artworkUrl100.replace('100x100bb', '600x600bb')
            : 'https://groove.amplecen.com/icon-512.png';

          if (type === 'track') {
            const data = {
              title: main.trackName || main.trackCensoredName,
              artist: main.artistName,
              album: main.collectionName,
              coverArt,
              releaseDate: main.releaseDate,
              releaseYear: main.releaseDate ? new Date(main.releaseDate).getFullYear() : null,
              directUrl: main.trackViewUrl,
              type: 'track',
              platform: 'apple_music',
              id,
            };
            setToCache(cacheKey, data);
            return data;
          }

          if (type === 'album') {
            const data = {
              title: main.collectionName || main.collectionCensoredName,
              artist: main.artistName,
              coverArt,
              releaseDate: main.releaseDate,
              releaseYear: main.releaseDate ? new Date(main.releaseDate).getFullYear() : null,
              directUrl: main.collectionViewUrl,
              type: 'album',
              platform: 'apple_music',
              id,
            };
            setToCache(cacheKey, data);
            return data;
          }

          if (type === 'artist') {
            const data = {
              title: main.artistName,
              artist: main.artistName,
              directUrl: main.artistLinkUrl,
              type: 'artist',
              platform: 'apple_music',
              id,
            };
            setToCache(cacheKey, data);
            return data;
          }
        }
      }

      // Fallback: search by URL slug on iTunes
      if (slug) {
        const cleanSlug = slug.replace(/[-_]/g, ' ').trim();
        const searchEntity = type === 'album' ? 'album' : type === 'artist' ? 'musicArtist' : 'song';
        const searchUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(cleanSlug)}&entity=${searchEntity}&limit=3`;
        const sRes = await axios.get(searchUrl, { timeout: 6000 });
        const first = sRes.data?.results?.[0];

        if (first) {
          const coverArt = first.artworkUrl100
            ? first.artworkUrl100.replace('100x100bb', '600x600bb')
            : 'https://groove.amplecen.com/icon-512.png';

          const data = {
            title: first.trackName || first.collectionName || first.artistName,
            artist: first.artistName,
            album: first.collectionName || '',
            coverArt,
            directUrl: first.trackViewUrl || first.collectionViewUrl || first.artistLinkUrl,
            type: type || 'track',
            platform: 'apple_music',
            id: first.trackId || first.collectionId || id,
          };
          setToCache(cacheKey, data);
          return data;
        }
      }
    } catch (err) {
      console.warn('iTunes API fetch error:', err.message);
    }
  }

  // 2. YOUTUBE / YOUTUBE MUSIC -> Data API or OEmbed
  if (platform === 'youtube' || platform === 'youtube_music') {
    const apiKey = process.env.YOUTUBE_API_KEY;

    // A. If Data API key is available and it's a playlist / album
    if (apiKey && (type === 'playlist' || type === 'album') && playlistId) {
      try {
        const res = await axios.get('https://www.googleapis.com/youtube/v3/playlists', {
          params: { part: 'snippet', id: playlistId, key: apiKey },
          timeout: 6000,
        });
        const snippet = res.data?.items?.[0]?.snippet;
        if (snippet) {
          const data = {
            title: snippet.title,
            artist: snippet.channelTitle || 'YouTube Creator',
            album: snippet.title,
            coverArt: snippet.thumbnails?.maxres?.url || snippet.thumbnails?.high?.url || snippet.thumbnails?.medium?.url,
            type: 'album',
            platform,
            id: playlistId,
          };
          setToCache(cacheKey, data);
          return data;
        }
      } catch (err) {
        console.warn('YouTube Data API playlist error:', err.message);
      }
    }

    // B. If Data API key is available and it's a video
    if (apiKey && videoId) {
      try {
        const res = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
          params: { part: 'snippet', id: videoId, key: apiKey },
          timeout: 6000,
        });
        const snippet = res.data?.items?.[0]?.snippet;
        if (snippet) {
          const { title, artist } = cleanVideoTitle(snippet.title);
          const data = {
            title: title || snippet.title,
            artist: artist || snippet.channelTitle || 'YouTube Creator',
            album: 'YouTube Music',
            coverArt: snippet.thumbnails?.maxres?.url || snippet.thumbnails?.high?.url || snippet.thumbnails?.medium?.url,
            type: 'track',
            platform,
            id: videoId,
          };
          setToCache(cacheKey, data);
          return data;
        }
      } catch (err) {
        console.warn('YouTube Data API video error:', err.message);
      }
    }

    // C. OEmbed fallback (requires no API key)
    try {
      const targetVideoId = videoId || (type === 'track' ? id : null);
      if (targetVideoId) {
        const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${targetVideoId}&format=json`;
        const res = await axios.get(oembedUrl, { timeout: 6000 });
        const rawTitle = res.data?.title || '';
        const author = res.data?.author_name || '';
        const coverArt = res.data?.thumbnail_url || 'https://groove.amplecen.com/icon-512.png';
        const { title, artist } = cleanVideoTitle(rawTitle);

        const data = {
          title: title || rawTitle,
          artist: artist || author,
          album: 'YouTube Stream',
          coverArt,
          type: 'track',
          platform,
          id: targetVideoId,
        };
        setToCache(cacheKey, data);
        return data;
      }
    } catch (err) {
      console.warn('YouTube OEmbed error:', err.message);
    }
  }

  // 3. SPOTIFY -> Scrape Open Graph / OEmbed
  if (platform === 'spotify') {
    try {
      // Fetch public Open Graph tags via crawler user-agent
      const webRes = await axios.get(`https://open.spotify.com/${type}/${id}`, {
        headers: {
          'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        timeout: 6000,
      });

      const html = webRes.data || '';
      const ogTitleMatch = html.match(/<meta property="og:title" content="([^"]+)"/);
      const ogDescMatch = html.match(/<meta property="og:description" content="([^"]+)"/);
      const ogImageMatch = html.match(/<meta property="og:image" content="([^"]+)"/);

      const ogTitle = ogTitleMatch ? ogTitleMatch[1] : '';
      const ogDesc = ogDescMatch ? ogDescMatch[1] : '';
      const coverArt = ogImageMatch ? ogImageMatch[1] : 'https://groove.amplecen.com/icon-512.png';

      if (ogTitle) {
        let artist = '';
        let album = '';

        if (ogDesc.includes(' · ')) {
          const parts = ogDesc.split(' · ');
          artist = parts[0]?.trim();
          album = parts.length > 2 ? parts[1]?.trim() : '';
        } else if (ogDesc.includes('by ')) {
          const parts = ogDesc.split('by ');
          artist = parts[1]?.trim();
        }

        const data = {
          title: ogTitle,
          artist: artist || ogTitle,
          album: album || (type === 'album' ? ogTitle : ''),
          coverArt,
          type: type === 'track' ? 'track' : type === 'album' ? 'album' : type === 'artist' ? 'artist' : 'playlist',
          platform: 'spotify',
          id,
        };
        setToCache(cacheKey, data);
        return data;
      }
    } catch (err) {
      console.warn('Spotify scrape error, trying oembed:', err.message);
      try {
        const oembedRes = await axios.get(`https://open.spotify.com/oembed?url=https://open.spotify.com/${type}/${id}`, {
          timeout: 5000,
        });
        const oembedTitle = oembedRes.data?.title || '';
        const coverArt = oembedRes.data?.thumbnail_url || 'https://groove.amplecen.com/icon-512.png';
        const data = {
          title: oembedTitle,
          artist: oembedTitle,
          album: '',
          coverArt,
          type: type || 'track',
          platform: 'spotify',
          id,
        };
        setToCache(cacheKey, data);
        return data;
      } catch (_) {}
    }
  }

  return null;
}

/**
 * Searches MusicBrainz and performs word-by-word matching to find the canonical item.
 */
export async function matchToMusicBrainz(metadata) {
  if (!metadata || !metadata.title) return null;
  const { title, artist, type = 'track' } = metadata;
  const searchQuery = `${title} ${artist || ''}`.trim();

  try {
    if (type === 'track' || type === 'video') {
      const candidates = await searchMusicBrainzTracksServer(searchQuery, 8);
      if (candidates && candidates.length > 0) {
        let bestMatch = null;
        let bestScore = -1;

        for (const candidate of candidates) {
          const candidateArtist = Array.isArray(candidate.artists)
            ? candidate.artists.map((a) => a.name).join(' ')
            : candidate.artist || '';

          const score = scoreCandidate(
            { title, artist },
            { title: candidate.title || candidate.name, artist: candidateArtist }
          );

          if (score > bestScore) {
            bestScore = score;
            bestMatch = candidate;
          }
        }

        if (bestMatch && bestScore >= 0.55) {
          return {
            canonicalId: bestMatch.id,
            canonicalType: 'track',
            redirectUrl: `/track/${bestMatch.id}?groovelink=true`,
            matchedItem: bestMatch,
            score: bestScore,
          };
        }
      }
    }

    if (type === 'album' || type === 'playlist') {
      const candidates = await searchMusicBrainzAlbumsServer(searchQuery, 8);
      if (candidates && candidates.length > 0) {
        let bestMatch = null;
        let bestScore = -1;

        for (const candidate of candidates) {
          const candidateArtist = Array.isArray(candidate.artists)
            ? candidate.artists.map((a) => a.name).join(' ')
            : candidate.artist || '';

          const score = scoreCandidate(
            { title, artist },
            { title: candidate.title || candidate.name, artist: candidateArtist }
          );

          if (score > bestScore) {
            bestScore = score;
            bestMatch = candidate;
          }
        }

        if (bestMatch && bestScore >= 0.55) {
          return {
            canonicalId: bestMatch.id,
            canonicalType: 'album',
            redirectUrl: `/album/${bestMatch.id}?groovelink=true`,
            matchedItem: bestMatch,
            score: bestScore,
          };
        }
      }
    }

    if (type === 'artist') {
      const candidates = await searchMusicBrainzArtistsServer(artist || title, 8);
      if (candidates && candidates.length > 0) {
        let bestMatch = null;
        let bestScore = -1;

        for (const candidate of candidates) {
          const score = scoreCandidate({ title: artist || title }, { title: candidate.name });
          if (score > bestScore) {
            bestScore = score;
            bestMatch = candidate;
          }
        }

        if (bestMatch && bestScore >= 0.6) {
          return {
            canonicalId: bestMatch.id,
            canonicalType: 'artist',
            redirectUrl: `/artist/${bestMatch.id}?groovelink=true`,
            matchedItem: bestMatch,
            score: bestScore,
          };
        }
      }
    }
  } catch (err) {
    console.error('MusicBrainz word matching error:', err.message);
  }

  return null;
}

/**
 * Full pipeline: takes any shared music link (or text containing a link),
 * fetches source data, applies word-by-word matching, and resolves the canonical destination.
 */
export async function resolveSharedLink(rawInput) {
  if (!rawInput) return { success: false, error: 'No link provided' };

  const parsed = parseSharedMusicUrl(rawInput);
  if (!parsed) {
    // If it is raw text without a recognized music URL, attempt raw search on MusicBrainz
    const cleanText = rawInput.trim();
    if (cleanText.length > 0) {
      const match = await matchToMusicBrainz({ title: cleanText, artist: '', type: 'track' });
      if (match) {
        return {
          success: true,
          platform: 'musicbrainz',
          type: match.canonicalType,
          id: match.canonicalId,
          redirectUrl: match.redirectUrl,
        };
      }
    }
    return { success: false, error: 'Invalid or unsupported music link' };
  }

  // If already a canonical MusicBrainz link
  if (parsed.platform === 'musicbrainz') {
    return {
      success: true,
      platform: 'musicbrainz',
      type: parsed.type,
      id: parsed.id,
      redirectUrl: `/${parsed.type}/${parsed.id}?groovelink=true`,
    };
  }

  // 1. Fetch metadata from originating platform API
  const platformEntity = await fetchPlatformEntity(parsed);

  if (platformEntity) {
    // 2. Match title and artist one word by one word
    const match = await matchToMusicBrainz(platformEntity);
    if (match) {
      return {
        success: true,
        platform: parsed.platform,
        type: match.canonicalType,
        id: match.canonicalId,
        redirectUrl: match.redirectUrl,
        matchedTitle: match.matchedItem?.title || match.matchedItem?.name,
        sourceEntity: platformEntity,
      };
    }

    // 3. Fallback: If MusicBrainz doesn't have the entity in catalog yet,
    // route to universal landing page with rich metadata
    return {
      success: true,
      platform: parsed.platform,
      type: parsed.type,
      id: parsed.id,
      redirectUrl: `/s/${parsed.platform}/${parsed.type}/${parsed.id}?groovelink=true`,
      sourceEntity: platformEntity,
    };
  }

  // Fallback to platform landing
  return {
    success: true,
    platform: parsed.platform,
    type: parsed.type,
    id: parsed.id,
    redirectUrl: `/s/${parsed.platform}/${parsed.type}/${parsed.id}?groovelink=true`,
  };
}

/**
 * Resolves verified DIRECT streaming platform links for GrooveLink (eliminates search/query links).
 */
export async function resolveDirectPlatformLinks({ title, artist, type = 'track', mbid, externalLinks = [] }) {
  const cleanTitle = (title || '').trim();
  const cleanArtist = (artist || '').trim();
  const cacheKey = `direct_links_${type}_${cleanTitle}_${cleanArtist}_${mbid || ''}`;
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  const links = {};
  const isDirect = {};

  // 1. Populate from known external links / MusicBrainz URL relations
  for (const item of externalLinks || []) {
    const url = typeof item === 'string' ? item : item?.url;
    const platform = typeof item === 'object' ? item?.platform : null;
    if (!url) continue;

    if (platform === 'spotify' || url.includes('spotify.com/')) {
      links.spotify = url;
      isDirect.spotify = true;
    } else if (platform === 'applemusic' || url.includes('music.apple.com/')) {
      links.apple_music = url;
      isDirect.apple_music = true;
    } else if (platform === 'youtube' || url.includes('youtube.com/') || url.includes('youtu.be/')) {
      links.youtube = url;
      isDirect.youtube = true;
      if (!links.youtube_music && url.includes('watch?v=')) {
        const v = url.split('watch?v=')[1]?.split('&')[0];
        if (v) {
          links.youtube_music = `https://music.youtube.com/watch?v=${v}`;
          isDirect.youtube_music = true;
        }
      }
    } else if (platform === 'deezer' || url.includes('deezer.com/')) {
      links.deezer = url;
      isDirect.deezer = true;
    } else if (platform === 'tidal' || url.includes('tidal.com/')) {
      links.tidal = url;
      isDirect.tidal = true;
    } else if (platform === 'soundcloud' || url.includes('soundcloud.com/')) {
      links.soundcloud = url;
      isDirect.soundcloud = true;
    }
  }

  // 2. Apple Music Direct Link via iTunes Search API with Word-by-Word Matching
  if (!links.apple_music && cleanTitle) {
    try {
      const searchEntity = type === 'album' ? 'album' : type === 'artist' ? 'musicArtist' : 'song';
      const term = `${cleanTitle} ${cleanArtist}`.trim();
      const res = await axios.get(`https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=${searchEntity}&limit=5`, {
        timeout: 4500,
      });

      const candidates = res.data?.results || [];
      let bestItem = null;
      let bestScore = -1;

      for (const cand of candidates) {
        const candTitle = cand.trackName || cand.collectionName || cand.artistName || '';
        const candArtist = cand.artistName || '';
        const score = scoreCandidate({ title: cleanTitle, artist: cleanArtist }, { title: candTitle, artist: candArtist });
        if (score > bestScore) {
          bestScore = score;
          bestItem = cand;
        }
      }

      if (bestItem && bestScore >= 0.55) {
        const directAppleUrl = bestItem.trackViewUrl || bestItem.collectionViewUrl || bestItem.artistLinkUrl;
        if (directAppleUrl) {
          links.apple_music = directAppleUrl;
          isDirect.apple_music = true;
        }
      }
    } catch (_) {}
  }

  // 3. MusicBrainz canonical direct link
  if (mbid) {
    links.musicbrainz = `https://musicbrainz.org/${type === 'album' ? 'release-group' : type === 'artist' ? 'artist' : 'recording'}/${mbid}`;
    isDirect.musicbrainz = true;
  }

  // 4. Fallback search URLs for services without direct matches
  const encodedQuery = encodeURIComponent(`${cleanTitle} ${cleanArtist}`.trim());
  if (!links.spotify) {
    links.spotify = `https://open.spotify.com/search/${encodedQuery}`;
    isDirect.spotify = false;
  }
  if (!links.apple_music) {
    links.apple_music = `https://music.apple.com/search?term=${encodedQuery}`;
    isDirect.apple_music = false;
  }
  if (!links.youtube) {
    links.youtube = `https://www.youtube.com/results?search_query=${encodedQuery}`;
    isDirect.youtube = false;
  }
  if (!links.youtube_music) {
    links.youtube_music = `https://music.youtube.com/search?q=${encodedQuery}`;
    isDirect.youtube_music = false;
  }
  if (!links.deezer) {
    links.deezer = `https://www.deezer.com/search/${encodedQuery}`;
    isDirect.deezer = false;
  }
  if (!links.tidal) {
    links.tidal = `https://listen.tidal.com/search?q=${encodedQuery}`;
    isDirect.tidal = false;
  }
  if (!links.soundcloud) {
    links.soundcloud = `https://soundcloud.com/search?q=${encodedQuery}`;
    isDirect.soundcloud = false;
  }

  const result = { links, isDirect };
  setToCache(cacheKey, result);
  return result;
}
