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
} from "lucide-react";
import confetti from "canvas-confetti";
import { toast } from "@/lib/toast";
import { generateRandomName } from "@/lib/nameGenerator";

const AVATAR_OPTIONS = [
  { id: "headphones", icon: "🎧", label: "Audiophile", bg: "from-amber-500/20 to-rose-500/20" },
  { id: "vinyl", icon: "💿", label: "Vinyl Junkie", bg: "from-purple-500/20 to-blue-500/20" },
  { id: "flame", icon: "🔥", label: "Trendsetter", bg: "from-orange-500/20 to-amber-500/20" },
  { id: "cosmic", icon: "🌌", label: "Stargazer", bg: "from-indigo-500/20 to-cyan-500/20" },
  { id: "cassette", icon: "📼", label: "Retro Head", bg: "from-emerald-500/20 to-teal-500/20" },
  { id: "sax", icon: "🎷", label: "Soul Groover", bg: "from-pink-500/20 to-yellow-500/20" },
];

const POPULAR_GENRES = [
  { id: "Rock", label: "Rock", emoji: "🎸" },
  { id: "Indie", label: "Indie", emoji: "🌿" },
  { id: "Pop", label: "Pop", emoji: "🍬" },
  { id: "Synthpop", label: "Synthpop", emoji: "🕹️" },
  { id: "Electronic", label: "Electronic", emoji: "⚡" },
  { id: "Hip Hop", label: "Hip Hop", emoji: "🎤" },
  { id: "Jazz", label: "Jazz", emoji: "🎷" },
  { id: "Classical", label: "Classical", emoji: "🎻" },
  { id: "Alternative", label: "Alternative", emoji: "🌀" },
  { id: "Metal", label: "Metal", emoji: "🤘" },
  { id: "R&B", label: "R&B", emoji: "🎙️" },
  { id: "Funk", label: "Funk", emoji: "🕺" },
  { id: "Ambient", label: "Ambient", emoji: "🌌" },
  { id: "Soul", label: "Soul", emoji: "🕯️" },
  { id: "Disco", label: "Disco", emoji: "🪩" },
  { id: "Punk", label: "Punk", emoji: "🧷" },
  { id: "Blues", label: "Blues", emoji: "🎺" },
  { id: "Folk", label: "Folk", emoji: "🪕" },
];

