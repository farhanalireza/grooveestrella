// src/app/artist/[id]/ArtistDetailClient.jsx
"use client";

import { useEffect, useState, useMemo, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bookmark, BookmarkCheck, Users, User, Award, Music, ChevronRight, MoreHorizontal, Play, Share2, ListPlus, Sparkles, Link2, Info, MapPin, Calendar, Clock, ListMusic, BookOpen, Tag, Star, Globe, Disc } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { extractAdaptivePalette, extractEdgeColors } from "@/lib/colorExtractor";
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
import EntityReviewsSection from "@/Components/EntityReviewsSection";
import RatingPieChart from "@/Components/RatingPieChart";
import UserRatingWidget from "@/Components/UserRatingWidget";
import ArtistLinksDrawer from "@/Components/ArtistLinksDrawer";
import ArtistDetailsDrawer from "@/Components/ArtistDetailsDrawer";
import ArtistBioAndLineupTab from "@/Components/ArtistBioAndLineupTab";
import ArtistLinksTab from "@/Components/ArtistLinksTab";
import GrooveLoader from "@/Components/GrooveLoader";
import { toast } from "@/lib/toast";
import { shareLink } from "@/lib/shareHelper";

export default function ArtistDetailClient({ id, initialArtist, initialTopTracks, initialAlbums }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [navigatingTrackId, setNavigatingTrackId] = useState(null);
    const [navigatingAlbumId, setNavigatingAlbumId] = useState(null);
    const [artist, setArtist] = useState(initialArtist);
    const [topTracks, setTopTracks] = useState(initialTopTracks || []);
    const [albums, setAlbums] = useState(initialAlbums || []);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState(null);
    const [expandedHeroDesc, setExpandedHeroDesc] = useState(false);
    const [isGrooveLinkOpen, setIsGrooveLinkOpen] = useState(false);
    const [isGrooveCardOpen, setIsGrooveCardOpen] = useState(false);
    const [isLinksDrawerOpen, setIsLinksDrawerOpen] = useState(false);
    const [isDetailsDrawerOpen, setIsDetailsDrawerOpen] = useState(false);
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

    const [activeTab, setActiveTab] = useState("music");
    const [edgeColors, setEdgeColors] = useState({ topColor: null, bottomColor: null });
    const { theme, setAdaptivePalette, clearAdaptivePalette, colors } = useTheme();

    const ARTIST_TABS = useMemo(() => {
        const isGrp = artist?.isGroup ?? /group|band|orchestra|choir/i.test(artist?.type || "");
        const extCount = Array.isArray(artist?.externalLinks) ? artist.externalLinks.length : 0;
        return [
            { id: 'music', label: 'Music', icon: Music },
            { id: 'about', label: isGrp ? 'Bio & Lineup' : 'Bio & Details', icon: BookOpen },
            { id: 'lore', label: 'Genres & Roots', icon: Tag },
            { id: 'reviews', label: 'Ratings & Reviews', icon: Star },
            { id: 'links', label: 'External Links', count: extCount, icon: Globe },
        ];
    }, [artist?.type, artist?.isGroup, artist?.externalLinks]);

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

    // Dynamic Artist-Adaptive Theme Effect & Edge Color Sampling
    useEffect(() => {
        if (coverUrl) {
            extractEdgeColors(coverUrl).then((edges) => {
                setEdgeColors(edges);
            });
        }
        if (theme === "adaptive" && coverUrl) {
            extractAdaptivePalette(coverUrl, artist?.name || "artist").then((palette) => {
                setAdaptivePalette(palette);
            });
        }
        return () => {
            clearAdaptivePalette();
        };
    }, [theme, coverUrl, artist?.name, setAdaptivePalette, clearAdaptivePalette]);
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

    // Distinguish Group vs Solo Artist and parse metadata
    const isGroup = artist.isGroup ?? /group|band|orchestra|choir/i.test(artist.type || "");
    const entityTypeLabel = isGroup ? (artist.type || "Band / Group") : "Solo Artist";

    // Safe, robust members normalization to guarantee arrays and prevent runtime crashes
    const safeMembers = useMemo(() => {
        const raw = artist?.members;
        if (!raw) return { og: [], current: [], past: [], supporting: [] };
        if (Array.isArray(raw)) {
            return {
                og: raw.filter((m) => Array.isArray(m?.roles) && m.roles.some((r) => typeof r === "string" && /original|founder/i.test(r))),
                current: raw.filter((m) => !m?.ended && !m?.end),
                past: raw.filter((m) => m?.ended || !!m?.end),
                supporting: [],
            };
        }
        return {
            og: Array.isArray(raw.og) ? raw.og : [],
            current: Array.isArray(raw.current) ? raw.current : [],
            past: Array.isArray(raw.past) ? raw.past : [],
            supporting: Array.isArray(raw.supporting) ? raw.supporting : [],
        };
    }, [artist?.members]);

    const members = safeMembers;
    const currentMembersCount = safeMembers.current.length;
    const ogCount = safeMembers.og.length;
    const totalLineupCount = currentMembersCount + safeMembers.past.length;
    const bands = Array.isArray(artist.bands) ? artist.bands : [];
    const collaborations = Array.isArray(artist.collaborations) ? artist.collaborations : [];
    const externalLinks = Array.isArray(artist.externalLinks) ? artist.externalLinks : [];
    const lifeSpan = artist.lifeSpan || {};
    const beginYear = lifeSpan.begin ? String(lifeSpan.begin).split("-")[0] : null;
    const endYear = lifeSpan.end ? String(lifeSpan.end).split("-")[0] : null;

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
        <div 
            className="relative min-h-screen bg-[var(--theme-bg)] text-[var(--theme-fg)] pb-32 transition-colors duration-300 w-full max-w-full overflow-x-hidden"
            style={{ background: theme === 'adaptive' && colors?.gradient ? colors.gradient : undefined }}
        >
            {/* 1. Artist Hero Header + Unzoomed Full-Width Photo with Edge Color Fades (Seamless on Mobile & Full Layout on PC) */}
            <div className="relative w-full max-w-full overflow-hidden">
                {/* Top Navigation Bar with edge-matched background */}
                <div 
                    className="relative z-20 w-full max-w-full transition-colors duration-500"
                    style={{ backgroundColor: edgeColors.topColor || '#000000' }}
                >
                    <header className="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-12 pt-4 pb-3 sm:pt-5 sm:pb-4 flex items-center justify-between">
                        {/* Fused Back + GrooveEstrella Brand Pill */}
                        <div className="flex items-center bg-black/65 hover:bg-black/75 backdrop-blur-xl rounded-full border border-white/20 shadow-2xl p-1 transition-all">
                            <button 
                                onClick={handleBack}
                                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full aspect-square shrink-0 hover:bg-white/15 active:scale-95 text-white flex items-center justify-center transition cursor-pointer"
                                title="Go Back"
                            >
                                <ArrowLeft size={17} />
                            </button>
                            <div className="h-4 w-px bg-white/20 mx-1" />
                            <button
                                onClick={() => router.push("/")}
                                className="flex items-center gap-1.5 pl-1 pr-3 py-1 hover:bg-white/15 rounded-full active:scale-95 transition cursor-pointer select-none"
                                title="GrooveEstrella Home"
                            >
                                <img src="/in.svg" alt="GrooveEstrella" className="w-4 h-4 sm:w-5 sm:h-5 object-contain shrink-0" />
                                <span className="text-xs font-bold text-white tracking-tight font-display">GrooveEstrella</span>
                            </button>
                        </div>

                        <button 
                            onClick={handleNativeShare}
                            className="w-10 h-10 rounded-full aspect-square shrink-0 bg-black/65 hover:bg-black/75 active:scale-95 text-white flex items-center justify-center transition backdrop-blur-xl cursor-pointer border border-white/20 shadow-2xl"
                            title="Share Artist"
                        >
                            <Share2 size={18} />
                        </button>
                    </header>
                </div>

                {/* MOBILE HERO: Full unzoomed image with smooth start & end fades based on top and bottom pixel colors */}
                <div 
                    className="md:hidden relative w-full max-w-full overflow-hidden transition-colors duration-500"
                    style={{ backgroundColor: edgeColors.topColor || '#000000' }}
                >
                    <img 
                        src={coverUrl} 
                        alt={artist.name} 
                        className="w-full max-w-full h-auto max-h-[125vw] object-cover object-top select-none block"
                        onError={(e) => { e.currentTarget.src = 'https://placehold.co/800x800/17020B/E8A87C?text=Artist'; }}
                    />

                    {/* Smooth start fade: Uses top pixel color with gentle stepped gradient */}
                    <div 
                        className="absolute inset-x-0 top-0 h-16 pointer-events-none z-10"
                        style={{
                            background: `linear-gradient(to bottom, ${edgeColors.topColor || '#000000'} 0%, ${edgeColors.topColor ? `${edgeColors.topColor.replace('rgb', 'rgba').replace(')', ', 0.65)')}` : 'rgba(0,0,0,0.65)'} 40%, transparent 100%)`
                        }}
                    />

                    {/* Smooth photo bottom fade: Merges the base of the image seamlessly into edgeColors.bottomColor */}
                    <div 
                        className="absolute inset-x-0 bottom-0 h-36 pointer-events-none z-10"
                        style={{
                            background: `linear-gradient(to bottom, 
                                transparent 0%, 
                                ${edgeColors.bottomColor ? `${edgeColors.bottomColor.replace('rgb', 'rgba').replace(')', ', 0.4)')}` : 'rgba(0,0,0,0.4)'} 35%, 
                                ${edgeColors.bottomColor ? `${edgeColors.bottomColor.replace('rgb', 'rgba').replace(')', ', 0.85)')}` : 'rgba(0,0,0,0.85)'} 75%, 
                                ${edgeColors.bottomColor || '#000000'} 100%
                            )`
                        }}
                    />
                </div>

                {/* PC / DESKTOP HERO: Dedicated widescreen layout where full photo, metadata, name and actions shine together */}
                <div className="hidden md:block relative w-full max-w-7xl mx-auto px-6 lg:px-12 pt-4 pb-8">
                    <div className="flex flex-col lg:flex-row lg:items-end gap-8 lg:gap-12">
                        {/* High-res Artist Artwork with Vinyl Disc peek effect & soft ambient glow */}
                        <div className="relative group shrink-0 mx-auto lg:mx-0">
                            <div 
                                className="w-56 h-56 lg:w-72 lg:h-72 rounded-3xl overflow-hidden shadow-2xl relative z-10 border border-white/15 bg-black/40"
                                style={{
                                    boxShadow: `0 24px 60px -15px ${colors?.accent ? `${colors.accent}40` : 'rgba(0,0,0,0.7)'}`
                                }}
                            >
                                <img 
                                    src={coverUrl} 
                                    alt={artist.name} 
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                    onError={(e) => { e.currentTarget.src = 'https://placehold.co/800x800/17020B/E8A87C?text=Artist'; }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-tr from-black/30 via-transparent to-white/10 pointer-events-none" />
                            </div>
                        </div>

                        {/* Desktop Artist Details & Metadata */}
                        <div className="flex-1 flex flex-col justify-end min-w-0">
                            {/* Badges */}
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider backdrop-blur-md border shadow-md ${
                                    isGroup 
                                        ? 'bg-purple-950/70 text-purple-200 border-purple-400/40' 
                                        : 'bg-emerald-950/70 text-emerald-200 border-emerald-400/40'
                                }`}>
                                    {isGroup ? <Users size={13} /> : <User size={13} />}
                                    <span>{entityTypeLabel}</span>
                                </span>
                                {genres.slice(0, 3).map((g, idx) => (
                                    <span key={idx} className="px-3 py-1 rounded-full bg-[var(--theme-card)] backdrop-blur-md text-[var(--theme-accent)] text-xs font-bold uppercase tracking-wider border border-[var(--theme-border)]">
                                        {g}
                                    </span>
                                ))}
                            </div>

                            {/* Prominent Artist Name on PC */}
                            <h1 className="text-4xl lg:text-6xl font-black leading-tight tracking-tight text-[var(--theme-fg)] font-display drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)]">
                                {artist.name}
                            </h1>

                            {/* Location & Lifespan & Rating Bar */}
                            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-3 text-sm text-[var(--theme-muted)]">
                                {artist.country && artist.country !== 'Global' ? (
                                    <div className="flex items-center gap-1.5">
                                        <MapPin size={15} className="text-[var(--theme-accent)] shrink-0" />
                                        <span>{artist.area ? `${artist.area}, ` : ""}{artist.country}</span>
                                    </div>
                                ) : artist.area ? (
                                    <div className="flex items-center gap-1.5">
                                        <MapPin size={15} className="text-[var(--theme-accent)] shrink-0" />
                                        <span>{artist.area}</span>
                                    </div>
                                ) : null}

                                {beginYear && (
                                    <div className="flex items-center gap-1.5">
                                        <Calendar size={15} className="text-[var(--theme-accent)] shrink-0" />
                                        <span>
                                            {isGroup
                                                ? `Formed ${beginYear}${endYear ? ` · Disbanded ${endYear}` : lifeSpan?.ended ? " · Disbanded" : " · Active"}`
                                                : `Born ${beginYear}${endYear ? ` · Died ${endYear}` : lifeSpan?.ended ? " · Deceased" : " · Active"}`
                                            }
                                        </span>
                                    </div>
                                )}

                                <div className="ml-auto">
                                    <UserRatingWidget
                                        id={artist.id || id}
                                        type="artist"
                                        musicbrainzRating={artist.rating}
                                        itemTitle={artist.name}
                                        itemSubtitle={artist.country || artist.area || "Artist Profile"}
                                        itemImage={coverUrl}
                                        itemYear={artist.lifeSpan?.begin ? parseInt(String(artist.lifeSpan.begin).slice(0, 4), 10) : null}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mobile Title & Badges: Seamlessly extends with the photo's last pixel edge colors, then dissolves into page background */}
                <div 
                    className="md:hidden relative z-20 transition-colors duration-500"
                    style={{
                        backgroundColor: edgeColors.bottomColor || '#000000',
                    }}
                >
                    <div className="px-4 sm:px-6 pt-1 pb-3 max-w-5xl mx-auto">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider backdrop-blur-md border shadow-md ${
                                isGroup 
                                    ? 'bg-purple-950/70 text-purple-200 border-purple-400/40' 
                                    : 'bg-emerald-950/70 text-emerald-200 border-emerald-400/40'
                            }`}>
                                {isGroup ? <Users size={12} /> : <User size={12} />}
                                <span>{entityTypeLabel}</span>
                            </span>
                            {genres.length > 0 && (
                                <span className="px-3 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[var(--theme-accent)] text-[11px] font-bold uppercase tracking-wider border border-[var(--theme-accent)]/30">
                                    {genres[0]}
                                </span>
                            )}
                        </div>

                        <h1 className="text-3xl sm:text-5xl font-black leading-tight tracking-tight text-[var(--theme-fg)] font-display drop-shadow-[0_2px_12px_rgba(0,0,0,0.45)]">
                            {artist.name}
                        </h1>
                    </div>

                    {/* Smooth bottom transition fade: Extends the last pixel colors and gently dissolves into page theme background */}
                    <div 
                        className="w-full h-12 pointer-events-none"
                        style={{
                            background: `linear-gradient(to bottom, 
                                ${edgeColors.bottomColor || '#000000'} 0%, 
                                ${edgeColors.bottomColor ? `${edgeColors.bottomColor.replace('rgb', 'rgba').replace(')', ', 0.65)')}` : 'rgba(0,0,0,0.65)'} 35%, 
                                ${edgeColors.bottomColor ? `${edgeColors.bottomColor.replace('rgb', 'rgba').replace(')', ', 0.2)')}` : 'rgba(0,0,0,0.2)'} 75%, 
                                transparent 100%
                            )`
                        }}
                    />
                </div>

                {/* 2. Metadata, Rating Capsule, Bio & Action Controls (Directly on Page Background - NO CARDS!) */}
                <div className="w-full max-w-5xl md:max-w-7xl mx-auto px-4 sm:px-6 md:px-12 pt-2">
                    {/* Mobile Metadata Section */}
                    <div className="md:hidden flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 py-3 border-b border-[var(--theme-border)]/30">
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs sm:text-sm font-medium text-[var(--theme-muted)]">
                            {artist.country && artist.country !== 'Global' ? (
                                <div className="flex items-center gap-1.5">
                                    <MapPin size={14} className="text-[var(--theme-accent)] shrink-0" />
                                    <span>{artist.area ? `${artist.area}, ` : ""}{artist.country}</span>
                                </div>
                            ) : artist.area ? (
                                <div className="flex items-center gap-1.5">
                                    <MapPin size={14} className="text-[var(--theme-accent)] shrink-0" />
                                    <span>{artist.area}</span>
                                </div>
                            ) : null}

                            {beginYear && (
                                <div className="flex items-center gap-1.5">
                                    <Calendar size={14} className="text-[var(--theme-accent)] shrink-0" />
                                    <span>
                                        {isGroup
                                            ? `Formed ${beginYear}${endYear ? ` · Disbanded ${endYear}` : lifeSpan?.ended ? " · Disbanded" : " · Active"}`
                                            : `Born ${beginYear}${endYear ? ` · Died ${endYear}` : lifeSpan?.ended ? " · Deceased" : " · Active"}`
                                        }
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="shrink-0 flex items-center">
                            <UserRatingWidget
                                id={artist.id || id}
                                type="artist"
                                musicbrainzRating={artist.rating}
                                itemTitle={artist.name}
                                itemSubtitle={artist.country || artist.area || "Artist Profile"}
                                itemImage={coverUrl}
                                itemYear={artist.lifeSpan?.begin ? parseInt(String(artist.lifeSpan.begin).slice(0, 4), 10) : null}
                            />
                        </div>
                    </div>

                    {/* Editorial Bio Snippet with Inline Expander */}
                    {artist.description && (
                        <div className="mt-3.5">
                            <p className={`text-xs sm:text-sm text-[var(--theme-muted)] leading-relaxed font-body ${!expandedHeroDesc ? "line-clamp-2" : ""}`}>
                                {artist.description}
                            </p>
                            <div className="flex items-center gap-3 mt-1.5">
                                {artist.description.length > 120 && (
                                    <button
                                        onClick={() => setExpandedHeroDesc(!expandedHeroDesc)}
                                        className="text-xs font-bold text-[var(--theme-accent)] hover:opacity-80 transition inline-flex items-center gap-1 cursor-pointer"
                                    >
                                        <span>{expandedHeroDesc ? "Show less" : "Read inline"}</span>
                                    </button>
                                )}
                                <button
                                    onClick={() => setActiveTab("about")}
                                    className="text-xs font-bold text-[var(--theme-muted)] hover:text-[var(--theme-fg)] transition inline-flex items-center gap-1 cursor-pointer"
                                >
                                    <Info size={12} />
                                    <span>Full lore & facts</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Action Buttons Row */}
                    <div className="mt-5 flex items-center gap-3 flex-wrap">
                        {/* Create GrooveCard */}
                        <button
                            onClick={() => setIsGrooveCardOpen(true)}
                            className="w-11 h-11 sm:w-12 sm:h-12 rounded-full aspect-square shrink-0 bg-[var(--theme-surface)] hover:bg-[var(--theme-card)] active:scale-95 text-[var(--theme-fg)] flex items-center justify-center transition-all duration-200 backdrop-blur-md cursor-pointer shadow-md border border-[var(--theme-border)] group"
                            title="Create GrooveCard"
                        >
                            <Sparkles size={19} className="text-[var(--theme-fg)] group-hover:text-[var(--theme-accent)] transition-colors" />
                        </button>

                        {/* Open GrooveLink */}
                        <button
                            onClick={() => setIsGrooveLinkOpen(true)}
                            className="h-11 sm:h-12 px-6 sm:px-8 rounded-full bg-[var(--theme-accent)] hover:opacity-95 active:scale-95 text-[var(--theme-accent-fg)] font-black text-xs sm:text-sm tracking-wide flex items-center justify-center gap-2 transition-all duration-200 shadow-lg cursor-pointer shrink-0 whitespace-nowrap"
                            title="Open GrooveLink"
                        >
                            <img src="/in.svg" alt="GrooveLink" className="w-4 h-4 sm:w-5 sm:h-5 object-contain shrink-0" />
                            <span className="whitespace-nowrap">Open GrooveLink</span>
                            <ChevronRight size={15} className="shrink-0" />
                        </button>

                        {/* Bookmark / Library Save */}
                        <button
                            onClick={toggleSave}
                            className="w-11 h-11 sm:w-12 sm:h-12 rounded-full aspect-square shrink-0 bg-[var(--theme-surface)] hover:bg-[var(--theme-card)] active:scale-95 text-[var(--theme-fg)] flex items-center justify-center transition-all duration-200 backdrop-blur-md cursor-pointer shadow-md border border-[var(--theme-border)]"
                            title={saved ? "Remove from Library" : "Add to Library"}
                        >
                            {saved ? <BookmarkCheck size={19} className="text-[var(--theme-accent)]" /> : <Bookmark size={19} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* 3. Integrated Sticky Navigation Tabs (Part of the Page, Not an Isolated Component) */}
            <div className="sticky top-0 z-30 bg-[var(--theme-bg)]/90 backdrop-blur-xl border-b border-[var(--theme-border)]/30 mt-6 mb-8 transition-colors w-full">
                <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 md:px-12">
                    <div className="overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden scrollb-none no-scrollbar">
                        <div className="flex items-center gap-1 sm:gap-2 min-w-max px-1 sm:px-2">
                            {ARTIST_TABS.map((tab) => {
                                const isActive = activeTab === tab.id;
                                const TabIcon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`shrink-0 whitespace-nowrap py-3 px-3.5 sm:px-4 text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer flex items-center gap-2 select-none border-b-2 ${
                                            isActive
                                                ? 'border-[var(--theme-accent)] text-[var(--theme-fg)]'
                                                : 'border-transparent text-[var(--theme-muted)] hover:text-[var(--theme-fg)]'
                                        }`}
                                    >
                                        <TabIcon size={15} className={isActive ? "text-[var(--theme-accent)]" : "text-[var(--theme-muted)]"} />
                                        <span>{tab.label}</span>
                                        {tab.count !== undefined && (
                                            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold leading-none shrink-0 ${
                                                isActive ? 'bg-[var(--theme-accent)]/20 text-[var(--theme-accent)]' : 'bg-white/5 text-[var(--theme-muted)]'
                                            }`}>
                                                {tab.count}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* TAB CONTENT (Flows Directly on Page Background - NO CARDS!) */}
            <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 md:px-12">
                {/* TAB 1: MUSIC (Top Songs + Albums Merged Apple Music / Tidal Style) */}
                {activeTab === "music" && (
                    <div className="relative z-10 mb-12 animate-fade-in space-y-12">
                        {/* SECTION 1: TOP SONGS */}
                        {topTracks.length > 0 && (
                            <div>
                                <div className="flex items-center justify-between mb-4 px-1">
                                    <h2 className="text-xl sm:text-2xl font-extrabold flex items-center gap-2 text-[var(--theme-fg)]">
                                        <ListMusic size={22} className="text-[var(--theme-accent)]" />
                                        <span>Top Songs</span>
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
                                                className={`flex items-center justify-between py-2.5 sm:py-3 px-2 sm:px-3 hover:bg-[var(--theme-card)]/40 rounded-xl transition-all duration-200 border-b border-[var(--theme-border)]/30 last:border-b-0 group ${
                                                    isPending && navigatingTrackId === track.id ? 'opacity-75 pointer-events-none cursor-wait' : ''
                                                }`}
                                            >
                                                <div 
                                                    className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1 cursor-pointer"
                                                    onClick={() => {
                                                        if (track.id && !isPending) {
                                                            setNavigatingTrackId(track.id);
                                                            startTransition(() => {
                                                                router.push(`/track/${track.id}`);
                                                            });
                                                        }
                                                    }}
                                                >
                                                    <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-lg overflow-hidden shrink-0 ring-1 ring-[var(--theme-border)]/40 bg-[var(--theme-surface)]">
                                                        <img 
                                                            src={coverImg} 
                                                            alt={trackTitle} 
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => { e.currentTarget.src = coverUrl; }}
                                                        />
                                                        {isPending && navigatingTrackId === track.id && (
                                                            <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] flex items-center justify-center animate-fade-in z-10">
                                                                <div className="w-5 h-5 rounded-full border-2 border-[var(--theme-accent)] border-t-transparent animate-spin" />
                                                            </div>
                                                        )}
                                                    </div>
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
                                                                    artist: artist.name,
                                                                    imageUrl: coverImg,
                                                                    coverArt: coverImg,
                                                                    popularity: track.popularity || 80,
                                                                    explicit: isExplicit,
                                                                    genres: genres,
                                                                    spotifyUrl: track.spoURL,
                                                                    youtubeUrl: track.YTURL,
                                                                    externalLinks: []
                                                                })}
                                                                className="flex items-center gap-2 p-2 hover:bg-[var(--theme-surface)] rounded-xl cursor-pointer text-xs font-semibold"
                                                            >
                                                                <img src="/in.svg" alt="GrooveLink" className="w-4 h-4 object-contain" />
                                                                <span>Open in GrooveLink</span>
                                                            </DropdownMenuItem>

                                                            <DropdownMenuItem
                                                                onClick={() => setSelectedTrackForGrooveCard({
                                                                    id: track.id || track.trackId,
                                                                    type: 'track',
                                                                    name: trackTitle,
                                                                    title: trackTitle,
                                                                    artist: artist.name,
                                                                    imageUrl: coverImg,
                                                                    coverArt: coverImg,
                                                                    releaseYear: releaseYear,
                                                                    explicit: isExplicit,
                                                                    genres: genres,
                                                                })}
                                                                className="flex items-center gap-2 p-2 hover:bg-[var(--theme-surface)] rounded-xl cursor-pointer text-xs font-semibold"
                                                            >
                                                                <Sparkles size={14} className="text-[var(--theme-accent)]" />
                                                                <span>Create GrooveCard</span>
                                                            </DropdownMenuItem>

                                                            <DropdownMenuSeparator className="bg-[var(--theme-border)] my-1" />

                                                            <DropdownMenuItem
                                                                onClick={() => {
                                                                    window.dispatchEvent(new CustomEvent('open-playlist-picker', {
                                                                        detail: {
                                                                            track: {
                                                                                id: track.id || track.trackId,
                                                                                name: trackTitle,
                                                                                title: trackTitle,
                                                                                artists: trackArtists,
                                                                                duration_ms: track.durationMs || track.duration_ms || track.duration,
                                                                                album: {
                                                                                    id: track.albumID || track.albumId,
                                                                                    name: albumName,
                                                                                    images: [{ url: coverImg }]
                                                                                }
                                                                            }
                                                                        }
                                                                    }));
                                                                }}
                                                                className="flex items-center gap-2 p-2 hover:bg-[var(--theme-surface)] rounded-xl cursor-pointer text-xs font-semibold"
                                                            >
                                                                <ListPlus size={14} className="text-[var(--theme-accent)]" />
                                                                <span>Add to Playlist</span>
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

                        {/* SECTION 2: STUDIO ALBUMS (Directly under Top Songs - Apple Music / Tidal Style) */}
                        {studioAlbums.length > 0 && (
                            <div>
                                <div className="flex items-center justify-between mb-5 px-1">
                                    <Link href={`/artist/${artist.id || id}/discography`} className="group flex items-center gap-2">
                                        <h2 className="text-xl sm:text-2xl font-extrabold text-[var(--theme-fg)] group-hover:text-[var(--theme-accent)] transition flex items-center gap-2">
                                            <Disc size={22} className="text-[var(--theme-accent)]" />
                                            <span>Albums</span>
                                            <span className="text-xs font-semibold text-[var(--theme-muted)]">({studioAlbums.length})</span>
                                            <ChevronRight size={18} className="text-[var(--theme-muted)] group-hover:text-[var(--theme-accent)] transition-transform group-hover:translate-x-0.5" />
                                        </h2>
                                    </Link>
                                    <Link
                                        href={`/artist/${artist.id || id}/discography`}
                                        className="text-xs font-bold text-[var(--theme-accent)] hover:underline inline-flex items-center gap-1 cursor-pointer"
                                    >
                                        <span>See all</span>
                                        <ChevronRight size={14} />
                                    </Link>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
                                    {studioAlbums.map((album, index) => {
                                        const albumCover = album.url || album.image || album.coverArt || coverUrl;
                                        const albumYear = album.releaseYear || (album.releaseDate ? new Date(album.releaseDate).getFullYear() : null);
                                        const isAlbumNavigating = isPending && navigatingAlbumId === album.id;

                                        return (
                                            <div 
                                                key={`${album.id || 'album'}-${index}`}
                                                onClick={() => {
                                                    if (album.id && !isPending) {
                                                        setNavigatingAlbumId(album.id);
                                                        startTransition(() => {
                                                            router.push(`/album/${album.id}`);
                                                        });
                                                    }
                                                }}
                                                className={`group flex flex-col ${
                                                    isAlbumNavigating ? 'opacity-75 pointer-events-none cursor-wait' : 'cursor-pointer'
                                                }`}
                                            >
                                                <div className="aspect-square w-full rounded-2xl overflow-hidden bg-[var(--theme-surface)] shadow-md group-hover:shadow-xl transition-all duration-300 relative ring-1 ring-[var(--theme-border)]/50">
                                                    <img 
                                                        src={albumCover} 
                                                        alt={album.title || album.name} 
                                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                        onError={(e) => { e.currentTarget.src = 'https://placehold.co/400x400/17020B/E8A87C?text=Album'; }}
                                                    />
                                                    {isAlbumNavigating && (
                                                        <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] flex flex-col items-center justify-center gap-1.5 animate-fade-in z-20">
                                                            <div className="w-8 h-8 rounded-full border-2 border-[var(--theme-accent)] border-t-transparent animate-spin" />
                                                            <span className="text-[10px] font-bold text-white tracking-widest uppercase">Routing...</span>
                                                        </div>
                                                    )}
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
                                <div className="mt-8 flex justify-center">
                                    <Link
                                        href={`/artist/${artist.id || id}/discography`}
                                        className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[var(--theme-surface)] hover:bg-[var(--theme-card)] text-[var(--theme-fg)] hover:text-[var(--theme-accent)] border border-[var(--theme-border)] hover:border-[var(--theme-accent)] text-xs sm:text-sm font-bold transition-all duration-200 shadow-md group cursor-pointer active:scale-95"
                                    >
                                        <span>Explore complete discography & releases</span>
                                        <ChevronRight size={15} className="text-[var(--theme-accent)] group-hover:translate-x-0.5 transition-transform" />
                                    </Link>
                                </div>
                            </div>
                        )}

                        {/* Community Ratings & Public Reviews surfaced directly on the Artist page */}
                        <div className="pt-10 border-t border-[var(--theme-border)]/40 max-w-4xl mx-auto">
                            <EntityReviewsSection
                                mbid={artist.id || id}
                                type="artist"
                                title={artist.name}
                                subtitle={artist.country || artist.area || "Artist"}
                                image={coverUrl}
                                year={beginYear ? parseInt(beginYear, 10) : null}
                                musicbrainzRating={artist.rating}
                            />
                        </div>
                    </div>
                )}

                {/* TAB 3: BIO & LINEUP (Dedicated, Fluid & Crash-Proof Component) */}
                {activeTab === "about" && (
                    <ArtistBioAndLineupTab
                        artist={artist}
                        isGroup={isGroup}
                        members={safeMembers}
                        bands={bands}
                        collaborations={collaborations}
                        description={artist.description}
                    />
                )}

                {/* TAB 6: EXTERNAL LINKS (Rich Platform Categorization & Direct Links) */}
                {activeTab === "links" && (
                    <ArtistLinksTab
                        artistName={artist.name || "Artist"}
                        externalLinks={externalLinks}
                        id={artist.id || id}
                    />
                )}

                {/* OTHER TABS: Genres & Roots, Ratings & Reviews */}
                {(activeTab === "lore" || activeTab === "reviews") && (
                    <div className="relative z-10 mb-12 animate-fade-in max-w-4xl mx-auto">
                        <MusicLoreAndReviews
                            id={artist.id || id}
                            type="artist"
                            title={artist.name}
                            artist={artist.name}
                            image={coverUrl}
                            year={beginYear ? parseInt(beginYear, 10) : null}
                            description={artist.description}
                            releaseDetails={{
                                releaseDate: artist.beginDate ? `Active since ${artist.beginDate}` : null,
                                country: artist.country || artist.area,
                                format: isGroup ? 'Musical Band / Group' : 'Solo Artist',
                                label: artist.type
                            }}
                            primaryGenre={genres[0] || null}
                            genres={artist.genres || genres || []}
                            categorizedTags={artist.categorizedTags || null}
                            tags={artist.tags || artist.genres || []}
                            allTags={artist.allTags || []}
                            rating={artist.rating}
                            externalLinks={artist.externalLinks || []}
                            activeTab={activeTab}
                        />
                    </div>
                )}
            </div>

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

            {/* Artist Links Drawer */}
            <ArtistLinksDrawer
                isOpen={isLinksDrawerOpen}
                onClose={() => setIsLinksDrawerOpen(false)}
                links={externalLinks}
                artistName={artist.name}
                artistPhoto={coverUrl}
            />

            {/* Artist Details & Lineup Drawer */}
            <ArtistDetailsDrawer
                isOpen={isDetailsDrawerOpen}
                onClose={() => setIsDetailsDrawerOpen(false)}
                artist={artist}
                members={safeMembers}
                bands={bands}
                collaborations={collaborations}
                description={artist.description}
                isGroup={isGroup}
            />
        </div>
    );
}
