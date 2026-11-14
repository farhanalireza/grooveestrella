// src/app/(auth)/signup/page.jsx
"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Music,
  Lock,
  Mail,
  User,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  AlertCircle,
  Dice5,
  Check,
  Search,
  Plus,
  Flame,
  Zap,
  Radio,
  Disc,
  Disc3,
  Headphones,
  Heart,
  Volume2,
  Compass,
  Sun,
  Star,
  Sliders,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import confetti from "canvas-confetti";
import { generateRandomName } from "@/lib/nameGenerator";
import UserAvatarIcon, {
  AVAILABLE_AVATARS,
  DICEBEAR_STYLES,
  getDiceBearAvatarUrl,
} from "@/Components/UserAvatarIcon";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { toast } from "@/lib/toast";

const CURATED_GENRES = [
  { id: "Rock", label: "Rock", icon: Flame },
  { id: "Indie", label: "Indie", icon: Sparkles },
  { id: "Pop", label: "Pop", icon: Star },
  { id: "Synthpop", label: "Synthpop", icon: Radio },
  { id: "Electronic", label: "Electronic", icon: Zap },
  { id: "Hip Hop", label: "Hip Hop", icon: Disc3 },
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
    genre: "Rock",
    image: "https://cdn-images.dzcdn.net/images/artist/a131ced363dd67249e6a9167164188cb/250x250-000000-80-0-0.jpg",
  },
];

const STREAMING_PLATFORMS = [
  { id: "spotify", name: "Spotify", desc: "Launch albums & tracks directly in Spotify" },
  { id: "apple_music", name: "Apple Music", desc: "Open in Apple Music web or player" },
  { id: "youtube_music", name: "YouTube Music", desc: "Stream instantly on YouTube Music" },
  { id: "deezer", name: "Deezer", desc: "Listen with Deezer HiFi playback" },
  { id: "none", name: "Always Ask (GrooveCard)", desc: "Show options picker whenever I play music" },
];

const LISTENING_VIBES = [
  {
    id: "deep_listener",
    title: "Deep Listener",
    desc: "Complete front-to-back album experiences, studying lyrics and tracking discographies.",
    icon: Disc,
  },
  {
    id: "audiophile",
    title: "Vinyl & HiFi Audiophile",
    desc: "Obsessed with pressings, masterings, acoustic depth, and turntable warmth.",
    icon: Radio,
  },
  {
    id: "crate_digger",
    title: "Crate Digger",
    desc: "Constantly uncovering obscure gems, b-sides, regional pressings, and rare releases.",
    icon: Compass,
  },
  {
    id: "casual_curator",
    title: "Casual Curator",
    desc: "Building vibes, organizing playlists, rating favorites, and soundtracking daily life.",
    icon: Headphones,
  },
];

function SignUpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo") || "/library?tab=journal";
  const { signUpWithPassword, isConfigured } = useSupabaseAuth();

  // Multi-step form state (1 to 5)
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);

  // Step 1: Credentials & Identity
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState(() => generateRandomName());

  // Step 2: Avatar
  const [avatarMode, setAvatarMode] = useState("dicebear"); // 'dicebear' | 'preset'
  const [selectedAvatarId, setSelectedAvatarId] = useState(AVAILABLE_AVATARS[0]?.id || "vinyl-disc");
  const [dicebearStyle, setDicebearStyle] = useState("identicon");
  const [dicebearSeed, setDicebearSeed] = useState(() => generateRandomName());

  // Step 3: Genres
  const [selectedGenres, setSelectedGenres] = useState(["Rock", "Indie", "Electronic"]);
  const [customGenre, setCustomGenre] = useState("");

  // Step 4: Top Artists
  const [selectedArtists, setSelectedArtists] = useState([CURATED_ARTISTS[0], CURATED_ARTISTS[1]]);
  const [artistSearchQuery, setArtistSearchQuery] = useState("");
  const [artistSearchResults, setArtistSearchResults] = useState([]);
  const [isSearchingArtists, setIsSearchingArtists] = useState(false);

  // Step 5: Music Experience
  const [preferredPlatform, setPreferredPlatform] = useState("spotify");
  const [listeningVibe, setListeningVibe] = useState("deep_listener");
  const [showVinylSides, setShowVinylSides] = useState(true);

  // Submission & Validation
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const rollNewName = () => {
    const rolled = generateRandomName();
    setDisplayName(rolled);
    setDicebearSeed(rolled);
    if (!username) {
      setUsername(rolled.toLowerCase().replace(/[^a-z0-9]/g, ""));
    }
  };

  const getComputedAvatarUrl = () => {
    if (avatarMode === "dicebear") {
      return getDiceBearAvatarUrl(dicebearStyle, dicebearSeed || displayName || "groove");
    }
    return selectedAvatarId;
  };

  const toggleGenre = (genreLabel) => {
    setSelectedGenres((prev) =>
      prev.includes(genreLabel) ? prev.filter((g) => g !== genreLabel) : [...prev, genreLabel]
    );
  };

  const handleAddCustomGenre = (e) => {
    e.preventDefault();
    const clean = customGenre.trim();
    if (clean && !selectedGenres.includes(clean)) {
      setSelectedGenres((prev) => [...prev, clean]);
      setCustomGenre("");
    }
  };

  const toggleArtist = (artist) => {
    setSelectedArtists((prev) => {
      const exists = prev.some((a) => (a.id && a.id === artist.id) || a.name === artist.name);
      if (exists) {
        return prev.filter((a) => (a.id ? a.id !== artist.id : a.name !== artist.name));
      } else {
        return [...prev, artist];
      }
    });
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

  const triggerConfettiCelebration = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#D4AF37", "#E8A87C", "#A238FF", "#1DB954"],
      });
    } catch (_) {}
  };

  const goToNextStep = (e) => {
    if (e) e.preventDefault();
    setErrorMsg("");

    // Step 1 Validation
    if (step === 1) {
      if (!email || !password) {
        setErrorMsg("Please provide an email and password.");
        return;
      }
      if (password.length < 6) {
        setErrorMsg("Password must be at least 6 characters.");
        return;
      }
    }

    if (step === 4) {
      triggerConfettiCelebration();
    }

    setDirection(1);
    setStep((prev) => Math.min(prev + 1, 5));
  };

  const goToPrevStep = () => {
    setErrorMsg("");
    setDirection(-1);
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleCompleteAccountCreation = async () => {
    setErrorMsg("");
    setLoading(true);

    const finalUsername =
      username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "") ||
      email.split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g, "");
    const finalDisplayName = displayName.trim() || finalUsername || "Sound Critic";
    const finalAvatarUrl = getComputedAvatarUrl();

    // Construct JSONB onboarding package to persist in profiles.onboarding_data
    const onboardingData = {
      genres: selectedGenres,
      artists: selectedArtists.map((a) => ({
        id: a.id,
        name: a.name || a.title,
        genre: a.genre || "",
        image: a.image || a.url || "",
      })),
      platform: preferredPlatform,
      vibe: listeningVibe,
      showVinylSides: showVinylSides,
      completed_at: new Date().toISOString(),
      avatar_style: avatarMode === "dicebear" ? dicebearStyle : null,
      avatar_seed: avatarMode === "dicebear" ? dicebearSeed : null,
    };

    // 1. Sign up user via Supabase
    const { data, error } = await signUpWithPassword(email, password, {
      username: finalUsername,
      displayName: finalDisplayName,
      avatarUrl: finalAvatarUrl,
      onboardingData: onboardingData,
    });

    if (error) {
      setLoading(false);
      setErrorMsg(error.message || "Failed to create account. Please try again.");
      return;
    }

    // 2. Persist to local storage for instant reactivity
    try {
      localStorage.setItem("userName", finalDisplayName);
      localStorage.setItem("userAvatar", finalAvatarUrl);
      localStorage.setItem("userAvatarLabel", finalDisplayName);
      localStorage.setItem("favoriteGenres", JSON.stringify(selectedGenres));
      localStorage.setItem("preferred_music_platform", preferredPlatform);
      localStorage.setItem("groove_listening_vibe", listeningVibe);
      localStorage.setItem("groove_show_vinyl_sides", String(showVinylSides));

      const artistObjects = selectedArtists.map((a) => {
        const artName = a.name || a.title || "Artist";
        return {
          id: a.id || encodeURIComponent(artName),
          name: artName,
          title: artName,
          artist: artName,
          image: a.image || a.url || "",
          coverArt: a.image || a.url || "",
          type: "artist",
          genre: a.genre || "Artist",
        };
      });
      localStorage.setItem("savedArtists", JSON.stringify(artistObjects));
      localStorage.setItem("groove_onboarding_completed", "true");
      localStorage.setItem("groove_onboarding_date", new Date().toISOString());

      window.dispatchEvent(new CustomEvent("groove-profile-updated"));
    } catch (_) {}

    setLoading(false);
    toast.success(`Welcome to GrooveEstrella, ${finalDisplayName}!`);
    router.push(returnTo);
  };

  const slideVariants = {
    enter: (dir) => ({
      x: dir > 0 ? 40 : -40,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir) => ({
      x: dir < 0 ? 40 : -40,
      opacity: 0,
    }),
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center px-4 sm:px-6 py-10">
      <div className="w-full max-w-2xl bg-[var(--theme-card)]/90 backdrop-blur-2xl border border-[var(--theme-border)] rounded-3xl p-6 sm:p-9 shadow-2xl text-[var(--theme-fg)] relative overflow-hidden flex flex-col min-h-[620px]">
        {/* Blurry Atmosphere Glows */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full filter blur-[90px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full filter blur-[90px] pointer-events-none" />

        {/* Brand Header & Progress Indicator */}
        <div className="relative z-10 mb-6">
          <div className="flex items-center justify-between gap-4 mb-4">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <img src="/in.svg" alt="GrooveEstrella" className="w-8 h-8 object-contain" />
              <span className="text-xl font-black tracking-tight font-display text-[var(--theme-fg)]">
                GrooveEstrella
              </span>
            </Link>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-[var(--theme-surface)] border border-[var(--theme-border)] text-amber-300">
              Step {step} of 5
            </span>
          </div>

          {/* Progress Segment Bars */}
          <div className="grid grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5].map((num) => (
              <div
                key={num}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  step >= num
                    ? "bg-gradient-to-r from-amber-400 to-amber-300 shadow-sm shadow-amber-400/20"
                    : "bg-[var(--theme-border)]/50"
                }`}
              />
            ))}
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex items-center gap-2 text-xs text-rose-300 animate-fade-in relative z-10">
            <AlertCircle size={15} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Step Views with Animation */}
        <div className="flex-1 flex flex-col relative z-10">
          <AnimatePresence mode="wait" custom={direction}>
            {/* STEP 1: CREDENTIALS & IDENTITY */}
            {step === 1 && (
              <motion.div
                key="step1"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.22, ease: "easeInOut" }}
                className="flex-1 flex flex-col justify-between space-y-6"
              >
                <div className="space-y-4">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-black text-[var(--theme-fg)] tracking-tight font-display flex items-center gap-2">
                      <span>Create Your Music Account</span>
                      <Sparkles size={22} className="text-amber-400 animate-pulse" />
                    </h2>
                    <p className="text-xs sm:text-sm text-[var(--theme-muted)] mt-1">
                      Start your personal Letterboxd-style Music Diary, track your listening history, and share your critical scores.
                    </p>
                  </div>

                  <div className="space-y-3.5">
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-[var(--theme-muted)]">
                        Email Address *
                      </label>
                      <div className="relative">
                        <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--theme-muted)]" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="critic@grooveestrella.com"
                          required
                          className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[var(--theme-surface)] border border-[var(--theme-border)] text-sm text-[var(--theme-fg)] placeholder:text-[var(--theme-muted)]/50 focus:outline-none focus:border-amber-400"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-[var(--theme-muted)]">
                        Password *
                      </label>
                      <div className="relative">
                        <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--theme-muted)]" />
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="At least 6 characters"
                          required
                          className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[var(--theme-surface)] border border-[var(--theme-border)] text-sm text-[var(--theme-fg)] placeholder:text-[var(--theme-muted)]/50 focus:outline-none focus:border-amber-400"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div className="space-y-1">
                        <label className="text-xs font-bold uppercase tracking-wider text-[var(--theme-muted)]">
                          Display Name
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="Your Name"
                            className="w-full px-3.5 py-2.5 rounded-2xl bg-[var(--theme-surface)] border border-[var(--theme-border)] text-sm text-[var(--theme-fg)] placeholder:text-[var(--theme-muted)]/50 focus:outline-none focus:border-amber-400"
                          />
                          <button
                            type="button"
                            onClick={rollNewName}
                            className="p-2.5 rounded-2xl bg-[var(--theme-surface)] hover:bg-[var(--theme-border)] text-amber-300 border border-[var(--theme-border)] transition active:scale-95 cursor-pointer shrink-0"
                            title="Roll random music moniker"
                          >
                            <Dice5 size={18} />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold uppercase tracking-wider text-[var(--theme-muted)]">
                          Handle / Username
                        </label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[var(--theme-muted)]">
                            @
                          </span>
                          <input
                            type="text"
                            value={username}
                            onChange={(e) =>
                              setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))
                            }
                            placeholder="vinylcritic"
                            className="w-full pl-8 pr-4 py-2.5 rounded-2xl bg-[var(--theme-surface)] border border-[var(--theme-border)] text-sm text-[var(--theme-fg)] placeholder:text-[var(--theme-muted)]/50 focus:outline-none focus:border-amber-400 font-mono text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-[var(--theme-border)]/60">
                  <span className="text-xs text-[var(--theme-muted)]">
                    Already have an account?{" "}
                    <Link href={`/login?returnTo=${encodeURIComponent(returnTo)}`} className="text-amber-300 font-bold hover:underline">
                      Sign In
                    </Link>
                  </span>
                  <button
                    type="button"
                    onClick={goToNextStep}
                    className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-300 text-zinc-950 font-black text-xs sm:text-sm flex items-center gap-2 hover:scale-105 active:scale-95 transition shadow-md shadow-amber-400/20 cursor-pointer"
                  >
                    <span>Next: Avatar</span>
                    <ArrowRight size={15} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 2: AVATAR CUSTOMIZATION */}
            {step === 2 && (
              <motion.div
                key="step2"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.22, ease: "easeInOut" }}
                className="flex-1 flex flex-col justify-between space-y-6"
              >
                <div className="space-y-4">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-black text-[var(--theme-fg)] tracking-tight font-display">
                      Choose Your Sound Identity
                    </h2>
                    <p className="text-xs sm:text-sm text-[var(--theme-muted)] mt-1">
                      Pick an algorithmic avatar or classic vinyl insignia that marks your reviews and journal entries.
                    </p>
                  </div>

                  {/* Avatar Preview */}
                  <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-3xl bg-[var(--theme-surface)]/60 border border-[var(--theme-border)]">
                    <div className="relative w-24 h-24 rounded-3xl overflow-hidden bg-black/40 border-2 border-amber-400/50 flex items-center justify-center shadow-lg shrink-0">
                      {avatarMode === "dicebear" ? (
                        <img
                          src={getDiceBearAvatarUrl(dicebearStyle, dicebearSeed || displayName || "groove")}
                          alt="Avatar Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <UserAvatarIcon avatarId={selectedAvatarId} className="w-12 h-12 text-amber-300" />
                      )}
                    </div>
                    <div className="space-y-1.5 text-center sm:text-left">
                      <h4 className="text-base font-bold text-[var(--theme-fg)]">{displayName || "Anonymous Critic"}</h4>
                      <p className="text-xs text-[var(--theme-muted)]">@{username || "groovelover"}</p>
                      <button
                        type="button"
                        onClick={() => setDicebearSeed(generateRandomName())}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 text-xs font-bold border border-amber-400/30 transition cursor-pointer"
                      >
                        <Dice5 size={13} />
                        <span>Re-roll Look</span>
                      </button>
                    </div>
                  </div>

                  {/* DiceBear Styles Picker */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-[var(--theme-muted)]">
                      Avatar Style
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {DICEBEAR_STYLES.map((style) => (
                        <button
                          key={style.id}
                          type="button"
                          onClick={() => {
                            setAvatarMode("dicebear");
                            setDicebearStyle(style.id);
                          }}
                          className={`p-2 rounded-2xl border text-center transition cursor-pointer flex flex-col items-center gap-1 ${
                            avatarMode === "dicebear" && dicebearStyle === style.id
                              ? "bg-amber-400/15 border-amber-400 text-amber-300 shadow-sm"
                              : "bg-[var(--theme-surface)] border-[var(--theme-border)] text-[var(--theme-muted)] hover:text-[var(--theme-fg)]"
                          }`}
                        >
                          <img
                            src={getDiceBearAvatarUrl(style.id, dicebearSeed || displayName || "seed")}
                            alt={style.label}
                            className="w-8 h-8 rounded-full bg-black/30"
                          />
                          <span className="text-[10px] font-bold truncate max-w-full">{style.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-[var(--theme-border)]/60">
                  <button
                    type="button"
                    onClick={goToPrevStep}
                    className="px-4 py-2 rounded-2xl bg-[var(--theme-surface)] hover:bg-[var(--theme-border)] text-[var(--theme-fg)] font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <ArrowLeft size={14} />
                    <span>Back</span>
                  </button>
                  <button
                    type="button"
                    onClick={goToNextStep}
                    className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-300 text-zinc-950 font-black text-xs sm:text-sm flex items-center gap-2 hover:scale-105 active:scale-95 transition shadow-md shadow-amber-400/20 cursor-pointer"
                  >
                    <span>Next: Genres</span>
                    <ArrowRight size={15} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: MUSICAL TASTES (GENRES) */}
            {step === 3 && (
              <motion.div
                key="step3"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.22, ease: "easeInOut" }}
                className="flex-1 flex flex-col justify-between space-y-6"
              >
                <div className="space-y-4">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-black text-[var(--theme-fg)] tracking-tight font-display">
                      What Sound Moves You?
                    </h2>
                    <p className="text-xs sm:text-sm text-[var(--theme-muted)] mt-1">
                      Select your favorite musical genres to shape your dashboard recommendations and critic profile.
                    </p>
                  </div>

                  {/* Genre Chips */}
                  <div className="flex flex-wrap gap-2 max-h-56 overflow-y-auto pr-1 scrollbar-none">
                    {CURATED_GENRES.map((g) => {
                      const IconComp = g.icon;
                      const isSelected = selectedGenres.includes(g.label);
                      return (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() => toggleGenre(g.label)}
                          className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                            isSelected
                              ? "bg-amber-400 text-zinc-950 shadow-md shadow-amber-400/20 font-black"
                              : "bg-[var(--theme-surface)] text-[var(--theme-fg)] border border-[var(--theme-border)] hover:border-amber-400/40"
                          }`}
                        >
                          <IconComp size={14} className={isSelected ? "text-zinc-950" : "text-amber-400"} />
                          <span>{g.label}</span>
                          {isSelected && <Check size={13} className="stroke-[3]" />}
                        </button>
                      );
                    })}
                  </div>

                  {/* Add Custom Genre */}
                  <form onSubmit={handleAddCustomGenre} className="flex gap-2">
                    <input
                      type="text"
                      value={customGenre}
                      onChange={(e) => setCustomGenre(e.target.value)}
                      placeholder="Add custom niche genre (e.g. Shoegaze, Vaporwave)..."
                      className="flex-1 px-4 py-2.5 rounded-2xl bg-[var(--theme-surface)] border border-[var(--theme-border)] text-xs text-[var(--theme-fg)] placeholder:text-[var(--theme-muted)]/50 focus:outline-none focus:border-amber-400"
                    />
                    <button
                      type="submit"
                      disabled={!customGenre.trim()}
                      className="px-4 py-2.5 rounded-2xl bg-[var(--theme-surface)] hover:bg-[var(--theme-border)] text-amber-300 font-bold text-xs border border-[var(--theme-border)] disabled:opacity-40 transition cursor-pointer"
                    >
                      <Plus size={15} />
                    </button>
                  </form>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-[var(--theme-border)]/60">
                  <button
                    type="button"
                    onClick={goToPrevStep}
                    className="px-4 py-2 rounded-2xl bg-[var(--theme-surface)] hover:bg-[var(--theme-border)] text-[var(--theme-fg)] font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <ArrowLeft size={14} />
                    <span>Back</span>
                  </button>
                  <button
                    type="button"
                    onClick={goToNextStep}
                    className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-300 text-zinc-950 font-black text-xs sm:text-sm flex items-center gap-2 hover:scale-105 active:scale-95 transition shadow-md shadow-amber-400/20 cursor-pointer"
                  >
                    <span>Next: Top Artists</span>
                    <ArrowRight size={15} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 4: TOP ARTISTS */}
            {step === 4 && (
              <motion.div
                key="step4"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.22, ease: "easeInOut" }}
                className="flex-1 flex flex-col justify-between space-y-6"
              >
                <div className="space-y-4">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-black text-[var(--theme-fg)] tracking-tight font-display">
                      Favorite Artists & Bands
                    </h2>
                    <p className="text-xs sm:text-sm text-[var(--theme-muted)] mt-1">
                      Pin artists to seed your library and show off your musical allegiance.
                    </p>
                  </div>

                  {/* Artist Search Bar */}
                  <div className="relative">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--theme-muted)]" />
                    <input
                      type="text"
                      value={artistSearchQuery}
                      onChange={(e) => handleSearchArtists(e.target.value)}
                      placeholder="Search any artist in MusicBrainz archive..."
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[var(--theme-surface)] border border-[var(--theme-border)] text-xs text-[var(--theme-fg)] placeholder:text-[var(--theme-muted)]/50 focus:outline-none focus:border-amber-400"
                    />
                    {isSearchingArtists && (
                      <div className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                    )}
                  </div>

                  {/* Artist Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-h-60 overflow-y-auto pr-1 scrollbar-none">
                    {(artistSearchResults.length > 0 ? artistSearchResults : CURATED_ARTISTS).map((artist) => {
                      const isSelected = selectedArtists.some(
                        (a) => (a.id && a.id === artist.id) || a.name === (artist.name || artist.title)
                      );
                      const artName = artist.name || artist.title;
                      const artImg = artist.image || artist.url;

                      return (
                        <div
                          key={artist.id || artName}
                          onClick={() => toggleArtist({ id: artist.id, name: artName, image: artImg, genre: artist.genre })}
                          className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex items-center gap-2.5 ${
                            isSelected
                              ? "bg-amber-400/20 border-amber-400 shadow-sm"
                              : "bg-[var(--theme-surface)] border-[var(--theme-border)] hover:border-amber-400/40"
                          }`}
                        >
                          <div className="w-10 h-10 rounded-xl overflow-hidden bg-black/40 shrink-0">
                            {artImg ? (
                              <img src={artImg} alt={artName} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-amber-400">
                                <Music size={16} />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h5 className="text-xs font-bold text-[var(--theme-fg)] truncate">{artName}</h5>
                            <span className="text-[10px] text-[var(--theme-muted)] truncate block">
                              {artist.genre || "Artist"}
                            </span>
                          </div>
                          {isSelected && <Check size={14} className="text-amber-400 shrink-0 stroke-[3]" />}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-[var(--theme-border)]/60">
                  <button
                    type="button"
                    onClick={goToPrevStep}
                    className="px-4 py-2 rounded-2xl bg-[var(--theme-surface)] hover:bg-[var(--theme-border)] text-[var(--theme-fg)] font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <ArrowLeft size={14} />
                    <span>Back</span>
                  </button>
                  <button
                    type="button"
                    onClick={goToNextStep}
                    className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-300 text-zinc-950 font-black text-xs sm:text-sm flex items-center gap-2 hover:scale-105 active:scale-95 transition shadow-md shadow-amber-400/20 cursor-pointer"
                  >
                    <span>Next: Listening Vibe</span>
                    <ArrowRight size={15} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 5: LISTENING VIBE, PLATFORM & CELEBRATION */}
            {step === 5 && (
              <motion.div
                key="step5"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.22, ease: "easeInOut" }}
                className="flex-1 flex flex-col justify-between space-y-6"
              >
                <div className="space-y-4">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-black text-[var(--theme-fg)] tracking-tight font-display flex items-center gap-2">
                      <span>Ready to Launch!</span>
                      <Sparkles size={22} className="text-amber-400" />
                    </h2>
                    <p className="text-xs sm:text-sm text-[var(--theme-muted)] mt-1">
                      Choose your preferred streaming service and listening archetype.
                    </p>
                  </div>

                  {/* Streaming Platform Picker */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-[var(--theme-muted)]">
                      Preferred Streaming App
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {STREAMING_PLATFORMS.map((platform) => (
                        <button
                          key={platform.id}
                          type="button"
                          onClick={() => setPreferredPlatform(platform.id)}
                          className={`p-2.5 rounded-2xl border text-left transition cursor-pointer ${
                            preferredPlatform === platform.id
                              ? "bg-amber-400/15 border-amber-400 text-amber-300"
                              : "bg-[var(--theme-surface)] border-[var(--theme-border)] text-[var(--theme-muted)] hover:text-[var(--theme-fg)]"
                          }`}
                        >
                          <div className="text-xs font-bold text-[var(--theme-fg)]">{platform.name}</div>
                          <p className="text-[10px] text-[var(--theme-muted)] line-clamp-1">{platform.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Listening Archetype */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-[var(--theme-muted)]">
                      Critic Archetype
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {LISTENING_VIBES.map((vibe) => {
                        const Icon = vibe.icon;
                        return (
                          <button
                            key={vibe.id}
                            type="button"
                            onClick={() => setListeningVibe(vibe.id)}
                            className={`p-3 rounded-2xl border text-left transition cursor-pointer flex items-start gap-2.5 ${
                              listeningVibe === vibe.id
                                ? "bg-amber-400/15 border-amber-400 text-amber-300 ring-1 ring-amber-400/30"
                                : "bg-[var(--theme-surface)] border-[var(--theme-border)] text-[var(--theme-muted)] hover:text-[var(--theme-fg)]"
                            }`}
                          >
                            <Icon size={18} className="text-amber-400 shrink-0 mt-0.5" />
                            <div>
                              <div className="text-xs font-bold text-[var(--theme-fg)]">{vibe.title}</div>
                              <p className="text-[10px] text-[var(--theme-muted)] mt-0.5 leading-tight">{vibe.desc}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Summary Profile Preview */}
                  <div className="p-3.5 rounded-2xl bg-[var(--theme-surface)]/80 border border-[var(--theme-border)] flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl overflow-hidden bg-black/40 border border-amber-400/30 shrink-0">
                        <img src={getComputedAvatarUrl()} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <div className="font-bold text-[var(--theme-fg)]">{displayName}</div>
                        <div className="text-[10px] text-[var(--theme-muted)]">
                          {selectedGenres.length} genres · {selectedArtists.length} top artists
                        </div>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-black uppercase tracking-wider">
                      Critic Profile
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-[var(--theme-border)]/60">
                  <button
                    type="button"
                    onClick={goToPrevStep}
                    disabled={loading}
                    className="px-4 py-2 rounded-2xl bg-[var(--theme-surface)] hover:bg-[var(--theme-border)] text-[var(--theme-fg)] font-bold text-xs flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                  >
                    <ArrowLeft size={14} />
                    <span>Back</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCompleteAccountCreation}
                    disabled={loading}
                    className="px-8 py-3 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 text-zinc-950 font-black text-sm tracking-wide hover:scale-105 active:scale-95 transition shadow-lg shadow-amber-400/25 cursor-pointer flex items-center gap-2 disabled:opacity-50"
                  >
                    <span>{loading ? "Creating Account..." : "Enter GrooveEstrella"}</span>
                    <Sparkles size={16} />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="min-h-[85vh] flex items-center justify-center text-sm text-[var(--theme-muted)]">Loading...</div>}>
      <SignUpContent />
    </Suspense>
  );
}
