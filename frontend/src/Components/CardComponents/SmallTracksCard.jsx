// src/Components/CardComponents/SmallTracksCard.jsx
import { Bookmark, BookmarkCheck, EllipsisVertical, Link as LinkIcon, Music as MusicIcon, ListMusic } from "lucide-react";
import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
} from "../ui/dropdown-menu";

const YouTubeIcon = ({ size = 20, className }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className} 
    style={{ width: size, height: size }}
  >
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

const handleClick = (url) => {
    if (url) window.open(url, "_blank");
};

const copyToClipboard = (text) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
        navigator.clipboard.writeText(text);
        toast.success("Link copied to clipboard! 📋");
    }
};

export const AlbumTrackCard = ({
    title,
    artist,
    spoURL,
    YTURL,
    trackURI,
    trackID,
    pos,
    duration,
    coverImage,
}) => {
    const router = useRouter();
    const [saved, setSaved] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [navigatingTarget, setNavigatingTarget] = useState(null);

    const handleOpenTrack = () => {
        if (!trackID || isPending) return;
        setNavigatingTarget('track');
        startTransition(() => {
            router.push(`/track/${trackID}`);
        });
    };

    const handleOpenArtist = (artistId) => {
        if (!artistId || isPending) return;
        setNavigatingTarget(`artist-${artistId}`);
        startTransition(() => {
            router.push(`/artist/${artistId}`);
        });
    };

    useEffect(() => {
        const savedSongs = JSON.parse(localStorage.getItem("savedSongs")) || [];
        const isSaved = savedSongs.some(s => s.trackURI === trackURI || s.trackId === trackID);
        setSaved(isSaved);
    }, [trackURI, trackID]);

    const toggleSave = (e) => {
        e.stopPropagation();
        const savedSongs = JSON.parse(localStorage.getItem("savedSongs")) || [];
        if (saved) {
            const updated = savedSongs.filter(s => s.trackURI !== trackURI && s.trackId !== trackID);
            localStorage.setItem("savedSongs", JSON.stringify(updated));
            setSaved(false);
            toast.info(`"${title}" removed from your library.`);
        } else {
            const newSong = {
                title,
                artist,
                spoURL,
                trackURI,
                trackId: trackID,
            };
            savedSongs.push(newSong);
            localStorage.setItem("savedSongs", JSON.stringify(savedSongs));
            setSaved(true);
            toast.success(`"${title}" saved to library! 🎵`);
        }
    };

    const artistsQuery = artist?.map(a => a.name).join(' ') || '';
    const appleURL = `https://music.apple.com/us/search?term=${encodeURIComponent(title + ' ' + artistsQuery)}`;
    const tidalURL = `https://listen.tidal.com/search?q=${encodeURIComponent(title + ' ' + artistsQuery)}`;
    const soundcloudURL = `https://soundcloud.com/search?q=${encodeURIComponent(title + ' ' + artistsQuery)}`;

    const formattedDuration = typeof duration === 'number' && duration > 0
        ? `${Math.floor(duration / 60000)}:${Math.floor((duration % 60000) / 1000).toString().padStart(2, '0')}`
        : duration;

    return (
        <div className={`group flex items-center justify-between p-3.5 bg-[var(--theme-card)]/80 backdrop-blur-md border border-[var(--theme-border)] hover:border-[var(--theme-accent)]/50 rounded-2xl transition-all duration-300 w-full min-w-0 relative ${
            isPending ? 'opacity-80' : ''
        }`}>
            <div className="flex items-center gap-4 min-w-0 flex-1">
                <div className="flex-shrink-0 w-6 flex items-center justify-center">
                    {isPending && navigatingTarget === 'track' ? (
                        <div className="w-3.5 h-3.5 rounded-full border-2 border-[var(--theme-accent)] border-t-transparent animate-spin" />
                    ) : (
                        <span className="text-[var(--theme-muted)] group-hover:text-[var(--theme-accent)] font-bold text-sm transition-colors">{pos + 1}</span>
                    )}
                </div>

                <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                    <h3 
                        className="text-sm font-bold text-[var(--theme-fg)] truncate cursor-pointer hover:text-[var(--theme-accent)] transition-colors inline-flex items-center gap-1.5"
                        title={title}
                        onClick={handleOpenTrack}
                    >
                        <span>{title}</span>
                        {isPending && navigatingTarget === 'track' && (
                            <span className="text-[10px] text-[var(--theme-accent)] font-mono font-medium animate-pulse">Loading...</span>
                        )}
                    </h3>
                    <div className="text-xs text-[var(--theme-muted)] truncate">
                        {artist?.map((a, i) => (
                            <span 
                                key={a.id || i} 
                                className="hover:underline cursor-pointer hover:text-[var(--theme-accent)] transition-colors inline-flex items-center gap-1"
                                onClick={() => a.id && handleOpenArtist(a.id)}
                            >
                                <span>{a.name}{i < artist.length - 1 && ", "}</span>
                                {isPending && navigatingTarget === `artist-${a.id}` && (
                                    <span className="w-2.5 h-2.5 rounded-full border-2 border-[var(--theme-accent)] border-t-transparent animate-spin" />
                                )}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                {formattedDuration && <span className="text-xs text-[var(--theme-muted)] font-mono font-medium">{formattedDuration}</span>}
                
                {/* Save button */}
                <button 
                    onClick={toggleSave}
                    className={`p-1.5 rounded-lg hover:bg-[var(--theme-surface)] transition duration-200 cursor-pointer ${saved ? "text-[var(--theme-accent)]" : "text-[var(--theme-muted)] hover:text-[var(--theme-fg)]"}`}
                >
                    {saved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                </button>

                {/* Dropdown Menu for external platforms */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="p-1.5 rounded-lg hover:bg-[var(--theme-surface)] text-[var(--theme-muted)] hover:text-[var(--theme-fg)] transition cursor-pointer">
                            <EllipsisVertical size={16} />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent 
                        className="bg-[var(--theme-card)] backdrop-blur-2xl text-[var(--theme-fg)] min-w-[180px] rounded-2xl p-2 border border-[var(--theme-border)] shadow-2xl z-[9999]"
                        align="end"
                        sideOffset={8}
                    >
                        <DropdownMenuItem
                            onSelect={() => {
                                const trackToAdd = {
                                    title,
                                    artist: Array.isArray(artist) ? artist : [{ name: artist || 'Unknown Artist' }],
                                    spoURL,
                                    image: coverImage || '',
                                    trackId: trackID,
                                    trackURI: trackURI,
                                };
                                window.dispatchEvent(new CustomEvent('open-playlist-picker', { detail: { track: trackToAdd } }));
                            }}
                            className="cursor-pointer px-3 py-2 hover:bg-[var(--theme-surface)] rounded-xl transition flex items-center gap-2 text-[var(--theme-accent)]"
                        >
                            <ListMusic size={14} />
                            Add to Playlist
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onSelect={() => router.push(`/track/${trackID}`)}
                            className="cursor-pointer px-3 py-2 hover:bg-[var(--theme-surface)] rounded-xl transition flex items-center gap-2"
                        >
                            <MusicIcon size={14} className="text-[var(--theme-accent)]" />
                            Track Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onSelect={() => copyToClipboard(spoURL || `${window.location.origin}/track/${trackID}`)}
                            className="cursor-pointer px-3 py-2 hover:bg-[var(--theme-surface)] rounded-xl transition flex items-center gap-2"
                        >
                            <LinkIcon size={14} className="text-[var(--theme-muted)]" />
                            Copy Link
                        </DropdownMenuItem>
                        
                        <DropdownMenuSeparator className="my-1 bg-[var(--theme-border)]" />
                        
                        {spoURL && (
                            <DropdownMenuItem
                                onSelect={() => handleClick(spoURL)}
                                className="cursor-pointer px-3 py-2 hover:bg-[var(--theme-surface)] rounded-xl transition flex items-center gap-2"
                            >
                                <img src="/2024-spotify-logo-icon/Primary_Logo_Green_RGB.svg" className="w-4 h-4" alt="Spotify" />
                                Spotify
                            </DropdownMenuItem>
                        )}
                        {YTURL && (
                            <DropdownMenuItem
                                onSelect={() => handleClick(YTURL)}
                                className="cursor-pointer px-3 py-2 hover:bg-[var(--theme-surface)] rounded-xl transition flex items-center gap-2"
                            >
                                <YouTubeIcon size={16} className="text-red-500" />
                                YouTube
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                            onSelect={() => handleClick(appleURL)}
                            className="cursor-pointer px-3 py-2 hover:bg-[var(--theme-surface)] rounded-xl transition flex items-center gap-2"
                        >
                            <span className="text-[#FC3C44] font-extrabold text-[10px]"></span> Apple Music
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onSelect={() => handleClick(tidalURL)}
                            className="cursor-pointer px-3 py-2 hover:bg-[var(--theme-surface)] rounded-xl transition flex items-center gap-2"
                        >
                            <span className="text-cyan-400 font-extrabold text-[10px]">❖</span> Tidal
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onSelect={() => handleClick(soundcloudURL)}
                            className="cursor-pointer px-3 py-2 hover:bg-[var(--theme-surface)] rounded-xl transition flex items-center gap-2"
                        >
                            <span className="text-orange-500 font-extrabold text-[10px]">☁</span> SoundCloud
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
};

export const ArtistTrackCard = ({
    title,
    album,
    coverImage,
    spoURL,
    YTURL,
    trackURI,
    trackID,
    pos,
    duration,
}) => {
    const router = useRouter();
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        const savedSongs = JSON.parse(localStorage.getItem("savedSongs")) || [];
        const isSaved = savedSongs.some(s => s.trackURI === trackURI || s.trackId === trackID);
        setSaved(isSaved);
    }, [trackURI, trackID]);

    const toggleSave = (e) => {
        e.stopPropagation();
        const savedSongs = JSON.parse(localStorage.getItem("savedSongs")) || [];
        if (saved) {
            const updated = savedSongs.filter(s => s.trackURI !== trackURI && s.trackId !== trackID);
            localStorage.setItem("savedSongs", JSON.stringify(updated));
            setSaved(false);
            toast.info(`"${title}" removed from your library.`);
        } else {
            const newSong = {
                title,
                spoURL,
                image: coverImage,
                trackURI,
                album,
                trackId: trackID,
            };
            savedSongs.push(newSong);
            localStorage.setItem("savedSongs", JSON.stringify(savedSongs));
            setSaved(true);
            toast.success(`"${title}" saved to library! 🎵`);
        }
    };

    const artistsQuery = typeof album === "string" ? album : album?.name || "";
    const appleURL = `https://music.apple.com/us/search?term=${encodeURIComponent(title + ' ' + artistsQuery)}`;
    const tidalURL = `https://listen.tidal.com/search?q=${encodeURIComponent(title + ' ' + artistsQuery)}`;
    const soundcloudURL = `https://soundcloud.com/search?q=${encodeURIComponent(title + ' ' + artistsQuery)}`;

    return (
        <div className="group flex items-center justify-between p-3.5 bg-[var(--theme-card)]/80 backdrop-blur-md border border-[var(--theme-border)] hover:border-[var(--theme-accent)]/50 rounded-2xl transition-all duration-300 w-full min-w-0 relative">
            <div className="flex items-center gap-4 min-w-0 flex-1">
                <div className="flex-shrink-0 w-6 flex items-center justify-center">
                    <span className="text-[var(--theme-muted)] group-hover:text-[var(--theme-accent)] font-bold text-sm transition-colors">{pos + 1}</span>
                </div>

                <div className="flex-shrink-0 relative w-10 h-10 rounded-lg overflow-hidden bg-[var(--theme-surface)] border border-[var(--theme-border)]">
                    <img
                        src={coverImage || "https://placehold.co/200x200/17020B/E8A87C?text=Track"}
                        alt={title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            e.currentTarget.src = 'https://placehold.co/200x200/17020B/E8A87C?text=Track';
                        }}
                    />
                </div>

                <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                    <h3 
                        className="text-sm font-bold text-[var(--theme-fg)] truncate cursor-pointer hover:text-[var(--theme-accent)] transition-colors"
                        title={title}
                        onClick={() => router.push(`/track/${trackID}`)}
                    >
                        {title}
                    </h3>
                    <span className="text-xs text-[var(--theme-muted)] truncate">{album?.name || album}</span>
                </div>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                {duration && <span className="text-xs text-[var(--theme-muted)] font-mono font-medium">{duration}</span>}
                
                {/* Save button */}
                <button 
                    onClick={toggleSave}
                    className={`p-1.5 rounded-lg hover:bg-[var(--theme-surface)] transition duration-200 cursor-pointer ${saved ? "text-[var(--theme-accent)]" : "text-[var(--theme-muted)] hover:text-[var(--theme-fg)]"}`}
                >
                    {saved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                </button>

                {/* Dropdown Menu for external platforms */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="p-1.5 rounded-lg hover:bg-[var(--theme-surface)] text-[var(--theme-muted)] hover:text-[var(--theme-fg)] transition cursor-pointer">
                            <EllipsisVertical size={16} />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent 
                        className="bg-[var(--theme-card)] backdrop-blur-2xl text-[var(--theme-fg)] min-w-[180px] rounded-2xl p-2 border border-[var(--theme-border)] shadow-2xl z-[9999]"
                        align="end"
                        sideOffset={8}
                    >
                        <DropdownMenuItem
                            onSelect={() => {
                                const trackToAdd = {
                                    title,
                                    artist: [{ name: typeof album === "string" ? album : album?.name || "Unknown Artist" }],
                                    spoURL,
                                    image: coverImage || '',
                                    trackId: trackID,
                                    trackURI: trackURI,
                                };
                                window.dispatchEvent(new CustomEvent('open-playlist-picker', { detail: { track: trackToAdd } }));
                            }}
                            className="cursor-pointer px-3 py-2 hover:bg-[var(--theme-surface)] rounded-xl transition flex items-center gap-2 text-[var(--theme-accent)]"
                        >
                            <ListMusic size={14} />
                            Add to Playlist
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onSelect={() => router.push(`/track/${trackID}`)}
                            className="cursor-pointer px-3 py-2 hover:bg-[var(--theme-surface)] rounded-xl transition flex items-center gap-2"
                        >
                            <MusicIcon size={14} className="text-[var(--theme-accent)]" />
                            Track Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onSelect={() => copyToClipboard(spoURL || `${window.location.origin}/track/${trackID}`)}
                            className="cursor-pointer px-3 py-2 hover:bg-[var(--theme-surface)] rounded-xl transition flex items-center gap-2"
                        >
                            <LinkIcon size={14} className="text-[var(--theme-muted)]" />
                            Copy Link
                        </DropdownMenuItem>
                        
                        <DropdownMenuSeparator className="my-1 bg-[var(--theme-border)]" />
                        
                        {spoURL && (
                            <DropdownMenuItem
                                onSelect={() => handleClick(spoURL)}
                                className="cursor-pointer px-3 py-2 hover:bg-[var(--theme-surface)] rounded-xl transition flex items-center gap-2"
                            >
                                <img src="/2024-spotify-logo-icon/Primary_Logo_Green_RGB.svg" className="w-4 h-4" alt="Spotify" />
                                Spotify
                            </DropdownMenuItem>
                        )}
                        {YTURL && (
                            <DropdownMenuItem
                                onSelect={() => handleClick(YTURL)}
                                className="cursor-pointer px-3 py-2 hover:bg-[var(--theme-surface)] rounded-xl transition flex items-center gap-2"
                            >
                                <YouTubeIcon size={16} className="text-red-500" />
                                YouTube
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                            onSelect={() => handleClick(appleURL)}
                            className="cursor-pointer px-3 py-2 hover:bg-[var(--theme-surface)] rounded-xl transition flex items-center gap-2"
                        >
                            <span className="text-[#FC3C44] font-extrabold text-[10px]"></span> Apple Music
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onSelect={() => handleClick(tidalURL)}
                            className="cursor-pointer px-3 py-2 hover:bg-[var(--theme-surface)] rounded-xl transition flex items-center gap-2"
                        >
                            <span className="text-cyan-400 font-extrabold text-[10px]">❖</span> Tidal
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onSelect={() => handleClick(soundcloudURL)}
                            className="cursor-pointer px-3 py-2 hover:bg-[var(--theme-surface)] rounded-xl transition flex items-center gap-2"
                        >
                            <span className="text-orange-500 font-extrabold text-[10px]">☁</span> SoundCloud
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
};

export const PlaylistTrackCard = ({
    title,
    artist,
    album,
    coverImage,
    spoURL,
    YTURL,
    trackURI,
    trackID,
    pos,
    duration,
}) => {
    const router = useRouter();
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        const savedSongs = JSON.parse(localStorage.getItem("savedSongs")) || [];
        const isSaved = savedSongs.some(s => s.trackURI === trackURI || s.trackId === trackID);
        setSaved(isSaved);
    }, [trackURI, trackID]);

    const toggleSave = (e) => {
        e.stopPropagation();
        const savedSongs = JSON.parse(localStorage.getItem("savedSongs")) || [];
        if (saved) {
            const updated = savedSongs.filter(s => s.trackURI !== trackURI && s.trackId !== trackID);
            localStorage.setItem("savedSongs", JSON.stringify(updated));
            setSaved(false);
            toast.info(`"${title}" removed from your library.`);
        } else {
            const newSong = {
                title,
                artist,
                spoURL,
                image: coverImage,
                trackURI,
                album,
                trackId: trackID,
            };
            savedSongs.push(newSong);
            localStorage.setItem("savedSongs", JSON.stringify(savedSongs));
            setSaved(true);
            toast.success(`"${title}" saved to library! 🎵`);
        }
    };

    const artistsQuery = artist?.map(a => a.name).join(' ') || '';
    const appleURL = `https://music.apple.com/us/search?term=${encodeURIComponent(title + ' ' + artistsQuery)}`;
    const tidalURL = `https://listen.tidal.com/search?q=${encodeURIComponent(title + ' ' + artistsQuery)}`;
    const soundcloudURL = `https://soundcloud.com/search?q=${encodeURIComponent(title + ' ' + artistsQuery)}`;

    return (
        <div className="group flex items-center justify-between p-3.5 bg-[var(--theme-card)]/80 backdrop-blur-md border border-[var(--theme-border)] hover:border-[var(--theme-accent)]/50 rounded-2xl transition-all duration-300 w-full min-w-0 relative">
            <div className="flex items-center gap-4 min-w-0 flex-1">
                <div className="flex-shrink-0 w-6 flex items-center justify-center">
                    <span className="text-[var(--theme-muted)] group-hover:text-[var(--theme-accent)] font-bold text-sm transition-colors">{pos + 1}</span>
                </div>

                <div className="flex-shrink-0 relative w-10 h-10 rounded-lg overflow-hidden bg-[var(--theme-surface)] border border-[var(--theme-border)]">
                    <img
                        src={coverImage || "https://placehold.co/200x200/17020B/E8A87C?text=Track"}
                        alt={title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            e.currentTarget.src = 'https://placehold.co/200x200/17020B/E8A87C?text=Track';
                        }}
                    />
                </div>

                <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                    <h3 
                        className="text-sm font-bold text-[var(--theme-fg)] truncate cursor-pointer hover:text-[var(--theme-accent)] transition-colors"
                        title={title}
                        onClick={() => router.push(`/track/${trackID}`)}
                    >
                        {title}
                    </h3>
                    <div className="text-xs text-[var(--theme-muted)] truncate">
                        {artist?.map((a, i) => (
                            <span 
                                key={a.id || i} 
                                className="hover:underline cursor-pointer hover:text-[var(--theme-accent)] transition-colors"
                                onClick={() => a.id && router.push(`/artist/${a.id}`)}
                            >
                                {a.name}{i < artist.length - 1 && ", "}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                {duration && <span className="text-xs text-[var(--theme-muted)] font-mono font-medium">{duration}</span>}
                
                {/* Save button */}
                <button 
                    onClick={toggleSave}
                    className={`p-1.5 rounded-lg hover:bg-[var(--theme-surface)] transition duration-200 cursor-pointer ${saved ? "text-[var(--theme-accent)]" : "text-[var(--theme-muted)] hover:text-[var(--theme-fg)]"}`}
                >
                    {saved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                </button>

                {/* Dropdown Menu for external platforms */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="p-1.5 rounded-lg hover:bg-[var(--theme-surface)] text-[var(--theme-muted)] hover:text-[var(--theme-fg)] transition cursor-pointer">
                            <EllipsisVertical size={16} />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent 
                        className="bg-[var(--theme-card)] backdrop-blur-2xl text-[var(--theme-fg)] min-w-[180px] rounded-2xl p-2 border border-[var(--theme-border)] shadow-2xl z-[9999]"
                        align="end"
                        sideOffset={8}
                    >
                        <DropdownMenuItem
                            onSelect={() => {
                                const trackToAdd = {
                                    title,
                                    artist: Array.isArray(artist) ? artist : [{ name: artist || 'Unknown Artist' }],
                                    spoURL,
                                    image: coverImage || '',
                                    trackId: trackID,
                                    trackURI: trackURI,
                                };
                                window.dispatchEvent(new CustomEvent('open-playlist-picker', { detail: { track: trackToAdd } }));
                            }}
                            className="cursor-pointer px-3 py-2 hover:bg-[var(--theme-surface)] rounded-xl transition flex items-center gap-2 text-[var(--theme-accent)]"
                        >
                            <ListMusic size={14} />
                            Add to Playlist
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onSelect={() => router.push(`/track/${trackID}`)}
                            className="cursor-pointer px-3 py-2 hover:bg-[var(--theme-surface)] rounded-xl transition flex items-center gap-2"
                        >
                            <MusicIcon size={14} className="text-[var(--theme-accent)]" />
                            Track Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onSelect={() => copyToClipboard(spoURL || `${window.location.origin}/track/${trackID}`)}
                            className="cursor-pointer px-3 py-2 hover:bg-[var(--theme-surface)] rounded-xl transition flex items-center gap-2"
                        >
                            <LinkIcon size={14} className="text-[var(--theme-muted)]" />
                            Copy Link
                        </DropdownMenuItem>
                        
                        <DropdownMenuSeparator className="my-1 bg-[var(--theme-border)]" />
                        
                        {spoURL && (
                            <DropdownMenuItem
                                onSelect={() => handleClick(spoURL)}
                                className="cursor-pointer px-3 py-2 hover:bg-[var(--theme-surface)] rounded-xl transition flex items-center gap-2"
                            >
                                <img src="/2024-spotify-logo-icon/Primary_Logo_Green_RGB.svg" className="w-4 h-4" alt="Spotify" />
                                Spotify
                            </DropdownMenuItem>
                        )}
                        {YTURL && (
                            <DropdownMenuItem
                                onSelect={() => handleClick(YTURL)}
                                className="cursor-pointer px-3 py-2 hover:bg-[var(--theme-surface)] rounded-xl transition flex items-center gap-2"
                            >
                                <YouTubeIcon size={16} className="text-red-500" />
                                YouTube
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                            onSelect={() => handleClick(appleURL)}
                            className="cursor-pointer px-3 py-2 hover:bg-[var(--theme-surface)] rounded-xl transition flex items-center gap-2"
                        >
                            <span className="text-[#FC3C44] font-extrabold text-[10px]"></span> Apple Music
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onSelect={() => handleClick(tidalURL)}
                            className="cursor-pointer px-3 py-2 hover:bg-[var(--theme-surface)] rounded-xl transition flex items-center gap-2"
                        >
                            <span className="text-cyan-400 font-extrabold text-[10px]">❖</span> Tidal
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onSelect={() => handleClick(soundcloudURL)}
                            className="cursor-pointer px-3 py-2 hover:bg-[var(--theme-surface)] rounded-xl transition flex items-center gap-2"
                        >
                            <span className="text-orange-500 font-extrabold text-[10px]">☁</span> SoundCloud
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
};

export const SmallTrackCardWithCover = ({
    title,
    artist,
    coverImage,
    spoURL,
    YTURL,
    trackURI,
    trackID,
    pos,
    subtitle,
}) => {
    const router = useRouter();
    const [saved, setSaved] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [navigatingTarget, setNavigatingTarget] = useState(null);

    const handleOpenTrack = () => {
        if (!trackID || isPending) return;
        setNavigatingTarget('track');
        startTransition(() => {
            router.push(`/track/${trackID}`);
        });
    };

    const handleOpenArtist = (artistId) => {
        if (!artistId || isPending) return;
        setNavigatingTarget(`artist-${artistId}`);
        startTransition(() => {
            router.push(`/artist/${artistId}`);
        });
    };

    useEffect(() => {
        const savedSongs = JSON.parse(localStorage.getItem("savedSongs")) || [];
        const isSaved = savedSongs.some(s => s.trackURI === trackURI || s.trackId === trackID);
        setSaved(isSaved);
    }, [trackURI, trackID]);

    const toggleSave = (e) => {
        e.stopPropagation();
        const savedSongs = JSON.parse(localStorage.getItem("savedSongs")) || [];
        if (saved) {
            const updated = savedSongs.filter(s => s.trackURI !== trackURI && s.trackId !== trackID);
            localStorage.setItem("savedSongs", JSON.stringify(updated));
            setSaved(false);
            toast.info(`"${title}" removed from your library.`);
        } else {
            const newSong = {
                title,
                artist,
                spoURL,
                image: coverImage,
                trackURI,
                trackId: trackID,
            };
            savedSongs.push(newSong);
            localStorage.setItem("savedSongs", JSON.stringify(savedSongs));
            setSaved(true);
            toast.success(`"${title}" saved to library! 🎵`);
        }
    };

    const artistsQuery = Array.isArray(artist) ? artist.map(a => a.name).join(' ') : subtitle || "";
    const appleURL = `https://music.apple.com/us/search?term=${encodeURIComponent(title + ' ' + artistsQuery)}`;
    const tidalURL = `https://listen.tidal.com/search?q=${encodeURIComponent(title + ' ' + artistsQuery)}`;
    const soundcloudURL = `https://soundcloud.com/search?q=${encodeURIComponent(title + ' ' + artistsQuery)}`;

    return (
        <div className={`group flex items-center justify-between p-3 bg-[var(--theme-card)]/80 backdrop-blur-md border border-[var(--theme-border)] hover:border-[var(--theme-accent)]/50 rounded-2xl transition-all duration-300 w-full min-w-0 ${
            isPending ? 'opacity-85' : ''
        }`}>
            <div className="flex items-center gap-4 min-w-0 flex-1">
                {pos !== undefined && (
                    <div className="flex-shrink-0 w-6 flex items-center justify-center">
                        <span className="text-[var(--theme-muted)] group-hover:text-[var(--theme-accent)] font-bold text-sm transition-colors">{pos + 1}</span>
                    </div>
                )}

                <div 
                    onClick={handleOpenTrack}
                    className="flex-shrink-0 relative w-11 h-11 sm:w-12 sm:h-12 rounded-xl overflow-hidden bg-[var(--theme-surface)] border border-[var(--theme-border)] cursor-pointer"
                >
                    <img
                        src={coverImage || "https://placehold.co/200x200/17020B/E8A87C?text=Track"}
                        alt={title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            e.currentTarget.src = 'https://placehold.co/200x200/17020B/E8A87C?text=Track';
                        }}
                    />
                    {isPending && navigatingTarget === 'track' && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] flex items-center justify-center animate-fade-in z-10">
                            <div className="w-5 h-5 rounded-full border-2 border-[var(--theme-accent)] border-t-transparent animate-spin" />
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                    <h3
                        className="text-sm font-bold text-[var(--theme-fg)] truncate cursor-pointer hover:text-[var(--theme-accent)] transition-colors leading-tight inline-flex items-center gap-1.5"
                        title={title}
                        onClick={handleOpenTrack}
                    >
                        <span>{title}</span>
                        {isPending && navigatingTarget === 'track' && (
                            <span className="text-[10px] text-[var(--theme-accent)] font-mono font-medium animate-pulse">Loading...</span>
                        )}
                    </h3>
                    <div className="text-xs text-[var(--theme-muted)] truncate">
                        {subtitle ? (
                            <span title={subtitle}>{subtitle}</span>
                        ) : (
                            artist?.map((a, i) => (
                                <span 
                                    key={a.id || i}
                                    className="hover:underline cursor-pointer hover:text-[var(--theme-accent)] transition-colors inline-flex items-center gap-1"
                                    onClick={() => a.id && handleOpenArtist(a.id)}
                                >
                                    <span>{a.name}{i < artist.length - 1 && ", "}</span>
                                    {isPending && navigatingTarget === `artist-${a.id}` && (
                                        <span className="w-2.5 h-2.5 rounded-full border-2 border-[var(--theme-accent)] border-t-transparent animate-spin" />
                                    )}
                                </span>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                {/* Save button */}
                <button 
                    onClick={toggleSave}
                    className={`p-1.5 rounded-lg hover:bg-[var(--theme-surface)] transition duration-200 cursor-pointer ${saved ? "text-[var(--theme-accent)]" : "text-[var(--theme-muted)] hover:text-[var(--theme-fg)]"}`}
                >
                    {saved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                </button>

                {/* Dropdown Menu for external platforms */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="p-1.5 rounded-lg hover:bg-[var(--theme-surface)] text-[var(--theme-muted)] hover:text-[var(--theme-fg)] transition cursor-pointer">
                            <EllipsisVertical size={16} />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent 
                        className="bg-[var(--theme-card)] backdrop-blur-2xl text-[var(--theme-fg)] min-w-[180px] rounded-2xl p-2 border border-[var(--theme-border)] shadow-2xl z-[9999]"
                        align="end"
                        sideOffset={8}
                    >
                        <DropdownMenuItem
                            onSelect={() => {
                                const trackToAdd = {
                                    title,
                                    artist: Array.isArray(artist) ? artist : [{ name: artist || subtitle || 'Unknown Artist' }],
                                    spoURL,
                                    image: coverImage || '',
                                    trackId: trackID,
                                    trackURI: trackURI,
                                };
                                window.dispatchEvent(new CustomEvent('open-playlist-picker', { detail: { track: trackToAdd } }));
                            }}
                            className="cursor-pointer px-3 py-2 hover:bg-[var(--theme-surface)] rounded-xl transition flex items-center gap-2 text-[var(--theme-accent)]"
                        >
                            <ListMusic size={14} />
                            Add to Playlist
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onSelect={() => router.push(`/track/${trackID}`)}
                            className="cursor-pointer px-3 py-2 hover:bg-[var(--theme-surface)] rounded-xl transition flex items-center gap-2"
                        >
                            <MusicIcon size={14} className="text-[var(--theme-accent)]" />
                            Track Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onSelect={() => copyToClipboard(spoURL || `${window.location.origin}/track/${trackID}`)}
                            className="cursor-pointer px-3 py-2 hover:bg-[var(--theme-surface)] rounded-xl transition flex items-center gap-2"
                        >
                            <LinkIcon size={14} className="text-[var(--theme-muted)]" />
                            Copy Link
                        </DropdownMenuItem>
                        
                        <DropdownMenuSeparator className="my-1 bg-[var(--theme-border)]" />
                        
                        {spoURL && (
                            <DropdownMenuItem
                                onSelect={() => handleClick(spoURL)}
                                className="cursor-pointer px-3 py-2 hover:bg-[var(--theme-surface)] rounded-xl transition flex items-center gap-2"
                            >
                                <img src="/2024-spotify-logo-icon/Primary_Logo_Green_RGB.svg" className="w-4 h-4" alt="Spotify" />
                                Spotify
                            </DropdownMenuItem>
                        )}
                        {YTURL && (
                            <DropdownMenuItem
                                onSelect={() => handleClick(YTURL)}
                                className="cursor-pointer px-3 py-2 hover:bg-[var(--theme-surface)] rounded-xl transition flex items-center gap-2"
                            >
                                <YouTubeIcon size={16} className="text-red-500" />
                                YouTube
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                            onSelect={() => handleClick(appleURL)}
                            className="cursor-pointer px-3 py-2 hover:bg-[var(--theme-surface)] rounded-xl transition flex items-center gap-2"
                        >
                            <span className="text-[#FC3C44] font-extrabold text-[10px]"></span> Apple Music
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onSelect={() => handleClick(tidalURL)}
                            className="cursor-pointer px-3 py-2 hover:bg-[var(--theme-surface)] rounded-xl transition flex items-center gap-2"
                        >
                            <span className="text-cyan-400 font-extrabold text-[10px]">❖</span> Tidal
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onSelect={() => handleClick(soundcloudURL)}
                            className="cursor-pointer px-3 py-2 hover:bg-[var(--theme-surface)] rounded-xl transition flex items-center gap-2"
                        >
                            <span className="text-orange-500 font-extrabold text-[10px]">☁</span> SoundCloud
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
};