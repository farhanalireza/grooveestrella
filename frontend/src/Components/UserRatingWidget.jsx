// src/Components/UserRatingWidget.jsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Star, Award, Sparkles, BookOpen, Sliders } from "lucide-react";
import RatingAndJournalModal from "./RatingAndJournalModal";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

export default function UserRatingWidget({
  id,
  type = "album", // track | album | artist
  musicbrainzRating = null,
  itemTitle = "Untitled",
  itemSubtitle = "",
  itemImage = "",
  compact = false,
  showMusicbrainz = true,
  className = "",
}) {
  const [userRating, setUserRating] = useState(0);
  const [ratingSystem, setRatingSystem] = useState("stars");
  const [communitySummary, setCommunitySummary] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  // Optionally query Supabase community rating summary for this entity
  useEffect(() => {
    if (!id || !isSupabaseConfigured()) return;
    const supabase = createClient();
    supabase
      .from("entity_ratings_summary")
      .select("*")
      .eq("mbid", id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!error && data && data.total_ratings > 0) {
          setCommunitySummary(data);
        }
      })
      .catch(() => {});
  }, [id]);

  // Parse MusicBrainz rating (convert to 10-star scale for consistency)
  const rawMb =
    musicbrainzRating?.value !== undefined
      ? Number(musicbrainzRating.value)
      : typeof musicbrainzRating === "number"
      ? musicbrainzRating
      : null;

  const mbVotes = musicbrainzRating?.votesCount || musicbrainzRating?.votes_count || null;

  // Scale MusicBrainz score to 10-star scale if it was 0-5
  const mbScore10 =
    rawMb !== null && rawMb > 0
      ? rawMb <= 5
        ? (rawMb * 2).toFixed(1)
        : rawMb.toFixed(1)
      : null;

  if (!isLoaded) {
    return null;
  }

  return (
    <>
      <div
        className={`inline-flex items-center gap-2 p-1 px-2.5 rounded-full bg-[var(--theme-card)]/90 backdrop-blur-xl border border-[var(--theme-border)] shadow-md select-none transition-all duration-200 hover:border-amber-400/40 ${className}`}
      >
        {/* Golden Glowing Interactive Rate Button */}
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer active:scale-95 group ${
            userRating > 0
              ? "bg-gradient-to-r from-amber-400/20 via-amber-300/25 to-amber-400/20 text-amber-300 border border-amber-400/40 shadow-[0_0_12px_rgba(251,191,36,0.25)] hover:border-amber-400/60"
              : "bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 border border-amber-400/30 hover:border-amber-400/50"
          }`}
          title={
            userRating > 0
              ? `Your score: ${userRating}${ratingSystem === "score" ? "/100" : "/10"}. Tap to edit rating or notes.`
              : "Tap to rate & write journal log"
          }
        >
          <Star
            size={compact ? 12 : 14}
            fill="currentColor"
            className={`transition-transform duration-200 group-hover:scale-110 ${
              userRating > 0
                ? "text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.9)]"
                : "text-amber-300"
            }`}
          />
          {userRating > 0 ? (
            <div className="flex items-center gap-1">
              <span className="font-black font-mono tracking-tight">
                {userRating}
                {ratingSystem === "score" ? "/100" : "/10"}
              </span>
              <span className="text-[10px] text-amber-200/90 font-medium hidden sm:inline">
                · Rated
              </span>
            </div>
          ) : (
            <span className="font-extrabold tracking-tight">Rate</span>
          )}
        </button>

        {/* Live Supabase Community Rating (if available) or MusicBrainz Community Score */}
        {communitySummary && communitySummary.total_ratings > 0 ? (
          <>
            <div className="w-[1px] h-3.5 bg-white/10 mx-0.5" />
            <div
              className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300 cursor-help"
              title={`Groove Community Average: ${communitySummary.avg_stars || communitySummary.normalized_score_100} (${communitySummary.total_ratings} logs)`}
            >
              <Award size={13} className="shrink-0 text-amber-400" />
              <span>{communitySummary.avg_stars ? `${communitySummary.avg_stars}★` : `${communitySummary.normalized_score_100}`}</span>
              <span className="text-[9px] text-[var(--theme-muted)] font-normal">
                ({communitySummary.total_ratings})
              </span>
            </div>
          </>
        ) : showMusicbrainz && mbScore10 !== null && Number(mbScore10) > 0 ? (
          <>
            <div className="w-[1px] h-3.5 bg-white/10 mx-0.5" />
            <div
              className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-400 cursor-help"
              title={`MusicBrainz Community Rating: ${mbScore10} / 10${
                mbVotes ? ` (${mbVotes} votes)` : ""
              }`}
            >
              <Award size={13} className="shrink-0 text-purple-400" />
              <span>{mbScore10}★</span>
              {mbVotes && (
                <span className="text-[9px] text-[var(--theme-muted)] font-normal">
                  ({mbVotes})
                </span>
              )}
            </div>
          </>
        ) : null}
      </div>

      {/* Modal for 10-star/0-100 rating and music journal logging */}
      <RatingAndJournalModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        id={id}
        type={type}
        title={itemTitle}
        subtitle={itemSubtitle}
        image={itemImage}
        initialRating={userRating}
      />
    </>
  );
}
