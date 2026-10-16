// src/app/track/[id]/TrackDetailClient.jsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bookmark, BookmarkCheck, Music, Award, Clock, Share2, QrCode, ChevronRight } from "lucide-react";
import { ShareTrackComponent } from "@/Components/CardComponents/ShareTrackComponent";
import GrooveLinkModal from "@/Components/GrooveLinkModal";
import MusicLoreAndReviews from "@/Components/MusicLoreAndReviews";
import RatingPieChart from "@/Components/RatingPieChart";
import GrooveLoader from "@/Components/GrooveLoader";
import { toast } from "react-toastify";

export default function TrackDetailClient({ id, initialData }) {
    const router = useRouter();
    const [track, setTrack] = useState(initialData);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState(null);
    const [showQR, setShowQR] = useState(false);
    const [qrFullScreen, setQrFullScreen] = useState(false);
    const [currentUrl, setCurrentUrl] = useState("");
    const [expandedHeroDesc, setExpandedHeroDesc] = useState(false);
    const [isGrooveLinkOpen, setIsGrooveLinkOpen] = useState(false);

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

    function msToMmSs(ms) {
        if (!ms) return "00:00";
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        const paddedMinutes = String(minutes).padStart(2, '0');
        const paddedSeconds = String(seconds).padStart(2, '0');
        return `${paddedMinutes}:${paddedSeconds}`;
    }

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
            <GrooveLoader fullScreen={true} text="Loading Track..." />
        );
    }

    const artistsList = Array.isArray(track.artists) ? track.artists : [{ name: track.artist || 'Unknown Artist' }];
    const coverUrl = track.album?.images?.[0]?.url || track.coverArt || track.url || 'https://placehold.co/600x600/17020B/E8A87C?text=No+Cover';
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&color=000000&bgcolor=ffffff&ecc=H&data=${encodeURIComponent(currentUrl)}`;

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
                <button
                    onClick={() => setShowQR(!showQR)}
                    className={`p-2.5 rounded-full backdrop-blur-md transition-all duration-300 shadow-md cursor-pointer ${
                        showQR 
                            ? "bg-[var(--theme-accent)] text-[var(--theme-bg)] scale-105" 
                            : "bg-[var(--theme-card)]/90 border border-[var(--theme-border)] text-[var(--theme-fg)] hover:border-[var(--theme-accent)]"
                    }`}
                    title="Show QR Code"
                >
                    <QrCode size={18} />
                </button>
                <ShareTrackComponent 
                    trackId={track.id} 
                    artist={artistsList} 
                    explicit={track.explicit} 
                    title={track.name || track.title} 
                    popularity={track.popularity || 80} 
                    url={coverUrl}
                    releaseDate={track.releaseDate || track.album?.release_date || (track.releaseYear ? String(track.releaseYear) : null)}
                    releaseYear={track.releaseYear}
                    album={track.album?.name || track.album}
                    genres={track.genres || []}
                    type="track" 
                />
                <button 
                    onClick={toggleSave} 
                    className={`p-2.5 rounded-full backdrop-blur-md transition-all duration-300 shadow-md cursor-pointer ${
                        saved 
                            ? "bg-[var(--theme-accent)] text-[var(--theme-bg)] scale-105" 
                            : "bg-[var(--theme-card)]/90 border border-[var(--theme-border)] text-[var(--theme-fg)] hover:border-[var(--theme-accent)]"
                    }`}
                    title={saved ? "Remove Bookmark" : "Bookmark Track"}
                >
                    {saved ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
                </button>
            </div>

            {/* Track Info Glassmorphic Card Container */}
            <div className="relative z-10 mt-14 sm:mt-6 w-full bg-transparent sm:bg-[var(--theme-card)]/80 sm:backdrop-blur-xl border-0 sm:border border-transparent sm:border-[var(--theme-border)] rounded-none sm:rounded-3xl p-2 sm:p-8 flex flex-col md:flex-row items-center gap-8 sm:gap-12 sm:shadow-2xl mb-12">
                {/* Vinyl Record Container */}
                <div className="relative flex-shrink-0 w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 flex items-center justify-center">
                    {/* Spinning Vinyl Record Backing */}
                    <div className="absolute inset-0 rounded-full bg-[var(--theme-card)] border-4 border-[var(--theme-border)] shadow-2xl flex items-center justify-center animate-[spin_15s_linear_infinite] z-0">
                        <div className="w-[90%] h-[90%] rounded-full border border-[var(--theme-border)] flex items-center justify-center">
                            <div className="w-[80%] h-[80%] rounded-full border border-[var(--theme-border)] flex items-center justify-center">
                                <div className="w-[70%] h-[70%] rounded-full border border-[var(--theme-border)]" />
                            </div>
                        </div>
                    </div>

                    {/* Artwork Cover Label */}
                    <div className="relative z-10 w-[55%] h-[55%] rounded-full overflow-hidden shadow-inner ring-4 ring-[var(--theme-border)] bg-[var(--theme-card)] animate-[spin_15s_linear_infinite]">
                        <img 
                            src={coverUrl} 
                            alt={track.name || track.title} 
                            className="w-full h-full object-cover" 
                            onError={(e) => { e.currentTarget.src = 'https://placehold.co/400x400/17020B/E8A87C?text=Track'; }}
                        />
                    </div>
                </div>

                {/* Meta details */}
                <div className="flex-1 min-w-0 text-center md:text-left flex flex-col justify-between">
                    <div>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--theme-card)]/80 border border-[var(--theme-border)] text-xs font-bold text-[var(--theme-accent)] uppercase tracking-wider mb-2">
                            <Music size={13} />
                            <span>Track Details</span>
                        </div>
                        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold mb-3 leading-tight tracking-tight text-[var(--theme-fg)]">{track.name || track.title}</h1>
                        <p className="text-base sm:text-lg text-[var(--theme-fg)]/85 mb-2">
                            {artistsList.map((a, i) => (
                                <span
                                    key={`${a.id || 'artist'}-${i}`}
                                    className="cursor-pointer font-semibold hover:text-[var(--theme-accent)] hover:underline transition"
                                    onClick={() => a.id && router.push(`/artist/${a.id}`)}
                                >
                                    {a.name}{i < artistsList.length - 1 && ', '}
                                </span>
                            ))}
                            {(track.album?.name || track.album) && (
                                <> • <span 
                                    className="cursor-pointer font-medium hover:text-[var(--theme-accent)] hover:underline text-[var(--theme-muted)] text-sm"
                                    onClick={() => track.album?.id && router.push(`/album/${track.album.id}`)}
                                >
                                    {track.album?.name || track.album}
                                </span></>
                            )}
                        </p>
                        <div className="flex justify-center md:justify-start items-center gap-4 text-xs font-medium text-[var(--theme-muted)] mb-4 uppercase tracking-wider flex-wrap">
                            <div className="flex items-center gap-1">
                                <Clock size={14} />
                                <span>{msToMmSs(track.duration_ms || track.durationMs)}</span>
                            </div>
                            <span>•</span>
                            <div className="flex items-center gap-1">
                                <Award size={14} />
                                <span>Score: {track.popularity || 85}</span>
                            </div>
                        </div>

                        {/* Rating Pie Chart (1-5*2, Green: 8-10, Yellow: 5-8, Red: 1-5) */}
                        <div className="flex items-center justify-center md:justify-start mb-3">
                            <RatingPieChart rating={track.rating || { value: (track.popularity ? (track.popularity / 20) : 4.5) }} />
                        </div>
                    </div>
                    
                    {/* Minimized Description before GrooveLink button */}
                    {track.description && (
                        <div className="my-3 text-left">
                            <p className={`text-xs sm:text-sm text-[var(--theme-muted)] leading-relaxed font-body ${!expandedHeroDesc ? "line-clamp-2" : ""}`}>
                                {track.description}
                            </p>
                            {track.description.length > 120 && (
                                <button
                                    onClick={() => setExpandedHeroDesc(!expandedHeroDesc)}
                                    className="mt-1 text-[11px] font-bold text-[var(--theme-accent)] hover:underline transition inline-flex items-center gap-1 cursor-pointer"
                                >
                                    <span>{expandedHeroDesc ? "Show less" : "Read full overview"}</span>
                                </button>
                            )}
                        </div>
                    )}

                    {/* GrooveLink & Sharing Actions */}
                    <div className="border-t border-[var(--theme-border)] pt-4 w-full flex flex-col sm:flex-row items-center justify-center md:justify-start gap-3">
                        <button 
                            onClick={() => setIsGrooveLinkOpen(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--theme-border)] bg-[var(--theme-surface)] hover:bg-[var(--theme-card)] text-[var(--theme-fg)] text-xs font-bold uppercase tracking-wider transition-all duration-300 shadow-md cursor-pointer hover:border-[var(--theme-accent)]"
                        >
                            <img src="/in.svg" alt="GrooveLink" className="w-4 h-4 object-contain" />
                            <span>Open in GrooveLink</span>
                            <ChevronRight className="w-3 h-3 text-[var(--theme-accent)]" />
                        </button>
                    </div>
                </div>
            </div>

            {/* QR Code sharing component */}
            {showQR && (
                <div className="relative z-10 bg-[var(--theme-card)]/80 backdrop-blur-xl border border-[var(--theme-border)] rounded-3xl p-6 flex flex-col items-center gap-4 text-center max-w-sm mx-auto shadow-2xl mb-12 animate-fade-in">
                    <h3 className="text-sm font-bold text-[var(--theme-fg)] uppercase tracking-wider">Scan to Share Track</h3>
                    <div 
                        onClick={() => setQrFullScreen(true)}
                        className="relative w-40 h-40 p-2.5 bg-[var(--theme-surface)] border border-[var(--theme-border)] rounded-2xl flex items-center justify-center shadow-inner cursor-zoom-in group/qr transition duration-300 hover:border-[var(--theme-accent)]/50"
                        title="Click to full screen QR"
                    >
                        <img src={qrCodeUrl} alt="QR Code" className="w-full h-full object-contain rounded-lg" />
                        <div className="absolute w-10 h-10 bg-[var(--theme-surface)] border border-[var(--theme-border)] rounded-full flex items-center justify-center shadow-lg p-1.5 transition duration-300 group-hover/qr:scale-110">
                            <img src="/in.svg" alt="Groove Logo" className="w-full h-full object-contain" />
                        </div>
                    </div>
                    <p className="text-xs text-[var(--theme-muted)] max-w-[240px]">
                        Scan this QR code with your phone camera to share or open this track card instantly. Click code to view in full screen.
                    </p>
                </div>
            )}

            {/* Full-screen QR Modal */}
            {qrFullScreen && (
                <div 
                    className="fixed inset-0 bg-black/90 backdrop-blur-md z-[500] flex flex-col items-center justify-center p-6 animate-fade-in"
                    onClick={() => setQrFullScreen(false)}
                >
                    <div className="max-w-md w-full flex flex-col items-center gap-6" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-white uppercase tracking-widest font-display">Scan QR Code</h3>
                        <div className="relative w-72 h-72 sm:w-80 sm:h-80 p-4 bg-[var(--theme-card)] border border-[var(--theme-border)] rounded-3xl flex items-center justify-center shadow-2xl">
                            <img src={qrCodeUrl} alt="QR Code" className="w-full h-full object-contain rounded-xl" />
                            <div className="absolute w-16 h-16 bg-[var(--theme-surface)] border border-[var(--theme-border)] rounded-full flex items-center justify-center shadow-xl p-2.5">
                                <img src="/in.svg" alt="Groove Logo" className="w-full h-full object-contain" />
                            </div>
                        </div>
                        <p className="text-sm text-[var(--theme-muted)] text-center max-w-[280px]">
                            Scan with your phone's camera to instantly view and share this track card.
                        </p>
                        <button
                            onClick={() => setQrFullScreen(false)}
                            className="px-6 py-2.5 bg-[var(--theme-accent)] hover:opacity-90 text-[var(--theme-bg)] font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            {/* Reviews, Descriptions, Lore, All Tags & External Links */}
            <MusicLoreAndReviews
                id={track.id || id}
                type="track"
                title={track.name || track.title}
                artist={artistsList.map(a => a.name).join(', ')}
                description={track.description}
                tags={track.tags || track.genres || []}
                allTags={track.allTags || []}
                rating={track.rating}
                externalLinks={track.externalLinks || []}
                totalDurationMs={track.duration_ms || track.durationMs}
            />

            {/* GrooveLink Modal */}
            <GrooveLinkModal
                isOpen={isGrooveLinkOpen}
                onClose={() => setIsGrooveLinkOpen(false)}
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
                    genres: track.genres || [],
                    externalLinks: track.externalLinks || [],
                    spotifyUrl: track.external_urls?.spotify || track.spoURL,
                    youtubeUrl: track.YTURL
                }}
            />
        </div>
    );
}
