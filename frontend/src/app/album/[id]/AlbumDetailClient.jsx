// src/app/album/[id]/AlbumDetailClient.jsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bookmark, BookmarkCheck, Loader, Disc, ChevronRight } from "lucide-react";
import { SpotifyButton, YouTubeButton, AppleMusicButton, SoundCloudButton, TidalButton } from "@/Components/MusicButtons";
import { AlbumTrackCard } from "@/Components/CardComponents/SmallTracksCard";
import { ShareTrackComponent } from "@/Components/CardComponents/ShareTrackComponent";
import { toast } from "react-toastify";

export default function AlbumDetailClient({ id, initialAlbum, initialTracks }) {
    const router = useRouter();
    const [album, setAlbum] = useState(initialAlbum);
    const [tracks, setTracks] = useState(initialTracks || []);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!id) return;
        const savedAlbums = JSON.parse(localStorage.getItem("savedAlbums")) || [];
        const isSaved = savedAlbums.some(a => a.id === id);
        setSaved(isSaved);
    }, [id]);

    const toggleSave = () => {
        const savedAlbums = JSON.parse(localStorage.getItem("savedAlbums")) || [];
        if (saved) {
            const updated = savedAlbums.filter(a => a.id !== id);
            localStorage.setItem("savedAlbums", JSON.stringify(updated));
            setSaved(false);
            toast.info(`"${album.name}" removed from library.`);
        } else if (album) {
            const newAlbum = {
                id: album.id,
                title: album.name,
                artist: album.artists,
                image: album.images?.[0]?.url,
                spoURL: album.external_urls?.spotify,
                release_date: album.release_date,
                tracksCount: album.total_tracks
            };
            savedAlbums.push(newAlbum);
            localStorage.setItem("savedAlbums", JSON.stringify(savedAlbums));
            setSaved(true);
            toast.success(`"${album.name}" saved to library! 💿`);
        }
    };

    // Client-side fallback fetch
    useEffect(() => {
        if (album) return;

        async function fetchAlbumData() {
            try {
                setError(null);
                const response = await fetch(`/api/token`);
                const tokenData = await response.json();
                if (!tokenData.access_token) throw new Error("Failed to retrieve token");

                const [albumRes, tracksRes] = await Promise.all([
                    fetch(`https://api.spotify.com/v1/albums/${id}`, {
                        headers: { Authorization: `Bearer ${tokenData.access_token}` }
                    }),
                    fetch(`https://api.spotify.com/v1/albums/${id}/tracks`, {
                        headers: { Authorization: `Bearer ${tokenData.access_token}` }
                    })
                ]);

                if (!albumRes.ok || !tracksRes.ok) throw new Error("Failed to fetch album details");

                const albumData = await albumRes.json();
                const tracksData = await tracksRes.json();

                setAlbum(albumData);
                setTracks(tracksData.items);
            } catch (err) {
                console.error("Error fetching album data:", err);
                setError(err);
            }
        }
        fetchAlbumData();
    }, [id, album]);

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-[#07090F] text-[#F4F7FF] p-6">
                <h2 className="text-2xl font-bold text-red-500 mb-2">Failed to Load Content</h2>
                <p className="text-[#8992A5] mb-6 text-center max-w-md">
                    We couldn't connect to the server. Please check your internet connection or try again later.
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
            <div className="flex flex-col items-center justify-center min-h-screen bg-[#07090F] text-[#F4F7FF]">
                <Loader className="animate-spin w-8 h-8 mb-4 text-[#60A5FA]" />
                <span className="text-lg font-medium">Loading Album...</span>
            </div>
        );
    }

    const artistsName = album.artists.map(a => a.name).join(', ');
    const coverUrl = album.images?.[0]?.url || 'https://placehold.co/600x600?text=No+Cover';

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
                className="absolute top-8 left-6 lg:left-16 z-20 p-2.5 rounded-full bg-[#10141F]/70 backdrop-blur-md border border-[#2563EB]/15 text-[#F4F7FF]/80 hover:text-[#F4F7FF] hover:border-[#60A5FA]/30 transition shadow-lg cursor-pointer"
                title="Back to Home"
            >
                <ArrowLeft size={18} />
            </button>

            {/* Header Actions */}
            <div className="absolute top-8 right-6 lg:right-16 z-20 flex items-center gap-2.5">
                <ShareTrackComponent 
                    trackId={album.id} 
                    artist={album.artists} 
                    explicit={album.explicit} 
                    title={album.name} 
                    popularity={album.popularity} 
                    url={coverUrl} 
                    type="album" 
                />
                <button 
                    onClick={toggleSave} 
                    className={`p-2.5 rounded-full backdrop-blur-md transition-all duration-300 shadow-md ${
                        saved 
                            ? "bg-[#2563EB] text-[#F4F7FF] scale-105" 
                            : "bg-white/[0.03] border border-[#2563EB]/15 text-[#F4F7FF] hover:bg-[#2563EB]/15"
                    }`}
                    title={saved ? "Remove Bookmark" : "Bookmark Album"}
                >
                    {saved ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
                </button>
            </div>

            {/* Album Card Details Container */}
            <div className="relative z-10 mt-14 sm:mt-6 w-full bg-transparent sm:bg-[#10141F]/60 sm:backdrop-blur-xl border-0 sm:border border-transparent sm:border-[#2563EB]/10 rounded-none sm:rounded-3xl p-2 sm:p-8 flex flex-col md:flex-row items-center gap-8 sm:gap-12 sm:shadow-2xl mb-12">
                {/* Album Cover Art */}
                <div className="relative flex-shrink-0 w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 rounded-2xl overflow-hidden shadow-2xl bg-[#10141F] ring-1 ring-[#2563EB]/15">
                    <img src={coverUrl} alt={album.name} className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />
                </div>

                {/* Meta details */}
                <div className="flex-1 min-w-0 text-center md:text-left flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-center md:justify-start gap-2 mb-2 text-xs font-bold text-[#60A5FA] uppercase tracking-widest">
                            <Disc size={14} />
                            <span>Album Release</span>
                        </div>
                        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold mb-3 leading-tight tracking-tight text-[#F4F7FF]">{album.name}</h1>
                        <p className="text-base sm:text-lg text-[#F4F7FF]/80 mb-2">
                            {album.artists.map((a, i) => (
                                <span
                                    key={a.id || i}
                                    className="cursor-pointer hover:text-[#F4F7FF] hover:underline transition"
                                    onClick={() => a.id && router.push(`/artist/${a.id}`)}
                                >
                                    {a.name}{i < album.artists.length - 1 && ', '}
                                </span>
                            ))} • <span className="text-[#8992A5] text-sm">{album.release_date}</span>
                        </p>
                        <p className="text-xs text-[#8992A5]/70 font-medium mb-6 uppercase tracking-wider">{album.total_tracks} tracks total</p>
                    </div>
                    
                    {/* GrooveLink & History Actions */}
                    <div className="border-t border-[#2563EB]/10 pt-6 w-full flex flex-col sm:flex-row items-center justify-center md:justify-start gap-3">
                        <Link 
                            href={`/s/spotify/album/${album.id}`}
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#2563EB]/20 bg-[#2563EB]/5 hover:bg-[#2563EB]/15 text-[#F4F7FF] text-xs font-bold uppercase tracking-wider transition-all duration-300"
                        >
                            <img src="/in.svg" alt="GrooveLink" className="w-4 h-4 object-contain" />
                            <span>Listen on GrooveLink</span>
                            <ChevronRight className="w-3 h-3 text-[#60A5FA]" />
                        </Link>
                        
                        <Link 
                            href={`https://history.grooveestrella.com/album/${album.id}`}
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

            {/* Tracks Section */}
            <div className="relative z-10 border-t border-[#2563EB]/10 pt-8 mb-12">
                <h2 className="text-xl sm:text-2xl font-extrabold mb-6 flex items-center gap-2">
                    <span>Tracks List</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/[0.03] text-[#8992A5] border border-[#2563EB]/10">{tracks.length}</span>
                </h2>
                <div className="flex flex-col gap-2.5">
                    {tracks.map((track, index) => (
                        <AlbumTrackCard
                            key={track.id || index}
                            title={track.name}
                            artist={track.artists}
                            spoURL={track.external_urls?.spotify}
                            YTURL={`https://www.youtube.com/results?search_query=${encodeURIComponent(track.name + ' ' + track.artists.map(a => a.name).join(' '))}`}
                            trackURI={album.uri}
                            pos={index}
                            trackID={track.id}
                            coverImage={album.images?.[0]?.url}
                        />
                    ))}
                </div>

                {/* Footer Copyright */}
                <div className="text-center mt-12 border-t border-[#2563EB]/10 pt-8 space-y-1">
                    {album.label && <h4 className="text-xs text-[#8992A5]">Label: {album.label}</h4>}
                    {album.copyrights?.map((c, idx) => (
                        <p key={idx} className="text-[10px] text-[#8992A5]/70 leading-relaxed">{c.text}</p>
                    ))}
                </div>
            </div>
        </div>
    );
}
