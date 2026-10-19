// frontend/src/lib/itunesSearch.js
/**
 * iTunes Search & Catalog Lookup Provider for GrooveEstrella.
 * 
 * Provides high-speed catalog discovery powered by the Apple iTunes Search API.
 * Returns results formatted into GrooveEstrella's universal schema.
 * 
 * Easily toggled or reverted via SEARCH_PROVIDER in /api/search/route.js
 */

import { resolveOpenArtistPhoto } from './musicbrainzServer.js';

const ITUNES_API_BASE = 'https://itunes.apple.com';

// In-memory cache for fast repeated queries
const itunesCache = new Map();
const CACHE_TTL_MS = 1000 * 60 * 15; // 15 minutes

function getCached(key) {
  const item = itunesCache.get(key);
  if (!item) return null;
  if (Date.now() - item.timestamp > CACHE_TTL_MS) {
    itunesCache.delete(key);
    return null;
  }
  return item.data;
}

function setCached(key, data) {
  if (itunesCache.size > 800) {
    const oldestKey = itunesCache.keys().next().value;
    itunesCache.delete(oldestKey);
  }
  itunesCache.set(key, { data, timestamp: Date.now() });
}

/**
 * Transforms iTunes 100x100 artwork into crisp 600x600 resolution
 */
export function getHighResArtwork(url, size = 600) {
  if (!url || typeof url !== 'string') {
    return 'https://groove.amplecen.com/icon-512.png';
  }
  return url.replace(/\/(\d+)x(\d+)bb\./, `/${size}x${size}bb.`);
}

/**
 * Search tracks using iTunes Search API
 */
export async function searchItunesTracks(query, limit = 10) {
  if (!query || !query.trim()) return [];
  const cleanQuery = query.trim();
  const cacheKey = `itunes_track_${cleanQuery.toLowerCase()}_${limit}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const url = `${ITUNES_API_BASE}/search?term=${encodeURIComponent(cleanQuery)}&media=music&entity=song&limit=${limit}`;
    const res = await fetch(url, { headers: { 'Accept': 'application/json' }, next: { revalidate: 300 } });
    if (!res.ok) return [];
    const data = await res.json();
    const items = data.results || [];

    const results = items.map((item) => {
      const coverUrl = getHighResArtwork(item.artworkUrl100, 600);
      const trackId = String(item.trackId);
      const artistName = item.artistName || 'Unknown Artist';
      const artistsList = [{ name: artistName, id: String(item.artistId || '') }];
      const releaseYear = item.releaseDate ? new Date(item.releaseDate).getFullYear() : null;
      const queryForLinks = `${item.trackName} ${artistName}`;

      return {
        id: trackId,
        trackId: trackId,
        title: item.trackName,
        name: item.trackName,
        artist: artistsList,
        artists: artistsList,
        album: item.collectionName || item.trackName,
        albumTitle: item.collectionName || item.trackName,
        albumID: String(item.collectionId || ''),
        coverArt: coverUrl,
        url: coverUrl,
        image: coverUrl,
        releaseDate: item.releaseDate || null,
        releaseYear: releaseYear,
        durationMs: item.trackTimeMillis || 0,
        duration_ms: item.trackTimeMillis || 0,
        genres: [item.primaryGenreName].filter(Boolean),
        primaryGenre: item.primaryGenreName || null,
        popularity: 85,
        explicit: item.trackExplicitness === 'explicit',
        previewUrl: item.previewUrl || null,
        preview_url: item.previewUrl || null,
        spoURL: `https://open.spotify.com/search/${encodeURIComponent(queryForLinks)}`,
        appleMusicURL: item.trackViewUrl || null,
        YTURL: `https://www.youtube.com/results?search_query=${encodeURIComponent(queryForLinks)}`,
        trackURI: `itunes:track:${trackId}`,
        type: 'track',
      };
    });

    setCached(cacheKey, results);
    return results;
  } catch (err) {
    console.error(`iTunes search tracks failed for "${query}":`, err.message);
    return [];
  }
}

