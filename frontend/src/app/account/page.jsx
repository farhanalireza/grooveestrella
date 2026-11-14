// src/app/account/page.jsx
"use client";

import React, { useEffect, useState, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  User,
  Star,
  BookOpen,
  Calendar,
  Disc,
  Disc3,
  ArrowRight,
  Sparkles,
  Edit3,
  Check,
  X,
  Share2,
  Globe,
  Sliders,
  SlidersHorizontal,
  Download,
  LogOut,
  LogIn,
  PenTool,
  Headphones,
  Music,
  Heart,
  ListMusic,
  CheckCircle2,
  Dice5,
  RefreshCw,
  Users,
  UserCheck,
  Sun,
  Moon,
  Palette,
  Volume2,
  Trash2,
  AlertTriangle,
  Mail,
  Shield,
  Layers,
  Settings,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "@/lib/toast";
import { generateRandomName, getOrSetUserName } from "@/lib/nameGenerator";
import UserAvatarIcon, {
  AVAILABLE_AVATARS,
  DICEBEAR_STYLES,
  getDiceBearAvatarUrl,
} from "@/Components/UserAvatarIcon";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { useTheme } from "@/contexts/ThemeContext";
import JournalCard from "@/Components/JournalCard";
import FollowersListModal from "@/Components/FollowersListModal";
import DiscLoader from "@/Components/DiscLoader";
import { buildJournalEditorHref } from "@/lib/journalLinks";
import UserProfileBadge, {
  getProfileBadgeTheme,
  NOISE_GRAIN_BG,
} from "@/Components/UserProfileBadge";

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
  { id: "none", name: "Always Ask (GrooveCard)", desc: "Show options picker instead of auto-redirecting" },
  { id: "spotify", name: "Spotify", desc: "Launch directly in Spotify app" },
  { id: "apple_music", name: "Apple Music", desc: "Open inside Apple Music web or player" },
  { id: "youtube_music", name: "YouTube Music", desc: "Redirect to YouTube Music search or play" },
  { id: "deezer", name: "Deezer", desc: "Open in Deezer HiFi player" },
  { id: "tidal", name: "TIDAL", desc: "Open in TIDAL player" },
];

function AccountDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, profile: authProfile, signOut, updateProfile, isConfigured, loading: authLoading } = useSupabaseAuth();
  const { theme, isDark, setTheme } = useTheme();

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user && isConfigured) {
      router.push("/login?returnTo=%2Faccount");
    }
  }, [user, authLoading, isConfigured, router]);

  // Active section tab: 'taste' | 'activity' | 'settings' | 'curator'
  const paramTab = searchParams ? searchParams.get("tab") : null;
  const [activeAccountTab, setActiveAccountTab] = useState(
    paramTab && ["taste", "activity", "settings", "curator"].includes(paramTab)
      ? paramTab
      : "taste"
  );

  useEffect(() => {
    if (searchParams) {
      const tab = searchParams.get("tab");
      if (tab && ["taste", "activity", "settings", "curator"].includes(tab)) {
        setActiveAccountTab(tab);
      }
    }
  }, [searchParams]);

  // Profile identity
  const [userName, setUserName] = useState("");
  const [userAvatar, setUserAvatar] = useState("");
  const [bio, setBio] = useState("");
  const [userBadge, setUserBadge] = useState(() => {
    if (authProfile?.is_admin) return "admin";
    return authProfile?.badge || "critic";
  });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editBadge, setEditBadge] = useState("critic");
  const [isEditingAvatar, setIsEditingAvatar] = useState(false);

  // DiceBear Avatar Customization Studio
  const [avatarTab, setAvatarTab] = useState("dicebear"); // 'dicebear' | 'icons'
  const [dicebearStyle, setDicebearStyle] = useState("identicon");
  const [dicebearSeed, setDicebearSeed] = useState("");

  // Critic preferences
  const [favoriteGenres, setFavoriteGenres] = useState([]);
  const [preferredRatingSystem, setPreferredRatingSystem] = useState("stars"); // 'stars' | 'score'
  const [defaultIsPublic, setDefaultIsPublic] = useState(true);

  // Settings preferences (Integrated from /settings)
  const [preferredPlatform, setPreferredPlatform] = useState("spotify");
  const [showVinylSides, setShowVinylSides] = useState(true);

  // Stats & Journal logs
  const [journalLogs, setJournalLogs] = useState([]);
  const [savedCounts, setSavedCounts] = useState({ songs: 0, albums: 0, artists: 0, playlists: 0 });
  const [copiedLink, setCopiedLink] = useState(false);

  // Followers & Following modal
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowsModalOpen, setIsFollowsModalOpen] = useState(false);
  const [followsModalTab, setFollowsModalTab] = useState("followers");

  const handleOpenFollows = (tab = "followers") => {
    setFollowsModalTab(tab);
    setIsFollowsModalOpen(true);
  };

  const loadData = () => {
    if (typeof window === "undefined") return;

    // 1. Profile identity
    const currentName = authProfile?.display_name || authProfile?.username || getOrSetUserName();
    const currentBio = authProfile?.bio || localStorage.getItem("groove_user_bio") || "";
    const currentBadge = authProfile?.is_admin
      ? "admin"
      : (authProfile?.badge || localStorage.getItem("groove_user_badge") || "critic");
    setUserName(currentName);
    setEditName(currentName);
    setBio(currentBio);
    setEditBio(currentBio);
    setUserBadge(currentBadge);
    setEditBadge(currentBadge);

    const initialAvatar =
      authProfile?.avatar_url ||
      localStorage.getItem("userAvatar") ||
      getDiceBearAvatarUrl("identicon", currentName);
    setUserAvatar(initialAvatar);
    if (!dicebearSeed) {
      setDicebearSeed(currentName);
    }

    // 2. Preferences
    try {
      setFavoriteGenres(JSON.parse(localStorage.getItem("favoriteGenres") || "[]"));
    } catch (_) {
      setFavoriteGenres([]);
    }

    const prefSystem = localStorage.getItem("preferred_rating_system") || "stars";
    setPreferredRatingSystem(prefSystem);

    const prefPublic = localStorage.getItem("default_journal_public");
    setDefaultIsPublic(prefPublic !== null ? prefPublic === "true" : true);

    const savedPlatform = localStorage.getItem("preferred_music_platform") || "spotify";
    setPreferredPlatform(savedPlatform);

    const savedSides = localStorage.getItem("groove_show_vinyl_sides");
    if (savedSides !== null) {
      setShowVinylSides(savedSides === "true");
    }

    // 3. Saved media counts from library
    try {
      const s = JSON.parse(localStorage.getItem("savedSongs") || "[]").length;
      const al = JSON.parse(localStorage.getItem("savedAlbums") || "[]").length;
      const ar = JSON.parse(localStorage.getItem("savedArtists") || "[]").length;
      const p = JSON.parse(localStorage.getItem("savedPlaylists") || "[]").length;
      setSavedCounts({ songs: s, albums: al, artists: ar, playlists: p });
    } catch (_) {}

    // 4. Journal logs
    let logs = [];
    try {
      const raw = localStorage.getItem("groove_journal_logs");
      if (raw) logs = JSON.parse(raw);
    } catch (_) {
      logs = [];
    }

    if (user && isSupabaseConfigured()) {
      const supabase = createClient();

      // Fetch social counts
      supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("following_id", user.id)
        .then(({ count }) => setFollowersCount(count || 0))
        .catch(() => {});

      supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("follower_id", user.id)
        .then(({ count }) => setFollowingCount(count || 0))
        .catch(() => {});

      // Fetch cloud journals
      supabase
        .from("journals")
        .select(`
          id,
          entry_text,
          mood,
          listened_date,
          is_public,
          created_at,
          user_ratings (
            score,
            rating_type
          ),
          music_entities (
            id,
            mbid,
            type,
            title,
            artist_credit,
            cover_art_url
          )
        `)
        .eq("user_id", user.id)
        .order("listened_date", { ascending: false })
        .then(({ data, error }) => {
          if (!error && Array.isArray(data) && data.length > 0) {
            const formatted = data.map((j) => ({
              id: j.id,
              targetId: j.music_entities?.mbid || j.music_entities?.id,
              targetType: j.music_entities?.type || "album",
              title: j.music_entities?.title || "Untitled",
              subtitle: j.music_entities?.artist_credit || "",
              image: j.music_entities?.cover_art_url || "",
              rating:
                j.user_ratings?.rating_type === "stars"
                  ? j.user_ratings.score
                  : Math.round((j.user_ratings?.score || 0) / 10),
              numericalScore: j.user_ratings?.score || 0,
              date: j.listened_date,
              review: j.entry_text || "",
              mood: j.mood || "",
              is_public: j.is_public,
              createdAt: new Date(j.created_at).getTime(),
            }));
            setJournalLogs(formatted);
          } else {
            setJournalLogs(logs);
          }
        })
        .catch(() => {
          setJournalLogs(logs);
        });
    } else {
      setJournalLogs(logs);
    }
  };

  useEffect(() => {
    loadData();
    const handleProfileSync = () => loadData();
    window.addEventListener("groove-profile-updated", handleProfileSync);
    window.addEventListener("groove-journal-updated", handleProfileSync);
    return () => {
      window.removeEventListener("groove-profile-updated", handleProfileSync);
      window.removeEventListener("groove-journal-updated", handleProfileSync);
    };
  }, [user, authProfile]);

  // Save Profile Changes
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    const cleanName = editName.trim() || userName;
    const cleanBio = editBio.trim();
    const cleanBadge = editBadge;

    setUserName(cleanName);
    setBio(cleanBio);
    setUserBadge(cleanBadge);
    setIsEditingProfile(false);

    try {
      localStorage.setItem("userName", cleanName);
      localStorage.setItem("groove_user_bio", cleanBio);
      localStorage.setItem("groove_user_badge", cleanBadge);
    } catch (_) {}

    if (user && isSupabaseConfigured()) {
      const updates = {
        display_name: cleanName,
        bio: cleanBio,
        badge: cleanBadge === "none" ? null : cleanBadge,
        is_verified: cleanBadge === "verified",
        is_critic: cleanBadge === "critic",
      };
      await updateProfile(updates);
    }

    toast.success("Profile & Critic Badge updated! ✨");
    window.dispatchEvent(new CustomEvent("groove-profile-updated"));
  };

  // Avatar Selection Handlers
  const handleSelectAvatar = (avId) => {
    setUserAvatar(avId);
    localStorage.setItem("userAvatar", avId);
    setIsEditingAvatar(false);
    if (user && isSupabaseConfigured()) {
      updateProfile({ avatar_url: avId });
    }
    toast.success("Profile avatar updated! 🎨");
  };

  const handleSelectDiceBear = (style, seed) => {
    const url = getDiceBearAvatarUrl(style, seed || userName || "groove");
    setUserAvatar(url);
    localStorage.setItem("userAvatar", url);
    setIsEditingAvatar(false);
    if (user && isSupabaseConfigured()) {
      updateProfile({ avatar_url: url });
    }
    toast.success("Avatar updated! 🎲✨");
  };

  const handleRandomizeSeed = () => {
    const randomSeed = Math.random().toString(36).substring(2, 9);
    setDicebearSeed(randomSeed);
    toast.info("Seed randomized! 🎲 Tap any style to apply.");
  };

  // Taste & Genre toggle
  const handleToggleGenre = (g) => {
    let updated;
    if (favoriteGenres.includes(g)) {
      updated = favoriteGenres.filter((item) => item !== g);
    } else {
      updated = [...favoriteGenres, g];
    }
    setFavoriteGenres(updated);
    localStorage.setItem("favoriteGenres", JSON.stringify(updated));
  };

  const handleSelectRatingSystem = (sys) => {
    setPreferredRatingSystem(sys);
    localStorage.setItem("preferred_rating_system", sys);
    toast.info(`Rating system set to ${sys === "stars" ? "★ 10-Star System" : "0–100 Score"}`);
  };

  const handleToggleDefaultPublic = () => {
    const nextVal = !defaultIsPublic;
    setDefaultIsPublic(nextVal);
    localStorage.setItem("default_journal_public", String(nextVal));
    toast.info(`Default entry privacy: ${nextVal ? "Public" : "Private"}`);
  };

  // Settings Handlers
  const handleSelectTheme = (mode) => {
    setTheme(mode);
    if (mode === "adaptive") {
      toast.success("Album-Adaptive mode activated! Detail pages will match album colors.");
    } else {
      toast.success(`${mode === "dark" ? "Dark" : "Light"} theme activated`);
    }
  };

  const handleSelectPlatform = (id) => {
    setPreferredPlatform(id);
    localStorage.setItem("preferred_music_platform", id);
    const found = STREAMING_PLATFORMS.find((p) => p.id === id);
    toast.success(`Default platform set to ${found?.name || id}`);
  };

  const handleToggleVinylSides = () => {
    const nextVal = !showVinylSides;
    setShowVinylSides(nextVal);
    localStorage.setItem("groove_show_vinyl_sides", String(nextVal));
    toast.info(nextVal ? "Vinyl side dividers enabled" : "Vinyl side dividers disabled");
  };

  // Data Export & Clear
  const handleExportData = () => {
    try {
      const backup = {
        profile: { userName, bio, userAvatar, userBadge },
        favoriteGenres,
        preferredRatingSystem,
        journal: journalLogs,
        savedSongs: JSON.parse(localStorage.getItem("savedSongs") || "[]"),
        savedAlbums: JSON.parse(localStorage.getItem("savedAlbums") || "[]"),
        savedArtists: JSON.parse(localStorage.getItem("savedArtists") || "[]"),
        savedPlaylists: JSON.parse(localStorage.getItem("savedPlaylists") || "[]"),
        exportedAt: new Date().toISOString(),
      };
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `grooveestrella-backup-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Data export downloaded! 📦");
    } catch (_) {
      toast.error("Failed to export backup.");
    }
  };

  const handleClearAllLibrary = () => {
    if (window.confirm("Are you sure you want to clear your local library? This deletes saved songs, albums, and artists from this device.")) {
      localStorage.removeItem("savedSongs");
      localStorage.removeItem("savedAlbums");
      localStorage.removeItem("savedArtists");
      localStorage.removeItem("savedPlaylists");
      localStorage.removeItem("customPlaylists");
      setSavedCounts({ songs: 0, albums: 0, artists: 0, playlists: 0 });
      toast.success("Local library cleared.");
    }
  };

  const handleShareProfile = () => {
    const profileUrl = `${window.location.origin}/profile/${authProfile?.username || userName}`;
    if (navigator.share) {
      navigator.share({
        title: `${userName} on GrooveEstrella`,
        url: profileUrl,
      });
    } else {
      navigator.clipboard.writeText(profileUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
      toast.success("Profile URL copied to clipboard!");
    }
  };

  // Computed Stats
  const stats = useMemo(() => {
    const totalListens = journalLogs.length;
    const reviews = journalLogs.filter((l) => l.review && l.review.trim().length > 0).length;
    const rated = journalLogs.filter((l) => l.rating > 0);
    const avgScore =
      rated.length > 0
        ? (rated.reduce((acc, curr) => acc + curr.rating, 0) / rated.length).toFixed(1)
        : null;
    const totalLibrary =
      savedCounts.songs + savedCounts.albums + savedCounts.artists + savedCounts.playlists;
    return { totalListens, reviews, avgScore, totalLibrary };
  }, [journalLogs, savedCounts]);

  const profileSlug = authProfile?.username || userName;
  const badgeTheme = getProfileBadgeTheme(userBadge);

  return (
    <div className="min-h-screen text-[var(--theme-fg)] py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-8 animate-fade-in font-sans pb-32">
      {/* 1. EDITORIAL PROFILE HERO (Balanced, Elegant, Seamless on PC & Mobile) */}
      <div
        style={
          badgeTheme.grain
            ? {
                backgroundImage: `radial-gradient(ellipse at top, rgba(245,158,11,0.18), transparent 70%), ${NOISE_GRAIN_BG}`,
              }
            : undefined
        }
        className={`relative rounded-3xl ${badgeTheme.heroBg} backdrop-blur-2xl border ${badgeTheme.heroBorder} p-6 sm:p-9 ${badgeTheme.heroShadow} ${badgeTheme.heroRing} overflow-hidden transition-all duration-500`}
      >
        <div
          className={`absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent ${badgeTheme.highlightLine} to-transparent pointer-events-none`}
        />

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8 relative z-10">
          {/* Avatar with Studio Trigger */}
          <div className="relative group shrink-0">
            <div
              className={`w-24 h-24 sm:w-28 sm:h-28 rounded-3xl overflow-hidden ${badgeTheme.avatarBg} border-2 border-white/20 shadow-2xl flex items-center justify-center ${badgeTheme.avatarRing} transition-all duration-500`}
            >
              <UserAvatarIcon
                avatarId={userAvatar}
                userName={userName}
                className="w-full h-full object-cover"
                iconClassName="w-12 h-12 text-zinc-950"
              />
            </div>
            <button
              onClick={() => setIsEditingAvatar(!isEditingAvatar)}
              className="absolute -bottom-2 -right-2 p-2 rounded-xl bg-[var(--theme-surface)] hover:bg-[var(--theme-card)] border border-[var(--theme-border)] text-[var(--theme-muted)] hover:text-amber-300 transition shadow-lg cursor-pointer"
              title="Change Avatar Icon"
            >
              <Edit3 size={13} />
            </button>
          </div>

          {/* Profile Identity */}
          <div className="flex-1 text-center sm:text-left space-y-2.5 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="min-w-0">
                {/* Badge & Aura Tell */}
                <div className="flex items-center justify-center sm:justify-start gap-2.5 mb-1.5 flex-wrap">
                  <UserProfileBadge badge={userBadge} size="md" />
                  <span className={`text-xs font-semibold ${badgeTheme.accentText} tracking-wide`}>
                    · {badgeTheme.tell}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-black tracking-tight font-display text-[var(--theme-fg)] truncate">
                  {userName}
                </h1>

                {/* Email Verification Pill & Public Handle */}
                <div className="flex items-center justify-center sm:justify-start gap-2.5 mt-1 flex-wrap">
                  <Link href={`/profile/${profileSlug}`} className="text-xs font-bold text-amber-300 hover:underline">
                    @{profileSlug}
                  </Link>

                  {user?.email && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[10px] font-bold">
                      <CheckCircle2 size={11} />
                      <span>{user.email}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons: Public View + Share + Edit + Sign Out */}
              <div className="flex items-center justify-center sm:justify-end gap-2 pt-1 sm:pt-0 shrink-0 flex-wrap">
                <Link
                  href={`/profile/${profileSlug}`}
                  className="px-3.5 py-1.5 rounded-2xl bg-[var(--theme-surface)] hover:bg-[var(--theme-card)] border border-[var(--theme-border)] hover:border-amber-400/40 text-xs font-bold text-[var(--theme-fg)] transition flex items-center gap-1.5 shadow-sm"
                  title="View Public Profile"
                >
                  <Globe size={13} className="text-amber-300" />
                  <span>Public</span>
                </Link>

                <button
                  onClick={handleShareProfile}
                  className="p-2 rounded-2xl bg-[var(--theme-surface)] hover:bg-[var(--theme-card)] border border-[var(--theme-border)] text-[var(--theme-muted)] hover:text-[var(--theme-fg)] transition cursor-pointer"
                  title="Share Profile Link"
                >
                  {copiedLink ? <Check size={14} className="text-emerald-400" /> : <Share2 size={14} />}
                </button>

                <button
                  onClick={() => setIsEditingProfile(true)}
                  className="p-2 rounded-2xl bg-[var(--theme-surface)] hover:bg-[var(--theme-card)] border border-[var(--theme-border)] text-[var(--theme-muted)] hover:text-amber-300 transition cursor-pointer"
                  title="Edit Profile"
                >
                  <Edit3 size={14} />
                </button>

                {user ? (
                  <button
                    onClick={signOut}
                    className="p-2 rounded-2xl bg-[var(--theme-surface)] hover:bg-rose-500/15 border border-[var(--theme-border)] text-[var(--theme-muted)] hover:text-rose-400 transition cursor-pointer"
                    title="Sign Out"
                  >
                    <LogOut size={14} />
                  </button>
                ) : (
                  <Link
                    href="/login"
                    className="px-3 py-1.5 rounded-2xl bg-amber-400 text-zinc-950 font-black text-xs hover:opacity-90 transition flex items-center gap-1 shadow-md"
                  >
                    <LogIn size={13} />
                    <span>Sign In</span>
                  </Link>
                )}
              </div>
            </div>

            {/* Bio */}
            <p className="text-xs sm:text-sm text-[var(--theme-muted)] max-w-xl leading-relaxed font-body">
              {bio || "Active music explorer, critic, and journal keeper on GrooveEstrella."}
            </p>

            {/* Followers / Following Counters */}
            {user && (
              <div className="flex items-center justify-center sm:justify-start gap-4 pt-1 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleOpenFollows("followers")}
                  className="inline-flex items-center gap-1.5 text-xs text-[var(--theme-muted)] hover:text-amber-300 transition cursor-pointer font-medium group"
                >
                  <Users size={13} className="text-amber-300" />
                  <span className="font-black text-sm text-[var(--theme-fg)] group-hover:text-amber-300 transition-colors">
                    {followersCount}
                  </span>
                  <span>Followers</span>
                </button>

                <span className="text-[var(--theme-border)]">·</span>

                <button
                  type="button"
                  onClick={() => handleOpenFollows("following")}
                  className="inline-flex items-center gap-1.5 text-xs text-[var(--theme-muted)] hover:text-amber-300 transition cursor-pointer font-medium group"
                >
                  <UserCheck size={13} className="text-amber-300" />
                  <span className="font-black text-sm text-[var(--theme-fg)] group-hover:text-amber-300 transition-colors">
                    {followingCount}
                  </span>
                  <span>Following</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Inline Avatar Studio Drawer */}
        {isEditingAvatar && (
          <div className="mt-6 p-4 sm:p-5 rounded-2xl bg-[var(--theme-surface)] border border-[var(--theme-border)] text-left space-y-4 animate-fade-in shadow-xl">
            <div className="flex items-center justify-between border-b border-[var(--theme-border)]/50 pb-2.5">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAvatarTab("dicebear")}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    avatarTab === "dicebear"
                      ? "bg-amber-400 text-zinc-950 shadow-xs"
                      : "text-[var(--theme-muted)] hover:text-[var(--theme-fg)]"
                  }`}
                >
                  <Sparkles size={12} />
                  <span>DiceBear Studio</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAvatarTab("icons")}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    avatarTab === "icons"
                      ? "bg-amber-400 text-zinc-950 shadow-xs"
                      : "text-[var(--theme-muted)] hover:text-[var(--theme-fg)]"
                  }`}
                >
                  <Headphones size={12} />
                  <span>Vector Insignias</span>
                </button>
              </div>

              <button
                onClick={() => setIsEditingAvatar(false)}
                className="p-1 rounded-lg text-xs text-[var(--theme-muted)] hover:text-[var(--theme-fg)] hover:bg-[var(--theme-card)]"
              >
                ✕
              </button>
            </div>

            {avatarTab === "dicebear" ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={dicebearSeed}
                    onChange={(e) => setDicebearSeed(e.target.value)}
                    placeholder="Type avatar seed or moniker..."
                    className="w-full px-3 py-1.5 rounded-xl bg-[var(--theme-card)] border border-[var(--theme-border)] text-xs font-semibold text-[var(--theme-fg)] focus:outline-none focus:border-amber-400"
                  />
                  <button
                    type="button"
                    onClick={handleRandomizeSeed}
                    className="px-3 py-1.5 rounded-xl bg-[var(--theme-card)] hover:bg-[var(--theme-surface)] border border-[var(--theme-border)] text-xs font-bold text-amber-300 transition flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <Dice5 size={14} />
                    <span>Roll</span>
                  </button>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {DICEBEAR_STYLES.map((st) => {
                    const avatarUrl = getDiceBearAvatarUrl(st.id, dicebearSeed || userName || "groove");
                    const isSelected = userAvatar === avatarUrl;
                    return (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => handleSelectDiceBear(st.id, dicebearSeed || userName || "groove")}
                        className={`p-2 rounded-xl border text-center flex flex-col items-center gap-1 transition cursor-pointer active:scale-95 group ${
                          isSelected
                            ? "bg-amber-400/20 border-amber-400 ring-2 ring-amber-400/30"
                            : "bg-[var(--theme-card)] border-[var(--theme-border)] hover:border-amber-400/50"
                        }`}
                      >
                        <img
                          src={avatarUrl}
                          alt={st.label}
                          className="w-10 h-10 rounded-lg object-cover bg-black/30 group-hover:scale-105 transition-transform"
                        />
                        <span className="text-[10px] font-bold text-[var(--theme-fg)] truncate w-full">
                          {st.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {AVAILABLE_AVATARS.map((av) => {
                  const IconComp = av.icon;
                  const isSelected = userAvatar === av.id;
                  return (
                    <button
                      key={av.id}
                      type="button"
                      onClick={() => handleSelectAvatar(av.id)}
                      className={`p-2.5 rounded-xl border text-center flex flex-col items-center gap-1 transition cursor-pointer active:scale-95 ${
                        isSelected
                          ? "bg-amber-400/20 border-amber-400 text-amber-300"
                          : "bg-[var(--theme-card)] border-[var(--theme-border)] text-[var(--theme-muted)] hover:text-[var(--theme-fg)]"
                      }`}
                    >
                      <IconComp className="w-5 h-5" />
                      <span className="text-[10px] font-bold truncate">{av.label.split(" ")[0]}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. OVERHAULED SECTION SWITCHER (Segmented Architecture: Taste, Activity, Settings, Curator) */}
      <div className="flex items-center gap-2 border-b border-[var(--theme-border)] pb-3 overflow-x-auto scrollbar-none no-scrollbar">
        {[
          { id: "taste", label: "Identity & Taste", icon: Sparkles },
          { id: "activity", label: "Journal Activity", icon: BookOpen, count: journalLogs.length },
          { id: "settings", label: "Settings & System", icon: Settings },
          ...(authProfile?.is_admin ? [{ id: "curator", label: "Curator Tools", icon: Shield }] : []),
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeAccountTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveAccountTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                isActive
                  ? "bg-gradient-to-r from-amber-400 to-amber-300 text-zinc-950 font-black shadow-md shadow-amber-400/20 scale-102"
                  : "bg-[var(--theme-surface)] text-[var(--theme-muted)] hover:text-[var(--theme-fg)] hover:bg-[var(--theme-card)] border border-[var(--theme-border)]"
              }`}
            >
              <Icon size={14} className={isActive ? "text-zinc-950" : "text-amber-400"} />
              <span>{tab.label}</span>
              {typeof tab.count === "number" && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                    isActive ? "bg-black/20 text-zinc-950" : "bg-[var(--theme-card)] text-amber-300"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 3. TAB 1: IDENTITY & TASTE */}
      {activeAccountTab === "taste" && (
        <div className="space-y-6 animate-fade-in">
          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <Link
              href="/journal"
              className="p-4 rounded-2xl bg-[var(--theme-card)]/80 border border-[var(--theme-border)] hover:border-amber-400/40 transition-all shadow-sm group block"
            >
              <div className="flex items-center justify-between text-xs font-semibold text-[var(--theme-muted)] mb-1">
                <span>Journal Logs</span>
                <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-amber-300" />
              </div>
              <div className="text-2xl font-black text-[var(--theme-fg)]">{stats.totalListens}</div>
              <span className="text-[10px] text-[var(--theme-muted)]">Listens tracked</span>
            </Link>

            <Link
              href="/journal"
              className="p-4 rounded-2xl bg-[var(--theme-card)]/80 border border-[var(--theme-border)] hover:border-amber-400/40 transition-all shadow-sm group block"
            >
              <div className="flex items-center justify-between text-xs font-semibold text-[var(--theme-muted)] mb-1">
                <span>Written Reviews</span>
                <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-amber-300" />
              </div>
              <div className="text-2xl font-black text-amber-300">{stats.reviews}</div>
              <span className="text-[10px] text-[var(--theme-muted)]">Critiques posted</span>
            </Link>

            <div className="p-4 rounded-2xl bg-[var(--theme-card)]/80 border border-[var(--theme-border)] shadow-sm">
              <div className="text-xs font-semibold text-[var(--theme-muted)] mb-1">Avg Score</div>
              <div className="text-2xl font-black text-amber-300">{stats.avgScore ? `${stats.avgScore}★` : "—"}</div>
              <span className="text-[10px] text-[var(--theme-muted)]">Letterboxd scale</span>
            </div>

            <Link
              href="/library"
              className="p-4 rounded-2xl bg-[var(--theme-card)]/80 border border-[var(--theme-border)] hover:border-amber-400/40 transition-all shadow-sm group block"
            >
              <div className="flex items-center justify-between text-xs font-semibold text-[var(--theme-muted)] mb-1">
                <span>Saved Library</span>
                <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-amber-300" />
              </div>
              <div className="text-2xl font-black text-[var(--theme-fg)]">{stats.totalLibrary}</div>
              <span className="text-[10px] text-[var(--theme-muted)]">Songs, albums, artists</span>
            </Link>
          </div>

          {/* Taste Tags */}
          <div className="p-5 sm:p-6 rounded-3xl bg-[var(--theme-card)]/80 border border-[var(--theme-border)] space-y-4 shadow-sm">
            <div>
              <h3 className="text-base font-black text-[var(--theme-fg)] font-display">
                Music Taste & Genres ({favoriteGenres.length} pinned)
              </h3>
              <p className="text-xs text-[var(--theme-muted)] mt-0.5">
                Tap genre tags to shape your personalized recommendations.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {ALL_GENRES.map((g) => {
                const isSelected = favoriteGenres.includes(g);
                return (
                  <button
                    key={g}
                    type="button"
                    onClick={() => handleToggleGenre(g)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer active:scale-95 ${
                      isSelected
                        ? "bg-amber-400 text-zinc-950 font-black shadow-xs"
                        : "bg-[var(--theme-surface)] text-[var(--theme-muted)] hover:text-[var(--theme-fg)] border border-[var(--theme-border)]"
                    }`}
                  >
                    #{g}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Scoring Philosophy & Privacy */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-[var(--theme-card)]/80 border border-[var(--theme-border)] space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--theme-muted)]">
                Default Rating Scale
              </span>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleSelectRatingSystem("stars")}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
                    preferredRatingSystem === "stars"
                      ? "bg-amber-400 text-zinc-950 shadow-xs"
                      : "bg-[var(--theme-surface)] text-[var(--theme-muted)] hover:text-[var(--theme-fg)] border border-[var(--theme-border)]"
                  }`}
                >
                  ★ 10-Star System
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectRatingSystem("score")}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
                    preferredRatingSystem === "score"
                      ? "bg-amber-400 text-zinc-950 shadow-xs"
                      : "bg-[var(--theme-surface)] text-[var(--theme-muted)] hover:text-[var(--theme-fg)] border border-[var(--theme-border)]"
                  }`}
                >
                  0–100 Score
                </button>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[var(--theme-card)]/80 border border-[var(--theme-border)] space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--theme-muted)]">
                Default Entry Privacy
              </span>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleToggleDefaultPublic}
                  className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    defaultIsPublic
                      ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400"
                      : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                  }`}
                >
                  <Globe size={13} />
                  <span>{defaultIsPublic ? "Public Logs (Default)" : "Private Only"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. TAB 2: RECENT JOURNAL ACTIVITY */}
      {activeAccountTab === "activity" && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-[var(--theme-fg)] font-display">
                Recent Diary Entries
              </h3>
              <p className="text-xs text-[var(--theme-muted)]">
                Your latest album logs and critical reflections.
              </p>
            </div>

            <Link
              href="/journal"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-amber-400 to-amber-300 text-zinc-950 font-black text-xs hover:scale-105 active:scale-95 transition shadow-sm"
            >
              <span>Full Music Diary</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          {journalLogs.length === 0 ? (
            <div className="p-10 rounded-3xl bg-[var(--theme-card)]/60 border border-[var(--theme-border)] text-center space-y-3">
              <BookOpen size={30} className="mx-auto text-[var(--theme-muted)]" />
              <h4 className="text-base font-bold text-[var(--theme-fg)]">No Journal Logs Yet</h4>
              <p className="text-xs text-[var(--theme-muted)] max-w-sm mx-auto">
                Listen to music and tap Rate on albums or tracks to start filling your diary archive.
              </p>
              <Link
                href="/search"
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-amber-400 text-zinc-950 font-black text-xs hover:scale-105 active:scale-95 transition shadow-sm mt-2"
              >
                <Sparkles size={13} />
                <span>Search Music</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {journalLogs.slice(0, 5).map((entry) => (
                <JournalCard
                  key={entry.id}
                  entry={entry}
                  isOwner={true}
                  onEdit={(e) => {
                    router.push(
                      buildJournalEditorHref({
                        mbid: e.targetId,
                        type: e.targetType || "album",
                        title: e.title,
                        subtitle: e.subtitle,
                        image: e.image,
                        entryId: e.id,
                        returnTo: "/account",
                      })
                    );
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* 5. TAB 3: SETTINGS & PREFERENCES (Fully Integrated from /settings) */}
      {activeAccountTab === "settings" && (
        <div className="space-y-6 animate-fade-in">
          {/* Section: Appearance & Display Theme */}
          <div className="p-5 sm:p-6 rounded-3xl bg-[var(--theme-card)]/80 border border-[var(--theme-border)] space-y-4 shadow-sm">
            <div className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="text-base font-bold text-[var(--theme-fg)]">Appearance & Theme</h3>
                <p className="text-xs text-[var(--theme-muted)]">Select your visual styling mode.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => handleSelectTheme("dark")}
                className={`p-3.5 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between gap-2 ${
                  theme === "dark"
                    ? "bg-amber-400/15 border-amber-400 text-[var(--theme-fg)] ring-1 ring-amber-400/30"
                    : "bg-[var(--theme-surface)] border-[var(--theme-border)] text-[var(--theme-muted)] hover:text-[var(--theme-fg)]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <Moon size={18} className="text-amber-400" />
                  {theme === "dark" && <Check size={14} className="text-amber-400" />}
                </div>
                <div>
                  <div className="text-xs font-bold text-[var(--theme-fg)]">Dark Mode</div>
                  <p className="text-[10px] text-[var(--theme-muted)]">Classic nighttime aesthetic</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectTheme("light")}
                className={`p-3.5 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between gap-2 ${
                  theme === "light"
                    ? "bg-amber-400/15 border-amber-400 text-[var(--theme-fg)] ring-1 ring-amber-400/30"
                    : "bg-[var(--theme-surface)] border-[var(--theme-border)] text-[var(--theme-muted)] hover:text-[var(--theme-fg)]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <Sun size={18} className="text-amber-400" />
                  {theme === "light" && <Check size={14} className="text-amber-400" />}
                </div>
                <div>
                  <div className="text-xs font-bold text-[var(--theme-fg)]">Light Mode</div>
                  <p className="text-[10px] text-[var(--theme-muted)]">Clean bright styling</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectTheme("adaptive")}
                className={`p-3.5 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between gap-2 ${
                  theme === "adaptive"
                    ? "bg-amber-400/15 border-amber-400 text-[var(--theme-fg)] ring-1 ring-amber-400/30"
                    : "bg-[var(--theme-surface)] border-[var(--theme-border)] text-[var(--theme-muted)] hover:text-[var(--theme-fg)]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <Sparkles size={18} className="text-amber-400" />
                  {theme === "adaptive" && <Check size={14} className="text-amber-400" />}
                </div>
                <div>
                  <div className="text-xs font-bold text-[var(--theme-fg)]">Album-Adaptive</div>
                  <p className="text-[10px] text-[var(--theme-muted)]">Colors match spinning artwork</p>
                </div>
              </button>
            </div>
          </div>

          {/* Section: Default Streaming Platform */}
          <div className="p-5 sm:p-6 rounded-3xl bg-[var(--theme-card)]/80 border border-[var(--theme-border)] space-y-4 shadow-sm">
            <div className="flex items-center gap-2">
              <Headphones className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="text-base font-bold text-[var(--theme-fg)]">Preferred Streaming Service</h3>
                <p className="text-xs text-[var(--theme-muted)]">
                  Where GrooveLinks route when clicking play buttons.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {STREAMING_PLATFORMS.map((platform) => {
                const isSelected = preferredPlatform === platform.id;
                return (
                  <button
                    key={platform.id}
                    type="button"
                    onClick={() => handleSelectPlatform(platform.id)}
                    className={`p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between gap-1.5 ${
                      isSelected
                        ? "bg-amber-400/15 border-amber-400 text-amber-300 ring-1 ring-amber-400/30"
                        : "bg-[var(--theme-surface)] border-[var(--theme-border)] text-[var(--theme-muted)] hover:text-[var(--theme-fg)]"
                    }`}
                  >
                    <div className="text-xs font-bold text-[var(--theme-fg)]">{platform.name}</div>
                    <p className="text-[10px] text-[var(--theme-muted)] line-clamp-1">{platform.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section: Turntable & Vinyl Playback Experience */}
          <div className="p-5 sm:p-6 rounded-3xl bg-[var(--theme-card)]/80 border border-[var(--theme-border)] space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Disc3 className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="text-base font-bold text-[var(--theme-fg)]">Vinyl Side Dividers</h3>
                  <p className="text-xs text-[var(--theme-muted)]">
                    Display tracks grouped by Side A / Side B on album pages.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleToggleVinylSides}
                className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                  showVinylSides ? "bg-amber-400" : "bg-zinc-700"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-zinc-950 absolute top-0.5 transition-transform ${
                    showVinylSides ? "left-6.5" : "left-0.5"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Section: Retake Onboarding Setup */}
          <div className="p-5 sm:p-6 rounded-3xl bg-[var(--theme-card)]/80 border border-[var(--theme-border)] space-y-3 shadow-sm">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="text-base font-bold text-[var(--theme-fg)]">Music Taste Onboarding</h3>
                  <p className="text-xs text-[var(--theme-muted)]">
                    Re-run the musical onboarding journey to select artists and preferences.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent("open-onboarding"))}
                className="px-4 py-2 rounded-2xl bg-[var(--theme-surface)] hover:bg-[var(--theme-border)] text-xs font-bold text-amber-300 border border-amber-400/30 transition cursor-pointer flex items-center gap-1.5"
              >
                <span>Launch Onboarding</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>

          {/* Section: Data Backup & Storage Management */}
          <div className="p-5 sm:p-6 rounded-3xl bg-[var(--theme-card)]/80 border border-[var(--theme-border)] space-y-4 shadow-sm">
            <div className="flex items-center gap-2">
              <Download className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="text-base font-bold text-[var(--theme-fg)]">Data & Library Management</h3>
                <p className="text-xs text-[var(--theme-muted)]">
                  Export backups or reset cached local data on this browser.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap pt-1">
              <button
                type="button"
                onClick={handleExportData}
                className="px-4 py-2 rounded-2xl bg-[var(--theme-surface)] hover:bg-[var(--theme-border)] border border-[var(--theme-border)] text-xs font-bold text-[var(--theme-fg)] transition cursor-pointer flex items-center gap-1.5"
              >
                <Download size={13} className="text-amber-400" />
                <span>Export JSON Backup</span>
              </button>

              <button
                type="button"
                onClick={handleClearAllLibrary}
                className="px-4 py-2 rounded-2xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/25 text-red-400 text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 size={13} />
                <span>Clear Local Library</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. TAB 4: CURATOR TOOLS (Admin Only) */}
      {activeAccountTab === "curator" && authProfile?.is_admin && (
        <div className="space-y-6 animate-fade-in">
          <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-500/15 via-[var(--theme-card)] to-[var(--theme-card)] border border-amber-400/40 space-y-4 shadow-lg">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-widest">
              <Shield size={14} />
              <span>Admin Curator Dashboard</span>
            </div>
            <div>
              <h3 className="text-xl font-black text-[var(--theme-fg)] font-display">
                Official Curated Rankings & Editorial Lists
              </h3>
              <p className="text-xs text-[var(--theme-muted)] mt-1 max-w-xl">
                Create and manage official front-page albums and artist ranking collections visible across GrooveEstrella.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Link
                href="/lists/new"
                className="px-5 py-2.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-300 text-zinc-950 font-black text-xs hover:scale-105 active:scale-95 transition shadow-md"
              >
                + New Official List
              </Link>
              <Link
                href="/lists"
                className="px-4 py-2.5 rounded-full bg-[var(--theme-surface)] border border-[var(--theme-border)] text-xs font-bold text-[var(--theme-fg)] hover:text-amber-300 transition"
              >
                View All Lists
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {isEditingProfile && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-md px-4">
          <div className="absolute inset-0" onClick={() => setIsEditingProfile(false)} />
          <div className="relative max-w-md w-full bg-[var(--theme-card)] border border-[var(--theme-border)] rounded-3xl p-6 sm:p-8 shadow-2xl z-10 text-[var(--theme-fg)] space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black font-display text-[var(--theme-fg)]">
                Edit Critic Profile
              </h3>
              <button
                onClick={() => setIsEditingProfile(false)}
                className="p-1.5 rounded-xl hover:bg-white/10 text-[var(--theme-muted)] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[var(--theme-muted)] uppercase tracking-wider mb-1.5">
                  Display Moniker
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="e.g. Sonic Voyager"
                  className="w-full px-4 py-2.5 rounded-2xl bg-[var(--theme-surface)] border border-[var(--theme-border)] text-sm font-bold text-[var(--theme-fg)] focus:outline-none focus:border-amber-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--theme-muted)] uppercase tracking-wider mb-2">
                  Select Badge & Identity Aura
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    {
                      id: "admin",
                      title: "Admin",
                      desc: "Glowing Red Badge",
                      badgeComp: <UserProfileBadge badge="admin" size="sm" />,
                      borderActive: "border-red-500/80 bg-red-950/40 ring-red-500/50",
                    },
                    {
                      id: "verified",
                      title: "Verified",
                      desc: "Authentic Disc Logo",
                      badgeComp: <UserProfileBadge badge="verified" size="sm" />,
                      borderActive: "border-sky-400/80 bg-sky-950/40 ring-sky-400/50",
                    },
                    {
                      id: "critic",
                      title: "Critic",
                      desc: "Golden Disc with Grain",
                      badgeComp: <UserProfileBadge badge="critic" size="sm" />,
                      borderActive: "border-amber-400/80 bg-amber-950/40 ring-amber-400/50",
                    },
                    {
                      id: "none",
                      title: "Citizen",
                      desc: "Standard Listener",
                      badgeComp: (
                        <span className="px-2 py-0.5 rounded-full bg-[var(--theme-card)] text-[10px] font-bold text-[var(--theme-muted)] uppercase tracking-wider border border-[var(--theme-border)]">
                          Citizen
                        </span>
                      ),
                      borderActive: "border-[var(--theme-accent)] bg-[var(--theme-surface)] ring-[var(--theme-accent)]/50",
                    },
                  ].map((option) => {
                    const isSelected = editBadge === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setEditBadge(option.id)}
                        className={`p-3 rounded-2xl border text-left flex flex-col justify-between gap-1 transition cursor-pointer ${
                          isSelected
                            ? `${option.borderActive} ring-2 shadow-sm`
                            : "bg-[var(--theme-surface)] border-[var(--theme-border)] hover:border-amber-400/40"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          {option.badgeComp}
                          {isSelected && <Check size={11} className="text-amber-400 stroke-[3]" />}
                        </div>
                        <p className="text-[10px] text-[var(--theme-muted)] pt-0.5">{option.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--theme-muted)] uppercase tracking-wider mb-1.5">
                  Bio / Critical Philosophy
                </label>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  rows={3}
                  placeholder="Share your musical taste, favorite eras, or critical perspective..."
                  className="w-full px-4 py-2.5 rounded-2xl bg-[var(--theme-surface)] border border-[var(--theme-border)] text-xs text-[var(--theme-fg)] focus:outline-none focus:border-amber-400 resize-none leading-relaxed"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="flex-1 py-2.5 rounded-full border border-[var(--theme-border)] text-xs font-bold text-[var(--theme-muted)] hover:bg-[var(--theme-surface)] transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-300 text-zinc-950 text-xs font-black hover:opacity-90 transition cursor-pointer shadow-md"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Followers & Following Modal */}
      {user && (
        <FollowersListModal
          isOpen={isFollowsModalOpen}
          onClose={() => setIsFollowsModalOpen(false)}
          userId={user.id}
          username={authProfile?.username || userName}
          initialTab={followsModalTab}
        />
      )}
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen py-24 flex flex-col items-center justify-center gap-3">
          <DiscLoader size={36} />
          <span className="text-xs font-bold uppercase tracking-widest text-[var(--theme-muted)]">
            Loading Account Sanctuary...
          </span>
        </div>
      }
    >
      <AccountDashboardContent />
    </Suspense>
  );
}
