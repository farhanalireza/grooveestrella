// src/Components/CardComponents/ArtistsCard.jsx
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Bookmark, BookmarkCheck, Users, Award } from "lucide-react";
import { useRouter } from "next/navigation";
import { ShareArtistComponent } from "../ArtistShareComponent";
import { toast } from "react-toastify";

export const ArtistCard = ({
    url,
    artist,
    spoURL,
    YTURL,
    popularity,
    followers,
    id,
    URI,
}) => {
    const router = useRouter();
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        const savedArtists = JSON.parse(localStorage.getItem("savedArtists")) || [];
        const isSaved = savedArtists.some(a => a.id === id);
        setSaved(isSaved);
    }, [id]);

    const toggleSave = () => {
        const savedArtists = JSON.parse(localStorage.getItem("savedArtists")) || [];

        if (saved) {
            const updated = savedArtists.filter((a) => a.id !== id);
            localStorage.setItem("savedArtists", JSON.stringify(updated));
            setSaved(false);
            toast.info(`"${artist}" removed from your library.`);
        } else {
            const newArtist = {
                id,
                title: artist,
                spoURL,
                YTURL,
                image: url,
                followers,
                popularity,
                uri: URI,
            };
            savedArtists.push(newArtist);
            localStorage.setItem("savedArtists", JSON.stringify(savedArtists));
            setSaved(true);
            toast.success(`"${artist}" saved to your library! 🎙️`);
        }
    };

    const handleSave = (e) => {
        e.stopPropagation();
        toggleSave();
    };

    const handleClick = (url) => {
        if (url) window.open(url, "_blank");
    };

    const handleCardClick = (e) => {
        if (e.target.closest(".noskip")) return;
        router.push(`/artist/${id}`);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            whileHover={{ y: -6 }}
            onClick={handleCardClick}
            className="group relative w-full sm:w-64 mx-auto bg-[#10141F]/60 backdrop-blur-xl border border-[#2563EB]/10 hover:border-[#60A5FA]/30 rounded-3xl overflow-hidden shadow-2xl transition-all duration-500 cursor-pointer flex flex-col justify-between p-4"
        >
            {/* Top Bar with Actions */}
            <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 noskip">
                <ShareArtistComponent
                    artistId={id}
                    name={artist}
                    imageUrl={url}
                    followers={followers}
                    popularity={popularity}
                    genres={[]}
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

            {/* Profile Avatar Image */}
            <div className="flex justify-center my-6">
                <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden shadow-lg bg-[#10141F] ring-4 ring-[#2563EB]/20 group-hover:ring-[#2563EB]/40 transition-all duration-500">
                    <img
                        src={url || "https://placehold.co/150x150?text=No+Image"}
                        alt={artist}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#07090F]/20 to-transparent" />
                </div>
            </div>

            {/* Artist Info & Platform redirection */}
            <div className="flex flex-col flex-grow justify-between gap-3 text-center">
                <div className="space-y-1">
                    <h2 
                        className="text-base sm:text-lg font-bold text-white truncate hover:text-[#60A5FA] transition-colors duration-200" 
                        title={artist}
                    >
                        {artist}
                    </h2>

                    <div className="flex items-center justify-center gap-1 text-[11px] text-[#8992A5]">
                        <Users size={12} className="text-[#8992A5]/70" />
                        <span>{followers?.toLocaleString() || "0"} Followers</span>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className={`flex items-center justify-center gap-1.5 text-xs font-semibold ${popularity >= 80 ? "text-emerald-400" : "text-yellow-400/80"}`}>
                        <Award size={14} />
                        <span>Popularity: {popularity}</span>
                        {popularity >= 80 && <span title="Trending">🔥</span>}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
