// src/Components/RatingAndJournalModal.jsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Star,
  BookOpen,
  Calendar,
  Sparkles,
  Tag,
  Check,
  Trash2,
  Lock,
  Globe,
  Sliders,
  Smile,
  Disc,
} from "lucide-react";
import { toast } from "@/lib/toast";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

const RATING_DESCRIPTORS = {
  1: { label: "Appalling", mood: "Unlistenable" },
  2: { label: "Terrible", mood: "Heavy flaws" },
  3: { label: "Bad", mood: "Disappointing" },
  4: { label: "Subpar", mood: "Below average" },
  5: { label: "Mediocre", mood: "Decent ideas, mixed execution" },
  6: { label: "Decent", mood: "Enjoyable listen" },
  7: { label: "Good", mood: "Solid release" },
  8: { label: "Great", mood: "Memorable & strong" },
  9: { label: "Superb", mood: "Outstanding masterpiece" },
  10: { label: "Masterpiece 👑", mood: "Timeless perfection" },
};

const SUGGESTED_MOODS = [
  { id: "Euphoric", label: "✨ Euphoric" },
  { id: "Late Night", label: "🌙 Late Night" },
  { id: "Introspective", label: "💭 Introspective" },
  { id: "Chill", label: "☕ Chill" },
  { id: "Melancholic", label: "🌧️ Melancholic" },
  { id: "Energetic", label: "⚡ Energetic" },
  { id: "Road Trip", label: "🚗 Road Trip" },
  { id: "Focus", label: "🎧 Focus" },
];

