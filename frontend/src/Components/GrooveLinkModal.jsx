// src/Components/GrooveLinkModal.jsx
"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Copy, 
  Check, 
  Share2, 
  ExternalLink, 
  Sparkles, 
  QrCode, 
  Music, 
  Disc, 
  Users, 
  Globe, 
  Maximize2,
  CheckCircle2
} from "lucide-react";
import { toast } from "@/lib/toast";
import { shareLink, getShareData } from "@/lib/shareHelper";
import { generatePlatformLinks } from "@/lib/musicProviders";
import GrooveCardComposer from "./GrooveCardComposer";

// Inline platform SVG icons
const PlatformIcons = {
  spotify: (
    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.516 17.31a.754.754 0 0 1-1.037.248c-2.84-1.735-6.416-2.128-10.627-1.166a.75.75 0 0 1-.336-1.462c4.606-1.052 8.563-.61 11.752 1.343.364.223.477.7.248 1.037zm1.472-3.275a.94.94 0 0 1-1.296.31c-3.25-1.998-8.204-2.576-12.049-1.408a.939.939 0 0 1-.555-1.794c4.394-1.334 9.855-.688 13.59 1.606.425.26.56.816.31 1.286zm.126-3.41c-3.896-2.314-10.32-2.528-14.04-1.398a1.127 1.127 0 0 1-.655-2.158c4.275-1.298 11.369-1.045 15.86 1.623.497.295.66 936.365 1.433-.295.498-.936.66-1.53.5z"/>
    </svg>
  ),
  apple_music: (
    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.63-.76 1.05-1.83.93-2.89-.92.04-2.02.62-2.67 1.38-.58.67-1.09 1.76-.95 2.81 1.03.08 2.06-.54 2.69-1.3"/>
    </svg>
  ),
  youtube_music: (
    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
      <path d="M12 0C5.376 0 0 5.376 0 12s5.376 12 12 12 12-5.376 12-12S18.624 0 12 0zm0 19.5a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15zm-2.25-11.25v7.5l6-3.75-6-3.75z"/>
    </svg>
  ),
  youtube: (
    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  ),
  tidal: (
    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
      <path d="M12.012 3.992L8.008 7.996 4.004 3.992 0 7.996l4.004 4.004 4.004-4.004 4.004 4.004 4.004-4.004-4.004-4.004zm-8.008 8.008L0 16.004l4.004 4.004 4.004-4.004-4.004-4.004zm8.008 0L8.008 16.004l4.004 4.004 4.004-4.004-4.004-4.004zm8.008-8.008l-4.004 4.004 4.004 4.004 4.004-4.004-4.004-4.004z"/>
    </svg>
  ),
  deezer: (
    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
      <path d="M18.8 6.5h4.2V9H18.8zm0 3.8h4.2v2.5H18.8zm0 3.8h4.2v2.5H18.8zm0 3.7h4.2v2.5H18.8zm-6.2-3.7h4.2v2.5h-4.2zm0 3.7h4.2v2.5h-4.2zm-6.3 0h4.2v2.5H6.3zm-5.3 0h4.2v2.5H1z"/>
    </svg>
  ),
  soundcloud: (
    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
      <path d="M1.175 12.225c-.092 0-.175.083-.175.175v4.5c0 .092.083.175.175.175s.175-.083.175-.175v-4.5c0-.092-.083-.175-.175-.175zm1.4 -1.05c-.1 0-.175.083-.175.175v6.6c0 .1.075.175.175.175s.175-.075.175-.175v-6.6c0-.092-.075-.175-.175-.175zm1.4-1.325c-.1 0-.175.075-.175.175v9.25c0 .1.075.175.175.175s.175-.075.175-.175v-9.25c0-.1-.075-.175-.175-.175zm1.4-1.075c-.1 0-.175.075-.175.175v11.4c0 .1.075.175.175.175s.175-.075.175-.175v-11.4c0-.1-.075-.175-.175-.175zm1.4-.425c-.1 0-.175.075-.175.175v12.25c0 .1.075.175.175.175s.175-.075.175-.175V8.525c0-.1-.075-.175-.175-.175zm1.4-.7c-.1 0-.175.075-.175.175v13.65c0 .1.075.175.175.175s.175-.075.175-.175V7.825c0-.1-.075-.175-.175-.175zm1.4.35c-.1 0-.175.075-.175.175v12.95c0 .1.075.175.175.175s.175-.075.175-.175V8.175c0-.1-.075-.175-.175-.175zm1.4 1.4c-.1 0-.175.075-.175.175v10.15c0 .1.075.175.175.175s.175-.075.175-.175V9.575c0-.1-.075-.175-.175-.175zm7.3 1.225a4.27 4.27 0 0 0-2.025.525 3.32 3.32 0 0 0-2.875-1.6c-.4 0-.775.075-1.125.2v9.3h9.8a3.7 3.7 0 0 0 .1-7.4c-.1 0-.25 0-.375.025a4.27 4.27 0 0 0-3.5-1.05z"/>
    </svg>
  ),
  musicbrainz: (
    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
      <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm1 14.5h-2v-5h2v5zm0-7h-2V7.5h2V9.5z"/>
    </svg>
  )
};

