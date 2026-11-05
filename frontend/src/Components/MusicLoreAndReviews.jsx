// src/Components/MusicLoreAndReviews.jsx
"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { 
  Star, ExternalLink, Tag, BookOpen, MessageSquare, 
  Send, Sparkles, CheckCircle2, ChevronDown, ChevronUp, Globe, Award, Trash2
} from "lucide-react";
import { toast } from "@/lib/toast";

export default function MusicLoreAndReviews({
  id,
  type = "track", // track | album | artist
  title = "",
  artist = "",
  description = null,
  primaryGenre = null,
  genres = [],
  categorizedTags = null,
  tags = [],
  allTags = [],
  rating = null,
  externalLinks = [],
  totalDurationMs = null,
}) {
  const [expandedDesc, setExpandedDesc] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewerName, setReviewerName] = useState("");
  const [reviewComment, setReviewComment] = useState("");
  const [reviews, setReviews] = useState([]);
  const [showForm, setShowForm] = useState(false);

  // Storage keys
  const reviewStorageKey = `groove_reviews_${id}`;
  const ratingStorageKey = `groove_user_rating_${type}_${id}`;

  // Load user rating and real stored reviews from localStorage
  const loadStoredData = useCallback(() => {
    if (typeof window === "undefined" || !id) return;
    try {
      // 1. User rating
      const storedRating = localStorage.getItem(ratingStorageKey);
      if (storedRating) {
        const parsed = JSON.parse(storedRating);
        if (typeof parsed === "number") {
          setUserRating(parsed);
        } else if (parsed && typeof parsed.score === "number") {
          setUserRating(parsed.score);
        }
      } else {
        setUserRating(0);
      }

      // 2. Real community reviews (NO fake/dummy seeds)
      const storedReviews = localStorage.getItem(reviewStorageKey);
      if (storedReviews) {
        const parsedRev = JSON.parse(storedReviews);
        if (Array.isArray(parsedRev)) {
          setReviews(parsedRev);
        }
      } else {
        setReviews([]);
      }
    } catch (_) {}
  }, [id, ratingStorageKey, reviewStorageKey]);

  useEffect(() => {
    loadStoredData();

    // Listen for rating changes dispatched from top hero widget
    const handleRatingSync = (e) => {
      if (e.detail?.id === id && e.detail?.type === type) {
        setUserRating(e.detail.score || 0);
      }
    };

    window.addEventListener("groove-rating-changed", handleRatingSync);
    return () => window.removeEventListener("groove-rating-changed", handleRatingSync);
  }, [id, type, loadStoredData]);

  // Handle setting user rating locally
  const handleRateLocally = (score) => {
    const newScore = userRating === score ? 0 : score;
    setUserRating(newScore);

    try {
      if (newScore > 0) {
        localStorage.setItem(ratingStorageKey, JSON.stringify({ score: newScore, updatedAt: Date.now() }));
        toast.success(`You rated this ${type} ${newScore}/5 ⭐`);
      } else {
        localStorage.removeItem(ratingStorageKey);
        toast.info("Rating cleared");
      }
    } catch (_) {}

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("groove-rating-changed", {
          detail: { id, type, score: newScore }
        })
      );
    }
  };

  // Submit a real new user review
  const handleSubmitReview = (e) => {
    e.preventDefault();
    if (!reviewComment.trim()) {
      toast.warning("Please share a brief comment for your review.");
      return;
    }

    const reviewScore = userRating > 0 ? userRating : 5;

    const newReview = {
      id: `usr-${Date.now()}`,
      author: reviewerName.trim() || "Groove Listener",
      score: reviewScore,
      date: new Date().toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }),
      text: reviewComment.trim(),
      verified: false,
    };

    const updated = [newReview, ...reviews];
    setReviews(updated);

    try {
      localStorage.setItem(reviewStorageKey, JSON.stringify(updated));
      // Also sync user rating if not already set
      if (userRating === 0) {
        setUserRating(reviewScore);
        localStorage.setItem(ratingStorageKey, JSON.stringify({ score: reviewScore, updatedAt: Date.now() }));
        window.dispatchEvent(
          new CustomEvent("groove-rating-changed", {
            detail: { id, type, score: reviewScore }
          })
        );
      }
    } catch (_) {}

    setReviewComment("");
    setShowForm(false);
    toast.success("Thank you for sharing your review! ⭐");
  };

  // Delete review
  const handleDeleteReview = (revId) => {
    const updated = reviews.filter((r) => r.id !== revId);
    setReviews(updated);
    try {
      localStorage.setItem(reviewStorageKey, JSON.stringify(updated));
      toast.info("Review removed");
    } catch (_) {}
  };

  // MusicBrainz Rating Data
  const mbScore = rating?.value !== undefined 
    ? Number(rating.value) 
    : typeof rating === "number" 
      ? rating 
      : null;
  const mbVotes = rating?.votesCount || rating?.votes_count || null;

  // Real reviews statistics (computed dynamically from actual reviews)
  const realReviewsCount = reviews.length;
  const realAverageScore = realReviewsCount > 0
    ? (reviews.reduce((acc, r) => acc + (Number(r.score) || 0), 0) / realReviewsCount).toFixed(1)
    : null;

  const realDistribution = useMemo(() => {
    if (realReviewsCount === 0) return null;
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => {
      const s = Math.round(Number(r.score)) || 5;
      if (counts[s] !== undefined) counts[s] += 1;
    });
    return [5, 4, 3, 2, 1].map((s) => ({
      star: String(s),
      count: counts[s],
      pct: Math.round((counts[s] / realReviewsCount) * 100),
    }));
  }, [reviews, realReviewsCount]);

  // Derive categorized sections
  const resolvedCategorized = useMemo(() => {
    if (categorizedTags && (categorizedTags.genres?.length || categorizedTags.styles?.length || categorizedTags.themes?.length || categorizedTags.eras?.length)) {
      return categorizedTags;
    }

    const genreList = Array.isArray(genres) ? genres : [];
    const rawList = (allTags && allTags.length > 0) ? allTags : (tags || []).map((t) => ({ name: t, count: 1 }));

    const genreItems = genreList.map((g) => {
      const name = typeof g === "string" ? g : g?.name;
      const count = (typeof g === "object" && g.count) || null;
      return { name, count };
    }).filter((g) => g.name);

    const styles = [];
    const themes = [];
    const eras = [];
    const others = [];

    const genreNames = new Set(genreItems.map((g) => g.name.toLowerCase()));

    for (const t of rawList) {
      const raw = typeof t === "string" ? t : t?.name;
      if (!raw) continue;
      const clean = raw.trim();
      const lower = clean.toLowerCase();
      const count = (typeof t === "object" && t.count) || null;

      if (genreNames.has(lower)) continue;

      if (/^#?\d{2,4}s?$/i.test(clean) || /^\d{4}$/.test(clean)) {
        eras.push({ name: clean.replace(/^#/, ""), count });
      } else if (/concept|masterpiece|soundtrack|audiophile|acoustic|live|instrumental|vocal|guitar|bass|solo|melanchol|dark|psychedelic|trippy|philosoph|space|lyric/i.test(lower)) {
        themes.push({ name: clean.replace(/^#/, ""), count });
      } else if (/rock|pop|jazz|metal|folk|blues|wave|punk|electronic|ambient|reggae|disco|funk|soul|indie|alternative|prog|hop|rap|dance|r&b|techno|house|trance|country/i.test(lower)) {
        styles.push({ name: clean.replace(/^#/, ""), count });
      } else {
        const ignored = new Set(["album", "albums", "ep", "single", "singles", "lp", "cd", "vinyl", "owned", "wishlist"]);
        if (!ignored.has(lower)) {
          others.push({ name: clean.replace(/^#/, ""), count });
        }
      }
    }

    return {
      genres: genreItems,
      styles,
      themes,
      eras,
      others,
    };
  }, [categorizedTags, genres, tags, allTags]);

  const hasAnyTags = resolvedCategorized.genres.length > 0 ||
    resolvedCategorized.styles.length > 0 ||
    resolvedCategorized.themes.length > 0 ||
    resolvedCategorized.eras.length > 0 ||
    resolvedCategorized.others.length > 0;

  // Separate editorial / review external links
  const reviewLinks = (externalLinks || []).filter(l => l.category === "review");
  const referenceLinks = (externalLinks || []).filter(l => l.category === "reference" || l.category === "database" || l.category === "encyclopedia");
  const streamingLinks = (externalLinks || []).filter(l => l.category === "streaming" || l.category === "purchase" || l.category === "live" || l.category === "official" || l.category === "social" || l.category === "lyrics");

  return (
    <div className="relative z-10 w-full mt-12 space-y-10">
      {/* 1. Categorized Genres & Musical Lore Section */}
      {hasAnyTags && (
        <section className="bg-[var(--theme-card)]/75 backdrop-blur-xl border border-[var(--theme-border)] rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-2 border-b border-[var(--theme-border)] pb-4">
            <div className="flex items-center gap-2.5 text-xs font-bold text-[var(--theme-accent)] uppercase tracking-widest">
              <Tag size={16} />
              <span>Genres, Styles & Music Lore</span>
            </div>
            {primaryGenre && (
              <span className="text-xs text-[var(--theme-accent)] font-semibold px-3 py-1 rounded-full bg-[var(--theme-accent)]/10 border border-[var(--theme-accent)]/20">
                Primary: {primaryGenre}
              </span>
            )}
          </div>

          {/* Official Curated Genres */}
          {resolvedCategorized.genres.length > 0 && (
            <div className="space-y-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--theme-fg)]/70 flex items-center gap-1.5">
                <Sparkles size={13} className="text-[var(--theme-accent)]" />
                <span>Primary Genres</span>
              </span>
              <div className="flex flex-wrap gap-2">
                {resolvedCategorized.genres.map((g, idx) => (
                  <span
                    key={`genre-${idx}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--theme-accent)]/15 border border-[var(--theme-accent)]/30 text-[var(--theme-fg)] font-semibold text-xs transition shadow-sm hover:border-[var(--theme-accent)]"
                  >
                    <span>{g.name}</span>
                    {g.count > 1 && (
                      <span className="text-[10px] text-[var(--theme-accent)] bg-black/20 dark:bg-white/10 px-1.5 py-0.2 rounded-full font-mono">
                        {g.count}
                      </span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Styles & Subgenres */}
          {resolvedCategorized.styles.length > 0 && (
            <div className="space-y-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--theme-fg)]/60">
                Styles & Subgenres
              </span>
              <div className="flex flex-wrap gap-2">
                {resolvedCategorized.styles.map((s, idx) => (
                  <span
                    key={`style-${idx}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--theme-surface)] border border-[var(--theme-border)] text-[var(--theme-fg)]/90 text-xs font-medium hover:border-[var(--theme-accent)] transition"
                  >
                    <span>#{s.name}</span>
                    {s.count > 1 && (
                      <span className="text-[10px] text-[var(--theme-muted)] bg-[var(--theme-card)] px-1.5 py-0.2 rounded-full font-mono">
                        {s.count}
                      </span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Themes & Moods */}
          {resolvedCategorized.themes.length > 0 && (
            <div className="space-y-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--theme-fg)]/60">
                Themes & Moods
              </span>
              <div className="flex flex-wrap gap-2">
                {resolvedCategorized.themes.map((th, idx) => (
                  <span
                    key={`theme-${idx}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--theme-surface)] border border-[var(--theme-border)] text-amber-300/90 text-xs font-medium hover:border-amber-400 transition"
                  >
                    <span>#{th.name}</span>
                    {th.count > 1 && (
                      <span className="text-[10px] text-amber-200/70 bg-[var(--theme-card)] px-1.5 py-0.2 rounded-full font-mono">
                        {th.count}
                      </span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Eras & Timeline */}
          {resolvedCategorized.eras.length > 0 && (
            <div className="space-y-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--theme-fg)]/60">
                Era & Timeline
              </span>
              <div className="flex flex-wrap gap-2">
                {resolvedCategorized.eras.map((er, idx) => (
                  <span
                    key={`era-${idx}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--theme-surface)] border border-[var(--theme-border)] text-sky-300/90 text-xs font-medium hover:border-sky-400 transition"
                  >
                    <span>{er.name}</span>
                    {er.count > 1 && (
                      <span className="text-[10px] text-sky-200/70 bg-[var(--theme-card)] px-1.5 py-0.2 rounded-full font-mono">
                        {er.count}
                      </span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Community Folksonomy */}
          {resolvedCategorized.others.length > 0 && (
            <div className="space-y-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--theme-fg)]/60">
                Community Folksonomy
              </span>
              <div className="flex flex-wrap gap-2">
                {resolvedCategorized.others.slice(0, 16).map((ot, idx) => (
                  <span
                    key={`other-${idx}`}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--theme-surface)]/60 border border-[var(--theme-border)] text-[var(--theme-muted)] text-xs transition"
                  >
                    <span>#{ot.name}</span>
                    {ot.count > 1 && (
                      <span className="text-[10px] text-[var(--theme-muted)] font-mono">
                        ({ot.count})
                      </span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* 2. Description & Lore Section */}
      {description && (
        <section className="bg-[var(--theme-card)]/75 backdrop-blur-xl border border-[var(--theme-border)] rounded-3xl p-6 sm:p-8 shadow-xl">
          <div className="flex items-center gap-2.5 text-xs font-bold text-[var(--theme-accent)] uppercase tracking-widest mb-3">
            <BookOpen size={16} />
            <span>{type === "artist" ? "Artist Biography & Lore" : type === "album" ? "Album Overview & Background" : "Track Information & Lore"}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[var(--theme-fg)] mb-4">
            About {title || artist}
          </h2>
          <div className="text-sm sm:text-base text-[var(--theme-muted)] leading-relaxed font-body">
            <p className={!expandedDesc && description.length > 320 ? "line-clamp-4" : ""}>
              {description}
            </p>
            {description.length > 320 && (
              <button
                onClick={() => setExpandedDesc(!expandedDesc)}
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-[var(--theme-accent)] hover:opacity-80 transition cursor-pointer"
              >
                <span>{expandedDesc ? "Show less" : "Read full overview"}</span>
                {expandedDesc ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            )}
          </div>
        </section>
      )}

      {/* 3. Revamped Ratings & Reviews Section */}
      <section className="bg-[var(--theme-card)]/75 backdrop-blur-xl border border-[var(--theme-border)] rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3 border-b border-[var(--theme-border)] pb-4">
          <div className="flex items-center gap-2.5 text-xs font-bold text-[var(--theme-accent)] uppercase tracking-widest">
            <MessageSquare size={16} />
            <span>Ratings & Reviews</span>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--theme-accent)] hover:opacity-90 text-[var(--theme-bg)] text-xs font-bold uppercase tracking-wider transition cursor-pointer shadow-md"
          >
            <Star size={14} fill="currentColor" />
            <span>{showForm ? "Cancel Review" : "Write a Review"}</span>
          </button>
        </div>

        {/* Top Cards Grid: MusicBrainz Rating & Your Rating */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1: Official MusicBrainz Rating */}
          <div className="p-5 rounded-2xl bg-[var(--theme-surface)] border border-[var(--theme-border)] flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-purple-400 text-xs font-bold uppercase tracking-wider mb-2">
                <Award size={16} />
                <span>MusicBrainz Rating</span>
              </div>
              {mbScore !== null && mbScore > 0 ? (
                <div>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-3xl sm:text-4xl font-black text-[var(--theme-fg)] font-display">
                      {mbScore.toFixed(1)}
                    </span>
                    <span className="text-sm font-medium text-[var(--theme-muted)]">/ 5.0</span>
                  </div>
                  <div className="flex items-center gap-1 text-purple-400 mb-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={16}
                        fill={star <= Math.round(mbScore) ? "currentColor" : "none"}
                        className={star <= Math.round(mbScore) ? "text-purple-400" : "text-zinc-600"}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-[var(--theme-muted)]">
                    {mbVotes ? `Based on ${mbVotes} MusicBrainz community votes` : "MusicBrainz open registry score"}
                  </p>
                </div>
              ) : (
                <div className="py-2 text-xs text-[var(--theme-muted)]">
                  <p className="font-medium text-[var(--theme-fg)]/80">No MusicBrainz ratings recorded yet</p>
                  <p className="text-[11px] mt-0.5">This release has not received community votes in the MusicBrainz open registry.</p>
                </div>
              )}
            </div>
            <div className="pt-2 border-t border-[var(--theme-border)]/50 text-[10px] text-[var(--theme-muted)] font-semibold uppercase tracking-wider">
              Open Music Catalog Source
            </div>
          </div>

          {/* Card 2: Your Rating */}
          <div className="p-5 rounded-2xl bg-[var(--theme-surface)] border border-[var(--theme-border)] flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-amber-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                  <Star size={16} fill="currentColor" />
                  <span>Your Personal Rating</span>
                </span>
                {userRating > 0 && (
                  <button
                    onClick={() => handleRateLocally(userRating)}
                    className="text-[10px] text-[var(--theme-muted)] hover:text-rose-400 transition cursor-pointer"
                    title="Clear rating"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5 my-2" onMouseLeave={() => setHoverRating(0)}>
                {[1, 2, 3, 4, 5].map((star) => {
                  const isFilled = (hoverRating || userRating) >= star;
                  return (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onClick={() => handleRateLocally(star)}
                      className="p-1 cursor-pointer transition-transform duration-150 hover:scale-125 focus:outline-none"
                    >
                      <Star
                        size={24}
                        fill={isFilled ? "currentColor" : "none"}
                        className={
                          isFilled 
                            ? "text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" 
                            : "text-zinc-600 hover:text-amber-300"
                        }
                      />
                    </button>
                  );
                })}
              </div>

              <p className="text-xs text-[var(--theme-muted)]">
                {userRating > 0 ? (
                  <span>You scored this {type} <strong className="text-amber-400 font-bold">{userRating} / 5 stars</strong></span>
                ) : (
                  <span>Tap any star above to rate this {type}</span>
                )}
              </p>
            </div>
            <div className="pt-2 border-t border-[var(--theme-border)]/50 text-[10px] text-[var(--theme-muted)] font-semibold uppercase tracking-wider">
              Saved locally to your Groove Library
            </div>
          </div>
        </div>

        {/* Real Community Reviews Statistics (If reviews exist) */}
        {realReviewsCount > 0 && realDistribution && (
          <div className="p-5 rounded-2xl bg-[var(--theme-surface)]/70 border border-[var(--theme-border)] space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-bold text-[var(--theme-fg)] uppercase tracking-wider">
                Community Ratings Breakdown ({realReviewsCount} {realReviewsCount === 1 ? "review" : "reviews"})
              </span>
              <span className="text-xs font-bold text-amber-400">
                Average: {realAverageScore} / 5.0
              </span>
            </div>

            <div className="space-y-1.5 max-w-md">
              {realDistribution.map((row) => (
                <div key={row.star} className="flex items-center gap-3 text-xs text-[var(--theme-muted)]">
                  <span className="w-8 font-bold text-right text-[11px]">{row.star} ★</span>
                  <div className="flex-1 h-2 rounded-full bg-[var(--theme-card)] overflow-hidden border border-[var(--theme-border)]">
                    <div 
                      className="h-full bg-amber-400 rounded-full transition-all duration-500" 
                      style={{ width: `${row.pct}%` }} 
                    />
                  </div>
                  <span className="w-12 text-right text-[10px] font-mono">{row.count} ({row.pct}%)</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Write Review Form */}
        {showForm && (
          <form onSubmit={handleSubmitReview} className="p-6 rounded-2xl bg-[var(--theme-surface)] border border-[var(--theme-accent)]/40 shadow-xl space-y-4 animate-fade-in">
            <h4 className="text-sm font-bold text-[var(--theme-fg)] uppercase tracking-wider">
              Write a Review for {title || artist}
            </h4>

            {/* Star Selector in Form */}
            <div className="flex items-center gap-2.5">
              <span className="text-xs text-[var(--theme-muted)] font-semibold">Score:</span>
              <div className="flex items-center gap-1" onMouseLeave={() => setHoverRating(0)}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoverRating(star)}
                    onClick={() => handleRateLocally(star)}
                    className="p-1 cursor-pointer transition transform hover:scale-115"
                  >
                    <Star
                      size={20}
                      fill={(hoverRating || userRating || 5) >= star ? "currentColor" : "none"}
                      className={(hoverRating || userRating || 5) >= star ? "text-amber-400" : "text-zinc-600"}
                    />
                  </button>
                ))}
              </div>
              <span className="text-xs font-bold text-amber-400 ml-1">
                {(userRating || 5)} / 5
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Your Name or Handle (optional)"
                value={reviewerName}
                onChange={(e) => setReviewerName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[var(--theme-card)] border border-[var(--theme-border)] text-[var(--theme-fg)] placeholder-[var(--theme-muted)] text-xs focus:outline-none focus:border-[var(--theme-accent)]"
              />
            </div>

            <textarea
              placeholder="What do you think of this release? Share your thoughts on track highlights, sound production, or personal memories..."
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 rounded-xl bg-[var(--theme-card)] border border-[var(--theme-border)] text-[var(--theme-fg)] placeholder-[var(--theme-muted)] text-xs focus:outline-none focus:border-[var(--theme-accent)] resize-none"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-full border border-[var(--theme-border)] text-xs font-semibold text-[var(--theme-muted)] hover:text-[var(--theme-fg)] transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[var(--theme-accent)] hover:opacity-90 text-[var(--theme-bg)] text-xs font-bold uppercase tracking-wider transition cursor-pointer shadow-md"
              >
                <Send size={13} />
                <span>Submit Review</span>
              </button>
            </div>
          </form>
        )}

        {/* Real User Reviews List or Clean Empty State */}
        {reviews.length > 0 ? (
          <div className="space-y-3">
            {reviews.map((rev) => (
              <div 
                key={rev.id} 
                className="p-4 rounded-2xl bg-[var(--theme-surface)]/70 border border-[var(--theme-border)] flex flex-col gap-2 transition hover:border-[var(--theme-border)]/80"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[var(--theme-fg)]">{rev.author}</span>
                    {rev.verified && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-[var(--theme-accent)] bg-[var(--theme-accent)]/10 px-2 py-0.5 rounded-full border border-[var(--theme-accent)]/20">
                        <CheckCircle2 size={10} />
                        Verified
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[var(--theme-muted)]">
                    <div className="flex items-center gap-0.5 text-amber-400">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={12}
                          fill={s <= rev.score ? "currentColor" : "none"}
                          className={s <= rev.score ? "text-amber-400" : "text-zinc-700"}
                        />
                      ))}
                    </div>
                    <span>•</span>
                    <span>{rev.date}</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteReview(rev.id)}
                      className="ml-2 text-zinc-500 hover:text-rose-400 transition cursor-pointer p-0.5"
                      title="Remove review"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-[var(--theme-fg)]/90 font-body leading-relaxed">
                  &ldquo;{rev.text}&rdquo;
                </p>
              </div>
            ))}
          </div>
        ) : (
          /* Clean, Honest Empty State */
          <div className="p-8 rounded-2xl bg-[var(--theme-surface)]/50 border border-[var(--theme-border)] flex flex-col items-center text-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[var(--theme-card)] border border-[var(--theme-border)] flex items-center justify-center text-[var(--theme-accent)] shadow-inner">
              <MessageSquare size={20} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[var(--theme-fg)]">No Community Reviews Yet</h4>
              <p className="text-xs text-[var(--theme-muted)] max-w-sm mt-1">
                Be the first to rate and write a review for {title || artist}. Your review will help other listeners discover this music.
              </p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="mt-2 inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[var(--theme-accent)] hover:opacity-90 text-[var(--theme-bg)] text-xs font-bold uppercase tracking-wider transition cursor-pointer shadow-md"
            >
              <Star size={13} fill="currentColor" />
              <span>Write the First Review</span>
            </button>
          </div>
        )}
      </section>

      {/* 4. External Web Links & Catalog Resources */}
      {(reviewLinks.length > 0 || referenceLinks.length > 0 || streamingLinks.length > 0) && (
        <section className="bg-[var(--theme-card)]/75 backdrop-blur-xl border border-[var(--theme-border)] rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex items-center gap-2.5 text-xs font-bold text-[var(--theme-accent)] uppercase tracking-widest border-b border-[var(--theme-border)] pb-4">
            <Globe size={16} />
            <span>External Catalog Resources & Links</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {externalLinks.map((link, idx) => (
              <a
                key={`link-${idx}`}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-xl bg-[var(--theme-surface)] border border-[var(--theme-border)] hover:border-[var(--theme-accent)] text-xs font-medium text-[var(--theme-fg)] transition group cursor-pointer shadow-sm"
              >
                <div className="flex items-center gap-2 truncate pr-2">
                  <ExternalLink size={13} className="text-[var(--theme-muted)] group-hover:text-[var(--theme-accent)] shrink-0 transition" />
                  <span className="truncate">{link.label || link.name || "Web Link"}</span>
                </div>
                <span className="text-[10px] text-[var(--theme-muted)] uppercase tracking-wider font-semibold shrink-0">
                  {link.category || "Link"}
                </span>
              </a>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
