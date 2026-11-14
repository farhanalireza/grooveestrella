// src/Components/MusicDiaryEntries.jsx
"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Calendar,
  Star,
  Edit3,
  Trash2,
  Disc,
  Music,
  User,
  Plus,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Heart,
  Globe,
  Lock,
} from "lucide-react";

export const FALLBACK_COVER_SVG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%2317020B'/%3E%3Ccircle cx='50' cy='50' r='35' fill='%23300818' stroke='%23E8A87C' stroke-width='2' stroke-dasharray='4 2'/%3E%3Ccircle cx='50' cy='50' r='12' fill='%23E8A87C'/%3E%3Ccircle cx='50' cy='50' r='4' fill='%2317020B'/%3E%3C/svg%3E";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * Renders Letterboxd-style 5-star rating (supporting half-stars if score is 1-10)
 */
function StarRating({ rating = 0, maxStars = 5 }) {
  const num = Number(rating) || 0;
  // If rating is on a 10-point scale, normalize to 5-star scale
  const normalized = num > 5 ? num / 2 : num;

  const stars = [];
  for (let i = 1; i <= maxStars; i++) {
    const isFull = normalized >= i;
    const isHalf = !isFull && normalized >= i - 0.5;

    stars.push(
      <span key={i} className="relative inline-block text-amber-400">
        <Star
          size={14}
          className={isFull ? "fill-amber-400 text-amber-400" : isHalf ? "text-amber-400/50" : "text-zinc-600/60"}
        />
        {isHalf && (
          <span className="absolute inset-0 overflow-hidden w-1/2">
            <Star size={14} className="fill-amber-400 text-amber-400" />
          </span>
        )}
      </span>
    );
  }

  return <div className="inline-flex items-center gap-0.5">{stars}</div>;
}

