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
  PenTool,
  Headphones,
} from "lucide-react";
import RatingAndJournalModal from "@/Components/RatingAndJournalModal";
import JournalCard from "@/Components/JournalCard";
import { toast } from "@/lib/toast";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

export default function MusicJournalPage() {
  const { user } = useSupabaseAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("all"); // 'all' | 'album' | 'track' | 'artist'
  const [filterMode, setFilterMode] = useState("all"); // 'all' | 'reviewed' | 'logs'
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
            rating:
              j.user_ratings?.rating_type === "stars"
                ? j.user_ratings.score
                : Math.round((j.user_ratings?.score || 0) / 10),
            numericalScore: j.user_ratings?.score || 0,
            ratingSystem: j.user_ratings?.rating_type || "stars",
            date: j.listened_date,
            review: j.entry_text || "",
            mood: j.mood || "",
            is_public: j.is_public,
            createdAt: new Date(j.created_at).getTime(),
          }));

          // Deduplicate cloud entries by entity targetId (pruning any legacy duplicates from view)
          const seenTargets = new Set();
          const deduplicatedCloud = [];
          for (const item of formatted) {
            const key = `${item.targetType}_${item.targetId}`;
            if (!seenTargets.has(key)) {
              seenTargets.add(key);
              deduplicatedCloud.push(item);
            }
          }

          // Merge local and cloud without duplicates
          const cloudIds = new Set(deduplicatedCloud.map((c) => c.targetId));
          const uncommittedLocal = localLogs.filter((l) => !cloudIds.has(l.targetId));
          setEntries([...deduplicatedCloud, ...uncommittedLocal]);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.warn("Could not sync cloud journals, showing local entries:", err.message);
      }
    }

    setEntries(localLogs);
    setLoading(false);
  };

  useEffect(() => {
    loadJournalEntries();

    const handleSync = () => loadJournalEntries();
    window.addEventListener("groove-journal-updated", handleSync);
    window.addEventListener("groove-rating-changed", handleSync);
    return () => {
      window.removeEventListener("groove-journal-updated", handleSync);
      window.removeEventListener("groove-rating-changed", handleSync);
    };
  }, [user]);

  const handleDeleteEntry = async (id) => {
    if (!confirm("Are you sure you want to remove this journal entry?")) return;

    // 1. Remove from local storage
    const updated = entries.filter((e) => e.id !== id);
    setEntries(updated);
    localStorage.setItem("groove_journal_logs", JSON.stringify(updated));

    // 2. Remove from Supabase if authenticated
    if (user && isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        await supabase.from("journals").delete().eq("id", id).eq("user_id", user.id);
      } catch (_) {}
    }

    toast.success("Journal entry removed.");
  };

  // Distinct moods in logs
  const availableMoods = useMemo(() => {
    const set = new Set();
    entries.forEach((e) => {
      if (e.mood) set.add(e.mood);
    });
    return Array.from(set);
  }, [entries]);

  // Key metrics
  const stats = useMemo(() => {
    const total = entries.length;
    const reviewed = entries.filter((e) => e.review && e.review.trim().length > 0).length;
    const rated = entries.filter((e) => e.rating > 0);
    const avgScore =
      rated.length > 0
        ? (rated.reduce((acc, curr) => acc + curr.rating, 0) / rated.length).toFixed(1)
        : null;
    return { total, reviewed, avgScore };
  }, [entries]);

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

    if (filterMode === "reviewed") {
      result = result.filter((e) => e.review && e.review.trim().length > 0);
    } else if (filterMode === "logs") {
      result = result.filter((e) => !e.review || e.review.trim().length === 0);
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
  }, [entries, searchQuery, selectedType, filterMode, selectedMood, sortBy]);

  return (
    <div className="min-h-screen text-[var(--theme-fg)] py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-10">
      {/* Header Banner with Rich Editorial Whitespace */}
      <div className="relative rounded-3xl bg-[var(--theme-card)]/90 backdrop-blur-2xl border border-[var(--theme-border)] p-8 sm:p-10 shadow-2xl overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-300 text-xs font-bold uppercase tracking-widest">
              <BookOpen size={13} />
              <span>Music Journal & Reviews</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight font-display text-[var(--theme-fg)]">
              Your Music Journal
            </h1>
            <p className="text-sm sm:text-base text-[var(--theme-muted)] leading-relaxed pt-1">
              Every listen has a story. Log your thoughts, record your scores, capture your listening mood, and build a lasting music archive.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
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
              className="px-6 py-3 rounded-full bg-gradient-to-r from-amber-400 to-amber-300 text-zinc-950 font-black text-sm hover:scale-105 active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus size={16} />
              <span>Log a Listen</span>
            </button>
          </div>
        </div>

        {/* Live Metric Ribbon */}
        <div className="grid grid-cols-3 gap-3 sm:gap-6 mt-8 pt-6 border-t border-[var(--theme-border)]/70">
          <div>
            <div className="text-xs font-bold text-[var(--theme-muted)] uppercase tracking-wider">
              Total Listens
            </div>
            <div className="text-2xl sm:text-3xl font-black text-[var(--theme-fg)] mt-1">
              {stats.total}
            </div>
          </div>

          <div>
            <div className="text-xs font-bold text-[var(--theme-muted)] uppercase tracking-wider">
              Written Reviews
            </div>
            <div className="text-2xl sm:text-3xl font-black text-amber-300 mt-1">
              {stats.reviewed}
            </div>
          </div>

          <div>
            <div className="text-xs font-bold text-[var(--theme-muted)] uppercase tracking-wider">
              Average Rating
            </div>
            <div className="text-2xl sm:text-3xl font-black text-amber-300 mt-1">
              {stats.avgScore ? `${stats.avgScore}★` : "—"}
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar: Search + Filter Pills + Sorting */}
      <div className="space-y-4">
        {/* Search Input */}
        <div className="relative rounded-2xl bg-[var(--theme-card)]/80 border border-[var(--theme-border)] shadow-md overflow-hidden focus-within:border-amber-400/50 transition-colors">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--theme-muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search journal entries by album, track, artist, mood, or review text..."
            className="w-full pl-11 pr-4 py-3 bg-transparent text-sm text-[var(--theme-fg)] placeholder:text-[var(--theme-muted)]/60 focus:outline-none"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          {/* Format & Mode Pills */}
          <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none flex-wrap">
            {/* Review Mode Toggles */}
            <div className="flex items-center gap-1 bg-[var(--theme-card)]/80 p-1 rounded-2xl border border-[var(--theme-border)]">
              <button
                onClick={() => setFilterMode("all")}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                  filterMode === "all"
                    ? "bg-amber-400 text-zinc-950 shadow-xs"
                    : "text-[var(--theme-muted)] hover:text-[var(--theme-fg)]"
                }`}
              >
                All Logs ({entries.length})
              </button>
              <button
                onClick={() => setFilterMode("reviewed")}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                  filterMode === "reviewed"
                    ? "bg-amber-400 text-zinc-950 shadow-xs"
                    : "text-[var(--theme-muted)] hover:text-[var(--theme-fg)]"
                }`}
              >
                <PenTool size={11} />
                <span>Reviews ({stats.reviewed})</span>
              </button>
              <button
                onClick={() => setFilterMode("logs")}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                  filterMode === "logs"
                    ? "bg-amber-400 text-zinc-950 shadow-xs"
                    : "text-[var(--theme-muted)] hover:text-[var(--theme-fg)]"
                }`}
              >
                <Headphones size={11} />
                <span>Just Logged</span>
              </button>
            </div>

            {/* Entity Types */}
            {["all", "album", "track", "artist"].map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer shrink-0 ${
                  selectedType === type
                    ? "bg-[var(--theme-surface)] text-amber-300 border border-amber-400/40 shadow-xs"
                    : "text-[var(--theme-muted)] hover:text-[var(--theme-fg)] hover:bg-[var(--theme-card)] border border-transparent"
                }`}
              >
                {type === "all" ? "All Formats" : `${type}s`}
              </button>
            ))}
          </div>

          {/* Sort dropdown */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-medium text-[var(--theme-muted)]">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-[var(--theme-card)] border border-[var(--theme-border)] rounded-xl px-3 py-1.5 text-xs font-semibold text-[var(--theme-fg)] cursor-pointer focus:outline-none focus:border-amber-400/50"
            >
              <option value="newest">Newest Listened</option>
              <option value="highest">Highest Score</option>
              <option value="oldest">Oldest Listened</option>
            </select>
          </div>
        </div>
      </div>

      {/* Journal Entries List */}
      {loading ? (
        <div className="py-24 text-center text-sm font-medium text-[var(--theme-muted)] animate-pulse">
          Loading your journal archive...
        </div>
      ) : filteredEntries.length === 0 ? (
        <div className="text-center py-20 px-6 rounded-3xl bg-[var(--theme-card)]/50 border border-[var(--theme-border)] max-w-lg mx-auto space-y-4 shadow-xl">
          <div className="w-16 h-16 rounded-full bg-amber-400/10 border border-amber-400/25 flex items-center justify-center text-amber-300 mx-auto shadow-inner">
            <BookOpen size={28} />
          </div>
          <h3 className="text-xl font-bold text-[var(--theme-fg)]">
            {searchQuery || selectedType !== "all" || filterMode !== "all"
              ? "No matching entries found"
              : "Your Music Journal is Empty"}
          </h3>
          <p className="text-sm text-[var(--theme-muted)] leading-relaxed">
            {searchQuery || selectedType !== "all" || filterMode !== "all"
              ? "Try adjusting your search query, format filter, or review toggle."
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
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-amber-400 text-zinc-950 font-extrabold text-sm hover:scale-105 active:scale-95 transition cursor-pointer shadow-md"
            >
              <Sparkles size={16} />
              <span>Write First Journal Entry</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6 sm:space-y-7">
          {filteredEntries.map((entry) => (
            <JournalCard
              key={entry.id}
              entry={entry}
              isOwner={true}
              onEdit={(e) => {
                setModalItem({
                  id: e.targetId,
                  type: e.targetType || "album",
                  title: e.title,
                  subtitle: e.subtitle,
                  image: e.image,
                  initialRating: e.rating,
                  initialReview: e.review,
                  journalEntryId: e.id,
                });
                setIsModalOpen(true);
              }}
              onDelete={handleDeleteEntry}
            />
          ))}
        </div>
      )}

      {/* Rating & Journal Modal */}
      {isModalOpen && modalItem && (
        <RatingAndJournalModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setModalItem(null);
            loadJournalEntries();
          }}
          id={modalItem.id}
          type={modalItem.type || "album"}
          title={modalItem.title}
          subtitle={modalItem.subtitle}
          image={modalItem.image}
          initialRating={modalItem.initialRating || 0}
          initialReview={modalItem.initialReview || ""}
          journalEntryId={modalItem.journalEntryId || null}
          onSaved={() => {
            loadJournalEntries();
          }}
        />
      )}
    </div>
  );
}
