// src/app/account/page.jsx
"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Music, Heart, Disc, Users, User, Share2, 
  Sparkles, Settings, ArrowRight, Dice5, Edit3, Check, 
  X, Trash2, Download, MessageSquare, Plus, ExternalLink,
  ChevronRight, Bookmark
} from 'lucide-react';
import GrooveLoader from '@/Components/GrooveLoader';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { generateRandomName, getOrSetUserName } from '@/lib/nameGenerator';

const AVAILABLE_GENRES = [
  "Rock", "Pop", "Indie", "Electronic", "Hip Hop", 
  "Jazz", "Classical", "Alternative", "Metal", "R&B", 
  "Blues", "Folk", "Punk", "Ambient", "Soul", "Disco"
];

function UserDashboardContent() {
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState('');
  const [activeTab, setActiveTab] = useState('tracks'); // tracks | albums | artists | playlists | reviews | genres

  const [favoriteGenres, setFavoriteGenres] = useState([]);
  const [savedSongs, setSavedSongs] = useState([]);
  const [savedAlbums, setSavedAlbums] = useState([]);
  const [savedArtists, setSavedArtists] = useState([]);
  const [savedPlaylists, setSavedPlaylists] = useState([]);
  const [userReviews, setUserReviews] = useState([]);

  // Load all user data from localStorage
  const loadData = () => {
    if (typeof window === 'undefined') return;
    const currentName = getOrSetUserName();
    setUserName(currentName);
    setTempName(currentName);

    try {
      setFavoriteGenres(JSON.parse(localStorage.getItem('favoriteGenres') || '[]'));
    } catch (_) {
      setFavoriteGenres([]);
    }

    try {
      setSavedSongs(JSON.parse(localStorage.getItem('savedSongs') || '[]'));
    } catch (_) {
      setSavedSongs([]);
    }

    try {
      setSavedAlbums(JSON.parse(localStorage.getItem('savedAlbums') || '[]'));
    } catch (_) {
      setSavedAlbums([]);
    }

    try {
      setSavedArtists(JSON.parse(localStorage.getItem('savedArtists') || '[]'));
    } catch (_) {
      setSavedArtists([]);
    }

    try {
      setSavedPlaylists(JSON.parse(localStorage.getItem('savedPlaylists') || '[]'));
    } catch (_) {
      setSavedPlaylists([]);
    }

    // Collect all user reviews from localStorage
    try {
      const reviewsList = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('groove_reviews_')) {
          const raw = localStorage.getItem(key);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              parsed.forEach(rev => {
                // Include user-created reviews
                if (rev.id && rev.id.startsWith('usr-')) {
                  reviewsList.push({
                    ...rev,
                    itemId: key.replace('groove_reviews_', ''),
                  });
                }
              });
            }
          }
        }
      }
      setUserReviews(reviewsList);
    } catch (_) {
      setUserReviews([]);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Roll a new random Adj + Noun combo
  const handleRollRandomName = () => {
    const newName = generateRandomName();
    setUserName(newName);
    setTempName(newName);
    localStorage.setItem('userName', newName);
    toast.success(`Generated aesthetic name: ${newName}! 🎲`);
  };

  // Save edited name
  const handleSaveName = () => {
    const finalName = tempName.trim() || generateRandomName();
    setUserName(finalName);
    localStorage.setItem('userName', finalName);
    setIsEditingName(false);
    toast.success(`Profile name updated to: ${finalName}! ✨`);
  };

  // Cancel edit name
  const handleCancelEdit = () => {
    setTempName(userName);
    setIsEditingName(false);
  };

  // Toggle favorite genre
  const handleToggleGenre = (genre) => {
    let updated;
    if (favoriteGenres.includes(genre)) {
      updated = favoriteGenres.filter(g => g !== genre);
    } else {
      updated = [...favoriteGenres, genre];
    }
    setFavoriteGenres(updated);
    localStorage.setItem('favoriteGenres', JSON.stringify(updated));
    toast.info(`Updated favorite genres.`);
  };

  // Remove saved song
  const handleRemoveSong = (trackUri, trackId, title) => {
    const updated = savedSongs.filter(s => s.trackURI !== trackUri && s.trackId !== trackId);
    setSavedSongs(updated);
    localStorage.setItem('savedSongs', JSON.stringify(updated));
    toast.info(`Removed "${title}" from saved tracks.`);
  };

  // Remove saved album
  const handleRemoveAlbum = (albumId, title) => {
    const updated = savedAlbums.filter(a => a.id !== albumId);
    setSavedAlbums(updated);
    localStorage.setItem('savedAlbums', JSON.stringify(updated));
    toast.info(`Removed "${title}" from saved albums.`);
  };

  // Remove saved artist
  const handleRemoveArtist = (artistId, name) => {
    const updated = savedArtists.filter(a => a.id !== artistId);
    setSavedArtists(updated);
    localStorage.setItem('savedArtists', JSON.stringify(updated));
    toast.info(`Removed "${name}" from saved artists.`);
  };

  // Delete custom playlist
  const handleDeletePlaylist = (playlistId, name) => {
    const updated = savedPlaylists.filter(p => p.id !== playlistId);
    setSavedPlaylists(updated);
    localStorage.setItem('savedPlaylists', JSON.stringify(updated));
    toast.info(`Deleted playlist "${name}".`);
  };

  // Export full user data as JSON
  const handleExportData = () => {
    const dataBackup = {
      user: {
        name: userName,
        favoriteGenres: favoriteGenres,
        exportedAt: new Date().toISOString()
      },
      library: {
        savedSongs,
        savedAlbums,
        savedArtists,
        savedPlaylists,
        userReviews
      }
    };

    const blob = new Blob([JSON.stringify(dataBackup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `groove_data_${userName.toLowerCase().replace(/\s+/g, '_')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Your library data was exported successfully! 📁');
  };

  const firstLetter = (userName || 'G').charAt(0).toUpperCase();
  const totalItems = savedSongs.length + savedAlbums.length + savedArtists.length + savedPlaylists.length;

  return (
    <div className='min-h-screen bg-[var(--theme-bg)] text-[var(--theme-fg)] relative overflow-hidden px-4 sm:px-6 md:px-12 lg:px-24 pt-10 pb-32'>
      {/* Blurry Backdrop Glow */}
      <div className="absolute top-0 left-0 right-0 h-[45vh] bg-[var(--theme-plum)]/20 rounded-full filter blur-[140px] pointer-events-none z-0" />
      
      <div className='relative z-10 w-full max-w-5xl mx-auto space-y-8'>
        
        {/* Profile Card with Adj+Noun Generator and Live Edit */}
        <div className='bg-[var(--theme-card)]/80 border border-[var(--theme-border)] backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-md'>
          <div className='flex flex-col sm:flex-row items-center sm:items-start gap-6'>
            {/* User Avatar */}
            <div className='relative flex-shrink-0'>
              <div className='w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-tr from-[var(--theme-plum)] to-[var(--theme-accent)] flex items-center justify-center text-4xl font-black text-[var(--theme-fg)] shadow-md border-2 border-[var(--theme-border)]'>
                {firstLetter}
              </div>
              <div className='absolute -bottom-1 -right-1 bg-[var(--theme-accent-bg)] p-2 rounded-full shadow-md text-[var(--theme-accent-fg)]'>
                <User className='w-4 h-4' />
              </div>
            </div>

            {/* Profile Info & Edit Controls */}
            <div className='flex-1 min-w-0 text-center sm:text-left flex flex-col justify-between'>
              <div>
                <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[var(--theme-border)] bg-[var(--theme-surface)] text-[var(--theme-accent)] text-[10px] font-bold tracking-widest uppercase">
                    <Sparkles className="w-3 h-3 text-[var(--theme-accent)]" />
                    <span>Music Layer • Citizen</span>
                  </span>
                </div>

                {/* Name Row: Editable or Display with Shuffle Button */}
                {isEditingName ? (
                  <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
                    <input
                      type="text"
                      value={tempName}
                      onChange={(e) => setTempName(e.target.value)}
                      placeholder="Enter username"
                      className="px-4 py-2 bg-[var(--theme-surface)] border border-[var(--theme-border)] rounded-xl text-lg sm:text-xl font-bold text-[var(--theme-fg)] outline-none focus:ring-1 focus:ring-[var(--theme-accent)]"
                      autoFocus
                    />
                    <button
                      onClick={handleSaveName}
                      className="p-2.5 rounded-xl bg-[var(--theme-accent-bg)] hover:opacity-90 text-[var(--theme-accent-fg)] font-bold transition cursor-pointer"
                      title="Save Name"
                    >
                      <Check size={18} />
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="p-2.5 rounded-xl bg-[var(--theme-surface)] hover:bg-[var(--theme-card)] text-[var(--theme-muted)] transition cursor-pointer"
                      title="Cancel"
                    >
                      <X size={18} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center sm:justify-start gap-3 mb-2 flex-wrap">
                    <h1 className='text-2xl sm:text-4xl font-extrabold text-[var(--theme-fg)] tracking-tight'>
                      {userName}
                    </h1>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setIsEditingName(true)}
                        className="p-2 rounded-xl bg-[var(--theme-surface)] hover:bg-[var(--theme-card)] text-[var(--theme-muted)] hover:text-[var(--theme-fg)] border border-[var(--theme-border)] transition cursor-pointer"
                        title="Edit Username"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        onClick={handleRollRandomName}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--theme-surface)] hover:bg-[var(--theme-card)] text-[var(--theme-accent)] border border-[var(--theme-border)] text-xs font-semibold transition cursor-pointer"
                        title="Generate a random Adjective + Noun name"
                      >
                        <Dice5 size={14} />
                        <span className="hidden sm:inline">Roll Name</span>
                      </button>
                    </div>
                  </div>
                )}

                <p className='text-xs sm:text-sm text-[var(--theme-muted)] mb-4'>
                  Custom Adjective + Noun identity. All your bookmarks, saved tracks, albums, artists, and reviews are stored securely on your device.
                </p>

                {/* Favorite Genres Pills */}
                <div className="flex flex-wrap justify-center sm:justify-start gap-1.5">
                  {favoriteGenres.length > 0 ? (
                    favoriteGenres.map((g, idx) => (
                      <span key={idx} className="px-2.5 py-0.5 rounded-full bg-[var(--theme-surface)] border border-[var(--theme-border)] text-[var(--theme-accent)] text-[11px] font-semibold">
                        #{g}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-[var(--theme-muted)]/60 italic">No favorite genres selected yet.</span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Data Export button */}
            <div className="flex sm:flex-col items-center gap-2 flex-shrink-0">
              <button
                onClick={handleExportData}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[var(--theme-surface)] hover:bg-[var(--theme-card)] border border-[var(--theme-border)] text-xs font-bold uppercase tracking-wider text-[var(--theme-fg)] transition cursor-pointer shadow-sm"
                title="Download complete library backup as JSON"
              >
                <Download size={14} className="text-[var(--theme-accent)]" />
                <span>Export Data</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className='grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4'>
          <div 
            onClick={() => setActiveTab('tracks')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              activeTab === 'tracks'
                ? 'bg-[var(--theme-surface)] border-[var(--theme-accent)]/50 shadow-md' 
                : 'bg-[var(--theme-card)]/80 border-[var(--theme-border)] hover:border-[var(--theme-accent)]/30'
            }`}
          >
            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--theme-muted)] mb-1">
              <Music size={14} className="text-[var(--theme-accent)]" />
              <span>Saved Tracks</span>
            </div>
            <div className="text-2xl font-black text-[var(--theme-fg)]">{savedSongs.length}</div>
          </div>

          <div 
            onClick={() => setActiveTab('albums')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              activeTab === 'albums' 
                ? 'bg-[var(--theme-surface)] border-[var(--theme-accent)]/50 shadow-md' 
                : 'bg-[var(--theme-card)]/80 border-[var(--theme-border)] hover:border-[var(--theme-accent)]/30'
            }`}
          >
            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--theme-muted)] mb-1">
              <Disc size={14} className="text-[var(--theme-accent)]" />
              <span>Saved Albums</span>
            </div>
            <div className="text-2xl font-black text-[var(--theme-fg)]">{savedAlbums.length}</div>
          </div>

          <div 
            onClick={() => setActiveTab('artists')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              activeTab === 'artists' 
                ? 'bg-[var(--theme-surface)] border-[var(--theme-accent)]/50 shadow-md' 
                : 'bg-[var(--theme-card)]/80 border-[var(--theme-border)] hover:border-[var(--theme-accent)]/30'
            }`}
          >
            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--theme-muted)] mb-1">
              <Users size={14} className="text-[var(--theme-accent)]" />
              <span>Saved Artists</span>
            </div>
            <div className="text-2xl font-black text-[var(--theme-fg)]">{savedArtists.length}</div>
          </div>

          <div 
            onClick={() => setActiveTab('reviews')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              activeTab === 'reviews' 
                ? 'bg-[var(--theme-surface)] border-[var(--theme-accent)]/50 shadow-md' 
                : 'bg-[var(--theme-card)]/80 border-[var(--theme-border)] hover:border-[var(--theme-accent)]/30'
            }`}
          >
            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--theme-muted)] mb-1">
              <MessageSquare size={14} className="text-[var(--theme-accent)]" />
              <span>My Reviews</span>
            </div>
            <div className="text-2xl font-black text-[var(--theme-fg)]">{userReviews.length}</div>
          </div>
        </div>

        {/* Tab Selector Navigation */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[var(--theme-border)] scrollbar-none">
          {[
            { id: 'tracks', label: `Saved Tracks (${savedSongs.length})` },
            { id: 'albums', label: `Saved Albums (${savedAlbums.length})` },
            { id: 'artists', label: `Saved Artists (${savedArtists.length})` },
            { id: 'playlists', label: `Playlists (${savedPlaylists.length})` },
            { id: 'reviews', label: `My Reviews (${userReviews.length})` },
            { id: 'genres', label: `Music Taste` },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-[var(--theme-accent-bg)] text-[var(--theme-accent-fg)] shadow-md font-bold'
                  : 'bg-[var(--theme-surface)] text-[var(--theme-muted)] hover:text-[var(--theme-fg)] border border-[var(--theme-border)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Saved Tracks */}
        {activeTab === 'tracks' && (
          <div className="space-y-3">
            {savedSongs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {savedSongs.map((song, idx) => {
                  const songId = song.trackId || (song.trackURI ? song.trackURI.split(':').pop() : null);
                  const artists = Array.isArray(song.artist) 
                    ? song.artist.map(a => a.name).join(', ') 
                    : song.artist || 'Unknown';
                  return (
                    <div 
                      key={song.trackURI || idx}
                      className="p-3.5 rounded-2xl bg-[var(--theme-card)]/80 border border-[var(--theme-border)] flex items-center justify-between gap-3 hover:border-[var(--theme-accent)]/30 transition group shadow-sm"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <img 
                          src={song.image || 'https://placehold.co/100x100/10141F/60A5FA?text=Track'} 
                          alt={song.title}
                          className="w-12 h-12 rounded-xl object-cover flex-shrink-0 bg-[var(--theme-surface)]"
                          onError={(e) => { e.currentTarget.src = 'https://placehold.co/100x100/10141F/60A5FA?text=Track'; }}
                        />
                        <div className="min-w-0 flex-1">
                          {songId ? (
                            <Link 
                              href={`/track/${songId}`}
                              className="text-sm font-bold text-[var(--theme-fg)] hover:text-[var(--theme-accent)] truncate block transition"
                            >
                              {song.title}
                            </Link>
                          ) : (
                            <span className="text-sm font-bold text-[var(--theme-fg)] truncate block">{song.title}</span>
                          )}
                          <p className="text-xs text-[var(--theme-muted)] truncate">{artists}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {songId && (
                          <Link 
                            href={`/track/${songId}`}
                            className="p-2 rounded-xl bg-[var(--theme-surface)] hover:bg-[var(--theme-card)] text-[var(--theme-muted)] hover:text-[var(--theme-fg)] transition"
                            title="View Track"
                          >
                            <ExternalLink size={14} />
                          </Link>
                        )}
                        <button
                          onClick={() => handleRemoveSong(song.trackURI, song.trackId, song.title)}
                          className="p-2 rounded-xl bg-[var(--theme-surface)] hover:bg-red-500/20 text-[var(--theme-muted)] hover:text-red-400 transition cursor-pointer"
                          title="Remove from Saved"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center p-12 rounded-3xl bg-[var(--theme-card)]/50 border border-[var(--theme-border)]">
                <Music size={32} className="mx-auto text-[var(--theme-muted)]/50 mb-3" />
                <h3 className="text-base font-bold text-[var(--theme-fg)] mb-1">No Saved Tracks</h3>
                <p className="text-xs text-[var(--theme-muted)] mb-4">You haven't bookmarked any tracks yet.</p>
                <Link 
                  href="/search"
                  className="px-4 py-2 rounded-xl bg-[var(--theme-accent-bg)] hover:opacity-90 text-[var(--theme-accent-fg)] text-xs font-bold uppercase tracking-wider inline-flex items-center gap-2 transition"
                >
                  Explore Catalog
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Saved Albums */}
        {activeTab === 'albums' && (
          <div className="space-y-3">
            {savedAlbums.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {savedAlbums.map((album, idx) => {
                  const albumId = album.id;
                  const artists = Array.isArray(album.artist) 
                    ? album.artist.map(a => a.name).join(', ') 
                    : Array.isArray(album.artists) 
                    ? album.artists.map(a => a.name).join(', ')
                    : album.artist || 'Various Artists';
                  return (
                    <div 
                      key={album.id || idx}
                      className="p-3 rounded-2xl bg-[var(--theme-card)]/80 border border-[var(--theme-border)] flex flex-col justify-between hover:border-[var(--theme-accent)]/30 transition group shadow-sm"
                    >
                      <div className="relative aspect-square w-full rounded-xl overflow-hidden mb-3 bg-[var(--theme-surface)]">
                        <img 
                          src={album.image || 'https://placehold.co/300x300/10141F/60A5FA?text=Album'} 
                          alt={album.title || album.name}
                          className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                          onError={(e) => { e.currentTarget.src = 'https://placehold.co/300x300/10141F/60A5FA?text=Album'; }}
                        />
                      </div>
                      <div className="mb-2">
                        {albumId ? (
                          <Link 
                            href={`/album/${albumId}`}
                            className="text-xs sm:text-sm font-bold text-[var(--theme-fg)] hover:text-[var(--theme-accent)] truncate block transition"
                          >
                            {album.title || album.name}
                          </Link>
                        ) : (
                          <span className="text-xs sm:text-sm font-bold text-[var(--theme-fg)] truncate block">{album.title || album.name}</span>
                        )}
                        <p className="text-[11px] text-[var(--theme-muted)] truncate">{artists}</p>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-[var(--theme-border)]">
                        {albumId && (
                          <Link 
                            href={`/album/${albumId}`}
                            className="text-[10px] text-[var(--theme-accent)] font-bold uppercase tracking-wider hover:underline"
                          >
                            Open Album
                          </Link>
                        )}
                        <button
                          onClick={() => handleRemoveAlbum(album.id, album.title || album.name)}
                          className="p-1 text-[var(--theme-muted)] hover:text-red-400 transition cursor-pointer"
                          title="Remove Album"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center p-12 rounded-3xl bg-[var(--theme-card)]/50 border border-[var(--theme-border)]">
                <Disc size={32} className="mx-auto text-[var(--theme-muted)]/50 mb-3" />
                <h3 className="text-base font-bold text-[var(--theme-fg)] mb-1">No Saved Albums</h3>
                <p className="text-xs text-[var(--theme-muted)] mb-4">You haven't bookmarked any albums yet.</p>
                <Link 
                  href="/search"
                  className="px-4 py-2 rounded-xl bg-[var(--theme-accent-bg)] hover:opacity-90 text-[var(--theme-accent-fg)] text-xs font-bold uppercase tracking-wider inline-flex items-center gap-2 transition"
                >
                  Find Albums
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Saved Artists */}
        {activeTab === 'artists' && (
          <div className="space-y-3">
            {savedArtists.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {savedArtists.map((art, idx) => {
                  const artistId = art.id;
                  const name = art.name || art.title;
                  return (
                    <div 
                      key={art.id || idx}
                      className="p-4 rounded-2xl bg-[var(--theme-card)]/80 border border-[var(--theme-border)] flex flex-col items-center text-center hover:border-[var(--theme-accent)]/30 transition group shadow-sm"
                    >
                      <div className="w-24 h-24 rounded-full overflow-hidden mb-3 border-2 border-[var(--theme-border)] bg-[var(--theme-surface)]">
                        <img 
                          src={art.image || 'https://placehold.co/200x200/10141F/60A5FA?text=Artist'} 
                          alt={name}
                          className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                          onError={(e) => { e.currentTarget.src = 'https://placehold.co/200x200/10141F/60A5FA?text=Artist'; }}
                        />
                      </div>
                      {artistId ? (
                        <Link 
                          href={`/artist/${artistId}`}
                          className="text-xs sm:text-sm font-bold text-[var(--theme-fg)] hover:text-[var(--theme-accent)] truncate w-full block transition mb-1"
                        >
                          {name}
                        </Link>
                      ) : (
                        <span className="text-xs sm:text-sm font-bold text-[var(--theme-fg)] truncate w-full block mb-1">{name}</span>
                      )}
                      <p className="text-[10px] text-[var(--theme-muted)] mb-3">Artist Profile</p>
                      
                      <button
                        onClick={() => handleRemoveArtist(art.id, name)}
                        className="px-3 py-1 rounded-full bg-[var(--theme-surface)] hover:bg-red-500/20 text-[var(--theme-muted)] hover:text-red-400 text-[10px] font-semibold transition cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center p-12 rounded-3xl bg-[var(--theme-card)]/50 border border-[var(--theme-border)]">
                <Users size={32} className="mx-auto text-[var(--theme-muted)]/50 mb-3" />
                <h3 className="text-base font-bold text-[var(--theme-fg)] mb-1">No Saved Artists</h3>
                <p className="text-xs text-[var(--theme-muted)] mb-4">Follow artists to stay updated on their discography.</p>
                <Link 
                  href="/search"
                  className="px-4 py-2 rounded-xl bg-[var(--theme-accent-bg)] hover:opacity-90 text-[var(--theme-accent-fg)] text-xs font-bold uppercase tracking-wider inline-flex items-center gap-2 transition"
                >
                  Discover Artists
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Custom Playlists */}
        {activeTab === 'playlists' && (
          <div className="space-y-3">
            {savedPlaylists.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {savedPlaylists.map((pl, idx) => (
                  <div 
                    key={pl.id || idx}
                    className="p-4 rounded-2xl bg-[var(--theme-card)]/80 border border-[var(--theme-border)] flex flex-col justify-between hover:border-[var(--theme-accent)]/30 transition group shadow-sm"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] uppercase tracking-wider font-bold text-[var(--theme-accent)]">Custom Playlist</span>
                        <span className="text-xs text-[var(--theme-muted)]">{pl.tracks?.items?.length || 0} tracks</span>
                      </div>
                      <Link 
                        href={`/playlist/${pl.id}`}
                        className="text-base font-bold text-[var(--theme-fg)] hover:text-[var(--theme-accent)] block transition mb-1"
                      >
                        {pl.name || 'My Playlist'}
                      </Link>
                      {pl.description && (
                        <p className="text-xs text-[var(--theme-muted)] line-clamp-2 mb-3">{pl.description}</p>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-[var(--theme-border)]">
                      <Link 
                        href={`/playlist/${pl.id}`}
                        className="text-xs text-[var(--theme-accent)] font-bold uppercase tracking-wider hover:underline"
                      >
                        Open Playlist
                      </Link>
                      <button
                        onClick={() => handleDeletePlaylist(pl.id, pl.name)}
                        className="p-1.5 text-[var(--theme-muted)] hover:text-red-400 transition cursor-pointer"
                        title="Delete Playlist"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-12 rounded-3xl bg-[var(--theme-card)]/50 border border-[var(--theme-border)]">
                <Heart size={32} className="mx-auto text-[var(--theme-muted)]/50 mb-3" />
                <h3 className="text-base font-bold text-[var(--theme-fg)] mb-1">No Custom Playlists</h3>
                <p className="text-xs text-[var(--theme-muted)] mb-4">Create your first custom playlist from any track's options menu.</p>
                <Link 
                  href="/library"
                  className="px-4 py-2 rounded-xl bg-[var(--theme-accent-bg)] hover:opacity-90 text-[var(--theme-accent-fg)] text-xs font-bold uppercase tracking-wider inline-flex items-center gap-2 transition"
                >
                  Go to Library
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Tab 5: My Reviews */}
        {activeTab === 'reviews' && (
          <div className="space-y-3">
            {userReviews.length > 0 ? (
              <div className="space-y-3">
                {userReviews.map((rev) => (
                  <div 
                    key={rev.id}
                    className="p-4 rounded-2xl bg-[var(--theme-card)]/80 border border-[var(--theme-border)] flex flex-col gap-2 shadow-sm"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[var(--theme-accent)] uppercase tracking-wider">
                          Review for Catalog ID: {rev.itemId.slice(0, 16)}...
                        </span>
                        <span className="text-amber-400 text-xs font-bold">{rev.score} / 5 ★</span>
                      </div>
                      <span className="text-[11px] text-[var(--theme-muted)]">{rev.date}</span>
                    </div>
                    <p className="text-sm text-[var(--theme-fg)]/90 italic">"{rev.text}"</p>
                    {rev.itemId && (
                      <div className="pt-2 flex justify-end">
                        <Link 
                          href={`/track/${rev.itemId}`}
                          className="inline-flex items-center gap-1.5 text-xs text-[var(--theme-accent)] hover:underline font-semibold"
                        >
                          <span>View Music Item</span>
                          <ChevronRight size={13} />
                        </Link>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-12 rounded-3xl bg-[var(--theme-card)]/50 border border-[var(--theme-border)]">
                <MessageSquare size={32} className="mx-auto text-[var(--theme-muted)]/50 mb-3" />
                <h3 className="text-base font-bold text-[var(--theme-fg)] mb-1">No Reviews Written Yet</h3>
                <p className="text-xs text-[var(--theme-muted)] mb-4">Share your ratings and comments on any track, album, or artist page.</p>
                <Link 
                  href="/"
                  className="px-4 py-2 rounded-xl bg-[var(--theme-accent-bg)] hover:opacity-90 text-[var(--theme-accent-fg)] text-xs font-bold uppercase tracking-wider inline-flex items-center gap-2 transition"
                >
                  Explore Trending Music
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Tab 6: Music Taste & Genres */}
        {activeTab === 'genres' && (
          <div className="bg-[var(--theme-card)]/80 border border-[var(--theme-border)] rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
            <div>
              <h3 className="text-lg font-bold text-[var(--theme-fg)] mb-1">Customize Your Music Taste</h3>
              <p className="text-xs text-[var(--theme-muted)]">
                Select the genres that define your sound. We use these tags to tailor recommendations on your home dashboard.
              </p>
            </div>

            <div className="flex flex-wrap gap-2.5">
              {AVAILABLE_GENRES.map((genre) => {
                const isSelected = favoriteGenres.includes(genre);
                return (
                  <button
                    key={genre}
                    onClick={() => handleToggleGenre(genre)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                      isSelected
                        ? 'bg-[var(--theme-accent-bg)] text-[var(--theme-accent-fg)] shadow-md border border-[var(--theme-border-active)] font-bold'
                        : 'bg-[var(--theme-surface)] text-[var(--theme-muted)] hover:text-[var(--theme-fg)] hover:bg-[var(--theme-card)] border border-[var(--theme-border)]'
                    }`}
                  >
                    <span>#{genre}</span>
                    {isSelected ? <Check size={13} /> : <Plus size={13} />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default function UserDashboard() {
  return (
    <Suspense fallback={
      <GrooveLoader fullScreen={true} text="Loading Dashboard..." />
    }>
      <UserDashboardContent />
    </Suspense>
  );
}
