// src/Components/UserProfileBadge.jsx
"use client";

import React from "react";
import { ShieldAlert, Check } from "lucide-react";

/**
 * Noise grain SVG data URL for the deep golden grain texture
 */
export const NOISE_GRAIN_BG =
  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.08'/%3E%3C/svg%3E\")";

/**
 * Golden Vinyl Disc for Critic Badge
 */
export function GoldenDiscIcon({ className = "w-4 h-4", animated = false }) {
  return (
    <div className={`relative shrink-0 flex items-center justify-center ${className} ${animated ? "group-hover:rotate-45 transition-transform duration-700" : ""}`}>
      <svg
        viewBox="0 0 40 40"
        className="w-full h-full drop-shadow-[0_0_6px_rgba(245,158,11,0.6)]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="20" cy="20" r="19" fill="url(#golden_disc_grad)" stroke="#F59E0B" strokeWidth="1.5" />
        {/* Vinyl Grooves */}
        <circle cx="20" cy="20" r="15" stroke="#78350F" strokeWidth="0.75" strokeOpacity="0.7" />
        <circle cx="20" cy="20" r="12" stroke="#FEF3C7" strokeWidth="0.5" strokeOpacity="0.5" />
        <circle cx="20" cy="20" r="9" stroke="#78350F" strokeWidth="0.75" strokeOpacity="0.7" />
        {/* Center Golden Label */}
        <circle cx="20" cy="20" r="6" fill="#B45309" stroke="#FDE68A" strokeWidth="1" />
        {/* Spindle hole */}
        <circle cx="20" cy="20" r="2" fill="#180A02" />
        <defs>
          <radialGradient id="golden_disc_grad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#F59E0B" />
            <stop offset="45%" stopColor="#D97706" />
            <stop offset="70%" stopColor="#92400E" />
            <stop offset="100%" stopColor="#78350F" />
          </radialGradient>
        </defs>
      </svg>
    </div>
  );
}

/**
 * Our Brand Logo Disc for Verified Badge
 */
export function LogoDiscIcon({ className = "w-4 h-4" }) {
  return (
    <div className={`relative shrink-0 flex items-center justify-center ${className}`}>
      <img
        src="/in.svg"
        alt="Logo Disc"
        className="w-full h-full object-contain drop-shadow-[0_0_6px_rgba(56,189,248,0.7)]"
      />
    </div>
  );
}

/**
 * Profile Badge metadata and styling configuration
 */
export function getProfileBadgeTheme(badgeType = "critic") {
  const norm = (badgeType || "").toLowerCase().trim();

  if (norm === "admin") {
    return {
      type: "admin",
      label: "Admin",
      tell: "System Administrator & Sound Curator",
      shortTell: "Administrator",
      heroBg: "bg-gradient-to-br from-red-950/60 via-[var(--theme-card)] to-rose-950/40",
      heroBorder: "border-red-500/50",
      heroRing: "ring-1 ring-red-500/30",
      heroShadow: "shadow-[0_24px_60px_-15px_rgba(239,68,68,0.35)]",
      avatarRing: "ring-4 ring-red-500/50 shadow-[0_0_25px_rgba(239,68,68,0.55)]",
      avatarBg: "bg-gradient-to-tr from-red-600 via-rose-500 to-amber-300",
      accentText: "text-red-400",
      accentBorder: "border-red-500/40",
      accentGlow: "rgba(239,68,68,0.35)",
      highlightLine: "via-red-500/70",
      grain: false,
    };
  }

  if (norm === "verified") {
    return {
      type: "verified",
      label: "Verified",
      tell: "Verified Artist & Authenticated Listener",
      shortTell: "Verified Collector",
      heroBg: "bg-gradient-to-br from-sky-950/60 via-[var(--theme-card)] to-cyan-950/40",
      heroBorder: "border-sky-400/50",
      heroRing: "ring-1 ring-sky-400/30",
      heroShadow: "shadow-[0_24px_60px_-15px_rgba(56,189,248,0.35)]",
      avatarRing: "ring-4 ring-sky-400/50 shadow-[0_0_25px_rgba(56,189,248,0.5)]",
      avatarBg: "bg-gradient-to-tr from-sky-400 via-cyan-300 to-emerald-200",
      accentText: "text-sky-300",
      accentBorder: "border-sky-400/40",
      accentGlow: "rgba(56,189,248,0.35)",
      highlightLine: "via-sky-400/70",
      grain: false,
    };
  }

  if (norm === "critic") {
    return {
      type: "critic",
      label: "Critic",
      tell: "Accredited Music Critic & Editorial Reviewer",
      shortTell: "Music Critic",
      heroBg: "bg-gradient-to-br from-amber-950/70 via-yellow-950/40 to-[var(--theme-card)]",
      heroBorder: "border-amber-500/50",
      heroRing: "ring-1 ring-amber-500/35",
      heroShadow: "shadow-[0_24px_60px_-15px_rgba(245,158,11,0.35)]",
      avatarRing: "ring-4 ring-amber-400/50 shadow-[0_0_25px_rgba(245,158,11,0.5)]",
      avatarBg: "bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-200",
      accentText: "text-amber-300",
      accentBorder: "border-amber-500/40",
      accentGlow: "rgba(245,158,11,0.35)",
      highlightLine: "via-amber-400/70",
      grain: true,
    };
  }

  // Fallback: Citizen / Standard
  return {
    type: "none",
    label: "Citizen",
    tell: "Music Explorer & Community Listener",
    shortTell: "Music Listener",
    heroBg: "bg-gradient-to-br from-[var(--theme-surface-elevated)] via-[var(--theme-card)] to-[var(--theme-card)]",
    heroBorder: "border-[var(--theme-border)]",
    heroRing: "ring-1 ring-white/5",
    heroShadow: "shadow-[0_24px_60px_-15px_rgba(0,0,0,0.55)]",
    avatarRing: "ring-2 ring-amber-400/20",
    avatarBg: "bg-gradient-to-tr from-amber-400 via-amber-300 to-amber-200",
    accentText: "text-[var(--theme-accent)]",
    accentBorder: "border-[var(--theme-border)]",
    accentGlow: "rgba(255,255,255,0.1)",
    highlightLine: "via-[var(--theme-accent)]/40",
    grain: false,
  };
}

/**
 * Three New Badges:
 * 1. Admin: Glowing Red Badge
 * 2. Verified Badge: with our logo disc
 * 3. Critic Badge: says Critic, has a golden disc, and deep golden background with grain
 */
export default function UserProfileBadge({
  badge = "critic",
  size = "md", // 'sm' | 'md' | 'lg'
  className = "",
  showTell = false,
}) {
  const norm = (badge || "").toLowerCase().trim();

  // 1. ADMIN (Glowing Red Badge)
  if (norm === "admin") {
    const sizeClasses =
      size === "sm"
        ? "px-2.5 py-0.5 text-[10px] gap-1"
        : size === "lg"
        ? "px-4 py-1.5 text-xs gap-2"
        : "px-3 py-1 text-[11px] gap-1.5";

    return (
      <div className={`inline-flex items-center flex-wrap gap-2 ${className}`}>
        <span
          className={`inline-flex items-center rounded-full font-black uppercase tracking-widest bg-gradient-to-r from-red-950 via-rose-900 to-red-950 border border-red-500/80 text-red-200 shadow-[0_0_15px_rgba(239,68,68,0.55)] ring-1 ring-red-400/40 select-none ${sizeClasses}`}
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500 shadow-[0_0_8px_#ef4444]" />
          </span>
          <ShieldAlert size={size === "sm" ? 11 : 13} className="text-red-400 shrink-0" />
          <span>Admin</span>
        </span>
        {showTell && (
          <span className="text-[11px] font-bold text-red-400/90 tracking-wide">
            · System Administrator
          </span>
        )}
      </div>
    );
  }

  // 2. VERIFIED BADGE (with our logo disc)
  if (norm === "verified") {
    const sizeClasses =
      size === "sm"
        ? "px-2.5 py-0.5 text-[10px] gap-1.5"
        : size === "lg"
        ? "px-4 py-1.5 text-xs gap-2"
        : "px-3 py-1 text-[11px] gap-1.5";

    const discSize = size === "sm" ? "w-3.5 h-3.5" : size === "lg" ? "w-4.5 h-4.5" : "w-4 h-4";

    return (
      <div className={`inline-flex items-center flex-wrap gap-2 ${className}`}>
        <span
          className={`inline-flex items-center rounded-full font-black uppercase tracking-wider bg-gradient-to-r from-sky-950/90 via-cyan-900/80 to-blue-950/90 border border-sky-400/70 text-sky-200 shadow-[0_0_15px_rgba(56,189,248,0.45)] ring-1 ring-sky-300/40 select-none ${sizeClasses}`}
        >
          <LogoDiscIcon className={discSize} />
          <span>Verified</span>
          <span className="w-3.5 h-3.5 rounded-full bg-sky-400 text-zinc-950 flex items-center justify-center shrink-0">
            <Check size={9} strokeWidth={3} />
          </span>
        </span>
        {showTell && (
          <span className="text-[11px] font-bold text-sky-300/90 tracking-wide">
            · Verified Creator
          </span>
        )}
      </div>
    );
  }

  // 3. CRITIC BADGE (says Critic, has a golden disc, and deep golden background with grain)
  if (norm === "critic") {
    const sizeClasses =
      size === "sm"
        ? "px-2.5 py-0.5 text-[10px] gap-1.5"
        : size === "lg"
        ? "px-4 py-1.5 text-xs gap-2"
        : "px-3 py-1 text-[11px] gap-1.5";

    const discSize = size === "sm" ? "w-3.5 h-3.5" : size === "lg" ? "w-4.5 h-4.5" : "w-4 h-4";

    return (
      <div className={`inline-flex items-center flex-wrap gap-2 ${className}`}>
        <span
          style={{
            backgroundImage: `radial-gradient(ellipse at top, rgba(245,158,11,0.2), transparent 70%), ${NOISE_GRAIN_BG}`,
          }}
          className={`relative inline-flex items-center rounded-full font-black uppercase tracking-wider bg-gradient-to-r from-[#241303] via-[#3d2005] to-[#1c0e02] border border-amber-500/70 text-amber-200 shadow-[0_0_18px_rgba(245,158,11,0.4)] ring-1 ring-amber-400/35 overflow-hidden select-none ${sizeClasses}`}
        >
          {/* Golden Disc */}
          <GoldenDiscIcon className={discSize} animated={true} />
          <span className="text-amber-200 font-black tracking-widest drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
            Critic
          </span>
          <span className="text-amber-400 text-[10px] font-black">★</span>
        </span>
        {showTell && (
          <span className="text-[11px] font-bold text-amber-300/90 tracking-wide">
            · Accredited Music Critic
          </span>
        )}
      </div>
    );
  }

  // 4. Default / None
  return null;
}
