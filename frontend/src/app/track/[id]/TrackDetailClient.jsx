// src/app/track/[id]/TrackDetailClient.jsx
"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
    ArrowLeft, 
    Share2, 
    Plus, 
    Check, 
    Sparkles, 
    ListPlus, 
    QrCode, 
    ChevronRight, 
    Award, 
    Clock, 
    Music 
} from "lucide-react";
import GrooveLinkModal from "@/Components/GrooveLinkModal";
import GrooveCardComposer from "@/Components/GrooveCardComposer";
import MusicLoreAndReviews from "@/Components/MusicLoreAndReviews";
import RatingPieChart from "@/Components/RatingPieChart";
import GrooveLoader from "@/Components/GrooveLoader";
import { toast } from "@/lib/toast";
import { shareLink } from "@/lib/shareHelper";

export default function TrackDetailClient({ id, initialData }) {
    const router = useRouter();
    const [track, setTrack] = useState(initialData);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState(null);
    const [qrFullScreen, setQrFullScreen] = useState(false);
    const [currentUrl, setCurrentUrl] = useState("");
    const [expandedHeroDesc, setExpandedHeroDesc] = useState(false);
    const [isGrooveLinkOpen, setIsGrooveLinkOpen] = useState(false);
    const [isGrooveCardOpen, setIsGrooveCardOpen] = useState(false);

    useEffect(() => {
        if (typeof window !== "undefined") {
            setCurrentUrl(window.location.href);
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
        const savedSongs = JSON.parse(localStorage.getItem("savedSongs")) || [];
        const isSaved = savedSongs.some(
            song => song.trackId === id || song.trackURI === `musicbrainz:track:${id}` || song.trackURI === `spotify:track:${id}` || song.trackURI === id
        );
        setSaved(isSaved);
    }, [id]);

    const toggleSave = () => {
        const savedSongs = JSON.parse(localStorage.getItem("savedSongs")) || [];

        if (saved) {
            const updated = savedSongs.filter(
                song => song.trackId !== id && song.trackURI !== `musicbrainz:track:${id}` && song.trackURI !== `spotify:track:${id}` && song.trackURI !== id
            );
            localStorage.setItem("savedSongs", JSON.stringify(updated));
            setSaved(false);
            toast.info(`"${track.name || track.title}" removed from library.`);
        } else if (track) {
            const trackArtists = Array.isArray(track.artists) ? track.artists : [{ name: track.artist || 'Unknown' }];
            const artistsStr = trackArtists.map(a => a.name).join(' ');
            const trackName = track.name || track.title;
            const coverImage = track.album?.images?.[0]?.url || track.coverArt || track.url;
            const trackUri = track.uri || track.trackURI || `musicbrainz:track:${id}`;

            const newTrack = {
                title: trackName,
                name: trackName,
                artist: trackArtists,
                image: coverImage,
                spoURL: track.external_urls?.spotify || `https://open.spotify.com/search/${encodeURIComponent(trackName + ' ' + artistsStr)}`,
                YTURL: `https://www.youtube.com/results?search_query=${encodeURIComponent(trackName + ' ' + artistsStr)}`,
                popularity: track.popularity || 80,
                explicit: track.explicit || false,
                trackURI: trackUri,
                albumID: track.album?.id || '',
                trackId: track.id || id
            };
            savedSongs.push(newTrack);
            localStorage.setItem("savedSongs", JSON.stringify(savedSongs));
            setSaved(true);
            toast.success(`"${trackName}" saved to library! 🎶`);
        }
    };

    // Client-side fallback fetch via our backend MusicBrainz endpoint
    useEffect(() => {
        if (track) return;

        async function fetchTrackData() {
            try {
                setError(null);
                const res = await fetch(`/api/track/${encodeURIComponent(id)}`);
                if (!res.ok) throw new Error("Failed to fetch track details from catalog");
                const data = await res.json();
                setTrack(data);
            } catch (err) {
                console.error("Error fetching track data:", err);
                setError(err);
            }
        }
        fetchTrackData();
    }, [id, track]);

    const handleBack = () => {
        if (typeof window !== "undefined" && window.history.length > 1) {
            router.back();
        } else {
            router.push("/");
        }
    };

    const artistsList = Array.isArray(track?.artists) ? track.artists : [{ name: track?.artist || 'Unknown Artist' }];
    const coverUrl = track?.album?.images?.[0]?.url || track?.coverArt || track?.url || 'https://placehold.co/600x600/17020B/E8A87C?text=No+Cover';
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&color=d4af37&bgcolor=ffffff&ecc=H&data=${encodeURIComponent(currentUrl)}`;

    const handleNativeShare = async () => {
        await shareLink({
            name: track?.name || track?.title,
            artists: artistsList,
            type: "track",
            id: track?.id || track?.trackId || id,
        });
    };

    const durationMs = track?.duration_ms || track?.durationMs || track?.duration;
    function formatDuration(ms) {
        if (!ms) return null;
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    const formattedDuration = formatDuration(durationMs);

    const validGenres = useMemo(() => {
        const rawList = track?.genres || track?.tags || [];
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
        return valid;
    }, [track?.genres, track?.tags]);

    const displayGenre = validGenres.length > 0 ? validGenres[0] : null;
    const releaseYear = track?.releaseYear || (track?.releaseDate ? new Date(track.releaseDate).getFullYear() : (track?.album?.release_date ? new Date(track.album.release_date).getFullYear() : null));

    const handleAddToPlaylist = () => {
        if (!track) return;
        const trackArtists = Array.isArray(track.artists) ? track.artists : [{ name: track.artist || 'Unknown' }];
        const trackName = track.name || track.title;
        const trackCover = track.album?.images?.[0]?.url || track.coverArt || track.url;

        window.dispatchEvent(new CustomEvent('open-playlist-picker', {
            detail: {
                track: {
                    id: track.id || id,
                    name: trackName,
                    title: trackName,
                    artists: trackArtists,
                    duration_ms: durationMs,
                    album: {
                        id: track.album?.id,
                        name: track.album?.name || track.album || '',
                        images: [{ url: trackCover }]
                    },
                    spoURL: track.external_urls?.spotify || track.spoURL,
                    YTURL: track.YTURL
                }
            }
        }));
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

    if (!track) {
        return (
            <GrooveLoader fullScreen={true} size={72} />
        );
    }

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
                    title="Share Track"
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
                    title="Share Track"
                >
                    <Share2 size={18} />
                </button>
            </header>

            {/* Centered Apple Music Style Hero */}
            <div className="relative z-10 w-full max-w-xl mx-auto flex flex-col items-center text-center px-4 mb-8">
                {/* Square Track Artwork */}
                <div className="w-56 h-56 sm:w-64 sm:h-64 md:w-72 md:h-72 aspect-square rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl bg-[var(--theme-surface)] ring-1 ring-[var(--theme-border)] group relative">
                    <img 
                        src={coverUrl} 
                        alt={track.name || track.title} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                        onError={(e) => { e.currentTarget.src = 'https://placehold.co/500x500/17020B/E8A87C?text=Track'; }}
                    />
                </div>

                {/* Track Title with Explicit [E] badge */}
                <div className="mt-5 sm:mt-6 flex items-center justify-center gap-2 flex-wrap">
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-black leading-tight text-[var(--theme-fg)] tracking-tight">
                        {track.name || track.title}
                    </h1>
                    {track.explicit && (
                        <span className="inline-flex items-center justify-center w-4 h-4 rounded-[3px] text-[10px] font-bold bg-[var(--theme-muted)]/20 text-[var(--theme-fg)]/90 shrink-0 select-none">
                            E
                        </span>
                    )}
                </div>

                {/* Clickable Artists */}
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

                {/* Clickable Album Name */}
                {(track.album?.name || track.album) && (
                    <div className="mt-0.5">
                        <span 
                            className="text-xs sm:text-sm text-[var(--theme-muted)] hover:text-[var(--theme-accent)] transition cursor-pointer font-medium"
                            onClick={() => track.album?.id && router.push(`/album/${track.album.id}`)}
                        >
                            {track.album?.name || track.album}
                        </span>
                    </div>
                )}

                {/* Subtitle: Genre · Year · Duration */}
                <p className="text-xs sm:text-sm text-[var(--theme-muted)] font-medium mt-1">
                    {displayGenre ? `${displayGenre} · ` : ""}{releaseYear || "Track"}
                    {formattedDuration && ` · ${formattedDuration}`}
                </p>

                {/* Centered Action Controls Row: GrooveCard, Open GrooveLink, Add to Playlist, Bookmark, QR */}
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
                        title="Open GrooveLink"
                    >
                        <img src="/in.svg" alt="GrooveLink" className="w-5 h-5 object-contain shrink-0" />
                        <span className="whitespace-nowrap">Open GrooveLink</span>
                        <ChevronRight size={15} className="shrink-0" />
                    </button>

                    {/* Add to Playlist Button */}
                    <button
                        onClick={handleAddToPlaylist}
                        className="w-12 h-12 rounded-full aspect-square shrink-0 bg-[var(--theme-card)]/80 hover:bg-[var(--theme-surface)] active:scale-95 text-[var(--theme-fg)] flex items-center justify-center transition-all duration-200 backdrop-blur-md cursor-pointer shadow-lg border border-[var(--theme-border)] group"
                        title="Add to Playlist"
                    >
                        <ListPlus size={20} className="text-[var(--theme-fg)] group-hover:text-[var(--theme-accent)] transition-colors" />
                    </button>

                    {/* Bookmark / Library Button */}
                    <button
                        onClick={toggleSave}
                        className="w-12 h-12 rounded-full aspect-square shrink-0 bg-[var(--theme-card)]/80 hover:bg-[var(--theme-surface)] active:scale-95 text-[var(--theme-fg)] flex items-center justify-center transition-all duration-200 backdrop-blur-md cursor-pointer shadow-lg border border-[var(--theme-border)]"
                        title={saved ? "Remove from Library" : "Add to Library"}
                    >
                        {saved ? <Check size={20} className="text-[var(--theme-accent)]" /> : <Plus size={20} />}
                    </button>

                    {/* QR Code Button: opens directly in full screen */}
                    <button
                        onClick={() => setQrFullScreen(true)}
                        className="w-12 h-12 rounded-full aspect-square shrink-0 bg-[var(--theme-card)]/80 hover:bg-[var(--theme-surface)] active:scale-95 text-[var(--theme-fg)] flex items-center justify-center transition-all duration-200 backdrop-blur-md cursor-pointer shadow-lg border border-[var(--theme-border)] group"
                        title="View Full-Screen QR Code"
                    >
                        <QrCode size={19} className="text-[var(--theme-fg)] group-hover:text-[var(--theme-accent)] transition-colors" />
                    </button>
                </div>

                {/* Score & Rating Pie Chart */}
                <div className="mt-5 flex items-center justify-center gap-3">
                    <div className="px-3 py-1.5 rounded-full bg-[var(--theme-card)]/80 backdrop-blur-md border border-[var(--theme-border)] flex items-center gap-2">
                        <Award size={14} className="text-[var(--theme-accent)]" />
                        <span className="text-xs font-bold text-[var(--theme-fg)]">Score: {track.popularity || 85}</span>
                    </div>
                    <RatingPieChart rating={track.rating || { value: (track.popularity ? (track.popularity / 20) : 4.5) }} />
                </div>

                {/* Description / Editorial Notes / Lore */}
                {track.description && (
                    <div className="mt-6 w-full text-left text-xs sm:text-sm text-[var(--theme-muted)] leading-relaxed font-body">
                        <strong className="font-extrabold text-[var(--theme-fg)] mr-1.5">Overview & Lore</strong>
                        <span className={!expandedHeroDesc ? "line-clamp-2" : ""}>
                            {track.description}
                        </span>
                        {track.description.length > 80 && (
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

            {/* Full-screen QR Modal */}
            {qrFullScreen && (
                <div 
                    className="fixed inset-0 bg-black/90 backdrop-blur-md z-[500] flex flex-col items-center justify-center p-6 animate-fade-in"
                    onClick={() => setQrFullScreen(false)}
                >
                    <div className="max-w-md w-full flex flex-col items-center gap-6" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-white uppercase tracking-widest font-display">Scan QR Code</h3>
                        <div className="relative w-72 h-72 sm:w-80 sm:h-80 p-5 bg-white rounded-3xl flex items-center justify-center shadow-2xl border border-white/20">
                            <img src={qrCodeUrl} alt="QR Code" className="w-full h-full object-contain rounded-xl" />
                            <div className="absolute w-14 h-14 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-xl p-2">
                                <img src="/in.svg" alt="Groove Logo" className="w-full h-full object-contain" />
                            </div>
                        </div>
                        <p className="text-sm text-gray-300 text-center max-w-[280px]">
                            Scan with your phone&apos;s camera to instantly view and share this track card.
                        </p>
                        <button
                            onClick={() => setQrFullScreen(false)}
                            className="px-6 py-2.5 bg-[var(--theme-accent)] hover:opacity-90 text-[var(--theme-accent-fg)] font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer shadow-lg active:scale-95"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            {/* Music Lore, Community Reviews, Tags & Deep Catalog Metadata */}
            <div className="relative z-10 border-t border-[var(--theme-border)] pt-8 mb-12">
                <MusicLoreAndReviews
                    id={track.id || id}
                    type="track"
                    title={track.name || track.title}
                    artist={artistsList.map(a => a.name).join(', ')}
                    description={track.description}
                    primaryGenre={track.primaryGenre || displayGenre}
                    genres={track.genres || []}
                    categorizedTags={track.categorizedTags || null}
                    tags={track.tags || track.genres || []}
                    allTags={track.allTags || []}
                    rating={track.rating}
                    externalLinks={track.externalLinks || []}
                    totalDurationMs={durationMs}
                />
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
                    id: track.id || id,
                    type: "track",
                    name: track.name || track.title,
                    title: track.name || track.title,
                    artist: artistsList,
                    album: track.album?.name || track.album,
                    imageUrl: coverUrl,
                    coverArt: coverUrl,
                    releaseDate: track.releaseDate || track.album?.release_date || (track.releaseYear ? String(track.releaseYear) : null),
                    releaseYear: track.releaseYear,
                    popularity: track.popularity,
                    explicit: track.explicit,
                    genres: validGenres,
                    externalLinks: track.externalLinks || [],
                    spotifyUrl: track.external_urls?.spotify || track.spoURL,
                    youtubeUrl: track.YTURL
                }}
            />

            {/* GrooveCard Composer Modal */}
            <GrooveCardComposer
                isOpen={isGrooveCardOpen}
                onClose={() => setIsGrooveCardOpen(false)}
                itemId={track.id || id}
                title={track.name || track.title}
                artist={artistsList}
                imageUrl={coverUrl}
                popularity={track.popularity || 80}
                rating={track.rating}
                duration={track.duration || track.duration_ms}
                discCount={track.disc_number || 1}
                explicit={track.explicit}
                type="track"
                releaseDate={track.releaseDate || track.album?.release_date || (track.releaseYear ? String(track.releaseYear) : null)}
                releaseYear={track.releaseYear}
                album={track.album?.name || track.album}
                genres={validGenres}
            />
        </div>
    );
}
