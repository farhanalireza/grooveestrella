// src/Components/MusicButtons.jsx
import React from 'react';

// Inline SVG brand icons
export const SpotifyIcon = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
  </svg>
);

export const YouTubeIcon = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

export const AppleIcon = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
  </svg>
);

export const SoundCloudIcon = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M1.175 12.225c-.051 0-.094.046-.101.1l-.233 2.154.233 2.105c.007.058.05.098.101.098.05 0 .09-.04.099-.098l.255-2.105-.27-2.154c-.009-.06-.05-.1-.1-.1m-.899.828c-.06 0-.091.037-.104.094L0 14.479l.172 1.282c.013.06.045.094.104.094.057 0 .09-.037.104-.094l.199-1.282-.2-1.332c-.014-.06-.047-.094-.104-.094m1.8-1.166c-.06 0-.104.048-.112.104l-.215 2.49.215 2.387c.008.06.052.104.112.104.06 0 .104-.044.112-.104l.247-2.387-.247-2.49c-.008-.06-.052-.104-.112-.104m.899-.468c-.067 0-.116.05-.124.116l-.199 2.854.199 2.7c.008.066.057.116.124.116.066 0 .116-.05.124-.116l.227-2.7-.227-2.854c-.008-.066-.058-.116-.124-.116m.9-.127c-.075 0-.132.058-.14.132l-.183 2.98.183 2.889c.008.074.065.132.14.132.074 0 .131-.058.139-.132l.209-2.889-.209-2.98c-.008-.074-.065-.132-.14-.132m.924-.182c-.082 0-.148.065-.156.148l-.167 3.162.167 2.94c.008.082.074.148.156.148.082 0 .148-.066.156-.148l.19-2.94-.19-3.162c-.008-.083-.074-.148-.156-.148m.947-.22c-.09 0-.164.073-.172.164l-.151 3.382.151 2.96c.008.09.082.163.172.163.09 0 .164-.073.172-.164l.172-2.96-.172-3.381c-.008-.09-.082-.164-.172-.164m2.037-.63c-.1 0-.18.08-.188.18l-.12 4.012.12 2.96c.008.1.088.18.188.18.098 0 .18-.08.188-.18l.135-2.96-.135-4.013c-.008-.1-.09-.18-.188-.18m-.924.424c-.098 0-.176.077-.184.176l-.135 3.588.135 2.97c.008.098.086.176.184.176.096 0 .176-.078.184-.176l.154-2.97-.154-3.588c-.008-.1-.088-.176-.184-.176m1.848-1.4c-.106 0-.193.087-.2.193l-.107 5.018.107 2.932c.007.106.094.193.2.193.104 0 .192-.087.199-.193l.12-2.932-.12-5.018c-.007-.106-.095-.193-.2-.193m.951.07c-.113 0-.205.092-.213.205l-.095 4.942.095 2.918c.008.113.1.205.213.205.112 0 .205-.092.213-.205l.107-2.918-.107-4.942c-.008-.113-.1-.205-.213-.205m.95-.174c-.12 0-.218.098-.225.218l-.08 5.096.08 2.899c.007.12.104.217.225.217.12 0 .217-.098.225-.217l.09-2.899-.09-5.096c-.008-.12-.105-.218-.225-.218m.95.433c-.128 0-.232.104-.24.232l-.064 4.663.064 2.882c.008.126.112.23.24.23.126 0 .231-.104.239-.23l.072-2.882-.072-4.663c-.008-.128-.113-.232-.24-.232m.95-.37c-.134 0-.244.11-.25.244l-.052 5.033.052 2.864c.006.134.116.244.25.244.133 0 .243-.11.25-.244l.058-2.864-.058-5.033c-.007-.134-.117-.244-.25-.244m1.193-.804c-.07 0-.137.014-.2.04a4.687 4.687 0 0 0-4.313-2.874 4.64 4.64 0 0 0-1.437.227c-.17.056-.215.112-.215.224v11.06c0 .118.09.22.21.236h5.955a2.358 2.358 0 0 0 0-4.716"/>
  </svg>
);

export const TidalIcon = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12.012 0L6.006 6.006l6.006 6.006 6.006-6.006zm-6.006 6.006L0 12.012l6.006 6.006 6.006-6.006zm12.012 0l-6.006 6.006 6.006 6.006L24 12.012zM12.012 12.012L6.006 18.018l6.006 6.006 6.006-6.006z"/>
  </svg>
);

