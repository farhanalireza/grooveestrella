// src/Components/UserAvatarIcon.jsx
"use client";

import React from "react";
import { 
  Headphones, 
  Disc, 
  Flame, 
  Sparkles, 
  Radio, 
  Music, 
  Mic, 
  Compass, 
  User 
} from "lucide-react";

export const AVATAR_ICON_MAP = {
  headphones: Headphones,
  "🎧": Headphones,
  vinyl: Disc,
  disc: Disc,
  "💿": Disc,
  flame: Flame,
  "🔥": Flame,
  sparkles: Sparkles,
  cosmic: Sparkles,
  "🌌": Sparkles,
  radio: Radio,
  cassette: Radio,
  "📼": Radio,
  music: Music,
  sax: Music,
  "🎷": Music,
  mic: Mic,
  compass: Compass,
  user: User,
};

export const AVAILABLE_AVATARS = [
  { id: "headphones", label: "Audiophile", icon: Headphones, bg: "from-amber-500/20 to-rose-500/20" },
  { id: "vinyl", label: "Vinyl Junkie", icon: Disc, bg: "from-purple-500/20 to-blue-500/20" },
  { id: "flame", label: "Trendsetter", icon: Flame, bg: "from-orange-500/20 to-amber-500/20" },
  { id: "sparkles", label: "Stargazer", icon: Sparkles, bg: "from-indigo-500/20 to-cyan-500/20" },
  { id: "radio", label: "Retro Head", icon: Radio, bg: "from-emerald-500/20 to-teal-500/20" },
  { id: "music", label: "Soul Groover", icon: Music, bg: "from-pink-500/20 to-yellow-500/20" },
];

export default function UserAvatarIcon({ avatarId, className = "w-6 h-6", fallbackLetter = "G" }) {
  if (!avatarId) {
    return <span className="font-black select-none">{fallbackLetter}</span>;
  }

  const IconComp = AVATAR_ICON_MAP[avatarId];
  if (IconComp) {
    return <IconComp className={className} />;
  }

  // If it's a single letter or fallback string
  if (avatarId.length === 1 && !/[\u{1F300}-\u{1F9FF}]/u.test(avatarId)) {
    return <span className="font-black select-none">{avatarId.toUpperCase()}</span>;
  }

  return <User className={className} />;
}
