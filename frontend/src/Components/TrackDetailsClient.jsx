// src/Components/TrackDetailsClient.jsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { toPng } from "html-to-image";
import { 
  Share2, Copy, Download, QrCode, Settings, Check, 
  ExternalLink, Music, Sparkles, Volume2, X, ChevronRight 
} from "lucide-react";
import Link from "next/link";
export default function TrackDetailsClient({ metadata, platformLinks, currentUrl }) {
  const [preferredPlatform, setPreferredPlatform] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState("obsidian");
  const [showQR, setShowQR] = useState(true);
  const [showYear, setShowYear] = useState(true);
  const [cardDownloading, setCardDownloading] = useState(false);
  const cardRef = useRef(null);

  // Platform styling metadata
  const platformMeta = {
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

  const themes = {
    obsidian: {
      name: "Obsidian Dusk",
      class: "bg-gradient-to-br from-[#07090F] via-[#10141F] to-[#07090F] text-[#F4F7FF] border-[#2563EB]/20",
      glow: "shadow-[0_0_50px_rgba(37,99,235,0.15)]"
    },
    neon: {
      name: "Neon Horizon",
      class: "bg-gradient-to-br from-indigo-950 via-purple-900 to-fuchsia-950 text-white border-purple-800",
      glow: "shadow-[0_0_50px_rgba(168,85,247,0.25)]"
    },
    emerald: {
      name: "Emerald Eclipse",
      class: "bg-gradient-to-br from-emerald-950 via-teal-900 to-cyan-950 text-white border-teal-800",
      glow: "shadow-[0_0_50px_rgba(20,184,166,0.25)]"
    },
    vinyl: {
      name: "Retro Vinyl",
      class: "bg-[#07090F] text-zinc-100 border-[#2563EB]/10 relative overflow-hidden",
      glow: "shadow-[0_0_50px_rgba(0,0,0,0.8)]"
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

  const downloadCard = async () => {
    if (!cardRef.current) return;
    const disabledSheets = [];
    try {
      setCardDownloading(true);
      
      // Temporarily disable cross-origin stylesheets that trigger SecurityError
      if (typeof document !== 'undefined') {
        for (let i = 0; i < document.styleSheets.length; i++) {
          const sheet = document.styleSheets[i];
          try {
            // Attempt to access cssRules to check for cross-origin security restriction
            const _rules = sheet.cssRules;
          } catch (e) {
            if (sheet.ownerNode) {
              sheet.ownerNode.disabled = true;
              disabledSheets.push(sheet.ownerNode);
            }
          }
        }
      }

      // Wait for font load / animations to settle
      await new Promise(r => setTimeout(r, 300));
      
      const dataUrl = await toPng(cardRef.current, {
        quality: 0.95,
        pixelRatio: 2,
        backgroundColor: '#000000',
        style: {
          transform: 'scale(1)',
          borderRadius: '0px'
        }
      });
      
      const link = document.createElement("a");
      link.download = `groovecard-${metadata.title.toLowerCase().replace(/\s+/g, "-")}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Error generating GrooveCard image:", err);
    } finally {
      // Restore disabled stylesheets
      disabledSheets.forEach(node => {
        node.disabled = false;
      });
      setCardDownloading(false);
    }
  };

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(currentUrl)}&color=ffffff&bgcolor=000000&margin=10`;

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8">
      {/* Auto-redirect Banner */}
      {preferredPlatform && platformLinks[preferredPlatform] && (
        <div className="mb-6 p-4 rounded-xl border border-[#2563EB]/15 bg-white/[0.03] backdrop-blur-md flex items-center justify-between text-xs sm:text-sm text-[#F4F7FF]/80 animate-pulse">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-[#60A5FA]" />
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
            className="px-3 py-1 bg-[#2563EB]/10 hover:bg-[#2563EB]/20 rounded-full text-[10px] font-bold uppercase transition"
          >
            Cancel Redirect
          </button>
        </div>
      )}

      {/* Main Track Detail Glass Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Album Artwork & Actions (Left) */}
        <div className="col-span-1 md:col-span-5 flex flex-col items-center">
          <div className="relative group w-64 h-64 sm:w-72 sm:h-72 lg:w-80 lg:h-80 rounded-2xl overflow-hidden shadow-2xl border border-[#2563EB]/15 mb-6 transition-all duration-500 hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(37,99,235,0.15)]">
            <img 
              src={metadata.coverArt} 
              alt={metadata.album} 
              className="w-full h-full object-cover"
              crossOrigin="anonymous"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <span className="text-[10px] text-[#8992A5] font-medium tracking-widest uppercase">Album</span>
              <span className="text-[#F4F7FF] text-sm font-semibold truncate">{metadata.album}</span>
            </div>
          </div>

          <div className="w-full flex flex-col gap-3 px-4">
            <button
              onClick={handleCopyLink}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-[#2563EB]/15 bg-white/[0.03] hover:bg-[#2563EB]/15 text-[#F4F7FF] font-medium text-sm transition-all duration-300 active:scale-95"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-[#60A5FA]" />
                  <span className="text-[#60A5FA]">Link Copied!</span>
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
              className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#10141F] border border-[#2563EB]/15 hover:bg-[#2563EB]/15 hover:border-[#60A5FA]/20 text-[#F4F7FF] font-semibold text-sm transition-all duration-300 active:scale-95 shadow-lg shadow-[#2563EB]/10"
            >
              <Share2 className="w-4 h-4" />
              <span>Share GrooveCard</span>
            </button>
          </div>
        </div>

        {/* Streaming Platform Options (Right) */}
        <div className="col-span-1 md:col-span-7 flex flex-col gap-6">
          <div className="px-4 md:px-0">
            <div className="flex items-center gap-2 text-[#8992A5] text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5 animate-spin" />
              <span>LISTEN LAYER</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#F4F7FF] tracking-tight mb-1 font-display">
              {metadata.title}
            </h1>
            <p className="text-lg text-[#8992A5] font-medium font-body mb-4">
              {metadata.artist}
            </p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[#8992A5]/70 border-t border-[#2563EB]/10 pt-4">
              <span>Album: <strong className="text-[#8992A5]">{metadata.album}</strong></span>
              {metadata.releaseYear && (
                <>
                  <span className="w-1 h-1 rounded-full bg-zinc-700"></span>
                  <span>Year: <strong className="text-[#8992A5]">{metadata.releaseYear}</strong></span>
                </>
              )}
            </div>
            {metadata.originalPlatform === 'spotify' && (
              <div className="mt-3 flex items-center gap-1.5 text-[11px] text-[#8992A5]/70">
                <span>Data and artwork sourced from</span>
                <a 
                  href={platformLinks.spotify} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-[#60A5FA] hover:text-[#60A5FA]/80 font-semibold transition flex items-center gap-0.5"
                >
                  <span>Spotify</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            )}
            {metadata.originalPlatform === 'spotify' && (
              <div className="mt-4 pt-4 border-t border-[#2563EB]/10">
                <Link 
                  href={`/${metadata.type}/${metadata.originalId}`}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#2563EB]/20 bg-[#2563EB]/5 hover:bg-[#2563EB]/15 text-[#F4F7FF] text-xs font-bold uppercase tracking-wider transition-all duration-300"
                >
                  <img src="/in.svg" alt="GrooveEstrella" className="w-4 h-4 object-contain" />
                  <span>Open</span>
                  <ChevronRight className="w-3 h-3 text-[#60A5FA]" />
                </Link>
              </div>
            )}
          </div>

          {/* Platform Grid */}
          <div className="flex flex-col gap-2.5">
            <span className="text-xs font-bold text-[#8992A5] tracking-widest uppercase px-4 md:px-0">
              Select platform to open track:
            </span>
            <div className="space-y-2.5">
              {Object.keys(platformLinks).map((platform) => {
                const url = platformLinks[platform];
                const isPreferred = preferredPlatform === platform;
                const meta = platformMeta[platform] || { name: platform, color: "text-[#8992A5]", btnBg: "bg-[#10141F] text-[#F4F7FF]" };

                return (
                  <div 
                    key={platform}
                    className={`flex items-center justify-between p-3.5 rounded-xl border bg-[#07090F]/40 backdrop-blur-md transition-all duration-300 ${meta.color}`}
                  >
                    <div className="flex items-center gap-3">
                      <Music className="w-5 h-5 opacity-80" />
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-[#F4F7FF]">{meta.name}</span>
                        <button 
                          onClick={() => selectPlatformPreference(platform)}
                          className="text-[10px] text-[#8992A5]/70 hover:text-[#F4F7FF]/80 text-left transition"
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
        </div>
      </div>

      {/* GrooveCard sharing Modal */}
      {showCardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#07090F]/90 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-2xl bg-[#10141F] border border-[#2563EB]/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh]">
            
            {/* Customization controls (Left on desktop) */}
            <div className="flex-1 p-6 border-b md:border-b-0 md:border-r border-[#2563EB]/10 flex flex-col justify-between overflow-y-auto">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-[#F4F7FF] font-display">GrooveCard customizer</h3>
                  <button 
                    onClick={() => setShowCardModal(false)}
                    className="p-1.5 text-[#8992A5] hover:text-[#F4F7FF] rounded-lg hover:bg-[#2563EB]/15 transition md:hidden"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Theme selection */}
                <div className="space-y-4 mb-6">
                  <span className="text-xs font-bold text-[#8992A5] tracking-wider uppercase">Select theme</span>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.keys(themes).map((themeKey) => (
                      <button
                        key={themeKey}
                        onClick={() => setSelectedTheme(themeKey)}
                        className={`p-3 rounded-lg border text-xs font-semibold text-left transition ${
                          selectedTheme === themeKey 
                            ? "border-[#60A5FA] bg-[#10141F] text-[#F4F7FF]" 
                            : "border-[#2563EB]/10 hover:border-[#60A5FA]/20 bg-[#10141F]/70 text-[#8992A5]"
                        }`}
                      >
                        {themes[themeKey].name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Toggles */}
                <div className="space-y-3 mb-6">
                  <span className="text-xs font-bold text-[#8992A5] tracking-wider uppercase">Card Options</span>
                  <div className="flex flex-col gap-2">
                    <label className="flex items-center justify-between p-2.5 rounded-lg bg-[#10141F]/70 border border-[#2563EB]/10 cursor-pointer">
                      <span className="text-xs text-[#F4F7FF]/80">Show QR Code</span>
                      <input 
                        type="checkbox" 
                        checked={showQR}
                        onChange={(e) => setShowQR(e.target.checked)}
                        className="accent-[#2563EB] cursor-pointer"
                      />
                    </label>
                    <label className="flex items-center justify-between p-2.5 rounded-lg bg-[#10141F]/70 border border-[#2563EB]/10 cursor-pointer">
                      <span className="text-xs text-[#F4F7FF]/80">Show Release Year</span>
                      <input 
                        type="checkbox" 
                        checked={showYear}
                        onChange={(e) => setShowYear(e.target.checked)}
                        className="accent-[#2563EB] cursor-pointer"
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4">
                <button
                  onClick={downloadCard}
                  disabled={cardDownloading}
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#10141F] border border-[#2563EB]/15 hover:bg-[#2563EB]/15 text-[#F4F7FF] font-bold text-sm transition-all disabled:opacity-50"
                >
                  {cardDownloading ? (
                    <span>Generating PNG...</span>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Download Image</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowCardModal(false)}
                  className="px-4 py-3 rounded-xl border border-[#2563EB]/10 text-[#F4F7FF]/80 hover:text-[#F4F7FF] hover:bg-[#2563EB]/15 text-sm font-semibold transition hidden md:block"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Preview Box (Right on desktop) */}
            <div className="flex-1 bg-[#07090F] p-8 flex items-center justify-center overflow-y-auto border-t md:border-t-0 border-[#2563EB]/10">
              {/* This is the capture element */}
              <div 
                ref={cardRef}
                id="groovecard-container"
                className={`w-[320px] p-6 rounded-2xl border flex flex-col justify-between aspect-[3/4] ${themes[selectedTheme].class} ${themes[selectedTheme].glow}`}
              >
                {/* Vinyl record overlay for retro vinyl theme */}
                {selectedTheme === "vinyl" && (
                  <div className="absolute -right-16 -top-16 w-48 h-48 rounded-full border-[10px] border-[#10141F] bg-[#10141F]/10 opacity-30 pointer-events-none">
                    <div className="w-full h-full rounded-full border-4 border-dashed border-zinc-700/20"></div>
                  </div>
                )}

                {/* Card Header */}
                <div className="flex items-center justify-between mb-4 z-10">
                  <div className="flex items-center gap-1.5">
                    <Music className="w-4 h-4 text-[#8992A5]" />
                    <span className="text-[10px] tracking-[0.2em] font-extrabold uppercase text-[#8992A5]">GrooveCard</span>
                  </div>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-[#2563EB]/10 border border-[#2563EB]/10">
                    LISTEN LAYER
                  </span>
                </div>

                {/* Album Cover Art */}
                <div className="w-full aspect-square rounded-lg overflow-hidden border border-[#2563EB]/15 shadow-lg mb-4 z-10">
                  <img 
                    src={metadata.coverArt} 
                    alt={metadata.album} 
                    className="w-full h-full object-cover"
                    crossOrigin="anonymous"
                  />
                </div>

                {/* Details Footer */}
                <div className="flex justify-between items-end gap-3 z-10">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-base font-bold truncate leading-snug font-display">{metadata.title}</h4>
                    <p className="text-xs text-[#F4F7FF]/80 font-medium truncate font-body mb-1">{metadata.artist}</p>
                    {showYear && metadata.releaseYear && (
                      <span className="text-[9px] text-[#8992A5] px-1.5 py-0.5 rounded bg-white/[0.03] border border-[#2563EB]/10">
                        {metadata.releaseYear}
                      </span>
                    )}
                    {metadata.originalPlatform === 'spotify' && (
                      <div className="text-[8px] text-[#8992A5] mt-2 flex items-center gap-0.5">
                        <span>Data from</span>
                        <span className="font-bold text-[#1DB954]">Spotify</span>
                      </div>
                    )}
                  </div>

                  {showQR && (
                    <div className="w-16 h-16 bg-white p-1 rounded border border-white/15 shadow-md flex items-center justify-center shrink-0">
                      <img 
                        src={qrImageUrl} 
                        alt="QR Link" 
                        className="w-full h-full object-contain"
                        crossOrigin="anonymous"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Absolute close button */}
            <button 
              onClick={() => setShowCardModal(false)}
              className="absolute top-4 right-4 p-2 text-[#8992A5] hover:text-[#F4F7FF] rounded-lg hover:bg-[#2563EB]/15 transition hidden md:block"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