const CURATED_ARTISTS = [
  { name: "The Beatles", genre: "Classic Rock" },
  { name: "David Bowie", genre: "Glam / Art Rock" },
  { name: "Daft Punk", genre: "Electronic" },
  { name: "Pink Floyd", genre: "Psychedelic Rock" },
  { name: "Queen", genre: "Rock" },
  { name: "Radiohead", genre: "Alternative" },
  { name: "Michael Jackson", genre: "Pop / R&B" },
  { name: "Kendrick Lamar", genre: "Hip Hop" },
  { name: "Fleetwood Mac", genre: "Rock" },
  { name: "Taylor Swift", genre: "Pop" },
  { name: "Arctic Monkeys", genre: "Indie Rock" },
  { name: "Led Zeppelin", genre: "Hard Rock" },
  { name: "Lana Del Rey", genre: "Dream Pop" },
  { name: "Miles Davis", genre: "Jazz" },
  { name: "Tame Impala", genre: "Psychedelic Pop" },
  { name: "Gorillaz", genre: "Alternative" },
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
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_OPTIONS[0]);

  // Step 2: Genres
  const [selectedGenres, setSelectedGenres] = useState(["Rock", "Indie", "Electronic"]);
  const [customGenre, setCustomGenre] = useState("");

  // Step 3: Artists
  const [selectedArtists, setSelectedArtists] = useState(["David Bowie", "Daft Punk"]);
  const [customArtist, setCustomArtist] = useState("");

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

      if (savedName) setName(savedName);
      else setName(generateRandomName());

      if (savedGenres.length > 0) setSelectedGenres(savedGenres);
      if (savedArtistsList.length > 0) {
        setSelectedArtists(savedArtistsList.map((a) => (typeof a === "object" ? a.name : a)));
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

  const toggleArtist = (artistName) => {
    if (selectedArtists.includes(artistName)) {
      setSelectedArtists(selectedArtists.filter((a) => a !== artistName));
    } else {
      setSelectedArtists([...selectedArtists, artistName]);
    }
  };

  const handleAddCustomArtist = () => {
    const clean = customArtist.trim();
    if (!clean) return;
    if (!selectedArtists.includes(clean)) {
      setSelectedArtists([...selectedArtists, clean]);
    }
    setCustomArtist("");
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
    localStorage.setItem("userAvatar", selectedAvatar.icon);
    localStorage.setItem("userAvatarLabel", selectedAvatar.label);
    localStorage.setItem("favoriteGenres", JSON.stringify(selectedGenres));
    localStorage.setItem("preferred_music_platform", preferredPlatform);
    localStorage.setItem("groove_listening_vibe", listeningVibe);
    localStorage.setItem("groove_show_vinyl_sides", String(showVinylSides));

    // Save selected artists
    const artistObjects = selectedArtists.map((a) => ({
      name: a,
      id: encodeURIComponent(a),
      type: "artist",
    }));
    localStorage.setItem("savedArtists", JSON.stringify(artistObjects));

    // Mark completed
    localStorage.setItem("groove_onboarding_completed", "true");
    localStorage.setItem("groove_onboarding_date", new Date().toISOString());

    // Dispatch profile update event for live UI reactivity
    window.dispatchEvent(new CustomEvent("groove-profile-updated"));

    toast.success(`Welcome to GrooveEstrella, ${finalName}! 🎵`);
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
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      {/* Ambient Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/85 backdrop-blur-xl"
        onClick={() => {}}
      />

      {/* Main Glass Card Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 320 }}
        className="relative w-full max-w-xl bg-[var(--theme-card)]/95 border border-[var(--theme-border)] rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden z-10 font-sans"
      >
        {/* Top Liquid Progress Bar */}
        <div className="relative w-full h-1.5 bg-[var(--theme-surface)]">
          <motion.div
            className="h-full bg-gradient-to-r from-[var(--theme-accent)] via-amber-400 to-[var(--theme-accent)]"
            initial={{ width: "20%" }}
            animate={{ width: `${(step / 5) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Header Controls */}
        <div className="px-5 py-4 border-b border-[var(--theme-border)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            {step > 1 && (
              <button
                onClick={handleBack}
                className="p-1.5 rounded-full hover:bg-[var(--theme-surface)] text-[var(--theme-muted)] hover:text-[var(--theme-fg)] transition cursor-pointer"
                title="Previous step"
              >
                <ArrowLeft size={16} />
              </button>
            )}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-extrabold tracking-wider uppercase text-[var(--theme-accent)]">
                Step {step} of 5
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSkip}
              className="text-xs text-[var(--theme-muted)] hover:text-[var(--theme-fg)] font-semibold transition cursor-pointer px-2 py-1"
            >
              Skip
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
          <AnimatePresence mode="wait">
            {/* STEP 1: IDENTITY & NAME */}
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
                    <Sparkles size={24} />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-[var(--theme-fg)] font-display tracking-tight">
                    Welcome to GrooveEstrella
                  </h2>
                  <p className="text-xs sm:text-sm text-[var(--theme-muted)] max-w-sm mx-auto">
                    Let's craft your music explorer identity. We rolled an aesthetic name for you!
                  </p>
                </div>

                {/* Live Identity Badge Preview */}
                <div className="p-4 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)]/80 flex items-center gap-4 shadow-sm">
                  <div
                    className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${selectedAvatar.bg} border border-[var(--theme-border)] flex items-center justify-center text-2xl shadow-inner shrink-0`}
                  >
                    {selectedAvatar.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--theme-accent)]">
                      {selectedAvatar.label}
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-[var(--theme-fg)] truncate">
                      {name || "Cosmic Groover"}
                    </h3>
                  </div>
                </div>

                {/* Name Generator & Custom Input */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[var(--theme-muted)] uppercase tracking-wider">
                    Explorer Handle
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter a display name..."
                      className="flex-1 bg-[var(--theme-surface)] border border-[var(--theme-border)] focus:border-[var(--theme-accent)] rounded-xl px-3.5 py-2.5 text-sm font-semibold text-[var(--theme-fg)] outline-none transition shadow-sm"
                    />
                    <button
                      onClick={handleRollName}
                      type="button"
                      className="h-10 px-3.5 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] hover:border-[var(--theme-accent)] text-[var(--theme-accent)] flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer shadow-sm text-xs font-bold shrink-0"
                      title="Roll a new random aesthetic music name"
                    >
                      <Dice5 size={16} />
                      <span className="hidden sm:inline">Reroll</span>
                    </button>
                  </div>
                </div>

                {/* Avatar Picker */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[var(--theme-muted)] uppercase tracking-wider">
                    Choose Your Music Avatar
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {AVATAR_OPTIONS.map((av) => {
                      const isSelected = selectedAvatar.id === av.id;
                      return (
                        <button
                          key={av.id}
                          onClick={() => setSelectedAvatar(av)}
                          type="button"
                          className={`p-2.5 rounded-2xl border text-center flex flex-col items-center gap-1 transition-all duration-200 cursor-pointer active:scale-95 ${
                            isSelected
                              ? "bg-[var(--theme-accent)]/15 border-[var(--theme-accent)] ring-1 ring-[var(--theme-accent)]/40 shadow-md"
                              : "bg-[var(--theme-surface)] border-[var(--theme-border)] hover:border-[var(--theme-accent)]/50"
                          }`}
                        >
                          <span className="text-2xl">{av.icon}</span>
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

            {/* STEP 2: FAVORITE GENRES */}
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
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => toggleGenre(g.id)}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer active:scale-95 border ${
                          isSelected
                            ? "bg-[var(--theme-accent)] border-[var(--theme-accent)] text-[var(--theme-accent-fg)] shadow-md"
                            : "bg-[var(--theme-surface)] border-[var(--theme-border)] text-[var(--theme-fg)] hover:border-[var(--theme-accent)]/50"
                        }`}
                      >
                        <span>{g.emoji}</span>
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

            {/* STEP 3: FAVORITE ARTISTS */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                <div className="text-center space-y-1.5">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[var(--theme-accent)]/15 border border-[var(--theme-accent)]/30 text-[var(--theme-accent)] mb-2 shadow-inner">
                    <Heart size={24} />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-[var(--theme-fg)] font-display tracking-tight">
                    Who's in your rotation?
                  </h2>
                  <p className="text-xs sm:text-sm text-[var(--theme-muted)] max-w-sm mx-auto">
                    Pick legendary artists you love or add your personal favorites.
                  </p>
                </div>

                {/* Curated Artists Chips */}
                <div className="flex flex-wrap gap-2 justify-center max-h-56 overflow-y-auto p-1 scrollbar-none">
                  {CURATED_ARTISTS.map((artist) => {
                    const isSelected = selectedArtists.includes(artist.name);
                    return (
                      <button
                        key={artist.name}
                        type="button"
                        onClick={() => toggleArtist(artist.name)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer active:scale-95 border ${
                          isSelected
                            ? "bg-[var(--theme-accent)] border-[var(--theme-accent)] text-[var(--theme-accent-fg)] shadow-md"
                            : "bg-[var(--theme-surface)] border-[var(--theme-border)] text-[var(--theme-fg)] hover:border-[var(--theme-accent)]/50"
                        }`}
                      >
                        <span>{artist.name}</span>
                        {isSelected && <Check size={12} />}
                      </button>
                    );
                  })}
                </div>

                {/* Custom Artist Adder */}
                <div className="flex items-center gap-2 pt-2 border-t border-[var(--theme-border)]">
                  <input
                    type="text"
                    value={customArtist}
                    onChange={(e) => setCustomArtist(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddCustomArtist()}
                    placeholder="Search or add any artist (e.g. Pink Floyd)..."
                    className="flex-1 bg-[var(--theme-surface)] border border-[var(--theme-border)] focus:border-[var(--theme-accent)] rounded-xl px-3.5 py-2 text-xs font-medium text-[var(--theme-fg)] outline-none"
                  />
                  <button
                    onClick={handleAddCustomArtist}
                    type="button"
                    className="h-9 px-3 rounded-xl bg-[var(--theme-surface)] border border-[var(--theme-border)] hover:border-[var(--theme-accent)] text-[var(--theme-fg)] text-xs font-bold flex items-center justify-center gap-1 active:scale-95 cursor-pointer"
                  >
                    <Plus size={14} />
                    <span>Add</span>
                  </button>
                </div>
                <p className="text-[11px] text-[var(--theme-muted)] text-center font-medium">
                  {selectedArtists.length} artist{selectedArtists.length === 1 ? "" : "s"} bookmarked
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
                    Primary Streaming Service
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {STREAMING_PLATFORMS.map((plat) => {
                      const isSelected = preferredPlatform === plat.id;
                      return (
                        <button
                          key={plat.id}
                          type="button"
                          onClick={() => setPreferredPlatform(plat.id)}
                          className={`p-2.5 rounded-xl border text-left transition-all duration-200 active:scale-95 cursor-pointer ${
                            isSelected
                              ? "bg-[var(--theme-accent)]/15 border-[var(--theme-accent)] ring-1 ring-[var(--theme-accent)]/30 text-[var(--theme-fg)]"
                              : "bg-[var(--theme-surface)] border-[var(--theme-border)] text-[var(--theme-muted)] hover:border-[var(--theme-accent)]/40 hover:text-[var(--theme-fg)]"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold">{plat.name}</span>
                            {isSelected && <Check size={12} className="text-[var(--theme-accent)]" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Listening Vibe Cards */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[var(--theme-muted)] uppercase tracking-wider">
                    Your Music Vibe
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {LISTENING_VIBES.map((vibe) => {
                      const Icon = vibe.icon;
                      const isSelected = listeningVibe === vibe.id;
                      return (
                        <button
                          key={vibe.id}
                          type="button"
                          onClick={() => setListeningVibe(vibe.id)}
                          className={`p-3 rounded-2xl border text-left flex items-start gap-3 transition-all duration-200 active:scale-95 cursor-pointer ${
                            isSelected
                              ? "bg-[var(--theme-accent)]/15 border-[var(--theme-accent)] ring-1 ring-[var(--theme-accent)]/30"
                              : "bg-[var(--theme-surface)] border-[var(--theme-border)] hover:border-[var(--theme-accent)]/40"
                          }`}
                        >
                          <div
                            className={`p-2 rounded-xl shrink-0 ${
                              isSelected
                                ? "bg-[var(--theme-accent)] text-[var(--theme-accent-fg)]"
                                : "bg-[var(--theme-card)] text-[var(--theme-muted)]"
                            }`}
                          >
                            <Icon size={16} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs font-bold text-[var(--theme-fg)]">{vibe.title}</h4>
                            <p className="text-[11px] text-[var(--theme-muted)] leading-snug mt-0.5">
                              {vibe.desc}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 5: CELEBRATION & SUMMARY */}
            {step === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6 text-center"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-br from-amber-400/20 via-[var(--theme-accent)]/30 to-purple-500/20 border border-[var(--theme-accent)]/40 text-3xl shadow-xl">
                  {selectedAvatar.icon}
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
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedArtists.slice(0, 5).map((a) => (
                          <span
                            key={a}
                            className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-[var(--theme-card)] border border-[var(--theme-border)] text-[var(--theme-fg)]"
                          >
                            {a}
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
              className="h-11 px-4 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-card)] hover:border-[var(--theme-accent)] text-[var(--theme-fg)] text-xs font-bold transition active:scale-95 cursor-pointer shadow-sm"
            >
              Back
            </button>
          ) : (
            <button
              onClick={handleSkip}
              className="h-11 px-4 rounded-xl text-[var(--theme-muted)] hover:text-[var(--theme-fg)] text-xs font-semibold transition cursor-pointer"
            >
              Skip
            </button>
          )}

          <button
            onClick={handleNext}
            className="h-11 px-6 rounded-xl bg-[var(--theme-accent)] hover:opacity-90 active:scale-95 text-[var(--theme-accent-fg)] text-xs font-extrabold flex items-center justify-center gap-2 transition shadow-md cursor-pointer ml-auto"
          >
            <span>{step === 5 ? "Start Exploring" : "Continue"}</span>
            <ChevronRight size={16} />
          </button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}
