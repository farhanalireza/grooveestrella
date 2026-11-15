// src/Components/RatingAndJournalModal.jsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeft,
  X,
  Star,
  BookOpen,
  Calendar,
  Sparkles,
  Check,
  Trash2,
  Lock,
  Globe,
  Smile,
  Disc,
  User,
  Music,
} from "lucide-react";
import { toast } from "@/lib/toast";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

const RATING_DESCRIPTORS = {
  1: { label: "Appalling", mood: "Unlistenable" },
  2: { label: "Terrible", mood: "Heavy flaws" },
  3: { label: "Bad", mood: "Disappointing" },
  4: { label: "Subpar", mood: "Below average" },
  5: { label: "Mediocre", mood: "Mixed execution" },
  6: { label: "Decent", mood: "Enjoyable listen" },
  7: { label: "Good", mood: "Solid release" },
  8: { label: "Great", mood: "Memorable & strong" },
  9: { label: "Excellent", mood: "Outstanding work" },
  10: { label: "Masterpiece 👑", mood: "Timeless perfection" },
};

const SUGGESTED_MOODS = [
  "Late night headphones",
  "First full listen",
  "Vinyl session",
  "Rainy evening",
  "Deep focus",
  "Morning coffee",
  "Live memories",
];

export default function RatingAndJournalModal({
  isOpen,
  onClose,
  id,
  type = "album", // 'album' | 'track' | 'artist'
  title = "Untitled",
  subtitle = "",
  image = "",
  year = null,
  itemYear = null,
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
  const [moodContext, setMoodContext] = useState("");
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
          setMoodContext(match.mood || "");
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
          setMoodContext("");
          setIsPublic(true);
        }
      }

      // 3. Supabase Cloud Sync check
      if (user && isSupabaseConfigured()) {
        const supabase = createClient();
        (async () => {
          try {
            const { data: entityData } = await supabase
              .from("music_entities")
              .select("id")
              .eq("mbid", id)
              .maybeSingle();

            if (entityData?.id) {
              const { data: cloudEntry } = await supabase
                .from("journals")
                .select(`
                  id,
                  entry_text,
                  mood,
                  listened_date,
                  is_public,
                  user_ratings ( score, rating_type )
                `)
                .eq("user_id", user.id)
                .eq("entity_id", entityData.id)
                .order("created_at", { ascending: false })
                .limit(1)
                .maybeSingle();

              if (cloudEntry) {
                setExistingJournalEntry((prev) => ({
                  ...(prev || {}),
                  id: cloudEntry.id,
                  entry_text: cloudEntry.entry_text,
                  mood: cloudEntry.mood,
                  listened_date: cloudEntry.listened_date,
                  is_public: cloudEntry.is_public,
                }));
                if (cloudEntry.entry_text) setReflection(cloudEntry.entry_text);
                if (cloudEntry.mood) setMoodContext(cloudEntry.mood);
                if (cloudEntry.listened_date) setEntryDate(cloudEntry.listened_date.split("T")[0]);
                if (cloudEntry.is_public !== undefined) setIsPublic(cloudEntry.is_public);
                if (cloudEntry.user_ratings) {
                  const ur = cloudEntry.user_ratings;
                  if (ur.rating_type === "stars") {
                    setStarRating(ur.score);
                    setScoreRating(ur.score * 10);
                    setRatingSystem("stars");
                  } else {
                    setScoreRating(ur.score);
                    setStarRating(Math.round(ur.score / 10));
                    setRatingSystem("score");
                  }
                }
              }
            }
          } catch (_) {}
        })();
      }
    } catch (_) {}
  }, [isOpen, id, type, journalEntryId, ratingStorageKey, initialRating, initialReview, user]);

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
      toast.warning("Please choose a rating or write a review note.");
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
        mood: moodContext.trim(),
        tags: [],
        is_public: isPublic,
        updatedAt: Date.now(),
        createdAt: existingJournalEntry?.createdAt || Date.now(),
      };

      logs = logs.filter(
        (l) => l.id !== entryId && !(l.targetId === id && l.targetType === type)
      );
      logs.unshift(newEntry);
      localStorage.setItem("groove_journal_logs", JSON.stringify(logs));

      // 3. Supabase Cloud Sync
      if (user && isSupabaseConfigured()) {
        try {
          const supabase = createClient();
          let entityRecordId = null;
          const effectiveYear = Number.isInteger(year) ? year : Number.isInteger(itemYear) ? itemYear : null;

          try {
            const syncRes = await fetch("/api/entity/sync", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                mbid: id,
                type: type === "track" ? "track" : type === "artist" ? "artist" : "album",
                title: title || "Untitled",
                artist: subtitle || "",
                year: effectiveYear,
                cover_art_url: image || null,
              }),
            });
            if (syncRes.ok) {
              const syncData = await syncRes.json();
              if (syncData?.entity?.id) {
                entityRecordId = syncData.entity.id;
              }
            }
          } catch (_) {}

          if (!entityRecordId) {
            const { data: existingEntity } = await supabase
              .from("music_entities")
              .select("id, year")
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
                  year: effectiveYear,
                  cover_art_url: image || null,
                  data: { groovelink: {} },
                })
                .select("id")
                .single();
              if (insertedEntity) entityRecordId = insertedEntity.id;
            }
          }

          if (entityRecordId) {
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
                    review: isPublic ? reflection.trim() || null : null,
                    listened_date: entryDate,
                    is_public: true,
                  },
                  { onConflict: "user_id,entity_id,rating_type" }
                )
                .select("id")
                .single();
              if (ratingData) ratingRecordId = ratingData.id;
            }

            const { data: existingJournals } = await supabase
              .from("journals")
              .select("id")
              .eq("user_id", user.id)
              .eq("entity_id", entityRecordId)
              .order("created_at", { ascending: false });

            let targetJournalId = null;
            if (existingJournalEntry?.id && typeof existingJournalEntry.id === "string") {
              targetJournalId = existingJournalEntry.id;
            } else if (existingJournals && existingJournals.length > 0) {
              targetJournalId = existingJournals[0].id;
            }

            if (targetJournalId) {
              await supabase
                .from("journals")
                .update({
                  entry_text: reflection.trim() || null,
                  mood: moodContext.trim() || null,
                  listened_date: entryDate,
                  rating_id: ratingRecordId,
                  is_public: isPublic,
                  updated_at: new Date().toISOString(),
                })
                .eq("id", targetJournalId);
            } else {
              await supabase.from("journals").insert({
                user_id: user.id,
                entity_id: entityRecordId,
                entry_text: reflection.trim() || null,
                mood: moodContext.trim() || null,
                listened_date: entryDate,
                rating_id: ratingRecordId,
                is_public: isPublic,
              });
            }
          }
        } catch (cloudErr) {
          console.warn("Could not sync to Supabase:", cloudErr?.message);
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
      const rawJournal = localStorage.getItem("groove_journal_logs");
      if (rawJournal) {
        const logs = JSON.parse(rawJournal).filter((l) => l.id !== existingJournalEntry.id);
        localStorage.setItem("groove_journal_logs", JSON.stringify(logs));
      }

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

  const TypeIcon = type === "artist" ? User : type === "track" ? Music : Disc;
  const effectiveYear = Number.isInteger(year) ? year : Number.isInteger(itemYear) ? itemYear : null;

  // Render via React Portal to document.body to ensure it floats above all navbars and cards!
  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-md animate-fade-in p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full sm:max-w-xl max-h-[94vh] sm:max-h-[90vh] rounded-t-3xl sm:rounded-3xl bg-[var(--theme-card)] border border-[var(--theme-border)] shadow-2xl text-[var(--theme-fg)] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. STICKY TOP HEADER: Artwork + Entity Info + Page Title + Back Button */}
        <div className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-5 py-3 border-b border-[var(--theme-border)]/50 bg-[var(--theme-card)]/95 backdrop-blur-xl shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-[var(--theme-surface)] active:scale-95 text-[var(--theme-muted)] hover:text-[var(--theme-fg)] transition cursor-pointer shrink-0"
              title="Close modal"
            >
              <ArrowLeft size={18} />
            </button>

            {image ? (
              <img
                src={image}
                alt={title}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg object-cover shrink-0 shadow-sm ring-1 ring-white/15"
                onError={(e) => {
                  e.currentTarget.src = "https://placehold.co/100x100/17020B/E8A87C?text=Groove";
                }}
              />
            ) : (
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-[var(--theme-surface)] flex items-center justify-center text-[var(--theme-muted)] shrink-0 border border-[var(--theme-border)]">
                <TypeIcon size={18} />
              </div>
            )}

            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-extrabold text-[var(--theme-fg)] truncate leading-tight">
                {title}
              </h3>
              <p className="text-[11px] text-[var(--theme-muted)] truncate">
                {subtitle || (type === "artist" ? "Artist" : type === "track" ? "Track" : "Album")}
                {effectiveYear ? ` · ${effectiveYear}` : ""}
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/25 text-amber-300 text-[10px] sm:text-[11px] font-black uppercase tracking-wider shrink-0 select-none">
            <BookOpen size={12} />
            <span>Log a Listen</span>
          </div>
        </div>

        {/* 2. MAIN SCROLLABLE CONTENT (In Exact Priority Order) */}
        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {/* SECTION A: YOUR RATING (Most Important Section) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[var(--theme-surface)]/60 border border-[var(--theme-border)]/70 space-y-3.5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold tracking-tight text-[var(--theme-fg)] flex items-center gap-1.5">
                  <Star size={15} className="text-amber-400 fill-amber-400" />
                  <span>Your Rating</span>
                </span>
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  Always public
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* 10 Stars vs 0-100 Switcher */}
                <div className="flex items-center gap-1 p-0.5 rounded-lg bg-[var(--theme-card)] border border-[var(--theme-border)]">
                  <button
                    type="button"
                    onClick={() => setRatingSystem("stars")}
                    className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold transition cursor-pointer ${
                      ratingSystem === "stars"
                        ? "bg-amber-400 text-zinc-950 shadow-xs"
                        : "text-[var(--theme-muted)] hover:text-[var(--theme-fg)]"
                    }`}
                  >
                    10 Stars
                  </button>
                  <button
                    type="button"
                    onClick={() => setRatingSystem("score")}
                    className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold transition cursor-pointer ${
                      ratingSystem === "score"
                        ? "bg-amber-400 text-zinc-950 shadow-xs"
                        : "text-[var(--theme-muted)] hover:text-[var(--theme-fg)]"
                    }`}
                  >
                    0–100
                  </button>
                </div>

                {(starRating > 0 || scoreRating > 0) && (
                  <button
                    type="button"
                    onClick={handleClearRating}
                    className="text-xs font-semibold text-rose-400 hover:text-rose-300 hover:underline cursor-pointer ml-1"
                  >
                    Clear Rating
                  </button>
                )}
              </div>
            </div>

            {/* 10-Star Rating Grid (Big, Satisfying Stars) */}
            {ratingSystem === "stars" ? (
              <div className="space-y-3">
                <div
                  className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 sm:gap-2 pt-1"
                  onMouseLeave={() => setHoverRating(0)}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => {
                    const isSelected = (hoverRating || starRating) >= star;
                    const isSelectedExact = (hoverRating || starRating) === star;

                    return (
                      <button
                        key={star}
                        type="button"
                        onMouseEnter={() => setHoverRating(star)}
                        onClick={() => {
                          setStarRating(star);
                          setScoreRating(star * 10);
                        }}
                        className={`p-2 sm:p-2.5 rounded-xl transition-all duration-150 flex flex-col items-center justify-center gap-1 cursor-pointer border active:scale-90 hover:scale-110 ${
                          isSelectedExact
                            ? "bg-amber-400/20 border-amber-400/60 shadow-[0_0_12px_rgba(251,191,36,0.35)]"
                            : isSelected
                            ? "bg-amber-400/10 border-amber-400/30"
                            : "bg-[var(--theme-card)]/80 hover:bg-[var(--theme-card)] border-[var(--theme-border)]"
                        }`}
                        title={`Rate ${star} / 10`}
                      >
                        <Star
                          size={24}
                          fill={isSelected ? "currentColor" : "none"}
                          className={`transition-all duration-150 ${
                            isSelected
                              ? "text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]"
                              : "text-zinc-600 hover:text-amber-200"
                          }`}
                        />
                        <span
                          className={`text-xs font-sans font-bold transition-colors ${
                            isSelectedExact
                              ? "text-amber-300 font-extrabold"
                              : "text-[var(--theme-muted)]/75"
                          }`}
                        >
                          {star}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Live Feedback Label (Special Delight for 10/10 Masterpiece) */}
                {(hoverRating > 0 || starRating > 0) ? (
                  (hoverRating === 10 || starRating === 10) ? (
                    <div className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500/20 via-yellow-400/25 to-amber-500/20 border border-amber-400/50 shadow-[0_0_15px_rgba(251,191,36,0.25)] flex items-center justify-between text-xs animate-fade-in">
                      <div className="flex items-center gap-2">
                        <Sparkles size={16} className="text-amber-400 animate-spin-slow" />
                        <span className="font-black text-amber-300 text-sm">
                          10/10 · Masterpiece 👑
                        </span>
                      </div>
                      <span className="text-[11px] font-bold text-amber-200/90 uppercase tracking-wide">
                        Timeless Perfection
                      </span>
                    </div>
                  ) : (
                    <div className="px-4 py-2.5 rounded-xl bg-[var(--theme-card)] border border-[var(--theme-border)] text-xs flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-amber-300 text-sm">
                          {hoverRating || starRating}/10
                        </span>
                        <span className="text-[var(--theme-fg)] font-bold">
                          {activeDescriptor?.label}
                        </span>
                        {activeDescriptor?.mood && (
                          <span className="text-[11px] text-[var(--theme-muted)] hidden sm:inline">
                            · {activeDescriptor.mood}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                ) : (
                  <div className="px-4 py-2.5 rounded-xl bg-[var(--theme-card)] border border-[var(--theme-border)] text-xs text-[var(--theme-muted)]">
                    Tap a star to score this release from 1 to 10.
                  </div>
                )}
              </div>
            ) : (
              /* 0-100 Critic Score Slider */
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--theme-muted)] font-medium">
                    Critic Score (0-100)
                  </span>
                  <div className="flex items-baseline gap-1 font-sans">
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
                  className="w-full h-2 rounded-lg bg-[var(--theme-card)] appearance-none cursor-pointer accent-amber-400"
                />

                <div className="flex justify-between text-[10px] text-[var(--theme-muted)] font-sans">
                  <span>0 (Unlistenable)</span>
                  <span>50 (Average)</span>
                  <span>75 (Solid)</span>
                  <span>100 (Masterpiece)</span>
                </div>
              </div>
            )}
          </div>

          {/* SECTION B: LISTENED DATE */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[var(--theme-surface)]/50 border border-[var(--theme-border)]/60 space-y-2">
            <label
              htmlFor="modal-listened-date"
              className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--theme-fg)]"
            >
              <Calendar size={13} className="text-amber-400" />
              <span>Listened Date</span>
            </label>
            <input
              id="modal-listened-date"
              type="date"
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
              className="w-full sm:w-auto min-w-[220px] rounded-xl bg-[var(--theme-card)] border border-[var(--theme-border)] px-4 py-2.5 text-xs sm:text-sm text-[var(--theme-fg)] font-sans cursor-pointer focus:outline-none focus:border-amber-400/60 transition"
            />
          </div>

          {/* SECTION C: REVIEW & THOUGHTS */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[var(--theme-surface)]/50 border border-[var(--theme-border)]/60 space-y-2">
            <div className="space-y-0.5">
              <label
                htmlFor="modal-review-text"
                className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--theme-fg)]"
              >
                <BookOpen size={13} className="text-amber-400" />
                <span>Review &amp; Thoughts</span>
              </label>
              <p className="text-[11px] text-[var(--theme-muted)]">
                This will appear as your public review if you make the entry public.
              </p>
            </div>

            <textarea
              id="modal-review-text"
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              placeholder="What stood out? Favorite tracks, production, lyrics, or how it made you feel..."
              rows={4}
              className="w-full rounded-xl bg-[var(--theme-card)] border border-[var(--theme-border)] p-3.5 text-xs sm:text-sm leading-relaxed text-[var(--theme-fg)] placeholder:text-[var(--theme-muted)]/50 focus:outline-none focus:border-amber-400/60 transition resize-none"
            />
          </div>

          {/* SECTION D: MOOD / CONTEXT (OPTIONAL) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[var(--theme-surface)]/50 border border-[var(--theme-border)]/60 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--theme-fg)] flex items-center gap-1.5">
                <Smile size={13} className="text-amber-400" />
                <span>Mood / Context</span>
              </span>
              <span className="text-[10px] text-[var(--theme-muted)] font-medium">
                Optional · Free text
              </span>
            </div>

            <input
              type="text"
              value={moodContext}
              onChange={(e) => setMoodContext(e.target.value)}
              placeholder="e.g. Late night headphones, rainy Sunday spin..."
              maxLength={80}
              className="w-full rounded-xl bg-[var(--theme-card)] border border-[var(--theme-border)] px-4 py-2 text-xs sm:text-sm text-[var(--theme-fg)] placeholder:text-[var(--theme-muted)]/50 focus:outline-none focus:border-amber-400/60 transition"
            />

            <div className="flex flex-wrap gap-1.5 pt-1">
              {SUGGESTED_MOODS.map((suggestion) => {
                const isSelected = moodContext.trim().toLowerCase() === suggestion.toLowerCase();
                return (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => setMoodContext(isSelected ? "" : suggestion)}
                    className={`px-3 py-1 rounded-full text-[11px] font-medium transition cursor-pointer ${
                      isSelected
                        ? "bg-amber-400/20 border border-amber-400/40 text-amber-300 font-semibold"
                        : "bg-[var(--theme-card)] border border-[var(--theme-border)] text-[var(--theme-muted)] hover:text-[var(--theme-fg)]"
                    }`}
                  >
                    {suggestion}
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECTION E: ENTRY VISIBILITY */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[var(--theme-surface)]/50 border border-[var(--theme-border)]/60 space-y-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--theme-fg)] block">
              Entry Visibility
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setIsPublic(true)}
                className={`p-3.5 rounded-2xl border text-left transition cursor-pointer flex items-start gap-3 ${
                  isPublic
                    ? "bg-emerald-500/10 border-emerald-500/40 text-[var(--theme-fg)]"
                    : "bg-[var(--theme-card)] border-[var(--theme-border)] text-[var(--theme-muted)] hover:text-[var(--theme-fg)]"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    isPublic ? "bg-emerald-500/20 text-emerald-400" : "bg-white/5 text-[var(--theme-muted)]"
                  }`}
                >
                  <Globe size={15} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm font-bold">Public Review</span>
                    {isPublic && <Check size={14} className="text-emerald-400" />}
                  </div>
                  <p className="text-[11px] text-[var(--theme-muted)] mt-0.5">
                    Visible on your public profile and the entity page.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setIsPublic(false)}
                className={`p-3.5 rounded-2xl border text-left transition cursor-pointer flex items-start gap-3 ${
                  !isPublic
                    ? "bg-amber-400/10 border-amber-400/40 text-[var(--theme-fg)]"
                    : "bg-[var(--theme-card)] border-[var(--theme-border)] text-[var(--theme-muted)] hover:text-[var(--theme-fg)]"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    !isPublic ? "bg-amber-400/20 text-amber-300" : "bg-white/5 text-[var(--theme-muted)]"
                  }`}
                >
                  <Lock size={15} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm font-bold">Private Log</span>
                    {!isPublic && <Check size={14} className="text-amber-300" />}
                  </div>
                  <p className="text-[11px] text-[var(--theme-muted)] mt-0.5">
                    Only you see your notes. Rating still stays public.
                  </p>
                </div>
              </button>
            </div>

            <p className="text-[11px] text-[var(--theme-muted)] pt-1">
              * <strong className="text-[var(--theme-fg)]">Your star rating is always public</strong> and contributes to community averages.
            </p>
          </div>
        </div>

        {/* 3. STICKY BOTTOM ACTION BAR: Cancel & Save Listen */}
        <div className="sticky bottom-0 z-30 p-4 sm:p-5 border-t border-[var(--theme-border)]/50 bg-[var(--theme-card)]/95 backdrop-blur-xl flex items-center justify-between gap-3 shrink-0">
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

          <div className="flex items-center gap-2.5 ml-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-full border border-[var(--theme-border)] bg-[var(--theme-surface)] hover:bg-[var(--theme-card)] text-xs sm:text-sm font-bold text-[var(--theme-muted)] hover:text-[var(--theme-fg)] transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-2 sm:px-7 sm:py-2.5 rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 hover:opacity-95 text-zinc-950 text-xs sm:text-sm font-black transition-all duration-200 active:scale-95 shadow-lg shadow-amber-400/25 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Sparkles size={14} fill="currentColor" />
              <span>{isSaving ? "Saving..." : "Save Listen"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
