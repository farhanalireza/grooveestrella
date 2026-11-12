// src/lib/supabase/journals.js
import { getPublicSupabaseClient } from './publicServer';

/**
 * Normalize either a 1-10 star rating or 0-100 score onto a 10-point star value.
 */
export function normalizeToTenScale(score, ratingType = 'stars') {
  const numeric = Number(score);
  if (!Number.isFinite(numeric) || numeric <= 0) return null;
  if (ratingType === 'score') {
    return Number((numeric / 10).toFixed(1));
  }
  return Number(numeric.toFixed(1));
}

/**
 * Fetch public community rating summary (ratings are NEVER private)
 * and public reviews (public journal entries with review text) for an MBID.
 */
export async function getEntityPublicReviewsAndRatings(mbid) {
  const emptyResult = {
    summary: {
      total_ratings: 0,
      avg_stars: null,
      avg_score: null,
      normalized_score_100: null,
      avg_rating_10: null,
    },
    reviews: [],
  };

  if (!mbid) return emptyResult;
  const supabase = getPublicSupabaseClient();
  if (!supabase) return emptyResult;

  try {
    const { data: entity, error: entityErr } = await supabase
      .from('music_entities')
      .select('id, mbid')
      .eq('mbid', mbid)
      .maybeSingle();

    if (entityErr || !entity?.id) {
      return emptyResult;
    }

    const [summaryRes, journalsRes, ratingsRes] = await Promise.all([
      supabase
        .from('entity_ratings_summary')
        .select('*')
        .eq('entity_id', entity.id)
        .maybeSingle(),
      supabase
        .from('journals')
        .select(`
          id,
          user_id,
          entity_id,
          entry_text,
          mood,
          listened_date,
          rating_id,
          is_public,
          created_at,
          updated_at,
          profiles (
            id,
            username,
            display_name,
            avatar_url
          ),
          user_ratings (
            id,
            score,
            rating_type
          )
        `)
        .eq('entity_id', entity.id)
        .eq('is_public', true)
        .order('listened_date', { ascending: false })
        .order('created_at', { ascending: false }),
      supabase
        .from('user_ratings')
        .select('id, user_id, score, rating_type')
        .eq('entity_id', entity.id),
    ]);

    const ratingsByUser = new Map();
    for (const r of ratingsRes?.data || []) {
      const existing = ratingsByUser.get(r.user_id);
      if (!existing || r.rating_type === 'stars') {
        ratingsByUser.set(r.user_id, r);
      }
    }

    const rawSummary = summaryRes?.data;
    const totalRatings = Number(rawSummary?.total_ratings || 0);
    const normalized100 =
      rawSummary?.normalized_score_100 !== null && rawSummary?.normalized_score_100 !== undefined
        ? Number(rawSummary.normalized_score_100)
        : null;

    const avgRating10 =
      rawSummary?.avg_stars !== null && rawSummary?.avg_stars !== undefined
        ? Number(rawSummary.avg_stars)
        : normalized100 !== null
        ? Number((normalized100 / 10).toFixed(1))
        : null;

    const reviews = [];
    for (const j of journalsRes?.data || []) {
      const text = typeof j.entry_text === 'string' ? j.entry_text.trim() : '';
      // Strictly exclude private entries or empty notes from public Reviews list
      if (!j.is_public || !text) continue;

      const linkedRating = j.user_ratings || ratingsByUser.get(j.user_id) || null;
      const ratingSystem = linkedRating?.rating_type || 'stars';
      const rawScore = linkedRating?.score ?? null;
      const normalizedScore10 = rawScore !== null ? normalizeToTenScale(rawScore, ratingSystem) : null;

      reviews.push({
        id: j.id,
        userId: j.user_id,
        username: j.profiles?.username || '',
        displayName: j.profiles?.display_name || j.profiles?.username || 'Groove Listener',
        avatarUrl:
          j.profiles?.avatar_url ||
          `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(j.profiles?.username || j.user_id)}`,
        reviewText: text,
        mood: j.mood || null,
        listenedDate: j.listened_date,
        createdAt: j.created_at,
        rating: normalizedScore10,
        numericalScore: rawScore !== null ? Number(rawScore) : null,
        ratingSystem,
      });
    }

    return {
      summary: {
        total_ratings: totalRatings,
        avg_stars: rawSummary?.avg_stars !== null && rawSummary?.avg_stars !== undefined ? Number(rawSummary.avg_stars) : null,
        avg_score: rawSummary?.avg_score !== null && rawSummary?.avg_score !== undefined ? Number(rawSummary.avg_score) : null,
        normalized_score_100: normalized100,
        avg_rating_10:
          normalized100 !== null
            ? Number((normalized100 / 10).toFixed(1))
            : avgRating10,
      },
      reviews,
    };
  } catch (err) {
    console.warn('getEntityPublicReviewsAndRatings error:', err?.message);
    return emptyResult;
  }
}

/**
 * Fetch all public ratings for a given user ID to calculate their true Avg Rating
 * across all rated entities (since ratings are never private).
 */
export async function getUserPublicAverageRating(userId) {
  if (!userId) return { avgRating: null, totalRatings: 0 };
  const supabase = getPublicSupabaseClient();
  if (!supabase) return { avgRating: null, totalRatings: 0 };

  try {
    const { data, error } = await supabase
      .from('user_ratings')
      .select('entity_id, rating_type, score')
      .eq('user_id', userId);

    if (error || !Array.isArray(data) || data.length === 0) {
      return { avgRating: null, totalRatings: 0 };
    }

    // Deduplicate per entity if a user rated with both scales
    const perEntity = new Map();
    for (const r of data) {
      const normalized = normalizeToTenScale(r.score, r.rating_type);
      if (normalized !== null && (!perEntity.has(r.entity_id) || r.rating_type === 'stars')) {
        perEntity.set(r.entity_id, normalized);
      }
    }

    const values = Array.from(perEntity.values());
    if (values.length === 0) return { avgRating: null, totalRatings: 0 };

    const avg = values.reduce((acc, v) => acc + v, 0) / values.length;
    return {
      avgRating: avg.toFixed(1),
      totalRatings: values.length,
    };
  } catch (_) {
    return { avgRating: null, totalRatings: 0 };
  }
}
