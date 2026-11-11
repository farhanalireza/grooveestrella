// src/app/account/page.jsx
"use client";

import React, { useEffect, useState, useMemo, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  User,
  Star,
  BookOpen,
  Calendar,
  Disc,
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
} from "lucide-react";
import { toast } from "@/lib/toast";
import { generateRandomName, getOrSetUserName } from "@/lib/nameGenerator";
import UserAvatarIcon, {
  AVAILABLE_AVATARS,
  DICEBEAR_STYLES,
  getDiceBearAvatarUrl,
} from "@/Components/UserAvatarIcon";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import JournalCard from "@/Components/JournalCard";
import RatingAndJournalModal from "@/Components/RatingAndJournalModal";
import FollowersListModal from "@/Components/FollowersListModal";

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

function AccountDashboardContent() {
  const router = useRouter();
  const { user, profile: authProfile, signOut, updateProfile, isConfigured } = useSupabaseAuth();

  const [userName, setUserName] = useState("");
  const [userAvatar, setUserAvatar] = useState("");
  const [bio, setBio] = useState("");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [isEditingAvatar, setIsEditingAvatar] = useState(false);

  // DiceBear Avatar Customization Studio State
  const [avatarTab, setAvatarTab] = useState("dicebear"); // 'dicebear' | 'icons'
  const [dicebearStyle, setDicebearStyle] = useState("identicon");
  const [dicebearSeed, setDicebearSeed] = useState("");

  // User critic preferences
  const [favoriteGenres, setFavoriteGenres] = useState([]);
  const [preferredRatingSystem, setPreferredRatingSystem] = useState("stars"); // 'stars' | 'score'
  const [defaultIsPublic, setDefaultIsPublic] = useState(true);

  // Journal logs & library stats
  const [journalLogs, setJournalLogs] = useState([]);
  const [savedCounts, setSavedCounts] = useState({ songs: 0, albums: 0, artists: 0, playlists: 0 });
  const [copiedLink, setCopiedLink] = useState(false);

  // Modal for editing journal entry
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalItem, setModalItem] = useState(null);

  // Social follows modal
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
    setUserName(currentName);
    setEditName(currentName);
    setBio(currentBio);
    setEditBio(currentBio);

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

      supabase
        .from("journals")
        .select(`
          id,
          entry_text,
          mood,
          listened_date,
          is_public,
          created_at,
          user_ratings ( score, rating_type ),
          music_entities ( id, mbid, type, title, artist_credit, cover_art_url )
        `)
        .eq("user_id", user.id)
        .order("listened_date", { ascending: false })
        .then(({ data, error }) => {
          if (!error && Array.isArray(data) && data.length > 0) {
            const formatted = data.map((j) => ({
              id: j.id,
              targetId: j.music_entities?.mbid,
              targetType: j.music_entities?.type || "album",
              title: j.music_entities?.title || "Untitled",
              subtitle: j.music_entities?.artist_credit || "",
              image: j.music_entities?.cover_art_url || "",
              rating:
                j.user_ratings?.rating_type === "stars"
                  ? j.user_ratings.score
                  : Math.round((j.user_ratings?.score || 0) / 10),
              numericalScore: j.user_ratings?.score || 0,
              ratingSystem: j.user_ratings?.rating_type || "stars",
              date: j.listened_date,
              review: j.entry_text || "",
              mood: j.mood || "",
              is_public: j.is_public,
              createdAt: new Date(j.created_at).getTime(),
            }));

            // Deduplicate by entity targetId to prevent duplicates in UI
            const seen = new Set();
            const deduplicated = [];
            for (const item of formatted) {
              const k = `${item.targetType}_${item.targetId}`;
              if (!seen.has(k)) {
                seen.add(k);
                deduplicated.push(item);
              }
            }
            setJournalLogs(deduplicated);
          } else {
            setJournalLogs(logs);
          }
        })
        .catch(() => setJournalLogs(logs));
    } else {
      setJournalLogs(logs);
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener("groove-profile-updated", loadData);
    window.addEventListener("groove-journal-updated", loadData);
    return () => {
      window.removeEventListener("groove-profile-updated", loadData);
      window.removeEventListener("groove-journal-updated", loadData);
    };
  }, [user, authProfile]);

  // Handle Profile Save
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    const finalName = editName.trim() || userName;
    setUserName(finalName);
    setBio(editBio.trim());
    localStorage.setItem("userName", finalName);
    localStorage.setItem("groove_user_bio", editBio.trim());

    if (user && isSupabaseConfigured()) {
      await updateProfile({
        display_name: finalName,
        bio: editBio.trim(),
      });
    }

    setIsEditingProfile(false);
    toast.success("Profile updated! ✨");
  };

  const handleSelectAvatar = (avId) => {
    setUserAvatar(avId);
    localStorage.setItem("userAvatar", avId);
    setIsEditingAvatar(false);
    if (user && isSupabaseConfigured()) {
      updateProfile({ avatar_url: avId });
    }
    toast.success("Avatar updated! ✨");
  };

  const handleSelectDiceBear = (style, seed) => {
    const url = getDiceBearAvatarUrl(style, seed || userName || "groove");
    setUserAvatar(url);
    localStorage.setItem("userAvatar", url);
    setIsEditingAvatar(false);
    if (user && isSupabaseConfigured()) {
      updateProfile({ avatar_url: url });
    }
    toast.success("DiceBear avatar updated! 🎲✨");
  };

  const handleRandomizeSeed = () => {
    const randomSeed = Math.random().toString(36).substring(2, 9);
    setDicebearSeed(randomSeed);
    toast.info("Seed randomized! 🎲 Tap any avatar to save.");
  };

  // Toggle Genre
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

  // Toggle Rating System
  const handleSelectRatingSystem = (sys) => {
    setPreferredRatingSystem(sys);
    localStorage.setItem("preferred_rating_system", sys);
    toast.info(`Preferred rating system set to ${sys === "stars" ? "10-Star System" : "0–100 Score"}`);
  };

  // Toggle Default Visibility
  const handleToggleDefaultPublic = () => {
    const nextVal = !defaultIsPublic;
    setDefaultIsPublic(nextVal);
    localStorage.setItem("default_journal_public", String(nextVal));
    toast.info(`Default entry privacy: ${nextVal ? "Public" : "Private"}`);
  };

  // Export Data JSON
  const handleExportData = () => {
    try {
      const backup = {
        profile: { userName, bio, userAvatar },
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
      a.download = `grooveestrella-critic-backup-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Data export downloaded! 📦");
    } catch (_) {
      toast.error("Failed to export backup.");
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

  // Computed Critic Stats
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

  return (
    <div className="min-h-screen text-[var(--theme-fg)] py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-10">
      {/* 1. CRITIC PROFILE HERO CARD */}
      <div className="relative rounded-3xl bg-[var(--theme-card)]/90 backdrop-blur-2xl border border-[var(--theme-border)] p-7 sm:p-10 shadow-2xl overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-7 sm:gap-8 relative z-10">
          {/* Avatar with selector trigger */}
          <div className="relative group shrink-0">
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl overflow-hidden bg-gradient-to-tr from-amber-400 via-amber-300 to-amber-200 border-2 border-white/20 shadow-2xl flex items-center justify-center ring-4 ring-amber-400/20">
              <UserAvatarIcon
                avatarId={userAvatar}
                userName={userName}
                className="w-full h-full object-cover"
                iconClassName="w-14 h-14 text-zinc-950"
              />
            </div>
            <button
              onClick={() => setIsEditingAvatar(!isEditingAvatar)}
              className="absolute -bottom-2 -right-2 p-2 rounded-xl bg-[var(--theme-surface)] hover:bg-[var(--theme-card)] border border-[var(--theme-border)] text-[var(--theme-muted)] hover:text-amber-300 transition shadow-lg cursor-pointer"
              title="Change Avatar Icon"
            >
              <Edit3 size={14} />
            </button>
          </div>

          {/* Profile Details */}
          <div className="flex-1 text-center sm:text-left space-y-3 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="min-w-0">
                {/* Cloud Auth Status Pill */}
                <div className="flex items-center justify-center sm:justify-start gap-2 mb-1.5 flex-wrap">
                  {user ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[10px] font-bold uppercase tracking-widest">
                      <CheckCircle2 size={11} />
                      <span>Cloud Connected · {user.email}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/25 text-amber-300 text-[10px] font-bold uppercase tracking-widest">
                      <Sparkles size={11} />
                      <span>Local Profile · Citizen</span>
                    </span>
                  )}
                </div>

                <h1 className="text-3xl sm:text-4xl font-black tracking-tight font-display text-[var(--theme-fg)] truncate">
                  {userName}
                </h1>

                <p className="text-sm text-amber-300 font-bold mt-0.5">
                  Profile:{" "}
                  <Link href={`/profile/${profileSlug}`} className="hover:underline">
                    @{profileSlug}
                  </Link>
                </p>
              </div>

              {/* Action Buttons: Public View + Share + Edit */}
              <div className="flex items-center justify-center sm:justify-end gap-2.5 pt-1 sm:pt-0 shrink-0 flex-wrap">
                <Link
                  href={`/profile/${profileSlug}`}
                  className="px-4 py-2 rounded-2xl bg-[var(--theme-surface)] hover:bg-[var(--theme-card)] border border-[var(--theme-border)] hover:border-amber-400/40 text-xs font-bold text-[var(--theme-fg)] transition flex items-center gap-1.5 shadow-sm"
                  title="Open your public profile page"
                >
                  <Globe size={13} className="text-amber-300" />
                  <span>Public View</span>
                </Link>

                <button
                  onClick={handleShareProfile}
                  className="p-2.5 rounded-2xl bg-[var(--theme-surface)] hover:bg-[var(--theme-card)] border border-[var(--theme-border)] text-[var(--theme-muted)] hover:text-[var(--theme-fg)] transition cursor-pointer"
                  title="Share Profile Link"
                >
                  {copiedLink ? <Check size={15} className="text-emerald-400" /> : <Share2 size={15} />}
                </button>

                <button
                  onClick={() => setIsEditingProfile(true)}
                  className="p-2.5 rounded-2xl bg-[var(--theme-surface)] hover:bg-[var(--theme-card)] border border-[var(--theme-border)] text-[var(--theme-muted)] hover:text-amber-300 transition cursor-pointer"
                  title="Edit Profile"
                >
                  <Edit3 size={15} />
                </button>

                {user ? (
                  <button
                    onClick={signOut}
                    className="p-2.5 rounded-2xl bg-[var(--theme-surface)] hover:bg-rose-500/15 border border-[var(--theme-border)] text-[var(--theme-muted)] hover:text-rose-400 transition cursor-pointer"
                    title="Sign Out"
                  >
                    <LogOut size={15} />
                  </button>
                ) : (
                  <Link
                    href="/login"
                    className="px-3.5 py-2 rounded-2xl bg-amber-400 text-zinc-950 font-black text-xs hover:scale-105 active:scale-95 transition flex items-center gap-1 shadow-md"
                  >
                    <LogIn size={13} />
                    <span>Sign In</span>
                  </Link>
                )}
              </div>
            </div>

            {/* Bio */}
            <p className="text-sm sm:text-base text-[var(--theme-muted)] max-w-2xl leading-relaxed pt-1 font-body">
              {bio || "Active music explorer and journal keeper on GrooveEstrella."}
            </p>

            {/* Social Follower & Following Row */}
            {user && (
              <div className="flex items-center justify-center sm:justify-start gap-4 pt-1 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleOpenFollows("followers")}
                  className="inline-flex items-center gap-1.5 text-xs text-[var(--theme-muted)] hover:text-amber-300 transition cursor-pointer font-medium group"
                  title="View your followers"
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
                  title="View critics you follow"
                >
                  <UserCheck size={13} className="text-amber-300" />
                  <span className="font-black text-sm text-[var(--theme-fg)] group-hover:text-amber-300 transition-colors">
                    {followingCount}
                  </span>
                  <span>Following</span>
                </button>
              </div>
            )}

            {/* Inline Avatar Icon Selector Drawer (Full DiceBear Studio + Vector Icons) */}
            {isEditingAvatar && (
              <div className="mt-4 p-5 rounded-3xl bg-[var(--theme-surface)] border border-[var(--theme-border)] text-left space-y-4 animate-fade-in shadow-xl">
                <div className="flex items-center justify-between border-b border-[var(--theme-border)]/50 pb-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setAvatarTab("dicebear")}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                        avatarTab === "dicebear"
                          ? "bg-amber-400 text-zinc-950 shadow-xs"
                          : "text-[var(--theme-muted)] hover:text-[var(--theme-fg)]"
                      }`}
                    >
                      <Sparkles size={13} />
                      <span>DiceBear Studio</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAvatarTab("icons")}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                        avatarTab === "icons"
                          ? "bg-amber-400 text-zinc-950 shadow-xs"
                          : "text-[var(--theme-muted)] hover:text-[var(--theme-fg)]"
                      }`}
                    >
                      <Headphones size={13} />
                      <span>Vector Icons</span>
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
                  <div className="space-y-4">
                    {/* Seed input bar with Randomize button */}
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={dicebearSeed}
                          onChange={(e) => setDicebearSeed(e.target.value)}
                          placeholder="Type avatar seed or username..."
                          className="w-full px-3.5 py-2 rounded-xl bg-[var(--theme-card)] border border-[var(--theme-border)] text-xs font-semibold text-[var(--theme-fg)] focus:outline-none focus:border-amber-400"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleRandomizeSeed}
                        className="px-3.5 py-2 rounded-xl bg-[var(--theme-card)] hover:bg-[var(--theme-surface)] border border-[var(--theme-border)] text-xs font-bold text-amber-300 transition flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs"
                        title="Randomize avatar seed"
                      >
                        <Dice5 size={15} />
                        <span>Roll Dice</span>
                      </button>
                    </div>

                    {/* Style selector pills */}
                    <div className="flex gap-1.5 overflow-x-auto scrollb-none no-scrollbar py-1">
                      {DICEBEAR_STYLES.map((st) => (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => setDicebearStyle(st.id)}
                          className={`shrink-0 px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer ${
                            dicebearStyle === st.id
                              ? "bg-amber-400 text-zinc-950"
                              : "bg-[var(--theme-card)] text-[var(--theme-muted)] hover:text-[var(--theme-fg)] border border-[var(--theme-border)]"
                          }`}
                        >
                          {st.label}
                        </button>
                      ))}
                    </div>

                    {/* Live Gallery of DiceBear Avatars for chosen seed */}
                    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2.5">
                      {DICEBEAR_STYLES.map((st) => {
                        const avatarUrl = getDiceBearAvatarUrl(st.id, dicebearSeed || userName || "groove");
                        const isSelected = userAvatar === avatarUrl;
                        return (
                          <button
                            key={st.id}
                            type="button"
                            onClick={() => handleSelectDiceBear(st.id, dicebearSeed || userName || "groove")}
                            className={`p-2 rounded-2xl border text-center flex flex-col items-center gap-1.5 transition cursor-pointer active:scale-95 group ${
                              isSelected || dicebearStyle === st.id
                                ? "bg-amber-400/20 border-amber-400 ring-2 ring-amber-400/30"
                                : "bg-[var(--theme-card)] border-[var(--theme-border)] hover:border-amber-400/50"
                            }`}
                            title={`${st.label}: ${st.desc}`}
                          >
                            <img
                              src={avatarUrl}
                              alt={st.label}
                              className="w-12 h-12 rounded-xl object-cover bg-black/30 group-hover:scale-105 transition-transform"
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
                          className={`p-3 rounded-2xl border text-center flex flex-col items-center gap-1.5 transition cursor-pointer active:scale-95 ${
                            isSelected
                              ? "bg-amber-400/20 border-amber-400 text-amber-300"
                              : "bg-[var(--theme-card)] border-[var(--theme-border)] text-[var(--theme-muted)] hover:text-[var(--theme-fg)]"
                          }`}
                        >
                          <IconComp className="w-6 h-6" />
                          <span className="text-[10px] font-bold truncate">{av.label.split(" ")[0]}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. CRITIC METRIC DASHBOARD (4 Sleek Status Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Link
          href="/journal"
          className="p-5 rounded-3xl bg-[var(--theme-card)]/80 border border-[var(--theme-border)] hover:border-amber-400/40 transition-all shadow-lg hover:-translate-y-0.5 group block"
        >
          <div className="flex items-center justify-between text-xs font-semibold text-[var(--theme-muted)] mb-2">
            <span className="inline-flex items-center gap-1.5">
              <BookOpen size={14} className="text-amber-300" />
              <span>Journal Entries</span>
            </span>
            <ArrowRight size={13} className="opacity-0 group-hover:opacity-100 transition-opacity text-amber-300" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[var(--theme-fg)]">
            {stats.totalListens}
          </div>
          <span className="text-[11px] text-[var(--theme-muted)] font-medium">Listens recorded</span>
        </Link>

        <Link
          href="/journal"
          className="p-5 rounded-3xl bg-[var(--theme-card)]/80 border border-[var(--theme-border)] hover:border-amber-400/40 transition-all shadow-lg hover:-translate-y-0.5 group block"
        >
          <div className="flex items-center justify-between text-xs font-semibold text-[var(--theme-muted)] mb-2">
            <span className="inline-flex items-center gap-1.5">
              <PenTool size={14} className="text-amber-300" />
              <span>Written Reviews</span>
            </span>
            <ArrowRight size={13} className="opacity-0 group-hover:opacity-100 transition-opacity text-amber-300" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-300">
            {stats.reviews}
          </div>
          <span className="text-[11px] text-[var(--theme-muted)] font-medium">Reviews published</span>
        </Link>

        <div className="p-5 rounded-3xl bg-[var(--theme-card)]/80 border border-[var(--theme-border)] shadow-lg">
          <div className="flex items-center justify-between text-xs font-semibold text-[var(--theme-muted)] mb-2">
            <span className="inline-flex items-center gap-1.5">
              <Star size={14} className="text-amber-300" />
              <span>Average Rating</span>
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-300">
            {stats.avgScore ? `${stats.avgScore}★` : "—"}
          </div>
          <span className="text-[11px] text-[var(--theme-muted)] font-medium">Critical score</span>
        </div>

        <Link
          href="/library"
          className="p-5 rounded-3xl bg-[var(--theme-card)]/80 border border-[var(--theme-border)] hover:border-amber-400/40 transition-all shadow-lg hover:-translate-y-0.5 group block"
        >
          <div className="flex items-center justify-between text-xs font-semibold text-[var(--theme-muted)] mb-2">
            <span className="inline-flex items-center gap-1.5">
              <ListMusic size={14} className="text-amber-300" />
              <span>Saved in Library</span>
            </span>
            <ArrowRight size={13} className="opacity-0 group-hover:opacity-100 transition-opacity text-amber-300" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[var(--theme-fg)]">
            {stats.totalLibrary}
          </div>
          <span className="text-[11px] text-[var(--theme-muted)] font-medium">Albums, tracks, artists</span>
        </Link>
      </div>

      {/* 3. CRITIC PREFERENCES & AESTHETIC GENRES */}
      <div className="p-7 sm:p-8 rounded-3xl bg-[var(--theme-card)]/80 backdrop-blur-xl border border-[var(--theme-border)] shadow-xl space-y-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight font-display text-[var(--theme-fg)]">
            Critic Identity & Preferences
          </h2>
          <p className="text-xs sm:text-sm text-[var(--theme-muted)] mt-1">
            Customize your scoring philosophy, listening visibility, and aesthetic music taste tags.
          </p>
        </div>

        {/* Favorite Genres Pill Selector */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--theme-muted)]">
              Music Taste & Favorite Genres ({favoriteGenres.length} selected)
            </label>
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
                      ? "bg-amber-400 text-zinc-950 shadow-sm"
                      : "bg-[var(--theme-surface)] text-[var(--theme-muted)] hover:text-[var(--theme-fg)] border border-[var(--theme-border)]"
                  }`}
                >
                  #{g}
                </button>
              );
            })}
          </div>
        </div>

        {/* Rating System & Privacy Preferences Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[var(--theme-border)]/70">
          {/* Scoring System Choice */}
          <div className="p-4 rounded-2xl bg-[var(--theme-surface)]/80 border border-[var(--theme-border)] space-y-2">
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
                    : "bg-[var(--theme-card)] text-[var(--theme-muted)] hover:text-[var(--theme-fg)] border border-[var(--theme-border)]"
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
                    : "bg-[var(--theme-card)] text-[var(--theme-muted)] hover:text-[var(--theme-fg)] border border-[var(--theme-border)]"
                }`}
              >
                0–100 Score
              </button>
            </div>
          </div>

          {/* Default Privacy Choice */}
          <div className="p-4 rounded-2xl bg-[var(--theme-surface)]/80 border border-[var(--theme-border)] space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--theme-muted)]">
              Default Journal Visibility
            </span>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleToggleDefaultPublic}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
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

      {/* 4. RECENT CRITIC ACTIVITY (Last 3 Journal Entries using New Card Hierarchy) */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen size={20} className="text-amber-300" />
            <h2 className="text-2xl font-black tracking-tight font-display text-[var(--theme-fg)]">
              Recent Journal Activity
            </h2>
          </div>
          <Link
            href="/journal"
            className="text-xs font-bold text-amber-300 hover:underline flex items-center gap-1"
          >
            <span>View Complete Archive</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        {journalLogs.length === 0 ? (
          <div className="p-8 rounded-3xl bg-[var(--theme-card)]/60 border border-[var(--theme-border)] text-center space-y-3">
            <BookOpen size={28} className="mx-auto text-[var(--theme-muted)]" />
            <h3 className="text-base font-bold text-[var(--theme-fg)]">No Journal Entries Yet</h3>
            <p className="text-xs text-[var(--theme-muted)] max-w-sm mx-auto">
              Whenever you listen to music, tap Rate on any album or track to log reflections and scores.
            </p>
            <Link
              href="/search"
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-amber-400 text-zinc-950 font-black text-xs hover:scale-105 active:scale-95 transition shadow-sm mt-2"
            >
              <Sparkles size={13} />
              <span>Explore & Log Music</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {journalLogs.slice(0, 3).map((entry) => (
              <JournalCard
                key={entry.id}
                entry={entry}
                isOwner={true}
                onEdit={(e) => {
                  setModalItem({
                    id: e.targetId,
                    type: e.targetType || "album",
                    title: e.title,
                    subtitle: e.subtitle,
                    image: e.image,
                    initialRating: e.rating,
                    initialReview: e.review,
                    journalEntryId: e.id,
                  });
                  setIsModalOpen(true);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* 5. DIRECT SHORTCUT TO LIBRARY (Clean separation from Account) */}
      <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-r from-amber-400/10 via-[var(--theme-card)] to-[var(--theme-card)] border border-amber-400/25 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-amber-300">
            <ListMusic size={12} />
            <span>Saved Music Collection</span>
          </div>
          <h3 className="text-lg sm:text-xl font-black text-[var(--theme-fg)]">
            Explore Your Library
          </h3>
          <p className="text-xs sm:text-sm text-[var(--theme-muted)]">
            Your {savedCounts.songs} saved tracks, {savedCounts.albums} albums, {savedCounts.artists} artists, and custom playlists are organized in your Library.
          </p>
        </div>

        <Link
          href="/library"
          className="px-5 py-2.5 rounded-full bg-amber-400 text-zinc-950 font-black text-xs hover:scale-105 active:scale-95 transition-all shadow-md flex items-center justify-center gap-1.5 shrink-0"
        >
          <span>Open Library</span>
          <ArrowRight size={13} />
        </Link>
      </div>

      {/* 6. DATA BACKUP & SESSION MANAGEMENT */}
      <div className="pt-4 border-t border-[var(--theme-border)]/70 flex flex-col sm:flex-row items-center justify-between gap-4">
        <button
          onClick={handleExportData}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[var(--theme-surface)] hover:bg-[var(--theme-card)] border border-[var(--theme-border)] text-xs font-bold text-[var(--theme-fg)] transition shadow-sm cursor-pointer"
          title="Download complete JSON backup"
        >
          <Download size={14} className="text-amber-300" />
          <span>Export Critic Data (JSON)</span>
        </button>

        <p className="text-[11px] font-medium text-[var(--theme-muted)]">
          GrooveEstrella Music Journal · Phase 1 Foundation
        </p>
      </div>

      {/* Edit Profile Modal */}
      {isEditingProfile && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md px-4">
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
                  Display Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="e.g. Sonic Voyager"
                  className="w-full px-4 py-2.5 rounded-2xl bg-[var(--theme-surface)] border border-[var(--theme-border)] text-sm font-bold text-[var(--theme-fg)] focus:outline-none focus:border-amber-400/60"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--theme-muted)] uppercase tracking-wider mb-1.5">
                  Bio / Critical Philosophy
                </label>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  rows={4}
                  placeholder="Share your music taste, favorite decades, or critical perspective..."
                  className="w-full px-4 py-2.5 rounded-2xl bg-[var(--theme-surface)] border border-[var(--theme-border)] text-sm text-[var(--theme-fg)] focus:outline-none focus:border-amber-400/60 resize-none leading-relaxed"
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

      {/* Edit Journal Entry Modal */}
      {isModalOpen && modalItem && (
        <RatingAndJournalModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setModalItem(null);
            loadData();
          }}
          id={modalItem.id}
          type={modalItem.type || "album"}
          title={modalItem.title}
          subtitle={modalItem.subtitle}
          image={modalItem.image}
          initialRating={modalItem.initialRating || 0}
          initialReview={modalItem.initialReview || ""}
          journalEntryId={modalItem.journalEntryId || null}
          onSaved={() => {
            loadData();
          }}
        />
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
        <div className="min-h-screen py-24 text-center text-sm font-medium text-[var(--theme-muted)]">
          Loading critic account...
        </div>
      }
    >
      <AccountDashboardContent />
    </Suspense>
  );
}
