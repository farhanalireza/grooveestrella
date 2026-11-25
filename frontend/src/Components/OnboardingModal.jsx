// src/Components/OnboardingModal.jsx
"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  Check,
  Plus,
  Search,
  X,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Music,
  Headphones,
  Flame,
  Radio,
  Sliders,
  CheckCircle2,
} from "lucide-react";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import DiscLoader from "./DiscLoader";
import { toast } from "@/lib/toast";

const POPULAR_GENRES = [
  "Rock",
  "Pop",
  "Indie",
  "Electronic",
  "Hip Hop",
  "Jazz",
  "R&B",
  "Soul",
  "Metal",
  "Folk",
  "Ambient",
  "Classical",
  "Psychedelic",
  "Funk",
  "Alternative",
  "Lo-Fi",
  "Shoegaze",
  "Post-Punk",
];

const CURATED_ARTISTS = [
  {
    id: "544fb460-1482-40e5-b4e8-f7246b976eed",
    name: "David Bowie",
    genre: "Glam Rock",
    image: "https://cdn-images.dzcdn.net/images/artist/8301a6a09a24f4bb35950c59717defa0/250x250-000000-80-0-0.jpg",
  },
  {
    id: "056e4f3e-d505-4dad-8ec1-d04f521cbb56",
    name: "Daft Punk",
    genre: "Electronic",
    image: "https://cdn-images.dzcdn.net/images/artist/638e69b9caaf9f9f3f8826febea7b543/250x250-000000-80-0-0.jpg",
  },
  {
    id: "83d91898-7763-47d7-b03b-b92132375c47",
    name: "Pink Floyd",
    genre: "Progressive Rock",
    image: "https://cdn-images.dzcdn.net/images/artist/d62a818a5de6455f17b6a992cf22b32f/250x250-000000-80-0-0.jpg",
  },
  {
    id: "b10bbbfc-cf9e-42e0-be17-e2c3e1d2600d",
    name: "The Beatles",
    genre: "Classic Rock",
    image: "https://cdn-images.dzcdn.net/images/artist/16925ed8f96eb621ecd56c2c8ba3da6e/250x250-000000-80-0-0.jpg",
  },
  {
    id: "a74b1b7f-71a5-4011-9441-d0b5e4122711",
    name: "Radiohead",
    genre: "Alternative",
    image: "https://cdn-images.dzcdn.net/images/artist/0d58cfbc90f2e776608bcdc0c45a4711/250x250-000000-80-0-0.jpg",
  },
  {
    id: "d5080c9b-1249-430f-ac8d-e6f451479d79",
    name: "Kendrick Lamar",
    genre: "Hip Hop",
    image: "https://cdn-images.dzcdn.net/images/artist/be0a7c550567f4af0ed202d7235b74d6/250x250-000000-80-0-0.jpg",
  },
  {
    id: "f27ec8db-af05-4f36-916e-3d57f91ecf5e",
    name: "Michael Jackson",
    genre: "Pop / R&B",
    image: "https://cdn-images.dzcdn.net/images/artist/97fae13b2b30e4aec2e8c9e0c7839d92/250x250-000000-80-0-0.jpg",
  },
  {
    id: "0383dadf-2a4e-4d10-a46a-e6e041da8eb3",
    name: "Queen",
    genre: "Rock Anthems",
    image: "https://cdn-images.dzcdn.net/images/artist/a131ced363dd67249e6a9167164188cb/250x250-000000-80-0-0.jpg",
  },
];

const PLATFORMS = [
  { id: "none", name: "Always Ask (GrooveCard)", desc: "Universal options picker on every track" },
  { id: "spotify", name: "Spotify", desc: "Launch directly in Spotify player" },
  { id: "apple_music", name: "Apple Music", desc: "Open in Apple Music web or app" },
  { id: "youtube_music", name: "YouTube Music", desc: "Listen on YouTube Music" },
  { id: "deezer", name: "Deezer", desc: "Stream in Deezer HiFi" },
  { id: "tidal", name: "TIDAL", desc: "Open in TIDAL Master" },
];

