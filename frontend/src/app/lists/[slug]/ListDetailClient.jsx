// src/app/lists/[slug]/ListDetailClient.jsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Award,
  Share2,
  Check,
  Settings2,
  Disc,
  Music,
  User,
  ArrowRight,
  ListOrdered,
  LayoutList,
  CheckCircle2,
} from "lucide-react";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { toast } from "@/lib/toast";
import OfficialListCover from "@/Components/OfficialListCover";

const FALLBACK_COVER_SVG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%2317020B'/%3E%3Ccircle cx='50' cy='50' r='35' fill='%23300818' stroke='%23E8A87C' stroke-width='2'/%3E%3C/svg%3E";

export default function ListDetailClient({ list, items = [] }) {
  const { profile } = useSupabaseAuth();
  const isAdmin = Boolean(profile?.is_admin);
  const [copied, setCopied] = useState(false);

  if (!list) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <h1 className="text-2xl font-black font-display">List Not Found</h1>
        <p className="text-sm text-[var(--theme-muted)]">
          This official curated list does not exist or has been removed.
        </p>
        <Link
          href="/lists"
          className="px-6 py-2.5 rounded-full bg-amber-400 text-zinc-950 font-black text-xs sm:text-sm"
        >
          Browse Official Lists
        </Link>
      </div>
    );
  }

  const isRanked = list.list_type === "ranked";

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${list.title} | GrooveEstrella Official List`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("List link copied!");
    }
  };

  return (
    <div className="min-h-screen bg-[var(--theme-bg)] text-[var(--theme-fg)] py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-10 pb-32">
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Link
          href="/lists"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-[var(--theme-muted)] hover:text-[var(--theme-fg)] transition"
        >
          <ArrowLeft size={16} />
          <span>All Official Lists</span>
        </Link>

        <div className="flex items-center gap-2.5">
          {isAdmin && (
            <Link
              href={`/lists/${list.slug}/manage`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-amber-400 text-zinc-950 font-black text-xs hover:opacity-95 transition shadow-md"
            >
              <Settings2 size={14} />
              <span>Manage List</span>
            </Link>
          )}
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[var(--theme-surface)] hover:bg-[var(--theme-card)] border border-[var(--theme-border)] text-xs font-bold text-[var(--theme-fg)] transition cursor-pointer"
          >
            {copied ? <Check size={14} className="text-emerald-400" /> : <Share2 size={14} />}
            <span>Share</span>
          </button>
        </div>
      </div>

      {/* Hero Header Card */}
      <header className="rounded-3xl bg-gradient-to-br from-[var(--theme-surface-elevated)] via-[var(--theme-card)] to-[var(--theme-card)] border border-[var(--theme-border)] p-6 sm:p-9 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-[var(--theme-accent)]/40 to-transparent pointer-events-none" />
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8">
          <OfficialListCover
            coverImageUrl={list.cover_image_url}
            previewCovers={list.preview_covers}
            title={list.title}
            className="w-36 h-36 sm:w-44 sm:h-44 rounded-2xl shrink-0 shadow-2xl"
          />

          <div className="flex-1 text-center sm:text-left space-y-3 min-w-0">
            <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-400/15 border border-amber-400/35 text-amber-300 text-[10px] font-black uppercase tracking-widest">
                <CheckCircle2 size={11} />
                <span>Official Curated List</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[var(--theme-surface)] border border-[var(--theme-border)] text-[10px] font-bold text-[var(--theme-muted)] uppercase tracking-wider">
                {isRanked ? <ListOrdered size={11} /> : <LayoutList size={11} />}
                <span>{isRanked ? "Ranked" : "Unranked"}</span>
              </span>
              {list.category && (
                <span className="text-[11px] font-bold text-[var(--theme-accent)]">
                  · {list.category}
                </span>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl font-black tracking-tight font-display text-[var(--theme-fg)]">
              {list.title}
            </h1>

            {list.description && (
              <p className="text-sm sm:text-base text-[var(--theme-muted)] leading-relaxed max-w-2xl">
                {list.description}
              </p>
            )}

            <div className="pt-1 text-xs font-bold text-[var(--theme-muted)]">
              {items.length} {items.length === 1 ? "Selection" : "Selections"} · Public Official Collection
            </div>
          </div>
        </div>
      </header>

      {/* Ordered List Items */}
      <section className="space-y-4">
        {items.length === 0 ? (
          <div className="text-center py-16 rounded-3xl bg-[var(--theme-card)]/50 border border-[var(--theme-border)] space-y-3">
            <Award size={32} className="mx-auto text-amber-300/70" />
            <h2 className="text-lg font-bold text-[var(--theme-fg)]">No items in this list yet</h2>
            {isAdmin && (
              <Link
                href={`/lists/${list.slug}/manage`}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-amber-400 text-zinc-950 font-black text-xs"
              >
                <Settings2 size={14} />
                <span>Add Music Items</span>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item, idx) => {
              const ent = item.entity;
              const entType = ent?.type === "artist" ? "artist" : ent?.type === "track" ? "track" : "album";
              const href = ent?.mbid ? `/${entType}/${ent.mbid}` : "#";
              const rankNum = item.position || idx + 1;
              const isTopThree = isRanked && rankNum <= 3;
              const TypeIcon = entType === "artist" ? User : entType === "track" ? Music : Disc;

              return (
                <Link
                  key={item.id}
                  href={href}
                  className={`group flex items-start gap-4 sm:gap-5 p-4 sm:p-5 rounded-3xl border transition-all duration-200 ${
                    isTopThree
                      ? "bg-[var(--theme-card)]/90 border-amber-400/35 hover:border-amber-400/60 shadow-lg"
                      : "bg-[var(--theme-card)]/65 border-[var(--theme-border)]/80 hover:border-[var(--theme-accent)]/50 shadow-md"
                  }`}
                >
                  {/* Rank Number (for Ranked lists) */}
                  {isRanked && (
                    <div
                      className={`w-10 sm:w-12 shrink-0 text-center pt-2 font-display font-black ${
                        isTopThree
                          ? "text-2xl sm:text-3xl text-amber-300"
                          : "text-lg sm:text-xl text-[var(--theme-muted)]"
                      }`}
                    >
                      #{rankNum}
                    </div>
                  )}

                  {/* Cover Art */}
                  <div
                    className={`w-16 h-16 sm:w-20 sm:h-20 shrink-0 overflow-hidden bg-black/40 border border-white/10 shadow-md ${
                      entType === "artist" ? "rounded-full" : "rounded-2xl"
                    }`}
                  >
                    {ent?.cover_art_url ? (
                      <img
                        src={ent.cover_art_url}
                        alt={ent.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.currentTarget.src = FALLBACK_COVER_SVG;
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[var(--theme-muted)]">
                        <TypeIcon size={24} />
                      </div>
                    )}
                  </div>

                  {/* Entity Details + Curator Note */}
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[var(--theme-accent)]">
                      <span>{entType}</span>
                      {ent?.year && <span>· {ent.year}</span>}
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <h2 className="text-base sm:text-lg font-black text-[var(--theme-fg)] group-hover:text-amber-300 transition-colors font-display truncate">
                        {ent?.title}
                      </h2>
                      <ArrowRight
                        size={15}
                        className="text-[var(--theme-muted)] group-hover:text-amber-300 group-hover:translate-x-0.5 transition-all shrink-0"
                      />
                    </div>

                    {ent?.artist_credit && (
                      <p className="text-xs sm:text-sm font-semibold text-[var(--theme-muted)] truncate">
                        {ent.artist_credit}
                      </p>
                    )}

                    {item.note && (
                      <p className="text-xs sm:text-sm text-[var(--theme-fg)]/85 leading-relaxed pt-1.5 border-t border-[var(--theme-border)]/40 mt-2">
                        {item.note}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
