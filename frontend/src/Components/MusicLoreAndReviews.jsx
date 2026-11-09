// src/Components/MusicLoreAndReviews.jsx
"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { 
  Star, ExternalLink, Tag, BookOpen, MessageSquare, 
  Send, Sparkles, CheckCircle2, ChevronRight, Globe, Award, Trash2,
  Disc, Calendar, MapPin, Building, Hash, Info, Layers
} from "lucide-react";
import { toast } from "@/lib/toast";
import RatingAndJournalModal from "./RatingAndJournalModal";

export default function MusicLoreAndReviews({
  id,
  type = "track", // track | album | artist
  title = "",
  artist = "",
  description = null,
  artistDescription = null,
  releaseDetails = null, // { releaseDate, label, country, barcode, format, trackCount, discCount }
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
  const [isJournalModalOpen, setIsJournalModalOpen] = useState(false);

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

    const handleJournalSync = (e) => {
      if (e.detail?.targetId === id) {
        loadStoredData();
      }
    };

    window.addEventListener("groove-rating-changed", handleRatingSync);
    window.addEventListener("groove-journal-updated", handleJournalSync);
    return () => {
      window.removeEventListener("groove-rating-changed", handleRatingSync);
      window.removeEventListener("groove-journal-updated", handleJournalSync);
    };
  }, [id, type, loadStoredData]);

  // Handle setting user rating locally (10-star scale)
  const handleRateLocally = (score) => {
    const newScore = userRating === score ? 0 : score;
    setUserRating(newScore);

    try {
      if (newScore > 0) {
        localStorage.setItem(ratingStorageKey, JSON.stringify({ score: newScore, updatedAt: Date.now() }));
        toast.success(`You scored this ${type} ${newScore}/10 ⭐`);
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

    const reviewScore = userRating > 0 ? userRating : 8;

    const newReview = {
      id: `usr-${Date.now()}`,
      author: reviewerName.trim() || "Groove Explorer",
      score: reviewScore,
      date: new Date().toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }),
      text: reviewComment.trim(),
      verified: false,
    };

    const updated = [newReview, ...reviews];
    setReviews(updated);

    try {
      localStorage.setItem(reviewStorageKey, JSON.stringify(updated));
      
      // Also automatically create/update a journal entry in groove_journal_logs!
      const rawJournal = localStorage.getItem("groove_journal_logs");
      let logs = rawJournal ? JSON.parse(rawJournal) : [];
      const journalEntryId = `journal_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      const newJournalLog = {
        id: journalEntryId,
        targetId: id,
        targetType: type,
        title: title || "Untitled",
        subtitle: artist || "",
        rating: reviewScore,
        date: new Date().toISOString().split("T")[0],
        review: reviewComment.trim(),
        tags: ["Community Review"],
        updatedAt: Date.now(),
        createdAt: Date.now(),
      };
      logs = logs.filter(l => !(l.targetId === id && l.targetType === type));
      logs.unshift(newJournalLog);
      localStorage.setItem("groove_journal_logs", JSON.stringify(logs));
      window.dispatchEvent(new CustomEvent("groove-journal-updated", { detail: { targetId: id } }));

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
    toast.success("Review logged to Music Journal! 📓⭐");
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

  // MusicBrainz Rating Data (Converted to 10-star scale)
  const rawMbScore = rating?.value !== undefined 
    ? Number(rating.value) 
    : typeof rating === "number" 
      ? rating 
      : null;
  const mbVotes = rating?.votesCount || rating?.votes_count || null;
  
  const mbScore10 = rawMbScore !== null && rawMbScore > 0
    ? (rawMbScore <= 5 ? (rawMbScore * 2).toFixed(1) : rawMbScore.toFixed(1))
    : null;

  // Real reviews statistics (10-star scale)
  const realReviewsCount = reviews.length;
  const realAverageScore = realReviewsCount > 0
    ? (reviews.reduce((acc, r) => acc + (Number(r.score) || 0), 0) / realReviewsCount).toFixed(1)
    : null;

  // FULL GENRES & COMMUNITY FOLKSONOMY (NO aggressive stripping!)
  // User explicitly wants FULL genre tags, community folksonomy, styles, and subgenres shown
  const resolvedCategorized = useMemo(() => {
    const formatTag = (str) => {
      if (!str) return "";
      let clean = String(str).replace(/^#+/, "").trim();

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

    const coreGenres = [];
    const styles = [];
    const folksonomy = [];
    const eras = [];
    const seen = new Set();

    // 1. Process Core Genres
    genreList.forEach((g) => {
      const rawName = typeof g === "string" ? g : g?.name;
      const count = (typeof g === "object" && g.count) || null;
      const formatted = formatTag(rawName);
      const lower = formatted.toLowerCase();
      if (formatted && !seen.has(lower)) {
        seen.add(lower);
        coreGenres.push({ name: formatted, count });
      }
    });

    // 2. Process All Tags & Folksonomy (Keep EVERYTHING the user asked for)
    for (const t of rawList) {
      const raw = typeof t === "string" ? t : t?.name;
      if (!raw) continue;
      const formatted = formatTag(raw);
      if (!formatted) continue;

      const lower = formatted.toLowerCase();
      const count = (typeof t === "object" && t.count) || null;

      if (seen.has(lower)) continue;
      seen.add(lower);

      if (/^\d{2,4}s?$/i.test(formatted) || /^\d{4}$/.test(formatted)) {
        eras.push({ name: formatted, count });
      } else if (/rock|pop|jazz|metal|folk|blues|wave|punk|electronic|ambient|reggae|disco|funk|soul|indie|alternative|prog|hop|rap|dance|r&b|techno|house|trance|country/i.test(lower)) {
        styles.push({ name: formatted, count });
      } else {
        // Community folksonomy: origins, movements, roles, themes (British, UK, Actors, Composers, Arrangers, etc.)
        folksonomy.push({ name: formatted, count });
      }
    }

    return {
      coreGenres,
      styles,
      folksonomy,
      eras,
    };
  }, [genres, tags, allTags]);

  const hasAnyTags = resolvedCategorized.coreGenres.length > 0 ||
    resolvedCategorized.styles.length > 0 ||
    resolvedCategorized.folksonomy.length > 0 ||
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
                <span>{type === "artist" ? "Artist Biography" : type === "album" ? "Album Overview & Background" : "Track Information"}</span>
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
                      <span>Release Country</span>
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
                {releaseDetails.trackCount && (
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-[var(--theme-muted)] flex items-center gap-1.5">
                      <Disc size={13} className="text-[var(--theme-accent)]" />
                      <span>Tracks</span>
                    </span>
                    <p className="text-sm font-bold text-[var(--theme-fg)]">{releaseDetails.trackCount} Tracks</p>
                  </div>
                )}
                {releaseDetails.discCount > 1 && (
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-[var(--theme-muted)] flex items-center gap-1.5">
                      <Layers size={13} className="text-[var(--theme-accent)]" />
                      <span>Discs / Media</span>
                    </span>
                    <p className="text-sm font-bold text-[var(--theme-fg)]">{releaseDetails.discCount} Discs</p>
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
              <p className="text-xs sm:text-sm text-[var(--theme-muted)] leading-relaxed max-w-3xl whitespace-pre-line">
                {artistDescription}
              </p>
            </div>
          )}
        </section>
      )}

      {/* 2. GENRES & LORE TAB (Full Genres & Folksonomy - NO AGGRESSIVE FILTERING!) */}
      {renderLore && hasAnyTags && (
        <section className="space-y-8 animate-fade-in">
          <div className="flex items-center justify-between flex-wrap gap-2 border-b border-[var(--theme-border)]/50 pb-3">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-[var(--theme-accent)] uppercase tracking-widest font-mono">
                <Tag size={15} />
                <span>Musical Lore & Taxonomy</span>
              </div>
              <h2 className="text-2xl font-black text-[var(--theme-fg)] tracking-tight font-display mt-0.5">
                Genres, Styles & Community Lore
              </h2>
            </div>
            {primaryGenre && (
              <span className="text-xs text-[var(--theme-accent)] font-semibold px-3 py-1 rounded-full bg-[var(--theme-accent)]/15 border border-[var(--theme-accent)]/30">
                Primary: {primaryGenre}
              </span>
            )}
          </div>

          {/* Core Official Genres */}
          {resolvedCategorized.coreGenres.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-[var(--theme-muted)] uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Sparkles size={13} className="text-[var(--theme-accent)]" />
                <span>Core Genres</span>
              </h3>
              <div className="flex flex-wrap gap-2">
                {resolvedCategorized.coreGenres.map((g, idx) => (
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

          {/* Community Folksonomy (British, UK, Arrangers, Composers, Cultural tags) */}
          {resolvedCategorized.folksonomy.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-[var(--theme-muted)] uppercase tracking-wider font-mono">
                Community Folksonomy & Cultural Context
              </h3>
              <div className="flex flex-wrap gap-2">
                {resolvedCategorized.folksonomy.map((f, idx) => (
                  <span
                    key={`folk-${idx}`}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--theme-card)] border border-[var(--theme-border)] text-[var(--theme-muted)] hover:text-[var(--theme-fg)] text-xs font-medium hover:border-[var(--theme-accent)] transition select-none"
                  >
                    <span>#{f.name}</span>
                    {f.count > 1 && (
                      <span className="text-[10px] text-[var(--theme-accent)] font-mono">
                        ({f.count})
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
                Era & Decade
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

      {/* 3. RATINGS & REVIEWS TAB (10-Star Scale & Music Journal Integration) */}
      {renderReviews && (
        <section className="space-y-8 animate-fade-in">
          {/* Header & Write Review / Journal Action */}
          <div className="flex items-center justify-between flex-wrap gap-3 border-b border-[var(--theme-border)]/50 pb-3">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-[var(--theme-accent)] uppercase tracking-widest font-mono">
                <MessageSquare size={15} />
                <span>Community Pulse & Personal Journal</span>
              </div>
              <h2 className="text-2xl font-black text-[var(--theme-fg)] tracking-tight font-display mt-0.5">
                Ratings & Listening Journal
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsJournalModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 hover:opacity-90 text-zinc-950 text-xs font-extrabold transition cursor-pointer shadow-md active:scale-95"
              >
                <Star size={14} fill="currentColor" />
                <span>Rate & Log Journal</span>
              </button>
              <button
                onClick={() => setShowForm(!showForm)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[var(--theme-surface)] hover:bg-[var(--theme-card)] border border-[var(--theme-border)] text-[var(--theme-fg)] text-xs font-semibold transition cursor-pointer"
              >
                <span>{showForm ? "Cancel" : "Quick Comment"}</span>
              </button>
            </div>
          </div>

          {/* Dual Score Overview on 10-Star Scale */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-2">
            {/* Column 1: MusicBrainz Verified Community Rating (out of 10) */}
            <div className="space-y-2 border-b sm:border-b-0 sm:border-r border-[var(--theme-border)]/50 pb-5 sm:pb-0 sm:pr-6">
              <div className="flex items-center gap-2 text-purple-400 text-xs font-bold uppercase tracking-wider font-mono">
                <Award size={15} />
                <span>MusicBrainz Registry Rating</span>
              </div>
              {mbScore10 !== null && Number(mbScore10) > 0 ? (
                <div>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-4xl sm:text-5xl font-black text-[var(--theme-fg)] font-display">
                      {mbScore10}
                    </span>
                    <span className="text-sm font-semibold text-[var(--theme-muted)]">/ 10.0</span>
                  </div>
                  <div className="flex items-center gap-1 text-purple-400 mb-1.5">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                      <Star
                        key={star}
                        size={15}
                        fill={star <= Math.round(Number(mbScore10)) ? "currentColor" : "none"}
                        className={star <= Math.round(Number(mbScore10)) ? "text-purple-400" : "text-zinc-700"}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-[var(--theme-muted)]">
                    {mbVotes ? `Calculated from ${mbVotes} verified catalog community ratings` : "Verified open music registry score"}
                  </p>
                </div>
              ) : (
                <div className="py-2 text-xs text-[var(--theme-muted)]">
                  <p className="font-semibold text-[var(--theme-fg)]/90">No open registry rating yet</p>
                  <p className="text-[11px] mt-0.5">This release has not received votes in the MusicBrainz open catalog.</p>
                </div>
              )}
            </div>

            {/* Column 2: Personal User Rating (10-Star Interactive Scale) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider font-mono">
                  <Star size={15} fill="currentColor" />
                  <span>Your Personal Score (10★ Scale)</span>
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

              {/* 10 Interactive Stars */}
              <div className="flex items-center gap-1.5 my-1 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden" onMouseLeave={() => setHoverRating(0)}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => {
                  const isFilled = (hoverRating || userRating) >= star;
                  return (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onClick={() => handleRateLocally(star)}
                      className="p-1 cursor-pointer transition-transform duration-150 hover:scale-130 focus:outline-none"
                      title={`Rate ${star} / 10`}
                    >
                      <Star
                        size={22}
                        fill={isFilled ? "currentColor" : "none"}
                        className={
                          isFilled 
                            ? "text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.7)]" 
                            : "text-zinc-600 hover:text-amber-300"
                        }
                      />
                    </button>
                  );
                })}
              </div>

              <p className="text-xs text-[var(--theme-muted)]">
                {userRating > 0 ? (
                  <span className="font-semibold text-amber-300">
                    You scored this {type} {userRating}/10 stars · Saved to your local library & journal
                  </span>
                ) : (
                  <span>Click any star above or tap &quot;Rate & Log Journal&quot; to score this release.</span>
                )}
              </p>
            </div>
          </div>

          {/* Inline Quick Review Form (If Toggled) */}
          {showForm && (
            <form onSubmit={handleSubmitReview} className="space-y-4 pt-4 border-t border-[var(--theme-border)]/50 animate-fade-in max-w-2xl">
              <h3 className="text-sm font-bold text-[var(--theme-fg)]">
                Write a Community Review & Journal Entry
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Your Name / Explorer Handle (optional)"
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  className="px-3.5 py-2.5 rounded-xl bg-[var(--theme-surface)] border border-[var(--theme-border)] text-xs text-[var(--theme-fg)] placeholder:text-[var(--theme-muted)] focus:outline-none focus:border-[var(--theme-accent)]"
                />
              </div>
              <textarea
                placeholder="Share your thoughts on the instrumentation, mixing, lyrical themes, or overall mood..."
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                rows={3}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--theme-surface)] border border-[var(--theme-border)] text-xs text-[var(--theme-fg)] placeholder:text-[var(--theme-muted)] focus:outline-none focus:border-[var(--theme-accent)] resize-none"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--theme-muted)] hover:text-[var(--theme-fg)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[var(--theme-accent)] text-[var(--theme-accent-fg)] text-xs font-bold hover:opacity-90 transition shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <Send size={13} />
                  <span>Publish Review</span>
                </button>
              </div>
            </form>
          )}

          {/* Real Stored User Reviews List */}
          {reviews.length > 0 && (
            <div className="pt-6 border-t border-[var(--theme-border)]/50 space-y-4">
              <h3 className="text-xs font-bold text-[var(--theme-muted)] uppercase tracking-wider font-mono">
                Recent Reviews ({reviews.length})
              </h3>
              <div className="space-y-3">
                {reviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="p-4 rounded-2xl bg-[var(--theme-surface)]/60 border border-[var(--theme-border)]/60 space-y-2"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[var(--theme-fg)]">{rev.author}</span>
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-[11px] font-bold font-mono">
                          <Star size={11} fill="currentColor" />
                          <span>{rev.score}/10</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-[var(--theme-muted)]">{rev.date}</span>
                        <button
                          onClick={() => handleDeleteReview(rev.id)}
                          className="text-[var(--theme-muted)] hover:text-rose-400 p-1 cursor-pointer transition"
                          title="Delete Review"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs sm:text-sm text-[var(--theme-muted)] leading-relaxed">
                      {rev.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* 4. EXTERNAL LINKS & CATALOG TAB */}
      {renderLinks && externalLinks.length > 0 && (
        <section className="space-y-6 animate-fade-in">
          <div className="border-b border-[var(--theme-border)]/50 pb-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[var(--theme-accent)] uppercase tracking-widest font-mono">
              <Globe size={15} />
              <span>External Catalog References</span>
            </div>
            <h2 className="text-2xl font-black text-[var(--theme-fg)] tracking-tight font-display mt-0.5">
              Streaming & Open Music Sources
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {externalLinks.map((link, idx) => {
              const url = typeof link === "string" ? link : link.url;
              const sourceName = typeof link === "object" && link.source 
                ? link.source 
                : url.includes("spotify") 
                  ? "Spotify" 
                  : url.includes("apple") 
                    ? "Apple Music" 
                    : url.includes("discogs") 
                      ? "Discogs" 
                      : url.includes("musicbrainz") 
                        ? "MusicBrainz" 
                        : url.includes("wikidata") 
                          ? "Wikidata" 
                          : "Web Link";

              return (
                <a
                  key={`link-${idx}`}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3.5 rounded-2xl bg-[var(--theme-surface)]/60 hover:bg-[var(--theme-card)] border border-[var(--theme-border)] hover:border-[var(--theme-accent)] transition-all duration-200 flex items-center justify-between group cursor-pointer"
                >
                  <div className="min-w-0 pr-2">
                    <span className="text-xs font-bold text-[var(--theme-fg)] group-hover:text-[var(--theme-accent)] transition-colors block truncate">
                      {sourceName}
                    </span>
                    <span className="text-[10px] text-[var(--theme-muted)] truncate block font-mono">
                      {url.replace(/^https?:\/\/(www\.)?/, "")}
                    </span>
                  </div>
                  <ExternalLink size={14} className="text-[var(--theme-muted)] group-hover:text-[var(--theme-accent)] transition-colors shrink-0" />
                </a>
              );
            })}
          </div>
        </section>
      )}

      {/* Rating & Journal Modal triggerable from Reviews tab */}
      <RatingAndJournalModal
        isOpen={isJournalModalOpen}
        onClose={() => setIsJournalModalOpen(false)}
        id={id}
        type={type}
        title={title}
        subtitle={artist}
        initialRating={userRating}
      />
    </div>
  );
}
