// src/Components/TrackDetailsClient.jsx
"use client";

import React, { useState, useEffect } from "react";
import { 
  Share2, Copy, Check, ExternalLink, Music, 
  Sparkles, Volume2, ChevronRight, Globe 
} from "lucide-react";
import Link from "next/link";
import GrooveCardComposer from "./GrooveCardComposer";

export default function TrackDetailsClient({ metadata, platformLinks, currentUrl }) {
  const [preferredPlatform, setPreferredPlatform] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);

  // Platform styling metadata
  const platformMeta = {
    musicbrainz: {
      name: "MusicBrainz",
      color: "hover:bg-amber-500/20 hover:border-amber-500 text-amber-400 border-amber-500/20",
      btnBg: "bg-amber-500 text-black hover:bg-amber-400",
      accent: "#BA478F"
    },
    spotify: {
      name: "Spotify",
      color: "hover:bg-emerald-500/20 hover:border-emerald-500 text-emerald-400 border-emerald-500/20",
      btnBg: "bg-emerald-500 text-black hover:bg-emerald-400",
      accent: "#1DB954"
    },
    apple_music: {
      name: "Apple Music",
      color: "hover:bg-rose-500/20 hover:border-rose-500 text-rose-400 border-rose-500/20",
      btnBg: "bg-rose-600 text-white hover:bg-rose-500",
      accent: "#FC3C44"
    },
    youtube_music: {
      name: "YouTube Music",
      color: "hover:bg-red-500/20 hover:border-red-500 text-red-400 border-red-500/20",
      btnBg: "bg-red-600 text-white hover:bg-red-500",
      accent: "#FF0000"
    },
    youtube: {
      name: "YouTube",
      color: "hover:bg-red-500/20 hover:border-red-500 text-red-400 border-red-500/20",
      btnBg: "bg-red-600 text-white hover:bg-red-500",
      accent: "#FF0000"
    },
    deezer: {
      name: "Deezer",
      color: "hover:bg-violet-500/20 hover:border-violet-500 text-violet-400 border-violet-500/20",
      btnBg: "bg-violet-600 text-white hover:bg-violet-500",
      accent: "#A238FF"
    },
    tidal: {
      name: "TIDAL",
      color: "hover:bg-cyan-500/20 hover:border-cyan-500 text-cyan-400 border-cyan-500/20",
      btnBg: "bg-cyan-400 text-black hover:bg-cyan-300",
      accent: "#00E6FF"
    },
    soundcloud: {
      name: "SoundCloud",
      color: "hover:bg-orange-500/20 hover:border-orange-500 text-orange-400 border-orange-500/20",
      btnBg: "bg-orange-500 text-white hover:bg-orange-400",
      accent: "#FF5500"
    }
  };

  useEffect(() => {
    // Load platform preference
    const pref = localStorage.getItem("preferred_music_platform");
    setPreferredPlatform(pref);

    // Auto-redirect checks
    const searchParams = new URLSearchParams(window.location.search);
    const bypass = searchParams.get("bypass") === "true" || searchParams.get("redirect") === "false";

    if (pref && platformLinks[pref] && !bypass) {
      // Small delay for redirect UX transition
      const timer = setTimeout(() => {
        window.location.href = platformLinks[pref];
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [platformLinks]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const selectPlatformPreference = (platform) => {
    localStorage.setItem("preferred_music_platform", platform);
    setPreferredPlatform(platform);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8">
      {/* Auto-redirect Banner */}
      {preferredPlatform && platformLinks[preferredPlatform] && (
        <div className="mb-6 p-4 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] backdrop-blur-md flex items-center justify-between text-xs sm:text-sm text-[var(--theme-fg)] animate-pulse shadow-sm">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-[var(--theme-accent)]" />
            <span>Redirecting to <strong>{platformMeta[preferredPlatform]?.name}</strong> automatically...</span>
          </div>
          <button 
            onClick={() => {
              // Add bypass query param to stay on page
              const url = new URL(window.location.href);
              url.searchParams.set("bypass", "true");
              window.history.pushState({}, '', url);
              window.location.reload();
            }}
            className="px-3 py-1 bg-[var(--theme-card)] border border-[var(--theme-border)] hover:bg-[var(--theme-surface)] rounded-full text-[10px] font-bold uppercase transition text-[var(--theme-muted)]"
          >
            Cancel Redirect
          </button>
        </div>
      )}

      {/* Main Track Detail Glass Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Album Artwork & Actions (Left) */}
        <div className="col-span-1 md:col-span-5 flex flex-col items-center">
          <div className="relative group w-64 h-64 sm:w-72 sm:h-72 lg:w-80 lg:h-80 rounded-2xl overflow-hidden shadow-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] mb-6 transition-all duration-500 hover:scale-[1.02]">
            <img 
              src={metadata.coverArt} 
              alt={metadata.album} 
              className="w-full h-full object-cover"
              crossOrigin="anonymous"
              onError={(e) => {
                e.currentTarget.src = 'https://placehold.co/500x500/17020B/E8A87C?text=No+Cover';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <span className="text-[10px] text-zinc-300 font-medium tracking-widest uppercase">Album</span>
              <span className="text-white text-sm font-semibold truncate">{metadata.album}</span>
            </div>
          </div>

          <div className="w-full flex flex-col gap-3 px-4">
            <button
              onClick={handleCopyLink}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] hover:bg-[var(--theme-card)] text-[var(--theme-fg)] font-medium text-sm transition-all duration-300 active:scale-95 shadow-sm cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-[var(--theme-accent)]" />
                  <span className="text-[var(--theme-accent)]">Link Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Universal Link</span>
                </>
              )}
            </button>

            <button
              onClick={() => setShowCardModal(true)}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[var(--theme-accent-bg)] hover:opacity-90 text-[var(--theme-accent-fg)] font-bold text-sm transition-all duration-300 active:scale-95 shadow-md cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span>Create GrooveCard</span>
            </button>
          </div>
        </div>

        {/* Streaming Platform Options (Right) */}
        <div className="col-span-1 md:col-span-7 flex flex-col gap-6">
          <div className="px-4 md:px-0">
            <div className="flex items-center gap-2 text-[var(--theme-muted)] text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5 text-[var(--theme-accent)]" />
              <span>MUSIC LAYER</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--theme-fg)] tracking-tight mb-1 font-display">
              {metadata.title}
            </h1>
            <p className="text-lg text-[var(--theme-muted)] font-medium font-body mb-4">
              {metadata.artist}
            </p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[var(--theme-muted)] border-t border-[var(--theme-border)] pt-4">
              <span>Album: <strong className="text-[var(--theme-fg)]">{metadata.album}</strong></span>
              {(metadata.releaseDate || metadata.releaseYear) && (
                <>
                  <span className="w-1 h-1 rounded-full bg-[var(--theme-border)]"></span>
                  <span>Release: <strong className="text-[var(--theme-fg)]">{metadata.releaseDate || metadata.releaseYear}</strong></span>
                </>
              )}
            </div>
            <div className="mt-4 pt-4 border-t border-[var(--theme-border)] flex items-center justify-between flex-wrap gap-2">
              <Link 
                href={`/${metadata.type}/${metadata.originalId || metadata.id}`}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[var(--theme-border)] bg-[var(--theme-surface)] hover:bg-[var(--theme-card)] text-[var(--theme-fg)] text-xs font-bold uppercase tracking-wider transition-all duration-300"
              >
                <img src="/in.svg" alt="GrooveEstrella" className="w-4 h-4 object-contain" />
                <span>Open in Groove</span>
                <ChevronRight className="w-3 h-3 text-[var(--theme-accent)]" />
              </Link>
            </div>
          </div>

          {/* Platform Grid */}
          <div className="flex flex-col gap-2.5">
            <span className="text-xs font-bold text-[var(--theme-muted)] tracking-widest uppercase px-4 md:px-0">
              Select platform to open track:
            </span>
            <div className="space-y-2.5">
              {Object.keys(platformLinks).map((platform) => {
                const url = platformLinks[platform];
                const isPreferred = preferredPlatform === platform;
                const meta = platformMeta[platform] || { name: platform, color: "text-[var(--theme-muted)]", btnBg: "bg-[var(--theme-card)] text-[var(--theme-fg)]" };

                return (
                  <div 
                    key={platform}
                    className={`flex items-center justify-between p-3.5 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)]/80 backdrop-blur-md transition-all duration-300 shadow-sm ${meta.color}`}
                  >
                    <div className="flex items-center gap-3">
                      <Music className="w-5 h-5 opacity-80" />
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-[var(--theme-fg)]">{meta.name}</span>
                        <button 
                          onClick={() => selectPlatformPreference(platform)}
                          className="text-[10px] text-[var(--theme-muted)] hover:text-[var(--theme-fg)] text-left transition cursor-pointer"
                        >
                          {isPreferred ? "★ Your default preference" : "Set as default platform"}
                        </button>
                      </div>
                    </div>

                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold tracking-wider uppercase transition-all duration-300 active:scale-95 ${meta.btnBg}`}
                    >
                      <span>Play</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Reference, Lyrics, Databases & Community Links */}
          {(() => {
            const knownStreaming = new Set(['spotify', 'apple_music', 'applemusic', 'youtube', 'youtube_music', 'deezer', 'tidal', 'soundcloud', 'musicbrainz']);
            const extraLinks = (metadata?.externalLinks || []).filter(link => {
              return !knownStreaming.has(link.platform?.toLowerCase());
            });

            if (extraLinks.length === 0) return null;

            return (
              <div className="flex flex-col gap-2.5 pt-4 border-t border-[var(--theme-border)]">
                <span className="text-xs font-bold text-[var(--theme-muted)] tracking-widest uppercase px-4 md:px-0 flex items-center gap-2">
                  <Globe size={14} className="text-[var(--theme-accent)]" />
                  <span>Reference, Lyrics & Discography Data</span>
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {extraLinks.map((link, idx) => (
                    <a
                      key={idx}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)]/80 hover:bg-[var(--theme-card)] hover:border-[var(--theme-accent)]/30 transition group shadow-sm"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-[var(--theme-surface)] flex items-center justify-center text-[var(--theme-accent)] flex-shrink-0 group-hover:scale-105 transition">
                          <Globe size={13} />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-bold text-[var(--theme-fg)] group-hover:text-[var(--theme-accent)] truncate transition">
                            {link.label}
                          </span>
                          <span className="text-[10px] text-[var(--theme-muted)] capitalize">
                            {link.category || "Database"}
                          </span>
                        </div>
                      </div>
                      <ExternalLink size={12} className="text-[var(--theme-muted)] group-hover:text-[var(--theme-fg)] flex-shrink-0" />
                    </a>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* GrooveCard Customizer Composer Modal */}
      <GrooveCardComposer
        isOpen={showCardModal}
        onClose={() => setShowCardModal(false)}
        itemId={metadata.originalId || metadata.id}
        title={metadata.title}
        artist={metadata.artist}
        album={metadata.album}
        releaseDate={metadata.releaseDate || (metadata.releaseYear ? String(metadata.releaseYear) : null)}
        releaseYear={metadata.releaseYear}
        imageUrl={metadata.coverArt}
        popularity={metadata.popularity}
        explicit={metadata.explicit}
        type={metadata.type || "track"}
      />
    </div>
  );
}