export const SpotifyButton = ({ clickHandle }) => {
  return (
    <button 
      onClick={clickHandle} 
      className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full font-bold text-xs md:text-sm bg-[#1DB954] hover:bg-[#1ed760] text-black transition-all hover:scale-105 active:scale-95 shadow-md shadow-[#1DB954]/10 cursor-pointer"
    >
      <SpotifyIcon className="w-4 h-4 md:w-5 md:h-5" />
      <span className="hidden sm:inline">Spotify</span>
    </button>
  );
};

export const YouTubeButton = ({ clickHandle }) => {
  return (
    <button 
      onClick={clickHandle} 
      className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full font-bold text-xs md:text-sm bg-[#FF0000] hover:bg-[#ff3333] text-white transition-all hover:scale-105 active:scale-95 shadow-md shadow-[#FF0000]/10 cursor-pointer"
    >
      <YouTubeIcon className="w-4 h-4 md:w-5 md:h-5" />
      <span className="hidden sm:inline">YouTube</span>
    </button>
  );
};

export const AppleMusicButton = ({ clickHandle }) => {
  return (
    <button 
      onClick={clickHandle} 
      className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full font-bold text-xs md:text-sm bg-[#FC3C44] hover:bg-[#ff5b62] text-white transition-all hover:scale-105 active:scale-95 shadow-md shadow-[#FC3C44]/10 cursor-pointer"
    >
      <AppleIcon className="w-4 h-4 md:w-5 md:h-5" />
      <span className="hidden sm:inline">Apple Music</span>
    </button>
  );
};

export const SoundCloudButton = ({ clickHandle }) => {
  return (
    <button 
      onClick={clickHandle} 
      className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full font-bold text-xs md:text-sm bg-[#FF5500] hover:bg-[#ff7324] text-white transition-all hover:scale-105 active:scale-95 shadow-md shadow-[#FF5500]/10 cursor-pointer"
    >
      <SoundCloudIcon className="w-4 h-4 md:w-5 md:h-5" />
      <span className="hidden sm:inline">SoundCloud</span>
    </button>
  );
};

export const TidalButton = ({ clickHandle }) => {
  return (
    <button 
      onClick={clickHandle} 
      className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full font-bold text-xs md:text-sm bg-black border border-white/20 hover:border-cyan-400 text-white transition-all hover:scale-105 active:scale-95 shadow-md cursor-pointer"
    >
      <TidalIcon className="w-4 h-4 md:w-5 md:h-5 text-cyan-400" />
      <span className="hidden sm:inline">Tidal</span>
    </button>
  );
};

export const SmallSpotifyButton = ({ clickHandle }) => {
    return (
        <button 
          onClick={clickHandle} 
          className="p-2 rounded-full bg-[#1DB954] hover:bg-[#1ed760] text-black hover:scale-105 active:scale-95 transition cursor-pointer"
          title="Open Spotify"
        >
            <SpotifyIcon className="w-4 h-4" />
        </button>
    );
};

export const SmallYouTubeButton = ({ clickHandle }) => {
    return (
      <button 
        onClick={clickHandle} 
        className="p-2 rounded-full bg-[#FF0000] hover:bg-[#ff3333] text-white hover:scale-105 active:scale-95 transition cursor-pointer"
        title="Watch YouTube"
      >
        <YouTubeIcon className="w-4 h-4" />
      </button>
    );
};

export const SmallAppleMusicButton = ({ clickHandle }) => {
    return (
      <button 
        onClick={clickHandle} 
        className="p-2 rounded-full bg-[#FC3C44] hover:bg-[#ff5b62] text-white hover:scale-105 active:scale-95 transition cursor-pointer"
        title="Apple Music"
      >
        <AppleIcon className="w-4 h-4" />
      </button>
    );
};

export const SmallSoundCloudButton = ({ clickHandle }) => {
    return (
      <button 
        onClick={clickHandle} 
        className="p-2 rounded-full bg-[#FF5500] hover:bg-[#ff7324] text-white hover:scale-105 active:scale-95 transition cursor-pointer"
        title="SoundCloud"
      >
        <SoundCloudIcon className="w-4 h-4" />
      </button>
    );
};

export const SmallTidalButton = ({ clickHandle }) => {
    return (
      <button 
        onClick={clickHandle} 
        className="p-2 rounded-full bg-black border border-white/20 text-white hover:scale-105 active:scale-95 transition cursor-pointer"
        title="Tidal"
      >
        <TidalIcon className="w-4 h-4 text-cyan-400" />
      </button>
    );
};

const MusicButtons = () => {
  return (
    <div className="flex gap-2">
      <SpotifyButton />
      <YouTubeButton />
    </div>
  );
};

export default MusicButtons;
