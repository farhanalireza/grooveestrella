// src/app/search/page.jsx
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import SearchComp from '@/Components/Search';
import useDebouncedSearch from '@/hooks/useDebouncedSearch';
import { ArtistCard } from '@/Components/CardComponents/ArtistsCard';
import { TrackCard } from '@/Components/CardComponents/TracksCard';
import { AlbumCard } from '@/Components/CardComponents/AlbumsCard';
import { PlaylistCard } from '@/Components/CardComponents/PlaylistsCard';
import GrooveLoader from '@/Components/GrooveLoader';

export default function SearchPage() {
    const router = useRouter();
    const [searchResults, setSearchResults] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(false);
    const [searchType, setSearchType] = useState("track");

    const debouncedSearch = useDebouncedSearch(searchTerm, searchType, setLoading, setSearchResults);
    
    useEffect(() => {
        if (typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            const query = params.get("q") || "";
            const type = params.get("type") || "track";
            if (query) {
                if (query.startsWith("http://") || query.startsWith("https://")) {
                    setLoading(true);
                    axios.post("/api/convert", { url: query })
                        .then((res) => {
                            if (res.data?.success && res.data?.redirectUrl) {
                                router.replace(res.data.redirectUrl);
                            }
                        })
                        .catch(() => {
                            setSearchTerm(query);
                            setSearchType(type);
                            debouncedSearch(query, type);
                        });
                    return;
                }
                setSearchTerm(query);
                setSearchType(type);
            }
        }
    }, [router]);

    function handleSearchChange(query, type) {
        setSearchTerm(query);
        setSearchType(type);
        if (query.trim() === "") {
            setSearchResults([]);
            return;
        }
        if (query.trim().startsWith("http://") || query.trim().startsWith("https://")) {
            setLoading(true);
            axios.post("/api/convert", { url: query.trim() })
                .then((res) => {
                    if (res.data?.success && res.data?.redirectUrl) {
                        router.push(res.data.redirectUrl);
                    }
                })
                .catch(() => {
                    debouncedSearch(query, type);
                });
            return;
        }
        debouncedSearch(query, type);
    }

    const POPULAR_SEARCHES = [
        { label: "David Bowie", type: "artist" },
        { label: "Pink Floyd", type: "artist" },
        { label: "The Beatles", type: "artist" },
        { label: "Queen", type: "artist" },
        { label: "Daft Punk", type: "artist" },
        { label: "Radiohead", type: "artist" },
        { label: "Led Zeppelin", type: "artist" },
        { label: "Michael Jackson", type: "artist" },
    ];

    const GENRE_TAGS = ["Classic Rock", "Synthpop", "Jazz", "Electronic", "Indie Rock", "Post-Punk", "Ambient"];

    return (
        <div className="min-h-screen bg-[var(--theme-bg)] text-[var(--theme-fg)] p-6 pb-36 md:pl-10 md:pr-10 lg:pl-32 lg:pr-32 pt-12 transition-colors duration-300">
            {/* Header / Search Controls */}
            <div className="mb-6">
                <SearchComp initialQuery={searchTerm} handleChange={handleSearchChange} />
            </div>

            {/* Prompt helper */}
            <p className="text-[var(--theme-muted)] text-xs md:text-sm font-semibold text-center mb-6 tracking-wide uppercase">
                {searchTerm
                    ? `Displaying results for: "${searchTerm}"`
                    : "Discover tracks, artists, albums, or playlists"}
            </p>

            {/* If no search term entered, show engaging popular search chips */}
            {!searchTerm && (
                <div className="max-w-2xl mx-auto mb-10 flex flex-col items-center text-center space-y-4">
                    <span className="text-[11px] font-bold tracking-widest uppercase text-[var(--theme-muted)]">
                        Popular Searches
                    </span>
                    <div className="flex flex-wrap justify-center gap-2">
                        {POPULAR_SEARCHES.map((item) => (
                            <button
                                key={item.label}
                                onClick={() => handleSearchChange(item.label, item.type)}
                                className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[var(--theme-card)] border border-[var(--theme-border)] text-[var(--theme-fg)] hover:border-[var(--theme-accent)] hover:text-[var(--theme-accent)] transition shadow-sm cursor-pointer"
                            >
                                🔥 {item.label}
                            </button>
                        ))}
                    </div>

                    <span className="text-[11px] font-bold tracking-widest uppercase text-[var(--theme-muted)] pt-2">
                        Browse by Musical Style
                    </span>
                    <div className="flex flex-wrap justify-center gap-1.5">
                        {GENRE_TAGS.map((genre) => (
                            <button
                                key={genre}
                                onClick={() => handleSearchChange(genre, "album")}
                                className="px-3 py-1 rounded-full text-[11px] font-medium bg-[var(--theme-surface)] border border-[var(--theme-border)] text-[var(--theme-muted)] hover:text-[var(--theme-fg)] hover:border-[var(--theme-accent)] transition cursor-pointer"
                            >
                                #{genre}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Results Grid */}
            <div className="flex justify-center p-2 sm:p-4">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <GrooveLoader size={44} text="Searching catalog..." />
                    </div>
                ) : searchResults.length === 0 && searchTerm ? (
                    <div className="text-center py-20">
                        <span className="text-[var(--theme-muted)] text-sm font-medium">No results found for "{searchTerm}". Try another search.</span>
                    </div>
                ) : (
                    <div className={
                        searchType === "album" || searchType === "playlist"
                            ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-6 justify-items-center w-full max-w-7xl"
                            : "flex flex-col gap-2.5 w-full max-w-2xl md:max-w-7xl md:grid md:grid-cols-3 lg:grid-cols-4 md:gap-6"
                    }>
                        {searchResults.map((track, index) => {
                            const artistsList = track.artists?.map((art) => ({ name: art.name, id: art.id })) || [];
                            const artistsQuery = track.artists?.map(a => a.name).join(' ') || '';
                            return (
                                <React.Fragment key={`${track.id}-${index}`}>
                                    {track.type === "artist" && (
                                        <ArtistCard
                                            url={track.url}
                                            artist={track.title || track.name}
                                            title={track.title}
                                            id={track.id}
                                        />
                                    )}

                                    {track.type === "album" && (
                                        <AlbumCard
                                            id={track.id}
                                            url={track.url}
                                            title={track.title}
                                            artist={artistsList}
                                            trackURI={track.trackURI}
                                            releaseDate={track.releaseDate || track.release_date}
                                            releaseYear={track.releaseYear}
                                        />
                                    )}

                                    {track.type === "track" && (
                                        <TrackCard
                                            url={track.url}
                                            title={track.title}
                                            artist={artistsList}
                                            album={track.album || track.albumTitle || ''}
                                            albumID={track.albumID}
                                            trackId={track.trackId || track.id}
                                        />
                                    )}

                                    {track.type === "playlist" && (
                                        <PlaylistCard
                                            owner={track.owner}
                                            isPublic={track.public}
                                            spoURL={track.spoURL}
                                            url={track.url}
                                            title={track.title}
                                            trackURI={track.trackURI}
                                            id={track.id}
                                        />
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
