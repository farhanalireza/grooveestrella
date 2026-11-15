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
  Settings,
  LogOut,
  LogIn,
  Music,
  Heart,
  ListMusic,
  Users,
  UserCheck,
  Plus,
  Trash2,
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
import { useTheme } from "@/contexts/ThemeContext";
import MusicDiaryEntries from "@/Components/MusicDiaryEntries";
import FollowersListModal from "@/Components/FollowersListModal";
import DiscLoader from "@/Components/DiscLoader";
import UserProfileBadge, {
  getProfileBadgeTheme,
  NOISE_GRAIN_BG,
} from "@/Components/UserProfileBadge";

const ACCOUNT_TABS = [
  { id: "journal", label: "Music Journal", icon: BookOpen },
  { id: "saved", label: "Saved Collection", icon: Music },
  { id: "about", label: "Overview", icon: User },
];

function AccountDashboardContent() {
  const router = useRouter();
  const { user, profile: authProfile, signOut, updateProfile, isConfigured, loading: authLoading } = useSupabaseAuth();
  const { theme, isDark } = useTheme();

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user && isConfigured) {
      router.push("/login?returnTo=%2Faccount");
    }
  }, [user, authLoading, isConfigured, router]);

  // Active section tab: 'journal' | 'saved' | 'about' | 'curator'
  const [activeAccountTab, setActiveAccountTab] = useState("journal");

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

  // Avatar Studio
  const [avatarTab, setAvatarTab] = useState("dicebear"); // 'dicebear' | 'icons'
  const [dicebearStyle, setDicebearStyle] = useState("identicon");
  const [dicebearSeed, setDicebearSeed] = useState("");

  // Collection & Diary Logs
  const [journalLogs, setJournalLogs] = useState([]);
  const [savedCounts, setSavedCounts] = useState({ songs: 0, albums: 0, artists: 0, playlists: 0 });
  const [savedAlbums, setSavedAlbums] = useState([]);
  const [savedTracks, setSavedTracks] = useState([]);
  const [savedArtists, setSavedArtists] = useState([]);
  const [savedCollectionFilter, setSavedCollectionFilter] = useState("albums"); // 'albums' | 'tracks' | 'artists'

  // Social & Follows
  const [copiedLink, setCopiedLink] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowsModalOpen, setIsFollowsModalOpen] = useState(false);
  const [followsModalTab, setFollowsModalTab] = useState("followers");

  // Preferences overview
  const [favoriteGenres, setFavoriteGenres] = useState([]);

  // Load User Identity
  useEffect(() => {
    if (authProfile) {
      setUserName(authProfile.full_name || authProfile.username || getOrSetUserName());
      setUserAvatar(authProfile.avatar_url || "avatar-1");
      setBio(authProfile.bio || "");
      if (authProfile.is_admin) {
        setUserBadge("admin");
      } else if (authProfile.badge) {
        setUserBadge(authProfile.badge);
      }
    } else {
      const storedName = getOrSetUserName();
      setUserName(storedName);
      const storedAvatar = localStorage.getItem("groove_user_avatar") || "avatar-1";
      setUserAvatar(storedAvatar);
      const storedBio = localStorage.getItem("groove_user_bio") || "";
      setBio(storedBio);
      const storedBadge = localStorage.getItem("groove_user_badge") || "critic";
      setUserBadge(storedBadge);
    }
  }, [authProfile]);

  // Load Saved Counts, Items & Journal Logs
  useEffect(() => {
    try {
      const songs = JSON.parse(localStorage.getItem("savedSongs") || "[]");
      const albums = JSON.parse(localStorage.getItem("savedAlbums") || "[]");
      const artists = JSON.parse(localStorage.getItem("savedArtists") || "[]");
      const playlists = JSON.parse(localStorage.getItem("customPlaylists") || "[]");
      setSavedCounts({
        songs: songs.length,
        albums: albums.length,
        artists: artists.length,
        playlists: playlists.length,
      });
      setSavedAlbums(albums);
      setSavedTracks(songs);
      setSavedArtists(artists);

      const genres = JSON.parse(localStorage.getItem("groove_favorite_genres") || "[]");
      setFavoriteGenres(genres);
    } catch (_) {}
  }, []);

  // Fetch Journal Logs
  const loadJournalLogs = async () => {
    let localLogs = [];
    try {
      const raw = localStorage.getItem("groove_journal_logs");
      if (raw) localLogs = JSON.parse(raw);
    } catch (_) {
      localLogs = [];
    }

    if (user && isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        const { data: cloudJournals, error } = await supabase
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
          .order("listened_date", { ascending: false });

        if (!error && Array.isArray(cloudJournals) && cloudJournals.length > 0) {
          const formatted = cloudJournals.map((j) => ({
            id: j.id,
            targetId: j.music_entities?.mbid || j.music_entities?.id,
            targetType: j.music_entities?.type || "album",
            title: j.music_entities?.title || "Untitled",
            subtitle: j.music_entities?.artist_credit || "",
            image: j.music_entities?.cover_art_url || "",
            rating: j.user_ratings?.score || 0,
            review: j.entry_text || "",
            mood: j.mood || "",
            date: j.listened_date || j.created_at,
            isPublic: j.is_public ?? true,
          }));

          const combined = [...formatted];
          localLogs.forEach((loc) => {
            if (!combined.some((c) => c.id === loc.id || (c.targetId === loc.targetId && c.date === loc.date))) {
              combined.push(loc);
            }
          });
          setJournalLogs(combined);
          return;
        }
      } catch (_) {}
    }

    setJournalLogs(localLogs);
  };

  useEffect(() => {
    loadJournalLogs();
  }, [user]);

  // Fetch Social Follows
  useEffect(() => {
    if (!user || !isSupabaseConfigured()) return;
    const fetchCounts = async () => {
      try {
        const supabase = createClient();
        const [{ count: fers }, { count: fing }] = await Promise.all([
          supabase.from("user_follows").select("*", { count: "exact", head: true }).eq("following_id", user.id),
          supabase.from("user_follows").select("*", { count: "exact", head: true }).eq("follower_id", user.id),
        ]);
        setFollowersCount(fers || 0);
        setFollowingCount(fing || 0);
      } catch (_) {}
    };
    fetchCounts();
  }, [user]);

  const handleOpenFollows = (tab = "followers") => {
    setFollowsModalTab(tab);
    setIsFollowsModalOpen(true);
  };

  const handleShareProfile = async () => {
    const profileSlug = authProfile?.username || userName.toLowerCase().replace(/[^a-z0-9]/g, "-");
    const shareUrl = `${window.location.origin}/profile/${encodeURIComponent(profileSlug)}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${userName}'s Music Profile | GrooveEstrella`,
          text: `Check out ${userName}'s music journal and reviews on GrooveEstrella!`,
          url: shareUrl,
        });
        return;
      } catch (_) {}
    }
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    toast.success("Profile link copied to clipboard!");
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Avatar Selection Handlers
  const handleSelectIconAvatar = (id) => {
    setUserAvatar(id);
    localStorage.setItem("groove_user_avatar", id);
    if (authProfile && updateProfile) {
      updateProfile({ avatar_url: id });
    }
    setIsEditingAvatar(false);
    toast.success("Avatar icon updated!");
  };

  const handleApplyDiceBear = () => {
    const seed = dicebearSeed.trim() || userName || "groove";
    const generatedUrl = getDiceBearAvatarUrl(dicebearStyle, seed);
    setUserAvatar(generatedUrl);
    localStorage.setItem("groove_user_avatar", generatedUrl);
    if (authProfile && updateProfile) {
      updateProfile({ avatar_url: generatedUrl });
    }
    setIsEditingAvatar(false);
    toast.success("Custom avatar applied!");
  };

  const handleSaveProfile = async () => {
    const trimmed = editName.trim();
    if (!trimmed) {
      toast.error("Name cannot be empty");
      return;
    }
    setUserName(trimmed);
    localStorage.setItem("groove_user_name", trimmed);
    setBio(editBio.trim());
    localStorage.setItem("groove_user_bio", editBio.trim());

    const nextBadge = authProfile?.is_admin ? "admin" : editBadge;
    setUserBadge(nextBadge);
    localStorage.setItem("groove_user_badge", nextBadge);

    if (authProfile && updateProfile) {
      await updateProfile({
        full_name: trimmed,
        bio: editBio.trim(),
        badge: nextBadge,
      });
    }
    setIsEditingProfile(false);
    toast.success("Profile updated!");
  };

  const profileSlug = authProfile?.username || userName.toLowerCase().replace(/[^a-z0-9]/g, "-");
  const badgeTheme = getProfileBadgeTheme(userBadge, authProfile?.is_admin);

  return (
    <div className="min-h-screen text-[var(--theme-fg)] py-6 sm:py-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-6 font-sans pb-36">
      {/* 1. EDITORIAL PROFILE HERO - Open layout, NO centered card */}
      <div className="relative pt-2 pb-6 border-b border-[var(--theme-border)]/50">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-6">
          {/* Left: Avatar + Identity */}
          <div className="flex items-start gap-4 sm:gap-6 min-w-0">
            {/* Avatar */}
            <div className="relative group shrink-0">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl overflow-hidden bg-black/40 border-2 border-[var(--theme-border)] shadow-xl flex items-center justify-center">
                <UserAvatarIcon
                  avatarId={userAvatar}
                  userName={userName}
                  className="w-full h-full object-cover"
                  iconClassName="w-10 h-10 text-white"
                />
              </div>
              <button
                onClick={() => setIsEditingAvatar(!isEditingAvatar)}
                className="absolute -bottom-1.5 -right-1.5 p-1.5 rounded-xl bg-[var(--theme-surface)] hover:bg-[var(--theme-card)] border border-[var(--theme-border)] text-[var(--theme-muted)] hover:text-[var(--theme-accent)] transition shadow-md cursor-pointer"
                title="Change Avatar"
              >
                <Edit3 size={13} />
              </button>
            </div>

            {/* Name, Badge, Public Handle & Bio */}
            <div className="min-w-0 space-y-1.5">
              {/* Display Name with Badge Placed Directly Beside It */}
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight font-display text-[var(--theme-fg)] truncate">
                  {userName}
                </h1>
                <div title={`Badge: ${badgeTheme.tell}`} className="shrink-0 cursor-help">
                  <UserProfileBadge badge={userBadge} size="sm" showTell={false} />
                </div>
              </div>

              {/* Public Profile Link Handle */}
              <div className="flex items-center gap-2 text-xs">
                <Link
                  href={`/profile/${profileSlug}`}
                  className="font-bold text-[var(--theme-accent)] hover:underline"
                >
                  @{profileSlug}
                </Link>
                <span className="text-[var(--theme-muted)]">·</span>
                <span className="text-[var(--theme-muted)]">Member since 2026</span>
              </div>

              {/* Bio */}
              <p className="text-xs sm:text-sm text-[var(--theme-muted)] max-w-xl leading-relaxed pt-0.5">
                {bio || "Active music explorer, critic, and journal keeper on GrooveEstrella."}
              </p>

              {/* Followers / Following / Stats Row */}
              <div className="flex items-center gap-4 pt-1.5 flex-wrap text-xs text-[var(--theme-muted)]">
                <button
                  type="button"
                  onClick={() => handleOpenFollows("followers")}
                  className="hover:text-[var(--theme-fg)] transition cursor-pointer font-medium"
                >
                  <strong className="text-[var(--theme-fg)] font-black text-sm">{followersCount}</strong> Followers
                </button>
                <span>·</span>
                <button
                  type="button"
                  onClick={() => handleOpenFollows("following")}
                  className="hover:text-[var(--theme-fg)] transition cursor-pointer font-medium"
                >
                  <strong className="text-[var(--theme-fg)] font-black text-sm">{followingCount}</strong> Following
                </button>
                <span>·</span>
                <span>
                  <strong className="text-[var(--theme-fg)] font-black text-sm">{journalLogs.length}</strong> Logs
                </span>
                <span>·</span>
                <span>
                  <strong className="text-[var(--theme-fg)] font-black text-sm">
                    {savedCounts.songs + savedCounts.albums + savedCounts.artists}
                  </strong> Saved
                </span>
              </div>
            </div>
          </div>

          {/* Right Action Controls: Edit Profile, Share, Settings Icon, Sign Out */}
          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap">
            <button
              onClick={() => {
                setEditName(userName);
                setEditBio(bio);
                setEditBadge(userBadge);
                setIsEditingProfile(true);
              }}
              className="px-3.5 py-2 rounded-2xl bg-[var(--theme-surface)] hover:bg-[var(--theme-card)] border border-[var(--theme-border)] text-xs font-bold text-[var(--theme-fg)] transition flex items-center gap-1.5 shadow-sm cursor-pointer active:scale-95"
              title="Edit Profile"
            >
              <Edit3 size={14} className="text-[var(--theme-muted)]" />
              <span>Edit</span>
            </button>

            <button
              onClick={handleShareProfile}
              className="p-2.5 rounded-2xl bg-[var(--theme-surface)] hover:bg-[var(--theme-card)] border border-[var(--theme-border)] text-[var(--theme-muted)] hover:text-[var(--theme-fg)] transition cursor-pointer active:scale-95 shadow-sm"
              title="Share Profile Link"
            >
              {copiedLink ? <Check size={16} className="text-emerald-400" /> : <Share2 size={16} />}
            </button>

            {/* Dedicated Settings Button */}
            <Link
              href="/settings"
              className="p-2.5 rounded-2xl bg-[var(--theme-surface)] hover:bg-[var(--theme-card)] border border-[var(--theme-border)] hover:border-[var(--theme-accent)] text-[var(--theme-muted)] hover:text-[var(--theme-accent)] transition cursor-pointer active:scale-95 shadow-sm flex items-center justify-center"
              title="Settings & Preferences"
            >
              <Settings size={16} />
            </Link>

            {user ? (
              <button
                onClick={signOut}
                className="p-2.5 rounded-2xl bg-[var(--theme-surface)] hover:bg-rose-500/15 border border-[var(--theme-border)] text-[var(--theme-muted)] hover:text-rose-400 transition cursor-pointer active:scale-95 shadow-sm"
                title="Sign Out"
              >
                <LogOut size={16} />
              </button>
            ) : (
              <Link
                href="/login"
                className="px-3.5 py-2 rounded-2xl bg-[var(--theme-accent)] text-[var(--theme-accent-fg)] font-black text-xs hover:opacity-90 transition flex items-center gap-1 shadow-sm"
              >
                <LogIn size={14} />
                <span>Sign In</span>
              </Link>
            )}
          </div>
        </div>

        {/* Inline Avatar Picker Drawer */}
        {isEditingAvatar && (
          <div className="mt-5 p-4 sm:p-5 rounded-2xl bg-[var(--theme-card)] border border-[var(--theme-border)] text-left space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[var(--theme-border)]/50 pb-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--theme-fg)]">
                Customize Profile Avatar
              </span>
              <button
                onClick={() => setIsEditingAvatar(false)}
                className="text-[var(--theme-muted)] hover:text-[var(--theme-fg)] cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            <div className="flex items-center gap-2 border-b border-[var(--theme-border)]/30 pb-2">
              <button
                onClick={() => setAvatarTab("dicebear")}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                  avatarTab === "dicebear"
                    ? "bg-[var(--theme-accent)] text-[var(--theme-accent-fg)] shadow-sm"
                    : "text-[var(--theme-muted)] hover:text-[var(--theme-fg)]"
                }`}
              >
                DiceBear Generator
              </button>
              <button
                onClick={() => setAvatarTab("icons")}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                  avatarTab === "icons"
                    ? "bg-[var(--theme-accent)] text-[var(--theme-accent-fg)] shadow-sm"
                    : "text-[var(--theme-muted)] hover:text-[var(--theme-fg)]"
                }`}
              >
                Curated Icons
              </button>
            </div>

            {avatarTab === "dicebear" ? (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {DICEBEAR_STYLES.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => setDicebearStyle(style.id)}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer ${
                        dicebearStyle === style.id
                          ? "bg-[var(--theme-accent)] text-[var(--theme-accent-fg)]"
                          : "bg-[var(--theme-surface)] text-[var(--theme-muted)] border border-[var(--theme-border)]"
                      }`}
                    >
                      {style.label}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={dicebearSeed}
                    onChange={(e) => setDicebearSeed(e.target.value)}
                    placeholder="Enter seed (e.g. your nickname or mood)..."
                    className="flex-1 px-3 py-2 text-xs rounded-xl bg-[var(--theme-surface)] border border-[var(--theme-border)] text-[var(--theme-fg)] focus:outline-none focus:border-[var(--theme-accent)]"
                  />
                  <button
                    onClick={handleApplyDiceBear}
                    className="px-4 py-2 rounded-xl bg-[var(--theme-accent)] text-[var(--theme-accent-fg)] text-xs font-bold cursor-pointer"
                  >
                    Apply
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                {AVAILABLE_AVATARS.map((av) => (
                  <button
                    key={av.id}
                    onClick={() => handleSelectIconAvatar(av.id)}
                    className="aspect-square rounded-2xl bg-[var(--theme-surface)] border border-[var(--theme-border)] hover:border-[var(--theme-accent)] p-2 flex flex-col items-center justify-center transition cursor-pointer"
                  >
                    <UserAvatarIcon avatarId={av.id} className="w-8 h-8 rounded-full" />
                    <span className="text-[10px] text-[var(--theme-muted)] mt-1 truncate">{av.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Inline Edit Profile Modal */}
        {isEditingProfile && (
          <div className="mt-5 p-5 rounded-2xl bg-[var(--theme-card)] border border-[var(--theme-border)] text-left space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[var(--theme-border)]/50 pb-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--theme-fg)]">
                Edit Profile Information
              </span>
              <button
                onClick={() => setIsEditingProfile(false)}
                className="text-[var(--theme-muted)] hover:text-[var(--theme-fg)] cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-[var(--theme-muted)] uppercase tracking-wider block mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[var(--theme-surface)] border border-[var(--theme-border)] text-[var(--theme-fg)] focus:outline-none focus:border-[var(--theme-accent)]"
                />
              </div>

              {!authProfile?.is_admin && (
                <div>
                  <label className="text-xs font-bold text-[var(--theme-muted)] uppercase tracking-wider block mb-1">
                    Profile Badge
                  </label>
                  <select
                    value={editBadge}
                    onChange={(e) => setEditBadge(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-[var(--theme-surface)] border border-[var(--theme-border)] text-[var(--theme-fg)] focus:outline-none focus:border-[var(--theme-accent)]"
                  >
                    <option value="critic">Critic (Golden Disc & Grain)</option>
                    <option value="verified">Verified (Groove Disc)</option>
                  </select>
                </div>
              )}

              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-[var(--theme-muted)] uppercase tracking-wider block mb-1">
                  Bio / Reflections
                </label>
                <textarea
                  rows={3}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Tell listeners what you listen to, favorite movements, and critical perspective..."
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[var(--theme-surface)] border border-[var(--theme-border)] text-[var(--theme-fg)] focus:outline-none focus:border-[var(--theme-accent)] resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[var(--theme-border)]/40">
              <button
                onClick={() => setIsEditingProfile(false)}
                className="px-3.5 py-1.5 rounded-xl border border-[var(--theme-border)] text-xs font-semibold text-[var(--theme-muted)] hover:text-[var(--theme-fg)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                className="px-4 py-1.5 rounded-xl bg-[var(--theme-accent)] text-[var(--theme-accent-fg)] text-xs font-bold cursor-pointer"
              >
                Save Profile
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2. TAB NAVIGATION (Exact Styling as Album / Artist Pages) */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none border-b border-[var(--theme-border)]/50 pb-px">
        {ACCOUNT_TABS.map((tab) => {
          const isActive = activeAccountTab === tab.id;
          const count =
            tab.id === "journal"
              ? journalLogs.length
              : tab.id === "saved"
              ? savedCounts.songs + savedCounts.albums + savedCounts.artists
              : undefined;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveAccountTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-colors cursor-pointer select-none whitespace-nowrap ${
                isActive
                  ? "border-[var(--theme-accent)] text-[var(--theme-fg)]"
                  : "border-transparent text-[var(--theme-muted)] hover:text-[var(--theme-fg)]"
              }`}
            >
              <tab.icon size={16} />
              <span>{tab.label}</span>
              {count !== undefined && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--theme-surface)] text-[var(--theme-muted)] font-mono">
                  {count}
                </span>
              )}
            </button>
          );
        })}

        {authProfile?.is_admin && (
          <button
            onClick={() => setActiveAccountTab("curator")}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-colors cursor-pointer select-none whitespace-nowrap ${
              activeAccountTab === "curator"
                ? "border-red-500 text-red-400"
                : "border-transparent text-[var(--theme-muted)] hover:text-[var(--theme-fg)]"
            }`}
          >
            <Sparkles size={16} />
            <span>Curator Center</span>
          </button>
        )}
      </div>

      {/* 3. TAB 1: MUSIC JOURNAL (Letterboxd-style Diary layout using MusicDiaryEntries) */}
      {activeAccountTab === "journal" && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[var(--theme-fg)]">
                Listening Diary & Logbook
              </h2>
              <p className="text-xs text-[var(--theme-muted)]">
                Chronological timeline of logged albums, ratings, and critical notes
              </p>
            </div>

            <Link
              href="/journal"
              className="px-3.5 py-1.5 rounded-full bg-[var(--theme-surface)] hover:bg-[var(--theme-card)] border border-[var(--theme-border)] hover:border-[var(--theme-accent)] text-xs font-bold text-[var(--theme-fg)] transition flex items-center gap-1.5 shadow-sm"
            >
              <span>Full Journal Page</span>
              <ArrowRight size={13} className="text-[var(--theme-accent)]" />
            </Link>
          </div>

          {/* Letterboxd-Style Diary Entries Timeline - Directly on Background */}
          {journalLogs.length === 0 ? (
            <div className="py-20 text-center text-[var(--theme-muted)] space-y-3">
              <Disc size={36} className="mx-auto opacity-40 animate-spin" />
              <p className="text-sm font-medium">No listening entries logged yet</p>
              <Link
                href="/journal"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[var(--theme-accent)] text-[var(--theme-accent-fg)] text-xs font-bold shadow-md hover:opacity-90 transition"
              >
                <Plus size={14} />
                <span>Log Your First Album</span>
              </Link>
            </div>
          ) : (
            <MusicDiaryEntries
              entries={journalLogs}
              isOwner={true}
              onOpenNew={() => router.push("/journal")}
            />
          )}
        </div>
      )}

      {/* 4. TAB 2: SAVED COLLECTION */}
      {activeAccountTab === "saved" && (
        <div className="space-y-4 pt-2">
          {/* Sub-Filters: Albums / Tracks / Artists */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              {[
                { id: "albums", label: "Albums", count: savedAlbums.length },
                { id: "tracks", label: "Songs", count: savedTracks.length },
                { id: "artists", label: "Artists", count: savedArtists.length },
              ].map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => setSavedCollectionFilter(sub.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    savedCollectionFilter === sub.id
                      ? "bg-[var(--theme-accent)] text-[var(--theme-accent-fg)] shadow-sm"
                      : "bg-[var(--theme-surface)] text-[var(--theme-muted)] hover:text-[var(--theme-fg)] border border-[var(--theme-border)]"
                  }`}
                >
                  <span>{sub.label}</span>
                  <span className="opacity-75 font-mono">{sub.count}</span>
                </button>
              ))}
            </div>

            <Link
              href="/library"
              className="text-xs font-bold text-[var(--theme-accent)] hover:underline flex items-center gap-1"
            >
              <span>View Full Library</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          {/* Grid Render of Saved Items */}
          {savedCollectionFilter === "albums" && (
            savedAlbums.length === 0 ? (
              <div className="py-16 text-center text-[var(--theme-muted)] text-xs">
                No saved albums yet. Save albums from detail pages!
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                {savedAlbums.map((album) => (
                  <Link
                    key={album.id}
                    href={`/album/${album.id}`}
                    className="group space-y-2 block"
                  >
                    <div className="aspect-square rounded-2xl overflow-hidden bg-black/40 border border-[var(--theme-border)] group-hover:border-[var(--theme-accent)] transition shadow-sm">
                      <img
                        src={album.cover || album.image || "https://placehold.co/400x400/17020B/E8A87C?text=Album"}
                        alt={album.title || album.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => { e.currentTarget.src = "https://placehold.co/400x400/17020B/E8A87C?text=Album"; }}
                      />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-[var(--theme-fg)] truncate group-hover:text-[var(--theme-accent)] transition-colors">
                        {album.title || album.name}
                      </h4>
                      <p className="text-[11px] text-[var(--theme-muted)] truncate">
                        {album.artist || album.subtitle || "Album"}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )
          )}

          {savedCollectionFilter === "tracks" && (
            savedTracks.length === 0 ? (
              <div className="py-16 text-center text-[var(--theme-muted)] text-xs">
                No saved songs yet. Save tracks from player or tracklists!
              </div>
            ) : (
              <div className="divide-y divide-[var(--theme-border)]/40">
                {savedTracks.map((track) => (
                  <div key={track.id} className="py-2.5 flex items-center justify-between gap-3 group">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl overflow-hidden bg-black/40 shrink-0 border border-white/10">
                        <img
                          src={track.cover || track.image || "https://placehold.co/100x100/17020B/E8A87C?text=Track"}
                          alt={track.title || track.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <Link
                          href={`/track/${track.id}`}
                          className="text-xs font-bold text-[var(--theme-fg)] truncate hover:text-[var(--theme-accent)] block"
                        >
                          {track.title || track.name}
                        </Link>
                        <p className="text-[11px] text-[var(--theme-muted)] truncate">
                          {track.artist || track.subtitle}
                        </p>
                      </div>
                    </div>
                    <Link
                      href={`/track/${track.id}`}
                      className="text-xs text-[var(--theme-muted)] hover:text-[var(--theme-fg)] p-2"
                    >
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                ))}
              </div>
            )
          )}

          {savedCollectionFilter === "artists" && (
            savedArtists.length === 0 ? (
              <div className="py-16 text-center text-[var(--theme-muted)] text-xs">
                No saved artists yet.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
                {savedArtists.map((artist) => (
                  <Link
                    key={artist.id}
                    href={`/artist/${artist.id}`}
                    className="group text-center space-y-2 block"
                  >
                    <div className="aspect-square rounded-full overflow-hidden bg-black/40 border border-[var(--theme-border)] group-hover:border-[var(--theme-accent)] transition shadow-sm mx-auto">
                      <img
                        src={artist.cover || artist.image || "https://placehold.co/400x400/17020B/E8A87C?text=Artist"}
                        alt={artist.name || artist.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => { e.currentTarget.src = "https://placehold.co/400x400/17020B/E8A87C?text=Artist"; }}
                      />
                    </div>
                    <h4 className="text-xs font-bold text-[var(--theme-fg)] truncate group-hover:text-[var(--theme-accent)] transition-colors">
                      {artist.name || artist.title}
                    </h4>
                  </Link>
                ))}
              </div>
            )
          )}
        </div>
      )}

      {/* 5. TAB 3: OVERVIEW & TASTE */}
      {activeAccountTab === "about" && (
        <div className="space-y-6 pt-2">
          {/* Favorite Genres */}
          <div className="rounded-2xl bg-[var(--theme-card)] border border-[var(--theme-border)] p-5 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[var(--theme-fg)]">Favorite Musical Genres</h3>
              <Link
                href="/settings"
                className="text-xs font-bold text-[var(--theme-accent)] hover:underline flex items-center gap-1"
              >
                <span>Edit in Settings</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            {favoriteGenres.length === 0 ? (
              <p className="text-xs text-[var(--theme-muted)]">
                No favorite genres selected yet. Visit Settings to choose your favorite musical sounds.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2 pt-1">
                {favoriteGenres.map((genre) => (
                  <span
                    key={genre}
                    className="px-3 py-1 rounded-full bg-[var(--theme-surface)] border border-[var(--theme-border)] text-xs font-bold text-[var(--theme-fg)]"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Quick Settings Shortcut */}
          <div className="rounded-2xl bg-[var(--theme-card)] border border-[var(--theme-border)] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
            <div>
              <h3 className="text-sm font-bold text-[var(--theme-fg)]">Account Preferences & Streaming</h3>
              <p className="text-xs text-[var(--theme-muted)] mt-0.5">
                Configure preferred playback platform, vinyl side breaks, display themes, and data backup.
              </p>
            </div>
            <Link
              href="/settings"
              className="px-4 py-2 rounded-xl bg-[var(--theme-accent)] text-[var(--theme-accent-fg)] text-xs font-bold shadow-md hover:opacity-95 transition flex items-center gap-1.5 shrink-0 self-start sm:self-center"
            >
              <Settings size={14} />
              <span>Open Settings</span>
            </Link>
          </div>
        </div>
      )}

      {/* 6. TAB 4: CURATOR CENTER (Admin Only) */}
      {activeAccountTab === "curator" && authProfile?.is_admin && (
        <div className="space-y-4 pt-2">
          <div className="rounded-2xl bg-red-950/20 border border-red-500/30 p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-red-400" />
              <h3 className="text-sm font-bold text-red-200">Editorial Curator Center</h3>
            </div>
            <p className="text-xs text-red-300/80">
              As a verified administrator, you have permission to curate featured lists, certify critics, and publish editorial highlights.
            </p>
            <div className="pt-2 flex gap-3">
              <Link
                href="/lists/new"
                className="px-4 py-2 rounded-xl bg-red-500 text-white font-bold text-xs shadow-md hover:bg-red-600 transition"
              >
                Create Curated List
              </Link>
              <Link
                href="/lists"
                className="px-4 py-2 rounded-xl bg-white/10 text-white font-bold text-xs hover:bg-white/15 transition"
              >
                Manage All Lists
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Social Follows Modal */}
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
            Loading Account...
          </span>
        </div>
      }
    >
      <AccountDashboardContent />
    </Suspense>
  );
}
