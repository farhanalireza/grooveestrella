// src/app/journal/page.jsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  BookOpen,
  Star,
  Calendar,
  Sparkles,
  Edit3,
  Trash2,
  Disc,
  ArrowRight,
  Plus,
  Smile,
  Lock,
  Globe,
  SlidersHorizontal,
  Search,
  Filter,
} from "lucide-react";
import RatingAndJournalModal from "@/Components/RatingAndJournalModal";
import { toast } from "@/lib/toast";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

const FALLBACK_COVER_SVG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%2317020B'/%3E%3Ccircle cx='50' cy='50' r='35' fill='%23300818' stroke='%23E8A87C' stroke-width='2' stroke-dasharray='4 2'/%3E%3Ccircle cx='50' cy='50' r='12' fill='%23E8A87C'/%3E%3Ccircle cx='50' cy='50' r='4' fill='%2317020B'/%3E%3C/svg%3E";

export default function MusicJournalPage() {
  const { user } = useSupabaseAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("all"); // 'all' | 'album' | 'track' | 'artist'
  const [selectedMood, setSelectedMood] = useState("all");
  const [sortBy, setSortBy] = useState("newest"); // 'newest' | 'highest' | 'oldest'

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalItem, setModalItem] = useState(null);

  const loadJournalEntries = async () => {
    let localLogs = [];
    try {
      const raw = localStorage.getItem("groove_journal_logs");
      if (raw) localLogs = JSON.parse(raw);
    } catch (_) {
      localLogs = [];
    }

    // If user is authenticated and Supabase is configured, fetch from cloud
    if (user && isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        const { data: cloudJournals, error } = await supabase
          .from("journals")
          .select(`
            id,
            entry_text,
            mood,
            listened_date,
            is_public,
            created_at,
            user_ratings (
              score,
              rating_type
            ),
            music_entities (
              id,
              mbid,
              type,
              title,
              artist_credit,
              cover_art_url
            )
          `)
          .eq("user_id", user.id)
          .order("listened_date", { ascending: false });

        if (!error && Array.isArray(cloudJournals) && cloudJournals.length > 0) {
          const formatted = cloudJournals.map((j) => ({
            id: j.id,
            targetId: j.music_entities?.mbid || j.music_entities?.id,
            targetType: j.music_entities?.type || "album",
            title: j.music_entities?.title || "Untitled",
            subtitle: j.music_entities?.artist_credit || "",
            image: j.music_entities?.cover_art_url || "",
            rating: j.user_ratings?.rating_type === "stars" ? j.user_ratings.score : Math.round((j.user_ratings?.score || 0) / 10),
            numericalScore: j.user_ratings?.score || 0,
            ratingSystem: j.user_ratings?.rating_type || "stars",
            date: j.listened_date,
            review: j.entry_text || "",
            mood: j.mood || "",
            is_public: j.is_public,
            createdAt: new Date(j.created_at).getTime(),
          }));

          // Merge cloud with local, avoiding duplicates
          const cloudIds = new Set(formatted.map((e) => e.targetId));
          const remainingLocal = localLogs.filter((l) => !cloudIds.has(l.targetId));
          setEntries([...formatted, ...remainingLocal]);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.warn("Could not fetch journals from Supabase:", err?.message);
      }
    }

    setEntries(localLogs);
    setLoading(false);
  };

  useEffect(() => {
    loadJournalEntries();

    const handleUpdate = () => {
      loadJournalEntries();
    };

    window.addEventListener("groove-journal-updated", handleUpdate);
    window.addEventListener("groove-rating-changed", handleUpdate);
    return () => {
      window.removeEventListener("groove-journal-updated", handleUpdate);
      window.removeEventListener("groove-rating-changed", handleUpdate);
    };
  }, [user]);

  const handleDeleteEntry = async (entryId) => {
    try {
      const updated = entries.filter((e) => e.id !== entryId);
      setEntries(updated);
      localStorage.setItem("groove_journal_logs", JSON.stringify(updated));

      if (user && isSupabaseConfigured()) {
        try {
          const supabase = createClient();
          await supabase.from("journals").delete().eq("id", entryId);
        } catch (_) {}
      }

      window.dispatchEvent(new CustomEvent("groove-journal-updated", { detail: { entryId } }));
      toast.info("Journal entry removed");
    } catch (_) {}
  };

  // Filtered and sorted entries
  const filteredEntries = useMemo(() => {
    let result = [...entries];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (e) =>
          e.title?.toLowerCase().includes(q) ||
          e.subtitle?.toLowerCase().includes(q) ||
          e.review?.toLowerCase().includes(q) ||
          (e.tags && e.tags.some((t) => t.toLowerCase().includes(q)))
      );
    }

    if (selectedType !== "all") {
      result = result.filter((e) => (e.targetType || "album") === selectedType);
    }

    if (selectedMood !== "all") {
      result = result.filter((e) => e.mood === selectedMood);
    }

    if (sortBy === "highest") {
      result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === "oldest") {
      result.sort((a, b) => new Date(a.date || a.createdAt) - new Date(b.date || b.createdAt));
    } else {
      // Newest
      result.sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
    }

    return result;
  }, [entries, searchQuery, selectedType, selectedMood, sortBy]);

  // Statistics
  const stats = useMemo(() => {
    const total = entries.length;
    const rated = entries.filter((e) => e.rating > 0);
    const avgScore =
      rated.length > 0
        ? (rated.reduce((acc, curr) => acc + curr.rating, 0) / rated.length).toFixed(1)
        : null;

    const moodsCount = {};
    entries.forEach((e) => {
      if (e.mood) {
        moodsCount[e.mood] = (moodsCount[e.mood] || 0) + 1;
      }
    });

    let topMood = null;
    let maxCount = 0;
    Object.entries(moodsCount).forEach(([mood, count]) => {
      if (count > maxCount) {
        maxCount = count;
        topMood = mood;
      }
    });

    const masterpieces = entries.filter((e) => e.rating >= 9 || e.numericalScore >= 90).length;

    return { total, avgScore, topMood, masterpieces };
  }, [entries]);

  return (
    <div className="min-h-screen text-[var(--theme-fg)] py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-10">
      {/* Header Banner with Rich Whitespace */}
      <div className="space-y-4 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/25 text-amber-300 text-xs font-bold uppercase tracking-wider mb-2">
              <BookOpen size={13} />
              <span>Personal Listening Archive</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight font-display">
              Music Journal
            </h1>
            <p className="text-sm sm:text-base text-[var(--theme-muted)] mt-2 max-w-2xl leading-relaxed">
              Log your musical listens, rate on the 10-star & 100-score scales, track moods, and record your private reflections.
            </p>
          </div>

          <button
            onClick={() => {
              setModalItem({
                id: `log_${Date.now()}`,
                type: "album",
                title: "New Album Listen",
                subtitle: "",
                image: "",
              });
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 text-zinc-950 font-extrabold text-sm hover:scale-105 active:scale-95 transition-all shadow-lg shadow-amber-400/20 cursor-pointer self-start sm:self-center shrink-0"
          >
            <Plus size={18} />
            <span>Log a Listen</span>
          </button>
        </div>

        {/* Spacious Stats Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-4">
          <div className="p-4 rounded-2xl bg-[var(--theme-card)]/70 backdrop-blur-md border border-[var(--theme-border)]">
            <span className="text-xs font-semibold text-[var(--theme-muted)] block uppercase tracking-wider">
              Total Logged
            </span>
            <span className="text-2xl sm:text-3xl font-black text-amber-300 font-mono mt-1 block">
              {stats.total}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-[var(--theme-card)]/70 backdrop-blur-md border border-[var(--theme-border)]">
            <span className="text-xs font-semibold text-[var(--theme-muted)] block uppercase tracking-wider">
              Average Score
            </span>
            <span className="text-2xl sm:text-3xl font-black text-amber-300 font-mono mt-1 block">
              {stats.avgScore ? `${stats.avgScore}/10` : "—"}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-[var(--theme-card)]/70 backdrop-blur-md border border-[var(--theme-border)]">
            <span className="text-xs font-semibold text-[var(--theme-muted)] block uppercase tracking-wider">
              Top Mood
            </span>
            <span className="text-base sm:text-lg font-bold text-[var(--theme-fg)] mt-1.5 block truncate">
              {stats.topMood || "Diverse"}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-[var(--theme-card)]/70 backdrop-blur-md border border-[var(--theme-border)]">
            <span className="text-xs font-semibold text-[var(--theme-muted)] block uppercase tracking-wider">
              Masterpieces
            </span>
            <span className="text-2xl sm:text-3xl font-black text-amber-300 font-mono mt-1 block">
              {stats.masterpieces} 👑
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-2 rounded-2xl bg-[var(--theme-surface)]/70 border border-[var(--theme-border)]">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--theme-muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search entries by title, artist, or note..."
            className="w-full pl-10 pr-4 py-2 bg-transparent text-sm text-[var(--theme-fg)] placeholder:text-[var(--theme-muted)]/60 focus:outline-none"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto px-2 py-1 scrollb-none">
          {["all", "album", "track", "artist"].map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer shrink-0 ${
                selectedType === type
                  ? "bg-amber-400 text-zinc-950 shadow-xs"
                  : "text-[var(--theme-muted)] hover:text-[var(--theme-fg)] hover:bg-[var(--theme-card)]"
              }`}
            >
              {type === "all" ? "All Formats" : `${type}s`}
            </button>
          ))}

          <div className="w-[1px] h-4 bg-white/10 shrink-0 mx-1" />

          {/* Sort dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-[var(--theme-card)] border border-[var(--theme-border)] rounded-xl px-2.5 py-1 text-xs text-[var(--theme-fg)] cursor-pointer focus:outline-none"
          >
            <option value="newest">Newest First</option>
            <option value="highest">Highest Rated</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </div>

      {/* Journal Entries List */}
      {loading ? (
        <div className="py-20 text-center text-sm text-[var(--theme-muted)]">
          Loading your journal archive...
        </div>
      ) : filteredEntries.length === 0 ? (
        <div className="text-center py-20 px-6 rounded-3xl bg-[var(--theme-card)]/50 border border-[var(--theme-border)] max-w-lg mx-auto space-y-4">
          <div className="w-16 h-16 rounded-full bg-amber-400/10 border border-amber-400/25 flex items-center justify-center text-amber-300 mx-auto">
            <BookOpen size={28} />
          </div>
          <h3 className="text-xl font-bold text-[var(--theme-fg)]">
            {searchQuery || selectedType !== "all" ? "No matching entries found" : "Your Music Journal is Empty"}
          </h3>
          <p className="text-sm text-[var(--theme-muted)] leading-relaxed">
            {searchQuery || selectedType !== "all"
              ? "Try adjusting your search query or format filter."
              : "Whenever you listen to an album or track, tap Rate to capture your thoughts, assign a score, and build your musical story."}
          </p>
          {!searchQuery && (
            <button
              onClick={() => {
                setModalItem({
                  id: `log_${Date.now()}`,
                  type: "album",
                  title: "New Album Listen",
                  subtitle: "",
                  image: "",
                });
                setIsModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-amber-400 text-zinc-950 font-extrabold text-sm hover:scale-105 active:scale-95 transition cursor-pointer"
            >
              <Sparkles size={16} />
              <span>Write First Journal Entry</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {filteredEntries.map((entry) => {
            const targetHref = entry.targetId
              ? `/${entry.targetType || "album"}/${entry.targetId}`
              : "#";

            return (
              <article
                key={entry.id}
                className="relative rounded-3xl bg-[var(--theme-card)]/75 backdrop-blur-xl border border-[var(--theme-border)]/80 hover:border-amber-400/40 p-6 sm:p-8 transition-all duration-200 shadow-xl space-y-5 group"
              >
                {/* Header Row: Date, Rating, Mood, Public/Private, Actions */}
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    {/* Date */}
                    <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[var(--theme-muted)]">
                      <Calendar size={13} className="text-amber-300" />
                      <span>
                        {entry.date
                          ? new Date(entry.date).toLocaleDateString(undefined, {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : "LOGGED"}
                      </span>
                    </div>

                    {/* Mood badge */}
                    {entry.mood && (
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/25 text-amber-300 font-semibold">
                        {entry.mood}
                      </span>
                    )}

                    {/* Public / Private Badge */}
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold inline-flex items-center gap-1 ${
                        entry.is_public
                          ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
                          : "text-zinc-400 bg-zinc-800 border border-zinc-700"
                      }`}
                    >
                      {entry.is_public ? <Globe size={10} /> : <Lock size={10} />}
                      <span>{entry.is_public ? "Public" : "Private"}</span>
                    </span>
                  </div>

                  {/* Rating & Actions */}
                  <div className="flex items-center gap-3">
                    {/* Rating Pill */}
                    {entry.rating > 0 && (
                      <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-amber-400/20 to-amber-400/10 border border-amber-400/35 text-amber-300 font-bold font-mono text-xs shadow-xs">
                        <Star size={13} fill="currentColor" className="text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.8)]" />
                        <span>{entry.rating}/10</span>
                        {entry.numericalScore > 0 && entry.ratingSystem === "score" && (
                          <span className="text-[10px] text-amber-200/80 font-normal">
                            ({entry.numericalScore}/100)
                          </span>
                        )}
                      </div>
                    )}

                    {/* Edit & Delete Buttons */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setModalItem({
                            id: entry.targetId,
                            type: entry.targetType || "album",
                            title: entry.title,
                            subtitle: entry.subtitle,
                            image: entry.image,
                            initialRating: entry.rating,
                            initialReview: entry.review,
                            journalEntryId: entry.id,
                          });
                          setIsModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-[var(--theme-muted)] hover:text-amber-300 hover:bg-amber-400/10 transition cursor-pointer"
                        title="Edit entry"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        onClick={() => handleDeleteEntry(entry.id)}
                        className="p-1.5 rounded-lg text-[var(--theme-muted)] hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                        title="Delete entry"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Target Music Card Link */}
                <Link
                  href={targetHref}
                  className="flex items-center gap-4 p-3.5 rounded-2xl bg-[var(--theme-surface)]/80 hover:bg-[var(--theme-surface)] border border-[var(--theme-border)]/60 transition group/link max-w-xl"
                >
                  {entry.image ? (
                    <img
                      src={entry.image}
                      alt={entry.title}
                      className="w-14 h-14 rounded-xl object-cover shrink-0 shadow-md ring-1 ring-[var(--theme-border)]"
                      onError={(e) => {
                        e.currentTarget.src = FALLBACK_COVER_SVG;
                      }}
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-[var(--theme-card)] flex items-center justify-center text-[var(--theme-muted)] shrink-0 border border-[var(--theme-border)]">
                      <Disc size={22} />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--theme-accent)]">
                      {entry.targetType || "Release"}
                    </span>
                    <h3 className="text-base font-extrabold text-[var(--theme-fg)] group-hover/link:text-amber-300 transition-colors truncate">
                      {entry.title}
                    </h3>
                    {entry.subtitle && (
                      <p className="text-xs text-[var(--theme-muted)] truncate mt-0.5">
                        {entry.subtitle}
                      </p>
                    )}
                  </div>

                  <ArrowRight
                    size={16}
                    className="text-[var(--theme-muted)] group-hover/link:text-amber-300 transition-transform group-hover/link:translate-x-1 shrink-0 mr-1"
                  />
                </Link>

                {/* Thoughtful Reflection Content */}
                {entry.review && (
                  <div className="text-sm sm:text-base leading-relaxed text-[var(--theme-fg)] font-body whitespace-pre-line pt-1">
                    {entry.review}
                  </div>
                )}

                {/* Tags */}
                {entry.tags && entry.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {entry.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[var(--theme-surface)] border border-[var(--theme-border)] text-[var(--theme-muted)]"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {/* Rating & Journal Modal */}
      {isModalOpen && modalItem && (
        <RatingAndJournalModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setModalItem(null);
          }}
          id={modalItem.id}
          type={modalItem.type || "album"}
          title={modalItem.title}
          subtitle={modalItem.subtitle}
          image={modalItem.image}
          initialRating={modalItem.initialRating || 0}
          initialReview={modalItem.initialReview || ""}
          journalEntryId={modalItem.journalEntryId || null}
        />
      )}
    </div>
  );
}
