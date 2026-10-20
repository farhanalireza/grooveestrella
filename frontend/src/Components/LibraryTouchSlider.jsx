// src/Components/LibraryTouchSlider.jsx
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, ArrowRight, Trash2, Smartphone } from "lucide-react";
import PlaylistCover from "./PlaylistCover";
import LibraryCoverImage, { FALLBACK_COVER_SVG } from "./LibraryCoverImage";

const SLIDE_VARIANTS = {
  enter: (direction) => ({
    x: direction > 0 ? 280 : -280,
    opacity: 0,
    scale: 0.92,
    rotate: direction > 0 ? 5 : -5,
  }),
  center: {
    zIndex: 2,
    x: 0,
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: {
      x: { type: "spring", stiffness: 350, damping: 28 },
      opacity: { duration: 0.2 },
      scale: { duration: 0.2 },
      rotate: { duration: 0.2 },
    },
  },
  exit: (direction) => ({
    zIndex: 1,
    x: direction < 0 ? 280 : -280,
    opacity: 0,
    scale: 0.92,
    rotate: direction < 0 ? 5 : -5,
    transition: {
      x: { type: "spring", stiffness: 350, damping: 28 },
      opacity: { duration: 0.18 },
      scale: { duration: 0.18 },
    },
  }),
};

