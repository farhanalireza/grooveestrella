// src/app/profile/[username]/ProfileClient.jsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  User,
  Star,
  BookOpen,
  UserPlus,
  UserCheck,
  Edit3,
  Sparkles,
  Share2,
  Users,
  Check,
  Settings,
  LogOut,
  X,
  Disc,
  ArrowRight,
  Plus,
} from "lucide-react";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { toast } from "@/lib/toast";
import MusicDiaryEntries from "@/Components/MusicDiaryEntries";
import FollowersListModal from "@/Components/FollowersListModal";
import UserAvatarIcon, {
  AVAILABLE_AVATARS,
  DICEBEAR_STYLES,
  getDiceBearAvatarUrl,
} from "@/Components/UserAvatarIcon";
import UserProfileBadge, {
  getProfileBadgeTheme,
} from "@/Components/UserProfileBadge";

const PROFILE_TABS = [
  { id: "journal", label: "Music Journal", icon: BookOpen },
  { id: "about", label: "Overview", icon: User },
];

export default function ProfileClient({
  rawUsername,
  initialProfile = null,
  initialJournalLogs = [],
  initialFollowersCount = 0,
  initialFollowingCount = 0,
  initialAvgRating = null,
}) {
  const router = useRouter();
  const { user, profile: authProfile, updateProfile, signOut } = useSupabaseAuth();

  const [activeTab, setActiveTab] = useState("journal");
  const [profileOverride, setProfileOverride] = useState(null);
  const [followState, setFollowState] = useState({ targetId: null, following: false });
  const [followerDelta, setFollowerDelta] = useState(0);
  const [isFollowsModalOpen, setIsFollowsModalOpen] = useState(false);
  const [followsModalTab, setFollowsModalTab] = useState("followers");

  const profile =
    profileOverride ||
    initialProfile ||
    (authProfile && authProfile.username?.toLowerCase() === rawUsername.toLowerCase()
      ? authProfile
      : null);
  const journalLogs = initialJournalLogs;
  const followersCount = Math.max(0, initialFollowersCount + followerDelta);
  const followingCount = initialFollowingCount;

  // Edit Profile modal (for owner)
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState(initialProfile?.display_name || "");
  const [editBio, setEditBio] = useState(initialProfile?.bio || "");
  const [editBadge, setEditBadge] = useState(
    initialProfile?.is_admin ? "admin" : (initialProfile?.badge || "critic")
  );
  const [copiedLink, setCopiedLink] = useState(false);

  // Avatar Studio
  const [isEditingAvatar, setIsEditingAvatar] = useState(false);
  const [avatarTab, setAvatarTab] = useState("dicebear");
  const [dicebearStyle, setDicebearStyle] = useState("identicon");
  const [dicebearSeed, setDicebearSeed] = useState("");

  const profileId = profile?.id;
  const currentUserId = user?.id;

  // Check if current user is following target profile
  useEffect(() => {
    if (!currentUserId || !profileId || currentUserId === profileId || !isSupabaseConfigured()) {
      return;
    }

    let active = true;
    const supabase = createClient();
    supabase
      .from("follows")
      .select("follower_id")
      .eq("follower_id", currentUserId)
      .eq("following_id", profileId)
      .maybeSingle()
      .then(({ data }) => {
        if (active) setFollowState({ targetId: profileId, following: Boolean(data) });
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [currentUserId, profileId]);

  const isFollowing = Boolean(
    currentUserId &&
      profileId &&
      currentUserId !== profileId &&
      followState.targetId === profileId &&
      followState.following
  );

  const isOwner = Boolean(
    user && profile && (user.id === profile.id || user.email?.split("@")[0] === profile.username)
  );

  const handleToggleFollow = async () => {
    if (!user || !isSupabaseConfigured()) {
      toast.info("Sign in to follow listeners!");
      return;
    }
    if (!profile) return;

    const supabase = createClient();
    const nextFollowing = !isFollowing;

    setFollowState({ targetId: profile.id, following: nextFollowing });
    setFollowerDelta((prev) => (nextFollowing ? prev + 1 : prev - 1));

    try {
      if (!nextFollowing) {
        await supabase
          .from("follows")
          .delete()
          .eq("follower_id", user.id)
          .eq("following_id", profile.id);
        toast.info(`Unfollowed @${profile.username}`);
      } else {
        await supabase.from("follows").insert({
          follower_id: user.id,
          following_id: profile.id,
        });
        toast.success(`Following @${profile.username}!`);
      }
      setFollowerDelta(0);
      router.refresh();
    } catch (_) {
      setFollowState({ targetId: profile.id, following: !nextFollowing });
      setFollowerDelta((prev) => (nextFollowing ? prev - 1 : prev + 1));
      toast.error("Could not update follow status.");
    }
  };

  const handleOpenEdit = () => {
    setEditDisplayName(profile?.display_name || "");
    setEditBio(profile?.bio || "");
    setEditBadge(profile?.is_admin ? "admin" : (profile?.badge || "critic"));
    setIsEditOpen(true);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    const finalBadge = profile?.is_admin ? "admin" : editBadge;
    await updateProfile({
      display_name: editDisplayName,
      bio: editBio,
      badge: finalBadge,
      is_verified: finalBadge === "verified",
      is_critic: finalBadge === "critic",
      ...(profile?.is_admin || finalBadge === "admin" ? { is_admin: true } : {}),
    });
    setProfileOverride({
      ...profile,
      display_name: editDisplayName,
      bio: editBio,
      badge: finalBadge,
      is_admin: profile?.is_admin || finalBadge === "admin",
      is_verified: finalBadge === "verified",
      is_critic: finalBadge === "critic",
    });
    setIsEditOpen(false);
    toast.success("Profile updated!");
    router.refresh();
  };

  const handleShareProfile = () => {
    if (navigator.share) {
      navigator.share({
        title: `${profile?.display_name || profile?.username} on GrooveEstrella`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
      toast.success("Profile link copied!");
    }
  };

  const handleOpenFollows = (tab = "followers") => {
    setFollowsModalTab(tab);
    setIsFollowsModalOpen(true);
  };

  const publicEntries = useMemo(() => {
    return (journalLogs || []).filter((entry) => entry.is_public !== false);
  }, [journalLogs]);

  const avgRating = useMemo(() => {
    if (initialAvgRating) return initialAvgRating;
    const rated = publicEntries.filter((l) => l.rating > 0);
    if (rated.length === 0) return null;
    return (rated.reduce((acc, curr) => acc + Number(curr.rating), 0) / rated.length).toFixed(1);
  }, [initialAvgRating, publicEntries]);

  if (!profile) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <h2 className="text-2xl font-black font-display">Profile Not Found</h2>
        <p className="text-sm text-[var(--theme-muted)]">
          @{rawUsername} could not be located.
        </p>
        <Link
          href="/"
          className="px-6 py-2.5 rounded-full bg-[var(--theme-accent)] text-[var(--theme-accent-fg)] font-black text-sm"
        >
          Return Home
        </Link>
      </div>
    );
  }

  const userBadge = profile?.is_admin ? "admin" : (profile?.badge || "critic");
  const badgeTheme = getProfileBadgeTheme(userBadge);

  return (
    <div className="min-h-screen text-[var(--theme-fg)] py-6 sm:py-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-6 font-sans pb-36">
      {/* 1. EDITORIAL PROFILE HERO - Open layout, exactly matching Account page */}
      <div className="relative pt-2 pb-6 border-b border-[var(--theme-border)]/50">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-6">
          {/* Left: Avatar + Identity */}
          <div className="flex items-start gap-4 sm:gap-6 min-w-0">
            {/* Avatar */}
            <div className="relative group shrink-0">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl overflow-hidden bg-black/40 border-2 border-[var(--theme-border)] shadow-xl flex items-center justify-center">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.display_name || profile.username}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = `https://api.dicebear.com/7.x/identicon/svg?seed=${profile.username}`;
                    }}
                  />
                ) : (
                  <UserAvatarIcon
                    avatarId="avatar-1"
                    userName={profile.display_name || profile.username}
                    className="w-full h-full object-cover"
                    iconClassName="w-10 h-10 text-white"
                  />
                )}
              </div>
              {isOwner && (
                <button
                  onClick={() => setIsEditingAvatar(!isEditingAvatar)}
                  className="absolute -bottom-1.5 -right-1.5 p-1.5 rounded-xl bg-[var(--theme-surface)] hover:bg-[var(--theme-card)] border border-[var(--theme-border)] text-[var(--theme-muted)] hover:text-[var(--theme-accent)] transition shadow-md cursor-pointer"
                  title="Change Avatar"
                >
                  <Edit3 size={13} />
                </button>
              )}
            </div>

            {/* Name, Badge Beside Username & Bio */}
            <div className="min-w-0 space-y-1.5">
              {/* Display Name with Badge Placed Directly Beside It */}
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight font-display text-[var(--theme-fg)] truncate">
                  {profile.display_name || profile.username}
                </h1>
                <div title={`Badge: ${badgeTheme.tell}`} className="shrink-0 cursor-help">
                  <UserProfileBadge badge={userBadge} size="sm" showTell={false} />
                </div>
              </div>

              {/* Public Profile Link Handle & Member Since */}
              <div className="flex items-center gap-2 text-xs">
                <span className="font-bold text-[var(--theme-accent)]">
                  @{profile.username}
                </span>
                <span className="text-[var(--theme-muted)]">·</span>
                <span className="text-[var(--theme-muted)]">Member since 2026</span>
              </div>

              {/* Bio */}
              <p className="text-xs sm:text-sm text-[var(--theme-muted)] max-w-xl leading-relaxed pt-0.5">
                {profile.bio || "Active music explorer, critic, and journal keeper on GrooveEstrella."}
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
                  <strong className="text-[var(--theme-fg)] font-black text-sm">{publicEntries.length}</strong> Logs
                </span>
                {avgRating && (
                  <>
                    <span>·</span>
                    <span className="flex items-center gap-1 font-bold text-amber-400">
                      <Star size={12} fill="currentColor" /> {avgRating}★ Avg
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right Action Controls: Follow / Edit, Share, Settings (for Owner) */}
          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap">
            {isOwner ? (
              <>
                <button
                  onClick={handleOpenEdit}
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

                <Link
                  href="/settings"
                  className="p-2.5 rounded-2xl bg-[var(--theme-surface)] hover:bg-[var(--theme-card)] border border-[var(--theme-border)] hover:border-[var(--theme-accent)] text-[var(--theme-muted)] hover:text-[var(--theme-accent)] transition cursor-pointer active:scale-95 shadow-sm flex items-center justify-center"
                  title="Settings & Preferences"
                >
                  <Settings size={16} />
                </Link>

                <button
                  onClick={signOut}
                  className="p-2.5 rounded-2xl bg-[var(--theme-surface)] hover:bg-rose-500/15 border border-[var(--theme-border)] text-[var(--theme-muted)] hover:text-rose-400 transition cursor-pointer active:scale-95 shadow-sm"
                  title="Sign Out"
                >
                  <LogOut size={16} />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleToggleFollow}
                  className={`px-5 py-2 rounded-2xl text-xs font-black transition flex items-center gap-1.5 shadow-md cursor-pointer active:scale-95 ${
                    isFollowing
                      ? "bg-[var(--theme-surface)] text-[var(--theme-fg)] border border-[var(--theme-border)] hover:border-rose-400/50"
                      : "bg-[var(--theme-accent)] text-[var(--theme-accent-fg)] hover:opacity-95"
                  }`}
                >
                  {isFollowing ? <UserCheck size={14} /> : <UserPlus size={14} />}
                  <span>{isFollowing ? "Following" : "Follow"}</span>
                </button>

                <button
                  onClick={handleShareProfile}
                  className="p-2.5 rounded-2xl bg-[var(--theme-surface)] hover:bg-[var(--theme-card)] border border-[var(--theme-border)] text-[var(--theme-muted)] hover:text-[var(--theme-fg)] transition cursor-pointer active:scale-95 shadow-sm"
                  title="Share Profile Link"
                >
                  {copiedLink ? <Check size={16} className="text-emerald-400" /> : <Share2 size={16} />}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Inline Edit Profile Modal (Owner) */}
        {isEditOpen && (
          <form onSubmit={handleSaveProfile} className="mt-5 p-5 rounded-2xl bg-[var(--theme-card)] border border-[var(--theme-border)] text-left space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[var(--theme-border)]/50 pb-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--theme-fg)]">
                Edit Profile Information
              </span>
              <button
                type="button"
                onClick={() => setIsEditOpen(false)}
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
                  value={editDisplayName}
                  onChange={(e) => setEditDisplayName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[var(--theme-surface)] border border-[var(--theme-border)] text-[var(--theme-fg)] focus:outline-none focus:border-[var(--theme-accent)]"
                />
              </div>

              {!profile?.is_admin && (
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
                  Bio / Critical Reflections
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
                type="button"
                onClick={() => setIsEditOpen(false)}
                className="px-3.5 py-1.5 rounded-xl border border-[var(--theme-border)] text-xs font-semibold text-[var(--theme-muted)] hover:text-[var(--theme-fg)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-[var(--theme-accent)] text-[var(--theme-accent-fg)] text-xs font-bold cursor-pointer"
              >
                Save Profile
              </button>
            </div>
          </form>
        )}
      </div>

      {/* 2. TAB NAVIGATION (Exact match to Account page) */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none border-b border-[var(--theme-border)]/50 pb-px">
        {PROFILE_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const count = tab.id === "journal" ? publicEntries.length : undefined;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
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
      </div>

      {/* 3. TAB 1: MUSIC JOURNAL (Letterboxd-style Timeline using MusicDiaryEntries) */}
      {activeTab === "journal" && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[var(--theme-fg)]">
                Public Listening Diary & Logbook
              </h2>
              <p className="text-xs text-[var(--theme-muted)]">
                Chronological timeline of logged albums, ratings, and critical notes
              </p>
            </div>

            {isOwner && (
              <Link
                href="/journal"
                className="px-3.5 py-1.5 rounded-full bg-[var(--theme-surface)] hover:bg-[var(--theme-card)] border border-[var(--theme-border)] hover:border-[var(--theme-accent)] text-xs font-bold text-[var(--theme-fg)] transition flex items-center gap-1.5 shadow-sm"
              >
                <span>Full Journal Page</span>
                <ArrowRight size={13} className="text-[var(--theme-accent)]" />
              </Link>
            )}
          </div>

          {/* Letterboxd-Style Diary Entries Timeline - Directly on Background */}
          {publicEntries.length === 0 ? (
            <div className="py-20 text-center text-[var(--theme-muted)] space-y-3">
              <Disc size={36} className="mx-auto opacity-40 animate-spin" />
              <p className="text-sm font-medium">No public journal entries logged yet</p>
              {isOwner && (
                <Link
                  href="/journal"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[var(--theme-accent)] text-[var(--theme-accent-fg)] text-xs font-bold shadow-md hover:opacity-90 transition"
                >
                  <Plus size={14} />
                  <span>Log Your First Album</span>
                </Link>
              )}
            </div>
          ) : (
            <MusicDiaryEntries
              entries={publicEntries}
              isOwner={isOwner}
              onOpenNew={isOwner ? () => router.push("/journal") : null}
            />
          )}
        </div>
      )}

      {/* 4. TAB 2: OVERVIEW & ABOUT */}
      {activeTab === "about" && (
        <div className="space-y-6 pt-2">
          <div className="rounded-2xl bg-[var(--theme-card)] border border-[var(--theme-border)] p-5 space-y-3 shadow-sm">
            <h3 className="text-sm font-bold text-[var(--theme-fg)]">About @{profile.username}</h3>
            <p className="text-xs sm:text-sm text-[var(--theme-muted)] leading-relaxed">
              {profile.bio || `@${profile.username} is a music lover and listener on GrooveEstrella.`}
            </p>
            <div className="pt-2 flex items-center gap-4 text-xs text-[var(--theme-muted)] flex-wrap">
              <span>Member since 2026</span>
              <span>·</span>
              <span>{publicEntries.length} logged reviews</span>
              {avgRating && (
                <>
                  <span>·</span>
                  <span>{avgRating}★ average rating</span>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Social Follows Modal */}
      <FollowersListModal
        isOpen={isFollowsModalOpen}
        onClose={() => setIsFollowsModalOpen(false)}
        userId={profile.id}
        username={profile.username}
        initialTab={followsModalTab}
      />
    </div>
  );
}
