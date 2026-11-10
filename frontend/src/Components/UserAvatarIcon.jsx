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

export const DICEBEAR_STYLES = [
  { id: "identicon", label: "Identicon", desc: "Geometric abstract badges" },
  { id: "bottts", label: "Bottts", desc: "Retro cyber robots" },
  { id: "lorelei", label: "Lorelei", desc: "Illustrated expressive portraits" },
  { id: "adventurer", label: "Adventurer", desc: "Whimsical music adventurers" },
  { id: "thumbs", label: "Thumbs", desc: "Playful character thumbs" },
  { id: "pixel-art", label: "Pixel Art", desc: "Nostalgic 8-bit avatars" },
  { id: "notionists", label: "Notionists", desc: "Clean minimalist sketches" },
  { id: "micah", label: "Micah", desc: "Modern vector portraits" },
  { id: "shapes", label: "Shapes", desc: "Bauhaus geometric shapes" },
  { id: "fun-emoji", label: "Fun Emoji", desc: "Vibrant smiling faces" },
];

export function getDiceBearAvatarUrl(style = "identicon", seed = "groove") {
  const safeSeed = encodeURIComponent(String(seed || "groove").trim());
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${safeSeed}`;
}

export default function UserAvatarIcon({ avatarId, className = "w-6 h-6", fallbackLetter = "G", userName = "" }) {
  if (!avatarId) {
    return <span className="font-black select-none">{fallbackLetter}</span>;
  }

  // If it's a URL (DiceBear avatar or direct image link)
  if (
    typeof avatarId === "string" &&
    (avatarId.startsWith("http://") ||
      avatarId.startsWith("https://") ||
      avatarId.startsWith("data:") ||
      avatarId.startsWith("/") ||
      avatarId.includes("dicebear"))
  ) {
    return (
      <img
        src={avatarId}
        alt={userName || "User Avatar"}
        className={`${className} object-cover`}
        onError={(e) => {
          // Fallback to identicon using userName or default
          e.currentTarget.src = getDiceBearAvatarUrl("identicon", userName || "groove");
        }}
      />
    );
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
