// src/Components/CardComponents/ArtistsCard.jsx
"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MoreVertical, Bookmark, BookmarkCheck, Share2, Copy } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "../ui/dropdown-menu";
import { toast } from "@/lib/toast";

export const ArtistCard = ({
  url,
  artist,
  title,
  id,
  className = "",
  layout = "responsive", // "responsive" | "grid" | "list"
}) => {
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();
  const artistName = artist || title || "Artist";

  useEffect(() => {
    if (!id) return;
    const savedArtists = JSON.parse(localStorage.getItem("savedArtists")) || [];
    setSaved(savedArtists.some((a) => a.id === id));
  }, [id]);

  const handleCardClick = () => {
    if (id && !isPending) {
      startTransition(() => {
        router.push(`/artist/${id}`);
      });
    }
  };

  const handlePrefetch = () => {
    if (id) {
      try {
        router.prefetch(`/artist/${id}`);
      } catch (_) {}
    }
  };

  const toggleSave = (e) => {
    e?.stopPropagation();
    const savedArtists = JSON.parse(localStorage.getItem("savedArtists")) || [];
    if (saved) {
      const updated = savedArtists.filter((a) => a.id !== id);
      localStorage.setItem("savedArtists", JSON.stringify(updated));
      setSaved(false);
      toast.info(`"${artistName}" removed from library.`);
    } else {
      const newArtist = {
        id,
        title: artistName,
        artist: artistName,
        image: url,
        type: "artist",
      };
      savedArtists.push(newArtist);
      localStorage.setItem("savedArtists", JSON.stringify(savedArtists));
      setSaved(true);
      toast.success(`"${artistName}" saved to library! 🎙️`);
    }
  };

  const handleCopyLink = (e) => {
    e?.stopPropagation();
    if (typeof window !== "undefined") {
      const shareUrl = `${window.location.origin}/artist/${id}`;
      navigator.clipboard.writeText(shareUrl);
      toast.success("Artist link copied to clipboard!");
    }
  };

  const handleShare = (e) => {
    e?.stopPropagation();
    if (typeof window !== "undefined") {
      const shareUrl = `${window.location.origin}/artist/${id}?groovelink=true`;
      navigator.clipboard.writeText(shareUrl);
      toast.success("GrooveLink copied to clipboard!");
    }
  };

  const isAlwaysGrid = layout === "grid";
  const isAlwaysList = layout === "list";

  const renderDropdown = () => (
    <div 
      className="shrink-0"
      onClick={(e) => e.stopPropagation()}
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="p-1.5 rounded-lg hover:bg-[var(--theme-surface)] text-[var(--theme-muted)] hover:text-[var(--theme-fg)] transition-colors cursor-pointer active:scale-95"
            title="Artist Actions"
          >
            <MoreVertical size={15} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="bg-[var(--theme-card)] backdrop-blur-2xl border border-[var(--theme-border)] text-[var(--theme-fg)] min-w-[170px] rounded-2xl p-1.5 shadow-2xl z-[9999]"
          onClick={(e) => e.stopPropagation()}
        >
          <DropdownMenuItem
            onClick={toggleSave}
            className="cursor-pointer px-3 py-2 text-xs font-semibold rounded-xl hover:bg-[var(--theme-surface)] hover:text-[var(--theme-accent)] transition flex items-center gap-2"
          >
            {saved ? <BookmarkCheck size={14} className="text-[var(--theme-accent)]" /> : <Bookmark size={14} />}
            <span>{saved ? "Remove Bookmark" : "Save to Library"}</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleShare}
            className="cursor-pointer px-3 py-2 text-xs font-semibold rounded-xl hover:bg-[var(--theme-surface)] hover:text-[var(--theme-accent)] transition flex items-center gap-2"
          >
            <Share2 size={14} />
            <span>Share GrooveLink</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-[var(--theme-border)] my-1" />
          <DropdownMenuItem
            onClick={handleCopyLink}
            className="cursor-pointer px-3 py-2 text-xs font-semibold rounded-xl hover:bg-[var(--theme-surface)] hover:text-[var(--theme-accent)] transition flex items-center gap-2 text-[var(--theme-muted)]"
          >
            <Copy size={14} />
            <span>Copy Page Link</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  return (
    <>
      {/* Mobile List Row (active on mobile unless layout is 'grid') */}
      {!isAlwaysGrid && (
        <div
          onMouseEnter={handlePrefetch}
          onTouchStart={handlePrefetch}
          onClick={handleCardClick}
          className={`${isAlwaysList ? "flex" : "flex md:hidden"} items-center justify-between gap-3 p-2.5 sm:p-3 rounded-2xl bg-[var(--theme-card)]/90 border border-[var(--theme-border)] hover:border-[var(--theme-accent)]/50 hover:bg-[var(--theme-card)] transition-all duration-200 active:scale-[0.98] w-full select-none shadow-xs hover:shadow-md ${isPending ? 'opacity-70 pointer-events-none cursor-wait' : 'cursor-pointer'} ${className}`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative w-12 h-12 rounded-full overflow-hidden bg-[var(--theme-surface)] ring-1 ring-[var(--theme-border)] shrink-0">
              <img
                src={url || "https://placehold.co/200x200/17020B/E8A87C?text=Artist"}
                alt={artistName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = "https://placehold.co/200x200/17020B/E8A87C?text=Artist";
                }}
              />
              {isPending && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center animate-fade-in">
                  <div className="w-5 h-5 rounded-full border-2 border-[var(--theme-accent)] border-t-transparent animate-spin" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex flex-col justify-center">
              <h3 className="text-sm font-bold text-[var(--theme-fg)] truncate hover:text-[var(--theme-accent)] transition-colors" title={artistName}>
                {artistName}
              </h3>
              <p className="text-xs text-[var(--theme-muted)] truncate mt-0.5">
                Artist
              </p>
            </div>
          </div>
          {renderDropdown()}
        </div>
      )}

      {/* Desktop Grid Card (active on desktop unless layout is 'list') */}
      {!isAlwaysList && (
        <div
          onMouseEnter={handlePrefetch}
          onTouchStart={handlePrefetch}
          onClick={handleCardClick}
          className={`${isAlwaysGrid ? "flex" : "hidden md:flex"} group relative w-full bg-[var(--theme-card)]/90 border border-[var(--theme-border)] hover:border-[var(--theme-accent)]/50 hover:-translate-y-1 rounded-2xl sm:rounded-3xl p-3 sm:p-3.5 transition-all duration-200 flex-col items-center text-center gap-2.5 shadow-xs hover:shadow-lg active:scale-[0.98] select-none ${isPending ? 'opacity-70 scale-[0.98] pointer-events-none cursor-wait' : 'cursor-pointer'} ${className}`}
        >
          {/* Circular Artist Image */}
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden bg-[var(--theme-surface)] ring-2 ring-[var(--theme-border)] group-hover:ring-[var(--theme-accent)]/60 shadow-xs transition-all duration-300">
            <img
              src={url || "https://placehold.co/400x400/17020B/E8A87C?text=Artist"}
              alt={artistName}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              onError={(e) => {
                e.currentTarget.src = "https://placehold.co/400x400/17020B/E8A87C?text=Artist";
              }}
            />
            {isPending && (
              <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px] flex items-center justify-center animate-fade-in">
                <div className="w-8 h-8 rounded-full border-2 border-[var(--theme-accent)] border-t-transparent animate-spin" />
              </div>
            )}
          </div>

          {/* Details & Actions Row below Image */}
          <div className="flex items-center justify-between w-full min-w-0 px-1 pt-0.5">
            <div className="flex flex-col min-w-0 flex-1 text-center">
              <h3
                className="text-xs sm:text-sm font-bold text-[var(--theme-fg)] truncate group-hover:text-[var(--theme-accent)] transition-colors leading-tight"
                title={artistName}
              >
                {artistName}
              </h3>
              <p className="text-[11px] sm:text-xs text-[var(--theme-muted)] truncate mt-0.5 font-medium">
                Artist
              </p>
            </div>
            {renderDropdown()}
          </div>
        </div>
      )}
    </>
  );
};
