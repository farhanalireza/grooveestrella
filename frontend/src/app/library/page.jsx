// src/app/library/page.jsx
"use client";

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Music, Disc, Users, Heart, FolderHeart, Trash2, ArrowRight, 
  Plus, UploadCloud, ChevronLeft, ChevronRight, Layers, 
  LayoutGrid, List, Sparkles, ExternalLink 
} from 'lucide-react';
import { toast } from '@/lib/toast';
import ImportPlaylistModal from '@/Components/ImportPlaylistModal';
import PlaylistCover from '@/Components/PlaylistCover';

export default function LibraryPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('songs');
  const [viewMode, setViewMode] = useState('slider'); // 'slider' | 'grid' | 'list'
  const [sliderIndex, setSliderIndex] = useState(0);

  const [songs, setSongs] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [artists, setArtists] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [customPlaylists, setCustomPlaylists] = useState([]);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [newPlName, setNewPlName] = useState('');
  const [newPlDesc, setNewPlDesc] = useState('');

  useEffect(() => {
    setSongs(JSON.parse(localStorage.getItem('savedSongs') || '[]'));
    setAlbums(JSON.parse(localStorage.getItem('savedAlbums') || '[]'));
    setArtists(JSON.parse(localStorage.getItem('savedArtists') || '[]'));
    setPlaylists(JSON.parse(localStorage.getItem('savedPlaylists') || '[]'));
    setCustomPlaylists(JSON.parse(localStorage.getItem('customPlaylists') || '[]'));

    const savedView = localStorage.getItem('groove_library_view_mode');
    if (savedView === 'slider' || savedView === 'grid' || savedView === 'list') {
      setViewMode(savedView);
    }
  }, []);

  const handleChangeViewMode = (mode) => {
    setViewMode(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('groove_library_view_mode', mode);
    }
  };

  // Reset slider index whenever active tab changes
  useEffect(() => {
    setSliderIndex(0);
  }, [activeTab]);

  const handleClearItem = (key, id, listSetter) => {
    let storageKey = '';
    let itemTitle = 'Item';
    if (key === 'songs') {
      storageKey = 'savedSongs';
    } else if (key === 'albums') {
      storageKey = 'savedAlbums';
    } else if (key === 'artists') {
      storageKey = 'savedArtists';
    } else if (key === 'playlists') {
      storageKey = 'savedPlaylists';
    }

    const items = JSON.parse(localStorage.getItem(storageKey) || '[]');
    const target = items.find(item => {
      if (key === 'songs') return item.trackId === id || item.trackURI === id || item.id === id;
      return item.id === id;
    });
    if (target) {
      itemTitle = target.title || target.name || 'Item';
    }

    const updated = items.filter(item => {
      if (key === 'songs') return item.trackId !== id && item.trackURI !== id && item.id !== id;
      return item.id !== id;
    });
    localStorage.setItem(storageKey, JSON.stringify(updated));
    listSetter(updated);
    setSliderIndex((prev) => Math.max(0, Math.min(prev, updated.length - 1)));
    toast.info(`"${itemTitle}" removed from library.`);
  };

  const handleDeleteCustomPlaylist = (id) => {
    const savedCustom = JSON.parse(localStorage.getItem('customPlaylists') || '[]');
    const target = savedCustom.find(p => p.id === id);
    const title = target ? target.name : 'Playlist';
    
    const updated = savedCustom.filter(p => p.id !== id);
    localStorage.setItem('customPlaylists', JSON.stringify(updated));
    setCustomPlaylists(updated);
    const remainingCount = updated.length + playlists.length;
    setSliderIndex((prev) => Math.max(0, Math.min(prev, remainingCount - 1)));
    toast.info(`"${title}" deleted.`);
  };

  // Combined playlist items for playlists tab
  const allPlaylists = useMemo(() => {
    const custom = customPlaylists.map(p => ({ ...p, isCustom: true }));
    const bookmarked = playlists.map(p => ({ ...p, isCustom: false }));
    return [...custom, ...bookmarked];
  }, [customPlaylists, playlists]);

  // Current list based on active tab
  const currentList = useMemo(() => {
    if (activeTab === 'songs') return songs;
    if (activeTab === 'albums') return albums;
    if (activeTab === 'artists') return artists;
    if (activeTab === 'playlists') return allPlaylists;
    return [];
  }, [activeTab, songs, albums, artists, allPlaylists]);

  // Keyboard navigation for slider
  useEffect(() => {
    if (viewMode !== 'slider') return;
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        setSliderIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowRight') {
        setSliderIndex((prev) => Math.min(currentList.length - 1, prev + 1));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode, currentList.length]);

  const tabs = [
    { id: 'songs', label: 'Songs', count: songs.length, icon: Music },
    { id: 'albums', label: 'Albums', count: albums.length, icon: Disc },
    { id: 'artists', label: 'Artists', count: artists.length, icon: Users },
    { id: 'playlists', label: 'Playlists', count: allPlaylists.length, icon: Heart }
  ];

  // Helper functions to normalize item properties across types
  const getItemTitle = (item) => {
    return item?.title || item?.name || 'Untitled';
  };

  const getItemSubtitle = (item) => {
    if (activeTab === 'songs') {
      if (Array.isArray(item.artist)) return item.artist.map(a => a.name).join(', ');
      return item.artist || 'Unknown Artist';
    }
    if (activeTab === 'albums') {
      if (Array.isArray(item.artist)) return item.artist.map(a => a.name).join(', ');
      return item.artist || 'Various Artists';
    }
    if (activeTab === 'artists') {
      return item.country ? `Artist · ${item.country}` : 'Artist Profile';
    }
    if (activeTab === 'playlists') {
      if (item.isCustom) {
        return `${item.tracks?.total || item.tracks?.items?.length || 0} songs · Custom Playlist`;
      }
      return `By ${item.owner || 'Spotify'}`;
    }
    return '';
  };

  const getItemImage = (item) => {
    return item?.image || item?.images?.[0]?.url || item?.coverArt || item?.url || 'https://placehold.co/400x400/17020B/E8A87C?text=Groove';
  };

  const getItemMeta = (item) => {
    if (activeTab === 'songs') {
      return item.release_date || (item.popularity ? `Score: ${item.popularity}` : null);
    }
    if (activeTab === 'albums') {
      return item.tracksCount ? `${item.tracksCount} tracks` : (item.release_date ? new Date(item.release_date).getFullYear() : null);
    }
    if (activeTab === 'artists') {
      return item.followers ? `${item.followers.toLocaleString()} followers` : null;
    }
    if (activeTab === 'playlists') {
      return item.isCustom ? 'Custom Playlist' : 'Bookmarked Spotify Playlist';
    }
    return null;
  };

  const openItem = (item) => {
    if (!item) return;
    if (activeTab === 'songs') {
      const trackTarget = item.trackId || item.id;
      if (trackTarget) router.push(`/track/${trackTarget}`);
    } else if (activeTab === 'albums') {
      if (item.id) router.push(`/album/${item.id}`);
    } else if (activeTab === 'artists') {
      if (item.id) router.push(`/artist/${item.id}`);
    } else if (activeTab === 'playlists') {
      if (item.id) router.push(`/playlist/${item.id}`);
    }
  };

  const deleteItem = (item) => {
    if (!item) return;
    if (activeTab === 'songs') {
      handleClearItem('songs', item.trackId || item.trackURI || item.id, setSongs);
    } else if (activeTab === 'albums') {
      handleClearItem('albums', item.id, setAlbums);
    } else if (activeTab === 'artists') {
      handleClearItem('artists', item.id, setArtists);
    } else if (activeTab === 'playlists') {
      if (item.isCustom) {
        handleDeleteCustomPlaylist(item.id);
      } else {
        handleClearItem('playlists', item.id, setPlaylists);
      }
    }
  };

  const getActionLabel = () => {
    if (activeTab === 'songs') return 'View Track';
    if (activeTab === 'albums') return 'View Album';
    if (activeTab === 'artists') return 'View Artist';
    if (activeTab === 'playlists') return 'Open Playlist';
    return 'View';
  };

  const currentSliderItem = currentList[sliderIndex] || null;

  return (
    <div className="min-h-screen bg-[var(--theme-bg)] text-[var(--theme-fg)] p-4 sm:p-6 pb-28 md:pl-20 md:pr-20 lg:pl-40 lg:pr-40 pt-8 sm:pt-12 transition-colors duration-300">
      {/* Title */}
      <div className="flex items-center gap-3 mb-6 sm:mb-8">
        <FolderHeart className="w-8 h-8 text-[var(--theme-accent)]" />
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Your Library Collection</h1>
      </div>

      {/* Library Statistics Panel */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8">
        <div className="bg-[var(--theme-card)]/80 backdrop-blur-xl border border-[var(--theme-border)] rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between shadow-md">
          <div className="flex items-center justify-between text-[var(--theme-muted)] mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider">Tracks</span>
            <Music size={15} />
          </div>
          <span className="text-xl sm:text-2xl font-extrabold text-[var(--theme-fg)]">{songs.length}</span>
        </div>
        <div className="bg-[var(--theme-card)]/80 backdrop-blur-xl border border-[var(--theme-border)] rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between shadow-md">
          <div className="flex items-center justify-between text-[var(--theme-muted)] mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider">Albums</span>
            <Disc size={15} />
          </div>
          <span className="text-xl sm:text-2xl font-extrabold text-[var(--theme-fg)]">{albums.length}</span>
        </div>
        <div className="bg-[var(--theme-card)]/80 backdrop-blur-xl border border-[var(--theme-border)] rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between shadow-md">
          <div className="flex items-center justify-between text-[var(--theme-muted)] mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider">Artists</span>
            <Users size={15} />
          </div>
          <span className="text-xl sm:text-2xl font-extrabold text-[var(--theme-fg)]">{artists.length}</span>
        </div>
        <div className="bg-[var(--theme-card)]/80 backdrop-blur-xl border border-[var(--theme-border)] rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between shadow-md">
          <div className="flex items-center justify-between text-[var(--theme-muted)] mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider">Playlists</span>
            <Heart size={15} />
          </div>
          <span className="text-xl sm:text-2xl font-extrabold text-[var(--theme-fg)]">{allPlaylists.length}</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-6 border-b border-[var(--theme-border)]">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full font-semibold text-xs sm:text-sm whitespace-nowrap transition-all duration-300 cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-[var(--theme-accent)] text-[var(--theme-accent-fg)] shadow-md font-bold'
                  : 'bg-[var(--theme-surface)] text-[var(--theme-muted)] hover:bg-[var(--theme-card)] hover:text-[var(--theme-fg)]'
              }`}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                activeTab === tab.id ? 'bg-black/15 text-[var(--theme-accent-fg)]' : 'bg-[var(--theme-card)] text-[var(--theme-muted)]'
              }`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* View Options Switcher: Slider (Deck of Cards) | Grid Box | List */}
      <div className="flex items-center justify-between gap-3 mb-8 flex-wrap">
        {/* If playlists tab, display Create and Import buttons */}
        {activeTab === 'playlists' ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[var(--theme-surface)] hover:bg-[var(--theme-card)] text-[var(--theme-fg)] border border-[var(--theme-border)] font-bold text-xs rounded-full transition active:scale-95 shadow-sm cursor-pointer"
              title="Import playlist from file"
            >
              <UploadCloud size={14} />
              <span>Import</span>
            </button>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[var(--theme-accent)] hover:opacity-90 text-[var(--theme-accent-fg)] font-bold text-xs rounded-full transition active:scale-95 shadow-md cursor-pointer"
            >
              <Plus size={14} />
              <span>Create</span>
            </button>
          </div>
        ) : (
          <div className="text-xs font-bold uppercase tracking-wider text-[var(--theme-muted)]">
            Explore {activeTab}
          </div>
        )}

        {/* View Mode Segmented Control */}
        <div className="flex items-center gap-1 p-1 bg-[var(--theme-surface)] border border-[var(--theme-border)] rounded-full shadow-inner ml-auto">
          <button
            onClick={() => handleChangeViewMode('slider')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
              viewMode === 'slider'
                ? 'bg-[var(--theme-accent)] text-[var(--theme-accent-fg)] shadow-sm'
                : 'text-[var(--theme-muted)] hover:text-[var(--theme-fg)]'
            }`}
            title="Deck of Cards Slider (takes full available space, 1 by 1)"
          >
            <Layers size={13} />
            <span>Slider</span>
          </button>

          <button
            onClick={() => handleChangeViewMode('grid')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
              viewMode === 'grid'
                ? 'bg-[var(--theme-accent)] text-[var(--theme-accent-fg)] shadow-sm'
                : 'text-[var(--theme-muted)] hover:text-[var(--theme-fg)]'
            }`}
            title="Grid Box format (1 item in 1 row)"
          >
            <LayoutGrid size={13} />
            <span>Grid</span>
          </button>

          <button
            onClick={() => handleChangeViewMode('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
              viewMode === 'list'
                ? 'bg-[var(--theme-accent)] text-[var(--theme-accent-fg)] shadow-sm'
                : 'text-[var(--theme-muted)] hover:text-[var(--theme-fg)]'
            }`}
            title="Compact List format (1 item in 1 row)"
          >
            <List size={13} />
            <span>List</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div>
        {currentList.length === 0 ? (
          <EmptyState type={activeTab} />
        ) : (
          <>
            {/* VIEW MODE 1: SLIDER (DECK OF CARDS, takes whole available space, 1 by 1) */}
            {viewMode === 'slider' && currentSliderItem && (
              <div className="w-full max-w-lg mx-auto flex flex-col items-center">
                {/* Header row: category badge + card counter */}
                <div className="w-full flex items-center justify-between mb-3 px-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-[var(--theme-accent)] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[var(--theme-accent)]" />
                    <span>{activeTab.slice(0, -1)} Deck</span>
                  </span>
                  <span className="text-xs font-mono font-bold text-[var(--theme-muted)] bg-[var(--theme-surface)] px-2.5 py-0.5 rounded-full border border-[var(--theme-border)] shadow-inner">
                    {sliderIndex + 1} / {currentList.length}
                  </span>
                </div>

                {/* Deck Card */}
                <div className="relative w-full bg-[var(--theme-card)]/90 backdrop-blur-2xl border border-[var(--theme-border)] rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center overflow-hidden transition-all duration-300">
                  {/* Subtle Ambient Art Glow Backdrop */}
                  <div 
                    className="absolute inset-0 bg-cover bg-center blur-3xl opacity-20 dark:opacity-15 pointer-events-none scale-125 transition-all duration-700"
                    style={{ backgroundImage: `url(${getItemImage(currentSliderItem)})` }}
                  />

                  {/* Artwork / Media Cover */}
                  <div 
                    onClick={() => openItem(currentSliderItem)}
                    className="relative z-10 w-60 h-60 sm:w-72 sm:h-72 aspect-square rounded-2xl overflow-hidden shadow-2xl border border-[var(--theme-border)] group cursor-pointer"
                  >
                    {activeTab === 'playlists' && currentSliderItem.isCustom ? (
                      <PlaylistCover 
                        tracks={currentSliderItem.tracks?.items || []} 
                        name={currentSliderItem.name} 
                        defaultCover={currentSliderItem.image} 
                      />
                    ) : (
                      <img 
                        src={getItemImage(currentSliderItem)} 
                        alt={getItemTitle(currentSliderItem)} 
                        className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${activeTab === 'artists' ? 'rounded-full' : ''}`}
                        onError={(e) => { e.currentTarget.src = 'https://placehold.co/500x500/17020B/E8A87C?text=Groove'; }}
                      />
                    )}
                  </div>

                  {/* Item Details */}
                  <div className="relative z-10 mt-6 w-full">
                    <h2 
                      onClick={() => openItem(currentSliderItem)}
                      className="text-xl sm:text-2xl font-black text-[var(--theme-fg)] truncate tracking-tight hover:text-[var(--theme-accent)] transition cursor-pointer"
                    >
                      {getItemTitle(currentSliderItem)}
                    </h2>
                    <p className="text-sm font-semibold text-[var(--theme-accent)] truncate mt-1">
                      {getItemSubtitle(currentSliderItem)}
                    </p>
                    {getItemMeta(currentSliderItem) && (
                      <p className="text-xs text-[var(--theme-muted)] font-medium mt-1">
                        {getItemMeta(currentSliderItem)}
                      </p>
                    )}
                  </div>

                  {/* Card Action Controls */}
                  <div className="relative z-10 mt-6 w-full flex items-center justify-center gap-3 pt-4 border-t border-[var(--theme-border)]/60">
                    <button
                      onClick={() => openItem(currentSliderItem)}
                      className="flex-1 py-3 px-5 bg-[var(--theme-accent)] hover:opacity-95 text-[var(--theme-accent-fg)] font-bold text-xs sm:text-sm rounded-full transition shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                    >
                      <span>{getActionLabel()}</span>
                      <ArrowRight size={15} />
                    </button>

                    <button
                      onClick={() => deleteItem(currentSliderItem)}
                      className="p-3 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition cursor-pointer active:scale-95 shrink-0"
                      title="Remove from Library"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Slider Navigation Bar */}
                <div className="w-full flex items-center justify-between gap-4 mt-6 px-4">
                  <button
                    onClick={() => setSliderIndex((prev) => Math.max(0, prev - 1))}
                    disabled={sliderIndex === 0}
                    className="w-12 h-12 rounded-full aspect-square bg-[var(--theme-card)] border border-[var(--theme-border)] text-[var(--theme-fg)] flex items-center justify-center hover:bg-[var(--theme-surface)] active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition shadow-md cursor-pointer"
                    title="Previous Card (← Arrow Left)"
                  >
                    <ChevronLeft size={20} />
                  </button>

                  {/* Progress dots indicator */}
                  <div className="flex items-center gap-1.5 flex-wrap justify-center max-w-[200px]">
                    {Array.from({ length: Math.min(currentList.length, 7) }).map((_, dotIdx) => {
                      const isActive = (dotIdx === sliderIndex) || (dotIdx === 6 && sliderIndex >= 6);
                      return (
                        <span
                          key={dotIdx}
                          className={`h-2 rounded-full transition-all duration-300 ${
                            isActive ? 'w-6 bg-[var(--theme-accent)]' : 'w-2 bg-[var(--theme-border)]'
                          }`}
                        />
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setSliderIndex((prev) => Math.min(currentList.length - 1, prev + 1))}
                    disabled={sliderIndex >= currentList.length - 1}
                    className="w-12 h-12 rounded-full aspect-square bg-[var(--theme-card)] border border-[var(--theme-border)] text-[var(--theme-fg)] flex items-center justify-center hover:bg-[var(--theme-surface)] active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition shadow-md cursor-pointer"
                    title="Next Card (→ Arrow Right)"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            )}

            {/* VIEW MODE 2: GRID (1 in 1 row box format) */}
            {viewMode === 'grid' && (
              <div className="flex flex-col gap-4 max-w-xl mx-auto w-full">
                {currentList.map((item, idx) => (
                  <div
                    key={item.id || item.trackId || idx}
                    className="group bg-[var(--theme-card)]/80 hover:bg-[var(--theme-card)] border border-[var(--theme-border)] hover:border-[var(--theme-accent)]/40 rounded-3xl p-4 sm:p-5 shadow-md transition duration-300 flex flex-col sm:flex-row items-center gap-4 sm:gap-5"
                  >
                    <div 
                      onClick={() => openItem(item)}
                      className="w-28 h-28 sm:w-32 sm:h-32 aspect-square rounded-2xl overflow-hidden border border-[var(--theme-border)] shrink-0 shadow-sm cursor-pointer"
                    >
                      {activeTab === 'playlists' && item.isCustom ? (
                        <PlaylistCover 
                          tracks={item.tracks?.items || []} 
                          name={item.name} 
                          defaultCover={item.image} 
                        />
                      ) : (
                        <img
                          src={getItemImage(item)}
                          alt={getItemTitle(item)}
                          className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${activeTab === 'artists' ? 'rounded-full' : ''}`}
                          onError={(e) => { e.currentTarget.src = 'https://placehold.co/400x400/17020B/E8A87C?text=Groove'; }}
                        />
                      )}
                    </div>

                    <div className="flex-1 min-w-0 text-center sm:text-left">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--theme-accent)] bg-[var(--theme-surface)] px-2 py-0.5 rounded-full border border-[var(--theme-border)]">
                        {activeTab.slice(0, -1)}
                      </span>
                      <h3
                        onClick={() => openItem(item)}
                        className="text-base sm:text-lg font-bold text-[var(--theme-fg)] group-hover:text-[var(--theme-accent)] transition truncate mt-1.5 cursor-pointer"
                      >
                        {getItemTitle(item)}
                      </h3>
                      <p className="text-xs sm:text-sm text-[var(--theme-muted)] truncate mt-0.5">
                        {getItemSubtitle(item)}
                      </p>
                      {getItemMeta(item) && (
                        <p className="text-[11px] text-[var(--theme-muted)] mt-1 font-mono">
                          {getItemMeta(item)}
                        </p>
                      )}
                    </div>

                    <div className="flex sm:flex-col items-center justify-end gap-2 shrink-0 border-t sm:border-t-0 sm:border-l border-[var(--theme-border)] pt-3 sm:pt-0 sm:pl-4 w-full sm:w-auto">
                      <button
                        onClick={() => openItem(item)}
                        className="flex-1 sm:flex-none px-4 py-2 bg-[var(--theme-accent)] text-[var(--theme-accent-fg)] font-bold text-xs rounded-full hover:opacity-90 transition cursor-pointer flex items-center justify-center gap-1 shadow-sm active:scale-95"
                      >
                        <span>{getActionLabel()}</span>
                        <ArrowRight size={12} />
                      </button>
                      <button
                        onClick={() => deleteItem(item)}
                        className="p-2 text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 rounded-xl transition cursor-pointer active:scale-95"
                        title="Remove from Library"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* VIEW MODE 3: LIST (1 in 1 row compact format) */}
            {viewMode === 'list' && (
              <div className="flex flex-col gap-2 max-w-2xl mx-auto w-full">
                {currentList.map((item, idx) => (
                  <div
                    key={item.id || item.trackId || idx}
                    className="group bg-[var(--theme-card)]/50 hover:bg-[var(--theme-card)] border border-[var(--theme-border)] rounded-2xl p-2.5 sm:p-3 flex items-center justify-between gap-3 transition duration-150 cursor-pointer"
                    onClick={() => openItem(item)}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-12 h-12 rounded-xl aspect-square overflow-hidden border border-[var(--theme-border)] shrink-0 shadow-sm">
                        {activeTab === 'playlists' && item.isCustom ? (
                          <PlaylistCover 
                            tracks={item.tracks?.items || []} 
                            name={item.name} 
                            defaultCover={item.image} 
                          />
                        ) : (
                          <img
                            src={getItemImage(item)}
                            alt={getItemTitle(item)}
                            className={`w-full h-full object-cover ${activeTab === 'artists' ? 'rounded-full' : ''}`}
                            onError={(e) => { e.currentTarget.src = 'https://placehold.co/150x150/17020B/E8A87C?text=Groove'; }}
                          />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-bold text-[var(--theme-fg)] group-hover:text-[var(--theme-accent)] transition truncate">
                          {getItemTitle(item)}
                        </h4>
                        <p className="text-xs text-[var(--theme-muted)] truncate">
                          {getItemSubtitle(item)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => openItem(item)}
                        className="px-3 py-1.5 bg-[var(--theme-accent)] text-[var(--theme-accent-fg)] font-bold text-xs rounded-full hover:opacity-90 transition cursor-pointer flex items-center gap-1 shadow-sm active:scale-95"
                      >
                        <span>Open</span>
                        <ArrowRight size={12} />
                      </button>
                      <button
                        onClick={() => deleteItem(item)}
                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition cursor-pointer active:scale-95"
                        title="Remove from Library"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Playlist Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="absolute inset-0" onClick={() => setIsCreateModalOpen(false)} />
          <div className="relative max-w-sm w-full bg-[var(--theme-card)] border border-[var(--theme-border)] rounded-3xl shadow-2xl p-6 z-10 text-[var(--theme-fg)]">
            <h3 className="text-lg font-bold text-[var(--theme-fg)] mb-4">Create Custom Playlist</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (!newPlName.trim()) return;
              const savedPls = JSON.parse(localStorage.getItem('customPlaylists') || '[]');
              const newPl = {
                id: `custom-${Date.now()}`,
                name: newPlName.trim(),
                title: newPlName.trim(),
                description: newPlDesc.trim() || 'Custom playlist created on GrooveEstrella.',
                image: 'https://placehold.co/150x150?text=Custom+Playlist',
                images: [{ url: 'https://placehold.co/150x150?text=Custom+Playlist' }],
                owner: { display_name: localStorage.getItem('userName') || 'You' },
                tracks: { total: 0, items: [] }
              };
              savedPls.push(newPl);
              localStorage.setItem('customPlaylists', JSON.stringify(savedPls));
              setCustomPlaylists(savedPls);
              setIsCreateModalOpen(false);
              setNewPlName('');
              setNewPlDesc('');
              toast.success(`Created playlist "${newPl.name}"! 🎉`);
            }} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-[var(--theme-muted)] uppercase tracking-wider mb-2">Playlist Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chill Beats"
                  value={newPlName}
                  onChange={(e) => setNewPlName(e.target.value)}
                  className="w-full bg-[var(--theme-surface)] border border-[var(--theme-border)] rounded-2xl py-3 px-4 text-[var(--theme-fg)] placeholder:text-[var(--theme-muted)]/50 text-sm focus:outline-none focus:border-[var(--theme-accent)] focus:ring-1 focus:ring-[var(--theme-accent)] transition"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[var(--theme-muted)] uppercase tracking-wider mb-2">Description (Optional)</label>
                <textarea
                  placeholder="Tell us about this playlist..."
                  value={newPlDesc}
                  onChange={(e) => setNewPlDesc(e.target.value)}
                  rows={3}
                  className="w-full bg-[var(--theme-surface)] border border-[var(--theme-border)] rounded-2xl py-3 px-4 text-[var(--theme-fg)] placeholder:text-[var(--theme-muted)]/50 text-sm focus:outline-none focus:border-[var(--theme-accent)] focus:ring-1 focus:ring-[var(--theme-accent)] transition resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 py-2.5 border border-[var(--theme-border)] text-[var(--theme-fg)] font-bold rounded-full hover:bg-[var(--theme-surface)] transition text-sm cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[var(--theme-accent)] hover:opacity-90 text-[var(--theme-accent-fg)] font-bold rounded-full transition text-sm cursor-pointer"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Playlist Modal */}
      <ImportPlaylistModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onPlaylistImported={(imported) => {
          setCustomPlaylists((prev) => [imported, ...prev]);
        }}
      />
    </div>
  );
}

function EmptyState({ type }) {
  return (
    <div className="text-center py-20 bg-[var(--theme-card)]/80 border border-[var(--theme-border)] rounded-3xl p-8 max-w-md mx-auto">
      <FolderHeart className="w-12 h-12 text-[var(--theme-muted)] mx-auto mb-4" />
      <h3 className="text-lg font-bold text-[var(--theme-fg)] mb-2">No Saved {type.charAt(0).toUpperCase() + type.slice(1)}</h3>
      <p className="text-sm text-[var(--theme-muted)] mb-6 leading-relaxed">
        Items you bookmark while discovering new music will be collected here.
      </p>
      <Link href="/" className="inline-flex items-center px-6 py-2.5 bg-[var(--theme-accent)] text-[var(--theme-accent-fg)] font-bold text-sm rounded-full hover:scale-105 active:scale-95 transition-all shadow-md">
        Start Exploring
      </Link>
    </div>
  );
}
