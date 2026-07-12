// src/Components/PlaylistPickerModal.jsx
"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, ListMusic, ChevronRight, FolderHeart } from 'lucide-react';
import { toast } from 'react-toastify';

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

  const handleAddToPlaylist = (playlistId) => {
    if (!track) return;
    
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
      item => item.track?.id === track.trackId || item.track?.external_urls?.spotify === track.spoURL
    );
    
    if (exists) {
      toast.info(`"${track.title}" is already in "${playlist.name}".`);
      handleClose();
      return;
    }
    
    // Construct the new track item in standard format
    const newTrackItem = {
      added_at: new Date().toISOString(),
      track: {
        id: track.trackId || `local-${Date.now()}`,
        name: track.title,
        artists: Array.isArray(track.artist) ? track.artist : [{ name: track.artist }],
        external_urls: { spotify: track.spoURL || '' },
        album: {
          images: track.image ? [{ url: track.image }] : []
        }
      }
    };
    
    playlist.tracks.items.push(newTrackItem);
    playlist.tracks.total = playlist.tracks.items.length;
    
    // Auto-update playlist cover image if it was a placeholder or empty
    const isPlaceholder = !playlist.image || 
                          playlist.image.includes('placeholder') || 
                          playlist.image.includes('placehold.co');
    if (isPlaceholder && track.image) {
      playlist.image = track.image;
      playlist.images = [{ url: track.image }];
    }
    
    playlists[playlistIndex] = playlist;
    localStorage.setItem('customPlaylists', JSON.stringify(playlists));
    
    toast.success(`Added "${track.title}" to "${playlist.name}"! 🎵`);
    handleClose();
  };

  const handleCreateAndAdd = (e) => {
    e.preventDefault();
    if (!newPlaylistName.trim() || !track) return;
    
    const playlists = JSON.parse(localStorage.getItem('customPlaylists') || '[]');
    
    const newPlaylistId = `custom-${Date.now()}`;
    const userName = localStorage.getItem('userName') || 'You';
    
    const newPlaylist = {
      id: newPlaylistId,
      name: newPlaylistName.trim(),
      title: newPlaylistName.trim(),
      description: newPlaylistDesc.trim() || 'Custom playlist created on GrooveEstrella.',
      image: track.image || 'https://placehold.co/150x150?text=Custom+Playlist',
      images: [{ url: track.image || 'https://placehold.co/150x150?text=Custom+Playlist' }],
      owner: { display_name: userName },
      tracks: {
        total: 1,
        items: [
          {
            added_at: new Date().toISOString(),
            track: {
              id: track.trackId || `local-${Date.now()}`,
              name: track.title,
              artists: Array.isArray(track.artist) ? track.artist : [{ name: track.artist }],
              external_urls: { spotify: track.spoURL || '' },
              album: {
                images: track.image ? [{ url: track.image }] : []
              }
            }
          }
        ]
      }
    };
    
    playlists.push(newPlaylist);
    localStorage.setItem('customPlaylists', JSON.stringify(playlists));
    
    toast.success(`Created "${newPlaylist.name}" and added "${track.title}"! 🎉`);
    handleClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#07090F]/90 backdrop-blur-sm px-4">
          {/* Backdrop click closes modal */}
          <div className="absolute inset-0" onClick={handleClose} />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="relative max-w-md w-full bg-[#10141F] border border-[#2563EB]/15 rounded-3xl shadow-2xl p-6 overflow-hidden z-10 flex flex-col max-h-[85vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <ListMusic className="w-5 h-5 text-[#60A5FA]" />
                <h3 className="text-lg font-bold text-[#F4F7FF]">Add to Playlist</h3>
              </div>
              <button 
                onClick={handleClose}
                className="p-1 text-[#8992A5] hover:text-[#F4F7FF] rounded-lg hover:bg-[#2563EB]/10 transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Track Mini Card */}
            {track && (
              <div className="flex items-center gap-3 p-3 bg-white/[0.03] rounded-2xl mb-5 border border-[#2563EB]/10">
                <img 
                  src={track.image || 'https://placehold.co/80x80?text=Cover'} 
                  alt={track.title} 
                  className="w-12 h-12 rounded-xl object-cover"
                />
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-sm text-[#F4F7FF] truncate">{track.title}</h4>
                  <p className="text-xs text-[#8992A5] truncate">
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
                    <div className="flex flex-col items-center justify-center text-center p-8 bg-[#10141F]/70 rounded-2xl border border-[#2563EB]/10 flex-1">
                      <FolderHeart className="w-10 h-10 text-zinc-600 mb-2" />
                      <p className="text-sm font-semibold text-[#8992A5] mb-1">No custom playlists yet</p>
                      <p className="text-xs text-[#8992A5]/70 max-w-[200px]">Create your first custom playlist to save this track!</p>
                    </div>
                  ) : (
                    customPlaylists.map(pl => (
                      <button
                        key={pl.id}
                        onClick={() => handleAddToPlaylist(pl.id)}
                        className="flex items-center gap-3 p-3 w-full bg-[#10141F]/70 hover:bg-[#2563EB]/10 rounded-2xl border border-[#2563EB]/10 hover:border-[#60A5FA]/30 text-left transition duration-200 group"
                      >
                        <img 
                          src={pl.image || 'https://placehold.co/80x80?text=Playlist'} 
                          alt={pl.name} 
                          className="w-10 h-10 rounded-xl object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <h5 className="font-bold text-sm text-[#F4F7FF] truncate group-hover:text-[#60A5FA] transition">{pl.name}</h5>
                          <p className="text-xs text-[#8992A5]/70 font-medium">
                            {pl.tracks?.total || 0} {pl.tracks?.total === 1 ? 'track' : 'tracks'}
                          </p>
                        </div>
                        <ChevronRight size={16} className="text-[#8992A5]/70 group-hover:text-[#60A5FA] transition" />
                      </button>
                    ))
                  )}
                </div>

                {/* Create Playlist Toggle Button */}
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-[#2563EB] hover:bg-[#2563EB]/80 text-[#F4F7FF] font-bold rounded-full transition active:scale-98 text-sm cursor-pointer"
                >
                  <Plus size={16} />
                  Create New Playlist
                </button>
              </>
            ) : (
              /* Create Playlist Form */
              <form onSubmit={handleCreateAndAdd} className="flex flex-col gap-4 flex-1">
                <div>
                  <label className="block text-xs font-bold text-[#8992A5] uppercase tracking-wider mb-2">Playlist Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Chill Vibes, Workout Mix"
                    value={newPlaylistName}
                    onChange={(e) => setNewPlaylistName(e.target.value)}
                    className="w-full bg-[#07090F] border border-[#2563EB]/15 rounded-2xl py-3 px-4 text-[#F4F7FF] text-sm focus:outline-none focus:border-[#60A5FA] focus:ring-1 focus:ring-[#2563EB] transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#8992A5] uppercase tracking-wider mb-2">Description (Optional)</label>
                  <textarea
                    placeholder="What is this playlist about?"
                    value={newPlaylistDesc}
                    onChange={(e) => setNewPlaylistDesc(e.target.value)}
                    rows={3}
                    className="w-full bg-[#07090F] border border-[#2563EB]/15 rounded-2xl py-3 px-4 text-[#F4F7FF] text-sm focus:outline-none focus:border-[#60A5FA] focus:ring-1 focus:ring-[#2563EB] transition resize-none"
                  />
                </div>

                <div className="flex gap-3 mt-auto pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1 py-3 border border-[#2563EB]/15 text-[#F4F7FF] font-bold rounded-full hover:bg-[#2563EB]/10 active:scale-98 transition text-sm cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={!newPlaylistName.trim()}
                    className="flex-1 py-3 bg-[#2563EB] hover:bg-[#2563EB]/80 disabled:opacity-50 disabled:hover:bg-[#2563EB] text-[#F4F7FF] font-bold rounded-full active:scale-98 transition text-sm cursor-pointer"
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
