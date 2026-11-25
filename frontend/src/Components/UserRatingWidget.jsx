// src/Components/UserRatingWidget.jsx
"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Star, Award, BookOpen, X, Sparkles } from "lucide-react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import RatingAndJournalModal from "./RatingAndJournalModal";
import { toast } from "@/lib/toast";

const STAR_DESCRIPTORS = {
  1: "1/10 · Appalling",
  2: "2/10 · Terrible",
  3: "3/10 · Bad",
  4: "4/10 · Subpar",
  5: "5/10 · Mediocre",
  6: "6/10 · Decent",
  7: "7/10 · Good",
  8: "8/10 · Great",
  9: "9/10 · Superb",
  10: "10/10 · Masterpiece 👑",
};

export default function UserRatingWidget({
  id,
  type = "album", // track | album | artist
  musicbrainzRating = null,
  itemTitle = "Untitled",
  itemSubtitle = "",
  itemImage = "",
  itemYear = null,
  year = null,
  compact = false,
  showMusicbrainz = true,
  className = "",
}) {
  const { user } = useSupabaseAuth();
  const [userRating, setUserRating] = useState(0);
  const [ratingSystem, setRatingSystem] = useState("stars");
  const [communitySummary, setCommunitySummary] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showQuickRate, setShowQuickRate] = useState(false);
  const [hoverStar, setHoverStar] = useState(0);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const quickRateRef = useRef(null);

  const storageKey = `groove_user_rating_${type}_${id}`;

  // Load initial user rating from localStorage
  const loadRating = useCallback(() => {
    if (!id || typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (typeof parsed === "number") {
          setUserRating(parsed);
          setRatingSystem("stars");
        } else if (parsed && typeof parsed.score === "number") {
          setUserRating(parsed.score);
          setRatingSystem(parsed.system || "stars");
        }
      } else {
        setUserRating(0);
      }
    } catch (_) {
      setUserRating(0);
    }
    setIsLoaded(true);
  }, [id, storageKey]);

  useEffect(() => {
    loadRating();

    const handleRatingUpdate = (e) => {
      if (e.detail?.id === id && e.detail?.type === type) {
        setUserRating(e.detail.score || 0);
        if (e.detail.system) setRatingSystem(e.detail.system);
      }
    };

    window.addEventListener("groove-rating-changed", handleRatingUpdate);
    return () => window.removeEventListener("groove-rating-changed", handleRatingUpdate);
  }, [id, type, loadRating]);

  // Close quick-rate popover on outside click
  useEffect(() => {
    if (!showQuickRate) return;
    const handleClickOutside = (e) => {
      if (quickRateRef.current && !quickRateRef.current.contains(e.target)) {
        setShowQuickRate(false);
        setHoverStar(0);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [showQuickRate]);

  // Query Supabase community rating summary (always public) & signed-in user's rating
  useEffect(() => {
    if (!id || !isSupabaseConfigured()) return;
    let active = true;
    const supabase = createClient();

    supabase
      .from("entity_ratings_summary")
      .select("*")
      .eq("mbid", id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (active && !error && data && Number(data.total_ratings) > 0) {
          setCommunitySummary(data);
        }
      })
      .catch(() => {});

    if (user) {
      (async () => {
        try {
          const { data: ent } = await supabase
            .from("music_entities")
            .select("id")
            .eq("mbid", id)
            .maybeSingle();
          if (!active || !ent?.id) return;
          const { data: ur } = await supabase
            .from("user_ratings")
            .select("score, rating_type")
            .eq("user_id", user.id)
            .eq("entity_id", ent.id)
            .limit(1)
            .maybeSingle();
          if (active && ur) {
            setUserRating(Number(ur.score));
            setRatingSystem(ur.rating_type || "stars");
          }
        } catch (_) {}
      })();
    }

    return () => {
      active = false;
    };
  }, [id, user?.id]);

  // Quick-rate: saves rating and automatically logs to journal without review text or tags
  const handleQuickRate = async (score) => {
    const prevRating = userRating;
    setUserRating(score);
    setShowQuickRate(false);
    setHoverStar(0);

    try {
      // 1. Save user rating to localStorage
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          score,
          numericalScore: score * 10,
          system: "stars",
          updatedAt: Date.now(),
        })
      );

      // Dispatch rating change event
      window.dispatchEvent(
        new CustomEvent("groove-rating-changed", {
          detail: { id, type, score, numericalScore: score * 10, system: "stars" },
        })
      );

      // 2. Automatically log to journal (without review text or tags)
      const rawJournal = localStorage.getItem("groove_journal_logs");
      let logs = rawJournal ? JSON.parse(rawJournal) : [];
      const existingIdx = logs.findIndex((l) => l.targetId === id && l.targetType === type);
      const entryDate = new Date().toISOString().split("T")[0];

      if (existingIdx >= 0) {
        logs[existingIdx].rating = score;
        logs[existingIdx].numericalScore = score * 10;
        logs[existingIdx].ratingSystem = "stars";
        logs[existingIdx].updatedAt = Date.now();
      } else {
        const entryId = `journal_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        logs.unshift({
          id: entryId,
          targetId: id,
          targetType: type,
          title: itemTitle || "Untitled",
          subtitle: itemSubtitle || "",
          image: itemImage || "",
          rating: score,
          numericalScore: score * 10,
          ratingSystem: "stars",
          date: entryDate,
          review: "",
          mood: "",
          tags: [],
          is_public: true,
          updatedAt: Date.now(),
          createdAt: Date.now(),
        });
      }
      localStorage.setItem("groove_journal_logs", JSON.stringify(logs));

      // 3. Supabase Cloud Sync (if authenticated)
      if (user && isSupabaseConfigured()) {
        try {
          const supabase = createClient();
          let entityRecordId = null;
          const effectiveYear = Number.isInteger(itemYear) ? itemYear : Number.isInteger(year) ? year : null;

          try {
            const syncRes = await fetch("/api/entity/sync", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                mbid: id,
                type: type === "track" ? "track" : type === "artist" ? "artist" : "album",
                title: itemTitle || "Untitled",
                artist: itemSubtitle || "",
                year: effectiveYear,
                cover_art_url: itemImage || null,
              }),
            });
            if (syncRes.ok) {
              const syncData = await syncRes.json();
              if (syncData?.entity?.id) entityRecordId = syncData.entity.id;
            }
          } catch (_) {}

          if (!entityRecordId) {
            const { data: existingEntity } = await supabase
              .from("music_entities")
              .select("id")
              .eq("mbid", id)
              .maybeSingle();
            if (existingEntity) entityRecordId = existingEntity.id;
          }

          if (entityRecordId) {
            await supabase
              .from("user_ratings")
              .upsert(
                {
                  user_id: user.id,
                  entity_id: entityRecordId,
                  rating_type: "stars",
                  score,
                  review: null,
                  listened_date: entryDate,
                  is_public: true,
                },
                { onConflict: "user_id,entity_id,rating_type" }
              );
          }
        } catch (_) {}
      }

      window.dispatchEvent(
        new CustomEvent("groove-journal-updated", { detail: { targetId: id } })
      );

      toast.success(`Rated ${score}/10 ⭐ (Logged to Journal)`);
    } catch (err) {
      setUserRating(prevRating);
      toast.error("Failed to save rating");
    }
  };

  const handleClearRating = () => {
    setUserRating(0);
    setShowQuickRate(false);
    try {
      localStorage.removeItem(storageKey);
      window.dispatchEvent(
        new CustomEvent("groove-rating-changed", {
          detail: { id, type, score: 0 },
        })
      );
      toast.info("Rating cleared");
    } catch (_) {}
  };

  // Parse MusicBrainz rating (convert to 10-star scale for consistency)
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

  const communityDisplay10 =
    communitySummary?.normalized_score_100 !== null && communitySummary?.normalized_score_100 !== undefined
      ? (Number(communitySummary.normalized_score_100) / 10).toFixed(1)
      : communitySummary?.avg_stars
      ? Number(communitySummary.avg_stars).toFixed(1)
      : null;

  const isArtist = type === "artist";

  if (!isLoaded) {
    return null;
  }

  return (
    <>
      <div className={`relative inline-flex items-center gap-2 select-none flex-wrap ${className}`} ref={quickRateRef}>
        {/* Primary Action for Albums, Tracks & Artists: "Log a Listen" / "Rate Artist" */}
        <button
          type="button"
          onClick={() => setIsLogModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black text-zinc-950 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 hover:opacity-95 active:scale-95 shadow-md shadow-amber-400/20 transition-all duration-200 cursor-pointer group shrink-0"
          title={isArtist ? "Rate and review this artist" : "Log a listen with rating, date, review & mood"}
        >
          <BookOpen size={13} className="text-zinc-950 shrink-0" />
          <span>{isArtist ? "Rate Artist" : "Log a Listen"}</span>
        </button>

        {/* Ratings Component Capsule: [ ★ Rate ] | [ 🎀 8.5★ (11) ] */}
        <div className="inline-flex items-center gap-1.5 p-1 px-2 sm:px-2.5 rounded-full bg-black/40 backdrop-blur-xl border border-white/15 shadow-md transition-all duration-200 hover:border-amber-400/35 shrink-0">
          {/* Rate Button */}
          <button
            type="button"
            onClick={() => setShowQuickRate((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer active:scale-95 group ${
              userRating > 0
                ? "bg-amber-400/20 text-amber-300 border border-amber-400/40 shadow-[0_0_10px_rgba(251,191,36,0.2)] hover:border-amber-400/60"
                : "bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 border border-amber-400/30 hover:border-amber-400/50"
            }`}
            title={
              userRating > 0
                ? `Your rating: ${userRating}/10. Tap to change.`
                : "Tap to quickly rate"
            }
          >
            <Star
              size={compact ? 12 : 13}
              fill="currentColor"
              className={`transition-transform duration-200 group-hover:scale-110 ${
                userRating > 0
                  ? "text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.8)]"
                  : "text-amber-300"
              }`}
            />
            <span className="font-extrabold tracking-tight">
              {userRating > 0 ? `${userRating}★` : "Rate"}
            </span>
          </button>

          {/* Vertical Divider */}
          <div className="w-[1px] h-3.5 bg-white/20 mx-0.5" />

          {/* Community or MusicBrainz Score (Purple ribbon / Award icon) */}
          {communitySummary && Number(communitySummary.total_ratings) > 0 && communityDisplay10 ? (
            <div
              className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300 pr-1 cursor-help"
              title={`GrooveEstrella Community: ${communityDisplay10}★ (${communitySummary.total_ratings} ${
                Number(communitySummary.total_ratings) === 1 ? "rating" : "ratings"
              })`}
            >
              <Award size={13} className="shrink-0 text-amber-400" />
              <span>{communityDisplay10}★</span>
              <span className="text-[9px] text-[var(--theme-muted)] font-normal">
                ({communitySummary.total_ratings})
              </span>
            </div>
          ) : showMusicbrainz && mbScore10 !== null && Number(mbScore10) > 0 ? (
            <div
              className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-300 pr-1 cursor-help"
              title={`MusicBrainz Community Rating: ${mbScore10}/10${mbVotes ? ` (${mbVotes} votes)` : ""}`}
            >
              <Award size={13} className="shrink-0 text-purple-400" />
              <span>{mbScore10}★</span>
              {mbVotes && (
                <span className="text-[9px] text-[var(--theme-muted)] font-normal">
                  ({mbVotes})
                </span>
              )}
            </div>
          ) : (
            <div className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-300/70 pr-1">
              <Award size={13} className="shrink-0 text-purple-400/70" />
              <span className="text-[10px] text-[var(--theme-muted)]">Unrated</span>
            </div>
          )}
        </div>

        {/* Quick Rate Popover (1-10 stars, auto-logs upon selection) */}
        {showQuickRate && (
          <div className="absolute top-full left-0 mt-2 z-50 animate-fade-in">
            <div className="p-3 rounded-2xl bg-[var(--theme-card)]/95 backdrop-blur-2xl border border-[var(--theme-border)] shadow-2xl space-y-2 min-w-[280px]">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-[var(--theme-fg)] flex items-center gap-1">
                  <Star size={12} className="text-amber-400" />
                  <span>{hoverStar > 0 ? STAR_DESCRIPTORS[hoverStar] : userRating > 0 ? STAR_DESCRIPTORS[userRating] : "Quick Rate (1-10)"}</span>
                </span>
                {userRating > 0 && (
                  <button
                    type="button"
                    onClick={handleClearRating}
                    className="text-[10px] text-rose-400 hover:underline cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* 10 Star Buttons */}
              <div
                className="flex items-center justify-between gap-1 p-1 rounded-xl bg-black/20 border border-white/5"
                onMouseLeave={() => setHoverStar(0)}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => {
                  const isActive = (hoverStar || userRating) >= star;
                  return (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverStar(star)}
                      onClick={() => handleQuickRate(star)}
                      className="p-1 rounded-md transition-transform duration-100 hover:scale-125 active:scale-90 cursor-pointer focus:outline-none"
                      title={`${star}/10`}
                    >
                      <Star
                        size={18}
                        fill={isActive ? "currentColor" : "none"}
                        className={`transition-colors duration-150 ${
                          isActive
                            ? "text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.8)]"
                            : "text-zinc-600 hover:text-amber-200"
                        }`}
                      />
                    </button>
                  );
                })}
              </div>

              {/* Footer info in popover */}
              <div className="pt-1 border-t border-[var(--theme-border)]/50 flex items-center justify-between">
                <span className="text-[10px] text-[var(--theme-muted)]">
                  {isArtist ? "Rating saved publicly" : "Auto-logged to journal"}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setShowQuickRate(false);
                    setIsLogModalOpen(true);
                  }}
                  className="text-[10px] font-bold text-amber-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <BookOpen size={10} />
                  <span>Write review & notes →</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Full Music Journal & Rating Modal (Image 5) */}
      <RatingAndJournalModal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        id={id}
        type={type}
        title={itemTitle}
        subtitle={itemSubtitle}
        image={itemImage}
        year={itemYear || year}
        initialRating={userRating}
      />
    </>
  );
}
