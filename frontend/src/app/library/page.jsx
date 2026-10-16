// src/app/library/page.jsx
"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Music, Disc, Users, Heart, FolderHeart, Trash2, ArrowRight, Library, BarChart2, Plus } from 'lucide-react';
import { SmallTrackCardWithCover } from '@/Components/CardComponents/SmallTracksCard';
import { toast } from 'react-toastify';

export default function LibraryPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('songs');
  const [songs, setSongs] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [artists, setArtists] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [customPlaylists, setCustomPlaylists] = useState([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newPlName, setNewPlName] = useState('');
  const [newPlDesc, setNewPlDesc] = useState('');

  useEffect(() => {
    setSongs(JSON.parse(localStorage.getItem('savedSongs') || '[]'));
    setAlbums(JSON.parse(localStorage.getItem('savedAlbums') || '[]'));
    setArtists(JSON.parse(localStorage.getItem('savedArtists') || '[]'));
    setPlaylists(JSON.parse(localStorage.getItem('savedPlaylists') || '[]'));
    setCustomPlaylists(JSON.parse(localStorage.getItem('customPlaylists') || '[]'));
  }, []);

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
      if (key === 'songs') return item.trackId === id || item.trackURI === id;
      return item.id === id;
    });
    if (target) {
      itemTitle = target.title || target.name || 'Item';
    }

    const updated = items.filter(item => {
      if (key === 'songs') return item.trackId !== id && item.trackURI !== id;
      return item.id !== id;
    });
    localStorage.setItem(storageKey, JSON.stringify(updated));
    listSetter(updated);
    toast.info(`"${itemTitle}" removed from library.`);
  };

  const handleDeleteCustomPlaylist = (id) => {
    const savedCustom = JSON.parse(localStorage.getItem('customPlaylists') || '[]');
    const target = savedCustom.find(p => p.id === id);
    const title = target ? target.name : 'Playlist';
    
    const updated = savedCustom.filter(p => p.id !== id);
    localStorage.setItem('customPlaylists', JSON.stringify(updated));
    setCustomPlaylists(updated);
    toast.info(`"${title}" deleted.`);
  };

  const tabs = [
    { id: 'songs', label: 'Songs', count: songs.length, icon: Music },
    { id: 'albums', label: 'Albums', count: albums.length, icon: Disc },
    { id: 'artists', label: 'Artists', count: artists.length, icon: Users },
    { id: 'playlists', label: 'Playlists', count: playlists.length + customPlaylists.length, icon: Heart }
  ];

  return (
    <div className="min-h-screen bg-[var(--theme-bg)] text-[var(--theme-fg)] p-6 pb-24 md:pl-20 md:pr-20 lg:pl-40 lg:pr-40 pt-12">
      {/* Title */}
      <div className="flex items-center gap-3 mb-8">
        <FolderHeart className="w-8 h-8 text-[var(--theme-accent)]" />
        <h1 className="text-3xl font-extrabold tracking-tight">Your Library Collection</h1>
      </div>

      {/* Library Statistics Panel */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        <div className="bg-[var(--theme-card)]/80 backdrop-blur-xl border border-[var(--theme-border)] rounded-2xl p-4 flex flex-col justify-between shadow-md">
          <div className="flex items-center justify-between text-[var(--theme-muted)] mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Tracks</span>
            <Music size={16} />
          </div>
          <span className="text-2xl font-extrabold text-[var(--theme-fg)]">{songs.length}</span>
        </div>
        <div className="bg-[var(--theme-card)]/80 backdrop-blur-xl border border-[var(--theme-border)] rounded-2xl p-4 flex flex-col justify-between shadow-md">
          <div className="flex items-center justify-between text-[var(--theme-muted)] mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Albums</span>
            <Disc size={16} />
          </div>
          <span className="text-2xl font-extrabold text-[var(--theme-fg)]">{albums.length}</span>
        </div>
        <div className="bg-[var(--theme-card)]/80 backdrop-blur-xl border border-[var(--theme-border)] rounded-2xl p-4 flex flex-col justify-between shadow-md">
          <div className="flex items-center justify-between text-[var(--theme-muted)] mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Artists</span>
            <Users size={16} />
          </div>
          <span className="text-2xl font-extrabold text-[var(--theme-fg)]">{artists.length}</span>
        </div>
        <div className="bg-[var(--theme-card)]/80 backdrop-blur-xl border border-[var(--theme-border)] rounded-2xl p-4 flex flex-col justify-between shadow-md">
          <div className="flex items-center justify-between text-[var(--theme-muted)] mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Playlists</span>
            <Heart size={16} />
          </div>
          <span className="text-2xl font-extrabold text-[var(--theme-fg)]">{playlists.length + customPlaylists.length}</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-8 border-b border-[var(--theme-border)]">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-xs md:text-sm whitespace-nowrap transition-all duration-300 ${
                activeTab === tab.id
                  ? 'bg-[var(--theme-accent-bg)] text-[var(--theme-accent-fg)] shadow-md font-bold'
                  : 'bg-[var(--theme-surface)] text-[var(--theme-muted)] hover:bg-[var(--theme-card)] hover:text-[var(--theme-fg)]'
              }`}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                activeTab === tab.id ? 'bg-black/15 text-[var(--theme-accent-fg)]' : 'bg-[var(--theme-card)] text-[var(--theme-muted)]'
              }`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === 'songs' && (
          <div className="flex flex-col gap-3">
            {songs.length === 0 ? (
              <EmptyState type="songs" />
            ) : (
              songs.map((song, index) => (
                <div key={song.trackId || index} className="group relative flex items-center w-full">
                  <div className="flex-1">
                    <SmallTrackCardWithCover
                      title={song.title}
                      artist={Array.isArray(song.artist) ? song.artist : [{ name: song.artist }]}
                      coverImage={song.image}
                      spoURL={song.spoURL}
                      YTURL={song.YTURL}
                      trackURI={song.trackURI}
                      trackID={song.trackId}
                    />
                  </div>
                  <button
                    onClick={() => handleClearItem('songs', song.trackId || song.trackURI, setSongs)}
                    className="p-2 ml-3 bg-red-500/10 hover:bg-red-500/20 rounded-xl text-red-400 hover:text-red-300 transition duration-200"
                    title="Remove Bookmark"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'albums' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {albums.length === 0 ? (
              <div className="col-span-full"><EmptyState type="albums" /></div>
            ) : (
              albums.map((album, index) => (
                <div key={album.id || index} className="group bg-[var(--theme-card)]/80 border border-[var(--theme-border)] rounded-3xl p-4 relative hover:border-[var(--theme-accent)]/40 hover:bg-[var(--theme-card)] transition duration-300 flex flex-col justify-between shadow-md">
                  <div className="cursor-pointer" onClick={() => router.push(`/album/${album.id}`)}>
                    <img src={album.image || 'https://placehold.co/150x150?text=No+Cover'} alt={album.title} className="w-full aspect-square object-cover rounded-2xl mb-4" />
                    <h3 className="font-bold text-sm truncate text-[var(--theme-fg)] group-hover:text-[var(--theme-accent)] transition">{album.title}</h3>
                    <p className="text-xs text-[var(--theme-muted)] truncate mb-4">{album.artist?.map(a => a.name).join(', ') || 'Various Artists'}</p>
                  </div>
                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-[var(--theme-border)]">
                    <button
                      onClick={() => router.push(`/album/${album.id}`)}
                      className="text-xs text-[var(--theme-accent)] font-semibold flex items-center gap-1 hover:opacity-80 transition"
                    >
                      View Album <ArrowRight size={12} />
                    </button>
                    <button
                      onClick={() => handleClearItem('albums', album.id, setAlbums)}
                      className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'artists' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {artists.length === 0 ? (
              <div className="col-span-full"><EmptyState type="artists" /></div>
            ) : (
              artists.map((artist, index) => (
                <div key={artist.id || index} className="group bg-[var(--theme-card)]/80 border border-[var(--theme-border)] rounded-3xl p-4 relative hover:border-[var(--theme-accent)]/40 hover:bg-[var(--theme-card)] transition duration-300 flex flex-col items-center text-center shadow-md">
                  <div className="cursor-pointer flex flex-col items-center" onClick={() => router.push(`/artist/${artist.id}`)}>
                    <img src={artist.image || 'https://placehold.co/150x150?text=No+Cover'} alt={artist.title} className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover mb-4 ring-4 ring-[var(--theme-border)] group-hover:ring-[var(--theme-accent)]/40 transition-all duration-300" />
                    <h3 className="font-bold text-sm truncate max-w-[140px] text-[var(--theme-fg)] group-hover:text-[var(--theme-accent)] transition">{artist.title}</h3>
                    <p className="text-[10px] text-[var(--theme-muted)] font-semibold uppercase tracking-wider mt-1 mb-4">Artist</p>
                  </div>
                  <div className="flex justify-between items-center w-full border-t border-[var(--theme-border)] pt-3">
                    <button
                      onClick={() => router.push(`/artist/${artist.id}`)}
                      className="text-xs text-[var(--theme-accent)] font-semibold flex items-center gap-1 hover:opacity-80 transition"
                    >
                      View Artist <ArrowRight size={12} />
                    </button>
                    <button
                      onClick={() => handleClearItem('artists', artist.id, setArtists)}
                      className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'playlists' && (
          <div className="space-y-10">
            {/* Header / Create button */}
            <div className="flex justify-between items-center pb-2 border-b border-[var(--theme-border)]">
              <h2 className="text-lg font-bold text-[var(--theme-fg)]">Playlists & Collections</h2>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center gap-2 px-5 py-2 bg-[var(--theme-accent-bg)] hover:opacity-90 text-[var(--theme-accent-fg)] font-extrabold text-xs md:text-sm rounded-full transition hover:scale-105 active:scale-95 shadow-md cursor-pointer"
              >
                <Plus size={14} />
                Create Playlist
              </button>
            </div>

            {customPlaylists.length === 0 && playlists.length === 0 ? (
              <EmptyState type="playlists" />
            ) : (
              <div className="flex flex-col gap-10">
                {/* Custom Playlists */}
                {customPlaylists.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--theme-accent)] mb-4">Your Playlists ({customPlaylists.length})</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                      {customPlaylists.map((pl, index) => (
                        <div key={pl.id || index} className="group bg-[var(--theme-card)]/80 border border-[var(--theme-border)] hover:border-[var(--theme-accent)]/40 hover:bg-[var(--theme-card)] rounded-3xl p-4 relative transition duration-300 flex flex-col justify-between shadow-md">
                          <div className="cursor-pointer" onClick={() => router.push(`/playlist/${pl.id}`)}>
                            <img src={pl.image || 'https://placehold.co/150x150?text=Playlist'} alt={pl.name} className="w-full aspect-square object-cover rounded-2xl mb-4" />
                            <h3 className="font-bold text-sm truncate text-[var(--theme-fg)] group-hover:text-[var(--theme-accent)] transition">{pl.name}</h3>
                            <p className="text-xs text-[var(--theme-muted)] truncate mb-4">Custom Playlist</p>
                          </div>
                          <div className="flex justify-between items-center mt-2 pt-2 border-t border-[var(--theme-border)]">
                            <button
                              onClick={() => router.push(`/playlist/${pl.id}`)}
                              className="text-xs text-[var(--theme-accent)] hover:opacity-80 font-semibold flex items-center gap-1"
                            >
                              View Playlist <ArrowRight size={12} />
                            </button>
                            <button
                              onClick={() => handleDeleteCustomPlaylist(pl.id)}
                              className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition cursor-pointer"
                              title="Delete Playlist"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Spotify Playlists */}
                {playlists.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--theme-accent)] mb-4">Bookmarked Spotify Playlists ({playlists.length})</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                      {playlists.map((pl, index) => (
                        <div key={pl.id || index} className="group bg-[var(--theme-card)]/80 border border-[var(--theme-border)] hover:border-[var(--theme-accent)]/40 hover:bg-[var(--theme-card)] rounded-3xl p-4 relative transition duration-300 flex flex-col justify-between shadow-md">
                          <div className="cursor-pointer" onClick={() => router.push(`/playlist/${pl.id}`)}>
                            <img src={pl.image || 'https://placehold.co/150x150?text=No+Cover'} alt={pl.title} className="w-full aspect-square object-cover rounded-2xl mb-4" />
                            <h3 className="font-bold text-sm truncate text-[var(--theme-fg)] group-hover:text-[var(--theme-accent)] transition">{pl.title}</h3>
                            <p className="text-xs text-[var(--theme-muted)] truncate mb-4">By {pl.owner || 'Unknown'}</p>
                          </div>
                          <div className="flex justify-between items-center mt-2 pt-2 border-t border-[var(--theme-border)]">
                            <button
                              onClick={() => router.push(`/playlist/${pl.id}`)}
                              className="text-xs text-[var(--theme-accent)] hover:opacity-80 font-semibold flex items-center gap-1"
                            >
                              View Playlist <ArrowRight size={12} />
                            </button>
                            <button
                              onClick={() => handleClearItem('playlists', pl.id, setPlaylists)}
                              className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition cursor-pointer"
                              title="Remove Bookmark"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
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
                  className="flex-1 py-2.5 bg-[var(--theme-accent-bg)] hover:opacity-90 text-[var(--theme-accent-fg)] font-bold rounded-full transition text-sm cursor-pointer"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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
      <Link href="/" className="inline-flex items-center px-6 py-2.5 bg-[var(--theme-accent-bg)] text-[var(--theme-accent-fg)] font-bold text-sm rounded-full hover:scale-105 active:scale-95 transition-all shadow-md">
        Start Exploring
      </Link>
    </div>
  );
}
