// src/Components/CardComponents/PlaylistsCard.jsx
import { Bookmark, BookmarkCheck, User, ListMusic } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShareTrackComponent } from "./ShareTrackComponent";
import { toast } from "@/lib/toast";

export const PlaylistCard = ({
  url,
  title,
  spoURL,
  YTURL,
  owner,
  description,
  isPublic,
  trackURI,
  id,
}) => {
  const router = useRouter();
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const savedPlaylists = JSON.parse(localStorage.getItem("savedPlaylists")) || [];
    const isAlreadySaved = savedPlaylists.some(
      (p) => p.id === id || (p.trackURI === trackURI && p.title === title)
    );
    setSaved(isAlreadySaved);
  }, [title, trackURI, id]);

  const toggleSave = () => {
    const savedPlaylists = JSON.parse(localStorage.getItem("savedPlaylists")) || [];

    if (saved) {
      const updated = savedPlaylists.filter(
        (p) => !(p.id === id || (p.trackURI === trackURI && p.title === title))
      );
      localStorage.setItem("savedPlaylists", JSON.stringify(updated));
      setSaved(false);
      toast.info(`"${title}" removed from your library.`);
    } else {
      const newPlaylist = {
        title,
        owner,
        spoURL,
        YTURL,
        image: url,
        type: "playlist",
        trackURI,
        id,
      };
      savedPlaylists.push(newPlaylist);
      localStorage.setItem("savedPlaylists", JSON.stringify(savedPlaylists));
      setSaved(true);
      toast.success(`"${title}" saved to your library! 📁`);
    }
  };

  const handleSave = (e) => {
    e.stopPropagation();
    toggleSave();
  };

  const handleCardClick = () => {
    router.push(`/playlist/${id}`);
  };

  const handlePrefetch = () => {
    if (id) {
      try {
        router.prefetch(`/playlist/${id}`);
      } catch (_) {}
    }
  };

  const truncatedDesc =
    description?.length > 70 ? description.slice(0, 67) + "..." : description;

  return (
    <div
      onMouseEnter={handlePrefetch}
      onTouchStart={handlePrefetch}
      onClick={handleCardClick}
      className="group relative w-full bg-[var(--theme-card)]/90 border border-[var(--theme-border)] hover:border-[var(--theme-accent)]/50 hover:-translate-y-1 rounded-2xl sm:rounded-3xl overflow-hidden shadow-xs hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col justify-between select-none active:scale-[0.98]"
    >
      {/* Cover Image Section */}
      <div className="relative aspect-square w-full overflow-hidden bg-[var(--theme-surface)]">
        <img
          src={url || "https://placehold.co/300x300?text=No+Cover"}
          alt={title || "Untitled Playlist"}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--theme-bg)]/80 via-[var(--theme-bg)]/20 to-transparent opacity-60" />
        
        {/* Save & Share overlays */}
        <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 noskip" onClick={(e) => e.stopPropagation()}>
          <ShareTrackComponent
            trackId={id}
            title={title}
            artist={owner || 'Playlist'}
            url={url}
            type="playlist"
          />
          <button
            onClick={handleSave}
            className={`p-2 rounded-full backdrop-blur-md transition-all duration-200 shadow-md ${
              saved 
                ? "bg-[var(--theme-accent)] text-[var(--theme-bg)] scale-110" 
                : "bg-[var(--theme-surface)]/80 text-[var(--theme-muted)] hover:text-[var(--theme-fg)]"
            }`}
          >
            {saved ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
          </button>
        </div>

        {/* Public/Private Badge */}
        <div className="absolute bottom-3 left-3 z-10 flex gap-2">
          <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
            isPublic ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30"
          }`}>
            {isPublic ? "Public" : "Private"}
          </span>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-3.5 sm:p-4 flex flex-col justify-between flex-grow gap-2">
        <div className="space-y-1">
          <h3 
            className="text-sm sm:text-base font-bold text-[var(--theme-fg)] truncate group-hover:text-[var(--theme-accent)] transition-colors" 
            title={title}
          >
            {title || "Untitled Playlist"}
          </h3>
          <div className="flex items-center gap-1 text-[11px] text-[var(--theme-muted)]">
            <User size={12} className="text-[var(--theme-muted)]/70" />
            <span className="truncate">{owner ? `by ${owner}` : "Unknown Creator"}</span>
          </div>
          {truncatedDesc && (
            <p className="text-[11px] text-[var(--theme-muted)]/70 line-clamp-2 mt-1 leading-normal">{truncatedDesc}</p>
          )}
        </div>

        <div className="space-y-3 mt-1">
          <div className="flex items-center gap-1.5 text-[10px] text-[var(--theme-muted)]/80 font-semibold uppercase tracking-wider">
            <ListMusic size={12} className="text-[var(--theme-accent)]" />
            <span>Playlist</span>
          </div>
        </div>
      </div>
    </div>
  );
};
