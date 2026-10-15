// src/Components/CardComponents/ArtistsCard.jsx
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
  const artistName = artist || title || "Artist";

  useEffect(() => {
    if (!id) return;
    const savedArtists = JSON.parse(localStorage.getItem("savedArtists")) || [];
    setSaved(savedArtists.some((a) => a.id === id));
  }, [id]);

  const handleCardClick = () => {
    if (id) router.push(`/artist/${id}`);
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
      const shareUrl = `${window.location.origin}/s/musicbrainz/artist/${id}`;
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
            className="p-1 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer active:scale-95"
            title="Artist Actions"
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
          className={`${isAlwaysList ? "flex" : "flex md:hidden"} items-center justify-between gap-3 p-2.5 sm:p-3 rounded-2xl bg-[#10141F]/60 backdrop-blur-xl border border-white/5 hover:border-[#E879F9]/40 hover:bg-white/[0.04] transition-all duration-300 cursor-pointer w-full select-none shadow-md ${className}`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative w-12 h-12 rounded-full overflow-hidden bg-[#07090F] ring-1 ring-white/10 shrink-0">
              <img
                src={url || "https://placehold.co/200x200/10141F/C026D3?text=Artist"}
                alt={artistName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = "https://placehold.co/200x200/10141F/C026D3?text=Artist";
                }}
              />
            </div>
            <h3 className="text-sm font-bold text-[#F4F7FF] truncate hover:text-[#F0ABFC] transition-colors" title={artistName}>
              {artistName}
            </h3>
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
          className={`${isAlwaysGrid ? "flex" : "hidden md:flex"} group relative w-full bg-[#10141F]/60 backdrop-blur-xl border border-white/5 hover:border-[#E879F9]/40 rounded-2xl sm:rounded-3xl p-4 sm:p-5 transition-all duration-300 cursor-pointer flex-col items-center justify-center gap-3 shadow-lg hover:shadow-2xl hover:shadow-[#870087]/20 select-none ${className}`}
        >
          {/* 100% Clear Avatar Photo */}
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden bg-[#07090F] ring-2 ring-white/10 group-hover:ring-[#E879F9]/50 shadow-lg transition-all duration-500">
            <img
              src={url || "https://placehold.co/300x300/10141F/C026D3?text=Artist"}
              alt={artistName}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              onError={(e) => {
                e.currentTarget.src = "https://placehold.co/300x300/10141F/C026D3?text=Artist";
              }}
            />
          </div>

          {/* Name & Actions Row below Avatar */}
          <div className="w-full flex items-center justify-between gap-1 px-1 pt-1">
            <h3
              className="text-xs sm:text-sm font-bold text-[#F4F7FF] truncate group-hover:text-[#F0ABFC] transition-colors flex-1 text-center"
              title={artistName}
            >
              {artistName}
            </h3>
            {renderDropdown()}
          </div>
        </motion.div>
      )}
    </>
  );
};
