// src/lib/supabase/musicEntities.js
import { createClient, createAdminClient, isSupabaseServerConfigured } from './server';
import {
  fetchMusicBrainzAlbumServer,
  fetchMusicBrainzArtistServer,
  fetchMusicBrainzTrackServer,
} from '@/lib/musicbrainzServer';

/**
 * Format a platform ID or URL into a canonical direct URL based on entity type.
 */
export function formatPlatformLink(platform, idOrUrl, entityType = 'album') {
  if (!idOrUrl || typeof idOrUrl !== 'string') return null;
  const val = idOrUrl.trim();
  if (!val) return null;

  if (val.startsWith('http://') || val.startsWith('https://')) {
    return val;
  }

  const typeMap = {
    spotify: entityType === 'artist' ? 'artist' : entityType === 'track' ? 'track' : 'album',
    deezer: entityType === 'artist' ? 'artist' : entityType === 'track' ? 'track' : 'album',
    tidal: entityType === 'artist' ? 'artist' : entityType === 'track' ? 'track' : 'album',
    apple_music: entityType === 'artist' ? 'artist' : entityType === 'track' ? 'song' : 'album',
  };

  switch (platform) {
    case 'spotify':
      return `https://open.spotify.com/${typeMap.spotify}/${val}`;
    case 'apple_music':
    case 'applemusic':
      return `https://music.apple.com/${typeMap.apple_music}/${val}`;
    case 'deezer':
      return `https://www.deezer.com/${typeMap.deezer}/${val}`;
    case 'tidal':
      return `https://listen.tidal.com/${typeMap.tidal}/${val}`;
    case 'youtube_music':
      return val.startsWith('OLAK') || val.startsWith('PL')
        ? `https://music.youtube.com/playlist?list=${val}`
        : `https://music.youtube.com/watch?v=${val}`;
    case 'youtube':
      return `https://www.youtube.com/watch?v=${val}`;
    case 'musicbrainz':
      return `https://musicbrainz.org/${
        entityType === 'artist' ? 'artist' : entityType === 'track' ? 'recording' : 'release-group'
      }/${val}`;
    default:
      return val;
  }
}

/**
 * Extract streaming IDs and URLs from MusicBrainz externalLinks relations.
 */
export function extractGrooveLinkMap(externalLinks = [], additionalLinks = {}) {
  const groovelink = { ...additionalLinks };
  for (const item of externalLinks || []) {
    const url = typeof item === 'string' ? item : item?.url;
    const platform = typeof item === 'object' ? item?.platform : null;
    if (!url) continue;

    if (platform === 'spotify' || url.includes('spotify.com/')) {
      if (!url.includes('/search/')) {
        groovelink.spotify_url = url;
        const m = url.match(/spotify\.com\/(?:album|track|artist)\/([a-zA-Z0-9]+)/);
        if (m && m[1]) groovelink.spotify = m[1];
        else if (!groovelink.spotify) groovelink.spotify = url;
      }
    } else if (platform === 'applemusic' || url.includes('music.apple.com/')) {
      if (!url.includes('/search')) {
        groovelink.apple_music_url = url;
        const m = url.match(/\/id(\d+)|\/(\d+)(?:\?|$)/);
        if (m && (m[1] || m[2])) groovelink.apple_music = m[1] || m[2];
        else if (!groovelink.apple_music) groovelink.apple_music = url;
      }
    } else if (platform === 'deezer' || url.includes('deezer.com/')) {
      if (!url.includes('/search')) {
        groovelink.deezer_url = url;
        const m = url.match(/deezer\.com\/(?:[a-z]{2}\/)?(?:album|track|artist)\/(\d+)/);
        if (m && m[1]) groovelink.deezer = m[1];
        else if (!groovelink.deezer) groovelink.deezer = url;
      }
    } else if (platform === 'tidal' || url.includes('tidal.com/')) {
      if (!url.includes('/search')) {
        groovelink.tidal_url = url;
        const m = url.match(/tidal\.com\/(?:browse\/)?(?:album|track|artist)\/(\d+)/);
        if (m && m[1]) groovelink.tidal = m[1];
        else if (!groovelink.tidal) groovelink.tidal = url;
      }
    } else if (platform === 'youtube' || url.includes('youtube.com/') || url.includes('youtu.be/')) {
      if (url.includes('music.youtube.com/')) {
        groovelink.youtube_music_url = url;
        const v = url.split('watch?v=')[1]?.split('&')[0];
        const list = url.split('list=')[1]?.split('&')[0];
        if (v) groovelink.youtube_music = v;
        else if (list) groovelink.youtube_music = list;
        else groovelink.youtube_music = url;
      } else {
        groovelink.youtube_url = url;
        const v = url.includes('watch?v=')
          ? url.split('watch?v=')[1]?.split('&')[0]
          : url.includes('youtu.be/')
          ? url.split('youtu.be/')[1]?.split('?')[0]
          : null;
        if (v) groovelink.youtube = v;
        else groovelink.youtube = url;
      }
    }
  }
  return groovelink;
}

