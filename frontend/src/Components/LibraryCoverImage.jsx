// src/Components/LibraryCoverImage.jsx
"use client";

import React, { useState, useEffect, useRef } from "react";

export const FALLBACK_COVER_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#240715"/>
      <stop offset="50%" stop-color="#17020B"/>
      <stop offset="100%" stop-color="#3D1226"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#E8A87C"/>
      <stop offset="100%" stop-color="#D4A373"/>
    </linearGradient>
  </defs>
  <rect width="400" height="400" fill="url(#bg)"/>
  <circle cx="200" cy="200" r="110" fill="none" stroke="url(#accent)" stroke-width="3" opacity="0.25"/>
  <circle cx="200" cy="200" r="65" fill="none" stroke="url(#accent)" stroke-width="2" opacity="0.35"/>
  <circle cx="200" cy="200" r="24" fill="url(#accent)"/>
  <path d="M190 155 L235 155 L235 220 A22 22 0 1 1 213 198 L213 172 L190 172 Z" fill="url(#accent)"/>
</svg>
`)}`;

/**
 * Smart, high-performance image component with:
 * - Instant SVG fallback (0ms latency, zero external network dependency)
 * - Cached image pre-check (avoids flicker for cached assets)
 * - Shimmer skeleton while fetching over network
 * - Smooth fade-in transition on load
 * - Async decoding & configurable fetch priority
 */
export default function LibraryCoverImage({
  src,
  alt = "Cover Art",
  className = "",
  imgClassName = "",
  isCircle = false,
  priority = false,
  onClick,
}) {
  const [imgSrc, setImgSrc] = useState(src || FALLBACK_COVER_SVG);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    const validSrc = src && !src.includes("placehold.co") ? src : FALLBACK_COVER_SVG;
    setImgSrc(validSrc);
    setHasError(false);

    // If image is already cached in memory, set loaded immediately
    if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
      setIsLoaded(true);
    } else {
      setIsLoaded(false);
    }
  }, [src]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
    setImgSrc(FALLBACK_COVER_SVG);
    setIsLoaded(true);
  };

  return (
    <div
      onClick={onClick}
      className={`relative w-full h-full overflow-hidden select-none bg-[var(--theme-surface)] ${
        isCircle ? "rounded-full" : "rounded-2xl"
      } ${className}`}
    >
      {/* Shimmer skeleton while loading */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--theme-surface)] via-[var(--theme-card)] to-[var(--theme-surface)] bg-[length:200%_100%] animate-pulse" />
      )}

      {/* Image element */}
      <img
        ref={imgRef}
        src={imgSrc}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "low"}
        decoding="async"
        onLoad={handleLoad}
        onError={handleError}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLoaded ? "opacity-100" : "opacity-0"
        } ${isCircle ? "rounded-full" : ""} ${imgClassName}`}
      />
    </div>
  );
}
