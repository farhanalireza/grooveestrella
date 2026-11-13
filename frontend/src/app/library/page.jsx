// src/app/library/page.jsx
"use client";

import React, { useEffect, useState, useMemo, useCallback, useTransition, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Music, Disc, Users, Heart, FolderHeart, Trash2, ArrowRight, 
  Plus, UploadCloud, Layers, LayoutGrid, List, BookOpen, Star, Calendar, Sparkles, Edit3
} from 'lucide-react';
import { toast } from '@/lib/toast';
import ImportPlaylistModal from '@/Components/ImportPlaylistModal';
import PlaylistCover from '@/Components/PlaylistCover';
import LibraryTouchSlider from '@/Components/LibraryTouchSlider';
import LibraryCoverImage, { FALLBACK_COVER_SVG } from '@/Components/LibraryCoverImage';
import JournalCard from '@/Components/JournalCard';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { buildJournalEditorHref } from '@/lib/journalLinks';

function LibraryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useSupabaseAuth();
  const [isPending, startTransition] = useTransition();
  const [navigatingId, setNavigatingId] = useState(null);
  const [activeTab, setActiveTab] = useState(() => {
    const initialTab = searchParams.get('tab');
    return ['songs', 'albums', 'artists', 'playlists', 'journal'].includes(initialTab)
      ? initialTab
      : 'songs';
  });
  const [viewMode, setViewMode] = useState('slider'); // 'slider' | 'grid' | 'list'
  const [sliderIndex, setSliderIndex] = useState(0);

  const [songs, setSongs] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [artists, setArtists] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [customPlaylists, setCustomPlaylists] = useState([]);
  const [journalEntries, setJournalEntries] = useState([]);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [newPlName, setNewPlName] = useState('');
  const [newPlDesc, setNewPlDesc] = useState('');

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['songs', 'albums', 'artists', 'playlists', 'journal'].includes(tabParam)) {
      const id = setTimeout(() => setActiveTab(tabParam), 0);
      return () => clearTimeout(id);
    }
  }, [searchParams]);

  const loadData = useCallback(async () => {
    let localJournals = [];
    try {
      setSongs(JSON.parse(localStorage.getItem('savedSongs') || '[]'));
      setAlbums(JSON.parse(localStorage.getItem('savedAlbums') || '[]'));
      setArtists(JSON.parse(localStorage.getItem('savedArtists') || '[]'));
      setPlaylists(JSON.parse(localStorage.getItem('savedPlaylists') || '[]'));
      setCustomPlaylists(JSON.parse(localStorage.getItem('customPlaylists') || '[]'));
      localJournals = JSON.parse(localStorage.getItem('groove_journal_logs') || '[]');

      const savedView = localStorage.getItem('groove_library_view_mode');
      if (savedView === 'slider' || savedView === 'grid' || savedView === 'list') {
        setViewMode(savedView);
      }
    } catch (_) {}

    if (user && isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        const { data: cloudJournals, error } = await supabase
          .from('journals')
          .select(`
            id,
            entry_text,
            mood,
            listened_date,
            is_public,
            created_at,
            user_ratings (
              score,
              rating_type
            ),
            music_entities (
              id,
              mbid,
              type,
              title,
              artist_credit,
              cover_art_url
            )
          `)
          .eq('user_id', user.id)
          .order('listened_date', { ascending: false });

        if (!error && Array.isArray(cloudJournals)) {
          const formatted = cloudJournals.map((j) => ({
            id: j.id,
            targetId: j.music_entities?.mbid || j.music_entities?.id,
            targetType: j.music_entities?.type || 'album',
            title: j.music_entities?.title || 'Untitled',
            subtitle: j.music_entities?.artist_credit || '',
            image: j.music_entities?.cover_art_url || '',
            rating: j.user_ratings
              ? j.user_ratings.rating_type === 'stars'
                ? Number(j.user_ratings.score)
                : Math.round(Number(j.user_ratings.score || 0) / 10)
              : 0,
            numericalScore: j.user_ratings?.score || 0,
            ratingSystem: j.user_ratings?.rating_type || 'stars',
            date: j.listened_date,
            review: j.entry_text || '',
            mood: j.mood || '',
            is_public: j.is_public,
            createdAt: new Date(j.created_at).getTime(),
          }));

          const cloudIds = new Set(formatted.map((c) => c.targetId));
          const uncommittedLocal = localJournals.filter((l) => !cloudIds.has(l.targetId));
          setJournalEntries([...formatted, ...uncommittedLocal]);
          return;
        }
      } catch (_) {}
    }

    setJournalEntries(localJournals);
  }, [user]);

  useEffect(() => {
    loadData();

    const handleJournalSync = () => {
      loadData();
    };

    window.addEventListener('groove-journal-updated', handleJournalSync);
    window.addEventListener('groove-rating-changed', handleJournalSync);
    return () => {
      window.removeEventListener('groove-journal-updated', handleJournalSync);
      window.removeEventListener('groove-rating-changed', handleJournalSync);
    };
  }, [loadData]);

  const handleChangeViewMode = (mode) => {
    setViewMode(mode);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('groove_library_view_mode', mode);
      } catch (_) {}
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

    try {
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
    } catch (_) {}
  };

  const handleDeleteCustomPlaylist = (id) => {
    try {
      const custom = JSON.parse(localStorage.getItem('customPlaylists') || '[]');
      const target = custom.find(p => p.id === id);
      const updated = custom.filter(p => p.id !== id);
      localStorage.setItem('customPlaylists', JSON.stringify(updated));
      setCustomPlaylists(updated);
      toast.info(`Playlist "${target?.name || 'Custom'}" removed.`);
    } catch (_) {}
  };

  const handleDeleteJournalEntry = async (entryId) => {
    try {
      const updated = journalEntries.filter(e => e.id !== entryId);
      localStorage.setItem('groove_journal_logs', JSON.stringify(updated));
      setJournalEntries(updated);
      if (user && isSupabaseConfigured() && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(entryId)) {
        const supabase = createClient();
        await supabase.from('journals').delete().eq('id', entryId).eq('user_id', user.id);
      }
      window.dispatchEvent(new CustomEvent('groove-journal-updated', { detail: { entryId } }));
      toast.info("Journal log removed");
    } catch (_) {}
  };

  // Combine regular and custom playlists
  const allPlaylists = useMemo(() => {
    return [
      ...customPlaylists.map(p => ({ ...p, isCustom: true })),
      ...playlists
    ];
  }, [playlists, customPlaylists]);

  // Current list based on active tab
  const currentList = useMemo(() => {
    if (activeTab === 'songs') return songs;
    if (activeTab === 'albums') return albums;
    if (activeTab === 'artists') return artists;
    if (activeTab === 'playlists') return allPlaylists;
    if (activeTab === 'journal') return journalEntries;
    return [];
  }, [activeTab, songs, albums, artists, allPlaylists, journalEntries]);

  const tabs = [
    { id: 'songs', label: 'Songs', count: songs.length, icon: Music },
    { id: 'albums', label: 'Albums', count: albums.length, icon: Disc },
    { id: 'artists', label: 'Artists', count: artists.length, icon: Users },
    { id: 'playlists', label: 'Playlists', count: allPlaylists.length, icon: Heart },
    { id: 'journal', label: 'Music Journal', count: journalEntries.length, icon: BookOpen }
  ];

  // Helper functions to normalize item properties across types
  const getItemTitle = useCallback((item) => {
    return item?.title || item?.name || 'Untitled';
  }, []);

  const getItemSubtitle = useCallback((item) => {
    if (activeTab === 'songs') {
      if (Array.isArray(item?.artist)) return item.artist.map(a => a.name).join(', ');
      return item?.artist || 'Unknown Artist';
    }
    if (activeTab === 'albums') {
      if (Array.isArray(item?.artist)) return item.artist.map(a => a.name).join(', ');
      return item?.artist || 'Various Artists';
    }
    if (activeTab === 'artists') {
      return item?.country ? `Artist · ${item.country}` : 'Artist Profile';
    }
    if (activeTab === 'playlists') {
      if (item?.isCustom) {
        return `${item.tracks?.total || item.tracks?.items?.length || 0} songs · Custom Playlist`;
      }
      return `By ${item?.owner || 'Spotify'}`;
    }
    if (activeTab === 'journal') {
      return item?.subtitle || `${item?.targetType ? item.targetType.toUpperCase() : 'MUSIC'} LOG`;
    }
    return '';
  }, [activeTab]);

  const getItemImage = useCallback((item, size = 'large') => {
    if (!item) return FALLBACK_COVER_SVG;

    if (Array.isArray(item.images) && item.images.length > 0) {
      if (size === 'small') {
        const smallUrl = item.images[item.images.length - 1]?.url || item.images[0]?.url;
        if (smallUrl) return smallUrl;
      } else if (size === 'medium') {
        const medUrl = item.images[1]?.url || item.images[0]?.url;
        if (medUrl) return medUrl;
      }
      return item.images[0]?.url || FALLBACK_COVER_SVG;
    }

    const direct = item.image || item.coverArt || item.url || item.album?.images?.[0]?.url;
    if (direct && typeof direct === 'string' && !direct.includes('placehold.co')) {
      return direct;
    }
    return FALLBACK_COVER_SVG;
  }, []);

  const getItemHref = useCallback((item) => {
    if (!item) return '#';
    if (activeTab === 'songs') {
      const trackId = item.trackId || item.id || (item.trackURI ? item.trackURI.split(':').pop() : null);
      return trackId ? `/track/${trackId}` : '#';
    }
    if (activeTab === 'albums') {
      return item.id ? `/album/${item.id}` : '#';
    }
    if (activeTab === 'artists') {
      return item.id ? `/artist/${item.id}` : '#';
    }
    if (activeTab === 'playlists') {
      return item.id ? `/playlist/${item.id}` : '#';
    }
    if (activeTab === 'journal') {
      const type = item.targetType || 'album';
      return item.targetId ? `/${type}/${item.targetId}` : '#';
    }
    return '#';
  }, [activeTab]);

  const openItem = useCallback((item) => {
    const href = getItemHref(item);
    if (href && href !== '#' && !isPending) {
      const targetNavId = item.id || item.trackId || item.targetId;
      setNavigatingId(targetNavId);
      startTransition(() => {
        router.push(href);
      });
    }
  }, [getItemHref, isPending, router]);

  const deleteItem = useCallback((item) => {
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
    } else if (activeTab === 'journal') {
      handleDeleteJournalEntry(item.id);
    }
  }, [activeTab]);

  const getActionLabel = useCallback(() => {
    if (activeTab === 'songs') return 'View Track';
    if (activeTab === 'albums') return 'View Album';
    if (activeTab === 'artists') return 'View Artist';
    if (activeTab === 'playlists') return 'Open Playlist';
    if (activeTab === 'journal') return 'View Music';
    return 'View';
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-[var(--theme-bg)] text-[var(--theme-fg)] p-4 sm:p-6 pb-28 md:pl-20 md:pr-20 lg:pl-40 lg:pr-40 pt-8 sm:pt-12 transition-colors duration-300">
      {/* Title */}
      <div className="flex items-center justify-between gap-3 mb-6 sm:mb-8 flex-wrap">
        <div className="flex items-center gap-3">
          <FolderHeart className="w-8 h-8 text-[var(--theme-accent)]" />
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-display">Your Library Collection</h1>
        </div>

        {activeTab === 'journal' && (
          <Link
            href="/journal/new?returnTo=%2Flibrary%3Ftab%3Djournal"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 text-zinc-950 font-extrabold text-xs sm:text-sm shadow-md active:scale-95 cursor-pointer"
          >
            <Plus size={15} />
            <span>New Journal Log</span>
          </Link>
        )}
      </div>

      {/* Library Statistics Panel (5 Responsive Metric Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-8">
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
        <button
          type="button"
          onClick={() => setActiveTab('journal')}
          className="bg-[var(--theme-card)]/80 backdrop-blur-xl border border-amber-400/30 hover:border-amber-400/60 rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between shadow-md text-left transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-amber-300 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider">Journal Logs</span>
            <BookOpen size={15} />
          </div>
          <span className="text-xl sm:text-2xl font-extrabold text-amber-300">{journalEntries.length}</span>
        </button>
      </div>

      {/* Coordinated Navigation Bar — Music Library & Music Journal side-by-side */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-6 border-b border-[var(--theme-border)]">
        {/* Left: Saved Music Library Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden scrollb-none no-scrollbar">
          {tabs.filter(t => t.id !== 'journal').map(tab => {
            const Icon = tab.icon;
            const isCurrent = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-full font-semibold text-xs sm:text-sm whitespace-nowrap shrink-0 transition-all duration-200 cursor-pointer ${
                  isCurrent
                    ? 'bg-[var(--theme-accent)] text-[var(--theme-accent-fg)] shadow-md font-bold'
                    : 'bg-[var(--theme-surface)] text-[var(--theme-muted)] hover:bg-[var(--theme-card)] hover:text-[var(--theme-fg)]'
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  isCurrent ? 'bg-black/15 text-[var(--theme-accent-fg)]' : 'bg-[var(--theme-card)] text-[var(--theme-muted)]'
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right / Dedicated Place: Music Journal Hub — prominently featured in coordination */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('journal')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-xs sm:text-sm transition-all duration-300 cursor-pointer shadow-sm ${
              activeTab === 'journal'
                ? 'bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 text-zinc-950 font-black shadow-[0_0_15px_rgba(245,158,11,0.35)] ring-2 ring-amber-400/60 scale-102'
                : 'bg-amber-950/30 hover:bg-amber-900/40 text-amber-200 border border-amber-500/40 hover:border-amber-400/70'
            }`}
          >
            <BookOpen size={15} className={activeTab === 'journal' ? 'text-zinc-950' : 'text-amber-300'} />
            <span>Music Journal</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
              activeTab === 'journal'
                ? 'bg-black/20 text-zinc-950'
                : 'bg-amber-400/20 text-amber-300'
            }`}>
              {journalEntries.length}
            </span>
          </button>

          <Link
            href="/journal/new?returnTo=%2Flibrary%3Ftab%3Djournal"
            className="p-2 rounded-full bg-[var(--theme-surface)] hover:bg-amber-400/20 text-amber-300 border border-amber-400/30 hover:border-amber-400/60 transition shadow-xs cursor-pointer shrink-0"
            title="Write New Journal Log"
          >
            <Plus size={15} />
          </Link>
        </div>
      </div>

      {/* SECTION SPECIFIC CONTENT */}
      {/* 1. MUSIC JOURNAL TAB (Spacious, Elegant Personal Archive) */}
      {activeTab === 'journal' ? (
        <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
          {/* Header Banner */}
          <div className="p-6 sm:p-8 rounded-3xl bg-[var(--theme-card)]/80 backdrop-blur-xl border border-[var(--theme-border)] shadow-xl relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-300 text-xs font-bold uppercase tracking-wider mb-2">
                <BookOpen size={13} />
                <span>Personal Music Diary</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-[var(--theme-fg)] tracking-tight font-display">
                Music Listening Journal
              </h2>
              <p className="text-xs sm:text-sm text-[var(--theme-muted)] mt-1 max-w-lg leading-relaxed">
                Log every listen, record critical scores, track your mood, and write down your musical reflections with plenty of breathing room.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Link
                href="/journal"
                className="px-4 py-2 rounded-2xl bg-[var(--theme-surface)] hover:bg-[var(--theme-card)] border border-[var(--theme-border)] text-xs font-bold text-[var(--theme-fg)] hover:text-amber-300 transition-all flex items-center gap-1.5 shadow-sm"
              >
                <span>Full Archive</span>
                <ArrowRight size={13} />
              </Link>
              <Link
                href="/journal/new?returnTo=%2Flibrary%3Ftab%3Djournal"
                className="px-4 py-2 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-300 text-zinc-950 text-xs font-black hover:scale-105 active:scale-95 transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <Plus size={14} />
                <span>Log Listen</span>
              </Link>
            </div>
          </div>

          {/* Journal Entries List */}
          {journalEntries.length === 0 ? (
            <div className="text-center py-16 bg-[var(--theme-card)]/70 border border-[var(--theme-border)] rounded-3xl p-8 max-w-md mx-auto">
              <div className="w-16 h-16 rounded-full bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-300 mx-auto mb-4">
                <BookOpen size={28} />
              </div>
              <h3 className="text-lg font-bold text-[var(--theme-fg)] mb-2">Your Journal is Waiting</h3>
              <p className="text-sm text-[var(--theme-muted)] mb-6 leading-relaxed">
                Rate albums, score tracks, and jot down your listening reflections to fill your personal music archive!
              </p>
              <Link
                href="/journal/new?returnTo=%2Flibrary%3Ftab%3Djournal"
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 text-zinc-950 font-extrabold text-sm rounded-full hover:scale-105 active:scale-95 transition-all shadow-md cursor-pointer"
              >
                <Sparkles size={16} />
                <span>Write First Journal Log</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {journalEntries.map((entry) => (
                <JournalCard
                  key={entry.id}
                  entry={entry}
                  isOwner={true}
                  onEdit={(e) => {
                    router.push(
                      buildJournalEditorHref({
                        mbid: e.targetId,
                        type: e.targetType || 'album',
                        title: e.title,
                        subtitle: e.subtitle,
                        image: e.image,
                        entryId: e.id,
                        returnTo: '/library?tab=journal',
                      })
                    );
                  }}
                  onDelete={handleDeleteJournalEntry}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        /* STANDARD BOOKMARKS: SONGS, ALBUMS, ARTISTS, PLAYLISTS */
        <>
          {/* Coordinated Music Journal Companion Bar (Always gives Journal its place) */}
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-[var(--theme-card)] to-[var(--theme-surface)] border border-amber-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center text-amber-300 shrink-0">
                <BookOpen size={17} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs sm:text-sm font-black text-[var(--theme-fg)]">
                    Music Listening Journal
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-black uppercase tracking-wider">
                    {journalEntries.length} {journalEntries.length === 1 ? 'Log' : 'Logs'}
                  </span>
                </div>
                <p className="text-[11px] text-[var(--theme-muted)] mt-0.5">
                  Reflect on music, log moods, and rate albums alongside your saved collection.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('journal')}
                className="px-3.5 py-1.5 rounded-full bg-[var(--theme-surface)] hover:bg-[var(--theme-card)] border border-amber-400/30 hover:border-amber-400/60 text-xs font-bold text-amber-300 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <span>Open Journal</span>
                <ArrowRight size={13} />
              </button>
              <Link
                href="/journal/new?returnTo=%2Flibrary%3Ftab%3Djournal"
                className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-300 text-zinc-950 font-black text-xs hover:scale-105 active:scale-95 transition shadow-sm flex items-center gap-1 cursor-pointer"
              >
                <Plus size={13} />
                <span>Log Listen</span>
              </Link>
            </div>
          </div>

          {/* View Options Switcher: Slider (Touch Deck of Cards) | Grid Box | List */}
          <div className="flex items-center justify-between gap-3 mb-8 flex-wrap">
            {/* If playlists tab, display Create and Import buttons */}
            {activeTab === 'playlists' ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsImportModalOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[var(--theme-surface)] hover:bg-[var(--theme-card)] text-[var(--theme-fg)] border border-[var(--theme-border)] font-bold text-xs rounded-full transition active:scale-95 shadow-sm cursor-pointer"
                  title="Import from Spotify"
                >
                  <UploadCloud size={14} className="text-[var(--theme-accent)]" />
                  <span>Import Playlist</span>
                </button>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[var(--theme-accent)] text-[var(--theme-accent-fg)] font-bold text-xs rounded-full hover:opacity-90 transition active:scale-95 shadow-sm cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Create Playlist</span>
                </button>
              </div>
            ) : (
              <div className="text-xs text-[var(--theme-muted)] font-medium">
                {currentList.length} {currentList.length === 1 ? 'item' : 'items'} saved
              </div>
            )}

            {/* View Mode Toggle Pill (Slider, Grid, List) */}
            {currentList.length > 0 && (
              <div className="inline-flex items-center p-1 rounded-full bg-[var(--theme-surface)] border border-[var(--theme-border)] shadow-inner">
                <button
                  onClick={() => handleChangeViewMode('slider')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    viewMode === 'slider'
                      ? 'bg-[var(--theme-accent)] text-[var(--theme-accent-fg)] shadow-sm'
                      : 'text-[var(--theme-muted)] hover:text-[var(--theme-fg)]'
                  }`}
                  title="Card Deck Swiper"
                >
                  <Layers size={13} />
                  <span className="hidden sm:inline">Deck</span>
                </button>
                <button
                  onClick={() => handleChangeViewMode('grid')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    viewMode === 'grid'
                      ? 'bg-[var(--theme-accent)] text-[var(--theme-accent-fg)] shadow-sm'
                      : 'text-[var(--theme-muted)] hover:text-[var(--theme-fg)]'
                  }`}
                  title="Grid Gallery"
                >
                  <LayoutGrid size={13} />
                  <span className="hidden sm:inline">Grid</span>
                </button>
                <button
                  onClick={() => handleChangeViewMode('list')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    viewMode === 'list'
                      ? 'bg-[var(--theme-accent)] text-[var(--theme-accent-fg)] shadow-sm'
                      : 'text-[var(--theme-muted)] hover:text-[var(--theme-fg)]'
                  }`}
                  title="Compact List"
                >
                  <List size={13} />
                  <span className="hidden sm:inline">List</span>
                </button>
              </div>
            )}
          </div>

          {currentList.length === 0 ? (
            <EmptyState type={activeTab} />
          ) : (
            <>
              {/* VIEW MODE 1: INTERACTIVE 3D SWIPEABLE CARDS */}
              {viewMode === 'slider' && (
                <div className="w-full flex flex-col items-center justify-center my-4 animate-fade-in">
                  <LibraryTouchSlider
                    items={currentList}
                    activeIndex={sliderIndex}
                    onChangeIndex={setSliderIndex}
                    activeTab={activeTab}
                    getItemImage={getItemImage}
                    getItemTitle={getItemTitle}
                    getItemSubtitle={getItemSubtitle}
                    onOpenItem={openItem}
                    onDeleteItem={deleteItem}
                    actionLabel={getActionLabel()}
                  />
                </div>
              )}

              {/* VIEW MODE 2: RESPONSIVE GRID BOXES */}
              {viewMode === 'grid' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6 animate-fade-in">
                  {currentList.map((item, idx) => {
                    const isItemNavigating = isPending && (navigatingId === item.id || navigatingId === item.trackId);
                    return (
                      <div
                        key={item.id || item.trackId || idx}
                        onClick={() => openItem(item)}
                        className={`group relative flex flex-col bg-[var(--theme-card)]/80 hover:bg-[var(--theme-card)] border border-[var(--theme-border)] hover:border-[var(--theme-accent)]/50 rounded-2xl sm:rounded-3xl p-3 transition-all duration-300 shadow-md hover:shadow-xl ${
                          isItemNavigating ? 'opacity-75 pointer-events-none cursor-wait' : 'cursor-pointer'
                        }`}
                      >
                        <div className={`aspect-square w-full relative mb-3 overflow-hidden shadow-sm ${activeTab === 'artists' ? 'rounded-full' : 'rounded-xl'}`}>
                          {activeTab === 'playlists' ? (
                            <PlaylistCover
                              images={item.images}
                              isCustom={item.isCustom}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <LibraryCoverImage
                              src={getItemImage(item, 'medium')}
                              alt={getItemTitle(item)}
                              isCircle={activeTab === 'artists'}
                              priority={idx < 6}
                              className="w-full h-full group-hover:scale-105 transition-transform duration-500"
                            />
                          )}

                          {isItemNavigating && (
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] flex flex-col items-center justify-center gap-1.5 animate-fade-in z-20">
                              <div className="w-6 h-6 rounded-full border-2 border-[var(--theme-accent)] border-t-transparent animate-spin" />
                              <span className="text-[9px] font-bold text-white tracking-widest uppercase">Routing...</span>
                            </div>
                          )}

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteItem(item);
                            }}
                            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 hover:bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-md z-10"
                            title="Remove from Library"
                            aria-label="Remove item"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>

                        <div className="min-w-0 flex-1 flex flex-col justify-between">
                          <div>
                            <h4 className="text-sm font-bold text-[var(--theme-fg)] group-hover:text-[var(--theme-accent)] transition truncate">
                              {getItemTitle(item)}
                            </h4>
                            <p className="text-xs text-[var(--theme-muted)] truncate mt-0.5">
                              {getItemSubtitle(item)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* VIEW MODE 3: COMPACT LIST */}
              {viewMode === 'list' && (
                <div className="flex flex-col gap-2 animate-fade-in max-w-3xl mx-auto w-full">
                  {currentList.map((item, idx) => {
                    const isItemNavigating = isPending && (navigatingId === item.id || navigatingId === item.trackId);
                    return (
                      <div
                        key={item.id || item.trackId || idx}
                        onClick={() => openItem(item)}
                        className={`flex items-center justify-between p-3 rounded-2xl bg-[var(--theme-card)]/70 hover:bg-[var(--theme-card)] border border-[var(--theme-border)] hover:border-[var(--theme-accent)]/50 transition-all shadow-xs group ${
                          isItemNavigating ? 'opacity-75 pointer-events-none cursor-wait' : 'cursor-pointer'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1 pr-3">
                          <div className={`w-12 h-12 relative overflow-hidden shrink-0 shadow-xs ${activeTab === 'artists' ? 'rounded-full' : 'rounded-xl'}`}>
                            {activeTab === 'playlists' ? (
                              <PlaylistCover
                                images={item.images}
                                isCustom={item.isCustom}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <LibraryCoverImage
                                src={getItemImage(item, 'small')}
                                alt={getItemTitle(item)}
                                isCircle={activeTab === 'artists'}
                                priority={idx < 8}
                                className="w-full h-full"
                              />
                            )}
                            {isItemNavigating && (
                              <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] flex items-center justify-center animate-fade-in z-20">
                                <div className="w-5 h-5 rounded-full border-2 border-[var(--theme-accent)] border-t-transparent animate-spin" />
                              </div>
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
                            disabled={isPending}
                            className="px-3 py-1.5 bg-[var(--theme-accent)] text-[var(--theme-accent-fg)] font-bold text-xs rounded-full hover:opacity-90 transition cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-75 disabled:cursor-wait"
                          >
                            {isItemNavigating ? (
                              <>
                                <div className="w-3 h-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
                                <span>Routing...</span>
                              </>
                            ) : (
                              <>
                                <span>Open</span>
                                <ArrowRight size={12} />
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => deleteItem(item)}
                            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition cursor-pointer active:scale-95"
                            title="Remove from Library"
                            aria-label="Remove item"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Create Playlist Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="absolute inset-0" onClick={() => setIsCreateModalOpen(false)} />
          <div className="relative max-w-sm w-full bg-[var(--theme-card)] border border-[var(--theme-border)] rounded-3xl shadow-2xl p-6 z-10 text-[var(--theme-fg)]">
            <h3 className="text-lg font-bold text-[var(--theme-fg)] mb-4">Create Custom Playlist</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (!newPlName.trim()) return;
              try {
                const savedPls = JSON.parse(localStorage.getItem('customPlaylists') || '[]');
                const newPl = {
                  id: `custom-${Date.now()}`,
                  name: newPlName.trim(),
                  title: newPlName.trim(),
                  description: newPlDesc.trim() || 'Custom playlist created on GrooveEstrella.',
                  image: FALLBACK_COVER_SVG,
                  images: [{ url: FALLBACK_COVER_SVG }],
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
              } catch (_) {}
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

export default function LibraryPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[var(--theme-bg)] text-[var(--theme-muted)] flex items-center justify-center text-sm font-medium">
          Loading your library...
        </div>
      }
    >
      <LibraryContent />
    </Suspense>
  );
}
