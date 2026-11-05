// src/Components/ArtistLinksDrawer.jsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Search, 
  ExternalLink, 
  Globe, 
  Link2, 
  Copy, 
  Check, 
  Radio, 
  Music, 
  Share2, 
  Sparkles,
  BookOpen,
  ShoppingBag,
  Disc,
  Tv,
  FileText,
  Calendar
} from "lucide-react";
import { toast } from "@/lib/toast";

// Rich Platform Icon Mapper
function PlatformIcon({ platform, label }) {
  const p = (platform || "").toLowerCase();
  const l = (label || "").toLowerCase();

  if (p === "instagram" || l.includes("instagram")) {
    return (
      <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 flex items-center justify-center text-white shrink-0 shadow-sm">
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
        </svg>
      </div>
    );
  }

  if (p === "twitter" || l.includes("twitter") || l.includes("x (twitter)")) {
    return (
      <div className="w-8 h-8 rounded-xl bg-black border border-white/20 flex items-center justify-center text-white shrink-0 shadow-sm">
        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      </div>
    );
  }

  if (p === "threads" || l.includes("threads")) {
    return (
      <div className="w-8 h-8 rounded-xl bg-black border border-white/20 flex items-center justify-center text-white shrink-0 shadow-sm font-black text-xs">
        @
      </div>
    );
  }

  if (p === "applemusic" || l.includes("apple music")) {
    return (
      <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#FC3C44] to-[#F94C57] flex items-center justify-center text-white shrink-0 shadow-sm">
        <Music size={16} />
      </div>
    );
  }

  if (p === "spotify" || l.includes("spotify")) {
    return (
      <div className="w-8 h-8 rounded-xl bg-[#1DB954] flex items-center justify-center text-black shrink-0 shadow-sm">
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.503 17.308c-.215.353-.674.464-1.026.248-2.809-1.716-6.345-2.104-10.51-1.152-.403.092-.806-.159-.898-.562-.092-.403.159-.806.562-.898 4.568-1.044 8.484-.606 11.624 1.338.353.216.464.674.248 1.026zm1.468-3.264c-.27.44-.847.578-1.287.308-3.216-1.977-8.118-2.548-11.921-1.393-.497.151-1.027-.133-1.178-.63-.151-.497.133-1.027.63-1.178 4.343-1.318 9.756-.684 13.448 1.586.44.27.578.847.308 1.287zm.126-3.411C15.244 8.353 8.905 8.14 5.187 9.268c-.604.183-1.246-.164-1.429-.768-.183-.604.164-1.246.768-1.429 4.269-1.296 11.277-1.054 15.69 1.567.545.324.726 1.033.402 1.578-.324.545-1.033.726-1.578.402z"/>
        </svg>
      </div>
    );
  }

  if (p === "youtube" || p === "youtubemusic" || l.includes("youtube")) {
    return (
      <div className="w-8 h-8 rounded-xl bg-[#FF0000] flex items-center justify-center text-white shrink-0 shadow-sm">
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
      </div>
    );
  }

  if (p === "amazon" || l.includes("amazon")) {
    return (
      <div className="w-8 h-8 rounded-xl bg-[#00A8E1] flex items-center justify-center text-black font-black text-xs shrink-0 shadow-sm">
        az
      </div>
    );
  }

  if (p === "discogs" || l.includes("discogs")) {
    return (
      <div className="w-8 h-8 rounded-xl bg-black border border-white/20 flex items-center justify-center text-white shrink-0 shadow-sm">
        <Disc size={16} />
      </div>
    );
  }

  if (p === "genius" || l.includes("genius")) {
    return (
      <div className="w-8 h-8 rounded-xl bg-[#ffff64] text-black font-black flex items-center justify-center text-sm shrink-0 shadow-sm">
        G
      </div>
    );
  }

  if (p === "allmusic" || l.includes("allmusic")) {
    return (
      <div className="w-8 h-8 rounded-xl bg-[#0055a5] text-white flex items-center justify-center shrink-0 shadow-sm">
        <Radio size={16} />
      </div>
    );
  }

  if (p === "bandsintown" || l.includes("bandsintown")) {
    return (
      <div className="w-8 h-8 rounded-xl bg-[#00cec9] text-black font-extrabold flex items-center justify-center text-xs shrink-0 shadow-sm">
        BIT
      </div>
    );
  }

  if (p === "imdb" || l.includes("imdb")) {
    return (
      <div className="w-8 h-8 rounded-xl bg-[#f5c518] text-black font-black flex items-center justify-center text-[10px] shrink-0 shadow-sm">
        IMDb
      </div>
    );
  }

  if (p === "imvdb" || l.includes("imvdb")) {
    return (
      <div className="w-8 h-8 rounded-xl bg-[#e53935] text-white font-black flex items-center justify-center text-[9px] shrink-0 shadow-sm">
        MV
      </div>
    );
  }

  if (p === "musixmatch" || l.includes("musixmatch")) {
    return (
      <div className="w-8 h-8 rounded-xl bg-[#ff5e3a] text-white font-black flex items-center justify-center text-[11px] shrink-0 shadow-sm">
        MM
      </div>
    );
  }

  if (p === "bandcamp" || l.includes("bandcamp")) {
    return (
      <div className="w-8 h-8 rounded-xl bg-[#629aa9] text-white font-black flex items-center justify-center text-xs shrink-0 shadow-sm">
        BC
      </div>
    );
  }

  if (p === "tidal" || l.includes("tidal")) {
    return (
      <div className="w-8 h-8 rounded-xl bg-black border border-white/20 text-white font-black flex items-center justify-center text-[10px] shrink-0 shadow-sm">
        TIDAL
      </div>
    );
  }

  if (p === "deezer" || l.includes("deezer")) {
    return (
      <div className="w-8 h-8 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white flex items-center justify-center shrink-0 shadow-sm">
        <Music size={15} />
      </div>
    );
  }

  if (p === "wikidata" || p === "wikipedia" || l.includes("wikipedia")) {
    return (
      <div className="w-8 h-8 rounded-xl bg-white text-black font-serif font-black flex items-center justify-center text-sm shrink-0 shadow-sm">
        W
      </div>
    );
  }

  if (l.includes("homepage") || l.includes("official site") || p === "homepage") {
    return (
      <div className="w-8 h-8 rounded-xl bg-[var(--theme-accent)] text-[var(--theme-accent-fg)] flex items-center justify-center shrink-0 shadow-sm">
        <Globe size={16} />
      </div>
    );
  }

  if (l.includes("library of congress") || l.includes("bnf") || l.includes("dnb")) {
    return (
      <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
        <BookOpen size={15} />
      </div>
    );
  }

  // Fallback
  return (
    <div className="w-8 h-8 rounded-xl bg-[var(--theme-surface)] border border-[var(--theme-border)] text-[var(--theme-fg)] flex items-center justify-center shrink-0 shadow-sm">
      <Link2 size={15} />
    </div>
  );
}

