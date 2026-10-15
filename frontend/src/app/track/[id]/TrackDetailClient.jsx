// src/app/track/[id]/TrackDetailClient.jsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bookmark, BookmarkCheck, Music, Award, Clock, Share2, QrCode, ChevronRight } from "lucide-react";
import { ShareTrackComponent } from "@/Components/CardComponents/ShareTrackComponent";
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

    useEffect(() => {
        if (typeof window !== "undefined") {
            setCurrentUrl(window.location.href);
        }
    }, [id]);

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
            <div className="flex flex-col items-center justify-center min-h-screen bg-[#07090F] text-[#F4F7FF] p-6">
                <h2 className="text-2xl font-bold text-red-500 mb-2">Failed to Load Content</h2>
                <p className="text-[#8992A5] mb-6 text-center max-w-md">
                    We couldn't connect to the catalog. Please check your internet connection or try again later.
                </p>
                <button
                    onClick={() => window.location.reload()}
                    className="bg-[#2563EB] hover:bg-[#60A5FA] text-white font-semibold py-2 px-6 rounded-full transition duration-300 cursor-pointer"
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
    const coverUrl = track.album?.images?.[0]?.url || track.coverArt || track.url || 'https://placehold.co/600x600/10141F/60A5FA?text=No+Cover';
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&color=60A5FA&bgcolor=10141F&ecc=H&data=${encodeURIComponent(currentUrl)}`;

    return (
        <div className="relative min-h-screen bg-[#07090F] text-[#F4F7FF] p-4 pb-32 sm:p-6 md:pl-20 md:pr-20 lg:pl-40 lg:pr-40 pt-12 overflow-hidden">
            {/* Blurry Backdrop Glow */}
            <div 
                className="absolute top-0 left-0 right-0 h-[50vh] opacity-15 blur-[120px] pointer-events-none z-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${coverUrl})` }}
            />

            {/* Back Button */}
            <button 
                onClick={() => router.push("/")}
                className="absolute top-8 left-6 lg:left-16 z-20 p-2.5 rounded-full bg-[#10141F]/70 backdrop-blur-md border border-[#2563EB]/15 text-[#8992A5] hover:text-[#F4F7FF] hover:border-[#60A5FA]/30 transition shadow-lg cursor-pointer"
                title="Back to Home"
            >
                <ArrowLeft size={18} />
            </button>

            {/* Actions overlay */}
            <div className="absolute top-8 right-6 lg:right-16 z-20 flex items-center gap-2.5">
                <button
                    onClick={() => setShowQR(!showQR)}
                    className={`p-2.5 rounded-full backdrop-blur-md transition-all duration-300 shadow-md ${
                        showQR 
                            ? "bg-[#2563EB] text-[#F4F7FF] scale-105" 
                            : "bg-[#10141F]/60 border border-[#2563EB]/15 text-[#F4F7FF] hover:bg-[#2563EB]/15"
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
                    className={`p-2.5 rounded-full backdrop-blur-md transition-all duration-300 shadow-md ${
                        saved 
                            ? "bg-[#2563EB] text-[#F4F7FF] scale-105" 
                            : "bg-[#10141F]/60 border border-[#2563EB]/15 text-[#F4F7FF] hover:bg-[#2563EB]/15"
                    }`}
                    title={saved ? "Remove Bookmark" : "Bookmark Track"}
                >
                    {saved ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
                </button>
            </div>

            {/* Track Info Glassmorphic Card Container */}
            <div className="relative z-10 mt-14 sm:mt-6 w-full bg-transparent sm:bg-[#10141F]/60 sm:backdrop-blur-xl border-0 sm:border border-transparent sm:border-[#2563EB]/10 rounded-none sm:rounded-3xl p-2 sm:p-8 flex flex-col md:flex-row items-center gap-8 sm:gap-12 sm:shadow-2xl mb-12">
                {/* Vinyl Record Container */}
                <div className="relative flex-shrink-0 w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 flex items-center justify-center">
                    {/* Spinning Vinyl Record Backing */}
                    <div className="absolute inset-0 rounded-full bg-[#07090F] border-4 border-[#10141F] shadow-2xl flex items-center justify-center animate-[spin_15s_linear_infinite] z-0">
                        <div className="w-[90%] h-[90%] rounded-full border border-[#2563EB]/10 flex items-center justify-center">
                            <div className="w-[80%] h-[80%] rounded-full border border-[#2563EB]/10 flex items-center justify-center">
                                <div className="w-[70%] h-[70%] rounded-full border border-[#2563EB]/10" />
                            </div>
                        </div>
                    </div>

                    {/* Artwork Cover Label */}
                    <div className="relative z-10 w-[55%] h-[55%] rounded-full overflow-hidden shadow-inner ring-4 ring-[#10141F] bg-[#10141F] animate-[spin_15s_linear_infinite]">
                        <img 
                            src={coverUrl} 
                            alt={track.name || track.title} 
                            className="w-full h-full object-cover" 
                            onError={(e) => { e.currentTarget.src = 'https://placehold.co/400x400/10141F/60A5FA?text=Track'; }}
                        />
                    </div>
                </div>

                {/* Meta details */}
                <div className="flex-1 min-w-0 text-center md:text-left flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-center md:justify-start gap-2 mb-2 text-xs font-bold text-[#60A5FA] uppercase tracking-widest">
                            <Music size={14} />
                            <span>Track Details</span>
                        </div>
                        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold mb-3 leading-tight tracking-tight text-white">{track.name || track.title}</h1>
                        <p className="text-base sm:text-lg text-[#F4F7FF]/80 mb-2">
                            {artistsList.map((a, i) => (
                                <span
                                    key={a.id || i}
                                    className="cursor-pointer hover:text-white hover:underline transition"
                                    onClick={() => a.id && router.push(`/artist/${a.id}`)}
                                >
                                    {a.name}{i < artistsList.length - 1 && ', '}
                                </span>
                            ))}
                            {(track.album?.name || track.album) && (
                                <> • <span 
                                    className="cursor-pointer hover:text-white hover:underline text-[#8992A5] text-sm"
                                    onClick={() => track.album?.id && router.push(`/album/${track.album.id}`)}
                                >
                                    {track.album?.name || track.album}
                                </span></>
                            )}
                        </p>
                        <div className="flex justify-center md:justify-start items-center gap-4 text-xs font-medium text-[#8992A5]/70 mb-4 uppercase tracking-wider flex-wrap">
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
                            <p className={`text-xs sm:text-sm text-[#8992A5] leading-relaxed font-body ${!expandedHeroDesc ? "line-clamp-2" : ""}`}>
                                {track.description}
                            </p>
                            {track.description.length > 120 && (
                                <button
                                    onClick={() => setExpandedHeroDesc(!expandedHeroDesc)}
                                    className="mt-1 text-[11px] font-bold text-[#60A5FA] hover:text-[#F4F7FF] transition inline-flex items-center gap-1 cursor-pointer"
                                >
                                    <span>{expandedHeroDesc ? "Show less" : "Read full overview"}</span>
                                </button>
                            )}
                        </div>
                    )}

                    {/* GrooveLink & Sharing Actions */}
                    <div className="border-t border-[#2563EB]/10 pt-4 w-full flex flex-col sm:flex-row items-center justify-center md:justify-start gap-3">
                        <Link 
                            href={`/s/musicbrainz/track/${track.id || id}`}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#2563EB]/20 bg-[#2563EB]/10 hover:bg-[#2563EB]/20 text-[#F4F7FF] text-xs font-bold uppercase tracking-wider transition-all duration-300"
                        >
                            <img src="/in.svg" alt="GrooveLink" className="w-4 h-4 object-contain" />
                            <span>Open in GrooveLink</span>
                            <ChevronRight className="w-3 h-3 text-[#60A5FA]" />
                        </Link>
                    </div>
                </div>
            </div>

            {/* QR Code sharing component */}
            {showQR && (
                <div className="relative z-10 bg-[#10141F]/60 backdrop-blur-xl border border-[#2563EB]/10 rounded-3xl p-6 flex flex-col items-center gap-4 text-center max-w-sm mx-auto shadow-2xl mb-12 animate-fade-in">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Scan to Share Track</h3>
                    <div 
                        onClick={() => setQrFullScreen(true)}
                        className="relative w-40 h-40 p-2.5 bg-[#10141F] border border-[#2563EB]/10 rounded-2xl flex items-center justify-center shadow-inner cursor-zoom-in group/qr transition duration-300 hover:border-[#60A5FA]/30"
                        title="Click to full screen QR"
                    >
                        <img src={qrCodeUrl} alt="QR Code" className="w-full h-full object-contain rounded-lg" />
                        <div className="absolute w-10 h-10 bg-[#10141F] border border-[#2563EB]/25 rounded-full flex items-center justify-center shadow-lg p-1.5 transition duration-300 group-hover/qr:scale-110">
                            <img src="/in.svg" alt="Groove Logo" className="w-full h-full object-contain" />
                        </div>
                    </div>
                    <p className="text-xs text-[#8992A5] max-w-[240px]">
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
                        <div className="relative w-72 h-72 sm:w-80 sm:h-80 p-4 bg-[#10141F] border border-[#2563EB]/20 rounded-3xl flex items-center justify-center shadow-2xl">
                            <img src={qrCodeUrl} alt="QR Code" className="w-full h-full object-contain rounded-xl" />
                            <div className="absolute w-16 h-16 bg-[#10141F] border border-[#2563EB]/20 rounded-full flex items-center justify-center shadow-xl p-2.5">
                                <img src="/in.svg" alt="Groove Logo" className="w-full h-full object-contain" />
                            </div>
                        </div>
                        <p className="text-sm text-[#8992A5] text-center max-w-[280px]">
                            Scan with your phone's camera to instantly view and share this track card.
                        </p>
                        <button
                            onClick={() => setQrFullScreen(false)}
                            className="px-6 py-2.5 bg-[#2563EB] hover:bg-[#60A5FA] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer"
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
        </div>
    );
}
