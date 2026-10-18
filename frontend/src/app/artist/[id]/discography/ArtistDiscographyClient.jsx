// src/app/artist/[id]/discography/ArtistDiscographyClient.jsx
"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Disc, Search, Filter, Calendar, ChevronRight } from "lucide-react";
import GrooveLoader from "@/Components/GrooveLoader";

export default function ArtistDiscographyClient({ id, artist: initialArtist, allReleases: initialReleases }) {
    const router = useRouter();
    const [artist, setArtist] = useState(initialArtist);
    const [releases, setReleases] = useState(initialReleases || []);
    const [activeTab, setActiveTab] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [sortOrder, setSortOrder] = useState("desc"); // "desc" (newest) or "asc" (oldest)
    const [loading, setLoading] = useState(!initialArtist);

    // Fallback client fetch if needed
    useEffect(() => {
        if (artist && releases.length > 0) return;
        async function fetchDiscography() {
            try {
                setLoading(true);
                const res = await fetch(`/api/artist/${encodeURIComponent(id)}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data) {
                        setArtist(data);
                        setReleases(data.allReleases || data.discography || data.albums || []);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch artist discography:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchDiscography();
    }, [id, artist, releases.length]);

    const coverUrl = artist?.images?.[0]?.url || artist?.coverArt || artist?.url || 'https://placehold.co/600x600/17020B/E8A87C?text=Artist';

    // Categorize releases
    const categorized = useMemo(() => {
        const studio = [];
        const singlesEps = [];
        const compilations = [];
        const live = [];

        releases.forEach((rel) => {
            const cat = rel.typeCategory || 'album';
            const pType = (rel.primaryType || '').toLowerCase();
            const sTypes = rel.secondaryTypes || [];
            const isComp = sTypes.some(s => (s || '').toLowerCase().includes('compilation')) || (rel.title || '').toLowerCase().includes('compilation');
            const isLive = sTypes.some(s => (s || '').toLowerCase().includes('live')) || (rel.title || '').toLowerCase().includes('live');
            const isRemix = sTypes.some(s => (s || '').toLowerCase().includes('remix'));

            if (isComp) {
                compilations.push(rel);
            } else if (isLive) {
                live.push(rel);
            } else if (pType === 'single' || pType === 'ep' || cat === 'single' || cat === 'ep') {
                singlesEps.push(rel);
            } else if (pType === 'album' && !isComp && !isLive && !isRemix) {
                studio.push(rel);
            } else {
                studio.push(rel);
            }
        });

        return {
            all: releases,
            studio,
            singlesEps,
            compilations,
            live,
        };
    }, [releases]);

    // Filter and Sort active releases
    const filteredReleases = useMemo(() => {
        let list = categorized[activeTab] || releases;

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            list = list.filter(r => (r.title || r.name || '').toLowerCase().includes(q));
        }

        return [...list].sort((a, b) => {
            const ya = a.releaseYear || (a.releaseDate ? new Date(a.releaseDate).getFullYear() : 0);
            const yb = b.releaseYear || (b.releaseDate ? new Date(b.releaseDate).getFullYear() : 0);
            if (sortOrder === "asc") {
                if (ya !== yb) return ya - yb;
                return (a.releaseDate || '').localeCompare(b.releaseDate || '');
            } else {
                if (ya !== yb) return yb - ya;
                return (b.releaseDate || '').localeCompare(a.releaseDate || '');
            }
        });
    }, [categorized, activeTab, searchQuery, sortOrder, releases]);

    const tabs = [
        { id: "all", label: "All Releases", count: categorized.all.length },
        { id: "studio", label: "Studio Albums", count: categorized.studio.length },
        { id: "singlesEps", label: "Singles & EPs", count: categorized.singlesEps.length },
        { id: "compilations", label: "Compilations", count: categorized.compilations.length },
        { id: "live", label: "Live Albums", count: categorized.live.length },
    ];

    if (loading && !artist) {
        return <GrooveLoader fullScreen={true} size={72} />;
    }

    return (
        <div className="relative min-h-screen bg-[var(--theme-bg)] text-[var(--theme-fg)] p-4 pb-32 sm:p-6 md:pl-20 md:pr-20 lg:pl-36 lg:pr-36 pt-12 overflow-hidden transition-colors duration-300">
            {/* Ambient Background Glow */}
            <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
                <div 
                    className="absolute inset-0 bg-cover bg-center scale-110 blur-3xl opacity-60 dark:opacity-40 saturate-150 contrast-110 transition-all duration-700"
                    style={{ backgroundImage: `url(${coverUrl})` }}
                />
                <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-black/25 via-transparent to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--theme-bg)]/60 to-[var(--theme-bg)]" />
            </div>

            {/* Back Button */}
            <button 
                onClick={() => router.push(`/artist/${artist?.id || id}`)}
                className="absolute top-6 left-5 sm:top-8 sm:left-6 lg:left-16 z-20 p-2.5 rounded-full bg-[var(--theme-card)]/90 backdrop-blur-md border border-[var(--theme-border)] text-[var(--theme-fg)] hover:border-[var(--theme-accent)] transition shadow-lg cursor-pointer flex items-center gap-2 group"
                title="Back to Artist"
            >
                <ArrowLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
                <span className="hidden sm:inline text-xs font-bold pr-1">Back to Artist</span>
            </button>

            {/* Header info */}
            <div className="relative z-10 mt-14 sm:mt-10 mb-8">
                <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 text-center sm:text-left">
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-2 border-[var(--theme-border)] shadow-xl shrink-0 bg-[var(--theme-surface)]">
                        <img 
                            src={coverUrl} 
                            alt={artist?.name || 'Artist'} 
                            className="w-full h-full object-cover"
                            onError={(e) => { e.currentTarget.src = 'https://placehold.co/300x300/17020B/E8A87C?text=Artist'; }}
                        />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[var(--theme-card)] border border-[var(--theme-border)] text-[11px] font-bold text-[var(--theme-accent)] uppercase tracking-wider mb-1.5">
                            <Disc size={13} />
                            <span>Complete Discography</span>
                        </div>
                        <h1 className="text-3xl sm:text-5xl font-black text-[var(--theme-fg)] tracking-tight">
                            {artist?.name || 'Artist'}
                        </h1>
                        <p className="text-xs sm:text-sm text-[var(--theme-muted)] font-medium mt-1">
                            {releases.length} releases cataloged in reverse chronological order
                        </p>
                    </div>
                </div>

                {/* Search & Sort Controls Bar */}
                <div className="mt-8 flex flex-col md:flex-row items-center justify-between gap-4">
                    {/* Category Tabs */}
                    <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 scrollbar-none">
                        {tabs.map((tab) => {
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                                        isActive
                                            ? "bg-[var(--theme-accent)] text-[var(--theme-accent-fg)] shadow-md"
                                            : "bg-[var(--theme-card)]/80 hover:bg-[var(--theme-surface)] text-[var(--theme-muted)] hover:text-[var(--theme-fg)] border border-[var(--theme-border)]"
                                    }`}
                                >
                                    <span>{tab.label}</span>
                                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                                        isActive ? "bg-black/20 text-white" : "bg-[var(--theme-surface)] text-[var(--theme-muted)]"
                                    }`}>
                                        {tab.count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Search and Sort controls */}
                    <div className="flex items-center gap-2.5 w-full md:w-auto">
                        <div className="relative flex-1 md:w-60">
                            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--theme-muted)]" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Filter releases..."
                                className="w-full pl-9 pr-3 py-2 rounded-full bg-[var(--theme-card)]/80 border border-[var(--theme-border)] text-xs text-[var(--theme-fg)] placeholder:text-[var(--theme-muted)] focus:outline-none focus:border-[var(--theme-accent)] transition shadow-sm"
                            />
                        </div>

                        <button
                            onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
                            className="shrink-0 px-3.5 py-2 rounded-full bg-[var(--theme-card)]/80 hover:bg-[var(--theme-surface)] border border-[var(--theme-border)] text-xs font-semibold text-[var(--theme-fg)] flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                            title="Toggle Sort Order"
                        >
                            <Calendar size={13} className="text-[var(--theme-accent)]" />
                            <span>{sortOrder === "desc" ? "Newest First" : "Oldest First"}</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Releases Grid */}
            <div className="relative z-10 mt-6">
                {filteredReleases.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 rounded-3xl bg-[var(--theme-card)]/60 border border-[var(--theme-border)] text-center">
                        <Disc size={36} className="text-[var(--theme-muted)] mb-3 animate-spin" />
                        <h3 className="text-base font-bold text-[var(--theme-fg)] mb-1">No releases found</h3>
                        <p className="text-xs text-[var(--theme-muted)]">Try selecting a different tab or clearing your search query.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
                        {filteredReleases.map((release, index) => {
                            const relCover = release.url || release.image || release.coverArt || coverUrl;
                            const relYear = release.releaseYear || (release.releaseDate ? new Date(release.releaseDate).getFullYear() : null);
                            const pType = release.primaryType || 'Release';

                            return (
                                <div
                                    key={`${release.id || 'rel'}-${index}`}
                                    onClick={() => release.id && router.push(`/album/${release.id}`)}
                                    className="group flex flex-col cursor-pointer"
                                >
                                    <div className="aspect-square w-full rounded-2xl overflow-hidden bg-[var(--theme-card)] shadow-md group-hover:shadow-2xl transition-all duration-300 relative ring-1 ring-[var(--theme-border)]">
                                        <img 
                                            src={relCover} 
                                            alt={release.title || release.name}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                            onError={(e) => { e.currentTarget.src = 'https://placehold.co/400x400/17020B/E8A87C?text=Release'; }}
                                        />
                                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[9px] font-bold text-white uppercase tracking-wider">
                                            {pType}
                                        </div>
                                    </div>

                                    <div className="mt-2.5 flex items-center justify-between gap-1 min-w-0">
                                        <h3 className="text-sm font-bold text-[var(--theme-fg)] truncate group-hover:text-[var(--theme-accent)] transition-colors">
                                            {release.title || release.name}
                                        </h3>
                                        <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-[3px] text-[9px] font-bold bg-[var(--theme-muted)]/30 text-[var(--theme-fg)]/90 shrink-0 select-none">
                                            E
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-1.5 mt-0.5 text-xs text-[var(--theme-muted)] font-medium">
                                        {relYear && <span>{relYear}</span>}
                                        {release.typeCategory && (
                                            <>
                                                <span>•</span>
                                                <span className="capitalize">{release.typeCategory}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
