// src/app/page.jsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Music, ArrowRight, Settings, Info, AlertCircle, Sparkles, Search, X, Bot, ListMusic } from "lucide-react";
import Link from "next/link";
import axios from "axios";

export default function Home() {
  const router = useRouter();
  const [inputUrl, setInputUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

  return (
    <div className="flex-grow flex items-center justify-center py-12 px-6 relative z-10">
      <div className="max-w-2xl w-full text-center">
        
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

        <p className="text-[var(--theme-muted)] text-sm sm:text-base max-w-lg mx-auto mb-10 leading-relaxed font-body">
          Paste a link from Spotify, Apple Music, YouTube—or search for any song title to create a universal link and customizable GrooveCard sharing badge.
        </p>

        {/* Form container */}
        <div className="w-full max-w-xl mx-auto mb-6">
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
          <div className="max-w-xl mx-auto p-3.5 rounded-xl border border-red-500/20 bg-red-500/10 flex items-center gap-2.5 text-xs sm:text-sm text-red-400 text-left mb-8 animate-fade-in">
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
    </div>
  );
}
