// src/lib/supabase/musicEntities.js
import { createClient, createAdminClient, isSupabaseServerConfigured } from './server';
import {
  fetchMusicBrainzAlbumServer,
  fetchMusicBrainzArtistServer,
  fetchMusicBrainzTrackServer
} from '@/lib/musicbrainzServer';

/**
 * Get or fetch music entity by MBID from Supabase cache, fallback to MusicBrainz.
 * Respects MusicBrainz rate limits by persisting entities in PostgreSQL.
 */
export async function getOrFetchMusicEntity(mbid, typeHint = 'album') {
  if (!mbid) return null;

  const isConfigured = isSupabaseServerConfigured();

  if (isConfigured) {
    try {
      const supabase = await createClient();
      const { data: cachedEntity, error } = await supabase
        .from('music_entities')
        .select('*')
        .eq('mbid', mbid)
        .maybeSingle();

      if (!error && cachedEntity) {
        return cachedEntity;
      }
    } catch (err) {
      console.warn('Supabase cache lookup failed, falling back to MusicBrainz API:', err?.message);
    }
  }

  // Not cached or Supabase lookup failed -> Fetch from MusicBrainz
  let mbData = null;
  let resolvedType = typeHint;
  let title = 'Untitled';
  let artistCredit = 'Unknown Artist';
  let year = null;
  let coverArtUrl = null;

  try {
    if (typeHint === 'artist') {
      mbData = await fetchMusicBrainzArtistServer(mbid);
      if (mbData) {
        title = mbData.name || mbData.title || 'Unknown Artist';
        artistCredit = mbData.name || 'Unknown Artist';
        coverArtUrl = mbData.image || mbData.coverArt || null;
        year = mbData.lifeSpan?.begin ? parseInt(mbData.lifeSpan.begin.slice(0, 4), 10) : null;
      }
    } else if (typeHint === 'track') {
      mbData = await fetchMusicBrainzTrackServer(mbid);
      if (mbData) {
        title = mbData.title || mbData.name || 'Untitled Track';
        artistCredit = mbData.artist || mbData.artistName || 'Unknown Artist';
        coverArtUrl = mbData.albumCover || mbData.coverArt || null;
        year = mbData.year ? parseInt(String(mbData.year), 10) : null;
      }
    } else {
      // Default to album / release-group
      mbData = await fetchMusicBrainzAlbumServer(mbid);
      if (mbData) {
        resolvedType = 'album';
        title = mbData.title || mbData.name || 'Untitled Album';
        artistCredit = mbData.artist || (Array.isArray(mbData.artists) ? mbData.artists.map(a => a.name).join(', ') : 'Unknown Artist');
        coverArtUrl = mbData.coverArt || (mbData.images?.[0]?.url) || null;
        year = mbData.releaseDate ? parseInt(String(mbData.releaseDate).slice(0, 4), 10) : null;
      }
    }
  } catch (err) {
    console.error(`Failed to fetch ${typeHint} MBID ${mbid} from MusicBrainz:`, err);
    return null;
  }

  if (!mbData) {
    return null;
  }

  const newEntity = {
    mbid,
    type: resolvedType,
    title,
    artist_credit: artistCredit,
    year: Number.isInteger(year) ? year : null,
    cover_art_url: coverArtUrl,
    data: mbData,
  };

  // Cache in Supabase if configured
  if (isConfigured) {
    try {
      const adminClient = createAdminClient();
      const client = adminClient || (await createClient());

      const { data: inserted, error: insertError } = await client
        .from('music_entities')
        .upsert(newEntity, { onConflict: 'mbid' })
        .select()
        .single();

      if (!insertError && inserted) {
        return inserted;
      }
    } catch (saveErr) {
      console.warn('Could not cache music entity to Supabase:', saveErr?.message);
    }
  }

  // Return entity object even if database write was skipped
  return {
    id: `local_${mbid}`,
    ...newEntity,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
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
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(entityIdOrMbid);

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