/**
 * Search albums using iTunes Search API
 */
export async function searchItunesAlbums(query, limit = 10) {
  if (!query || !query.trim()) return [];
  const cleanQuery = query.trim();
  const cacheKey = `itunes_album_${cleanQuery.toLowerCase()}_${limit}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const url = `${ITUNES_API_BASE}/search?term=${encodeURIComponent(cleanQuery)}&media=music&entity=album&limit=${limit}`;
    const res = await fetch(url, { headers: { 'Accept': 'application/json' }, next: { revalidate: 300 } });
    if (!res.ok) return [];
    const data = await res.json();
    const items = data.results || [];

    const results = items.map((item) => {
      const coverUrl = getHighResArtwork(item.artworkUrl100, 600);
      const collectionId = String(item.collectionId);
      const artistName = item.artistName || 'Various Artists';
      const artistsList = [{ name: artistName, id: String(item.artistId || '') }];
      const releaseYear = item.releaseDate ? new Date(item.releaseDate).getFullYear() : null;
      const queryForLinks = `${item.collectionName} ${artistName} album`;

      return {
        id: collectionId,
        title: item.collectionName,
        name: item.collectionName,
        artist: artistsList,
        artists: artistsList,
        url: coverUrl,
        image: coverUrl,
        coverArt: coverUrl,
        type: 'album',
        primaryType: item.collectionType || 'Album',
        releaseDate: item.releaseDate || null,
        release_date: item.releaseDate || null,
        releaseYear: releaseYear,
        total_tracks: item.trackCount || 0,
        genres: [item.primaryGenreName].filter(Boolean),
        primaryGenre: item.primaryGenreName || null,
        trackURI: `itunes:album:${collectionId}`,
        appleMusicURL: item.collectionViewUrl || null,
        spoURL: `https://open.spotify.com/search/${encodeURIComponent(queryForLinks)}`,
      };
    });

    setCached(cacheKey, results);
    return results;
  } catch (err) {
    console.error(`iTunes search albums failed for "${query}":`, err.message);
    return [];
  }
}

/**
 * Search artists using iTunes Search API
 */
export async function searchItunesArtists(query, limit = 10) {
  if (!query || !query.trim()) return [];
  const cleanQuery = query.trim();
  const cacheKey = `itunes_artist_${cleanQuery.toLowerCase()}_${limit}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const url = `${ITUNES_API_BASE}/search?term=${encodeURIComponent(cleanQuery)}&media=music&entity=musicArtist&limit=${limit}`;
    const res = await fetch(url, { headers: { 'Accept': 'application/json' }, next: { revalidate: 300 } });
    if (!res.ok) return [];
    const data = await res.json();
    const items = data.results || [];

    const results = await Promise.all(
      items.map(async (art) => {
        const artistId = String(art.artistId);
        const artistName = art.artistName || 'Artist';
        const photoUrl = await resolveOpenArtistPhoto(artistName);
        const queryForLinks = `${artistName} artist`;

        return {
          id: artistId,
          title: artistName,
          name: artistName,
          artist: artistName,
          country: 'Global',
          type: 'artist',
          genres: [art.primaryGenreName].filter(Boolean),
          primaryGenre: art.primaryGenreName || null,
          url: photoUrl,
          image: photoUrl,
          coverArt: photoUrl,
          followers: 120000,
          popularity: 88,
          spoURL: `https://open.spotify.com/search/${encodeURIComponent(queryForLinks)}`,
          YTURL: `https://www.youtube.com/results?search_query=${encodeURIComponent(queryForLinks)}`,
          appleMusicURL: art.artistLinkUrl || null,
          trackURI: `itunes:artist:${artistId}`,
        };
      })
    );

    setCached(cacheKey, results);
    return results;
  } catch (err) {
    console.error(`iTunes search artists failed for "${query}":`, err.message);
    return [];
  }
}

/**
 * Look up track details by iTunes track ID
 */
