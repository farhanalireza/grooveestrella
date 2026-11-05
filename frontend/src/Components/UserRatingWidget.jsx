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
        return null; // Don't flicker before reading localStorage
    }

    if (compact) {
        return (
            <div className={`inline-flex items-center gap-2.5 flex-wrap ${className}`}>
                {/* User Interactive Rating Stars */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--theme-card)]/80 backdrop-blur-md border border-[var(--theme-border)] shadow-sm">
                    <div className="flex items-center gap-0.5" onMouseLeave={() => setHoverRating(0)}>
                        {[1, 2, 3, 4, 5].map((star) => {
                            const isFilled = (hoverRating || userRating) >= star;
                            return (
                                <button
                                    key={star}
                                    type="button"
                                    onMouseEnter={() => setHoverRating(star)}
                                    onClick={() => handleRate(star)}
                                    className="p-0.5 cursor-pointer transition-transform duration-150 hover:scale-125 focus:outline-none"
                                    title={userRating === star ? "Click to clear rating" : `Rate ${star} star${star > 1 ? "s" : ""}`}
                                >
                                    <Star
                                        size={14}
                                        fill={isFilled ? "currentColor" : "none"}
                                        className={`transition-colors duration-150 ${
                                            isFilled 
                                                ? "text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]" 
                                                : "text-zinc-600 hover:text-amber-300"
                                        }`}
                                    />
                                </button>
                            );
                        })}
                    </div>
                    <span className="text-[11px] font-bold text-[var(--theme-fg)] select-none">
                        {userRating > 0 ? (
                            <span className="text-amber-400 font-black">{userRating}★</span>
                        ) : (
                            <span className="text-[var(--theme-muted)] font-medium">Rate</span>
                        )}
                    </span>
                </div>

                {/* MusicBrainz Community Score Badge */}
                {showMusicbrainz && mbScore !== null && mbScore > 0 && (
                    <div 
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-[var(--theme-card)]/60 backdrop-blur-md border border-[var(--theme-border)] text-xs font-semibold text-[var(--theme-muted)] shadow-sm"
                        title={`MusicBrainz Community Rating: ${mbScore.toFixed(1)} / 5${mbVotes ? ` (${mbVotes} votes)` : ""}`}
                    >
                        <Award size={13} className="text-purple-400 shrink-0" />
                        <span className="text-[11px]">
                            <strong className="text-[var(--theme-fg)]">MB:</strong> {mbScore.toFixed(1)}★
                            {mbVotes && <span className="text-[10px] text-[var(--theme-muted)] ml-1">({mbVotes})</span>}
                        </span>
                    </div>
                )}
            </div>
        );
    }

    // Default Full Presentation (For Hero and Sections)
    return (
        <div className={`flex flex-col sm:flex-row items-center gap-2.5 sm:gap-3.5 ${className}`}>
            {/* Interactive User Rating Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--theme-card)]/80 backdrop-blur-md border border-[var(--theme-border)] shadow-md hover:border-[var(--theme-accent)]/40 transition-colors">
                <span className="text-xs font-semibold text-[var(--theme-muted)]">
                    {userRating > 0 ? "Your Rating:" : "Rate:"}
                </span>
                <div className="flex items-center gap-1" onMouseLeave={() => setHoverRating(0)}>
                    {[1, 2, 3, 4, 5].map((star) => {
                        const isFilled = (hoverRating || userRating) >= star;
                        return (
                            <button
                                key={star}
                                type="button"
                                onMouseEnter={() => setHoverRating(star)}
                                onClick={() => handleRate(star)}
                                className="p-0.5 cursor-pointer transition-transform duration-150 hover:scale-125 focus:outline-none"
                                title={userRating === star ? "Click to remove rating" : `Rate ${star} star${star > 1 ? "s" : ""}`}
                            >
                                <Star
                                    size={17}
                                    fill={isFilled ? "currentColor" : "none"}
                                    className={`transition-colors duration-150 ${
                                        isFilled 
                                            ? "text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" 
                                            : "text-zinc-600 hover:text-amber-300"
                                    }`}
                                />
                            </button>
                        );
                    })}
                </div>
                {userRating > 0 && (
                    <span className="text-xs font-black text-amber-400 flex items-center gap-1 select-none">
                        <span>{userRating}/5</span>
                        <Check size={12} className="text-emerald-400" />
                    </span>
                )}
            </div>

            {/* MusicBrainz Rating Pill */}
            {showMusicbrainz && mbScore !== null && mbScore > 0 && (
                <div 
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--theme-card)]/70 backdrop-blur-md border border-[var(--theme-border)] text-xs font-semibold text-[var(--theme-muted)] shadow-md"
                    title={`MusicBrainz Community Rating: ${mbScore.toFixed(1)} / 5${mbVotes ? ` (${mbVotes} votes)` : ""}`}
                >
                    <Award size={14} className="text-purple-400 shrink-0" />
                    <span>
                        <strong className="text-[var(--theme-fg)]">MusicBrainz:</strong> {mbScore.toFixed(1)} / 5
                        {mbVotes && <span className="text-[10px] text-[var(--theme-muted)] ml-1">({mbVotes} votes)</span>}
                    </span>
                </div>
            )}
        </div>
    );
}
