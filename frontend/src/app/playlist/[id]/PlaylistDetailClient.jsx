// src/app/playlist/[id]/PlaylistDetailClient.jsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bookmark, BookmarkCheck, ListMusic, User, Trash2, ChevronRight } from "lucide-react";
import { SpotifyButton, YouTubeButton } from "@/Components/MusicButtons";
import { AlbumTrackCard } from "@/Components/CardComponents/SmallTracksCard";
import { ShareTrackComponent } from "@/Components/CardComponents/ShareTrackComponent";
import GrooveLinkModal from "@/Components/GrooveLinkModal";
import GrooveLoader from "@/Components/GrooveLoader";
import { toast } from "react-toastify";

export default function PlaylistDetailClient({ id, initialPlaylist }) {
    const router = useRouter();
    const [playlist, setPlaylist] = useState(initialPlaylist);
    const [tracks, setTracks] = useState(initialPlaylist?.tracks?.items || []);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState(null);
    const [isGrooveLinkOpen, setIsGrooveLinkOpen] = useState(false);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            if (params.get("groovelink") === "true") {
                setIsGrooveLinkOpen(true);
            }
        }
    }, [id]);

    useEffect(() => {
        const handleOpen = () => setIsGrooveLinkOpen(true);
        window.addEventListener("open-groovelink", handleOpen);
        return () => window.removeEventListener("open-groovelink", handleOpen);
    }, []);

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
            <div className="flex flex-col items-center justify-center min-h-screen bg-[var(--theme-bg)] text-[var(--theme-fg)] p-6">
                <h2 className="text-2xl font-bold text-red-500 mb-2">Failed to Load Content</h2>
                <p className="text-[var(--theme-muted)] mb-6 text-center max-w-md">
                    We couldn't connect to the server. Please check your internet connection or try again later.
                </p>
                <button
                    onClick={() => window.location.reload()}
                    className="bg-[var(--theme-accent-bg)] hover:opacity-90 text-[var(--theme-accent-fg)] font-bold py-2 px-6 rounded-full transition duration-300 cursor-pointer shadow-md"
                >
                    Retry
                </button>
            </div>
        );
    }

    if (!playlist) {
        return (
            <GrooveLoader fullScreen={true} text="Loading Playlist..." />
        );
    }

    const coverUrl = playlist.images?.[0]?.url || 'https://placehold.co/600x600?text=No+Cover';
    const ownerName = playlist.owner?.display_name || 'Spotify User';

    return (
        <div className="relative min-h-screen bg-[var(--theme-bg)] text-[var(--theme-fg)] p-4 pb-32 sm:p-6 md:pl-20 md:pr-20 lg:pl-40 lg:pr-40 pt-12 overflow-hidden">
            {/* Ambient Artwork Backdrop Layer */}
            <div className="absolute top-0 left-0 right-0 h-[650px] overflow-hidden pointer-events-none z-0">
                <div 
                    className="w-full h-full bg-cover bg-center scale-110 blur-2xl opacity-80 dark:opacity-65 saturate-150 contrast-110 transform-gpu"
                    style={{ backgroundImage: `url(${coverUrl})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--theme-bg)] via-[var(--theme-bg)]/50 to-black/25" />
            </div>

            {/* Back Button */}
            <button 
                onClick={() => router.push("/")}
                className="absolute top-8 left-6 lg:left-16 z-20 p-2.5 rounded-full bg-[var(--theme-card)]/80 backdrop-blur-md border border-[var(--theme-border)] text-[var(--theme-fg)] hover:border-[var(--theme-accent)]/40 transition shadow-md cursor-pointer"
                title="Back to Home"
            >
                <ArrowLeft size={18} />
            </button>

            {/* Actions overlay */}
            <div className="absolute top-8 right-6 lg:right-16 z-20 flex items-center gap-2.5">
                <button
                    onClick={() => setIsGrooveLinkOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-[var(--theme-card)]/90 backdrop-blur-md border border-[var(--theme-border)] text-[var(--theme-fg)] hover:border-[var(--theme-accent)] hover:text-[var(--theme-accent)] transition-all duration-300 shadow-md cursor-pointer hover:scale-105 active:scale-95 text-xs font-bold"
                    title="Open GrooveLink"
                >
                    <img src="/in.svg" alt="GrooveLink" className="w-4 h-4 object-contain" />
                    <span className="hidden sm:inline">GrooveLink</span>
                </button>
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
                        className={`p-2.5 rounded-full backdrop-blur-md transition-all duration-300 shadow-md cursor-pointer ${
                            saved 
                                ? "bg-[var(--theme-accent-bg)] text-[var(--theme-accent-fg)] scale-105" 
                                : "bg-[var(--theme-surface)]/80 border border-[var(--theme-border)] text-[var(--theme-fg)] hover:bg-[var(--theme-card)]"
                        }`}
                        title={saved ? "Remove Bookmark" : "Bookmark Playlist"}
                    >
                        {saved ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
                    </button>
                )}
            </div>

            {/* Playlist Info Panel Container */}
            <div className="relative z-10 mt-14 sm:mt-6 w-full bg-[var(--theme-card)]/80 backdrop-blur-xl border border-[var(--theme-border)] rounded-2xl sm:rounded-3xl p-4 sm:p-8 flex flex-col md:flex-row items-center gap-8 sm:gap-12 shadow-xl mb-12">
                {/* Cover Image */}
                <div className="relative flex-shrink-0 w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 rounded-2xl overflow-hidden shadow-xl bg-[var(--theme-surface)] ring-1 ring-[var(--theme-border)]">
                    <img src={coverUrl} alt={playlist.name} className="w-full h-full object-cover" />
                </div>

                {/* Details info */}
                <div className="flex-1 min-w-0 text-center md:text-left flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[var(--theme-border)] bg-[var(--theme-surface)] text-[var(--theme-accent)] text-[10px] font-bold tracking-widest uppercase">
                                <ListMusic size={12} />
                                <span>Playlist Collection</span>
                            </span>
                        </div>
                        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold mb-3 leading-tight tracking-tight text-[var(--theme-fg)]">{playlist.name}</h1>
                        <div className="flex items-center justify-center md:justify-start gap-2 text-base text-[var(--theme-muted)] mb-2">
                            <User size={16} className="text-[var(--theme-muted)]/70" />
                            <span>By {ownerName}</span>
                        </div>
                        <p className="text-xs text-[var(--theme-muted)]/80 font-medium mb-4 uppercase tracking-wider">{playlist.tracks?.total} tracks total</p>
                        
                        {playlist.description && (
                            <p className="text-sm text-[var(--theme-muted)] leading-relaxed max-w-xl mb-6" dangerouslySetInnerHTML={{ __html: playlist.description }} />
                        )}
                    </div>
                    
                    {/* GrooveLink & History Actions */}
                    <div className="border-t border-[var(--theme-border)] pt-6 w-full flex flex-col sm:flex-row items-center justify-center md:justify-start gap-3">
                        <button 
                            onClick={() => setIsGrooveLinkOpen(true)}
                            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full border border-[var(--theme-border)] bg-[var(--theme-surface)] hover:bg-[var(--theme-card)] text-[var(--theme-fg)] text-xs font-bold uppercase tracking-wider transition-all duration-300 shadow-sm cursor-pointer hover:border-[var(--theme-accent)]"
                        >
                            <img src="/in.svg" alt="GrooveLink" className="w-4 h-4 object-contain" />
                            <span>Open in GrooveLink</span>
                            <ChevronRight className="w-3 h-3 text-[var(--theme-accent)]" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Tracks list */}
            <div className="relative z-10 border-t border-[var(--theme-border)] pt-8 mb-12">
                <h2 className="text-xl sm:text-2xl font-extrabold mb-6 flex items-center gap-2 text-[var(--theme-fg)]">
                    <span>Playlist Tracks</span>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[var(--theme-surface)] text-[var(--theme-muted)] border border-[var(--theme-border)]">{tracks.length}</span>
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

            {/* GrooveLink Modal */}
            <GrooveLinkModal
                isOpen={isGrooveLinkOpen}
                onClose={() => setIsGrooveLinkOpen(false)}
                item={{
                    id: playlist.id || id,
                    type: "playlist",
                    name: playlist.name,
                    title: playlist.name,
                    artist: ownerName,
                    imageUrl: coverUrl,
                    coverArt: coverUrl,
                    popularity: 80,
                    explicit: false,
                    genres: [],
                    externalLinks: [],
                    spotifyUrl: playlist.external_urls?.spotify
                }}
            />
        </div>
    );
}