export async function lookupItunesTrack(id) {
  if (!id) return null;
  const cleanId = String(id).replace(/^itunes:track:/i, '').trim();
  const cacheKey = `itunes_lookup_track_${cleanId}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const url = `${ITUNES_API_BASE}/lookup?id=${cleanId}`;
    const res = await fetch(url, { headers: { 'Accept': 'application/json' }, next: { revalidate: 600 } });
    if (!res.ok) return null;
    const data = await res.json();
    const item = data.results?.[0];
    if (!item) return null;

    const coverUrl = getHighResArtwork(item.artworkUrl100, 600);
    const artistName = item.artistName || 'Unknown Artist';
    const artistsList = [{ name: artistName, id: String(item.artistId || '') }];
    const releaseYear = item.releaseDate ? new Date(item.releaseDate).getFullYear() : null;
    const queryForLinks = `${item.trackName} ${artistName}`;

    const trackData = {
      id: String(item.trackId || cleanId),
      trackId: String(item.trackId || cleanId),
      name: item.trackName,
      title: item.trackName,
      artists: artistsList,
      artist: artistsList,
      album: {
        id: String(item.collectionId || ''),
        name: item.collectionName || item.trackName,
        title: item.collectionName || item.trackName,
        images: [{ url: coverUrl, width: 600, height: 600 }],
        release_date: item.releaseDate || 'Unknown',
      },
      coverArt: coverUrl,
      url: coverUrl,
      releaseDate: item.releaseDate || null,
      releaseYear: releaseYear,
      duration_ms: item.trackTimeMillis || 0,
      durationMs: item.trackTimeMillis || 0,
      primaryGenre: item.primaryGenreName || null,
      genres: [item.primaryGenreName].filter(Boolean),
      categorizedTags: {
        genres: item.primaryGenreName ? [{ name: item.primaryGenreName, count: 1 }] : [],
        styles: [],
        moods: [],
        eras: releaseYear ? [{ name: `${releaseYear}`, count: 1 }] : [],
        other: [],
        allFlatNames: [item.primaryGenreName].filter(Boolean),
        allWithCounts: item.primaryGenreName ? [{ name: item.primaryGenreName, count: 1 }] : [],
      },
      tags: [item.primaryGenreName].filter(Boolean),
      allTags: item.primaryGenreName ? [{ name: item.primaryGenreName, count: 1 }] : [],
      description: `"${item.trackName}" is a song by ${artistName}${item.collectionName ? ` from the album "${item.collectionName}"` : ''}${releaseYear ? ` (${releaseYear})` : ''}.`,
      rating: null,
      previewUrl: item.previewUrl || null,
      preview_url: item.previewUrl || null,
      externalLinks: {
        streaming: [
          { name: 'Apple Music', icon: 'applemusic', url: item.trackViewUrl || `https://music.apple.com/search?term=${encodeURIComponent(queryForLinks)}` },
          { name: 'Spotify', icon: 'spotify', url: `https://open.spotify.com/search/${encodeURIComponent(queryForLinks)}` },
          { name: 'YouTube Music', icon: 'youtube', url: `https://music.youtube.com/search?q=${encodeURIComponent(queryForLinks)}` },
          { name: 'Deezer', icon: 'deezer', url: `https://www.deezer.com/search/${encodeURIComponent(queryForLinks)}` },
          { name: 'TIDAL', icon: 'tidal', url: `https://listen.tidal.com/search?q=${encodeURIComponent(queryForLinks)}` },
        ],
        lyrics: [
          { name: 'Genius', url: `https://genius.com/search?q=${encodeURIComponent(queryForLinks)}` },
        ],
        purchase: item.collectionViewUrl ? [{ name: 'iTunes', url: item.collectionViewUrl }] : [],
        official: [],
      },
      external_urls: {
        spotify: `https://open.spotify.com/search/${encodeURIComponent(queryForLinks)}`,
        applemusic: item.trackViewUrl || '',
      },
      uri: `itunes:track:${item.trackId || cleanId}`,
    };

    setCached(cacheKey, trackData);
    return trackData;
  } catch (err) {
    console.error(`iTunes lookup track failed for ${id}:`, err.message);
    return null;
  }
}

