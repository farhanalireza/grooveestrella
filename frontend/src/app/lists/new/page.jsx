// src/app/lists/new/page.jsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Award,
  Sparkles,
  ListOrdered,
  LayoutList,
  Lock,
  Image as ImageIcon,
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

export default function NewOfficialListPage() {
  const router = useRouter();
  const { user, profile, loading } = useSupabaseAuth();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [listType, setListType] = useState("ranked");
  const [category, setCategory] = useState("All Time");
  const [badgeLabel, setBadgeLabel] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--theme-bg)] flex items-center justify-center text-sm text-[var(--theme-muted)]">
        Verifying permissions...
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
          Official Curated Lists are created and managed exclusively by GrooveEstrella curators.
        </p>
        <Link
          href="/lists"
          className="px-6 py-2.5 rounded-full bg-[var(--theme-accent)] text-[var(--theme-accent-fg)] font-black text-xs sm:text-sm"
        >
          Browse Official Lists
        </Link>
      </div>
    );
  }

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.warning("Please enter a list title.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          cover_image_url: coverImageUrl.trim() || null,
          list_type: listType,
          category,
          badge_label: badgeLabel.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to create list");
      }

      toast.success("Official list created! Now add music items.");
      router.push(`/lists/${data.list.slug}/manage`);
      router.refresh();
    } catch (err) {
      toast.error(err?.message || "Could not create official list.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--theme-bg)] text-[var(--theme-fg)] py-10 px-4 sm:px-6 pb-32">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/lists"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-[var(--theme-muted)] hover:text-[var(--theme-fg)] transition"
          >
            <ArrowLeft size={16} />
            <span>Back to Official Lists</span>
          </Link>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/25 text-amber-300 text-[11px] font-bold uppercase tracking-widest">
            <Award size={12} />
            <span>Admin Studio</span>
          </span>
        </div>

        <div className="space-y-1">
          <h1 className="text-3xl font-black font-display tracking-tight">
            Create Official Curated List
          </h1>
          <p className="text-sm text-[var(--theme-muted)]">
            All official lists are public and can feature ranked or unranked albums, tracks, or artists.
          </p>
        </div>

        <form onSubmit={handleCreate} className="space-y-6">
          {/* Title */}
          <div className="rounded-3xl bg-[var(--theme-card)]/80 border border-[var(--theme-border)] p-5 sm:p-6 space-y-2.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--theme-fg)]">
              List Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Greatest Albums of All Time"
              className="w-full rounded-2xl bg-[var(--theme-surface)] border border-[var(--theme-border)] px-4 py-3 text-sm sm:text-base font-bold text-[var(--theme-fg)] placeholder:text-[var(--theme-muted)]/50 focus:outline-none focus:border-[var(--theme-accent)]"
            />
          </div>

          {/* Description */}
          <div className="rounded-3xl bg-[var(--theme-card)]/80 border border-[var(--theme-border)] p-5 sm:p-6 space-y-2.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--theme-fg)]">
              Editorial Description
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain the curation criteria, musical eras covered, or why these records matter..."
              className="w-full rounded-2xl bg-[var(--theme-surface)] border border-[var(--theme-border)] p-4 text-sm leading-relaxed text-[var(--theme-fg)] placeholder:text-[var(--theme-muted)]/50 focus:outline-none focus:border-[var(--theme-accent)] resize-y"
            />
          </div>

          {/* Type: Ranked vs Unranked */}
          <div className="rounded-3xl bg-[var(--theme-card)]/80 border border-[var(--theme-border)] p-5 sm:p-6 space-y-3">
            <span className="block text-xs font-bold uppercase tracking-wider text-[var(--theme-fg)]">
              List Type
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setListType("ranked")}
                className={`p-4 rounded-2xl border text-left transition cursor-pointer flex items-start gap-3 ${
                  listType === "ranked"
                    ? "bg-amber-400/15 border-amber-400/50 text-[var(--theme-fg)]"
                    : "bg-[var(--theme-surface)]/60 border-[var(--theme-border)] text-[var(--theme-muted)]"
                }`}
              >
                <ListOrdered size={18} className="text-amber-300 shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-bold">Ranked</div>
                  <p className="text-xs text-[var(--theme-muted)] mt-0.5">
                    Numbered order (#1, #2, #3...)
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setListType("unranked")}
                className={`p-4 rounded-2xl border text-left transition cursor-pointer flex items-start gap-3 ${
                  listType === "unranked"
                    ? "bg-amber-400/15 border-amber-400/50 text-[var(--theme-fg)]"
                    : "bg-[var(--theme-surface)]/60 border-[var(--theme-border)] text-[var(--theme-muted)]"
                }`}
              >
                <LayoutList size={18} className="text-amber-300 shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-bold">Unranked</div>
                  <p className="text-xs text-[var(--theme-muted)] mt-0.5">
                    Editorial collection without numerical rank
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Category + Future Badge Label + Cover Image */}
          <div className="rounded-3xl bg-[var(--theme-card)]/80 border border-[var(--theme-border)] p-5 sm:p-6 space-y-5">
            <div className="space-y-2">
              <span className="block text-xs font-bold uppercase tracking-wider text-[var(--theme-fg)]">
                Category
              </span>
              <div className="flex flex-wrap gap-2">
                {LIST_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                      category === cat
                        ? "bg-[var(--theme-accent)] text-[var(--theme-accent-fg)]"
                        : "bg-[var(--theme-surface)] text-[var(--theme-muted)] border border-[var(--theme-border)] hover:text-[var(--theme-fg)]"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--theme-fg)]">
                <ImageIcon size={13} className="text-[var(--theme-accent)]" />
                <span>Cover Image URL (Optional)</span>
              </label>
              <input
                type="url"
                value={coverImageUrl}
                onChange={(e) => setCoverImageUrl(e.target.value)}
                placeholder="https://... (leave blank to auto-generate mosaic from list items)"
                className="w-full rounded-2xl bg-[var(--theme-surface)] border border-[var(--theme-border)] px-4 py-2.5 text-sm text-[var(--theme-fg)] placeholder:text-[var(--theme-muted)]/50 focus:outline-none focus:border-[var(--theme-accent)]"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--theme-fg)]">
                Future Entity Badge Label (Optional)
              </label>
              <input
                type="text"
                value={badgeLabel}
                onChange={(e) => setBadgeLabel(e.target.value)}
                placeholder="e.g. GOAT, Essential Listening, Hidden Gem"
                className="w-full rounded-2xl bg-[var(--theme-surface)] border border-[var(--theme-border)] px-4 py-2.5 text-sm text-[var(--theme-fg)] placeholder:text-[var(--theme-muted)]/50 focus:outline-none focus:border-[var(--theme-accent)]"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Link
              href="/lists"
              className="px-5 py-2.5 rounded-full border border-[var(--theme-border)] text-xs sm:text-sm font-bold text-[var(--theme-muted)] hover:text-[var(--theme-fg)]"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 text-zinc-950 font-black text-xs sm:text-sm hover:opacity-95 transition shadow-lg cursor-pointer disabled:opacity-50"
            >
              <Sparkles size={15} fill="currentColor" />
              <span>{submitting ? "Creating..." : "Create & Add Items"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
