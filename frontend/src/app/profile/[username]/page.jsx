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
} from "lucide-react";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { toast } from "@/lib/toast";

const FALLBACK_COVER_SVG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%2317020B'/%3E%3Ccircle cx='50' cy='50' r='35' fill='%23300818' stroke='%23E8A87C' stroke-width='2' stroke-dasharray='4 2'/%3E%3Ccircle cx='50' cy='50' r='12' fill='%23E8A87C'/%3E%3Ccircle cx='50' cy='50' r='4' fill='%2317020B'/%3E%3C/svg%3E";

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

  // Edit Profile modal
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState("");
  const [editBio, setEditBio] = useState("");

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
                  rating: j.user_ratings?.score || 0,
                  date: j.listened_date,
                  review: j.entry_text,
                  mood: j.mood,
                }))
              );
            }

            // 3. Fetch follow status
            if (user && user.id !== dbProfile.id) {
              const { data: followData } = await supabase
                .from("follows")
                .select("follower_id")
                .eq("follower_id", user.id)
                .eq("following_id", dbProfile.id)
                .maybeSingle();
              setIsFollowing(Boolean(followData));
            }

            // 4. Followers count
            const { count } = await supabase
              .from("follows")
              .select("*", { count: "exact", head: true })
              .eq("following_id", dbProfile.id);
            setFollowersCount(count || 0);

            setLoading(false);
            return;
          }
        } catch (err) {
          console.warn("Failed to query profile from Supabase:", err?.message);
        }
      }

      // Local storage fallback for local demo
      try {
        const localLogs = JSON.parse(localStorage.getItem("groove_journal_logs") || "[]");
        const guestName = localStorage.getItem("userName") || rawUsername;
        setProfile({
          id: "local_user",
          username: rawUsername,
          display_name: guestName,
          avatar_url: localStorage.getItem("userAvatar") || "",
          bio: "Music lover and active critic on GrooveEstrella",
        });
        setJournalLogs(localLogs.filter((l) => l.is_public !== false));
      } catch (_) {}

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
  };

  const handleShareProfile = () => {
    if (navigator.share) {
      navigator.share({
        title: `${profile?.display_name || "Profile"} on GrooveEstrella`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Profile link copied to clipboard!");
    }
  };

  // Stats
  const avgRating = useMemo(() => {
    const rated = journalLogs.filter((l) => l.rating > 0);
    if (rated.length === 0) return null;
    return (rated.reduce((acc, curr) => acc + curr.rating, 0) / rated.length).toFixed(1);
  }, [journalLogs]);

  if (loading) {
    return (
      <div className="min-h-screen py-24 text-center text-sm text-[var(--theme-muted)]">
        Loading music critic profile...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <h2 className="text-2xl font-bold">Profile Not Found</h2>
        <p className="text-sm text-[var(--theme-muted)]">
          The music critic @{rawUsername} could not be located.
        </p>
        <Link
          href="/"
          className="px-5 py-2.5 rounded-full bg-amber-400 text-zinc-950 font-bold text-sm"
        >
          Return Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-[var(--theme-fg)] py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-12">
      {/* Profile Header Hero */}
      <div className="relative rounded-3xl bg-[var(--theme-card)]/80 backdrop-blur-2xl border border-[var(--theme-border)] p-6 sm:p-8 shadow-2xl overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
          {/* Avatar */}
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl overflow-hidden bg-gradient-to-tr from-amber-400 to-amber-200 border-2 border-white/20 shadow-xl shrink-0 flex items-center justify-center">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.display_name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = `https://api.dicebear.com/7.x/identicon/svg?seed=${profile.username}`;
                }}
              />
            ) : (
              <User size={48} className="text-zinc-950" />
            )}
          </div>

          {/* Profile Bio & Details */}
          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight font-display text-[var(--theme-fg)]">
                  {profile.display_name || profile.username}
                </h1>
                <p className="text-sm font-mono text-amber-300 font-semibold">
                  @{profile.username}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-center sm:justify-end gap-2.5 pt-2 sm:pt-0">
                {isOwner ? (
                  <button
                    onClick={() => setIsEditOpen(true)}
                    className="px-4 py-2 rounded-2xl bg-[var(--theme-surface)] hover:bg-[var(--theme-card)] border border-[var(--theme-border)] text-xs font-bold text-[var(--theme-fg)] transition flex items-center gap-1.5 shadow-sm cursor-pointer"
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
                    <span>{isFollowing ? "Following" : "Follow"}</span>
                  </button>
                )}

                <button
                  onClick={handleShareProfile}
                  className="p-2 rounded-2xl bg-[var(--theme-surface)] hover:bg-[var(--theme-card)] border border-[var(--theme-border)] text-[var(--theme-muted)] hover:text-[var(--theme-fg)] transition cursor-pointer"
                  title="Share Profile"
                >
                  <Share2 size={16} />
                </button>
              </div>
            </div>

            <p className="text-sm text-[var(--theme-muted)] max-w-xl leading-relaxed pt-1">
              {profile.bio || "Active music explorer and journal keeper on GrooveEstrella."}
            </p>

            {/* Profile Statistics */}
            <div className="flex items-center justify-center sm:justify-start gap-6 pt-3 text-xs text-[var(--theme-muted)]">
              <div>
                <span className="font-extrabold text-[var(--theme-fg)] text-base font-mono mr-1">
                  {journalLogs.length}
                </span>
                <span>Journal Entries</span>
              </div>
              <div className="w-[1px] h-3 bg-white/10" />
              <div>
                <span className="font-extrabold text-amber-300 text-base font-mono mr-1">
                  {avgRating ? `${avgRating}★` : "—"}
                </span>
                <span>Avg Rating</span>
              </div>
              <div className="w-[1px] h-3 bg-white/10" />
              <div>
                <span className="font-extrabold text-[var(--theme-fg)] text-base font-mono mr-1">
                  {followersCount}
                </span>
                <span>Followers</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Public Music Journal Timeline */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen size={18} className="text-amber-300" />
            <h2 className="text-xl font-bold tracking-tight">Public Music Journal</h2>
          </div>
          <span className="text-xs font-mono text-[var(--theme-muted)]">
            {journalLogs.length} {journalLogs.length === 1 ? "Listen" : "Listens"} Recorded
          </span>
        </div>

        {journalLogs.length === 0 ? (
          <div className="text-center py-16 bg-[var(--theme-card)]/50 border border-[var(--theme-border)] rounded-3xl p-6 max-w-md mx-auto space-y-2">
            <BookOpen size={24} className="text-[var(--theme-muted)] mx-auto mb-2" />
            <h3 className="text-base font-bold text-[var(--theme-fg)]">No Public Journal Entries</h3>
            <p className="text-xs text-[var(--theme-muted)]">
              This critic has not shared any public listening logs yet.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {journalLogs.map((entry) => {
              const targetHref = entry.targetId
                ? `/${entry.targetType || "album"}/${entry.targetId}`
                : "#";

              return (
                <article
                  key={entry.id}
                  className="rounded-3xl bg-[var(--theme-card)]/80 backdrop-blur-xl border border-[var(--theme-border)] p-6 transition-all duration-200 hover:border-amber-400/30 space-y-4 shadow-lg"
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2 text-xs font-mono text-[var(--theme-muted)]">
                      <Calendar size={13} className="text-amber-300" />
                      <span>
                        {entry.date
                          ? new Date(entry.date).toLocaleDateString(undefined, {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : "LOGGED"}
                      </span>
                      {entry.mood && (
                        <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-300 font-medium">
                          {entry.mood}
                        </span>
                      )}
                    </div>

                    {entry.rating > 0 && (
                      <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 font-bold font-mono text-xs shadow-xs">
                        <Star size={13} fill="currentColor" className="text-amber-400" />
                        <span>{entry.rating}/10</span>
                      </div>
                    )}
                  </div>

                  <Link
                    href={targetHref}
                    className="flex items-center gap-3.5 p-3 rounded-2xl bg-[var(--theme-surface)]/80 hover:bg-[var(--theme-surface)] border border-[var(--theme-border)]/60 transition group max-w-xl"
                  >
                    {entry.image ? (
                      <img
                        src={entry.image}
                        alt={entry.title}
                        className="w-13 h-13 rounded-xl object-cover shrink-0 shadow-sm"
                        onError={(e) => {
                          e.currentTarget.src = FALLBACK_COVER_SVG;
                        }}
                      />
                    ) : (
                      <div className="w-13 h-13 rounded-xl bg-[var(--theme-card)] flex items-center justify-center text-[var(--theme-muted)] shrink-0">
                        <Disc size={20} />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--theme-accent)]">
                        {entry.targetType || "Release"}
                      </span>
                      <h4 className="text-sm font-extrabold text-[var(--theme-fg)] group-hover:text-amber-300 transition-colors truncate">
                        {entry.title}
                      </h4>
                      {entry.subtitle && (
                        <p className="text-xs text-[var(--theme-muted)] truncate">
                          {entry.subtitle}
                        </p>
                      )}
                    </div>
                    <ArrowRight
                      size={14}
                      className="text-[var(--theme-muted)] group-hover:text-amber-300 group-hover:translate-x-1 transition-transform shrink-0 mr-1"
                    />
                  </Link>

                  {entry.review && (
                    <div className="text-sm sm:text-base leading-relaxed text-[var(--theme-fg)] font-body whitespace-pre-line pt-1">
                      {entry.review}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl bg-[var(--theme-card)] border border-[var(--theme-border)] p-6 shadow-2xl space-y-5">
            <h3 className="text-lg font-bold">Edit Critic Profile</h3>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--theme-muted)]">
                  Display Name
                </label>
                <input
                  type="text"
                  value={editDisplayName}
                  onChange={(e) => setEditDisplayName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--theme-surface)] border border-[var(--theme-border)] text-sm focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--theme-muted)]">
                  Bio / Taste Profile
                </label>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--theme-surface)] border border-[var(--theme-border)] text-sm focus:outline-none focus:border-amber-400 resize-none"
                  placeholder="Tell other listeners about your favorite genres, vinyl collection, or listening philosophy..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--theme-surface)] hover:bg-[var(--theme-card)] border border-[var(--theme-border)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-400 text-zinc-950 hover:bg-amber-300"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
