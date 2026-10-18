// src/app/track/[id]/loading.jsx
import GrooveLoader from "@/Components/GrooveLoader";

export default function TrackLoading() {
  return (
    <div className="relative min-h-screen bg-[var(--theme-bg)] text-[var(--theme-fg)] p-4 pb-32 sm:p-6 md:pl-20 md:pr-20 lg:pl-40 lg:pr-40 pt-12 overflow-hidden select-none">
      {/* Ambient background glow */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-[var(--theme-plum)]/40 blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-[var(--theme-accent)]/15 blur-3xl pointer-events-none" />
      </div>

      {/* Back Button Skeleton */}
      <div className="absolute top-6 left-5 sm:top-8 sm:left-6 lg:left-16 z-20 w-11 h-11 rounded-full bg-[var(--theme-card)]/90 border border-[var(--theme-border)] animate-pulse" />

      {/* Centered Track Hero with Liquid Disc Loader */}
      <div className="relative z-10 w-full max-w-xl mx-auto flex flex-col items-center text-center px-4 mb-8 mt-4">
        {/* Cover Art Box with Liquid Disc Loader */}
        <div className="w-56 h-56 sm:w-64 sm:h-64 md:w-72 md:h-72 aspect-square rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl bg-[var(--theme-surface)] ring-1 ring-white/10 flex items-center justify-center relative">
          <GrooveLoader size={72} />
        </div>

        {/* Title skeleton */}
        <div className="mt-6 h-8 sm:h-9 w-64 max-w-[80%] rounded-full bg-white/15 animate-pulse" />

        {/* Artist skeleton */}
        <div className="mt-2.5 h-5 w-44 rounded-full bg-white/10 animate-pulse" />

        {/* Album skeleton */}
        <div className="mt-2 h-4 w-36 rounded-full bg-white/5 animate-pulse" />

        {/* Action Controls Row Skeleton */}
        <div className="mt-6 flex items-center justify-center gap-3 sm:gap-4">
          <div className="w-12 h-12 rounded-full bg-white/10 border border-white/15 animate-pulse" />
          <div className="h-12 w-44 rounded-full bg-[var(--theme-accent)]/30 animate-pulse" />
          <div className="w-12 h-12 rounded-full bg-white/10 border border-white/15 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
