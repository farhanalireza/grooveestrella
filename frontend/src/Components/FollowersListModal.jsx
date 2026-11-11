// src/Components/FollowersListModal.jsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { X, Users, UserCheck, UserPlus, Sparkles, ExternalLink, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { toast } from "@/lib/toast";

export default function FollowersListModal({
  isOpen,
  onClose,
  userId,
  username,
  initialTab = "followers", // 'followers' | 'following'
}) {
  const router = useRouter();
  const { user: currentUser } = useSupabaseAuth();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({ followers: 0, following: 0 });

  // Sync initial tab when opened
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Fetch list of users for active tab
  const fetchFollows = useCallback(async (tabToFetch) => {
    if (!userId) return;
    setLoading(true);
    try {
      const curId = currentUser?.id || "";
      const res = await fetch(`/api/user/follows?userId=${encodeURIComponent(userId)}&type=${tabToFetch}&currentUserId=${encodeURIComponent(curId)}`);
      if (!res.ok) throw new Error("Failed to load follows list");
      const data = await res.json();
      setUsersList(data.users || []);
      setCounts((prev) => ({
        ...prev,
        [tabToFetch]: data.total || 0,
      }));
    } catch (err) {
      console.error("Error loading follows:", err);
      setUsersList([]);
    } finally {
      setLoading(false);
    }
  }, [userId, currentUser?.id]);

  useEffect(() => {
    if (isOpen && userId) {
      fetchFollows(activeTab);
    }
  }, [isOpen, userId, activeTab, fetchFollows]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Handle follow / unfollow toggle from within the modal
  const handleToggleFollow = async (targetUser, e) => {
    e.stopPropagation();
    if (!currentUser || !isSupabaseConfigured()) {
      toast.info("Please sign in to follow critics!");
      return;
    }
    if (currentUser.id === targetUser.id) return;

    const supabase = createClient();
    const currentlyFollowing = targetUser.isFollowing;

    // Optimistic UI update
    setUsersList((prev) =>
      prev.map((u) =>
        u.id === targetUser.id
          ? {
              ...u,
              isFollowing: !currentlyFollowing,
              followersCount: currentlyFollowing ? Math.max(0, u.followersCount - 1) : u.followersCount + 1,
            }
          : u
      )
    );

    try {
      if (currentlyFollowing) {
        await supabase
          .from("follows")
          .delete()
          .eq("follower_id", currentUser.id)
          .eq("following_id", targetUser.id);
        toast.info(`Unfollowed @${targetUser.username}`);
      } else {
        await supabase.from("follows").insert({
          follower_id: currentUser.id,
          following_id: targetUser.id,
        });
        toast.success(`Following @${targetUser.username}! 🎵`);
      }
    } catch (err) {
      console.error("Follow toggle failed:", err);
      // Revert optimistic update on error
      setUsersList((prev) =>
        prev.map((u) => (u.id === targetUser.id ? { ...u, isFollowing: currentlyFollowing } : u))
      );
      toast.error("Could not update follow status.");
    }
  };

  const handleNavigateToProfile = (targetUsername) => {
    if (!targetUsername) return;
    onClose();
    router.push(`/profile/${encodeURIComponent(targetUsername)}`);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/75 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: "spring", damping: 28, stiffness: 350 }}
          className="relative w-full max-w-lg max-h-[82vh] flex flex-col bg-[var(--theme-card)]/95 backdrop-blur-2xl border border-[var(--theme-border)] rounded-4xl shadow-2xl overflow-hidden z-10"
        >
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-[var(--theme-border)]/50 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg sm:text-xl font-black text-[var(--theme-fg)] font-display tracking-tight">
                  {username ? `@${username}` : "Critics Circle"}
                </h3>
                <p className="text-xs text-[var(--theme-muted)] font-medium">
                  {activeTab === "followers" ? "People who follow this critic" : "People this critic follows"}
                </p>
              </div>

              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-[var(--theme-surface)] hover:bg-[var(--theme-border)] text-[var(--theme-muted)] hover:text-[var(--theme-fg)] flex items-center justify-center transition cursor-pointer"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Seamless Tab Selector */}
            <div className="flex items-center gap-2 mt-4 p-1 rounded-2xl bg-[var(--theme-surface)] border border-[var(--theme-border)]/50">
              <button
                type="button"
                onClick={() => setActiveTab("followers")}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === "followers"
                    ? "bg-[var(--theme-card)] text-[var(--theme-fg)] shadow-sm border border-[var(--theme-border-active)]"
                    : "text-[var(--theme-muted)] hover:text-[var(--theme-fg)]"
                }`}
              >
                <Users size={13} className={activeTab === "followers" ? "text-amber-300" : ""} />
                <span>Followers</span>
                {counts.followers > 0 && (
                  <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-[var(--theme-surface)] text-[var(--theme-muted)]">
                    {counts.followers}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("following")}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === "following"
                    ? "bg-[var(--theme-card)] text-[var(--theme-fg)] shadow-sm border border-[var(--theme-border-active)]"
                    : "text-[var(--theme-muted)] hover:text-[var(--theme-fg)]"
                }`}
              >
                <UserCheck size={13} className={activeTab === "following" ? "text-amber-300" : ""} />
                <span>Following</span>
                {counts.following > 0 && (
                  <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-[var(--theme-surface)] text-[var(--theme-muted)]">
                    {counts.following}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* List Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-2.5 divide-y divide-[var(--theme-border)]/20">
            {loading ? (
              <div className="py-16 text-center space-y-3">
                <div className="w-8 h-8 rounded-full border-2 border-amber-300 border-t-transparent animate-spin mx-auto" />
                <p className="text-xs font-medium text-[var(--theme-muted)] animate-pulse">
                  Loading {activeTab}...
                </p>
              </div>
            ) : usersList.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <div className="w-12 h-12 rounded-3xl bg-[var(--theme-surface)] text-[var(--theme-muted)] flex items-center justify-center mx-auto">
                  {activeTab === "followers" ? <Users size={22} /> : <UserCheck size={22} />}
                </div>
                <h4 className="text-sm font-bold text-[var(--theme-fg)] font-display">
                  {activeTab === "followers" ? "No followers yet" : "Not following anyone yet"}
                </h4>
                <p className="text-xs text-[var(--theme-muted)] max-w-xs mx-auto leading-relaxed font-body">
                  {activeTab === "followers"
                    ? "Share public music journals to connect with other listeners and critics across the community."
                    : "Discover music critics and listeners in Search or Explore to follow their journal logs."}
                </p>
              </div>
            ) : (
              usersList.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleNavigateToProfile(item.username)}
                  className="pt-2.5 first:pt-0 flex items-center justify-between gap-3 p-2.5 rounded-2xl hover:bg-[var(--theme-surface)] transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* User Avatar */}
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl overflow-hidden bg-gradient-to-tr from-amber-400 via-amber-300 to-amber-200 border border-white/20 shrink-0 flex items-center justify-center shadow-xs">
                      <img
                        src={item.avatarUrl}
                        alt={item.displayName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        onError={(e) => {
                          e.currentTarget.src = `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(item.username || "critic")}`;
                        }}
                      />
                    </div>

                    {/* Name & Username */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs sm:text-sm font-black text-[var(--theme-fg)] truncate font-display group-hover:text-amber-300 transition-colors">
                          {item.displayName}
                        </span>
                      </div>
                      <p className="text-[11px] text-amber-300 font-bold truncate">
                        @{item.username}
                      </p>
                      {item.bio && (
                        <p className="text-[11px] text-[var(--theme-muted)] truncate max-w-xs font-body">
                          {item.bio}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Follow / Unfollow Button */}
                  <div className="shrink-0 flex items-center gap-1.5">
                    {currentUser && currentUser.id !== item.id && (
                      <button
                        type="button"
                        onClick={(e) => handleToggleFollow(item, e)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1 shadow-xs ${
                          item.isFollowing
                            ? "bg-zinc-800 text-zinc-200 border border-zinc-700 hover:bg-zinc-700"
                            : "bg-gradient-to-r from-amber-400 to-amber-300 text-zinc-950 hover:scale-105 active:scale-95"
                        }`}
                      >
                        {item.isFollowing ? <UserCheck size={12} /> : <UserPlus size={12} />}
                        <span>{item.isFollowing ? "Following" : "Follow"}</span>
                      </button>
                    )}

                    <div className="w-7 h-7 rounded-full bg-[var(--theme-surface)] group-hover:bg-amber-400 group-hover:text-zinc-950 text-[var(--theme-muted)] flex items-center justify-center transition-colors">
                      <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
