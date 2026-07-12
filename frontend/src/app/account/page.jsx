// src/app/account/page.jsx
"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { API_BASE_URL } from '@/lib/apiClient';
import { Loader, Music, Heart, Disc, Users, User, Share2, Globe, Crown, LogOut } from 'lucide-react';

const SpotifyIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
  </svg>
);

function UserDashboardContent() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const hasKey = searchParams.get('key');

  const fetchUserProfile = async () => {
    try {
      await fetch(`${API_BASE_URL}/refresh_access_token`);
      const response = await fetch(`${API_BASE_URL}/me`);

      if (response.status === 401) {
        setUserData(null);
        setLoading(false);
        return;
      }

      if (!response.ok) throw new Error('Failed to fetch user profile');

      const data = await response.json();
      setUserData(data.profile);
      setLoading(false);
    } catch (err) {
      console.error('[ERROR] Failed to fetch profile:', err);
      setUserData(null);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasKey) {
      fetchUserProfile();
      const interval = setInterval(fetchUserProfile, 1000 * 60 * 10);
      return () => clearInterval(interval);
    } else {
      setLoading(false);
    }
  }, [hasKey]);

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE_URL}/logout`);
      window.location.reload();
    } catch (err) {
      console.error('[ERROR] Logout failed:', err);
    }
  };

  // Local Storage Dashboard Component
  const LocalDashboard = () => {
    const [userName, setUserName] = useState('Music Lover');
    const [savedSongs, setSavedSongs] = useState([]);
    const [savedAlbums, setSavedAlbums] = useState([]);
    const [savedArtists, setSavedArtists] = useState([]);
    const [savedPlaylists, setSavedPlaylists] = useState([]);

    useEffect(() => {
      setUserName(localStorage.getItem('userName') || 'Music Lover');
      setSavedSongs(JSON.parse(localStorage.getItem('savedSongs') || '[]'));
      setSavedAlbums(JSON.parse(localStorage.getItem('savedAlbums') || '[]'));
      setSavedArtists(JSON.parse(localStorage.getItem('savedArtists') || '[]'));
      setSavedPlaylists(JSON.parse(localStorage.getItem('savedPlaylists') || '[]'));
    }, []);

    const firstLetter = userName.charAt(0).toUpperCase();

    const stats = [
      { icon: Music, label: 'Saved Songs', count: savedSongs.length, color: 'text-[#60A5FA]' },
      { icon: Disc, label: 'Saved Albums', count: savedAlbums.length, color: 'text-[#60A5FA]' },
      { icon: Users, label: 'Saved Artists', count: savedArtists.length, color: 'text-[#60A5FA]' },
      { icon: Heart, label: 'Saved Playlists', count: savedPlaylists.length, color: 'text-[#60A5FA]' }
    ];

    return (
      <div className='min-h-screen flex items-center justify-center bg-[#07090F] text-[#F4F7FF] relative overflow-hidden px-6 pt-12 pb-24'>
        {/* Blurry Backdrop Glow */}
        <div className="absolute top-0 left-0 right-0 h-[40vh] bg-[#2563EB]/5 rounded-full filter blur-[120px] pointer-events-none z-0" />
        
        <div className='relative z-10 w-full max-w-2xl'>
          <div className='bg-[#10141F]/40 border border-[#2563EB]/10 backdrop-blur-xl rounded-3xl p-8 mb-6 shadow-2xl'>
            <div className='flex flex-col items-center space-y-6'>
              <div className='relative'>
                <div className='w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-[#2563EB] to-[#60A5FA] flex items-center justify-center text-4xl font-extrabold text-black shadow-2xl border-4 border-[#60A5FA]/20'>
                  {firstLetter}
                </div>
                <div className='absolute -bottom-1 -right-1 bg-[#2563EB] p-2 rounded-full shadow-md text-black'>
                  <User className='w-4 h-4' />
                </div>
              </div>

              <div className='text-center space-y-2'>
                <h1 className='text-3xl font-extrabold text-[#F4F7FF] tracking-tight'>{userName}</h1>
                <p className='text-[#60A5FA] text-xs font-bold uppercase tracking-wider'>Music Explorer</p>
                <button 
                  onClick={() => router.push("/account?key=spotify-login")}
                  className='text-[#60A5FA] text-xs font-bold hover:text-[#60A5FA] hover:underline active:underline bg-transparent border-none cursor-pointer mt-3 transition'
                >
                  Connect Spotify Account
                </button>
              </div>
            </div>
          </div>

          <div className='grid grid-cols-2 gap-4'>
            {stats.map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <div key={index} className='bg-[#10141F]/40 border border-[#2563EB]/10 backdrop-blur-xl rounded-2xl p-5 hover:border-[#60A5FA]/20 hover:bg-[#2563EB]/10 transition-all duration-300 shadow-md'>
                  <div className='flex items-center space-x-4'>
                    <div className={`p-2.5 rounded-xl bg-white/[0.03] ${stat.color}`}>
                      <IconComponent className='w-5 h-5' />
                    </div>
                    <div>
                      <p className='text-xl font-extrabold text-[#F4F7FF] leading-tight'>{stat.count}</p>
                      <p className='text-xs text-[#8992A5] mt-0.5'>{stat.label}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className='mt-6 bg-gradient-to-r from-[#2563EB]/10 to-[#60A5FA]/10 border border-[#2563EB]/20 rounded-2xl p-6 shadow-md'>
            <div className='text-center'>
              <p className='text-sm text-[#8992A5] mb-1 font-semibold uppercase tracking-wider'>Total Library Collection</p>
              <p className='text-4xl font-black text-[#F4F7FF]'>
                {savedSongs.length + savedAlbums.length + savedArtists.length + savedPlaylists.length}
              </p>
              <p className='text-xs font-bold text-[#60A5FA] mt-2 uppercase tracking-wide'>Items bookmarked</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Original Spotify Dashboard
  const SpotifyDashboard = () => {
    useEffect(() => {
      if (userData) {
        localStorage.setItem('userName', userData.display_name);
      }
    }, [userData]);

    return (
      <div className='min-h-screen flex items-center justify-center bg-[#07090F] text-[#F4F7FF] relative overflow-hidden px-6 pt-12 pb-24'>
        {/* Blurry Backdrop Glow */}
        <div className="absolute top-0 left-0 right-0 h-[40vh] bg-[#2563EB]/5 rounded-full filter blur-[120px] pointer-events-none z-0" />
        
        <div className='relative z-10 w-full max-w-lg bg-[#10141F]/40 border border-[#2563EB]/10 backdrop-blur-xl shadow-2xl rounded-3xl p-8 space-y-6'>
          {loading ? (
            <div className="flex items-center justify-center text-[#F4F7FF] py-12">
              <Loader className="animate-spin w-8 h-8 mr-3 text-[#2563EB]" />
              <span className="text-lg font-semibold">Loading Spotify Account...</span>
            </div>
          ) : userData ? (
            <>
              <div className='flex flex-col items-center space-y-4'>
                <div className='relative'>
                  <img src={userData.image || 'https://placehold.co/150x150?text=Spotify'} alt='Avatar' className='w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 border-[#2563EB]/20 shadow-2xl object-cover' />
                  {userData.product === 'premium' && (
                    <div className='absolute -bottom-1 -right-1 bg-yellow-400 text-black p-2 rounded-full shadow-md'>
                      <Crown className='w-4 h-4' />
                    </div>
                  )}
                </div>
                <h2 className='text-2xl sm:text-3xl font-extrabold tracking-tight text-[#F4F7FF]'>{userData.display_name}</h2>
                <div className='flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[#60A5FA] bg-[#2563EB]/10 border border-[#2563EB]/20 px-3 py-1 rounded-full shadow-sm'>
                  <SpotifyIcon className="w-3.5 h-3.5" />
                  <span>{userData.product}</span>
                </div>
              </div>

              <div className='grid gap-3.5 border-t border-[#2563EB]/10 pt-6'>
                <div className='flex items-center gap-3 text-[#F4F7FF]/80 text-sm font-semibold'>
                  <Globe className='w-5 h-5 text-[#60A5FA]' />
                  <span>Region: {userData.country}</span>
                </div>
                <div className='flex items-center gap-3 text-[#F4F7FF]/80 text-sm font-semibold'>
                  <User className='w-5 h-5 text-[#60A5FA]' />
                  <span>Spotify ID: {userData.id}</span>
                </div>
              </div>

              {userData.product !== 'premium' && (
                <div className='mt-4 text-center bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-2xl'>
                  <p className='text-yellow-300 font-medium italic text-xs leading-relaxed'>Upgrade to Premium for uninterrupted playback 🎧</p>
                  <button
                    onClick={() => window.open('https://www.spotify.com/premium/', '_blank')}
                    className='mt-3 px-5 py-2.5 rounded-full bg-gradient-to-r from-yellow-500 to-amber-500 text-black text-xs font-bold shadow hover:scale-105 transition duration-200 cursor-pointer'
                  >
                    Upgrade to Premium
                  </button>
                </div>
              )}

              <button
                onClick={handleLogout}
                className='w-full py-3 mt-6 rounded-2xl bg-red-600/10 hover:bg-red-600/20 border border-red-500/20 transition-all text-red-400 font-bold shadow flex items-center justify-center gap-2 cursor-pointer'
              >
                <LogOut size={16} />
                Logout Account
              </button>
            </>
          ) : (
            <div className='text-center space-y-5 py-8'>
              <p className='text-lg font-bold text-[#F4F7FF]/80'>You're not logged in with Spotify.</p>
              <button
                onClick={() => window.open(`${API_BASE_URL}/login`, '_self')}
                className='inline-flex items-center px-6 py-3 bg-[#2563EB] hover:bg-[#60A5FA] text-black gap-3 hover:scale-105 active:scale-95 transition-all duration-200 rounded-2xl shadow-lg shadow-[#2563EB]/10 font-extrabold cursor-pointer'
              >
                <SpotifyIcon className="w-5 h-5" />
                Login with Spotify
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return hasKey ? <SpotifyDashboard /> : <LocalDashboard />;
}

export default function UserDashboard() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-[#07090F] text-[#F4F7FF]">
        <Loader className="animate-spin w-8 h-8 mr-3 text-[#2563EB]" />
        <span className="text-lg font-semibold">Loading Dashboard...</span>
      </div>
    }>
      <UserDashboardContent />
    </Suspense>
  );
}