export default function ArtistLinksDrawer({
  isOpen,
  onClose,
  links = [],
  artistName = "Artist",
  artistPhoto = "",
}) {
  const [mounted, setMounted] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedUrl, setCopiedUrl] = useState(null);

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
      setCopiedUrl(null);
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

  // Calculate Category Counts
  const categoryCounts = useMemo(() => {
    const counts = {
      all: links.length,
      streaming: 0,
      social: 0,
      database: 0,
      lyrics: 0,
      live: 0,
      purchase: 0,
      other: 0,
    };

    links.forEach((link) => {
      const cat = (link.category || "other").toLowerCase();
      if (counts[cat] !== undefined) {
        counts[cat]++;
      } else {
        counts.other++;
      }
    });

    return counts;
  }, [links]);

  // Filtered links
  const filteredLinks = useMemo(() => {
    let result = [...links];

    if (activeCategory !== "all") {
      result = result.filter(
        (link) => (link.category || "other").toLowerCase() === activeCategory.toLowerCase()
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((link) => {
        const label = (link.label || "").toLowerCase();
        const platform = (link.platform || "").toLowerCase();
        const url = (link.url || "").toLowerCase();
        const handle = (link.handle || "").toLowerCase();
        return label.includes(q) || platform.includes(q) || url.includes(q) || handle.includes(q);
      });
    }

    return result;
  }, [links, activeCategory, searchQuery]);

  const handleCopyLink = async (e, url) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(url);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch (_) {
      toast.error("Failed to copy link");
    }
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex flex-col justify-end md:justify-center items-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-md cursor-pointer"
          />

          {/* Movable Pull-Down Sheet Container */}
          <motion.div
            initial={{ y: "100%", opacity: 0.8 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.05, bottom: 0.7 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 70 || info.velocity.y > 250) {
                onClose?.();
              }
            }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-xl md:max-w-2xl bg-[var(--theme-card)] border-t md:border border-[var(--theme-border)] rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col max-h-[88vh] z-10 font-sans overflow-hidden touch-pan-y"
          >
            {/* Grab Handle for Pull-Down Gesture */}
            <div 
              className="flex flex-col items-center justify-center pt-2.5 pb-2 cursor-grab active:cursor-grabbing select-none w-full border-b border-[var(--theme-border)]/50 active:bg-white/5 transition-colors shrink-0"
              onClick={onClose}
              title="Pull down or tap to close"
            >
              <div className="w-12 h-1.5 rounded-full bg-[var(--theme-fg)]/25 hover:bg-[var(--theme-fg)]/40 transition-colors" />
              <span className="text-[9px] font-bold tracking-widest uppercase text-[var(--theme-muted)] mt-1">
                Pull down to close
              </span>
            </div>

            {/* Drawer Header */}
            <div className="px-5 py-3.5 border-b border-[var(--theme-border)] bg-[var(--theme-surface)]/85 backdrop-blur-xl flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                {artistPhoto ? (
                  <div className="relative w-10 h-10 rounded-2xl overflow-hidden border border-[var(--theme-border)] shadow shrink-0">
                    <img src={artistPhoto} alt={artistName} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-2xl bg-[var(--theme-accent)]/15 border border-[var(--theme-accent)]/30 flex items-center justify-center shrink-0 text-[var(--theme-accent)]">
                    <Link2 size={20} />
                  </div>
                )}
                <div className="min-w-0">
                  <h2 className="text-base sm:text-lg font-bold text-[var(--theme-fg)] truncate flex items-center gap-2">
                    <span>{artistName} Links</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--theme-accent)]/20 text-[var(--theme-accent)] font-mono font-bold shrink-0">
                      {links.length}
                    </span>
                  </h2>
                  <p className="text-xs text-[var(--theme-muted)] truncate">
                    Streaming, official portals, databases, socials & archives
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
            <div className="p-3.5 sm:p-4 border-b border-[var(--theme-border)] bg-[var(--theme-bg)]/40 space-y-2.5 shrink-0">
              {/* Search Input */}
              <div className="relative">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--theme-muted)]" />
                <input
                  type="text"
                  placeholder="Search links (e.g. Apple Music, Discogs, X, Genius, BnF)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-[var(--theme-surface)] border border-[var(--theme-border)] text-[var(--theme-fg)] placeholder:text-[var(--theme-muted)] focus:outline-none focus:border-[var(--theme-accent)] transition"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--theme-muted)] hover:text-[var(--theme-fg)]"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Category Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                {[
                  { id: "all", label: "All Links", count: categoryCounts.all },
                  { id: "streaming", label: "Streaming", count: categoryCounts.streaming },
                  { id: "social", label: "Social", count: categoryCounts.social },
                  { id: "database", label: "Database", count: categoryCounts.database },
                  { id: "lyrics", label: "Lyrics", count: categoryCounts.lyrics },
                  { id: "live", label: "Live", count: categoryCounts.live },
                  { id: "purchase", label: "Store", count: categoryCounts.purchase },
                  { id: "other", label: "Other", count: categoryCounts.other },
                ]
                  .filter((cat) => cat.id === "all" || cat.count > 0)
                  .map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={`px-3 py-1 text-xs rounded-full whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 font-bold ${
                        activeCategory === cat.id
                          ? "bg-[var(--theme-accent)] text-[var(--theme-accent-fg)] shadow-sm"
                          : "bg-[var(--theme-surface)] text-[var(--theme-muted)] hover:text-[var(--theme-fg)] border border-[var(--theme-border)]"
                      }`}
                    >
                      <span>{cat.label}</span>
                      <span className="text-[10px] opacity-75 font-mono">({cat.count})</span>
                    </button>
                  ))}
              </div>
            </div>

            {/* Links List */}
            <div className="flex-1 overflow-y-auto overscroll-contain p-3.5 sm:p-4 space-y-2">
              {filteredLinks.length === 0 ? (
                <div className="py-12 text-center text-[var(--theme-muted)]">
                  <p className="text-sm font-semibold">No links match your filter</p>
                  <p className="text-xs mt-1">Try clearing search or picking another category</p>
                </div>
              ) : (
                filteredLinks.map((link, idx) => {
                  let domain = "";
                  try {
                    domain = new URL(link.url).hostname.replace(/^www\./, "");
                  } catch (_) {}

                  return (
                    <a
                      key={`${link.url}-${idx}`}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center justify-between p-3 rounded-2xl bg-[var(--theme-surface)]/60 hover:bg-[var(--theme-surface)] border border-[var(--theme-border)] hover:border-[var(--theme-accent)]/50 transition-all duration-200 cursor-pointer shadow-sm"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <PlatformIcon platform={link.platform} label={link.label} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-xs sm:text-sm font-bold text-[var(--theme-fg)] group-hover:text-[var(--theme-accent)] transition-colors truncate">
                              {link.label}
                            </h3>
                            {link.handle && (
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-[var(--theme-card)] text-[var(--theme-muted)] border border-[var(--theme-border)] truncate">
                                {link.handle}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-[var(--theme-muted)] truncate mt-0.5">
                            {domain || link.url}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 ml-3">
                        <button
                          type="button"
                          onClick={(e) => handleCopyLink(e, link.url)}
                          className="w-8 h-8 rounded-lg bg-[var(--theme-card)] hover:bg-[var(--theme-accent)]/20 text-[var(--theme-muted)] hover:text-[var(--theme-accent)] flex items-center justify-center transition border border-[var(--theme-border)]"
                          title="Copy link URL"
                        >
                          {copiedUrl === link.url ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                        </button>
                        <div className="w-8 h-8 rounded-lg bg-[var(--theme-card)] group-hover:bg-[var(--theme-accent)] text-[var(--theme-muted)] group-hover:text-[var(--theme-accent-fg)] flex items-center justify-center transition border border-[var(--theme-border)]">
                          <ExternalLink size={14} />
                        </div>
                      </div>
                    </a>
                  );
                })
              )}
            </div>

            {/* Bottom Footer */}
            <div className="p-3 border-t border-[var(--theme-border)] bg-[var(--theme-surface)]/80 flex items-center justify-between text-[11px] text-[var(--theme-muted)] shrink-0 px-4">
              <span>Verified MusicBrainz & Open Web Links</span>
              <span className="font-mono">{filteredLinks.length} showing</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
