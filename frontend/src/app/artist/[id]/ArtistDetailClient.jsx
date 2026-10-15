// src/app/artist/[id]/ArtistDetailClient.jsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bookmark, BookmarkCheck, Users, Award, Music, ChevronRight } from "lucide-react";
import { TrackCard } from "@/Components/CardComponents/TracksCard";
import { AlbumCard } from "@/Components/CardComponents/AlbumsCard";
import { ShareArtistComponent } from "@/Components/ArtistShareComponent";
import MusicLoreAndReviews from "@/Components/MusicLoreAndReviews";
import RatingPieChart from "@/Components/RatingPieChart";
import GrooveLoader from "@/Components/GrooveLoader";
import { toast } from "react-toastify";

export default function ArtistDetailClient({ id, initialArtist, initialTopTracks, initialAlbums }) {
    const router = useRouter();
    const [artist, setArtist] = useState(initialArtist);
    const [topTracks, setTopTracks] = useState(initialTopTracks || []);
    const [albums, setAlbums] = useState(initialAlbums || []);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState(null);
    const [expandedHeroDesc, setExpandedHeroDesc] = useState(false);

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

    if (!artist) {
        return (
            <GrooveLoader fullScreen={true} text="Loading Artist..." />
        );
    }

    const coverUrl = artist.images?.[0]?.url || artist.coverArt || artist.url || 'https://placehold.co/600x600/10141F/60A5FA?text=Artist';
    const genres = artist.genres || [];

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
                <ShareArtistComponent 
                    artistId={artist.id} 
                    artistName={artist.name} 
                    followers={artist.followers?.total} 
                    popularity={artist.popularity} 
                    imageUrl={coverUrl} 
                    genres={genres}
                />
                <button 
                    onClick={toggleSave} 
                    className={`p-2.5 rounded-full backdrop-blur-md transition-all duration-300 shadow-md ${
                        saved 
                            ? "bg-[#2563EB] text-[#F4F7FF] scale-105" 
                            : "bg-[#10141F]/60 border border-[#2563EB]/15 text-[#F4F7FF] hover:bg-[#2563EB]/15"
                    }`}
                    title={saved ? "Remove Bookmark" : "Bookmark Artist"}
                >
                    {saved ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
                </button>
            </div>

            {/* Artist Info Glassmorphic Card Container */}
            <div className="relative z-10 mt-14 sm:mt-6 w-full bg-transparent sm:bg-[#10141F]/60 sm:backdrop-blur-xl border-0 sm:border border-transparent sm:border-[#2563EB]/10 rounded-none sm:rounded-3xl p-2 sm:p-8 flex flex-col md:flex-row items-center gap-8 sm:gap-12 sm:shadow-2xl mb-12">
                <div className="relative flex-shrink-0 w-44 h-44 sm:w-52 sm:h-52 md:w-60 md:h-60 rounded-full overflow-hidden border-4 border-[#2563EB]/20 shadow-2xl">
                    <img 
                        src={coverUrl} 
                        alt={artist.name} 
                        className="w-full h-full object-cover" 
                        onError={(e) => { e.currentTarget.src = 'https://placehold.co/400x400/10141F/60A5FA?text=Artist'; }}
                    />
                </div>

                <div className="flex-1 min-w-0 text-center md:text-left flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-center md:justify-start gap-2 mb-2 text-xs font-bold text-[#60A5FA] uppercase tracking-widest">
                            <Users size={14} />
                            <span>Artist Profile</span>
                        </div>
                        <h1 className="text-3xl sm:text-5xl font-extrabold mb-3 leading-tight tracking-tight text-white">{artist.name}</h1>
                        
                        {genres.length > 0 && (
                            <div className="flex flex-wrap justify-center md:justify-start gap-1.5 mb-4">
                                {genres.map((g, idx) => (
                                    <span key={idx} className="px-2.5 py-1 rounded-full bg-[#2563EB]/10 border border-[#2563EB]/20 text-[#60A5FA] text-[10px] font-bold uppercase tracking-wider">
                                        {g}
                                    </span>
                                ))}
                            </div>
                        )}

                        <div className="flex justify-center md:justify-start items-center gap-4 text-xs font-medium text-[#8992A5]/70 mb-4 uppercase tracking-wider flex-wrap">
                            <div className="flex items-center gap-1">
                                <Award size={14} />
                                <span>Country: {artist.country || 'Global'}</span>
                            </div>
                            <span>•</span>
                            <div className="flex items-center gap-1">
                                <Award size={14} />
                                <span>Score: {artist.popularity || 85}</span>
                            </div>
                        </div>

                        {/* Rating Pie Chart (1-5*2, Green: 8-10, Yellow: 5-8, Red: 1-5) */}
                        <div className="flex items-center justify-center md:justify-start mb-3">
                            <RatingPieChart rating={artist.rating} />
                        </div>
                    </div>
                    
                    {/* Minimized Description before GrooveLink button */}
                    {artist.description && (
                        <div className="my-3 text-left">
                            <p className={`text-xs sm:text-sm text-[#8992A5] leading-relaxed font-body ${!expandedHeroDesc ? "line-clamp-2" : ""}`}>
                                {artist.description}
                            </p>
                            {artist.description.length > 120 && (
                                <button
                                    onClick={() => setExpandedHeroDesc(!expandedHeroDesc)}
                                    className="mt-1 text-[11px] font-bold text-[#60A5FA] hover:text-[#F4F7FF] transition inline-flex items-center gap-1 cursor-pointer"
                                >
                                    <span>{expandedHeroDesc ? "Show less" : "Read full overview"}</span>
                                </button>
                            )}
                        </div>
                    )}

                    <div className="border-t border-[#2563EB]/10 pt-4 w-full flex flex-col sm:flex-row items-center justify-center md:justify-start gap-3">
                        <Link 
                            href={`/s/musicbrainz/artist/${artist.id || id}`}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#2563EB]/20 bg-[#2563EB]/10 hover:bg-[#2563EB]/20 text-[#F4F7FF] text-xs font-bold uppercase tracking-wider transition-all duration-300"
                        >
                            <img src="/in.svg" alt="GrooveLink" className="w-4 h-4 object-contain" />
                            <span>Open in GrooveLink</span>
                            <ChevronRight className="w-3 h-3 text-[#60A5FA]" />
                        </Link>
                    </div>
                </div>
            </div>

            {/* Top Tracks Grid */}
            {topTracks.length > 0 && (
                <div className="relative z-10 mt-16 border-t border-[#2563EB]/10 pt-8">
                    <h2 className="text-xl sm:text-2xl font-extrabold mb-6">Popular Tracks</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                        {topTracks.map((track, index) => {
                            const trackArtists = Array.isArray(track.artists) ? track.artists : Array.isArray(track.artist) ? track.artist : [{ name: artist.name, id: artist.id }];
                            return (
                                <TrackCard
                                    key={track.id || index}
                                    url={track.url || track.coverArt || track.album?.images?.[0]?.url}
                                    title={track.title || track.name}
                                    artist={trackArtists}
                                    spoURL={track.spoURL || track.external_urls?.spotify}
                                    popularity={track.popularity || 80}
                                    explicit={track.explicit || false}
                                    trackURI={track.trackURI || track.uri}
                                    albumID={track.albumID || track.album?.id}
                                    trackId={track.trackId || track.id}
                                    releaseDate={track.releaseDate || track.releaseYear}
                                    releaseYear={track.releaseYear}
                                    album={track.album?.name || track.album}
                                    genres={track.genres || genres}
                                />
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Discography Grid */}
            {albums.length > 0 && (
                <div className="relative z-10 mt-16 border-t border-[#2563EB]/10 pt-8 mb-12">
                    <h2 className="text-xl sm:text-2xl font-extrabold mb-6">Discography</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                        {albums.map((album, index) => {
                            const albumArtists = Array.isArray(album.artists) ? album.artists : Array.isArray(album.artist) ? album.artist : [{ name: artist.name, id: artist.id }];
                            return (
                                <AlbumCard
                                    key={album.id || index}
                                    url={album.url || album.image || album.images?.[0]?.url}
                                    title={album.title || album.name}
                                    artist={albumArtists}
                                    trackURI={album.trackURI || album.uri}
                                    id={album.id}
                                    releaseDate={album.releaseDate || album.releaseYear}
                                    releaseYear={album.releaseYear}
                                    genres={album.genres || genres}
                                />
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Reviews, Descriptions, Lore, All Tags & External Links */}
            <MusicLoreAndReviews
                id={artist.id || id}
                type="artist"
                title={artist.name}
                artist={artist.name}
                description={artist.description}
                tags={artist.tags || artist.genres || []}
                allTags={artist.allTags || []}
                rating={artist.rating}
                externalLinks={artist.externalLinks || []}
            />
        </div>
    );
}