export default function MusicDiaryEntries({
  entries = [],
  onEdit = null,
  onDelete = null,
  isOwner = true,
  onOpenNew = null,
}) {
  const [expandedReviews, setExpandedReviews] = useState({});

  const toggleReview = (id) => {
    setExpandedReviews((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Group entries by Year, then by Month (Chronological descending)
  const groupedTimeline = useMemo(() => {
    if (!Array.isArray(entries) || entries.length === 0) return [];

    const yearMap = new Map();

    entries.forEach((entry) => {
      const dateObj = entry.date ? new Date(entry.date) : new Date(entry.createdAt || Date.now());
      const year = isNaN(dateObj.getFullYear()) ? new Date().getFullYear() : dateObj.getFullYear();
      const monthIdx = isNaN(dateObj.getMonth()) ? new Date().getMonth() : dateObj.getMonth();
      const dayNum = isNaN(dateObj.getDate()) ? 1 : dateObj.getDate();
      const dayOfWeek = isNaN(dateObj.getDay()) ? "Sat" : DAY_NAMES[dateObj.getDay()];

      if (!yearMap.has(year)) {
        yearMap.set(year, new Map());
      }
      const monthMap = yearMap.get(year);
      if (!monthMap.has(monthIdx)) {
        monthMap.set(monthIdx, []);
      }
      monthMap.get(monthIdx).push({
        ...entry,
        parsedYear: year,
        parsedMonth: MONTH_NAMES[monthIdx],
        parsedMonthIdx: monthIdx,
        parsedDay: dayNum,
        parsedDayOfWeek: dayOfWeek,
        timestamp: dateObj.getTime(),
      });
    });

    // Sort years descending
    const sortedYears = Array.from(yearMap.keys()).sort((a, b) => b - a);

    return sortedYears.map((year) => {
      const monthMap = yearMap.get(year);
      // Sort months descending (December -> January)
      const sortedMonths = Array.from(monthMap.keys()).sort((a, b) => b - a);

      const months = sortedMonths.map((mIdx) => {
        const monthEntries = monthMap.get(mIdx);
        // Sort entries within month descending by day/timestamp
        monthEntries.sort((a, b) => b.timestamp - a.timestamp);

        // Distinct days in this month where albums were logged
        const distinctDays = new Set(monthEntries.map((e) => e.parsedDay)).size;

        return {
          monthIndex: mIdx,
          monthName: MONTH_NAMES[mIdx],
          entries: monthEntries,
          totalEntries: monthEntries.length,
          distinctDays: distinctDays,
        };
      });

      const totalYearEntries = months.reduce((acc, m) => acc + m.totalEntries, 0);

      return {
        year,
        totalEntries: totalYearEntries,
        months,
      };
    });
  }, [entries]);

  if (entries.length === 0) {
    return (
      <div className="py-20 text-center space-y-4 max-w-md mx-auto">
        <div className="w-16 h-16 rounded-3xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-300 mx-auto shadow-inner">
          <Disc size={30} className="animate-spin-slow" />
        </div>
        <h3 className="text-xl font-black text-[var(--theme-fg)] font-display">No Diary Entries Yet</h3>
        <p className="text-xs sm:text-sm text-[var(--theme-muted)] leading-relaxed">
          Log albums you listen to, rate them with stars, and jot down your personal notes to start your music diary!
        </p>
        <Link
          href="/journal/new?returnTo=%2Flibrary%3Ftab%3Djournal"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-300 text-zinc-950 font-extrabold text-xs shadow-lg hover:scale-105 active:scale-95 transition cursor-pointer"
        >
          <Plus size={15} />
          <span>Log Your First Album</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full space-y-16 animate-fade-in font-sans">
      {groupedTimeline.map((yearGroup) => (
        <section key={yearGroup.year} className="space-y-10">
          {/* Year Header (Big, bold editorial typography) */}
          <div className="flex items-baseline justify-between border-b-2 border-amber-400/30 pb-3">
            <h2 className="text-4xl sm:text-5xl font-black text-[var(--theme-fg)] font-display tracking-tight flex items-center gap-3">
              <span>{yearGroup.year}</span>
              <span className="text-xs font-sans font-bold px-3 py-1 rounded-full bg-amber-400/15 text-amber-300 border border-amber-400/30">
                {yearGroup.totalEntries} {yearGroup.totalEntries === 1 ? "Album Logged" : "Albums Logged"}
              </span>
            </h2>
          </div>

          {/* Months within Year */}
          {yearGroup.months.map((month) => (
            <div key={`${yearGroup.year}-${month.monthIndex}`} className="space-y-6">
              {/* Month Subheader + Stats Pill */}
              <div className="flex items-center justify-between pb-2 border-b border-[var(--theme-border)]/60">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl sm:text-2xl font-black text-[var(--theme-fg)] uppercase tracking-wider font-display">
                    {month.monthName}
                  </h3>
                  <span className="text-xs text-[var(--theme-muted)] font-medium">
                    {month.totalEntries} {month.totalEntries === 1 ? "album" : "albums"} across {month.distinctDays} {month.distinctDays === 1 ? "day" : "days"}
                  </span>
                </div>
              </div>

              {/* DESKTOP PC DIARY TABLE LAYOUT (hidden md:block) - NO CARDS, USES BACKGROUND WITH ALBUM COVER GLOW */}
              <div className="hidden md:block w-full overflow-hidden">
                <div className="w-full divide-y divide-[var(--theme-border)]/40">
                  {/* Table Column Headers */}
                  <div className="grid grid-cols-12 gap-4 py-2 px-3 text-[11px] font-bold uppercase tracking-wider text-[var(--theme-muted)]">
                    <div className="col-span-1">Date</div>
                    <div className="col-span-4">Album & Artist</div>
                    <div className="col-span-1">Year</div>
                    <div className="col-span-2">Rating</div>
                    <div className="col-span-3">Diary Reflection</div>
                    <div className="col-span-1 text-right">Actions</div>
                  </div>

                  {/* Diary Entry Rows */}
                  {month.entries.map((entry) => {
                    const coverUrl = entry.image || FALLBACK_COVER_SVG;
                    const entityType = (entry.targetType || "album").toLowerCase();
                    const targetHref = entry.targetId ? `/${entityType}/${entry.targetId}` : "#";
                    const isExpanded = expandedReviews[entry.id];
                    const hasReview = Boolean(entry.review && entry.review.trim().length > 0);

                    return (
                      <div
                        key={entry.id}
                        className="relative grid grid-cols-12 gap-4 py-4 px-3 items-center group transition-colors duration-200 hover:bg-white/[0.02]"
                      >
                        {/* Ambient Cover Art Blur Background (radiates where the album sits) */}
                        <div
                          className="absolute inset-y-0 left-12 w-48 pointer-events-none opacity-20 blur-2xl -z-10 transition-opacity duration-300 group-hover:opacity-35"
                          style={{
                            backgroundImage: `url(${coverUrl})`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                          }}
                        />

                        {/* Column 1: Date */}
                        <div className="col-span-1 flex flex-col items-start leading-tight">
                          <span className="text-2xl font-black text-[var(--theme-fg)] font-display">
                            {entry.parsedDay}
                          </span>
                          <span className="text-[11px] font-bold text-[var(--theme-muted)] uppercase tracking-wider">
                            {entry.parsedDayOfWeek}
                          </span>
                        </div>

                        {/* Column 2: Album & Cover Art (With ambient glow) */}
                        <div className="col-span-4 flex items-center gap-3.5 min-w-0 pr-2">
                          <Link
                            href={targetHref}
                            className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0 shadow-lg border border-white/10 group-hover:scale-105 transition-transform duration-300 bg-black/40"
                          >
                            <img
                              src={coverUrl}
                              alt={entry.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src = FALLBACK_COVER_SVG;
                              }}
                            />
                          </Link>

                          <div className="min-w-0 flex-1">
                            <Link
                              href={targetHref}
                              className="text-sm font-bold text-[var(--theme-fg)] hover:text-amber-300 transition-colors block truncate tracking-tight"
                            >
                              {entry.title}
                            </Link>
                            <p className="text-xs text-[var(--theme-muted)] truncate mt-0.5">
                              {entry.subtitle || "Various Artists"}
                            </p>
                            {entry.mood && (
                              <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-semibold px-2 py-0.2 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/20">
                                <span>{entry.mood}</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Column 3: Release Year */}
                        <div className="col-span-1 text-xs text-[var(--theme-muted)] font-semibold">
                          {entry.year || "—"}
                        </div>

                        {/* Column 4: Rating */}
                        <div className="col-span-2 flex flex-col gap-1">
                          {entry.rating > 0 ? (
                            <>
                              <StarRating rating={entry.rating} />
                              <span className="text-[10px] text-[var(--theme-muted)] font-mono">
                                {entry.numericalScore ? `${entry.numericalScore}/100` : `${entry.rating}/5`}
                              </span>
                            </>
                          ) : (
                            <span className="text-xs text-[var(--theme-muted)]/60 italic">No score</span>
                          )}
                        </div>

                        {/* Column 5: Diary Reflection / Review */}
                        <div className="col-span-3 text-xs text-[var(--theme-fg)]/85 pr-2">
                          {hasReview ? (
                            <div className="space-y-1">
                              <p className={`text-xs text-[var(--theme-fg)]/85 leading-relaxed ${isExpanded ? "" : "line-clamp-2"}`}>
                                "{entry.review}"
                              </p>
                              {entry.review.length > 90 && (
                                <button
                                  type="button"
                                  onClick={() => toggleReview(entry.id)}
                                  className="text-[10px] font-bold text-amber-300 hover:underline cursor-pointer"
                                >
                                  {isExpanded ? "Show Less" : "Read Full Log"}
                                </button>
                              )}
                            </div>
                          ) : (
                            <span className="text-[11px] text-[var(--theme-muted)]/50 italic">
                              Logged without notes
                            </span>
                          )}
                        </div>

                        {/* Column 6: Actions */}
                        <div className="col-span-1 flex items-center justify-end gap-1.5 shrink-0">
                          {isOwner && onEdit && (
                            <button
                              type="button"
                              onClick={() => onEdit(entry)}
                              className="p-1.5 rounded-lg text-[var(--theme-muted)] hover:text-amber-300 hover:bg-white/5 transition cursor-pointer"
                              title="Edit Diary Entry"
                            >
                              <Edit3 size={14} />
                            </button>
                          )}
                          {isOwner && onDelete && (
                            <button
                              type="button"
                              onClick={() => onDelete(entry.id)}
                              className="p-1.5 rounded-lg text-[var(--theme-muted)] hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                              title="Remove Entry"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                          <Link
                            href={targetHref}
                            className="p-1.5 rounded-lg text-[var(--theme-muted)] hover:text-[var(--theme-fg)] hover:bg-white/5 transition"
                            title="View Album"
                          >
                            <ExternalLink size={14} />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* MOBILE SCREEN DIARY TIMELINE (md:hidden) - COMPACT, FLUID, USES BACKGROUND WITH RADIATING COVER ART */}
              <div className="md:hidden space-y-4">
                {month.entries.map((entry) => {
                  const coverUrl = entry.image || FALLBACK_COVER_SVG;
                  const entityType = (entry.targetType || "album").toLowerCase();
                  const targetHref = entry.targetId ? `/${entityType}/${entry.targetId}` : "#";
                  const isExpanded = expandedReviews[entry.id];
                  const hasReview = Boolean(entry.review && entry.review.trim().length > 0);

                  return (
                    <div
                      key={entry.id}
                      className="relative rounded-2xl overflow-hidden py-3.5 px-3 border border-[var(--theme-border)]/50 transition-all duration-300"
                    >
                      {/* Ambient Cover Glow Bleed on the mobile row */}
                      <div
                        className="absolute inset-0 pointer-events-none opacity-20 blur-xl -z-10"
                        style={{
                          backgroundImage: `url(${coverUrl})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }}
                      />

                      {/* Date + Rating Header */}
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-[var(--theme-border)]/40">
                        <div className="flex items-center gap-2">
                          <span className="text-base font-black text-amber-300 font-display">
                            {entry.parsedDay} {month.monthName.slice(0, 3)}
                          </span>
                          <span className="text-xs text-[var(--theme-muted)] font-bold">
                            · {entry.parsedDayOfWeek}
                          </span>
                        </div>

                        {entry.rating > 0 ? (
                          <div className="flex items-center gap-1.5">
                            <StarRating rating={entry.rating} />
                            {entry.numericalScore ? (
                              <span className="text-[10px] font-mono text-amber-300 font-bold">
                                {entry.numericalScore}
                              </span>
                            ) : null}
                          </div>
                        ) : null}
                      </div>

                      {/* Album Info Row */}
                      <div className="flex items-start gap-3 min-w-0">
                        <Link
                          href={targetHref}
                          className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 shadow-md border border-white/10 bg-black/40"
                        >
                          <img
                            src={coverUrl}
                            alt={entry.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = FALLBACK_COVER_SVG;
                            }}
                          />
                        </Link>

                        <div className="min-w-0 flex-1">
                          <Link
                            href={targetHref}
                            className="text-sm font-bold text-[var(--theme-fg)] hover:text-amber-300 transition-colors block truncate"
                          >
                            {entry.title}
                          </Link>
                          <p className="text-xs text-[var(--theme-muted)] truncate mt-0.5">
                            {entry.subtitle || "Various Artists"}
                          </p>

                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            {entry.mood && (
                              <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/20">
                                {entry.mood}
                              </span>
                            )}
                            {entry.year && (
                              <span className="text-[10px] text-[var(--theme-muted)] font-semibold">
                                {entry.year}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Diary Review / Note */}
                      {hasReview && (
                        <div className="mt-3 pt-2 border-t border-[var(--theme-border)]/30 text-xs text-[var(--theme-fg)]/85">
                          <p className={`leading-relaxed italic ${isExpanded ? "" : "line-clamp-2"}`}>
                            "{entry.review}"
                          </p>
                          {entry.review.length > 80 && (
                            <button
                              type="button"
                              onClick={() => toggleReview(entry.id)}
                              className="text-[10px] font-bold text-amber-300 mt-1 cursor-pointer"
                            >
                              {isExpanded ? "Show Less" : "Read Full Note"}
                            </button>
                          )}
                        </div>
                      )}

                      {/* Mobile Row Actions */}
                      <div className="mt-3 pt-2 flex items-center justify-between text-xs border-t border-[var(--theme-border)]/30">
                        <Link
                          href={targetHref}
                          className="text-[11px] font-bold text-[var(--theme-accent)] flex items-center gap-1"
                        >
                          <span>Open Album</span>
                          <ArrowRight size={11} />
                        </Link>

                        <div className="flex items-center gap-2">
                          {isOwner && onEdit && (
                            <button
                              type="button"
                              onClick={() => onEdit(entry)}
                              className="p-1 text-[var(--theme-muted)] hover:text-amber-300 cursor-pointer"
                              title="Edit Entry"
                            >
                              <Edit3 size={13} />
                            </button>
                          )}
                          {isOwner && onDelete && (
                            <button
                              type="button"
                              onClick={() => onDelete(entry.id)}
                              className="p-1 text-[var(--theme-muted)] hover:text-rose-400 cursor-pointer"
                              title="Remove"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
