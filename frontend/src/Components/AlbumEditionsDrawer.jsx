// src/Components/AlbumEditionsDrawer.jsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Layers, 
  Disc, 
  Check, 
  Search, 
  Calendar, 
  Globe, 
  Sparkles, 
  Radio, 
  Music, 
  ChevronRight,
  ExternalLink,
  Tag
} from "lucide-react";
import GrooveLoader from "./GrooveLoader";

function getCountryFlag(code) {
  if (!code || code === 'Global' || code === 'XW') return '🌐';
  if (code === 'XE') return '🇪🇺';
  if (code.length !== 2) return '🌐';
  try {
    const codePoints = code
      .toUpperCase()
      .split('')
      .map(c => 127397 + c.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  } catch (_) {
    return '🌐';
  }
}

export default function AlbumEditionsDrawer({
  isOpen,
  onClose,
  editions = [],
  selectedReleaseId,
  onSwitchEdition,
  loadingTracks = false,
  albumName = "Album",
  albumCoverUrl = "",
}) {
  const [mounted, setMounted] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [switchingId, setSwitchingId] = useState(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      setSearchQuery("");
      setActiveCategory("all");
      setSwitchingId(null);
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose?.();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Categories count
  const categoryCounts = useMemo(() => {
    const counts = { all: editions.length, original: 0, anniversary: 0, deluxe: 0, remaster: 0, physical: 0 };
    editions.forEach((e) => {
      const cat = (e.category || '').toLowerCase();
      if (e.isOriginal || cat === 'original') counts.original++;
      if (cat === 'anniversary') counts.anniversary++;
      if (cat === 'deluxe' || (e.bonusTracks > 0 && cat !== 'anniversary')) counts.deluxe++;
      if (cat === 'remaster' || cat === 'surround') counts.remaster++;
      if (e.formatFamily === 'Vinyl' || e.formatFamily === 'SACD' || e.formatFamily === 'Cassette') counts.physical++;
    });
    return counts;
  }, [editions]);

  // Filtered editions
  const filteredEditions = useMemo(() => {
    return editions.filter((ed) => {
      const cat = (ed.category || '').toLowerCase();
      if (activeCategory === "original" && !(ed.isOriginal || cat === "original")) return false;
      if (activeCategory === "anniversary" && cat !== "anniversary") return false;
      if (activeCategory === "deluxe" && !(cat === "deluxe" || (ed.bonusTracks > 0 && cat !== "anniversary"))) return false;
      if (activeCategory === "remaster" && !(cat === "remaster" || cat === "surround")) return false;
      if (activeCategory === "physical" && !(ed.formatFamily === "Vinyl" || ed.formatFamily === "SACD" || ed.formatFamily === "Cassette")) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = (ed.title || '').toLowerCase().includes(q);
        const matchName = (ed.editionName || '').toLowerCase().includes(q);
        const matchYear = ed.year ? String(ed.year).includes(q) : false;
        const matchFormat = (ed.format || '').toLowerCase().includes(q) || (ed.formatFamily || '').toLowerCase().includes(q);
        const matchDisambig = (ed.disambiguation || '').toLowerCase().includes(q);
        const matchCountry = (ed.countries || []).some(c => c.toLowerCase().includes(q));
        const matchLabel = (ed.labels || []).some(l => l.toLowerCase().includes(q));
        if (!matchTitle && !matchName && !matchYear && !matchFormat && !matchDisambig && !matchCountry && !matchLabel) {
          return false;
        }
      }
      return true;
    });
  }, [editions, activeCategory, searchQuery]);

  const handleSelectEdition = async (id) => {
    if (!id || id === selectedReleaseId || loadingTracks) return;
    setSwitchingId(id);
    try {
      await onSwitchEdition(id);
    } finally {
      setSwitchingId(null);
    }
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[600] flex justify-end">
          {/* Backdrop Blur Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-md cursor-pointer"
          />

          {/* Slide-over Drawer Container */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="relative w-full max-w-xl sm:max-w-2xl bg-[var(--theme-card)] border-l border-[var(--theme-border)] shadow-2xl flex flex-col h-full z-10 font-sans overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="px-5 py-4 border-b border-[var(--theme-border)] bg-[var(--theme-surface)]/85 backdrop-blur-xl flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-[var(--theme-accent)]/15 border border-[var(--theme-accent)]/30 flex items-center justify-center shrink-0 text-[var(--theme-accent)]">
                  <Layers size={20} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base sm:text-lg font-bold text-[var(--theme-fg)] truncate flex items-center gap-2">
                    <span>Editions & Pressings</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--theme-accent)]/20 text-[var(--theme-accent)] font-mono font-bold shrink-0">
                      {editions.length}
                    </span>
                  </h2>
                  <p className="text-xs text-[var(--theme-muted)] truncate">
                    Explore canonical pressings, deluxe remasters & geo releases
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 active:scale-95 text-[var(--theme-fg)] flex items-center justify-center transition border border-[var(--theme-border)] cursor-pointer shrink-0 ml-3"
                title="Close Drawer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Filter Tabs & Search Bar */}
            <div className="p-4 border-b border-[var(--theme-border)] bg-[var(--theme-bg)]/40 space-y-3 shrink-0">
              {/* Search Input */}
              <div className="relative">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--theme-muted)]" />
                <input
                  type="text"
                  placeholder="Filter by year, deluxe, vinyl, country, label..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-[var(--theme-surface)] border border-[var(--theme-border)] text-[var(--theme-fg)] placeholder:text-[var(--theme-muted)] focus:outline-none focus:border-[var(--theme-accent)] transition"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[var(--theme-muted)] hover:text-[var(--theme-fg)]"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-thin scrollbar-thumb-[var(--theme-border)]">
                {[
                  { key: "all", label: "All", count: categoryCounts.all },
                  { key: "original", label: "Originals", count: categoryCounts.original },
                  { key: "deluxe", label: "Deluxe & Box Sets", count: categoryCounts.deluxe },
                  { key: "anniversary", label: "Anniversary", count: categoryCounts.anniversary },
                  { key: "remaster", label: "Remasters", count: categoryCounts.remaster },
                  { key: "physical", label: "Vinyl & SACD", count: categoryCounts.physical },
                ].map((tab) => {
                  if (tab.count === 0 && tab.key !== "all") return null;
                  const isActive = activeCategory === tab.key;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveCategory(tab.key)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
                        isActive
                          ? "bg-[var(--theme-accent)] text-[var(--theme-bg)] shadow-md"
                          : "bg-[var(--theme-surface)] border border-[var(--theme-border)] text-[var(--theme-muted)] hover:text-[var(--theme-fg)] hover:border-[var(--theme-border)]/80"
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span className={`text-[10px] font-mono px-1 rounded-full ${
                        isActive ? "bg-black/20 text-[var(--theme-bg)]" : "bg-white/5 text-[var(--theme-muted)]"
                      }`}>
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Scrollable Editions List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin scrollbar-thumb-[var(--theme-border)]">
              {filteredEditions.length === 0 ? (
                <div className="py-16 text-center text-[var(--theme-muted)] space-y-2">
                  <Disc size={36} className="mx-auto opacity-40 animate-pulse" />
                  <p className="text-sm font-medium">No matching editions found</p>
                  <p className="text-xs opacity-75">Try broadening your search or switching categories</p>
                </div>
              ) : (
                filteredEditions.map((ed, idx) => {
                  const isSelected = selectedReleaseId === ed.id || (!selectedReleaseId && ed.isOriginal);
                  const isCurrentLoading = (switchingId === ed.id) || (loadingTracks && isSelected);
                  const coverToUse = ed.coverArt || albumCoverUrl || "https://placehold.co/400x400/17020B/E8A87C?text=Album";

                  return (
                    <div
                      key={`${ed.id}-${idx}`}
                      className={`relative p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 group ${
                        isSelected
                          ? "bg-[var(--theme-surface)] border-[var(--theme-accent)] shadow-xl ring-1 ring-[var(--theme-accent)]/50"
                          : "bg-[var(--theme-card)]/90 border-[var(--theme-border)] hover:border-white/20 hover:bg-[var(--theme-surface)]/70 shadow-md"
                      }`}
                    >
                      <div className="flex gap-3.5 items-start">
                        {/* Artwork Thumbnail with Zoom on Hover */}
                        <div className="relative w-18 h-18 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-black/30 border border-white/10 shrink-0 shadow-md group-hover:scale-[1.02] transition-transform duration-300">
                          <img
                            src={coverToUse}
                            alt={ed.editionName || ed.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              if (albumCoverUrl && e.currentTarget.src !== albumCoverUrl) {
                                e.currentTarget.src = albumCoverUrl;
                              } else {
                                e.currentTarget.src = "https://placehold.co/300x300/17020B/E8A87C?text=Cover";
                              }
                            }}
                          />
                          {ed.isOriginal && (
                            <div className="absolute top-1 left-1 px-1.5 py-0.2 rounded bg-amber-500 text-black text-[9px] font-black uppercase tracking-wider shadow">
                              ★ 1st
                            </div>
                          )}
                        </div>

                        {/* Edition Details */}
                        <div className="flex-1 min-w-0 space-y-1.5">
                          {/* Title & Tag Badges */}
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <h3 className="text-sm font-bold text-[var(--theme-fg)] truncate">
                              {ed.editionName}
                            </h3>

                            {/* Status / Category Badge */}
                            <div className="flex items-center gap-1.5 shrink-0">
                              {ed.isOriginal ? (
                                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                  Canonical Original
                                </span>
                              ) : ed.category === 'Anniversary' ? (
                                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                  Anniversary
                                </span>
                              ) : ed.category === 'Deluxe' ? (
                                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                  Deluxe / Expanded
                                </span>
                              ) : ed.category === 'Remaster' ? (
                                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                                  Remaster
                                </span>
                              ) : null}
                            </div>
                          </div>

                          {/* Secondary Variant Title (if different from canonical title) */}
                          {ed.title && ed.title.toLowerCase() !== albumName.toLowerCase() && (
                            <p className="text-[11px] text-[var(--theme-accent)] font-medium truncate">
                              Alternate Title: <em>"{ed.title}"</em>
                            </p>
                          )}

                          {/* Technical & Tracklist Specs Pill Row */}
                          <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-[var(--theme-muted)]">
                            {/* Year */}
                            {ed.year && (
                              <span className="font-semibold text-[var(--theme-fg)] flex items-center gap-1">
                                <Calendar size={12} className="text-[var(--theme-muted)]" />
                                {ed.date || ed.year}
                              </span>
                            )}

                            <span>•</span>

                            {/* Format */}
                            <span className="font-medium text-[var(--theme-fg)]/90">
                              {ed.format || ed.formatFamily}
                            </span>

                            <span>•</span>

                            {/* Disc & Tracks */}
                            <span>
                              {ed.discCount > 1 ? `${ed.discCount} Discs · ` : ""}{ed.totalTracks} Tracks
                            </span>

                            {/* Bonus tracks badge */}
                            {ed.bonusTracks > 0 && (
                              <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/15 text-emerald-400 font-bold text-[10px] border border-emerald-500/25">
                                +{ed.bonusTracks} Bonus
                              </span>
                            )}
                          </div>

                          {/* Disambiguation lore / pressing note */}
                          {ed.disambiguation && (
                            <p className="text-[11px] text-[var(--theme-muted)]/80 italic line-clamp-1">
                              Note: {ed.disambiguation}
                            </p>
                          )}

                          {/* Combined Regional Pressings & Labels */}
                          <div className="pt-1.5 flex items-center justify-between gap-2 border-t border-[var(--theme-border)]/50 text-[11px]">
                            {/* Countries List */}
                            <div className="flex items-center gap-1 flex-wrap min-w-0">
                              <span className="text-[10px] uppercase font-bold text-[var(--theme-muted)] tracking-wider">
                                Regions:
                              </span>
                              {ed.countries && ed.countries.length > 0 ? (
                                <>
                                  {ed.countries.slice(0, 5).map((c) => (
                                    <span
                                      key={c}
                                      className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-white/5 border border-white/5 text-[10px] font-mono text-[var(--theme-fg)]/90"
                                      title={c}
                                    >
                                      <span>{getCountryFlag(c)}</span>
                                      <span>{c}</span>
                                    </span>
                                  ))}
                                  {ed.countries.length > 5 && (
                                    <span className="text-[10px] text-[var(--theme-muted)] font-mono">
                                      +{ed.countries.length - 5} more
                                    </span>
                                  )}
                                </>
                              ) : (
                                <span className="text-[10px] text-[var(--theme-muted)]">Global</span>
                              )}

                              {ed.pressingsCount > 1 && (
                                <span className="text-[9px] text-[var(--theme-muted)] opacity-70 ml-1">
                                  ({ed.pressingsCount} pressings combined)
                                </span>
                              )}
                            </div>

                            {/* Action Button */}
                            <div className="shrink-0">
                              {isSelected ? (
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--theme-accent)]/20 text-[var(--theme-accent)] text-xs font-bold border border-[var(--theme-accent)]/30">
                                  <Check size={13} />
                                  <span>Active</span>
                                </div>
                              ) : (
                                <button
                                  disabled={loadingTracks}
                                  onClick={() => handleSelectEdition(ed.id)}
                                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[var(--theme-accent)] hover:opacity-90 active:scale-95 text-[var(--theme-accent-fg)] text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {isCurrentLoading ? (
                                    <span className="flex items-center gap-1">
                                      <span className="w-2.5 h-2.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
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
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Drawer Footer with Quick Info */}
            <div className="px-5 py-3 border-t border-[var(--theme-border)] bg-[var(--theme-surface)]/90 backdrop-blur-xl flex items-center justify-between text-xs text-[var(--theme-muted)] shrink-0">
              <span className="truncate">
                Switching an edition updates the tracklist, bonus songs, and release year.
              </span>
              <button
                onClick={onClose}
                className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-[var(--theme-fg)] font-semibold transition cursor-pointer shrink-0 ml-3"
              >
                Done
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
