// src/Components/CardComponents/UserCard.jsx
"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Users, User, ArrowRight, Sparkles } from "lucide-react";

export function UserCard({
  id,
  username,
  title,
  name,
  url,
  bio,
  followers = 0,
}) {
  const router = useRouter();
  const displayName = name || title || username || "Critic";
  const userHandle = username || "";
  const avatarSrc = url || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(userHandle || id || "groove")}`;

  const handleCardClick = () => {
    if (userHandle) {
      router.push(`/profile/${encodeURIComponent(userHandle)}`);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className="group relative flex items-center justify-between p-3.5 sm:p-4 rounded-3xl bg-[var(--theme-card)]/80 hover:bg-[var(--theme-card)] border border-[var(--theme-border)] hover:border-[var(--theme-accent)] transition-all duration-300 shadow-md hover:shadow-xl cursor-pointer w-full text-left"
    >
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        {/* Avatar */}
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl overflow-hidden bg-gradient-to-tr from-amber-400 via-amber-300 to-amber-200 border border-white/20 shadow-md shrink-0 flex items-center justify-center">
          <img
            src={avatarSrc}
            alt={displayName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.currentTarget.src = `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(userHandle || "groove")}`;
            }}
          />
        </div>

        {/* User Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm sm:text-base font-black text-[var(--theme-fg)] truncate font-display group-hover:text-[var(--theme-accent)] transition-colors">
              {displayName}
            </h3>
            <span className="shrink-0 px-2 py-0.5 rounded-full bg-[var(--theme-accent)]/10 border border-[var(--theme-accent)]/20 text-[var(--theme-accent)] text-[10px] font-bold uppercase tracking-wider hidden sm:inline-flex items-center gap-1">
              <Sparkles size={10} />
              <span>Critic</span>
            </span>
          </div>

          <p className="text-xs text-[var(--theme-accent)] font-bold truncate">
            @{userHandle}
          </p>

          {bio && (
            <p className="text-[11px] sm:text-xs text-[var(--theme-muted)] truncate mt-0.5 font-body">
              {bio}
            </p>
          )}

          <div className="flex items-center gap-3 mt-1 text-[11px] text-[var(--theme-muted)] font-medium">
            <span className="inline-flex items-center gap-1">
              <Users size={12} className="text-[var(--theme-accent)]" />
              <span>{followers} {followers === 1 ? "follower" : "followers"}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Action Arrow */}
      <div className="pl-3 shrink-0">
        <div className="w-8 h-8 rounded-full bg-[var(--theme-surface)] group-hover:bg-[var(--theme-accent)] group-hover:text-[var(--theme-accent-fg)] text-[var(--theme-muted)] flex items-center justify-center transition-all duration-200 shadow-sm">
          <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </div>
  );
}

export default UserCard;
