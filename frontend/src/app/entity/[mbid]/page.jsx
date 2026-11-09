// src/app/entity/[mbid]/page.jsx
import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Disc,
  User,
  Music,
  Calendar,
  Star,
  Award,
  BookOpen,
  ArrowRight,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { getOrFetchMusicEntity, getEntityRatingsSummary } from "@/lib/supabase/musicEntities";
import UserRatingWidget from "@/Components/UserRatingWidget";

export async function generateMetadata({ params }) {
  const { mbid } = await params;
  const entity = await getOrFetchMusicEntity(mbid);

  if (!entity) {
    return { title: "Music Work | GrooveEstrella" };
  }

  return {
    title: `${entity.title} by ${entity.artist_credit || "Various Artists"} | GrooveEstrella`,
    description: `Explore ${entity.title}, view community ratings, and log your thoughts in your Music Journal on GrooveEstrella.`,
  };
}

export default async function EntityPage({ params, searchParams }) {
  const { mbid } = await params;
  const resolvedSearchParams = await searchParams;
  const typeHint = resolvedSearchParams?.type || "album";

  const entity = await getOrFetchMusicEntity(mbid, typeHint);
  if (!entity) {
    notFound();
  }

  const ratingsSummary = await getEntityRatingsSummary(mbid);

  const isAlbum = entity.type === "album" || entity.type === "release-group";
  const isArtist = entity.type === "artist";
  const isTrack = entity.type === "track";

  const deepLink = isAlbum
    ? `/album/${mbid}`
    : isArtist
    ? `/artist/${mbid}`
    : `/track/${mbid}`;

  return (
    <div className="min-h-screen text-[var(--theme-fg)] py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-10">
      {/* Entity Hero Header */}
      <div className="relative rounded-3xl bg-[var(--theme-card)]/80 backdrop-blur-2xl border border-[var(--theme-border)] p-6 sm:p-10 shadow-2xl overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8 relative z-10">
          {/* Cover Artwork / Artist Photo */}
          <div className="w-48 h-48 sm:w-56 sm:h-56 rounded-3xl overflow-hidden bg-black/40 border border-white/10 shadow-2xl shrink-0 group relative">
            {entity.cover_art_url ? (
              <img
                src={entity.cover_art_url}
                alt={entity.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[var(--theme-muted)] bg-[var(--theme-card)]">
                {isArtist ? <User size={64} /> : <Disc size={64} />}
              </div>
            )}
          </div>

          {/* Metadata & Actions */}
          <div className="flex-1 text-center sm:text-left space-y-4">
            <div className="space-y-1.5">
              <span className="text-xs uppercase font-extrabold tracking-widest text-amber-300 font-mono">
                {entity.type} · MusicBrainz ID: {entity.mbid.slice(0, 8)}...
              </span>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight font-display text-[var(--theme-fg)]">
                {entity.title}
              </h1>
              {entity.artist_credit && (
                <p className="text-lg sm:text-xl font-bold text-[var(--theme-muted)]">
                  {entity.artist_credit}
                </p>
              )}
            </div>

            {/* Quick Meta Ribbon */}
            <div className="flex items-center justify-center sm:justify-start gap-4 flex-wrap text-xs text-[var(--theme-muted)] font-mono">
              {entity.year && (
                <div className="flex items-center gap-1.5">
                  <Calendar size={14} className="text-amber-300" />
                  <span>{entity.year}</span>
                </div>
              )}
              <div className="w-[1px] h-3 bg-white/10" />
              <div className="flex items-center gap-1.5">
                <Disc size={14} className="text-amber-300" />
                <span className="capitalize">{entity.type}</span>
              </div>
            </div>

            {/* Rating Widget (Live User Rating + Supabase Community Average) */}
            <div className="pt-2 flex items-center justify-center sm:justify-start gap-3 flex-wrap">
              <UserRatingWidget
                id={entity.mbid}
                type={entity.type === "artist" ? "artist" : entity.type === "track" ? "track" : "album"}
                itemTitle={entity.title}
                itemSubtitle={entity.artist_credit || ""}
                itemImage={entity.cover_art_url || ""}
                itemYear={entity.year}
                showMusicbrainz={true}
              />

              <Link
                href={deepLink}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[var(--theme-surface)] hover:bg-[var(--theme-card)] border border-[var(--theme-border)] text-xs font-bold text-[var(--theme-fg)] hover:text-amber-300 transition-all shadow-sm"
              >
                <span>Full Experience View</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Community Ratings & Journal Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-[var(--theme-card)]/70 border border-[var(--theme-border)] space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--theme-muted)]">
            Community Rating
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-300 font-mono">
              {ratingsSummary.avg_stars ? `${ratingsSummary.avg_stars}/10` : "—"}
            </span>
            <span className="text-xs text-[var(--theme-muted)]">
              ({ratingsSummary.total_ratings} {ratingsSummary.total_ratings === 1 ? "rating" : "ratings"})
            </span>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-[var(--theme-card)]/70 border border-[var(--theme-border)] space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--theme-muted)]">
            100-Point Normalized
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-300 font-mono">
              {ratingsSummary.normalized_score_100 || ratingsSummary.avg_score || "—"}
            </span>
            <span className="text-xs text-[var(--theme-muted)]">/ 100</span>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-[var(--theme-card)]/70 border border-[var(--theme-border)] space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--theme-muted)]">
            Source of Truth
          </span>
          <div className="flex items-center gap-2 pt-1">
            <span className="text-sm font-bold text-[var(--theme-fg)]">
              MusicBrainz Global Open DB
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
