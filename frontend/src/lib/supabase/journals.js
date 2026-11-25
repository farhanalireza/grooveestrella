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
        .select(`
          id,
          user_id,
          score,
          rating_type,
          review,
          listened_date,
          created_at,
          profiles (
            id,
            username,
            display_name,
            avatar_url
          )
        `)
        .eq('entity_id', entity.id)
        .order('created_at', { ascending: false }),
    ]);

    // Gather any missing profiles in bulk
    const userIdsToFetch = new Set();
    for (const r of ratingsRes?.data || []) {
      if (r.user_id && !r.profiles?.username) userIdsToFetch.add(r.user_id);
    }
    for (const j of journalsRes?.data || []) {
      if (j.user_id && !j.profiles?.username) userIdsToFetch.add(j.user_id);
    }

    const fetchedProfilesMap = new Map();
    if (userIdsToFetch.size > 0) {
      try {
        const { data: profs } = await supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url')
          .in('id', Array.from(userIdsToFetch));
        for (const p of profs || []) {
          fetchedProfilesMap.set(p.id, p);
        }
      } catch (_) {}
    }

    const resolveProfile = (userId, embeddedProfile) => {
      const prof = embeddedProfile || fetchedProfilesMap.get(userId) || null;
      const username = prof?.username || '';
      const displayName = prof?.display_name || username || 'Groove Listener';
      const avatarUrl =
        prof?.avatar_url ||
        `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(username || userId || 'listener')}`;
      return { username, displayName, avatarUrl };
    };

    // User activity map: holds unified record per user
    const userActivityMap = new Map();

    // 1. Process all public ratings (ratings are ALWAYS public)
    for (const r of ratingsRes?.data || []) {
      const ratingSystem = r.rating_type || 'stars';
      const rawScore = r.score !== null && r.score !== undefined ? Number(r.score) : null;
      const normalizedScore = rawScore !== null ? normalizeToTenScale(rawScore, ratingSystem) : null;
      const reviewText = typeof r.review === 'string' && r.review.trim() ? r.review.trim() : null;
      const { username, displayName, avatarUrl } = resolveProfile(r.user_id, r.profiles);

      const item = {
        id: `rating_${r.id}`,
        ratingId: r.id,
        journalId: null,
        userId: r.user_id,
        username,
        displayName,
        avatarUrl,
        rating: normalizedScore,
        numericalScore: rawScore,
        ratingSystem,
        reviewText,
        hasReview: Boolean(reviewText),
        mood: null,
        listenedDate: r.listened_date || null,
        createdAt: r.created_at,
        type: reviewText ? 'review_and_rating' : 'rating_only',
      };

      const existing = userActivityMap.get(r.user_id);
      if (!existing || r.rating_type === 'stars') {
        userActivityMap.set(r.user_id, item);
      }
    }

    // 2. Process all public journal entries (merging with existing ratings if present)
    for (const j of journalsRes?.data || []) {
      if (!j.is_public) continue;
      const journalText = typeof j.entry_text === 'string' && j.entry_text.trim() ? j.entry_text.trim() : null;
      const { username, displayName, avatarUrl } = resolveProfile(j.user_id, j.profiles);

      const linkedRating = j.user_ratings;
      const rawScore = linkedRating?.score !== null && linkedRating?.score !== undefined ? Number(linkedRating.score) : null;
      const ratingSystem = linkedRating?.rating_type || 'stars';
      const normalizedScore = rawScore !== null ? normalizeToTenScale(rawScore, ratingSystem) : null;

      const existing = userActivityMap.get(j.user_id);
      if (existing) {
        existing.journalId = j.id;
        if (journalText) {
          existing.reviewText = journalText;
          existing.hasReview = true;
          existing.type = existing.rating !== null ? 'review_and_rating' : 'review_only';
        }
        if (j.mood) existing.mood = j.mood;
        if (j.listened_date) existing.listenedDate = j.listened_date;
        if (existing.rating === null && normalizedScore !== null) {
          existing.rating = normalizedScore;
          existing.numericalScore = rawScore;
          existing.ratingSystem = ratingSystem;
        }
        if (!existing.username && username) {
          existing.username = username;
          existing.displayName = displayName;
          existing.avatarUrl = avatarUrl;
        }
      } else {
        userActivityMap.set(j.user_id, {
          id: `journal_${j.id}`,
          ratingId: j.rating_id || null,
          journalId: j.id,
          userId: j.user_id,
          username,
          displayName,
          avatarUrl,
          rating: normalizedScore,
          numericalScore: rawScore,
          ratingSystem,
          reviewText: journalText,
          hasReview: Boolean(journalText),
          mood: j.mood || null,
          listenedDate: j.listened_date || null,
          createdAt: j.created_at,
          type: journalText ? (normalizedScore ? 'review_and_rating' : 'review_only') : 'rating_only',
        });
      }
    }

    const reviews = Array.from(userActivityMap.values());

    // Calculate live averages and counts from all public ratings
    const validRatings = reviews.filter((r) => r.rating !== null && r.rating > 0);
    const calculatedAvg =
      validRatings.length > 0
        ? Number((validRatings.reduce((sum, r) => sum + r.rating, 0) / validRatings.length).toFixed(1))
        : null;

    const rawSummary = summaryRes?.data;
    const totalRatings = Math.max(Number(rawSummary?.total_ratings || 0), validRatings.length);
    const normalized100 =
      rawSummary?.normalized_score_100 !== null && rawSummary?.normalized_score_100 !== undefined
        ? Number(rawSummary.normalized_score_100)
        : calculatedAvg !== null
        ? Number((calculatedAvg * 10).toFixed(1))
        : null;

    const avgRating10 =
      rawSummary?.avg_stars !== null && rawSummary?.avg_stars !== undefined
        ? Number(rawSummary.avg_stars)
        : calculatedAvg !== null
        ? calculatedAvg
        : normalized100 !== null
        ? Number((normalized100 / 10).toFixed(1))
        : null;

    const totalReviews = reviews.filter((r) => r.hasReview).length;
    const totalRatingsOnly = reviews.filter((r) => r.rating !== null && !r.hasReview).length;

    return {
      summary: {
        total_ratings: totalRatings,
        total_reviews: totalReviews,
        total_ratings_only: totalRatingsOnly,
        total_activity: reviews.length,
        avg_stars: rawSummary?.avg_stars !== null && rawSummary?.avg_stars !== undefined ? Number(rawSummary.avg_stars) : calculatedAvg,
        avg_score: rawSummary?.avg_score !== null && rawSummary?.avg_score !== undefined ? Number(rawSummary.avg_score) : null,
        normalized_score_100: normalized100,
        avg_rating_10: avgRating10,
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
