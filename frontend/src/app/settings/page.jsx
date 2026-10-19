// src/app/settings/page.jsx
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Shield, Volume2, Check, Music, Trash2, 
  ListMusic, Disc, Users, AlertTriangle, ArrowLeft,
  Sun, Moon, Palette, Smartphone, Download
} from 'lucide-react';
import Link from 'next/link';
import { toast } from '@/lib/toast';
import { useTheme } from '@/contexts/ThemeContext';

export default function SettingsPage() {
  const router = useRouter();
  const { theme, isDark, setTheme } = useTheme();
  const [preferredPlatform, setPreferredPlatform] = useState("none");
  const [showVinylSides, setShowVinylSides] = useState(true);
  const [isStandalone, setIsStandalone] = useState(false);
  const [counts, setCounts] = useState({
    songs: 0,
    albums: 0,
    artists: 0,
    playlists: 0,
  });

  const handleSelectTheme = (mode) => {
    setTheme(mode);
    toast.success(`${mode === 'dark' ? 'Dark' : 'Light'} theme activated`);
  };

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  const platforms = [
    { id: "none", name: "Always Ask (Show GrooveCard)", desc: "Show options list instead of auto-redirecting" },
    { id: "spotify", name: "Spotify", desc: "Launch directly in Spotify app" },
    { id: "apple_music", name: "Apple Music", desc: "Open inside Apple Music web or native player" },
    { id: "youtube_music", name: "YouTube Music", desc: "Redirect to YouTube Music search or play" },
    { id: "youtube", name: "YouTube", desc: "Open standard YouTube video stream" },
    { id: "deezer", name: "Deezer", desc: "Open in Deezer player" },
    { id: "tidal", name: "TIDAL", desc: "Open in TIDAL player" },
    { id: "soundcloud", name: "SoundCloud", desc: "Open inside SoundCloud player" }
  ];

  useEffect(() => {
    if (typeof window !== "undefined") {
      const standalone = 
        window.matchMedia("(display-mode: standalone)").matches || 
        window.navigator.standalone === true || 
        document.referrer.includes("android-app://");
      setIsStandalone(standalone);
    }
    const saved = localStorage.getItem("preferred_music_platform");
    if (saved) {
      setPreferredPlatform(saved);
    }
    const savedSides = localStorage.getItem("groove_show_vinyl_sides");
    if (savedSides !== null) {
      setShowVinylSides(savedSides === "true");
    }
    updateCounts();
  }, []);

  const handleToggleVinylSides = () => {
    const nextVal = !showVinylSides;
    setShowVinylSides(nextVal);
    localStorage.setItem("groove_show_vinyl_sides", String(nextVal));
    toast.info(nextVal ? "Vinyl side dividers enabled" : "Vinyl side dividers disabled");
  };

  const updateCounts = () => {
    const songs = JSON.parse(localStorage.getItem("savedSongs")) || [];
    const albums = JSON.parse(localStorage.getItem("savedAlbums")) || [];
    const artists = JSON.parse(localStorage.getItem("savedArtists")) || [];
    const playlists = JSON.parse(localStorage.getItem("savedPlaylists")) || [];
    const customPlaylists = JSON.parse(localStorage.getItem("customPlaylists")) || [];
    
    setCounts({
      songs: songs.length,
      albums: albums.length,
      artists: artists.length,
      playlists: playlists.length + customPlaylists.length,
    });
  };

  const handleSelectPlatform = (id) => {
    setPreferredPlatform(id);
    if (id === "none") {
      localStorage.removeItem("preferred_music_platform");
    } else {
      localStorage.setItem("preferred_music_platform", id);
    }
    toast.success(`Default platform set to ${platforms.find(p => p.id === id)?.name || id}`);
  };

  const handleClearLibraryType = (type, keys, label) => {
    if (window.confirm(`Are you sure you want to delete all saved ${label}? This cannot be undone.`)) {
      keys.forEach(key => localStorage.removeItem(key));
      updateCounts();
      toast.info(`Cleared all ${label} from library.`);
    }
  };

  const handleClearAllLibrary = () => {
    if (window.confirm("Are you sure you want to clear your entire local library? This will delete all saved songs, albums, artists, and playlists.")) {
      localStorage.removeItem("savedSongs");
      localStorage.removeItem("savedAlbums");
      localStorage.removeItem("savedArtists");
      localStorage.removeItem("savedPlaylists");
      localStorage.removeItem("customPlaylists");
      updateCounts();
      toast.success("Entire local library cleared.");
    }
  };

  const handleResetGrooveLinks = () => {
    if (window.confirm("Reset your GrooveLinks routing preferences?")) {
      localStorage.removeItem("preferred_music_platform");
      setPreferredPlatform("none");
      toast.info("GrooveLinks preferences reset.");
    }
  };

  const handleFullReset = () => {
    if (window.confirm("WARNING: This will wipe ALL app settings, preferred platform choices, and your entire library. Proceed?")) {
      localStorage.clear();
      setPreferredPlatform("none");
      updateCounts();
      toast.error("All browser data, settings, and library deleted.");
    }
  };

  return (
    <div className="flex-grow flex items-start justify-center py-6 sm:py-12 px-4 sm:px-6 relative z-10 w-full pb-32">
      <div className="w-full max-w-2xl bg-transparent sm:bg-[var(--theme-surface)] sm:backdrop-blur-xl border-0 sm:border border-transparent sm:border-[var(--theme-border)] sm:rounded-3xl p-2 sm:p-8 sm:shadow-2xl space-y-8 transition-colors duration-300">
        
        {/* Settings Header */}
        <div className="flex items-center gap-3 border-b border-[var(--theme-border)] pb-6">
          <button 
            onClick={handleBack}
            className="p-2 rounded-full bg-[var(--theme-card)] border border-[var(--theme-border)] text-[var(--theme-muted)] hover:text-[var(--theme-fg)] transition cursor-pointer shadow-sm"
            title="Go Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[var(--theme-fg)]">Settings</h1>
            <p className="text-xs text-[var(--theme-muted)]">Configure preferences and manage locally saved data.</p>
          </div>
        </div>

        {/* SECTION 0: APPEARANCE & THEME */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-[var(--theme-accent)]" />
            <h2 className="text-lg font-bold text-[var(--theme-fg)]">Appearance & Theme</h2>
          </div>
          <p className="text-xs text-[var(--theme-muted)] max-w-lg">
            Select your preferred display theme for GrooveEstrella.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
            {/* Dark Theme Card */}
            <button
              onClick={() => handleSelectTheme('dark')}
              className={`flex items-center justify-between p-4 rounded-2xl border text-left transition-all duration-300 cursor-pointer ${
                isDark
                  ? "bg-[var(--theme-card)] border-[var(--theme-accent)] text-[var(--theme-fg)] shadow-lg ring-1 ring-[var(--theme-accent)]/50"
                  : "bg-[var(--theme-card)]/60 border-[var(--theme-border)] text-[var(--theme-fg)]/80 hover:border-[var(--theme-accent)]/50"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${isDark ? "bg-[var(--theme-accent)] text-[var(--theme-accent-fg)]" : "bg-[var(--theme-surface)] text-[var(--theme-muted)]"}`}>
                  <Moon size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[var(--theme-fg)]">Dark Mode</h3>
                  <p className="text-xs text-[var(--theme-muted)]">Warm dark aesthetic</p>
                </div>
              </div>
              {isDark && (
                <div className="w-5 h-5 rounded-full bg-[var(--theme-accent)] text-[var(--theme-accent-fg)] flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </div>
              )}
            </button>

            {/* Light Theme Card */}
            <button
              onClick={() => handleSelectTheme('light')}
              className={`flex items-center justify-between p-4 rounded-2xl border text-left transition-all duration-300 cursor-pointer ${
                !isDark
                  ? "bg-[var(--theme-card)] border-[var(--theme-accent)] text-[var(--theme-fg)] shadow-lg ring-1 ring-[var(--theme-accent)]/50"
                  : "bg-[var(--theme-card)]/60 border-[var(--theme-border)] text-[var(--theme-fg)]/80 hover:border-[var(--theme-accent)]/50"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${!isDark ? "bg-[var(--theme-accent)] text-[var(--theme-accent-fg)]" : "bg-[var(--theme-surface)] text-[var(--theme-muted)]"}`}>
                  <Sun size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[var(--theme-fg)]">Light Mode</h3>
                  <p className="text-xs text-[var(--theme-muted)]">Clean bright aesthetic</p>
                </div>
              </div>
              {!isDark && (
                <div className="w-5 h-5 rounded-full bg-[var(--theme-accent)] text-[var(--theme-accent-fg)] flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </div>
              )}
            </button>
          </div>
        </div>

        {/* SECTION 1: ALBUM & TRACKLIST PREFERENCES */}
        <div className="border-t border-[var(--theme-border)] pt-8 space-y-4">
          <div className="flex items-center gap-2">
            <Disc className="w-5 h-5 text-[var(--theme-accent)]" />
            <h2 className="text-lg font-bold text-[var(--theme-fg)]">Tracklist Preferences</h2>
          </div>
          <p className="text-xs text-[var(--theme-muted)] max-w-lg">
            Customize how album tracklists and physical media structures are displayed.
          </p>

          <div className="bg-[var(--theme-card)]/60 border border-[var(--theme-border)] rounded-2xl p-4 flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold text-[var(--theme-fg)]">Vinyl Sides Sectioning</h3>
              <p className="text-xs text-[var(--theme-muted)] max-w-md">
                Group album tracks into Side A, Side B, etc. for vinyl and multi-sided pressings. When disabled, tracks are presented as a continuous disc tracklist.
              </p>
            </div>
            <button
              onClick={handleToggleVinylSides}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                showVinylSides ? 'bg-[var(--theme-accent)]' : 'bg-[var(--theme-border)]'
              }`}
              role="switch"
              aria-checked={showVinylSides}
              title={showVinylSides ? "Disable vinyl side dividers" : "Enable vinyl side dividers"}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  showVinylSides ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* SECTION 2: APP INSTALLATION (PWA) */}
        <div className="border-t border-[var(--theme-border)] pt-8 space-y-4">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-[var(--theme-accent)]" />
            <h2 className="text-lg font-bold text-[var(--theme-fg)]">App Installation (PWA)</h2>
          </div>
          <p className="text-xs text-[var(--theme-muted)] max-w-lg">
            Install GrooveEstrella onto your mobile home screen or desktop for a fullscreen player, faster loading, and offline access.
          </p>

          <div className="bg-[var(--theme-card)]/60 border border-[var(--theme-border)] rounded-2xl p-4 flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-11 h-11 rounded-2xl p-1.5 bg-[var(--theme-surface)] border border-[var(--theme-border)] flex items-center justify-center shrink-0 shadow-sm">
                <img src="/in.svg" alt="GrooveEstrella" className="w-full h-full object-contain" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-bold text-[var(--theme-fg)] truncate">
                  {isStandalone ? "GrooveEstrella Installed" : "Install GrooveEstrella App"}
                </h3>
                <p className="text-xs text-[var(--theme-muted)] truncate">
                  {isStandalone ? "Active in standalone PWA mode" : "Tap to add to Home Screen on mobile or desktop"}
                </p>
              </div>
            </div>

            {isStandalone ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--theme-surface)] text-[var(--theme-accent)] text-xs font-bold border border-[var(--theme-border)] shrink-0">
                <Check className="w-3.5 h-3.5" />
                <span>Installed</span>
              </span>
            ) : (
              <button
                onClick={() => {
                  window.dispatchEvent(new Event('open-pwa-install'));
                }}
                className="px-4 py-2 rounded-full bg-[var(--theme-accent)] hover:opacity-90 active:scale-95 text-[var(--theme-accent-fg)] text-xs font-bold transition shadow-sm cursor-pointer shrink-0 flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Install App</span>
              </button>
            )}
          </div>
        </div>

        {/* SECTION 3: GROOVELINKS PREFERENCES */}
        <div className="border-t border-[var(--theme-border)] pt-8 space-y-4">
          <div className="flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-[var(--theme-accent)]" />
            <h2 className="text-lg font-bold text-[var(--theme-fg)]">GrooveLinks Preferences</h2>
          </div>
          <p className="text-xs text-[var(--theme-muted)] max-w-lg">
            Choose your default streaming platform. When opening a GrooveLink sharing page, you will automatically bypass the landing screen and redirect straight to the selected service.
          </p>

          {/* Grid Platform Selection (Saves Height on Mobile) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
            {platforms.map((platform) => {
              const isSelected = preferredPlatform === platform.id;
              return (
                <button
                  key={platform.id}
                  onClick={() => handleSelectPlatform(platform.id)}
                  className={`flex items-center justify-between p-3.5 rounded-xl border text-left transition-all duration-300 cursor-pointer ${
                    isSelected 
                      ? "bg-[var(--theme-card)] border-[var(--theme-border-active)] text-[var(--theme-fg)] ring-1 ring-[var(--theme-border-active)]/50" 
                      : "bg-[var(--theme-card)]/60 border-[var(--theme-border)] hover:border-[var(--theme-accent)]/50 text-[var(--theme-fg)]/80 hover:text-[var(--theme-fg)]"
                  }`}
                >
                  <div className="pr-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider">{platform.name}</h3>
                    <p className="text-[10px] text-[var(--theme-muted)] mt-0.5 line-clamp-1">{platform.desc}</p>
                  </div>
                  {isSelected && (
                    <div className="w-4.5 h-4.5 rounded-full bg-[var(--theme-accent)] text-[var(--theme-bg)] flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <button
            onClick={handleResetGrooveLinks}
            className="inline-flex items-center gap-1 text-xs text-[var(--theme-muted)] hover:text-[var(--theme-accent)] transition-colors cursor-pointer mt-1 font-semibold"
          >
            Reset routing preferences to default
          </button>
        </div>

        {/* SECTION 2: LIBRARY DATA MANAGER */}
        <div className="border-t border-[var(--theme-border)] pt-8 space-y-4">
          <div className="flex items-center gap-2">
            <ListMusic className="w-5 h-5 text-[var(--theme-accent)]" />
            <h2 className="text-lg font-bold text-[var(--theme-fg)]">Library Data Manager</h2>
          </div>
          <p className="text-xs text-[var(--theme-muted)] max-w-lg">
            Your library contents are stored locally on this device. You can view the storage counts below and selectively clear data categories.
          </p>

          <div className="space-y-2 mt-3 bg-[var(--theme-card)]/50 border border-[var(--theme-border)] rounded-2xl p-4">
            {/* Saved Songs */}
            <div className="flex items-center justify-between py-2 border-b border-[var(--theme-border)]/50 last:border-b-0">
              <div className="flex items-center gap-2.5">
                <Music className="w-4 h-4 text-[var(--theme-muted)]" />
                <div>
                  <span className="text-xs font-bold text-[var(--theme-fg)] uppercase tracking-wider">Saved Songs</span>
                  <p className="text-[10px] text-[var(--theme-muted)]">{counts.songs} item{counts.songs !== 1 && 's'}</p>
                </div>
              </div>
              <button
                onClick={() => handleClearLibraryType("songs", ["savedSongs"], "saved songs")}
                disabled={counts.songs === 0}
                className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/25 transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                title="Clear songs"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-400" />
              </button>
            </div>

            {/* Saved Albums */}
            <div className="flex items-center justify-between py-2 border-b border-[var(--theme-border)]/50 last:border-b-0">
              <div className="flex items-center gap-2.5">
                <Disc className="w-4 h-4 text-[var(--theme-muted)]" />
                <div>
                  <span className="text-xs font-bold text-[var(--theme-fg)] uppercase tracking-wider">Saved Albums</span>
                  <p className="text-[10px] text-[var(--theme-muted)]">{counts.albums} item{counts.albums !== 1 && 's'}</p>
                </div>
              </div>
              <button
                onClick={() => handleClearLibraryType("albums", ["savedAlbums"], "saved albums")}
                disabled={counts.albums === 0}
                className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/25 transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                title="Clear albums"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-400" />
              </button>
            </div>

            {/* Saved Artists */}
            <div className="flex items-center justify-between py-2 border-b border-[var(--theme-border)]/50 last:border-b-0">
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4 text-[var(--theme-muted)]" />
                <div>
                  <span className="text-xs font-bold text-[var(--theme-fg)] uppercase tracking-wider">Saved Artists</span>
                  <p className="text-[10px] text-[var(--theme-muted)]">{counts.artists} item{counts.artists !== 1 && 's'}</p>
                </div>
              </div>
              <button
                onClick={() => handleClearLibraryType("artists", ["savedArtists"], "saved artists")}
                disabled={counts.artists === 0}
                className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/25 transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                title="Clear artists"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-400" />
              </button>
            </div>

            {/* Saved/Custom Playlists */}
            <div className="flex items-center justify-between py-2 last:border-b-0">
              <div className="flex items-center gap-2.5">
                <ListMusic className="w-4 h-4 text-[var(--theme-muted)]" />
                <div>
                  <span className="text-xs font-bold text-[var(--theme-fg)] uppercase tracking-wider">Playlists</span>
                  <p className="text-[10px] text-[var(--theme-muted)]">{counts.playlists} item{counts.playlists !== 1 && 's'}</p>
                </div>
              </div>
              <button
                onClick={() => handleClearLibraryType("playlists", ["savedPlaylists", "customPlaylists"], "saved playlists")}
                disabled={counts.playlists === 0}
                className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/25 transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                title="Clear playlists"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-400" />
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={handleClearAllLibrary}
              disabled={counts.songs === 0 && counts.albums === 0 && counts.artists === 0 && counts.playlists === 0}
              className="px-4 py-2.5 rounded-xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/15 text-red-400 text-xs font-bold uppercase tracking-wider transition disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer flex-1 text-center"
            >
              Clear Entire Library Data
            </button>
            
            <button
              onClick={handleFullReset}
              className="px-4 py-2.5 rounded-xl border border-orange-500/20 bg-orange-500/5 hover:bg-orange-500/15 text-orange-400 text-xs font-bold uppercase tracking-wider transition cursor-pointer flex-1 text-center flex items-center justify-center gap-1.5"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Reset All Apps & Preferences</span>
            </button>
          </div>
        </div>

        {/* Privacy Notice */}
        <div className="border-t border-[var(--theme-border)] pt-6 space-y-4">
          <div className="flex gap-3 text-xs text-[var(--theme-muted)]">
            <Shield className="w-4 h-4 text-[var(--theme-muted)] shrink-0 mt-0.5" />
            <p>
              <strong>Privacy First:</strong> Your choice is saved entirely inside your own browser. We never track your streaming preferences or upload data to remote servers.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
