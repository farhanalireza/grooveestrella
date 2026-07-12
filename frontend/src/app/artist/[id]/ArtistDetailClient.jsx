// src/app/artist/[id]/ArtistDetailClient.jsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bookmark, BookmarkCheck, Loader, Users, Award, Music, ChevronRight } from "lucide-react";
import { SpotifyButton, YouTubeButton, AppleMusicButton, SoundCloudButton, TidalButton } from "@/Components/MusicButtons";
import { TrackCard } from "@/Components/CardComponents/TracksCard";
import { AlbumCard } from "@/Components/CardComponents/AlbumsCard";
import { ShareArtistComponent } from "@/Components/ArtistShareComponent";
import { toast } from "react-toastify";

export default function ArtistDetailClient({ id, initialArtist, initialTopTracks, initialAlbums }) {
    const router = useRouter();
    const [artist, setArtist] = useState(initialArtist);
    const [topTracks, setTopTracks] = useState(initialTopTracks || []);
    const [albums, setAlbums] = useState(initialAlbums || []);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!artist) return;
        const savedArtists = JSON.parse(localStorage.getItem("savedArtists")) || [];
        const isSaved = savedArtists.some(a => a.id === artist.id);
        setSaved(isSaved);
    }, [artist]);

    const toggleSave = () => {
        const savedArtists = JSON.parse(localStorage.getItem("savedArtists")) || [];

        if (saved) {
            const updated = savedArtists.filter((a) => a.id !== artist.id);
            localStorage.setItem("savedArtists", JSON.stringify(updated));
            setSaved(false);
            toast.info(`"${artist.name}" removed from library.`);
        } else if (artist) {
            const newArtist = {
                id: artist.id,
                title: artist.name,
                spoURL: artist.external_urls?.spotify,
                YTURL: "",
                image: artist.images?.[0]?.url,
                followers: artist.followers?.total,
                popularity: artist.popularity,
                uri: artist.uri,
            };
            savedArtists.push(newArtist);
            localStorage.setItem("savedArtists", JSON.stringify(savedArtists));
            setSaved(true);
            toast.success(`"${artist.name}" saved to library! 🎙️`);
        }
    };

    // Client-side fallback fetch
    useEffect(() => {
        if (artist) return;

        async function fetchArtistData() {
            try {
                setError(null);
                const response = await fetch(`/api/token`);
                const tokenData = await response.json();
                if (!tokenData.access_token) throw new Error("Failed to retrieve token");

                const [artistRes, topTracksRes, albumsRes] = await Promise.all([
                    fetch(`https://api.spotify.com/v1/artists/${id}`, {
                        headers: { Authorization: `Bearer ${tokenData.access_token}` },
                    }),
                    fetch(`https://api.spotify.com/v1/artists/${id}/top-tracks?market=US`, {
                        headers: { Authorization: `Bearer ${tokenData.access_token}` },
                    }),
                    fetch(`https://api.spotify.com/v1/artists/${id}/albums?include_groups=album,single&market=US`, {
                        headers: { Authorization: `Bearer ${tokenData.access_token}` },
                    }),
                ]);

                if (!artistRes.ok || !topTracksRes.ok || !albumsRes.ok) throw new Error("Failed to fetch artist details");

                const artistData = await artistRes.json();
                const topTracksData = await topTracksRes.json();
                const albumsData = await albumsRes.json();

                setArtist(artistData);
                setTopTracks(topTracksData.tracks);

                // De-duplicate albums by name
                const uniqueAlbums = [];
                const seen = new Set();
                for (const album of albumsData.items) {
                    if (!seen.has(album.name)) {
                        uniqueAlbums.push(album);
                        seen.add(album.name);
                    }
                }
                setAlbums(uniqueAlbums.slice(0, 12));
            } catch (err) {
                console.error("Error fetching artist data:", err);
                setError(err);
            }
        }
        fetchArtistData();
    }, [id, artist]);

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

    if (!artist) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-[#07090F] text-[#F4F7FF]">
                <Loader className="animate-spin w-8 h-8 mb-4 text-[#60A5FA]" />
                <span className="text-lg font-medium">Loading Artist Data...</span>
            </div>
        );
    }

    const coverUrl = artist.images?.[0]?.url || 'https://placehold.co/600x600?text=No+Cover';

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

            {/* Action Controls */}
            <div className="absolute top-8 right-6 lg:right-16 z-20 flex items-center gap-2.5">
                <ShareArtistComponent
                    artistId={artist.id}
                    name={artist.name}
                    imageUrl={coverUrl}
                    followers={artist.followers?.total}
                    popularity={artist.popularity}
                    genres={artist.genres}
                />
                <button 
                    onClick={toggleSave} 
                    className={`p-2.5 rounded-full backdrop-blur-md transition-all duration-300 shadow-md ${
                        saved 
                            ? "bg-[#2563EB] text-[#F4F7FF] scale-105" 
                            : "bg-white/[0.03] border border-[#2563EB]/15 text-[#F4F7FF] hover:bg-[#2563EB]/15"
                    }`}
                    title={saved ? "Remove Bookmark" : "Bookmark Artist"}
                >
                    {saved ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
                </button>
            </div>

            {/* Artist Card Header Layout */}
            <div className="relative z-10 mt-14 sm:mt-6 w-full bg-transparent sm:bg-[#10141F]/60 sm:backdrop-blur-xl border-0 sm:border border-transparent sm:border-[#2563EB]/10 rounded-none sm:rounded-3xl p-2 sm:p-8 flex flex-col md:flex-row items-center gap-8 sm:gap-12 sm:shadow-2xl mb-12 animate-fade-in">
                {/* Circular Profile Avatar */}
                <div className="relative flex-shrink-0 w-44 h-44 sm:w-52 sm:h-52 md:w-60 md:h-60 rounded-full overflow-hidden shadow-2xl bg-[#10141F] ring-4 ring-[#2563EB]/20">
                    <img
                        src={coverUrl}
                        alt={artist.name}
                        className="w-full h-full object-cover"
                    />
                </div>

                {/* Details Meta */}
                <div className="space-y-4 text-center md:text-left flex-1">
                    <div className="flex items-center justify-center md:justify-start gap-2 text-xs font-bold text-[#60A5FA] uppercase tracking-widest">
                        <Music size={14} />
                        <span>Verified Artist</span>
                    </div>
                    <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-none text-[#F4F7FF]">{artist.name}</h1>
                    
                    <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-[#F4F7FF]/80 font-medium">
                        <div className="flex items-center gap-1.5">
                            <Users size={16} className="text-[#8992A5]/70" />
                            <span>{artist.followers?.total?.toLocaleString() || "0"} Followers</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Award size={16} className="text-[#8992A5]/70" />
                            <span className="text-yellow-400">Popularity: {artist.popularity}</span>
                        </div>
                    </div>

                    {/* Genre tags */}
                    <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                        {artist.genres?.map((genre, i) => (
                            <span key={i} className="bg-[#2563EB]/10 border border-[#2563EB]/20 px-3.5 py-1 rounded-full text-xs font-medium text-[#60A5FA] lowercase tracking-wide">
                                # {genre}
                            </span>
                        ))}
                    </div>

                    {/* GrooveLink & History Actions */}
                    <div className="border-t border-[#2563EB]/10 pt-6 w-full flex flex-col sm:flex-row items-center justify-center md:justify-start gap-3">
                        <Link 
                            href={`/s/spotify/artist/${artist.id}`}
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#2563EB]/20 bg-[#2563EB]/5 hover:bg-[#2563EB]/15 text-[#F4F7FF] text-xs font-bold uppercase tracking-wider transition-all duration-300"
                        >
                            <img src="/in.svg" alt="GrooveLink" className="w-4 h-4 object-contain" />
                            <span>Listen on GrooveLink</span>
                            <ChevronRight className="w-3 h-3 text-[#60A5FA]" />
                        </Link>
                        
                        <Link 
                            href={`https://history.grooveestrella.com/artist/${artist.id}`}
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

            {/* Top Tracks Grid */}
            <div className="relative z-10 mt-16 border-t border-[#2563EB]/10 pt-8">
                <h2 className="text-xl sm:text-2xl font-extrabold mb-6">Popular Tracks</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                    {topTracks.map((track, index) => (
                        <TrackCard
                            key={track.id || index}
                            url={track.album?.images?.[0]?.url}
                            title={track.name}
                            artist={track.artists.map((art) => ({
                                name: art.name,
                                id: art.id
                            }))}
                            spoURL={track.external_urls?.spotify}
                            popularity={track.popularity}
                            explicit={track.explicit}
                            trackURI={track.uri}
                            albumID={track.album?.id}
                            trackId={track.id}
                        />
                    ))}
                </div>
            </div>

            {/* Discography Grid */}
            <div className="relative z-10 mt-16 border-t border-[#2563EB]/10 pt-8 mb-12">
                <h2 className="text-xl sm:text-2xl font-extrabold mb-6">Discography</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                    {albums.map((album, index) => (
                        <AlbumCard
                            key={album.id || index}
                            url={album.images?.[0]?.url}
                            title={album.name}
                            artist={album.artists.map((art) => ({
                                name: art.name,
                                id: art.id
                            }))}
                            trackURI={album.uri}
                            id={album.id}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
