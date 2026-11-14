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
  ChevronRight,
  ChevronDown,
  GitFork,
  Radio, 
  Music, 
  Tag,
  Barcode,
  Hash
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
      .map((c) => 127397 + c.charCodeAt(0));
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
  mainCoverUrl = "",
  onRestoreMainCover = null,
}) {
  const [mounted, setMounted] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [switchingId, setSwitchingId] = useState(null);
  const [expandedEditions, setExpandedEditions] = useState({});

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      // Auto-expand the active edition if present
      if (selectedReleaseId) {
        const activeEd = editions.find(e => 
          e.id === selectedReleaseId || (e.pressings || []).some(p => p.id === selectedReleaseId)
        );
        if (activeEd) {
          setExpandedEditions(prev => ({ ...prev, [activeEd.id]: true }));
        }
      }
    } else {
      document.body.style.overflow = "";
      setSearchQuery("");
      setActiveCategory("all");
      setSwitchingId(null);
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, selectedReleaseId, editions]);

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
    const counts = { 
      all: editions.length, 
      original: 0, 
      collector: 0, 
      deluxe: 0, 
      anniversary: 0, 
      remaster: 0, 
      surround: 0, 
      physical: 0 
    };
    editions.forEach((e) => {
      const cat = (e.category || '').toLowerCase();
      if (e.isOriginal || cat === 'original') counts.original++;
      if (cat === 'collector') counts.collector++;
      if (cat === 'anniversary') counts.anniversary++;
      if (cat === 'deluxe' || (e.bonusTracks > 0 && cat !== 'anniversary' && cat !== 'collector')) counts.deluxe++;
      if (cat === 'remaster') counts.remaster++;
      if (cat === 'surround') counts.surround++;
      if ((e.formats || [e.formatFamily]).some(f => f === 'Vinyl' || f === 'SACD' || f === 'Cassette')) counts.physical++;
    });
    return counts;
  }, [editions]);

  // Filtered editions with deep search across pressings
  const filteredEditions = useMemo(() => {
    return editions.filter((ed) => {
      const cat = (ed.category || '').toLowerCase();
      if (activeCategory === "original" && !(ed.isOriginal || cat === "original")) return false;
      if (activeCategory === "collector" && cat !== "collector") return false;
      if (activeCategory === "anniversary" && cat !== "anniversary") return false;
      if (activeCategory === "deluxe" && !(cat === "deluxe" || (ed.bonusTracks > 0 && cat !== "anniversary" && cat !== "collector"))) return false;
      if (activeCategory === "remaster" && cat !== "remaster") return false;
      if (activeCategory === "surround" && cat !== "surround") return false;
      if (activeCategory === "physical" && !(ed.formats || [ed.formatFamily]).some(f => f === "Vinyl" || f === "SACD" || f === "Cassette")) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = (ed.title || '').toLowerCase().includes(q);
        const matchName = (ed.editionName || '').toLowerCase().includes(q);
        const matchYear = ed.year ? String(ed.year).includes(q) : false;
        const matchFormat = (ed.format || '').toLowerCase().includes(q) || (ed.formatFamily || '').toLowerCase().includes(q);
        const matchDisambig = (ed.disambiguation || '').toLowerCase().includes(q);
        const matchCountry = (ed.countries || []).some(c => c.toLowerCase().includes(q));
        const matchLabel = (ed.labels || []).some(l => l.toLowerCase().includes(q));
        
        // Match child pressings inside this edition
        const matchPressings = (ed.pressings || []).some(p => 
          (p.disambiguation || '').toLowerCase().includes(q) ||
          (p.country || '').toLowerCase().includes(q) ||
          (p.catalogNumber || '').toLowerCase().includes(q) ||
          (p.barcode || '').toLowerCase().includes(q) ||
          (p.format || '').toLowerCase().includes(q)
        );

        if (!matchTitle && !matchName && !matchYear && !matchFormat && !matchDisambig && !matchCountry && !matchLabel && !matchPressings) {
          return false;
        }
      }
      return true;
    });
  }, [editions, activeCategory, searchQuery]);

  const toggleExpand = (edId) => {
    setExpandedEditions(prev => ({
      ...prev,
      [edId]: !prev[edId]
    }));
  };

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
            className="fixed inset-0 bg-black/75 backdrop-blur-md cursor-pointer"
          />

          {/* Slide-over Drawer Container - Spacious layout */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="relative w-full max-w-xl sm:max-w-2xl lg:max-w-3xl bg-[var(--theme-card)] border-l border-[var(--theme-border)] shadow-2xl flex flex-col h-full z-10 font-sans overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="px-5 py-4 border-b border-[var(--theme-border)] bg-[var(--theme-surface)]/90 backdrop-blur-xl flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-[var(--theme-accent)]/15 border border-[var(--theme-accent)]/30 flex items-center justify-center shrink-0 text-[var(--theme-accent)] shadow-sm">
                  <Layers size={20} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base sm:text-lg font-bold text-[var(--theme-fg)] truncate flex items-center gap-2">
                    <span>Editions & Pressings</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-[var(--theme-accent)]/20 text-[var(--theme-accent)] font-sans font-bold shrink-0 border border-[var(--theme-accent)]/30">
                      {editions.length}
                    </span>
                  </h2>
                  <p className="text-xs text-[var(--theme-muted)] truncate">
                    Hierarchical tree of album releases, collector's cuts & regional pressings
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

            {/* Highlighted Main Artwork Action Card */}
            {mainCoverUrl && albumCoverUrl && albumCoverUrl !== mainCoverUrl && (
              <div className="mx-4 mt-3.5 p-3 rounded-2xl bg-gradient-to-r from-[var(--theme-surface)] to-[var(--theme-card)] border border-[var(--theme-accent)]/60 shadow-lg shadow-[var(--theme-accent)]/10 flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative w-11 h-11 rounded-xl overflow-hidden shrink-0 border border-white/20 shadow-md">
                    <img src={mainCoverUrl} alt="Main Album Artwork" className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase tracking-wider font-extrabold text-[var(--theme-accent)] block">
                      Custom Edition Cover Active
                    </span>
                    <p className="text-xs font-bold text-[var(--theme-fg)] truncate">
                      Switch back to canonical cover
                    </p>
                  </div>
                </div>
                {onRestoreMainCover && (
                  <button
                    type="button"
                    onClick={onRestoreMainCover}
                    className="px-3 py-1.5 rounded-xl bg-[var(--theme-accent)] hover:opacity-95 active:scale-95 text-[var(--theme-accent-fg)] text-xs font-bold shrink-0 transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles size={13} />
                    <span>Use Main Artwork</span>
                  </button>
                )}
              </div>
            )}

            {/* Filter Tabs & Search Bar */}
            <div className="p-4 border-b border-[var(--theme-border)] bg-[var(--theme-bg)]/40 space-y-3 shrink-0">
              {/* Search Input */}
              <div className="relative">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--theme-muted)]" />
                <input
                  type="text"
                  placeholder="Search editions, collector's, countries, vinyl, catalog #..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2.5 text-xs rounded-xl bg-[var(--theme-surface)] border border-[var(--theme-border)] text-[var(--theme-fg)] placeholder:text-[var(--theme-muted)] focus:outline-none focus:border-[var(--theme-accent)] transition shadow-inner"
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
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none [scrollbar-width:none]">
                {[
                  { key: "all", label: "All", count: categoryCounts.all },
                  { key: "original", label: "Originals", count: categoryCounts.original },
                  { key: "collector", label: "Collector's", count: categoryCounts.collector },
                  { key: "deluxe", label: "Deluxe & Box Sets", count: categoryCounts.deluxe },
                  { key: "anniversary", label: "Anniversary", count: categoryCounts.anniversary },
                  { key: "remaster", label: "Remasters", count: categoryCounts.remaster },
                  { key: "surround", label: "Spatial / Atmos", count: categoryCounts.surround },
                  { key: "physical", label: "Vinyl & Physical", count: categoryCounts.physical },
                ].map((tab) => {
                  if (tab.count === 0 && tab.key !== "all") return null;
                  const isActive = activeCategory === tab.key;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveCategory(tab.key)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
                        isActive
                          ? "bg-[var(--theme-accent)] text-[var(--theme-accent-fg)] shadow-md font-bold"
                          : "bg-[var(--theme-surface)] border border-[var(--theme-border)] text-[var(--theme-muted)] hover:text-[var(--theme-fg)] hover:border-white/20"
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
            </div>

            {/* Scrollable Editions Tree List */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 scrollbar-thin scrollbar-thumb-[var(--theme-border)]">
              {filteredEditions.length === 0 ? (
                <div className="py-20 text-center text-[var(--theme-muted)] space-y-2">
                  <Disc size={36} className="mx-auto opacity-40 animate-pulse" />
                  <p className="text-sm font-medium">No matching editions found</p>
                  <p className="text-xs opacity-75">Try broadening your search query or switching categories</p>
                </div>
              ) : (
                filteredEditions.map((ed, idx) => {
                  const isParentSelected = selectedReleaseId === ed.id || (!selectedReleaseId && ed.isOriginal);
                  const activePressing = (ed.pressings || []).find(p => p.id === selectedReleaseId);
                  const isAnySelectedInEdition = isParentSelected || !!activePressing;
                  const isExpanded = expandedEditions[ed.id] ?? isAnySelectedInEdition;
                  const isCurrentLoading = (switchingId === ed.id) || (loadingTracks && isParentSelected);
                  const coverToUse = ed.coverArt || albumCoverUrl || "https://placehold.co/400x400/17020B/E8A87C?text=Album";
                  const pressingsList = ed.pressings || [];

                  return (
                    <div
                      key={`${ed.id}-${idx}`}
                      className={`relative rounded-2xl border transition-all duration-200 overflow-hidden ${
                        isAnySelectedInEdition
                          ? "bg-[var(--theme-surface)] border-[var(--theme-accent)] shadow-xl ring-1 ring-[var(--theme-accent)]/40"
                          : "bg-[var(--theme-card)]/90 border-[var(--theme-border)] hover:border-white/20 hover:bg-[var(--theme-surface)]/60 shadow-md"
                      }`}
                    >
                      {/* Parent Edition Card Header */}
                      <div className="p-4 sm:p-5">
                        <div className="flex gap-4 items-start">
                          {/* Artwork Thumbnail */}
                          <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-black/40 border border-white/10 shrink-0 shadow-md">
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
                              <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md bg-amber-500 text-black text-[9px] font-black uppercase tracking-wider shadow-sm">
                                1st Press
                              </div>
                            )}
                          </div>

                          {/* Edition Content */}
                          <div className="flex-1 min-w-0 space-y-2">
                            {/* Title & Badge */}
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <h3 className="text-base sm:text-lg font-bold text-[var(--theme-fg)] truncate">
                                {ed.editionName}
                              </h3>

                              {/* Category Badges */}
                              <div className="flex items-center gap-1.5 shrink-0">
                                {ed.category === 'Collector' ? (
                                  <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1 shadow-sm">
                                    <Sparkles size={11} className="text-amber-400" />
                                    <span>Collector's Edition</span>
                                  </span>
                                ) : ed.isOriginal ? (
                                  <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                    Canonical Original
                                  </span>
                                ) : ed.category === 'Anniversary' ? (
                                  <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                    Anniversary
                                  </span>
                                ) : ed.category === 'Deluxe' ? (
                                  <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                    Deluxe / Expanded
                                  </span>
                                ) : ed.category === 'Remaster' ? (
                                  <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                                    Remaster
                                  </span>
                                ) : ed.category === 'Surround' ? (
                                  <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                                    Spatial / Atmos
                                  </span>
                                ) : null}
                              </div>
                            </div>

                            {/* Secondary Variant Title */}
                            {ed.title && ed.title.toLowerCase() !== albumName.toLowerCase() && (
                              <p className="text-xs text-[var(--theme-accent)] font-medium truncate">
                                Release title: <em>"{ed.title}"</em>
                              </p>
                            )}

                            {/* Technical & Tracklist Specs Pill Row */}
                            <div className="flex items-center gap-2 flex-wrap text-xs text-[var(--theme-muted)]">
                              {/* Year / Date */}
                              {ed.year && (
                                <span className="font-semibold text-[var(--theme-fg)] flex items-center gap-1">
                                  <Calendar size={13} className="text-[var(--theme-muted)]" />
                                  {ed.date || ed.year}
                                </span>
                              )}

                              <span>•</span>

                              {/* Formats Pills */}
                              <div className="flex items-center gap-1">
                                {(ed.formats && ed.formats.length > 0 ? ed.formats : [ed.formatFamily || ed.format]).map((fmt) => (
                                  <span
                                    key={fmt}
                                    className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] font-semibold text-[var(--theme-fg)]/90"
                                  >
                                    {fmt}
                                  </span>
                                ))}
                              </div>

                              <span>•</span>

                              {/* Disc & Tracks */}
                              <span className="font-medium">
                                {ed.discCount > 1 ? `${ed.discCount} Discs · ` : ""}{ed.totalTracks} Tracks
                              </span>

                              {/* Bonus tracks badge */}
                              {ed.bonusTracks > 0 && (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 font-bold text-[10px] border border-emerald-500/25">
                                  +{ed.bonusTracks} Bonus Tracks
                                </span>
                              )}
                            </div>

                            {/* Action Row */}
                            <div className="pt-2 flex items-center justify-between gap-3 border-t border-[var(--theme-border)]/50">
                              {/* Countries / Pressing count summary */}
                              <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                                <span className="text-[10px] uppercase font-bold text-[var(--theme-muted)] tracking-wider">
                                  Regions:
                                </span>
                                {ed.countries && ed.countries.length > 0 ? (
                                  ed.countries.slice(0, 4).map((c) => (
                                    <span
                                      key={c}
                                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/5 border border-white/5 text-[10px] font-sans font-medium text-[var(--theme-fg)]/90"
                                      title={c}
                                    >
                                      <span>{getCountryFlag(c)}</span>
                                      <span>{c}</span>
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-[10px] text-[var(--theme-muted)]">Global</span>
                                )}
                                {ed.countries && ed.countries.length > 4 && (
                                  <span className="text-[10px] text-[var(--theme-muted)] font-sans">
                                    +{ed.countries.length - 4} more
                                  </span>
                                )}
                              </div>

                              {/* Switch Edition Button */}
                              <div className="shrink-0">
                                {isParentSelected ? (
                                  <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[var(--theme-accent)]/20 text-[var(--theme-accent)] text-xs font-bold border border-[var(--theme-accent)]/40 shadow-xs">
                                    <Check size={13} />
                                    <span>Active Edition</span>
                                  </div>
                                ) : (
                                  <button
                                    disabled={loadingTracks}
                                    onClick={() => handleSelectEdition(ed.id)}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[var(--theme-accent)] hover:opacity-90 active:scale-95 text-[var(--theme-accent-fg)] text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-50"
                                  >
                                    {isCurrentLoading ? (
                                      <span className="flex items-center gap-1.5">
                                        <span className="w-2.5 h-2.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
                                        <span>Switching...</span>
                                      </span>
                                    ) : (
                                      <>
                                        <span>Switch Edition</span>
                                        <ChevronRight size={13} />
                                      </>
                                    )}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Expandable Tree Trigger Bar */}
                      {pressingsList.length > 0 && (
                        <div className="border-t border-[var(--theme-border)]/50 bg-[var(--theme-surface)]/40">
                          <button
                            type="button"
                            onClick={() => toggleExpand(ed.id)}
                            className="w-full px-4 sm:px-5 py-2.5 flex items-center justify-between text-xs text-[var(--theme-muted)] hover:text-[var(--theme-fg)] hover:bg-white/5 transition cursor-pointer select-none"
                          >
                            <div className="flex items-center gap-2">
                              <GitFork size={14} className="text-[var(--theme-accent)] rotate-90" />
                              <span className="font-semibold text-[var(--theme-fg)]">
                                {pressingsList.length} Regional Pressings & Releases
                              </span>
                              <span className="text-[10px] text-[var(--theme-muted)]">
                                (Click to explore individual pressings)
                              </span>
                            </div>

                            <div className="flex items-center gap-1 font-semibold text-[11px] text-[var(--theme-accent)]">
                              <span>{isExpanded ? "Collapse Tree" : "Expand Tree"}</span>
                              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </div>
                          </button>

                          {/* Nested Tree Leaves: Individual Pressings */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden border-t border-[var(--theme-border)]/40 bg-black/25 px-4 sm:px-6 py-3 space-y-2.5"
                              >
                                {pressingsList.map((pressing, pIdx) => {
                                  const isThisPressingSelected = selectedReleaseId === pressing.id;
                                  const isPressingSwitching = switchingId === pressing.id;

                                  return (
                                    <div
                                      key={`${pressing.id}-${pIdx}`}
                                      className={`relative pl-4 py-2 pr-3 rounded-xl border transition-all text-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 ${
                                        isThisPressingSelected
                                          ? "bg-[var(--theme-accent)]/15 border-[var(--theme-accent)]/60 text-[var(--theme-fg)] shadow-sm"
                                          : "bg-[var(--theme-surface)]/70 border-[var(--theme-border)]/60 hover:border-white/20 text-[var(--theme-muted)]"
                                      }`}
                                    >
                                      {/* Left tree guide bar */}
                                      <div className="absolute left-1 top-2 bottom-2 w-0.5 bg-[var(--theme-accent)]/30 rounded-full" />

                                      {/* Pressing Details */}
                                      <div className="flex-1 min-w-0 space-y-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <span className="text-sm font-sans" title={pressing.country}>
                                            {pressing.countryFlag}
                                          </span>
                                          <span className="font-bold text-[var(--theme-fg)]">
                                            {pressing.country !== 'Global' && pressing.country !== 'XW' ? pressing.country : 'Worldwide'}
                                          </span>
                                          <span className="px-2 py-0.2 rounded-md bg-white/5 border border-white/5 text-[10px] font-semibold text-[var(--theme-fg)]/80">
                                            {pressing.format}
                                          </span>
                                          {pressing.date && (
                                            <span className="text-[11px] text-[var(--theme-muted)]">
                                              {pressing.date}
                                            </span>
                                          )}
                                        </div>

                                        <div className="flex items-center gap-2 flex-wrap text-[11px]">
                                          {pressing.disambiguation && pressing.disambiguation !== 'Standard Release' && (
                                            <span className="text-[var(--theme-accent)] font-medium">
                                              {pressing.disambiguation}
                                            </span>
                                          )}
                                          {pressing.catalogNumber && (
                                            <span className="font-mono text-[10px] text-[var(--theme-muted)] flex items-center gap-0.5">
                                              <Hash size={10} /> Cat: {pressing.catalogNumber}
                                            </span>
                                          )}
                                          {pressing.barcode && (
                                            <span className="font-mono text-[10px] text-[var(--theme-muted)] opacity-80 flex items-center gap-0.5">
                                              <Barcode size={10} /> {pressing.barcode}
                                            </span>
                                          )}
                                        </div>
                                      </div>

                                      {/* Pressing Switch Action */}
                                      <div className="shrink-0 flex items-center justify-end">
                                        {isThisPressingSelected ? (
                                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--theme-accent)]/20 text-[var(--theme-accent)] font-bold text-[11px] border border-[var(--theme-accent)]/30">
                                            <Check size={12} />
                                            <span>Active Pressing</span>
                                          </span>
                                        ) : (
                                          <button
                                            type="button"
                                            disabled={loadingTracks}
                                            onClick={() => handleSelectEdition(pressing.id)}
                                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-[var(--theme-accent)] hover:text-[var(--theme-accent-fg)] text-[var(--theme-fg)] font-semibold text-[11px] transition cursor-pointer active:scale-95 disabled:opacity-40"
                                          >
                                            {isPressingSwitching ? (
                                              <span className="flex items-center gap-1">
                                                <span className="w-2 h-2 rounded-full border border-current border-t-transparent animate-spin" />
                                                <span>Loading...</span>
                                              </span>
                                            ) : (
                                              <>
                                                <span>Switch</span>
                                                <ChevronRight size={11} />
                                              </>
                                            )}
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Drawer Footer with Quick Info */}
            <div className="px-5 py-3 border-t border-[var(--theme-border)] bg-[var(--theme-surface)]/95 backdrop-blur-xl flex items-center justify-between text-xs text-[var(--theme-muted)] shrink-0">
              <span className="truncate">
                Selecting a pressing or edition updates tracklist, bonus songs, and release details.
              </span>
              <button
                onClick={onClose}
                className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-[var(--theme-fg)] font-semibold transition cursor-pointer shrink-0 ml-3"
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