/**
 * Look up album details and tracklist by iTunes collection ID
 */
export async function lookupItunesAlbum(id) {
  if (!id) return { album: null, tracks: [] };
  const cleanId = String(id).replace(/^itunes:album:/i, '').trim();
  const cacheKey = `itunes_lookup_album_${cleanId}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const url = `${ITUNES_API_BASE}/lookup?id=${cleanId}&entity=song`;
    const res = await fetch(url, { headers: { 'Accept': 'application/json' }, next: { revalidate: 600 } });
    if (!res.ok) return { album: null, tracks: [] };
    const data = await res.json();
    const items = data.results || [];
    if (!items.length) return { album: null, tracks: [] };

    // Result 0 is collection metadata
    const col = items.find((i) => i.wrapperType === 'collection') || items[0];
    const rawSongs = items.filter((i) => i.wrapperType === 'track');

    const coverUrl = getHighResArtwork(col.artworkUrl100, 600);
    const artistName = col.artistName || 'Various Artists';
    const artistsList = [{ name: artistName, id: String(col.artistId || '') }];
    const releaseYear = col.releaseDate ? new Date(col.releaseDate).getFullYear() : null;
    const queryForLinks = `${col.collectionName} ${artistName} album`;

    const formattedTracks = rawSongs.map((song, idx) => {
      const songArtist = song.artistName || artistName;
      const songArtistsList = [{ name: songArtist, id: String(song.artistId || '') }];
      const trackLinks = `${song.trackName} ${songArtist}`;

      return {
        id: String(song.trackId || `${cleanId}-${idx + 1}`),
        trackID: String(song.trackId || `${cleanId}-${idx + 1}`),
        trackId: String(song.trackId || `${cleanId}-${idx + 1}`),
        title: song.trackName,
        name: song.trackName,
        pos: song.trackNumber || (idx + 1),
        trackNumber: song.trackNumber || (idx + 1),
        disc: song.discNumber || 1,
        discNumber: song.discNumber || 1,
        discTitle: `Disc ${song.discNumber || 1}`,
        discFormat: 'CD / Digital',
        sideNumber: 1,
        sideLabel: null,
        duration: song.trackTimeMillis || 0,
        duration_ms: song.trackTimeMillis || 0,
        artist: songArtistsList,
        artists: songArtistsList,
        previewUrl: song.previewUrl || null,
        trackURI: `itunes:track:${song.trackId || ''}`,
        spoURL: `https://open.spotify.com/search/${encodeURIComponent(trackLinks)}`,
        YTURL: `https://www.youtube.com/results?search_query=${encodeURIComponent(trackLinks)}`,
      };
    });

    const totalDurationMs = formattedTracks.reduce((acc, t) => acc + (t.duration_ms || 0), 0);

    const albumObj = {
      id: cleanId,
      name: col.collectionName,
      title: col.collectionName,
      artists: artistsList,
      artist: artistsList,
      images: [{ url: coverUrl, width: 600, height: 600 }],
      coverArt: coverUrl,
      url: coverUrl,
      release_date: col.releaseDate || 'Unknown',
      releaseDate: col.releaseDate || null,
      releaseYear: releaseYear,
      originalReleaseDate: col.releaseDate || null,
      originalReleaseYear: releaseYear,
      total_tracks: formattedTracks.length || col.trackCount || 0,
      totalDurationMs: totalDurationMs,
      primaryGenre: col.primaryGenreName || null,
      genres: [col.primaryGenreName].filter(Boolean),
      categorizedTags: {
        genres: col.primaryGenreName ? [{ name: col.primaryGenreName, count: 1 }] : [],
        styles: [],
        moods: [],
        eras: releaseYear ? [{ name: `${releaseYear}`, count: 1 }] : [],
        other: [],
        allFlatNames: [col.primaryGenreName].filter(Boolean),
        allWithCounts: col.primaryGenreName ? [{ name: col.primaryGenreName, count: 1 }] : [],
      },
      tags: [col.primaryGenreName].filter(Boolean),
      allTags: col.primaryGenreName ? [{ name: col.primaryGenreName, count: 1 }] : [],
      description: `"${col.collectionName}" is an album by ${artistName}, released in ${releaseYear || 'recent years'}.${col.copyright ? ` ${col.copyright}` : ''}`,
      rating: null,
      externalLinks: {
        streaming: [
          { name: 'Apple Music', icon: 'applemusic', url: col.collectionViewUrl || `https://music.apple.com/search?term=${encodeURIComponent(queryForLinks)}` },
          { name: 'Spotify', icon: 'spotify', url: `https://open.spotify.com/search/${encodeURIComponent(queryForLinks)}` },
          { name: 'YouTube Music', icon: 'youtube', url: `https://music.youtube.com/search?q=${encodeURIComponent(queryForLinks)}` },
          { name: 'Deezer', icon: 'deezer', url: `https://www.deezer.com/search/${encodeURIComponent(queryForLinks)}` },
          { name: 'TIDAL', icon: 'tidal', url: `https://listen.tidal.com/search?q=${encodeURIComponent(queryForLinks)}` },
        ],
        purchase: col.collectionViewUrl ? [{ name: 'iTunes', url: col.collectionViewUrl }] : [],
        official: [],
      },
      external_urls: {
        spotify: `https://open.spotify.com/search/${encodeURIComponent(queryForLinks)}`,
        applemusic: col.collectionViewUrl || '',
      },
      uri: `itunes:album:${cleanId}`,
      selectedReleaseId: cleanId,
      activeEdition: {
        id: cleanId,
        title: col.collectionName,
        country: col.country || 'Global',
        date: col.releaseDate || '',
        label: col.copyright || '',
        editionName: `${col.collectionName} (${col.country || 'Global'})`,
      },
      editions: [
        {
          id: cleanId,
          title: col.collectionName,
          country: col.country || 'Global',
          date: col.releaseDate || '',
          label: col.copyright || '',
          editionName: `${col.collectionName} (${col.country || 'Global'})`,
        }
      ],
      variations: [],
    };

    const result = { album: albumObj, tracks: formattedTracks };
    setCached(cacheKey, result);
    return result;
  } catch (err) {
    console.error(`iTunes lookup album failed for ${id}:`, err.message);
    return { album: null, tracks: [] };
  }
}

