// src/Components/Search.jsx
"use client";

import React, { useState, useEffect } from "react";
import { Search, X, Music, Users, Disc, ListMusic } from "lucide-react";
import { motion } from "framer-motion";

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
        <div className="w-full max-w-3xl mx-auto space-y-4">
            {/* Liquid Glass Search Input Bar */}
            <div className="relative flex items-center bg-[var(--theme-card)]/85 backdrop-blur-2xl border border-[var(--theme-border)] focus-within:border-[var(--theme-accent)] focus-within:ring-2 focus-within:ring-[var(--theme-accent)]/30 rounded-4xl p-3 sm:p-4 shadow-xl transition-all duration-300 overflow-hidden">
                {/* Liquid Glass Top Ambient Reflection */}
                <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[var(--theme-accent)]/20 to-transparent pointer-events-none" />

                <Search size={20} className="text-[var(--theme-muted)] ml-2 flex-shrink-0" />
                <input
                    className="flex-1 min-w-0 bg-transparent px-3 text-[var(--theme-fg)] text-sm sm:text-base outline-none placeholder-[var(--theme-muted)] font-medium"
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
                        className="p-1.5 rounded-full hover:bg-[var(--theme-surface)] text-[var(--theme-muted)] hover:text-[var(--theme-fg)] transition cursor-pointer mr-1"
                    >
                        <X size={16} />
                    </button>
                )}
            </div>

            {/* Interactive Category Selector with Liquid Pill */}
            <div className="flex justify-center">
                <div className="p-1.5 rounded-4xl bg-[var(--theme-card)]/80 backdrop-blur-xl border border-[var(--theme-border)] shadow-lg inline-flex gap-1 overflow-x-auto max-w-full scrollbar-none">
                    {categories.map((cat) => {
                        const Icon = cat.icon;
                        const isActive = searchType === cat.id;
                        return (
                            <motion.button
                                key={cat.id}
                                whileTap={{ scale: 0.94 }}
                                onClick={() => handleTypeChange(cat.id)}
                                className="relative px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-4xl font-bold text-xs sm:text-sm whitespace-nowrap transition-colors duration-200 cursor-pointer flex items-center gap-1.5 select-none"
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="searchCategoryActivePill"
                                        transition={{ type: "spring", stiffness: 450, damping: 32 }}
                                        className="absolute inset-0 rounded-4xl bg-[var(--theme-accent-bg)] border border-[var(--theme-border-active)] shadow-sm -z-0"
                                    />
                                )}
                                <Icon size={14} className={`relative z-10 transition-colors ${isActive ? "text-[var(--theme-accent-fg)]" : "text-[var(--theme-muted)]"}`} />
                                <span className={`relative z-10 transition-colors ${isActive ? "text-[var(--theme-accent-fg)] font-extrabold" : "text-[var(--theme-muted)] hover:text-[var(--theme-fg)]"}`}>
                                    {cat.label}
                                </span>
                            </motion.button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default SearchComp;
