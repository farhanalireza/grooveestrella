// src/Components/JournalCard.jsx
"use client";

import React from "react";
import Link from "next/link";
import {
  Star,
  Calendar,
  Edit3,
  Trash2,
  Disc,
  ArrowRight,
  Lock,
  Globe,
  PenTool,
  Headphones,
  Sparkles,
} from "lucide-react";

export const FALLBACK_COVER_SVG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%2317020B'/%3E%3Ccircle cx='50' cy='50' r='35' fill='%23300818' stroke='%23E8A87C' stroke-width='2' stroke-dasharray='4 2'/%3E%3Ccircle cx='50' cy='50' r='12' fill='%23E8A87C'/%3E%3Ccircle cx='50' cy='50' r='4' fill='%2317020B'/%3E%3C/svg%3E";

const MOOD_ICONS = {
  "late night": "🌙",
  "euphoric": "✨",
  "introspective": "💭",
  "chill": "☕",
  "melancholic": "🌧️",
  "energetic": "⚡",
  "road trip": "🚗",
  "focus": "🎧",
  "vinyl session": "📻",
  "nostalgic": "🕰️",
};

export function formatMoodBadge(mood) {
  if (!mood) return null;
  const clean = mood.replace(/^[^\w\s]+/g, "").trim();
  const lower = clean.toLowerCase();
  const icon = MOOD_ICONS[lower] || "🎵";
  return { icon, label: clean || mood };
}

