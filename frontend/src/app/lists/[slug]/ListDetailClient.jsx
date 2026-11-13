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
  Sparkles,
  Quote,
} from "lucide-react";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { toast } from "@/lib/toast";
import OfficialListCover from "@/Components/OfficialListCover";
import { NOISE_GRAIN_BG } from "@/Components/UserProfileBadge";

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
        title: `${list.title} | GrooveEstrella Editorial`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Editorial list link copied!");
    }
  };

  return (
    <div className="min-h-screen bg-[var(--theme-bg)] text-[var(--theme-fg)] py-8 sm:py-14 px-4 sm:px-8 lg:px-12 max-w-6xl mx-auto space-y-16 sm:space-y-24 pb-40">
      {/* Editorial Navigation Top Bar */}
      <div className="flex items-center justify-between gap-4 border-b border-[var(--theme-border)]/30 pb-5">
        <Link
          href="/lists"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-[var(--theme-muted)] hover:text-amber-300 transition"
        >
          <ArrowLeft size={16} />
          <span>All Editorial Curations</span>
        </Link>

        <div className="flex items-center gap-3">
          {isAdmin && (
            <Link
              href={`/lists/${list.slug}/manage`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-amber-400 text-zinc-950 font-black text-xs hover:opacity-90 transition shadow-md"
            >
              <Settings2 size={14} />
              <span>Manage List</span>
            </Link>
          )}
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[var(--theme-surface)] hover:bg-[var(--theme-card)] border border-[var(--theme-border)] text-xs font-bold text-[var(--theme-fg)] hover:text-amber-300 transition cursor-pointer shadow-sm"
          >
            {copied ? <Check size={14} className="text-emerald-400" /> : <Share2 size={14} />}
            <span>Share Editorial</span>
          </button>
        </div>
      </div>

      {/* Editorial Header — Uses canvas background with expansive editorial typography */}
      <header className="relative pt-2 pb-6 border-b border-[var(--theme-border)]/40">
        <div className="flex flex-col lg:flex-row items-start justify-between gap-8 sm:gap-12">
          {/* Main Editorial Text (Left/Top) */}
          <div className="flex-1 space-y-4 max-w-3xl">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-[10px] font-black uppercase tracking-widest">
                <Award size={12} />
                <span>Editorial Curated List</span>
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[var(--theme-surface)] border border-[var(--theme-border)] text-[10px] font-bold text-[var(--theme-muted)] uppercase tracking-wider">
                {isRanked ? <ListOrdered size={12} /> : <LayoutList size={12} />}
                <span>{isRanked ? "Ranked Countdown" : "Curated Collection"}</span>
              </span>
              {list.category && (
                <span className="text-xs font-black text-[var(--theme-accent)] uppercase tracking-wider">
                  · {list.category}
                </span>
              )}
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight font-display text-[var(--theme-fg)] leading-[1.08]">
              {list.title}
            </h1>

            {list.description && (
              <p className="text-base sm:text-lg text-[var(--theme-muted)] leading-relaxed font-body max-w-2xl pt-1">
                {list.description}
              </p>
            )}

            <div className="pt-2 flex items-center gap-4 text-xs font-bold uppercase tracking-wider text-[var(--theme-muted)]">
              <span>{items.length} {items.length === 1 ? "Essential Entry" : "Essential Entries"}</span>
              <span>·</span>
              <span>GrooveEstrella Critics Circle</span>
            </div>
          </div>

          {/* Large Editorial Cover Presentation (Right) */}
          <div className="shrink-0 self-center lg:self-start">
            <OfficialListCover
              coverImageUrl={list.cover_image_url}
              previewCovers={list.preview_covers}
              title={list.title}
              className="w-44 h-44 sm:w-56 sm:h-56 lg:w-64 lg:h-64 rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] border border-white/10"
            />
          </div>
        </div>
      </header>

      {/* Editorial Items Section — No Cards! Full Background with Generous Space */}
      <section className="space-y-0">
        {items.length === 0 ? (
          <div className="text-center py-24 space-y-4 max-w-md mx-auto">
            <Award size={40} className="mx-auto text-amber-300/60" />
            <h2 className="text-xl font-bold text-[var(--theme-fg)]">No editorial selections published yet</h2>
            <p className="text-sm text-[var(--theme-muted)]">
              This editorial collection is currently in curation by our music critics.
            </p>
            {isAdmin && (
              <Link
                href={`/lists/${list.slug}/manage`}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-amber-400 text-zinc-950 font-black text-xs hover:scale-105 transition shadow-md"
              >
                <Settings2 size={14} />
                <span>Add Selections to Editorial</span>
              </Link>
            )}
          </div>
        ) : (
          <div className="divide-y divide-[var(--theme-border)]/35">
            {items.map((item, idx) => {
              const ent = item.entity;
              const entType = ent?.type === "artist" ? "artist" : ent?.type === "track" ? "track" : "album";
              const href = ent?.mbid ? `/${entType}/${ent.mbid}` : "#";
              const rankNum = item.position || idx + 1;
              const formattedRank = rankNum < 10 ? `0${rankNum}` : String(rankNum);
              const isTopThree = isRanked && rankNum <= 3;
              const TypeIcon = entType === "artist" ? User : entType === "track" ? Music : Disc;

              return (
                <article
                  key={item.id}
                  className="py-14 sm:py-20 lg:py-24 first:pt-4 last:pb-12 group transition-colors"
                >
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-14 items-start">
                    
                    {/* LEFT COLUMN: Large Typography Rank & High-Impact Artwork */}
                    <div className="md:col-span-5 lg:col-span-5 flex flex-col items-start space-y-5">
                      {/* Monumental Editorial Rank Indicator (for Ranked Lists) */}
                      {isRanked && (
                        <div className="flex items-baseline gap-2 select-none">
                          <span
                            className={`font-display font-black text-6xl sm:text-7xl lg:text-8xl tracking-tighter leading-none ${
                              isTopThree
                                ? "text-transparent bg-clip-text bg-gradient-to-br from-amber-300 via-amber-400 to-amber-600 drop-shadow-[0_4px_12px_rgba(245,158,11,0.35)]"
                                : "text-[var(--theme-fg)]/20 group-hover:text-[var(--theme-fg)]/40 transition-colors"
                            }`}
                          >
                            {formattedRank}
                          </span>
                          {isTopThree && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-400/15 border border-amber-400/40 text-amber-300 text-[10px] font-black uppercase tracking-wider">
                              <Sparkles size={11} />
                              <span>Top Selection</span>
                            </span>
                          )}
                        </div>
                      )}

                      {/* Large Album Artwork resting directly on background */}
                      <Link
                        href={href}
                        className="relative block w-full aspect-square max-w-[340px] sm:max-w-[380px] rounded-3xl overflow-hidden shadow-[0_20px_50px_-12px_rgba(0,0,0,0.85)] group-hover:shadow-[0_25px_65px_-10px_rgba(245,158,11,0.25)] transition-all duration-500 bg-black/40 border border-white/10"
                      >
                        {ent?.cover_art_url ? (
                          <img
                            src={ent.cover_art_url}
                            alt={ent.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                            onError={(e) => {
                              e.currentTarget.src = FALLBACK_COVER_SVG;
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[var(--theme-muted)]">
                            <TypeIcon size={48} />
                          </div>
                        )}
                        {/* Vinyl sheen reflection overlay */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-black/40 via-transparent to-white/10 pointer-events-none" />
                      </Link>
                    </div>

                    {/* RIGHT COLUMN: Expansive Editorial Content & Writeup */}
                    <div className="md:col-span-7 lg:col-span-7 space-y-4 pt-1 sm:pt-4">
                      {/* Metadata Row */}
                      <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-[var(--theme-accent)] flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-full bg-[var(--theme-surface)] border border-[var(--theme-border)] text-[10px] text-[var(--theme-fg)]">
                          {entType}
                        </span>
                        {ent?.year && (
                          <>
                            <span className="text-[var(--theme-muted)]">·</span>
                            <span className="text-[var(--theme-muted)] font-semibold">{ent.year}</span>
                          </>
                        )}
                        {item.badge_text && (
                          <>
                            <span className="text-[var(--theme-muted)]">·</span>
                            <span className="px-2.5 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-[10px] font-bold">
                              {item.badge_text}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Editorial Title & Artist */}
                      <div>
                        <Link href={href} className="group/title block">
                          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black font-display tracking-tight text-[var(--theme-fg)] group-hover/title:text-amber-300 transition-colors leading-[1.12]">
                            {ent?.title}
                          </h2>
                        </Link>
                        {ent?.artist_credit && (
                          <p className="text-lg sm:text-2xl font-bold text-[var(--theme-accent)] mt-2 font-display">
                            {ent.artist_credit}
                          </p>
                        )}
                      </div>

                      {/* Critic Review / Editorial Essay Writeup */}
                      {item.note ? (
                        <div className="pt-4 space-y-2">
                          <div className="relative pl-5 sm:pl-6 border-l-2 border-amber-400/50">
                            <Quote size={16} className="text-amber-300/40 mb-1" />
                            <p className="text-base sm:text-lg text-[var(--theme-fg)]/90 leading-relaxed font-body">
                              {item.note}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm sm:text-base text-[var(--theme-muted)] leading-relaxed pt-2 font-body italic">
                          Selected and cataloged by the GrooveEstrella editorial board as an indispensable work in {list.title}.
                        </p>
                      )}

                      {/* Direct Editorial Exploration Action */}
                      <div className="pt-4">
                        <Link
                          href={href}
                          className="inline-flex items-center gap-2.5 text-xs sm:text-sm font-extrabold text-amber-300 hover:text-amber-200 transition-colors group/link"
                        >
                          <span>Explore Album & Track Reflections</span>
                          <ArrowRight
                            size={15}
                            className="group-hover/link:translate-x-1.5 transition-transform duration-200"
                          />
                        </Link>
                      </div>
                    </div>

                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
