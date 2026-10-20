// src/Components/GrooveCardComposer.jsx
"use client";

import React, { useRef, useState, useEffect, useMemo } from 'react';
import { 
    ArrowLeft, 
    Download, 
    Share2, 
    Sparkles, 
    Palette, 
    Star, 
    Calendar, 
    Sliders,
    QrCode,
    Check,
    X,
    EyeOff
} from 'lucide-react';
import { toPng } from 'html-to-image';
import { createPortal } from 'react-dom';
import { toast } from '@/lib/toast';

// Client-side generated high-fidelity noise PNG data URI generator
let cachedNoiseUri = null;
function getClientNoiseUri() {
    if (cachedNoiseUri) return cachedNoiseUri;
    if (typeof document === 'undefined') return '';
    try {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        if (!ctx) return '';
        const imgData = ctx.createImageData(128, 128);
        const data = imgData.data;
        for (let i = 0; i < data.length; i += 4) {
            const v = (Math.random() * 255) | 0;
            data[i] = v;
            data[i + 1] = v;
            data[i + 2] = v;
            data[i + 3] = 255;
        }
        ctx.putImageData(imgData, 0, 0);
        cachedNoiseUri = canvas.toDataURL('image/png');
        return cachedNoiseUri;
    } catch (_) {
        return '';
    }
}

// Sophisticated, minimalist abstract backgrounds (no harsh gaudy blobs)
const THEMES = {
    obsidian: {
        id: 'obsidian',
        label: 'Obsidian',
        bgStyle: {
            background: 'radial-gradient(ellipse at 50% 0%, #1f2029 0%, #0d0e13 60%, #050608 100%)',
        },
        border: 'rgba(255, 255, 255, 0.12)',
        preview: '#14151c',
        accent: '#E8A87C',
        isLight: false,
    },
    midnight: {
        id: 'midnight',
        label: 'Midnight',
        bgStyle: {
            background: 'radial-gradient(ellipse at 60% 0%, #17223b 0%, #0b1122 60%, #04070e 100%)',
        },
        border: 'rgba(56, 189, 248, 0.25)',
        preview: '#0e172e',
        accent: '#38BDF8',
        isLight: false,
    },
    amber: {
        id: 'amber',
        label: 'Amber',
        bgStyle: {
            background: 'radial-gradient(ellipse at 40% 0%, #2b1a0e 0%, #160c06 60%, #080402 100%)',
        },
        border: 'rgba(245, 158, 11, 0.25)',
        preview: '#201208',
        accent: '#F59E0B',
        isLight: false,
    },
    slate: {
        id: 'slate',
        label: 'Slate',
        bgStyle: {
            background: 'radial-gradient(ellipse at 50% 10%, #262933 0%, #14151a 60%, #090a0d 100%)',
        },
        border: 'rgba(255, 255, 255, 0.14)',
        preview: '#1a1c24',
        accent: '#E2E8F0',
        isLight: false,
    },
    emerald: {
        id: 'emerald',
        label: 'Emerald',
        bgStyle: {
            background: 'radial-gradient(ellipse at 60% 0%, #11261d 0%, #081610 60%, #030805 100%)',
        },
        border: 'rgba(16, 185, 129, 0.25)',
        preview: '#0b1d15',
        accent: '#10B981',
        isLight: false,
    },
    bordeaux: {
        id: 'bordeaux',
        label: 'Bordeaux',
        bgStyle: {
            background: 'radial-gradient(ellipse at 35% 0%, #2b0d1c 0%, #17060e 60%, #080205 100%)',
        },
        border: 'rgba(244, 63, 94, 0.25)',
        preview: '#200813',
        accent: '#F43F5E',
        isLight: false,
    },
    monochrome: {
        id: 'monochrome',
        label: 'Carbon',
        bgStyle: {
            background: 'linear-gradient(180deg, #18181b 0%, #09090b 100%)',
        },
        border: 'rgba(255, 255, 255, 0.15)',
        preview: '#111113',
        accent: '#FFFFFF',
        isLight: false,
    },
    cream: {
        id: 'cream',
        label: 'Studio Cream',
        bgStyle: {
            background: 'linear-gradient(180deg, #F6F4EE 0%, #EAE7DC 100%)',
        },
        border: 'rgba(0, 0, 0, 0.12)',
        preview: '#F0ECE1',
        accent: '#17020B',
        isLight: true,
    },
};

const QR_COLORS = [
    { label: 'Black', hex: '000000', class: 'bg-black border-white/20' },
    { label: 'Purple', hex: '9333ea', class: 'bg-purple-600 border-transparent' },
    { label: 'Emerald', hex: '10b981', class: 'bg-emerald-500 border-transparent' },
    { label: 'Cyan', hex: '06b6d4', class: 'bg-cyan-500 border-transparent' },
    { label: 'Rose', hex: 'ec4899', class: 'bg-rose-500 border-transparent' },
    { label: 'Amber', hex: 'f59e0b', class: 'bg-amber-500 border-transparent' }
];

