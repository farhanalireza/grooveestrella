// src/Components/MusicLoreAndReviews.jsx
"use client";

import React, { useMemo } from "react";
import { 
  ExternalLink, Tag, BookOpen,
  Sparkles, Globe,
  Disc, Calendar, MapPin, Building, Hash, Layers
} from "lucide-react";
import EntityReviewsSection from "./EntityReviewsSection";

export default function MusicLoreAndReviews({
  id,
  type = "track", // track | album | artist
  title = "",
  artist = "",
  image = "",
  year = null,
  description = null,
  artistDescription = null,
  releaseDetails = null, // { releaseDate, label, country, barcode, format, trackCount, discCount }
  primaryGenre = null,
  genres = [],
  categorizedTags = null,
  tags = [],
  allTags = [],
  rating = null,
  externalLinks = [],
  totalDurationMs = null,
  activeTab = "all", // "all" | "about" | "lore" | "reviews" | "links"
}) {

  // FULL GENRES & COMMUNITY FOLKSONOMY (NO aggressive stripping!)
  // User explicitly wants FULL genre tags, community folksonomy, styles, and subgenres shown
  const resolvedCategorized = useMemo(() => {
    const formatTag = (str) => {
      if (!str) return "";
      let clean = String(str).replace(/^#+/, "").trim();

      if (/^r&b$/i.test(clean)) return "R&B";
      if (/^edm$/i.test(clean)) return "EDM";
      if (/^idm$/i.test(clean)) return "IDM";
      if (/^k-?pop$/i.test(clean)) return "K-Pop";
      if (/^j-?pop$/i.test(clean)) return "J-Pop";
      if (/^lo-?fi$/i.test(clean)) return "Lo-Fi";
      if (/^hip-?hop$/i.test(clean)) return "Hip Hop";

      return clean
        .split(/[\s-]+/)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(" ");
    };

    const genreList = Array.isArray(genres) ? genres : [];
    const rawList = (allTags && allTags.length > 0) ? allTags : (tags || []).map((t) => ({ name: t, count: 1 }));

    const coreGenres = [];
    const styles = [];
    const folksonomy = [];
    const eras = [];
    const seen = new Set();

    // 1. Process Core Genres
    genreList.forEach((g) => {
      const rawName = typeof g === "string" ? g : g?.name;
      const count = (typeof g === "object" && g.count) || null;
      const formatted = formatTag(rawName);
      const lower = formatted.toLowerCase();
      if (formatted && !seen.has(lower)) {
        seen.add(lower);
        coreGenres.push({ name: formatted, count });
      }
    });

    // 2. Process All Tags & Folksonomy (Keep EVERYTHING the user asked for)
    for (const t of rawList) {
      const raw = typeof t === "string" ? t : t?.name;
      if (!raw) continue;
      const formatted = formatTag(raw);
      if (!formatted) continue;

      const lower = formatted.toLowerCase();
      const count = (typeof t === "object" && t.count) || null;

      if (seen.has(lower)) continue;
      seen.add(lower);

      if (/^\d{2,4}s?$/i.test(formatted) || /^\d{4}$/.test(formatted)) {
        eras.push({ name: formatted, count });
      } else if (/rock|pop|jazz|metal|folk|blues|wave|punk|electronic|ambient|reggae|disco|funk|soul|indie|alternative|prog|hop|rap|dance|r&b|techno|house|trance|country/i.test(lower)) {
        styles.push({ name: formatted, count });
      } else {
        // Community folksonomy: origins, movements, roles, themes (British, UK, Actors, Composers, Arrangers, etc.)
        folksonomy.push({ name: formatted, count });
      }
    }

    return {
      coreGenres,
      styles,
      folksonomy,
      eras,
    };
  }, [genres, tags, allTags]);

  const hasAnyTags = resolvedCategorized.coreGenres.length > 0 ||
    resolvedCategorized.styles.length > 0 ||
    resolvedCategorized.folksonomy.length > 0 ||
    resolvedCategorized.eras.length > 0;

  // Decide which sections to render based on activeTab
  const renderAll = activeTab === "all";
  const renderAbout = renderAll || activeTab === "about";
  const renderLore = renderAll || activeTab === "lore";
  const renderReviews = renderAll || activeTab === "reviews";
  const renderLinks = renderAll || activeTab === "links";

  return (
    <div className="relative z-10 w-full space-y-12 px-4 sm:px-6 md:px-8 pb-16">
      
      {/* 1. ABOUT & INFO TAB (Full Lore, Specs & Artist Bio - NO CARD WRAPPER!) */}
      {renderAbout && (description || artistDescription || releaseDetails) && (
        <section className="space-y-8 animate-fade-in">
          {/* Main Editorial Background */}
          {description && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-[var(--theme-accent)] uppercase tracking-widest">
                <BookOpen size={15} />
                <span>{type === "artist" ? "Artist Biography" : type === "album" ? "Album Overview & Background" : "Track Information"}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-[var(--theme-fg)] tracking-tight font-display">
                About {title || artist}
              </h2>
              <div className="text-sm sm:text-base text-[var(--theme-muted)] leading-relaxed font-body max-w-3xl whitespace-pre-line">
                {description}
              </div>
            </div>
          )}

          {/* Release Specifications Grid (Clean 2-Column Specs - No Box Card!) */}
          {releaseDetails && (
            <div className="pt-6 border-t border-[var(--theme-border)]/50 space-y-4">
              <h3 className="text-xs font-bold text-[var(--theme-fg)] uppercase tracking-wider">
                Release Metadata & Archival Specs
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-w-3xl">
                {releaseDetails.releaseDate && (
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-[var(--theme-muted)] flex items-center gap-1.5">
                      <Calendar size={13} className="text-[var(--theme-accent)]" />
                      <span>Original Release</span>
                    </span>
                    <p className="text-sm font-bold text-[var(--theme-fg)]">{releaseDetails.releaseDate}</p>
                  </div>
                )}
                {releaseDetails.label && (
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-[var(--theme-muted)] flex items-center gap-1.5">
                      <Building size={13} className="text-[var(--theme-accent)]" />
                      <span>Record Label</span>
                    </span>
                    <p className="text-sm font-bold text-[var(--theme-fg)] truncate">{releaseDetails.label}</p>
                  </div>
                )}
                {releaseDetails.country && (
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-[var(--theme-muted)] flex items-center gap-1.5">
                      <MapPin size={13} className="text-[var(--theme-accent)]" />
                      <span>Release Country</span>
                    </span>
                    <p className="text-sm font-bold text-[var(--theme-fg)]">{releaseDetails.country}</p>
                  </div>
                )}
                {releaseDetails.format && (
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-[var(--theme-muted)] flex items-center gap-1.5">
                      <Disc size={13} className="text-[var(--theme-accent)]" />
                      <span>Primary Medium</span>
                    </span>
                    <p className="text-sm font-bold text-[var(--theme-fg)]">{releaseDetails.format}</p>
                  </div>
                )}
                {releaseDetails.barcode && (
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-[var(--theme-muted)] flex items-center gap-1.5">
                      <Hash size={13} className="text-[var(--theme-accent)]" />
                      <span>Catalog / Barcode</span>
                    </span>
                    <p className="text-xs font-sans font-bold text-[var(--theme-fg)] truncate">{releaseDetails.barcode}</p>
                  </div>
                )}
                {releaseDetails.trackCount && (
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-[var(--theme-muted)] flex items-center gap-1.5">
                      <Disc size={13} className="text-[var(--theme-accent)]" />
                      <span>Tracks</span>
                    </span>
                    <p className="text-sm font-bold text-[var(--theme-fg)]">{releaseDetails.trackCount} Tracks</p>
                  </div>
                )}
                {releaseDetails.discCount > 1 && (
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-[var(--theme-muted)] flex items-center gap-1.5">
                      <Layers size={13} className="text-[var(--theme-accent)]" />
                      <span>Discs / Media</span>
                    </span>
                    <p className="text-sm font-bold text-[var(--theme-fg)]">{releaseDetails.discCount} Discs</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Artist Background Snippet */}
          {artistDescription && type !== "artist" && (
            <div className="pt-6 border-t border-[var(--theme-border)]/50 space-y-2">
              <h3 className="text-xs font-bold text-[var(--theme-accent)] uppercase tracking-wider">
                Artist Context · {artist}
              </h3>
              <p className="text-xs sm:text-sm text-[var(--theme-muted)] leading-relaxed max-w-3xl whitespace-pre-line">
                {artistDescription}
              </p>
            </div>
          )}
        </section>
      )}

      {/* 2. GENRES & LORE TAB (Full Genres & Folksonomy - NO AGGRESSIVE FILTERING!) */}
      {renderLore && hasAnyTags && (
        <section className="space-y-8 animate-fade-in">
          <div className="flex items-center justify-between flex-wrap gap-2 border-b border-[var(--theme-border)]/50 pb-3">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-[var(--theme-accent)] uppercase tracking-widest">
                <Tag size={15} />
                <span>Musical Lore & Taxonomy</span>
              </div>
              <h2 className="text-2xl font-black text-[var(--theme-fg)] tracking-tight font-display mt-0.5">
                Genres, Styles & Community Lore
              </h2>
            </div>
            {primaryGenre && (
              <span className="text-xs text-[var(--theme-accent)] font-semibold px-3 py-1 rounded-full bg-[var(--theme-accent)]/15 border border-[var(--theme-accent)]/30">
                Primary: {primaryGenre}
              </span>
            )}
          </div>

          {/* Core Official Genres */}
          {resolvedCategorized.coreGenres.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-[var(--theme-muted)] uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={13} className="text-[var(--theme-accent)]" />
                <span>Core Genres</span>
              </h3>
              <div className="flex flex-wrap gap-2">
                {resolvedCategorized.coreGenres.map((g, idx) => (
                  <span
                    key={`genre-${idx}`}
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--theme-accent)]/15 border border-[var(--theme-accent)]/30 text-[var(--theme-fg)] font-medium text-xs transition hover:border-[var(--theme-accent)] select-none"
                  >
                    <span>{g.name}</span>
                    {g.count > 1 && (
                      <span className="text-[10px] text-[var(--theme-accent)] font-sans font-bold opacity-80">
                        {g.count}
                      </span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Styles & Subgenres */}
          {resolvedCategorized.styles.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-[var(--theme-muted)] uppercase tracking-wider">
                Styles & Subgenres
              </h3>
              <div className="flex flex-wrap gap-2">
                {resolvedCategorized.styles.map((s, idx) => (
                  <span
                    key={`style-${idx}`}
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--theme-surface)] border border-[var(--theme-border)] text-[var(--theme-fg)]/90 text-xs font-medium hover:border-[var(--theme-accent)] transition select-none"
                  >
                    <span>{s.name}</span>
                    {s.count > 1 && (
                      <span className="text-[10px] text-[var(--theme-muted)] font-sans font-medium">
                        {s.count}
                      </span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Community Folksonomy (British, UK, Arrangers, Composers, Cultural tags) */}
          {resolvedCategorized.folksonomy.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-[var(--theme-muted)] uppercase tracking-wider">
                Community Folksonomy & Cultural Context
              </h3>
              <div className="flex flex-wrap gap-2">
                {resolvedCategorized.folksonomy.map((f, idx) => (
                  <span
                    key={`folk-${idx}`}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--theme-card)] border border-[var(--theme-border)] text-[var(--theme-muted)] hover:text-[var(--theme-fg)] text-xs font-medium hover:border-[var(--theme-accent)] transition select-none"
                  >
                    <span>#{f.name}</span>
                    {f.count > 1 && (
                      <span className="text-[10px] text-[var(--theme-accent)] font-sans font-medium">
                        ({f.count})
                      </span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Era & Timeline */}
          {resolvedCategorized.eras.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-[var(--theme-muted)] uppercase tracking-wider">
                Era & Decade
              </h3>
              <div className="flex flex-wrap gap-2">
                {resolvedCategorized.eras.map((er, idx) => (
                  <span
                    key={`era-${idx}`}
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-200/90 text-xs font-medium hover:border-sky-400 transition select-none"
                  >
                    <span>{er.name}</span>
                    {er.count > 1 && (
                      <span className="text-[10px] text-sky-300/70 font-sans font-medium">
                        {er.count}
                      </span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* 3. RATINGS & PUBLIC REVIEWS TAB */}
      {renderReviews && (
        <EntityReviewsSection
          mbid={id}
          type={type}
          title={title}
          subtitle={artist}
          image={image}
          year={year}
          musicbrainzRating={rating}
        />
      )}

      {/* 4. EXTERNAL LINKS & CATALOG TAB */}
      {renderLinks && externalLinks.length > 0 && (
        <section className="space-y-6 animate-fade-in">
          <div className="border-b border-[var(--theme-border)]/50 pb-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[var(--theme-accent)] uppercase tracking-widest">
              <Globe size={15} />
              <span>External Catalog References</span>
            </div>
            <h2 className="text-2xl font-black text-[var(--theme-fg)] tracking-tight font-display mt-0.5">
              Streaming & Open Music Sources
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {externalLinks.map((link, idx) => {
              const url = typeof link === "string" ? link : link.url;
              const sourceName = typeof link === "object" && link.source 
                ? link.source 
                : url.includes("spotify") 
                  ? "Spotify" 
                  : url.includes("apple") 
                    ? "Apple Music" 
                    : url.includes("discogs") 
                      ? "Discogs" 
                      : url.includes("musicbrainz") 
                        ? "MusicBrainz" 
                        : url.includes("wikidata") 
                          ? "Wikidata" 
                          : "Web Link";

              return (
                <a
                  key={`link-${idx}`}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3.5 rounded-2xl bg-[var(--theme-surface)]/60 hover:bg-[var(--theme-card)] border border-[var(--theme-border)] hover:border-[var(--theme-accent)] transition-all duration-200 flex items-center justify-between group cursor-pointer"
                >
                  <div className="min-w-0 pr-2">
                    <span className="text-xs font-bold text-[var(--theme-fg)] group-hover:text-[var(--theme-accent)] transition-colors block truncate">
                      {sourceName}
                    </span>
                    <span className="text-[10px] text-[var(--theme-muted)] truncate block font-sans">
                      {url.replace(/^https?:\/\/(www\.)?/, "")}
                    </span>
                  </div>
                  <ExternalLink size={14} className="text-[var(--theme-muted)] group-hover:text-[var(--theme-accent)] transition-colors shrink-0" />
                </a>
              );
            })}
          </div>
        </section>
      )}

    </div>
  );
}
