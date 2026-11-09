// src/Components/MusicLoreAndReviews.jsx
"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { 
  Star, ExternalLink, Tag, BookOpen, MessageSquare, 
  Send, Sparkles, CheckCircle2, ChevronRight, Globe, Award, Trash2,
  Disc, Calendar, MapPin, Building, Hash, Info
} from "lucide-react";
import { toast } from "@/lib/toast";

export default function MusicLoreAndReviews({
  id,
  type = "track", // track | album | artist
  title = "",
  artist = "",
  description = null,
  artistDescription = null,
  releaseDetails = null, // { releaseDate, label, country, barcode, format }
  primaryGenre = null,
  genres = [],
  categorizedTags = null,
  tags = [],
  allTags = [],
  rating = null,
  externalLinks = [],
  totalDurationMs = null,
  activeTab = "all", // "all" | "about" | "lore" | "reviews" | "links"
}) {
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

  // Real reviews statistics
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

  // Derive curated, noise-filtered musical categories
  const resolvedCategorized = useMemo(() => {
    const NOISE_TAGS = new Set([
      "album", "albums", "ep", "single", "singles", "lp", "cd", "vinyl", "audio",
      "favorite", "favourites", "favorites", "favourite", "seen live",
      "owned", "wishlist", "my collection", "all time favorite",
      "british", "uk", "united states", "usa", "american", "german", "french", "canadian", "swedish", "japanese",
      "actor", "actors", "arranger", "arrangers", "composer", "composers", "singers", "singer",
      "musicians", "musician", "producer", "producers", "executive", "executives",
      "sound recording executives and producers", "sound recording", "recording"
    ]);

    const formatTag = (str) => {
      if (!str) return "";
      let clean = String(str).replace(/^#+/, "").trim();
      clean = clean.replace(/\s+(music|musicians)$/i, "").trim();

      // Filter out discogs shelf titles, url-like strings, or sentences
      if (/discogs|released every year|most popular|\/|\\/i.test(clean) || clean.length > 28) {
        return "";
      }

      if (/^r&b$/i.test(clean)) return "R&B";
      if (/^edm$/i.test(clean)) return "EDM";
      if (/^idm$/i.test(clean)) return "IDM";
      if (/^k-?pop$/i.test(clean)) return "K-Pop";
      if (/^j-?pop$/i.test(clean)) return "J-Pop";
      if (/^lo-?fi$/i.test(clean)) return "Lo-Fi";
      if (/^hip-?hop$/i.test(clean)) return "Hip Hop";

      return clean
        .split(/[\s-]+/)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(" ");
    };

    const genreList = Array.isArray(genres) ? genres : [];
    const rawList = (allTags && allTags.length > 0) ? allTags : (tags || []).map((t) => ({ name: t, count: 1 }));

    const genreItems = [];
    const seenGenres = new Set();
    genreList.forEach((g) => {
      const rawName = typeof g === "string" ? g : g?.name;
      const count = (typeof g === "object" && g.count) || null;
      const formatted = formatTag(rawName);
      const lower = formatted.toLowerCase();
      if (formatted && !seenGenres.has(lower) && !NOISE_TAGS.has(lower)) {
        seenGenres.add(lower);
        genreItems.push({ name: formatted, count });
      }
    });

    const styles = [];
    const themes = [];
    const eras = [];
    const seenOther = new Set(seenGenres);

    for (const t of rawList) {
      const raw = typeof t === "string" ? t : t?.name;
      if (!raw) continue;
      const formatted = formatTag(raw);
      if (!formatted) continue;

      const lower = formatted.toLowerCase();
      const count = (typeof t === "object" && t.count) || null;

      if (seenOther.has(lower) || NOISE_TAGS.has(lower)) continue;
      if (/executives|arrangers|producers|actors|sound recording/i.test(lower)) continue;

      seenOther.add(lower);

      if (/^\d{2,4}s?$/i.test(formatted) || /^\d{4}$/.test(formatted)) {
        eras.push({ name: formatted, count });
      } else if (/concept|masterpiece|soundtrack|audiophile|acoustic|live|instrumental|vocal|guitar|bass|solo|melanchol|dark|psychedelic|trippy|philosoph|space|lyric/i.test(lower)) {
        themes.push({ name: formatted, count });
      } else if (/rock|pop|jazz|metal|folk|blues|wave|punk|electronic|ambient|reggae|disco|funk|soul|indie|alternative|prog|hop|rap|dance|r&b|techno|house|trance|country/i.test(lower)) {
        styles.push({ name: formatted, count });
      }
    }

    return {
      genres: genreItems,
      styles,
      themes,
      eras,
    };
  }, [genres, tags, allTags]);

  const hasAnyTags = resolvedCategorized.genres.length > 0 ||
    resolvedCategorized.styles.length > 0 ||
    resolvedCategorized.themes.length > 0 ||
    resolvedCategorized.eras.length > 0;

  // Decide which sections to render based on activeTab
  const renderAll = activeTab === "all";
  const renderAbout = renderAll || activeTab === "about";
  const renderLore = renderAll || activeTab === "lore";
  const renderReviews = renderAll || activeTab === "reviews";
  const renderLinks = renderAll || activeTab === "links";

  return (
    <div className="relative z-10 w-full space-y-12 pb-16">
      
      {/* 1. ABOUT & INFO TAB (Full Lore, Specs & Artist Bio - NO CARD WRAPPER!) */}
      {renderAbout && (description || artistDescription || releaseDetails) && (
        <section className="space-y-8 animate-fade-in">
          {/* Main Editorial Background */}
          {description && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-[var(--theme-accent)] uppercase tracking-widest font-mono">
                <BookOpen size={15} />
                <span>{type === "artist" ? "Artist Biography" : type === "album" ? "Album History & Lore" : "Track Information"}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-[var(--theme-fg)] tracking-tight font-display">
                About {title || artist}
              </h2>
              <div className="text-sm sm:text-base text-[var(--theme-muted)] leading-relaxed font-body max-w-3xl whitespace-pre-line">
                {description}
              </div>
            </div>
          )}

          {/* Release Specifications Grid (Clean 2-Column Specs - No Box Card!) */}
          {releaseDetails && (
            <div className="pt-6 border-t border-[var(--theme-border)]/50 space-y-4">
              <h3 className="text-xs font-bold text-[var(--theme-fg)] uppercase tracking-wider font-mono">
                Release Metadata & Archival Specs
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-w-3xl">
                {releaseDetails.releaseDate && (
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-[var(--theme-muted)] flex items-center gap-1.5">
                      <Calendar size={13} className="text-[var(--theme-accent)]" />
                      <span>Original Release</span>
                    </span>
                    <p className="text-sm font-bold text-[var(--theme-fg)]">{releaseDetails.releaseDate}</p>
                  </div>
                )}
                {releaseDetails.label && (
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-[var(--theme-muted)] flex items-center gap-1.5">
                      <Building size={13} className="text-[var(--theme-accent)]" />
                      <span>Record Label</span>
                    </span>
                    <p className="text-sm font-bold text-[var(--theme-fg)] truncate">{releaseDetails.label}</p>
                  </div>
                )}
                {releaseDetails.country && (
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-[var(--theme-muted)] flex items-center gap-1.5">
                      <MapPin size={13} className="text-[var(--theme-accent)]" />
                      <span>Release Territory</span>
                    </span>
                    <p className="text-sm font-bold text-[var(--theme-fg)]">{releaseDetails.country}</p>
                  </div>
                )}
                {releaseDetails.format && (
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-[var(--theme-muted)] flex items-center gap-1.5">
                      <Disc size={13} className="text-[var(--theme-accent)]" />
                      <span>Primary Medium</span>
                    </span>
                    <p className="text-sm font-bold text-[var(--theme-fg)]">{releaseDetails.format}</p>
                  </div>
                )}
                {releaseDetails.barcode && (
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-[var(--theme-muted)] flex items-center gap-1.5">
                      <Hash size={13} className="text-[var(--theme-accent)]" />
                      <span>Catalog / Barcode</span>
                    </span>
                    <p className="text-xs font-mono font-bold text-[var(--theme-fg)] truncate">{releaseDetails.barcode}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Artist Background Snippet */}
          {artistDescription && type !== "artist" && (
            <div className="pt-6 border-t border-[var(--theme-border)]/50 space-y-2">
              <h3 className="text-xs font-bold text-[var(--theme-accent)] uppercase tracking-wider font-mono">
                Artist Context · {artist}
              </h3>
              <p className="text-xs sm:text-sm text-[var(--theme-muted)] leading-relaxed max-w-3xl">
                {artistDescription}
              </p>
            </div>
          )}
        </section>
      )}

      {/* 2. GENRES & LORE TAB (Open Tag Clouds - NO HEAVY CARD BOX!) */}
      {renderLore && hasAnyTags && (
        <section className="space-y-8 animate-fade-in">
          <div className="flex items-center justify-between flex-wrap gap-2 border-b border-[var(--theme-border)]/50 pb-3">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-[var(--theme-accent)] uppercase tracking-widest font-mono">
                <Tag size={15} />
                <span>Musical Genealogy</span>
              </div>
              <h2 className="text-2xl font-black text-[var(--theme-fg)] tracking-tight font-display mt-0.5">
                Genres, Styles & Roots
              </h2>
            </div>
            {primaryGenre && (
              <span className="text-xs text-[var(--theme-accent)] font-semibold px-3 py-1 rounded-full bg-[var(--theme-accent)]/15 border border-[var(--theme-accent)]/30">
                Primary: {primaryGenre}
              </span>
            )}
          </div>

          {/* Core Official Genres */}
          {resolvedCategorized.genres.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-[var(--theme-muted)] uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Sparkles size={13} className="text-[var(--theme-accent)]" />
                <span>Core Genres</span>
              </h3>
              <div className="flex flex-wrap gap-2">
                {resolvedCategorized.genres.map((g, idx) => (
                  <span
                    key={`genre-${idx}`}
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--theme-accent)]/15 border border-[var(--theme-accent)]/30 text-[var(--theme-fg)] font-medium text-xs transition hover:border-[var(--theme-accent)] select-none"
                  >
                    <span>{g.name}</span>
                    {g.count > 1 && (
                      <span className="text-[10px] text-[var(--theme-accent)] font-mono font-bold opacity-80">
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
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-[var(--theme-muted)] uppercase tracking-wider font-mono">
                Styles & Subgenres
              </h3>
              <div className="flex flex-wrap gap-2">
                {resolvedCategorized.styles.map((s, idx) => (
                  <span
                    key={`style-${idx}`}
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--theme-surface)] border border-[var(--theme-border)] text-[var(--theme-fg)]/90 text-xs font-medium hover:border-[var(--theme-accent)] transition select-none"
                  >
                    <span>{s.name}</span>
                    {s.count > 1 && (
                      <span className="text-[10px] text-[var(--theme-muted)] font-mono">
                        {s.count}
                      </span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Themes & Musical Moods */}
          {resolvedCategorized.themes.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-[var(--theme-muted)] uppercase tracking-wider font-mono">
                Themes & Moods
              </h3>
              <div className="flex flex-wrap gap-2">
                {resolvedCategorized.themes.map((th, idx) => (
                  <span
                    key={`theme-${idx}`}
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-200/90 text-xs font-medium hover:border-amber-400 transition select-none"
                  >
                    <span>{th.name}</span>
                    {th.count > 1 && (
                      <span className="text-[10px] text-amber-300/70 font-mono">
                        {th.count}
                      </span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Era & Timeline */}
          {resolvedCategorized.eras.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-[var(--theme-muted)] uppercase tracking-wider font-mono">
                Era & Musical Era
              </h3>
              <div className="flex flex-wrap gap-2">
                {resolvedCategorized.eras.map((er, idx) => (
                  <span
                    key={`era-${idx}`}
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-200/90 text-xs font-medium hover:border-sky-400 transition select-none"
                  >
                    <span>{er.name}</span>
                    {er.count > 1 && (
                      <span className="text-[10px] text-sky-300/70 font-mono">
                        {er.count}
                      </span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* 3. RATINGS & REVIEWS TAB (Breathing Open Layout - NOT NESTED CARDS!) */}
      {renderReviews && (
        <section className="space-y-8 animate-fade-in">
          {/* Header & Write Review Action */}
          <div className="flex items-center justify-between flex-wrap gap-3 border-b border-[var(--theme-border)]/50 pb-3">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-[var(--theme-accent)] uppercase tracking-widest font-mono">
                <MessageSquare size={15} />
                <span>Community Pulse</span>
              </div>
              <h2 className="text-2xl font-black text-[var(--theme-fg)] tracking-tight font-display mt-0.5">
                Ratings & Reviews
              </h2>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--theme-accent)] hover:opacity-90 text-[var(--theme-accent-fg)] text-xs font-bold transition cursor-pointer shadow-md active:scale-95"
            >
              <Star size={14} fill="currentColor" />
              <span>{showForm ? "Cancel Review" : "Write a Review"}</span>
            </button>
          </div>

          {/* Dual Score Overview (Open Grid - No Nested Cards) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-2">
            {/* Column 1: MusicBrainz Verified Community Rating */}
            <div className="space-y-2 border-b sm:border-b-0 sm:border-r border-[var(--theme-border)]/50 pb-5 sm:pb-0 sm:pr-6">
              <div className="flex items-center gap-2 text-purple-400 text-xs font-bold uppercase tracking-wider font-mono">
                <Award size={15} />
                <span>MusicBrainz Registry Score</span>
              </div>
              {mbScore !== null && mbScore > 0 ? (
                <div>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-4xl sm:text-5xl font-black text-[var(--theme-fg)] font-display">
                      {mbScore.toFixed(1)}
                    </span>
                    <span className="text-sm font-semibold text-[var(--theme-muted)]">/ 5.0</span>
                  </div>
                  <div className="flex items-center gap-1 text-purple-400 mb-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={18}
                        fill={star <= Math.round(mbScore) ? "currentColor" : "none"}
                        className={star <= Math.round(mbScore) ? "text-purple-400" : "text-zinc-600"}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-[var(--theme-muted)]">
                    {mbVotes ? `Calculated from ${mbVotes} verified catalog ratings` : "Verified open music registry score"}
                  </p>
                </div>
              ) : (
                <div className="py-2 text-xs text-[var(--theme-muted)]">
                  <p className="font-semibold text-[var(--theme-fg)]/90">No open registry rating yet</p>
                  <p className="text-[11px] mt-0.5">This release has not received votes in the MusicBrainz open catalog.</p>
                </div>
              )}
            </div>

            {/* Column 2: Personal User Rating */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider font-mono">
                  <Star size={15} fill="currentColor" />
                  <span>Your Personal Score</span>
                </div>
                {userRating > 0 && (
                  <button
                    onClick={() => handleRateLocally(userRating)}
                    className="text-[10px] text-[var(--theme-muted)] hover:text-rose-400 transition cursor-pointer font-bold uppercase"
                  >
                    Clear Score
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 my-1" onMouseLeave={() => setHoverRating(0)}>
                {[1, 2, 3, 4, 5].map((star) => {
                  const isFilled = (hoverRating || userRating) >= star;
                  return (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onClick={() => handleRateLocally(star)}
                      className="p-1 cursor-pointer transition-transform duration-150 hover:scale-125 focus:outline-none"
                      title={`Rate ${star} star${star > 1 ? 's' : ''}`}
                    >
                      <Star
                        size={26}
                        fill={isFilled ? "currentColor" : "none"}
                        className={
                          isFilled 
                            ? "text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.6)]" 
                            : "text-zinc-600 hover:text-amber-300"
                        }
                      />
                    </button>
                  );
                })}
              </div>

              <p className="text-xs text-[var(--theme-muted)]">
                {userRating > 0 ? (
                  <span>You rated this <strong className="text-amber-400 font-bold">{userRating} / 5 stars</strong> (saved locally)</span>
                ) : (
                  <span>Tap any star above to add your score</span>
                )}
              </p>
            </div>
          </div>

          {/* Rating Distribution Bar (if reviews exist) */}
          {realReviewsCount > 0 && realDistribution && (
            <div className="pt-6 border-t border-[var(--theme-border)]/50 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-[var(--theme-fg)]">
                <span>Rating Breakdown ({realReviewsCount} listener reviews)</span>
                <span className="text-amber-400">Average: {realAverageScore} / 5.0</span>
              </div>
              <div className="space-y-1.5 max-w-md">
                {realDistribution.map((row) => (
                  <div key={row.star} className="flex items-center gap-3 text-xs text-[var(--theme-muted)]">
                    <span className="w-8 font-bold text-right text-[11px] font-mono">{row.star} ★</span>
                    <div className="flex-1 h-2 rounded-full bg-[var(--theme-surface)] overflow-hidden border border-[var(--theme-border)]">
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
            <form onSubmit={handleSubmitReview} className="p-5 rounded-2xl bg-[var(--theme-surface)] border border-[var(--theme-accent)]/40 shadow-xl space-y-4 animate-fade-in max-w-2xl">
              <h4 className="text-xs font-bold text-[var(--theme-fg)] uppercase tracking-wider font-mono">
                Write a Review for {title || artist}
              </h4>

              <div className="flex items-center gap-2.5">
                <span className="text-xs text-[var(--theme-muted)] font-semibold">Your Score:</span>
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
                        size={18}
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

              <input
                type="text"
                placeholder="Your Name or Handle (optional)"
                value={reviewerName}
                onChange={(e) => setReviewerName(e.target.value)}
                className="w-full px-4 py-2 rounded-xl bg-[var(--theme-card)] border border-[var(--theme-border)] text-[var(--theme-fg)] placeholder-[var(--theme-muted)] text-xs focus:outline-none focus:border-[var(--theme-accent)]"
              />

              <textarea
                placeholder="Share your thoughts on track highlights, sound production, or memories with this release..."
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 rounded-xl bg-[var(--theme-card)] border border-[var(--theme-border)] text-[var(--theme-fg)] placeholder-[var(--theme-muted)] text-xs focus:outline-none focus:border-[var(--theme-accent)] resize-none"
              />

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-1.5 rounded-full border border-[var(--theme-border)] text-xs font-semibold text-[var(--theme-muted)] hover:text-[var(--theme-fg)] transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-5 py-1.5 rounded-full bg-[var(--theme-accent)] hover:opacity-90 text-[var(--theme-accent-fg)] text-xs font-bold transition cursor-pointer shadow-md"
                >
                  <Send size={12} />
                  <span>Post Review</span>
                </button>
              </div>
            </form>
          )}

          {/* User Reviews List */}
          {reviews.length > 0 ? (
            <div className="space-y-4 pt-2">
              <h3 className="text-xs font-bold text-[var(--theme-muted)] uppercase tracking-wider font-mono">
                Listener Reviews
              </h3>
              <div className="divide-y divide-[var(--theme-border)]/40">
                {reviews.map((rev) => (
                  <div key={rev.id} className="py-4 space-y-2 first:pt-0">
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
                        <span>·</span>
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
                    <p className="text-xs sm:text-sm text-[var(--theme-fg)]/90 font-body leading-relaxed max-w-2xl">
                      &ldquo;{rev.text}&rdquo;
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-8 flex flex-col items-center text-center gap-2 max-w-md mx-auto">
              <MessageSquare size={24} className="text-[var(--theme-muted)]/60" />
              <h4 className="text-sm font-bold text-[var(--theme-fg)]">No Community Reviews Yet</h4>
              <p className="text-xs text-[var(--theme-muted)]">
                Be the first to rate and write a review for {title || artist}.
              </p>
            </div>
          )}
        </section>
      )}

      {/* 4. EXTERNAL LINKS TAB */}
      {renderLinks && externalLinks && externalLinks.length > 0 && (
        <section className="space-y-6 animate-fade-in">
          <div className="flex items-center justify-between flex-wrap gap-2 border-b border-[var(--theme-border)]/50 pb-3">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-[var(--theme-accent)] uppercase tracking-widest font-mono">
                <Globe size={15} />
                <span>External Directory</span>
              </div>
              <h2 className="text-2xl font-black text-[var(--theme-fg)] tracking-tight font-display mt-0.5">
                Streaming & Catalog Sources
              </h2>
            </div>
            <span className="text-xs text-[var(--theme-muted)] font-mono">
              {externalLinks.length} services
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {externalLinks.map((link, idx) => {
              const label = link.label || link.name || "Web Link";
              let domain = "";
              try {
                domain = new URL(link.url).hostname.replace(/^www\./, "");
              } catch (_) {
                domain = link.category || "web";
              }

              return (
                <a
                  key={`link-${idx}`}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 rounded-2xl bg-[var(--theme-surface)] border border-[var(--theme-border)] hover:border-[var(--theme-accent)] hover:bg-[var(--theme-card)] text-xs text-[var(--theme-fg)] transition-all duration-200 group cursor-pointer shadow-xs active:scale-98"
                >
                  <div className="flex items-center gap-3 truncate pr-2">
                    <div className="w-8 h-8 rounded-xl bg-[var(--theme-card)] border border-[var(--theme-border)] flex items-center justify-center shrink-0 group-hover:border-[var(--theme-accent)] transition-colors">
                      <ExternalLink size={13} className="text-[var(--theme-muted)] group-hover:text-[var(--theme-accent)] transition-colors" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-semibold text-xs text-[var(--theme-fg)] group-hover:text-[var(--theme-accent)] transition-colors truncate">
                        {label}
                      </span>
                      <span className="text-[10px] text-[var(--theme-muted)] truncate font-mono">
                        {domain}
                      </span>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-[var(--theme-muted)] group-hover:text-[var(--theme-accent)] group-hover:translate-x-0.5 transition-all shrink-0" />
                </a>
              );
            })}
          </div>
        </section>
      )}

    </div>
  );
}