const SUGGESTED_TAGS = [
  "Vinyl Session", "Headphones", "Audiophile", "Nostalgic", 
  "Favorite Pressing", "Summer Vibe", "First Listen", "Masterclass"
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
  const { user } = useSupabaseAuth();
  const [mounted, setMounted] = useState(false);

  // Rating modes: 'stars' (1-10) or 'score' (0-100)
  const [ratingSystem, setRatingSystem] = useState("stars");
  const [starRating, setStarRating] = useState(initialRating || 0);
  const [hoverRating, setHoverRating] = useState(0);
  const [scoreRating, setScoreRating] = useState(initialRating ? initialRating * 10 : 80);

  const [reflection, setReflection] = useState(initialReview || "");
  const [selectedMood, setSelectedMood] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [isPublic, setIsPublic] = useState(true);
  const [entryDate, setEntryDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [existingJournalEntry, setExistingJournalEntry] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const ratingStorageKey = `groove_user_rating_${type}_${id}`;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll while modal is open
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  // Sync state on modal open
  useEffect(() => {
    if (!isOpen || typeof window === "undefined" || !id) return;

    try {
      // 1. Load user rating from localStorage
      const rawRating = localStorage.getItem(ratingStorageKey);
      let currentScore = 0;
      if (rawRating) {
        const parsed = JSON.parse(rawRating);
        currentScore = typeof parsed === "number" ? parsed : (parsed?.score || 0);
        if (parsed?.system) setRatingSystem(parsed.system);
        if (parsed?.system === "score") {
          setScoreRating(parsed.score);
          setStarRating(Math.round(parsed.score / 10));
        } else {
          setStarRating(currentScore);
          setScoreRating(currentScore ? currentScore * 10 : 80);
        }
      } else if (initialRating) {
        setStarRating(initialRating);
        setScoreRating(initialRating * 10);
      }

      // 2. Load existing journal entry if any
      const rawJournal = localStorage.getItem("groove_journal_logs");
      if (rawJournal) {
        const logs = JSON.parse(rawJournal);
        const match = journalEntryId
          ? logs.find((l) => l.id === journalEntryId)
          : logs.find((l) => l.targetId === id && l.targetType === type);

        if (match) {
          setExistingJournalEntry(match);
          setReflection(match.review || match.reflection || match.entry_text || "");
          setSelectedTags(Array.isArray(match.tags) ? match.tags : []);
          setSelectedMood(match.mood || "");
          setIsPublic(match.is_public !== undefined ? match.is_public : true);
          if (match.date || match.listened_date) {
            const rawDate = match.date || match.listened_date;
            setEntryDate(rawDate.split("T")[0]);
          }
          if (match.rating && !currentScore) {
            setStarRating(match.rating);
            setScoreRating(match.rating * 10);
          }
        } else {
          setExistingJournalEntry(null);
          setReflection(initialReview || "");
          setSelectedTags([]);
          setSelectedMood("");
          setIsPublic(true);
        }
      }
    } catch (_) {}
  }, [isOpen, id, type, journalEntryId, ratingStorageKey, initialRating, initialReview]);

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
    const activeScore = hoverRating || starRating;
    return RATING_DESCRIPTORS[activeScore] || null;
  }, [hoverRating, starRating]);

  const toggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleClearRating = () => {
    setStarRating(0);
    setScoreRating(0);
    try {
      localStorage.removeItem(ratingStorageKey);
      window.dispatchEvent(
        new CustomEvent("groove-rating-changed", {
          detail: { id, type, score: 0 },
        })
      );
      toast.info("Rating cleared");
    } catch (_) {}
  };

  const handleSave = async () => {
    const activeScore = ratingSystem === "stars" ? starRating : scoreRating;
    if (activeScore === 0 && !reflection.trim()) {
      toast.warning("Please choose a rating or write a journal note.");
      return;
    }

    setIsSaving(true);
    try {
      // 1. Save user rating to localStorage
      if (activeScore > 0) {
        localStorage.setItem(
          ratingStorageKey,
          JSON.stringify({
            score: starRating,
            numericalScore: scoreRating,
            system: ratingSystem,
            updatedAt: Date.now(),
          })
        );
      } else {
        localStorage.removeItem(ratingStorageKey);
      }

      window.dispatchEvent(
        new CustomEvent("groove-rating-changed", {
          detail: { id, type, score: starRating, numericalScore: scoreRating, system: ratingSystem },
        })
      );

      // 2. Save or update journal entry in localStorage
      const rawJournal = localStorage.getItem("groove_journal_logs");
      let logs = rawJournal ? JSON.parse(rawJournal) : [];

      const entryId =
        existingJournalEntry?.id ||
        journalEntryId ||
        `journal_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

      const newEntry = {
        id: entryId,
        targetId: id,
        targetType: type,
        title: title || "Untitled",
        subtitle: subtitle || "",
        image: image || "",
        rating: starRating,
        numericalScore: scoreRating,
        ratingSystem,
        date: entryDate,
        review: reflection.trim(),
        mood: selectedMood,
        tags: selectedTags,
        is_public: isPublic,
        updatedAt: Date.now(),
        createdAt: existingJournalEntry?.createdAt || Date.now(),
      };

      logs = logs.filter(
        (l) => l.id !== entryId && !(l.targetId === id && l.targetType === type)
      );
      logs.unshift(newEntry);
      localStorage.setItem("groove_journal_logs", JSON.stringify(logs));

      // 3. Supabase Cloud Sync (if user is authenticated and Supabase is configured)
      if (user && isSupabaseConfigured()) {
        try {
          const supabase = createClient();
          // Step A: Ensure entity exists in music_entities
          let entityRecordId = null;
          const { data: existingEntity } = await supabase
            .from("music_entities")
            .select("id")
            .eq("mbid", id)
            .maybeSingle();

          if (existingEntity) {
            entityRecordId = existingEntity.id;
          } else {
            const { data: insertedEntity } = await supabase
              .from("music_entities")
              .insert({
                mbid: id,
                type: type === "track" ? "track" : type === "artist" ? "artist" : "album",
                title: title || "Untitled",
                artist_credit: subtitle || "",
                cover_art_url: image || null,
                data: {},
              })
              .select("id")
              .single();
            if (insertedEntity) entityRecordId = insertedEntity.id;
          }

          if (entityRecordId) {
            // Step B: Save user rating
            let ratingRecordId = null;
            if (activeScore > 0) {
              const { data: ratingData } = await supabase
                .from("user_ratings")
                .upsert(
                  {
                    user_id: user.id,
                    entity_id: entityRecordId,
                    rating_type: ratingSystem,
                    score: ratingSystem === "stars" ? starRating : scoreRating,
                    review: reflection.trim() || null,
                    listened_date: entryDate,
                    is_public: isPublic,
                  },
                  { onConflict: "user_id,entity_id,rating_type" }
                )
                .select("id")
                .single();
              if (ratingData) ratingRecordId = ratingData.id;
            }

            // Step C: Save journal entry
            await supabase.from("journals").upsert(
              {
                user_id: user.id,
                entity_id: entityRecordId,
                entry_text: reflection.trim() || null,
                mood: selectedMood || null,
                listened_date: entryDate,
                rating_id: ratingRecordId,
                is_public: isPublic,
              },
              { onConflict: "id" }
            );
          }
        } catch (cloudErr) {
          console.warn("Could not sync journal to Supabase cloud:", cloudErr?.message);
        }
      }

      window.dispatchEvent(
        new CustomEvent("groove-journal-updated", {
          detail: { targetId: id, entryId },
        })
      );

      toast.success(
        starRating > 0 || scoreRating > 0
          ? `Rated & saved to your Music Journal! 📓✨`
          : `Note saved to your Music Journal! 📓`
      );
      onClose();
    } catch (err) {
      console.error("Failed to save journal log:", err);
      toast.error("Failed to save journal log. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteEntry = async () => {
    if (!existingJournalEntry) return;
    try {
      // Local removal
      const rawJournal = localStorage.getItem("groove_journal_logs");
      if (rawJournal) {
        const logs = JSON.parse(rawJournal).filter((l) => l.id !== existingJournalEntry.id);
        localStorage.setItem("groove_journal_logs", JSON.stringify(logs));
      }

      // Supabase removal
      if (user && isSupabaseConfigured() && existingJournalEntry.id) {
        try {
          const supabase = createClient();
          await supabase.from("journals").delete().eq("id", existingJournalEntry.id);
        } catch (_) {}
      }

      window.dispatchEvent(
        new CustomEvent("groove-journal-updated", {
          detail: { targetId: id },
        })
      );
      toast.info("Journal entry removed");
      onClose();
    } catch (_) {}
  };

  if (!isOpen || !mounted) return null;

  // Render via React Portal to document.body to ensure it floats above all navbars and cards!
  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl max-h-[90vh] rounded-3xl bg-[var(--theme-card)] border border-[var(--theme-border)] shadow-2xl text-[var(--theme-fg)] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Strip with high z-index and clean controls */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--theme-border)]/60 bg-[var(--theme-surface-elevated)] backdrop-blur-xl shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-amber-400/15 border border-amber-400/30 flex items-center justify-center text-amber-300">
              <BookOpen size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight text-[var(--theme-fg)] flex items-center gap-2">
                <span>Music Journal & Rating</span>
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

        {/* Scrollable Content Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {/* Target Media Card */}
          <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-[var(--theme-surface)]/60 border border-[var(--theme-border)]/50">
            {image ? (
              <img
                src={image}
                alt={title}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover shrink-0 shadow-md ring-1 ring-[var(--theme-border)]"
                onError={(e) => {
                  e.currentTarget.src = "https://placehold.co/100x100/17020B/E8A87C?text=Groove";
                }}
              />
            ) : (
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-[var(--theme-card)] flex items-center justify-center text-[var(--theme-muted)] shrink-0 border border-[var(--theme-border)]">
                <Disc size={24} />
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

          {/* Dual Rating System Switcher: 10-Star Scale vs 0-100 Score */}
          <div className="space-y-3 p-4 rounded-2xl bg-gradient-to-b from-amber-400/5 to-transparent border border-amber-400/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 p-0.5 rounded-lg bg-[var(--theme-card)] border border-[var(--theme-border)]">
                <button
                  type="button"
                  onClick={() => setRatingSystem("stars")}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    ratingSystem === "stars"
                      ? "bg-amber-400 text-zinc-950 shadow-sm"
                      : "text-[var(--theme-muted)] hover:text-[var(--theme-fg)]"
                  }`}
                >
                  10-Star Scale
                </button>
                <button
                  type="button"
                  onClick={() => setRatingSystem("score")}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    ratingSystem === "score"
                      ? "bg-amber-400 text-zinc-950 shadow-sm"
                      : "text-[var(--theme-muted)] hover:text-[var(--theme-fg)]"
                  }`}
                >
                  0–100 Score
                </button>
              </div>

              {(starRating > 0 || scoreRating > 0) && (
                <button
                  type="button"
                  onClick={handleClearRating}
                  className="text-[11px] font-semibold text-rose-400 hover:text-rose-300 hover:underline cursor-pointer"
                >
                  Clear Rating
                </button>
              )}
            </div>

            {/* 10-Star Scale Selector */}
            {ratingSystem === "stars" ? (
              <div className="space-y-2">
                <div
                  className="flex items-center justify-between gap-1 sm:gap-2 px-1 py-2 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                  onMouseLeave={() => setHoverRating(0)}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => {
                    const isSelected = (hoverRating || starRating) >= star;
                    const isHoveredExact = hoverRating === star;
                    const isSelectedExact = starRating === star;

                    return (
                      <button
                        key={star}
                        type="button"
                        onMouseEnter={() => setHoverRating(star)}
                        onClick={() => {
                          setStarRating(star);
                          setScoreRating(star * 10);
                        }}
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
                        <span
                          className={`text-[10px] font-mono mt-0.5 font-bold transition-colors ${
                            isHoveredExact || isSelectedExact
                              ? "text-amber-300 font-extrabold"
                              : "text-[var(--theme-muted)]/60"
                          }`}
                        >
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
                        {hoverRating || starRating}/10
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
            ) : (
              /* 0-100 Numerical Score Slider */
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--theme-muted)] font-medium">
                    Critic Score (0-100)
                  </span>
                  <div className="flex items-center gap-1.5 font-mono">
                    <span className="text-2xl font-black text-amber-300">
                      {scoreRating}
                    </span>
                    <span className="text-xs text-[var(--theme-muted)]">/ 100</span>
                  </div>
                </div>

                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={scoreRating}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setScoreRating(val);
                    setStarRating(Math.round(val / 10));
                  }}
                  className="w-full h-2 rounded-lg bg-[var(--theme-surface)] appearance-none cursor-pointer accent-amber-400"
                />

                <div className="flex justify-between text-[10px] text-[var(--theme-muted)] font-mono">
                  <span>0 (Unlistenable)</span>
                  <span>50 (Average)</span>
                  <span>75 (Solid)</span>
                  <span>100 (Masterpiece)</span>
                </div>
              </div>
            )}
          </div>

          {/* Music Journal Reflection Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--theme-fg)] flex items-center gap-1.5">
                <BookOpen size={13} className="text-[var(--theme-accent)]" />
                <span>Journal Notes & Reflections</span>
              </span>

              {/* Date Stamp */}
              <div className="flex items-center gap-1.5 text-xs text-[var(--theme-muted)] font-mono">
                <Calendar size={13} className="text-[var(--theme-accent)]" />
                <input
                  type="date"
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                  className="bg-[var(--theme-card)] border border-[var(--theme-border)] rounded-lg px-2 py-1 text-xs text-[var(--theme-fg)] cursor-pointer focus:outline-none focus:border-[var(--theme-accent)]"
                />
              </div>
            </div>

            <textarea
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              placeholder="What made this listen stand out? Production details, favorite tracks, emotional resonance, vinyl pressing notes..."
              rows={4}
              className="w-full rounded-2xl bg-[var(--theme-surface)]/70 border border-[var(--theme-border)] p-3.5 text-sm sm:text-base leading-relaxed text-[var(--theme-fg)] placeholder:text-[var(--theme-muted)]/50 focus:outline-none focus:border-[var(--theme-accent)] resize-none"
            />
          </div>

          {/* Listening Mood Pills */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-[var(--theme-muted)] flex items-center gap-1">
              <Smile size={12} className="text-[var(--theme-accent)]" />
              <span>Listening Mood</span>
            </span>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTED_MOODS.map((mood) => {
                const isSelected = selectedMood === mood.id;
                return (
                  <button
                    key={mood.id}
                    type="button"
                    onClick={() => setSelectedMood(isSelected ? "" : mood.id)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition cursor-pointer ${
                      isSelected
                        ? "bg-amber-400 text-zinc-950 font-bold shadow-xs"
                        : "bg-[var(--theme-surface)] hover:bg-[var(--theme-card)] text-[var(--theme-muted)] border border-[var(--theme-border)]"
                    }`}
                  >
                    {mood.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Vibe Tags & Public/Private Toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-[var(--theme-border)]/50">
            {/* Tags */}
            <div className="space-y-1.5 flex-1">
              <span className="text-[11px] font-semibold text-[var(--theme-muted)] flex items-center gap-1">
                <Tag size={11} className="text-[var(--theme-accent)]" />
                <span>Context Tags</span>
              </span>
              <div className="flex flex-wrap gap-1">
                {SUGGESTED_TAGS.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`px-2 py-0.5 rounded-full text-[11px] transition cursor-pointer ${
                        isSelected
                          ? "bg-white/15 text-[var(--theme-fg)] font-bold border border-white/30"
                          : "text-[var(--theme-muted)] hover:text-[var(--theme-fg)] bg-transparent border border-transparent"
                      }`}
                    >
                      {isSelected ? `✓ ${tag}` : `+ ${tag}`}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Public / Private Toggle */}
            <div className="shrink-0 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsPublic(!isPublic)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                  isPublic
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    : "bg-zinc-800 border-zinc-700 text-zinc-300"
                }`}
                title={isPublic ? "Visible on your public profile" : "Only visible to you"}
              >
                {isPublic ? <Globe size={13} /> : <Lock size={13} />}
                <span>{isPublic ? "Public Log" : "Private"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Action Buttons Footer */}
        <div className="p-4 sm:p-5 border-t border-[var(--theme-border)]/60 bg-[var(--theme-surface-elevated)] backdrop-blur-xl flex items-center justify-between gap-3 shrink-0">
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
              disabled={isSaving}
              className="px-4 py-2 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-card)] hover:bg-[var(--theme-surface)] text-xs font-semibold text-[var(--theme-muted)] hover:text-[var(--theme-fg)] transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 hover:opacity-95 text-zinc-950 text-xs sm:text-sm font-extrabold transition-all duration-200 active:scale-95 shadow-lg shadow-amber-400/25 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Sparkles size={14} fill="currentColor" />
              <span>{isSaving ? "Saving..." : "Save to Journal"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