/**
 * Look up artist details, top songs, and albums by iTunes artist ID
 */
export async function lookupItunesArtist(id) {
  if (!id) return null;
  const cleanId = String(id).replace(/^itunes:artist:/i, '').trim();
  const cacheKey = `itunes_lookup_artist_${cleanId}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const [songsRes, albumsRes] = await Promise.all([
      fetch(`${ITUNES_API_BASE}/lookup?id=${cleanId}&entity=song&limit=15`, { headers: { 'Accept': 'application/json' }, next: { revalidate: 600 } }).catch(() => null),
      fetch(`${ITUNES_API_BASE}/lookup?id=${cleanId}&entity=album&limit=25`, { headers: { 'Accept': 'application/json' }, next: { revalidate: 600 } }).catch(() => null),
    ]);

    const songsData = songsRes?.ok ? await songsRes.json() : { results: [] };
    const albumsData = albumsRes?.ok ? await albumsRes.json() : { results: [] };

    const artistItem = songsData.results?.[0] || albumsData.results?.[0];
    if (!artistItem) return null;

    const artistName = artistItem.artistName || 'Artist';
    const photoUrl = await resolveOpenArtistPhoto(artistName);
    const queryForLinks = `${artistName} artist`;

    const topTracks = (songsData.results || [])
      .filter((i) => i.wrapperType === 'track')
      .map((t, idx) => ({
        id: String(t.trackId),
        trackId: String(t.trackId),
        title: t.trackName,
        name: t.trackName,
        pos: idx + 1,
        duration: t.trackTimeMillis || 0,
        duration_ms: t.trackTimeMillis || 0,
        coverArt: getHighResArtwork(t.artworkUrl100, 300),
        url: getHighResArtwork(t.artworkUrl100, 300),
        previewUrl: t.previewUrl || null,
        album: t.collectionName || '',
        albumID: String(t.collectionId || ''),
        artist: [{ name: artistName, id: cleanId }],
        artists: [{ name: artistName, id: cleanId }],
        trackURI: `itunes:track:${t.trackId}`,
        spoURL: `https://open.spotify.com/search/${encodeURIComponent(t.trackName + ' ' + artistName)}`,
        YTURL: `https://www.youtube.com/results?search_query=${encodeURIComponent(t.trackName + ' ' + artistName)}`,
      }));

    const albums = (albumsData.results || [])
      .filter((i) => i.wrapperType === 'collection')
      .map((a) => {
        const cover = getHighResArtwork(a.artworkUrl100, 600);
        return {
          id: String(a.collectionId),
          title: a.collectionName,
          name: a.collectionName,
          url: cover,
          image: cover,
          coverArt: cover,
          type: 'album',
          primaryType: a.collectionType || 'Album',
          releaseDate: a.releaseDate || null,
          release_date: a.releaseDate || null,
          releaseYear: a.releaseDate ? new Date(a.releaseDate).getFullYear() : null,
          total_tracks: a.trackCount || 0,
          artist: [{ name: artistName, id: cleanId }],
          artists: [{ name: artistName, id: cleanId }],
          trackURI: `itunes:album:${a.collectionId}`,
          spoURL: `https://open.spotify.com/search/${encodeURIComponent(a.collectionName + ' ' + artistName + ' album')}`,
        };
      });

    const artistData = {
      id: cleanId,
      name: artistName,
      title: artistName,
      artist: artistName,
      country: 'Global',
      type: 'artist',
      genres: [artistItem.primaryGenreName].filter(Boolean),
      primaryGenre: artistItem.primaryGenreName || null,
      categorizedTags: {
        genres: artistItem.primaryGenreName ? [{ name: artistItem.primaryGenreName, count: 1 }] : [],
        styles: [],
        moods: [],
        eras: [],
        other: [],
        allFlatNames: [artistItem.primaryGenreName].filter(Boolean),
        allWithCounts: artistItem.primaryGenreName ? [{ name: artistItem.primaryGenreName, count: 1 }] : [],
      },
      url: photoUrl,
      image: photoUrl,
      coverArt: photoUrl,
      images: [{ url: photoUrl, width: 800, height: 800 }],
      followers: 150000,
      popularity: 88,
      topTracks: topTracks,
      albums: albums,
      description: `${artistName} is a musical artist${artistItem.primaryGenreName ? ` known for ${artistItem.primaryGenreName}` : ''}.`,
      externalLinks: {
        streaming: [
          { name: 'Apple Music', icon: 'applemusic', url: artistItem.artistLinkUrl || `https://music.apple.com/search?term=${encodeURIComponent(queryForLinks)}` },
          { name: 'Spotify', icon: 'spotify', url: `https://open.spotify.com/search/${encodeURIComponent(queryForLinks)}` },
          { name: 'YouTube Music', icon: 'youtube', url: `https://music.youtube.com/search?q=${encodeURIComponent(queryForLinks)}` },
        ],
        social: [],
        official: [],
      },
      external_urls: {
        spotify: `https://open.spotify.com/search/${encodeURIComponent(queryForLinks)}`,
        applemusic: artistItem.artistLinkUrl || '',
      },
      uri: `itunes:artist:${cleanId}`,
    };

    setCached(cacheKey, artistData);
    return artistData;
  } catch (err) {
    console.error(`iTunes lookup artist failed for ${id}:`, err.message);
    return null;
  }
}
