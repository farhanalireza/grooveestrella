// src/Components/PlaylistPickerModal.jsx
"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, ListMusic, ChevronRight, FolderHeart } from 'lucide-react';
import { toast } from '@/lib/toast';

export default function PlaylistPickerModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [track, setTrack] = useState(null);
  const [customPlaylists, setCustomPlaylists] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDesc, setNewPlaylistDesc] = useState('');

  useEffect(() => {
    const handleOpen = (e) => {
      const { track } = e.detail;
      setTrack(track);
      
      // Load custom playlists
      const saved = JSON.parse(localStorage.getItem('customPlaylists') || '[]');
      setCustomPlaylists(saved);
      setIsOpen(true);
    };

    window.addEventListener('open-playlist-picker', handleOpen);
    return () => window.removeEventListener('open-playlist-picker', handleOpen);
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    setTrack(null);
    setShowCreateForm(false);
    setNewPlaylistName('');
    setNewPlaylistDesc('');
  };

  const extractTrackData = (raw) => {
    if (!raw) return null;
    const realId = raw.id || raw.trackId || raw.trackID || 
      (raw.trackURI && typeof raw.trackURI === 'string' && raw.trackURI.split(':')[2]) || 
      (raw.uri && typeof raw.uri === 'string' && raw.uri.split(':')[2]) || 
      '';
    const title = raw.name || raw.title || 'Untitled Track';
    const artists = Array.isArray(raw.artists)
      ? raw.artists
      : Array.isArray(raw.artist)
      ? raw.artist
      : [{ name: raw.artist || 'Unknown Artist' }];
    const coverUrl = raw.album?.images?.[0]?.url || raw.image || raw.coverArt || raw.imageUrl || '';
    const albumName = raw.album?.name || (typeof raw.album === 'string' ? raw.album : '') || '';
    const duration = raw.duration_ms || raw.durationMs || raw.duration || 180000;
    const spoURL = raw.external_urls?.spotify || raw.spoURL || '';
    const YTURL = raw.YTURL || '';
    const explicit = Boolean(raw.explicit);

    return {
      id: realId,
      name: title,
      title: title,
      artists: artists,
      duration_ms: duration,
      album: {
        id: raw.album?.id || '',
        name: albumName,
        images: coverUrl ? [{ url: coverUrl }] : []
      },
      image: coverUrl,
      external_urls: { spotify: spoURL },
      spoURL: spoURL,
      YTURL: YTURL,
      explicit: explicit
    };
  };

  const handleAddToPlaylist = (playlistId) => {
    if (!track) return;
    const cleanTrack = extractTrackData(track);
    if (!cleanTrack) return;
    
    const playlists = JSON.parse(localStorage.getItem('customPlaylists') || '[]');
    const playlistIndex = playlists.findIndex(p => p.id === playlistId);
    
    if (playlistIndex === -1) {
      toast.error("Playlist not found!");
      return;
    }
    
    const playlist = playlists[playlistIndex];
    playlist.tracks = playlist.tracks || { total: 0, items: [] };
    
    // Check if track already exists in the playlist
    const exists = playlist.tracks.items.some(
      item => (cleanTrack.id && item.track?.id === cleanTrack.id) || (cleanTrack.spoURL && item.track?.external_urls?.spotify === cleanTrack.spoURL)
    );
    
    if (exists) {
      toast.info(`"${cleanTrack.title}" is already in "${playlist.name}".`);
      handleClose();
      return;
    }
    
    // Construct the new track item in standard format
    const newTrackItem = {
      added_at: new Date().toISOString(),
      track: cleanTrack
    };
    
    playlist.tracks.items.push(newTrackItem);
    playlist.tracks.total = playlist.tracks.items.length;
    
    // Auto-update playlist cover image
    if (cleanTrack.image) {
      playlist.image = cleanTrack.image;
      playlist.images = [{ url: cleanTrack.image }];
    }
    
    playlists[playlistIndex] = playlist;
    localStorage.setItem('customPlaylists', JSON.stringify(playlists));
    
    toast.success(`Added "${cleanTrack.title}" to "${playlist.name}"! 🎵`);
    handleClose();
  };

  const handleCreateAndAdd = (e) => {
    e.preventDefault();
    if (!newPlaylistName.trim() || !track) return;
    const cleanTrack = extractTrackData(track);
    if (!cleanTrack) return;
    
    const playlists = JSON.parse(localStorage.getItem('customPlaylists') || '[]');
    
    const newPlaylistId = `custom-${Date.now()}`;
    const userName = localStorage.getItem('userName') || 'You';
    
    const newPlaylist = {
      id: newPlaylistId,
      name: newPlaylistName.trim(),
      title: newPlaylistName.trim(),
      description: newPlaylistDesc.trim() || 'Custom playlist created on GrooveEstrella.',
      image: cleanTrack.image || '',
      images: cleanTrack.image ? [{ url: cleanTrack.image }] : [],
      owner: { display_name: userName },
      tracks: {
        total: 1,
        items: [
          {
            added_at: new Date().toISOString(),
            track: cleanTrack
          }
        ]
      }
    };
    
    playlists.push(newPlaylist);
    localStorage.setItem('customPlaylists', JSON.stringify(playlists));
    
    toast.success(`Created "${newPlaylist.name}" and added "${cleanTrack.title}"! 🎉`);
    handleClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          {/* Backdrop click closes modal */}
          <div className="absolute inset-0" onClick={handleClose} />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="relative max-w-md w-full bg-[var(--theme-card)] border border-[var(--theme-border)] text-[var(--theme-fg)] rounded-3xl shadow-2xl p-6 overflow-hidden z-10 flex flex-col max-h-[85vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <ListMusic className="w-5 h-5 text-[var(--theme-accent)]" />
                <h3 className="text-lg font-bold text-[var(--theme-fg)]">Add to Playlist</h3>
              </div>
              <button 
                onClick={handleClose}
                className="p-1 text-[var(--theme-muted)] hover:text-[var(--theme-fg)] rounded-lg hover:bg-[var(--theme-surface)] transition cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Track Mini Card */}
            {track && (
              <div className="flex items-center gap-3 p-3 bg-[var(--theme-surface)] rounded-2xl mb-5 border border-[var(--theme-border)]">
                <img 
                  src={track.image || 'https://placehold.co/80x80?text=Cover'} 
                  alt={track.title} 
                  className="w-12 h-12 rounded-xl object-cover"
                />
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-sm text-[var(--theme-fg)] truncate">{track.title}</h4>
                  <p className="text-xs text-[var(--theme-muted)] truncate">
                    {track.artist?.map(a => a.name).join(', ')}
                  </p>
                </div>
              </div>
            )}

            {!showCreateForm ? (
              <>
                {/* Playlist Selection List */}
                <div className="overflow-y-auto flex-1 mb-5 pr-1 gap-2 flex flex-col min-h-[150px] max-h-[300px]">
                  {customPlaylists.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center p-8 bg-[var(--theme-surface)]/70 rounded-2xl border border-[var(--theme-border)] flex-1">
                      <FolderHeart className="w-10 h-10 text-[var(--theme-muted)]/50 mb-2" />
                      <p className="text-sm font-semibold text-[var(--theme-muted)] mb-1">No custom playlists yet</p>
                      <p className="text-xs text-[var(--theme-muted)]/70 max-w-[200px]">Create your first custom playlist to save this track!</p>
                    </div>
                  ) : (
                    customPlaylists.map(pl => (
                      <button
                        key={pl.id}
                        onClick={() => handleAddToPlaylist(pl.id)}
                        className="flex items-center gap-3 p-3 w-full bg-[var(--theme-surface)]/80 hover:bg-[var(--theme-card)] rounded-2xl border border-[var(--theme-border)] hover:border-[var(--theme-accent)]/30 text-left transition duration-200 group cursor-pointer"
                      >
                        <img 
                          src={pl.image || 'https://placehold.co/80x80?text=Playlist'} 
                          alt={pl.name} 
                          className="w-10 h-10 rounded-xl object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <h5 className="font-bold text-sm text-[var(--theme-fg)] truncate group-hover:text-[var(--theme-accent)] transition">{pl.name}</h5>
                          <p className="text-xs text-[var(--theme-muted)] font-medium">
                            {pl.tracks?.total || 0} {pl.tracks?.total === 1 ? 'track' : 'tracks'}
                          </p>
                        </div>
                        <ChevronRight size={16} className="text-[var(--theme-muted)] group-hover:text-[var(--theme-accent)] transition" />
                      </button>
                    ))
                  )}
                </div>

                {/* Create Playlist Toggle Button */}
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-[var(--theme-accent-bg)] hover:opacity-90 text-[var(--theme-accent-fg)] font-bold rounded-full transition active:scale-98 text-sm cursor-pointer shadow-md"
                >
                  <Plus size={16} />
                  Create New Playlist
                </button>
              </>
            ) : (
              /* Create Playlist Form */
              <form onSubmit={handleCreateAndAdd} className="flex flex-col gap-4 flex-1">
                <div>
                  <label className="block text-xs font-bold text-[var(--theme-muted)] uppercase tracking-wider mb-2">Playlist Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Chill Vibes, Workout Mix"
                    value={newPlaylistName}
                    onChange={(e) => setNewPlaylistName(e.target.value)}
                    className="w-full bg-[var(--theme-surface)] border border-[var(--theme-border)] rounded-2xl py-3 px-4 text-[var(--theme-fg)] placeholder:text-[var(--theme-muted)]/50 text-sm focus:outline-none focus:border-[var(--theme-accent)] focus:ring-1 focus:ring-[var(--theme-accent)] transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--theme-muted)] uppercase tracking-wider mb-2">Description (Optional)</label>
                  <textarea
                    placeholder="What is this playlist about?"
                    value={newPlaylistDesc}
                    onChange={(e) => setNewPlaylistDesc(e.target.value)}
                    rows={3}
                    className="w-full bg-[var(--theme-surface)] border border-[var(--theme-border)] rounded-2xl py-3 px-4 text-[var(--theme-fg)] placeholder:text-[var(--theme-muted)]/50 text-sm focus:outline-none focus:border-[var(--theme-accent)] focus:ring-1 focus:ring-[var(--theme-accent)] transition resize-none"
                  />
                </div>

                <div className="flex gap-3 mt-auto pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1 py-3 border border-[var(--theme-border)] text-[var(--theme-fg)] font-bold rounded-full hover:bg-[var(--theme-surface)] active:scale-98 transition text-sm cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={!newPlaylistName.trim()}
                    className="flex-1 py-3 bg-[var(--theme-accent-bg)] hover:opacity-90 disabled:opacity-50 text-[var(--theme-accent-fg)] font-bold rounded-full active:scale-98 transition text-sm cursor-pointer shadow-md"
                  >
                    Create & Add
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
