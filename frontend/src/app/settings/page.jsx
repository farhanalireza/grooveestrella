// src/app/settings/page.jsx
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Volume2, ArrowLeft, Check, Music, Trash2, Bot, ListMusic } from 'lucide-react';
import Link from 'next/link';

export default function SettingsPage() {
  const router = useRouter();
  const [preferredPlatform, setPreferredPlatform] = useState("none");
  const [saveSuccess, setSaveSuccess] = useState(false);

  const platforms = [
    { id: "none", name: "Always Ask (Show GrooveEstrella Card)", desc: "Show options list instead of auto-redirecting" },
    { id: "spotify", name: "Spotify", desc: "Launch directly in Spotify application" },
    { id: "apple_music", name: "Apple Music", desc: "Open inside Apple Music web or native player" },
    { id: "youtube_music", name: "YouTube Music", desc: "Redirect to YouTube Music search or play" },
    { id: "youtube", name: "YouTube", desc: "Open standard YouTube video stream" },
    { id: "deezer", name: "Deezer", desc: "Open in Deezer player" },
    { id: "tidal", name: "TIDAL", desc: "Open in TIDAL player" },
    { id: "soundcloud", name: "SoundCloud", desc: "Open inside SoundCloud player" }
  ];

  useEffect(() => {
    const saved = localStorage.getItem("preferred_music_platform");
    if (saved) {
      setPreferredPlatform(saved);
    }
  }, []);

  const handleSelectPlatform = (id) => {
    setPreferredPlatform(id);
    if (id === "none") {
      localStorage.removeItem("preferred_music_platform");
    } else {
      localStorage.setItem("preferred_music_platform", id);
    }
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleClearAllPreferences = () => {
    localStorage.clear();
    setPreferredPlatform("none");
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#07090F]/90 text-[#F4F7FF] flex flex-col justify-between font-sans relative overflow-hidden">

      {/* Header */}
      <header className="border-b border-[#2563EB]/10 bg-[#07090F]/40 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-95 transition">
            <img src="/in.svg" alt="GrooveEstrella" className="w-8 h-8 object-contain" />
            <span className="font-bold tracking-tight text-[#F4F7FF] font-display text-lg">GrooveEstrella</span>
          </Link>

          {/* Navigation linking Utility & Discovery Sides */}
          <nav className="flex items-center gap-1.5 sm:gap-4">
            <Link 
              href="/chat" 
              className="flex items-center gap-1 text-xs font-bold text-[#8992A5] hover:text-[#F4F7FF] px-2.5 py-1.5 rounded-lg hover:bg-[#2563EB]/10 transition"
              title="AI Discovery Chat"
            >
              <Bot className="w-3.5 h-3.5 text-[#8992A5]" />
              <span className="hidden sm:inline">AI Discovery</span>
            </Link>
            
            <Link 
              href="/library" 
              className="flex items-center gap-1 text-xs font-bold text-[#8992A5] hover:text-[#F4F7FF] px-2.5 py-1.5 rounded-lg hover:bg-[#2563EB]/10 transition"
              title="My Music Library"
            >
              <ListMusic className="w-3.5 h-3.5 text-[#8992A5]" />
              <span className="hidden sm:inline">My Library</span>
            </Link>

            <Link 
              href="/" 
              className="flex items-center gap-1 text-xs font-bold text-[#F4F7FF]/80 hover:text-[#F4F7FF] px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-[#2563EB]/15 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Converter</span>
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Panel */}
      <main className="flex-grow flex items-center justify-center py-12 px-6 relative z-10">
        <div className="max-w-xl w-full p-8 rounded-2xl border border-[#2563EB]/15 bg-white/[0.03] backdrop-blur-xl shadow-2xl">
          
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[#10141F] border border-[#2563EB]/10 flex items-center justify-center">
              <Volume2 className="w-5 h-5 text-[#8992A5]" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Preferred Platform</h1>
              <p className="text-xs text-[#8992A5]">Save your default streaming service to skip the landing layer.</p>
            </div>
          </div>

          {/* Success toast */}
          {saveSuccess && (
            <div className="mb-4 p-3 rounded-lg border border-[#2563EB]/30 bg-[#2563EB]/10 flex items-center gap-2 text-xs text-[#60A5FA] animate-pulse">
              <Check className="w-4 h-4" />
              <span>Preferences saved successfully!</span>
            </div>
          )}

          {/* Options List */}
          <div className="space-y-2 mb-6">
            {platforms.map((platform) => {
              const isSelected = preferredPlatform === platform.id;
              return (
                <button
                  key={platform.id}
                  onClick={() => handleSelectPlatform(platform.id)}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border text-left transition-all duration-300 ${
                    isSelected 
                      ? "bg-[#2563EB]/15 border-[#60A5FA] text-[#F4F7FF]" 
                      : "bg-[#07090F]/50 border-[#2563EB]/10 hover:border-[#60A5FA]/20 text-[#F4F7FF]/80 hover:text-[#F4F7FF]"
                  }`}
                >
                  <div>
                    <h3 className="text-sm font-semibold">{platform.name}</h3>
                    <p className="text-xs text-[#8992A5]/70 mt-0.5">{platform.desc}</p>
                  </div>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-[#2563EB] flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5 text-[#F4F7FF]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Privacy & Reset options */}
          <div className="border-t border-[#2563EB]/10 pt-6 space-y-4">
            <div className="flex gap-3 text-xs text-[#8992A5]">
              <Shield className="w-4 h-4 text-[#8992A5] shrink-0 mt-0.5" />
              <p>
                <strong>Privacy First:</strong> Your choice is saved entirely inside your own browser. We never track your streaming preferences or upload data to remote servers.
              </p>
            </div>

            <button
              onClick={handleClearAllPreferences}
              className="flex items-center gap-2 text-xs font-semibold text-red-400 hover:text-red-300 transition-colors pt-2 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear browser data and preferences</span>
            </button>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#2563EB]/10 bg-[#07090F]/40 py-6 text-center text-xs text-[#8992A5]/70">
        <p>© {new Date().getFullYear()} GrooveEstrella. Your privacy is respected.</p>
      </footer>
    </div>
  );
}
