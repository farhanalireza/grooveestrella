// src/Components/OnboardingModal.jsx
"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dice5,
  Sparkles,
  Music,
  Check,
  ChevronRight,
  ArrowLeft,
  X,
  Plus,
  Compass,
  Radio,
  Disc,
  Disc3,
  Headphones,
  Flame,
  Volume2,
  Heart,
  Sliders,
  ExternalLink,
  CheckCircle2,
  Star,
  Sun,
  Zap,
  Mic,
  Search,
} from "lucide-react";
import confetti from "canvas-confetti";
import { toast } from "@/lib/toast";
import { generateRandomName } from "@/lib/nameGenerator";
import UserAvatarIcon, { AVAILABLE_AVATARS } from "./UserAvatarIcon";

const POPULAR_GENRES = [
  { id: "Rock", label: "Rock", icon: Flame },
  { id: "Indie", label: "Indie", icon: Sparkles },
  { id: "Pop", label: "Pop", icon: Star },
  { id: "Synthpop", label: "Synthpop", icon: Radio },
  { id: "Electronic", label: "Electronic", icon: Zap },
  { id: "Hip Hop", label: "Hip Hop", icon: Mic },
  { id: "Jazz", label: "Jazz", icon: Music },
  { id: "Classical", label: "Classical", icon: Disc },
  { id: "Alternative", label: "Alternative", icon: Compass },
  { id: "Metal", label: "Metal", icon: Volume2 },
  { id: "R&B", label: "R&B", icon: Heart },
  { id: "Funk", label: "Funk", icon: Disc3 },
  { id: "Ambient", label: "Ambient", icon: Headphones },
  { id: "Soul", label: "Soul", icon: Sun },
  { id: "Disco", label: "Disco", icon: Disc },
  { id: "Punk", label: "Punk", icon: Zap },
  { id: "Blues", label: "Blues", icon: Sliders },
  { id: "Folk", label: "Folk", icon: Compass },
];

const CURATED_ARTISTS = [
  {
    id: "544fb460-1482-40e5-b4e8-f7246b976eed",
    name: "David Bowie",
    genre: "Glam / Art Rock",
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
    genre: "Psychedelic Rock",
    image: "https://cdn-images.dzcdn.net/images/artist/d62a818a5de6455f17b6a992cf22b32f/250x250-000000-80-0-0.jpg",
  },
  {
    id: "b10bbbfc-cf9e-42e0-be17-e2c3e1d2600d",
    name: "The Beatles",
    genre: "Classic Rock",
    image: "https://cdn-images.dzcdn.net/images/artist/16925ed8f96eb621ecd56c2c8ba3da6e/250x250-000000-80-0-0.jpg",
  },
  {
    id: "0383dadf-2a4e-4d10-a46a-e6e041da8eb3",
    name: "Queen",
    genre: "Rock",
    image: "https://cdn-images.dzcdn.net/images/artist/a131ced363dd67249e6a9167164188cb/250x250-000000-80-0-0.jpg",
  },
  {
    id: "a74b1b7f-71a5-4011-9441-d0b5e4122711",
    name: "Radiohead",
    genre: "Alternative",
    image: "https://cdn-images.dzcdn.net/images/artist/0d58cfbc90f2e776608bcdc0c45a4711/250x250-000000-80-0-0.jpg",
  },
  {
    id: "f27ec8db-af05-4f36-916e-3d57f91ecf5e",
    name: "Michael Jackson",
    genre: "Pop / R&B",
    image: "https://cdn-images.dzcdn.net/images/artist/97fae13b2b30e4aec2e8c9e0c7839d92/250x250-000000-80-0-0.jpg",
  },
  {
    id: "d5080c9b-1249-430f-ac8d-e6f451479d79",
    name: "Kendrick Lamar",
    genre: "Hip Hop",
    image: "https://cdn-images.dzcdn.net/images/artist/be0a7c550567f4af0ed202d7235b74d6/250x250-000000-80-0-0.jpg",
  },
  {
    id: "bd13909d-1c07-4291-8c4d-3c066fc03066",
    name: "Fleetwood Mac",
    genre: "Rock",
    image: "https://cdn-images.dzcdn.net/images/artist/ef23278cf3a67a3ca8404ddaa38699d4/250x250-000000-80-0-0.jpg",
  },
  {
    id: "20244d07-534f-4eff-b4d4-930878889970",
    name: "Taylor Swift",
    genre: "Pop",
    image: "https://cdn-images.dzcdn.net/images/artist/cc2495870fe1a792ad0cdb05501ad5ec/250x250-000000-80-0-0.jpg",
  },
  {
    id: "ada7a83c-e3e1-40f1-93f9-3e73dbc9298a",
    name: "Arctic Monkeys",
    genre: "Indie Rock",
    image: "https://cdn-images.dzcdn.net/images/artist/6c03e4c7c36800897fd468633286db24/250x250-000000-80-0-0.jpg",
  },
  {
    id: "678d88b2-13e0-40da-8004-24fa0466e6c6",
    name: "Led Zeppelin",
    genre: "Hard Rock",
    image: "https://cdn-images.dzcdn.net/images/artist/2cf138b96a63da677ac6fb79846607c8/250x250-000000-80-0-0.jpg",
  },
];

