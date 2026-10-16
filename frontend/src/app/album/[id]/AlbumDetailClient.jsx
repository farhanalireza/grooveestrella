// src/app/album/[id]/AlbumDetailClient.jsx
"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bookmark, BookmarkCheck, Disc, ChevronRight, Clock, Layers } from "lucide-react";
import { AlbumTrackCard } from "@/Components/CardComponents/SmallTracksCard";
import { ShareTrackComponent } from "@/Components/CardComponents/ShareTrackComponent";
import GrooveLinkModal from "@/Components/GrooveLinkModal";
import MusicLoreAndReviews from "@/Components/MusicLoreAndReviews";
import RatingPieChart from "@/Components/RatingPieChart";
import GrooveLoader from "@/Components/GrooveLoader";
import { toast } from "react-toastify";

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
            <GrooveLoader fullScreen={true} text="Loading Album..." />
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

    return (
        <div className="relative min-h-screen bg-[var(--theme-bg)] text-[var(--theme-fg)] p-4 pb-32 sm:p-6 md:pl-20 md:pr-20 lg:pl-40 lg:pr-40 pt-12 overflow-hidden transition-colors duration-300">
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

            {/* Back Button */}
            <button 
                onClick={() => router.push("/")}
                className="absolute top-6 left-5 sm:top-8 sm:left-6 lg:left-16 z-20 p-2.5 rounded-full bg-[var(--theme-card)]/90 backdrop-blur-md border border-[var(--theme-border)] text-[var(--theme-fg)] hover:border-[var(--theme-accent)] transition shadow-lg cursor-pointer"
                title="Back to Home"
            >
                <ArrowLeft size={18} />
            </button>

            {/* Actions overlay */}
            <div className="absolute top-6 right-5 sm:top-8 sm:right-6 lg:right-16 z-20 flex items-center gap-2.5">
                <button
                    onClick={() => setIsGrooveLinkOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-[var(--theme-card)]/90 backdrop-blur-md border border-[var(--theme-border)] text-[var(--theme-fg)] hover:border-[var(--theme-accent)] hover:text-[var(--theme-accent)] transition-all duration-300 shadow-md cursor-pointer hover:scale-105 active:scale-95 text-xs font-bold"
                    title="Open GrooveLink"
                >
                    <img src="/in.svg" alt="GrooveLink" className="w-4 h-4 object-contain" />
                    <span className="hidden sm:inline">GrooveLink</span>
                </button>
                <ShareTrackComponent 
                    trackId={album.id} 
                    artist={artistsList} 
                    explicit={false} 
                    title={album.name || album.title} 
                    popularity={85} 
                    url={coverUrl}
                    releaseDate={album.releaseDate || album.release_date || (album.releaseYear ? String(album.releaseYear) : null)}
                    releaseYear={album.releaseYear}
                    album={album.name || album.title}
                    genres={album.genres || []}
                    type="album" 
                />
                <button 
                    onClick={toggleSave} 
                    className={`p-2.5 rounded-full backdrop-blur-md transition-all duration-300 shadow-md cursor-pointer ${
                        saved 
                            ? "bg-[var(--theme-accent)] text-[var(--theme-accent-fg)] scale-105 shadow-md" 
                            : "bg-[var(--theme-card)]/90 border border-[var(--theme-border)] text-[var(--theme-fg)] hover:bg-[var(--theme-surface)] hover:border-[var(--theme-accent)]"
                    }`}
                    title={saved ? "Remove Bookmark" : "Bookmark Album"}
                >
                    {saved ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
                </button>
            </div>

            {/* Album Card Details Container */}
            <div className="relative z-10 mt-14 sm:mt-6 w-full bg-transparent sm:bg-[var(--theme-card)]/80 sm:backdrop-blur-xl border-0 sm:border border-transparent sm:border-[var(--theme-border)] rounded-none sm:rounded-3xl p-2 sm:p-8 flex flex-col md:flex-row items-center gap-8 sm:gap-12 sm:shadow-2xl mb-12">
                {/* Album Cover Art */}
                <div className="relative flex-shrink-0 w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 rounded-2xl overflow-hidden shadow-2xl bg-[var(--theme-surface)] ring-1 ring-[var(--theme-border)]">
                    <img 
                        src={coverUrl} 
                        alt={album.name} 
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" 
                        onError={(e) => { e.currentTarget.src = 'https://placehold.co/400x400/17020B/E8A87C?text=Album'; }}
                    />
                </div>

                {/* Meta details */}
                <div className="flex-1 min-w-0 text-center md:text-left flex flex-col justify-between">
                    <div>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--theme-card)]/80 border border-[var(--theme-border)] text-xs font-bold text-[var(--theme-accent)] uppercase tracking-wider mb-2">
                            <Disc size={13} />
                            <span>Album Release</span>
                        </div>
                        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold mb-3 leading-tight tracking-tight text-[var(--theme-fg)]">{album.name || album.title}</h1>
                        <p className="text-base sm:text-lg text-[var(--theme-fg)]/85 mb-2">
                            {artistsList.map((a, i) => (
                                <span
                                    key={`${a.id || 'artist'}-${i}`}
                                    className="cursor-pointer font-semibold hover:text-[var(--theme-accent)] hover:underline transition"
                                    onClick={() => a.id && router.push(`/artist/${a.id}`)}
                                >
                                    {a.name}{i < artistsList.length - 1 && ', '}
                                </span>
                            ))} • <span className="text-[var(--theme-muted)] text-sm">{album.releaseDate || album.release_date || 'Release'}</span>
                        </p>
                        
                        <div className="flex items-center justify-center md:justify-start gap-3 text-xs text-[var(--theme-muted)] font-medium mb-4 uppercase tracking-wider flex-wrap">
                            <span>{tracks.length || album.total_tracks || 0} tracks total</span>
                            {formattedTotalTime && (
                                <>
                                    <span>•</span>
                                    <span className="inline-flex items-center gap-1 text-[var(--theme-fg)] font-bold">
                                        <Clock size={13} className="text-[var(--theme-accent)]" />
                                        <span>{formattedTotalTime}</span>
                                    </span>
                                </>
                            )}
                            {album.genres?.length > 0 && (
                                <>
                                    <span>•</span>
                                    <span className="px-2 py-0.5 rounded-md bg-[var(--theme-card)] border border-[var(--theme-border)] text-[var(--theme-accent)] font-bold">{album.genres.slice(0, 3).join(', ')}</span>
                                </>
                            )}
                        </div>

                        {/* Rating Pie Chart */}
                        <div className="flex items-center justify-center md:justify-start mb-3">
                            <RatingPieChart rating={album.rating} />
                        </div>
                    </div>
                    
                    {/* Minimized Description before GrooveLink button */}
                    {album.description && (
                        <div className="my-3 text-left">
                            <p className={`text-xs sm:text-sm text-[var(--theme-muted)] leading-relaxed font-body ${!expandedHeroDesc ? "line-clamp-2" : ""}`}>
                                {album.description}
                            </p>
                            {album.description.length > 120 && (
                                <button
                                    onClick={() => setExpandedHeroDesc(!expandedHeroDesc)}
                                    className="mt-1 text-[11px] font-bold text-[var(--theme-accent)] hover:underline transition inline-flex items-center gap-1 cursor-pointer"
                                >
                                    <span>{expandedHeroDesc ? "Show less" : "Read full overview"}</span>
                                </button>
                            )}
                        </div>
                    )}

                    {/* GrooveLink & History Actions */}
                    <div className="border-t border-[var(--theme-border)] pt-4 w-full flex flex-col sm:flex-row items-center justify-center md:justify-start gap-3">
                        <button 
                            onClick={() => setIsGrooveLinkOpen(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--theme-border)] bg-[var(--theme-surface)] hover:border-[var(--theme-accent)] text-[var(--theme-fg)] text-xs font-bold uppercase tracking-wider transition-all duration-300 shadow-md cursor-pointer"
                        >
                            <img src="/in.svg" alt="GrooveLink" className="w-4 h-4 object-contain" />
                            <span>Open in GrooveLink</span>
                            <ChevronRight className="w-3 h-3 text-[var(--theme-accent)]" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Tracks Section */}
            <div className="relative z-10 border-t border-[var(--theme-border)] pt-8 mb-12">
                <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
                    <h2 className="text-xl sm:text-2xl font-extrabold flex items-center gap-2">
                        <span>Tracks List</span>
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[var(--theme-surface)] text-[var(--theme-muted)] border border-[var(--theme-border)]">{tracks.length}</span>
                    </h2>
                    {formattedTotalTime && (
                        <span className="text-xs text-[var(--theme-muted)] font-medium flex items-center gap-1.5 bg-[var(--theme-surface)] px-3 py-1 rounded-full border border-[var(--theme-border)]">
                            <Clock size={13} className="text-[var(--theme-accent)]" />
                            <span>Total Runtime: {formattedTotalTime}</span>
                        </span>
                    )}
                </div>

                {/* Grouped Editions & Variations Switcher Bar */}
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
                        <GrooveLoader size={36} text="Loading album tracks from catalog..." />
                    </div>
                ) : (
                    <div className="flex flex-col gap-2.5">
                    {tracks.map((track, index) => {
                        const trackArtists = Array.isArray(track.artists) ? track.artists : Array.isArray(track.artist) ? track.artist : artistsList;
                        const trackTitle = track.title || track.name;
                        const artistsStr = trackArtists.map(a => a.name).join(' ');
                        return (
                            <AlbumTrackCard
                                key={`${track.id || track.trackID || 'track'}-${index}`}
                                title={trackTitle}
                                artist={trackArtists}
                                spoURL={track.spoURL || track.external_urls?.spotify}
                                YTURL={track.YTURL || `https://www.youtube.com/results?search_query=${encodeURIComponent(trackTitle + ' ' + artistsStr)}`}
                                trackURI={track.trackURI || `musicbrainz:track:${track.id || index}`}
                                pos={index}
                                trackID={track.trackID || track.id}
                                duration={track.duration || track.duration_ms}
                                coverImage={coverUrl}
                            />
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
                item={{
                    id: album.id || id,
                    type: "album",
                    name: album.name || album.title,
                    title: album.name || album.title,
                    artist: artistsList,
                    album: album.name || album.title,
                    imageUrl: coverUrl,
                    coverArt: coverUrl,
                    releaseDate: album.releaseDate || album.release_date || (album.releaseYear ? String(album.releaseYear) : null),
                    releaseYear: album.releaseYear,
                    popularity: album.popularity || 85,
                    explicit: false,
                    genres: album.genres || [],
                    externalLinks: album.externalLinks || [],
                    spotifyUrl: album.external_urls?.spotify || album.spoURL,
                    youtubeUrl: album.YTURL
                }}
            />
        </div>
    );
}