const platformMeta = {
  spotify: {
    name: "Spotify",
    textColor: "text-emerald-400",
    borderHover: "hover:border-emerald-500/50 hover:bg-emerald-500/10",
    btnBg: "bg-emerald-500 text-black hover:bg-emerald-400",
    icon: PlatformIcons.spotify
  },
  apple_music: {
    name: "Apple Music",
    textColor: "text-rose-400",
    borderHover: "hover:border-rose-500/50 hover:bg-rose-500/10",
    btnBg: "bg-rose-600 text-white hover:bg-rose-500",
    icon: PlatformIcons.apple_music
  },
  youtube_music: {
    name: "YouTube Music",
    textColor: "text-red-400",
    borderHover: "hover:border-red-500/50 hover:bg-red-500/10",
    btnBg: "bg-red-600 text-white hover:bg-red-500",
    icon: PlatformIcons.youtube_music
  },
  youtube: {
    name: "YouTube",
    textColor: "text-red-400",
    borderHover: "hover:border-red-500/50 hover:bg-red-500/10",
    btnBg: "bg-red-600 text-white hover:bg-red-500",
    icon: PlatformIcons.youtube
  },
  tidal: {
    name: "TIDAL",
    textColor: "text-cyan-400",
    borderHover: "hover:border-cyan-500/50 hover:bg-cyan-500/10",
    btnBg: "bg-cyan-400 text-black hover:bg-cyan-300",
    icon: PlatformIcons.tidal
  },
  deezer: {
    name: "Deezer",
    textColor: "text-violet-400",
    borderHover: "hover:border-violet-500/50 hover:bg-violet-500/10",
    btnBg: "bg-violet-600 text-white hover:bg-violet-500",
    icon: PlatformIcons.deezer
  },
  soundcloud: {
    name: "SoundCloud",
    textColor: "text-orange-400",
    borderHover: "hover:border-orange-500/50 hover:bg-orange-500/10",
    btnBg: "bg-orange-500 text-white hover:bg-orange-400",
    icon: PlatformIcons.soundcloud
  },
  musicbrainz: {
    name: "MusicBrainz",
    textColor: "text-amber-400",
    borderHover: "hover:border-amber-500/50 hover:bg-amber-500/10",
    btnBg: "bg-amber-500 text-black hover:bg-amber-400",
    icon: PlatformIcons.musicbrainz
  }
};

