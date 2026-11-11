// src/app/profile/[username]/page.jsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  User,
  Star,
  BookOpen,
  Calendar,
  Disc,
  ArrowRight,
  UserPlus,
  UserCheck,
  Edit3,
  Sparkles,
  Share2,
  PenTool,
  Headphones,
  Award,
  Users,
  Check,
} from "lucide-react";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { toast } from "@/lib/toast";
import JournalCard, { FALLBACK_COVER_SVG } from "@/Components/JournalCard";
import FollowersListModal from "@/Components/FollowersListModal";

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const rawUsername = params?.username ? decodeURIComponent(params.username) : "";
  const { user, profile: authProfile, updateProfile } = useSupabaseAuth();

  const [profile, setProfile] = useState(null);
  const [journalLogs, setJournalLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowsModalOpen, setIsFollowsModalOpen] = useState(false);
  const [followsModalTab, setFollowsModalTab] = useState("followers");

  // Filter tabs: 'all' | 'reviewed' | 'top_rated'
  const [activeFilter, setActiveFilter] = useState("all");

  // Edit Profile modal
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);

  const isOwner = Boolean(
    user && profile && (user.id === profile.id || user.email?.split("@")[0] === profile.username)
  );

  useEffect(() => {
    if (!rawUsername) return;

    const loadProfileData = async () => {
      setLoading(true);

      // Check if viewing own profile
      if (authProfile && authProfile.username?.toLowerCase() === rawUsername.toLowerCase()) {
        setProfile(authProfile);
        setEditDisplayName(authProfile.display_name || "");
        setEditBio(authProfile.bio || "");
      }

      if (isSupabaseConfigured()) {
        try {
          const supabase = createClient();
          // 1. Fetch profile
          const { data: dbProfile, error: profileErr } = await supabase
            .from("profiles")
            .select("*")
            .ilike("username", rawUsername)
            .maybeSingle();

          if (dbProfile) {
            setProfile(dbProfile);
            setEditDisplayName(dbProfile.display_name || "");
            setEditBio(dbProfile.bio || "");

            // 2. Fetch public journal entries
            const { data: dbJournals } = await supabase
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
              .eq("user_id", dbProfile.id)
              .eq("is_public", true)
              .order("listened_date", { ascending: false });

            if (dbJournals) {
              setJournalLogs(
                dbJournals.map((j) => ({
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
                  is_public: true,
                  createdAt: new Date(j.created_at).getTime(),
                }))
              );
            }

            // 3. Followers count
            const { count: fCount } = await supabase
              .from("follows")
              .select("*", { count: "exact", head: true })
              .eq("following_id", dbProfile.id);
            setFollowersCount(fCount || 0);

            // 4. Following count
            const { count: followingC } = await supabase
              .from("follows")
              .select("*", { count: "exact", head: true })
              .eq("follower_id", dbProfile.id);
            setFollowingCount(followingC || 0);

            // 5. Check if current user is following this profile
            if (user && user.id !== dbProfile.id) {
              const { data: followRel } = await supabase
                .from("follows")
                .select("*")
                .eq("follower_id", user.id)
                .eq("following_id", dbProfile.id)
                .maybeSingle();
              setIsFollowing(Boolean(followRel));
            }
          }
        } catch (err) {
          console.warn("Could not load cloud profile:", err.message);
        }
      }

      setLoading(false);
    };

    loadProfileData();
  }, [rawUsername, authProfile, user]);

  const handleToggleFollow = async () => {
    if (!user || !isSupabaseConfigured()) {
      toast.info("Sign in to follow other critics!");
      return;
    }
    if (!profile) return;

    const supabase = createClient();
    if (isFollowing) {
      await supabase
        .from("follows")
        .delete()
        .eq("follower_id", user.id)
        .eq("following_id", profile.id);
      setIsFollowing(false);
      setFollowersCount((prev) => Math.max(0, prev - 1));
      toast.info(`Unfollowed @${profile.username}`);
    } else {
      await supabase.from("follows").insert({
        follower_id: user.id,
        following_id: profile.id,
      });
      setIsFollowing(true);
      setFollowersCount((prev) => prev + 1);
      toast.success(`Following @${profile.username}! 🎵`);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    await updateProfile({
      display_name: editDisplayName,
      bio: editBio,
    });
    setProfile((prev) => ({
      ...prev,
      display_name: editDisplayName,
      bio: editBio,
    }));
    setIsEditOpen(false);
    toast.success("Profile updated successfully!");
  };

  const handleShareProfile = () => {
    if (navigator.share) {
      navigator.share({
        title: `${profile?.display_name || "Critic Profile"} on GrooveEstrella`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
      toast.success("Profile link copied to clipboard!");
    }
  };

  const handleOpenFollows = (tab = "followers") => {
    setFollowsModalTab(tab);
    setIsFollowsModalOpen(true);
  };

  // Metrics
  const avgRating = useMemo(() => {
    const rated = journalLogs.filter((l) => l.rating > 0);
    if (rated.length === 0) return null;
    return (rated.reduce((acc, curr) => acc + curr.rating, 0) / rated.length).toFixed(1);
  }, [journalLogs]);

  const reviewsCount = useMemo(() => {
    return journalLogs.filter((l) => l.review && l.review.trim().length > 0).length;
  }, [journalLogs]);

  const topRated = useMemo(() => {
    return journalLogs.filter((l) => l.rating >= 8.5);
  }, [journalLogs]);

  // Filtered entries for timeline
  const displayedEntries = useMemo(() => {
    if (activeFilter === "reviewed") {
      return journalLogs.filter((l) => l.review && l.review.trim().length > 0);
    }
    if (activeFilter === "top_rated") {
      return journalLogs.filter((l) => l.rating >= 8.5);
    }
    return journalLogs;
  }, [journalLogs, activeFilter]);

  if (loading) {
    return (
      <div className="min-h-screen py-24 text-center text-sm font-medium text-[var(--theme-muted)] animate-pulse">
        Loading music critic profile...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <h2 className="text-2xl font-black">Profile Not Found</h2>
        <p className="text-sm text-[var(--theme-muted)]">
          The music critic @{rawUsername} could not be located.
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

  return (
    <div className="min-h-screen text-[var(--theme-fg)] py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-12">
      {/* Profile Header Hero Card */}
      <div className="relative rounded-3xl bg-[var(--theme-card)]/90 backdrop-blur-2xl border border-[var(--theme-border)] p-7 sm:p-10 shadow-2xl overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-7 sm:gap-8 relative z-10">
          {/* Avatar (Generous, glowing border) */}
          <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-3xl overflow-hidden bg-gradient-to-tr from-amber-400 via-amber-300 to-amber-200 border-2 border-white/20 shadow-2xl shrink-0 flex items-center justify-center ring-4 ring-amber-400/20 group">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.display_name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  e.currentTarget.src = `https://api.dicebear.com/7.x/identicon/svg?seed=${profile.username}`;
                }}
              />
            ) : (
              <User size={56} className="text-zinc-950" />
            )}
          </div>

          {/* Profile Details & Bio */}
          <div className="flex-1 text-center sm:text-left space-y-3 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-300 text-[10px] font-bold uppercase tracking-widest mb-1.5">
                  <Sparkles size={11} />
                  <span>Music Critic & Explorer</span>
                </div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight font-display text-[var(--theme-fg)] truncate">
                  {profile.display_name || profile.username}
                </h1>
                <p className="text-sm text-amber-300 font-bold mt-0.5">
                  @{profile.username}
                </p>
              </div>

              {/* Action Buttons: Follow + Share + Edit */}
              <div className="flex items-center justify-center sm:justify-end gap-2.5 pt-1 sm:pt-0 shrink-0">
                {isOwner ? (
                  <button
                    onClick={() => setIsEditOpen(true)}
                    className="px-4 py-2 rounded-2xl bg-[var(--theme-surface)] hover:bg-[var(--theme-card)] border border-[var(--theme-border)] text-xs font-bold text-[var(--theme-fg)] transition flex items-center gap-1.5 shadow-sm cursor-pointer hover:border-amber-400/40"
                  >
                    <Edit3 size={14} />
                    <span>Edit Profile</span>
                  </button>
                ) : (
                  <button
                    onClick={handleToggleFollow}
                    className={`px-5 py-2 rounded-2xl text-xs font-black transition flex items-center gap-1.5 shadow-md cursor-pointer ${
                      isFollowing
                        ? "bg-zinc-800 text-zinc-200 border border-zinc-700 hover:bg-zinc-700"
                        : "bg-gradient-to-r from-amber-400 to-amber-300 text-zinc-950 hover:scale-105 active:scale-95"
                    }`}
                  >
                    {isFollowing ? <UserCheck size={14} /> : <UserPlus size={14} />}
                    <span>{isFollowing ? "Following" : "Follow Critic"}</span>
                  </button>
                )}

                <button
                  onClick={handleShareProfile}
                  className="p-2.5 rounded-2xl bg-[var(--theme-surface)] hover:bg-[var(--theme-card)] border border-[var(--theme-border)] text-[var(--theme-muted)] hover:text-[var(--theme-fg)] transition cursor-pointer"
                  title="Share Profile Link"
                >
                  {copiedLink ? <Check size={16} className="text-emerald-400" /> : <Share2 size={16} />}
                </button>
              </div>
            </div>

            {/* Bio */}
            <p className="text-sm sm:text-base text-[var(--theme-muted)] max-w-2xl leading-relaxed pt-1 font-body">
              {profile.bio || "Active music journal keeper on GrooveEstrella."}
            </p>

            {/* Critic Stat Cards Row */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 sm:gap-3 pt-3">
              <div className="p-3 rounded-2xl bg-[var(--theme-surface)]/80 border border-[var(--theme-border)]/60 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs text-[var(--theme-muted)] font-medium">
                  <Headphones size={13} className="text-amber-300" />
                  <span>Listens</span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-[var(--theme-fg)] mt-0.5">
                  {journalLogs.length}
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-[var(--theme-surface)]/80 border border-[var(--theme-border)]/60 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs text-[var(--theme-muted)] font-medium">
                  <PenTool size={13} className="text-amber-300" />
                  <span>Reviews</span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-amber-300 mt-0.5">
                  {reviewsCount}
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-[var(--theme-surface)]/80 border border-[var(--theme-border)]/60 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs text-[var(--theme-muted)] font-medium">
                  <Star size={13} className="text-amber-300" />
                  <span>Avg Rating</span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-amber-300 mt-0.5">
                  {avgRating ? `${avgRating}★` : "—"}
                </div>
              </div>

              {/* Followers - Clickable */}
              <button
                type="button"
                onClick={() => handleOpenFollows("followers")}
                className="p-3 rounded-2xl bg-[var(--theme-surface)]/80 hover:bg-[var(--theme-surface)] border border-[var(--theme-border)]/60 hover:border-amber-400/50 text-center sm:text-left transition-all duration-200 cursor-pointer group shadow-xs"
                title="View followers"
              >
                <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs text-[var(--theme-muted)] font-medium group-hover:text-amber-300 transition-colors">
                  <Users size={13} className="text-amber-300" />
                  <span>Followers</span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-[var(--theme-fg)] mt-0.5 group-hover:text-amber-300 transition-colors">
                  {followersCount}
                </div>
              </button>

              {/* Following - Clickable */}
              <button
                type="button"
                onClick={() => handleOpenFollows("following")}
                className="p-3 rounded-2xl bg-[var(--theme-surface)]/80 hover:bg-[var(--theme-surface)] border border-[var(--theme-border)]/60 hover:border-amber-400/50 text-center sm:text-left transition-all duration-200 cursor-pointer group shadow-xs col-span-2 sm:col-span-1"
                title="View critics this user follows"
              >
                <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs text-[var(--theme-muted)] font-medium group-hover:text-amber-300 transition-colors">
                  <UserCheck size={13} className="text-amber-300" />
                  <span>Following</span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-[var(--theme-fg)] mt-0.5 group-hover:text-amber-300 transition-colors">
                  {followingCount}
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Optional Top Rated Favorites Shelf */}
      {topRated.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Award size={18} className="text-amber-300" />
            <h2 className="text-lg font-black tracking-tight font-display">
              Critic's Top Rated Releases
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
            {topRated.slice(0, 4).map((item) => (
              <Link
                key={item.id}
                href={`/${item.targetType || "album"}/${item.targetId}`}
                className="group relative p-3 rounded-2xl bg-[var(--theme-card)]/80 border border-[var(--theme-border)] hover:border-amber-400/50 transition-all shadow-md hover:-translate-y-1 block overflow-hidden"
              >
                <div className="aspect-square rounded-xl overflow-hidden mb-2.5 bg-black/40 relative">
                  <img
                    src={item.image || FALLBACK_COVER_SVG}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md border border-amber-400/40 text-amber-300 text-[10px] font-bold">
                    ★ {item.rating}
                  </div>
                </div>
                <h4 className="text-xs font-black text-[var(--theme-fg)] truncate group-hover:text-amber-300 transition-colors">
                  {item.title}
                </h4>
                <p className="text-[11px] text-[var(--theme-muted)] truncate">{item.subtitle}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Public Music Journal Timeline */}
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2.5">
            <BookOpen size={20} className="text-amber-300" />
            <h2 className="text-2xl font-black tracking-tight font-display">
              Public Listening Journal
            </h2>
          </div>

          {/* Filter Toggles */}
          <div className="flex items-center gap-1.5 bg-[var(--theme-card)]/80 p-1 rounded-2xl border border-[var(--theme-border)]">
            <button
              onClick={() => setActiveFilter("all")}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeFilter === "all"
                  ? "bg-amber-400 text-zinc-950 shadow-xs"
                  : "text-[var(--theme-muted)] hover:text-[var(--theme-fg)]"
              }`}
            >
              All Listens ({journalLogs.length})
            </button>
            <button
              onClick={() => setActiveFilter("reviewed")}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                activeFilter === "reviewed"
                  ? "bg-amber-400 text-zinc-950 shadow-xs"
                  : "text-[var(--theme-muted)] hover:text-[var(--theme-fg)]"
              }`}
            >
              <PenTool size={11} />
              <span>Reviews ({reviewsCount})</span>
            </button>
            <button
              onClick={() => setActiveFilter("top_rated")}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                activeFilter === "top_rated"
                  ? "bg-amber-400 text-zinc-950 shadow-xs"
                  : "text-[var(--theme-muted)] hover:text-[var(--theme-fg)]"
              }`}
            >
              <Star size={11} />
              <span>Top Rated ({topRated.length})</span>
            </button>
          </div>
        </div>

        {/* Timeline Entries List */}
        {displayedEntries.length === 0 ? (
          <div className="text-center py-20 bg-[var(--theme-card)]/60 border border-[var(--theme-border)] rounded-3xl p-8 max-w-md mx-auto space-y-3 shadow-xl">
            <div className="w-16 h-16 rounded-full bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-300 mx-auto">
              <BookOpen size={28} />
            </div>
            <h3 className="text-lg font-black text-[var(--theme-fg)]">No Public Journal Entries</h3>
            <p className="text-xs sm:text-sm text-[var(--theme-muted)] leading-relaxed">
              {activeFilter === "reviewed"
                ? "This critic has not written reviews yet."
                : "This critic has not published any public listening logs yet."}
            </p>
            {isOwner && (
              <Link
                href="/journal"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-amber-400 text-zinc-950 font-black text-xs hover:scale-105 active:scale-95 transition shadow-md mt-2"
              >
                <Sparkles size={14} />
                <span>Write a Journal Entry</span>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-6 sm:space-y-7">
            {displayedEntries.map((entry) => (
              <JournalCard
                key={entry.id}
                entry={entry}
                isOwner={isOwner}
                onEdit={
                  isOwner
                    ? () => {
                        router.push("/journal");
                      }
                    : null
                }
              />
            ))}
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md px-4">
          <div className="absolute inset-0" onClick={() => setIsEditOpen(false)} />
          <div className="relative max-w-md w-full bg-[var(--theme-card)] border border-[var(--theme-border)] rounded-3xl p-6 sm:p-8 shadow-2xl z-10 text-[var(--theme-fg)] space-y-5 animate-scale-up">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black font-display text-[var(--theme-fg)]">
                Edit Critic Profile
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
