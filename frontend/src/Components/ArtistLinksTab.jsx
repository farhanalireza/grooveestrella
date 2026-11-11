// src/Components/ArtistLinksTab.jsx
"use client";

import React, { useState, useMemo } from "react";
import { 
  Globe, 
  ExternalLink, 
  Copy, 
  Check, 
  Search, 
  Music, 
  Radio, 
  Disc, 
  Sparkles,
  Link2
} from "lucide-react";
import { toast } from "@/lib/toast";

function PlatformBadgeIcon({ platform = "", label = "" }) {
  const p = (platform || "").toLowerCase();
  const l = (label || "").toLowerCase();

  if (p === "spotify" || l.includes("spotify")) {
    return (
      <div className="w-8 h-8 rounded-xl bg-[#1DB954] flex items-center justify-center text-black shrink-0 shadow-sm">
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.503 17.308c-.215.353-.674.464-1.026.248-2.809-1.716-6.345-2.104-10.51-1.152-.403.092-.806-.159-.898-.562-.092-.403.159-.806.562-.898 4.568-1.044 8.484-.606 11.624 1.338.353.216.464.674.248 1.026zm1.468-3.264c-.27.44-.847.578-1.287.308-3.216-1.977-8.118-2.548-11.921-1.393-.497.151-1.027-.133-1.178-.63-.151-.497.133-1.027.63-1.178 4.343-1.318 9.756-.684 13.448 1.586.44.27.578.847.308 1.287zm.126-3.411C15.244 8.353 8.905 8.14 5.187 9.268c-.604.183-1.246-.164-1.429-.768-.183-.604.164-1.246.768-1.429 4.269-1.296 11.277-1.054 15.69 1.567.545.324.726 1.033.402 1.578-.324.545-1.033.726-1.578.402z"/>
        </svg>
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

  if (p === "youtube" || p === "youtubemusic" || l.includes("youtube")) {
    return (
      <div className="w-8 h-8 rounded-xl bg-[#FF0000] flex items-center justify-center text-white shrink-0 shadow-sm">
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
      </div>
    );
  }

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

  if (p === "discogs" || l.includes("discogs")) {
    return (
      <div className="w-8 h-8 rounded-xl bg-black border border-white/20 flex items-center justify-center text-white shrink-0 shadow-sm">
        <Disc size={16} />
      </div>
    );
  }

  if (p === "bandcamp" || l.includes("bandcamp")) {
    return (
      <div className="w-8 h-8 rounded-xl bg-[#629aa9] text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-sm">
        BC
      </div>
    );
  }

  if (p === "musicbrainz" || l.includes("musicbrainz")) {
    return (
      <div className="w-8 h-8 rounded-xl bg-[#EB743B] text-black font-black flex items-center justify-center text-xs shrink-0 shadow-sm">
        MB
      </div>
    );
  }

  if (p === "wikidata" || p === "wikipedia" || l.includes("wikipedia")) {
    return (
      <div className="w-8 h-8 rounded-xl bg-white text-black font-black flex items-center justify-center text-sm shrink-0 shadow-sm">
        W
      </div>
    );
  }

  return (
    <div className="w-8 h-8 rounded-xl bg-[var(--theme-card)] border border-[var(--theme-border)] flex items-center justify-center text-[var(--theme-accent)] shrink-0 shadow-sm">
      <Globe size={16} />
    </div>
  );
}

export default function ArtistLinksTab({
  artistName = "Artist",
  externalLinks = [],
  id = "",
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [copiedIndex, setCopiedIndex] = useState(null);

  // Normalize links
  const normalizedLinks = useMemo(() => {
    if (!Array.isArray(externalLinks)) return [];
    return externalLinks.map((item, idx) => {
      const url = typeof item === "string" ? item : item.url || "";
      const platform = typeof item === "object" ? item.platform || item.source || "" : "";
      const label = typeof item === "object" ? item.label || item.name || "" : "";

      let category = "other";
      const u = url.toLowerCase();
      const p = platform.toLowerCase();

      if (
        p.includes("spotify") ||
        p.includes("apple") ||
        p.includes("youtube") ||
        p.includes("bandcamp") ||
        p.includes("soundcloud") ||
        p.includes("tidal") ||
        p.includes("deezer") ||
        p.includes("official") ||
        u.includes("spotify.com") ||
        u.includes("apple.com") ||
        u.includes("youtube.com")
      ) {
        category = "streaming";
      } else if (
        p.includes("instagram") ||
        p.includes("twitter") ||
        p.includes("threads") ||
        p.includes("facebook") ||
        p.includes("tiktok") ||
        u.includes("instagram.com") ||
        u.includes("twitter.com") ||
        u.includes("x.com")
      ) {
        category = "social";
      } else if (
        p.includes("musicbrainz") ||
        p.includes("discogs") ||
        p.includes("wikipedia") ||
        p.includes("wikidata") ||
        p.includes("allmusic") ||
        p.includes("genius")
      ) {
        category = "discography";
      }

      return {
        id: idx,
        url,
        platform: platform || "Web",
        label: label || platform || "Official Link",
        category,
      };
    });
  }, [externalLinks]);

  // Categories
  const categories = [
    { id: "all", label: "All Links", count: normalizedLinks.length },
    {
      id: "streaming",
      label: "Streaming & Official",
      count: normalizedLinks.filter((l) => l.category === "streaming").length,
    },
    {
      id: "social",
      label: "Social Media",
      count: normalizedLinks.filter((l) => l.category === "social").length,
    },
    {
      id: "discography",
      label: "Archives & Lore",
      count: normalizedLinks.filter((l) => l.category === "discography").length,
    },
  ];

  // Filtered links
  const filteredLinks = useMemo(() => {
    return normalizedLinks.filter((l) => {
      const matchesCategory =
        selectedCategory === "all" || l.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        l.label.toLowerCase().includes(q) ||
        l.platform.toLowerCase().includes(q) ||
        l.url.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [normalizedLinks, selectedCategory, searchQuery]);

  const handleCopy = (url, index) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
      toast.success("Link copied to clipboard!");
    }
  };

  return (
    <div className="relative z-10 space-y-8 animate-fade-in max-w-4xl mx-auto px-4 sm:px-6 md:px-8 pb-16">
      <div className="border-b border-[var(--theme-border)]/50 pb-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[var(--theme-accent)] uppercase tracking-widest">
            <Globe size={15} />
            <span>Open Catalog & Streaming</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-[var(--theme-fg)] tracking-tight font-display mt-0.5">
            External Links for {artistName}
          </h2>
        </div>
        <span className="text-xs font-semibold text-[var(--theme-muted)]">
          {filteredLinks.length} verified destinations
        </span>
      </div>

      {/* Search Bar & Category Filter Pills */}
      <div className="space-y-3">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--theme-muted)]"
          />
          <input
            type="text"
            placeholder="Search platforms, streaming services, or socials..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[var(--theme-surface)] border border-[var(--theme-border)] text-xs sm:text-sm text-[var(--theme-fg)] placeholder:text-[var(--theme-muted)] focus:outline-none focus:border-[var(--theme-accent)] transition-colors"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto scrollb-none no-scrollbar py-1">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedCategory === cat.id
                  ? "bg-[var(--theme-accent)] text-[var(--theme-accent-fg)] shadow-xs"
                  : "bg-[var(--theme-surface)] text-[var(--theme-muted)] hover:bg-[var(--theme-card)] hover:text-[var(--theme-fg)]"
              }`}
            >
              <span>{cat.label}</span>
              <span className="text-[10px] opacity-80">({cat.count})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Links Grid */}
      {filteredLinks.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {filteredLinks.map((link, idx) => (
            <div
              key={`link-${link.id || idx}`}
              className="p-3.5 rounded-2xl bg-[var(--theme-surface)]/70 hover:bg-[var(--theme-card)] border border-[var(--theme-border)] hover:border-[var(--theme-accent)] transition-all flex items-center justify-between gap-3 group shadow-xs"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <PlatformBadgeIcon platform={link.platform} label={link.label} />
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs sm:text-sm font-bold text-[var(--theme-fg)] group-hover:text-[var(--theme-accent)] transition-colors truncate">
                    {link.label || link.platform}
                  </h4>
                  <p className="text-[11px] text-[var(--theme-muted)] truncate">
                    {link.url.replace(/^https?:\/\/(www\.)?/, "")}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => handleCopy(link.url, idx)}
                  className="p-2 rounded-xl bg-[var(--theme-card)] hover:bg-[var(--theme-surface)] border border-[var(--theme-border)] text-[var(--theme-muted)] hover:text-[var(--theme-fg)] transition cursor-pointer"
                  title="Copy link"
                >
                  {copiedIndex === idx ? (
                    <Check size={14} className="text-emerald-400" />
                  ) : (
                    <Copy size={14} />
                  )}
                </button>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl bg-[var(--theme-accent)] text-[var(--theme-accent-fg)] hover:opacity-90 transition shadow-xs"
                  title="Open in new tab"
                >
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-8 rounded-3xl bg-[var(--theme-surface)]/50 border border-[var(--theme-border)] text-center space-y-2">
          <p className="text-sm font-bold text-[var(--theme-fg)]">No matching external links</p>
          <p className="text-xs text-[var(--theme-muted)]">
            Try adjusting your search query or switching categories.
          </p>
        </div>
      )}
    </div>
  );
}
