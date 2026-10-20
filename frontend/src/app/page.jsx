// src/app/page.jsx
"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { 
  Music, ArrowRight, Info, AlertCircle, Sparkles, Search, X, 
  Flame, Zap, Headphones, Disc, Disc3, Mic, ChevronRight, Compass
} from "lucide-react";
import Link from "next/link";
import axios from "axios";

const FEATURED_ALBUMS = [
  {
    id: "f5093c06-23e3-404f-aeaa-40f72885ee3a",
    title: "The Dark Side of the Moon",
    artist: "Pink Floyd",
    year: "1973",
    cover: "https://coverartarchive.org/release-group/f5093c06-23e3-404f-aeaa-40f72885ee3a/front-500",
    genre: "Psychedelic Rock",
    badge: "Masterpiece",
  },
  {
    id: "9162580e-5df4-32de-80cc-f45a8d8a9b1d",
    title: "Abbey Road",
    artist: "The Beatles",
    year: "1969",
    cover: "https://coverartarchive.org/release-group/9162580e-5df4-32de-80cc-f45a8d8a9b1d/front-500",
    genre: "Classic Rock",
    badge: "Iconic",
  },
  {
    id: "aa997ea0-2936-40bd-884d-3af8a0e064dc",
    title: "Random Access Memories",
    artist: "Daft Punk",
    year: "2013",
    cover: "https://coverartarchive.org/release-group/aa997ea0-2936-40bd-884d-3af8a0e064dc/front-500",
    genre: "Electronic / Disco",
    badge: "Grammy Winner",
  },
  {
    id: "416bb5e5-c7d1-3977-8fd7-7c9daf6c2be6",
    title: "Rumours",
    artist: "Fleetwood Mac",
    year: "1977",
    cover: "https://coverartarchive.org/release-group/416bb5e5-c7d1-3977-8fd7-7c9daf6c2be6/front-500",
    genre: "Soft Rock",
    badge: "Legendary",
  },
  {
    id: "6c9ae3dd-32ad-472c-96be-69d0a3536261",
    title: "The Rise and Fall of Ziggy Stardust",
    artist: "David Bowie",
    year: "1972",
    cover: "https://coverartarchive.org/release-group/6c9ae3dd-32ad-472c-96be-69d0a3536261/front-500",
    genre: "Glam Rock",
    badge: "Cult Classic",
  },
  {
    id: "b1392450-e666-3926-a536-22c65f834433",
    title: "OK Computer",
    artist: "Radiohead",
    year: "1997",
    cover: "https://coverartarchive.org/release-group/b1392450-e666-3926-a536-22c65f834433/front-500",
    genre: "Alternative",
    badge: "Acclaimed",
  },
  {
    id: "3a7817b5-22cb-32c3-a31b-2c8309fbf92e",
    title: "Thriller",
    artist: "Michael Jackson",
    year: "1982",
    cover: "https://coverartarchive.org/release-group/3a7817b5-22cb-32c3-a31b-2c8309fbf92e/front-500",
    genre: "Pop / R&B",
    badge: "Best Selling",
  },
  {
    id: "a348ba2f-f8b3-4686-b928-e63d8d94d543",
    title: "AM",
    artist: "Arctic Monkeys",
    year: "2013",
    cover: "https://coverartarchive.org/release-group/a348ba2f-f8b3-4686-b928-e63d8d94d543/front-500",
    genre: "Indie Rock",
    badge: "Modern Hit",
  },
];

const FEATURED_ARTISTS = [
  {
    id: "544fb460-1482-40e5-b4e8-f7246b976eed",
    name: "David Bowie",
    genre: "Glam Rock",
    image: "https://cdn-images.dzcdn.net/images/artist/8301a6a09a24f4bb35950c59717defa0/250x250-000000-80-0-0.jpg",
  },
  {
    id: "056e4f3e-d505-4dad-8ec1-d04f521cbb56",
    name: "Daft Punk",
    genre: "Electronic",
    image: "https://cdn-images.dzcdn.net/images/artist/638e69b9caaf9f9f3f8826febea7b543/250x250-000000-80-0-0.jpg",
  },
  {
    id: "83d91898-7763-47d7-b03b-b92132375c47",
    name: "Pink Floyd",
    genre: "Progressive",
    image: "https://cdn-images.dzcdn.net/images/artist/d62a818a5de6455f17b6a992cf22b32f/250x250-000000-80-0-0.jpg",
  },
  {
    id: "b10bbbfc-cf9e-42e0-be17-e2c3e1d2600d",
    name: "The Beatles",
    genre: "Classic Rock",
    image: "https://cdn-images.dzcdn.net/images/artist/16925ed8f96eb621ecd56c2c8ba3da6e/250x250-000000-80-0-0.jpg",
  },
  {
    id: "0383dadf-2a4e-4d10-a46a-e6e041da8eb3",
    name: "Queen",
    genre: "Rock Anthems",
    image: "https://cdn-images.dzcdn.net/images/artist/a131ced363dd67249e6a9167164188cb/250x250-000000-80-0-0.jpg",
  },
  {
    id: "a74b1b7f-71a5-4011-9441-d0b5e4122711",
    name: "Radiohead",
    genre: "Alternative",
    image: "https://cdn-images.dzcdn.net/images/artist/0d58cfbc90f2e776608bcdc0c45a4711/250x250-000000-80-0-0.jpg",
  },
  {
    id: "f27ec8db-af05-4f36-916e-3d57f91ecf5e",
    name: "Michael Jackson",
    genre: "Pop / R&B",
    image: "https://cdn-images.dzcdn.net/images/artist/97fae13b2b30e4aec2e8c9e0c7839d92/250x250-000000-80-0-0.jpg",
  },
  {
    id: "d5080c9b-1249-430f-ac8d-e6f451479d79",
    name: "Kendrick Lamar",
    genre: "Hip Hop",
    image: "https://cdn-images.dzcdn.net/images/artist/be0a7c550567f4af0ed202d7235b74d6/250x250-000000-80-0-0.jpg",
  },
];