export default function JournalCard({
  entry,
  isOwner = false,
  onEdit = null,
  onDelete = null,
  showAuthor = false,
  authorUsername = "",
  authorDisplayName = "",
  authorAvatar = "",
  className = "",
}) {
  if (!entry) return null;

  const targetHref = entry.targetId
    ? `/${entry.targetType || "album"}/${entry.targetId}`
    : "#";

  const hasReview = Boolean(entry.review && entry.review.trim().length > 0);
  const isMasterpiece = entry.rating >= 9;
  const moodBadge = formatMoodBadge(entry.mood);

  // Formatted date string
  const formattedDate = entry.date
    ? new Date(entry.date).toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Logged";

  return (
    <article
      className={`relative rounded-3xl bg-[var(--theme-card)]/90 backdrop-blur-2xl border transition-all duration-300 p-6 sm:p-7 shadow-xl hover:shadow-2xl hover:-translate-y-0.5 overflow-hidden group ${
        isMasterpiece
          ? "border-amber-400/35 shadow-[0_8px_30px_rgba(251,191,36,0.08)]"
          : "border-[var(--theme-border)]/80 hover:border-amber-400/40"
      } ${className}`}
    >
      {/* Subtle Golden/Amber Accent Strip for Masterpieces */}
      {isMasterpiece && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400/20 via-amber-400 to-amber-300" />
      )}

      <div className="flex flex-col gap-5">
        {/* TOP SECTION: Cover Art + Entity Info + Reviewed/Logged Badge */}
        <div className="flex items-start gap-4 sm:gap-5">
          {/* Cover Art (Larger, more present with smooth hover scale) */}
          <Link
            href={targetHref}
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-black/40 border border-white/10 shrink-0 shadow-lg group/cover relative"
          >
            {entry.image ? (
              <img
                src={entry.image}
                alt={entry.title}
                className="w-full h-full object-cover group-hover/cover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  e.currentTarget.src = FALLBACK_COVER_SVG;
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[var(--theme-muted)] bg-[var(--theme-surface)]">
                <Disc size={28} />
              </div>
            )}
          </Link>

          {/* Title, Artist, Badges */}
          <div className="min-w-0 flex-1 space-y-1 pt-0.5">
            {/* Format & Activity Type Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] sm:text-[11px] uppercase font-bold tracking-widest text-amber-300">
                {entry.targetType || "Album"}
              </span>

              <div className="w-1 h-1 rounded-full bg-white/20" />

              {/* Reviewed vs Just Logged Pill */}
              {hasReview ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400/15 border border-amber-400/25 text-amber-300">
                  <PenTool size={10} />
                  <span>Reviewed</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[var(--theme-muted)]">
                  <Headphones size={10} />
                  <span>Logged Listen</span>
                </span>
              )}

              {/* Public / Private Badge (Owner View) */}
              {isOwner && (
                <span
                  className={`text-[9.5px] px-2 py-0.5 rounded-full font-semibold inline-flex items-center gap-1 ${
                    entry.is_public
                      ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
                      : "text-zinc-400 bg-zinc-800 border border-zinc-700"
                  }`}
                  title={entry.is_public ? "Public on your profile" : "Private log"}
                >
                  {entry.is_public ? <Globe size={9} /> : <Lock size={9} />}
                  <span>{entry.is_public ? "Public" : "Private"}</span>
                </span>
              )}
            </div>

            {/* Clickable Album / Track Title */}
            <h3 className="text-lg sm:text-xl font-black text-[var(--theme-fg)] tracking-tight font-display truncate pt-0.5">
              <Link
                href={targetHref}
                className="hover:text-amber-300 transition-colors inline-flex items-center gap-1.5 group/link"
              >
                <span>{entry.title}</span>
                <ArrowRight
                  size={14}
                  className="opacity-0 -translate-x-1 group-hover/link:opacity-100 group-hover/link:translate-x-0 transition-all text-amber-300 shrink-0"
                />
              </Link>
            </h3>

            {/* Artist Credit */}
            {entry.subtitle && (
              <p className="text-xs sm:text-sm font-semibold text-[var(--theme-muted)] truncate">
                {entry.subtitle}
              </p>
            )}

            {/* Author Credit (when viewing multi-user feeds) */}
            {showAuthor && authorUsername && (
              <p className="text-xs text-[var(--theme-muted)] pt-0.5">
                Logged by{" "}
                <Link
                  href={`/profile/${authorUsername}`}
                  className="text-amber-300 font-bold hover:underline"
                >
                  @{authorUsername}
                </Link>
              </p>
            )}
          </div>
        </div>

        {/* MIDDLE SECTION: Review Text with Generous Typography & Breathing Room */}
        {hasReview ? (
          <div className="my-1 sm:my-2 pl-4 sm:pl-5 border-l-2 border-amber-400/50">
            <p className="text-base sm:text-lg leading-relaxed text-[var(--theme-fg)]/95 font-body whitespace-pre-line italic font-normal tracking-wide">
              “{entry.review.trim()}”
            </p>
          </div>
        ) : (
          <div className="py-1 text-xs text-[var(--theme-muted)]/60 italic font-medium">
            No written review attached to this listen log.
          </div>
        )}

        {/* Tags (if present) */}
        {entry.tags && entry.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 -mt-2">
            {entry.tags.map((tag, idx) => (
              <span
                key={idx}
                className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[var(--theme-surface)] border border-[var(--theme-border)] text-[var(--theme-muted)]"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* BOTTOM SECTION: Meta Row (Date · Mood · Rating + Edit/Delete Actions) */}
        <div className="pt-3.5 border-t border-[var(--theme-border)]/70 flex items-center justify-between flex-wrap gap-3">
          {/* Left Meta: Date + Mood Pill */}
          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--theme-muted)]">
              <Calendar size={13} className="text-amber-300" />
              <span>{formattedDate}</span>
            </div>

            {moodBadge && (
              <>
                <span className="text-[var(--theme-muted)]/40 text-xs">·</span>
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/25 text-amber-300 shadow-2xs">
                  <span>{moodBadge.icon}</span>
                  <span>{moodBadge.label}</span>
                </span>
              </>
            )}
          </div>

          {/* Right Meta: Rating Pill & Actions */}
          <div className="flex items-center gap-2.5">
            {/* Rating Badge (Always prominent on the right) */}
            {entry.rating > 0 && (
              <div
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full border font-black text-xs sm:text-sm shadow-xs ${
                  isMasterpiece
                    ? "bg-gradient-to-r from-amber-400/25 via-amber-400/15 to-amber-400/5 border-amber-400/50 text-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.3)]"
                    : "bg-amber-400/15 border-amber-400/30 text-amber-300"
                }`}
              >
                <Star
                  size={14}
                  fill="currentColor"
                  className={`${
                    isMasterpiece
                      ? "text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.9)]"
                      : "text-amber-400"
                  }`}
                />
                <span>{entry.rating}/10</span>
                {entry.numericalScore > 0 && entry.ratingSystem === "score" && (
                  <span className="text-[10px] text-amber-200/70 font-normal ml-0.5">
                    ({entry.numericalScore})
                  </span>
                )}
              </div>
            )}

            {/* Actions: Edit & Delete for Owner */}
            {isOwner && (
              <div className="flex items-center gap-1 border-l border-white/10 pl-2">
                {onEdit && (
                  <button
                    onClick={() => onEdit(entry)}
                    className="p-1.5 rounded-xl text-[var(--theme-muted)] hover:text-amber-300 hover:bg-amber-400/10 transition cursor-pointer active:scale-95"
                    title="Edit journal entry"
                  >
                    <Edit3 size={15} />
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => onDelete(entry.id)}
                    className="p-1.5 rounded-xl text-[var(--theme-muted)] hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer active:scale-95"
                    title="Delete entry"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
