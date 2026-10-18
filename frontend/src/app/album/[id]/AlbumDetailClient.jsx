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
import MusicLoreAndReviews from "@/Components/MusicLoreAndReviews";
import RatingPieChart from "@/Components/RatingPieChart";
import GrooveLoader from "@/Components/GrooveLoader";
import { toast } from "@/lib/toast";

export default function AlbumDetailClient({ id, initialAlbum, initialTracks }) {
    const router = useRouter();
    const [album, setAlbum] = useState(initialAlbum);
    const [tracks, setTracks] = useState(initialTracks || []);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState(null);
    const [loadingTracks, setLoadingTracks] = useState(false);
    const [expandedHeroDesc, setExpandedHeroDesc] = useState(false);
    const [selectedReleaseId, setSelectedReleaseId] = useState(initialAlbum?.selectedReleaseId || null);
    const [isGrooveLinkOpen, setIsGrooveLinkOpen] = useState(false);
    const [isGrooveCardOpen, setIsGrooveCardOpen] = useState(false);
    const [selectedTrackForGrooveLink, setSelectedTrackForGrooveLink] = useState(null);
    const [selectedTrackForGrooveCard, setSelectedTrackForGrooveCard] = useState(null);

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
                toast.success(`Switched edition: ${labelYear} (${data.tracks?.length || 0} tracks) 💿`);
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

    // Group variations into clear, meaningful eras
    const groupedVariations = useMemo(() => {
        if (!album?.variations || !album.variations.length) return [];

        const originalYear = album.originalReleaseYear || (album.variations.find(v => v.isOriginal)?.year) || album.releaseYear;
        const eraMap = new Map();

        album.variations.forEach((v) => {
            let eraKey = "other";
            let eraName = "Other Editions";
            let order = 99;

            if (v.isOriginal || (originalYear && v.year === originalYear)) {
                eraKey = "original";
                eraName = `★ Original Release (${originalYear || 'Classic'})`;
                order = 1;
            } else if (v.year && v.year < 1980) {
                eraKey = "1970s";
                eraName = "1970s Pressings";
                order = 2;
            } else if (v.year && v.year < 1990) {
                eraKey = "1980s";
                eraName = "Early CD & Masters (1980s)";
                order = 3;
            } else if (v.year && v.year < 2000) {
                eraKey = "1990s";
                eraName = "Remasters & Bonus Tracks (1990s)";
                order = 4;
            } else if (v.year && v.year < 2010) {
                eraKey = "2000s";
                eraName = "2000s Reissues & Digital";
                order = 5;
            } else {
                eraKey = "modern";
                eraName = "Anniversary & Modern Remasters (2010+)";
                order = 6;
            }

            if (!eraMap.has(eraKey)) {
                eraMap.set(eraKey, {
                    key: eraKey,
                    name: eraName,
                    order: order,
                    items: [],
                });
            }
            eraMap.get(eraKey).items.push(v);
        });

        return Array.from(eraMap.values()).sort((a, b) => a.order - b.order);
    }, [album?.variations, album?.originalReleaseYear, album?.releaseYear]);

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
        const albumName = album?.name || album?.title || 'Album';
        const artistsStr = (Array.isArray(album?.artists) ? album.artists : [{ name: album?.artist || 'Various Artists' }]).map(a => a.name).join(', ');
        const shareTitle = `${albumName} by ${artistsStr}`;
        const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
        const shareText = `Check out "${albumName}" by ${artistsStr} on GrooveEstrella! 💿\n${shareUrl}`;

        if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
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
                toast.success('Album link copied to clipboard! 📋');
            } catch (_) {
                toast.info(shareUrl);
            }
        } else {
            toast.info(shareUrl);
        }
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
            if (lower.includes("#")) continue;
            if (/^\d/.test(lower)) continue;
            if (/^#?\d{2,4}s?$/i.test(lower)) continue;
            if (lower.length < 3) continue;

            const ignored = new Set([
                "album", "albums", "ep", "single", "singles", "lp", "cd", "vinyl", "audio",
                "favorite", "favourites", "favorites", "favourite", "seen live",
                "owned", "wishlist", "my collection", "all time favorite", "classic"
            ]);
            if (ignored.has(lower)) continue;

            if (!seen.has(lower)) {
                seen.add(lower);
                const formatted = clean
                    .split(/[\s-]+/)
                    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
                    .join(" ");
                valid.push(formatted);
            }
        }
        return valid;
    }, [album?.genres, album?.tags]);

    const displayGenre = validGenres.length > 0 ? validGenres[0] : null;
    const releaseYear = album?.releaseYear || (album?.releaseDate ? new Date(album.releaseDate).getFullYear() : null);

    // Group tracks into distinct discs (Disc 1, Disc 2, Disc 3, etc.)
    const discGroups = useMemo(() => {
        if (!tracks || tracks.length === 0) return [];

        const groups = new Map();
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

            if (!groups.has(discNum)) {
                groups.set(discNum, {
                    discNumber: discNum,
                    title: track.discTitle ? `Disc ${discNum}: ${track.discTitle}` : `Disc ${discNum}`,
                    tracks: [],
                });
            }
            groups.get(discNum).tracks.push(track);
        });

        return Array.from(groups.values()).sort((a, b) => a.discNumber - b.discNumber);
    }, [tracks]);

    return (
        <div className="relative min-h-screen bg-[var(--theme-bg)] text-[var(--theme-fg)] p-4 pb-32 sm:p-6 md:pl-20 md:pr-20 lg:pl-40 lg:pr-40 pt-5 sm:pt-8 overflow-hidden transition-colors duration-300">
            {/* Full Screen Dynamic Ambient Art-Cover Gradient Backdrop */}
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
                    title="Share Album"
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
                    title="Share Album"
                >
                    <Share2 size={18} />
                </button>
            </header>

            {/* Centered Apple Music Style Hero (Matching Image 3) */}
            <div className="relative z-10 w-full max-w-xl mx-auto flex flex-col items-center text-center px-4 mb-8">
                {/* Square Album Cover */}
                <div className="w-56 h-56 sm:w-64 sm:h-64 md:w-72 md:h-72 aspect-square rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl bg-[var(--theme-surface)] ring-1 ring-white/10 group relative">
                    <img 
                        src={coverUrl} 
                        alt={album.name || album.title} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                        onError={(e) => { e.currentTarget.src = 'https://placehold.co/500x500/17020B/E8A87C?text=Album'; }}
                    />
                </div>

                {/* Album Title with Explicit [E] badge */}
                <div className="mt-5 sm:mt-6 flex items-center justify-center gap-2 flex-wrap">
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-black leading-tight text-white tracking-tight">
                        {album.name || album.title}
                    </h1>
                    <span className="inline-flex items-center justify-center w-4 h-4 rounded-[3px] text-[10px] font-bold bg-white/20 text-white/90 shrink-0 select-none">
                        E
                    </span>
                </div>

                {/* Clickable Artist Name */}
                <div className="mt-1">
                    {artistsList.map((a, i) => (
                        <span
                            key={`${a.id || 'artist'}-${i}`}
                            className="text-base sm:text-lg font-semibold text-white/90 hover:text-[var(--theme-accent)] transition cursor-pointer"
                            onClick={() => a.id && router.push(`/artist/${a.id}`)}
                        >
                            {a.name}{i < artistsList.length - 1 && ', '}
                        </span>
                    ))}
                </div>

                {/* Subtitle: Genre · Year */}
                <p className="text-xs sm:text-sm text-white/60 font-medium mt-1">
                    {displayGenre ? `${displayGenre} · ` : ""}{releaseYear || "Album"}
                </p>

                {/* Multi-Disc Info: No. of Discs · Combined Timing */}
                {discGroups.length > 1 && (
                    <p className="text-xs sm:text-sm text-white/50 font-medium mt-0.5 flex items-center justify-center gap-1.5">
                        <span>{discGroups.length} Discs</span>
                        {formattedTotalTime && (
                            <>
                                <span>·</span>
                                <span>{formattedTotalTime}</span>
                            </>
                        )}
                    </p>
                )}

                {/* Centered Action Controls Row: GrooveCard, Open GrooveLink, Bookmark */}
                <div className="mt-6 flex items-center justify-center gap-3 sm:gap-4 max-w-full">
                    {/* Create GrooveCard Button */}
                    <button
                        onClick={() => setIsGrooveCardOpen(true)}
                        className="w-12 h-12 rounded-full aspect-square shrink-0 bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center transition-all duration-200 backdrop-blur-md cursor-pointer shadow-lg border border-white/15 group"
                        title="Create GrooveCard"
                    >
                        <Sparkles size={20} className="text-white group-hover:text-[var(--theme-accent)] transition-colors" />
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

                    {/* Bookmark / Plus Button */}
                    <button
                        onClick={toggleSave}
                        className="w-12 h-12 rounded-full aspect-square shrink-0 bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center transition-all duration-200 backdrop-blur-md cursor-pointer shadow-lg border border-white/15"
                        title={saved ? "Remove from Library" : "Add to Library"}
                    >
                        {saved ? <Check size={20} className="text-[var(--theme-accent)]" /> : <Plus size={20} />}
                    </button>
                </div>

                {/* Description / Editorial Notes (Matching Image 3) */}
                {album.description && (
                    <div className="mt-6 w-full text-left text-xs sm:text-sm text-white/80 leading-relaxed font-body">
                        <strong className="font-extrabold text-white mr-1.5">Editor's Notes</strong>
                        <span className={!expandedHeroDesc ? "line-clamp-2" : ""}>
                            {album.description}
                        </span>
                        {album.description.length > 80 && (
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
                {/* Grouped Editions & Variations Switcher Bar (Pressing / Versions) */}
                {groupedVariations.length > 0 && (
                    <div className="mb-6 p-4 rounded-2xl bg-[var(--theme-card)]/80 border border-[var(--theme-border)] backdrop-blur-xl space-y-3">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2 text-xs font-bold text-[var(--theme-accent)] uppercase tracking-wider">
                                <Layers size={14} />
                                <span>Editions & Variations ({album.variations?.length || 0} pressings across {groupedVariations.length} eras)</span>
                            </div>
                            <span className="text-[11px] text-[var(--theme-muted)]">
                                {loadingTracks ? (
                                    <span className="text-[var(--theme-accent)] font-bold animate-pulse inline-flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-[var(--theme-accent)] animate-ping inline-block" />
                                        Switching edition...
                                    </span>
                                ) : (
                                    <>Active: <strong className="text-[var(--theme-fg)]">{album.releaseDate || 'Default'}</strong> • {tracks.length} tracks</>
                                )}
                            </span>
                        </div>

                        {/* Top Level: Group / Era Selector */}
                        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-[var(--theme-border)]">
                            {groupedVariations.map((group, groupIdx) => {
                                const isGroupActive = group.items.some(
                                    item => (selectedReleaseId === item.id) || (!selectedReleaseId && item.isOriginal)
                                );
                                return (
                                    <button
                                        key={`${group.key}-${groupIdx}`}
                                        disabled={loadingTracks}
                                        onClick={() => {
                                            const firstItem = group.items[0];
                                            if (firstItem) handleSwitchEdition(firstItem.id);
                                        }}
                                        className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed ${
                                            isGroupActive
                                                ? "bg-[var(--theme-accent)] text-[var(--theme-bg)] font-bold shadow-md ring-1 ring-[var(--theme-accent)]"
                                                : "bg-[var(--theme-surface)] border border-[var(--theme-border)] text-[var(--theme-muted)] hover:text-[var(--theme-fg)] hover:border-[var(--theme-accent)]/50"
                                        }`}
                                    >
                                        <span>{group.name}</span>
                                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                                            isGroupActive ? "bg-[var(--theme-bg)]/20 text-[var(--theme-bg)]" : "bg-[var(--theme-card)] text-[var(--theme-muted)]"
                                        }`}>
                                            {group.items.length}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Sub Level: Pressings in the Active Group */}
                        {(() => {
                            const activeGroup = groupedVariations.find(group => 
                                group.items.some(item => (selectedReleaseId === item.id) || (!selectedReleaseId && item.isOriginal))
                            ) || groupedVariations[0];

                            if (!activeGroup || activeGroup.items.length <= 1) return null;

                            return (
                                <div className="pt-2.5 border-t border-[var(--theme-border)] flex items-center gap-2 overflow-x-auto text-xs pb-1 scrollbar-thin scrollbar-thumb-[var(--theme-border)]">
                                    <span className="text-[10px] uppercase font-bold text-[var(--theme-muted)] tracking-wider shrink-0">
                                        Regional Pressings:
                                    </span>
                                    {activeGroup.items.map((item, itemIdx) => {
                                        const isSelected = (selectedReleaseId === item.id) || (!selectedReleaseId && item.isOriginal);
                                        return (
                                            <button
                                                key={`${item.id}-${itemIdx}`}
                                                disabled={loadingTracks}
                                                onClick={() => handleSwitchEdition(item.id)}
                                                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition cursor-pointer flex items-center gap-1 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed ${
                                                    isSelected
                                                        ? "bg-[var(--theme-accent)]/20 text-[var(--theme-accent)] border border-[var(--theme-accent)]/40 font-bold"
                                                        : "bg-[var(--theme-surface)] text-[var(--theme-muted)] hover:text-[var(--theme-fg)] border border-transparent hover:border-[var(--theme-border)]"
                                                }`}
                                            >
                                                <span>{item.country || 'Global'}</span>
                                                {item.year && <span className="text-[9px] opacity-70 font-mono">({item.year})</span>}
                                            </button>
                                        );
                                    })}
                                </div>
                            );
                        })()}
                    </div>
                )}

                {tracks.length === 0 || loadingTracks ? (
                    <div className="flex flex-col items-center justify-center p-12 rounded-2xl bg-[var(--theme-card)]/50 border border-[var(--theme-border)] text-center">
                        <GrooveLoader size={56} />
                    </div>
                ) : (
                    <div className="space-y-10">
                        {discGroups.map((discGroup) => {
                            const discDurationMs = discGroup.tracks.reduce((acc, t) => acc + (t.duration || t.duration_ms || 0), 0);
                            const discFormattedTime = formatTotalDuration(discDurationMs);

                            return (
                                <div key={`disc-group-${discGroup.discNumber}`} className="space-y-3">
                                    {/* Disc Header (Disc 1, Disc 2, Disc 3, etc.) */}
                                    <div className="flex items-center justify-between px-1 border-b border-white/10 pb-2">
                                        <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                                            <span>{discGroup.title}</span>
                                            {discGroups.length > 1 && (
                                                <span className="text-[10px] font-semibold text-[var(--theme-accent)] px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
                                                    {discGroup.tracks.length} songs
                                                </span>
                                            )}
                                        </h2>
                                        {discFormattedTime && (
                                            <span className="text-xs text-white/50 font-medium flex items-center gap-1.5">
                                                <Clock size={13} className="text-[var(--theme-accent)]" />
                                                <span>{discFormattedTime}</span>
                                            </span>
                                        )}
                                    </div>

                                    {/* Tracklist for this Disc */}
                                    <div className="flex flex-col">
                                        {discGroup.tracks.map((track, index) => {
                                            const trackArtists = Array.isArray(track.artists) ? track.artists : Array.isArray(track.artist) ? track.artist : artistsList;
                                            const trackTitle = track.title || track.name;
                                            const artistsStr = trackArtists.map(a => a.name).join(', ');
                                            const isExplicit = track.explicit || false;
                                            const formattedDuration = typeof (track.duration || track.duration_ms) === 'number' && (track.duration || track.duration_ms) > 0
                                                ? `${Math.floor((track.duration || track.duration_ms) / 60000)}:${Math.floor(((track.duration || track.duration_ms) % 60000) / 1000).toString().padStart(2, '0')}`
                                                : null;

                                            return (
                                                <div 
                                                    key={`${track.id || track.trackID || 'track'}-${discGroup.discNumber}-${index}`}
                                                    className="flex items-center justify-between py-2.5 sm:py-3 px-2 sm:px-3 hover:bg-white/5 rounded-xl transition duration-150 border-b border-white/10 last:border-b-0 group cursor-pointer"
                                                    onClick={() => (track.id || track.trackID) && router.push(`/track/${track.id || track.trackID}`)}
                                                >
                                                    <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                                                        <span className="w-7 text-center text-xs sm:text-sm font-semibold text-white/50 group-hover:text-white shrink-0">
                                                            {track.trackNumber || track.pos || index + 1}
                                                        </span>

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
                                                            {artistsStr && artistsStr !== (album.name || album.title) && (
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
                                                                    <Bookmark size={15} className="text-[var(--theme-accent)]" />
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
                                                                        if (typeof navigator !== "undefined") {
                                                                            navigator.clipboard.writeText(`${window.location.origin}/track/${track.id || track.trackID}`);
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
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Reviews, Descriptions, Lore, All Tags & External Links */}
            <MusicLoreAndReviews
                id={album.id || id}
                type="album"
                title={album.name || album.title}
                artist={artistsList.map(a => a.name).join(', ')}
                description={album.description}
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
        </div>
    );
}
