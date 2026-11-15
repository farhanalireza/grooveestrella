// src/app/settings/page.jsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Mail,
  CheckCircle2,
  Sparkles,
  Sun,
  Moon,
  Palette,
  Volume2,
  Music,
  Disc,
  Star,
  Globe,
  Lock,
  Download,
  Trash2,
  RefreshCw,
  LogOut,
  SlidersHorizontal,
  Sliders,
  Check,
  Shield,
  User,
} from "lucide-react";
import { toast } from "@/lib/toast";
import { useTheme } from "@/contexts/ThemeContext";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import DiscLoader from "@/Components/DiscLoader";

const ALL_GENRES = [
  "Rock",
  "Pop",
  "Indie",
  "Electronic",
  "Hip Hop",
  "Jazz",
  "Classical",
  "Alternative",
  "Metal",
  "R&B",
  "Ambient",
  "Soul",
  "Psychedelic",
  "Post-Punk",
  "Shoegaze",
  "Folk",
];

const STREAMING_PLATFORMS = [
  { id: "none", name: "Always Ask (GrooveCard)", desc: "Show streaming options picker instead of auto-redirecting" },
  { id: "spotify", name: "Spotify", desc: "Launch directly in Spotify player" },
  { id: "apple_music", name: "Apple Music", desc: "Open inside Apple Music web or player" },
  { id: "youtube_music", name: "YouTube Music", desc: "Redirect to YouTube Music search or play" },
  { id: "deezer", name: "Deezer", desc: "Open in Deezer HiFi player" },
  { id: "tidal", name: "TIDAL", desc: "Open in TIDAL player" },
];

