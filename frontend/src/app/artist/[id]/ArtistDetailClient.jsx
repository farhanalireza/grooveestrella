// src/app/artist/[id]/ArtistDetailClient.jsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bookmark, BookmarkCheck, Users, Award, Music, ChevronRight } from "lucide-react";
import { TrackCard } from "@/Components/CardComponents/TracksCard";
import { AlbumCard } from "@/Components/CardComponents/AlbumsCard";
import { ShareArtistComponent } from "@/Components/ArtistShareComponent";
import GrooveLinkModal from "@/Components/GrooveLinkModal";
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
            <GrooveLoader fullScreen={true} text="Loading Artist..." />
        );
    }

    const coverUrl = artist.images?.[0]?.url || artist.coverArt || artist.url || 'https://placehold.co/600x600/17020B/E8A87C?text=Artist';
    const genres = artist.genres || [];

    return (
        <div className="relative min-h-screen bg-[var(--theme-bg)] text-[var(--theme-fg)] p-4 pb-32 sm:p-6 md:pl-20 md:pr-20 lg:pl-40 lg:pr-40 pt-12 overflow-hidden transition-colors duration-300">
            {/* Full Screen Dynamic Ambient Artist Picture Gradient Backdrop */}
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
                    className={`p-2.5 rounded-full backdrop-blur-md transition-all duration-300 shadow-md cursor-pointer ${
                        saved 
                            ? "bg-[var(--theme-accent)] text-[var(--theme-accent-fg)] scale-105 shadow-md" 
                            : "bg-[var(--theme-card)]/90 border border-[var(--theme-border)] text-[var(--theme-fg)] hover:bg-[var(--theme-surface)] hover:border-[var(--theme-accent)]"
                    }`}
                    title={saved ? "Remove Bookmark" : "Bookmark Artist"}
                >
                    {saved ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
                </button>
            </div>

            {/* Artist Info Glassmorphic Card Container */}
            <div className="relative z-10 mt-14 sm:mt-6 w-full bg-transparent sm:bg-[var(--theme-card)]/80 sm:backdrop-blur-xl border-0 sm:border border-transparent sm:border-[var(--theme-border)] rounded-none sm:rounded-3xl p-2 sm:p-8 flex flex-col md:flex-row items-center gap-8 sm:gap-12 sm:shadow-2xl mb-12">
                <div className="relative flex-shrink-0 w-44 h-44 sm:w-52 sm:h-52 md:w-60 md:h-60 rounded-full overflow-hidden border-4 border-[var(--theme-border)] shadow-2xl bg-[var(--theme-surface)]">
                    <img 
                        src={coverUrl} 
                        alt={artist.name} 
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" 
                        onError={(e) => { e.currentTarget.src = 'https://placehold.co/400x400/17020B/E8A87C?text=Artist'; }}
                    />
                </div>

                <div className="flex-1 min-w-0 text-center md:text-left flex flex-col justify-between">
                    <div>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--theme-card)]/80 border border-[var(--theme-border)] text-xs font-bold text-[var(--theme-accent)] uppercase tracking-wider mb-2">
                            <Users size={13} />
                            <span>Artist Profile</span>
                        </div>
                        <h1 className="text-3xl sm:text-5xl font-extrabold mb-3 leading-tight tracking-tight text-[var(--theme-fg)]">{artist.name}</h1>
                        
                        {genres.length > 0 && (
                            <div className="flex flex-wrap justify-center md:justify-start gap-1.5 mb-4">
                                {genres.map((g, idx) => (
                                    <span key={idx} className="px-2.5 py-1 rounded-full bg-[var(--theme-card)] border border-[var(--theme-border)] text-[var(--theme-accent)] text-[10px] font-bold uppercase tracking-wider">
                                        {g}
                                    </span>
                                ))}
                            </div>
                        )}

                        <div className="flex justify-center md:justify-start items-center gap-4 text-xs font-medium text-[var(--theme-muted)] mb-4 uppercase tracking-wider flex-wrap">
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

                        {/* Rating Pie Chart */}
                        <div className="flex items-center justify-center md:justify-start mb-3">
                            <RatingPieChart rating={artist.rating} />
                        </div>
                    </div>
                    
                    {/* Minimized Description before GrooveLink button */}
                    {artist.description && (
                        <div className="my-3 text-left">
                            <p className={`text-xs sm:text-sm text-[var(--theme-muted)] leading-relaxed font-body ${!expandedHeroDesc ? "line-clamp-2" : ""}`}>
                                {artist.description}
                            </p>
                            {artist.description.length > 120 && (
                                <button
                                    onClick={() => setExpandedHeroDesc(!expandedHeroDesc)}
                                    className="mt-1 text-[11px] font-bold text-[var(--theme-accent)] hover:opacity-80 transition inline-flex items-center gap-1 cursor-pointer"
                                >
                                    <span>{expandedHeroDesc ? "Show less" : "Read full overview"}</span>
                                </button>
                            )}
                        </div>
                    )}

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

            {/* Top Tracks Grid */}
            {topTracks.length > 0 && (
                <div className="relative z-10 mt-16 border-t border-[var(--theme-border)] pt-8">
                    <h2 className="text-xl sm:text-2xl font-extrabold mb-6">Popular Tracks</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                        {topTracks.map((track, index) => {
                            const trackArtists = Array.isArray(track.artists) ? track.artists : Array.isArray(track.artist) ? track.artist : [{ name: artist.name, id: artist.id }];
                            return (
                                <TrackCard
                                    key={`${track.id || 'track'}-${index}`}
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
                <div className="relative z-10 mt-16 border-t border-[var(--theme-border)] pt-8 mb-12">
                    <h2 className="text-xl sm:text-2xl font-extrabold mb-6">Discography</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                        {albums.map((album, index) => {
                            const albumArtists = Array.isArray(album.artists) ? album.artists : Array.isArray(album.artist) ? album.artist : [{ name: artist.name, id: artist.id }];
                            return (
                                <AlbumCard
                                    key={`${album.id || 'album'}-${index}`}
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

            {/* GrooveLink Modal */}
            <GrooveLinkModal
                isOpen={isGrooveLinkOpen}
                onClose={() => setIsGrooveLinkOpen(false)}
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
        </div>
    );
}
