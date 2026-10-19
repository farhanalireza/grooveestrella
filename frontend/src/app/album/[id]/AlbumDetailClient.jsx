// src/app/album/[id]/AlbumDetailClient.jsx
"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bookmark, BookmarkCheck, Disc, ChevronRight, Clock, Layers, Sparkles, Plus, Check, MoreHorizontal, Copy, Play, Share2, ListPlus } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
} from "@/Components/ui/dropdown-menu";
import { AlbumTrackCard } from "@/Components/CardComponents/SmallTracksCard";
import GrooveLinkModal from "@/Components/GrooveLinkModal";
import GrooveCardComposer from "@/Components/GrooveCardComposer";
import AlbumEditionsDrawer from "@/Components/AlbumEditionsDrawer";
import MusicLoreAndReviews from "@/Components/MusicLoreAndReviews";
import RatingPieChart from "@/Components/RatingPieChart";
import GrooveLoader from "@/Components/GrooveLoader";
import { toast } from "@/lib/toast";
import { shareLink } from "@/lib/shareHelper";

export default function AlbumDetailClient({ id, initialAlbum, initialTracks }) {
    const router = useRouter();
    const [album, setAlbum] = useState(initialAlbum);
    const [tracks, setTracks] = useState(initialTracks || []);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState(null);
    const [loadingTracks, setLoadingTracks] = useState(false);
    const [expandedHeroDesc, setExpandedHeroDesc] = useState(false);
    const [selectedReleaseId, setSelectedReleaseId] = useState(initialAlbum?.selectedReleaseId || null);
    const [isEditionsDrawerOpen, setIsEditionsDrawerOpen] = useState(false);
    const [isGrooveLinkOpen, setIsGrooveLinkOpen] = useState(false);
    const [isGrooveCardOpen, setIsGrooveCardOpen] = useState(false);
    const [selectedTrackForGrooveLink, setSelectedTrackForGrooveLink] = useState(null);
    const [selectedTrackForGrooveCard, setSelectedTrackForGrooveCard] = useState(null);
    const [showVinylSides, setShowVinylSides] = useState(true);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const savedPref = localStorage.getItem("groove_show_vinyl_sides");
            if (savedPref !== null) {
                setShowVinylSides(savedPref === "true");
            }
        }
    }, []);

    const toggleVinylSides = () => {
        const nextVal = !showVinylSides;
        setShowVinylSides(nextVal);
        if (typeof window !== "undefined") {
            localStorage.setItem("groove_show_vinyl_sides", String(nextVal));
        }
        toast.info(nextVal ? "Vinyl side dividers enabled" : "Vinyl side dividers disabled");
    };

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

    const handleSwitchEdition = async (relId) => {
        if (!relId || relId === selectedReleaseId || loadingTracks) return;
        const prevReleaseId = selectedReleaseId;
        setSelectedReleaseId(relId);
        setLoadingTracks(true);
        try {
            const res = await fetch(`/api/album/${encodeURIComponent(id)}?release=${encodeURIComponent(relId)}`);
            if (res.ok) {
                const data = await res.json();
                if (data.album) {
                    setAlbum(data.album);
                    if (data.album.selectedReleaseId) {
                        setSelectedReleaseId(data.album.selectedReleaseId);
                    }
                }
                if (data.tracks && data.tracks.length > 0) {
                    setTracks(data.tracks);
                }
                const labelYear = data.album?.releaseYear || data.album?.releaseDate || 'Selected';
                const editionName = data.album?.activeEdition?.editionName || labelYear;
                toast.success(`Switched to: ${editionName} (${data.tracks?.length || 0} tracks) 💿`);
            } else {
                toast.error("Could not load selected edition");
                setSelectedReleaseId(prevReleaseId);
            }
        } catch (e) {
            console.error("Failed to load edition:", e);
            toast.error("Network error loading edition");
            setSelectedReleaseId(prevReleaseId);
        } finally {
            setLoadingTracks(false);
        }
    };

    useEffect(() => {
        if (!id && !album) return;
        const targetId = album?.id || id;
        const savedAlbums = JSON.parse(localStorage.getItem("savedAlbums")) || [];
        const isSaved = savedAlbums.some(a => a.id === targetId);
        setSaved(isSaved);
    }, [id, album]);

    const toggleSave = () => {
        const savedAlbums = JSON.parse(localStorage.getItem("savedAlbums")) || [];
        const targetId = album?.id || id;

        if (saved) {
            const updated = savedAlbums.filter(a => a.id !== targetId);
            localStorage.setItem("savedAlbums", JSON.stringify(updated));
            setSaved(false);
            toast.info(`"${album?.name || 'Album'}" removed from library.`);
        } else if (album) {
            const artistsList = Array.isArray(album.artists) ? album.artists : [{ name: album.artist || 'Various Artists' }];
            const newAlbum = {
                id: album.id || id,
                title: album.name || album.title,
                name: album.name || album.title,
                artist: artistsList,
                image: album.images?.[0]?.url || album.coverArt || album.url,
                spoURL: album.external_urls?.spotify || `https://open.spotify.com/search/${encodeURIComponent(album.name + ' album')}`,
                release_date: album.release_date,
                tracksCount: tracks.length || album.total_tracks || 0,
                type: "album"
            };
            savedAlbums.push(newAlbum);
            localStorage.setItem("savedAlbums", JSON.stringify(savedAlbums));
            setSaved(true);
            toast.success(`"${album.name || album.title}" saved to library! 💿`);
        }
    };

    const handleNativeShare = async () => {
        await shareLink({
            name: album?.name || album?.title,
            artists: album?.artists || album?.artist,
            type: "album",
            id: album?.id || id,
        });
    };

    // Client-side fallback fetch only if initial SSR props were empty
    useEffect(() => {
        if (album && tracks && tracks.length > 0) return;

        let isMounted = true;
        async function fetchAlbumData() {
            try {
                setError(null);
                setLoadingTracks(true);
                const res = await fetch(`/api/album/${encodeURIComponent(id)}`);
                if (!res.ok) throw new Error("Failed to fetch album details");
                const data = await res.json();
                if (!isMounted) return;
                if (data.album) {
                    setAlbum(data.album);
                    if (data.album.selectedReleaseId) setSelectedReleaseId(data.album.selectedReleaseId);
                }
                if (data.tracks && data.tracks.length > 0) {
                    setTracks(data.tracks);
                }
            } catch (err) {
                console.error("Error fetching album data:", err);
                if (isMounted && !album) setError(err);
            } finally {
                if (isMounted) setLoadingTracks(false);
            }
        }
        fetchAlbumData();
        return () => { isMounted = false; };
    }, [id]);

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

    if (!album) {
        return (
            <GrooveLoader fullScreen={true} size={72} />
        );
    }

    const artistsList = Array.isArray(album.artists) ? album.artists : [{ name: album.artist || 'Various Artists' }];
    const coverUrl = album.images?.[0]?.url || album.coverArt || album.url || 'https://placehold.co/600x600/17020B/E8A87C?text=No+Cover';

    const totalDurationMs = album.totalDurationMs || tracks.reduce((acc, t) => acc + (t.duration || t.duration_ms || 0), 0);
    function formatTotalDuration(ms) {
        if (!ms) return null;
        const totalMinutes = Math.floor(ms / 60000);
        const hours = Math.floor(totalMinutes / 60);
        const mins = totalMinutes % 60;
        if (hours > 0) return `${hours} hr ${mins} min`;
        return `${mins} min`;
    }
    const formattedTotalTime = formatTotalDuration(totalDurationMs);

    const handleBack = () => {
        if (typeof window !== "undefined" && window.history.length > 1) {
            router.back();
        } else {
            router.push("/");
        }
    };

    // Filter out numeric tags, year tags (e.g. #1973, 1973, 70s), and non-musical catalog metadata
    // Preserves short genres like Pop, Rap, Rock, R&B, EDM, Dub, Emo, Ska
    const validGenres = useMemo(() => {
        const rawList = album?.genres || album?.tags || [];
        const valid = [];
        const seen = new Set();
        for (const t of rawList) {
            const raw = typeof t === "string" ? t : (t?.name || "");
            if (!raw) continue;
            const clean = raw.trim();
            const lower = clean.toLowerCase();
            // Discard hashtags or numeric/year tags like #1973, 1973, 70s, #70s, 1980s
            if (lower.includes("#") && /^\d+$/.test(lower.replace(/#/g, ""))) continue;
            if (/^\d+$/.test(clean)) continue;
            if (/^#?\d{2,4}s?$/i.test(clean)) continue;
            if (/^\d{1,2}\s*(st|nd|rd|th)?\s*(century|anniversary)/i.test(lower)) continue;

            const ignored = new Set([
                "album", "albums", "ep", "single", "singles", "lp", "cd", "vinyl", "audio",
                "favorite", "favourites", "favorites", "favourite", "seen live",
                "owned", "wishlist", "my collection", "all time favorite", "classic", "masterpiece"
            ]);
            if (ignored.has(lower)) continue;

            if (!seen.has(lower)) {
                seen.add(lower);
                let formatted = clean;
                if (/^r&b$/i.test(clean)) formatted = "R&B";
                else if (/^edm$/i.test(clean)) formatted = "EDM";
                else if (/^idm$/i.test(clean)) formatted = "IDM";
                else if (/^k-?pop$/i.test(clean)) formatted = "K-Pop";
                else if (/^j-?pop$/i.test(clean)) formatted = "J-Pop";
                else if (/^lo-?fi$/i.test(clean)) formatted = "Lo-Fi";
                else if (/^hip-?hop$/i.test(clean)) formatted = "Hip Hop";
                else {
                    formatted = clean
                        .split(/[\s-]+/)
                        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
                        .join(" ");
                }
                valid.push(formatted);
            }
        }
        return valid;
    }, [album?.genres, album?.tags]);

    // Hero genre display: First official curated genre -> first fallback genre
    const displayGenre = album?.primaryGenre || album?.genres?.[0] || validGenres[0] || null;
    const releaseYear = album?.releaseYear || (album?.releaseDate ? new Date(album.releaseDate).getFullYear() : null);

    // Group tracks into distinct Discs and Sides:
    // - If album has > 1 disc, show Disc headers; if only 1 disc, do NOT show Disc header
    // - If disc/album has multiple sides (e.g. Side A, Side B), break sections into Sides
    const trackSections = useMemo(() => {
        if (!tracks || tracks.length === 0) return [];

        const discMap = new Map();
        let currentDisc = 1;
        let lastPos = 0;

        tracks.forEach((track, idx) => {
            let discNum = track.disc;
            if (!discNum) {
                const pos = Number(track.pos) || (idx + 1);
                if (idx > 0 && pos <= lastPos && pos === 1) {
                    currentDisc += 1;
                }
                discNum = currentDisc;
                lastPos = pos;
            } else {
                currentDisc = discNum;
                lastPos = Number(track.pos) || (idx + 1);
            }

            if (!discMap.has(discNum)) {
                discMap.set(discNum, {
                    discNumber: discNum,
                    discTitle: track.discTitle ? `Disc ${discNum}: ${track.discTitle}` : `Disc ${discNum}`,
                    discFormat: track.discFormat || 'Disc',
                    tracks: [],
                });
            }
            discMap.get(discNum).tracks.push(track);
        });

        const sortedDiscs = Array.from(discMap.values()).sort((a, b) => a.discNumber - b.discNumber);
        const hasMultipleDiscs = sortedDiscs.length > 1;

        return sortedDiscs.map((disc) => {
            const sideMap = new Map();

            disc.tracks.forEach((track) => {
                const sideKey = track.side || 'default';
                if (!sideMap.has(sideKey)) {
                    sideMap.set(sideKey, {
                        side: track.side || null,
                        sideLabel: track.side ? `Side ${track.side}` : null,
                        tracks: [],
                    });
                }
                sideMap.get(sideKey).tracks.push(track);
            });

            const sideGroupsRaw = Array.from(sideMap.values());
            const hasMultipleSides = sideGroupsRaw.length > 1 && sideGroupsRaw.some((s) => s.side !== null);
            const sideGroups = (hasMultipleSides && showVinylSides)
                ? sideGroupsRaw
                : [{ side: null, sideLabel: null, tracks: disc.tracks }];

            const discDurationMs = disc.tracks.reduce((acc, t) => acc + (t.duration || t.duration_ms || 0), 0);

            return {
                discNumber: disc.discNumber,
                discTitle: disc.discTitle,
                discFormat: disc.discFormat,
                showDiscHeader: hasMultipleDiscs,
                durationMs: discDurationMs,
                tracksCount: disc.tracks.length,
                sides: sideGroups.map((s) => {
                    const sideDurationMs = s.tracks.reduce((acc, t) => acc + (t.duration || t.duration_ms || 0), 0);
                    return {
                        side: s.side,
                        sideLabel: s.sideLabel,
                        showSideHeader: hasMultipleSides && showVinylSides,
                        durationMs: sideDurationMs,
                        tracks: s.tracks,
                    };
                }),
            };
        });
    }, [tracks, showVinylSides]);

    const hasAnySides = useMemo(() => {
        return tracks && tracks.some((t) => t.side);
    }, [tracks]);

    return (
        <div className="relative min-h-screen bg-[var(--theme-bg)] text-[var(--theme-fg)] p-4 pb-32 sm:p-6 md:pl-20 md:pr-20 lg:pl-40 lg:pr-40 pt-5 sm:pt-8 overflow-hidden transition-colors duration-300">
            {/* Full Screen Dynamic Ambient Art-Cover Gradient Backdrop */}
            <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
                <div 
                    className="absolute inset-0 bg-cover bg-center scale-110 blur-2xl opacity-75 dark:opacity-60 saturate-150 contrast-110 transition-all duration-700"
                    style={{ backgroundImage: `url(${coverUrl})` }}
                />
                <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-black/10 dark:from-black/25 via-transparent to-transparent" />
                <div 
                    className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--theme-bg)]/60 to-[var(--theme-bg)]"
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
                    title="Share Album"
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
                    title="Share Album"
                >
                    <Share2 size={18} />
                </button>
            </header>

            {/* Centered Apple Music Style Hero (Matching Image 3) */}
            <div className="relative z-10 w-full max-w-xl mx-auto flex flex-col items-center text-center px-4 mb-8">
                {/* Square Album Cover */}
                <div className="w-56 h-56 sm:w-64 sm:h-64 md:w-72 md:h-72 aspect-square rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl bg-[var(--theme-surface)] ring-1 ring-[var(--theme-border)] group relative">
                    <img 
                        src={coverUrl} 
                        alt={album.name || album.title} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                        onError={(e) => { e.currentTarget.src = 'https://placehold.co/500x500/17020B/E8A87C?text=Album'; }}
                    />
                </div>

                {/* Album Title with Explicit [E] badge */}
                <div className="mt-5 sm:mt-6 flex items-center justify-center gap-2 flex-wrap">
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-black leading-tight text-[var(--theme-fg)] tracking-tight">
                        {album.name || album.title}
                    </h1>
                    <span className="inline-flex items-center justify-center w-4 h-4 rounded-[3px] text-[10px] font-bold bg-[var(--theme-muted)]/20 text-[var(--theme-fg)]/90 shrink-0 select-none">
                        E
                    </span>
                </div>

                {/* Clickable Artist Name */}
                <div className="mt-1">
                    {artistsList.map((a, i) => (
                        <span
                            key={`${a.id || 'artist'}-${i}`}
                            className="text-base sm:text-lg font-semibold text-[var(--theme-fg)]/90 hover:text-[var(--theme-accent)] transition cursor-pointer"
                            onClick={() => a.id && router.push(`/artist/${a.id}`)}
                        >
                            {a.name}{i < artistsList.length - 1 && ', '}
                        </span>
                    ))}
                </div>

                {/* Subtitle: Genre · Year */}
                <p className="text-xs sm:text-sm text-[var(--theme-muted)] font-medium mt-1">
                    {displayGenre ? `${displayGenre} · ` : ""}{releaseYear || "Album"}
                </p>

                {/* Always show timing below Genre · Year; show Discs count only when trackSections.length > 1 */}
                {formattedTotalTime && (
                    <p className="text-xs sm:text-sm text-[var(--theme-muted)] font-medium mt-0.5 flex items-center justify-center gap-1.5 flex-wrap">
                        {trackSections.length > 1 && (
                            <>
                                <span>{trackSections.length} Discs</span>
                                <span>•</span>
                            </>
                        )}
                        <span>{tracks.length} songs</span>
                        <span>•</span>
                        <span>{formattedTotalTime}</span>
                    </p>
                )}

                {/* Editions & Pressings Trigger Pill */}
                {album.editions && album.editions.length > 1 && (
                    <button
                        onClick={() => setIsEditionsDrawerOpen(true)}
                        className="mt-2.5 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--theme-card)]/80 hover:bg-[var(--theme-surface)] active:scale-95 text-[var(--theme-fg)] text-xs font-semibold backdrop-blur-md border border-[var(--theme-border)] transition-all shadow-md cursor-pointer group"
                        title="Explore alternative pressings, remasters, and box sets"
                    >
                        <Layers size={14} className="text-[var(--theme-accent)] group-hover:rotate-12 transition-transform duration-300" />
                        <span>{album.editions.length} Editions & Pressings</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[var(--theme-surface)] text-[var(--theme-muted)] font-mono">
                            {album.releaseYear || 'Active'}
                        </span>
                        <ChevronRight size={13} className="text-[var(--theme-muted)] group-hover:translate-x-0.5 transition-transform" />
                    </button>
                )}

                {/* Centered Action Controls Row: Editions, GrooveCard, Open GrooveLink, Bookmark */}
                <div className="mt-6 flex items-center justify-center gap-3 sm:gap-4 max-w-full">
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
                        <img src="/in.svg" alt="GrooveLink" className="w-5 h-5 object-contain shrink-0" />
                        <span className="whitespace-nowrap">Open GrooveLink</span>
                        <ChevronRight size={15} className="shrink-0" />
                    </button>

                    {/* Bookmark / Plus Button */}
                    <button
                        onClick={toggleSave}
                        className="w-12 h-12 rounded-full aspect-square shrink-0 bg-[var(--theme-card)]/80 hover:bg-[var(--theme-surface)] active:scale-95 text-[var(--theme-fg)] flex items-center justify-center transition-all duration-200 backdrop-blur-md cursor-pointer shadow-lg border border-[var(--theme-border)]"
                        title={saved ? "Remove from Library" : "Add to Library"}
                    >
                        {saved ? <Check size={20} className="text-[var(--theme-accent)]" /> : <Plus size={20} />}
                    </button>
                </div>

                {/* Description / Editorial Notes (Matching Image 3) */}
                {album.description && (
                    <div className="mt-6 w-full text-left text-xs sm:text-sm text-[var(--theme-muted)] leading-relaxed font-body">
                        <strong className="font-extrabold text-[var(--theme-fg)] mr-1.5">Editor's Notes</strong>
                        <span className={!expandedHeroDesc ? "line-clamp-2" : ""}>
                            {album.description}
                        </span>
                        {album.description.length > 80 && (
                            <button
                                onClick={() => setExpandedHeroDesc(!expandedHeroDesc)}
                                className="font-black text-[var(--theme-accent)] hover:underline uppercase text-xs ml-1 tracking-wider cursor-pointer inline"
                            >
                                {expandedHeroDesc ? "LESS" : "MORE"}
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Tracks Section */}
            <div className="relative z-10 border-t border-[var(--theme-border)] pt-8 mb-12">
                {/* Header row with Tracklist title and Vinyl Sides toggle */}
                <div className="flex items-center justify-between mb-5 px-1">
                    <h2 className="text-xl sm:text-2xl font-extrabold text-[var(--theme-fg)] tracking-tight">
                        Tracks
                    </h2>

                    {hasAnySides && (
                        <button
                            onClick={toggleVinylSides}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold tracking-wide uppercase transition cursor-pointer border ${
                                showVinylSides 
                                    ? 'bg-[var(--theme-card)] border-[var(--theme-accent)] text-[var(--theme-accent)] shadow-sm' 
                                    : 'bg-[var(--theme-surface)] border-[var(--theme-border)] text-[var(--theme-muted)] hover:text-[var(--theme-fg)]'
                            }`}
                            title="Toggle vinyl side grouping (Side A, Side B, etc.)"
                        >
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: showVinylSides ? 'var(--theme-accent)' : 'var(--theme-muted)' }} />
                            <span>Sides: {showVinylSides ? 'On' : 'Off'}</span>
                        </button>
                    )}
                </div>

                {/* Switching edition banner */}
                {loadingTracks && (
                    <div className="mb-6 p-3.5 rounded-2xl bg-[var(--theme-card)]/80 border border-[var(--theme-border)] backdrop-blur-xl flex items-center justify-center gap-2.5 text-xs font-semibold text-[var(--theme-accent)] animate-pulse">
                        <span className="w-3 h-3 rounded-full border-2 border-[var(--theme-accent)] border-t-transparent animate-spin" />
                        <span>Switching edition and loading tracklist...</span>
                    </div>
                )}

                {tracks.length === 0 || loadingTracks ? (
                    <div className="flex flex-col items-center justify-center p-12 rounded-2xl bg-[var(--theme-card)]/50 border border-[var(--theme-border)] text-center">
                        <GrooveLoader size={56} />
                    </div>
                ) : (
                    <div className="space-y-6">
                        {trackSections.map((discSection) => {
                            const discFormattedTime = formatTotalDuration(discSection.durationMs);

                            return (
                                <div key={`disc-group-${discSection.discNumber}`} className="space-y-2">
                                    {/* Disc Header (Disc 1, Disc 2, Disc 3, etc.) - ONLY if > 1 disc */}
                                    {discSection.showDiscHeader && (
                                        <div className="flex items-center justify-between px-1 border-b border-[var(--theme-border)] pb-2 mb-2">
                                            <h3 className="text-sm sm:text-base font-bold text-[var(--theme-fg)] tracking-tight flex items-center gap-2">
                                                <Disc size={16} className="text-[var(--theme-accent)]" />
                                                <span>{discSection.discTitle}</span>
                                                <span className="text-[10px] font-semibold text-[var(--theme-accent)] px-2 py-0.5 rounded-full bg-[var(--theme-card)] border border-[var(--theme-border)]">
                                                    {discSection.tracksCount} songs
                                                </span>
                                            </h3>
                                            {discFormattedTime && (
                                                <span className="text-xs text-[var(--theme-muted)] font-medium flex items-center gap-1.5">
                                                    <Clock size={12} className="text-[var(--theme-accent)]" />
                                                    <span>{discFormattedTime}</span>
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    {/* Sides inside this Disc */}
                                    {discSection.sides.map((sideSection, sideIdx) => {
                                        const sideFormattedTime = formatTotalDuration(sideSection.durationMs);

                                        return (
                                            <div key={`side-${discSection.discNumber}-${sideSection.side || sideIdx}`} className="space-y-1">
                                                {/* Side Header: ONLY if disc has multiple sides AND user has sides enabled */}
                                                {sideSection.showSideHeader && (
                                                    <div className="flex items-center gap-3 py-2 my-1.5">
                                                        <div className="h-px bg-[var(--theme-border)] flex-1" />
                                                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--theme-muted)] px-3 py-0.5 rounded-full bg-[var(--theme-surface)] border border-[var(--theme-border)] shrink-0 flex items-center gap-1.5 shadow-sm">
                                                            <span>{sideSection.sideLabel || `Side ${sideIdx + 1}`}</span>
                                                            {sideFormattedTime && <span>· {sideFormattedTime}</span>}
                                                        </span>
                                                        <div className="h-px bg-[var(--theme-border)] flex-1" />
                                                    </div>
                                                )}

                                                {/* Tracklist for this Side */}
                                                <div className="flex flex-col">
                                                    {sideSection.tracks.map((track, index) => {
                                                        const trackArtists = Array.isArray(track.artists) ? track.artists : Array.isArray(track.artist) ? track.artist : artistsList;
                                                        const trackTitle = track.title || track.name;
                                                        const artistsStr = trackArtists.map(a => a.name).join(', ');
                                                        const isExplicit = track.explicit || false;
                                                        const formattedDuration = typeof (track.duration || track.duration_ms) === 'number' && (track.duration || track.duration_ms) > 0
                                                            ? `${Math.floor((track.duration || track.duration_ms) / 60000)}:${Math.floor(((track.duration || track.duration_ms) % 60000) / 1000).toString().padStart(2, '0')}`
                                                            : null;

                                                        return (
                                                            <div 
                                                                key={`${track.id || track.trackID || 'track'}-${discSection.discNumber}-${sideSection.side || 'side'}-${index}`}
                                                                className="flex items-center justify-between py-2.5 sm:py-3 px-2 sm:px-3 hover:bg-[var(--theme-card)]/50 rounded-xl transition duration-150 border-b border-[var(--theme-border)]/40 last:border-b-0 group cursor-pointer"
                                                                onClick={() => (track.id || track.trackID) && router.push(`/track/${track.id || track.trackID}`)}
                                                            >
                                                                <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                                                                    <span className="w-7 text-center text-xs sm:text-sm font-semibold text-[var(--theme-muted)] group-hover:text-[var(--theme-fg)] shrink-0 font-mono">
                                                                        {track.trackNumber || track.pos || index + 1}
                                                                    </span>

                                                                    <div className="flex flex-col min-w-0 flex-1">
                                                                        <div className="flex items-center gap-1.5 min-w-0">
                                                                            <span className="font-semibold text-sm sm:text-base text-[var(--theme-fg)] group-hover:text-[var(--theme-accent)] transition-colors truncate">
                                                                                {trackTitle}
                                                                            </span>
                                                                            {isExplicit && (
                                                                                <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-[3px] text-[9px] font-bold bg-[var(--theme-muted)]/20 text-[var(--theme-fg)]/90 shrink-0 select-none">
                                                                                    E
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        {artistsStr && artistsStr !== (album.name || album.title) && (
                                                                            <span className="text-xs text-[var(--theme-muted)] truncate block mt-0.5">
                                                                                {artistsStr}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                <div className="flex items-center gap-3 shrink-0 ml-3" onClick={(e) => e.stopPropagation()}>
                                                                    {formattedDuration && (
                                                                        <span className="text-xs text-[var(--theme-muted)] font-mono font-medium">
                                                                            {formattedDuration}
                                                                        </span>
                                                                    )}

                                                                    <DropdownMenu>
                                                                        <DropdownMenuTrigger asChild>
                                                                            <button 
                                                                                className="p-1.5 rounded-lg hover:bg-[var(--theme-card)] text-[var(--theme-muted)] hover:text-[var(--theme-fg)] transition cursor-pointer"
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
                                                                                    id: track.id || track.trackID,
                                                                                    type: 'track',
                                                                                    name: trackTitle,
                                                                                    title: trackTitle,
                                                                                    artist: trackArtists,
                                                                                    album: album.name || album.title,
                                                                                    imageUrl: coverUrl,
                                                                                    coverArt: coverUrl,
                                                                                    popularity: 85,
                                                                                    explicit: isExplicit,
                                                                                    genres: album.genres || [],
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
                                                                                    id: track.id || track.trackID,
                                                                                    title: trackTitle,
                                                                                    artist: trackArtists,
                                                                                    imageUrl: coverUrl,
                                                                                    album: album.name || album.title,
                                                                                    explicit: isExplicit,
                                                                                    genres: album.genres || []
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
                                                                                                id: track.id || track.trackID,
                                                                                                name: trackTitle,
                                                                                                title: trackTitle,
                                                                                                artists: trackArtists,
                                                                                                duration_ms: track.duration || track.duration_ms,
                                                                                                album: {
                                                                                                    id: album.id || id,
                                                                                                    name: album.name || album.title,
                                                                                                    images: [{ url: coverUrl }]
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
                                                                                        artists: trackArtists,
                                                                                        type: "track",
                                                                                        id: track.id || track.trackID,
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
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Reviews, Descriptions, Lore, Categorized Tags & External Links */}
            <MusicLoreAndReviews
                id={album.id || id}
                type="album"
                title={album.name || album.title}
                artist={artistsList.map(a => a.name).join(', ')}
                description={album.description}
                primaryGenre={displayGenre}
                genres={album.genres || []}
                categorizedTags={album.categorizedTags || null}
                tags={album.tags || album.genres || []}
                allTags={album.allTags || []}
                rating={album.rating}
                externalLinks={album.externalLinks || []}
                totalDurationMs={totalDurationMs}
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
                    id: album.id || id,
                    type: "album",
                    name: album.name || album.title,
                    title: album.name || album.title,
                    artist: artistsList,
                    album: album.name || album.title,
                    imageUrl: coverUrl,
                    coverArt: coverUrl,
                    releaseDate: album.releaseDate || album.release_date || (releaseYear ? String(releaseYear) : null),
                    releaseYear: releaseYear,
                    popularity: album.popularity || 85,
                    explicit: false,
                    genres: validGenres,
                    externalLinks: album.externalLinks || [],
                    spotifyUrl: album.external_urls?.spotify || album.spoURL,
                    youtubeUrl: album.YTURL
                }}
            />

            {/* Album GrooveCard Composer Modal */}
            <GrooveCardComposer
                isOpen={isGrooveCardOpen}
                onClose={() => setIsGrooveCardOpen(false)}
                itemId={album.id || id}
                title={album.name || album.title}
                artist={artistsList}
                imageUrl={coverUrl}
                album={album.name || album.title}
                releaseYear={releaseYear}
                releaseDate={album.releaseDate || album.release_date || (releaseYear ? String(releaseYear) : null)}
                popularity={album.popularity || 85}
                explicit={false}
                type="album"
                genres={validGenres}
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
                    releaseYear={album.releaseYear}
                    popularity={85}
                    explicit={selectedTrackForGrooveCard.explicit}
                    type="track"
                    genres={selectedTrackForGrooveCard.genres || album.genres || []}
                />
            )}

            {/* Album Editions & Pressings Drawer */}
            <AlbumEditionsDrawer
                isOpen={isEditionsDrawerOpen}
                onClose={() => setIsEditionsDrawerOpen(false)}
                editions={album.editions || []}
                selectedReleaseId={selectedReleaseId}
                onSwitchEdition={handleSwitchEdition}
                loadingTracks={loadingTracks}
                albumName={album.name || album.title}
                albumCoverUrl={coverUrl}
            />
        </div>
    );
}
