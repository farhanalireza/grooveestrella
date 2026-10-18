// src/app/album/[id]/loading.jsx
import GrooveLoader from "@/Components/GrooveLoader";

export default function AlbumLoading() {
  return (
    <div className="relative min-h-screen bg-[var(--theme-bg)] text-[var(--theme-fg)] p-4 pb-32 sm:p-6 md:pl-20 md:pr-20 lg:pl-40 lg:pr-40 pt-5 sm:pt-8 overflow-hidden select-none">
      {/* Ambient background glow */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-[var(--theme-plum)]/40 blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-[var(--theme-accent)]/15 blur-3xl pointer-events-none" />
      </div>

      {/* Mobile Top Bar Skeleton */}
      <header className="sm:hidden relative z-20 w-full max-w-xs mx-auto flex items-center justify-between px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl mb-6">
        <div className="w-9 h-9 rounded-full bg-white/10 animate-pulse" />
        <div className="flex items-center gap-1.5">
          <img src="/in.svg" alt="GrooveEstrella" className="w-5 h-5 object-contain opacity-50" />
          <span className="text-xs font-bold text-white/50 font-display">GrooveEstrella</span>
        </div>
        <div className="w-9 h-9 rounded-full bg-white/10 animate-pulse" />
      </header>

      {/* Desktop Top Nav Skeleton */}
      <header className="hidden sm:flex relative z-20 w-full items-center justify-between mb-8 px-2 md:px-6">
        <div className="w-11 h-11 rounded-full bg-black/35 backdrop-blur-md border border-white/15 animate-pulse" />
        <div className="w-11 h-11 rounded-full bg-black/35 backdrop-blur-md border border-white/15 animate-pulse" />
      </header>

      {/* Centered Hero Skeleton with Enlarged Liquid Disc Loader */}
      <div className="relative z-10 w-full max-w-xl mx-auto flex flex-col items-center text-center px-4 mb-8">
        {/* Cover Art Box with Enlarged Liquid Disc Loader */}
        <div className="w-56 h-56 sm:w-64 sm:h-64 md:w-72 md:h-72 aspect-square rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl bg-[var(--theme-surface)] ring-1 ring-white/10 flex items-center justify-center relative">
          <GrooveLoader size={72} />
        </div>

        {/* Title skeleton */}
        <div className="mt-5 sm:mt-6 h-8 sm:h-9 w-64 max-w-[80%] rounded-full bg-white/15 animate-pulse" />

        {/* Artist skeleton */}
        <div className="mt-2.5 h-5 w-40 rounded-full bg-white/10 animate-pulse" />

        {/* Subtitle skeleton */}
        <div className="mt-2 h-4 w-28 rounded-full bg-white/5 animate-pulse" />

        {/* Action Controls Row Skeleton */}
        <div className="mt-6 flex items-center justify-center gap-3 sm:gap-4">
          <div className="w-12 h-12 rounded-full bg-white/10 border border-white/15 animate-pulse" />
          <div className="h-12 w-44 rounded-full bg-[var(--theme-accent)]/30 animate-pulse" />
          <div className="w-12 h-12 rounded-full bg-white/10 border border-white/15 animate-pulse" />
        </div>
      </div>

      {/* Tracks Section Skeleton */}
      <div className="relative z-10 border-t border-[var(--theme-border)] pt-8 max-w-4xl mx-auto space-y-4">
        {/* Disc Header Skeleton */}
        <div className="flex items-center justify-between px-1 pb-2 border-b border-white/10">
          <div className="h-5 w-20 rounded-full bg-white/15 animate-pulse" />
          <div className="h-4 w-28 rounded-full bg-white/10 animate-pulse" />
        </div>

        {/* Track Rows Shimmer */}
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center justify-between py-3 px-3 rounded-xl bg-white/[0.02] border border-white/5 animate-pulse">
              <div className="flex items-center gap-4 flex-1">
                <span className="w-6 text-center text-xs font-semibold text-white/30">{i + 1}</span>
                <div className="space-y-1.5 flex-1">
                  <div className="h-4 rounded-full bg-white/15" style={{ width: `${60 - (i % 3) * 15}%` }} />
                  <div className="h-3 w-32 rounded-full bg-white/5" />
                </div>
              </div>
              <div className="h-3 w-10 rounded-full bg-white/10 shrink-0 ml-4" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
