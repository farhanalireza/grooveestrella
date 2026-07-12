// src/app/track/[id]/TrackDetailClient.jsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bookmark, BookmarkCheck, Loader, Music, Award, Clock, Share2, QrCode, ChevronRight } from "lucide-react";
import { SpotifyButton, YouTubeButton, AppleMusicButton, SoundCloudButton, TidalButton } from "@/Components/MusicButtons";
import { ShareTrackComponent } from "@/Components/CardComponents/ShareTrackComponent";
import { toast } from "react-toastify";

export default function TrackDetailClient({ id, initialData }) {
    const router = useRouter();
    const [track, setTrack] = useState(initialData);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState(null);
    const [showQR, setShowQR] = useState(false);
    const [currentUrl, setCurrentUrl] = useState("");

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
        const isSaved = savedSongs.some(song => song.trackURI === `spotify:track:${id}`);
        setSaved(isSaved);
    }, [id]);

    const toggleSave = () => {
        const savedSongs = JSON.parse(localStorage.getItem("savedSongs")) || [];

        if (saved) {
            const updated = savedSongs.filter(song => song.trackURI !== `spotify:track:${id}`);
            localStorage.setItem("savedSongs", JSON.stringify(updated));
            setSaved(false);
            toast.info(`"${track.name}" removed from library.`);
        } else if (track) {
            const newTrack = {
                title: track.name,
                artist: track.artists,
                image: track.album?.images?.[0]?.url,
                spoURL: track.external_urls.spotify,
                YTURL: `https://www.youtube.com/results?search_query=${encodeURIComponent(track.name + ' ' + track.artists.map(a => a.name).join(' '))}`,
                popularity: track.popularity,
                explicit: track.explicit,
                trackURI: track.uri,
                albumID: track.album?.id,
                trackId: track.id
            };
            savedSongs.push(newTrack);
            localStorage.setItem("savedSongs", JSON.stringify(savedSongs));
            setSaved(true);
            toast.success(`"${track.name}" saved to library! 🎶`);
        }
    };

    // Client-side fallback fetch
    useEffect(() => {
        if (track) return;

        async function fetchTrackData() {
            try {
                setError(null);
                const response = await fetch(`/api/token`);
                const tokenData = await response.json();
                if (!tokenData.access_token) throw new Error("Failed to retrieve token");

                const res = await fetch(`https://api.spotify.com/v1/tracks/${id}`, {
                    headers: { Authorization: `Bearer ${tokenData.access_token}` },
                });
                if (!res.ok) throw new Error("Failed to fetch track details");
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
                    We couldn't connect to the server. Please check your internet connection or try again later.
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
            <div className="flex flex-col items-center justify-center min-h-screen bg-[#07090F] text-[#F4F7FF]">
                <Loader className="animate-spin w-8 h-8 mb-4 text-[#60A5FA]" />
                <span className="text-lg font-medium">Loading Track...</span>
            </div>
        );
    }

    const artistsName = track.artists.map(a => a.name).join(', ');
    const coverUrl = track.album?.images?.[0]?.url || 'https://placehold.co/600x600?text=No+Cover';
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&color=60A5FA&bgcolor=10141F&data=${encodeURIComponent(currentUrl)}`;

    return (
        <div className="relative min-h-screen bg-[#07090F] text-[#F4F7FF] p-6 md:pl-20 md:pr-20 lg:pl-40 lg:pr-40 pt-12 overflow-hidden">
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
                    artist={track.artists} 
                    explicit={track.explicit} 
                    title={track.name} 
                    popularity={track.popularity} 
                    url={coverUrl} 
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
            <div className="relative z-10 mt-14 sm:mt-6 bg-[#10141F]/60 backdrop-blur-xl border border-[#2563EB]/10 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center gap-8 sm:gap-12 shadow-2xl mb-12">
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
                        <img src={coverUrl} alt={track.name} className="w-full h-full object-cover" />
                    </div>
                </div>

                {/* Meta details */}
                <div className="flex-1 min-w-0 text-center md:text-left flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-center md:justify-start gap-2 mb-2 text-xs font-bold text-[#60A5FA] uppercase tracking-widest">
                            <Music size={14} />
                            <span>Track Details</span>
                        </div>
                        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold mb-3 leading-tight tracking-tight text-white">{track.name}</h1>
                        <p className="text-base sm:text-lg text-[#F4F7FF]/80 mb-2">
                            {track.artists.map((a, i) => (
                                <span
                                    key={a.id || i}
                                    className="cursor-pointer hover:text-white hover:underline transition"
                                    onClick={() => a.id && router.push(`/artist/${a.id}`)}
                                >
                                    {a.name}{i < track.artists.length - 1 && ', '}
                                </span>
                            ))} • <span 
                                className="cursor-pointer hover:underline text-[#8992A5] text-sm"
                                onClick={() => track.album?.id && router.push(`/album/${track.album.id}`)}
                            >
                                {track.album?.name}
                            </span>
                        </p>
                        <div className="flex justify-center md:justify-start items-center gap-4 text-xs font-medium text-[#8992A5]/70 mb-6 uppercase tracking-wider">
                            <div className="flex items-center gap-1">
                                <Clock size={14} />
                                <span>{msToMmSs(track.duration_ms)}</span>
                            </div>
                            <span>•</span>
                            <div className="flex items-center gap-1">
                                <Award size={14} />
                                <span>Popularity: {track.popularity}</span>
                            </div>
                        </div>
                    </div>
                    
                    {/* GrooveLink & History Actions */}
                    <div className="border-t border-[#2563EB]/10 pt-6 w-full flex flex-col sm:flex-row items-center justify-center md:justify-start gap-3">
                        <Link 
                            href={`/s/spotify/track/${track.id}`}
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#2563EB]/20 bg-[#2563EB]/5 hover:bg-[#2563EB]/15 text-[#F4F7FF] text-xs font-bold uppercase tracking-wider transition-all duration-300"
                        >
                            <img src="/in.svg" alt="GrooveLink" className="w-4 h-4 object-contain" />
                            <span>Listen on GrooveLink</span>
                            <ChevronRight className="w-3 h-3 text-[#60A5FA]" />
                        </Link>
                        
                        <Link 
                            href={`https://history.grooveestrella.com/track/${track.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-full border border-[#60A5FA]/20 bg-[#10141F] hover:bg-[#60A5FA]/10 text-[#F4F7FF] text-xs font-bold uppercase tracking-wider transition-all duration-300 shadow-lg shadow-[#2563EB]/5"
                        >
                            <span>Explore its history, legacy and cultural impact →</span>
                            <span className="text-[10px] text-[#8992A5] font-normal border-l border-[#8992A5]/30 pl-2">Read on NEW PROJECT</span>
                        </Link>
                    </div>
                </div>
            </div>

            {/* QR Code sharing component */}
            {showQR && (
                <div className="relative z-10 bg-[#10141F]/60 backdrop-blur-xl border border-[#2563EB]/10 rounded-3xl p-6 flex flex-col items-center gap-4 text-center max-w-sm mx-auto shadow-2xl mb-12 animate-fade-in">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Scan to Share Track</h3>
                    <div className="w-40 h-40 p-2.5 bg-[#10141F] border border-[#2563EB]/10 rounded-2xl flex items-center justify-center shadow-inner">
                        <img src={qrCodeUrl} alt="QR Code" className="w-full h-full object-contain rounded-lg" />
                    </div>
                    <p className="text-xs text-[#8992A5] max-w-[240px]">
                        Scan this QR code with your phone camera to share or open this track card instantly.
                    </p>
                </div>
            )}
        </div>
    );
}
