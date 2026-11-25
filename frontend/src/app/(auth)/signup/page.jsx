"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, ArrowLeft, ArrowRight, Check, Dice5, Lock, Mail, Plus, Search } from "lucide-react";
import { generateRandomName } from "@/lib/nameGenerator";
import { AVAILABLE_AVATARS } from "@/Components/UserAvatarIcon";
import DiscLoader from "@/Components/DiscLoader";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";

const GENRES = [
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
];

const ARTISTS = [
  { id: "544fb460-1482-40e5-b4e8-f7246b976eed", name: "David Bowie", genre: "Glam Rock" },
  { id: "056e4f3e-d505-4dad-8ec1-d04f521cbb56", name: "Daft Punk", genre: "Electronic" },
  { id: "83d91898-7763-47d7-b03b-b92132375c47", name: "Pink Floyd", genre: "Rock" },
  { id: "b10bbbfc-cf9e-42e0-be17-e2c3e1d2600d", name: "The Beatles", genre: "Rock" },
  { id: "a74b1b7f-71a5-4011-9441-d0b5e4122711", name: "Radiohead", genre: "Alternative" },
  { id: "d5080c9b-1249-430f-ac8d-e6f451479d79", name: "Kendrick Lamar", genre: "Hip Hop" },
];

const PLATFORMS = [
  { id: "none", name: "Ask each time" },
  { id: "spotify", name: "Spotify" },
  { id: "apple_music", name: "Apple Music" },
  { id: "youtube_music", name: "YouTube Music" },
  { id: "deezer", name: "Deezer" },
];

function SignUpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo") || "/";
  const { signUpWithPassword } = useSupabaseAuth();

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [avatarId, setAvatarId] = useState(AVAILABLE_AVATARS[0].id);
  const [genres, setGenres] = useState([]);
  const [customGenre, setCustomGenre] = useState("");
  const [artists, setArtists] = useState([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [platform, setPlatform] = useState("none");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);

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

  const goNext = (e) => {
    e?.preventDefault();
    if (!email || !password) {
      setErrorMsg("Add an email and password to continue.");
      return;
    }
    if (password.length < 6) {
      setErrorMsg("Password needs at least 6 characters.");
      return;
    }
    if (!agreedToTerms) {
      setErrorMsg("Please agree to the Terms of Service, Privacy Policy, and Community Guidelines to continue.");
      return;
    }
    setErrorMsg("");
    setStep(2);
  };

  const toggleGenre = (label) => {
    setGenres((prev) => (prev.includes(label) ? prev.filter((g) => g !== label) : [...prev, label]));
  };

  const toggleArtist = (artist) => {
    setArtists((prev) => {
      const exists = prev.some((a) => (artist.id && a.id === artist.id) || a.name === artist.name);
      if (exists) return prev.filter((a) => (artist.id ? a.id !== artist.id : a.name !== artist.name));
      return [...prev, artist];
    });
  };

  const createAccount = async ({ skipTaste = false } = {}) => {
    setErrorMsg("");
    if (!agreedToTerms) {
      setErrorMsg("Please agree to the Terms of Service, Privacy Policy, and Community Guidelines to create your account.");
      return;
    }
    setLoading(true);

    const finalUsername =
      username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "") ||
      email.split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g, "");
    const finalDisplayName = displayName.trim() || finalUsername;
    const finalGenres = skipTaste ? [] : genres;
    const finalArtists = skipTaste ? [] : artists;
    const finalPlatform = skipTaste ? "none" : platform;

    const onboardingData = {
      genres: finalGenres,
      artists: finalArtists,
      platform: finalPlatform,
      completed_at: new Date().toISOString(),
    };

    const { error } = await signUpWithPassword(email, password, {
      username: finalUsername,
      displayName: finalDisplayName,
      avatarUrl: avatarId,
      onboardingData,
    });

    if (error) {
      setLoading(false);
      setErrorMsg(error.message || "Could not create the account.");
      return;
    }

    try {
      localStorage.setItem("userName", finalDisplayName);
      localStorage.setItem("userAvatar", avatarId);
      localStorage.setItem("groove_favorite_genres", JSON.stringify(finalGenres));
      localStorage.setItem("favoriteGenres", JSON.stringify(finalGenres));
      localStorage.setItem("preferred_music_platform", finalPlatform);
      localStorage.setItem("preferred_streaming_platform", finalPlatform);
      if (finalArtists.length > 0) {
        localStorage.setItem(
          "savedArtists",
          JSON.stringify(
            finalArtists.map((artist) => ({
              id: artist.id || encodeURIComponent(artist.name),
              name: artist.name,
              title: artist.name,
              artist: artist.name,
              type: "artist",
              genre: artist.genre || "Artist",
              image: artist.image || "",
              coverArt: artist.image || "",
            }))
          )
        );
      }
      localStorage.setItem("groove_onboarding_completed", "true");
      window.dispatchEvent(new CustomEvent("groove-profile-updated"));
    } catch {
      /* storage can be blocked; the account still exists */
    }

    setLoading(false);
    router.push(returnTo);
  };

  const shownArtists = results.length > 0 ? results : ARTISTS;

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg bg-[var(--theme-card)] border border-[var(--theme-border)] rounded-3xl p-6 sm:p-8 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="inline-flex items-center gap-2">
            <img src="/in.svg" alt="" className="w-8 h-8 object-contain" />
            <span className="text-lg font-black font-display">GrooveEstrella</span>
          </Link>
          <span className="text-xs font-bold text-[var(--theme-muted)]">Step {step} of 2</span>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex items-center gap-2 text-xs text-rose-300">
            <AlertCircle size={15} />
            <span>{errorMsg}</span>
          </div>
        )}

        {step === 1 && (
          <form onSubmit={goNext} className="space-y-4">
            <div>
              <h1 className="text-2xl font-black font-display tracking-tight">Create your account</h1>
              <p className="text-sm text-[var(--theme-muted)] mt-1">
                Email and a password are enough. Name and avatar can wait.
              </p>
            </div>

            <label className="block space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--theme-muted)]">Email</span>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--theme-muted)]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-3 py-2.5 rounded-2xl bg-[var(--theme-surface)] border border-[var(--theme-border)] text-sm outline-none focus:border-amber-400"
                />
              </div>
            </label>

            <label className="block space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--theme-muted)]">Password</span>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--theme-muted)]" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="At least 6 characters"
                  className="w-full pl-10 pr-3 py-2.5 rounded-2xl bg-[var(--theme-surface)] border border-[var(--theme-border)] text-sm outline-none focus:border-amber-400"
                />
              </div>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--theme-muted)]">Name</span>
                <div className="flex gap-2">
                  <input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Optional"
                    className="w-full px-3 py-2.5 rounded-2xl bg-[var(--theme-surface)] border border-[var(--theme-border)] text-sm outline-none focus:border-amber-400"
                  />
                  <button
                    type="button"
                    onClick={() => setDisplayName(generateRandomName())}
                    className="px-3 rounded-2xl border border-[var(--theme-border)] text-amber-300 cursor-pointer"
                    title="Suggest a name"
                  >
                    <Dice5 size={16} />
                  </button>
                </div>
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--theme-muted)]">Handle</span>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                  placeholder="optional"
                  className="w-full px-3 py-2.5 rounded-2xl bg-[var(--theme-surface)] border border-[var(--theme-border)] text-sm outline-none focus:border-amber-400"
                />
              </label>
            </div>

            <div className="flex gap-2">
              {AVAILABLE_AVATARS.map((avatar) => {
                const Icon = avatar.icon;
                const selected = avatarId === avatar.id;
                return (
                  <button
                    key={avatar.id}
                    type="button"
                    onClick={() => setAvatarId(avatar.id)}
                    className={`w-11 h-11 rounded-2xl border flex items-center justify-center cursor-pointer ${
                      selected ? "border-amber-400 bg-amber-400/15 text-amber-300" : "border-[var(--theme-border)] text-[var(--theme-muted)]"
                    }`}
                    title={avatar.label}
                  >
                    <Icon size={18} />
                  </button>
                );
              })}
            </div>

            {/* Terms and Community Guidelines Agreement */}
            <div className="pt-2">
              <label className="flex items-start gap-2.5 cursor-pointer select-none group p-3 rounded-2xl bg-[var(--theme-surface)]/60 border border-[var(--theme-border)] hover:border-amber-400/40 transition">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  required
                  className="mt-0.5 rounded border-[var(--theme-border)] text-amber-400 focus:ring-amber-400 cursor-pointer accent-amber-400"
                />
                <span className="text-xs text-[var(--theme-muted)] leading-relaxed">
                  I agree to the{" "}
                  <Link href="/terms" target="_blank" className="text-amber-300 font-bold hover:underline">
                    Terms of Service
                  </Link>
                  ,{" "}
                  <Link href="/privacy" target="_blank" className="text-amber-300 font-bold hover:underline">
                    Privacy Policy
                  </Link>
                  , and{" "}
                  <Link href="/guidelines" target="_blank" className="text-amber-300 font-bold hover:underline">
                    Community Guidelines
                  </Link>
                  .
                </span>
              </label>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Link href={`/login?returnTo=${encodeURIComponent(returnTo)}`} className="text-xs text-[var(--theme-muted)]">
                Already have an account? <span className="text-amber-300 font-bold">Sign in</span>
              </Link>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-2xl bg-amber-300 text-zinc-950 text-sm font-black inline-flex items-center gap-1.5 cursor-pointer"
              >
                Continue
                <ArrowRight size={15} />
              </button>
            </div>
          </form>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <h1 className="text-2xl font-black font-display tracking-tight">Tune your library</h1>
              <p className="text-sm text-[var(--theme-muted)] mt-1">
                Skip this if you want a blank library. Nothing here is selected for you.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {GENRES.map((genre) => {
                const selected = genres.includes(genre);
                return (
                  <button
                    key={genre}
                    type="button"
                    onClick={() => toggleGenre(genre)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold border cursor-pointer ${
                      selected
                        ? "bg-amber-300 border-amber-300 text-zinc-950"
                        : "bg-[var(--theme-surface)] border-[var(--theme-border)]"
                    }`}
                  >
                    {genre}
                  </button>
                );
              })}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const clean = customGenre.trim();
                if (!clean) return;
                setGenres((prev) => (prev.includes(clean) ? prev : [...prev, clean]));
                setCustomGenre("");
              }}
              className="flex gap-2"
            >
              <input
                value={customGenre}
                onChange={(e) => setCustomGenre(e.target.value)}
                placeholder="Add a genre"
                className="flex-1 px-3 py-2 rounded-xl bg-[var(--theme-surface)] border border-[var(--theme-border)] text-sm outline-none focus:border-amber-400"
              />
              <button type="submit" className="px-3 rounded-xl border border-[var(--theme-border)] cursor-pointer">
                <Plus size={16} />
              </button>
            </form>

            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--theme-muted)]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search artists"
                className="w-full pl-9 pr-8 py-2 rounded-xl bg-[var(--theme-surface)] border border-[var(--theme-border)] text-sm outline-none focus:border-amber-400"
              />
              {searching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <DiscLoader size={14} />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              {shownArtists.map((artist) => {
                const name = artist.name || artist.title;
                const selected = artists.some((a) => (artist.id && a.id === artist.id) || a.name === name);
                return (
                  <button
                    key={artist.id || name}
                    type="button"
                    onClick={() =>
                      toggleArtist({
                        id: artist.id,
                        name,
                        genre: artist.genre || artist.genres?.[0] || "Artist",
                        image: artist.image || artist.url || "",
                      })
                    }
                    className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl border text-left cursor-pointer ${
                      selected ? "border-amber-300 bg-amber-300/10" : "border-[var(--theme-border)]"
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="block text-xs font-bold truncate">{name}</span>
                      <span className="block text-[10px] text-[var(--theme-muted)] truncate">
                        {artist.genre || artist.genres?.[0] || "Artist"}
                      </span>
                    </span>
                    {selected && <Check size={14} className="text-amber-300 shrink-0" />}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setPlatform(item.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border cursor-pointer ${
                    platform === item.id
                      ? "bg-amber-300 border-amber-300 text-zinc-950"
                      : "border-[var(--theme-border)] text-[var(--theme-muted)]"
                  }`}
                >
                  {item.name}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                disabled={loading}
                className="inline-flex items-center gap-1 text-xs font-bold text-[var(--theme-muted)] cursor-pointer"
              >
                <ArrowLeft size={14} />
                Back
              </button>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => createAccount({ skipTaste: true })}
                  disabled={loading}
                  className="text-xs font-bold text-[var(--theme-muted)] cursor-pointer disabled:opacity-50"
                >
                  Skip
                </button>
                <button
                  type="button"
                  onClick={createAccount}
                  disabled={loading}
                  className="px-5 py-2.5 rounded-2xl bg-amber-300 text-zinc-950 text-sm font-black cursor-pointer disabled:opacity-50"
                >
                  {loading ? "Creating..." : "Create account"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="min-h-[80vh] flex items-center justify-center text-sm text-[var(--theme-muted)]">Loading...</div>}>
      <SignUpContent />
    </Suspense>
  );
}
