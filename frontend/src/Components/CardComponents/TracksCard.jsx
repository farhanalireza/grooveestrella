// src/Components/CardComponents/TracksCard.jsx
import { ExplicitBadge } from "./ExplicitBadge";
import { ShareTrackComponent } from "./ShareTrackComponent";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Bookmark, BookmarkCheck, Award, EllipsisVertical, Share2, ListMusic } from "lucide-react";
import { SpotifyButton, YouTubeButton } from "../MusicButtons";
import { useRouter } from "next/navigation";
import GrooveCardComposer from "../GrooveCardComposer";
import Link from "next/link";
import { toast } from "react-toastify";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
} from "../ui/dropdown-menu";

export const TrackCard = ({
    url,
    title,
    artist,
    spoURL,
    popularity,
    explicit,
    trackURI,
    albumID,
    trackId,
}) => {
    const router = useRouter();
    const [saved, setSaved] = useState(false);
    const [isShareOpen, setIsShareOpen] = useState(false);

    useEffect(() => {
        const savedSongs = JSON.parse(localStorage.getItem("savedSongs")) || [];
        const isSaved = savedSongs.some(
            (song) => song.trackURI === trackURI
        );
        setSaved(isSaved);
    }, [trackURI]);

    const toggleSave = () => {
        const savedSongs = JSON.parse(localStorage.getItem("savedSongs")) || [];

        if (saved) {
            const updated = savedSongs.filter(song => song.trackURI !== trackURI);
            localStorage.setItem("savedSongs", JSON.stringify(updated));
            setSaved(false);
            toast.info(`"${title}" removed from your library.`);
        } else {
            const newSong = {
                title,
                artist,
                spoURL,
                image: url,
                popularity,
                explicit,
                trackURI,
                albumID,
                trackId,
            };
            savedSongs.push(newSong);
            localStorage.setItem("savedSongs", JSON.stringify(savedSongs));
            setSaved(true);
            toast.success(`"${title}" saved to your library! 🎶`);
        }
    };

    const handleSave = (e) => {
        e.stopPropagation();
        toggleSave();
    };

    const handleClick = (link) => {
        if (link) window.open(link, "_blank");
    };

    const handleCardClick = (e) => {
        if (e.target.closest(".noskip")) return;
        router.push(`/track/${trackId}`);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            whileHover={{ y: -8, scale: 1.02 }}
            onClick={handleCardClick}
            className="group relative w-full sm:w-64 mx-auto bg-[#10141F]/60 backdrop-blur-xl border border-[#2563EB]/10 hover:border-[#60A5FA]/30 rounded-3xl overflow-hidden shadow-2xl transition-all duration-500 cursor-pointer flex flex-col justify-between"
        >
            {/* Image Section */}
            <div className="relative aspect-square w-full overflow-hidden bg-[#10141F]">
                <img
                    src={url || "https://placehold.co/300x300?text=No+Image"}
                    alt={title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#07090F] via-[#07090F]/20 to-transparent opacity-60" />
                
                {/* Floating Bookmark Button */}
                <button
                    onClick={handleSave}
                    className={`absolute top-3 right-3 p-2.5 rounded-full backdrop-blur-md transition-all duration-300 shadow-md ${
                        saved 
                            ? "bg-[#2563EB] text-[#F4F7FF] scale-110" 
                            : "bg-[#07090F]/70 text-[#F4F7FF]/80 hover:bg-[#07090F] hover:text-[#F4F7FF]"
                    }`}
                >
                    {saved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                </button>

                {/* Explicit Badge */}
                {explicit && (
                    <div className="absolute bottom-3 left-3 z-10">
                        <ExplicitBadge />
                    </div>
                )}
            </div>

            {/* Content Section */}
            <div className="p-4 flex flex-col flex-grow justify-between gap-3">
                <div className="space-y-1">
                    <h3 
                        className="text-sm sm:text-base font-bold text-[#F4F7FF] truncate hover:text-[#60A5FA] transition-colors duration-200"
                        title={title}
                    >
                        {title}
                    </h3>
                    
                    <div className="flex flex-wrap gap-x-1 text-xs text-[#8992A5]">
                        {artist.map((a, i) => (
                            a.id ? (
                                <Link
                                    key={a.id}
                                    href={`/artist/${a.id}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="cursor-pointer hover:underline hover:text-[#F4F7FF] transition-colors duration-200"
                                    title={a.name}
                                >
                                    {a.name}{i < artist.length - 1 && ','}
                                </Link>
                            ) : (
                                <span key={i} title={a.name}>
                                    {a.name}{i < artist.length - 1 && ','}
                                </span>
                            )
                        ))}
                    </div>
                </div>

                {/* Details Footer */}
                <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs">
                        {/* Popularity Badge Pill */}
                        <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            popularity >= 80 
                                ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" 
                                : "bg-yellow-500/10 border border-yellow-500/20 text-yellow-400/80"
                        }`}>
                            <Award size={11} className="shrink-0" />
                            <span>Pop: {popularity}</span>
                            {popularity >= 80 && <span className="text-xs">🔥</span>}
                        </div>

                        {/* Actions menu */}
                        <div className="flex gap-2 noskip">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="p-1 rounded-lg hover:bg-[#2563EB]/10 text-[#8992A5] hover:text-[#F4F7FF] transition">
                                        <EllipsisVertical size={16} />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent 
                                    className="bg-[#10141F]/95 backdrop-blur-2xl text-[#F4F7FF] min-w-[160px] rounded-2xl p-2 border border-[#2563EB]/15 shadow-2xl"
                                    align="end"
                                    sideOffset={8}
                                >
                                    <DropdownMenuItem
                                        onSelect={() => {
                                            const trackToAdd = {
                                                title,
                                                artist: Array.isArray(artist) ? artist : [{ name: artist || 'Unknown Artist' }],
                                                spoURL,
                                                image: url || '',
                                                trackId: trackId,
                                                trackURI: trackURI,
                                            };
                                            window.dispatchEvent(new CustomEvent('open-playlist-picker', { detail: { track: trackToAdd } }));
                                        }}
                                        className="cursor-pointer px-3 py-2 hover:bg-[#2563EB]/10 rounded-xl transition flex items-center gap-2 text-[#60A5FA]"
                                    >
                                        <ListMusic size={14} /> Add to Playlist
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onSelect={() => setIsShareOpen(true)}
                                        className="cursor-pointer px-3 py-2 hover:bg-[#2563EB]/10 rounded-xl transition flex items-center gap-2"
                                    >
                                        <Share2 size={14} className="text-[#8992A5]" /> Create GrooveCard
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator className="my-1 bg-[#2563EB]/5" />
                                    <DropdownMenuItem
                                        onSelect={() => window.open(`https://music.apple.com/us/search?term=${encodeURIComponent(title + ' ' + artist.map(a => a.name).join(' '))}`, "_blank")}
                                        className="cursor-pointer px-3 py-2 hover:bg-[#2563EB]/10 rounded-xl transition flex items-center gap-2"
                                    >
                                        <span>Apple Music</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onSelect={() => window.open(`https://listen.tidal.com/search?q=${encodeURIComponent(title + ' ' + artist.map(a => a.name).join(' '))}`, "_blank")}
                                        className="cursor-pointer px-3 py-2 hover:bg-[#2563EB]/10 rounded-xl transition flex items-center gap-2"
                                    >
                                        <span>Tidal</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onSelect={() => window.open(`https://soundcloud.com/search?q=${encodeURIComponent(title + ' ' + artist.map(a => a.name).join(' '))}`, "_blank")}
                                        className="cursor-pointer px-3 py-2 hover:bg-[#2563EB]/10 rounded-xl transition flex items-center gap-2"
                                    >
                                        <span>SoundCloud</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </div>
            </div>

            <GrooveCardComposer
                isOpen={isShareOpen}
                onClose={() => setIsShareOpen(false)}
                itemId={trackId || trackURI?.split(':')[2]}
                title={title}
                artist={artist}
                imageUrl={url}
                popularity={popularity}
                explicit={explicit}
                type="track"
            />
        </motion.div>
    );
};