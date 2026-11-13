// src/app/lists/ListsClient.jsx
"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  ListOrdered,
  Plus,
  Award,
  Sparkles,
  ArrowRight,
  Layers,
  CheckCircle2,
} from "lucide-react";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import OfficialListCover from "@/Components/OfficialListCover";

export default function ListsClient({ initialLists = [] }) {
  const { profile } = useSupabaseAuth();
  const isAdmin = Boolean(profile?.is_admin);
  const [selectedCategory, setSelectedCategory] = useState("All");

  const categories = useMemo(() => {
    const set = new Set(["All"]);
    for (const list of initialLists) {
      if (list.category) set.add(list.category);
    }
    return Array.from(set);
  }, [initialLists]);

  const filteredLists = useMemo(() => {
    if (selectedCategory === "All") return initialLists;
    return initialLists.filter((l) => (l.category || "Curated") === selectedCategory);
  }, [initialLists, selectedCategory]);

  return (
    <div className="min-h-screen bg-[var(--theme-bg)] text-[var(--theme-fg)] py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-10 pb-32">
      {/* Header Banner */}
      <header className="rounded-3xl bg-gradient-to-br from-[var(--theme-surface-elevated)] via-[var(--theme-card)] to-[var(--theme-card)] border border-[var(--theme-border)] p-7 sm:p-10 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-[var(--theme-accent)]/40 to-transparent pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/25 text-amber-300 text-[11px] font-bold uppercase tracking-widest">
              <Award size={12} />
              <span>GrooveEstrella Editorial</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight font-display text-[var(--theme-fg)]">
              Official Curated Lists
            </h1>
            <p className="text-sm sm:text-base text-[var(--theme-muted)] leading-relaxed">
              Researched rankings, genre essentials, underrated gems, and guided artist listening orders curated by GrooveEstrella.
            </p>
          </div>

          {isAdmin && (
            <Link
              href="/lists/new"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 text-zinc-950 font-black text-xs sm:text-sm hover:scale-105 active:scale-95 transition shadow-lg shrink-0"
            >
              <Plus size={16} />
              <span>Create Official List</span>
            </Link>
          )}
        </div>
      </header>

      {/* Category Filter Pills */}
      {categories.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap shrink-0 transition cursor-pointer ${
                selectedCategory === cat
                  ? "bg-[var(--theme-accent)] text-[var(--theme-accent-fg)] shadow-md"
                  : "bg-[var(--theme-surface)] text-[var(--theme-muted)] hover:text-[var(--theme-fg)] border border-[var(--theme-border)]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Lists Grid */}
      {filteredLists.length === 0 ? (
        <div className="text-center py-20 px-6 rounded-3xl bg-[var(--theme-card)]/60 border border-[var(--theme-border)] max-w-lg mx-auto space-y-4 shadow-xl">
          <div className="w-16 h-16 rounded-full bg-amber-400/10 border border-amber-400/25 flex items-center justify-center text-amber-300 mx-auto">
            <ListOrdered size={28} />
          </div>
          <h2 className="text-xl font-black text-[var(--theme-fg)]">
            No Official Lists Published Yet
          </h2>
          <p className="text-sm text-[var(--theme-muted)] leading-relaxed">
            {isAdmin
              ? "Start curating your first official ranking, listening order, or genre guide."
              : "Official GrooveEstrella curated lists will appear here soon."}
          </p>
          {isAdmin && (
            <Link
              href="/lists/new"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-amber-400 text-zinc-950 font-black text-sm hover:scale-105 transition shadow-md"
            >
              <Sparkles size={15} />
              <span>Create First Official List</span>
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
            {filteredLists.map((list) => (
              <Link
                key={list.id}
                href={`/lists/${list.slug}`}
                className="group relative flex flex-col sm:flex-row gap-6 items-start pb-8 border-b border-[var(--theme-border)]/40 hover:border-amber-400/50 transition-all duration-300"
              >
                <OfficialListCover
                  coverImageUrl={list.cover_image_url}
                  previewCovers={list.preview_covers}
                  title={list.title}
                  className="w-32 h-32 sm:w-36 sm:h-36 rounded-3xl shrink-0 shadow-[0_15px_35px_-10px_rgba(0,0,0,0.7)] group-hover:shadow-[0_20px_45px_-10px_rgba(245,158,11,0.25)] group-hover:scale-[1.02] transition-all duration-300 border border-white/10"
                />

                <div className="min-w-0 flex-1 space-y-2.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-[10px] font-black uppercase tracking-wider">
                      <CheckCircle2 size={10} />
                      <span>Editorial</span>
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--theme-muted)]">
                      {list.list_type === "ranked" ? "Ranked Countdown" : "Curated Guide"}
                    </span>
                    {list.category && (
                      <>
                        <span className="text-[var(--theme-muted)]/40 text-[10px]">·</span>
                        <span className="text-[10px] font-bold text-[var(--theme-accent)] uppercase tracking-wider">
                          {list.category}
                        </span>
                      </>
                    )}
                  </div>

                  <h2 className="text-xl sm:text-2xl font-black text-[var(--theme-fg)] group-hover:text-amber-300 transition-colors font-display leading-snug">
                    {list.title}
                  </h2>

                  {list.description && (
                    <p className="text-xs sm:text-sm text-[var(--theme-muted)] line-clamp-2 leading-relaxed font-body">
                      {list.description}
                    </p>
                  )}

                  <div className="pt-1 flex items-center justify-between text-xs font-bold text-[var(--theme-muted)]">
                    <span className="inline-flex items-center gap-1.5">
                      <Layers size={13} className="text-[var(--theme-accent)]" />
                      <span>
                        {list.item_count} {list.item_count === 1 ? "entry" : "entries"}
                      </span>
                    </span>

                    <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-amber-300 group-hover:translate-x-1 transition-transform">
                      <span>Read Editorial</span>
                      <ArrowRight size={14} />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
