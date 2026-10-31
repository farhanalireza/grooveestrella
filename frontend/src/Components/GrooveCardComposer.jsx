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
    Eye,
    EyeOff,
    AlignLeft,
    AlignCenter,
    AlignRight,
    Tag,
    ListMusic,
    FileText,
    Library,
    Disc3,
    Type,
    Quote,
    Paintbrush,
    Layers,
    MessageSquare,
    Ticket,
    Disc,
    Music,
    Columns,
    Maximize2,
    Image as ImageIcon
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

// Relative luminance calculator for auto text contrast
function getLuminance(hex) {
    if (!hex || typeof hex !== 'string') return 0;
    const clean = hex.replace('#', '').trim();
    if (clean.length === 3) {
        const r = parseInt(clean[0] + clean[0], 16) / 255;
        const g = parseInt(clean[1] + clean[1], 16) / 255;
        const b = parseInt(clean[2] + clean[2], 16) / 255;
        return 0.299 * r + 0.587 * g + 0.114 * b;
    }
    if (clean.length === 6) {
        const r = parseInt(clean.substring(0, 2), 16) / 255;
        const g = parseInt(clean.substring(2, 4), 16) / 255;
        const b = parseInt(clean.substring(4, 6), 16) / 255;
        return 0.299 * r + 0.587 * g + 0.114 * b;
    }
    return 0;
}

function isLightColor(hex) {
    return getLuminance(hex) > 0.52;
}

// 8 Curated Background Themes
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

// Preset palette for Solid Color backgrounds
const SOLID_COLOR_PRESETS = [
    { label: 'Pitch Black', hex: '#09090b' },
    { label: 'Zinc Dark', hex: '#18181b' },
    { label: 'Warm Espresso', hex: '#261810' },
    { label: 'Deep Indigo', hex: '#10162f' },
    { label: 'Navy Abyss', hex: '#0a1128' },
    { label: 'Forest Pine', hex: '#052317' },
    { label: 'Velvet Wine', hex: '#290618' },
    { label: 'Dark Plum', hex: '#1e082b' },
    { label: 'Studio Cream', hex: '#f7f4ec' },
    { label: 'Parchment', hex: '#fef3c7' },
    { label: 'Pure Paper', hex: '#fafafa' },
    { label: 'Slate Mist', hex: '#e2e8f0' },
];

// Curated Text Colors
const TEXT_COLOR_PRESETS = [
    { label: 'White', hex: '#ffffff' },
    { label: 'Charcoal', hex: '#0e0e12' },
    { label: 'Peach', hex: '#e8a87c' },
    { label: 'Amber', hex: '#f59e0b' },
    { label: 'Sky Cyan', hex: '#38bdf8' },
    { label: 'Mint', hex: '#10b981' },
    { label: 'Rose Coral', hex: '#f43f5e' },
    { label: 'Lilac', hex: '#c084fc' },
];

// Defined Design Styles
const DESIGN_STYLES = {
    modern: {
        id: 'modern',
        label: 'Modern Studio',
        tag: 'Default',
        description: 'Refined modern streaming aesthetic with glass accents and fine grain',
    },
    library: {
        id: 'library',
        label: 'Library Catalogue',
        tag: 'Vintage',
        description: 'Index card stock, classification codes, loan stamps & drawer rod punch',
    },
    vinyl: {
        id: 'vinyl',
        label: 'Vinyl Insert & OBI',
        tag: 'Audiophile',
        description: 'Japanese OBI strip, matrix runout numbers & high-fidelity seal',
    },
    museum: {
        id: 'museum',
        label: 'Museum Exhibit',
        tag: 'Exhibition',
        description: 'Contemporary gallery placard with accession data & Swiss typography',
    },
    cassette: {
        id: 'cassette',
        label: 'Cassette J-Card',
        tag: 'Retro',
        description: '80s/90s tape inlay with spine fold, Dolby NR badge & tape counter',
    },
    ticket: {
        id: 'ticket',
        label: 'Concert Ticket Stub',
        tag: 'Live Event',
        description: 'Commemorative stub with perforated tear lines, section/seat & barcode',
    },
};

