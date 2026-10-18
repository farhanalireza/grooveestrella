// src/app/playlist/[id]/PlaylistDetailClient.jsx
"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
    ArrowLeft, 
    Share2, 
    Plus, 
    Check, 
    Trash2, 
    ChevronRight, 
    MoreHorizontal, 
    Play, 
    Sparkles, 
    FolderDown, 
    ListPlus, 
    Copy, 
    ListMusic, 
    User,
    Bookmark,
    BookmarkCheck
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
} from "@/Components/ui/dropdown-menu";
import GrooveLinkModal from "@/Components/GrooveLinkModal";
import GrooveCardComposer from "@/Components/GrooveCardComposer";
import ExportPlaylistModal from "@/Components/ExportPlaylistModal";
import AddTrackToPlaylistModal from "@/Components/AddTrackToPlaylistModal";
import PlaylistCover, { extractPlaylistCovers } from "@/Components/PlaylistCover";
import GrooveLoader from "@/Components/GrooveLoader";
import { toast } from "@/lib/toast";

export default function PlaylistDetailClient({ id, initialPlaylist }) {
    const router = useRouter();
    const [playlist, setPlaylist] = useState(initialPlaylist);
    const [tracks, setTracks] = useState(initialPlaylist?.tracks?.items || []);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState(null);
    const [expandedHeroDesc, setExpandedHeroDesc] = useState(false);

    // Modals state
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [isAddTrackModalOpen, setIsAddTrackModalOpen] = useState(false);
    const [selectedTrackForGrooveLink, setSelectedTrackForGrooveLink] = useState(null);
    const [selectedTrackForGrooveCard, setSelectedTrackForGrooveCard] = useState(null);

    const isCustom = Boolean(id && id.startsWith('custom-'));

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
            toast.info(`"${playlist?.name || 'Playlist'}" removed from library.`);
        } else if (playlist) {
            const newPlaylist = {
                id: playlist.id || id,
                title: playlist.name,
                image: playlist.images?.[0]?.url || playlist.image,
                spoURL: playlist.external_urls?.spotify,
                owner: playlist.owner?.display_name || playlist.owner,
                totalTracks: playlist.tracks?.total || tracks.length
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
        
        const updatedItems = pl.tracks.items.filter(item => {
            const t = item?.track || item;
            return (t.id || t.trackID || t.trackId) !== trackId;
        });
        pl.tracks.items = updatedItems;
        pl.tracks.total = updatedItems.length;

        // Recompute cover based on remaining tracks
        const remainingCovers = extractPlaylistCovers(updatedItems);
        if (remainingCovers.length > 0) {
            pl.image = remainingCovers[0];
            pl.images = [{ url: remainingCovers[0] }];
        } else {
            pl.image = "";
            pl.images = [];
        }

        customPlaylists[playlistIndex] = pl;
        localStorage.setItem("customPlaylists", JSON.stringify(customPlaylists));
        
        setPlaylist({ ...pl });
        setTracks(updatedItems);
        toast.success("Track removed from playlist.");
    };

    // Client-side fallback fetch / Local playlist loading
    useEffect(() => {
        if (playlist && tracks.length > 0) return;

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
    }, [id, playlist, tracks.length]);

    const handleBack = () => {
        if (typeof window !== "undefined" && window.history.length > 1) {
            router.back();
        } else {
            router.push("/");
        }
    };

    const handleNativeShare = async () => {
        const shareTitle = `${playlist?.name || 'Playlist'} on GrooveEstrella`;
        const shareText = `Explore "${playlist?.name || 'Playlist'}" on GrooveEstrella! 🎧`;
        const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

        if (typeof navigator !== 'undefined' && navigator.share) {
            try {
                await navigator.share({
                    title: shareTitle,
                    text: shareText,
                    url: shareUrl,
                });
                return;
            } catch (err) {
                if (err.name === 'AbortError') return;
            }
        }

        if (typeof navigator !== 'undefined' && navigator.clipboard) {
            try {
                await navigator.clipboard.writeText(`${shareTitle}\n${shareUrl}`);
                toast.success('Playlist link copied to clipboard! 📋');
            } catch (_) {
                toast.info(shareUrl);
            }
        } else {
            toast.info(shareUrl);
        }
    };

    // Calculate total duration
    const totalDurationMs = useMemo(() => {
        return tracks.reduce((acc, item) => {
            const t = item?.track || item;
            return acc + (t?.duration_ms || t?.durationMs || t?.duration || 0);
        }, 0);
    }, [tracks]);

    function formatTotalDuration(ms) {
        if (!ms) return null;
        const totalMinutes = Math.floor(ms / 60000);
        const hours = Math.floor(totalMinutes / 60);
        const mins = totalMinutes % 60;
        if (hours > 0) return `${hours} hr ${mins} min`;
        return `${mins} min`;
    }
    const formattedTotalTime = formatTotalDuration(totalDurationMs);

    function formatMs(ms) {
        if (!ms || typeof ms !== 'number') return null;
        const mins = Math.floor(ms / 60000);
        const secs = Math.floor((ms % 60000) / 1000).toString().padStart(2, '0');
        return `${mins}:${secs}`;
    }

    // Dynamic covers for ambient backdrop
    const playlistCovers = useMemo(() => extractPlaylistCovers(tracks), [tracks]);
    const ambientCoverUrl = playlistCovers[0] || playlist?.images?.[0]?.url || playlist?.image || null;

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
            <GrooveLoader fullScreen={true} size={72} />
        );
    }

    const ownerName = playlist.owner?.display_name || (typeof playlist.owner === 'string' ? playlist.owner : 'You');

    return (
        <div className="relative min-h-screen bg-[var(--theme-bg)] text-[var(--theme-fg)] p-4 pb-32 sm:p-6 md:pl-20 md:pr-20 lg:pl-40 lg:pr-40 pt-5 sm:pt-8 overflow-hidden transition-colors duration-300">
            {/* Full Screen Dynamic Ambient Gradient Backdrop */}
            <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
                {ambientCoverUrl ? (
                    <div 
                        className="absolute inset-0 bg-cover bg-center scale-110 blur-2xl opacity-75 dark:opacity-60 saturate-150 contrast-110 transition-all duration-700"
                        style={{ backgroundImage: `url(${ambientCoverUrl})` }}
                    />
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-[#E8A87C]/25 via-[#C38D9E]/20 to-[#41B3A3]/20 blur-3xl opacity-60" />
                )}
                <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-black/25 via-transparent to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--theme-bg)]/50 to-[var(--theme-bg)]" />
            </div>

            {/* Top Bar for Mobile (compact pill with blurred bg, back button, logo + wordmark, and share) */}
            <header className="sm:hidden relative z-20 w-full max-w-xs mx-auto flex items-center justify-between px-2.5 py-1.5 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl mb-6">
                <button 
                    onClick={handleBack}
                    className="w-9 h-9 rounded-full aspect-square shrink-0 bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center transition border border-white/10 cursor-pointer"
                    title="Go Back"
                >
                    <ArrowLeft size={16} />
                </button>

                {/* App Logo & Word Mark */}
                <div 
                    onClick={() => router.push("/")}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-full hover:bg-white/10 active:scale-95 transition cursor-pointer select-none"
                    title="GrooveEstrella Home"
                >
                    <img src="/in.svg" alt="GrooveEstrella" className="w-5 h-5 object-contain shrink-0" />
                    <span className="text-xs font-bold text-white tracking-tight font-display">GrooveEstrella</span>
                </div>

                <button 
                    onClick={handleNativeShare}
                    className="w-9 h-9 rounded-full aspect-square shrink-0 bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center transition border border-white/10 cursor-pointer"
                    title="Share Playlist"
                >
                    <Share2 size={16} />
                </button>
            </header>

            {/* Top Navigation for Desktop / PC (isolated buttons on left and right, no top bar needed) */}
            <header className="hidden sm:flex relative z-20 w-full items-center justify-between mb-8 px-2 md:px-6">
                <button 
                    onClick={handleBack}
                    className="w-11 h-11 rounded-full aspect-square shrink-0 bg-black/35 hover:bg-black/55 active:scale-95 text-white flex items-center justify-center transition backdrop-blur-md cursor-pointer border border-white/15 shadow-lg"
                    title="Go Back"
                >
                    <ArrowLeft size={18} />
                </button>

                <button 
                    onClick={handleNativeShare}
                    className="w-11 h-11 rounded-full aspect-square shrink-0 bg-black/35 hover:bg-black/55 active:scale-95 text-white flex items-center justify-center transition backdrop-blur-md cursor-pointer border border-white/15 shadow-lg"
                    title="Share Playlist"
                >
                    <Share2 size={18} />
                </button>
            </header>

            {/* Centered Apple Music Style Hero */}
            <div className="relative z-10 w-full max-w-xl mx-auto flex flex-col items-center text-center px-4 mb-8">
                {/* 3-State Playlist Cover (Collage of 4, First Cover, or Colorful Display Title) */}
                <div className="w-56 h-56 sm:w-64 sm:h-64 md:w-72 md:h-72 aspect-square rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl bg-[var(--theme-surface)] ring-1 ring-white/10 group relative">
                    <PlaylistCover 
                        tracks={tracks} 
                        name={playlist.name} 
                        defaultCover={playlist.images?.[0]?.url || playlist.image}
                    />
                </div>

                {/* Playlist Title */}
                <div className="mt-5 sm:mt-6 flex items-center justify-center gap-2 flex-wrap">
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-black leading-tight text-white tracking-tight">
                        {playlist.name}
                    </h1>
                </div>

                {/* Curated By Owner */}
                <div className="mt-1">
                    <span className="text-base sm:text-lg font-semibold text-white/90">
                        Curated by <span className="text-white font-bold">{ownerName}</span>
                    </span>
                </div>

                {/* Subtitle: Playlist · X songs · Total duration */}
                <p className="text-xs sm:text-sm text-white/60 font-medium mt-1">
                    Playlist · {tracks.length} {tracks.length === 1 ? 'song' : 'songs'}
                    {formattedTotalTime && ` · ${formattedTotalTime}`}
                </p>

                {/* Centered Action Controls Row: Export/File Share, Add Songs, Delete/Bookmark */}
                <div className="mt-6 flex items-center justify-center gap-3 sm:gap-4 max-w-full flex-wrap">
                    {/* Export / Share Playlist File (.m3u, .m3u8, .cue, .txt, .json) */}
                    <button
                        onClick={() => setIsExportModalOpen(true)}
                        className="w-12 h-12 rounded-full aspect-square shrink-0 bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center transition-all duration-200 backdrop-blur-md cursor-pointer shadow-lg border border-white/15 group"
                        title="Export / Download Playlist File (.m3u, .cue, .txt, .json)"
                    >
                        <FolderDown size={20} className="text-white group-hover:text-[var(--theme-accent)] transition-colors" />
                    </button>

                    {/* Primary Action: Add Songs Button (for custom playlist) */}
                    {isCustom && (
                        <button
                            onClick={() => setIsAddTrackModalOpen(true)}
                            className="h-12 px-6 sm:px-8 rounded-full bg-[var(--theme-accent)] hover:opacity-95 active:scale-95 text-[var(--theme-accent-fg)] font-black text-xs sm:text-sm tracking-wide flex items-center justify-center gap-2 transition-all duration-200 shadow-xl cursor-pointer shrink-0 whitespace-nowrap"
                            title="Add Songs to Playlist"
                        >
                            <ListPlus size={18} className="shrink-0" />
                            <span className="whitespace-nowrap">Add Songs</span>
                        </button>
                    )}

                    {/* Delete Custom Playlist OR Save/Bookmark External Playlist */}
                    {isCustom ? (
                        <button
                            onClick={deleteCustomPlaylist}
                            className="w-12 h-12 rounded-full aspect-square shrink-0 bg-red-500/15 hover:bg-red-500/25 active:scale-95 text-red-400 flex items-center justify-center transition-all duration-200 backdrop-blur-md cursor-pointer shadow-lg border border-red-500/20"
                            title="Delete Playlist"
                        >
                            <Trash2 size={19} />
                        </button>
                    ) : (
                        <button
                            onClick={toggleSave}
                            className="h-12 px-6 sm:px-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white font-bold text-xs sm:text-sm tracking-wide flex items-center justify-center gap-2 transition-all duration-200 backdrop-blur-md cursor-pointer shadow-lg border border-white/15"
                            title={saved ? "Remove from Library" : "Add to Library"}
                        >
                            {saved ? <Check size={18} className="text-[var(--theme-accent)]" /> : <Plus size={18} />}
                            <span>{saved ? "Saved in Library" : "Save to Library"}</span>
                        </button>
                    )}
                </div>

                {/* Description / Editorial Notes */}
                {playlist.description && (
                    <div className="mt-6 w-full text-left text-xs sm:text-sm text-white/80 leading-relaxed font-body">
                        <strong className="font-extrabold text-white mr-1.5">Description</strong>
                        <span 
                            className={!expandedHeroDesc ? "line-clamp-2" : ""}
                            dangerouslySetInnerHTML={{ __html: playlist.description }}
                        />
                        {playlist.description.length > 80 && (
                            <button
                                onClick={() => setExpandedHeroDesc(!expandedHeroDesc)}
                                className="font-black text-white hover:underline uppercase text-xs ml-1 tracking-wider cursor-pointer inline"
                            >
                                {expandedHeroDesc ? "LESS" : "MORE"}
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Tracks Section */}
            <div className="relative z-10 border-t border-[var(--theme-border)] pt-8 mb-12">
                <div className="flex items-center justify-between mb-4 px-2">
                    <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                        <span>Playlist Tracks</span>
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-white/10 text-white/70">
                            {tracks.length}
                        </span>
                    </h2>

                    {isCustom && (
                        <button
                            onClick={() => setIsAddTrackModalOpen(true)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[var(--theme-surface)] hover:bg-[var(--theme-card)] border border-[var(--theme-border)] text-xs font-bold text-[var(--theme-accent)] transition hover:scale-105 active:scale-95 cursor-pointer"
                        >
                            <Plus size={14} />
                            <span>Add Songs</span>
                        </button>
                    )}
                </div>

                {tracks.length === 0 ? (
                    <div className="text-center py-16 px-4 bg-white/5 border border-white/10 rounded-3xl max-w-md mx-auto">
                        <ListMusic className="w-12 h-12 text-white/30 mx-auto mb-3" />
                        <h3 className="text-base font-bold text-white mb-1">Playlist is Empty</h3>
                        <p className="text-xs text-white/60 mb-5">
                            {isCustom ? "Search and add songs to this playlist, or import songs from a file." : "No songs found in this playlist."}
                        </p>
                        {isCustom && (
                            <button
                                onClick={() => setIsAddTrackModalOpen(true)}
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--theme-accent)] text-[var(--theme-accent-fg)] font-black text-xs transition hover:scale-105 active:scale-95 cursor-pointer"
                            >
                                <Plus size={15} />
                                <span>Add Songs Now</span>
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col">
                        {tracks.map((item, index) => {
                            const track = item?.track || item;
                            if (!track) return null;

                            const trackArtists = Array.isArray(track.artists) ? track.artists : Array.isArray(track.artist) ? track.artist : [{ name: track.artist || 'Unknown' }];
                            const trackTitle = track.name || track.title;
                            const artistsStr = trackArtists.map(a => a.name).join(', ');
                            const isExplicit = track.explicit || false;
                            const trackDurationMs = track.duration_ms || track.durationMs || track.duration;
                            const formattedDuration = formatMs(trackDurationMs);
                            const trackCover = track.album?.images?.[0]?.url || track.image || track.coverArt;
                            const trackId = track.id || track.trackID || track.trackId;

                            return (
                                <div
                                    key={`${trackId || 'track'}-${index}`}
                                    className="flex items-center justify-between py-2.5 sm:py-3 px-2 sm:px-3 hover:bg-white/5 rounded-xl transition duration-150 border-b border-white/10 last:border-b-0 group cursor-pointer"
                                    onClick={() => {
                                        if (trackId && !String(trackId).startsWith('local-')) {
                                            router.push(`/track/${trackId}`);
                                        }
                                    }}
                                >
                                    <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                                        <span className="w-6 text-center text-xs sm:text-sm font-semibold text-white/50 group-hover:text-white shrink-0">
                                            {index + 1}
                                        </span>

                                        {/* Cover art thumbnail */}
                                        {trackCover ? (
                                            <img 
                                                src={trackCover} 
                                                alt={trackTitle} 
                                                className="w-10 h-10 rounded-lg aspect-square object-cover shrink-0 shadow-md ring-1 ring-white/10" 
                                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                            />
                                        ) : (
                                            <div className="w-10 h-10 rounded-lg aspect-square bg-white/10 flex items-center justify-center shrink-0">
                                                <ListMusic size={16} className="text-white/40" />
                                            </div>
                                        )}

                                        <div className="flex flex-col min-w-0 flex-1">
                                            <div className="flex items-center gap-1.5 min-w-0">
                                                <span className="font-semibold text-sm sm:text-base text-white group-hover:text-[var(--theme-accent)] transition-colors truncate">
                                                    {trackTitle}
                                                </span>
                                                {isExplicit && (
                                                    <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-[3px] text-[9px] font-bold bg-white/20 text-white/90 shrink-0 select-none">
                                                        E
                                                    </span>
                                                )}
                                            </div>
                                            {artistsStr && (
                                                <span className="text-xs text-white/50 truncate block mt-0.5">
                                                    {artistsStr}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 shrink-0 ml-3" onClick={(e) => e.stopPropagation()}>
                                        {formattedDuration && (
                                            <span className="text-xs text-white/50 font-mono font-medium">
                                                {formattedDuration}
                                            </span>
                                        )}

                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button 
                                                    className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition cursor-pointer"
                                                    title="More options"
                                                >
                                                    <MoreHorizontal size={18} />
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent 
                                                className="bg-[var(--theme-card)] backdrop-blur-2xl text-[var(--theme-fg)] min-w-[200px] rounded-2xl p-2 border border-[var(--theme-border)] shadow-2xl z-[9999]"
                                                align="end"
                                                sideOffset={8}
                                            >
                                                <DropdownMenuItem
                                                    onClick={() => setSelectedTrackForGrooveLink({
                                                        id: trackId,
                                                        type: 'track',
                                                        name: trackTitle,
                                                        title: trackTitle,
                                                        artist: trackArtists,
                                                        album: track.album?.name || track.album,
                                                        imageUrl: trackCover,
                                                        coverArt: trackCover,
                                                        popularity: track.popularity || 80,
                                                        explicit: isExplicit,
                                                        genres: [],
                                                        spotifyUrl: track.external_urls?.spotify || track.spoURL,
                                                        youtubeUrl: track.YTURL
                                                    })}
                                                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold hover:bg-[var(--theme-surface)] rounded-xl cursor-pointer"
                                                >
                                                    <img src="/in.svg" alt="GrooveLink" className="w-4 h-4 object-contain" />
                                                    <span>Open GrooveLink</span>
                                                </DropdownMenuItem>

                                                <DropdownMenuItem
                                                    onClick={() => setSelectedTrackForGrooveCard({
                                                        id: trackId,
                                                        title: trackTitle,
                                                        artist: trackArtists,
                                                        imageUrl: trackCover,
                                                        album: track.album?.name || track.album,
                                                        explicit: isExplicit,
                                                        genres: []
                                                    })}
                                                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold hover:bg-[var(--theme-surface)] rounded-xl cursor-pointer"
                                                >
                                                    <Sparkles size={15} className="text-[var(--theme-accent)]" />
                                                    <span>Create GrooveCard</span>
                                                </DropdownMenuItem>

                                                <DropdownMenuItem
                                                    onClick={() => {
                                                        window.dispatchEvent(new CustomEvent('open-playlist-picker', {
                                                            detail: {
                                                                track: {
                                                                    id: trackId,
                                                                    name: trackTitle,
                                                                    title: trackTitle,
                                                                    artists: trackArtists,
                                                                    duration_ms: trackDurationMs,
                                                                    album: {
                                                                        name: track.album?.name || track.album || '',
                                                                        images: trackCover ? [{ url: trackCover }] : []
                                                                    },
                                                                    spoURL: track.external_urls?.spotify || track.spoURL,
                                                                    YTURL: track.YTURL
                                                                }
                                                            }
                                                        }));
                                                    }}
                                                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold hover:bg-[var(--theme-surface)] rounded-xl cursor-pointer"
                                                >
                                                    <ListPlus size={15} />
                                                    <span>Add to Another Playlist</span>
                                                </DropdownMenuItem>

                                                {isCustom && (
                                                    <>
                                                        <DropdownMenuSeparator className="my-1 bg-[var(--theme-border)]" />
                                                        <DropdownMenuItem
                                                            onClick={() => removeTrackFromCustomPlaylist(trackId)}
                                                            className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold hover:bg-red-500/10 text-red-400 rounded-xl cursor-pointer"
                                                        >
                                                            <Trash2 size={14} />
                                                            <span>Remove from Playlist</span>
                                                        </DropdownMenuItem>
                                                    </>
                                                )}

                                                <DropdownMenuSeparator className="my-1 bg-[var(--theme-border)]" />

                                                {(track.external_urls?.spotify || track.spoURL) && (
                                                    <DropdownMenuItem
                                                        onClick={() => window.open(track.external_urls?.spotify || track.spoURL, "_blank")}
                                                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold hover:bg-[var(--theme-surface)] rounded-xl cursor-pointer text-[#1DB954]"
                                                    >
                                                        <Play size={14} fill="currentColor" />
                                                        <span>Play on Spotify</span>
                                                    </DropdownMenuItem>
                                                )}

                                                {track.YTURL && (
                                                    <DropdownMenuItem
                                                        onClick={() => window.open(track.YTURL, "_blank")}
                                                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold hover:bg-[var(--theme-surface)] rounded-xl cursor-pointer text-[#FF0000]"
                                                    >
                                                        <Play size={14} fill="currentColor" />
                                                        <span>Play on YouTube</span>
                                                    </DropdownMenuItem>
                                                )}

                                                <DropdownMenuItem
                                                    onClick={() => {
                                                        if (typeof navigator !== "undefined") {
                                                            const shareUrl = `${window.location.origin}/track/${trackId}`;
                                                            navigator.clipboard.writeText(shareUrl);
                                                            toast.success("Track link copied! 📋");
                                                        }
                                                    }}
                                                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold hover:bg-[var(--theme-surface)] rounded-xl cursor-pointer"
                                                >
                                                    <Copy size={14} />
                                                    <span>Copy Link</span>
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Track-level GrooveLink Modal */}
            {selectedTrackForGrooveLink && (
                <GrooveLinkModal
                    isOpen={Boolean(selectedTrackForGrooveLink)}
                    onClose={() => setSelectedTrackForGrooveLink(null)}
                    onOpenGrooveCard={() => {
                        setSelectedTrackForGrooveCard(selectedTrackForGrooveLink);
                        setSelectedTrackForGrooveLink(null);
                    }}
                    item={selectedTrackForGrooveLink}
                />
            )}

            {/* Track-level GrooveCard Composer Modal */}
            {selectedTrackForGrooveCard && (
                <GrooveCardComposer
                    isOpen={Boolean(selectedTrackForGrooveCard)}
                    onClose={() => setSelectedTrackForGrooveCard(null)}
                    itemId={selectedTrackForGrooveCard.id}
                    title={selectedTrackForGrooveCard.title}
                    artist={selectedTrackForGrooveCard.artist}
                    imageUrl={selectedTrackForGrooveCard.imageUrl}
                    popularity={85}
                    explicit={selectedTrackForGrooveCard.explicit}
                    type="track"
                    album={selectedTrackForGrooveCard.album}
                    genres={selectedTrackForGrooveCard.genres || []}
                />
            )}

            {/* Export / File Share Modal */}
            <ExportPlaylistModal
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
                playlist={playlist}
                tracks={tracks}
            />

            {/* Add Track to Playlist Modal */}
            <AddTrackToPlaylistModal
                isOpen={isAddTrackModalOpen}
                onClose={() => setIsAddTrackModalOpen(false)}
                playlistId={playlist.id || id}
                onTrackAdded={(updatedPl) => {
                    const items = updatedPl.tracks?.items || [];
                    const covers = extractPlaylistCovers(items);
                    if (covers.length > 0) {
                        updatedPl.image = covers[0];
                        updatedPl.images = [{ url: covers[0] }];
                    }
                    setPlaylist({ ...updatedPl });
                    setTracks(items);
                }}
            />
        </div>
    );
}
