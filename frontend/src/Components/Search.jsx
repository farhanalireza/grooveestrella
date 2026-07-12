// src/Components/Search.jsx
import React, { useState, useEffect } from "react";
import { Search, X, Music, Users, Disc, ListMusic } from "lucide-react";

const SearchComp = ({ initialQuery = "", handleChange }) => {
    const [searchQuery, setSearchQuery] = useState(initialQuery);
    const [searchType, setSearchType] = useState("track");

    useEffect(() => {
        setSearchQuery(initialQuery);
    }, [initialQuery]);

    const handleSearch = (query, type) => {
        setSearchQuery(query);
        handleChange(query, type);
    };

    const handleTypeChange = (type) => {
        setSearchType(type);
        handleChange(searchQuery, type);
    };

    const clearSearch = () => {
        setSearchQuery("");
        handleChange("", searchType);
    };

    const categories = [
        { id: "track", label: "Songs", icon: Music },
        { id: "artist", label: "Artists", icon: Users },
        { id: "album", label: "Albums", icon: Disc },
        { id: "playlist", label: "Playlists", icon: ListMusic },
    ];

    return (
        <div className="w-full max-w-4xl mx-auto space-y-6">
            {/* Search Input Bar */}
            <div className="relative flex items-center bg-[#10141F]/60 backdrop-blur-xl border border-[#2563EB]/10 focus-within:border-[#60A5FA]/30 rounded-3xl p-4 shadow-2xl transition duration-300">
                <Search size={22} className="text-[#8992A5]/60 ml-2 flex-shrink-0" />
                <input
                    className="flex-1 bg-transparent px-4 text-[#F4F7FF] text-base md:text-lg outline-none placeholder-[#8992A5]/50"
                    type="text"
                    placeholder="Search songs, artists, albums, or playlists..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value, searchType)}
                    id="searchBar"
                    autoComplete="off"
                />
                {searchQuery.trim().length > 0 && (
                    <button 
                        onClick={clearSearch}
                        className="p-1 rounded-full hover:bg-[#2563EB]/15 text-[#8992A5] hover:text-[#F4F7FF] transition"
                    >
                        <X size={18} />
                    </button>
                )}
            </div>

            {/* Interactive Category Selector Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-1 md:justify-center">
                {categories.map((cat) => {
                    const Icon = cat.icon;
                    const isActive = searchType === cat.id;
                    return (
                        <button
                            key={cat.id}
                            onClick={() => handleTypeChange(cat.id)}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-xs md:text-sm whitespace-nowrap transition duration-300 ${
                                isActive
                                    ? "bg-[#2563EB] text-[#F4F7FF] shadow-lg shadow-[#2563EB]/20"
                                    : "bg-white/[0.03] text-[#8992A5] hover:bg-[#2563EB]/10 hover:text-[#F4F7FF]"
                            }`}
                        >
                            <Icon size={cat.id === "track" ? 14 : cat.id === "artist" ? 15 : 15} />
                            <span>{cat.label}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default SearchComp;
