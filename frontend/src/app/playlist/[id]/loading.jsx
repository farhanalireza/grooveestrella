// src/app/playlist/[id]/loading.jsx
import GrooveLoader from "@/Components/GrooveLoader";

export default function PlaylistLoading() {
  return (
    <div className="relative min-h-screen bg-[var(--theme-bg)] text-[var(--theme-fg)] p-4 pb-32 sm:p-6 md:pl-20 md:pr-20 lg:pl-40 lg:pr-40 pt-12 overflow-hidden select-none">
      {/* Ambient background glow */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-[var(--theme-plum)]/40 blur-3xl pointer-events-none" />
      </div>

      {/* Back Button Skeleton */}
      <div className="absolute top-8 left-6 lg:left-16 z-20 w-11 h-11 rounded-full bg-[var(--theme-card)]/80 border border-[var(--theme-border)] animate-pulse" />

      {/* Hero with Liquid Disc Loader */}
      <div className="relative z-10 flex flex-col items-center text-center mt-6 mb-10">
        <div className="w-56 h-56 sm:w-64 sm:h-64 aspect-square rounded-2xl overflow-hidden shadow-2xl bg-[var(--theme-surface)] ring-1 ring-white/10 flex items-center justify-center relative">
          <GrooveLoader size={72} />
        </div>
        <div className="mt-6 h-8 w-60 rounded-full bg-white/15 animate-pulse" />
        <div className="mt-2 h-4 w-36 rounded-full bg-white/10 animate-pulse" />
      </div>
    </div>
  );
}
