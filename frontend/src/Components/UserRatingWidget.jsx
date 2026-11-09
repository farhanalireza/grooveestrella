// src/Components/UserRatingWidget.jsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Star, Award, Sparkles, BookOpen } from "lucide-react";
import RatingAndJournalModal from "./RatingAndJournalModal";

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
    const [isLoaded, setIsLoaded] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const storageKey = `groove_user_rating_${type}_${id}`;

    // Load initial user rating from localStorage (1-10 scale)
    const loadRating = useCallback(() => {
        if (!id || typeof window === "undefined") return;
        try {
            const raw = localStorage.getItem(storageKey);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (typeof parsed === "number") {
                    setUserRating(parsed);
                } else if (parsed && typeof parsed.score === "number") {
                    setUserRating(parsed.score);
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
            }
        };

        window.addEventListener("groove-rating-changed", handleRatingUpdate);
        return () => window.removeEventListener("groove-rating-changed", handleRatingUpdate);
    }, [id, type, loadRating]);

    // Parse MusicBrainz rating (convert to 10-star scale for consistency)
    const rawMb = musicbrainzRating?.value !== undefined 
        ? Number(musicbrainzRating.value) 
        : typeof musicbrainzRating === "number" 
            ? musicbrainzRating 
            : null;

    const mbVotes = musicbrainzRating?.votesCount || musicbrainzRating?.votes_count || null;
    
    // Scale MusicBrainz score to 10-star scale if it was 0-5
    const mbScore10 = rawMb !== null && rawMb > 0
        ? (rawMb <= 5 ? (rawMb * 2).toFixed(1) : rawMb.toFixed(1))
        : null;

    if (!isLoaded) {
        return null;
    }

    return (
        <>
            <div className={`inline-flex items-center gap-2 p-1 px-2.5 rounded-full bg-[var(--theme-card)]/90 backdrop-blur-xl border border-[var(--theme-border)] shadow-md select-none transition-all duration-200 hover:border-amber-400/40 ${className}`}>
                {/* Golden Glowing Interactive Rate Button */}
                <button
                    type="button"
                    onClick={() => setIsModalOpen(true)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer active:scale-95 group ${
                        userRating > 0
                            ? "bg-gradient-to-r from-amber-400/20 via-amber-300/25 to-amber-400/20 text-amber-300 border border-amber-400/40 shadow-[0_0_12px_rgba(251,191,36,0.25)] hover:border-amber-400/60"
                            : "bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 border border-amber-400/30 hover:border-amber-400/50"
                    }`}
                    title={userRating > 0 ? `Your score: ${userRating}/10. Tap to edit review or rating.` : "Tap to rate on 10-star scale & write journal note"}
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
                            <span className="font-black font-mono tracking-tight">{userRating}/10</span>
                            <span className="text-[10px] text-amber-200/90 font-medium hidden sm:inline">· Rated</span>
                        </div>
                    ) : (
                        <span className="font-extrabold tracking-tight">Rate</span>
                    )}
                </button>

                {/* Subtle Vertical Divider & Converted 10-Star MusicBrainz Score */}
                {showMusicbrainz && mbScore10 !== null && Number(mbScore10) > 0 && (
                    <>
                        <div className="w-[1px] h-3.5 bg-white/10 mx-0.5" />
                        <div 
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-400 cursor-help"
                            title={`MusicBrainz Community Rating: ${mbScore10} / 10${mbVotes ? ` (${mbVotes} votes)` : ""}`}
                        >
                            <Award size={13} className="shrink-0 text-purple-400" />
                            <span>{mbScore10}★</span>
                            {mbVotes && <span className="text-[9px] text-[var(--theme-muted)] font-normal">({mbVotes})</span>}
                        </div>
                    </>
                )}
            </div>

            {/* Modal for 10-star rating and music journal logging */}
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