/**
 * Get or fetch music entity by MBID from Supabase cache, fallback to MusicBrainz.
 * Respects MusicBrainz rate limits by persisting entities in PostgreSQL.
 * Ensures year is never null when available and data is lean and structured.
 */
export async function getOrFetchMusicEntity(mbid, typeHint = 'album', fallbackMeta = {}) {
  if (!mbid) return null;

  const isConfigured = isSupabaseServerConfigured();

  // 1. Check existing record in Supabase
  if (isConfigured) {
    try {
      const supabase = await createClient();
      const { data: cachedEntity, error } = await supabase
        .from('music_entities')
        .select('*')
        .eq('mbid', mbid)
        .maybeSingle();

      if (!error && cachedEntity) {
        // If entity already has year and non-empty data, return immediately
        const hasYear = cachedEntity.year !== null && cachedEntity.year > 0;
        const hasGroovelink = Boolean(cachedEntity.data && Object.keys(cachedEntity.data).length > 0);

        if (hasYear && hasGroovelink) {
          return cachedEntity;
        }

        // Self-heal: If cached entity has missing year or empty data, backfill it below
      }
    } catch (err) {
      console.warn('Supabase cache lookup warning:', err?.message);
    }
  }

  // 2. Fetch fresh details from MusicBrainz
  let resolvedType = typeHint;
  let title = fallbackMeta.title || 'Untitled';
  let artistCredit = fallbackMeta.artist || 'Unknown Artist';
  let year = fallbackMeta.year ? parseInt(String(fallbackMeta.year), 10) : null;
  let coverArtUrl = fallbackMeta.cover_art_url || null;
  let cleanData = null;

  try {
    if (typeHint === 'artist') {
      const artistData = await fetchMusicBrainzArtistServer(mbid);
      if (artistData) {
        title = artistData.name || title;
        artistCredit = artistData.name || artistCredit;
        coverArtUrl = artistData.coverArt || artistData.image || coverArtUrl;
        const rawYear = artistData.lifeSpan?.begin
          ? parseInt(String(artistData.lifeSpan.begin).slice(0, 4), 10)
          : null;
        if (Number.isInteger(rawYear)) year = rawYear;

        const groovelinks = extractGrooveLinkMap(artistData.externalLinks || [], fallbackMeta.groovelink || {});
        cleanData = {
          groovelink: groovelinks,
          genres: artistData.genres?.slice(0, 8) || [],
          primary_genre: artistData.primaryGenre || artistData.genres?.[0] || null,
        };
      }
    } else if (typeHint === 'track') {
      const trackData = await fetchMusicBrainzTrackServer(mbid);
      if (trackData) {
        title = trackData.title || title;
        artistCredit = Array.isArray(trackData.artist)
          ? trackData.artist.map((a) => (typeof a === 'object' ? a.name : a)).join(', ')
          : trackData.artist || artistCredit;
        coverArtUrl = trackData.coverArt || trackData.albumCover || coverArtUrl;
        const rawYear = trackData.releaseYear
          ? parseInt(String(trackData.releaseYear), 10)
          : trackData.releaseDate
          ? parseInt(String(trackData.releaseDate).slice(0, 4), 10)
          : null;
        if (Number.isInteger(rawYear)) year = rawYear;

        const groovelinks = extractGrooveLinkMap(trackData.externalLinks || [], fallbackMeta.groovelink || {});
        cleanData = {
          groovelink: groovelinks,
          genres: trackData.genres?.slice(0, 8) || [],
          primary_genre: trackData.primaryGenre || null,
          duration_ms: trackData.duration_ms || null,
        };
      }
    } else {
      // Default to album / release-group
      const albumResult = await fetchMusicBrainzAlbumServer(mbid);
      const alb = albumResult?.album || albumResult;
      if (alb) {
        resolvedType = 'album';
        title = alb.title || alb.name || title;
        artistCredit = Array.isArray(alb.artist)
          ? alb.artist.map((a) => (typeof a === 'object' ? a.name : a)).join(', ')
          : alb.artist || alb.artists?.[0]?.name || artistCredit;
        coverArtUrl =
          alb.coverArt ||
          alb.mainCoverArt ||
          alb.images?.[0]?.url ||
          coverArtUrl ||
          `https://coverartarchive.org/release-group/${mbid}/front-500`;

        const rawYear =
          alb.originalReleaseYear ||
          alb.releaseYear ||
          (alb.releaseDate ? parseInt(String(alb.releaseDate).slice(0, 4), 10) : null);
        if (Number.isInteger(rawYear)) year = rawYear;

        const groovelinks = extractGrooveLinkMap(alb.externalLinks || [], fallbackMeta.groovelink || {});
        cleanData = {
          groovelink: groovelinks,
          genres: alb.genres?.slice(0, 8) || [],
          primary_genre: alb.primaryGenre || alb.genres?.[0] || null,
          total_tracks: alb.total_tracks || null,
        };
      }
    }
  } catch (err) {
    console.error(`Failed to fetch ${typeHint} MBID ${mbid} from MusicBrainz:`, err);
  }

  // Fallback to minimal structured data if MusicBrainz didn't provide cleanData
  if (!cleanData) {
    cleanData = {
      groovelink: fallbackMeta.groovelink || {},
      genres: [],
    };
  }

  const entityToPersist = {
    mbid,
    type: resolvedType,
    title,
    artist_credit: artistCredit,
    year: Number.isInteger(year) ? year : null,
    cover_art_url: coverArtUrl,
    data: cleanData,
  };

  // 3. Cache or update in Supabase
  if (isConfigured) {
    try {
      const adminClient = createAdminClient();
      const client = adminClient || (await createClient());

      const { data: upserted, error: upsertError } = await client
        .from('music_entities')
        .upsert(entityToPersist, { onConflict: 'mbid' })
        .select()
        .single();

      if (!upsertError && upserted) {
        return upserted;
      }
    } catch (saveErr) {
      console.warn('Could not cache music entity to Supabase:', saveErr?.message);
    }
  }

  return {
    id: `local_${mbid}`,
    ...entityToPersist,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

/**
 * Persist or merge direct streaming platform links into music_entities.data.groovelink.
 * Also heals missing year or cover_art_url.
 */
export async function saveGrooveLinksForEntity(mbid, newLinks = {}, extraUpdates = {}) {
  if (!mbid || !isSupabaseServerConfigured()) return null;
  try {
    const admin = createAdminClient();
    const supabase = admin || (await createClient());

    const { data: existing } = await supabase
      .from('music_entities')
      .select('id, data, year, cover_art_url')
      .eq('mbid', mbid)
      .maybeSingle();

    if (!existing) return null;

    const currentData = existing.data || {};
    const currentGroovelink = currentData.groovelink || {};
    const mergedGroovelink = { ...currentGroovelink, ...newLinks };

    // Clean out empty keys
    for (const [k, v] of Object.entries(mergedGroovelink)) {
      if (!v) delete mergedGroovelink[k];
    }

    const updatedData = {
      ...currentData,
      groovelink: mergedGroovelink,
    };

    const updatePayload = {
      data: updatedData,
      updated_at: new Date().toISOString(),
    };

    if (existing.year === null && Number.isInteger(extraUpdates.year)) {
      updatePayload.year = extraUpdates.year;
    }
    if (!existing.cover_art_url && extraUpdates.cover_art_url) {
      updatePayload.cover_art_url = extraUpdates.cover_art_url;
    }

    const { data: updated, error } = await supabase
      .from('music_entities')
      .update(updatePayload)
      .eq('mbid', mbid)
      .select()
      .single();

    if (!error && updated) {
      return updated;
    }
  } catch (err) {
    console.warn('saveGrooveLinksForEntity error:', err?.message);
  }
  return null;
}

/**
 * Ensure an entity exists in music_entities with full details, correct year, and groovelinks.
 */
export async function ensureMusicEntity({
  mbid,
  type = 'album',
  title,
  artist,
  year,
  cover_art_url,
  groovelink = {},
}) {
  if (!mbid) return null;

  const entity = await getOrFetchMusicEntity(mbid, type, {
    title,
    artist,
    year,
    cover_art_url,
    groovelink,
  });

  if (entity && Object.keys(groovelink).length > 0) {
    await saveGrooveLinksForEntity(mbid, groovelink, {
      year: Number.isInteger(year) ? year : undefined,
      cover_art_url,
    });
  }

  return entity;
}

/**
 * Fetch community rating summary for an entity (average score & number of ratings)
 */
export async function getEntityRatingsSummary(entityIdOrMbid) {
  if (!isSupabaseServerConfigured()) {
    return { total_ratings: 0, avg_stars: null, avg_score: null };
  }

  try {
    const supabase = await createClient();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      entityIdOrMbid
    );

    let query = supabase.from('entity_ratings_summary').select('*');
    if (isUuid) {
      query = query.eq('entity_id', entityIdOrMbid);
    } else {
      query = query.eq('mbid', entityIdOrMbid);
    }

    const { data, error } = await query.maybeSingle();
    if (!error && data) {
      return data;
    }
  } catch (err) {
    console.warn('Failed to query entity rating summary:', err?.message);
  }

  return { total_ratings: 0, avg_stars: null, avg_score: null };
}
