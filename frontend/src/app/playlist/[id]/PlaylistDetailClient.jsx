// src/app/playlist/[id]/PlaylistDetailClient.jsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bookmark, BookmarkCheck, Loader, ListMusic, User, Trash2, ChevronRight } from "lucide-react";
import { SpotifyButton, YouTubeButton } from "@/Components/MusicButtons";
import { AlbumTrackCard } from "@/Components/CardComponents/SmallTracksCard";
import { ShareTrackComponent } from "@/Components/CardComponents/ShareTrackComponent";
import { toast } from "react-toastify";

export default function PlaylistDetailClient({ id, initialPlaylist }) {
    const router = useRouter();
    const [playlist, setPlaylist] = useState(initialPlaylist);
    const [tracks, setTracks] = useState(initialPlaylist?.tracks?.items || []);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!id) return;
        const savedPlaylists = JSON.parse(localStorage.getItem("savedPlaylists")) || [];
        const isSaved = savedPlaylists.some(p => p.id === id);
        setSaved(isSaved);
    }, [id]);

    const toggleSave = () => {
        const savedPlaylists = JSON.parse(localStorage.getItem("savedPlaylists")) || [];
        if (saved) {
            const updated = savedPlaylists.filter(p => p.id !== id);
            localStorage.setItem("savedPlaylists", JSON.stringify(updated));
            setSaved(false);
            toast.info(`"${playlist.name}" removed from library.`);
        } else if (playlist) {
            const newPlaylist = {
                id: playlist.id,
                title: playlist.name,
                image: playlist.images?.[0]?.url,
                spoURL: playlist.external_urls?.spotify,
                owner: playlist.owner?.display_name,
                totalTracks: playlist.tracks?.total
            };
            savedPlaylists.push(newPlaylist);
            localStorage.setItem("savedPlaylists", JSON.stringify(savedPlaylists));
            setSaved(true);
            toast.success(`"${playlist.name}" saved to library! 📁`);
        }
    };

    const deleteCustomPlaylist = () => {
        if (!window.confirm("Are you sure you want to delete this custom playlist?")) return;
        const customPlaylists = JSON.parse(localStorage.getItem("customPlaylists") || "[]");
        const updated = customPlaylists.filter(p => p.id !== id);
        localStorage.setItem("customPlaylists", JSON.stringify(updated));
        toast.info("Playlist deleted.");
        router.push("/library");
    };

    const removeTrackFromCustomPlaylist = (trackId) => {
        const customPlaylists = JSON.parse(localStorage.getItem("customPlaylists") || "[]");
        const playlistIndex = customPlaylists.findIndex(p => p.id === id);
        if (playlistIndex === -1) return;

        const pl = customPlaylists[playlistIndex];
        pl.tracks = pl.tracks || { items: [], total: 0 };
        
        const updatedItems = pl.tracks.items.filter(item => item.track?.id !== trackId);
        pl.tracks.items = updatedItems;
        pl.tracks.total = updatedItems.length;

        // Update cover image to first track's cover (or placeholder if empty)
        if (updatedItems.length > 0) {
            const firstTrackCover = updatedItems[0].track?.album?.images?.[0]?.url;
            if (firstTrackCover) {
                pl.image = firstTrackCover;
                pl.images = [{ url: firstTrackCover }];
            }
        } else {
            pl.image = 'https://placehold.co/150x150?text=Custom+Playlist';
            pl.images = [{ url: 'https://placehold.co/150x150?text=Custom+Playlist' }];
        }

        customPlaylists[playlistIndex] = pl;
        localStorage.setItem("customPlaylists", JSON.stringify(customPlaylists));
        
        setPlaylist({ ...pl });
        setTracks(updatedItems);
        toast.success("Track removed from playlist.");
    };

    // Client-side fallback fetch / Local playlist loading
    useEffect(() => {
        if (playlist) return;

        if (id && id.startsWith('custom-')) {
            const customPlaylists = JSON.parse(localStorage.getItem("customPlaylists") || "[]");
            const localPlaylist = customPlaylists.find(p => p.id === id);
            if (localPlaylist) {
                setPlaylist(localPlaylist);
                setTracks(localPlaylist.tracks?.items || []);
            } else {
                setError(new Error("Custom playlist not found"));
            }
            return;
        }

        async function fetchPlaylistData() {
            try {
                setError(null);
                const response = await fetch(`/api/token`);
                const tokenData = await response.json();
                if (!tokenData.access_token) throw new Error("Failed to retrieve token");

                const res = await fetch(`https://api.spotify.com/v1/playlists/${id}`, {
                    headers: { Authorization: `Bearer ${tokenData.access_token}` }
                });

                if (!res.ok) throw new Error("Failed to fetch playlist details");

                const data = await res.json();
                setPlaylist(data);
                setTracks(data.tracks?.items || []);
            } catch (err) {
                console.error("Error fetching playlist data:", err);
                setError(err);
            }
        }
        fetchPlaylistData();
    }, [id, playlist]);

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-[#07090F] text-[#F4F7FF] p-6">
                <h2 className="text-2xl font-bold text-red-500 mb-2">Failed to Load Content</h2>
                <p className="text-[#8992A5] mb-6 text-center max-w-md">
                    We couldn't connect to the server. Please check your internet connection or try again later.
                </p>
                <button
                    onClick={() => window.location.reload()}
                    className="bg-[#2563EB] hover:bg-[#60A5FA] text-[#F4F7FF] font-semibold py-2 px-6 rounded-full transition duration-300 cursor-pointer"
                >
                    Retry
                </button>
            </div>
        );
    }

    if (!playlist) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-[#07090F] text-[#F4F7FF]">
                <Loader className="animate-spin w-8 h-8 mb-4 text-[#60A5FA]" />
                <span className="text-lg font-medium">Loading Playlist...</span>
            </div>
        );
    }

    const coverUrl = playlist.images?.[0]?.url || 'https://placehold.co/600x600?text=No+Cover';
    const ownerName = playlist.owner?.display_name || 'Spotify User';

    return (
        <div className="relative min-h-screen bg-[#07090F] text-[#F4F7FF] p-4 pb-32 sm:p-6 md:pl-20 md:pr-20 lg:pl-40 lg:pr-40 pt-12 overflow-hidden">
            {/* Blurry Backdrop Glow */}
            <div 
                className="absolute top-0 left-0 right-0 h-[50vh] opacity-15 blur-[120px] pointer-events-none z-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${coverUrl})` }}
            />

            {/* Back Button */}
            <button 
                onClick={() => router.push("/")}
                className="absolute top-8 left-6 lg:left-16 z-20 p-2.5 rounded-full bg-[#10141F]/70 backdrop-blur-md border border-[#2563EB]/15 text-[#F4F7FF]/80 hover:text-[#F4F7FF] hover:border-[#60A5FA]/30 transition shadow-lg cursor-pointer"
                title="Back to Home"
            >
                <ArrowLeft size={18} />
            </button>

            {/* Actions overlay */}
            <div className="absolute top-8 right-6 lg:right-16 z-20 flex items-center gap-2.5">
                <ShareTrackComponent
                    trackId={playlist.id}
                    title={playlist.name}
                    artist={ownerName}
                    url={coverUrl}
                    type="playlist"
                />
                {id.startsWith('custom-') ? (
                    <button 
                        onClick={deleteCustomPlaylist} 
                        className="p-2.5 rounded-full backdrop-blur-md bg-red-500/10 border border-red-500/25 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all duration-300 shadow-md cursor-pointer"
                        title="Delete Playlist"
                    >
                        <Trash2 size={18} />
                    </button>
                ) : (
                    <button 
                        onClick={toggleSave} 
                        className={`p-2.5 rounded-full backdrop-blur-md transition-all duration-300 shadow-md ${
                            saved 
                                ? "bg-[#2563EB] text-[#F4F7FF] scale-105" 
                                : "bg-white/[0.03] border border-[#2563EB]/15 text-[#F4F7FF] hover:bg-[#2563EB]/15"
                        }`}
                        title={saved ? "Remove Bookmark" : "Bookmark Playlist"}
                    >
                        {saved ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
                    </button>
                )}
            </div>

            {/* Playlist Info Panel Container */}
            <div className="relative z-10 mt-14 sm:mt-6 w-full bg-transparent sm:bg-[#10141F]/60 sm:backdrop-blur-xl border-0 sm:border border-transparent sm:border-[#2563EB]/10 rounded-none sm:rounded-3xl p-2 sm:p-8 flex flex-col md:flex-row items-center gap-8 sm:gap-12 sm:shadow-2xl mb-12">
                {/* Cover Image */}
                <div className="relative flex-shrink-0 w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 rounded-2xl overflow-hidden shadow-2xl bg-[#10141F] ring-1 ring-[#2563EB]/15">
                    <img src={coverUrl} alt={playlist.name} className="w-full h-full object-cover" />
                </div>

                {/* Details info */}
                <div className="flex-1 min-w-0 text-center md:text-left flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-center md:justify-start gap-2 mb-2 text-xs font-bold text-[#60A5FA] uppercase tracking-widest">
                            <ListMusic size={14} />
                            <span>Playlist Collection</span>
                        </div>
                        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold mb-3 leading-tight tracking-tight text-[#F4F7FF]">{playlist.name}</h1>
                        <div className="flex items-center justify-center md:justify-start gap-2 text-base text-[#F4F7FF]/80 mb-2">
                            <User size={16} className="text-[#8992A5]/70" />
                            <span>By {ownerName}</span>
                        </div>
                        <p className="text-xs text-[#8992A5]/70 font-medium mb-4 uppercase tracking-wider">{playlist.tracks?.total} tracks total</p>
                        
                        {playlist.description && (
                            <p className="text-sm text-[#8992A5] leading-relaxed max-w-xl mb-6" dangerouslySetInnerHTML={{ __html: playlist.description }} />
                        )}
                    </div>
                    
                    {/* GrooveLink & History Actions */}
                    <div className="border-t border-[#2563EB]/10 pt-6 w-full flex flex-col sm:flex-row items-center justify-center md:justify-start gap-3">
                        <Link 
                            href={`/s/spotify/playlist/${id}`}
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#2563EB]/20 bg-[#2563EB]/5 hover:bg-[#2563EB]/15 text-[#F4F7FF] text-xs font-bold uppercase tracking-wider transition-all duration-300"
                        >
                            <img src="/in.svg" alt="GrooveLink" className="w-4 h-4 object-contain" />
                            <span>Listen on GrooveLink</span>
                            <ChevronRight className="w-3 h-3 text-[#60A5FA]" />
                        </Link>
                        
                        <Link 
                            href={`https://history.grooveestrella.com/playlist/${id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-full border border-[#60A5FA]/20 bg-[#10141F] hover:bg-[#60A5FA]/10 text-[#F4F7FF] text-xs font-bold uppercase tracking-wider transition-all duration-300 shadow-lg shadow-[#2563EB]/5"
                        >
                            <span>Explore its history, legacy and cultural impact →</span>
                            <span className="text-[10px] text-[#8992A5] font-normal border-l border-[#8992A5]/30 pl-2">Read on NEW PROJECT</span>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Tracks list */}
            <div className="relative z-10 border-t border-[#2563EB]/10 pt-8 mb-12">
                <h2 className="text-xl sm:text-2xl font-extrabold mb-6 flex items-center gap-2">
                    <span>Playlist Tracks</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/[0.03] text-[#8992A5] border border-[#2563EB]/10">{tracks.length}</span>
                </h2>
                <div className="flex flex-col gap-2.5">
                    {tracks.map((item, index) => {
                        if (!item || !item.track) return null;
                        return (
                            <div key={`${item.track.id}-${index}`} className="flex items-center gap-3">
                                <div className="flex-1 min-w-0">
                                    <AlbumTrackCard
                                        title={item.track.name}
                                        artist={item.track.artists}
                                        spoURL={item.track.external_urls?.spotify}
                                        YTURL={`https://www.youtube.com/results?search_query=${encodeURIComponent(item.track.name + ' ' + item.track.artists.map(a => a.name).join(' '))}`}
                                        trackURI={playlist.uri}
                                        pos={index}
                                        trackID={item.track.id}
                                        coverImage={item.track.album?.images?.[0]?.url}
                                    />
                                </div>
                                {id.startsWith('custom-') && (
                                    <button
                                        onClick={() => removeTrackFromCustomPlaylist(item.track.id)}
                                        className="p-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-2xl transition duration-200 cursor-pointer flex-shrink-0"
                                        title="Remove from Playlist"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