export default function GrooveCardComposer({
    isOpen,
    onClose,
    itemId,
    title,
    artist,
    imageUrl,
    popularity,
    rating,
    explicit,
    type = "track", // track, album, artist, playlist
    platform = "musicbrainz",
    releaseDate, // accurate date string e.g. "1975-10-31" or "1975"
    releaseYear: propReleaseYear,
    album,
    duration, // duration in ms or seconds
    discCount, // number of discs
    totalTracks, // total tracks count
    genres = [],
}) {
    const cardRef = useRef(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [noiseDataUri, setNoiseDataUri] = useState('');
    
    // Customization states
    const [cardTheme, setCardTheme] = useState('obsidian');
    const [noiseLevel, setNoiseLevel] = useState('medium'); // 'none' | 'subtle' | 'medium' | 'heavy'
    const [cornerWidget, setCornerWidget] = useState('rating'); // 'rating' (default) | 'qr' | 'none'
    const [qrColor, setQrColor] = useState('000000');
    const [qrFullScreen, setQrFullScreen] = useState(false);
    const [dateMode, setDateMode] = useState('year'); // 'year' (default) | 'full' | 'monthYear' | 'none'
    const [showDuration, setShowDuration] = useState(false);
    const [showDiscs, setShowDiscs] = useState(false);

    // Mobile editor active tab
    const [mobileTab, setMobileTab] = useState('theme'); // 'theme' | 'grain' | 'widget' | 'date' | 'info'

    // Initialize grain texture once on client mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            setNoiseDataUri(getClientNoiseUri());
        }
    }, []);

    // Full-page takeover: hide background scroll and global app bar when open
    useEffect(() => {
        if (!isOpen) return;
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        document.documentElement.classList.add('groovecard-active');
        return () => {
            document.body.style.overflow = originalOverflow;
            document.documentElement.classList.remove('groovecard-active');
        };
    }, [isOpen]);

    // Close on Escape key
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                if (qrFullScreen) {
                    setQrFullScreen(false);
                } else {
                    onClose?.();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, qrFullScreen, onClose]);

    // Compute release date representations
    const dateInfo = useMemo(() => {
        const raw = releaseDate 
            ? String(releaseDate).trim() 
            : (propReleaseYear ? String(propReleaseYear).trim() : null);
        if (!raw) return { year: null, full: null, monthYear: null };

        // 4-digit year match
        const yearMatch = raw.match(/\b(19\d{2}|20\d{2})\b/);
        const year = yearMatch ? yearMatch[1] : raw;

        let full = year;
        let monthYear = year;

        const parsed = new Date(raw);
        if (!isNaN(parsed.getTime())) {
            try {
                full = parsed.toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    timeZone: "UTC"
                });
                monthYear = parsed.toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    timeZone: "UTC"
                });
            } catch (_) {}
        }

        return { year, full, monthYear };
    }, [releaseDate, propReleaseYear]);

    // Active displayed date string based on dateMode
    const displayDate = useMemo(() => {
        if (dateMode === 'none') return null;
        if (dateMode === 'year') return dateInfo.year;
        if (dateMode === 'full') return dateInfo.full || dateInfo.year;
        if (dateMode === 'monthYear') return dateInfo.monthYear || dateInfo.year;
        return dateInfo.year;
    }, [dateMode, dateInfo]);

    // Format duration helper (supports ms or seconds)
    const formattedDuration = useMemo(() => {
        if (!duration || duration <= 0) return null;
        const totalSecs = Math.floor(duration > 1000 ? duration / 1000 : duration);
        const mins = Math.floor(totalSecs / 60);
        const secs = totalSecs % 60;
        if (mins >= 60) {
            const hours = Math.floor(mins / 60);
            const remMins = mins % 60;
            return `${hours}h ${remMins}m`;
        }
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }, [duration]);

    // Format discs / tracks helper
    const formattedDiscs = useMemo(() => {
        const dCount = discCount && Number(discCount) > 0 ? Number(discCount) : null;
        const tCount = totalTracks && Number(totalTracks) > 0 ? Number(totalTracks) : null;
        if (dCount && dCount > 1) {
            return tCount ? `${dCount} Discs · ${tCount} Tracks` : `${dCount} Discs`;
        }
        if (tCount && tCount > 1) {
            return `${tCount} Tracks`;
        }
        if (dCount === 1 && type === 'track') {
            return 'Disc 1';
        }
        return null;
    }, [discCount, totalTracks, type]);

    // Calculate rating on 1-10 scale
    const score10 = useMemo(() => {
        if (rating?.value !== undefined && rating?.value !== null) {
            const v = Number(rating.value);
            return Math.max(1, Math.min(10, Number((v <= 5 ? v * 2 : v).toFixed(1))));
        }
        if (popularity !== undefined && popularity !== null) {
            const pop = Number(popularity);
            return Math.max(1, Math.min(10, Number((pop / 10).toFixed(1))));
        }
        return 8.8;
    }, [rating, popularity]);

    // Rating color
    const ratingColor = useMemo(() => {
        if (score10 >= 8) return '#10B981'; // Green
        if (score10 >= 5) return '#F59E0B'; // Amber
        return '#EF4444'; // Red
    }, [score10]);

    // Generate clean share url based on current site host
    const shareUrl = typeof window !== "undefined" 
        ? `${window.location.origin}/${type || 'track'}/${itemId}?groovelink=true`
        : '';

    const qrApi = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(shareUrl)}&color=${qrColor}&bgcolor=ffffff&ecc=H&format=png`;

    const currentTheme = THEMES[cardTheme] || THEMES.obsidian;

    // Circular pie SVG calculations
    const pieRadius = 16;
    const pieCircumference = 2 * Math.PI * pieRadius;
    const pieOffset = pieCircumference * (1 - score10 / 10);

    // Format metadata items inline with clean dot separators (NO BOXES)
    const metaItems = useMemo(() => {
        const items = [];
        if (displayDate) items.push(displayDate);
        if (showDuration && formattedDuration) items.push(formattedDuration);
        if (showDiscs && formattedDiscs) items.push(formattedDiscs);
        return items;
    }, [displayDate, showDuration, formattedDuration, showDiscs, formattedDiscs]);

    // Grain opacity mapping
    const grainOpacity = useMemo(() => {
        if (noiseLevel === 'none') return 0;
        if (noiseLevel === 'subtle') return currentTheme.isLight ? 0.15 : 0.22;
        if (noiseLevel === 'medium') return currentTheme.isLight ? 0.28 : 0.40;
        if (noiseLevel === 'heavy') return currentTheme.isLight ? 0.48 : 0.65;
        return 0;
    }, [noiseLevel, currentTheme.isLight]);

    // Generate high-resolution card PNG representation
    const generateCardImage = async () => {
        if (!cardRef.current) return null;
        const disabledSheets = [];
        try {
            if (typeof document !== 'undefined') {
                const linkElements = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
                linkElements.forEach(link => {
                    try {
                        if (link.sheet) {
                            const _rules = link.sheet.cssRules;
                        }
                    } catch (e) {
                        link.disabled = true;
                        disabledSheets.push(link);
                    }
                });

                for (let i = 0; i < document.styleSheets.length; i++) {
                    const sheet = document.styleSheets[i];
                    try {
                        const _rules = sheet.cssRules;
                    } catch (e) {
                        try {
                            sheet.disabled = true;
                            disabledSheets.push(sheet);
                        } catch (err) {}
                    }
                }
            }

            const dataUrl = await toPng(cardRef.current, {
                quality: 1.0,
                pixelRatio: 3,
                style: {
                    transform: 'scale(1)',
                    transformOrigin: 'top left',
                    width: cardRef.current.offsetWidth + 'px',
                    height: cardRef.current.offsetHeight + 'px'
                },
                cacheBust: true,
                useCORS: true
            });

            const fileName = `groovecard_${(title || 'music').replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png`;
            return { dataUrl, fileName };
        } finally {
            disabledSheets.forEach(node => {
                node.disabled = false;
            });
        }
    };

    // Share Card as image file (Web Share API) or fallback
    const handleShareCard = async () => {
        setIsGenerating(true);
        try {
            const result = await generateCardImage();
            if (!result) return;
            const { dataUrl, fileName } = result;

            const res = await fetch(dataUrl);
            const blob = await res.blob();
            const file = new File([blob], fileName, { type: 'image/png' });

            if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
                try {
                    await navigator.share({
                        files: [file],
                        title: `${title} - GrooveCard`,
                    });
                    return;
                } catch (shareErr) {
                    if (shareErr.name === 'AbortError') return;
                }
            }

            const link = document.createElement('a');
            link.download = fileName;
            link.href = dataUrl;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success('Card image saved! 🎨');
        } catch (error) {
            console.error('Error sharing card image:', error);
            toast.error('Failed to export card image.');
        } finally {
            setIsGenerating(false);
        }
    };

    // Download Card as PNG image file
    const handleDownloadCard = async () => {
        setIsGenerating(true);
        try {
            const result = await generateCardImage();
            if (!result) return;
            const { dataUrl, fileName } = result;

            const link = document.createElement('a');
            link.download = fileName;
            link.href = dataUrl;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success('Card downloaded! 🎨');
        } catch (error) {
            console.error('Error downloading card image:', error);
            toast.error('Failed to download card image.');
        } finally {
            setIsGenerating(false);
        }
    };

    if (!isOpen || typeof window === "undefined") return null;

    const artistLabel = Array.isArray(artist) 
        ? artist.map(a => a.name).join(', ') 
        : artist;

    return createPortal(
        <div className="fixed inset-0 z-[99999] bg-[#07070A] text-white flex flex-col w-screen h-[100dvh] overflow-hidden select-none font-sans">
            {/* Top Bar: Back on Left, Title in Center, Share & Download on Right */}
            <header className="h-14 sm:h-16 px-3 sm:px-6 border-b border-white/10 bg-[#0c0c12]/95 backdrop-blur-md flex items-center justify-between shrink-0 z-40">
                {/* Left: Back to details */}
                <button 
                    onClick={onClose}
                    className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-full hover:bg-white/10 active:scale-95 text-white/80 hover:text-white transition-all cursor-pointer"
                    title="Exit Card Studio"
                >
                    <ArrowLeft size={18} />
                    <span className="text-xs sm:text-sm font-semibold tracking-tight">Done</span>
                </button>

                {/* Center: Title / Breadcrumb */}
                <div className="flex items-center gap-2 max-w-[140px] xs:max-w-[200px] sm:max-w-xs truncate text-center">
                    <img src="/in.svg" alt="Groove" className="w-4 h-4 object-contain opacity-70 shrink-0 hidden xs:block" />
                    <span className="text-xs sm:text-sm font-bold tracking-tight text-white/90 truncate font-display">
                        {title || 'Card Studio'}
                    </span>
                </div>

                {/* Right: BOTH Share & Download Action Buttons */}
                <div className="flex items-center gap-1.5 sm:gap-2.5">
                    <button
                        type="button"
                        onClick={handleDownloadCard}
                        disabled={isGenerating}
                        className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 active:scale-95 text-white text-xs font-semibold border border-white/15 transition-all shadow-sm disabled:opacity-50 cursor-pointer"
                        title="Download high-resolution PNG"
                    >
                        <Download size={14} />
                        <span className="hidden xs:inline">Download</span>
                    </button>

                    <button
                        type="button"
                        onClick={handleShareCard}
                        disabled={isGenerating}
                        className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-xl bg-[var(--theme-accent,#E8A87C)] hover:opacity-90 active:scale-95 text-[#17020B] text-xs font-bold transition-all shadow-md disabled:opacity-50 cursor-pointer"
                        title="Share Card"
                    >
                        <Share2 size={14} />
                        <span>{isGenerating ? 'Exporting...' : 'Share'}</span>
                    </button>
                </div>
            </header>

            {/* Main Studio View: Responsive PC Left-Sidebar / Mobile Bottom-Tray Layout */}
            <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
                {/* PC ONLY: Left Sidebar Controls */}
                <aside className="hidden md:flex md:w-80 lg:w-92 flex-col border-r border-white/10 bg-[#0b0b10] overflow-y-auto p-5 space-y-6 shrink-0 z-20">
                    <div>
                        <h2 className="text-sm font-bold uppercase tracking-wider text-white/50 font-display">
                            Card Elements & Style
                        </h2>
                        <p className="text-xs text-white/40 mt-0.5">
                            Fine-tune minimalist artwork, grain texture & widgets
                        </p>
                    </div>

                    {/* Section 1: Abstract Backgrounds */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-white/60 flex items-center justify-between">
                            <span>Background Theme</span>
                            <span className="text-[11px] text-[var(--theme-accent,#E8A87C)] font-semibold">{currentTheme.label}</span>
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                            {Object.keys(THEMES).map((tKey) => {
                                const t = THEMES[tKey];
                                const isSelected = cardTheme === tKey;
                                return (
                                    <button
                                        key={tKey}
                                        type="button"
                                        onClick={() => setCardTheme(tKey)}
                                        className={`p-1.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                                            isSelected 
                                                ? 'border-[var(--theme-accent,#E8A87C)] ring-2 ring-[var(--theme-accent,#E8A87C)]/30 bg-white/10' 
                                                : 'border-white/10 bg-white/5 hover:bg-white/10'
                                        }`}
                                        title={t.label}
                                    >
                                        <div 
                                            className="w-full h-8 rounded-lg shadow-inner border border-white/10" 
                                            style={{ background: t.preview }} 
                                        />
                                        <span className="text-[10px] font-medium text-white/80 truncate w-full text-center">
                                            {t.label}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Section 2: Film Grain Texture */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-white/60 flex items-center justify-between">
                            <span>Film Grain Texture</span>
                            <span className="text-[11px] text-[var(--theme-accent,#E8A87C)] capitalize">{noiseLevel}</span>
                        </label>
                        <div className="grid grid-cols-4 gap-1 p-1 bg-white/5 border border-white/10 rounded-xl">
                            {['none', 'subtle', 'medium', 'heavy'].map((lvl) => (
                                <button
                                    key={lvl}
                                    type="button"
                                    onClick={() => setNoiseLevel(lvl)}
                                    className={`py-1.5 px-2 text-[11px] font-semibold rounded-lg capitalize transition cursor-pointer ${
                                        noiseLevel === lvl
                                            ? 'bg-white text-black font-bold shadow'
                                            : 'text-white/60 hover:text-white'
                                    }`}
                                >
                                    {lvl === 'none' ? 'Off' : lvl}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Section 3: Bottom-Right Corner Widget */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-white/60">
                            Corner Element (Bottom Right)
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                type="button"
                                onClick={() => setCornerWidget('rating')}
                                className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition cursor-pointer text-center ${
                                    cornerWidget === 'rating'
                                        ? 'bg-[var(--theme-accent,#E8A87C)] text-[#17020B] border-[var(--theme-accent,#E8A87C)] font-bold shadow-md'
                                        : 'bg-white/5 text-white/70 hover:text-white border-white/10'
                                }`}
                            >
                                <Star size={15} />
                                <span className="text-[10px] font-semibold">Rating Pie</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setCornerWidget('qr')}
                                className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition cursor-pointer text-center ${
                                    cornerWidget === 'qr'
                                        ? 'bg-[var(--theme-accent,#E8A87C)] text-[#17020B] border-[var(--theme-accent,#E8A87C)] font-bold shadow-md'
                                        : 'bg-white/5 text-white/70 hover:text-white border-white/10'
                                }`}
                            >
                                <QrCode size={15} />
                                <span className="text-[10px] font-semibold">QR Code</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setCornerWidget('none')}
                                className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition cursor-pointer text-center ${
                                    cornerWidget === 'none'
                                        ? 'bg-[var(--theme-accent,#E8A87C)] text-[#17020B] border-[var(--theme-accent,#E8A87C)] font-bold shadow-md'
                                        : 'bg-white/5 text-white/70 hover:text-white border-white/10'
                                }`}
                            >
                                <EyeOff size={15} />
                                <span className="text-[10px] font-semibold">None</span>
                            </button>
                        </div>

                        {/* QR Color Picker (if QR active) */}
                        {cornerWidget === 'qr' && (
                            <div className="pt-2 flex items-center justify-between bg-white/5 p-2.5 rounded-xl border border-white/10">
                                <span className="text-[11px] font-semibold text-white/60">QR Code Color</span>
                                <div className="flex gap-1.5">
                                    {QR_COLORS.map((color) => (
                                        <button
                                            key={color.hex}
                                            type="button"
                                            onClick={() => setQrColor(color.hex)}
                                            className={`w-5 h-5 rounded-full border transition-all flex items-center justify-center cursor-pointer ${color.class} ${
                                                qrColor === color.hex ? 'border-white scale-110 shadow-lg ring-2 ring-[var(--theme-accent)]/50' : 'hover:scale-105'
                                            }`}
                                            title={color.label}
                                        >
                                            {qrColor === color.hex && (
                                                <div className={`w-1 h-1 rounded-full ${color.hex === 'ffffff' ? 'bg-black' : 'bg-white'}`} />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Section 4: Release Date Display */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-white/60 flex items-center justify-between">
                            <span>Release Date</span>
                            <span className="text-[10px] text-[var(--theme-accent,#E8A87C)]">Year Default</span>
                        </label>
                        <div className="grid grid-cols-4 gap-1 p-1 bg-white/5 border border-white/10 rounded-xl">
                            {[
                                { id: 'year', label: 'Year' },
                                { id: 'monthYear', label: 'Mo/Yr' },
                                { id: 'full', label: 'Full' },
                                { id: 'none', label: 'Hide' },
                            ].map((m) => (
                                <button
                                    key={m.id}
                                    type="button"
                                    onClick={() => setDateMode(m.id)}
                                    className={`py-1.5 px-1 text-[11px] font-semibold rounded-lg transition cursor-pointer text-center ${
                                        dateMode === m.id
                                            ? 'bg-white text-black font-bold shadow'
                                            : 'text-white/60 hover:text-white'
                                    }`}
                                >
                                    {m.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Section 5: Audio Info Toggles */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-white/60">
                            Audio Info (Unboxed)
                        </label>
                        <div className="space-y-1.5">
                            <label className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition cursor-pointer">
                                <span className="text-xs text-white/80 font-medium">Show Duration</span>
                                <input 
                                    type="checkbox" 
                                    checked={showDuration}
                                    onChange={(e) => setShowDuration(e.target.checked)}
                                    className="accent-[var(--theme-accent,#E8A87C)] cursor-pointer w-4 h-4"
                                />
                            </label>

                            <label className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition cursor-pointer">
                                <span className="text-xs text-white/80 font-medium">Show Discs & Tracks</span>
                                <input 
                                    type="checkbox" 
                                    checked={showDiscs}
                                    onChange={(e) => setShowDiscs(e.target.checked)}
                                    className="accent-[var(--theme-accent,#E8A87C)] cursor-pointer w-4 h-4"
                                />
                            </label>
                        </div>
                    </div>
                </aside>

                {/* Center / Main Canvas: Static, Crisp Live Preview (ZERO lag, NO moving animations) */}
                <main className="flex-1 flex items-center justify-center p-3 sm:p-6 lg:p-10 bg-[#050508] relative overflow-hidden select-none min-h-0">
                    {/* Subtle Studio Grid Backdrop */}
                    <div 
                        className="absolute inset-0 opacity-[0.03] pointer-events-none"
                        style={{
                            backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)',
                            backgroundSize: '24px 24px'
                        }}
                    />

                    {/* LIVE CARD PREVIEW (Export Target) */}
                    <div 
                        ref={cardRef} 
                        style={{
                            ...currentTheme.bgStyle,
                            borderColor: currentTheme.border,
                        }}
                        className="relative w-full max-w-[270px] xs:max-w-[290px] sm:max-w-[330px] aspect-[1/1.42] p-3.5 sm:p-4 rounded-2xl flex flex-col justify-between shadow-2xl border transition-colors duration-200 overflow-hidden select-none"
                    >
                        {/* Film Grain Texture Overlay (Canvas-generated base64 PNG, 100% visible & exportable) */}
                        {grainOpacity > 0 && noiseDataUri && (
                            <div 
                                aria-hidden="true"
                                className="absolute inset-0 pointer-events-none rounded-2xl"
                                style={{
                                    backgroundImage: `url("${noiseDataUri}")`,
                                    backgroundRepeat: 'repeat',
                                    mixBlendMode: currentTheme.isLight ? 'multiply' : 'overlay',
                                    opacity: grainOpacity,
                                }}
                            />
                        )}

                        {/* Card Header: Pure Minimalist Logo & Type Indicator (NO BOXES) */}
                        <div className="relative z-10 w-full flex justify-between items-center mb-2 sm:mb-2.5">
                            <div className="flex items-center gap-1.5">
                                <img 
                                    src="/in.svg" 
                                    alt="Groove" 
                                    className={`w-3.5 h-3.5 object-contain shrink-0 ${currentTheme.isLight ? 'brightness-0' : 'opacity-80'}`} 
                                    crossOrigin="anonymous" 
                                />
                                <span className={`text-[9px] tracking-[0.25em] font-bold uppercase font-sans ${currentTheme.isLight ? 'text-black/60' : 'text-white/60'}`}>
                                    GrooveCard
                                </span>
                            </div>
                            <span className={`text-[8px] sm:text-[9px] font-semibold tracking-wider uppercase font-sans ${currentTheme.isLight ? 'text-black/40' : 'text-white/40'}`}>
                                {type || 'MUSIC'}
                            </span>
                        </div>

                        {/* Cover Art Artwork: Square with tight radius, clean border */}
                        <div className="relative z-10 w-full aspect-square rounded-xl overflow-hidden shadow-lg border border-white/10 bg-black/40 mb-2 sm:mb-2.5">
                            <img
                                src={imageUrl || "/placeholder.jpg"}
                                alt={title}
                                className="w-full h-full object-cover"
                                crossOrigin="anonymous"
                                onError={(e) => {
                                    e.currentTarget.src = 'https://placehold.co/400x400/17020B/E8A87C?text=Music';
                                }}
                            />
                        </div>

                        {/* Bottom Info & Corner Widget: Tight, Unified, Zero Monospace, ZERO BOXES */}
                        <div className="relative z-10 flex justify-between items-end gap-3 text-left">
                            {/* Text Info Column */}
                            <div className="flex-1 min-w-0 pr-1">
                                <h4 
                                    className={`text-xs sm:text-sm font-bold leading-snug font-display tracking-tight break-words line-clamp-1 ${currentTheme.isLight ? 'text-black' : 'text-white'}`} 
                                    title={title}
                                >
                                    {title}
                                </h4>
                                <p 
                                    className={`text-[10px] sm:text-xs font-medium font-sans mt-0.5 break-words line-clamp-1 ${currentTheme.isLight ? 'text-black/70' : 'text-white/75'}`} 
                                    title={artistLabel}
                                >
                                    {artistLabel}
                                </p>
                                {album && type === 'track' && album !== title && (
                                    <p 
                                        className={`text-[9px] sm:text-[10px] font-normal font-sans italic mt-0.5 break-words line-clamp-1 ${currentTheme.isLight ? 'text-black/50' : 'text-white/50'}`}
                                    >
                                        {album}
                                    </p>
                                )}

                                {/* Dot-Separated Metadata Line (NO BOXES, Clean Sans) */}
                                {metaItems.length > 0 && (
                                    <div className={`flex items-center gap-1.5 flex-wrap text-[10px] sm:text-[11px] font-sans font-medium tracking-tight mt-1 ${currentTheme.isLight ? 'text-black/60' : 'text-white/70'}`}>
                                        {metaItems.map((item, idx) => (
                                            <React.Fragment key={idx}>
                                                {idx > 0 && (
                                                    <span className={`select-none ${currentTheme.isLight ? 'text-black/30' : 'text-white/30'}`}>
                                                        •
                                                    </span>
                                                )}
                                                <span>{item}</span>
                                            </React.Fragment>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Corner Element (Bottom Right): Unboxed Rating Pie (Default) or QR or None */}
                            {cornerWidget === 'rating' && (
                                <div 
                                    className="flex flex-col items-center justify-center shrink-0 cursor-default"
                                    title={`Rating: ${score10}/10`}
                                >
                                    <div className="relative w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center">
                                        <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 44 44">
                                            {/* Track */}
                                            <circle 
                                                cx="22" 
                                                cy="22" 
                                                r={pieRadius} 
                                                fill="transparent" 
                                                stroke={currentTheme.isLight ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.15)"} 
                                                strokeWidth="3.2" 
                                            />
                                            {/* Progress */}
                                            <circle
                                                cx="22" 
                                                cy="22" 
                                                r={pieRadius} 
                                                fill="none" 
                                                stroke={ratingColor} 
                                                strokeWidth="3.5" 
                                                strokeDasharray={pieCircumference} 
                                                strokeDashoffset={pieOffset} 
                                                strokeLinecap="round" 
                                            />
                                        </svg>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span 
                                                className="text-[11px] sm:text-xs font-extrabold font-sans leading-none" 
                                                style={{ color: ratingColor }}
                                            >
                                                {score10}
                                            </span>
                                        </div>
                                    </div>
                                    <span className={`text-[7px] sm:text-[8px] font-bold tracking-widest uppercase mt-0.5 font-sans ${currentTheme.isLight ? 'text-black/50' : 'text-white/60'}`}>
                                        RATING
                                    </span>
                                </div>
                            )}

                            {cornerWidget === 'qr' && (
                                <div 
                                    onClick={() => setQrFullScreen(true)}
                                    className="flex flex-col items-center justify-center shrink-0 cursor-zoom-in"
                                    title="Click to expand QR Code"
                                >
                                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg overflow-hidden bg-white p-0.5 shadow-md">
                                        <img
                                            src={qrApi}
                                            alt="QR"
                                            className="w-full h-full object-contain"
                                            crossOrigin="anonymous"
                                        />
                                    </div>
                                    <span className={`text-[7px] sm:text-[8px] font-bold tracking-widest uppercase mt-0.5 font-sans ${currentTheme.isLight ? 'text-black/50' : 'text-white/60'}`}>
                                        SCAN
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>

            {/* MOBILE ONLY: Modern Photo Editor Style Bottom Sliding Tool Tray */}
            <div className="md:hidden border-t border-white/10 bg-[#0d0d14]/95 backdrop-blur-xl shrink-0 z-40 pb-safe">
                {/* Horizontal Tool Options Bar (Slides Right-to-Left / Left-to-Right based on active tool) */}
                <div className="px-3 py-2.5 border-b border-white/5 overflow-x-auto no-scrollbar flex items-center gap-2">
                    {/* Active Tool Sub-options */}
                    {mobileTab === 'theme' && (
                        <div className="flex items-center gap-2">
                            {Object.keys(THEMES).map((tKey) => {
                                const t = THEMES[tKey];
                                const isSelected = cardTheme === tKey;
                                return (
                                    <button
                                        key={tKey}
                                        type="button"
                                        onClick={() => setCardTheme(tKey)}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border shrink-0 transition-all cursor-pointer ${
                                            isSelected 
                                                ? 'bg-white text-black border-white font-bold shadow' 
                                                : 'bg-white/5 text-white/70 border-white/10 hover:text-white'
                                        }`}
                                    >
                                        <div 
                                            className="w-3.5 h-3.5 rounded-full border border-black/20 shrink-0" 
                                            style={{ background: t.preview }} 
                                        />
                                        <span className="text-xs">{t.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {mobileTab === 'grain' && (
                        <div className="flex items-center gap-2">
                            {['none', 'subtle', 'medium', 'heavy'].map((lvl) => (
                                <button
                                    key={lvl}
                                    type="button"
                                    onClick={() => setNoiseLevel(lvl)}
                                    className={`px-3 py-1.5 rounded-full border text-xs capitalize shrink-0 transition-all cursor-pointer ${
                                        noiseLevel === lvl
                                            ? 'bg-white text-black border-white font-bold shadow'
                                            : 'bg-white/5 text-white/70 border-white/10 hover:text-white'
                                    }`}
                                >
                                    {lvl === 'none' ? 'No Grain' : `${lvl} Grain`}
                                </button>
                            ))}
                        </div>
                    )}

                    {mobileTab === 'widget' && (
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setCornerWidget('rating')}
                                className={`px-3 py-1.5 rounded-full border text-xs shrink-0 transition-all cursor-pointer ${
                                    cornerWidget === 'rating'
                                        ? 'bg-white text-black border-white font-bold shadow'
                                        : 'bg-white/5 text-white/70 border-white/10 hover:text-white'
                                }`}
                            >
                                ⭐ Rating Pie (Default)
                            </button>
                            <button
                                type="button"
                                onClick={() => setCornerWidget('qr')}
                                className={`px-3 py-1.5 rounded-full border text-xs shrink-0 transition-all cursor-pointer ${
                                    cornerWidget === 'qr'
                                        ? 'bg-white text-black border-white font-bold shadow'
                                        : 'bg-white/5 text-white/70 border-white/10 hover:text-white'
                                }`}
                            >
                                📱 QR Code
                            </button>
                            <button
                                type="button"
                                onClick={() => setCornerWidget('none')}
                                className={`px-3 py-1.5 rounded-full border text-xs shrink-0 transition-all cursor-pointer ${
                                    cornerWidget === 'none'
                                        ? 'bg-white text-black border-white font-bold shadow'
                                        : 'bg-white/5 text-white/70 border-white/10 hover:text-white'
                                }`}
                            >
                                ✕ None
                            </button>

                            {/* Inline QR colors if QR active */}
                            {cornerWidget === 'qr' && (
                                <div className="flex items-center gap-1.5 pl-2 border-l border-white/10 shrink-0">
                                    {QR_COLORS.map((c) => (
                                        <button
                                            key={c.hex}
                                            type="button"
                                            onClick={() => setQrColor(c.hex)}
                                            className={`w-5 h-5 rounded-full border transition-all ${c.class} ${
                                                qrColor === c.hex ? 'border-white scale-110 shadow' : 'opacity-80'
                                            }`}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {mobileTab === 'date' && (
                        <div className="flex items-center gap-2">
                            {[
                                { id: 'year', label: 'Year Only' },
                                { id: 'monthYear', label: 'Month & Year' },
                                { id: 'full', label: 'Full Date' },
                                { id: 'none', label: 'Hide Date' },
                            ].map((m) => (
                                <button
                                    key={m.id}
                                    type="button"
                                    onClick={() => setDateMode(m.id)}
                                    className={`px-3 py-1.5 rounded-full border text-xs shrink-0 transition-all cursor-pointer ${
                                        dateMode === m.id
                                            ? 'bg-white text-black border-white font-bold shadow'
                                            : 'bg-white/5 text-white/70 border-white/10 hover:text-white'
                                    }`}
                                >
                                    {m.label}
                                </button>
                            ))}
                        </div>
                    )}

                    {mobileTab === 'info' && (
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setShowDuration(!showDuration)}
                                className={`px-3 py-1.5 rounded-full border text-xs shrink-0 transition-all cursor-pointer ${
                                    showDuration
                                        ? 'bg-[var(--theme-accent,#E8A87C)] text-[#17020B] border-[var(--theme-accent,#E8A87C)] font-bold'
                                        : 'bg-white/5 text-white/70 border-white/10'
                                }`}
                            >
                                Duration {showDuration ? '✓' : ''}
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowDiscs(!showDiscs)}
                                className={`px-3 py-1.5 rounded-full border text-xs shrink-0 transition-all cursor-pointer ${
                                    showDiscs
                                        ? 'bg-[var(--theme-accent,#E8A87C)] text-[#17020B] border-[var(--theme-accent,#E8A87C)] font-bold'
                                        : 'bg-white/5 text-white/70 border-white/10'
                                }`}
                            >
                                Discs / Tracks {showDiscs ? '✓' : ''}
                            </button>
                        </div>
                    )}
                </div>

                {/* Mobile Bottom Photo Editor Category Tabs */}
                <div className="flex justify-around items-center px-2 py-2">
                    {[
                        { id: 'theme', label: 'Theme', icon: <Palette size={16} /> },
                        { id: 'grain', label: 'Grain', icon: <Sparkles size={16} /> },
                        { id: 'widget', label: 'Corner', icon: <Star size={16} /> },
                        { id: 'date', label: 'Date', icon: <Calendar size={16} /> },
                        { id: 'info', label: 'Info', icon: <Sliders size={16} /> },
                    ].map((tab) => {
                        const isActive = mobileTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setMobileTab(tab.id)}
                                className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer ${
                                    isActive 
                                        ? 'text-[var(--theme-accent,#E8A87C)] font-bold scale-105' 
                                        : 'text-white/50 hover:text-white/80'
                                }`}
                            >
                                {tab.icon}
                                <span className="text-[10px] tracking-tight">{tab.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Full-screen QR Viewer Modal (if tapped on card QR) */}
            {qrFullScreen && (
                <div 
                    className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100000] flex flex-col items-center justify-center p-4 sm:p-6"
                    onClick={() => setQrFullScreen(false)}
                >
                    <div className="max-w-md w-full flex flex-col items-center gap-5" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-sm font-bold text-white uppercase tracking-widest font-display">
                            Universal GrooveCard QR
                        </h3>
                        <div className="relative w-64 h-64 sm:w-72 sm:h-72 p-3 bg-white border border-gray-200 rounded-2xl flex items-center justify-center shadow-2xl">
                            <img src={qrApi} alt="QR Code" className="w-full h-full object-contain rounded-xl" crossOrigin="anonymous" />
                            <div className="absolute w-12 h-12 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow p-2">
                                <img src="/in.svg" alt="Groove Logo" className="w-full h-full object-contain" crossOrigin="anonymous" />
                            </div>
                        </div>
                        <p className="text-xs text-zinc-400 text-center max-w-[260px]">
                            Scan with any smartphone camera to open track & streaming links.
                        </p>
                        <button
                            type="button"
                            onClick={() => setQrFullScreen(false)}
                            className="px-6 py-2 bg-white text-black font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>,
        document.body
    );
}