const STREAMING_PLATFORMS = [
  { id: "spotify", name: "Spotify", desc: "Launch directly in Spotify app" },
  { id: "apple_music", name: "Apple Music", desc: "Open inside Apple Music player" },
  { id: "youtube_music", name: "YouTube Music", desc: "Stream directly on YouTube Music" },
  { id: "youtube", name: "YouTube", desc: "Stream video version on YouTube" },
  { id: "deezer", name: "Deezer", desc: "Open in Deezer audio player" },
  { id: "tidal", name: "TIDAL", desc: "Hi-Res streaming in TIDAL" },
  { id: "none", name: "Universal / Ask", desc: "Always choose on each share" },
];

const LISTENING_VIBES = [
  {
    id: "full_album",
    title: "Full Album Purist",
    desc: "I listen to full LPs from front to back, disc by disc.",
    icon: Disc,
  },
  {
    id: "crate_digger",
    title: "Crate Digger",
    desc: "Surprise me with rare B-sides, pressings, and obscure deep cuts.",
    icon: Compass,
  },
  {
    id: "hits",
    title: "High Energy & Hits",
    desc: "Keep the momentum going with signature anthems.",
    icon: Flame,
  },
  {
    id: "ambient",
    title: "Late-Night & Ambient",
    desc: "Lo-fi atmospheric soundscapes for deep focus and chill.",
    icon: Headphones,
  },
];

