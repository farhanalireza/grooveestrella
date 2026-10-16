// src/Components/CardComponents/TracksCard.jsx
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { MoreVertical, Bookmark, BookmarkCheck, Share2, Copy, ListMusic } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "../ui/dropdown-menu";
import { toast } from "react-toastify";

export const TrackCard = ({
  url,
  title,
  artist,
  album,
  albumID,
  trackId,
  id,
  className = "",
  layout = "responsive", // "responsive" | "grid" | "list"
}) => {
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const actualId = trackId || id;
  const albumTitle = album || (typeof artist === 'string' ? artist : Array.isArray(artist) ? artist.map(a => a.name).join(', ') : '') || '';
  const artistName = Array.isArray(artist) ? artist.map(a => a.name).join(', ') : (artist || '');

  useEffect(() => {
    if (!actualId) return;
    const savedSongs = JSON.parse(localStorage.getItem("savedSongs")) || [];
    setSaved(savedSongs.some((s) => s.trackId === actualId || s.id === actualId));
  }, [actualId]);

  const handleCardClick = () => {
    if (actualId) router.push(`/track/${actualId}`);
  };

  const toggleSave = (e) => {
    e?.stopPropagation();
    const savedSongs = JSON.parse(localStorage.getItem("savedSongs")) || [];
    if (saved) {
      const updated = savedSongs.filter((s) => s.trackId !== actualId && s.id !== actualId);
      localStorage.setItem("savedSongs", JSON.stringify(updated));
      setSaved(false);
      toast.info(`"${title}" removed from library.`);
    } else {
      const newSong = {
        id: actualId,
        trackId: actualId,
        title,
        artist: artistName,
        album: albumTitle,
        image: url,
        type: "track",
      };
      savedSongs.push(newSong);
      localStorage.setItem("savedSongs", JSON.stringify(savedSongs));
      setSaved(true);
      toast.success(`"${title}" saved to library! 🎶`);
    }
  };

  const handleAddToPlaylist = (e) => {
    e?.stopPropagation();
    const trackToAdd = {
      id: actualId,
      trackId: actualId,
      title,
      artist: Array.isArray(artist) ? artist : [{ name: artistName || 'Unknown Artist' }],
      album: albumTitle,
      image: url || '',
    };
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent('open-playlist-picker', { detail: { track: trackToAdd } }));
    }
  };

  const handleCopyLink = (e) => {
    e?.stopPropagation();
    if (typeof window !== "undefined") {
      const shareUrl = `${window.location.origin}/track/${actualId}`;
      navigator.clipboard.writeText(shareUrl);
      toast.success("Track link copied to clipboard!");
    }
  };

  const handleShare = (e) => {
    e?.stopPropagation();
    if (typeof window !== "undefined") {
      const shareUrl = `${window.location.origin}/track/${actualId}?groovelink=true`;
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
            className="p-1 rounded-lg hover:bg-[var(--theme-surface)] text-[var(--theme-muted)] hover:text-[var(--theme-fg)] transition-colors cursor-pointer active:scale-95"
            title="Track Actions"
          >
            <MoreVertical size={15} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="bg-[var(--theme-card)] backdrop-blur-2xl border border-[var(--theme-border)] text-[var(--theme-fg)] min-w-[175px] rounded-2xl p-1.5 shadow-2xl z-[9999]"
          onClick={(e) => e.stopPropagation()}
        >
          <DropdownMenuItem
            onClick={handleAddToPlaylist}
            className="cursor-pointer px-3 py-2 text-xs font-semibold rounded-xl hover:bg-[var(--theme-surface)] hover:text-[var(--theme-accent)] transition flex items-center gap-2 text-[var(--theme-accent)]"
          >
            <ListMusic size={14} />
            <span>Add to Playlist</span>
          </DropdownMenuItem>
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
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          whileTap={{ scale: 0.98 }}
          onClick={handleCardClick}
          className={`${isAlwaysList ? "flex" : "flex md:hidden"} items-center justify-between gap-3 p-2.5 sm:p-3 rounded-2xl bg-[var(--theme-card)]/80 backdrop-blur-xl border border-[var(--theme-border)] hover:border-[var(--theme-accent)]/40 hover:bg-[var(--theme-card)] transition-all duration-300 cursor-pointer w-full select-none shadow-md ${className}`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-[var(--theme-surface)] ring-1 ring-[var(--theme-border)] shrink-0">
              <img
                src={url || "https://placehold.co/200x200/17020B/E8A87C?text=Track"}
                alt={title || "Track"}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = "https://placehold.co/200x200/17020B/E8A87C?text=Track";
                }}
              />
            </div>
            <div className="min-w-0 flex flex-col justify-center">
              <h3 className="text-sm font-bold text-[var(--theme-fg)] truncate hover:text-[var(--theme-accent)] transition-colors" title={title}>
                {title || "Untitled Track"}
              </h3>
              {albumTitle && (
                <p className="text-xs text-[var(--theme-muted)] truncate mt-0.5" title={albumTitle}>
                  {albumTitle}
                </p>
              )}
            </div>
          </div>
          {renderDropdown()}
        </motion.div>
      )}

      {/* Desktop Grid Card (active on desktop unless layout is 'list') */}
      {!isAlwaysList && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-30px" }}
          whileHover={{ y: -4 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleCardClick}
          className={`${isAlwaysGrid ? "flex" : "hidden md:flex"} group relative w-full bg-[var(--theme-card)]/80 backdrop-blur-xl border border-[var(--theme-border)] hover:border-[var(--theme-accent)]/40 rounded-2xl sm:rounded-3xl p-3 sm:p-3.5 transition-all duration-300 cursor-pointer flex-col gap-2.5 shadow-md hover:shadow-xl select-none ${className}`}
        >
          {/* 100% Clear Cover Image */}
          <div className="relative aspect-square w-full rounded-xl sm:rounded-2xl overflow-hidden bg-[var(--theme-surface)] ring-1 ring-[var(--theme-border)] shadow-sm">
            <img
              src={url || "https://placehold.co/400x400/17020B/E8A87C?text=Track"}
              alt={title || "Track"}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              onError={(e) => {
                e.currentTarget.src = "https://placehold.co/400x400/17020B/E8A87C?text=Track";
              }}
            />
          </div>

          {/* Details & Actions Row below Cover */}
          <div className="flex items-start justify-between gap-1.5 min-w-0 px-0.5 pt-0.5">
            <div className="flex flex-col min-w-0 flex-1">
              <h3
                className="text-xs sm:text-sm font-bold text-[var(--theme-fg)] truncate group-hover:text-[var(--theme-accent)] transition-colors leading-tight"
                title={title}
              >
                {title || "Untitled Track"}
              </h3>
              {albumTitle && (
                <p className="text-[11px] sm:text-xs text-[var(--theme-muted)] truncate mt-1" title={albumTitle}>
                  {albumTitle}
                </p>
              )}
            </div>
            {renderDropdown()}
          </div>
        </motion.div>
      )}
    </>
  );
};