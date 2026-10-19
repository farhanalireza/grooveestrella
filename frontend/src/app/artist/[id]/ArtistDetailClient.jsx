// src/app/artist/[id]/ArtistDetailClient.jsx
"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bookmark, BookmarkCheck, Users, Award, Music, ChevronRight, MoreHorizontal, Play, Share2, ListPlus, Sparkles } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
} from "@/Components/ui/dropdown-menu";
import { TrackCard } from "@/Components/CardComponents/TracksCard";
import { AlbumCard } from "@/Components/CardComponents/AlbumsCard";
import GrooveLinkModal from "@/Components/GrooveLinkModal";
import GrooveCardComposer from "@/Components/GrooveCardComposer";
import MusicLoreAndReviews from "@/Components/MusicLoreAndReviews";
import RatingPieChart from "@/Components/RatingPieChart";
import GrooveLoader from "@/Components/GrooveLoader";
import { toast } from "@/lib/toast";
import { shareLink } from "@/lib/shareHelper";

export default function ArtistDetailClient({ id, initialArtist, initialTopTracks, initialAlbums }) {
    const router = useRouter();
    const [artist, setArtist] = useState(initialArtist);
    const [topTracks, setTopTracks] = useState(initialTopTracks || []);
    const [albums, setAlbums] = useState(initialAlbums || []);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState(null);
    const [expandedHeroDesc, setExpandedHeroDesc] = useState(false);
    const [isGrooveLinkOpen, setIsGrooveLinkOpen] = useState(false);
    const [isGrooveCardOpen, setIsGrooveCardOpen] = useState(false);
    const [selectedTrackForGrooveLink, setSelectedTrackForGrooveLink] = useState(null);
    const [selectedTrackForGrooveCard, setSelectedTrackForGrooveCard] = useState(null);

    // Filter strictly for studio albums in reverse chronological order
    const studioAlbums = useMemo(() => {
        if (!albums || !albums.length) return [];
        const filtered = albums.filter((alb) => {
            const pType = (alb.primaryType || alb.typeCategory || 'album').toLowerCase();
            const sTypes = alb.secondaryTypes || [];
            const isComp = sTypes.some(s => (s || '').toLowerCase().includes('compilation')) || (alb.title || '').toLowerCase().includes('compilation');
            const isLive = sTypes.some(s => (s || '').toLowerCase().includes('live')) || (alb.title || '').toLowerCase().includes('live');
            const isRemix = sTypes.some(s => (s || '').toLowerCase().includes('remix'));
            const isEp = pType === 'ep' || (alb.title || '').toLowerCase().includes(' ep');
            const isSingle = pType === 'single';
            return !isComp && !isLive && !isRemix && !isEp && !isSingle;
        });

        return [...filtered].sort((a, b) => {
            const ya = a.releaseYear || (a.releaseDate ? new Date(a.releaseDate).getFullYear() : 0);
            const yb = b.releaseYear || (b.releaseDate ? new Date(b.releaseDate).getFullYear() : 0);
            if (ya !== yb) return yb - ya;
            return (b.releaseDate || '').localeCompare(a.releaseDate || '');
        });
    }, [albums]);

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
        if (!artist && !id) return;
        const targetId = artist?.id || id;
        const savedArtists = JSON.parse(localStorage.getItem("savedArtists")) || [];
        const isSaved = savedArtists.some(a => a.id === targetId);
        setSaved(isSaved);
    }, [artist, id]);

    const toggleSave = () => {
        const savedArtists = JSON.parse(localStorage.getItem("savedArtists")) || [];
        const targetId = artist?.id || id;

        if (saved) {
            const updated = savedArtists.filter((a) => a.id !== targetId);
            localStorage.setItem("savedArtists", JSON.stringify(updated));
            setSaved(false);
            toast.info(`"${artist?.name || 'Artist'}" removed from library.`);
        } else if (artist) {
            const newArtist = {
                id: artist.id || id,
                title: artist.name,
                name: artist.name,
                spoURL: artist.external_urls?.spotify || `https://open.spotify.com/search/${encodeURIComponent(artist.name + ' artist')}`,
                YTURL: `https://www.youtube.com/results?search_query=${encodeURIComponent(artist.name)}`,
                image: artist.images?.[0]?.url || artist.coverArt || artist.url,
                followers: artist.followers?.total || 100000,
                popularity: artist.popularity || 85,
                uri: artist.uri || `musicbrainz:artist:${artist.id || id}`,
            };
            savedArtists.push(newArtist);
            localStorage.setItem("savedArtists", JSON.stringify(savedArtists));
            setSaved(true);
            toast.success(`"${artist.name}" saved to library! 🎙️`);
        }
    };

    // Client-side fallback fetch
    useEffect(() => {
        if (artist && topTracks.length > 0 && albums.length > 0) return;

        async function fetchArtistData() {
            try {
                setError(null);
                const res = await fetch(`/api/artist/${encodeURIComponent(id)}`);
                if (!res.ok) throw new Error("Failed to fetch artist details");
                const data = await res.json();
                if (data) {
                    setArtist(data);
                    if (data.topTracks && data.topTracks.length > 0) setTopTracks(data.topTracks);
                    if (data.albums && data.albums.length > 0) setAlbums(data.albums);
                }
            } catch (err) {
                console.error("Error fetching artist data:", err);
                if (!artist) setError(err);
            }
        }
        fetchArtistData();
    }, [id, artist, topTracks.length, albums.length]);

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-[var(--theme-bg)] text-[var(--theme-fg)] p-6">
                <h2 className="text-2xl font-bold text-red-500 mb-2">Failed to Load Content</h2>
                <p className="text-[var(--theme-muted)] mb-6 text-center max-w-md">
                    We couldn't connect to the catalog. Please check your internet connection or try again later.
                </p>
                <button
                    onClick={() => window.location.reload()}
                    className="bg-[var(--theme-accent)] hover:opacity-90 text-[var(--theme-bg)] font-semibold py-2 px-6 rounded-full transition duration-300 cursor-pointer"
                >
                    Retry
                </button>
            </div>
        );
    }

    if (!artist) {
        return (
            <GrooveLoader fullScreen={true} size={72} />
        );
    }

    const coverUrl = artist.images?.[0]?.url || artist.coverArt || artist.url || 'https://placehold.co/600x600/17020B/E8A87C?text=Artist';
    const genres = useMemo(() => {
        const rawList = artist.genres || artist.tags || [];
        const valid = [];
        const seen = new Set();
        for (const t of rawList) {
            const raw = typeof t === "string" ? t : (t?.name || "");
            if (!raw) continue;
            const clean = raw.trim();
            const lower = clean.toLowerCase();
            if (lower.includes("#") || /^\d/.test(lower) || /^#?\d{2,4}s?$/i.test(lower) || lower.length < 3) continue;
            const ignored = new Set([
                "album", "albums", "ep", "single", "singles", "lp", "cd", "vinyl", "audio",
                "favorite", "favourites", "favorites", "favourite", "seen live",
                "owned", "wishlist", "my collection", "all time favorite", "classic"
            ]);
            if (ignored.has(lower)) continue;
            if (!seen.has(lower)) {
                seen.add(lower);
                valid.push(clean.split(/[\s-]+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" "));
            }
        }
        return valid.slice(0, 6);
    }, [artist?.genres, artist?.tags]);

    const handleBack = () => {
        if (typeof window !== "undefined" && window.history.length > 1) {
            router.back();
        } else {
            router.push("/");
        }
    };

    const handleNativeShare = async () => {
        await shareLink({
            name: artist.name,
            artist: artist.name,
            type: "artist",
            id: artist.id || id,
        });
    };

    return (
        <div className="relative min-h-screen bg-[var(--theme-bg)] text-[var(--theme-fg)] p-4 pb-32 sm:p-6 md:pl-20 md:pr-20 lg:pl-40 lg:pr-40 pt-5 sm:pt-8 overflow-hidden transition-colors duration-300">
            {/* Full Screen Dynamic Ambient Artist Picture Gradient Backdrop */}
            <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
                <div 
                    className="absolute inset-0 bg-cover bg-center scale-110 blur-2xl opacity-80 dark:opacity-65 saturate-150 contrast-110 transition-all duration-700"
                    style={{ backgroundImage: `url(${coverUrl})` }}
                />
                <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-black/25 via-transparent to-transparent" />
                <div 
                    className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--theme-bg)]/50 to-[var(--theme-bg)]"
                />
            </div>

            {/* Top Bar for Mobile */}
            <header className="sm:hidden relative z-20 w-full max-w-xs mx-auto flex items-center justify-between px-2.5 py-1.5 rounded-full bg-[var(--theme-card)]/80 backdrop-blur-xl border border-[var(--theme-border)] shadow-2xl mb-6">
                <button 
                    onClick={handleBack}
                    className="w-9 h-9 rounded-full aspect-square shrink-0 bg-[var(--theme-surface)] hover:bg-[var(--theme-card)] active:scale-95 text-[var(--theme-fg)] flex items-center justify-center transition border border-[var(--theme-border)] cursor-pointer"
                    title="Go Back"
                >
                    <ArrowLeft size={16} />
                </button>

                {/* App Logo & Word Mark */}
                <div 
                    onClick={() => router.push("/")}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-full hover:bg-[var(--theme-surface)] active:scale-95 transition cursor-pointer select-none"
                    title="GrooveEstrella Home"
                >
                    <img src="/in.svg" alt="GrooveEstrella" className="w-5 h-5 object-contain shrink-0" />
                    <span className="text-xs font-bold text-[var(--theme-fg)] tracking-tight font-display">GrooveEstrella</span>
                </div>

                <button 
                    onClick={handleNativeShare}
                    className="w-9 h-9 rounded-full aspect-square shrink-0 bg-[var(--theme-surface)] hover:bg-[var(--theme-card)] active:scale-95 text-[var(--theme-fg)] flex items-center justify-center transition border border-[var(--theme-border)] cursor-pointer"
                    title="Share Artist"
                >
                    <Share2 size={16} />
                </button>
            </header>

            {/* Top Navigation for Desktop / PC */}
            <header className="hidden sm:flex relative z-20 w-full items-center justify-between mb-8 px-2 md:px-6">
                <button 
                    onClick={handleBack}
                    className="w-11 h-11 rounded-full aspect-square shrink-0 bg-[var(--theme-card)]/80 hover:bg-[var(--theme-surface)] active:scale-95 text-[var(--theme-fg)] flex items-center justify-center transition backdrop-blur-md cursor-pointer border border-[var(--theme-border)] shadow-lg"
                    title="Go Back"
                >
                    <ArrowLeft size={18} />
                </button>

                <button 
                    onClick={handleNativeShare}
                    className="w-11 h-11 rounded-full aspect-square shrink-0 bg-[var(--theme-card)]/80 hover:bg-[var(--theme-surface)] active:scale-95 text-[var(--theme-fg)] flex items-center justify-center transition backdrop-blur-md cursor-pointer border border-[var(--theme-border)] shadow-lg"
                    title="Share Artist"
                >
                    <Share2 size={18} />
                </button>
            </header>

            {/* Artist Info Glassmorphic Card Container */}
            <div className="relative z-10 mt-14 sm:mt-6 w-full bg-transparent sm:bg-[var(--theme-card)]/80 sm:backdrop-blur-xl border-0 sm:border border-transparent sm:border-[var(--theme-border)] rounded-none sm:rounded-3xl p-2 sm:p-8 flex flex-col md:flex-row items-center gap-8 sm:gap-12 sm:shadow-2xl mb-6 sm:mb-10">
                <div className="relative flex-shrink-0 w-44 h-44 sm:w-52 sm:h-52 md:w-60 md:h-60 rounded-full overflow-hidden border-4 border-[var(--theme-border)] shadow-2xl bg-[var(--theme-surface)]">
                    <img 
                        src={coverUrl} 
                        alt={artist.name} 
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" 
                        onError={(e) => { e.currentTarget.src = 'https://placehold.co/400x400/17020B/E8A87C?text=Artist'; }}
                    />
                </div>

                <div className="flex-1 min-w-0 text-center md:text-left flex flex-col justify-center">
                    <div>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--theme-card)]/80 border border-[var(--theme-border)] text-xs font-bold text-[var(--theme-accent)] uppercase tracking-wider mb-2">
                            <Users size={13} />
                            <span>Artist Profile</span>
                        </div>
                        <h1 className="text-3xl sm:text-5xl font-extrabold mb-3 leading-tight tracking-tight text-[var(--theme-fg)]">{artist.name}</h1>
                        
                        {genres.length > 0 && (
                            <div className="flex flex-wrap justify-center md:justify-start gap-1.5 mb-4">
                                {genres.map((g, idx) => (
                                    <span key={idx} className="px-2.5 py-1 rounded-full bg-[var(--theme-card)] border border-[var(--theme-border)] text-[var(--theme-accent)] text-[10px] font-bold uppercase tracking-wider">
                                        {g}
                                    </span>
                                ))}
                            </div>
                        )}

                        <div className="flex justify-center md:justify-start items-center gap-4 text-xs font-medium text-[var(--theme-muted)] mb-4 uppercase tracking-wider flex-wrap">
                            <div className="flex items-center gap-1">
                                <Award size={14} />
                                <span>Country: {artist.country || 'Global'}</span>
                            </div>
                            <span>•</span>
                            <div className="flex items-center gap-1">
                                <Award size={14} />
                                <span>Score: {artist.popularity || 85}</span>
                            </div>
                        </div>

                        {/* Rating Pie Chart */}
                        <div className="flex items-center justify-center md:justify-start mb-1">
                            <RatingPieChart rating={artist.rating} />
                        </div>
                    </div>
                    
                    {/* Minimized Description before GrooveLink button */}
                    {artist.description && (
                        <div className="mt-2 text-left">
                            <p className={`text-xs sm:text-sm text-[var(--theme-muted)] leading-relaxed font-body ${!expandedHeroDesc ? "line-clamp-2" : ""}`}>
                                {artist.description}
                            </p>
                            {artist.description.length > 120 && (
                                <button
                                    onClick={() => setExpandedHeroDesc(!expandedHeroDesc)}
                                    className="mt-1 text-[11px] font-bold text-[var(--theme-accent)] hover:opacity-80 transition inline-flex items-center gap-1 cursor-pointer"
                                >
                                    <span>{expandedHeroDesc ? "Show less" : "Read full overview"}</span>
                                </button>
                            )}
                        </div>
                    )}

                    {/* Action Controls Row: GrooveCard, Open GrooveLink, Bookmark */}
                    <div className="mt-6 flex items-center justify-center md:justify-start gap-3 sm:gap-4 max-w-full">
                        {/* Create GrooveCard Button */}
                        <button
                            onClick={() => setIsGrooveCardOpen(true)}
                            className="w-12 h-12 rounded-full aspect-square shrink-0 bg-[var(--theme-card)]/80 hover:bg-[var(--theme-surface)] active:scale-95 text-[var(--theme-fg)] flex items-center justify-center transition-all duration-200 backdrop-blur-md cursor-pointer shadow-lg border border-[var(--theme-border)] group"
                            title="Create GrooveCard"
                        >
                            <Sparkles size={20} className="text-[var(--theme-fg)] group-hover:text-[var(--theme-accent)] transition-colors" />
                        </button>

                        {/* Prominent Open GrooveLink Pill Button */}
                        <button
                            onClick={() => setIsGrooveLinkOpen(true)}
                            className="h-12 px-6 sm:px-8 rounded-full bg-[var(--theme-accent)] hover:opacity-95 active:scale-95 text-[var(--theme-accent-fg)] font-black text-xs sm:text-sm tracking-wide flex items-center justify-center gap-2 transition-all duration-200 shadow-xl cursor-pointer shrink-0 whitespace-nowrap"
                            title="Open GrooveLink"
                        >
                            <img src="/in.svg" alt="GrooveLink" className="w-4 h-4 object-contain brightness-0 invert shrink-0" />
                            <span className="whitespace-nowrap">Open GrooveLink</span>
                            <ChevronRight size={15} className="shrink-0" />
                        </button>

                        {/* Bookmark Button */}
                        <button
                            onClick={toggleSave}
                            className="w-12 h-12 rounded-full aspect-square shrink-0 bg-[var(--theme-card)]/80 hover:bg-[var(--theme-surface)] active:scale-95 text-[var(--theme-fg)] flex items-center justify-center transition-all duration-200 backdrop-blur-md cursor-pointer shadow-lg border border-[var(--theme-border)]"
                            title={saved ? "Remove from Library" : "Add to Library"}
                        >
                            {saved ? <BookmarkCheck size={20} className="text-[var(--theme-accent)]" /> : <Bookmark size={20} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Top Songs - Embedded Apple Music Style List (Matching Image 1) */}
            {topTracks.length > 0 && (
                <div className="relative z-10 mt-6 sm:mt-10 border-t border-[var(--theme-border)]/50 pt-6 sm:pt-8">
                    <div className="flex items-center justify-between mb-3 px-1">
                        <h2 className="text-xl sm:text-2xl font-extrabold flex items-center gap-1.5 text-[var(--theme-fg)]">
                            <span>Top Songs</span>
                            <ChevronRight size={20} className="text-[var(--theme-muted)]" />
                        </h2>
                    </div>

                    <div className="flex flex-col">
                        {topTracks.map((track, index) => {
                            const trackTitle = track.title || track.name;
                            const albumName = track.album?.name || track.album || artist.name;
                            const releaseYear = track.releaseYear || (track.releaseDate ? new Date(track.releaseDate).getFullYear() : null);
                            const coverImg = track.url || track.coverArt || coverUrl;
                            const isExplicit = track.explicit || false;
                            const trackArtists = Array.isArray(track.artists) ? track.artists : Array.isArray(track.artist) ? track.artist : [{ name: artist.name, id: artist.id }];

                            return (
                                <div 
                                    key={`${track.id || 'track'}-${index}`}
                                    className="flex items-center justify-between py-2.5 sm:py-3 px-2 sm:px-3 hover:bg-[var(--theme-card)]/50 rounded-xl transition-all duration-200 border-b border-[var(--theme-border)]/40 last:border-b-0 group"
                                >
                                    <div 
                                        className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1 cursor-pointer"
                                        onClick={() => track.id && router.push(`/track/${track.id}`)}
                                    >
                                        <img 
                                            src={coverImg} 
                                            alt={trackTitle}
                                            className="w-11 h-11 sm:w-12 sm:h-12 rounded-lg object-cover bg-[var(--theme-card)] shadow-sm shrink-0 ring-1 ring-[var(--theme-border)]/50"
                                            onError={(e) => { e.currentTarget.src = coverUrl; }}
                                        />
                                        <div className="flex flex-col min-w-0 flex-1">
                                            <div className="flex items-center gap-1.5 min-w-0">
                                                <span className="font-semibold text-sm sm:text-base text-[var(--theme-fg)] group-hover:text-[var(--theme-accent)] transition-colors truncate">
                                                    {trackTitle}
                                                </span>
                                                {isExplicit && (
                                                    <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-[3px] text-[9px] font-bold bg-[var(--theme-muted)]/30 text-[var(--theme-fg)]/90 shrink-0 select-none">
                                                        E
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs sm:text-sm text-[var(--theme-muted)] truncate mt-0.5">
                                                {albumName}{releaseYear ? ` · ${releaseYear}` : ''}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0 ml-3">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button 
                                                    className="p-2 rounded-lg hover:bg-[var(--theme-card)] text-[var(--theme-muted)] hover:text-[var(--theme-fg)] transition cursor-pointer"
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
                                                        id: track.id || track.trackId,
                                                        type: 'track',
                                                        name: trackTitle,
                                                        title: trackTitle,
                                                        artist: trackArtists,
                                                        album: albumName,
                                                        imageUrl: coverImg,
                                                        coverArt: coverImg,
                                                        releaseDate: track.releaseDate,
                                                        releaseYear: releaseYear,
                                                        popularity: track.popularity || 85,
                                                        explicit: isExplicit,
                                                        genres: genres,
                                                        spotifyUrl: track.spoURL,
                                                        youtubeUrl: track.YTURL
                                                    })}
                                                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold hover:bg-[var(--theme-surface)] rounded-xl cursor-pointer"
                                                >
                                                    <img src="/in.svg" alt="GrooveLink" className="w-4 h-4 object-contain" />
                                                    <span>Open GrooveLink</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => setSelectedTrackForGrooveCard({
                                                        id: track.id || track.trackId,
                                                        title: trackTitle,
                                                        artist: trackArtists,
                                                        imageUrl: coverImg,
                                                        releaseYear: releaseYear,
                                                        album: albumName,
                                                        explicit: isExplicit,
                                                        genres: genres
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
                                                                    id: track.id || track.trackId,
                                                                    name: trackTitle,
                                                                    title: trackTitle,
                                                                    artists: trackArtists,
                                                                    duration_ms: track.duration_ms || track.duration,
                                                                    album: {
                                                                        name: albumName,
                                                                        images: [{ url: coverImg }]
                                                                    },
                                                                    spoURL: track.spoURL,
                                                                    YTURL: track.YTURL
                                                                }
                                                            }
                                                        }));
                                                    }}
                                                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold hover:bg-[var(--theme-surface)] rounded-xl cursor-pointer"
                                                >
                                                    <ListPlus size={15} />
                                                    <span>Add to Playlist</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator className="my-1 bg-[var(--theme-border)]" />
                                                {track.spoURL && (
                                                    <DropdownMenuItem
                                                        onClick={() => window.open(track.spoURL, "_blank")}
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
                                                        shareLink({
                                                            name: trackTitle,
                                                            title: trackTitle,
                                                            artist: trackArtists,
                                                            type: 'track',
                                                            id: track.id || track.trackId,
                                                        });
                                                    }}
                                                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold hover:bg-[var(--theme-surface)] rounded-xl cursor-pointer"
                                                >
                                                    <Share2 size={14} />
                                                    <span>Share Track Link</span>
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Discography - Only Studio Albums in Reverse Chronological Order (Matching Image 2) */}
            {studioAlbums.length > 0 && (
                <div className="relative z-10 mt-12 sm:mt-16 border-t border-[var(--theme-border)]/50 pt-8 mb-12">
                    <div className="flex items-center justify-between mb-5 px-1">
                        <Link href={`/artist/${artist.id || id}/discography`} className="group flex items-center gap-1.5">
                            <h2 className="text-xl sm:text-2xl font-extrabold text-[var(--theme-fg)] group-hover:text-[var(--theme-accent)] transition flex items-center gap-1.5">
                                <span>Albums</span>
                                <ChevronRight size={20} className="text-[var(--theme-muted)] group-hover:text-[var(--theme-accent)] transition-transform group-hover:translate-x-0.5" />
                            </h2>
                        </Link>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
                        {studioAlbums.map((album, index) => {
                            const albumCover = album.url || album.image || album.coverArt || coverUrl;
                            const albumYear = album.releaseYear || (album.releaseDate ? new Date(album.releaseDate).getFullYear() : null);

                            return (
                                <div 
                                    key={`${album.id || 'album'}-${index}`}
                                    onClick={() => album.id && router.push(`/album/${album.id}`)}
                                    className="group flex flex-col cursor-pointer"
                                >
                                    <div className="aspect-square w-full rounded-2xl overflow-hidden bg-[var(--theme-card)] shadow-md group-hover:shadow-xl transition-all duration-300 relative ring-1 ring-[var(--theme-border)]">
                                        <img 
                                            src={albumCover} 
                                            alt={album.title || album.name}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                            onError={(e) => { e.currentTarget.src = 'https://placehold.co/400x400/17020B/E8A87C?text=Album'; }}
                                        />
                                    </div>
                                    <div className="mt-2.5 flex items-center justify-between gap-1 min-w-0">
                                        <h3 className="text-sm font-bold text-[var(--theme-fg)] truncate group-hover:text-[var(--theme-accent)] transition-colors">
                                            {album.title || album.name}
                                        </h3>
                                        <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-[3px] text-[9px] font-bold bg-[var(--theme-muted)]/30 text-[var(--theme-fg)]/90 shrink-0 select-none">
                                            E
                                        </span>
                                    </div>
                                    {albumYear && (
                                        <p className="text-xs text-[var(--theme-muted)] font-medium mt-0.5">
                                            {albumYear}
                                        </p>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Button: Discover whole discography & releases */}
                    <div className="mt-10 flex justify-center">
                        <Link
                            href={`/artist/${artist.id || id}/discography`}
                            className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full bg-[var(--theme-card)]/90 hover:bg-[var(--theme-surface)] text-[var(--theme-fg)] hover:text-[var(--theme-accent)] border border-[var(--theme-border)] hover:border-[var(--theme-accent)] text-xs sm:text-sm font-bold uppercase tracking-wider transition-all duration-300 shadow-md group cursor-pointer hover:scale-105 active:scale-95"
                        >
                            <span>Discover whole discography & releases</span>
                            <ChevronRight size={16} className="text-[var(--theme-accent)] group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                </div>
            )}

            {/* Reviews, Descriptions, Lore, All Tags & External Links */}
            <MusicLoreAndReviews
                id={artist.id || id}
                type="artist"
                title={artist.name}
                artist={artist.name}
                description={artist.description}
                primaryGenre={genres[0] || null}
                genres={artist.genres || genres || []}
                categorizedTags={artist.categorizedTags || null}
                tags={artist.tags || artist.genres || []}
                allTags={artist.allTags || []}
                rating={artist.rating}
                externalLinks={artist.externalLinks || []}
            />

            {/* GrooveLink Modal */}
            <GrooveLinkModal
                isOpen={isGrooveLinkOpen}
                onClose={() => setIsGrooveLinkOpen(false)}
                onOpenGrooveCard={() => {
                    setIsGrooveLinkOpen(false);
                    setIsGrooveCardOpen(true);
                }}
                item={{
                    id: artist.id || id,
                    type: "artist",
                    name: artist.name,
                    title: artist.name,
                    artist: artist.name,
                    imageUrl: coverUrl,
                    coverArt: coverUrl,
                    popularity: artist.popularity || 85,
                    explicit: false,
                    genres: genres,
                    externalLinks: artist.externalLinks || [],
                    spotifyUrl: artist.external_urls?.spotify || artist.spoURL,
                    youtubeUrl: artist.YTURL
                }}
            />

            {/* Artist GrooveCard Composer Modal */}
            <GrooveCardComposer
                isOpen={isGrooveCardOpen}
                onClose={() => setIsGrooveCardOpen(false)}
                itemId={artist.id || id}
                title={artist.name}
                artist={artist.name}
                imageUrl={coverUrl}
                popularity={artist.popularity || 85}
                explicit={false}
                type="artist"
                genres={genres}
            />

            {/* Track Specific GrooveLink Modal */}
            {selectedTrackForGrooveLink && (
                <GrooveLinkModal
                    isOpen={!!selectedTrackForGrooveLink}
                    onClose={() => setSelectedTrackForGrooveLink(null)}
                    onOpenGrooveCard={() => {
                        const tr = selectedTrackForGrooveLink;
                        setSelectedTrackForGrooveLink(null);
                        setSelectedTrackForGrooveCard(tr);
                    }}
                    item={selectedTrackForGrooveLink}
                />
            )}

            {/* Track Specific GrooveCard Composer Modal */}
            {selectedTrackForGrooveCard && (
                <GrooveCardComposer
                    isOpen={!!selectedTrackForGrooveCard}
                    onClose={() => setSelectedTrackForGrooveCard(null)}
                    itemId={selectedTrackForGrooveCard.id}
                    title={selectedTrackForGrooveCard.title}
                    artist={selectedTrackForGrooveCard.artist}
                    imageUrl={selectedTrackForGrooveCard.imageUrl || coverUrl}
                    album={selectedTrackForGrooveCard.album}
                    releaseYear={selectedTrackForGrooveCard.releaseYear}
                    popularity={85}
                    explicit={selectedTrackForGrooveCard.explicit}
                    type="track"
                    genres={selectedTrackForGrooveCard.genres || genres}
                />
            )}
        </div>
    );
}
