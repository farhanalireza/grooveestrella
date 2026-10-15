// src/Components/CardComponents/AlbumsCard.jsx
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { MoreVertical, Bookmark, BookmarkCheck, Share2, Copy } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "../ui/dropdown-menu";
import { toast } from "react-toastify";

export const AlbumCard = ({
  id,
  url,
  title,
  artist,
  trackURI,
  releaseDate,
  releaseYear,
  genres = [],
  className = "",
}) => {
  const router = useRouter();
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!id) return;
    const savedAlbums = JSON.parse(localStorage.getItem("savedAlbums")) || [];
    setSaved(savedAlbums.some((a) => a.id === id));
  }, [id]);

  // Extract release year from releaseYear or releaseDate string
  let formattedYear = releaseYear || null;
  if (!formattedYear && releaseDate) {
    const match = String(releaseDate).match(/\b(\d{4})\b/);
    if (match) formattedYear = match[1];
  }

  // Extract artist name
  const artistName = Array.isArray(artist)
    ? artist.map((a) => (typeof a === "string" ? a : a.name)).filter(Boolean).join(", ")
    : (typeof artist === "string" ? artist : "");

  const subtitle = artistName && formattedYear
    ? `${artistName} • ${formattedYear}`
    : artistName || formattedYear || null;

  const handleCardClick = () => {
    if (id) router.push(`/album/${id}`);
  };

  const toggleSave = (e) => {
    e?.stopPropagation();
    const savedAlbums = JSON.parse(localStorage.getItem("savedAlbums")) || [];
    if (saved) {
      const updated = savedAlbums.filter((a) => a.id !== id);
      localStorage.setItem("savedAlbums", JSON.stringify(updated));
      setSaved(false);
      toast.info(`"${title}" removed from library.`);
    } else {
      const newAlbum = {
        id,
        title,
        artist: artistName,
        image: url,
        type: "album",
        releaseDate: releaseDate || formattedYear,
      };
      savedAlbums.push(newAlbum);
      localStorage.setItem("savedAlbums", JSON.stringify(savedAlbums));
      setSaved(true);
      toast.success(`"${title}" saved to library! 💿`);
    }
  };

  const handleCopyLink = (e) => {
    e?.stopPropagation();
    if (typeof window !== "undefined") {
      const shareUrl = `${window.location.origin}/album/${id}`;
      navigator.clipboard.writeText(shareUrl);
      toast.success("Album link copied to clipboard!");
    }
  };

  const handleShare = (e) => {
    e?.stopPropagation();
    if (typeof window !== "undefined") {
      const shareUrl = `${window.location.origin}/s/musicbrainz/album/${id}`;
      navigator.clipboard.writeText(shareUrl);
      toast.success("GrooveLink copied to clipboard!");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleCardClick}
      className={`group relative w-full bg-[#10141F]/60 backdrop-blur-xl border border-white/5 hover:border-[#E879F9]/40 rounded-2xl sm:rounded-3xl p-3 sm:p-3.5 transition-all duration-300 cursor-pointer flex flex-col gap-2.5 shadow-lg hover:shadow-2xl hover:shadow-[#870087]/20 select-none ${className}`}
    >
      {/* 100% Clear & Unobstructed Cover Art */}
      <div className="relative aspect-square w-full rounded-xl sm:rounded-2xl overflow-hidden bg-[#07090F] ring-1 ring-white/10 shadow-md">
        <img
          src={url || "https://placehold.co/400x400/10141F/C026D3?text=Album"}
          alt={title || "Album"}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            e.currentTarget.src = "https://placehold.co/400x400/10141F/C026D3?text=Album";
          }}
        />
      </div>

      {/* Details Row: Title, Artist • Year, and Three Dots Action */}
      <div className="flex items-start justify-between gap-1.5 min-w-0 px-0.5 pt-0.5">
        <div className="flex flex-col min-w-0 flex-1">
          <h3
            className="text-xs sm:text-sm font-bold text-[#F4F7FF] truncate group-hover:text-[#F0ABFC] transition-colors leading-tight"
            title={title}
          >
            {title || "Untitled Album"}
          </h3>
          {subtitle && (
            <p className="text-[11px] sm:text-xs text-[#8992A5] font-medium tracking-wide mt-1 truncate" title={subtitle}>
              {subtitle}
            </p>
          )}
        </div>

        {/* Three Dots Menu Button - Cleanly positioned beside the metadata */}
        <div 
          className="shrink-0 -mr-1 -mt-0.5"
          onClick={(e) => e.stopPropagation()}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="p-1 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer active:scale-95"
                title="Album Actions"
              >
                <MoreVertical size={15} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="bg-[#0D121F]/95 backdrop-blur-2xl border border-white/15 text-white min-w-[170px] rounded-2xl p-1.5 shadow-2xl z-[9999]"
              onClick={(e) => e.stopPropagation()}
            >
              <DropdownMenuItem
                onClick={toggleSave}
                className="cursor-pointer px-3 py-2 text-xs font-semibold rounded-xl hover:bg-[#870087]/30 hover:text-[#F0ABFC] transition flex items-center gap-2"
              >
                {saved ? <BookmarkCheck size={14} className="text-[#E879F9]" /> : <Bookmark size={14} />}
                <span>{saved ? "Remove Bookmark" : "Save to Library"}</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleShare}
                className="cursor-pointer px-3 py-2 text-xs font-semibold rounded-xl hover:bg-[#870087]/30 hover:text-[#F0ABFC] transition flex items-center gap-2"
              >
                <Share2 size={14} />
                <span>Share GrooveLink</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/10 my-1" />
              <DropdownMenuItem
                onClick={handleCopyLink}
                className="cursor-pointer px-3 py-2 text-xs font-semibold rounded-xl hover:bg-[#870087]/30 hover:text-[#F0ABFC] transition flex items-center gap-2 text-zinc-300"
              >
                <Copy size={14} />
                <span>Copy Page Link</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </motion.div>
  );
};
