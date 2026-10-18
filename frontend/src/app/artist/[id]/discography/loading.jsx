// src/app/artist/[id]/discography/loading.jsx
import GrooveLoader from "@/Components/GrooveLoader";

export default function DiscographyLoading() {
  return (
    <div className="relative min-h-screen bg-[var(--theme-bg)] text-[var(--theme-fg)] p-4 pb-32 sm:p-6 md:pl-20 md:pr-20 lg:pl-36 lg:pr-36 pt-12 overflow-hidden select-none">
      {/* Ambient background glow */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-[var(--theme-plum)]/40 blur-3xl pointer-events-none" />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-[50vh] gap-6">
        <GrooveLoader size={72} />
        <div className="h-6 w-48 rounded-full bg-white/15 animate-pulse" />
      </div>
    </div>
  );
}
