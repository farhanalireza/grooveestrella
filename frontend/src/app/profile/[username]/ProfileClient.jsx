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
} from "lucide-react";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { toast } from "@/lib/toast";
import JournalCard from "@/Components/JournalCard";
import FollowersListModal from "@/Components/FollowersListModal";
import { buildJournalEditorHref } from "@/lib/journalLinks";
import UserProfileBadge, {
  getProfileBadgeTheme,
  NOISE_GRAIN_BG,
} from "@/Components/UserProfileBadge";

export default function ProfileClient({
  rawUsername,
  initialProfile = null,
  initialJournalLogs = [],
  initialFollowersCount = 0,
  initialFollowingCount = 0,
  initialAvgRating = null,
}) {
  const router = useRouter();
  const { user, profile: authProfile, updateProfile } = useSupabaseAuth();

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

  // Edit Profile modal
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState(initialProfile?.display_name || "");
  const [editBio, setEditBio] = useState(initialProfile?.bio || "");
  const [editBadge, setEditBadge] = useState(
    initialProfile?.is_admin ? "admin" : (initialProfile?.badge || "critic")
  );
  const [copiedLink, setCopiedLink] = useState(false);

  const profileId = profile?.id;
  const currentUserId = user?.id;

  // Non-blocking check: is current logged-in user following this user?
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
    toast.success("Profile & Identity Badge updated!");
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

  // Strictly enforce public-only display on Public Profile
  const publicEntries = useMemo(() => {
    return (journalLogs || []).filter((entry) => entry.is_public !== false);
  }, [journalLogs]);

  // Average Rating (uses all public ratings from server, or computes from logs)
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
          className="px-6 py-2.5 rounded-full bg-amber-400 text-zinc-950 font-black text-sm"
        >
          Return Home
        </Link>
      </div>
    );
  }

  const userBadge = profile?.is_admin ? "admin" : (profile?.badge || "critic");
  const badgeTheme = getProfileBadgeTheme(userBadge);

  return (
    <div className="min-h-screen text-[var(--theme-fg)] py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-12 pb-32">
      {/* 3.1 ELEVATED PROFILE HEADER CARD (Dynamic Badge Theme & Tell) */}
      <header
        style={
          badgeTheme.grain
            ? {
                backgroundImage: `radial-gradient(ellipse at top, rgba(245,158,11,0.18), transparent 70%), ${NOISE_GRAIN_BG}`,
              }
            : undefined
        }
        className={`relative rounded-3xl ${badgeTheme.heroBg} backdrop-blur-2xl border ${badgeTheme.heroBorder} ${badgeTheme.heroRing} p-6 sm:p-9 ${badgeTheme.heroShadow} overflow-hidden transition-all duration-500`}
      >
        {/* Subtle top highlight line for elevated depth */}
        <div
          className={`absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent ${badgeTheme.highlightLine} to-transparent pointer-events-none`}
        />

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-7 relative z-10">
          {/* Larger Avatar */}
          <div
            className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden ${badgeTheme.avatarBg} border border-white/25 shadow-xl shrink-0 flex items-center justify-center ${badgeTheme.avatarRing} transition-all duration-500`}
          >
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
              <User size={40} className="text-zinc-950" />
            )}
          </div>

          {/* Identity, Bio, Stats Row & Actions */}
          <div className="flex-1 text-center sm:text-left space-y-3 min-w-0 w-full">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="min-w-0 space-y-1">
                {/* Badge & Identity Tell */}
                <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap mb-1">
                  <UserProfileBadge badge={userBadge} size="sm" />
                  <span className={`text-[11px] font-semibold ${badgeTheme.accentText} tracking-wide`}>
                    · {badgeTheme.tell}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight font-display text-[var(--theme-fg)] truncate">
                  {profile.display_name || profile.username}
                </h1>
                <p className={`text-sm ${badgeTheme.accentText} font-semibold`}>
                  @{profile.username}
                </p>
              </div>

              {/* Prominent Follow + Share (or Edit Profile for owner) */}
              <div className="flex items-center justify-center sm:justify-end gap-2.5 shrink-0">
                {isOwner ? (
                  <button
                    onClick={handleOpenEdit}
                    className="px-4 py-2 rounded-full bg-[var(--theme-surface)] hover:bg-[var(--theme-card)] border border-[var(--theme-border)] hover:border-amber-400/50 text-xs font-bold text-[var(--theme-fg)] transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Edit3 size={13} />
                    <span>Edit Profile</span>
                  </button>
                ) : (
                  <button
                    onClick={handleToggleFollow}
                    className={`px-6 py-2.5 rounded-full text-xs sm:text-sm font-black transition flex items-center gap-2 shadow-lg cursor-pointer ${
                      isFollowing
                        ? "bg-[var(--theme-surface)] text-[var(--theme-fg)] border border-[var(--theme-border)] hover:border-rose-400/50"
                        : "bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 text-zinc-950 hover:scale-105 active:scale-95 shadow-amber-400/20"
                    }`}
                  >
                    {isFollowing ? <UserCheck size={15} /> : <UserPlus size={15} />}
                    <span>{isFollowing ? "Following" : "Follow"}</span>
                  </button>
                )}

                <button
                  onClick={handleShareProfile}
                  className="p-2.5 rounded-full bg-[var(--theme-surface)] hover:bg-[var(--theme-card)] border border-[var(--theme-border)] text-[var(--theme-muted)] hover:text-[var(--theme-fg)] transition cursor-pointer shadow-sm"
                  title="Share Profile Link"
                >
                  {copiedLink ? <Check size={16} className="text-emerald-400" /> : <Share2 size={16} />}
                </button>
              </div>
            </div>

            {/* Short Bio */}
            {profile.bio && (
              <p className="text-sm sm:text-[15px] text-[var(--theme-muted)] max-w-2xl leading-relaxed font-body">
                {profile.bio}
              </p>
            )}

            {/* Stats Row: X Journal Entries · Y.Y★ Avg Rating · Z Followers */}
            <div className="pt-2 flex items-center justify-center sm:justify-start gap-2.5 sm:gap-3.5 flex-wrap text-xs sm:text-sm">
              <div className="inline-flex items-center gap-1.5 font-semibold text-[var(--theme-fg)]">
                <BookOpen size={14} className="text-[var(--theme-accent)]" />
                <span className="font-black">{publicEntries.length}</span>
                <span className="text-[var(--theme-muted)] font-medium">
                  {publicEntries.length === 1 ? "Journal Entry" : "Journal Entries"}
                </span>
              </div>

              <span className="text-[var(--theme-muted)]/40">·</span>

              <div className="inline-flex items-center gap-1.5 font-semibold text-[var(--theme-fg)]">
                <Star size={14} className="text-amber-400" fill={avgRating ? "currentColor" : "none"} />
                <span className="font-black text-amber-300">
                  {avgRating ? `${avgRating}★` : "—"}
                </span>
                <span className="text-[var(--theme-muted)] font-medium">Avg Rating</span>
              </div>

              <span className="text-[var(--theme-muted)]/40">·</span>

              <button
                type="button"
                onClick={() => handleOpenFollows("followers")}
                className="inline-flex items-center gap-1.5 font-semibold text-[var(--theme-fg)] hover:text-amber-300 transition cursor-pointer"
                title="View followers & following"
              >
                <Users size={14} className="text-[var(--theme-accent)]" />
                <span className="font-black">{followersCount}</span>
                <span className="text-[var(--theme-muted)] font-medium hover:text-amber-300">
                  {followersCount === 1 ? "Follower" : "Followers"}
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 3.2 PUBLIC MUSIC JOURNAL LIST */}
      <section className="space-y-6">
        <div className="flex items-baseline justify-between gap-4 border-b border-[var(--theme-border)]/60 pb-3.5 flex-wrap">
          <div className="flex items-center gap-2.5">
            <BookOpen size={20} className="text-[var(--theme-accent)]" />
            <h2 className="text-xl sm:text-2xl font-black tracking-tight font-display text-[var(--theme-fg)]">
              Public Music Journal
            </h2>
          </div>

          <span className="text-xs sm:text-sm font-bold text-[var(--theme-muted)]">
            {publicEntries.length} {publicEntries.length === 1 ? "Listen" : "Listens"} Recorded
          </span>
        </div>

        {publicEntries.length === 0 ? (
          <div className="text-center py-16 sm:py-20 bg-[var(--theme-card)]/60 border border-[var(--theme-border)] rounded-3xl p-8 max-w-md mx-auto space-y-3 shadow-lg">
            <div className="w-14 h-14 rounded-full bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-300 mx-auto">
              <BookOpen size={24} />
            </div>
            <h3 className="text-lg font-black text-[var(--theme-fg)]">No Public Entries Yet</h3>
            <p className="text-xs sm:text-sm text-[var(--theme-muted)] leading-relaxed">
              {isOwner
                ? "Log an album, track, or artist listen as Public to share your reviews here."
                : `@${profile.username} hasn't published any public journal entries yet.`}
            </p>
            {isOwner && (
              <Link
                href={`/journal/new?returnTo=${encodeURIComponent(`/profile/${profile.username}`)}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-amber-400 text-zinc-950 font-black text-xs hover:scale-105 active:scale-95 transition shadow-md mt-2"
              >
                <Sparkles size={14} />
                <span>Log a Listen</span>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-7">
            {publicEntries.map((entry) => (
              <JournalCard
                key={entry.id}
                entry={entry}
                isOwner={isOwner}
                onEdit={
                  isOwner
                    ? (e) => {
                        router.push(
                          buildJournalEditorHref({
                            mbid: e.targetId,
                            type: e.targetType || "album",
                            title: e.title,
                            subtitle: e.subtitle,
                            image: e.image,
                            entryId: e.id,
                            returnTo: `/profile/${profile.username}`,
                          })
                        );
                      }
                    : null
                }
              />
            ))}
          </div>
        )}
      </section>

      {/* Edit Profile Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md px-4">
          <div className="absolute inset-0" onClick={() => setIsEditOpen(false)} />
          <div className="relative max-w-md w-full bg-[var(--theme-card)] border border-[var(--theme-border)] rounded-3xl p-6 sm:p-8 shadow-2xl z-10 text-[var(--theme-fg)] space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black font-display text-[var(--theme-fg)]">
                Edit Profile
              </h3>
              <button
                onClick={() => setIsEditOpen(false)}
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
                  value={editDisplayName}
                  onChange={(e) => setEditDisplayName(e.target.value)}
                  placeholder="Your display name"
                  className="w-full px-4 py-2.5 rounded-2xl bg-[var(--theme-surface)] border border-[var(--theme-border)] text-sm font-bold text-[var(--theme-fg)] focus:outline-none focus:border-amber-400/60"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--theme-muted)] uppercase tracking-wider mb-2">
                  Profile Badge & Identity Aura
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    {
                      id: "admin",
                      title: "Admin Badge",
                      desc: "Glowing Red Badge · System Administrator",
                      badgeComp: <UserProfileBadge badge="admin" size="sm" />,
                      borderActive: "border-red-500/80 bg-red-950/40 ring-red-500/50",
                    },
                    {
                      id: "verified",
                      title: "Verified Badge",
                      desc: "Logo Disc · Authenticated Listener",
                      badgeComp: <UserProfileBadge badge="verified" size="sm" />,
                      borderActive: "border-sky-400/80 bg-sky-950/40 ring-sky-400/50",
                    },
                    {
                      id: "critic",
                      title: "Critic Badge",
                      desc: "Golden Disc with Grain · Music Critic",
                      badgeComp: <UserProfileBadge badge="critic" size="sm" />,
                      borderActive: "border-amber-400/80 bg-amber-950/40 ring-amber-400/50",
                    },
                    {
                      id: "none",
                      title: "Citizen",
                      desc: "Standard Listener · Clean Profile",
                      badgeComp: (
                        <span className="px-2.5 py-0.5 rounded-full bg-[var(--theme-card)] text-[10px] font-bold text-[var(--theme-muted)] uppercase tracking-wider border border-[var(--theme-border)]">
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
                        className={`p-3 rounded-2xl border text-left flex flex-col justify-between gap-1.5 transition cursor-pointer ${
                          isSelected
                            ? `${option.borderActive} ring-2 shadow-sm`
                            : "bg-[var(--theme-surface)] border-[var(--theme-border)] hover:border-[var(--theme-border-active)]"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          {option.badgeComp}
                          {isSelected && (
                            <span className="w-4 h-4 rounded-full bg-[var(--theme-accent)] text-[var(--theme-accent-fg)] flex items-center justify-center shrink-0">
                              <Check size={10} strokeWidth={3} />
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[var(--theme-muted)] leading-tight pt-0.5">
                          {option.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--theme-muted)] uppercase tracking-wider mb-1.5">
                  Bio
                </label>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  rows={4}
                  placeholder="Share a short bio about your music taste..."
                  className="w-full px-4 py-2.5 rounded-2xl bg-[var(--theme-surface)] border border-[var(--theme-border)] text-sm text-[var(--theme-fg)] focus:outline-none focus:border-amber-400/60 resize-none leading-relaxed"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="flex-1 py-2.5 rounded-full border border-[var(--theme-border)] text-xs font-bold text-[var(--theme-muted)] hover:bg-[var(--theme-surface)] transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-300 text-zinc-950 text-xs font-black hover:opacity-90 transition cursor-pointer shadow-md"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Followers & Following Modal */}
      {profile && (
        <FollowersListModal
          isOpen={isFollowsModalOpen}
          onClose={() => setIsFollowsModalOpen(false)}
          userId={profile.id}
          username={profile.username}
          initialTab={followsModalTab}
        />
      )}
    </div>
  );
}