// Card Formats
const CARD_TYPES = {
    standard: {
        id: 'standard',
        label: 'Classic Artwork',
        desc: 'Square cover artwork focus with clean metadata',
    },
    tracklist: {
        id: 'tracklist',
        label: 'Full Tracklist Edition',
        desc: 'Complete album/playlist tracklist with single or double column layout',
    },
    scannable_qr: {
        id: 'scannable_qr',
        label: 'Scannable QR Focus',
        desc: 'High-contrast large QR code scannable instantly with any camera',
    },
    mini_poster: {
        id: 'mini_poster',
        label: 'Mini Poster',
        desc: 'Cinematic poster presentation with bold typography block',
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
    type = "track",
    platform = "musicbrainz",
    releaseDate,
    releaseYear: propReleaseYear,
    album,
    duration,
    discCount,
    totalTracks,
    genres = [],
    tracks = [],
}) {
    const cardRef = useRef(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [noiseDataUri, setNoiseDataUri] = useState('');
    
    // Core design & style presets
    const [designStyle, setDesignStyle] = useState('modern'); // 'modern' | 'library' | 'vinyl' | 'museum' | 'cassette' | 'ticket'
    const [cardType, setCardType] = useState('standard'); // 'standard' | 'tracklist' | 'scannable_qr' | 'mini_poster'
    
    // Background and color states
    const [cardTheme, setCardTheme] = useState('obsidian'); // key of THEMES or 'solid'
    const [customBgColor, setCustomBgColor] = useState('#0d0f14');
    const [textColorMode, setTextColorMode] = useState('auto'); // 'auto' | 'custom'
    const [customTextColor, setCustomTextColor] = useState('#ffffff');
    const [noiseLevel, setNoiseLevel] = useState('medium'); // 'none' | 'subtle' | 'medium' | 'heavy'

    // Granular element visibility toggles (User selects what they want inside the card)
    const [showCoverArt, setShowCoverArt] = useState(true);
    const [showTitle, setShowTitle] = useState(true);
    const [showArtist, setShowArtist] = useState(true);
    const [showAlbum, setShowAlbum] = useState(true);
    const [showHeaderLogo, setShowHeaderLogo] = useState(true);
    const [showReleaseDate, setShowReleaseDate] = useState(true);
    const [dateMode, setDateMode] = useState('year'); // 'year' | 'monthYear' | 'full'
    const [datePlacement, setDatePlacement] = useState('inline'); // 'inline' | 'subhead' | 'header'
    const [showGenres, setShowGenres] = useState(true);
    const [genresPlacement, setGenresPlacement] = useState('below_artist'); // 'below_artist' | 'top_header' | 'footer'
    const [showRating, setShowRating] = useState(true);
    const [ratingPlacement, setRatingPlacement] = useState('corner'); // 'corner' | 'header' | 'inline'
    const [showDuration, setShowDuration] = useState(false);
    const [showDiscs, setShowDiscs] = useState(false);

    // Layout and alignment
    const [textAlign, setTextAlign] = useState('left'); // 'left' | 'center' | 'right'
    const [titlePlacement, setTitlePlacement] = useState('bottom'); // 'bottom' (below art) | 'top' (above art)
    const [tracklistArtMode, setTracklistArtMode] = useState('square_top'); // 'square_top' | 'compact_header'

    // Full Tracklist controls
    const [tracklistColumns, setTracklistColumns] = useState('auto'); // 'auto' | '1' | '2'
    const [showTrackDurations, setShowTrackDurations] = useState(true);
    const [showTrackNumbers, setShowTrackNumbers] = useState(true);

    // Personal Annotations states
    const [showAnnotation, setShowAnnotation] = useState(false);
    const [annotationText, setAnnotationText] = useState('Essential late night listening.');
    const [annotationStyle, setAnnotationStyle] = useState('handwritten'); // 'handwritten' | 'typewriter' | 'pill' | 'quote'
    const [annotationPlacement, setAnnotationPlacement] = useState('bottom'); // 'bottom' | 'under_art' | 'badge'

    // Widgets & QR
    const [cornerWidget, setCornerWidget] = useState('rating'); // 'rating' | 'qr' | 'none'
    const [qrColor, setQrColor] = useState('000000');
    const [qrFullScreen, setQrFullScreen] = useState(false);

    // Editor Tab Navigation
    const [activeTab, setActiveTab] = useState('designs'); // 'designs' | 'formats' | 'elements' | 'colors' | 'tracklist' | 'annotation' | 'layout'

    // Initialize grain texture once on mount
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

    // Format artist display
    const artistLabel = useMemo(() => {
        if (Array.isArray(artist)) {
            return artist.map(a => (typeof a === 'string' ? a : a.name || '')).filter(Boolean).join(', ');
        }
        return artist || 'Unknown Artist';
    }, [artist]);

    // Compute release date representations
    const dateInfo = useMemo(() => {
        const raw = releaseDate 
            ? String(releaseDate).trim() 
            : (propReleaseYear ? String(propReleaseYear).trim() : null);
        if (!raw) return { year: null, full: null, monthYear: null };

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
        if (!showReleaseDate) return null;
        if (dateMode === 'year') return dateInfo.year;
        if (dateMode === 'full') return dateInfo.full || dateInfo.year;
        if (dateMode === 'monthYear') return dateInfo.monthYear || dateInfo.year;
        return dateInfo.year;
    }, [showReleaseDate, dateMode, dateInfo]);

    // Format duration helper (ms or seconds)
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

    // Format track durations for tracklist
    const formatTrackDuration = (dur) => {
        if (!dur) return '3:45';
        const totalSecs = Math.floor(dur > 1000 ? dur / 1000 : dur);
        const mins = Math.floor(totalSecs / 60);
        const secs = totalSecs % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    // Prepare FULL tracklist items without truncation
    const fullTracksList = useMemo(() => {
        if (Array.isArray(tracks) && tracks.length > 0) {
            return tracks.map((tr, idx) => ({
                num: String(tr.pos || tr.position || idx + 1).padStart(2, '0'),
                title: tr.title || tr.name || `Track ${idx + 1}`,
                duration: formatTrackDuration(tr.duration || tr.duration_ms)
            }));
        }
        // Fallback realistic album tracklist if single track or no tracks array
        return [
            { num: '01', title: title || 'Title Track', duration: formattedDuration || '3:42' },
            { num: '02', title: `${title || 'Track'} (Acoustic)`, duration: '4:10' },
            { num: '03', title: `${album || 'B-Side'} Live Session`, duration: '3:55' },
            { num: '04', title: 'Midnight Interlude', duration: '2:14' },
            { num: '05', title: 'Instrumental Cut', duration: '3:20' },
            { num: '06', title: 'Studio Outtake', duration: '4:05' },
            { num: '07', title: 'Master Reprise', duration: '4:35' },
            { num: '08', title: 'Acoustic Demo', duration: '3:15' },
        ];
    }, [tracks, title, album, formattedDuration]);

    // Determine whether to use 2 columns for tracklist
    const useTwoColumns = useMemo(() => {
        if (tracklistColumns === '2') return true;
        if (tracklistColumns === '1') return false;
        return fullTracksList.length > 6;
    }, [tracklistColumns, fullTracksList.length]);

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

    // Rating score calculation on 1-10 scale
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
        if (score10 >= 8) return '#10B981';
        if (score10 >= 5) return '#F59E0B';
        return '#EF4444';
    }, [score10]);

    // Active background theme & computed properties
    const activeTheme = useMemo(() => {
        if (cardTheme === 'solid') {
            const isLight = isLightColor(customBgColor);
            return {
                id: 'solid',
                label: 'Custom Solid',
                bgStyle: { backgroundColor: customBgColor },
                border: isLight ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.14)',
                preview: customBgColor,
                accent: isLight ? '#17020B' : '#E8A87C',
                isLight,
            };
        }
        return THEMES[cardTheme] || THEMES.obsidian;
    }, [cardTheme, customBgColor]);

    // Computed text colors based on Auto vs Custom text color
    const textColors = useMemo(() => {
        if (textColorMode === 'custom' && customTextColor) {
            const isCustomLight = isLightColor(customTextColor);
            return {
                primary: customTextColor,
                secondary: isCustomLight ? 'rgba(255, 255, 255, 0.82)' : 'rgba(15, 15, 18, 0.82)',
                muted: isCustomLight ? 'rgba(255, 255, 255, 0.58)' : 'rgba(15, 15, 18, 0.58)',
                faint: isCustomLight ? 'rgba(255, 255, 255, 0.32)' : 'rgba(15, 15, 18, 0.30)',
                accent: customTextColor,
                isDark: !isCustomLight,
            };
        }

        // Auto mode: Light text when background is dark, dark text when background is light
        if (activeTheme.isLight) {
            return {
                primary: '#0d0d12',
                secondary: 'rgba(13, 13, 18, 0.78)',
                muted: 'rgba(13, 13, 18, 0.55)',
                faint: 'rgba(13, 13, 18, 0.28)',
                accent: activeTheme.accent || '#17020B',
                isDark: true,
            };
        }
        return {
            primary: '#ffffff',
            secondary: 'rgba(255, 255, 255, 0.80)',
            muted: 'rgba(255, 255, 255, 0.55)',
            faint: 'rgba(255, 255, 255, 0.28)',
            accent: activeTheme.accent || '#E8A87C',
            isDark: false,
        };
    }, [textColorMode, customTextColor, activeTheme]);

    // Effective genres list
    const effectiveGenres = useMemo(() => {
        if (Array.isArray(genres) && genres.length > 0) {
            return genres.map(g => (typeof g === 'string' ? g : g.name || '')).filter(Boolean);
        }
        return ['Music', 'Groove'];
    }, [genres]);

    // Share & QR URL
    const shareUrl = typeof window !== "undefined" 
        ? `${window.location.origin}/${type || 'track'}/${itemId || ''}?groovelink=true`
        : '';

    const qrApi = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(shareUrl)}&color=${qrColor}&bgcolor=ffffff&ecc=H&format=png`;

    // Circular pie SVG calculations
    const pieRadius = 16;
    const pieCircumference = 2 * Math.PI * pieRadius;
    const pieOffset = pieCircumference * (1 - score10 / 10);

    // Format metadata items inline with dot separators
    const metaItems = useMemo(() => {
        const items = [];
        if (displayDate && datePlacement === 'inline') items.push(displayDate);
        if (showDuration && formattedDuration) items.push(formattedDuration);
        if (showDiscs && formattedDiscs) items.push(formattedDiscs);
        return items;
    }, [displayDate, datePlacement, showDuration, formattedDuration, showDiscs, formattedDiscs]);

    // Grain opacity mapping
    const grainOpacity = useMemo(() => {
        if (noiseLevel === 'none') return 0;
        if (noiseLevel === 'subtle') return activeTheme.isLight ? 0.15 : 0.22;
        if (noiseLevel === 'medium') return activeTheme.isLight ? 0.28 : 0.40;
        if (noiseLevel === 'heavy') return activeTheme.isLight ? 0.48 : 0.65;
        return 0;
    }, [noiseLevel, activeTheme.isLight]);

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

    // Alignment CSS classes helper
    const alignClass = textAlign === 'center' ? 'text-center items-center' : textAlign === 'right' ? 'text-right items-end' : 'text-left items-start';
    const justifyClass = textAlign === 'center' ? 'justify-center' : textAlign === 'right' ? 'justify-end' : 'justify-start';

    // RENDER ANNOTATION COMPONENT
    const renderAnnotation = () => {
        if (!showAnnotation || !annotationText.trim()) return null;

        if (annotationStyle === 'handwritten') {
            return (
                <div className={`my-2 py-0.5 px-1 font-serif italic text-xs tracking-wide leading-snug break-words ${textAlign === 'center' ? 'text-center' : textAlign === 'right' ? 'text-right' : 'text-left'}`} style={{ color: textColors.primary }}>
                    &ldquo;{annotationText}&rdquo;
                </div>
            );
        }
        if (annotationStyle === 'typewriter') {
            return (
                <div className={`my-2 pt-1.5 border-t border-dashed font-mono text-[9px] uppercase tracking-wider break-words ${textAlign === 'center' ? 'text-center' : textAlign === 'right' ? 'text-right' : 'text-left'}`} style={{ color: textColors.secondary, borderColor: textColors.faint }}>
                    [NOTE: {annotationText}]
                </div>
            );
        }
        if (annotationStyle === 'pill') {
            return (
                <div className={`my-2 flex ${justifyClass}`}>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[9px] font-semibold break-words" style={{ borderColor: textColors.faint, backgroundColor: activeTheme.isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)', color: textColors.primary }}>
                        ✦ {annotationText}
                    </span>
                </div>
            );
        }
        return (
            <div className={`my-2 pl-2 border-l-2 text-[11px] italic leading-tight break-words`} style={{ borderColor: textColors.accent, color: textColors.secondary }}>
                &ldquo;{annotationText}&rdquo;
            </div>
        );
    };

    // RENDER GENRE TAGS
    const renderGenreTags = () => {
        if (!showGenres || effectiveGenres.length === 0) return null;
        return (
            <div className={`flex items-center gap-1.5 flex-wrap my-1.5 ${justifyClass}`}>
                {effectiveGenres.slice(0, 3).map((g, idx) => (
                    <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md text-[8px] sm:text-[9px] font-bold tracking-wider uppercase border select-none"
                        style={{
                            backgroundColor: activeTheme.isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.08)',
                            borderColor: textColors.faint,
                            color: textColors.secondary,
                        }}
                    >
                        {g}
                    </span>
                ))}
            </div>
        );
    };

    // RENDER TITLE & ARTIST BLOCK
    const renderTitleBlock = () => (
        <div className={`flex flex-col w-full ${alignClass}`}>
            {showReleaseDate && datePlacement === 'subhead' && displayDate && (
                <span className="text-[9px] uppercase font-bold tracking-widest mb-0.5" style={{ color: textColors.muted }}>
                    {displayDate}
                </span>
            )}
            {showTitle && (
                <h4 
                    className="text-xs sm:text-sm font-bold leading-tight font-display tracking-tight break-words line-clamp-2 w-full"
                    style={{ color: textColors.primary }}
                    title={title}
                >
                    {title || 'Untitled'}
                </h4>
            )}
            {showArtist && (
                <p 
                    className="text-[10px] sm:text-xs font-medium font-sans mt-0.5 break-words line-clamp-1 w-full"
                    style={{ color: textColors.secondary }}
                    title={artistLabel}
                >
                    {artistLabel}
                </p>
            )}
            {showAlbum && album && type === 'track' && album !== title && (
                <p 
                    className="text-[9px] sm:text-[10px] font-normal font-sans italic mt-0.5 break-words line-clamp-1 w-full"
                    style={{ color: textColors.muted }}
                >
                    {album}
                </p>
            )}

            {/* Genre tags when placed below artist */}
            {showGenres && genresPlacement === 'below_artist' && renderGenreTags()}

            {/* Metadata line (date, duration, disc count) */}
            {metaItems.length > 0 && (
                <div className={`flex items-center gap-1.5 flex-wrap text-[9px] sm:text-[10px] font-sans font-medium tracking-tight mt-1.5 ${justifyClass}`} style={{ color: textColors.muted }}>
                    {metaItems.map((item, idx) => (
                        <React.Fragment key={idx}>
                            {idx > 0 && <span style={{ color: textColors.faint }}>•</span>}
                            <span>{item}</span>
                        </React.Fragment>
                    ))}
                    {showRating && ratingPlacement === 'inline' && (
                        <>
                            <span style={{ color: textColors.faint }}>•</span>
                            <span className="font-bold flex items-center gap-0.5" style={{ color: ratingColor }}>
                                ★ {score10}
                            </span>
                        </>
                    )}
                </div>
            )}
        </div>
    );

    return createPortal(
        <div className="fixed inset-0 z-[99999] bg-[#07070A] text-white flex flex-col w-screen h-[100dvh] overflow-hidden select-none font-sans">
            {/* Top Bar: Back, Title, Download & Share */}
            <header className="h-14 sm:h-16 px-3 sm:px-6 border-b border-white/10 bg-[#0c0c12]/95 backdrop-blur-md flex items-center justify-between shrink-0 z-40">
                <button 
                    onClick={onClose}
                    className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-full hover:bg-white/10 active:scale-95 text-white/80 hover:text-white transition-all cursor-pointer"
                    title="Exit Card Studio"
                >
                    <ArrowLeft size={18} />
                    <span className="text-xs sm:text-sm font-semibold tracking-tight">Done</span>
                </button>

                <div className="flex items-center gap-2 max-w-[140px] xs:max-w-[200px] sm:max-w-xs truncate text-center">
                    <img src="/in.svg" alt="Groove" className="w-4 h-4 object-contain opacity-70 shrink-0 hidden xs:block" />
                    <span className="text-xs sm:text-sm font-bold tracking-tight text-white/90 truncate font-display">
                        {title || 'Card Creator'}
                    </span>
                </div>

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

            {/* Studio Workspace Layout */}
            <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
                {/* PC ONLY: Left Sidebar Controls */}
                <aside className="hidden md:flex md:w-88 lg:w-98 flex-col border-r border-white/10 bg-[#0b0b10] shrink-0 z-20 min-h-0">
                    {/* Category Navigation Bar */}
                    <div className="flex items-center border-b border-white/10 bg-[#0e0e16] p-1.5 gap-1 overflow-x-auto no-scrollbar shrink-0">
                        {[
                            { id: 'designs', label: 'Designs', icon: <Layers size={13} /> },
                            { id: 'formats', label: 'Formats', icon: <Maximize2 size={13} /> },
                            { id: 'elements', label: 'Elements', icon: <Sliders size={13} /> },
                            { id: 'colors', label: 'Colors', icon: <Palette size={13} /> },
                            { id: 'tracklist', label: 'Tracklist', icon: <ListMusic size={13} /> },
                            { id: 'annotation', label: 'Note', icon: <MessageSquare size={13} /> },
                            { id: 'layout', label: 'Align & QR', icon: <AlignLeft size={13} /> },
                        ].map(t => (
                            <button
                                key={t.id}
                                type="button"
                                onClick={() => setActiveTab(t.id)}
                                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                                    activeTab === t.id 
                                        ? 'bg-white/15 text-white shadow-sm border border-white/10' 
                                        : 'text-white/50 hover:text-white/80'
                                }`}
                            >
                                {t.icon}
                                <span>{t.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Scrollable Control Panel Body */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-5">
                        {/* TAB 1: DEFINED DESIGN STYLES */}
                        {activeTab === 'designs' && (
                            <div className="space-y-3">
                                <div>
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-white/50">Defined Design Styles</h3>
                                    <p className="text-[11px] text-white/40 mt-0.5">Select a vintage or modernist template layout</p>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    {Object.values(DESIGN_STYLES).map(style => {
                                        const isSelected = designStyle === style.id;
                                        return (
                                            <button
                                                key={style.id}
                                                type="button"
                                                onClick={() => setDesignStyle(style.id)}
                                                className={`p-3 rounded-xl border text-left flex flex-col justify-between gap-1.5 transition cursor-pointer ${
                                                    isSelected
                                                        ? 'bg-white/15 border-[var(--theme-accent,#E8A87C)] ring-1 ring-[var(--theme-accent,#E8A87C)]'
                                                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between w-full">
                                                    <span className="text-xs font-bold text-white tracking-tight">{style.label}</span>
                                                    <span className="text-[9px] px-1.5 py-0.2 rounded font-semibold bg-white/10 text-white/70">{style.tag}</span>
                                                </div>
                                                <p className="text-[10px] text-white/50 leading-relaxed line-clamp-2">{style.description}</p>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* TAB 2: CARD FORMATS */}
                        {activeTab === 'formats' && (
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-white/50">Card Content Format</h3>
                                    <p className="text-[11px] text-white/40 mt-0.5">Choose classic artwork, full tracklist, or big scannable QR</p>
                                </div>
                                <div className="space-y-2">
                                    {Object.values(CARD_TYPES).map(cType => {
                                        const isSelected = cardType === cType.id;
                                        return (
                                            <button
                                                key={cType.id}
                                                type="button"
                                                onClick={() => setCardType(cType.id)}
                                                className={`w-full p-3 rounded-xl border text-left flex items-start justify-between gap-3 transition cursor-pointer ${
                                                    isSelected
                                                        ? 'bg-white/15 border-[var(--theme-accent,#E8A87C)] ring-1 ring-[var(--theme-accent,#E8A87C)]'
                                                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                                                }`}
                                            >
                                                <div>
                                                    <h4 className="text-xs font-bold text-white tracking-tight">{cType.label}</h4>
                                                    <p className="text-[10px] text-white/50 mt-0.5">{cType.desc}</p>
                                                </div>
                                                {isSelected && <Check size={16} className="text-[var(--theme-accent,#E8A87C)] shrink-0 mt-0.5" />}
                                            </button>
                                        );
                                    })}
                                </div>

                                {cardType === 'tracklist' && (
                                    <div className="space-y-2 pt-2 border-t border-white/10">
                                        <label className="text-xs font-bold text-white/70">Tracklist Cover Art Presentation</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setTracklistArtMode('square_top')}
                                                className={`p-2 rounded-xl border text-xs font-semibold text-center transition cursor-pointer ${
                                                    tracklistArtMode === 'square_top'
                                                        ? 'bg-white text-black font-bold border-white'
                                                        : 'bg-white/5 text-white/60 border-white/10 hover:text-white'
                                                }`}
                                            >
                                                Square Art Above Tracks
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setTracklistArtMode('compact_header')}
                                                className={`p-2 rounded-xl border text-xs font-semibold text-center transition cursor-pointer ${
                                                    tracklistArtMode === 'compact_header'
                                                        ? 'bg-white text-black font-bold border-white'
                                                        : 'bg-white/5 text-white/60 border-white/10 hover:text-white'
                                                }`}
                                            >
                                                Compact Header Banner
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* TAB 3: ELEMENTS & VISIBILITY */}
                        {activeTab === 'elements' && (
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-white/50">Select Content Inside Card</h3>
                                    <p className="text-[11px] text-white/40 mt-0.5">Toggle what elements appear on the card</p>
                                </div>

                                {/* Core Element Toggles */}
                                <div className="space-y-1.5 p-3 bg-white/5 rounded-2xl border border-white/10">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/40 block mb-1">Core Info Toggles</span>
                                    
                                    <label className="flex items-center justify-between py-1.5 cursor-pointer">
                                        <span className="text-xs text-white/80 font-medium">Square Cover Artwork</span>
                                        <input type="checkbox" checked={showCoverArt} onChange={e => setShowCoverArt(e.target.checked)} className="accent-[var(--theme-accent,#E8A87C)] w-4 h-4 cursor-pointer" />
                                    </label>

                                    <label className="flex items-center justify-between py-1.5 cursor-pointer border-t border-white/5">
                                        <span className="text-xs text-white/80 font-medium">Song / Album Title</span>
                                        <input type="checkbox" checked={showTitle} onChange={e => setShowTitle(e.target.checked)} className="accent-[var(--theme-accent,#E8A87C)] w-4 h-4 cursor-pointer" />
                                    </label>

                                    <label className="flex items-center justify-between py-1.5 cursor-pointer border-t border-white/5">
                                        <span className="text-xs text-white/80 font-medium">Artist Name</span>
                                        <input type="checkbox" checked={showArtist} onChange={e => setShowArtist(e.target.checked)} className="accent-[var(--theme-accent,#E8A87C)] w-4 h-4 cursor-pointer" />
                                    </label>

                                    <label className="flex items-center justify-between py-1.5 cursor-pointer border-t border-white/5">
                                        <span className="text-xs text-white/80 font-medium">Album Subtitle</span>
                                        <input type="checkbox" checked={showAlbum} onChange={e => setShowAlbum(e.target.checked)} className="accent-[var(--theme-accent,#E8A87C)] w-4 h-4 cursor-pointer" />
                                    </label>

                                    <label className="flex items-center justify-between py-1.5 cursor-pointer border-t border-white/5">
                                        <span className="text-xs text-white/80 font-medium">Header Groove Logo & Indicator</span>
                                        <input type="checkbox" checked={showHeaderLogo} onChange={e => setShowHeaderLogo(e.target.checked)} className="accent-[var(--theme-accent,#E8A87C)] w-4 h-4 cursor-pointer" />
                                    </label>
                                </div>

                                {/* Release Date Settings */}
                                <div className="p-3 bg-white/5 rounded-2xl border border-white/10 space-y-2.5">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-white/90">Release Date</span>
                                        <input type="checkbox" checked={showReleaseDate} onChange={e => setShowReleaseDate(e.target.checked)} className="accent-[var(--theme-accent,#E8A87C)] w-4 h-4 cursor-pointer" />
                                    </div>
                                    {showReleaseDate && (
                                        <>
                                            <div className="grid grid-cols-3 gap-1 pt-1 border-t border-white/10">
                                                {['year', 'monthYear', 'full'].map(m => (
                                                    <button
                                                        key={m}
                                                        type="button"
                                                        onClick={() => setDateMode(m)}
                                                        className={`py-1 text-[10px] font-semibold rounded-lg transition cursor-pointer text-center ${
                                                            dateMode === m ? 'bg-white text-black font-bold shadow' : 'bg-white/5 text-white/60 hover:text-white'
                                                        }`}
                                                    >
                                                        {m === 'year' ? 'Year' : m === 'monthYear' ? 'Month/Yr' : 'Full Date'}
                                                    </button>
                                                ))}
                                            </div>
                                            <div className="grid grid-cols-3 gap-1">
                                                {[
                                                    { id: 'inline', label: 'In Metadata' },
                                                    { id: 'subhead', label: 'Under Title' },
                                                    { id: 'header', label: 'Top Header' },
                                                ].map(dp => (
                                                    <button
                                                        key={dp.id}
                                                        type="button"
                                                        onClick={() => setDatePlacement(dp.id)}
                                                        className={`py-1 text-[10px] font-semibold rounded-lg transition cursor-pointer text-center ${
                                                            datePlacement === dp.id ? 'bg-[var(--theme-accent,#E8A87C)] text-black font-bold' : 'bg-white/5 text-white/60 hover:text-white'
                                                        }`}
                                                    >
                                                        {dp.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Genre Tags Settings */}
                                <div className="p-3 bg-white/5 rounded-2xl border border-white/10 space-y-2.5">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-white/90">Genre Tags</span>
                                        <input type="checkbox" checked={showGenres} onChange={e => setShowGenres(e.target.checked)} className="accent-[var(--theme-accent,#E8A87C)] w-4 h-4 cursor-pointer" />
                                    </div>
                                    {showGenres && (
                                        <div className="grid grid-cols-3 gap-1 pt-1 border-t border-white/10">
                                            {[
                                                { id: 'below_artist', label: 'Below Artist' },
                                                { id: 'top_header', label: 'Top Header' },
                                                { id: 'footer', label: 'Footer Tag' },
                                            ].map(gp => (
                                                <button
                                                    key={gp.id}
                                                    type="button"
                                                    onClick={() => setGenresPlacement(gp.id)}
                                                    className={`py-1 text-[10px] font-semibold rounded-lg transition cursor-pointer text-center ${
                                                        genresPlacement === gp.id ? 'bg-white text-black font-bold shadow' : 'bg-white/5 text-white/60 hover:text-white'
                                                    }`}
                                                >
                                                    {gp.label}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Ratings Display Settings */}
                                <div className="p-3 bg-white/5 rounded-2xl border border-white/10 space-y-2.5">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-white/90">Music Rating</span>
                                        <input type="checkbox" checked={showRating} onChange={e => setShowRating(e.target.checked)} className="accent-[var(--theme-accent,#E8A87C)] w-4 h-4 cursor-pointer" />
                                    </div>
                                    {showRating && (
                                        <div className="grid grid-cols-3 gap-1 pt-1 border-t border-white/10">
                                            {[
                                                { id: 'corner', label: 'Corner Pie' },
                                                { id: 'header', label: 'Header Pill' },
                                                { id: 'inline', label: 'Inline Star' },
                                            ].map(rp => (
                                                <button
                                                    key={rp.id}
                                                    type="button"
                                                    onClick={() => setRatingPlacement(rp.id)}
                                                    className={`py-1 text-[10px] font-semibold rounded-lg transition cursor-pointer text-center ${
                                                        ratingPlacement === rp.id ? 'bg-white text-black font-bold shadow' : 'bg-white/5 text-white/60 hover:text-white'
                                                    }`}
                                                >
                                                    {rp.label}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Audio Durations & Discs Info */}
                                <div className="space-y-1.5 p-3 bg-white/5 rounded-2xl border border-white/10">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/40 block mb-1">Audio Specs</span>
                                    <label className="flex items-center justify-between py-1.5 cursor-pointer">
                                        <span className="text-xs text-white/80 font-medium">Show Duration</span>
                                        <input type="checkbox" checked={showDuration} onChange={e => setShowDuration(e.target.checked)} className="accent-[var(--theme-accent,#E8A87C)] w-4 h-4 cursor-pointer" />
                                    </label>
                                    <label className="flex items-center justify-between py-1.5 cursor-pointer border-t border-white/5">
                                        <span className="text-xs text-white/80 font-medium">Show Discs & Tracks Count</span>
                                        <input type="checkbox" checked={showDiscs} onChange={e => setShowDiscs(e.target.checked)} className="accent-[var(--theme-accent,#E8A87C)] w-4 h-4 cursor-pointer" />
                                    </label>
                                </div>
                            </div>
                        )}

                        {/* TAB 4: THEME & COLORS */}
                        {activeTab === 'colors' && (
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-white/50 flex items-center justify-between">
                                        <span>Background Theme</span>
                                        <span className="text-[11px] text-[var(--theme-accent,#E8A87C)] font-semibold">{activeTheme.label}</span>
                                    </h3>
                                    <p className="text-[11px] text-white/40 mt-0.5">8 Abstract themes or custom solid color</p>
                                </div>

                                {/* 8 Themes + Solid Color Button */}
                                <div className="grid grid-cols-3 gap-2">
                                    {Object.keys(THEMES).map(tKey => {
                                        const t = THEMES[tKey];
                                        const isSelected = cardTheme === tKey;
                                        return (
                                            <button
                                                key={tKey}
                                                type="button"
                                                onClick={() => setCardTheme(tKey)}
                                                className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 transition cursor-pointer ${
                                                    isSelected 
                                                        ? 'border-[var(--theme-accent,#E8A87C)] ring-1 ring-[var(--theme-accent,#E8A87C)] bg-white/10' 
                                                        : 'border-white/10 bg-white/5 hover:bg-white/10'
                                                }`}
                                            >
                                                <div className="w-full h-7 rounded-lg shadow-inner border border-white/10" style={{ background: t.preview }} />
                                                <span className="text-[10px] font-medium text-white/80 truncate w-full text-center">{t.label}</span>
                                            </button>
                                        );
                                    })}

                                    {/* 9th Option: Solid Color Button */}
                                    <button
                                        type="button"
                                        onClick={() => setCardTheme('solid')}
                                        className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 transition cursor-pointer ${
                                            cardTheme === 'solid'
                                                ? 'border-[var(--theme-accent,#E8A87C)] ring-1 ring-[var(--theme-accent,#E8A87C)] bg-white/10'
                                                : 'border-white/10 bg-white/5 hover:bg-white/10'
                                        }`}
                                    >
                                        <div className="w-full h-7 rounded-lg shadow-inner border border-white/10 flex items-center justify-center" style={{ backgroundColor: customBgColor }}>
                                            <Paintbrush size={13} className={isLightColor(customBgColor) ? 'text-black/70' : 'text-white/70'} />
                                        </div>
                                        <span className="text-[10px] font-bold text-white/90 truncate w-full text-center">Solid Color</span>
                                    </button>
                                </div>

                                {/* Solid Color Chooser Drawer */}
                                {cardTheme === 'solid' && (
                                    <div className="p-3 bg-white/5 rounded-2xl border border-white/10 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-white/80">Background Color Chooser</span>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="color"
                                                    value={customBgColor}
                                                    onChange={(e) => setCustomBgColor(e.target.value)}
                                                    className="w-7 h-7 rounded-lg border border-white/20 cursor-pointer bg-transparent"
                                                    title="Pick any background color"
                                                />
                                                <span className="text-[11px] font-mono font-semibold uppercase text-white/70">{customBgColor}</span>
                                            </div>
                                        </div>

                                        <div>
                                            <span className="text-[10px] font-semibold text-white/50 uppercase tracking-wider block mb-1.5">Preset Palette</span>
                                            <div className="grid grid-cols-6 gap-1.5">
                                                {SOLID_COLOR_PRESETS.map((p) => (
                                                    <button
                                                        key={p.hex}
                                                        type="button"
                                                        onClick={() => setCustomBgColor(p.hex)}
                                                        className={`h-7 rounded-lg border transition-all flex items-center justify-center cursor-pointer ${
                                                            customBgColor.toLowerCase() === p.hex.toLowerCase()
                                                                ? 'border-white scale-105 shadow-md ring-2 ring-[var(--theme-accent)]/50'
                                                                : 'border-white/10 hover:scale-105'
                                                        }`}
                                                        style={{ backgroundColor: p.hex }}
                                                        title={p.label}
                                                    >
                                                        {customBgColor.toLowerCase() === p.hex.toLowerCase() && (
                                                            <div className={`w-1.5 h-1.5 rounded-full ${isLightColor(p.hex) ? 'bg-black' : 'bg-white'}`} />
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Text Color Section */}
                                <div className="space-y-3 pt-2 border-t border-white/10">
                                    <label className="text-xs font-bold uppercase tracking-wider text-white/60 block">Text Color Mode</label>
                                    <div className="grid grid-cols-2 gap-2 p-1 bg-white/5 border border-white/10 rounded-xl">
                                        <button
                                            type="button"
                                            onClick={() => setTextColorMode('auto')}
                                            className={`py-1.5 px-3 text-xs font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                                                textColorMode === 'auto' ? 'bg-white text-black shadow' : 'text-white/60 hover:text-white'
                                            }`}
                                        >
                                            <Sparkles size={13} />
                                            <span>Auto Contrast</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setTextColorMode('custom')}
                                            className={`py-1.5 px-3 text-xs font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                                                textColorMode === 'custom' ? 'bg-white text-black shadow' : 'text-white/60 hover:text-white'
                                            }`}
                                        >
                                            <Palette size={13} />
                                            <span>Custom Color</span>
                                        </button>
                                    </div>

                                    {textColorMode === 'custom' && (
                                        <div className="p-3 bg-white/5 rounded-2xl border border-white/10 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-bold text-white/80">Text Color Chooser</span>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="color"
                                                        value={customTextColor}
                                                        onChange={(e) => setCustomTextColor(e.target.value)}
                                                        className="w-7 h-7 rounded-lg border border-white/20 cursor-pointer bg-transparent"
                                                        title="Pick text color"
                                                    />
                                                    <span className="text-[11px] font-mono font-semibold uppercase text-white/70">{customTextColor}</span>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-4 gap-2">
                                                {TEXT_COLOR_PRESETS.map((tc) => (
                                                    <button
                                                        key={tc.hex}
                                                        type="button"
                                                        onClick={() => setCustomTextColor(tc.hex)}
                                                        className={`py-1.5 px-2 rounded-lg border text-xs flex items-center gap-1.5 transition cursor-pointer ${
                                                            customTextColor.toLowerCase() === tc.hex.toLowerCase()
                                                                ? 'border-white bg-white/20 font-bold'
                                                                : 'border-white/10 bg-white/5 hover:bg-white/10'
                                                        }`}
                                                    >
                                                        <div className="w-3.5 h-3.5 rounded-full border border-black/20 shrink-0" style={{ backgroundColor: tc.hex }} />
                                                        <span className="truncate">{tc.label}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Film Grain Texture Section */}
                                <div className="space-y-2 pt-2 border-t border-white/10">
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
                                                    noiseLevel === lvl ? 'bg-white text-black font-bold shadow' : 'text-white/60 hover:text-white'
                                                }`}
                                            >
                                                {lvl === 'none' ? 'Off' : lvl}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 5: FULL TRACKLIST SETTINGS */}
                        {activeTab === 'tracklist' && (
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-white/50">Full Tracklist Configuration</h3>
                                    <p className="text-[11px] text-white/40 mt-0.5">Showing all {fullTracksList.length} tracks on the card</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-white/70">Columns Layout</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[
                                            { id: 'auto', label: 'Auto' },
                                            { id: '1', label: '1 Column' },
                                            { id: '2', label: '2 Columns' },
                                        ].map(col => (
                                            <button
                                                key={col.id}
                                                type="button"
                                                onClick={() => setTracklistColumns(col.id)}
                                                className={`py-2 px-3 rounded-xl border text-xs font-bold transition cursor-pointer text-center ${
                                                    tracklistColumns === col.id ? 'bg-white text-black font-bold border-white' : 'bg-white/5 text-white/60 border-white/10 hover:text-white'
                                                }`}
                                            >
                                                {col.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-1.5 p-3 bg-white/5 rounded-2xl border border-white/10">
                                    <label className="flex items-center justify-between py-1.5 cursor-pointer">
                                        <span className="text-xs text-white/80 font-medium">Show Track Durations</span>
                                        <input type="checkbox" checked={showTrackDurations} onChange={e => setShowTrackDurations(e.target.checked)} className="accent-[var(--theme-accent,#E8A87C)] w-4 h-4 cursor-pointer" />
                                    </label>
                                    <label className="flex items-center justify-between py-1.5 cursor-pointer border-t border-white/5">
                                        <span className="text-xs text-white/80 font-medium">Show Track Numbers</span>
                                        <input type="checkbox" checked={showTrackNumbers} onChange={e => setShowTrackNumbers(e.target.checked)} className="accent-[var(--theme-accent,#E8A87C)] w-4 h-4 cursor-pointer" />
                                    </label>
                                </div>
                            </div>
                        )}

                        {/* TAB 6: CUSTOM ANNOTATIONS */}
                        {activeTab === 'annotation' && (
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-white/50">Personal Custom Annotation</h3>
                                    <p className="text-[11px] text-white/40 mt-0.5">Type your own personal note, memory, quote, or review snippet</p>
                                </div>

                                <label className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition cursor-pointer">
                                    <span className="text-xs font-bold text-white/90">Display Annotation on Card</span>
                                    <input
                                        type="checkbox"
                                        checked={showAnnotation}
                                        onChange={(e) => setShowAnnotation(e.target.checked)}
                                        className="w-4 h-4 accent-[var(--theme-accent,#E8A87C)] cursor-pointer"
                                    />
                                </label>

                                {showAnnotation && (
                                    <div className="space-y-3">
                                        <div>
                                            <label className="text-xs font-bold text-white/70 block mb-1">Your Custom Text</label>
                                            <textarea
                                                value={annotationText}
                                                onChange={(e) => setAnnotationText(e.target.value)}
                                                rows={3}
                                                placeholder="Write your note, review, or vinyl liner memory..."
                                                className="w-full p-2.5 rounded-xl bg-white/5 border border-white/15 text-xs text-white focus:outline-none focus:border-[var(--theme-accent,#E8A87C)] resize-none"
                                            />
                                        </div>

                                        {/* Quick Prompt Ideas */}
                                        <div>
                                            <span className="text-[10px] font-semibold text-white/40 uppercase tracking-wider block mb-1.5">Quick Inspiration</span>
                                            <div className="flex flex-wrap gap-1.5">
                                                {[
                                                    'Side B is pure magic.',
                                                    'Best bridge in music history.',
                                                    'Spun this on repeat all summer.',
                                                    'Master analog recording.',
                                                    'Late night headphone listening.'
                                                ].map(q => (
                                                    <button
                                                        key={q}
                                                        type="button"
                                                        onClick={() => setAnnotationText(q)}
                                                        className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-[10px] text-white/70 transition cursor-pointer"
                                                    >
                                                        {q}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-white/70">Typography Style</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {[
                                                    { id: 'handwritten', label: 'Handwritten / Script', desc: 'Serif italic cursive note' },
                                                    { id: 'typewriter', label: 'Typewriter / Mono', desc: 'Vintage monospace note' },
                                                    { id: 'pill', label: 'Curator Pill', desc: 'Enclosed border stamp badge' },
                                                    { id: 'quote', label: 'Pull Quote', desc: 'Editorial quote bar' },
                                                ].map((st) => (
                                                    <button
                                                        key={st.id}
                                                        type="button"
                                                        onClick={() => setAnnotationStyle(st.id)}
                                                        className={`p-2 rounded-xl border text-left transition cursor-pointer ${
                                                            annotationStyle === st.id
                                                                ? 'bg-white text-black font-bold border-white shadow'
                                                                : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10'
                                                        }`}
                                                    >
                                                        <span className="text-[11px] block">{st.label}</span>
                                                        <span className={`text-[9px] block ${annotationStyle === st.id ? 'text-black/60' : 'text-white/40'}`}>{st.desc}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-white/70">Placement</label>
                                            <div className="grid grid-cols-3 gap-1.5">
                                                {[
                                                    { id: 'bottom', label: 'Card Bottom' },
                                                    { id: 'under_art', label: 'Under Artwork' },
                                                    { id: 'badge', label: 'Artwork Badge' },
                                                ].map((pl) => (
                                                    <button
                                                        key={pl.id}
                                                        type="button"
                                                        onClick={() => setAnnotationPlacement(pl.id)}
                                                        className={`py-1.5 px-2 rounded-lg text-[10px] font-semibold transition cursor-pointer text-center ${
                                                            annotationPlacement === pl.id
                                                                ? 'bg-white text-black font-bold shadow'
                                                                : 'bg-white/5 text-white/60 hover:text-white'
                                                        }`}
                                                    >
                                                        {pl.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* TAB 7: ALIGNMENT & QR WIDGETS */}
                        {activeTab === 'layout' && (
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-white/50">Alignment & Widgets</h3>
                                    <p className="text-[11px] text-white/40 mt-0.5">Control text alignment, title placement and QR code</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-white/70">Text Alignment</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[
                                            { id: 'left', label: 'Left', icon: <AlignLeft size={14} /> },
                                            { id: 'center', label: 'Center', icon: <AlignCenter size={14} /> },
                                            { id: 'right', label: 'Right', icon: <AlignRight size={14} /> },
                                        ].map((al) => (
                                            <button
                                                key={al.id}
                                                type="button"
                                                onClick={() => setTextAlign(al.id)}
                                                className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-bold transition cursor-pointer ${
                                                    textAlign === al.id ? 'bg-white text-black border-white shadow' : 'bg-white/5 text-white/60 border-white/10 hover:text-white'
                                                }`}
                                            >
                                                {al.icon}
                                                <span>{al.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-white/70">Title Position</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setTitlePlacement('bottom')}
                                            className={`p-2 rounded-xl border text-xs font-bold transition cursor-pointer text-center ${
                                                titlePlacement === 'bottom' ? 'bg-white text-black border-white shadow' : 'bg-white/5 text-white/60 border-white/10 hover:text-white'
                                            }`}
                                        >
                                            Below Artwork
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setTitlePlacement('top')}
                                            className={`p-2 rounded-xl border text-xs font-bold transition cursor-pointer text-center ${
                                                titlePlacement === 'top' ? 'bg-white text-black border-white shadow' : 'bg-white/5 text-white/60 border-white/10 hover:text-white'
                                            }`}
                                        >
                                            Above Artwork
                                        </button>
                                    </div>
                                </div>

                                {/* Corner Widget Options */}
                                <div className="space-y-2 pt-2 border-t border-white/10">
                                    <label className="text-xs font-bold uppercase tracking-wider text-white/60">Corner Widget (Bottom-Right)</label>
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
                                            <Star size={14} />
                                            <span className="text-[10px]">Rating Pie</span>
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
                                            <QrCode size={14} />
                                            <span className="text-[10px]">QR Code</span>
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
                                            <EyeOff size={14} />
                                            <span className="text-[10px]">None</span>
                                        </button>
                                    </div>
                                    {cornerWidget === 'qr' && (
                                        <div className="flex items-center justify-between p-2.5 bg-white/5 rounded-xl border border-white/10 mt-1">
                                            <span className="text-[11px] font-semibold text-white/60">QR Code Color</span>
                                            <div className="flex gap-1.5">
                                                {QR_COLORS.map((c) => (
                                                    <button
                                                        key={c.hex}
                                                        type="button"
                                                        onClick={() => setQrColor(c.hex)}
                                                        className={`w-5 h-5 rounded-full border transition cursor-pointer ${c.class} ${
                                                            qrColor === c.hex ? 'border-white scale-110 shadow-md ring-2 ring-[var(--theme-accent)]/50' : 'hover:scale-105'
                                                        }`}
                                                        title={c.label}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </aside>

                {/* Center / Main Canvas Preview (Free natural height, dynamically grows with content) */}
                <main className="flex-1 flex items-start justify-center p-3 sm:p-6 lg:p-8 bg-[#050508] relative overflow-y-auto select-none min-h-0">
                    <div 
                        className="absolute inset-0 opacity-[0.03] pointer-events-none"
                        style={{
                            backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)',
                            backgroundSize: '24px 24px'
                        }}
                    />

                    {/* LIVE CARD PREVIEW (Export Target - FREE HEIGHT, GROWS NATURALLY) */}
                    <div 
                        ref={cardRef} 
                        style={{
                            ...activeTheme.bgStyle,
                            borderColor: activeTheme.border,
                        }}
                        className={`relative w-full max-w-[320px] xs:max-w-[340px] sm:max-w-[380px] h-auto my-auto p-4 sm:p-5 rounded-2xl flex flex-col justify-start shadow-2xl border transition-colors duration-200 overflow-hidden select-none ${
                            designStyle === 'library' ? 'font-mono' : designStyle === 'museum' ? 'tracking-wide' : 'font-sans'
                        }`}
                    >
                        {/* Film Grain Texture Overlay */}
                        {grainOpacity > 0 && noiseDataUri && (
                            <div 
                                aria-hidden="true"
                                className="absolute inset-0 pointer-events-none rounded-2xl z-0"
                                style={{
                                    backgroundImage: `url("${noiseDataUri}")`,
                                    backgroundRepeat: 'repeat',
                                    mixBlendMode: activeTheme.isLight ? 'multiply' : 'overlay',
                                    opacity: grainOpacity,
                                }}
                            />
                        )}

                        {/* DESIGN STYLE 1: LIBRARY CATALOGUE CARD ACCENTS */}
                        {designStyle === 'library' && (
                            <div className="relative z-10 w-full mb-3 pb-2 border-b border-red-500/30 flex justify-between items-start text-[8px] sm:text-[9px] uppercase font-bold tracking-widest text-red-600/80">
                                <div className="flex flex-col">
                                    <span>CLASS: 781.66 / GROOVE</span>
                                    <span style={{ color: textColors.muted }}>ACCESSION: MB-{String(itemId || '9481').slice(0, 6).toUpperCase()}</span>
                                </div>
                                <span className="border border-red-500/60 px-1.5 py-0.5 rounded text-[8px] rotate-[-2deg]">
                                    LOAN ARCHIVE
                                </span>
                            </div>
                        )}

                        {/* DESIGN STYLE 2: VINYL INSERT OBI BANNER */}
                        {designStyle === 'vinyl' && (
                            <div className="relative z-10 w-full mb-3 px-2.5 py-1 rounded bg-black/30 border border-white/10 flex justify-between items-center text-[8px] font-bold tracking-widest uppercase">
                                <span style={{ color: textColors.accent }}>
                                    GROOVE 帯 • 33⅓ RPM • STEREO
                                </span>
                                <span style={{ color: textColors.muted }}>
                                    HIGH-FIDELITY SEAL
                                </span>
                            </div>
                        )}

                        {/* DESIGN STYLE 3: MUSEUM EXHIBIT ACCESSION HEADER */}
                        {designStyle === 'museum' && (
                            <div className="relative z-10 w-full mb-3 flex justify-between items-center text-[8px] font-semibold tracking-widest uppercase" style={{ color: textColors.muted }}>
                                <span>GALLERY 4 • SOUND INSTALLATION</span>
                                <span>OBJ: 2026.04.18</span>
                            </div>
                        )}

                        {/* DESIGN STYLE 4: CASSETTE J-CARD HEADER */}
                        {designStyle === 'cassette' && (
                            <div className="relative z-10 w-full mb-3 pb-1.5 border-b border-dashed flex justify-between items-center text-[8px] font-mono uppercase tracking-wider" style={{ borderColor: textColors.faint, color: textColors.muted }}>
                                <span>SIDE A • TYPE II [CrO2] • 120μs</span>
                                <span className="px-1.5 py-0.2 bg-white/10 rounded font-bold">DOLBY B-NR</span>
                            </div>
                        )}

                        {/* DESIGN STYLE 5: CONCERT TICKET STUB PERFORATION HEADER */}
                        {designStyle === 'ticket' && (
                            <div className="relative z-10 w-full mb-3 pb-2 border-b-2 border-dashed flex justify-between items-center text-[8px] font-bold uppercase tracking-widest" style={{ borderColor: textColors.faint, color: textColors.primary }}>
                                <span>ADMIT ONE • GROOVE SOUND ARENA</span>
                                <span>SEC: PIT • ROW: A</span>
                            </div>
                        )}

                        {/* STANDARD HEADER (Modern Studio) */}
                        {designStyle === 'modern' && showHeaderLogo && (
                            <div className="relative z-10 w-full flex justify-between items-center mb-3">
                                <div className="flex items-center gap-1.5">
                                    <img 
                                        src="/in.svg" 
                                        alt="Groove" 
                                        className={`w-3.5 h-3.5 object-contain shrink-0 ${activeTheme.isLight ? 'brightness-0' : 'opacity-80'}`} 
                                        crossOrigin="anonymous" 
                                    />
                                    <span className="text-[9px] tracking-[0.25em] font-bold uppercase font-sans" style={{ color: textColors.secondary }}>
                                        GrooveCard
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {showGenres && genresPlacement === 'top_header' && renderGenreTags()}
                                    {showReleaseDate && datePlacement === 'header' && displayDate && (
                                        <span className="text-[8px] font-bold uppercase tracking-wider font-sans" style={{ color: textColors.muted }}>
                                            {displayDate}
                                        </span>
                                    )}
                                    {showRating && ratingPlacement === 'header' && (
                                        <span className="px-1.5 py-0.5 rounded-full text-[8px] font-extrabold uppercase font-sans border" style={{ backgroundColor: ratingColor + '20', borderColor: ratingColor, color: ratingColor }}>
                                            ★ {score10}
                                        </span>
                                    )}
                                    <span className="text-[8px] font-semibold tracking-wider uppercase font-sans" style={{ color: textColors.faint }}>
                                        {type || 'MUSIC'}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* TOP TITLE POSITION (If above artwork is selected) */}
                        {titlePlacement === 'top' && (
                            <div className="relative z-10 mb-3">
                                {renderTitleBlock()}
                            </div>
                        )}

                        {/* COVER ARTWORK (Always Square by default) */}
                        {showCoverArt && (
                            <>
                                {cardType === 'mini_poster' ? (
                                    <div className="relative z-10 w-full aspect-[4/3] rounded-xl overflow-hidden shadow-lg border border-white/10 bg-black/40 mb-3">
                                        <img src={imageUrl || "/placeholder.jpg"} alt={title} className="w-full h-full object-cover" crossOrigin="anonymous" />
                                    </div>
                                ) : cardType === 'tracklist' && tracklistArtMode === 'compact_header' ? (
                                    <div className="relative z-10 w-full flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-white/10 mb-3">
                                        <div className="w-14 h-14 aspect-square rounded-lg overflow-hidden shrink-0 border border-white/10 bg-black/30">
                                            <img src={imageUrl || "/placeholder.jpg"} alt={title} className="w-full h-full object-cover" crossOrigin="anonymous" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            {showTitle && <h5 className="text-xs font-bold truncate" style={{ color: textColors.primary }}>{title}</h5>}
                                            {showArtist && <p className="text-[10px] truncate mt-0.5" style={{ color: textColors.secondary }}>{artistLabel}</p>}
                                            {showAlbum && album && <p className="text-[9px] italic truncate mt-0.5" style={{ color: textColors.muted }}>{album}</p>}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="relative z-10 w-full aspect-square rounded-xl overflow-hidden shadow-lg border border-white/10 bg-black/40 mb-3 group">
                                        <img
                                            src={imageUrl || "/placeholder.jpg"}
                                            alt={title}
                                            className="w-full h-full object-cover"
                                            crossOrigin="anonymous"
                                            onError={(e) => {
                                                e.currentTarget.src = 'https://placehold.co/400x400/17020B/E8A87C?text=Music';
                                            }}
                                        />
                                        {showAnnotation && annotationPlacement === 'badge' && (
                                            <div className="absolute top-2 left-2 max-w-[85%] z-20">
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-black/85 backdrop-blur-md text-[9px] font-semibold text-white border border-white/20 shadow-md">
                                                    ✦ {annotationText}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </>
                        )}

                        {/* ANNOTATION UNDER ARTWORK PLACEMENT */}
                        {showAnnotation && annotationPlacement === 'under_art' && renderAnnotation()}

                        {/* BOTTOM TITLE POSITION (Default Classic) */}
                        {titlePlacement === 'bottom' && !(cardType === 'tracklist' && tracklistArtMode === 'compact_header') && (
                            <div className="relative z-10 mb-3">
                                {renderTitleBlock()}
                            </div>
                        )}

                        {/* FULL TRACKLIST SECTION (Includes all tracks, 1 or 2 columns, free height) */}
                        {cardType === 'tracklist' && (
                            <div className="relative z-10 w-full mb-3 space-y-1.5">
                                <div className="flex justify-between items-center text-[8px] font-bold uppercase tracking-wider pb-1 border-b" style={{ borderColor: textColors.faint, color: textColors.muted }}>
                                    <span>TRACKLIST ({fullTracksList.length} TRACKS)</span>
                                    <span>{useTwoColumns ? '2 COLUMNS' : 'AUDIO'}</span>
                                </div>

                                {useTwoColumns ? (
                                    /* 2 Columns Layout for long tracklists */
                                    <div className="grid grid-cols-2 gap-x-3 gap-y-1 pt-1">
                                        {/* Column 1 */}
                                        <div className="space-y-1">
                                            {fullTracksList.slice(0, Math.ceil(fullTracksList.length / 2)).map(tr => (
                                                <div key={tr.num} className="flex items-center justify-between text-[8px] sm:text-[9px] font-medium leading-none py-0.5">
                                                    <div className="flex items-center gap-1.5 truncate pr-1">
                                                        {showTrackNumbers && <span className="font-mono text-[8px]" style={{ color: textColors.muted }}>{tr.num}</span>}
                                                        <span className="truncate" style={{ color: textColors.primary }}>{tr.title}</span>
                                                    </div>
                                                    {showTrackDurations && <span className="font-mono text-[7.5px] shrink-0" style={{ color: textColors.secondary }}>{tr.duration}</span>}
                                                </div>
                                            ))}
                                        </div>
                                        {/* Column 2 */}
                                        <div className="space-y-1">
                                            {fullTracksList.slice(Math.ceil(fullTracksList.length / 2)).map(tr => (
                                                <div key={tr.num} className="flex items-center justify-between text-[8px] sm:text-[9px] font-medium leading-none py-0.5">
                                                    <div className="flex items-center gap-1.5 truncate pr-1">
                                                        {showTrackNumbers && <span className="font-mono text-[8px]" style={{ color: textColors.muted }}>{tr.num}</span>}
                                                        <span className="truncate" style={{ color: textColors.primary }}>{tr.title}</span>
                                                    </div>
                                                    {showTrackDurations && <span className="font-mono text-[7.5px] shrink-0" style={{ color: textColors.secondary }}>{tr.duration}</span>}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    /* 1 Column Layout */
                                    <div className="space-y-1 pt-1">
                                        {fullTracksList.map(tr => (
                                            <div key={tr.num} className="flex items-center justify-between text-[9px] font-medium leading-none py-0.5">
                                                <div className="flex items-center gap-2 truncate pr-2">
                                                    {showTrackNumbers && <span className="font-mono text-[8.5px]" style={{ color: textColors.muted }}>{tr.num}</span>}
                                                    <span className="truncate" style={{ color: textColors.primary }}>{tr.title}</span>
                                                </div>
                                                {showTrackDurations && <span className="font-mono text-[8px] shrink-0" style={{ color: textColors.secondary }}>{tr.duration}</span>}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* SCANNABLE QR FOCUS FORMAT (Large Camera Scannable QR) */}
                        {cardType === 'scannable_qr' && (
                            <div className="relative z-10 w-full my-2 flex flex-col items-center justify-center">
                                <div className="w-full p-4 rounded-2xl bg-white text-black shadow-xl flex flex-col items-center justify-center">
                                    <div className="relative p-1 bg-white rounded-xl flex items-center justify-center">
                                        <img 
                                            src={qrApi} 
                                            alt="Camera Scannable QR" 
                                            className="w-36 h-36 sm:w-40 sm:h-40 object-contain"
                                            crossOrigin="anonymous" 
                                        />
                                        <div className="absolute w-8 h-8 rounded-full bg-white border border-gray-200 p-1 flex items-center justify-center shadow-md">
                                            <img src="/in.svg" alt="Groove" className="w-full h-full object-contain" crossOrigin="anonymous" />
                                        </div>
                                    </div>
                                    <div className="mt-2.5 flex items-center gap-1.5 text-center">
                                        <QrCode size={14} className="text-black/70" />
                                        <span className="text-[10px] font-extrabold uppercase tracking-wider font-sans text-black">
                                            Scan camera to listen
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ANNOTATION BOTTOM PLACEMENT */}
                        {showAnnotation && annotationPlacement === 'bottom' && renderAnnotation()}

                        {/* GENRE TAGS FOOTER PLACEMENT */}
                        {showGenres && genresPlacement === 'footer' && renderGenreTags()}

                        {/* FOOTER AREA (Removed official groovecard branding completely) */}
                        {(designStyle === 'library' || (cornerWidget !== 'none' && cardType !== 'scannable_qr')) && (
                            <div className="relative z-10 flex justify-between items-end gap-3 pt-2 mt-auto">
                                {/* Library rod hole punch (vintage index card detail) */}
                                {designStyle === 'library' ? (
                                    <div 
                                        className="w-3.5 h-3.5 rounded-full border border-stone-400/50 bg-stone-300/40 shadow-inner shrink-0"
                                        title="Catalogue card drawer rod hole"
                                    />
                                ) : (
                                    <div />
                                )}

                                {/* Corner Element (Bottom Right) */}
                                {cardType !== 'scannable_qr' && (
                                    <div className="shrink-0 flex items-center justify-end">
                                        {cornerWidget === 'rating' && showRating && ratingPlacement === 'corner' && (
                                            <div className="flex flex-col items-center justify-center cursor-default" title={`Rating: ${score10}/10`}>
                                                <div className="relative w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center">
                                                    <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 44 44">
                                                        <circle 
                                                            cx="22" 
                                                            cy="22" 
                                                            r={pieRadius} 
                                                            fill="transparent" 
                                                            stroke={activeTheme.isLight ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.15)"} 
                                                            strokeWidth="3.2" 
                                                        />
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
                                                        <span className="text-[10px] sm:text-[11px] font-extrabold font-sans leading-none" style={{ color: ratingColor }}>
                                                            {score10}
                                                        </span>
                                                    </div>
                                                </div>
                                                <span className="text-[7px] font-bold tracking-widest uppercase mt-0.5 font-sans" style={{ color: textColors.muted }}>
                                                    RATING
                                                </span>
                                            </div>
                                        )}

                                        {cornerWidget === 'qr' && (
                                            <div 
                                                onClick={() => setQrFullScreen(true)}
                                                className="flex flex-col items-center justify-center cursor-zoom-in"
                                                title="Click to view full-size QR"
                                            >
                                                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg overflow-hidden bg-white p-0.5 shadow-md">
                                                    <img src={qrApi} alt="QR" className="w-full h-full object-contain" crossOrigin="anonymous" />
                                                </div>
                                                <span className="text-[7px] font-bold tracking-widest uppercase mt-0.5 font-sans" style={{ color: textColors.muted }}>
                                                    SCAN
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {/* MOBILE ONLY: Photo Editor Style Bottom Sliding Tool Tray */}
            <div className="md:hidden border-t border-white/10 bg-[#0d0d14]/95 backdrop-blur-xl shrink-0 z-40 pb-safe">
                {/* Horizontal Tool Sub-Options Bar */}
                <div className="px-3 py-2 border-b border-white/5 overflow-x-auto no-scrollbar flex items-center gap-2">
                    {activeTab === 'designs' && (
                        <div className="flex items-center gap-2">
                            {Object.values(DESIGN_STYLES).map(s => (
                                <button
                                    key={s.id}
                                    type="button"
                                    onClick={() => setDesignStyle(s.id)}
                                    className={`px-3 py-1.5 rounded-full border text-xs whitespace-nowrap transition cursor-pointer ${
                                        designStyle === s.id ? 'bg-white text-black font-bold shadow' : 'bg-white/5 text-white/70 border-white/10'
                                    }`}
                                >
                                    {s.label}
                                </button>
                            ))}
                        </div>
                    )}

                    {activeTab === 'formats' && (
                        <div className="flex items-center gap-2">
                            {Object.values(CARD_TYPES).map(c => (
                                <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => setCardType(c.id)}
                                    className={`px-3 py-1.5 rounded-full border text-xs whitespace-nowrap transition cursor-pointer ${
                                        cardType === c.id ? 'bg-white text-black font-bold shadow' : 'bg-white/5 text-white/70 border-white/10'
                                    }`}
                                >
                                    {c.label}
                                </button>
                            ))}
                        </div>
                    )}

                    {activeTab === 'elements' && (
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setShowCoverArt(!showCoverArt)}
                                className={`px-2.5 py-1.5 rounded-full border text-xs whitespace-nowrap ${
                                    showCoverArt ? 'bg-white text-black font-bold' : 'bg-white/5 text-white/70 border-white/10'
                                }`}
                            >
                                Cover Art {showCoverArt ? '✓' : ''}
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowTitle(!showTitle)}
                                className={`px-2.5 py-1.5 rounded-full border text-xs whitespace-nowrap ${
                                    showTitle ? 'bg-white text-black font-bold' : 'bg-white/5 text-white/70 border-white/10'
                                }`}
                            >
                                Title {showTitle ? '✓' : ''}
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowArtist(!showArtist)}
                                className={`px-2.5 py-1.5 rounded-full border text-xs whitespace-nowrap ${
                                    showArtist ? 'bg-white text-black font-bold' : 'bg-white/5 text-white/70 border-white/10'
                                }`}
                            >
                                Artist {showArtist ? '✓' : ''}
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowReleaseDate(!showReleaseDate)}
                                className={`px-2.5 py-1.5 rounded-full border text-xs whitespace-nowrap ${
                                    showReleaseDate ? 'bg-white text-black font-bold' : 'bg-white/5 text-white/70 border-white/10'
                                }`}
                            >
                                Date {showReleaseDate ? '✓' : ''}
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowGenres(!showGenres)}
                                className={`px-2.5 py-1.5 rounded-full border text-xs whitespace-nowrap ${
                                    showGenres ? 'bg-white text-black font-bold' : 'bg-white/5 text-white/70 border-white/10'
                                }`}
                            >
                                Genres {showGenres ? '✓' : ''}
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowRating(!showRating)}
                                className={`px-2.5 py-1.5 rounded-full border text-xs whitespace-nowrap ${
                                    showRating ? 'bg-white text-black font-bold' : 'bg-white/5 text-white/70 border-white/10'
                                }`}
                            >
                                Rating {showRating ? '✓' : ''}
                            </button>
                        </div>
                    )}

                    {activeTab === 'colors' && (
                        <div className="flex items-center gap-2">
                            {Object.keys(THEMES).map(tKey => {
                                const t = THEMES[tKey];
                                return (
                                    <button
                                        key={tKey}
                                        type="button"
                                        onClick={() => setCardTheme(tKey)}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border shrink-0 transition cursor-pointer ${
                                            cardTheme === tKey ? 'bg-white text-black font-bold shadow' : 'bg-white/5 text-white/70 border-white/10'
                                        }`}
                                    >
                                        <div className="w-3.5 h-3.5 rounded-full border border-black/20" style={{ background: t.preview }} />
                                        <span className="text-xs">{t.label}</span>
                                    </button>
                                );
                            })}
                            <button
                                type="button"
                                onClick={() => setCardTheme('solid')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border shrink-0 transition cursor-pointer ${
                                    cardTheme === 'solid' ? 'bg-white text-black font-bold shadow' : 'bg-white/5 text-white/70 border-white/10'
                                }`}
                            >
                                <div className="w-3.5 h-3.5 rounded-full border border-black/20" style={{ backgroundColor: customBgColor }} />
                                <span className="text-xs">Solid</span>
                            </button>
                            {cardTheme === 'solid' && (
                                <input
                                    type="color"
                                    value={customBgColor}
                                    onChange={(e) => setCustomBgColor(e.target.value)}
                                    className="w-7 h-7 rounded-full border border-white/20 cursor-pointer bg-transparent shrink-0"
                                    title="Pick solid color"
                                />
                            )}
                        </div>
                    )}

                    {activeTab === 'tracklist' && (
                        <div className="flex items-center gap-2">
                            {['auto', '1', '2'].map(c => (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => setTracklistColumns(c)}
                                    className={`px-3 py-1.5 rounded-full border text-xs whitespace-nowrap ${
                                        tracklistColumns === c ? 'bg-white text-black font-bold' : 'bg-white/5 text-white/70 border-white/10'
                                    }`}
                                >
                                    {c === 'auto' ? 'Auto Columns' : `${c} Col`}
                                </button>
                            ))}
                            <button
                                type="button"
                                onClick={() => setShowTrackDurations(!showTrackDurations)}
                                className={`px-3 py-1.5 rounded-full border text-xs whitespace-nowrap ${
                                    showTrackDurations ? 'bg-[var(--theme-accent,#E8A87C)] text-black font-bold' : 'bg-white/5 text-white/70 border-white/10'
                                }`}
                            >
                                Durations {showTrackDurations ? '✓' : ''}
                            </button>
                        </div>
                    )}

                    {activeTab === 'annotation' && (
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setShowAnnotation(!showAnnotation)}
                                className={`px-3 py-1.5 rounded-full border text-xs shrink-0 transition cursor-pointer ${
                                    showAnnotation ? 'bg-[var(--theme-accent,#E8A87C)] text-[#17020B] font-bold' : 'bg-white/5 text-white/70 border-white/10'
                                }`}
                            >
                                Annotation {showAnnotation ? 'ON' : 'OFF'}
                            </button>
                            {showAnnotation && (
                                <>
                                    {['handwritten', 'typewriter', 'pill', 'quote'].map(st => (
                                        <button
                                            key={st}
                                            type="button"
                                            onClick={() => setAnnotationStyle(st)}
                                            className={`px-2.5 py-1.5 rounded-full border text-[11px] capitalize shrink-0 ${
                                                annotationStyle === st ? 'bg-white text-black font-bold' : 'bg-white/5 text-white/70 border-white/10'
                                            }`}
                                        >
                                            {st}
                                        </button>
                                    ))}
                                </>
                            )}
                        </div>
                    )}

                    {activeTab === 'layout' && (
                        <div className="flex items-center gap-2">
                            {['left', 'center', 'right'].map(al => (
                                <button
                                    key={al}
                                    type="button"
                                    onClick={() => setTextAlign(al)}
                                    className={`px-3 py-1.5 rounded-full border text-xs capitalize shrink-0 ${
                                        textAlign === al ? 'bg-white text-black font-bold shadow' : 'bg-white/5 text-white/70 border-white/10'
                                    }`}
                                >
                                    {al}
                                </button>
                            ))}
                            <button
                                type="button"
                                onClick={() => setTitlePlacement(titlePlacement === 'bottom' ? 'top' : 'bottom')}
                                className="px-3 py-1.5 rounded-full border text-xs shrink-0 bg-white/5 text-white/70 border-white/10"
                            >
                                Title: {titlePlacement === 'bottom' ? 'Below Art' : 'Above Art'}
                            </button>
                        </div>
                    )}
                </div>

                {/* Mobile Bottom Photo Editor Category Selector */}
                <div className="flex justify-around items-center px-1 py-2">
                    {[
                        { id: 'designs', label: 'Designs', icon: <Layers size={16} /> },
                        { id: 'formats', label: 'Formats', icon: <Maximize2 size={16} /> },
                        { id: 'elements', label: 'Elements', icon: <Sliders size={16} /> },
                        { id: 'colors', label: 'Colors', icon: <Palette size={16} /> },
                        { id: 'tracklist', label: 'Tracks', icon: <ListMusic size={16} /> },
                        { id: 'annotation', label: 'Note', icon: <MessageSquare size={16} /> },
                        { id: 'layout', label: 'Layout', icon: <AlignLeft size={16} /> },
                    ].map((tab) => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-all cursor-pointer ${
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
