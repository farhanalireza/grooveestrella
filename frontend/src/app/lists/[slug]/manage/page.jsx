// src/app/lists/[slug]/manage/page.jsx
"use client";

import React, { useState, useEffect, useRef, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Award,
  Search,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Save,
  ExternalLink,
  Disc,
  Music,
  User,
  Lock,
  Check,
} from "lucide-react";
import { toast } from "@/lib/toast";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";

const LIST_CATEGORIES = [
  "All Time",
  "Genre",
  "Underrated",
  "Listening Order",
  "Fan Favorites",
  "Curated",
];

const FALLBACK_COVER_SVG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%2317020B'/%3E%3Ccircle cx='50' cy='50' r='35' fill='%23300818' stroke='%23E8A87C' stroke-width='2'/%3E%3C/svg%3E";

export default function ManageOfficialListPage({ params }) {
  const { slug } = use(params);
  const router = useRouter();
  const { user, profile, loading: authLoading } = useSupabaseAuth();

  const [loadingList, setLoadingList] = useState(true);
  const [list, setList] = useState(null);
  const [items, setItems] = useState([]);

  // Metadata edit state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [listType, setListType] = useState("ranked");
  const [category, setCategory] = useState("Curated");
  const [badgeLabel, setBadgeLabel] = useState("");
  const [savingMeta, setSavingMeta] = useState(false);

  // Add item MusicBrainz search state
  const [searchType, setSearchType] = useState("album");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [pendingNote, setPendingNote] = useState("");
  const [addingMbid, setAddingMbid] = useState(null);
  const abortRef = useRef(null);

  // Inline item note editing
  const [editingNotes, setEditingNotes] = useState({});
  const [savingOrder, setSavingOrder] = useState(false);

  const applyListData = (data) => {
    setList(data.list);
    setItems(data.items || []);
    setTitle(data.list.title || "");
    setDescription(data.list.description || "");
    setCoverImageUrl(data.list.cover_image_url || "");
    setListType(data.list.list_type === "unranked" ? "unranked" : "ranked");
    setCategory(data.list.category || "Curated");
    setBadgeLabel(data.list.badge_label || "");

    const notesMap = {};
    for (const it of data.items || []) {
      notesMap[it.id] = it.note || "";
    }
    setEditingNotes(notesMap);
  };

  const loadList = async () => {
    try {
      const res = await fetch(`/api/lists/${encodeURIComponent(slug)}`, { cache: "no-store" });
      if (!res.ok) {
        setList(null);
        return;
      }
      const data = await res.json();
      applyListData(data);
    } catch (_) {
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    if (!slug) return;
    let active = true;
    fetch(`/api/lists/${encodeURIComponent(slug)}`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active) return;
        if (!data) {
          setList(null);
          return;
        }
        applyListData(data);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoadingList(false);
      });
    return () => {
      active = false;
    };
  }, [slug]);

  // Debounced MusicBrainz search
  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      return;
    }

    const timer = setTimeout(async () => {
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setSearching(true);
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(q)}&type=${encodeURIComponent(searchType)}&limit=8`,
          { signal: controller.signal }
        );
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.results || []);
        }
      } catch (err) {
        if (err?.name !== "AbortError") setSearchResults([]);
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [searchQuery, searchType]);

  if (authLoading || loadingList) {
    return (
      <div className="min-h-screen bg-[var(--theme-bg)] flex items-center justify-center text-sm text-[var(--theme-muted)]">
        Loading curator studio...
      </div>
    );
  }

  if (!user || !profile?.is_admin) {
    return (
      <div className="min-h-[75vh] bg-[var(--theme-bg)] text-[var(--theme-fg)] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-300">
          <Lock size={28} />
        </div>
        <h1 className="text-2xl font-black font-display">Admin Access Required</h1>
        <p className="text-sm text-[var(--theme-muted)] max-w-md">
          Only GrooveEstrella admins can edit official curated lists.
        </p>
        <Link
          href={`/lists/${slug}`}
          className="px-6 py-2.5 rounded-full bg-[var(--theme-accent)] text-[var(--theme-accent-fg)] font-black text-xs sm:text-sm"
        >
          View Public List
        </Link>
      </div>
    );
  }

  if (!list) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <h1 className="text-2xl font-black font-display">List Not Found</h1>
        <Link href="/lists" className="px-6 py-2.5 rounded-full bg-amber-400 text-zinc-950 font-black text-xs">
          Back to Official Lists
        </Link>
      </div>
    );
  }

  const handleSaveMetadata = async (e) => {
    e.preventDefault();
    setSavingMeta(true);
    try {
      const res = await fetch(`/api/lists/${encodeURIComponent(list.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          cover_image_url: coverImageUrl || null,
          list_type: listType,
          category,
          badge_label: badgeLabel || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to update list");
      setList((prev) => ({ ...prev, ...data.list }));
      toast.success("List details updated!");
    } catch (err) {
      toast.error(err?.message || "Failed to update list.");
    } finally {
      setSavingMeta(false);
    }
  };

  const handleDeleteList = async () => {
    if (!confirm(`Delete "${list.title}" permanently? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/lists/${encodeURIComponent(list.id)}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete list");
      toast.info("Official list deleted.");
      router.push("/lists");
      router.refresh();
    } catch (err) {
      toast.error(err?.message || "Could not delete list.");
    }
  };

  const handleAddItem = async (result) => {
    const mbid = result.mbid || result.id;
    if (!mbid) return;
    setAddingMbid(mbid);

    const artistStr = Array.isArray(result.artists)
      ? result.artists.map((a) => a.name).join(", ")
      : Array.isArray(result.artist)
      ? result.artist.map((a) => (typeof a === "object" ? a.name : a)).join(", ")
      : result.artist || "";

    try {
      const res = await fetch(`/api/lists/${encodeURIComponent(list.id)}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mbid,
          type: searchType,
          title: result.title || result.name || "Untitled",
          artist: artistStr,
          year: result.releaseYear || null,
          cover_art_url: result.coverArt || result.url || result.image || null,
          note: pendingNote.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to add item");

      setItems((prev) => [...prev, data.item]);
      setEditingNotes((prev) => ({ ...prev, [data.item.id]: data.item.note || "" }));
      setPendingNote("");
      toast.success(`Added "${result.title || result.name}"!`);
    } catch (err) {
      toast.error(err?.message || "Could not add item.");
    } finally {
      setAddingMbid(null);
    }
  };

  const handleMoveItem = async (index, direction) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= items.length) return;

    const reordered = [...items];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIdx, 0, moved);
    const updatedWithPos = reordered.map((it, i) => ({ ...it, position: i + 1 }));
    setItems(updatedWithPos);

    setSavingOrder(true);
    try {
      const res = await fetch(`/api/lists/${encodeURIComponent(list.id)}/items`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedItemIds: updatedWithPos.map((i) => i.id) }),
      });
      if (!res.ok) throw new Error("Failed to persist order");
    } catch (_) {
      toast.error("Could not save new order.");
    } finally {
      setSavingOrder(false);
    }
  };

  const handleSaveItemNote = async (itemId) => {
    try {
      const res = await fetch(`/api/lists/${encodeURIComponent(list.id)}/items`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, note: editingNotes[itemId] || "" }),
      });
      if (!res.ok) throw new Error("Failed to save note");
      setItems((prev) =>
        prev.map((it) => (it.id === itemId ? { ...it, note: editingNotes[itemId] || "" } : it))
      );
      toast.success("Item note saved!");
    } catch (_) {
      toast.error("Failed to update note.");
    }
  };

  const handleRemoveItem = async (itemId) => {
    try {
      const res = await fetch(
        `/api/lists/${encodeURIComponent(list.id)}/items?itemId=${encodeURIComponent(itemId)}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Failed to remove item");
      setItems((prev) =>
        prev
          .filter((it) => it.id !== itemId)
          .map((it, idx) => ({ ...it, position: idx + 1 }))
      );
      toast.info("Item removed from list.");
    } catch (_) {
      toast.error("Could not remove item.");
    }
  };

  return (
    <div className="min-h-screen bg-[var(--theme-bg)] text-[var(--theme-fg)] py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-10 pb-32">
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Link
          href={`/lists/${list.slug}`}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-[var(--theme-muted)] hover:text-[var(--theme-fg)] transition"
        >
          <ArrowLeft size={16} />
          <span>Back to Public List</span>
        </Link>

        <div className="flex items-center gap-2.5">
          <Link
            href={`/lists/${list.slug}`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[var(--theme-surface)] border border-[var(--theme-border)] text-xs font-bold text-[var(--theme-fg)] hover:border-[var(--theme-accent)] transition"
          >
            <ExternalLink size={13} />
            <span>View Public Page</span>
          </Link>
          <button
            type="button"
            onClick={handleDeleteList}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-rose-500/10 border border-rose-500/25 text-rose-400 hover:bg-rose-500/20 text-xs font-bold transition cursor-pointer"
          >
            <Trash2 size={13} />
            <span>Delete List</span>
          </button>
        </div>
      </div>

      {/* Section 1: List Metadata Form */}
      <section className="rounded-3xl bg-[var(--theme-card)]/80 border border-[var(--theme-border)] p-6 sm:p-7 space-y-5 shadow-xl">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-300">
          <Award size={14} />
          <span>List Settings</span>
        </div>

        <form onSubmit={handleSaveMetadata} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--theme-muted)] uppercase tracking-wider">
                Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-2xl bg-[var(--theme-surface)] border border-[var(--theme-border)] px-4 py-2.5 text-sm font-bold text-[var(--theme-fg)] focus:outline-none focus:border-[var(--theme-accent)]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--theme-muted)] uppercase tracking-wider">
                Type
              </label>
              <select
                value={listType}
                onChange={(e) => setListType(e.target.value)}
                className="w-full rounded-2xl bg-[var(--theme-surface)] border border-[var(--theme-border)] px-4 py-2.5 text-sm font-semibold text-[var(--theme-fg)] focus:outline-none focus:border-[var(--theme-accent)]"
              >
                <option value="ranked">Ranked (#1, #2, #3...)</option>
                <option value="unranked">Unranked Collection</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[var(--theme-muted)] uppercase tracking-wider">
              Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-2xl bg-[var(--theme-surface)] border border-[var(--theme-border)] p-3.5 text-sm text-[var(--theme-fg)] focus:outline-none focus:border-[var(--theme-accent)] resize-y"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--theme-muted)] uppercase tracking-wider">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-2xl bg-[var(--theme-surface)] border border-[var(--theme-border)] px-4 py-2.5 text-sm font-semibold text-[var(--theme-fg)] focus:outline-none focus:border-[var(--theme-accent)]"
              >
                {LIST_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--theme-muted)] uppercase tracking-wider">
                Cover URL (Optional)
              </label>
              <input
                type="url"
                value={coverImageUrl}
                onChange={(e) => setCoverImageUrl(e.target.value)}
                placeholder="https://..."
                className="w-full rounded-2xl bg-[var(--theme-surface)] border border-[var(--theme-border)] px-4 py-2.5 text-sm text-[var(--theme-fg)] focus:outline-none focus:border-[var(--theme-accent)]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--theme-muted)] uppercase tracking-wider">
                Future Badge Label
              </label>
              <input
                type="text"
                value={badgeLabel}
                onChange={(e) => setBadgeLabel(e.target.value)}
                placeholder="e.g. GOAT"
                className="w-full rounded-2xl bg-[var(--theme-surface)] border border-[var(--theme-border)] px-4 py-2.5 text-sm text-[var(--theme-fg)] focus:outline-none focus:border-[var(--theme-accent)]"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={savingMeta}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-amber-400 text-zinc-950 font-black text-xs sm:text-sm hover:opacity-95 transition cursor-pointer disabled:opacity-50"
            >
              <Save size={14} />
              <span>{savingMeta ? "Saving..." : "Save Details"}</span>
            </button>
          </div>
        </form>
      </section>

      {/* Section 2: Search & Add Music Entities (MBID Linked) */}
      <section className="rounded-3xl bg-[var(--theme-card)]/80 border border-[var(--theme-border)] p-6 sm:p-7 space-y-4 shadow-xl">
        <div>
          <h2 className="text-xl font-black font-display">Add Music to List</h2>
          <p className="text-xs text-[var(--theme-muted)]">
            Search MusicBrainz for albums, tracks, or artists to add directly via MBID.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {[
            { id: "album", label: "Albums", icon: Disc },
            { id: "track", label: "Tracks", icon: Music },
            { id: "artist", label: "Artists", icon: User },
          ].map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setSearchType(t.id);
                  setSearchResults([]);
                }}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                  searchType === t.id
                    ? "bg-[var(--theme-accent)] text-[var(--theme-accent-fg)]"
                    : "bg-[var(--theme-surface)] text-[var(--theme-muted)] border border-[var(--theme-border)]"
                }`}
              >
                <Icon size={13} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--theme-muted)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                const next = e.target.value;
                setSearchQuery(next);
                if (next.trim().length < 2) {
                  setSearchResults([]);
                  setSearching(false);
                }
              }}
              placeholder={`Search ${searchType} title or artist...`}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[var(--theme-surface)] border border-[var(--theme-border)] text-sm text-[var(--theme-fg)] focus:outline-none focus:border-[var(--theme-accent)]"
            />
          </div>

          <input
            type="text"
            value={pendingNote}
            onChange={(e) => setPendingNote(e.target.value)}
            placeholder="Optional curator note for next added item..."
            className="w-full px-4 py-2.5 rounded-2xl bg-[var(--theme-surface)] border border-[var(--theme-border)] text-sm text-[var(--theme-fg)] focus:outline-none focus:border-[var(--theme-accent)]"
          />
        </div>

        {searching ? (
          <p className="text-xs text-[var(--theme-muted)] py-2 animate-pulse">Searching MusicBrainz...</p>
        ) : searchResults.length > 0 ? (
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {searchResults.map((res) => {
              const mbid = res.mbid || res.id;
              const alreadyAdded = items.some((it) => it.entity?.mbid === mbid);
              const artistStr = Array.isArray(res.artists)
                ? res.artists.map((a) => a.name).join(", ")
                : Array.isArray(res.artist)
                ? res.artist.map((a) => (typeof a === "object" ? a.name : a)).join(", ")
                : res.artist || "";
              const imgUrl = res.coverArt || res.url || res.image || FALLBACK_COVER_SVG;

              return (
                <div
                  key={mbid}
                  className="flex items-center justify-between gap-3 p-2.5 rounded-2xl bg-[var(--theme-surface)]/70 border border-[var(--theme-border)]/70"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <img
                      src={imgUrl}
                      alt={res.title || res.name}
                      className={`w-11 h-11 object-cover shrink-0 ${
                        searchType === "artist" ? "rounded-full" : "rounded-xl"
                      }`}
                    />
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-[var(--theme-fg)] truncate">
                        {res.title || res.name}
                      </div>
                      <div className="text-xs text-[var(--theme-muted)] truncate">
                        {artistStr}
                        {res.releaseYear ? ` · ${res.releaseYear}` : ""}
                      </div>
                    </div>
                  </div>

                  {alreadyAdded ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-bold shrink-0">
                      <Check size={12} />
                      <span>Added</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={addingMbid === mbid}
                      onClick={() => handleAddItem(res)}
                      className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-amber-400 text-zinc-950 font-black text-xs hover:opacity-90 transition cursor-pointer shrink-0 disabled:opacity-50"
                    >
                      <Plus size={13} />
                      <span>{addingMbid === mbid ? "Adding..." : "Add"}</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ) : null}
      </section>

      {/* Section 3: Reorder, Annotate, & Remove Existing Items */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black font-display">
            List Items ({items.length})
          </h2>
          {savingOrder && (
            <span className="text-xs font-semibold text-amber-300 animate-pulse">
              Saving order...
            </span>
          )}
        </div>

        {items.length === 0 ? (
          <div className="p-8 rounded-3xl bg-[var(--theme-card)]/40 border border-[var(--theme-border)] text-center text-sm text-[var(--theme-muted)]">
            Search above to add albums, tracks, or artists to this official list.
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item, idx) => {
              const ent = item.entity;
              return (
                <div
                  key={item.id}
                  className="p-4 rounded-3xl bg-[var(--theme-card)]/80 border border-[var(--theme-border)] flex flex-col gap-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className="w-8 text-center font-black text-amber-300 text-sm shrink-0">
                        {listType === "ranked" ? `#${idx + 1}` : "•"}
                      </span>
                      <img
                        src={ent?.cover_art_url || FALLBACK_COVER_SVG}
                        alt={ent?.title}
                        className="w-12 h-12 rounded-xl object-cover shrink-0 bg-black/40"
                      />
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-[var(--theme-fg)] truncate">
                          {ent?.title}
                        </div>
                        <div className="text-xs text-[var(--theme-muted)] truncate">
                          {ent?.artist_credit} {ent?.year ? `· ${ent.year}` : ""}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleMoveItem(idx, -1)}
                        className="p-2 rounded-xl bg-[var(--theme-surface)] border border-[var(--theme-border)] text-[var(--theme-fg)] disabled:opacity-30 cursor-pointer"
                        title="Move Up"
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button
                        type="button"
                        disabled={idx === items.length - 1}
                        onClick={() => handleMoveItem(idx, 1)}
                        className="p-2 rounded-xl bg-[var(--theme-surface)] border border-[var(--theme-border)] text-[var(--theme-fg)] disabled:opacity-30 cursor-pointer"
                        title="Move Down"
                      >
                        <ArrowDown size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 cursor-pointer"
                        title="Remove from list"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Curator note editor per item */}
                  <div className="flex items-center gap-2 pl-11">
                    <input
                      type="text"
                      value={editingNotes[item.id] ?? ""}
                      onChange={(e) =>
                        setEditingNotes((prev) => ({ ...prev, [item.id]: e.target.value }))
                      }
                      placeholder="Short curator note (optional)..."
                      className="flex-1 px-3.5 py-2 rounded-xl bg-[var(--theme-surface)] border border-[var(--theme-border)] text-xs text-[var(--theme-fg)] focus:outline-none focus:border-[var(--theme-accent)]"
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveItemNote(item.id)}
                      className="px-3.5 py-2 rounded-xl bg-[var(--theme-surface)] hover:bg-[var(--theme-card)] border border-[var(--theme-border)] hover:border-amber-400/50 text-xs font-bold text-amber-300 cursor-pointer shrink-0"
                    >
                      Save Note
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
