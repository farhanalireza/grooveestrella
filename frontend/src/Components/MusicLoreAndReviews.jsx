// src/Components/MusicLoreAndReviews.jsx
"use client";

import React, { useState, useMemo } from "react";
import { 
  ExternalLink, Tag, BookOpen,
  Sparkles, Globe,
  Disc, Calendar, MapPin, Building, Hash, Layers,
  ChevronRight, ChevronDown, Check, GitFork, Barcode
} from "lucide-react";
import EntityReviewsSection from "./EntityReviewsSection";

function getCountryFlag(code) {
  if (!code || code === 'Global' || code === 'XW') return '🌐';
  if (code === 'XE') return '🇪🇺';
  if (code.length !== 2) return '🌐';
  try {
    const codePoints = code
      .toUpperCase()
      .split('')
      .map((c) => 127397 + c.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  } catch (_) {
    return '🌐';
  }
}

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
  editions = [],
  selectedReleaseId = null,
  onSwitchEdition = null,
  loadingTracks = false,
  onOpenEditionsDrawer = null,
}) {
  const [tabCategory, setTabCategory] = useState("all");
  const [expandedTabEditions, setExpandedTabEditions] = useState({});
  const [switchingTabId, setSwitchingTabId] = useState(null);

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

  const tabCategoryCounts = useMemo(() => {
    const counts = { all: editions.length, original: 0, collector: 0, deluxe: 0, anniversary: 0, remaster: 0, surround: 0, physical: 0 };
    editions.forEach((e) => {
      const cat = (e.category || '').toLowerCase();
      if (e.isOriginal || cat === 'original') counts.original++;
      if (cat === 'collector') counts.collector++;
      if (cat === 'anniversary') counts.anniversary++;
      if (cat === 'deluxe' || (e.bonusTracks > 0 && cat !== 'anniversary' && cat !== 'collector')) counts.deluxe++;
      if (cat === 'remaster') counts.remaster++;
      if (cat === 'surround') counts.surround++;
      if ((e.formats || [e.formatFamily]).some((f) => f === 'Vinyl' || f === 'SACD' || f === 'Cassette')) counts.physical++;
    });
    return counts;
  }, [editions]);

  const filteredTabEditions = useMemo(() => {
    return editions.filter((ed) => {
      const cat = (ed.category || '').toLowerCase();
      if (tabCategory === "original" && !(ed.isOriginal || cat === "original")) return false;
      if (tabCategory === "collector" && cat !== "collector") return false;
      if (tabCategory === "anniversary" && cat !== "anniversary") return false;
      if (tabCategory === "deluxe" && !(cat === "deluxe" || (ed.bonusTracks > 0 && cat !== "anniversary" && cat !== "collector"))) return false;
      if (tabCategory === "remaster" && cat !== "remaster") return false;
      if (tabCategory === "surround" && cat !== "surround") return false;
      if (tabCategory === "physical" && !(ed.formats || [ed.formatFamily]).some((f) => f === "Vinyl" || f === "SACD" || f === "Cassette")) return false;
      return true;
    });
  }, [editions, tabCategory]);

  const toggleTabExpand = (edId) => {
    setExpandedTabEditions((prev) => ({
      ...prev,
      [edId]: !prev[edId],
    }));
  };

  const handleTabSelect = async (relId) => {
    if (!relId || relId === selectedReleaseId || loadingTracks || !onSwitchEdition) return;
    setSwitchingTabId(relId);
    try {
      await onSwitchEdition(relId);
    } finally {
      setSwitchingTabId(null);
    }
  };

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

      {/* 4. EXPANSIVE EDITIONS & REGIONAL PRESSINGS TREE (Full Page Breathing Room) */}
      {renderLinks && editions && editions.length > 0 && (
        <section className="space-y-6 animate-fade-in">
          <div className="border-b border-[var(--theme-border)]/50 pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-[var(--theme-accent)] uppercase tracking-widest">
                <Layers size={15} />
                <span>Editions & Pressings Tree</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-[var(--theme-fg)] tracking-tight font-display mt-1">
                Release Tree & Regional Pressings
              </h2>
              <p className="text-xs sm:text-sm text-[var(--theme-muted)] mt-1">
                Explore canonical master pressings, collector's cuts, deluxe remasters and worldwide regional pressings.
              </p>
            </div>

            {onOpenEditionsDrawer && (
              <button
                type="button"
                onClick={onOpenEditionsDrawer}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 text-xs font-bold text-[var(--theme-fg)] border border-[var(--theme-border)] transition cursor-pointer shrink-0 shadow-sm"
              >
                <Layers size={13} className="text-[var(--theme-accent)]" />
                <span>Open Slide Sheet</span>
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none [scrollbar-width:none]">
            {[
              { key: "all", label: "All Editions", count: tabCategoryCounts.all },
              { key: "original", label: "Originals", count: tabCategoryCounts.original },
              { key: "collector", label: "Collector's", count: tabCategoryCounts.collector },
              { key: "deluxe", label: "Deluxe & Box Sets", count: tabCategoryCounts.deluxe },
              { key: "anniversary", label: "Anniversary", count: tabCategoryCounts.anniversary },
              { key: "remaster", label: "Remasters", count: tabCategoryCounts.remaster },
              { key: "surround", label: "Spatial / Atmos", count: tabCategoryCounts.surround },
              { key: "physical", label: "Vinyl & Physical", count: tabCategoryCounts.physical },
            ].map((tab) => {
              if (tab.count === 0 && tab.key !== "all") return null;
              const isActive = tabCategory === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setTabCategory(tab.key)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
                    isActive
                      ? "bg-[var(--theme-accent)] text-[var(--theme-accent-fg)] font-bold shadow-md"
                      : "bg-[var(--theme-surface)]/80 border border-[var(--theme-border)] text-[var(--theme-muted)] hover:text-[var(--theme-fg)] hover:border-white/20"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`text-[10px] font-sans font-semibold px-1.5 py-0.2 rounded-full ${
                    isActive ? "bg-black/20 text-white" : "bg-white/5 text-[var(--theme-muted)]"
                  }`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Expansive Editions Cards */}
          <div className="space-y-4">
            {filteredTabEditions.map((ed, edIdx) => {
              const isParentActive = selectedReleaseId === ed.id || (!selectedReleaseId && ed.isOriginal);
              const activePressing = (ed.pressings || []).find(p => p.id === selectedReleaseId);
              const isAnyActive = isParentActive || !!activePressing;
              const isExpanded = expandedTabEditions[ed.id] ?? isAnyActive;
              const isSwitching = switchingTabId === ed.id || (loadingTracks && isParentActive);
              const coverUrl = ed.coverArt || image || "https://placehold.co/400x400/17020B/E8A87C?text=Album";
              const pressingsList = ed.pressings || [];

              return (
                <div
                  key={`${ed.id}-${edIdx}`}
                  className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                    isAnyActive
                      ? "bg-[var(--theme-surface)] border-[var(--theme-accent)] shadow-xl ring-1 ring-[var(--theme-accent)]/40"
                      : "bg-[var(--theme-card)]/80 border-[var(--theme-border)] hover:border-white/20 hover:bg-[var(--theme-surface)]/60 shadow-md"
                  }`}
                >
                  {/* Edition Parent Header */}
                  <div className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start">
                      {/* Artwork */}
                      <div className="relative w-20 h-20 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-black/40 border border-white/10 shrink-0 shadow-lg">
                        <img
                          src={coverUrl}
                          alt={ed.editionName || ed.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            if (image && e.currentTarget.src !== image) {
                              e.currentTarget.src = image;
                            } else {
                              e.currentTarget.src = "https://placehold.co/300x300/17020B/E8A87C?text=Cover";
                            }
                          }}
                        />
                        {ed.isOriginal && (
                          <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md bg-amber-500 text-black text-[9px] font-black uppercase tracking-wider shadow-sm">
                            1st Press
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 space-y-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h3 className="text-lg sm:text-xl font-bold text-[var(--theme-fg)] truncate">
                            {ed.editionName}
                          </h3>

                          {/* Category Badge */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            {ed.category === 'Collector' ? (
                              <span className="text-[11px] font-black px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1 shadow-sm">
                                <Sparkles size={12} className="text-amber-400" />
                                <span>Collector's Edition</span>
                              </span>
                            ) : ed.isOriginal ? (
                              <span className="text-[11px] font-extrabold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                Canonical Original
                              </span>
                            ) : ed.category === 'Anniversary' ? (
                              <span className="text-[11px] font-extrabold px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                Anniversary
                              </span>
                            ) : ed.category === 'Deluxe' ? (
                              <span className="text-[11px] font-extrabold px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                Deluxe / Expanded
                              </span>
                            ) : ed.category === 'Remaster' ? (
                              <span className="text-[11px] font-extrabold px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                                Remaster
                              </span>
                            ) : ed.category === 'Surround' ? (
                              <span className="text-[11px] font-extrabold px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                                Spatial / Atmos
                              </span>
                            ) : null}
                          </div>
                        </div>

                        {/* Subtitle / Disambiguation */}
                        {ed.title && ed.title.toLowerCase() !== title.toLowerCase() && (
                          <p className="text-xs sm:text-sm text-[var(--theme-accent)] font-medium">
                            Variant Title: <em>"{ed.title}"</em>
                          </p>
                        )}

                        {/* Specs Row */}
                        <div className="flex items-center gap-2.5 flex-wrap text-xs sm:text-sm text-[var(--theme-muted)]">
                          {ed.year && (
                            <span className="font-semibold text-[var(--theme-fg)] flex items-center gap-1">
                              <Calendar size={14} className="text-[var(--theme-muted)]" />
                              {ed.date || ed.year}
                            </span>
                          )}

                          <span>•</span>

                          {/* Formats */}
                          <div className="flex items-center gap-1">
                            {(ed.formats && ed.formats.length > 0 ? ed.formats : [ed.formatFamily || ed.format]).map((fmt) => (
                              <span
                                key={fmt}
                                className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[11px] font-semibold text-[var(--theme-fg)]/90"
                              >
                                {fmt}
                              </span>
                            ))}
                          </div>

                          <span>•</span>

                          <span className="font-medium">
                            {ed.discCount > 1 ? `${ed.discCount} Discs · ` : ""}{ed.totalTracks} Tracks
                          </span>

                          {ed.bonusTracks > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 font-bold text-[11px] border border-emerald-500/25">
                              +{ed.bonusTracks} Bonus
                            </span>
                          )}
                        </div>

                        {/* Bottom Actions Row */}
                        <div className="pt-3 flex items-center justify-between gap-4 border-t border-[var(--theme-border)]/50">
                          {/* Regions Summary */}
                          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                            <span className="text-[11px] uppercase font-bold text-[var(--theme-muted)] tracking-wider">
                              Regions:
                            </span>
                            {ed.countries && ed.countries.length > 0 ? (
                              ed.countries.slice(0, 5).map((c) => (
                                <span
                                  key={c}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-[11px] font-sans font-medium text-[var(--theme-fg)]/90"
                                  title={c}
                                >
                                  <span>{getCountryFlag(c)}</span>
                                  <span>{c}</span>
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-[var(--theme-muted)]">Global</span>
                            )}
                            {ed.countries && ed.countries.length > 5 && (
                              <span className="text-xs text-[var(--theme-muted)] font-sans">
                                +{ed.countries.length - 5} more
                              </span>
                            )}
                          </div>

                          {/* Switch Button */}
                          <div className="shrink-0">
                            {isParentActive ? (
                              <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[var(--theme-accent)]/20 text-[var(--theme-accent)] text-xs font-bold border border-[var(--theme-accent)]/40 shadow-xs">
                                <Check size={14} />
                                <span>Active Edition</span>
                              </div>
                            ) : (
                              <button
                                disabled={loadingTracks}
                                onClick={() => handleTabSelect(ed.id)}
                                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[var(--theme-accent)] hover:opacity-90 active:scale-95 text-[var(--theme-accent-fg)] text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-50"
                              >
                                {isSwitching ? (
                                  <span className="flex items-center gap-1.5">
                                    <span className="w-2.5 h-2.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
                                    <span>Switching...</span>
                                  </span>
                                ) : (
                                  <>
                                    <span>Switch Edition</span>
                                    <ChevronRight size={14} />
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expandable Tree Branch */}
                  {pressingsList.length > 0 && (
                    <div className="border-t border-[var(--theme-border)]/50 bg-[var(--theme-surface)]/30">
                      <button
                        type="button"
                        onClick={() => toggleTabExpand(ed.id)}
                        className="w-full px-4 sm:px-6 py-3 flex items-center justify-between text-xs sm:text-sm text-[var(--theme-muted)] hover:text-[var(--theme-fg)] hover:bg-white/5 transition cursor-pointer select-none"
                      >
                        <div className="flex items-center gap-2">
                          <GitFork size={15} className="text-[var(--theme-accent)] rotate-90" />
                          <span className="font-semibold text-[var(--theme-fg)]">
                            {pressingsList.length} Regional Pressings & Releases
                          </span>
                          <span className="text-xs text-[var(--theme-muted)] hidden sm:inline">
                            — view all country releases, catalog numbers & barcodes
                          </span>
                        </div>

                        <div className="flex items-center gap-1 font-semibold text-xs text-[var(--theme-accent)]">
                          <span>{isExpanded ? "Hide Pressings" : "View Pressings"}</span>
                          {isExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                        </div>
                      </button>

                      {/* Nested Tree Leaves */}
                      {isExpanded && (
                        <div className="border-t border-[var(--theme-border)]/40 bg-black/25 px-4 sm:px-8 py-4 space-y-3">
                          {pressingsList.map((pressing, pIdx) => {
                            const isThisPressingSelected = selectedReleaseId === pressing.id;
                            const isPressingSwitching = switchingTabId === pressing.id;

                            return (
                              <div
                                key={`${pressing.id}-${pIdx}`}
                                className={`relative pl-4 py-2.5 pr-4 rounded-xl border transition-all text-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
                                  isThisPressingSelected
                                    ? "bg-[var(--theme-accent)]/15 border-[var(--theme-accent)]/60 text-[var(--theme-fg)] shadow-sm"
                                    : "bg-[var(--theme-surface)]/70 border-[var(--theme-border)]/60 hover:border-white/20 text-[var(--theme-muted)]"
                                }`}
                              >
                                {/* Left tree stem indicator */}
                                <div className="absolute left-1 top-2 bottom-2 w-0.5 bg-[var(--theme-accent)]/40 rounded-full" />

                                <div className="flex-1 min-w-0 space-y-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-base font-sans" title={pressing.country}>
                                      {pressing.countryFlag}
                                    </span>
                                    <span className="font-bold text-[var(--theme-fg)]">
                                      {pressing.country !== 'Global' && pressing.country !== 'XW' ? pressing.country : 'Worldwide'}
                                    </span>
                                    <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-[11px] font-semibold text-[var(--theme-fg)]/80">
                                      {pressing.format}
                                    </span>
                                    {pressing.date && (
                                      <span className="text-xs text-[var(--theme-muted)]">
                                        {pressing.date}
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-3 flex-wrap text-xs">
                                    {pressing.disambiguation && pressing.disambiguation !== 'Standard Release' && (
                                      <span className="text-[var(--theme-accent)] font-medium">
                                        {pressing.disambiguation}
                                      </span>
                                    )}
                                    {pressing.catalogNumber && (
                                      <span className="font-mono text-[11px] text-[var(--theme-muted)] flex items-center gap-1">
                                        <Hash size={11} /> Cat: {pressing.catalogNumber}
                                      </span>
                                    )}
                                    {pressing.barcode && (
                                      <span className="font-mono text-[11px] text-[var(--theme-muted)] opacity-80 flex items-center gap-1">
                                        <Barcode size={11} /> {pressing.barcode}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="shrink-0 flex items-center justify-end">
                                  {isThisPressingSelected ? (
                                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[var(--theme-accent)]/20 text-[var(--theme-accent)] font-bold text-xs border border-[var(--theme-accent)]/30">
                                      <Check size={13} />
                                      <span>Active Pressing</span>
                                    </span>
                                  ) : (
                                    <button
                                      type="button"
                                      disabled={loadingTracks}
                                      onClick={() => handleTabSelect(pressing.id)}
                                      className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-white/10 hover:bg-[var(--theme-accent)] hover:text-[var(--theme-accent-fg)] text-[var(--theme-fg)] font-semibold text-xs transition cursor-pointer active:scale-95 disabled:opacity-40"
                                    >
                                      {isPressingSwitching ? (
                                        <span className="flex items-center gap-1">
                                          <span className="w-2.5 h-2.5 rounded-full border border-current border-t-transparent animate-spin" />
                                          <span>Loading...</span>
                                        </span>
                                      ) : (
                                        <>
                                          <span>Switch</span>
                                          <ChevronRight size={12} />
                                        </>
                                      )}
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 5. EXTERNAL LINKS & CATALOG TAB */}
      {renderLinks && externalLinks.length > 0 && (
        <section className="space-y-6 animate-fade-in pt-4">
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
