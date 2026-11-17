// src/app/artist/[id]/ArtistDetailClient.jsx
"use client";

import { useEffect, useState, useMemo, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bookmark, BookmarkCheck, Users, User, Music, ChevronRight, MoreHorizontal, Share2, ListPlus, Sparkles, Info, MapPin, Calendar, ListMusic, BookOpen, Tag, Star, Globe, Disc } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { extractAdaptivePalette, extractEdgeColors } from "@/lib/colorExtractor";
import dynamic from "next/dynamic";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
} from "@/Components/ui/dropdown-menu";

const GrooveLinkModal = dynamic(() => import("@/Components/GrooveLinkModal"), { ssr: false });
const GrooveCardComposer = dynamic(() => import("@/Components/GrooveCardComposer"), { ssr: false });
const MusicLoreAndReviews = dynamic(() => import("@/Components/MusicLoreAndReviews"), { ssr: false });
const ArtistLinksDrawer = dynamic(() => import("@/Components/ArtistLinksDrawer"), { ssr: false });
const ArtistDetailsDrawer = dynamic(() => import("@/Components/ArtistDetailsDrawer"), { ssr: false });
import EntityReviewsSection from "@/Components/EntityReviewsSection";
import UserRatingWidget from "@/Components/UserRatingWidget";
import DiscLoader from "@/Components/DiscLoader";
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
    const [artistPalette, setArtistPalette] = useState(null);
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

    const coverUrl = artist?.images?.[0]?.url || artist?.coverArt || artist?.url || 'https://placehold.co/600x600/17020B/E8A87C?text=Artist';
    const displayCoverUrl = (coverUrl && (coverUrl.startsWith('http://') || coverUrl.startsWith('https://')))
        ? `/api/cover-proxy?url=${encodeURIComponent(coverUrl)}`
        : coverUrl;

    // Extract Artist Primary Palette cleanly once per artwork (matches Album page)
    useEffect(() => {
        if (!coverUrl) return;
        let active = true;
        extractAdaptivePalette(coverUrl, artist?.name || "artist").then((palette) => {
            if (active) setArtistPalette(palette);
        });
        return () => { active = false; };
    }, [coverUrl, artist?.name]);

    // Extract exact edge colors for Mobile seamless shadow & blur fade
    useEffect(() => {
        if (!displayCoverUrl) return;
        let active = true;
        extractEdgeColors(displayCoverUrl).then((colors) => {
            if (active && colors) {
                setEdgeColors(colors);
            }
        });
        return () => { active = false; };
    }, [displayCoverUrl]);

    // Sync to global theme when adaptive mode is enabled
    useEffect(() => {
        if (theme === "adaptive" && artistPalette) {
            setAdaptivePalette(artistPalette);
        }
        return () => {
            clearAdaptivePalette();
        };
    }, [theme, artistPalette, setAdaptivePalette, clearAdaptivePalette]);

    const mainBgColor = artistPalette?.bg || colors?.bg || "#110D14";
    const mainFgColor = artistPalette?.fg || colors?.fg || "#FFFFFF";
    const mainAccentColor = artistPalette?.accent || colors?.accent || "#E8A87C";
    const mainAccentFg = artistPalette?.accentFg || colors?.accentFg || "#110D14";
    const mainMutedColor = artistPalette?.muted || colors?.muted || "rgba(255, 255, 255, 0.74)";
    const mainBorderColor = artistPalette?.border || colors?.border || "rgba(255, 255, 255, 0.15)";
    const mainSurfaceColor = artistPalette?.surface || colors?.surface || "rgba(255, 255, 255, 0.10)";

    const genres = useMemo(() => {
        const rawList = artist?.genres || artist?.tags || [];
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
    const isGroup = artist?.isGroup ?? /group|band|orchestra|choir/i.test(artist?.type || "");
    const entityTypeLabel = isGroup ? (artist?.type || "Band / Group") : "Solo Artist";

    // Safe members normalization
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

    const bands = Array.isArray(artist?.bands) ? artist.bands : [];
    const collaborations = Array.isArray(artist?.collaborations) ? artist.collaborations : [];
    const externalLinks = Array.isArray(artist?.externalLinks) ? artist.externalLinks : [];
    const lifeSpan = artist?.lifeSpan || {};
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
            name: artist?.name,
            artist: artist?.name,
            type: "artist",
            id: artist?.id || id,
        });
    };

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

    return (
        <div 
            className="relative min-h-screen pb-32 transition-colors duration-300 w-full max-w-full overflow-x-hidden font-sans"
            style={{ 
                backgroundColor: mainBgColor,
                color: mainFgColor,
                '--theme-bg': mainBgColor,
                '--theme-fg': mainFgColor,
                '--theme-accent': mainAccentColor,
                '--theme-accent-fg': mainAccentFg,
                '--theme-muted': mainMutedColor,
                '--theme-border': mainBorderColor,
                '--theme-surface': mainSurfaceColor,
            }}
        >
            {/* 1. DESKTOP ARTWORK BACKDROP: Atmospheric ambient photo fade, dissolving into solid mainBgColor */}
            <div className="hidden md:block absolute top-0 inset-x-0 h-[620px] overflow-hidden pointer-events-none z-0">
                <div 
                    className="absolute inset-0 bg-cover bg-center scale-105 blur-[20px] opacity-65 saturate-125 transition-all duration-700"
                    style={{ backgroundImage: `url(${displayCoverUrl})` }}
                />
                {/* Smooth scrim: solid at very top for header contrast, fading to solid mainBgColor before tabs */}
                <div 
                    className="absolute inset-0"
                    style={{
                        background: `linear-gradient(to bottom, rgba(0,0,0,0.50) 0%, rgba(0,0,0,0.20) 25%, ${mainBgColor} 85%, ${mainBgColor} 100%)`
                    }}
                />
            </div>

            {/* TOP NAVIGATION: Back + GrooveEstrella Brand Pill on Left, Share on Right */}
            <header className="relative z-30 w-full flex items-center justify-between px-4 sm:px-6 md:px-12 pt-4 sm:pt-6 max-w-7xl mx-auto">
                <div className="flex items-center bg-black/60 hover:bg-black/80 backdrop-blur-md rounded-full border border-white/20 shadow-lg p-1 transition-colors">
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
                    className="w-10 h-10 rounded-full aspect-square shrink-0 bg-black/60 hover:bg-black/80 active:scale-95 text-white flex items-center justify-center transition backdrop-blur-md cursor-pointer border border-white/20 shadow-lg"
                    title="Share Artist"
                >
                    <Share2 size={18} />
                </button>
            </header>

            {/* =========================================================================
                MOBILE HERO: Solid primary color at top -> Seamless emergence of artist image -> Seamless fade back to primary color
            ========================================================================= */}
            <div className="md:hidden relative z-10 w-full max-w-full">
                {/* 1. Artist Image Container: Starts as solid mainBgColor behind navigation, image emerges like shadow, dissolves back */}
                <div className="relative w-full overflow-hidden" style={{ backgroundColor: mainBgColor }}>
                    {/* The Artist Image: Full width, full height, no parts hidden, smoothly masked at boundaries */}
                    <img 
                        src={displayCoverUrl} 
                        alt={artist.name} 
                        className="w-full h-auto block select-none"
                        style={{
                            maskImage: 'linear-gradient(to bottom, transparent 0px, black 36px, black calc(100% - 44px), transparent 100%)',
                            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0px, black 36px, black calc(100% - 44px), transparent 100%)'
                        }}
                        onError={(e) => { e.currentTarget.src = 'https://placehold.co/800x800/17020B/E8A87C?text=Artist'; }}
                    />

                    {/* Top Scrim Overlay: Smooth transition from solid primary color into the emerging image */}
                    <div 
                        className="absolute inset-x-0 top-0 h-16 pointer-events-none z-20"
                        style={{
                            background: `linear-gradient(to bottom, ${mainBgColor} 0%, ${mainBgColor}99 40%, transparent 100%)`
                        }}
                    />

                    {/* Bottom Scrim Overlay: Smooth transition from image back into solid primary color */}
                    <div 
                        className="absolute inset-x-0 bottom-0 h-20 pointer-events-none z-20"
                        style={{
                            background: `linear-gradient(to bottom, transparent 0%, ${mainBgColor}99 50%, ${mainBgColor} 100%)`
                        }}
                    />
                </div>

                {/* 2. Mobile Artist Info & Header Content (Directly on the solid base color, 100% readable) */}
                <div 
                    className="relative z-20 w-full px-5 pt-1 pb-6 transition-colors"
                    style={{ backgroundColor: mainBgColor }}
                >
                    {/* Badges: Type & Genres */}
                    <div className="flex flex-wrap items-center gap-2 mb-2.5">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider backdrop-blur-md border shadow-sm ${
                            isGroup 
                                ? 'bg-purple-950/80 text-purple-200 border-purple-400/50' 
                                : 'bg-emerald-950/80 text-emerald-200 border-emerald-400/50'
                        }`}>
                            {isGroup ? <Users size={12} /> : <User size={12} />}
                            <span>{entityTypeLabel}</span>
                        </span>
                        {genres.slice(0, 3).map((g, idx) => (
                            <span key={idx} className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-[var(--theme-accent)] text-xs font-bold uppercase tracking-wider border border-white/15">
                                {g}
                            </span>
                        ))}
                    </div>

                    {/* Artist Name: Very prominent, high contrast */}
                    <h1 className="text-3xl sm:text-4xl font-black leading-tight tracking-tight text-white font-display drop-shadow-[0_2px_10px_rgba(0,0,0,0.6)]">
                        {artist.name}
                    </h1>

                    {/* Location & Formed / Disbanded years (No cutting off, high contrast) */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-medium text-white/85 mt-2.5">
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

                    {/* Primary: Rate Capsule; Secondary: View Discography */}
                    <div className="mt-4 flex items-center gap-2.5 flex-wrap">
                        <UserRatingWidget
                            id={artist.id || id}
                            type="artist"
                            musicbrainzRating={artist.rating}
                            itemTitle={artist.name}
                            itemSubtitle={artist.country || artist.area || "Artist Profile"}
                            itemImage={coverUrl}
                            itemYear={artist.lifeSpan?.begin ? parseInt(String(artist.lifeSpan.begin).slice(0, 4), 10) : null}
                        />

                        <Link
                            href={`/artist/${artist.id || id}/discography`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-white/90 bg-white/10 hover:bg-white/15 border border-white/15 hover:border-white/30 backdrop-blur-xl transition-all duration-200 cursor-pointer active:scale-95 shadow-md group shrink-0"
                            title="Explore complete discography"
                        >
                            <Disc size={13} className="text-[var(--theme-accent)] group-hover:rotate-45 transition-transform" />
                            <span>View Discography</span>
                        </Link>
                    </div>

                    {/* Short Bio (with "Read more" if long) */}
                    {artist.description && (
                        <div className="mt-4">
                            <p className={`text-xs sm:text-sm text-white/85 leading-relaxed font-body ${!expandedHeroDesc ? "line-clamp-3" : ""}`}>
                                {artist.description}
                            </p>
                            <div className="flex items-center gap-3 mt-1.5">
                                {artist.description.length > 120 && (
                                    <button
                                        onClick={() => setExpandedHeroDesc(!expandedHeroDesc)}
                                        className="text-xs font-bold text-[var(--theme-accent)] hover:underline transition inline-flex items-center gap-1 cursor-pointer"
                                    >
                                        <span>{expandedHeroDesc ? "Show less" : "Read more"}</span>
                                    </button>
                                )}
                                <button
                                    onClick={() => setActiveTab("about")}
                                    className="text-xs font-bold text-white/70 hover:text-white transition inline-flex items-center gap-1 cursor-pointer"
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
                            className="w-11 h-11 rounded-full aspect-square shrink-0 bg-black/50 hover:bg-black/70 active:scale-95 text-white flex items-center justify-center transition-all duration-200 backdrop-blur-md cursor-pointer shadow-md border border-white/20 group"
                            title="Create GrooveCard"
                        >
                            <Sparkles size={19} className="text-white group-hover:text-[var(--theme-accent)] transition-colors" />
                        </button>

                        {/* Open GrooveLink */}
                        <button
                            onClick={() => setIsGrooveLinkOpen(true)}
                            className="h-11 px-6 rounded-full bg-[var(--theme-accent)] hover:opacity-95 active:scale-95 text-[var(--theme-accent-fg)] font-black text-xs tracking-wide flex items-center justify-center gap-2 transition-all duration-200 shadow-lg cursor-pointer shrink-0 whitespace-nowrap"
                            title="Open GrooveLink"
                        >
                            <img src="/in.svg" alt="GrooveLink" className="w-4 h-4 object-contain shrink-0" />
                            <span className="whitespace-nowrap">Open GrooveLink</span>
                            <ChevronRight size={15} className="shrink-0" />
                        </button>

                        {/* Bookmark / Library Save */}
                        <button
                            onClick={toggleSave}
                            className="w-11 h-11 rounded-full aspect-square shrink-0 bg-black/50 hover:bg-black/70 active:scale-95 text-white flex items-center justify-center transition-all duration-200 backdrop-blur-md cursor-pointer shadow-md border border-white/20"
                            title={saved ? "Remove from Library" : "Add to Library"}
                        >
                            {saved ? <BookmarkCheck size={19} className="text-[var(--theme-accent)]" /> : <Bookmark size={19} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* =========================================================================
                DESKTOP HERO: Dedicated widescreen layout where image, metadata, ratings, bio and actions shine together
            ========================================================================= */}
            <div className="hidden md:block relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-12 pt-6 pb-8">
                <div className="flex flex-col lg:flex-row lg:items-center gap-8 lg:gap-12">
                    {/* High-res Artist Artwork with soft ambient glow */}
                    <div className="relative group shrink-0 mx-auto lg:mx-0">
                        <div 
                            className="w-60 h-60 lg:w-72 lg:h-72 xl:w-80 xl:h-80 rounded-3xl overflow-hidden shadow-2xl relative z-10 border border-white/20 bg-black/40"
                            style={{
                                boxShadow: `0 24px 60px -15px ${mainAccentColor ? `${mainAccentColor}45` : 'rgba(0,0,0,0.8)'}`
                            }}
                        >
                            <img 
                                src={displayCoverUrl} 
                                alt={artist.name} 
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 select-none"
                                onError={(e) => { e.currentTarget.src = 'https://placehold.co/800x800/17020B/E8A87C?text=Artist'; }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-tr from-black/30 via-transparent to-white/10 pointer-events-none" />
                        </div>
                    </div>

                    {/* Desktop Artist Details & Metadata */}
                    <div className="flex-1 flex flex-col justify-center min-w-0">
                        {/* Badges: Type & Genres */}
                        <div className="flex flex-wrap items-center gap-2 mb-2.5">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider backdrop-blur-md border shadow-md ${
                                isGroup 
                                ? 'bg-purple-950/80 text-purple-200 border-purple-400/50' 
                                : 'bg-emerald-950/80 text-emerald-200 border-emerald-400/50'
                            }`}>
                                {isGroup ? <Users size={13} /> : <User size={13} />}
                                <span>{entityTypeLabel}</span>
                            </span>
                            {genres.slice(0, 4).map((g, idx) => (
                                <span key={idx} className="px-3 py-1 rounded-full bg-black/50 backdrop-blur-md text-[var(--theme-accent)] text-xs font-bold uppercase tracking-wider border border-white/15">
                                    {g}
                                </span>
                            ))}
                        </div>

                        {/* Prominent Artist Name on PC */}
                        <h1 className="text-4xl lg:text-5xl xl:text-6xl font-black leading-tight tracking-tight text-white font-display drop-shadow-[0_2px_14px_rgba(0,0,0,0.7)]">
                            {artist.name}
                        </h1>

                        {/* Location & Formed / Disbanded years */}
                        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-2.5 text-sm text-white/85 font-medium">
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
                        </div>

                        {/* Primary: Rate Capsule; Secondary: View Discography */}
                        <div className="mt-3.5 flex items-center gap-3 flex-wrap">
                            <UserRatingWidget
                                id={artist.id || id}
                                type="artist"
                                musicbrainzRating={artist.rating}
                                itemTitle={artist.name}
                                itemSubtitle={artist.country || artist.area || "Artist Profile"}
                                itemImage={coverUrl}
                                itemYear={artist.lifeSpan?.begin ? parseInt(String(artist.lifeSpan.begin).slice(0, 4), 10) : null}
                            />

                            <Link
                                href={`/artist/${artist.id || id}/discography`}
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold text-white/90 bg-white/10 hover:bg-white/15 border border-white/15 hover:border-white/30 backdrop-blur-xl transition-all duration-200 cursor-pointer active:scale-95 shadow-md group shrink-0"
                                title="Explore complete discography"
                            >
                                <Disc size={13} className="text-[var(--theme-accent)] group-hover:rotate-45 transition-transform" />
                                <span>View Discography</span>
                            </Link>
                        </div>

                        {/* Short Bio (with "Read more" if long) */}
                        {artist.description && (
                            <div className="mt-3.5 max-w-2xl">
                                <p className={`text-xs sm:text-sm text-white/85 leading-relaxed font-body ${!expandedHeroDesc ? "line-clamp-2" : ""}`}>
                                    {artist.description}
                                </p>
                                <div className="flex items-center gap-3 mt-1.5">
                                    {artist.description.length > 120 && (
                                        <button
                                            onClick={() => setExpandedHeroDesc(!expandedHeroDesc)}
                                            className="text-xs font-bold text-[var(--theme-accent)] hover:underline transition inline-flex items-center gap-1 cursor-pointer"
                                        >
                                            <span>{expandedHeroDesc ? "Show less" : "Read more"}</span>
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setActiveTab("about")}
                                        className="text-xs font-bold text-white/70 hover:text-white transition inline-flex items-center gap-1 cursor-pointer"
                                    >
                                        <Info size={12} />
                                        <span>Full lore & facts</span>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Action Buttons Row */}
                        <div className="mt-4 flex items-center gap-3 flex-wrap">
                            {/* Create GrooveCard */}
                            <button
                                onClick={() => setIsGrooveCardOpen(true)}
                                className="w-11 h-11 sm:w-12 sm:h-12 rounded-full aspect-square shrink-0 bg-black/50 hover:bg-black/70 active:scale-95 text-white flex items-center justify-center transition-all duration-200 backdrop-blur-md cursor-pointer shadow-md border border-white/20 group"
                                title="Create GrooveCard"
                            >
                                <Sparkles size={19} className="text-white group-hover:text-[var(--theme-accent)] transition-colors" />
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
                                className="w-11 h-11 sm:w-12 sm:h-12 rounded-full aspect-square shrink-0 bg-black/50 hover:bg-black/70 active:scale-95 text-white flex items-center justify-center transition-all duration-200 backdrop-blur-md cursor-pointer shadow-md border border-white/20"
                                title={saved ? "Remove from Library" : "Add to Library"}
                            >
                                {saved ? <BookmarkCheck size={19} className="text-[var(--theme-accent)]" /> : <Bookmark size={19} />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* =========================================================================
                STICKY NAVIGATION TABS: Solid base background, zero bleed-through
            ========================================================================= */}
            <div 
                className="sticky top-0 z-30 backdrop-blur-xl border-b border-white/10 mt-6 mb-8 transition-colors w-full"
                style={{ backgroundColor: `color-mix(in srgb, ${mainBgColor} 94%, transparent)` }}
            >
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
                                                ? 'border-[var(--theme-accent)] text-white'
                                                : 'border-transparent text-white/70 hover:text-white'
                                        }`}
                                    >
                                        <TabIcon size={15} className={isActive ? "text-[var(--theme-accent)]" : "text-white/70"} />
                                        <span>{tab.label}</span>
                                        {tab.count !== undefined && (
                                            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold leading-none shrink-0 ${
                                                isActive ? 'bg-[var(--theme-accent)]/20 text-[var(--theme-accent)]' : 'bg-white/10 text-white/70'
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

            {/* TAB CONTENT (Flows directly on solid background) */}
            <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 md:px-12">
                {/* TAB 1: MUSIC (Top Songs + Albums Merged Apple Music / Tidal Style) */}
                {activeTab === "music" && (
                    <div className="relative z-10 mb-12 animate-fade-in space-y-12">
                        {/* SECTION 1: TOP SONGS */}
                        {topTracks.length > 0 && (
                            <div>
                                <div className="flex items-center justify-between mb-4 px-1">
                                    <h2 className="text-xl sm:text-2xl font-extrabold flex items-center gap-2 text-white">
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
                                                className={`flex items-center justify-between py-2.5 sm:py-3 px-2 sm:px-3 hover:bg-white/5 rounded-xl transition-all duration-200 border-b border-white/10 last:border-b-0 group ${
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
                                                    <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-lg overflow-hidden shrink-0 ring-1 ring-white/15 bg-black/40">
                                                        <img 
                                                            src={coverImg} 
                                                            alt={trackTitle} 
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => { e.currentTarget.src = coverUrl; }}
                                                        />
                                                        {isPending && navigatingTrackId === track.id && (
                                                            <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] flex items-center justify-center animate-fade-in z-10">
                                                                <DiscLoader size={20} />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col min-w-0 flex-1">
                                                        <div className="flex items-center gap-1.5 min-w-0">
                                                            <span className="font-semibold text-sm sm:text-base text-white group-hover:text-[var(--theme-accent)] transition-colors truncate">
                                                                {trackTitle}
                                                            </span>
                                                            {isExplicit && (
                                                                <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-[3px] text-[9px] font-bold bg-white/20 text-white shrink-0 select-none">
                                                                    E
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-1.5 text-xs text-white/70 truncate">
                                                            <span>{albumName}</span>
                                                            {releaseYear && (
                                                                <>
                                                                    <span>·</span>
                                                                    <span>{releaseYear}</span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 shrink-0 ml-3">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <button 
                                                                className="p-2 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition cursor-pointer"
                                                                title="More options"
                                                            >
                                                                <MoreHorizontal size={18} />
                                                            </button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent 
                                                            className="bg-zinc-900/95 backdrop-blur-2xl text-white min-w-[200px] rounded-2xl p-2 border border-white/15 shadow-2xl z-[9999]"
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
                                                                className="flex items-center gap-2 p-2 hover:bg-white/10 rounded-xl cursor-pointer text-xs font-semibold"
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
                                                                className="flex items-center gap-2 p-2 hover:bg-white/10 rounded-xl cursor-pointer text-xs font-semibold"
                                                            >
                                                                <Sparkles size={14} className="text-[var(--theme-accent)]" />
                                                                <span>Create GrooveCard</span>
                                                            </DropdownMenuItem>

                                                            <DropdownMenuSeparator className="bg-white/10 my-1" />

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
                                                                className="flex items-center gap-2 p-2 hover:bg-white/10 rounded-xl cursor-pointer text-xs font-semibold"
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

                        {/* SECTION 2: STUDIO ALBUMS */}
                        {studioAlbums.length > 0 && (
                            <div>
                                <div className="flex items-center justify-between mb-5 px-1">
                                    <Link href={`/artist/${artist.id || id}/discography`} className="group flex items-center gap-2">
                                        <h2 className="text-xl sm:text-2xl font-extrabold text-white group-hover:text-[var(--theme-accent)] transition flex items-center gap-2">
                                            <Disc size={22} className="text-[var(--theme-accent)]" />
                                            <span>Albums</span>
                                            <span className="text-xs font-semibold text-white/70">({studioAlbums.length})</span>
                                            <ChevronRight size={18} className="text-white/70 group-hover:text-[var(--theme-accent)] transition-transform group-hover:translate-x-0.5" />
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
                                                <div className="aspect-square w-full rounded-2xl overflow-hidden bg-black/40 shadow-md group-hover:shadow-xl transition-all duration-300 relative ring-1 ring-white/15">
                                                    <img 
                                                        src={albumCover} 
                                                        alt={album.title || album.name} 
                                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                        onError={(e) => { e.currentTarget.src = 'https://placehold.co/400x400/17020B/E8A87C?text=Album'; }}
                                                    />
                                                    {isAlbumNavigating && (
                                                        <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] flex flex-col items-center justify-center gap-1.5 animate-fade-in z-20">
                                                            <DiscLoader size={32} />
                                                            <span className="text-[10px] font-bold text-white tracking-widest uppercase">Routing...</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="mt-2.5 flex items-center justify-between gap-1 min-w-0">
                                                    <h3 className="text-sm font-bold text-white truncate group-hover:text-[var(--theme-accent)] transition-colors">
                                                        {album.title || album.name}
                                                    </h3>
                                                    <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-[3px] text-[9px] font-bold bg-white/20 text-white shrink-0 select-none">
                                                        E
                                                    </span>
                                                </div>
                                                {albumYear && (
                                                    <p className="text-xs text-white/70 font-medium mt-0.5">
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
                                        className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 hover:bg-white/15 text-white hover:text-[var(--theme-accent)] border border-white/15 hover:border-[var(--theme-accent)] text-xs sm:text-sm font-bold transition-all duration-200 shadow-md group cursor-pointer active:scale-95"
                                    >
                                        <span>Explore complete discography & releases</span>
                                        <ChevronRight size={15} className="text-[var(--theme-accent)] group-hover:translate-x-0.5 transition-transform" />
                                    </Link>
                                </div>
                            </div>
                        )}

                        {/* Community Ratings & Public Reviews surfaced directly on the Artist page */}
                        <div className="pt-10 border-t border-white/10 max-w-4xl mx-auto">
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

                {/* TAB 2: BIO & LINEUP */}
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

                {/* TAB 5: EXTERNAL LINKS */}
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
