// src/Components/PlaylistCover.jsx
"use client";

import React, { useMemo } from "react";

export function extractPlaylistCovers(tracks = []) {
  if (!Array.isArray(tracks)) return [];
  const covers = [];
  const seen = new Set();

  for (const item of tracks) {
    const t = item?.track || item;
    const url = t?.album?.images?.[0]?.url || t?.image || t?.coverArt || t?.url;
    if (url && typeof url === "string" && !url.includes("placehold") && !seen.has(url)) {
      seen.add(url);
      covers.push(url);
    }
  }
  return covers;
}

export default function PlaylistCover({ 
  tracks = [], 
  name = "Playlist", 
  defaultCover = null,
  className = "w-full h-full" 
}) {
  const covers = useMemo(() => {
    const extracted = extractPlaylistCovers(tracks);
    if (extracted.length > 0) return extracted;
    if (defaultCover && typeof defaultCover === "string" && !defaultCover.includes("placehold")) {
      return [defaultCover];
    }
    return [];
  }, [tracks, defaultCover]);

  // Case 1: 4 or more covers available -> 2x2 grid collage
  if (covers.length >= 4) {
    return (
      <div className={`grid grid-cols-2 grid-rows-2 w-full h-full overflow-hidden ${className}`}>
        {covers.slice(0, 4).map((url, i) => (
          <img
            key={i}
            src={url}
            alt=""
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ))}
      </div>
    );
  }

  // Case 2: 1 to 3 covers available -> First track's cover
  if (covers.length >= 1) {
    return (
      <img
        src={covers[0]}
        alt={name}
        className={`w-full h-full object-cover transition-transform duration-500 hover:scale-105 ${className}`}
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
      />
    );
  }

  // Case 3: 0 covers available -> Colorful dynamic gradient with playlist name in display font
  return (
    <div className={`w-full h-full bg-gradient-to-br from-[#E8A87C] via-[#C38D9E] to-[#41B3A3] p-4 sm:p-6 flex flex-col items-center justify-center text-center relative overflow-hidden select-none ${className}`}>
      {/* Subtle vignette backdrop */}
      <div className="absolute inset-0 bg-black/25 pointer-events-none" />
      <div className="absolute -right-8 -bottom-8 w-28 h-28 rounded-full bg-white/10 blur-xl pointer-events-none" />
      <div className="absolute -left-8 -top-8 w-28 h-28 rounded-full bg-black/20 blur-xl pointer-events-none" />
      
      {/* Playlist Name in Display Font */}
      <div className="relative z-10 font-display font-black text-white text-base sm:text-xl md:text-2xl leading-tight line-clamp-3 drop-shadow-md">
        {name}
      </div>
      <div className="relative z-10 mt-2 text-[10px] sm:text-xs font-semibold text-white/80 uppercase tracking-widest font-mono">
        Groove Playlist
      </div>
    </div>
  );
}
