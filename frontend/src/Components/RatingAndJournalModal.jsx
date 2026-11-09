// src/Components/RatingAndJournalModal.jsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { X, Star, BookOpen, Calendar, Sparkles, Tag, Check, Trash2 } from "lucide-react";
import { toast } from "@/lib/toast";

const RATING_DESCRIPTORS = {
  1: { label: "Appalling", mood: "Unlistenable" },
  2: { label: "Terrible", mood: "Heavy flaws" },
  3: { label: "Bad", mood: "Disappointing" },
  4: { label: "Subpar", mood: "Below average" },
  5: { label: "Mediocre", mood: "Decent ideas, mixed execution" },
  6: { label: "Decent", mood: "Enjoyable listen" },
  7: { label: "Good", mood: "Solid release" },
  8: { label: "Great", mood: "Memorable & strong" },
  9: { label: "Superb", mood: "Outstanding masterpiece level" },
  10: { label: "Masterpiece 👑", mood: "Timeless perfection" },
};

const SUGGESTED_TAGS = [
  "Vinyl Session", "Late Night", "Headphones", "Audiophile", 
  "Euphoric", "Nostalgic", "Road Trip", "Introspective", "Favorite Pressing"
];

export default function RatingAndJournalModal({
  isOpen,
  onClose,
  id,
  type = "album", // 'album' | 'track' | 'artist'
  title = "Untitled",
  subtitle = "",
  image = "",
  initialRating = 0,
  initialReview = "",
  journalEntryId = null,
}) {
  const [rating, setRating] = useState(initialRating || 0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reflection, setReflection] = useState(initialReview || "");
  const [selectedTags, setSelectedTags] = useState([]);
  const [entryDate, setEntryDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [existingJournalEntry, setExistingJournalEntry] = useState(null);

  const ratingStorageKey = `groove_user_rating_${type}_${id}`;

  // Sync state on modal open
  useEffect(() => {
    if (!isOpen || typeof window === "undefined" || !id) return;

    try {
      // 1. Load user rating
      const rawRating = localStorage.getItem(ratingStorageKey);
      let currentScore = 0;
      if (rawRating) {
        const parsed = JSON.parse(rawRating);
        currentScore = typeof parsed === "number" ? parsed : (parsed?.score || 0);
      }
      setRating(currentScore);

      // 2. Load existing journal entry if any
      const rawJournal = localStorage.getItem("groove_journal_logs");
      if (rawJournal) {
        const logs = JSON.parse(rawJournal);
        const match = journalEntryId 
          ? logs.find(l => l.id === journalEntryId)
          : logs.find(l => l.targetId === id && l.targetType === type);

        if (match) {
          setExistingJournalEntry(match);
          setReflection(match.review || match.reflection || "");
          setSelectedTags(Array.isArray(match.tags) ? match.tags : []);
          if (match.date) {
            setEntryDate(match.date.split("T")[0]);
          }
          if (match.rating && !currentScore) {
            setRating(match.rating);
          }
        } else {
          setExistingJournalEntry(null);
          setReflection("");
          setSelectedTags([]);
        }
      }
    } catch (_) {}
  }, [isOpen, id, type, journalEntryId, ratingStorageKey]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const activeDescriptor = useMemo(() => {
    const activeScore = hoverRating || rating;
    return RATING_DESCRIPTORS[activeScore] || null;
  }, [hoverRating, rating]);

  const toggleTag = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleClearRating = () => {
    setRating(0);
    try {
      localStorage.removeItem(ratingStorageKey);
      window.dispatchEvent(
        new CustomEvent("groove-rating-changed", {
          detail: { id, type, score: 0 }
        })
      );
      toast.info("Rating cleared");
    } catch (_) {}
  };

  const handleSave = () => {
    if (rating === 0 && !reflection.trim()) {
      toast.warning("Please select a 10-star rating or write a journal note.");
      return;
    }

    try {
      // 1. Save user rating
      if (rating > 0) {
        localStorage.setItem(ratingStorageKey, JSON.stringify({ score: rating, updatedAt: Date.now() }));
      } else {
        localStorage.removeItem(ratingStorageKey);
      }

      window.dispatchEvent(
        new CustomEvent("groove-rating-changed", {
          detail: { id, type, score: rating }
        })
      );

      // 2. Save or update journal entry
      const rawJournal = localStorage.getItem("groove_journal_logs");
      let logs = rawJournal ? JSON.parse(rawJournal) : [];

      const entryId = existingJournalEntry?.id || journalEntryId || `journal_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      
      const newEntry = {
        id: entryId,
        targetId: id,
        targetType: type,
        title: title || "Untitled",
        subtitle: subtitle || "",
        image: image || "",
        rating: rating,
        date: entryDate,
        review: reflection.trim(),
        tags: selectedTags,
        updatedAt: Date.now(),
        createdAt: existingJournalEntry?.createdAt || Date.now(),
      };

      // Filter out previous version of this entry
      logs = logs.filter(l => l.id !== entryId && !(l.targetId === id && l.targetType === type));
      // Prepend the new/updated entry
      logs.unshift(newEntry);

      localStorage.setItem("groove_journal_logs", JSON.stringify(logs));

      window.dispatchEvent(
        new CustomEvent("groove-journal-updated", {
          detail: { targetId: id, entryId }
        })
      );

      toast.success(
        rating > 0 
          ? `Rated ${rating}/10 and saved to your Music Journal! 📓✨`
          : `Note saved to your Music Journal! 📓`
      );
      onClose();
    } catch (err) {
      console.error("Failed to save journal log:", err);
      toast.error("Failed to save journal log. Please try again.");
    }
  };

  const handleDeleteEntry = () => {
    if (!existingJournalEntry) return;
    try {
      const rawJournal = localStorage.getItem("groove_journal_logs");
      if (rawJournal) {
        const logs = JSON.parse(rawJournal).filter(l => l.id !== existingJournalEntry.id);
        localStorage.setItem("groove_journal_logs", JSON.stringify(logs));
      }
      window.dispatchEvent(
        new CustomEvent("groove-journal-updated", {
          detail: { targetId: id }
        })
      );
      toast.info("Journal entry removed");
      onClose();
    } catch (_) {}
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md animate-fade-in">
      <div 
        className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-3xl bg-[var(--theme-card)] border border-[var(--theme-border)] shadow-2xl text-[var(--theme-fg)] flex flex-col scrollb-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Vintage Notebook Header Strip */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--theme-border)]/60 bg-[var(--theme-surface)]/70 backdrop-blur-xl sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-400/15 border border-amber-400/30 flex items-center justify-center text-amber-300">
              <BookOpen size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight text-[var(--theme-fg)] flex items-center gap-1.5">
                <span>Music Journal & Rate</span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/20 font-bold">10★ Scale</span>
              </h2>
              <p className="text-[11px] text-[var(--theme-muted)]">Log this listen, score it, and save your notes.</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[var(--theme-card)] hover:bg-[var(--theme-surface)] border border-[var(--theme-border)] flex items-center justify-center text-[var(--theme-muted)] hover:text-[var(--theme-fg)] transition cursor-pointer"
            title="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-6 flex-1">
          {/* Target Media Card */}
          <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-[var(--theme-surface)]/60 border border-[var(--theme-border)]/50">
            {image ? (
              <img 
                src={image} 
                alt={title} 
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover shrink-0 shadow-md ring-1 ring-[var(--theme-border)]"
                onError={(e) => { e.currentTarget.src = "https://placehold.co/100x100/17020B/E8A87C?text=Groove"; }}
              />
            ) : (
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-[var(--theme-card)] flex items-center justify-center text-[var(--theme-muted)] shrink-0 border border-[var(--theme-border)]">
                <BookOpen size={24} />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--theme-accent)]">
                {type}
              </span>
              <h3 className="text-base font-extrabold text-[var(--theme-fg)] truncate">
                {title}
              </h3>
              {subtitle && (
                <p className="text-xs text-[var(--theme-muted)] truncate mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {/* 10-Star Interactive Rating Section */}
          <div className="space-y-3 p-4 rounded-2xl bg-gradient-to-b from-amber-400/5 to-transparent border border-amber-400/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                <Sparkles size={13} />
                <span>Your 10-Star Score</span>
              </span>
              {rating > 0 && (
                <button
                  type="button"
                  onClick={handleClearRating}
                  className="text-[11px] font-semibold text-rose-400 hover:text-rose-300 hover:underline cursor-pointer"
                >
                  Clear Rating
                </button>
              )}
            </div>

            {/* 10 Stars in one responsive, glowing row */}
            <div 
              className="flex items-center justify-between gap-1 sm:gap-2 px-1 py-2 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
              onMouseLeave={() => setHoverRating(0)}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => {
                const isSelected = (hoverRating || rating) >= star;
                const isHoveredExact = hoverRating === star;
                const isSelectedExact = rating === star;

                return (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoverRating(star)}
                    onClick={() => setRating(star)}
                    className="p-1 sm:p-1.5 rounded-lg transition-transform duration-150 hover:scale-125 active:scale-95 cursor-pointer focus:outline-none flex flex-col items-center group"
                    title={`Rate ${star} / 10`}
                  >
                    <Star
                      size={24}
                      fill={isSelected ? "currentColor" : "none"}
                      className={`transition-all duration-200 ${
                        isSelected
                          ? "text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.85)] scale-105"
                          : "text-zinc-600 hover:text-amber-200"
                      }`}
                    />
                    <span className={`text-[10px] font-mono mt-0.5 font-bold transition-colors ${
                      isHoveredExact || isSelectedExact ? "text-amber-300 font-extrabold" : "text-[var(--theme-muted)]/60"
                    }`}>
                      {star}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Descriptor Feedback Banner */}
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-[var(--theme-card)]/90 border border-[var(--theme-border)] text-xs min-h-[38px]">
              {activeDescriptor ? (
                <div className="flex items-center gap-2">
                  <span className="font-extrabold font-mono text-amber-300 text-sm">
                    {hoverRating || rating}/10
                  </span>
                  <span className="text-[var(--theme-fg)] font-bold">
                    {activeDescriptor.label}
                  </span>
                  <span className="text-[11px] text-[var(--theme-muted)] hidden sm:inline">
                    · {activeDescriptor.mood}
                  </span>
                </div>
              ) : (
                <span className="text-xs text-[var(--theme-muted)] italic">
                  Tap any star above to rate on the 10-point scale
                </span>
              )}
            </div>
          </div>

          {/* Notebook Journal Section with Ruled Paper lines & red margin */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--theme-fg)] flex items-center gap-1.5">
                <BookOpen size={13} className="text-[var(--theme-accent)]" />
                <span>Journal Log & Reflections</span>
              </span>
              
              {/* Date Stamp */}
              <div className="flex items-center gap-1.5 text-xs text-[var(--theme-muted)] font-mono">
                <Calendar size={13} className="text-[var(--theme-accent)]" />
                <input 
                  type="date"
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                  className="bg-transparent border border-[var(--theme-border)] rounded-md px-1.5 py-0.5 text-xs text-[var(--theme-fg)] cursor-pointer focus:outline-none focus:border-[var(--theme-accent)]"
                />
              </div>
            </div>

            {/* Notebook Lined Page Box */}
            <div 
              className="relative rounded-2xl border border-[var(--theme-border)] overflow-hidden p-4 sm:p-5"
              style={{
                backgroundColor: "rgba(23, 2, 11, 0.5)",
                backgroundImage: "repeating-linear-gradient(transparent, transparent 27px, rgba(255, 248, 240, 0.08) 28px)",
                backgroundAttachment: "local",
              }}
            >
              {/* Red Notebook Vertical Margin Rule */}
              <div className="absolute top-0 bottom-0 left-6 sm:left-8 w-[2px] bg-rose-500/35 pointer-events-none" />

              <div className="pl-6 sm:pl-8">
                <textarea
                  value={reflection}
                  onChange={(e) => setReflection(e.target.value)}
                  placeholder="Record your listening thoughts... How did this album make you feel? Production highlights, favorite lyrics, late-night vinyl impressions..."
                  rows={4}
                  className="w-full bg-transparent border-0 text-sm sm:text-base leading-[28px] text-[var(--theme-fg)] placeholder:text-[var(--theme-muted)]/50 focus:outline-none resize-none font-sans"
                />
              </div>
            </div>
          </div>

          {/* Listening Context / Vibe Tags */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-[var(--theme-muted)] flex items-center gap-1">
              <Tag size={12} className="text-[var(--theme-accent)]" />
              <span>Listening Context & Vibe Tags</span>
            </span>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTED_TAGS.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all duration-150 cursor-pointer flex items-center gap-1 ${
                      isSelected
                        ? "bg-amber-400 text-black font-bold shadow-sm"
                        : "bg-[var(--theme-surface)] hover:bg-[var(--theme-card)] text-[var(--theme-muted)] border border-[var(--theme-border)]"
                    }`}
                  >
                    {isSelected && <Check size={11} />}
                    <span>{tag}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Action Buttons Footer */}
        <div className="p-4 sm:p-5 border-t border-[var(--theme-border)]/60 bg-[var(--theme-surface)]/70 backdrop-blur-xl flex items-center justify-between gap-3 sticky bottom-0 z-20">
          <div>
            {existingJournalEntry && (
              <button
                type="button"
                onClick={handleDeleteEntry}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-rose-400 hover:bg-rose-500/10 text-xs font-bold transition cursor-pointer"
                title="Delete this journal entry"
              >
                <Trash2 size={14} />
                <span className="hidden sm:inline">Delete Log</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-card)] hover:bg-[var(--theme-surface)] text-xs font-semibold text-[var(--theme-muted)] hover:text-[var(--theme-fg)] transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 hover:opacity-95 text-zinc-950 text-xs sm:text-sm font-extrabold transition-all duration-200 active:scale-95 shadow-lg shadow-amber-400/25 flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles size={14} fill="currentColor" />
              <span>Save to Journal</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
