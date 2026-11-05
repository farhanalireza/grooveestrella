// src/Components/UserRatingWidget.jsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Star, Award, Check } from "lucide-react";
import { toast } from "@/lib/toast";

export default function UserRatingWidget({
    id,
    type = "album", // track | album | artist
    musicbrainzRating = null,
    compact = false,
    showMusicbrainz = true,
    className = "",
}) {
    const [userRating, setUserRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [isLoaded, setIsLoaded] = useState(false);

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

    const handleRate = (star) => {
        const newScore = userRating === star ? 0 : star; // Toggle off if clicked again
        setUserRating(newScore);

        try {
            if (newScore > 0) {
                localStorage.setItem(storageKey, JSON.stringify({ score: newScore, updatedAt: Date.now() }));
                toast.success(`You rated this ${type} ${newScore}/5 ⭐`);
            } else {
                localStorage.removeItem(storageKey);
                toast.info(`Rating cleared`);
            }
        } catch (_) {}

        // Broadcast to other components on page (e.g. hero <-> review section)
        if (typeof window !== "undefined") {
            window.dispatchEvent(
                new CustomEvent("groove-rating-changed", {
                    detail: { id, type, score: newScore }
                })
            );
        }
    };

    // Parse MusicBrainz rating
    const mbScore = musicbrainzRating?.value !== undefined 
        ? Number(musicbrainzRating.value) 
        : typeof musicbrainzRating === "number" 
            ? musicbrainzRating 
            : null;

    const mbVotes = musicbrainzRating?.votesCount || musicbrainzRating?.votes_count || null;

    if (!isLoaded) {
        return null;
    }

    // Unified Minimalist & Playful Horizontal Capsule
    return (
        <div className={`inline-flex items-center gap-2 p-1.5 px-3 rounded-full bg-[var(--theme-card)]/80 backdrop-blur-xl border border-[var(--theme-border)] shadow-md select-none transition-all duration-200 hover:border-[var(--theme-accent)]/30 ${className}`}>
            {/* Interactive User Rating Stars */}
            <div className="flex items-center gap-0.5" onMouseLeave={() => setHoverRating(0)}>
                {[1, 2, 3, 4, 5].map((star) => {
                    const isFilled = (hoverRating || userRating) >= star;
                    return (
                        <button
                            key={star}
                            type="button"
                            onMouseEnter={() => setHoverRating(star)}
                            onClick={() => handleRate(star)}
                            className="p-0.5 cursor-pointer transition-transform duration-150 hover:scale-130 active:scale-95 focus:outline-none"
                            title={userRating === star ? "Click to clear rating" : `Rate ${star} star${star > 1 ? "s" : ""}`}
                        >
                            <Star
                                size={compact ? 13 : 15}
                                fill={isFilled ? "currentColor" : "none"}
                                className={`transition-colors duration-150 ${
                                    isFilled 
                                        ? "text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.6)]" 
                                        : "text-zinc-600 hover:text-amber-300"
                                }`}
                            />
                        </button>
                    );
                })}
            </div>

            {userRating > 0 ? (
                <span className="text-[11px] font-black text-amber-400 font-mono tracking-tight">
                    {userRating}★
                </span>
            ) : (
                <span className="text-[10px] text-[var(--theme-muted)] font-medium">
                    Rate
                </span>
            )}

            {/* Subtle Divider & MusicBrainz Score */}
            {showMusicbrainz && mbScore !== null && mbScore > 0 && (
                <>
                    <div className="w-[1px] h-3.5 bg-white/10 mx-0.5" />
                    <div 
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-400 cursor-help"
                        title={`MusicBrainz Community Rating: ${mbScore.toFixed(1)} / 5${mbVotes ? ` (${mbVotes} votes)` : ""}`}
                    >
                        <Award size={13} className="shrink-0 text-purple-400" />
                        <span>{mbScore.toFixed(1)}★</span>
                        {mbVotes && <span className="text-[9px] text-[var(--theme-muted)] font-normal">({mbVotes})</span>}
                    </div>
                </>
            )}
        </div>
    );
}