export default function LibraryTouchSlider({
  items = [],
  currentIndex = 0,
  onIndexChange,
  activeTab,
  onOpenItem,
  onDeleteItem,
  getActionLabel,
  getItemTitle,
  getItemSubtitle,
  getItemMeta,
  getItemImage,
  isNavigating = false,
  navigatingId = null,
}) {
  const [direction, setDirection] = useState(0);
  const isDraggingRef = useRef(false);

  // Preload adjacent images in the background so next/previous swipes render with 0 latency
  useEffect(() => {
    if (!items || items.length === 0) return;

    const indicesToPreload = [
      currentIndex - 1,
      currentIndex + 1,
      currentIndex + 2,
      currentIndex + 3,
    ].filter((idx) => idx >= 0 && idx < items.length);

    indicesToPreload.forEach((idx) => {
      const item = items[idx];
      const url = getItemImage(item, "large");
      if (url && typeof url === "string" && !url.startsWith("data:") && !url.includes("placehold.co")) {
        const img = new Image();
        img.src = url;
      }
    });
  }, [currentIndex, items, getItemImage]);

  // Keyboard navigation (ArrowLeft & ArrowRight)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowLeft") {
        paginate(-1);
      } else if (e.key === "ArrowRight") {
        paginate(1);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, items.length]);

  const paginate = useCallback(
    (newDirection) => {
      const nextIndex = currentIndex + newDirection;
      if (nextIndex >= 0 && nextIndex < items.length) {
        setDirection(newDirection);
        onIndexChange(nextIndex);
      }
    },
    [currentIndex, items.length, onIndexChange]
  );

  const jumpToIndex = useCallback(
    (targetIndex) => {
      if (targetIndex === currentIndex) return;
      const newDirection = targetIndex > currentIndex ? 1 : -1;
      setDirection(newDirection);
      onIndexChange(targetIndex);
    },
    [currentIndex, onIndexChange]
  );

  // Drag gesture handlers for touch & mouse
  const handleDragStart = () => {
    isDraggingRef.current = true;
  };

  const handleDragEnd = (event, info) => {
    // Keep isDragging flag true briefly to prevent click handler on release
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 100);

    const swipeThreshold = 40;
    const velocityThreshold = 250;

    const isSwipeLeft = info.offset.x < -swipeThreshold || info.velocity.x < -velocityThreshold;
    const isSwipeRight = info.offset.x > swipeThreshold || info.velocity.x > velocityThreshold;

    if (isSwipeLeft && currentIndex < items.length - 1) {
      paginate(1);
    } else if (isSwipeRight && currentIndex > 0) {
      paginate(-1);
    }
  };

  const handleCardClick = (item) => {
    if (isDraggingRef.current) return;
    onOpenItem(item);
  };

  const currentItem = items[currentIndex];
  const nextItem = items[currentIndex + 1];

  if (!currentItem) return null;

  const currentImageUrl = getItemImage(currentItem, "large");

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col items-center select-none">
      {/* Header Row: Deck Badge + Interactive Counter */}
      <div className="w-full flex items-center justify-between mb-3 px-2">
        <span className="text-xs font-extrabold uppercase tracking-wider text-[var(--theme-accent)] flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[var(--theme-accent)] animate-pulse" />
          <span>{activeTab.slice(0, -1)} Deck</span>
        </span>

        <span className="text-xs font-mono font-bold text-[var(--theme-muted)] bg-[var(--theme-surface)] px-2.5 py-0.5 rounded-full border border-[var(--theme-border)] shadow-inner">
          {currentIndex + 1} / {items.length}
        </span>
      </div>

      {/* Main Touch Slider Card Container with 3D Deck Stack */}
      <div className="relative w-full min-h-[460px] sm:min-h-[500px] flex items-center justify-center">
        {/* Stacked Card Behind Active Card (Physical Deck Visual Depth) */}
        {nextItem && (
          <div
            aria-hidden="true"
            className="absolute inset-0 z-0 pointer-events-none rounded-3xl bg-[var(--theme-card)]/60 border border-[var(--theme-border)]/50 shadow-xl flex flex-col items-center justify-center p-6 sm:p-8"
            style={{
              transform: "translateY(14px) scale(0.93)",
              opacity: 0.65,
              filter: "brightness(0.85)",
            }}
          >
            <div className="w-48 h-48 sm:w-60 sm:h-60 rounded-2xl bg-[var(--theme-surface)]/50 border border-[var(--theme-border)]/40 overflow-hidden" />
          </div>
        )}

        {/* Active Draggable / Swipeable Card */}
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={currentItem.id || currentItem.trackId || currentIndex}
            custom={direction}
            variants={SLIDE_VARIANTS}
            initial="enter"
            animate="center"
            exit="exit"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.65}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            whileTap={{ cursor: "grabbing" }}
            className="relative z-10 w-full bg-[var(--theme-card)]/95 backdrop-blur-2xl border border-[var(--theme-border)] rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center overflow-hidden cursor-grab active:cursor-grabbing transition-colors duration-300"
          >
            {/* Ambient Background Art Glow (Uses exact same preloaded image URL for 0ms lag) */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-3xl">
              <img
                src={currentImageUrl || FALLBACK_COVER_SVG}
                alt=""
                aria-hidden="true"
                loading="eager"
                fetchPriority="high"
                decoding="async"
                className="w-full h-full object-cover blur-3xl opacity-20 dark:opacity-15 scale-125 select-none"
              />
            </div>

            {/* Artwork / Media Cover */}
            <div
              onClick={() => handleCardClick(currentItem)}
              className="relative z-10 w-60 h-60 sm:w-72 sm:h-72 aspect-square rounded-2xl overflow-hidden shadow-2xl border border-[var(--theme-border)] group cursor-pointer transition-transform duration-300 hover:scale-[1.02]"
            >
              {activeTab === "playlists" && currentItem.isCustom ? (
                <PlaylistCover
                  tracks={currentItem.tracks?.items || []}
                  name={currentItem.name}
                  defaultCover={currentItem.image}
                />
              ) : (
                <LibraryCoverImage
                  src={currentImageUrl}
                  alt={getItemTitle(currentItem)}
                  isCircle={activeTab === "artists"}
                  priority={true}
                  className="w-full h-full"
                />
              )}
              {isNavigating && navigatingId === (currentItem.id || currentItem.trackId || currentItem.trackURI) && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex flex-col items-center justify-center gap-2 animate-fade-in z-30">
                  <div className="w-10 h-10 rounded-full border-3 border-[var(--theme-accent)] border-t-transparent animate-spin" />
                  <span className="text-[11px] font-bold text-white tracking-widest uppercase font-mono">Opening...</span>
                </div>
              )}
            </div>

            {/* Item Details */}
            <div className="relative z-10 mt-6 w-full">
              <h2
                onClick={() => handleCardClick(currentItem)}
                className="text-xl sm:text-2xl font-black text-[var(--theme-fg)] truncate tracking-tight hover:text-[var(--theme-accent)] transition cursor-pointer"
              >
                {getItemTitle(currentItem)}
              </h2>
              <p className="text-sm font-semibold text-[var(--theme-accent)] truncate mt-1">
                {getItemSubtitle(currentItem)}
              </p>
              {getItemMeta(currentItem) && (
                <p className="text-xs text-[var(--theme-muted)] font-medium mt-1">
                  {getItemMeta(currentItem)}
                </p>
              )}
            </div>

            {/* Card Action Controls */}
            <div className="relative z-10 mt-6 w-full flex items-center justify-center gap-3 pt-4 border-t border-[var(--theme-border)]/60">
              <button
                type="button"
                disabled={isNavigating}
                onClick={() => handleCardClick(currentItem)}
                className="flex-1 py-3 px-5 bg-[var(--theme-accent)] hover:opacity-95 text-[var(--theme-accent-fg)] font-bold text-xs sm:text-sm rounded-full transition shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-75 disabled:cursor-wait"
              >
                {isNavigating && navigatingId === (currentItem.id || currentItem.trackId || currentItem.trackURI) ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                    <span>Opening...</span>
                  </>
                ) : (
                  <>
                    <span>{getActionLabel()}</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteItem(currentItem);
                }}
                className="p-3 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition cursor-pointer active:scale-95 shrink-0"
                title="Remove from Library"
                aria-label="Remove item"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Swipe Hint Indicator */}
      <div className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-[var(--theme-muted)]">
        <Smartphone size={12} className="opacity-70 animate-bounce" />
        <span>Swipe card left/right or use controls below</span>
      </div>

      {/* Slider Navigation Bar */}
      <div className="w-full flex items-center justify-between gap-4 mt-4 px-4">
        {/* Previous Button */}
        <button
          type="button"
          onClick={() => paginate(-1)}
          disabled={currentIndex === 0}
          className="w-12 h-12 rounded-full aspect-square bg-[var(--theme-card)] border border-[var(--theme-border)] text-[var(--theme-fg)] flex items-center justify-center hover:bg-[var(--theme-surface)] active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition shadow-md cursor-pointer"
          title="Previous Card (← Arrow Left or Swipe Right)"
          aria-label="Previous card"
        >
          <ChevronLeft size={20} />
        </button>

        {/* Interactive Progress Dots */}
        <div className="flex items-center gap-1.5 flex-wrap justify-center max-w-[220px]">
          {Array.from({ length: Math.min(items.length, 9) }).map((_, dotIdx) => {
            const isDotActive =
              dotIdx === currentIndex || (dotIdx === 8 && currentIndex >= 8);
            return (
              <button
                key={dotIdx}
                type="button"
                onClick={() => jumpToIndex(dotIdx)}
                className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                  isDotActive
                    ? "w-7 bg-[var(--theme-accent)] shadow-sm"
                    : "w-2.5 bg-[var(--theme-border)] hover:bg-[var(--theme-muted)]"
                }`}
                title={`Go to item ${dotIdx + 1}`}
                aria-label={`Go to item ${dotIdx + 1}`}
              />
            );
          })}
        </div>

        {/* Next Button */}
        <button
          type="button"
          onClick={() => paginate(1)}
          disabled={currentIndex >= items.length - 1}
          className="w-12 h-12 rounded-full aspect-square bg-[var(--theme-card)] border border-[var(--theme-border)] text-[var(--theme-fg)] flex items-center justify-center hover:bg-[var(--theme-surface)] active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition shadow-md cursor-pointer"
          title="Next Card (→ Arrow Right or Swipe Left)"
          aria-label="Next card"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}
