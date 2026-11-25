// src/Components/EntityReviewsSection.jsx
"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Star,
  Award,
  MessageSquare,
  Calendar,
  PenTool,
  ArrowUpDown,
  User,
  CheckCircle2,
  Filter,
} from "lucide-react";
import { buildJournalEditorHref } from "@/lib/journalLinks";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";

export default function EntityReviewsSection({
  mbid,
  type = "album", // 'album' | 'artist' | 'track'
  title = "",
  subtitle = "",
  image = "",
  year = null,
  musicbrainzRating = null,
  initialSummary = null,
  initialReviews = null,
  className = "",
}) {
  const pathname = usePathname();
  const { user, profile: authProfile } = useSupabaseAuth();
  const [sortBy, setSortBy] = useState("recent"); // 'recent' | 'highest'
  const [filterMode, setFilterMode] = useState("all"); // 'all' | 'reviews' | 'ratings'
  const [summary, setSummary] = useState(
    initialSummary || {
      total_ratings: 0,
      total_reviews: 0,
      total_ratings_only: 0,
      total_activity: 0,
      avg_stars: null,
      avg_score: null,
      normalized_score_100: null,
      avg_rating_10: null,
    }
  );
  const [reviews, setReviews] = useState(Array.isArray(initialReviews) ? initialReviews : []);
  const [loading, setLoading] = useState(!initialSummary && !initialReviews);

  const fetchReviews = useCallback(
    async (sortMode = sortBy) => {
      if (!mbid) return;
      try {
        const res = await fetch(
          `/api/entity/${encodeURIComponent(mbid)}/reviews?sort=${encodeURIComponent(sortMode)}`,
          { cache: "no-store" }
        );
        if (res.ok) {
          const data = await res.json();
          if (data?.summary) setSummary(data.summary);
          if (Array.isArray(data?.reviews)) setReviews(data.reviews);
        }
      } catch (_) {
      } finally {
        setLoading(false);
      }
    },
    [mbid, sortBy]
  );

  useEffect(() => {
    if (!mbid) return;
    let active = true;
    fetch(
      `/api/entity/${encodeURIComponent(mbid)}/reviews?sort=${encodeURIComponent(sortBy)}`,
      { cache: "no-store" }
    )
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active || !data) return;
        if (data?.summary) setSummary(data.summary);
        if (Array.isArray(data?.reviews)) setReviews(data.reviews);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [mbid, sortBy]);

  useEffect(() => {
    const handleSync = (e) => {
      if (!e?.detail?.targetId || e.detail.targetId === mbid || e.detail?.id === mbid) {
        fetchReviews(sortBy);
      }
    };
    window.addEventListener("groove-journal-updated", handleSync);
    window.addEventListener("groove-rating-changed", handleSync);
    return () => {
      window.removeEventListener("groove-journal-updated", handleSync);
      window.removeEventListener("groove-rating-changed", handleSync);
    };
  }, [mbid, sortBy, fetchReviews]);

  // Combine server reviews with instant local storage activity for zero-latency response
  const mergedReviews = useMemo(() => {
    let list = [...reviews];
    if (typeof window === "undefined" || !mbid) return list;

    try {
      // Check local user rating
      const rawLocalRating = localStorage.getItem(`groove_user_rating_${type}_${mbid}`);
      let localScore = 0;
      let localSystem = "stars";
      if (rawLocalRating) {
        const parsed = JSON.parse(rawLocalRating);
        localScore = typeof parsed === "number" ? parsed : (parsed?.score || 0);
        localSystem = parsed?.system || "stars";
      }

      // Check local journal log
      const rawLocalJournal = localStorage.getItem("groove_journal_logs");
      let localLog = null;
      if (rawLocalJournal) {
        const logs = JSON.parse(rawLocalJournal);
        localLog = logs.find((l) => l.targetId === mbid && l.targetType === type) || null;
      }

      const activeLocalScore = localLog?.rating || localScore || null;
      const activeLocalReview = localLog?.review || localLog?.entry_text || null;
      const currentUserId = user?.id || "guest";
      const currentUsername =
        authProfile?.username ||
        (user?.email ? user.email.split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g, "") : "") ||
        localStorage.getItem("userName")?.toLowerCase().replace(/[^a-z0-9_]/g, "") ||
        "";
      const currentDisplayName =
        authProfile?.display_name ||
        authProfile?.username ||
        localStorage.getItem("userName") ||
        "You";
      const currentAvatar =
        authProfile?.avatar_url ||
        localStorage.getItem("userAvatar") ||
        `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(currentUsername || "listener")}`;

      const alreadyInList = list.some(
        (r) => (user?.id && r.userId === user.id) || (currentUsername && r.username === currentUsername)
      );

      if (!alreadyInList && (activeLocalScore || activeLocalReview)) {
        list.unshift({
          id: `local_${Date.now()}`,
          userId: currentUserId,
          username: currentUsername,
          displayName: currentDisplayName,
          avatarUrl: currentAvatar,
          rating: activeLocalScore ? Number(activeLocalScore) : null,
          numericalScore: localLog?.numericalScore || (activeLocalScore ? activeLocalScore * 10 : null),
          ratingSystem: localLog?.ratingSystem || localSystem,
          reviewText: activeLocalReview ? activeLocalReview.trim() : null,
          hasReview: Boolean(activeLocalReview && activeLocalReview.trim()),
          mood: localLog?.mood || null,
          listenedDate: localLog?.date || new Date().toISOString().split("T")[0],
          createdAt: localLog?.createdAt || new Date().toISOString(),
          isCurrentUser: true,
        });
      }
    } catch (_) {}

    return list;
  }, [reviews, mbid, type, user, authProfile]);

  // Filter items based on active tab
  const filteredItems = useMemo(() => {
    let result = mergedReviews;
    if (filterMode === "reviews") {
      result = result.filter((item) => item.hasReview && item.reviewText);
    } else if (filterMode === "ratings") {
      result = result.filter((item) => item.rating !== null && !item.hasReview);
    }

    if (sortBy === "highest") {
      return [...result].sort((a, b) => {
        const diff = (b.rating || 0) - (a.rating || 0);
        if (diff !== 0) return diff;
        return new Date(b.listenedDate || b.createdAt).getTime() - new Date(a.listenedDate || a.createdAt).getTime();
      });
    }

    return [...result].sort((a, b) => {
      const dateDiff =
        new Date(b.listenedDate || b.createdAt).getTime() -
        new Date(a.listenedDate || a.createdAt).getTime();
      if (dateDiff !== 0) return dateDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [mergedReviews, filterMode, sortBy]);

  // Counts for tabs
  const totalCount = mergedReviews.length;
  const reviewsCount = mergedReviews.filter((r) => r.hasReview && r.reviewText).length;
  const ratingsOnlyCount = mergedReviews.filter((r) => r.rating !== null && !r.hasReview).length;
  const totalRatingsCount = mergedReviews.filter((r) => r.rating !== null).length;

  // MusicBrainz community rating if available
  const rawMb =
    musicbrainzRating?.value !== undefined
      ? Number(musicbrainzRating.value)
      : typeof musicbrainzRating === "number"
      ? musicbrainzRating
      : null;
  const mbVotes = musicbrainzRating?.votesCount || musicbrainzRating?.votes_count || null;
  const mbScore10 =
    rawMb !== null && rawMb > 0
      ? rawMb <= 5
        ? (rawMb * 2).toFixed(1)
        : rawMb.toFixed(1)
      : null;

  // Calculate live average if summary is missing
  const ratedItems = mergedReviews.filter((r) => r.rating !== null && r.rating > 0);
  const liveAvg =
    ratedItems.length > 0
      ? (ratedItems.reduce((acc, r) => acc + r.rating, 0) / ratedItems.length).toFixed(1)
      : null;

  const avgRatingDisplay =
    summary?.avg_rating_10 !== null && summary?.avg_rating_10 !== undefined
      ? Number(summary.avg_rating_10).toFixed(1)
      : summary?.normalized_score_100 !== null && summary?.normalized_score_100 !== undefined
      ? (Number(summary.normalized_score_100) / 10).toFixed(1)
      : liveAvg;

  const displayTotalRatings = Math.max(Number(summary?.total_ratings || 0), totalRatingsCount);

  const editorHref = buildJournalEditorHref({
    mbid,
    type,
    title,
    subtitle,
    image,
    year,
    returnTo: pathname || `/${type}/${mbid}`,
  });

  return (
    <section className={`space-y-7 animate-fade-in ${className}`}>
      {/* Header + Write Review CTA */}
      <div className="flex items-center justify-between flex-wrap gap-3 border-b border-[var(--theme-border)]/50 pb-3.5">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[var(--theme-accent)] uppercase tracking-widest">
            <MessageSquare size={14} />
            <span>Community Ratings &amp; Reviews</span>
          </div>
          <h2 className="text-2xl font-black text-[var(--theme-fg)] tracking-tight font-display mt-0.5">
            Public Ratings &amp; Reviews
          </h2>
          <p className="text-xs text-[var(--theme-muted)] mt-1">
            Ratings on GrooveEstrella are always public. Anyone who rated or reviewed appears below.
          </p>
        </div>

        <Link
          href={editorHref}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 hover:opacity-95 text-zinc-950 text-xs font-black transition shadow-md active:scale-95"
        >
          <PenTool size={13} />
          <span>{type === "artist" ? "Rate & Review Artist" : "Rate & Write Review"}</span>
        </Link>
      </div>

      {/* Public Ratings Overview (Always Public) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* GrooveEstrella Community Score */}
        <div className="p-5 rounded-2xl bg-[var(--theme-card)]/70 border border-amber-400/25 space-y-2 shadow-sm">
          <div className="flex items-center gap-2 text-amber-300 text-xs font-bold uppercase tracking-wider">
            <Star size={14} fill="currentColor" />
            <span>GrooveEstrella Community Score</span>
          </div>

          {displayTotalRatings > 0 && avgRatingDisplay ? (
            <div className="flex items-baseline justify-between gap-3 flex-wrap">
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl sm:text-4xl font-black text-[var(--theme-fg)] font-display">
                  {avgRatingDisplay}
                </span>
                <span className="text-sm font-bold text-[var(--theme-muted)]">/ 10</span>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-[var(--theme-fg)] block">
                  {displayTotalRatings} {displayTotalRatings === 1 ? "public rating" : "public ratings"}
                </span>
                <span className="text-[11px] text-[var(--theme-muted)]">
                  {reviewsCount} written {reviewsCount === 1 ? "review" : "reviews"} · {ratingsOnlyCount} ratings only
                </span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-[var(--theme-muted)]">
              No community ratings yet. Be the first to rate this {type}.
            </p>
          )}
        </div>

        {/* MusicBrainz Open Registry Rating */}
        <div className="p-5 rounded-2xl bg-[var(--theme-card)]/50 border border-[var(--theme-border)]/70 space-y-2 shadow-sm">
          <div className="flex items-center gap-2 text-purple-400 text-xs font-bold uppercase tracking-wider">
            <Award size={14} />
            <span>MusicBrainz Open Registry</span>
          </div>

          {mbScore10 !== null && Number(mbScore10) > 0 ? (
            <div className="flex items-baseline justify-between gap-3 flex-wrap">
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl sm:text-4xl font-black text-[var(--theme-fg)] font-display">
                  {mbScore10}
                </span>
                <span className="text-sm font-bold text-[var(--theme-muted)]">/ 10</span>
              </div>
              <span className="text-xs font-semibold text-[var(--theme-muted)]">
                {mbVotes ? `${mbVotes} catalog votes` : "Verified open registry"}
              </span>
            </div>
          ) : (
            <p className="text-xs text-[var(--theme-muted)]">
              No open registry votes recorded on MusicBrainz yet.
            </p>
          )}
        </div>
      </div>

      {/* Filter Tabs & Sort Controls */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap border-b border-[var(--theme-border)]/40 pb-3">
          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setFilterMode("all")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                filterMode === "all"
                  ? "bg-amber-400 text-zinc-950 shadow-sm"
                  : "bg-[var(--theme-surface)] text-[var(--theme-muted)] hover:text-[var(--theme-fg)] border border-[var(--theme-border)]"
              }`}
            >
              <span>All Activity</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                filterMode === "all" ? "bg-black/20 text-zinc-950 font-black" : "bg-white/5 text-[var(--theme-muted)]"
              }`}>
                {totalCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFilterMode("reviews")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                filterMode === "reviews"
                  ? "bg-amber-400 text-zinc-950 shadow-sm"
                  : "bg-[var(--theme-surface)] text-[var(--theme-muted)] hover:text-[var(--theme-fg)] border border-[var(--theme-border)]"
              }`}
            >
              <span>Reviews</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                filterMode === "reviews" ? "bg-black/20 text-zinc-950 font-black" : "bg-white/5 text-[var(--theme-muted)]"
              }`}>
                {reviewsCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFilterMode("ratings")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                filterMode === "ratings"
                  ? "bg-amber-400 text-zinc-950 shadow-sm"
                  : "bg-[var(--theme-surface)] text-[var(--theme-muted)] hover:text-[var(--theme-fg)] border border-[var(--theme-border)]"
              }`}
            >
              <span>Ratings Only</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                filterMode === "ratings" ? "bg-black/20 text-zinc-950 font-black" : "bg-white/5 text-[var(--theme-muted)]"
              }`}>
                {ratingsOnlyCount}
              </span>
            </button>
          </div>

          {/* Sort Switcher */}
          {filteredItems.length > 1 && (
            <div className="inline-flex items-center gap-1 p-1 rounded-full bg-[var(--theme-surface)] border border-[var(--theme-border)]">
              <ArrowUpDown size={12} className="text-[var(--theme-muted)] ml-2 mr-1" />
              <button
                type="button"
                onClick={() => setSortBy("recent")}
                className={`px-3 py-1 rounded-full text-[11px] font-bold transition cursor-pointer ${
                  sortBy === "recent"
                    ? "bg-[var(--theme-accent)] text-[var(--theme-accent-fg)] shadow-xs"
                    : "text-[var(--theme-muted)] hover:text-[var(--theme-fg)]"
                }`}
              >
                Most Recent
              </button>
              <button
                type="button"
                onClick={() => setSortBy("highest")}
                className={`px-3 py-1 rounded-full text-[11px] font-bold transition cursor-pointer ${
                  sortBy === "highest"
                    ? "bg-[var(--theme-accent)] text-[var(--theme-accent-fg)] shadow-xs"
                    : "text-[var(--theme-muted)] hover:text-[var(--theme-fg)]"
                }`}
              >
                Highest Rated
              </button>
            </div>
          )}
        </div>

        {/* Reviews and Ratings Cards List */}
        {loading ? (
          <div className="py-8 text-center text-xs text-[var(--theme-muted)] animate-pulse">
            Loading community ratings &amp; reviews...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-8 rounded-3xl bg-[var(--theme-card)]/40 border border-[var(--theme-border)]/70 text-center space-y-3">
            <p className="text-sm font-bold text-[var(--theme-fg)]">
              {filterMode === "reviews"
                ? "No written reviews yet"
                : filterMode === "ratings"
                ? "No rating-only entries yet"
                : "No public ratings or reviews yet"}
            </p>
            <p className="text-xs text-[var(--theme-muted)] max-w-md mx-auto leading-relaxed">
              {filterMode === "reviews"
                ? "Be the first to share your written review and thoughts for this " + type + "."
                : "Rate this " + type + " to add your score to the public community rating."}
            </p>
            <Link
              href={editorHref}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[var(--theme-surface)] hover:bg-[var(--theme-card)] border border-[var(--theme-border)] hover:border-amber-400/50 text-xs font-bold text-[var(--theme-fg)] transition cursor-pointer"
            >
              <PenTool size={12} className="text-amber-300" />
              <span>{type === "artist" ? "Rate artist" : "Rate or write a review"}</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-3.5">
            {filteredItems.map((rev) => {
              const formattedDate = rev.listenedDate || rev.createdAt
                ? new Date(rev.listenedDate || rev.createdAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "";

              const profileHref = rev.username
                ? `/profile/${encodeURIComponent(rev.username)}`
                : rev.userId && rev.userId !== "guest"
                ? `/profile/${encodeURIComponent(rev.userId)}`
                : null;

              const hasReviewText = Boolean(rev.hasReview && rev.reviewText && rev.reviewText.trim());

              return (
                <article
                  key={rev.id || `${rev.userId}-${rev.createdAt}`}
                  className="p-4 sm:p-5 rounded-3xl bg-[var(--theme-card)]/75 border border-[var(--theme-border)]/80 hover:border-amber-400/35 transition-all space-y-3 shadow-sm"
                >
                  {/* Top Row: User Avatar + Name (with Tap Link to Profile) & Rating + Date */}
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Avatar: Tapping navigates to Profile */}
                      {profileHref ? (
                        <Link
                          href={profileHref}
                          className="shrink-0 group block cursor-pointer"
                          title={`View ${rev.displayName}'s profile`}
                        >
                          <img
                            src={rev.avatarUrl}
                            alt={rev.displayName}
                            className="w-10 h-10 rounded-full object-cover border border-white/15 bg-black/30 group-hover:scale-105 group-hover:border-amber-400 transition-all"
                            onError={(e) => {
                              e.currentTarget.src = `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(
                                rev.username || rev.userId || "listener"
                              )}`;
                            }}
                          />
                        </Link>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[var(--theme-surface)] border border-[var(--theme-border)] flex items-center justify-center shrink-0">
                          <User size={16} className="text-[var(--theme-muted)]" />
                        </div>
                      )}

                      {/* Name & Handle: Tapping navigates to Profile */}
                      <div className="min-w-0">
                        {profileHref ? (
                          <Link
                            href={profileHref}
                            className="text-sm font-black text-[var(--theme-fg)] hover:text-amber-300 transition-colors truncate block group cursor-pointer"
                            title={`View ${rev.displayName}'s profile`}
                          >
                            <span className="group-hover:underline">{rev.displayName}</span>
                            {rev.isCurrentUser && (
                              <span className="ml-1.5 text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                                You
                              </span>
                            )}
                          </Link>
                        ) : (
                          <span className="text-sm font-black text-[var(--theme-fg)] truncate block">
                            {rev.displayName}
                            {rev.isCurrentUser && (
                              <span className="ml-1.5 text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                                You
                              </span>
                            )}
                          </span>
                        )}

                        <div className="flex items-center gap-1.5 text-[11px] text-[var(--theme-muted)] truncate">
                          {profileHref && rev.username ? (
                            <Link
                              href={profileHref}
                              className="hover:text-amber-300 transition truncate cursor-pointer"
                            >
                              @{rev.username}
                            </Link>
                          ) : rev.username ? (
                            <span className="truncate">@{rev.username}</span>
                          ) : null}

                          {rev.username && formattedDate && <span>·</span>}
                          {formattedDate && (
                            <span className="inline-flex items-center gap-1 shrink-0">
                              <Calendar size={10} />
                              <span>{formattedDate}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right side: Mood Tag + Golden Rating Badge */}
                    <div className="flex items-center gap-2 shrink-0">
                      {rev.mood && (
                        <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-[var(--theme-surface)] border border-[var(--theme-border)] text-[var(--theme-muted)] hidden sm:inline-flex">
                          {rev.mood}
                        </span>
                      )}

                      {rev.rating !== null && rev.rating > 0 && (
                        <div
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/15 border border-amber-400/35 text-amber-300 text-xs font-black shadow-xs"
                          title={`Score: ${rev.rating}/10`}
                        >
                          <Star size={13} fill="currentColor" className="text-amber-400" />
                          <span>{rev.rating}/10</span>
                          {rev.rating === 10 && <span className="text-xs">👑</span>}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Review Text: Only rendered when user wrote a review */}
                  {hasReviewText ? (
                    <div className="pt-1 border-t border-[var(--theme-border)]/40">
                      <p className="text-sm sm:text-[14px] leading-relaxed text-[var(--theme-fg)]/95 whitespace-pre-line font-body">
                        {rev.reviewText}
                      </p>
                    </div>
                  ) : (
                    /* If there is no review, only show the rating! (No review text) */
                    null
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
