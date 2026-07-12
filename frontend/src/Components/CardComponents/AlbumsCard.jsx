// src/Components/CardComponents/AlbumsCard.jsx
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Bookmark, BookmarkCheck, Disc } from "lucide-react";
import { useRouter } from "next/navigation";
import { ShareTrackComponent } from "./ShareTrackComponent";
import { toast } from "react-toastify";

export const AlbumCard = ({
  id,
  url,
  title,
  artist,
  trackURI,
}) => {
  const router = useRouter();
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const savedAlbums = JSON.parse(localStorage.getItem("savedAlbums")) || [];
    const isSaved = savedAlbums.some(album => album.id === id);
    setSaved(isSaved);
  }, [id]);

  const toggleSave = () => {
    const savedAlbums = JSON.parse(localStorage.getItem("savedAlbums")) || [];

    if (saved) {
      const updated = savedAlbums.filter(album => album.id !== id);
      localStorage.setItem("savedAlbums", JSON.stringify(updated));
      setSaved(false);
      toast.info(`"${title}" removed from your library.`);
    } else {
      const newAlbum = {
        id,
        title,
        artist,
        image: url,
        type: "album",
        trackURI,
      };
      savedAlbums.push(newAlbum);
      localStorage.setItem("savedAlbums", JSON.stringify(savedAlbums));
      setSaved(true);
      toast.success(`"${title}" saved to your library! 💿`);
    }
  };

  const handleSave = (e) => {
    e.stopPropagation();
    toggleSave();
  };

  const handleCardClick = (e) => {
    if (e.target.closest(".noskip")) return;
    router.push(`/album/${id}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      whileHover={{ y: -6 }}
      onClick={handleCardClick}
      className="group relative w-48 sm:w-64 bg-[#10141F]/60 backdrop-blur-xl border border-[#2563EB]/10 hover:border-[#60A5FA]/30 rounded-3xl overflow-hidden shadow-2xl transition-all duration-500 cursor-pointer flex flex-col justify-between"
    >
      {/* Vinyl Disc Hover Interaction */}
      <div className="relative aspect-square w-full p-4 overflow-hidden flex items-center justify-center">
        {/* Vinyl Disc Peek */}
        <motion.div 
          className="absolute w-[80%] aspect-square rounded-full bg-[#07090F] border border-[#10141F] shadow-xl flex items-center justify-center z-0 transition-transform duration-500 group-hover:translate-x-12 group-hover:rotate-45"
        >
          <div className="w-[30%] aspect-square rounded-full border border-[#10141F] bg-[#10141F] flex items-center justify-center">
            <div className="w-[20%] aspect-square rounded-full bg-[#07090F]" />
          </div>
        </motion.div>

        {/* Cover Image */}
        <div className="relative z-10 w-full h-full rounded-2xl overflow-hidden shadow-lg bg-[#10141F]">
          <img
            src={url || "https://placehold.co/300x300?text=No+Cover"}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#07090F] via-[#07090F]/20 to-transparent opacity-60" />
        </div>

        {/* Save & Share controls over image */}
        <div className="absolute top-6 right-6 z-20 flex items-center gap-1.5 noskip">
          <ShareTrackComponent
            trackId={id}
            title={title}
            artist={artist}
            url={url}
            type="album"
          />
          <button
            onClick={handleSave}
            className={`p-2 rounded-full backdrop-blur-md transition-all duration-300 shadow-md ${
              saved 
                ? "bg-[#2563EB] text-[#F4F7FF] scale-110" 
                : "bg-[#07090F]/70 text-[#F4F7FF]/80 hover:bg-[#07090F] hover:text-[#F4F7FF]"
            }`}
          >
            {saved ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
          </button>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4 pt-1 flex flex-col justify-between flex-grow gap-2">
        <div className="space-y-1">
          <h3 
            className="text-sm sm:text-base font-bold text-white truncate hover:text-[#60A5FA] transition-colors"
            title={title}
          >
            {title}
          </h3>
          <div className="text-xs text-[#8992A5] truncate">
            {Array.isArray(artist) ? (
              artist.map((a, i) => (
                <span
                  key={a.id || i}
                  className="hover:underline hover:text-white noskip cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    a.id && router.push(`/artist/${a.id}`);
                  }}
                >
                  {a.name}{i < artist.length - 1 && ', '}
                </span>
              ))
            ) : (
              <span>Various Artists</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[10px] text-[#8992A5]/70 font-semibold uppercase tracking-wider">
          <Disc size={12} className="text-[#2563EB]" />
          <span>Album</span>
        </div>
      </div>
    </motion.div>
  );
};
