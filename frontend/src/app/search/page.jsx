// src/app/search/page.jsx
"use client";

import React, { useState, useEffect } from 'react';
import SearchComp from '@/Components/Search';
import useDebouncedSearch from '@/hooks/useDebouncedSearch';
import { ArtistCard } from '@/Components/CardComponents/ArtistsCard';
import { TrackCard } from '@/Components/CardComponents/TracksCard';
import { AlbumCard } from '@/Components/CardComponents/AlbumsCard';
import { PlaylistCard } from '@/Components/CardComponents/PlaylistsCard';
import { Loader } from 'lucide-react';

export default function SearchPage() {
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
                setSearchTerm(query);
                setSearchType(type);
            }
        }
    }, []);

    function handleSearchChange(query, type) {
        setSearchTerm(query);
        setSearchType(type);
        if (query.trim() === "") {
            setSearchResults([]);
            return;
        }
        debouncedSearch(query, type);
    }

    return (
        <div className="min-h-screen bg-[#07090F] text-[#F4F7FF] p-6 pb-24 md:pl-10 md:pr-10 lg:pl-32 lg:pr-32 pt-12">
            {/* Header / Search Controls */}
            <div className="mb-8">
                <SearchComp initialQuery={searchTerm} handleChange={handleSearchChange} />
            </div>

            {/* Prompt helper */}
            <p className="text-[#8992A5]/60 text-xs md:text-sm font-semibold text-center mb-10 tracking-wide uppercase">
                {searchTerm
                    ? `Displaying results for: "${searchTerm}"`
                    : "Discover tracks, artists, albums, or playlists..."}
            </p>

            {/* Results Grid */}
            <div className="flex justify-center p-4">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader className="animate-spin w-8 h-8 text-[#60A5FA] mb-3" />
                        <span className="text-[#8992A5] text-sm font-semibold">Searching catalog...</span>
                    </div>
                ) : searchResults.length === 0 && searchTerm ? (
                    <div className="text-center py-20">
                        <span className="text-[#8992A5]/60 text-sm font-medium">No results found for your search query.</span>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 justify-items-center w-full max-w-7xl">
                        {searchResults.map((track, index) => {
                            const artistsList = track.artists?.map((art) => ({ name: art.name, id: art.id })) || [];
                            const artistsQuery = track.artists?.map(a => a.name).join(' ') || '';
                            return (
                                <React.Fragment key={`${track.id}-${index}`}>
                                    {track.type === "artist" && (
                                        <ArtistCard
                                            followers={track.followers}
                                            url={track.url}
                                            artist={track.title}
                                            YTURL={track.YTURL}
                                            spoURL={track.spoURL}
                                            id={track.id}
                                            URI={track.trackURI}
                                            popularity={track.popularity}
                                        />
                                    )}

                                    {track.type === "album" && (
                                        <AlbumCard
                                            id={track.id}
                                            url={track.url}
                                            title={track.title}
                                            artist={artistsList}
                                            trackURI={track.trackURI}
                                        />
                                    )}

                                    {track.type === "track" && (
                                        <TrackCard
                                            followers={track.followers}
                                            url={track.url}
                                            title={track.title}
                                            artist={artistsList}
                                            spoURL={track.spoURL}
                                            YTURL={`https://www.youtube.com/results?search_query=${encodeURIComponent(track.title + ' ' + artistsQuery)}`}
                                            popularity={track.popularity}
                                            explicit={track.explicit}
                                            trackURI={track.trackURI}
                                            albumID={track.albumID}
                                            trackId={track.trackId}
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