export default function SettingsPage() {
  const router = useRouter();
  const { theme, isDark, setTheme } = useTheme();
  const { user, profile, signOut, loading: authLoading, isConfigured } = useSupabaseAuth();

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user && isConfigured) {
      router.push("/login?returnTo=%2Fsettings");
    }
  }, [user, authLoading, isConfigured, router]);

  // Preferences State
  const [favoriteGenres, setFavoriteGenres] = useState([]);
  const [preferredRatingSystem, setPreferredRatingSystem] = useState("stars"); // 'stars' | 'score'
  const [defaultIsPublic, setDefaultIsPublic] = useState(true);
  const [preferredPlatform, setPreferredPlatform] = useState("spotify");
  const [showVinylSides, setShowVinylSides] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load Preferences
  useEffect(() => {
    try {
      const storedGenres = localStorage.getItem("groove_favorite_genres");
      if (storedGenres) setFavoriteGenres(JSON.parse(storedGenres));
      else if (profile?.onboarding_data?.favorite_genres) setFavoriteGenres(profile.onboarding_data.favorite_genres);

      const storedRating = localStorage.getItem("groove_rating_system");
      if (storedRating) setPreferredRatingSystem(storedRating);

      const storedPublic = localStorage.getItem("groove_journal_default_public");
      if (storedPublic !== null) setDefaultIsPublic(storedPublic === "true");

      const storedPlatform = localStorage.getItem("preferred_streaming_platform");
      if (storedPlatform) setPreferredPlatform(storedPlatform);

      const storedVinyl = localStorage.getItem("show_vinyl_sides");
      if (storedVinyl !== null) setShowVinylSides(storedVinyl === "true");
    } catch (_) {}
  }, [profile]);

  const handleToggleGenre = (genre) => {
    let updated;
    if (favoriteGenres.includes(genre)) {
      updated = favoriteGenres.filter((g) => g !== genre);
    } else {
      if (favoriteGenres.length >= 8) {
        toast.error("You can select up to 8 favorite genres.");
        return;
      }
      updated = [...favoriteGenres, genre];
    }
    setFavoriteGenres(updated);
    localStorage.setItem("groove_favorite_genres", JSON.stringify(updated));
  };

  const handleSavePreferences = async () => {
    setIsSaving(true);
    try {
      localStorage.setItem("groove_favorite_genres", JSON.stringify(favoriteGenres));
      localStorage.setItem("groove_rating_system", preferredRatingSystem);
      localStorage.setItem("groove_journal_default_public", String(defaultIsPublic));
      localStorage.setItem("preferred_streaming_platform", preferredPlatform);
      localStorage.setItem("show_vinyl_sides", String(showVinylSides));

      // Sync to Supabase profile if possible
      if (user && isSupabaseConfigured()) {
        const supabase = createClient();
        await supabase
          .from("profiles")
          .update({
            updated_at: new Date().toISOString(),
          })
          .eq("id", user.id);
      }

      toast.success("Settings & taste preferences saved!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectTheme = (mode) => {
    setTheme(mode);
    if (mode === "adaptive") {
      toast.success("Album-Adaptive mode activated! Detail pages will match album colors with contrast lock.");
    } else {
      toast.success(`${mode === "dark" ? "Dark" : "Light"} theme activated`);
    }
  };

  const handleExportBackup = () => {
    try {
      const backup = {
        exportedAt: new Date().toISOString(),
        version: "2.0",
        user: {
          id: user?.id,
          email: user?.email,
          username: profile?.username,
        },
        preferences: {
          favoriteGenres,
          preferredRatingSystem,
          defaultIsPublic,
          preferredPlatform,
          showVinylSides,
          theme,
        },
        journalLogs: JSON.parse(localStorage.getItem("groove_journal_logs") || "[]"),
        savedAlbums: JSON.parse(localStorage.getItem("savedAlbums") || "[]"),
        savedTracks: JSON.parse(localStorage.getItem("savedSongs") || "[]"),
        savedArtists: JSON.parse(localStorage.getItem("savedArtists") || "[]"),
        customPlaylists: JSON.parse(localStorage.getItem("customPlaylists") || "[]"),
      };

      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `grooveestrella-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Full listening backup exported as JSON!");
    } catch (_) {
      toast.error("Failed to export backup");
    }
  };

  const handleClearCache = () => {
    if (!window.confirm("Clear local cache and unsaved storage? Your account and logged cloud journals remain safe.")) {
      return;
    }
    try {
      localStorage.removeItem("groove_journal_logs");
      toast.success("Local cache cleared successfully.");
      router.refresh();
    } catch (_) {
      toast.error("Failed to clear local cache");
    }
  };

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/account");
    }
  };

  return (
    <div className="min-h-screen text-[var(--theme-fg)] py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8 font-sans pb-36">
      {/* Header & Back Navigation */}
      <div className="flex items-center justify-between border-b border-[var(--theme-border)]/50 pb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            className="w-10 h-10 rounded-2xl bg-[var(--theme-surface)] hover:bg-[var(--theme-card)] border border-[var(--theme-border)] text-[var(--theme-fg)] flex items-center justify-center transition cursor-pointer active:scale-95 shadow-sm"
            title="Return to Account"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight font-display text-[var(--theme-fg)]">
              Settings & Preferences
            </h1>
            <p className="text-xs text-[var(--theme-muted)]">
              Manage your identity, music taste, playback integrations, and display themes
            </p>
          </div>
        </div>

        <button
          onClick={handleSavePreferences}
          disabled={isSaving}
          className="px-4 py-2 rounded-2xl bg-[var(--theme-accent)] hover:opacity-95 active:scale-95 text-[var(--theme-accent-fg)] font-bold text-xs tracking-wider transition shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <DiscLoader size={14} />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Check size={14} />
              <span>Save Changes</span>
            </>
          )}
        </button>
      </div>

      {/* 1. Account & Security Sanctuary */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Shield size={18} className="text-[var(--theme-accent)]" />
          <h2 className="text-lg font-bold text-[var(--theme-fg)]">Account & Verification</h2>
        </div>

        <div className="rounded-2xl bg-[var(--theme-card)] border border-[var(--theme-border)] p-5 space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--theme-border)]/40">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--theme-muted)] block">
                Registered Email
              </span>
              <div className="flex items-center gap-2 mt-1">
                <Mail size={16} className="text-[var(--theme-accent)]" />
                <span className="text-sm font-semibold text-[var(--theme-fg)]">
                  {user?.email || "No email linked"}
                </span>
                {user?.email && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[10px] font-bold">
                    <CheckCircle2 size={11} />
                    <span>Verified</span>
                  </span>
                )}
              </div>
            </div>

            <Link
              href="/account"
              className="px-3.5 py-1.5 rounded-xl bg-[var(--theme-surface)] hover:bg-white/10 border border-[var(--theme-border)] text-xs font-semibold text-[var(--theme-fg)] transition self-start sm:self-center"
            >
              Edit Profile Info
            </Link>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[var(--theme-muted)]">
            <div>
              <span className="font-semibold text-[var(--theme-fg)]">GrooveEstrella Member ID:</span>{" "}
              <span className="font-mono text-[11px] opacity-80">{user?.id || "Local guest"}</span>
            </div>
            <button
              onClick={signOut}
              className="text-rose-400 hover:text-rose-300 font-bold transition flex items-center gap-1 cursor-pointer self-start sm:self-center"
            >
              <LogOut size={13} />
              <span>Sign Out of Account</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. Music Taste & Journal Profile */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={18} className="text-[var(--theme-accent)]" />
          <h2 className="text-lg font-bold text-[var(--theme-fg)]">Music Taste & Journal Profile</h2>
        </div>

        <div className="rounded-2xl bg-[var(--theme-card)] border border-[var(--theme-border)] p-5 space-y-6 shadow-sm">
          {/* Favorite Genres Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--theme-muted)]">
                Favorite Genres (Pick up to 8)
              </label>
              <span className="text-xs text-[var(--theme-muted)] font-mono">
                {favoriteGenres.length}/8 selected
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {ALL_GENRES.map((genre) => {
                const isSelected = favoriteGenres.includes(genre);
                return (
                  <button
                    key={genre}
                    type="button"
                    onClick={() => handleToggleGenre(genre)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[var(--theme-accent)] text-[var(--theme-accent-fg)] shadow-md"
                        : "bg-[var(--theme-surface)] text-[var(--theme-muted)] hover:text-[var(--theme-fg)] border border-[var(--theme-border)]"
                    }`}
                  >
                    {genre}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Rating Scale Preference */}
          <div className="pt-4 border-t border-[var(--theme-border)]/40">
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--theme-muted)] block mb-2">
              Preferred Rating Style
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setPreferredRatingSystem("stars");
                  localStorage.setItem("groove_rating_system", "stars");
                }}
                className={`p-3 rounded-xl border text-left transition cursor-pointer flex items-start gap-3 ${
                  preferredRatingSystem === "stars"
                    ? "bg-[var(--theme-surface)] border-[var(--theme-accent)] text-[var(--theme-fg)] ring-1 ring-[var(--theme-accent)]/30"
                    : "bg-[var(--theme-surface)]/50 border-[var(--theme-border)] text-[var(--theme-muted)] hover:border-white/20"
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-amber-400/15 border border-amber-400/30 flex items-center justify-center shrink-0 text-amber-300">
                  <Star size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[var(--theme-fg)]">★ 10-Star Scale</h4>
                  <p className="text-[11px] text-[var(--theme-muted)] mt-0.5">
                    Classic Letterboxd & Critic standard with half-stars (1.0 to 10.0)
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPreferredRatingSystem("score");
                  localStorage.setItem("groove_rating_system", "score");
                }}
                className={`p-3 rounded-xl border text-left transition cursor-pointer flex items-start gap-3 ${
                  preferredRatingSystem === "score"
                    ? "bg-[var(--theme-surface)] border-[var(--theme-accent)] text-[var(--theme-fg)] ring-1 ring-[var(--theme-accent)]/30"
                    : "bg-[var(--theme-surface)]/50 border-[var(--theme-border)] text-[var(--theme-muted)] hover:border-white/20"
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-cyan-400/15 border border-cyan-400/30 flex items-center justify-center shrink-0 text-cyan-300">
                  <Sliders size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[var(--theme-fg)]">0 – 100 Score Scale</h4>
                  <p className="text-[11px] text-[var(--theme-muted)] mt-0.5">
                    Metacritic & editorial score system with fine granularity
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Default Public vs Private Visibility */}
          <div className="pt-4 border-t border-[var(--theme-border)]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--theme-muted)] block">
                Default Log Visibility
              </span>
              <p className="text-xs text-[var(--theme-muted)] mt-0.5">
                Choose whether new journal logs are visible on your public critic profile by default
              </p>
            </div>

            <div className="inline-flex rounded-xl bg-[var(--theme-surface)] p-1 border border-[var(--theme-border)] shrink-0 self-start sm:self-center">
              <button
                type="button"
                onClick={() => {
                  setDefaultIsPublic(true);
                  localStorage.setItem("groove_journal_default_public", "true");
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  defaultIsPublic
                    ? "bg-[var(--theme-accent)] text-[var(--theme-accent-fg)] shadow-sm"
                    : "text-[var(--theme-muted)] hover:text-[var(--theme-fg)]"
                }`}
              >
                <Globe size={13} />
                <span>Public</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setDefaultIsPublic(false);
                  localStorage.setItem("groove_journal_default_public", "false");
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  !defaultIsPublic
                    ? "bg-[var(--theme-accent)] text-[var(--theme-accent-fg)] shadow-sm"
                    : "text-[var(--theme-muted)] hover:text-[var(--theme-fg)]"
                }`}
              >
                <Lock size={13} />
                <span>Private</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Streaming & Playback Integrations */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Volume2 size={18} className="text-[var(--theme-accent)]" />
          <h2 className="text-lg font-bold text-[var(--theme-fg)]">Streaming & Playback</h2>
        </div>

        <div className="rounded-2xl bg-[var(--theme-card)] border border-[var(--theme-border)] p-5 space-y-5 shadow-sm">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--theme-muted)] block mb-1">
              Preferred Streaming Platform
            </label>
            <p className="text-xs text-[var(--theme-muted)] mb-3">
              When clicking album or track play buttons, GrooveEstrella will launch your chosen service
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {STREAMING_PLATFORMS.map((plat) => {
                const isSelected = preferredPlatform === plat.id;
                return (
                  <button
                    key={plat.id}
                    type="button"
                    onClick={() => {
                      setPreferredPlatform(plat.id);
                      localStorage.setItem("preferred_streaming_platform", plat.id);
                    }}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? "bg-[var(--theme-surface)] border-[var(--theme-accent)] text-[var(--theme-fg)] ring-1 ring-[var(--theme-accent)]/30"
                        : "bg-[var(--theme-surface)]/50 border-[var(--theme-border)] text-[var(--theme-muted)] hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[var(--theme-fg)]">{plat.name}</span>
                      {isSelected && <Check size={14} className="text-[var(--theme-accent)]" />}
                    </div>
                    <span className="text-[10px] text-[var(--theme-muted)] mt-1">{plat.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Vinyl Sides Toggle */}
          <div className="pt-4 border-t border-[var(--theme-border)]/40 flex items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--theme-muted)] block">
                Vinyl Tracklist Dividers
              </span>
              <p className="text-xs text-[var(--theme-muted)] mt-0.5">
                Group album tracklists into Side A / Side B physical partitions where release data is available
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                const next = !showVinylSides;
                setShowVinylSides(next);
                localStorage.setItem("show_vinyl_sides", String(next));
              }}
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                showVinylSides ? "bg-[var(--theme-accent)]" : "bg-[var(--theme-border)]"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                  showVinylSides ? "left-7" : "left-1"
                }`}
              />
            </button>
          </div>
        </div>
      </section>

      {/* 4. Display Themes & Appearance */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Palette size={18} className="text-[var(--theme-accent)]" />
          <h2 className="text-lg font-bold text-[var(--theme-fg)]">Theme & Appearance</h2>
        </div>

        <div className="rounded-2xl bg-[var(--theme-card)] border border-[var(--theme-border)] p-5 space-y-4 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Dark Theme */}
            <button
              type="button"
              onClick={() => handleSelectTheme("dark")}
              className={`p-4 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between gap-3 ${
                theme === "dark"
                  ? "bg-zinc-900 border-amber-400 text-white shadow-md ring-1 ring-amber-400/30"
                  : "bg-zinc-950/60 border-[var(--theme-border)] text-zinc-400 hover:border-white/20"
              }`}
            >
              <div className="flex items-center justify-between">
                <Moon size={18} className="text-amber-400" />
                {theme === "dark" && <Check size={14} className="text-amber-400" />}
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Dark Mode</h4>
                <p className="text-[10px] text-zinc-400 mt-0.5">Midnight slate for low-light listening</p>
              </div>
            </button>

            {/* Light Theme */}
            <button
              type="button"
              onClick={() => handleSelectTheme("light")}
              className={`p-4 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between gap-3 ${
                theme === "light"
                  ? "bg-amber-50 border-amber-600 text-zinc-900 shadow-md ring-1 ring-amber-600/30"
                  : "bg-zinc-950/60 border-[var(--theme-border)] text-zinc-400 hover:border-white/20"
              }`}
            >
              <div className="flex items-center justify-between">
                <Sun size={18} className="text-amber-600" />
                {theme === "light" && <Check size={14} className="text-amber-600" />}
              </div>
              <div>
                <h4 className="text-xs font-bold text-zinc-900">Light Mode</h4>
                <p className="text-[10px] text-zinc-500 mt-0.5">High contrast daylight editorial</p>
              </div>
            </button>

            {/* Album-Adaptive Mode */}
            <button
              type="button"
              onClick={() => handleSelectTheme("adaptive")}
              className={`p-4 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between gap-3 ${
                theme === "adaptive"
                  ? "bg-gradient-to-br from-amber-950/70 via-purple-950/50 to-zinc-900 border-amber-400 text-amber-200 shadow-lg ring-1 ring-amber-400/40"
                  : "bg-zinc-950/60 border-[var(--theme-border)] text-zinc-400 hover:border-white/20"
              }`}
            >
              <div className="flex items-center justify-between">
                <Sparkles size={18} className="text-amber-300" />
                {theme === "adaptive" && <Check size={14} className="text-amber-300" />}
              </div>
              <div>
                <h4 className="text-xs font-bold text-amber-200">Vinyl Adaptive</h4>
                <p className="text-[10px] text-amber-300/70 mt-0.5">Dynamically morphs page tones to match album artwork</p>
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* 5. Data, Maintenance & Backup */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Download size={18} className="text-[var(--theme-accent)]" />
          <h2 className="text-lg font-bold text-[var(--theme-fg)]">Data & Maintenance</h2>
        </div>

        <div className="rounded-2xl bg-[var(--theme-card)] border border-[var(--theme-border)] p-5 space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--theme-border)]/40">
            <div>
              <span className="text-xs font-bold text-[var(--theme-fg)] block">
                Export JSON Listening Backup
              </span>
              <p className="text-xs text-[var(--theme-muted)] mt-0.5">
                Download your complete collection, ratings, diary logs, and preferences as an offline file
              </p>
            </div>
            <button
              type="button"
              onClick={handleExportBackup}
              className="px-4 py-2 rounded-xl bg-[var(--theme-surface)] hover:bg-[var(--theme-card)] border border-[var(--theme-border)] text-xs font-bold text-[var(--theme-fg)] transition flex items-center gap-2 cursor-pointer self-start sm:self-center"
            >
              <Download size={14} className="text-[var(--theme-accent)]" />
              <span>Download Backup</span>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--theme-border)]/40">
            <div>
              <span className="text-xs font-bold text-[var(--theme-fg)] block">
                Music Onboarding Experience
              </span>
              <p className="text-xs text-[var(--theme-muted)] mt-0.5">
                Re-run the initial musical taste survey to adjust recommendations
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem("groove_onboarding_completed");
                toast.info("Onboarding reset. Visit home or account to restart.");
                router.push("/");
              }}
              className="px-4 py-2 rounded-xl bg-[var(--theme-surface)] hover:bg-[var(--theme-card)] border border-[var(--theme-border)] text-xs font-bold text-[var(--theme-fg)] transition flex items-center gap-2 cursor-pointer self-start sm:self-center"
            >
              <RefreshCw size={14} className="text-[var(--theme-accent)]" />
              <span>Re-run Onboarding</span>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-rose-400 block">
                Reset Local Cache
              </span>
              <p className="text-xs text-[var(--theme-muted)] mt-0.5">
                Wipe locally cached journal drafts without affecting your cloud profile
              </p>
            </div>
            <button
              type="button"
              onClick={handleClearCache}
              className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-xs font-bold text-rose-400 transition flex items-center gap-2 cursor-pointer self-start sm:self-center"
            >
              <Trash2 size={14} />
              <span>Clear Cache</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