export default function OnboardingModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState(1); // 1 to 5

  // Step 1: Identity
  const [name, setName] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState(AVAILABLE_AVATARS[0]);

  // Step 2: Genres
  const [selectedGenres, setSelectedGenres] = useState(["Rock", "Indie", "Electronic"]);
  const [customGenre, setCustomGenre] = useState("");

  // Step 3: Artists (stores rich objects: { id, name, genre, image })
  const [selectedArtists, setSelectedArtists] = useState([CURATED_ARTISTS[0], CURATED_ARTISTS[1]]);
  const [artistSearchQuery, setArtistSearchQuery] = useState("");
  const [artistSearchResults, setArtistSearchResults] = useState([]);
  const [isSearchingArtists, setIsSearchingArtists] = useState(false);

  // Step 4: Streaming & Habits
  const [preferredPlatform, setPreferredPlatform] = useState("spotify");
  const [listeningVibe, setListeningVibe] = useState("full_album");
  const [showVinylSides, setShowVinylSides] = useState(true);

  useEffect(() => {
    setMounted(true);

    // Check if new user has completed onboarding
    const completed = localStorage.getItem("groove_onboarding_completed");
    if (!completed) {
      const timer = setTimeout(() => {
        setName(generateRandomName());
        setIsOpen(true);
      }, 700);
      return () => clearTimeout(timer);
    }

    // Listen for manual replay request from settings/account
    const handleReplay = () => {
      // Pre-fill existing data if available
      const savedName = localStorage.getItem("userName");
      const savedGenres = JSON.parse(localStorage.getItem("favoriteGenres") || "[]");
      const savedArtistsList = JSON.parse(localStorage.getItem("savedArtists") || "[]");
      const savedPlatform = localStorage.getItem("preferred_music_platform") || "spotify";
      const savedAvatarId = localStorage.getItem("userAvatar");

      if (savedName) setName(savedName);
      else setName(generateRandomName());

      if (savedAvatarId) {
        const foundAv = AVAILABLE_AVATARS.find((a) => a.id === savedAvatarId);
        if (foundAv) setSelectedAvatar(foundAv);
      }

      if (savedGenres.length > 0) setSelectedGenres(savedGenres);
      if (savedArtistsList.length > 0) {
        // Normalize items to rich objects
        setSelectedArtists(
          savedArtistsList.map((a) => {
            if (typeof a === "object") {
              const matched = CURATED_ARTISTS.find(
                (c) => c.name.toLowerCase() === (a.name || a.title || "").toLowerCase()
              );
              return {
                id: a.id || matched?.id || encodeURIComponent(a.name || a.title),
                name: a.name || a.title,
                image: a.image || a.url || matched?.image || "",
                genre: a.genre || matched?.genre || "Artist",
              };
            }
            const matched = CURATED_ARTISTS.find((c) => c.name.toLowerCase() === a.toLowerCase());
            return {
              id: matched?.id || encodeURIComponent(a),
              name: a,
              image: matched?.image || "",
              genre: matched?.genre || "Artist",
            };
          })
        );
      }
      setPreferredPlatform(savedPlatform);

      setStep(1);
      setIsOpen(true);
    };

    window.addEventListener("open-onboarding", handleReplay);
    return () => window.removeEventListener("open-onboarding", handleReplay);
  }, []);

  const handleRollName = () => {
    const fresh = generateRandomName();
    setName(fresh);
    toast.success(`Generated: "${fresh}" 🎲`);
  };

  const toggleGenre = (genreId) => {
    if (selectedGenres.includes(genreId)) {
      setSelectedGenres(selectedGenres.filter((g) => g !== genreId));
    } else {
      setSelectedGenres([...selectedGenres, genreId]);
    }
  };

  const handleAddCustomGenre = () => {
    const clean = customGenre.trim();
    if (!clean) return;
    if (!selectedGenres.includes(clean)) {
      setSelectedGenres([...selectedGenres, clean]);
    }
    setCustomGenre("");
  };

  const toggleArtist = (artistObj) => {
    const exists = selectedArtists.some(
      (a) => a.name.toLowerCase() === artistObj.name.toLowerCase() || (a.id && artistObj.id && a.id === artistObj.id)
    );
    if (exists) {
      setSelectedArtists(
        selectedArtists.filter(
          (a) =>
            a.name.toLowerCase() !== artistObj.name.toLowerCase() &&
            (!artistObj.id || a.id !== artistObj.id)
        )
      );
    } else {
      setSelectedArtists([...selectedArtists, artistObj]);
    }
  };

  const handleSearchArtists = async (query) => {
    setArtistSearchQuery(query);
    const clean = query.trim();
    if (!clean) {
      setArtistSearchResults([]);
      return;
    }

    setIsSearchingArtists(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(clean)}&type=artist&limit=6`);
      if (res.ok) {
        const data = await res.json();
        setArtistSearchResults(data.results || []);
      }
    } catch (_) {
    } finally {
      setIsSearchingArtists(false);
    }
  };

  const handleNext = () => {
    if (step === 1 && !name.trim()) {
      setName(generateRandomName());
    }
    if (step < 5) {
      setStep(step + 1);
      if (step + 1 === 5) {
        triggerConfettiCelebration();
      }
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const triggerConfettiCelebration = () => {
    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
        colors: ["#D4AF37", "#E8A87C", "#A238FF", "#1DB954"],
      });
    } catch (_) {}
  };

  const handleComplete = () => {
    const finalName = name.trim() || generateRandomName();

    localStorage.setItem("userName", finalName);
    localStorage.setItem("userAvatar", selectedAvatar.id);
    localStorage.setItem("userAvatarLabel", selectedAvatar.label);
    localStorage.setItem("favoriteGenres", JSON.stringify(selectedGenres));
    localStorage.setItem("preferred_music_platform", preferredPlatform);
    localStorage.setItem("groove_listening_vibe", listeningVibe);
    localStorage.setItem("groove_show_vinyl_sides", String(showVinylSides));

    // Save selected artists with real ID and real Image so library always has authentic portraits
    const artistObjects = selectedArtists.map((a) => {
      const artName = a.name || a.title || "Artist";
      const matched = CURATED_ARTISTS.find((c) => c.name.toLowerCase() === artName.toLowerCase());
      return {
        id: a.id || matched?.id || encodeURIComponent(artName),
        name: artName,
        title: artName,
        artist: artName,
        image: a.image || a.url || matched?.image || "",
        coverArt: a.image || a.url || matched?.image || "",
        type: "artist",
        genre: a.genre || matched?.genre || "Artist",
      };
    });
    localStorage.setItem("savedArtists", JSON.stringify(artistObjects));

    // Mark completed
    localStorage.setItem("groove_onboarding_completed", "true");
    localStorage.setItem("groove_onboarding_date", new Date().toISOString());

    // Dispatch profile update event for live UI reactivity
    window.dispatchEvent(new CustomEvent("groove-profile-updated"));

    toast.success(`Welcome to GrooveEstrella, ${finalName}!`);
    setIsOpen(false);
  };

  const handleSkip = () => {
    const finalName = name.trim() || generateRandomName();
    localStorage.setItem("userName", finalName);
    localStorage.setItem("groove_onboarding_completed", "true");
    window.dispatchEvent(new CustomEvent("groove-profile-updated"));
    setIsOpen(false);
  };

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-[var(--theme-card)] border border-[var(--theme-border)] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Progress Bar & Header */}
        <div className="p-5 pb-3 border-b border-[var(--theme-border)] bg-[var(--theme-surface)]/50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--theme-accent)] animate-pulse" />
              <span className="text-xs font-bold text-[var(--theme-fg)] tracking-wider uppercase font-mono">
                Setup • Step {step} of 5
              </span>
            </div>
            <button
              onClick={handleSkip}
              className="text-xs font-semibold text-[var(--theme-muted)] hover:text-[var(--theme-fg)] transition cursor-pointer"
            >
              Skip setup
            </button>
          </div>

          {/* Stepper bar */}
          <div className="w-full bg-[var(--theme-surface)] h-1.5 rounded-full overflow-hidden flex">
            {[1, 2, 3, 4, 5].map((s) => (
              <div
                key={s}
                className={`flex-1 h-full transition-all duration-300 ${
                  s <= step ? "bg-[var(--theme-accent)]" : "bg-[var(--theme-border)]/50"
                } ${s > 1 ? "border-l border-[var(--theme-card)]" : ""}`}
              />
            ))}
          </div>
        </div>

        {/* Scrollable Body Content */}
        <div className="p-6 overflow-y-auto flex-1">
          <AnimatePresence mode="wait">
            {/* STEP 1: IDENTITY */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center space-y-1.5">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[var(--theme-accent)]/15 border border-[var(--theme-accent)]/30 text-[var(--theme-accent)] mb-2 shadow-inner">
                    <UserAvatarIcon avatarId={selectedAvatar.id} className="w-6 h-6 text-[var(--theme-accent)]" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-[var(--theme-fg)] font-display tracking-tight">
                    Welcome to the Music Layer
                  </h2>
                  <p className="text-xs sm:text-sm text-[var(--theme-muted)] max-w-sm mx-auto">
                    Claim your listener handle and pick your vinyl-inspired groove avatar.
                  </p>
                </div>

                {/* Name Input with Roll Dice */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[var(--theme-muted)] uppercase tracking-wider">
                    Your Listener Handle
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Velvet Groove"
                        maxLength={30}
                        className="w-full bg-[var(--theme-surface)] border border-[var(--theme-border)] focus:border-[var(--theme-accent)] focus:ring-1 focus:ring-[var(--theme-accent)] rounded-2xl px-4 py-3 text-sm font-bold text-[var(--theme-fg)] outline-none transition"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleRollName}
                      className="h-11 px-3.5 rounded-2xl bg-[var(--theme-surface)] hover:bg-[var(--theme-card)] border border-[var(--theme-border)] hover:border-[var(--theme-accent)] text-[var(--theme-fg)] transition flex items-center justify-center gap-1.5 text-xs font-bold active:scale-95 cursor-pointer shadow-sm"
                      title="Roll a random vinyl adjective + noun name"
                    >
                      <Dice5 size={16} className="text-[var(--theme-accent)]" />
                      <span>Roll</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-[var(--theme-muted)]">
                    Pick a name or tap roll for a fun adjective + noun combination.
                  </p>
                </div>

                {/* Clean Vector Avatar Picker (Zero Emojis) */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[var(--theme-muted)] uppercase tracking-wider">
                    Choose Your Music Avatar
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {AVAILABLE_AVATARS.map((av) => {
                      const isSelected = selectedAvatar.id === av.id;
                      const IconComp = av.icon;
                      return (
                        <button
                          key={av.id}
                          onClick={() => setSelectedAvatar(av)}
                          type="button"
                          className={`p-3 rounded-2xl border text-center flex flex-col items-center gap-1.5 transition-all duration-200 cursor-pointer active:scale-95 ${
                            isSelected
                              ? "bg-[var(--theme-accent)]/15 border-[var(--theme-accent)] ring-1 ring-[var(--theme-accent)]/40 shadow-md text-[var(--theme-accent)]"
                              : "bg-[var(--theme-surface)] border-[var(--theme-border)] text-[var(--theme-muted)] hover:text-[var(--theme-fg)] hover:border-[var(--theme-accent)]/50"
                          }`}
                        >
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br ${av.bg} shadow-inner`}>
                            <IconComp className="w-5 h-5 text-[var(--theme-fg)]" />
                          </div>
                          <span className="text-[10px] font-semibold text-[var(--theme-fg)] truncate max-w-full">
                            {av.label.split(" ")[0]}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 2: FAVORITE GENRES (Clean Icons - Zero Emojis) */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                <div className="text-center space-y-1.5">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[var(--theme-accent)]/15 border border-[var(--theme-accent)]/30 text-[var(--theme-accent)] mb-2 shadow-inner">
                    <Music size={24} />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-[var(--theme-fg)] font-display tracking-tight">
                    What sounds move you?
                  </h2>
                  <p className="text-xs sm:text-sm text-[var(--theme-muted)] max-w-sm mx-auto">
                    Select your favorite musical genres to customize your exploration and discovery feed.
                  </p>
                </div>

                {/* Genre Pills Grid */}
                <div className="flex flex-wrap gap-2 justify-center max-h-56 overflow-y-auto p-1 scrollbar-none">
                  {POPULAR_GENRES.map((g) => {
                    const isSelected = selectedGenres.includes(g.id);
                    const IconComp = g.icon;
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => toggleGenre(g.id)}
                        className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer active:scale-95 border ${
                          isSelected
                            ? "bg-[var(--theme-accent)] border-[var(--theme-accent)] text-[var(--theme-accent-fg)] shadow-md"
                            : "bg-[var(--theme-surface)] border-[var(--theme-border)] text-[var(--theme-fg)] hover:border-[var(--theme-accent)]/50"
                        }`}
                      >
                        <IconComp className="w-3.5 h-3.5 shrink-0" />
                        <span>{g.label}</span>
                        {isSelected && <Check size={12} className="ml-0.5" />}
                      </button>
                    );
                  })}
                </div>

                {/* Custom Genre Adder */}
                <div className="flex items-center gap-2 pt-2 border-t border-[var(--theme-border)]">
                  <input
                    type="text"
                    value={customGenre}
                    onChange={(e) => setCustomGenre(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddCustomGenre()}
                    placeholder="Add custom genre (e.g. Dream Pop)..."
                    className="flex-1 bg-[var(--theme-surface)] border border-[var(--theme-border)] focus:border-[var(--theme-accent)] rounded-xl px-3.5 py-2 text-xs font-medium text-[var(--theme-fg)] outline-none"
                  />
                  <button
                    onClick={handleAddCustomGenre}
                    type="button"
                    className="h-9 px-3 rounded-xl bg-[var(--theme-surface)] border border-[var(--theme-border)] hover:border-[var(--theme-accent)] text-[var(--theme-fg)] text-xs font-bold flex items-center justify-center gap-1 active:scale-95 cursor-pointer"
                  >
                    <Plus size={14} />
                    <span>Add</span>
                  </button>
                </div>
                <p className="text-[11px] text-[var(--theme-muted)] text-center font-medium">
                  {selectedGenres.length} genre{selectedGenres.length === 1 ? "" : "s"} selected
                </p>
              </motion.div>
            )}

            {/* STEP 3: FAVORITE ARTISTS WITH REAL PORTRAITS & SEARCH */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="text-center space-y-1">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[var(--theme-accent)]/15 border border-[var(--theme-accent)]/30 text-[var(--theme-accent)] mb-1 shadow-inner">
                    <Heart size={24} />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-[var(--theme-fg)] font-display tracking-tight">
                    Who's in your rotation?
                  </h2>
                  <p className="text-xs sm:text-sm text-[var(--theme-muted)] max-w-sm mx-auto">
                    Pick legendary artists or search for anyone in the open catalog.
                  </p>
                </div>

                {/* Curated Artists Cards Grid with Real Cover Photos */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1 scrollbar-none">
                  {CURATED_ARTISTS.map((artist) => {
                    const isSelected = selectedArtists.some(
                      (a) =>
                        a.name.toLowerCase() === artist.name.toLowerCase() ||
                        (a.id && a.id === artist.id)
                    );
                    return (
                      <button
                        key={artist.name}
                        type="button"
                        onClick={() => toggleArtist(artist)}
                        className={`flex items-center gap-2 p-1.5 rounded-2xl text-xs font-bold transition-all duration-200 cursor-pointer active:scale-95 border text-left ${
                          isSelected
                            ? "bg-[var(--theme-accent)]/15 border-[var(--theme-accent)] text-[var(--theme-fg)] shadow-md ring-1 ring-[var(--theme-accent)]/30"
                            : "bg-[var(--theme-surface)] border-[var(--theme-border)] text-[var(--theme-fg)] hover:border-[var(--theme-accent)]/50"
                        }`}
                      >
                        <img
                          src={artist.image}
                          alt={artist.name}
                          className="w-8 h-8 rounded-full object-cover shrink-0 ring-1 ring-[var(--theme-border)]"
                          onError={(e) => {
                            e.currentTarget.src = "https://placehold.co/100x100/17020B/E8A87C?text=Artist";
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-xs truncate leading-tight text-[var(--theme-fg)]">{artist.name}</p>
                          <p className="text-[10px] text-[var(--theme-muted)] truncate">{artist.genre}</p>
                        </div>
                        <div
                          className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 border transition ${
                            isSelected
                              ? "bg-[var(--theme-accent)] border-[var(--theme-accent)] text-[var(--theme-accent-fg)]"
                              : "border-[var(--theme-border)] bg-[var(--theme-card)]"
                          }`}
                        >
                          {isSelected && <Check size={10} />}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Real Live Artist Search */}
                <div className="space-y-2 pt-2 border-t border-[var(--theme-border)]">
                  <div className="relative flex items-center">
                    <Search className="w-4 h-4 text-[var(--theme-muted)] absolute left-3 pointer-events-none" />
                    <input
                      type="text"
                      value={artistSearchQuery}
                      onChange={(e) => handleSearchArtists(e.target.value)}
                      placeholder="Search any artist catalog (e.g. Radiohead)..."
                      className="w-full bg-[var(--theme-surface)] border border-[var(--theme-border)] focus:border-[var(--theme-accent)] rounded-xl pl-9 pr-8 py-2 text-xs font-medium text-[var(--theme-fg)] outline-none"
                    />
                    {isSearchingArtists && (
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-[var(--theme-accent)] border-t-transparent animate-spin absolute right-3" />
                    )}
                  </div>

                  {/* Real Search Results with Real Photos */}
                  {artistSearchResults.length > 0 && (
                    <div className="bg-[var(--theme-surface)] border border-[var(--theme-border)] rounded-2xl p-1.5 shadow-xl space-y-1 max-h-36 overflow-y-auto">
                      {artistSearchResults.map((art) => {
                        const isSelected = selectedArtists.some(
                          (a) => a.name.toLowerCase() === art.name.toLowerCase() || (a.id && a.id === art.id)
                        );
                        const artImage = art.image || art.url || "https://placehold.co/100x100/17020B/E8A87C?text=Artist";
                        return (
                          <div
                            key={art.id}
                            onClick={() =>
                              toggleArtist({
                                id: art.id,
                                name: art.name,
                                image: artImage,
                                genre: art.genres?.[0] || "Artist",
                              })
                            }
                            className="flex items-center justify-between gap-2 p-1.5 rounded-xl hover:bg-[var(--theme-card)] cursor-pointer transition"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <img
                                src={artImage}
                                alt={art.name}
                                className="w-7 h-7 rounded-full object-cover shrink-0"
                                onError={(e) => {
                                  e.currentTarget.src = "https://placehold.co/100x100/17020B/E8A87C?text=Artist";
                                }}
                              />
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-[var(--theme-fg)] truncate">{art.name}</p>
                                <p className="text-[10px] text-[var(--theme-muted)] truncate">
                                  {art.country || art.genres?.[0] || "Artist"}
                                </p>
                              </div>
                            </div>
                            <span
                              className={`p-1 rounded-full text-xs font-bold transition ${
                                isSelected
                                  ? "bg-[var(--theme-accent)] text-[var(--theme-accent-fg)]"
                                  : "bg-[var(--theme-card)] border border-[var(--theme-border)] text-[var(--theme-fg)]"
                              }`}
                            >
                              {isSelected ? <Check size={11} /> : <Plus size={11} />}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <p className="text-[11px] text-[var(--theme-muted)] text-center font-medium">
                  {selectedArtists.length} artist{selectedArtists.length === 1 ? "" : "s"} bookmarked with real photo portraits
                </p>
              </motion.div>
            )}

            {/* STEP 4: STREAMING SERVICE & LISTENING VIBE */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                <div className="text-center space-y-1.5">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[var(--theme-accent)]/15 border border-[var(--theme-accent)]/30 text-[var(--theme-accent)] mb-2 shadow-inner">
                    <Sliders size={24} />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-[var(--theme-fg)] font-display tracking-tight">
                    How do you listen?
                  </h2>
                  <p className="text-xs sm:text-sm text-[var(--theme-muted)] max-w-sm mx-auto">
                    Choose your default music player for GrooveLink instant playback.
                  </p>
                </div>

                {/* Primary Streaming Platform */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[var(--theme-muted)] uppercase tracking-wider">
                    Default Music App
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {STREAMING_PLATFORMS.map((plat) => {
                      const isSelected = preferredPlatform === plat.id;
                      return (
                        <button
                          key={plat.id}
                          type="button"
                          onClick={() => setPreferredPlatform(plat.id)}
                          className={`p-3 rounded-2xl border text-left transition-all duration-200 cursor-pointer active:scale-95 ${
                            isSelected
                              ? "bg-[var(--theme-accent)]/15 border-[var(--theme-accent)] ring-1 ring-[var(--theme-accent)]/40 shadow-md"
                              : "bg-[var(--theme-surface)] border-[var(--theme-border)] hover:border-[var(--theme-accent)]/50"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-xs font-bold text-[var(--theme-fg)]">{plat.name}</span>
                            {isSelected && <Check size={13} className="text-[var(--theme-accent)]" />}
                          </div>
                          <p className="text-[10px] text-[var(--theme-muted)] line-clamp-1">{plat.desc}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Listening Vibe */}
                <div className="space-y-2 pt-2 border-t border-[var(--theme-border)]">
                  <label className="text-xs font-bold text-[var(--theme-muted)] uppercase tracking-wider">
                    Your Listening Style
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {LISTENING_VIBES.map((vibe) => {
                      const isSelected = listeningVibe === vibe.id;
                      const IconComp = vibe.icon;
                      return (
                        <button
                          key={vibe.id}
                          type="button"
                          onClick={() => setListeningVibe(vibe.id)}
                          className={`p-2.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer active:scale-95 ${
                            isSelected
                              ? "bg-[var(--theme-accent)]/15 border-[var(--theme-accent)] ring-1 ring-[var(--theme-accent)]/40"
                              : "bg-[var(--theme-surface)] border-[var(--theme-border)] hover:border-[var(--theme-accent)]/50"
                          }`}
                        >
                          <div className="flex items-center gap-1.5 mb-1">
                            <IconComp size={14} className="text-[var(--theme-accent)] shrink-0" />
                            <span className="text-xs font-bold text-[var(--theme-fg)] truncate">{vibe.title}</span>
                          </div>
                          <p className="text-[10px] text-[var(--theme-muted)] line-clamp-2">{vibe.desc}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 5: CELEBRATION & READY */}
            {step === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6 text-center"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-br from-amber-400/20 via-[var(--theme-accent)]/30 to-purple-500/20 border border-[var(--theme-accent)]/40 shadow-xl">
                  <UserAvatarIcon avatarId={selectedAvatar.id} className="w-8 h-8 text-[var(--theme-accent)]" />
                </div>

                <div className="space-y-1">
                  <h2 className="text-2xl font-black text-[var(--theme-fg)] font-display tracking-tight">
                    You're All Set! 🚀
                  </h2>
                  <p className="text-xs sm:text-sm text-[var(--theme-muted)] max-w-sm mx-auto">
                    Your personal music profile is ready. Here's a snapshot of your groove taste:
                  </p>
                </div>

                {/* Profile Summary Card */}
                <div className="p-4 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)]/80 text-left space-y-3 shadow-md">
                  <div className="flex items-center justify-between border-b border-[var(--theme-border)]/50 pb-2.5">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--theme-accent)]">
                        Profile
                      </span>
                      <h4 className="text-base font-bold text-[var(--theme-fg)]">{name}</h4>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[var(--theme-card)] border border-[var(--theme-border)] text-[var(--theme-fg)]">
                      {STREAMING_PLATFORMS.find((p) => p.id === preferredPlatform)?.name || "Universal"}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--theme-muted)]">
                      Favorite Genres
                    </span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedGenres.slice(0, 6).map((g) => (
                        <span
                          key={g}
                          className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-[var(--theme-card)] border border-[var(--theme-border)] text-[var(--theme-fg)]"
                        >
                          {g}
                        </span>
                      ))}
                      {selectedGenres.length > 6 && (
                        <span className="text-[10px] text-[var(--theme-muted)] px-1">
                          +{selectedGenres.length - 6} more
                        </span>
                      )}
                    </div>
                  </div>

                  {selectedArtists.length > 0 && (
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--theme-muted)]">
                        Top Artists
                      </span>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {selectedArtists.slice(0, 5).map((a) => (
                          <span
                            key={typeof a === "object" ? a.name : a}
                            className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-lg bg-[var(--theme-card)] border border-[var(--theme-border)] text-[var(--theme-fg)]"
                          >
                            {typeof a === "object" && a.image && (
                              <img src={a.image} alt="" className="w-3.5 h-3.5 rounded-full object-cover" />
                            )}
                            <span>{typeof a === "object" ? a.name : a}</span>
                          </span>
                        ))}
                        {selectedArtists.length > 5 && (
                          <span className="text-[10px] text-[var(--theme-muted)] px-1">
                            +{selectedArtists.length - 5} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Navigation Bar */}
        <div className="p-4 sm:p-5 border-t border-[var(--theme-border)] bg-[var(--theme-surface)]/90 backdrop-blur-md flex items-center justify-between gap-3">
          {step > 1 ? (
            <button
              onClick={handleBack}
              type="button"
              className="px-4 py-2.5 rounded-2xl bg-[var(--theme-surface)] hover:bg-[var(--theme-card)] border border-[var(--theme-border)] text-[var(--theme-fg)] font-bold text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          <button
            onClick={handleNext}
            type="button"
            className="px-6 py-2.5 rounded-2xl bg-[var(--theme-accent)] hover:opacity-95 text-[var(--theme-accent-fg)] font-extrabold text-xs sm:text-sm flex items-center gap-2 transition active:scale-95 shadow-lg shadow-[var(--theme-accent)]/20 cursor-pointer ml-auto"
          >
            <span>{step === 5 ? "Enter GrooveEstrella" : "Continue"}</span>
            <ChevronRight size={15} />
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
