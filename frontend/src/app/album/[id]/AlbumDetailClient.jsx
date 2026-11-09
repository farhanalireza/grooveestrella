// src/app/album/[id]/AlbumDetailClient.jsx
"use client";

import { useEffect, useState, useMemo, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bookmark, BookmarkCheck, Disc, ChevronRight, Clock, Layers, Sparkles, Plus, Check, MoreHorizontal, Copy, Play, Share2, ListPlus, ListMusic, BookOpen, Tag, Star, Globe } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { extractAdaptivePalette } from "@/lib/colorExtractor";
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
import UserRatingWidget from "@/Components/UserRatingWidget";
import GrooveLoader from "@/Components/GrooveLoader";
import { toast } from "@/lib/toast";
import { shareLink } from "@/lib/shareHelper";

export default function AlbumDetailClient({ id, initialAlbum, initialTracks }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [navigatingTrackId, setNavigatingTrackId] = useState(null);
    const [navigatingArtistId, setNavigatingArtistId] = useState(null);
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
    const [activeTab, setActiveTab] = useState("tracks");
    const { theme, setAdaptivePalette, clearAdaptivePalette } = useTheme();

    useEffect(() => {
        if (typeof window !== "undefined") {
            const savedPref = localStorage.getItem("groove_show_vinyl_sides");
            if (savedPref !== null) {
                setShowVinylSides(savedPref === "true");
            } else {
                setShowVinylSides(true);
            }
        }
    }, []);

    const ALBUM_TABS = useMemo(() => [
        { id: 'tracks', label: 'Tracks', count: tracks.length, icon: ListMusic },
        { id: 'about', label: 'About & Info', icon: BookOpen },
        { id: 'lore', label: 'Genres & Lore', icon: Tag },
        { id: 'reviews', label: 'Ratings & Reviews', icon: Star },
        { id: 'links', label: 'Links & Editions', icon: Globe },
    ], [tracks.length]);

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

        // Optimistically update cover art to the selected edition
        const targetEdition = album?.editions?.find(e => e.id === relId);
        const newCover = targetEdition?.coverArt || `https://coverartarchive.org/release/${relId}/front-500`;
        setAlbum(prev => prev ? {
            ...prev,
            coverArt: newCover,
            url: newCover,
            images: [{ url: newCover, width: 600, height: 600 }],
        } : prev);
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

    const handleRestoreMainCover = (e) => {
        e?.stopPropagation?.();
        if (!album?.mainCoverArt) return;
        setAlbum(prev => prev ? {
            ...prev,
            coverArt: prev.mainCoverArt,
            url: prev.mainCoverArt,
            images: [{ url: prev.mainCoverArt, width: 600, height: 600 }],
        } : prev);
        toast.success("Restored main album artwork 🎨");
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

    // Dynamic Album-Adaptive Theme Effect
    useEffect(() => {
        if (theme === "adaptive" && coverUrl) {
            extractAdaptivePalette(coverUrl, album.name || album.title || "album").then((palette) => {
                setAdaptivePalette(palette);
            });
        }
        return () => {
            clearAdaptivePalette();
        };
    }, [theme, coverUrl, album.name, album.title, setAdaptivePalette, clearAdaptivePalette]);

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

    const discCount = useMemo(() => {
        const discs = new Set();
        if (tracks && tracks.length > 0) {
            tracks.forEach((t) => {
                if (t.disc) discs.add(Number(t.disc));
            });
        }
        const fromEditions = album?.mediaCount || album?.editions?.[0]?.discCount || 0;
        return Math.max(discs.size, trackSections?.length || 0, fromEditions, 1);
    }, [tracks, trackSections, album]);

    const hasAnySides = useMemo(() => {
        return tracks && tracks.some((t) => t.side);
    }, [tracks]);

    return (
        <div className="relative min-h-screen bg-[var(--theme-bg)] text-[var(--theme-fg)] p-4 pb-32 sm:p-6 md:pl-20 md:pr-20 lg:pl-40 lg:pr-40 pt-5 sm:pt-8 overflow-hidden transition-colors duration-300">
            {/* Full Screen Dynamic Ambient Art-Cover Gradient Backdrop with Adaptive Contrast Protection */}
            <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
                <div 
                    className="absolute inset-0 bg-cover bg-center scale-110 blur-3xl opacity-35 dark:opacity-30 saturate-150 contrast-110 transition-all duration-700"
                    style={{ backgroundImage: `url(${coverUrl})` }}
                />
                {/* Darkening Scrim layer preventing bright/white album covers from washing out typography */}
                <div className="absolute inset-0 bg-black/55 dark:bg-black/65" />
                <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-black/60 via-black/30 to-transparent" />
                <div 
                    className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--theme-bg)]/80 to-[var(--theme-bg)]"
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

            {/* Revamped High-Fidelity Album Hero */}
            <div className="relative z-10 w-full max-w-xl mx-auto flex flex-col items-center text-center px-4 mb-8">
                {/* Square Album Cover with Interactive Vinyl Disc Peeking */}
                <div className="relative group mx-auto mb-2 flex items-center justify-center">
                    {/* Concentric Vinyl Disc Peeking from behind the jacket */}
                    <div 
                        className="absolute w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 rounded-full bg-[#0c0d12] shadow-2xl border border-white/10 flex items-center justify-center transition-all duration-700 ease-out group-hover:translate-x-12 sm:group-hover:translate-x-16 group-hover:rotate-45 pointer-events-none select-none z-0 translate-x-4 sm:translate-x-6 rotate-12"
                        style={{
                            backgroundImage: 'repeating-radial-gradient(circle, #16181f, #16181f 2px, #0c0d12 3px, #0c0d12 4px)',
                            boxShadow: '0 20px 40px -10px rgba(0,0,0,0.8), inset 0 0 0 2px rgba(255,255,255,0.06)'
                        }}
                    >
                        {/* Center Vinyl Label with miniature album artwork */}
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 border-white/20 shadow-inner flex items-center justify-center relative bg-black">
                            <img src={coverUrl} alt="Label" className="w-full h-full object-cover" />
                            <div className="absolute w-3.5 h-3.5 rounded-full bg-[#0a0a0d] border border-white/40 shadow-inner" />
                        </div>
                    </div>

                    {/* Front Album Jacket Cover */}
                    <div className="relative z-10 w-52 h-52 sm:w-60 sm:h-60 md:w-68 md:h-68 aspect-square rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl bg-[var(--theme-surface)] ring-1 ring-white/15 backdrop-blur-sm group-hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.7)] transition-all duration-500">
                        <img 
                            src={coverUrl} 
                            alt={album.name || album.title} 
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                            onError={(e) => { 
                                if (album?.mainCoverArt && e.currentTarget.src !== album.mainCoverArt) {
                                    e.currentTarget.src = album.mainCoverArt;
                                } else {
                                    e.currentTarget.src = 'https://placehold.co/500x500/17020B/E8A87C?text=Album'; 
                                }
                            }}
                        />
                        {/* Subtle Vinyl Jacket Sheen */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-black/20 via-transparent to-white/10 pointer-events-none" />
                    </div>
                </div>

                {/* Album Title with Inline Explicit [E] badge */}
                <div className="mt-4 sm:mt-5 flex items-center justify-center gap-2 flex-wrap max-w-lg">
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-black leading-tight text-[var(--theme-fg)] tracking-tight font-display text-center inline-flex items-center gap-2 flex-wrap justify-center drop-shadow-[0_2px_12px_rgba(0,0,0,0.85)]">
                        <span>{album.name || album.title}</span>
                        <span className="inline-flex items-center justify-center w-4 h-4 rounded-[3px] text-[10px] font-bold bg-white/10 text-white/80 shrink-0 select-none align-middle" title="Explicit Content">
                            E
                        </span>
                    </h1>
                </div>

                {/* Clickable Artist Name */}
                <div className="mt-1 flex items-center justify-center flex-wrap gap-1">
                    {artistsList.map((a, i) => (
                        <span
                            key={`${a.id || 'artist'}-${i}`}
                            className="text-base sm:text-lg font-semibold text-[var(--theme-fg)]/90 hover:text-[var(--theme-accent)] transition cursor-pointer inline-flex items-center gap-1 drop-shadow-[0_1px_6px_rgba(0,0,0,0.7)]"
                            onClick={() => {
                                if (a.id && !isPending) {
                                    setNavigatingArtistId(a.id);
                                    startTransition(() => {
                                        router.push(`/artist/${a.id}`);
                                    });
                                }
                            }}
                        >
                            <span>{a.name}{i < artistsList.length - 1 && ', '}</span>
                            {isPending && navigatingArtistId === a.id && (
                                <span className="w-3 h-3 rounded-full border-2 border-[var(--theme-accent)] border-t-transparent animate-spin inline-block" />
                            )}
                        </span>
                    ))}
                </div>

                {/* Refined Responsive Metadata (Year & Genre • Songs, Duration, Discs & Editions) */}
                <div className="mt-2.5 flex flex-col items-center justify-center gap-2 select-none max-w-md mx-auto">
                    {/* Primary Musical Lore */}
                    {(releaseYear || displayGenre) && (
                        <div className="flex items-center justify-center gap-2 text-xs font-semibold text-[var(--theme-muted)] flex-wrap">
                            {releaseYear && <span className="font-mono">{releaseYear}</span>}
                            {releaseYear && displayGenre && <span className="opacity-40">·</span>}
                            {displayGenre && <span className="text-[var(--theme-fg)]/90 font-medium">{displayGenre}</span>}
                        </div>
                    )}

                    {/* Secondary Metrics & Badges Row (Clean dot separator, NO comma between songs and length!) */}
                    <div className="flex items-center justify-center gap-2 flex-wrap text-xs">
                        {tracks.length > 0 && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--theme-card)]/80 backdrop-blur-md border border-[var(--theme-border)] text-[var(--theme-muted)] text-[11px] font-medium shadow-xs">
                                <Clock size={11} className="text-[var(--theme-accent)] shrink-0" />
                                <span>{tracks.length} songs{formattedTotalTime ? ` · ${formattedTotalTime}` : ''}</span>
                            </span>
                        )}

                        {discCount > 1 && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--theme-card)]/80 backdrop-blur-md border border-[var(--theme-border)] text-[var(--theme-fg)] text-[11px] font-semibold shadow-xs">
                                <Disc size={11} className="text-[var(--theme-accent)] shrink-0" />
                                <span>{discCount} Discs</span>
                            </span>
                        )}

                        {album.editions && album.editions.length > 1 && (
                            <button
                                onClick={() => setIsEditionsDrawerOpen(true)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--theme-accent)]/15 hover:bg-[var(--theme-accent)]/25 text-[var(--theme-accent)] border border-[var(--theme-accent)]/30 text-[11px] font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                                title="Explore pressings & editions"
                            >
                                <Layers size={11} className="shrink-0" />
                                <span>{album.editions.length} Editions</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Compact Floating Dual-Rating Capsule */}
                <div className="mt-3.5 flex items-center justify-center">
                    <UserRatingWidget
                        id={album.id || id}
                        type="album"
                        musicbrainzRating={album.rating}
                    />
                </div>

                {/* Centered Action Controls Row */}
                <div className="mt-6 flex items-center justify-center gap-3 sm:gap-4 max-w-full flex-wrap">
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
                        title="Open GrooveLink & Universal Streaming"
                    >
                        <img src="/in.svg" alt="GrooveLink" className="w-5 h-5 object-contain shrink-0" />
                        <span className="whitespace-nowrap">Open GrooveLink</span>
                        <ChevronRight size={15} className="shrink-0" />
                    </button>

                    {/* Bookmark / Save to Library Button */}
                    <button
                        onClick={toggleSave}
                        className="w-12 h-12 rounded-full aspect-square shrink-0 bg-[var(--theme-card)]/80 hover:bg-[var(--theme-surface)] active:scale-95 text-[var(--theme-fg)] flex items-center justify-center transition-all duration-200 backdrop-blur-md cursor-pointer shadow-lg border border-[var(--theme-border)]"
                        title={saved ? "Remove from Library" : "Save Album to Library"}
                    >
                        {saved ? <Check size={20} className="text-[var(--theme-accent)]" /> : <Plus size={20} />}
                    </button>

                    {/* Add All Tracks to Playlist Button */}
                    <button
                        onClick={() => {
                            if (tracks.length === 0) return;
                            const firstTrack = tracks[0];
                            window.dispatchEvent(new CustomEvent('open-playlist-picker', {
                                detail: {
                                    track: {
                                        id: firstTrack.id || firstTrack.trackID,
                                        name: firstTrack.title || firstTrack.name,
                                        title: firstTrack.title || firstTrack.name,
                                        artists: Array.isArray(firstTrack.artists) ? firstTrack.artists : artistsList,
                                        duration_ms: firstTrack.duration || firstTrack.duration_ms,
                                        album: {
                                            id: album.id || id,
                                            name: album.name || album.title,
                                            images: [{ url: coverUrl }]
                                        },
                                        allTracks: tracks.map(t => ({
                                            id: t.id || t.trackID,
                                            name: t.title || t.name,
                                            artists: Array.isArray(t.artists) ? t.artists : artistsList,
                                            duration_ms: t.duration || t.duration_ms,
                                        }))
                                    }
                                }
                            }));
                        }}
                        className="w-12 h-12 rounded-full aspect-square shrink-0 bg-[var(--theme-card)]/80 hover:bg-[var(--theme-surface)] active:scale-95 text-[var(--theme-fg)] flex items-center justify-center transition-all duration-200 backdrop-blur-md cursor-pointer shadow-lg border border-[var(--theme-border)] group"
                        title="Add Album to Playlist"
                    >
                        <ListPlus size={20} className="group-hover:text-[var(--theme-accent)] transition-colors" />
                    </button>
                </div>

            </div>

            {/* Segmented Navigation Tabs */}
            <div className="sticky top-0 sm:top-2 z-30 py-2.5 -mx-4 px-4 sm:mx-0 sm:px-0 bg-[var(--theme-bg)]/85 backdrop-blur-2xl border-y border-[var(--theme-border)]/50 mb-8 mt-2 transition-colors">
                <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar max-w-xl mx-auto justify-start sm:justify-center">
                    {ALBUM_TABS.map((tab) => {
                        const isActive = activeTab === tab.id;
                        const TabIcon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer whitespace-nowrap flex items-center gap-1.5 select-none ${
                                    isActive
                                        ? 'bg-[var(--theme-accent)] text-[var(--theme-accent-fg)] shadow-md shadow-[var(--theme-accent)]/20'
                                        : 'text-[var(--theme-muted)] hover:text-[var(--theme-fg)] hover:bg-[var(--theme-surface)]'
                                }`}
                            >
                                <TabIcon size={14} />
                                <span>{tab.label}</span>
                                {tab.count !== undefined && (
                                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                                        isActive ? 'bg-black/20 text-current' : 'bg-[var(--theme-surface)] text-[var(--theme-muted)]'
                                    }`}>
                                        {tab.count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* TAB 1: TRACKS */}
            {activeTab === "tracks" && (
                <div className="relative z-10 mb-12 animate-fade-in">
                    {/* Header row with Tracklist title */}
                    <div className="flex items-center justify-between mb-5 px-1">
                        <h2 className="text-xl sm:text-2xl font-extrabold text-[var(--theme-fg)] tracking-tight">
                            Tracklist
                        </h2>

                        {album.editions && album.editions.length > 1 && (
                            <button
                                onClick={() => setIsEditionsDrawerOpen(true)}
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--theme-surface)] hover:bg-[var(--theme-card)] border border-[var(--theme-border)] text-xs font-semibold text-[var(--theme-fg)] transition cursor-pointer shadow-xs"
                                title="Explore pressings & alternate editions"
                            >
                                <Layers size={13} className="text-[var(--theme-accent)]" />
                                <span>{album.editions.length} Editions</span>
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
                                                                className={`flex items-center justify-between py-2.5 sm:py-3 px-2 sm:px-3 hover:bg-[var(--theme-card)]/50 rounded-xl transition duration-150 border-b border-[var(--theme-border)]/40 last:border-b-0 group ${
                                                                    isPending && navigatingTrackId === (track.id || track.trackID) ? 'opacity-70 pointer-events-none cursor-wait' : 'cursor-pointer'
                                                                }`}
                                                                onClick={() => {
                                                                    const tId = track.id || track.trackID;
                                                                    if (tId && !isPending) {
                                                                        setNavigatingTrackId(tId);
                                                                        startTransition(() => {
                                                                            router.push(`/track/${tId}`);
                                                                        });
                                                                    }
                                                                }}
                                                            >
                                                                <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                                                                    <span className="w-7 text-center text-xs sm:text-sm font-semibold text-[var(--theme-muted)] group-hover:text-[var(--theme-fg)] shrink-0 font-mono flex items-center justify-center">
                                                                        {isPending && navigatingTrackId === (track.id || track.trackID) ? (
                                                                            <span className="w-3.5 h-3.5 rounded-full border-2 border-[var(--theme-accent)] border-t-transparent animate-spin inline-block" />
                                                                        ) : (
                                                                            showVinylSides 
                                                                                ? (track.trackNumber || track.pos || index + 1) 
                                                                                : (index + 1)
                                                                        )}
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

                                                                <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-3" onClick={(e) => e.stopPropagation()}>
                                                                    {/* Quick Action Pill Buttons on Desktop Hover */}
                                                                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity mr-1 hidden sm:flex">
                                                                        <button
                                                                            type="button"
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
                                                                            className="p-1.5 rounded-lg bg-[var(--theme-surface)] hover:bg-[var(--theme-card)] text-[var(--theme-fg)] border border-[var(--theme-border)] shadow-sm transition active:scale-95"
                                                                            title="Open GrooveLink"
                                                                        >
                                                                            <img src="/in.svg" alt="GrooveLink" className="w-3.5 h-3.5 object-contain" />
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setSelectedTrackForGrooveCard({
                                                                                id: track.id || track.trackID,
                                                                                title: trackTitle,
                                                                                artist: trackArtists,
                                                                                imageUrl: coverUrl,
                                                                                album: album.name || album.title,
                                                                                explicit: isExplicit,
                                                                                genres: album.genres || []
                                                                            })}
                                                                            className="p-1.5 rounded-lg bg-[var(--theme-surface)] hover:bg-[var(--theme-card)] text-[var(--theme-fg)] hover:text-[var(--theme-accent)] border border-[var(--theme-border)] shadow-sm transition active:scale-95"
                                                                            title="Create GrooveCard"
                                                                        >
                                                                            <Sparkles size={14} />
                                                                        </button>
                                                                    </div>

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
            )}

            {/* OTHER TABS: About & Info, Genres & Lore, Ratings & Reviews, Links & Editions */}
            {activeTab !== "tracks" && (
                <div className="relative z-10 mb-12 animate-fade-in max-w-4xl mx-auto">
                    <MusicLoreAndReviews
                        id={album.id || id}
                        type="album"
                        title={album.name || album.title}
                        artist={artistsList.map(a => a.name).join(', ')}
                        description={album.description}
                        artistDescription={album.artistDescription || (artistsList?.[0]?.description)}
                        releaseDetails={{
                            releaseDate: album.releaseDate || (releaseYear ? String(releaseYear) : null),
                            label: album.label || (album.labels && album.labels[0]?.name),
                            country: album.country,
                            format: album.format || (album.editions && album.editions[0]?.format),
                            barcode: album.barcode
                        }}
                        primaryGenre={displayGenre}
                        genres={album.genres || []}
                        categorizedTags={album.categorizedTags || null}
                        tags={album.tags || album.genres || []}
                        allTags={album.allTags || []}
                        rating={album.rating}
                        externalLinks={album.externalLinks || []}
                        totalDurationMs={totalDurationMs}
                        activeTab={activeTab}
                    />
                </div>
            )}

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
                rating={album.rating}
                duration={totalDurationMs}
                discCount={trackSections.length}
                totalTracks={tracks.length || album.total_tracks}
                explicit={false}
                type="album"
                genres={validGenres}
                tracks={tracks}
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
                    rating={album.rating}
                    duration={selectedTrackForGrooveCard.duration || selectedTrackForGrooveCard.duration_ms}
                    discCount={selectedTrackForGrooveCard.disc || 1}
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
                mainCoverUrl={album.mainCoverArt || coverUrl}
                onRestoreMainCover={handleRestoreMainCover}
            />
        </div>
    );
}
