// src/app/loading.jsx
export default function Loading() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 animate-fade-in">
      <img
        src="/in.svg"
        alt="Loading..."
        className="w-9 h-9 animate-spin object-contain select-none pointer-events-none drop-shadow-[0_0_8px_rgba(232,168,124,0.35)] shrink-0"
      />
      <span className="text-[11px] font-bold uppercase tracking-widest text-[var(--theme-muted)] select-none">
        Loading GrooveEstrella...
      </span>
    </div>
  );
}
