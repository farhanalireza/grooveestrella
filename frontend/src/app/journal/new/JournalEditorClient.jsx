// src/app/journal/new/JournalEditorClient.jsx
"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Star,
  Calendar,
  BookOpen,
  Lock,
  Globe,
  Disc,
  Music,
  User,
  Search,
  RefreshCw,
  Trash2,
  Sparkles,
  Check,
  X,
  Info,
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
  9: { label: "Superb", mood: "Outstanding work" },
  10: { label: "Masterpiece", mood: "Timeless classic" },
};

const LIGHT_CONTEXT_SUGGESTIONS = [
  "Late night headphones",
  "First full listen",
  "Vinyl session",
  "Rainy evening",
  "Deep focus",
  "Morning coffee",
  "Live memories",
];

const FALLBACK_COVER_SVG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%2317020B'/%3E%3Ccircle cx='50' cy='50' r='35' fill='%23300818' stroke='%23E8A87C' stroke-width='2' stroke-dasharray='4 2'/%3E%3Ccircle cx='50' cy='50' r='12' fill='%23E8A87C'/%3E%3Ccircle cx='50' cy='50' r='4' fill='%2317020B'/%3E%3C/svg%3E";

function isUuid(val) {
  return (
    typeof val === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val)
  );
}

export default function JournalEditorClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useSupabaseAuth();

  const paramMbid = searchParams.get("mbid") || "";
  const paramType = searchParams.get("type") || "album";
  const paramTitle = searchParams.get("title") || "";
  const paramSubtitle = searchParams.get("subtitle") || "";
  const paramImage = searchParams.get("image") || "";
  const paramYear = searchParams.get("year") ? parseInt(searchParams.get("year"), 10) : null;
  const paramEntryId = searchParams.get("entryId") || "";
  const paramReturnTo = searchParams.get("returnTo") || "";

  // Selected music entity state
  const [selectedEntity, setSelectedEntity] = useState(() =>
    paramMbid
      ? {
          mbid: paramMbid,
          type: paramType === "track" || paramType === "artist" ? paramType : "album",
          title: paramTitle || "Loading release...",
          subtitle: paramSubtitle || "",
          image: paramImage || "",
          year: Number.isInteger(paramYear) ? paramYear : null,
        }
      : null
  );

  // Inline entity switcher / MusicBrainz search state
  const [isChangingEntity, setIsChangingEntity] = useState(!paramMbid);
  const [entitySearchType, setEntitySearchType] = useState(
    paramType === "track" || paramType === "artist" ? paramType : "album"
  );
  const [entitySearchQuery, setEntitySearchQuery] = useState("");
  const [entitySearchResults, setEntitySearchResults] = useState([]);
  const [searchingEntities, setSearchingEntities] = useState(false);
  const [savedQuickPicks, setSavedQuickPicks] = useState([]);
  const searchAbortRef = useRef(null);

  // Main form fields (in exact Phase 2 order)
  const [listenedDate, setListenedDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [ratingSystem, setRatingSystem] = useState("stars");
  const [starRating, setStarRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [scoreRating, setScoreRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [moodContext, setMoodContext] = useState("");
  const [isPublic, setIsPublic] = useState(true);

  const [existingJournalId, setExistingJournalId] = useState(paramEntryId || null);
  const [existingCreatedAt, setExistingCreatedAt] = useState(null);
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load user defaults and quick library picks on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const prefSystem = localStorage.getItem("preferred_rating_system");
        if (prefSystem === "stars" || prefSystem === "score") {
          setRatingSystem(prefSystem);
        }
        const prefPublic = localStorage.getItem("default_journal_public");
        if (prefPublic !== null && !paramEntryId) {
          setIsPublic(prefPublic === "true");
        }

        const albums = JSON.parse(localStorage.getItem("savedAlbums") || "[]").slice(0, 4).map((a) => ({
          mbid: a.id,
          type: "album",
          title: a.title || a.name,
          subtitle: Array.isArray(a.artist) ? a.artist.map((x) => x.name).join(", ") : a.artist || "",
          image: a.image || "",
          year: a.release_date ? parseInt(String(a.release_date).slice(0, 4), 10) : null,
        }));
        const tracks = JSON.parse(localStorage.getItem("savedSongs") || "[]").slice(0, 4).map((t) => ({
          mbid: t.trackId || t.id,
          type: "track",
          title: t.title || t.name,
          subtitle: Array.isArray(t.artist) ? t.artist.map((x) => x.name).join(", ") : t.artist || "",
          image: t.image || "",
          year: null,
        }));
        setSavedQuickPicks([...albums, ...tracks].filter((x) => isUuid(x.mbid)).slice(0, 6));
      } catch (_) {}
    }, 0);
    return () => clearTimeout(timer);
  }, [paramEntryId]);

  const selectedMbid = selectedEntity?.mbid;
  const selectedType = selectedEntity?.type || "album";
  const selectedTitle = selectedEntity?.title;
  const selectedImage = selectedEntity?.image;
  const currentUserId = user?.id;

  // Self-heal entity metadata if opened with MBID only (or missing image/title)
  useEffect(() => {
    if (!selectedMbid) return;
    if (selectedTitle && selectedTitle !== "Loading release..." && selectedImage) {
      return;
    }

    let active = true;
    fetch(
      `/api/entity/sync?mbid=${encodeURIComponent(selectedMbid)}&type=${encodeURIComponent(
        selectedType
      )}`
    )
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active || !data?.entity) return;
        const ent = data.entity;
        setSelectedEntity((prev) =>
          prev && prev.mbid === selectedMbid
            ? {
                ...prev,
                type: ent.type === "artist" || ent.type === "track" ? ent.type : "album",
                title: ent.title || prev.title,
                subtitle: ent.artist_credit || prev.subtitle,
                image: ent.cover_art_url || prev.image,
                year: ent.year || prev.year,
              }
            : prev
        );
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [selectedMbid, selectedType, selectedTitle, selectedImage]);

  // Load existing rating & journal entry for selectedEntity (localStorage + Supabase Cloud)
  useEffect(() => {
    if (!selectedMbid) return;
    const mbid = selectedMbid;
    const type = selectedType;
    const ratingKey = `groove_user_rating_${type}_${mbid}`;

    let active = true;
    const timer = setTimeout(async () => {
      if (!active) return;
      setLoadingExisting(true);

      // 1. Local check
      try {
        const rawRating = localStorage.getItem(ratingKey);
        if (rawRating) {
          const parsed = JSON.parse(rawRating);
          const sc = typeof parsed === "number" ? parsed : parsed?.score || 0;
          if (parsed?.system === "score") {
            setRatingSystem("score");
            setScoreRating(sc);
            setStarRating(Math.round(sc / 10));
          } else if (sc > 0) {
            setRatingSystem("stars");
            setStarRating(sc);
            setScoreRating(sc * 10);
          }
        } else {
          setStarRating(0);
          setScoreRating(0);
        }

        const rawLogs = localStorage.getItem("groove_journal_logs");
        if (rawLogs) {
          const logs = JSON.parse(rawLogs);
          const match = paramEntryId
            ? logs.find((l) => l.id === paramEntryId)
            : logs.find((l) => l.targetId === mbid && l.targetType === type);
          if (match) {
            setExistingJournalId(match.id);
            setExistingCreatedAt(match.createdAt || null);
            setReviewText(match.review || match.entry_text || "");
            setMoodContext(match.mood || "");
            if (match.is_public !== undefined) setIsPublic(Boolean(match.is_public));
            if (match.date || match.listened_date) {
              setListenedDate(String(match.date || match.listened_date).split("T")[0]);
            }
            if (match.rating > 0) {
              setStarRating(match.rating);
              setScoreRating(match.numericalScore || match.rating * 10);
            }
          } else if (!paramEntryId) {
            setExistingJournalId(null);
            setReviewText("");
            setMoodContext("");
          }
        }
      } catch (_) {}

      // 2. Cloud check (authoritative when signed in)
      if (currentUserId && isSupabaseConfigured()) {
        const supabase = createClient();
        try {
          const { data: entityRow } = await supabase
            .from("music_entities")
            .select("id")
            .eq("mbid", mbid)
            .maybeSingle();

          if (!active) return;
          if (entityRow?.id) {
            const [journalRes, ratingRes] = await Promise.all([
              supabase
                .from("journals")
                .select(
                  "id, entry_text, mood, listened_date, is_public, created_at, user_ratings ( score, rating_type )"
                )
                .eq("user_id", currentUserId)
                .eq("entity_id", entityRow.id)
                .maybeSingle(),
              supabase
                .from("user_ratings")
                .select("id, score, rating_type")
                .eq("user_id", currentUserId)
                .eq("entity_id", entityRow.id)
                .limit(1)
                .maybeSingle(),
            ]);

            if (!active) return;

            const cloudEntry = journalRes?.data;
            const cloudRating = cloudEntry?.user_ratings || ratingRes?.data;

            if (cloudEntry) {
              setExistingJournalId(cloudEntry.id);
              setExistingCreatedAt(
                cloudEntry.created_at ? new Date(cloudEntry.created_at).getTime() : null
              );
              setReviewText(cloudEntry.entry_text || "");
              setMoodContext(cloudEntry.mood || "");
              setIsPublic(cloudEntry.is_public !== false);
              if (cloudEntry.listened_date) {
                setListenedDate(String(cloudEntry.listened_date).split("T")[0]);
              }
            }

            if (cloudRating) {
              if (cloudRating.rating_type === "score") {
                setRatingSystem("score");
                setScoreRating(Number(cloudRating.score));
                setStarRating(Math.round(Number(cloudRating.score) / 10));
              } else {
                setRatingSystem("stars");
                setStarRating(Number(cloudRating.score));
                setScoreRating(Number(cloudRating.score) * 10);
              }
            }
          }
        } catch (_) {
        } finally {
          if (active) setLoadingExisting(false);
        }
      } else {
        if (active) setLoadingExisting(false);
      }
    }, 0);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [selectedMbid, selectedType, currentUserId, paramEntryId]);

  // Debounced MusicBrainz entity search for selecting/changing entity
  useEffect(() => {
    if (!isChangingEntity) return;
    const q = entitySearchQuery.trim();
    if (q.length < 2) {
      return;
    }

    const timer = setTimeout(async () => {
      if (searchAbortRef.current) searchAbortRef.current.abort();
      const controller = new AbortController();
      searchAbortRef.current = controller;

      setSearchingEntities(true);
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(q)}&type=${encodeURIComponent(entitySearchType)}&limit=8`,
          { signal: controller.signal }
        );
        if (res.ok) {
          const data = await res.json();
          setEntitySearchResults(data.results || []);
        }
      } catch (err) {
        if (err?.name !== "AbortError") {
          setEntitySearchResults([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setSearchingEntities(false);
        }
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [entitySearchQuery, entitySearchType, isChangingEntity]);

  const handleSelectSearchEntity = (item) => {
    const artistStr = Array.isArray(item.artists)
      ? item.artists.map((a) => a.name).join(", ")
      : Array.isArray(item.artist)
      ? item.artist.map((a) => (typeof a === "object" ? a.name : a)).join(", ")
      : item.artist || "";

    setSelectedEntity({
      mbid: item.mbid || item.id,
      type: entitySearchType,
      title: item.title || item.name || "Untitled",
      subtitle: artistStr,
      image: item.coverArt || item.url || item.image || "",
      year: item.releaseYear || null,
    });
    setIsChangingEntity(false);
    setEntitySearchQuery("");
    setEntitySearchResults([]);
  };

  const activeDescriptor = useMemo(() => {
    const val = hoverRating || starRating;
    return RATING_DESCRIPTORS[val] || null;
  }, [hoverRating, starRating]);

  const handleClearRating = () => {
    setStarRating(0);
    setScoreRating(0);
  };

  const getReturnDestination = () => {
    if (paramReturnTo && paramReturnTo.startsWith("/")) {
      return paramReturnTo;
    }
    if (selectedEntity?.mbid) {
      return `/${selectedEntity.type}/${selectedEntity.mbid}`;
    }
    return "/library?tab=journal";
  };

  const handleCancel = () => {
    if (paramReturnTo && paramReturnTo.startsWith("/")) {
      router.push(paramReturnTo);
    } else if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/library?tab=journal");
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!selectedEntity?.mbid) {
      toast.warning("Please select an album, track, or artist first.");
      setIsChangingEntity(true);
      return;
    }
    if (!listenedDate) {
      toast.warning("Please select the date you listened.");
      return;
    }

    const activeScore = ratingSystem === "stars" ? starRating : scoreRating;
    if (activeScore <= 0 && !reviewText.trim()) {
      toast.warning("Please add a rating or write your thoughts before saving.");
      return;
    }

    setIsSaving(true);
    const { mbid, type, title, subtitle, image, year } = selectedEntity;
    const ratingStorageKey = `groove_user_rating_${type}_${mbid}`;
    const trimmedReview = reviewText.trim();
    const trimmedMood = moodContext.trim();

    try {
      // 1. Local rating update (Ratings are NEVER private)
      if (activeScore > 0) {
        localStorage.setItem(
          ratingStorageKey,
          JSON.stringify({
            score: ratingSystem === "stars" ? starRating : scoreRating,
            numericalScore: scoreRating,
            system: ratingSystem,
            is_public: true,
            updatedAt: Date.now(),
          })
        );
      } else {
        localStorage.removeItem(ratingStorageKey);
      }

      window.dispatchEvent(
        new CustomEvent("groove-rating-changed", {
          detail: {
            id: mbid,
            type,
            score: ratingSystem === "stars" ? starRating : scoreRating,
            numericalScore: scoreRating,
            system: ratingSystem,
          },
        })
      );

      // 2. Local journal log update
      const rawLogs = localStorage.getItem("groove_journal_logs");
      let logs = rawLogs ? JSON.parse(rawLogs) : [];
      const localEntryId =
        existingJournalId || `journal_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      const localEntry = {
        id: localEntryId,
        targetId: mbid,
        targetType: type,
        title: title || "Untitled",
        subtitle: subtitle || "",
        image: image || "",
        rating: starRating,
        numericalScore: scoreRating,
        ratingSystem,
        date: listenedDate,
        review: trimmedReview,
        mood: trimmedMood,
        is_public: isPublic,
        updatedAt: Date.now(),
        createdAt: existingCreatedAt || Date.now(),
      };

      logs = logs.filter(
        (l) => l.id !== localEntryId && !(l.targetId === mbid && l.targetType === type)
      );
      logs.unshift(localEntry);
      localStorage.setItem("groove_journal_logs", JSON.stringify(logs));

      // 3. Supabase Cloud sync (enforcing Phase 2 hard rules)
      if (user && isSupabaseConfigured()) {
        const supabase = createClient();

        // Step A: Ensure canonical music_entity exists via MBID
        let entityRecordId = null;
        try {
          const syncRes = await fetch("/api/entity/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              mbid,
              type: type === "track" ? "track" : type === "artist" ? "artist" : "album",
              title: title || "Untitled",
              artist: subtitle || "",
              year: Number.isInteger(year) ? year : undefined,
              cover_art_url: image || null,
            }),
          });
          if (syncRes.ok) {
            const syncData = await syncRes.json();
            if (syncData?.entity?.id) {
              entityRecordId = syncData.entity.id;
            }
          }
        } catch (syncErr) {
          console.warn("Entity sync warning:", syncErr?.message);
        }

        if (!entityRecordId) {
          const { data: existingEnt } = await supabase
            .from("music_entities")
            .select("id")
            .eq("mbid", mbid)
            .maybeSingle();

          if (existingEnt?.id) {
            entityRecordId = existingEnt.id;
          } else {
            const { data: insertedEnt } = await supabase
              .from("music_entities")
              .insert({
                mbid,
                type: type === "track" ? "track" : type === "artist" ? "artist" : "album",
                title: title || "Untitled",
                artist_credit: subtitle || "",
                year: Number.isInteger(year) ? year : null,
                cover_art_url: image || null,
                data: { groovelink: {} },
              })
              .select("id")
              .single();
            entityRecordId = insertedEnt?.id || null;
          }
        }

        if (entityRecordId) {
          // Step B: Upsert or clear rating.
          // HARD RULE: Ratings are NEVER private (is_public: true ALWAYS).
          // HARD RULE: Never leak private journal text into user_ratings.review.
          let ratingRecordId = null;
          if (activeScore > 0) {
            const { data: ratingRow, error: ratingErr } = await supabase
              .from("user_ratings")
              .upsert(
                {
                  user_id: user.id,
                  entity_id: entityRecordId,
                  rating_type: ratingSystem,
                  score: ratingSystem === "stars" ? starRating : scoreRating,
                  review: isPublic ? trimmedReview || null : null,
                  listened_date: listenedDate,
                  is_public: true,
                },
                { onConflict: "user_id,entity_id,rating_type" }
              )
              .select("id")
              .single();

            if (ratingErr) throw ratingErr;
            ratingRecordId = ratingRow?.id || null;
          } else {
            // If user cleared their rating, remove any prior rating rows for this entity
            await supabase
              .from("user_ratings")
              .delete()
              .eq("user_id", user.id)
              .eq("entity_id", entityRecordId);
          }

          // Step C: Upsert journal entry (1 per user per entity)
          const { data: existingCloudJournals } = await supabase
            .from("journals")
            .select("id")
            .eq("user_id", user.id)
            .eq("entity_id", entityRecordId)
            .order("created_at", { ascending: false });

          const targetJournalId =
            (existingJournalId && isUuid(existingJournalId) ? existingJournalId : null) ||
            existingCloudJournals?.[0]?.id ||
            null;

          if (targetJournalId) {
            const { error: updErr } = await supabase
              .from("journals")
              .update({
                entry_text: trimmedReview || null,
                mood: trimmedMood || null,
                listened_date: listenedDate,
                rating_id: ratingRecordId,
                is_public: isPublic,
                updated_at: new Date().toISOString(),
              })
              .eq("id", targetJournalId)
              .eq("user_id", user.id);

            if (updErr) throw updErr;
          } else {
            const { error: insErr } = await supabase.from("journals").insert({
              user_id: user.id,
              entity_id: entityRecordId,
              entry_text: trimmedReview || null,
              mood: trimmedMood || null,
              listened_date: listenedDate,
              rating_id: ratingRecordId,
              is_public: isPublic,
            });
            if (insErr) throw insErr;
          }
        }
      }

      window.dispatchEvent(
        new CustomEvent("groove-journal-updated", {
          detail: { targetId: mbid, entryId: localEntryId },
        })
      );

      toast.success(
        isPublic
          ? "Saved to your Journal & published publicly!"
          : "Saved privately to your Journal (rating remains public)."
      );

      const dest = getReturnDestination();
      router.push(dest);
      router.refresh();
    } catch (err) {
      console.error("Failed to save journal entry:", err);
      toast.error(err?.message || "Could not save journal entry. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!existingJournalId || !selectedEntity?.mbid) return;
    if (!confirm("Remove this journal entry? (Your public rating can also be cleared separately if desired.)")) {
      return;
    }

    try {
      const rawLogs = localStorage.getItem("groove_journal_logs");
      if (rawLogs) {
        const updated = JSON.parse(rawLogs).filter((l) => l.id !== existingJournalId);
        localStorage.setItem("groove_journal_logs", JSON.stringify(updated));
      }

      if (user && isSupabaseConfigured() && isUuid(existingJournalId)) {
        const supabase = createClient();
        await supabase.from("journals").delete().eq("id", existingJournalId).eq("user_id", user.id);
      }

      window.dispatchEvent(
        new CustomEvent("groove-journal-updated", {
          detail: { targetId: selectedEntity.mbid },
        })
      );
      toast.info("Journal entry removed.");
      router.push(getReturnDestination());
      router.refresh();
    } catch (_) {
      toast.error("Failed to delete entry.");
    }
  };

  const TypeIcon =
    selectedEntity?.type === "artist" ? User : selectedEntity?.type === "track" ? Music : Disc;

  return (
    <div className="min-h-screen bg-[var(--theme-bg)] text-[var(--theme-fg)] py-8 sm:py-12 px-4 sm:px-6 pb-32 transition-colors duration-300">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Top Back Navigation */}
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={handleCancel}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-[var(--theme-muted)] hover:text-[var(--theme-fg)] transition cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>Back</span>
          </button>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-300 text-[11px] font-bold uppercase tracking-widest">
            <BookOpen size={12} />
            <span>{existingJournalId ? "Edit Journal Entry" : "Log a Listen"}</span>
          </div>
        </div>

        {/* Guest Sign-In Reminder */}
        {!authLoading && !user && isSupabaseConfigured() && (
          <div className="p-4 rounded-2xl bg-[var(--theme-card)]/80 border border-amber-400/30 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-start gap-2.5 text-xs text-[var(--theme-muted)]">
              <Info size={16} className="text-amber-300 shrink-0 mt-0.5" />
              <span>
                You are browsing as a guest. Sign in to publish reviews &amp; sync your journal to your public profile.
              </span>
            </div>
            <Link
              href="/login"
              className="px-4 py-1.5 rounded-full bg-amber-400 text-zinc-950 text-xs font-black hover:opacity-90 transition shrink-0"
            >
              Sign In
            </Link>
          </div>
        )}

        {/* TOP SECTION: Selected Entity Card + Ability to Change */}
        <section className="rounded-3xl bg-[var(--theme-card)]/85 backdrop-blur-xl border border-[var(--theme-border)] p-5 sm:p-6 shadow-xl space-y-4">
          {selectedEntity && !isChangingEntity ? (
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0 flex-1">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-black/40 border border-white/10 shrink-0 shadow-lg">
                  {selectedEntity.image ? (
                    <img
                      src={selectedEntity.image}
                      alt={selectedEntity.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = FALLBACK_COVER_SVG;
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[var(--theme-muted)]">
                      <TypeIcon size={26} />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1 space-y-0.5">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-[var(--theme-accent)]">
                    <TypeIcon size={11} />
                    <span>{selectedEntity.type}</span>
                    {selectedEntity.year ? ` · ${selectedEntity.year}` : ""}
                  </span>
                  <h1 className="text-lg sm:text-xl font-black text-[var(--theme-fg)] font-display truncate">
                    {selectedEntity.title}
                  </h1>
                  {selectedEntity.subtitle && (
                    <p className="text-xs sm:text-sm text-[var(--theme-muted)] font-medium truncate">
                      {selectedEntity.subtitle}
                    </p>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsChangingEntity(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-[var(--theme-surface)] hover:bg-[var(--theme-bg)] border border-[var(--theme-border)] hover:border-[var(--theme-accent)]/50 text-xs font-bold text-[var(--theme-fg)] transition cursor-pointer shrink-0"
              >
                <RefreshCw size={13} className="text-[var(--theme-accent)]" />
                <span>Change</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-base sm:text-lg font-black text-[var(--theme-fg)] font-display">
                    Select Album, Track, or Artist
                  </h2>
                  <p className="text-xs text-[var(--theme-muted)]">
                    Search the MusicBrainz catalog to link your listening entry.
                  </p>
                </div>
                {selectedEntity && (
                  <button
                    type="button"
                    onClick={() => setIsChangingEntity(false)}
                    className="p-2 rounded-xl text-[var(--theme-muted)] hover:text-[var(--theme-fg)] hover:bg-[var(--theme-surface)] transition cursor-pointer"
                    title="Keep current selection"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* Entity Type Selector */}
              <div className="flex items-center gap-1.5">
                {[
                  { id: "album", label: "Albums", icon: Disc },
                  { id: "track", label: "Tracks", icon: Music },
                  { id: "artist", label: "Artists", icon: User },
                ].map((t) => {
                  const Icon = t.icon;
                  const active = entitySearchType === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setEntitySearchType(t.id);
                        setEntitySearchResults([]);
                      }}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                        active
                          ? "bg-[var(--theme-accent)] text-[var(--theme-accent-fg)] shadow-sm"
                          : "bg-[var(--theme-surface)] text-[var(--theme-muted)] hover:text-[var(--theme-fg)] border border-[var(--theme-border)]"
                      }`}
                    >
                      <Icon size={13} />
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--theme-muted)]"
                />
                <input
                  type="text"
                  value={entitySearchQuery}
                  onChange={(e) => {
                    const next = e.target.value;
                    setEntitySearchQuery(next);
                    if (next.trim().length < 2) {
                      setEntitySearchResults([]);
                      setSearchingEntities(false);
                    }
                  }}
                  placeholder={`Search for an ${entitySearchType}...`}
                  autoFocus={!selectedEntity}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[var(--theme-surface)] border border-[var(--theme-border)] text-sm text-[var(--theme-fg)] placeholder:text-[var(--theme-muted)]/60 focus:outline-none focus:border-[var(--theme-accent)] transition"
                />
              </div>

              {/* Search Results */}
              {searchingEntities ? (
                <p className="text-xs text-[var(--theme-muted)] py-3 text-center animate-pulse">
                  Searching catalog...
                </p>
              ) : entitySearchResults.length > 0 ? (
                <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                  {entitySearchResults.map((item) => {
                    const artStr = Array.isArray(item.artists)
                      ? item.artists.map((a) => a.name).join(", ")
                      : Array.isArray(item.artist)
                      ? item.artist.map((a) => (typeof a === "object" ? a.name : a)).join(", ")
                      : item.artist || "";
                    const imgUrl = item.coverArt || item.url || item.image || FALLBACK_COVER_SVG;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectSearchEntity(item)}
                        className="w-full flex items-center gap-3 p-2.5 rounded-2xl bg-[var(--theme-surface)]/70 hover:bg-[var(--theme-surface)] border border-transparent hover:border-[var(--theme-accent)]/40 text-left transition cursor-pointer"
                      >
                        <img
                          src={imgUrl}
                          alt={item.title || item.name}
                          className={`w-11 h-11 object-cover shrink-0 bg-black/30 ${
                            entitySearchType === "artist" ? "rounded-full" : "rounded-xl"
                          }`}
                          onError={(e) => {
                            e.currentTarget.src = FALLBACK_COVER_SVG;
                          }}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-bold text-[var(--theme-fg)] truncate">
                            {item.title || item.name}
                          </div>
                          <div className="text-xs text-[var(--theme-muted)] truncate">
                            {artStr || (entitySearchType === "artist" ? "Artist" : "")}
                            {item.releaseYear ? ` · ${item.releaseYear}` : ""}
                          </div>
                        </div>
                        <span className="text-[11px] font-bold text-[var(--theme-accent)] shrink-0">
                          Select
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : entitySearchQuery.trim().length >= 2 ? (
                <p className="text-xs text-[var(--theme-muted)] py-2 text-center">
                  No matches found. Try another title or artist name.
                </p>
              ) : savedQuickPicks.length > 0 ? (
                <div className="space-y-2 pt-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--theme-muted)]">
                    From Your Library
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {savedQuickPicks.map((pick) => (
                      <button
                        key={`${pick.type}-${pick.mbid}`}
                        type="button"
                        onClick={() => {
                          setSelectedEntity(pick);
                          setIsChangingEntity(false);
                        }}
                        className="flex items-center gap-2.5 p-2 rounded-2xl bg-[var(--theme-surface)]/60 hover:bg-[var(--theme-surface)] border border-[var(--theme-border)]/70 hover:border-[var(--theme-accent)]/40 text-left transition cursor-pointer"
                      >
                        <img
                          src={pick.image || FALLBACK_COVER_SVG}
                          alt={pick.title}
                          className="w-10 h-10 rounded-xl object-cover shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold text-[var(--theme-fg)] truncate">
                            {pick.title}
                          </div>
                          <div className="text-[11px] text-[var(--theme-muted)] truncate">
                            {pick.subtitle || pick.type}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </section>

        {/* MAIN JOURNAL FORM */}
        <form onSubmit={handleSave} className="space-y-7">
          {loadingExisting && (
            <div className="text-xs text-[var(--theme-muted)] animate-pulse px-1">
              Checking for your previous notes and rating...
            </div>
          )}

          {/* 1. LISTENED DATE (Required) */}
          <div className="rounded-3xl bg-[var(--theme-card)]/70 border border-[var(--theme-border)] p-5 sm:p-6 space-y-2.5">
            <label
              htmlFor="listened-date"
              className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[var(--theme-fg)]"
            >
              <span className="inline-flex items-center gap-2">
                <Calendar size={14} className="text-[var(--theme-accent)]" />
                <span>1. Listened Date</span>
              </span>
              <span className="text-[10px] text-[var(--theme-accent)] font-semibold">Required</span>
            </label>
            <input
              id="listened-date"
              type="date"
              required
              value={listenedDate}
              onChange={(e) => setListenedDate(e.target.value)}
              className="w-full sm:w-auto min-w-[220px] bg-[var(--theme-surface)] border border-[var(--theme-border)] rounded-2xl px-4 py-2.5 text-sm font-semibold text-[var(--theme-fg)] focus:outline-none focus:border-[var(--theme-accent)] cursor-pointer"
            />
          </div>

          {/* 2. RATING (Always Public) */}
          <div className="rounded-3xl bg-[var(--theme-card)]/70 border border-amber-400/25 p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--theme-fg)]">
                  <Star size={14} className="text-amber-400" fill="currentColor" />
                  <span>2. Your Rating</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[10px] font-bold normal-case tracking-normal">
                    Always public
                  </span>
                </div>
                <p className="text-xs text-[var(--theme-muted)]">
                  Ratings are always public and contribute to community averages.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 p-0.5 rounded-xl bg-[var(--theme-surface)] border border-[var(--theme-border)]">
                  <button
                    type="button"
                    onClick={() => setRatingSystem("stars")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
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
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
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
                    className="text-xs font-semibold text-rose-400 hover:underline cursor-pointer px-1"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {ratingSystem === "stars" ? (
              <div className="space-y-3">
                <div
                  className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 sm:gap-2 pt-1"
                  onMouseLeave={() => setHoverRating(0)}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => {
                    const isSelected = (hoverRating || starRating) >= star;
                    const isExact = (hoverRating || starRating) === star;
                    return (
                      <button
                        key={star}
                        type="button"
                        onMouseEnter={() => setHoverRating(star)}
                        onClick={() => {
                          setStarRating(star);
                          setScoreRating(star * 10);
                        }}
                        className={`py-2 rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer active:scale-95 ${
                          isSelected
                            ? "bg-amber-400/15 border-amber-400/40"
                            : "bg-[var(--theme-surface)]/50 border-[var(--theme-border)]/60 hover:border-amber-400/30"
                        }`}
                        title={`Rate ${star} out of 10`}
                      >
                        <Star
                          size={20}
                          fill={isSelected ? "currentColor" : "none"}
                          className={isSelected ? "text-amber-400" : "text-[var(--theme-muted)]/50"}
                        />
                        <span
                          className={`text-[11px] font-bold ${
                            isExact ? "text-amber-300" : "text-[var(--theme-muted)]"
                          }`}
                        >
                          {star}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="px-3.5 py-2.5 rounded-2xl bg-[var(--theme-surface)]/60 border border-[var(--theme-border)]/70 text-xs flex items-center justify-between">
                  {activeDescriptor ? (
                    <div className="flex items-center gap-2">
                      <span className="font-black text-amber-300 text-sm">
                        {hoverRating || starRating}/10
                      </span>
                      <span className="font-bold text-[var(--theme-fg)]">
                        {activeDescriptor.label}
                      </span>
                      <span className="text-[var(--theme-muted)]">· {activeDescriptor.mood}</span>
                    </div>
                  ) : (
                    <span className="text-[var(--theme-muted)]">
                      Tap a star to score from 1 to 10.
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--theme-muted)] font-medium">
                    Score (0–100)
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-amber-300">{scoreRating}</span>
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
                    setStarRating(val > 0 ? Math.max(1, Math.round(val / 10)) : 0);
                  }}
                  className="w-full h-2 rounded-lg bg-[var(--theme-surface)] appearance-none cursor-pointer accent-amber-400"
                />
                <div className="flex justify-between text-[10px] text-[var(--theme-muted)]">
                  <span>0</span>
                  <span>50 (Average)</span>
                  <span>75 (Solid)</span>
                  <span>100 (Masterpiece)</span>
                </div>
              </div>
            )}
          </div>

          {/* 3. REVIEW / THOUGHTS (Large Text Area) */}
          <div className="rounded-3xl bg-[var(--theme-card)]/70 border border-[var(--theme-border)] p-5 sm:p-6 space-y-3">
            <div className="space-y-0.5">
              <label
                htmlFor="review-thoughts"
                className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--theme-fg)]"
              >
                <BookOpen size={14} className="text-[var(--theme-accent)]" />
                <span>3. Review &amp; Thoughts</span>
              </label>
              <p className="text-xs text-[var(--theme-muted)]">
                {isPublic
                  ? "This will appear as your public review on the entity page and your profile."
                  : "Saved privately to your personal music journal."}
              </p>
            </div>
            <textarea
              id="review-thoughts"
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              rows={7}
              placeholder="Write freely about how this sounded, standout tracks, instrumentation, memories, or production details..."
              className="w-full rounded-2xl bg-[var(--theme-surface)]/80 border border-[var(--theme-border)] p-4 text-sm sm:text-base leading-relaxed text-[var(--theme-fg)] placeholder:text-[var(--theme-muted)]/50 focus:outline-none focus:border-[var(--theme-accent)] transition resize-y min-h-[160px]"
            />
          </div>

          {/* 4. MOOD / CONTEXT (Optional Free Text + Light Suggestions Only) */}
          <div className="rounded-3xl bg-[var(--theme-card)]/70 border border-[var(--theme-border)] p-5 sm:p-6 space-y-3">
            <div className="space-y-0.5">
              <label
                htmlFor="mood-context"
                className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[var(--theme-fg)]"
              >
                <span>4. Mood / Context</span>
                <span className="text-[10px] text-[var(--theme-muted)] font-medium normal-case">
                  Optional · Free text
                </span>
              </label>
              <p className="text-xs text-[var(--theme-muted)]">
                Capture the setting or feeling in your own words — type anything you want.
              </p>
            </div>

            <input
              id="mood-context"
              type="text"
              value={moodContext}
              onChange={(e) => setMoodContext(e.target.value)}
              placeholder="e.g. Late night headphones, rainy Sunday spin, nostalgic..."
              maxLength={80}
              className="w-full rounded-2xl bg-[var(--theme-surface)]/80 border border-[var(--theme-border)] px-4 py-3 text-sm text-[var(--theme-fg)] placeholder:text-[var(--theme-muted)]/50 focus:outline-none focus:border-[var(--theme-accent)] transition"
            />

            <div className="flex flex-wrap gap-1.5 pt-1">
              {LIGHT_CONTEXT_SUGGESTIONS.map((suggestion) => {
                const isSelected = moodContext.trim().toLowerCase() === suggestion.toLowerCase();
                return (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => setMoodContext(isSelected ? "" : suggestion)}
                    className={`px-3 py-1 rounded-full text-[11px] font-medium transition cursor-pointer ${
                      isSelected
                        ? "bg-amber-400/20 border border-amber-400/40 text-amber-300 font-semibold"
                        : "bg-[var(--theme-surface)]/60 border border-[var(--theme-border)]/70 text-[var(--theme-muted)] hover:text-[var(--theme-fg)]"
                    }`}
                  >
                    {suggestion}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. VISIBILITY TOGGLE (Public / Private) */}
          <div className="rounded-3xl bg-[var(--theme-card)]/70 border border-[var(--theme-border)] p-5 sm:p-6 space-y-3">
            <div className="space-y-0.5">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--theme-fg)] block">
                5. Entry Visibility
              </span>
              <p className="text-xs text-[var(--theme-muted)]">
                Control whether your journal entry and review text are public.{" "}
                <strong className="text-[var(--theme-fg)]">
                  Your star rating always remains public.
                </strong>
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => setIsPublic(true)}
                className={`p-4 rounded-2xl border text-left transition cursor-pointer flex items-start gap-3 ${
                  isPublic
                    ? "bg-emerald-500/10 border-emerald-500/40 text-[var(--theme-fg)]"
                    : "bg-[var(--theme-surface)]/60 border-[var(--theme-border)] text-[var(--theme-muted)] hover:text-[var(--theme-fg)]"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    isPublic ? "bg-emerald-500/20 text-emerald-400" : "bg-white/5 text-[var(--theme-muted)]"
                  }`}
                >
                  <Globe size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold">Public Review</span>
                    {isPublic && <Check size={15} className="text-emerald-400" />}
                  </div>
                  <p className="text-xs text-[var(--theme-muted)] mt-0.5">
                    Visible on your public profile and the entity page.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setIsPublic(false)}
                className={`p-4 rounded-2xl border text-left transition cursor-pointer flex items-start gap-3 ${
                  !isPublic
                    ? "bg-amber-400/10 border-amber-400/40 text-[var(--theme-fg)]"
                    : "bg-[var(--theme-surface)]/60 border-[var(--theme-border)] text-[var(--theme-muted)] hover:text-[var(--theme-fg)]"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    !isPublic ? "bg-amber-400/20 text-amber-300" : "bg-white/5 text-[var(--theme-muted)]"
                  }`}
                >
                  <Lock size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold">Private Log</span>
                    {!isPublic && <Check size={15} className="text-amber-300" />}
                  </div>
                  <p className="text-xs text-[var(--theme-muted)] mt-0.5">
                    Only you see your notes. Rating still stays public.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* FORM FOOTER ACTIONS */}
          <div className="flex items-center justify-between gap-3 pt-2 flex-wrap">
            <div>
              {existingJournalId && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isSaving}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-bold text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition cursor-pointer"
                >
                  <Trash2 size={14} />
                  <span>Delete Entry</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-3 ml-auto">
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSaving}
                className="px-5 py-2.5 rounded-full border border-[var(--theme-border)] bg-[var(--theme-surface)] hover:bg-[var(--theme-card)] text-xs sm:text-sm font-bold text-[var(--theme-muted)] hover:text-[var(--theme-fg)] transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving || !selectedEntity?.mbid}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 text-zinc-950 font-black text-xs sm:text-sm hover:opacity-95 active:scale-95 transition shadow-lg shadow-amber-400/20 cursor-pointer disabled:opacity-50"
              >
                <Sparkles size={15} fill="currentColor" />
                <span>{isSaving ? "Saving..." : existingJournalId ? "Update Entry" : "Save Listen"}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
