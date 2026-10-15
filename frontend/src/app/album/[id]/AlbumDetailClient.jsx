// src/app/album/[id]/AlbumDetailClient.jsx
"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bookmark, BookmarkCheck, Disc, ChevronRight, Clock, Layers } from "lucide-react";
import { AlbumTrackCard } from "@/Components/CardComponents/SmallTracksCard";
import { ShareTrackComponent } from "@/Components/CardComponents/ShareTrackComponent";
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
            <div className="flex flex-col items-center justify-center min-h-screen bg-[#07090F] text-[#F4F7FF] p-6">
                <h2 className="text-2xl font-bold text-red-500 mb-2">Failed to Load Content</h2>
                <p className="text-[#8992A5] mb-6 text-center max-w-md">
                    We couldn't connect to the catalog. Please check your internet connection or try again later.
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

    if (!album) {
        return (
            <GrooveLoader fullScreen={true} text="Loading Album..." />
        );
    }

    const artistsList = Array.isArray(album.artists) ? album.artists : [{ name: album.artist || 'Various Artists' }];
    const coverUrl = album.images?.[0]?.url || album.coverArt || album.url || 'https://placehold.co/600x600/10141F/60A5FA?text=No+Cover';

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
        <div className="relative min-h-screen bg-[#07090F] text-[#F4F7FF] p-4 pb-32 sm:p-6 md:pl-20 md:pr-20 lg:pl-40 lg:pr-40 pt-12 overflow-hidden">
            {/* Dynamic Ambient Album Backdrop Glow */}
            <div 
                className="absolute top-0 left-0 right-0 h-[65vh] opacity-35 blur-[140px] pointer-events-none z-0 bg-cover bg-center transition-all duration-700"
                style={{ backgroundImage: `url(${coverUrl})` }}
            />

            {/* Back Button */}
            <button 
                onClick={() => router.push("/")}
                className="absolute top-8 left-6 lg:left-16 z-20 p-2.5 rounded-full bg-[#10141F]/70 backdrop-blur-md border border-white/10 text-[#8992A5] hover:text-[#F4F7FF] hover:border-[#E879F9]/40 transition shadow-lg cursor-pointer"
                title="Back to Home"
            >
                <ArrowLeft size={18} />
            </button>

            {/* Actions overlay */}
            <div className="absolute top-8 right-6 lg:right-16 z-20 flex items-center gap-2.5">
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
                            ? "bg-[#870087] text-[#F4F7FF] scale-105 shadow-[#870087]/40 shadow-lg" 
                            : "bg-[#10141F]/60 border border-white/10 text-[#F4F7FF] hover:bg-[#870087]/20 hover:border-[#E879F9]/30"
                    }`}
                    title={saved ? "Remove Bookmark" : "Bookmark Album"}
                >
                    {saved ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
                </button>
            </div>

            {/* Album Card Details Container */}
            <div className="relative z-10 mt-14 sm:mt-6 w-full bg-transparent sm:bg-[#10141F]/60 sm:backdrop-blur-xl border-0 sm:border border-transparent sm:border-white/10 rounded-none sm:rounded-3xl p-2 sm:p-8 flex flex-col md:flex-row items-center gap-8 sm:gap-12 sm:shadow-2xl mb-12">
                {/* Album Cover Art */}
                <div className="relative flex-shrink-0 w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 rounded-2xl overflow-hidden shadow-2xl bg-[#10141F] ring-1 ring-white/10">
                    <img 
                        src={coverUrl} 
                        alt={album.name} 
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" 
                        onError={(e) => { e.currentTarget.src = 'https://placehold.co/400x400/10141F/60A5FA?text=Album'; }}
                    />
                </div>

                {/* Meta details */}
                <div className="flex-1 min-w-0 text-center md:text-left flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-center md:justify-start gap-2 mb-2 text-xs font-bold text-[#E879F9] uppercase tracking-widest">
                            <Disc size={14} />
                            <span>Album Release</span>
                        </div>
                        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold mb-3 leading-tight tracking-tight text-[#F4F7FF]">{album.name || album.title}</h1>
                        <p className="text-base sm:text-lg text-[#F4F7FF]/80 mb-2">
                            {artistsList.map((a, i) => (
                                <span
                                    key={a.id || i}
                                    className="cursor-pointer hover:text-[#F0ABFC] hover:underline transition"
                                    onClick={() => a.id && router.push(`/artist/${a.id}`)}
                                >
                                    {a.name}{i < artistsList.length - 1 && ', '}
                                </span>
                            ))} • <span className="text-[#8992A5] text-sm">{album.releaseDate || album.release_date || 'Release'}</span>
                        </p>
                        
                        <div className="flex items-center justify-center md:justify-start gap-3 text-xs text-[#8992A5]/70 font-medium mb-4 uppercase tracking-wider flex-wrap">
                            <span>{tracks.length || album.total_tracks || 0} tracks total</span>
                            {formattedTotalTime && (
                                <>
                                    <span>•</span>
                                    <span className="inline-flex items-center gap-1 text-[#F4F7FF]/90 font-bold">
                                        <Clock size={13} className="text-[#E879F9]" />
                                        <span>{formattedTotalTime}</span>
                                    </span>
                                </>
                            )}
                            {album.genres?.length > 0 && (
                                <>
                                    <span>•</span>
                                    <span className="text-[#E879F9] font-bold">{album.genres.slice(0, 3).join(', ')}</span>
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
                            <p className={`text-xs sm:text-sm text-[#8992A5] leading-relaxed font-body ${!expandedHeroDesc ? "line-clamp-2" : ""}`}>
                                {album.description}
                            </p>
                            {album.description.length > 120 && (
                                <button
                                    onClick={() => setExpandedHeroDesc(!expandedHeroDesc)}
                                    className="mt-1 text-[11px] font-bold text-[#E879F9] hover:text-[#F0ABFC] transition inline-flex items-center gap-1 cursor-pointer"
                                >
                                    <span>{expandedHeroDesc ? "Show less" : "Read full overview"}</span>
                                </button>
                            )}
                        </div>
                    )}

                    {/* GrooveLink & History Actions */}
                    <div className="border-t border-white/10 pt-4 w-full flex flex-col sm:flex-row items-center justify-center md:justify-start gap-3">
                        <Link 
                            href={`/s/musicbrainz/album/${album.id || id}`}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#870087]/30 bg-[#870087]/15 hover:bg-[#870087]/25 text-[#F4F7FF] text-xs font-bold uppercase tracking-wider transition-all duration-300 shadow-md shadow-[#870087]/10"
                        >
                            <img src="/in.svg" alt="GrooveLink" className="w-4 h-4 object-contain" />
                            <span>Open in GrooveLink</span>
                            <ChevronRight className="w-3 h-3 text-[#E879F9]" />
                        </Link>
                    </div>
                </div>
            </div>

            {/* Tracks Section */}
            <div className="relative z-10 border-t border-white/10 pt-8 mb-12">
                <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
                    <h2 className="text-xl sm:text-2xl font-extrabold flex items-center gap-2">
                        <span>Tracks List</span>
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-white/[0.03] text-[#8992A5] border border-white/10">{tracks.length}</span>
                    </h2>
                    {formattedTotalTime && (
                        <span className="text-xs text-[#8992A5] font-medium flex items-center gap-1.5 bg-[#870087]/10 px-3 py-1 rounded-full border border-[#870087]/20">
                            <Clock size={13} className="text-[#E879F9]" />
                            <span>Total Runtime: {formattedTotalTime}</span>
                        </span>
                    )}
                </div>

                {/* Grouped Editions & Variations Switcher Bar */}
                {groupedVariations.length > 0 && (
                    <div className="mb-6 p-4 rounded-2xl bg-[#10141F]/80 border border-white/10 backdrop-blur-xl space-y-3">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2 text-xs font-bold text-[#E879F9] uppercase tracking-wider">
                                <Layers size={14} />
                                <span>Editions & Variations ({album.variations?.length || 0} pressings across {groupedVariations.length} eras)</span>
                            </div>
                            <span className="text-[11px] text-[#8992A5]">
                                {loadingTracks ? (
                                    <span className="text-[#E879F9] font-bold animate-pulse inline-flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-[#E879F9] animate-ping inline-block" />
                                        Switching edition...
                                    </span>
                                ) : (
                                    <>Active: <strong className="text-white">{album.releaseDate || 'Default'}</strong> • {tracks.length} tracks</>
                                )}
                            </span>
                        </div>

                        {/* Top Level: Group / Era Selector */}
                        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-white/10">
                            {groupedVariations.map((group) => {
                                const isGroupActive = group.items.some(
                                    item => (selectedReleaseId === item.id) || (!selectedReleaseId && item.isOriginal)
                                );
                                return (
                                    <button
                                        key={group.key}
                                        disabled={loadingTracks}
                                        onClick={() => {
                                            const firstItem = group.items[0];
                                            if (firstItem) handleSwitchEdition(firstItem.id);
                                        }}
                                        className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed ${
                                            isGroupActive
                                                ? "bg-gradient-to-r from-[#870087] to-[#C026D3] text-white font-bold shadow-md shadow-[#870087]/30 ring-1 ring-[#E879F9]/50"
                                                : "bg-white/[0.03] border border-white/5 text-[#8992A5] hover:text-white hover:border-[#870087]/40 hover:bg-white/5"
                                        }`}
                                    >
                                        <span>{group.name}</span>
                                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                                            isGroupActive ? "bg-white/20 text-white" : "bg-white/5 text-[#8992A5]"
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
                                <div className="pt-2.5 border-t border-white/5 flex items-center gap-2 overflow-x-auto text-xs pb-1 scrollbar-thin scrollbar-thumb-white/10">
                                    <span className="text-[10px] uppercase font-bold text-[#8992A5] tracking-wider shrink-0">
                                        Regional Pressings:
                                    </span>
                                    {activeGroup.items.map((item) => {
                                        const isSelected = (selectedReleaseId === item.id) || (!selectedReleaseId && item.isOriginal);
                                        return (
                                            <button
                                                key={item.id}
                                                disabled={loadingTracks}
                                                onClick={() => handleSwitchEdition(item.id)}
                                                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition cursor-pointer flex items-center gap-1 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed ${
                                                    isSelected
                                                        ? "bg-[#870087]/30 text-[#F0ABFC] border border-[#E879F9]/40 font-bold"
                                                        : "bg-white/[0.02] text-[#8992A5] hover:text-white border border-transparent hover:border-white/10"
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
                    <div className="flex flex-col items-center justify-center p-12 rounded-2xl bg-white/[0.02] border border-white/5 text-center">
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
                                key={track.id || index}
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
        </div>
    );
}
