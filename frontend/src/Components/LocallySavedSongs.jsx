// LocallySavedSongs.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { TrackCard } from './CardComponents/TracksCard';
import { AlbumCard } from './CardComponents/AlbumsCard';
import { PlaylistCard } from './CardComponents/PlaylistsCard';
import { ArtistCard } from './CardComponents/ArtistsCard';
import { Music, Album, ListMusic, Users, Search, Filter, AlertCircle, RefreshCw } from 'lucide-react';
import GrooveLoader from './GrooveLoader';

const LocallySavedSongs = ({ initialSection = "songs" }) => {
    const [section, setSection] = useState(initialSection);
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState("recent");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Data states
    const [songs, setSongs] = useState([]);
    const [albums, setAlbums] = useState([]);
    const [playlists, setPlaylists] = useState([]);
    const [artists, setArtists] = useState([]);

    // Section configuration
    const sections = [
        {
            key: "songs",
            label: "Songs",
            icon: Music,
            count: songs.length,
            data: songs
        },
        {
            key: "albums",
            label: "Albums",
            icon: Album,
            count: albums.length,
            data: albums
        },
        {
            key: "playlists",
            label: "Playlists",
            icon: ListMusic,
            count: playlists.length,
            data: playlists
        },
        {
            key: "artists",
            label: "Artists",
            icon: Users,
            count: artists.length,
            data: artists
        }
    ];

    // Load data from localStorage
    const loadLocalData = () => {
        setLoading(true);
        setError(null);

        try {
            const savedSongs = JSON.parse(localStorage.getItem("savedSongs")) || [];
            const savedAlbums = JSON.parse(localStorage.getItem("savedAlbums")) || [];
            const savedPlaylists = JSON.parse(localStorage.getItem("savedPlaylists")) || [];
            const savedArtists = JSON.parse(localStorage.getItem("savedArtists")) || [];

            // Validate and set data
            setSongs(Array.isArray(savedSongs) ? savedSongs : []);
            setAlbums(Array.isArray(savedAlbums) ? savedAlbums : []);
            setPlaylists(Array.isArray(savedPlaylists) ? savedPlaylists : []);
            setArtists(Array.isArray(savedArtists) ? savedArtists : []);

        } catch (err) {
            console.error("[ERROR] Failed to load local storage data:", err);
            setError("Failed to load saved data. Please try refreshing.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadLocalData();
    }, []);

    // Get current section data with search and sort
    const currentSectionData = useMemo(() => {
        const currentSection = sections.find(s => s.key === section);
        if (!currentSection) return [];

        let data = [...currentSection.data];

        // Apply search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            data = data.filter(item => {
                const title = (item.title || item.name || '').toLowerCase();
                const artist = Array.isArray(item.artist)
                    ? item.artist.join(' ').toLowerCase()
                    : (item.artist || '').toLowerCase();
                const owner = (item.owner || '').toLowerCase();

                return title.includes(query) || artist.includes(query) || owner.includes(query);
            });
        }

        // Apply sorting
        switch (sortBy) {
            case "alphabetical":
                data.sort((a, b) => (a.title || a.name || '').localeCompare(b.title || b.name || ''));
                break;
            case "recent":
                // Assuming items have a dateAdded property, or use array index as fallback
                data.reverse();
                break;
            case "popularity":
                data.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
                break;
            default:
                break;
        }

        return data;
    }, [section, sections, searchQuery, sortBy]);

    // Handle section change
    const handleSectionChange = (newSection) => {
        setSection(newSection);
        setSearchQuery("");
    };

    // Render section tabs
    const renderSectionTabs = () => (
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {sections.map(({ key, label, icon: Icon, count }) => (
                <button
                    key={key}
                    onClick={() => handleSectionChange(key)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm whitespace-nowrap transition-all duration-200 ${section === key
                            ? 'bg-green-500 text-black shadow-lg'
                            : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 hover:text-white'
                        }`}
                >
                    <Icon className="w-4 h-4" />
                    {label}
                    {count > 0 && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${section === key
                                ? 'bg-black/20 text-black'
                                : 'bg-gray-600 text-gray-300'
                            }`}>
                            {count}
                        </span>
                    )}
                </button>
            ))}
        </div>
    );

    // Render search and filter controls
    const renderControls = () => {
        const currentSection = sections.find(s => s.key === section);
        const hasData = currentSection && currentSection.count > 0;

        if (!hasData) return null;

        return (
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                {/* Search */}
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder={`Search ${section}...`}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-800/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-transparent"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery("")}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                        >
                            ×
                        </button>
                    )}
                </div>

                {/* Sort */}
                <div className="relative">
                    <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="pl-10 pr-8 py-2.5 bg-gray-800/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-transparent appearance-none cursor-pointer"
                    >
                        <option value="recent">Recently Added</option>
                        <option value="alphabetical">A-Z</option>
                        <option value="popularity">Popularity</option>
                    </select>
                </div>
            </div>
        );
    };

    // Render content based on section
    const renderContent = () => {
        const data = currentSectionData;

        if (loading) {
            return (
                <div className="flex items-center justify-center py-20">
                    <GrooveLoader size={36} text="Loading saved content..." />
                </div>
            );
        }

        if (error) {
            return (
                <div className="flex items-center justify-center py-16">
                    <div className="text-center">
                        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                        <p className="text-red-300 mb-4">{error}</p>
                        <button
                            onClick={loadLocalData}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors mx-auto"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Retry
                        </button>
                    </div>
                </div>
            );
        }

        if (data.length === 0) {
            const currentSection = sections.find(s => s.key === section);
            const hasOriginalData = currentSection && currentSection.count > 0;

            return (
                <div className="text-center py-16">
                    <div className="text-gray-400 text-lg mb-2">
                        {hasOriginalData && searchQuery ? 'No matching results' : `No saved ${section}`}
                    </div>
                    <p className="text-gray-500 text-sm">
                        {hasOriginalData && searchQuery
                            ? 'Try adjusting your search terms'
                            : `Start saving ${section} to see them here`
                        }
                    </p>
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery("")}
                            className="mt-4 text-green-400 hover:text-green-300 text-sm underline"
                        >
                            Clear search
                        </button>
                    )}
                </div>
            );
        }

        // Render items based on section
        switch (section) {
            case "songs":
                return data.map((track, index) => (
                    <TrackCard
                        key={`${track.trackURI || track.id || index}`}
                        url={track.image}
                        title={track.title}
                        artist={Array.isArray(track.artist) ? track.artist : [track.artist].filter(Boolean)}
                        spoURL={track.spoURL}
                        YTURL={track.YTURL || ""}
                        popularity={track.popularity}
                        explicit={track.explicit}
                        trackURI={track.trackURI}
                        albumID={track.albumID}
                        trackId={track.trackId}
                    />
                ));

            case "albums":
                return data.map((album, index) => (
                    <AlbumCard
                        key={`${album.id || index}`}
                        id={album.id}
                        url={album.image}
                        title={album.title}
                        artist={Array.isArray(album.artist) ? album.artist : [album.artist].filter(Boolean)}
                        spoURL={album.spoURL}
                        YTURL={album.YTURL}
                        released_date={album.released_date}
                        releaseDate={album.release_date || album.released_date || album.releaseDate}
                        releaseYear={album.releaseYear}
                        description={album.description}
                        trackURI={album.trackURI}
                    />
                ));

            case "playlists":
                return data.map((playlist, index) => (
                    <PlaylistCard
                        key={`${playlist.id || index}`}
                        url={playlist.image}
                        title={playlist.title}
                        spoURL={playlist.spoURL}
                        YTURL={playlist.YTURL}
                        owner={playlist.owner}
                        description={playlist.description}
                        isPublic={playlist.public}
                        trackURI={playlist.trackURI}
                        id={playlist.id}
                    />
                ));

            case "artists":
                return data.map((artist, index) => (
                    <ArtistCard
                        key={`${artist.id || index}`}
                        followers={artist.followers}
                        url={artist.image}
                        artist={artist.title}
                        YTURL={artist.YTURL}
                        spoURL={artist.spoURL}
                        id={artist.id}
                        URI={artist.trackURI}
                        popularity={artist.popularity}
                    />
                ));

            default:
                return (
                    <div className="text-center py-8">
                        <p className="text-gray-400">Invalid section selected</p>
                    </div>
                );
        }
    };

    // Get total count for header
    const totalCount = sections.reduce((sum, section) => sum + section.count, 0);

    return (
        <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm p-6 rounded-2xl border border-gray-700/50 shadow-xl">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                <div>
                    <h3 className="text-2xl font-bold text-white mb-1">Locally Saved Content</h3>
                    <p className="text-gray-400 text-sm">
                        {totalCount > 0 ? `${totalCount} items saved offline` : 'No items saved yet'}
                    </p>
                </div>

                {totalCount > 0 && (
                    <button
                        onClick={loadLocalData}
                        className="flex items-center gap-2 px-3 py-2 bg-gray-700/50 hover:bg-gray-600/50 rounded-lg transition-colors text-sm text-gray-300 hover:text-white mt-4 sm:mt-0"
                        title="Refresh saved content"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                    </button>
                )}
            </div>

            {/* Section Tabs */}
            {renderSectionTabs()}

            {/* Search and Filter Controls */}
            {renderControls()}

            {/* Results Count */}
            {!loading && !error && searchQuery && (
                <div className="mb-4 text-sm text-gray-400">
                    {currentSectionData.length} of {sections.find(s => s.key === section)?.count || 0} {section} found
                </div>
            )}

            {/* Content Grid */}
            {/* <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"> */}
            <div className='flex justify-center items-center flex-wrap gap-2'>

                {renderContent()}
            </div>
        </div>
    );
};

export default LocallySavedSongs;