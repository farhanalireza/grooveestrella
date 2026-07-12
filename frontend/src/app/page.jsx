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
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#2563EB]/15 bg-[#2563EB]/5 text-[#F4F7FF]/70 text-[10px] font-bold tracking-widest uppercase mb-6">
          <Sparkles className="w-3 h-3 text-[#60A5FA]" />
          <span>The Listen Layer</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-4 font-display leading-[1.1] text-white">
          Share and open music <br className="hidden sm:block" />
          <span className="bg-gradient-to-r from-[#60A5FA] via-[#F4F7FF] to-[#2563EB] bg-clip-text text-transparent">
            across all platforms
          </span>
        </h1>

        <p className="text-[#8992A5] text-sm sm:text-base max-w-lg mx-auto mb-10 leading-relaxed font-body">
          Paste a link from Spotify, Apple Music, YouTube—or search for any song title to create a universal link and customizable GrooveCard sharing badge.
        </p>

        {/* Form container */}
        <div className="w-full max-w-xl mx-auto mb-6">
          <form onSubmit={handleSearchSubmit}>
            <div className="relative flex items-center p-1.5 rounded-xl border border-[#2563EB]/15 bg-[#10141F]/70 backdrop-blur-xl focus-within:border-[#60A5FA]/40 transition-all duration-300">
              <div className="pl-3 text-[#8992A5]/60 shrink-0">
                <Search className="w-5 h-5" />
              </div>
              <input
                type="text"
                placeholder="Paste link or search song title..."
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                disabled={loading}
                className="w-full min-w-0 flex-grow bg-transparent px-3 py-3 text-[#F4F7FF] placeholder-[#8992A5]/50 text-sm sm:text-base outline-none disabled:opacity-50"
              />
              
              {inputUrl && (
                <button 
                  type="button" 
                  onClick={handleClear}
                  className="p-1 mr-1 text-[#8992A5]/60 hover:text-[#F4F7FF] rounded-full transition"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              <button
                type="submit"
                disabled={loading || !inputUrl.trim()}
                className="bg-[#2563EB] hover:bg-[#60A5FA] text-[#F4F7FF] px-5 py-3 rounded-lg flex items-center justify-center gap-1.5 text-sm font-bold transition disabled:opacity-55 active:scale-95 shrink-0 cursor-pointer"
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
        <div className="flex items-center justify-center gap-2 text-xs text-[#8992A5]/60">
          <Info className="w-4 h-4 text-[#8992A5]" />
          <span>Search title/artist or paste direct links to get universal routing paths.</span>
        </div>

      </div>
    </div>
  );
}