export default function GrooveLinkModal({ isOpen, onClose, item, onOpenGrooveCard }) {
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [preferredPlatform, setPreferredPlatform] = useState(null);
  const [showQR, setShowQR] = useState(false);
  const [qrFullScreen, setQrFullScreen] = useState(false);
  const [showGrooveCard, setShowGrooveCard] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      const pref = localStorage.getItem("preferred_music_platform");
      setPreferredPlatform(pref);
    }
  }, []);

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      setShowQR(false);
      setQrFullScreen(false);
      setShowGrooveCard(false);
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleCloseQrFullScreen = useCallback(() => {
    setQrFullScreen(false);
    onClose?.();
  }, [onClose]);

  const handleOpenQrFullScreen = () => {
    setShowGrooveCard(false);
    setQrFullScreen(true);
  };

  const handleOpenGrooveCard = () => {
    setShowGrooveCard(false);
    if (onOpenGrooveCard) {
      onClose?.();
      onOpenGrooveCard();
    } else {
      setShowGrooveCard(true);
    }
  };

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (qrFullScreen) {
          handleCloseQrFullScreen();
        } else if (isOpen) {
          onClose?.();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, qrFullScreen, onClose, handleCloseQrFullScreen]);

  const safeItem = item || {};
  const itemType = safeItem.type || "track";
  const itemId = safeItem.id || safeItem.trackId || safeItem.mbid || "";
  const title = safeItem.name || safeItem.title || "Untitled";

  // Format artists into string
  const artistsString = useMemo(() => {
    if (!item) return "Unknown Artist";
    if (Array.isArray(item.artists)) {
      return item.artists.map(a => typeof a === "object" ? a.name : a).join(", ");
    }
    if (Array.isArray(item.artist)) {
      return item.artist.map(a => typeof a === "object" ? a.name : a).join(", ");
    }
    if (typeof item.artist === "string") return item.artist;
    if (itemType === "artist") return title;
    return "Unknown Artist";
  }, [item, itemType, title]);

  const coverUrl = safeItem.coverArt || safeItem.imageUrl || safeItem.url || safeItem.images?.[0]?.url || safeItem.album?.images?.[0]?.url || "https://placehold.co/400x400/17020B/E8A87C?text=Groove";

  // Generate platform links
  const platformLinks = useMemo(() => {
    if (!item) return {};
    const metadata = {
      title,
      artist: artistsString,
      type: itemType,
      originalPlatform: "musicbrainz",
      originalId: itemId,
      mbid: itemId
    };
    const links = generatePlatformLinks(metadata);

    // If item has direct links, respect them
    if (item.spoURL || item.external_urls?.spotify || item.spotifyUrl) {
      links.spotify = item.spoURL || item.external_urls?.spotify || item.spotifyUrl;
    }
    if (item.YTURL || item.ytUrl) {
      links.youtube = item.YTURL || item.ytUrl;
    }

    return links;
  }, [item, title, artistsString, itemType, itemId]);

  // Canonical share URL pointing directly to this item
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const shareUrl = itemId ? `${origin}/${itemType}/${itemId}` : (typeof window !== "undefined" ? window.location.href.split("?")[0] : "");

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&color=000000&bgcolor=ffffff&ecc=H&data=${encodeURIComponent(shareUrl)}`;

  const handleCopyLink = async () => {
    const { fullText } = getShareData({
      name: title,
      title: title,
      artist: artistsString,
      type: itemType,
      id: itemId,
    });
    if (typeof window !== "undefined" && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(fullText);
        setCopied(true);
        toast.success("Link copied to clipboard! 📋");
        setTimeout(() => setCopied(false), 2000);
      } catch (_) {
        toast.info(shareUrl);
      }
    }
  };

  const handleNativeShare = async () => {
    await shareLink({
      name: title,
      title: title,
      artist: artistsString,
      artists: item.artists || item.artist,
      type: itemType,
      id: itemId,
    });
  };

  const selectPlatformPreference = (platform) => {
    if (preferredPlatform === platform) {
      localStorage.removeItem("preferred_music_platform");
      setPreferredPlatform(null);
      toast.info("Default streaming preference removed.");
    } else {
      localStorage.setItem("preferred_music_platform", platform);
      setPreferredPlatform(platform);
      toast.success(`${platformMeta[platform]?.name || platform} set as your default platform!`);
    }
  };

  // Known streaming services vs extra reference databases
  const knownStreaming = new Set(['spotify', 'apple_music', 'applemusic', 'youtube', 'youtube_music', 'deezer', 'tidal', 'soundcloud', 'musicbrainz']);
  const extraLinks = (safeItem.externalLinks || []).filter(link => {
    return !knownStreaming.has(link.platform?.toLowerCase());
  });

  const canShare = typeof navigator !== "undefined" && !!navigator.share;

  if (!mounted || !item) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Modal Container: only rendered when neither full-screen QR nor GrooveCard is open */}
          {!qrFullScreen && !showGrooveCard && (
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 320 }}
            className="relative w-full max-w-xl bg-[var(--theme-card)] border border-[var(--theme-border)] rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden z-10 font-sans"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--theme-border)] bg-[var(--theme-surface)]/80 backdrop-blur-md">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[var(--theme-card)] border border-[var(--theme-border)] flex items-center justify-center p-1.5 shadow-sm">
                  <img src="/in.svg" alt="GrooveLink" className="w-full h-full object-contain" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-extrabold text-[var(--theme-fg)] tracking-tight font-display">
                      GrooveLink
                    </h2>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[var(--theme-accent-bg)] text-[var(--theme-accent-fg)]">
                      Universal
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--theme-muted)] leading-none mt-0.5">
                    Open across any streaming platform
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-[var(--theme-surface)] text-[var(--theme-muted)] hover:text-[var(--theme-fg)] transition-colors cursor-pointer"
                title="Close Modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              {/* Item Card Summary */}
              <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-[var(--theme-surface)]/90 border border-[var(--theme-border)] shadow-sm">
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden flex-shrink-0 bg-[var(--theme-card)] border border-[var(--theme-border)] shadow">
                  <img
                    src={coverUrl}
                    alt={title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = "https://placehold.co/400x400/17020B/E8A87C?text=No+Cover";
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-1">
                    {itemType === "track" && <Music size={12} className="text-[var(--theme-accent)]" />}
                    {itemType === "album" && <Disc size={12} className="text-[var(--theme-accent)]" />}
                    {itemType === "artist" && <Users size={12} className="text-[var(--theme-accent)]" />}
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--theme-accent)]">
                      {itemType}
                    </span>
                    {(item.releaseYear || item.releaseDate) && (
                      <>
                        <span className="text-[var(--theme-muted)]">•</span>
                        <span className="text-[10px] text-[var(--theme-muted)]">
                          {item.releaseYear || item.releaseDate}
                        </span>
                      </>
                    )}
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-[var(--theme-fg)] truncate leading-snug">
                    {title}
                  </h3>
                  <p className="text-xs text-[var(--theme-muted)] truncate">
                    {artistsString}
                  </p>
                </div>
              </div>

              {/* Default platform banner if set */}
              {preferredPlatform && platformMeta[preferredPlatform] && (
                <div className="p-3 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] flex items-center justify-between text-xs text-[var(--theme-fg)]">
                  <div className="flex items-center gap-2">
                    <span className="text-amber-400 font-bold">★</span>
                    <span>Default: <strong>{platformMeta[preferredPlatform].name}</strong></span>
                  </div>
                  <button
                    onClick={() => selectPlatformPreference(preferredPlatform)}
                    className="text-[10px] font-bold text-[var(--theme-muted)] hover:text-red-400 transition cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              )}

              {/* Streaming Platforms List */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--theme-muted)] px-1">
                  Choose your streaming service:
                </span>

                <div className="grid grid-cols-1 gap-2">
                  {Object.keys(platformLinks).map((platformKey) => {
                    const url = platformLinks[platformKey];
                    const meta = platformMeta[platformKey] || {
                      name: platformKey,
                      textColor: "text-[var(--theme-muted)]",
                      borderHover: "hover:border-[var(--theme-border)]",
                      btnBg: "bg-[var(--theme-card)] text-[var(--theme-fg)]",
                      icon: <Music className="w-5 h-5" />
                    };
                    const isPreferred = preferredPlatform === platformKey;

                    return (
                      <div
                        key={platformKey}
                        className={`flex items-center justify-between p-3 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)]/60 backdrop-blur-sm transition-all duration-200 shadow-sm ${meta.borderHover}`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-8 h-8 rounded-xl bg-[var(--theme-card)] border border-[var(--theme-border)] flex items-center justify-center flex-shrink-0 ${meta.textColor}`}>
                            {meta.icon}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs sm:text-sm font-semibold text-[var(--theme-fg)] truncate">
                              {meta.name}
                            </span>
                            <button
                              onClick={() => selectPlatformPreference(platformKey)}
                              className="text-[10px] text-[var(--theme-muted)] hover:text-[var(--theme-accent)] text-left transition cursor-pointer"
                            >
                              {isPreferred ? "★ Your default platform" : "Set as default"}
                            </button>
                          </div>
                        </div>

                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-all duration-200 active:scale-95 shadow-sm ${meta.btnBg}`}
                        >
                          <span>Play</span>
                          <ExternalLink size={12} />
                        </a>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Expanded Inline QR Code Panel */}
              {showQR && (
                <div className="p-4 rounded-2xl bg-[var(--theme-surface)] border border-[var(--theme-border)] flex flex-col items-center gap-3 animate-fade-in">
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-bold text-[var(--theme-fg)] uppercase tracking-wider flex items-center gap-1.5">
                      <QrCode size={14} className="text-[var(--theme-accent)]" />
                      <span>Scan to Open GrooveLink</span>
                    </span>
                    <button
                      onClick={handleOpenQrFullScreen}
                      className="text-[10px] font-bold text-[var(--theme-accent)] hover:underline uppercase tracking-wider cursor-pointer"
                    >
                      Full Screen
                    </button>
                  </div>
                  <div
                    onClick={handleOpenQrFullScreen}
                    className="relative w-44 h-44 p-3 bg-white rounded-2xl border border-gray-200 shadow-md flex items-center justify-center cursor-zoom-in group/qr transition duration-300 hover:scale-[1.02]"
                    title="Click to view full screen"
                  >
                    <img src={qrCodeUrl} alt="QR Code" className="w-full h-full object-contain" />
                    <div className="absolute w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-lg p-1.5">
                      <img src="/in.svg" alt="Groove Logo" className="w-full h-full object-contain" />
                    </div>
                  </div>
                  <p className="text-[11px] text-[var(--theme-muted)] text-center max-w-xs">
                    Scan with any phone camera to open this {itemType} on Spotify, Apple Music, YouTube, and more.
                  </p>
                </div>
              )}

              {/* Reference, Lyrics, Databases & Discography Links */}
              {extraLinks.length > 0 && (
                <div className="pt-2 border-t border-[var(--theme-border)] space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--theme-muted)] px-1 flex items-center gap-1.5">
                    <Globe size={13} className="text-[var(--theme-accent)]" />
                    <span>Reference & Community Data</span>
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {extraLinks.map((link, idx) => (
                      <a
                        key={idx}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-2.5 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)]/80 hover:bg-[var(--theme-card)] hover:border-[var(--theme-accent)]/40 transition group"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Globe size={12} className="text-[var(--theme-accent)] flex-shrink-0" />
                          <span className="text-xs font-semibold text-[var(--theme-fg)] truncate">
                            {link.label}
                          </span>
                        </div>
                        <ExternalLink size={11} className="text-[var(--theme-muted)] group-hover:text-[var(--theme-fg)] flex-shrink-0" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Bottom Footer Actions */}
            <div className="p-3 sm:p-4 border-t border-[var(--theme-border)] bg-[var(--theme-surface)]/90 backdrop-blur-md flex items-center justify-between gap-2 sm:gap-3 flex-wrap">
              {/* Share / Copy Link Button */}
              <div className="flex items-center gap-1.5 flex-1 min-w-[120px]">
                <button
                  onClick={handleNativeShare}
                  className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-card)] hover:border-[var(--theme-accent)] text-[var(--theme-fg)] text-xs font-bold transition-all duration-200 active:scale-95 cursor-pointer shadow-sm"
                  title="Share GrooveLink"
                >
                  <Share2 size={15} />
                  <span>Share Link</span>
                </button>

                <button
                  onClick={handleCopyLink}
                  className="p-2.5 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-card)] hover:border-[var(--theme-accent)] text-[var(--theme-fg)] transition-all duration-200 active:scale-95 cursor-pointer shadow-sm flex items-center justify-center"
                  title="Copy link to clipboard"
                >
                  {copied ? (
                    <Check size={15} className="text-[var(--theme-accent)]" />
                  ) : (
                    <Copy size={15} />
                  )}
                </button>
              </div>

              {/* GrooveCard Button: opens GrooveCard and closes GrooveLink modal */}
              <button
                onClick={handleOpenGrooveCard}
                className="flex-1 min-w-[110px] inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[var(--theme-accent-bg)] hover:opacity-90 text-[var(--theme-accent-fg)] text-xs font-bold transition-all duration-200 active:scale-95 cursor-pointer shadow-md"
                title="Create customizable GrooveCard"
              >
                <Sparkles size={15} />
                <span>GrooveCard</span>
              </button>

              {/* QR Code Button: opens QR code in full screen and closes other modals */}
              <button
                onClick={handleOpenQrFullScreen}
                className="flex-1 min-w-[100px] inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-card)] hover:border-[var(--theme-accent)] text-[var(--theme-fg)] transition-all duration-200 active:scale-95 cursor-pointer shadow-sm text-xs font-bold"
                title="View QR Code in full screen"
              >
                <QrCode size={15} />
                <span>QR Code</span>
              </button>
            </div>
          </motion.div>
          )}

          {/* Full-screen QR Modal: Shown exclusively and other modals are closed */}
          {qrFullScreen && (
            <div
              className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[600] flex flex-col items-center justify-center p-4 sm:p-6 animate-fade-in"
              onClick={handleCloseQrFullScreen}
            >
              <div
                className="max-w-md w-full flex flex-col items-center gap-5 sm:gap-6 bg-[var(--theme-card)]/90 border border-[var(--theme-border)] p-6 sm:p-8 rounded-3xl shadow-2xl backdrop-blur-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between w-full">
                  <h3 className="text-base sm:text-lg font-bold text-white uppercase tracking-widest font-display">
                    Scan to Share {itemType}
                  </h3>
                  <button
                    onClick={handleCloseQrFullScreen}
                    className="p-1.5 rounded-full bg-[var(--theme-surface)] hover:bg-[var(--theme-card)] text-[var(--theme-muted)] hover:text-white transition cursor-pointer border border-[var(--theme-border)]"
                    title="Close full screen QR"
                  >
                    <X size={18} />
                  </button>
                </div>
                <div className="relative w-60 h-60 sm:w-72 sm:h-72 p-3 bg-white rounded-2xl shadow-xl flex items-center justify-center">
                  <img src={qrCodeUrl} alt="QR Code" className="w-full h-full object-contain rounded-xl" />
                  <div className="absolute w-12 h-12 sm:w-14 sm:h-14 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-lg p-2">
                    <img src="/in.svg" alt="Groove Logo" className="w-full h-full object-contain" />
                  </div>
                </div>
                <p className="text-xs text-[var(--theme-muted)] text-center max-w-[280px]">
                  Scan with your phone&apos;s camera to open this {itemType} directly on your preferred streaming service.
                </p>
                <div className="flex gap-3 w-full justify-center">
                  <button
                    onClick={handleCopyLink}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] hover:bg-[var(--theme-card)] text-[var(--theme-fg)] text-xs font-bold tracking-wider uppercase transition cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check size={14} className="text-[var(--theme-accent)]" />
                        <span className="text-[var(--theme-accent)]">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleCloseQrFullScreen}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-[var(--theme-accent)] hover:opacity-90 text-[var(--theme-bg)] text-xs font-bold tracking-wider uppercase transition cursor-pointer text-center"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Fallback GrooveCard Composer Modal */}
          {showGrooveCard && (
            <GrooveCardComposer
              isOpen={showGrooveCard}
              onClose={() => {
                setShowGrooveCard(false);
                onClose?.();
              }}
              itemId={itemId}
              title={title}
              artist={artistsString}
              imageUrl={coverUrl}
              popularity={item.popularity || 85}
              explicit={item.explicit || false}
              type={itemType}
              releaseDate={item.releaseDate || item.album?.release_date || (item.releaseYear ? String(item.releaseYear) : null)}
              releaseYear={item.releaseYear}
              album={item.album?.name || item.album || (itemType === "album" ? title : "")}
              genres={item.genres || []}
            />
          )}
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
