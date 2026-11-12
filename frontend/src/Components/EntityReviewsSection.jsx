// src/Components/EntityReviewsSection.jsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
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
} from "lucide-react";
import { buildJournalEditorHref } from "@/lib/journalLinks";

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
  const [sortBy, setSortBy] = useState("recent"); // 'recent' | 'highest'
  const [summary, setSummary] = useState(
    initialSummary || {
      total_ratings: 0,
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
      if (!e?.detail?.targetId || e.detail.targetId === mbid) {
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

  // Parse MusicBrainz community rating if available
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

  const avgRatingDisplay =
    summary?.avg_rating_10 !== null && summary?.avg_rating_10 !== undefined
      ? Number(summary.avg_rating_10).toFixed(1)
      : summary?.normalized_score_100 !== null && summary?.normalized_score_100 !== undefined
      ? (Number(summary.normalized_score_100) / 10).toFixed(1)
      : null;

  const totalRatings = Number(summary?.total_ratings || 0);

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
            Ratings &amp; Public Reviews
          </h2>
        </div>

        <Link
          href={editorHref}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 hover:opacity-95 text-zinc-950 text-xs font-black transition shadow-md active:scale-95"
        >
          <PenTool size={13} />
          <span>Rate &amp; Write Review</span>
        </Link>
      </div>

      {/* Public Ratings Overview (Always Public) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* GrooveEstrella Community Score */}
        <div className="p-5 rounded-2xl bg-[var(--theme-card)]/70 border border-amber-400/25 space-y-2">
          <div className="flex items-center gap-2 text-amber-300 text-xs font-bold uppercase tracking-wider">
            <Star size={14} fill="currentColor" />
            <span>GrooveEstrella Rating</span>
          </div>

          {totalRatings > 0 && avgRatingDisplay ? (
            <div className="flex items-baseline justify-between gap-3 flex-wrap">
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl sm:text-4xl font-black text-[var(--theme-fg)] font-display">
                  {avgRatingDisplay}
                </span>
                <span className="text-sm font-bold text-[var(--theme-muted)]">/ 10</span>
              </div>
              <span className="text-xs font-semibold text-[var(--theme-muted)]">
                Based on {totalRatings} {totalRatings === 1 ? "public rating" : "public ratings"}
              </span>
            </div>
          ) : (
            <p className="text-xs text-[var(--theme-muted)]">
              No community ratings yet. Be the first to rate this {type}.
            </p>
          )}
        </div>

        {/* MusicBrainz Open Registry Rating */}
        <div className="p-5 rounded-2xl bg-[var(--theme-card)]/50 border border-[var(--theme-border)]/70 space-y-2">
          <div className="flex items-center gap-2 text-purple-400 text-xs font-bold uppercase tracking-wider">
            <Award size={14} />
            <span>MusicBrainz Registry</span>
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

      {/* Public Reviews Header + Sort Toggle */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--theme-muted)]">
            Public Reviews ({reviews.length})
          </h3>

          {reviews.length > 1 && (
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

        {/* Reviews List */}
        {loading ? (
          <div className="py-8 text-center text-xs text-[var(--theme-muted)] animate-pulse">
            Loading community reviews...
          </div>
        ) : reviews.length === 0 ? (
          <div className="p-8 rounded-3xl bg-[var(--theme-card)]/40 border border-[var(--theme-border)]/70 text-center space-y-3">
            <p className="text-sm font-bold text-[var(--theme-fg)]">No public reviews yet</p>
            <p className="text-xs text-[var(--theme-muted)] max-w-md mx-auto leading-relaxed">
              Public music journal entries for this {type} appear here as reviews. Share your perspective in your Music Journal.
            </p>
            <Link
              href={editorHref}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[var(--theme-surface)] hover:bg-[var(--theme-card)] border border-[var(--theme-border)] hover:border-amber-400/50 text-xs font-bold text-[var(--theme-fg)] transition"
            >
              <PenTool size={12} className="text-amber-300" />
              <span>Write the first review</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((rev) => {
              const formattedDate = rev.listenedDate || rev.createdAt
                ? new Date(rev.listenedDate || rev.createdAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "";

              const profileHref = rev.username ? `/profile/${rev.username}` : null;

              return (
                <article
                  key={rev.id}
                  className="p-5 sm:p-6 rounded-3xl bg-[var(--theme-card)]/70 border border-[var(--theme-border)]/80 space-y-3.5 shadow-md"
                >
                  {/* Review Card Top: User Avatar + Name (left) & Rating + Date (right) */}
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3 min-w-0">
                      {profileHref ? (
                        <Link href={profileHref} className="shrink-0">
                          <img
                            src={rev.avatarUrl}
                            alt={rev.displayName}
                            className="w-10 h-10 rounded-full object-cover border border-white/15 bg-black/30"
                            onError={(e) => {
                              e.currentTarget.src = `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(
                                rev.username || rev.userId
                              )}`;
                            }}
                          />
                        </Link>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[var(--theme-surface)] border border-[var(--theme-border)] flex items-center justify-center shrink-0">
                          <User size={16} className="text-[var(--theme-muted)]" />
                        </div>
                      )}

                      <div className="min-w-0">
                        {profileHref ? (
                          <Link
                            href={profileHref}
                            className="text-sm font-bold text-[var(--theme-fg)] hover:text-amber-300 transition truncate block"
                          >
                            {rev.displayName}
                          </Link>
                        ) : (
                          <span className="text-sm font-bold text-[var(--theme-fg)] truncate block">
                            {rev.displayName}
                          </span>
                        )}
                        <div className="flex items-center gap-2 text-[11px] text-[var(--theme-muted)]">
                          {rev.username && <span>@{rev.username}</span>}
                          {rev.username && formattedDate && <span>·</span>}
                          {formattedDate && (
                            <span className="inline-flex items-center gap-1">
                              <Calendar size={10} />
                              <span>{formattedDate}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {rev.mood && (
                        <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-[var(--theme-surface)] border border-[var(--theme-border)] text-[var(--theme-muted)] hidden sm:inline-flex">
                          {rev.mood}
                        </span>
                      )}

                      {rev.rating !== null && rev.rating > 0 && (
                        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-400/15 border border-amber-400/35 text-amber-300 text-xs font-black">
                          <Star size={12} fill="currentColor" className="text-amber-400" />
                          <span>{rev.rating}/10</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Review Text */}
                  <p className="text-sm sm:text-[15px] leading-relaxed text-[var(--theme-fg)]/95 whitespace-pre-line">
                    {rev.reviewText}
                  </p>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