const EXPLORE_GENRES = [
  { label: "Rock", icon: Flame, query: "Rock" },
  { label: "Electronic", icon: Zap, query: "Electronic" },
  { label: "Jazz", icon: Music, query: "Jazz" },
  { label: "Indie", icon: Sparkles, query: "Indie" },
  { label: "Hip Hop", icon: Mic, query: "Hip Hop" },
  { label: "Ambient", icon: Headphones, query: "Ambient" },
  { label: "Classical", icon: Disc, query: "Classical" },
  { label: "Soul & Funk", icon: Disc3, query: "Funk" },
];

export default function Home() {
  const router = useRouter();
  const [inputUrl, setInputUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [isPending, startTransition] = useTransition();
  const [navigatingId, setNavigatingId] = useState(null);

  // Check if input is a URL
  const isUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    const query = inputUrl.trim();
    if (!query) return;

    setError(null);

    // Flow A: Direct Link Conversion
    if (isUrl(query)) {
      setLoading(true);
      try {
        const response = await axios.post("/api/convert", { url: query });
        if (response.data?.success && response.data?.redirectUrl) {
          router.push(response.data.redirectUrl);
        } else {
          setError("Could not resolve music link. Please double check the URL.");
          setLoading(false);
        }
      } catch (err) {
        console.error("Conversion error:", err);
        setError(
          err.response?.data?.error || 
          "Failed to convert link. Make sure it is a valid Spotify, YouTube, or Apple Music track URL."
        );
        setLoading(false);
      }
    } 
    // Flow B: Text Music Search - Redirect to explorer search page
    else {
      router.push(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  const handleClear = () => {
    setInputUrl("");
    setError(null);
  };

  const handleOpenAlbum = (albumId) => {
    if (!albumId || isPending) return;
    setNavigatingId(`album-${albumId}`);
    startTransition(() => {
      router.push(`/album/${albumId}`);
    });
  };

  const handleOpenArtist = (artistId) => {
    if (!artistId || isPending) return;
    setNavigatingId(`artist-${artistId}`);
    startTransition(() => {
      router.push(`/artist/${artistId}`);
    });
  };

  const handleOpenGenre = (genreQuery) => {
    if (!genreQuery || isPending) return;
    setNavigatingId(`genre-${genreQuery}`);
    startTransition(() => {
      router.push(`/search?q=${encodeURIComponent(genreQuery)}&type=album`);
    });
  };

  return (
    <div className="flex-grow flex flex-col items-center justify-start py-10 sm:py-14 px-4 sm:px-6 relative z-10 w-full max-w-5xl mx-auto pb-32">
      {/* Hero Header Section */}
      <div className="max-w-2xl w-full text-center mb-10">
        
        {/* Mission Tag */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[var(--theme-border)] bg-[var(--theme-surface)] text-[var(--theme-accent)] text-[10px] font-bold tracking-widest uppercase mb-6">
          <Sparkles className="w-3 h-3 text-[var(--theme-accent)]" />
          <span>Music Layer</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-4 font-display leading-[1.1] text-[var(--theme-fg)]">
          Share and open music <br className="hidden sm:block" />
          <span className="bg-gradient-to-r from-[var(--theme-accent)] via-[var(--theme-fg)] to-[var(--theme-accent-bg)] bg-clip-text text-transparent">
            across all platforms
          </span>
        </h1>

        <p className="text-[var(--theme-muted)] text-sm sm:text-base max-w-lg mx-auto mb-8 leading-relaxed font-body">
          Paste a link from Spotify, Apple Music, YouTube—or search for any song title to create a universal link and customizable GrooveCard sharing badge.
        </p>

        {/* Universal Input Search Form */}
        <div className="w-full max-w-xl mx-auto mb-4">
          <form onSubmit={handleSearchSubmit}>
            <div className="relative flex items-center p-2 rounded-2xl sm:rounded-3xl border border-[var(--theme-border)] bg-[var(--theme-card)]/85 backdrop-blur-2xl focus-within:border-[var(--theme-accent)] focus-within:ring-2 focus-within:ring-[var(--theme-accent)]/30 shadow-xl transition-all duration-300 overflow-hidden">
              <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[var(--theme-accent)]/20 to-transparent pointer-events-none" />
              <div className="pl-3 text-[var(--theme-muted)] shrink-0">
                <Search className="w-5 h-5" />
              </div>
              <input
                type="text"
                placeholder="Paste link or search song title..."
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                disabled={loading}
                className="w-full min-w-0 flex-grow bg-transparent px-3 py-2.5 text-[var(--theme-fg)] placeholder-[var(--theme-muted)] text-sm sm:text-base outline-none disabled:opacity-50 font-medium"
              />
              
              {inputUrl && (
                <button 
                  type="button" 
                  onClick={handleClear}
                  className="p-1.5 mr-1 text-[var(--theme-muted)] hover:text-[var(--theme-fg)] rounded-full hover:bg-[var(--theme-surface)] transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              <button
                type="submit"
                disabled={loading || !inputUrl.trim()}
                className="bg-[var(--theme-accent-bg)] hover:opacity-90 text-[var(--theme-accent-fg)] px-5 py-2.5 rounded-xl sm:rounded-2xl flex items-center justify-center gap-1.5 text-sm font-bold shadow-lg shadow-[var(--theme-accent)]/20 transition-all duration-300 disabled:opacity-50 active:scale-95 shrink-0 cursor-pointer"
              >
                <span>
                  {loading ? "Routing..." : isUrl(inputUrl) ? "Convert" : "Search"}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>

        {/* Error Message */}
        {error && (
          <div className="max-w-xl mx-auto p-3.5 rounded-xl border border-red-500/20 bg-red-500/10 flex items-center gap-2.5 text-xs sm:text-sm text-red-400 text-left mb-6 animate-fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Quick info tip */}
        <div className="flex items-center justify-center gap-2 text-xs text-[var(--theme-muted)]">
          <Info className="w-4 h-4 text-[var(--theme-muted)]" />
          <span>Search title/artist or paste direct links to get universal routing paths.</span>
        </div>
      </div>

      {/* DISCOVERIES & SUGGESTIONS SECTION */}
      <div className="w-full space-y-12 mt-4">
        
        {/* SECTION 1: Masterpiece Albums Showcase */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-[var(--theme-accent)] animate-pulse" />
                <span className="text-[11px] font-bold text-[var(--theme-accent)] tracking-widest uppercase font-mono">
                  Curated Catalog
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-[var(--theme-fg)] tracking-tight">
                Iconic Masterpieces & Discoveries
              </h2>
            </div>

            <Link
              href="/search?type=album"
              className="inline-flex items-center gap-1 text-xs font-bold text-[var(--theme-muted)] hover:text-[var(--theme-accent)] transition cursor-pointer"
            >
              <span>Explore all</span>
              <ChevronRight size={14} />
            </Link>
          </div>

          {/* Albums Responsive Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-5">
            {FEATURED_ALBUMS.map((alb) => {
              const isCurrentNavigating = isPending && navigatingId === `album-${alb.id}`;
              return (
                <div
                  key={alb.id}
                  onClick={() => handleOpenAlbum(alb.id)}
                  className={`group bg-[var(--theme-card)]/80 hover:bg-[var(--theme-card)] border border-[var(--theme-border)] hover:border-[var(--theme-accent)]/50 rounded-3xl p-3 sm:p-3.5 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col text-left ${
                    isCurrentNavigating ? "opacity-75 pointer-events-none cursor-wait" : "cursor-pointer"
                  }`}
                >
                  {/* Artwork Cover Box */}
                  <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-[var(--theme-surface)] border border-[var(--theme-border)] mb-3 shadow-inner">
                    <img
                      src={alb.cover}
                      alt={alb.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => {
                        e.currentTarget.src = "https://placehold.co/400x400/17020B/E8A87C?text=Album";
                      }}
                    />
                    
                    {/* Badge Pill */}
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[9px] font-bold text-white tracking-wider uppercase select-none">
                      {alb.badge}
                    </div>

                    {/* Instant Navigation Loading Indicator */}
                    {isCurrentNavigating && (
                      <div className="absolute inset-0 bg-black/65 backdrop-blur-[1px] flex flex-col items-center justify-center gap-1.5 animate-fade-in z-20">
                        <div className="w-8 h-8 rounded-full border-2 border-[var(--theme-accent)] border-t-transparent animate-spin" />
                        <span className="text-[10px] font-bold text-white tracking-widest uppercase font-mono">Routing...</span>
                      </div>
                    )}
                  </div>

                  {/* Album Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs sm:text-sm font-bold text-[var(--theme-fg)] group-hover:text-[var(--theme-accent)] transition-colors truncate">
                      {alb.title}
                    </h3>
                    <p className="text-[11px] sm:text-xs text-[var(--theme-muted)] truncate mt-0.5 font-medium">
                      {alb.artist}
                    </p>
                    <div className="flex items-center gap-2 mt-2 text-[10px] text-[var(--theme-muted)]">
                      <span className="font-mono">{alb.year}</span>
                      <span>•</span>
                      <span className="truncate">{alb.genre}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION 2: Iconic Artists Spotlight */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-[var(--theme-accent)] animate-pulse" />
                <span className="text-[11px] font-bold text-[var(--theme-accent)] tracking-widest uppercase font-mono">
                  Hall of Fame
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-[var(--theme-fg)] tracking-tight">
                Featured Iconic Artists
              </h2>
            </div>

            <Link
              href="/search?type=artist"
              className="inline-flex items-center gap-1 text-xs font-bold text-[var(--theme-muted)] hover:text-[var(--theme-accent)] transition cursor-pointer"
            >
              <span>View all artists</span>
              <ChevronRight size={14} />
            </Link>
          </div>

          {/* Artists Circular Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3 sm:gap-4">
            {FEATURED_ARTISTS.map((art) => {
              const isCurrentNavigating = isPending && navigatingId === `artist-${art.id}`;
              return (
                <div
                  key={art.id}
                  onClick={() => handleOpenArtist(art.id)}
                  className={`group flex flex-col items-center text-center p-2.5 rounded-2xl hover:bg-[var(--theme-card)]/60 transition-all duration-200 ${
                    isCurrentNavigating ? "opacity-75 pointer-events-none cursor-wait" : "cursor-pointer"
                  }`}
                >
                  <div className="relative w-18 h-18 sm:w-20 sm:h-20 aspect-square rounded-full overflow-hidden border-2 border-[var(--theme-border)] group-hover:border-[var(--theme-accent)] shadow-md group-hover:shadow-lg transition-all duration-300 mb-2">
                    <img
                      src={art.image}
                      alt={art.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      onError={(e) => {
                        e.currentTarget.src = "https://placehold.co/200x200/17020B/E8A87C?text=Artist";
                      }}
                    />
                    {isCurrentNavigating && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] flex items-center justify-center animate-fade-in z-20">
                        <div className="w-5 h-5 rounded-full border-2 border-[var(--theme-accent)] border-t-transparent animate-spin" />
                      </div>
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-[var(--theme-fg)] group-hover:text-[var(--theme-accent)] transition-colors truncate max-w-full">
                    {art.name}
                  </h4>
                  <p className="text-[10px] text-[var(--theme-muted)] truncate max-w-full">
                    {art.genre}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION 3: Explore by Musical Style (Clean Lucide Icons - No Emojis) */}
        <div className="p-6 rounded-3xl bg-[var(--theme-card)]/50 border border-[var(--theme-border)] text-center">
          <div className="max-w-md mx-auto mb-4">
            <span className="text-[10px] font-extrabold text-[var(--theme-accent)] tracking-widest uppercase font-mono">
              Genre Exploration
            </span>
            <h3 className="text-lg sm:text-xl font-bold text-[var(--theme-fg)] mt-1">
              Explore by Musical Sound & Style
            </h3>
          </div>

          <div className="flex flex-wrap gap-2 justify-center">
            {EXPLORE_GENRES.map((g) => {
              const IconComp = g.icon;
              const isCurrentNavigating = isPending && navigatingId === `genre-${g.query}`;

              return (
                <button
                  key={g.label}
                  type="button"
                  onClick={() => handleOpenGenre(g.query)}
                  disabled={isPending}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[var(--theme-surface)] hover:bg-[var(--theme-card)] border border-[var(--theme-border)] hover:border-[var(--theme-accent)]/50 text-[var(--theme-fg)] hover:text-[var(--theme-accent)] text-xs font-bold transition active:scale-95 shadow-sm cursor-pointer disabled:opacity-75 disabled:cursor-wait"
                >
                  {isCurrentNavigating ? (
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
                  ) : (
                    <IconComp className="w-3.5 h-3.5 text-[var(--theme-accent)]" />
                  )}
                  <span>{g.label}</span>
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
