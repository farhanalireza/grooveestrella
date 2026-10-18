// src/app/artist/[id]/loading.jsx
import GrooveLoader from "@/Components/GrooveLoader";

export default function ArtistLoading() {
  return (
    <div className="relative min-h-screen bg-[var(--theme-bg)] text-[var(--theme-fg)] p-4 pb-32 sm:p-6 md:pl-20 md:pr-20 lg:pl-40 lg:pr-40 pt-12 overflow-hidden select-none">
      {/* Ambient background glow */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-[var(--theme-plum)]/40 blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-[var(--theme-accent)]/15 blur-3xl pointer-events-none" />
      </div>

      {/* Back Button Skeleton */}
      <div className="absolute top-6 left-5 sm:top-8 sm:left-6 lg:left-16 z-20 w-11 h-11 rounded-full bg-[var(--theme-card)]/90 border border-[var(--theme-border)] animate-pulse" />

      {/* Header Hero with Liquid Disc Loader */}
      <div className="relative z-10 flex flex-col items-center text-center mt-6 mb-10">
        {/* Round Avatar with Liquid Disc Loader */}
        <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full overflow-hidden shadow-2xl bg-[var(--theme-surface)] border-2 border-white/15 flex items-center justify-center relative">
          <GrooveLoader size={64} />
        </div>

        {/* Artist Name Skeleton */}
        <div className="mt-5 h-8 sm:h-9 w-60 rounded-full bg-white/15 animate-pulse" />

        {/* Tags Skeleton */}
        <div className="mt-3 flex items-center justify-center gap-2">
          <div className="h-6 w-20 rounded-full bg-white/10 animate-pulse" />
          <div className="h-6 w-24 rounded-full bg-white/10 animate-pulse" />
          <div className="h-6 w-16 rounded-full bg-white/10 animate-pulse" />
        </div>
      </div>

      {/* Top Songs Skeleton */}
      <div className="relative z-10 max-w-4xl mx-auto mb-10 space-y-3">
        <div className="h-6 w-32 rounded-full bg-white/15 animate-pulse" />
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-white/[0.02] border border-white/5 animate-pulse">
              <div className="flex items-center gap-4 flex-1">
                <div className="w-10 h-10 rounded-lg bg-white/10 shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-4 rounded-full bg-white/15" style={{ width: `${55 - (i % 3) * 12}%` }} />
                  <div className="h-3 w-28 rounded-full bg-white/5" />
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
