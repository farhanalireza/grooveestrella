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
  Music,
  User,
  Lock,
  Globe,
} from "lucide-react";

export const FALLBACK_COVER_SVG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%2317020B'/%3E%3Ccircle cx='50' cy='50' r='35' fill='%23300818' stroke='%23E8A87C' stroke-width='2' stroke-dasharray='4 2'/%3E%3Ccircle cx='50' cy='50' r='12' fill='%23E8A87C'/%3E%3Ccircle cx='50' cy='50' r='4' fill='%2317020B'/%3E%3C/svg%3E";

export function formatMoodBadge(mood) {
  if (!mood) return null;
  const clean = String(mood).trim();
  if (!clean) return null;
  return { label: clean };
}

export default function JournalCard({
  entry,
  isOwner = false,
  onEdit = null,
  onDelete = null,
  showAuthor = false,
  authorUsername = "",
  className = "",
}) {
  if (!entry) return null;

  const entityType = (entry.targetType || "album").toLowerCase();
  const entityLabel =
    entityType === "track" ? "TRACK" : entityType === "artist" ? "ARTIST" : "ALBUM";

  const targetHref = entry.targetId ? `/${entityType}/${entry.targetId}` : "#";
  const hasReview = Boolean(entry.review && entry.review.trim().length > 0);
  const hasRating = Number(entry.rating) > 0;
  const isMasterpiece = Number(entry.rating) >= 9;
  const moodBadge = formatMoodBadge(entry.mood);

  const formattedDate = entry.date
    ? new Date(entry.date).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Logged";

  const PlaceholderIcon =
    entityType === "artist" ? User : entityType === "track" ? Music : Disc;

  return (
    <article
      className={`relative rounded-3xl bg-[var(--theme-card)]/90 backdrop-blur-2xl border transition-all duration-300 p-6 sm:p-8 shadow-xl hover:shadow-2xl overflow-hidden group ${
        isMasterpiece
          ? "border-amber-400/35 shadow-[0_8px_30px_rgba(251,191,36,0.08)]"
          : "border-[var(--theme-border)]/80 hover:border-amber-400/35"
      } ${className}`}
    >
      <div className="flex flex-col gap-5">
        {/* ROW 1: Date + Mood (Left) & ★ Rating Badge (Right) */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5 flex-wrap min-w-0">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--theme-muted)]">
              <Calendar size={13} className="text-[var(--theme-accent)] shrink-0" />
              <span>{formattedDate}</span>
            </div>

            {moodBadge && (
              <>
                <span className="text-[var(--theme-muted)]/40 text-xs">·</span>
                <span className="inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full bg-[var(--theme-surface)] border border-[var(--theme-border)] text-[var(--theme-fg)]/85 truncate max-w-[220px]">
                  {moodBadge.label}
                </span>
              </>
            )}

            {isOwner && (
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-semibold inline-flex items-center gap-1 ${
                  entry.is_public !== false
                    ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
                    : "text-zinc-300 bg-zinc-800/90 border border-zinc-700"
                }`}
                title={
                  entry.is_public !== false
                    ? "Public review visible on profile and entity page"
                    : "Private log (only visible to you; rating remains public)"
                }
              >
                {entry.is_public !== false ? <Globe size={9} /> : <Lock size={9} />}
                <span>{entry.is_public !== false ? "Public" : "Private"}</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Rating Badge — Always Visible */}
            <div
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full border font-black text-xs sm:text-sm ${
                hasRating
                  ? isMasterpiece
                    ? "bg-gradient-to-r from-amber-400/25 via-amber-400/15 to-amber-400/5 border-amber-400/50 text-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.22)]"
                    : "bg-amber-400/15 border-amber-400/35 text-amber-300"
                  : "bg-[var(--theme-surface)] border-[var(--theme-border)] text-[var(--theme-muted)]"
              }`}
            >
              <Star
                size={13}
                fill={hasRating ? "currentColor" : "none"}
                className={hasRating ? "text-amber-400" : "text-[var(--theme-muted)]"}
              />
              {hasRating ? (
                <>
                  <span>{entry.rating}/10</span>
                  {entry.numericalScore > 0 && entry.ratingSystem === "score" && (
                    <span className="text-[10px] text-amber-200/75 font-semibold ml-0.5">
                      ({entry.numericalScore})
                    </span>
                  )}
                </>
              ) : (
                <span className="text-[11px] font-semibold">Unrated</span>
              )}
            </div>

            {isOwner && (onEdit || onDelete) && (
              <div className="flex items-center gap-1 border-l border-[var(--theme-border)]/70 pl-2">
                {onEdit && (
                  <button
                    type="button"
                    onClick={() => onEdit(entry)}
                    className="p-1.5 rounded-xl text-[var(--theme-muted)] hover:text-amber-300 hover:bg-amber-400/10 transition cursor-pointer"
                    title="Edit journal entry"
                  >
                    <Edit3 size={14} />
                  </button>
                )}
                {onDelete && (
                  <button
                    type="button"
                    onClick={() => onDelete(entry.id)}
                    className="p-1.5 rounded-xl text-[var(--theme-muted)] hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                    title="Delete entry"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ROW 2: [Cover] + Entity Type + Title + Artist Name */}
        <div className="flex items-center gap-4 sm:gap-5">
          <Link
            href={targetHref}
            className={`w-20 h-20 sm:w-24 sm:h-24 overflow-hidden bg-black/40 border border-white/10 shrink-0 shadow-lg group/cover relative ${
              entityType === "artist" ? "rounded-full" : "rounded-2xl"
            }`}
          >
            {entry.image ? (
              <img
                src={entry.image}
                alt={entry.title || "Cover"}
                className="w-full h-full object-cover group-hover/cover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  e.currentTarget.src = FALLBACK_COVER_SVG;
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[var(--theme-muted)] bg-[var(--theme-surface)]">
                <PlaceholderIcon size={28} />
              </div>
            )}
          </Link>

          <div className="min-w-0 flex-1 space-y-1">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-[var(--theme-accent)] block">
              {entityLabel}
            </span>

            <h3 className="text-base sm:text-lg font-extrabold text-[var(--theme-fg)] tracking-tight font-display truncate">
              <Link href={targetHref} className="hover:text-amber-300 transition-colors">
                {entry.title}
              </Link>
            </h3>

            {entry.subtitle && (
              <p className="text-xs sm:text-sm font-medium text-[var(--theme-muted)] truncate">
                {entry.subtitle}
              </p>
            )}

            {showAuthor && authorUsername && (
              <p className="text-xs text-[var(--theme-muted)] pt-0.5">
                by{" "}
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

        {/* ROW 3: Review Text (Strongest Hierarchy & Generous Breathing Room) */}
        {hasReview ? (
          <div className="pt-3 border-t border-[var(--theme-border)]/50">
            <p className="text-base sm:text-[18px] leading-[1.7] text-[var(--theme-fg)] font-normal whitespace-pre-line">
              {entry.review.trim()}
            </p>
          </div>
        ) : (
          <div className="pt-2 border-t border-[var(--theme-border)]/40 text-xs text-[var(--theme-muted)]/70">
            Listen logged without written notes.
          </div>
        )}
      </div>
    </article>
  );
}