function readList(key) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function OnboardingModal() {
  const { user, profile, loading } = useSupabaseAuth();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // 3 Steps: 1. Genres, 2. Artists, 3. Streaming Platform
  const [step, setStep] = useState(1);

  const [genres, setGenres] = useState([]);
  const [customGenre, setCustomGenre] = useState("");
  const [artists, setArtists] = useState([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [platform, setPlatform] = useState("none");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setMounted(true);
    const open = () => {
      hydrateFromStorage();
      setStep(1);
      setIsOpen(true);
    };
    window.addEventListener("open-onboarding", open);
    return () => window.removeEventListener("open-onboarding", open);
  }, []);

  // Lock body scroll while modal is open
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => {
      if (e.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen]);

  // Debounced Artist Search
  useEffect(() => {
    const clean = query.trim();
    if (!clean) {
      setResults([]);
      setSearching(false);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(clean)}&type=artist&limit=6`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.results || []);
        }
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 280);
    return () => clearTimeout(timer);
  }, [query]);

  function hydrateFromStorage() {
    const savedGenres = readList("groove_favorite_genres");
    const legacyGenres = readList("favoriteGenres");
    const initialGenres =
      savedGenres.length > 0
        ? savedGenres
        : legacyGenres.length > 0
        ? legacyGenres
        : profile?.onboarding_data?.genres || [];
    setGenres(initialGenres);

    const savedArtistsList = readList("savedArtists");
    const profileArtists = profile?.onboarding_data?.artists || [];
    setArtists(savedArtistsList.length > 0 ? savedArtistsList : profileArtists);

    setPlatform(
      localStorage.getItem("preferred_music_platform") ||
        localStorage.getItem("preferred_streaming_platform") ||
        profile?.onboarding_data?.platform ||
        "none"
    );
  }

  function toggleGenre(label) {
    setGenres((prev) =>
      prev.includes(label) ? prev.filter((g) => g !== label) : [...prev, label]
    );
  }

  function addCustomGenre() {
    const clean = customGenre.trim();
    if (!clean) return;
    const formatted = clean.charAt(0).toUpperCase() + clean.slice(1);
    if (!genres.includes(formatted)) {
      setGenres((prev) => [...prev, formatted]);
    }
    setCustomGenre("");
  }

  function toggleArtist(artist) {
    setArtists((prev) => {
      const exists = prev.some(
        (a) => (artist.id && a.id === artist.id) || a.name?.toLowerCase() === artist.name?.toLowerCase()
      );
      if (exists) {
        return prev.filter(
          (a) => (artist.id ? a.id !== artist.id : a.name?.toLowerCase() !== artist.name?.toLowerCase())
        );
      }
      return [...prev, artist];
    });
  }

  async function persist(markOnly = false) {
    setIsSaving(true);
    try {
      localStorage.setItem("groove_onboarding_completed", "true");

      if (!markOnly) {
        localStorage.setItem("groove_favorite_genres", JSON.stringify(genres));
        localStorage.setItem("favoriteGenres", JSON.stringify(genres));
        localStorage.setItem("preferred_music_platform", platform);
        localStorage.setItem("preferred_streaming_platform", platform);

        if (artists.length > 0) {
          const existing = readList("savedArtists");
          const next = [...existing];
          artists.forEach((artist) => {
            const already = next.some(
              (a) => (artist.id && a.id === artist.id) || a.name?.toLowerCase() === artist.name?.toLowerCase()
            );
            if (!already) {
              next.push({
                id: artist.id || encodeURIComponent(artist.name),
                name: artist.name,
                title: artist.name,
                artist: artist.name,
                type: "artist",
                genre: artist.genre || "Artist",
                image: artist.image || "",
                coverArt: artist.image || "",
              });
            }
          });
          localStorage.setItem("savedArtists", JSON.stringify(next));
        }

        if (user && isSupabaseConfigured()) {
          try {
            const supabase = createClient();
            await supabase
              .from("profiles")
              .update({
                onboarding_data: {
                  ...(profile?.onboarding_data || {}),
                  genres,
                  artists,
                  platform,
                  completed_at: new Date().toISOString(),
                },
              })
              .eq("id", user.id);
          } catch (_) {}
        }

        toast.success("Preferences updated! Recommendations personalized ✨");
      }

      window.dispatchEvent(new CustomEvent("groove-profile-updated"));
      setIsOpen(false);
    } catch (_) {
      setIsOpen(false);
    } finally {
      setIsSaving(false);
    }
  }

  function dismiss() {
    persist(true);
  }

  if (!mounted || !isOpen) return null;

  const shownArtists = results.length > 0 ? results : CURATED_ARTISTS;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) dismiss();
      }}
    >
      <div
        className="w-full sm:max-w-xl max-h-[92vh] sm:max-h-[88vh] bg-[var(--theme-card)] border border-[var(--theme-border)] rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col text-[var(--theme-fg)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header with Progress Bar */}
        <div className="px-5 pt-5 pb-3 border-b border-[var(--theme-border)]/50 shrink-0">
          <div className="flex items-center justify-between gap-3 mb-2.5">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-amber-400/20 text-amber-300">
                <Sparkles size={14} />
              </span>
              <span className="text-xs font-bold uppercase tracking-widest text-amber-300">
                Taste Customizer · Step {step} of 3
              </span>
            </div>
            <button
              type="button"
              onClick={dismiss}
              className="p-1.5 rounded-full text-[var(--theme-muted)] hover:text-[var(--theme-fg)] hover:bg-[var(--theme-surface)] transition cursor-pointer"
              aria-label="Close setup"
            >
              <X size={16} />
            </button>
          </div>

          <h2 className="text-xl sm:text-2xl font-black font-display tracking-tight text-[var(--theme-fg)]">
            {step === 1 && "What sounds move you?"}
            {step === 2 && "Favorite artists & inspirations"}
            {step === 3 && "Where do you listen?"}
          </h2>
          <p className="text-xs text-[var(--theme-muted)] mt-1">
            {step === 1 && "Select the genres you love. We'll tune your discovery feeds to these vibes."}
            {step === 2 && "Pick artists you enjoy or search MusicBrainz open catalog."}
            {step === 3 && "Choose your preferred player or keep universal sharing enabled."}
          </p>

          {/* Stepper Dots / Bar */}
          <div className="grid grid-cols-3 gap-2 pt-3">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1 rounded-full transition-all duration-300 ${
                  step >= s ? "bg-amber-400" : "bg-[var(--theme-border)]"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Scrollable Step Content */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* STEP 1: GENRES */}
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--theme-muted)]">
                  Popular Genres ({genres.length} selected)
                </span>
                {genres.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setGenres([])}
                    className="text-xs text-rose-400 hover:underline cursor-pointer"
                  >
                    Clear selection
                  </button>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {POPULAR_GENRES.map((genre) => {
                  const selected = genres.includes(genre);
                  return (
                    <button
                      key={genre}
                      type="button"
                      onClick={() => toggleGenre(genre)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border active:scale-95 ${
                        selected
                          ? "bg-amber-400 border-amber-400 text-zinc-950 shadow-md shadow-amber-400/20"
                          : "bg-[var(--theme-surface)] border-[var(--theme-border)] text-[var(--theme-fg)] hover:border-amber-400/40"
                      }`}
                    >
                      {selected && <Check size={12} strokeWidth={3} />}
                      <span>{genre}</span>
                    </button>
                  );
                })}
              </div>

              {/* Custom Genre Adder */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  addCustomGenre();
                }}
                className="pt-2 flex gap-2"
              >
                <input
                  value={customGenre}
                  onChange={(e) => setCustomGenre(e.target.value)}
                  placeholder="Add custom genre or subgenre (e.g. Dream Pop)..."
                  className="flex-1 px-3.5 py-2.5 rounded-2xl bg-[var(--theme-surface)] border border-[var(--theme-border)] text-xs sm:text-sm text-[var(--theme-fg)] outline-none focus:border-amber-400"
                />
                <button
                  type="submit"
                  className="px-4 rounded-2xl bg-[var(--theme-surface)] hover:bg-[var(--theme-card)] border border-[var(--theme-border)] hover:border-amber-400 text-amber-300 font-bold text-xs flex items-center gap-1 cursor-pointer transition"
                >
                  <Plus size={14} />
                  <span>Add</span>
                </button>
              </form>
            </div>
          )}

          {/* STEP 2: ARTISTS */}
          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div className="relative">
                <Search
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--theme-muted)]"
                />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search any artist on MusicBrainz..."
                  className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-[var(--theme-surface)] border border-[var(--theme-border)] text-xs sm:text-sm text-[var(--theme-fg)] outline-none focus:border-amber-400"
                />
                {searching && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <DiscLoader size={14} />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-xs text-[var(--theme-muted)]">
                <span>{query ? "Search Results" : "Iconic Artists"}</span>
                <span>{artists.length} followed</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {shownArtists.map((artist) => {
                  const name = artist.name || artist.title;
                  const selected = artists.some(
                    (a) => (artist.id && a.id === artist.id) || a.name?.toLowerCase() === name?.toLowerCase()
                  );
                  const artistImg =
                    artist.image ||
                    artist.url ||
                    `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(name || "artist")}`;

                  return (
                    <button
                      key={artist.id || name}
                      type="button"
                      onClick={() =>
                        toggleArtist({
                          id: artist.id,
                          name,
                          genre: artist.genre || artist.genres?.[0] || "Artist",
                          image: artistImg,
                        })
                      }
                      className={`flex items-center justify-between gap-3 p-2.5 rounded-2xl border text-left cursor-pointer transition-all active:scale-98 ${
                        selected
                          ? "border-amber-400 bg-amber-400/15 shadow-sm"
                          : "border-[var(--theme-border)] bg-[var(--theme-surface)]/80 hover:border-amber-400/40"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={artistImg}
                          alt={name}
                          className="w-9 h-9 rounded-full object-cover shrink-0 border border-white/10"
                          onError={(e) => {
                            e.currentTarget.src = `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(name)}`;
                          }}
                        />
                        <div className="min-w-0">
                          <span className="block text-xs font-bold text-[var(--theme-fg)] truncate">
                            {name}
                          </span>
                          <span className="block text-[10px] text-[var(--theme-muted)] truncate">
                            {artist.genre || artist.genres?.[0] || "Artist"}
                          </span>
                        </div>
                      </div>

                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                          selected
                            ? "bg-amber-400 text-zinc-950"
                            : "border border-[var(--theme-border)] text-transparent"
                        }`}
                      >
                        <Check size={12} strokeWidth={3} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: PLATFORM */}
          {step === 3 && (
            <div className="space-y-3.5 animate-fade-in">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--theme-muted)] block">
                Select your default listening destination
              </span>

              <div className="space-y-2">
                {PLATFORMS.map((item) => {
                  const selected = platform === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setPlatform(item.id)}
                      className={`w-full flex items-center justify-between p-3.5 rounded-2xl border text-left cursor-pointer transition-all ${
                        selected
                          ? "border-amber-400 bg-amber-400/15 shadow-sm"
                          : "border-[var(--theme-border)] bg-[var(--theme-surface)]/80 hover:border-amber-400/30"
                      }`}
                    >
                      <div>
                        <span className="block text-xs sm:text-sm font-bold text-[var(--theme-fg)]">
                          {item.name}
                        </span>
                        <span className="block text-[11px] text-[var(--theme-muted)] mt-0.5">
                          {item.desc}
                        </span>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                          selected
                            ? "bg-amber-400 text-zinc-950"
                            : "border border-[var(--theme-border)]"
                        }`}
                      >
                        {selected && <Check size={12} strokeWidth={3} />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Sticky Action Footer */}
        <div className="p-4 sm:p-5 border-t border-[var(--theme-border)]/50 bg-[var(--theme-card)]/90 backdrop-blur-xl flex items-center justify-between gap-3 shrink-0">
          <div>
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-[var(--theme-muted)] hover:text-[var(--theme-fg)] transition cursor-pointer"
              >
                <ArrowLeft size={14} />
                <span>Back</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={dismiss}
                className="text-xs font-bold text-[var(--theme-muted)] hover:text-[var(--theme-fg)] cursor-pointer"
              >
                Skip for now
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {step < 3 ? (
              <button
                type="button"
                onClick={() => setStep((s) => s + 1)}
                className="px-6 py-2.5 rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 text-zinc-950 text-xs sm:text-sm font-black transition-all hover:scale-105 active:scale-95 shadow-md shadow-amber-400/20 inline-flex items-center gap-1.5 cursor-pointer"
              >
                <span>Continue</span>
                <ArrowRight size={14} />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => persist(false)}
                disabled={isSaving}
                className="px-6 py-2.5 rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 text-zinc-950 text-xs sm:text-sm font-black transition-all hover:scale-105 active:scale-95 shadow-md shadow-amber-400/20 inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Sparkles size={14} />
                <span>{isSaving ? "Saving..." : "Save Preferences"}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
