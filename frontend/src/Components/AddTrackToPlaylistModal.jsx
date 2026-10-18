// src/Components/AddTrackToPlaylistModal.jsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Plus, Check, Music } from "lucide-react";
import GrooveLoader from "@/Components/GrooveLoader";
import { toast } from "@/lib/toast";

export default function AddTrackToPlaylistModal({ 
  isOpen, 
  onClose, 
  playlistId, 
  onTrackAdded, 
  existingTrackIds = null 
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addedIds, setAddedIds] = useState(new Set());
  const debounceTimer = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setAddedIds(new Set(Array.isArray(existingTrackIds) ? existingTrackIds : []));
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setResults([]);
      setLoading(false);
    }
  }, [isOpen]);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setQuery(val);

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    if (!val.trim() || val.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(val.trim())}&type=track&limit=15`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.tracks || data.results || []);
        }
      } catch (err) {
        console.error("Failed to search tracks:", err);
      } finally {
        setLoading(false);
      }
    }, 350);
  };

  const handleAdd = (track) => {
    if (!playlistId) return;

    const customPlaylists = JSON.parse(localStorage.getItem("customPlaylists") || "[]");
    const pIndex = customPlaylists.findIndex((p) => p.id === playlistId);
    if (pIndex === -1) {
      toast.error("Playlist not found");
      return;
    }

    const pl = customPlaylists[pIndex];
    pl.tracks = pl.tracks || { items: [], total: 0 };

    const trackId = track.id || track.trackId;
    const exists = pl.tracks.items.some((item) => item.track?.id === trackId);
    if (exists) {
      toast.info(`"${track.name || track.title}" is already in this playlist.`);
      setAddedIds((prev) => new Set([...prev, trackId]));
      return;
    }

    const artists = Array.isArray(track.artists)
      ? track.artists
      : Array.isArray(track.artist)
      ? track.artist
      : [{ name: track.artist || "Unknown Artist" }];

    const coverUrl = track.album?.images?.[0]?.url || track.image || track.coverArt || "";

    const newTrackItem = {
      added_at: new Date().toISOString(),
      track: {
        id: trackId,
        name: track.name || track.title,
        title: track.name || track.title,
        artists: artists,
        duration_ms: track.duration_ms || track.duration || 180000,
        album: {
          name: track.album?.name || track.album || "Release",
          images: coverUrl ? [{ url: coverUrl }] : []
        },
        external_urls: {
          spotify: track.external_urls?.spotify || track.spoURL || ""
        },
        spoURL: track.external_urls?.spotify || track.spoURL || "",
        YTURL: track.YTURL || ""
      }
    };

    pl.tracks.items.push(newTrackItem);
    pl.tracks.total = pl.tracks.items.length;

    // Update playlist cover if empty
    if ((!pl.image || pl.image.includes("placeholder") || pl.image.includes("placehold.co")) && coverUrl) {
      pl.image = coverUrl;
      pl.images = [{ url: coverUrl }];
    }

    customPlaylists[pIndex] = pl;
    localStorage.setItem("customPlaylists", JSON.stringify(customPlaylists));

    setAddedIds((prev) => new Set([...prev, trackId]));
    toast.success(`Added "${track.name || track.title}" to playlist! 🎵`);

    if (onTrackAdded) {
      onTrackAdded(pl, newTrackItem);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/75 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 16 }}
            transition={{ type: "spring", stiffness: 450, damping: 30 }}
            className="relative w-full max-w-lg bg-[var(--theme-card)]/95 backdrop-blur-2xl border border-[var(--theme-border)] rounded-3xl p-6 shadow-2xl z-10 flex flex-col max-h-[85vh] text-[var(--theme-fg)]"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[var(--theme-accent)]/20 text-[var(--theme-accent)] flex items-center justify-center">
                  <Music size={16} />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold tracking-tight">Add Songs to Playlist</h3>
                  <p className="text-[11px] text-[var(--theme-muted)]">Search songs from catalog to append</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative mt-4 mb-3">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="text"
                autoFocus
                placeholder="Search song title or artist..."
                value={query}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-black/30 border border-white/15 focus:border-[var(--theme-accent)] focus:outline-none text-xs sm:text-sm text-white placeholder-white/40 transition"
              />
            </div>

            {/* Search Results Area */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[220px]">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <GrooveLoader size={40} />
                </div>
              ) : results.length > 0 ? (
                results.map((track, idx) => {
                  const trackId = track.id || track.trackId;
                  const isAdded = addedIds.has(trackId);
                  const artistName = Array.isArray(track.artists)
                    ? track.artists.map((a) => a.name).join(", ")
                    : (track.artist || "Unknown Artist");
                  const cover = track.album?.images?.[0]?.url || track.image || track.coverArt || "/in.svg";

                  return (
                    <div
                      key={`${trackId}-${idx}`}
                      className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 transition"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <img
                          src={cover}
                          alt={track.name || track.title}
                          className="w-10 h-10 rounded-lg object-cover bg-white/5 shrink-0"
                          onError={(e) => { e.currentTarget.src = "/in.svg"; }}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs sm:text-sm font-semibold text-white truncate">
                            {track.name || track.title}
                          </p>
                          <p className="text-[11px] text-white/50 truncate">
                            {artistName}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleAdd(track)}
                        disabled={isAdded}
                        className={`ml-3 px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                          isAdded
                            ? "bg-white/10 text-white/50 cursor-default"
                            : "bg-[var(--theme-accent)] hover:opacity-90 active:scale-95 text-[var(--theme-bg)] cursor-pointer"
                        }`}
                      >
                        {isAdded ? (
                          <>
                            <Check size={13} strokeWidth={3} />
                            <span>Added</span>
                          </>
                        ) : (
                          <>
                            <Plus size={13} strokeWidth={3} />
                            <span>Add</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })
              ) : query.trim().length >= 2 ? (
                <div className="text-center py-12 text-xs text-white/40">
                  No matching tracks found for &quot;{query}&quot;
                </div>
              ) : (
                <div className="text-center py-12 text-xs text-white/40 flex flex-col items-center gap-2">
                  <Search size={24} className="opacity-40" />
                  <span>Type a song or artist name to search catalog</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="mt-4 pt-3 border-t border-white/10 flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-full text-xs font-bold bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              >
                Done
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
