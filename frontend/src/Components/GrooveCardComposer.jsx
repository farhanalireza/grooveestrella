// src/Components/GrooveCardComposer.jsx
import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, 
    Download, 
    Share2 
} from 'lucide-react';
import { toPng } from 'html-to-image';
import { createPortal } from 'react-dom';
import { toast } from '@/lib/toast';

export default function GrooveCardComposer({
    isOpen,
    onClose,
    itemId,
    title,
    artist,
    imageUrl,
    popularity,
    explicit,
    type = "track", // track, album, artist, playlist
    platform = "musicbrainz",
    releaseDate, // accurate date string e.g. "1975-10-31" or "1975"
    releaseYear: propReleaseYear,
    album,
    genres = [],
}) {
    const cardRef = useRef(null);
    const [isGenerating, setIsGenerating] = useState(false);
    
    // Customization states
    const [cardTheme, setCardTheme] = useState('obsidian');
    const [qrColor, setQrColor] = useState('000000'); // Default black foreground
    const [showQR, setShowQR] = useState(true);
    const [qrFullScreen, setQrFullScreen] = useState(false);
    const [showYear, setShowYear] = useState(true);

    // Compute accurate release date / year
    const displayReleaseDate = React.useMemo(() => {
        if (releaseDate) {
            const raw = String(releaseDate).trim();
            if (/^\d{4}$/.test(raw)) return raw;
            const parsed = new Date(raw);
            if (!isNaN(parsed.getTime())) {
                try {
                    return parsed.toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        timeZone: "UTC"
                    });
                } catch (_) {
                    return raw;
                }
            }
            return raw;
        }
        if (propReleaseYear) return String(propReleaseYear);
        return null;
    }, [releaseDate, propReleaseYear]);

    // Generate clean share url based on current site host
    const shareUrl = typeof window !== "undefined" 
        ? `${window.location.origin}/${type || 'track'}/${itemId}?groovelink=true`
        : '';

    const themes = {
        obsidian: {
            label: 'Obsidian Dusk',
            class: 'bg-black border-zinc-800/80 shadow-[0_0_50px_rgba(0,0,0,0.8)]'
        },
        cosmic: {
            label: 'Cosmic Purple',
            class: 'bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 border-purple-500/20 shadow-[0_0_50px_rgba(147,51,234,0.15)]'
        },
        ocean: {
            label: 'Ocean Blue',
            class: 'bg-gradient-to-br from-slate-950 via-cyan-950 to-blue-950 border-cyan-500/20 shadow-[0_0_50px_rgba(6,182,212,0.15)]'
        },
        sunset: {
            label: 'Sunset Rose',
            class: 'bg-gradient-to-br from-stone-950 via-rose-950 to-red-950 border-rose-500/20 shadow-[0_0_50px_rgba(244,63,94,0.15)]'
        }
    };

    const qrColors = [
        { label: 'Black', hex: '000000', class: 'bg-black border-white/20' },
        { label: 'Purple', hex: '9333ea', class: 'bg-purple-600 border-transparent' },
        { label: 'Emerald', hex: '10b981', class: 'bg-emerald-500 border-transparent' },
        { label: 'Cyan', hex: '06b6d4', class: 'bg-cyan-500 border-transparent' },
        { label: 'Rose', hex: 'ec4899', class: 'bg-rose-500 border-transparent' },
        { label: 'Amber', hex: 'f59e0b', class: 'bg-amber-500 border-transparent' }
    ];

    const qrApi = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(shareUrl)}&color=${qrColor}&bgcolor=ffffff&ecc=H&format=png`;

    // Generate high-resolution card PNG representation
    const generateCardImage = async () => {
        if (!cardRef.current) return null;
        const disabledSheets = [];
        try {
            // Temporarily disable cross-origin stylesheets that trigger SecurityError
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
                pixelRatio: 3, // Premium quality printing
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

    // Share Card specifically as an image file (Web Share API) or download fallback
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

            // Fallback for devices without file sharing support: download the card image directly
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

    // Download Card strictly as PNG image file
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

    // Prevent backdrop scroll
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen || typeof window === "undefined") return null;

    const artistLabel = Array.isArray(artist) 
        ? artist.map(a => a.name).join(', ') 
        : artist;

    return createPortal(
        <AnimatePresence>
            <motion.div 
                key="share-modal-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[600] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md overflow-hidden"
            >
                {/* Backdrop Click to Close */}
                <div className="absolute inset-0 cursor-default" onClick={onClose} />

                {/* Modal Container */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 240 }}
                    className="relative w-full max-w-4xl h-[88dvh] sm:h-auto max-h-[88dvh] sm:max-h-[86vh] bg-[var(--theme-card)] border border-[var(--theme-border)] text-[var(--theme-fg)] backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl z-10 flex flex-col overflow-hidden"
                >
                    {/* Pinned Modal Header */}
                    <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 border-b border-[var(--theme-border)] bg-[var(--theme-surface)]/80 backdrop-blur-md shrink-0 z-20">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-[var(--theme-card)] border border-[var(--theme-border)] flex items-center justify-center p-1.5 shadow-sm">
                                <img src="/in.svg" alt="Groove" className="w-full h-full object-contain" />
                            </div>
                            <div>
                                <h2 className="text-sm sm:text-base font-extrabold text-[var(--theme-fg)] tracking-tight font-display">
                                    GrooveCard Composer
                                </h2>
                                <p className="text-[11px] sm:text-xs text-[var(--theme-muted)] hidden xs:block">
                                    Personalize and export your music card
                                </p>
                            </div>
                        </div>
                        <button 
                            onClick={onClose} 
                            className="p-1.5 sm:p-2 rounded-full bg-[var(--theme-surface)] hover:bg-[var(--theme-card)] text-[var(--theme-muted)] hover:text-[var(--theme-fg)] border border-[var(--theme-border)] transition-all shadow-sm cursor-pointer"
                            aria-label="Close modal"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Scrollable Modal Body: 2-column grid on desktop, smooth stacked scroll on mobile */}
                    <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[var(--theme-border)] min-h-0">
                        {/* Column 1: Live GrooveCard Card Preview */}
                        <div className="flex flex-col items-center justify-center p-3 sm:p-6 md:p-8 bg-[var(--theme-surface)]/30">
                            <div className="text-[10px] sm:text-xs uppercase tracking-widest text-[var(--theme-accent)] font-bold mb-2 sm:mb-4">
                                Live Card Preview
                            </div>

                            {/* Capture Container */}
                            <div 
                                ref={cardRef} 
                                className={`w-full max-w-[210px] xs:max-w-[230px] sm:max-w-[320px] rounded-2xl sm:rounded-3xl p-3 sm:p-6 flex flex-col justify-between min-h-[290px] xs:min-h-[320px] sm:min-h-[480px] select-none text-[#F4F7FF] ${themes[cardTheme].class} border border-white/10 transition-all duration-500 shadow-xl`}
                            >
                                {/* Card Header: Type Badge */}
                                <div className="w-full flex justify-between items-center mb-2.5 sm:mb-4">
                                    <div className="flex items-center gap-1.5">
                                        <img src="/in.svg" alt="Groove" className="w-3.5 h-3.5 object-contain shrink-0" crossOrigin="anonymous" />
                                        <span className="text-[9px] sm:text-[10px] tracking-[0.2em] font-extrabold uppercase text-[#8992A5]">GrooveCard</span>
                                    </div>
                                    <span className="text-[8px] sm:text-[9px] font-bold px-1.5 sm:px-2 py-0.5 rounded bg-white/5 border border-white/10 text-white/90">
                                        MUSIC LAYER
                                    </span>
                                </div>

                                {/* Cover Art Image */}
                                <div className="relative w-full aspect-square rounded-xl sm:rounded-2xl overflow-hidden shadow-xl mb-2.5 sm:mb-4 border border-white/5 bg-[var(--theme-surface)]">
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

                                {/* Music Details - Full titles & artist names, NO truncation */}
                                <div className="flex justify-between items-start gap-2 sm:gap-3 text-left">
                                    <div className="flex-1 min-w-0 pr-1">
                                        <h4 className="text-xs sm:text-base font-bold leading-snug font-display text-white break-words" title={title}>
                                            {title}
                                        </h4>
                                        <p className="text-[10px] sm:text-xs text-[#8992A5] font-medium font-body mt-0.5 sm:mt-1 break-words" title={artistLabel}>
                                            {artistLabel}
                                        </p>
                                        {album && type === 'track' && album !== title && (
                                            <p className="text-[9px] sm:text-[11px] text-[#8992A5]/70 font-normal italic mt-0.5 break-words">
                                                Album: {album}
                                            </p>
                                        )}
                                        
                                        {/* Accurate Release Date Badge */}
                                        {showYear && displayReleaseDate && (
                                            <div className="inline-flex items-center gap-1 text-[8px] sm:text-[9px] text-[#8992A5] px-1.5 sm:px-2 py-0.5 rounded bg-white/5 border border-white/10 mt-1 sm:mt-2">
                                                <span>{displayReleaseDate}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* QR Code Container */}
                                    {showQR && (
                                        <div 
                                            onClick={() => setQrFullScreen(true)}
                                            className="relative w-16 h-16 sm:w-24 sm:h-24 bg-white p-1 rounded-lg shadow-md flex items-center justify-center shrink-0 border border-white/10 cursor-zoom-in group/qr transition duration-300 hover:scale-[1.03]"
                                            title="Click to full screen QR"
                                        >
                                            <img
                                                src={qrApi}
                                                alt="QR"
                                                className="w-full h-full object-contain"
                                                crossOrigin="anonymous"
                                            />
                                            {/* Centered Logo Overlay */}
                                            <div className="absolute w-4.5 h-4.5 sm:w-6.5 sm:h-6.5 bg-white border border-gray-100 rounded-full flex items-center justify-center shadow p-0.5 pointer-events-none">
                                                <img src="/in.svg" alt="Groove Logo" className="w-full h-full object-contain" crossOrigin="anonymous" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Column 2: Customizer and Actions */}
                        <div className="flex flex-col justify-between p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-5 pb-24 md:pb-8">
                            <div className="space-y-5">
                                <div className="hidden md:block">
                                    <h2 className="text-xl sm:text-2xl font-black text-[var(--theme-fg)] mb-1 font-display">Customization</h2>
                                    <p className="text-xs sm:text-sm text-[var(--theme-muted)]">Personalize theme and card elements.</p>
                                </div>

                                {/* Customizer: Themes */}
                                <div className="space-y-2">
                                    <label className="text-[11px] sm:text-xs uppercase tracking-wider text-[var(--theme-muted)] font-bold">
                                        Customize Theme
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {Object.keys(themes).map((t) => (
                                            <button
                                                key={t}
                                                onClick={() => setCardTheme(t)}
                                                className={`px-3 py-2 text-xs font-semibold rounded-lg capitalize border text-left transition-all cursor-pointer ${
                                                    cardTheme === t 
                                                        ? 'bg-[var(--theme-accent)] text-[var(--theme-bg)] border-[var(--theme-accent)]' 
                                                        : 'bg-[var(--theme-surface)] text-[var(--theme-fg)]/80 border-[var(--theme-border)] hover:bg-[var(--theme-card)]'
                                                }`}
                                            >
                                                {themes[t].label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Customizer: QR Options */}
                                <div className="space-y-4">
                                    <div className="flex flex-col gap-2">
                                        <span className="text-[11px] sm:text-xs uppercase tracking-wider text-[var(--theme-muted)] font-bold">
                                            Card Elements
                                        </span>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-2">
                                            <label className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--theme-surface)] border border-[var(--theme-border)] cursor-pointer">
                                                <span className="text-xs text-[var(--theme-fg)]/80 font-semibold">Render QR Code</span>
                                                <input 
                                                    type="checkbox" 
                                                    checked={showQR}
                                                    onChange={(e) => setShowQR(e.target.checked)}
                                                    className="accent-[var(--theme-accent)] cursor-pointer"
                                                />
                                            </label>
                                            <label className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--theme-surface)] border border-[var(--theme-border)] cursor-pointer">
                                                <span className="text-xs text-[var(--theme-fg)]/80 font-semibold">Render Release Date</span>
                                                <input 
                                                    type="checkbox" 
                                                    checked={showYear}
                                                    onChange={(e) => setShowYear(e.target.checked)}
                                                    className="accent-[var(--theme-accent)] cursor-pointer"
                                                />
                                            </label>
                                        </div>
                                    </div>

                                    {showQR && (
                                        <div className="space-y-2">
                                            <label className="text-[11px] sm:text-xs uppercase tracking-wider text-[var(--theme-muted)] font-bold">
                                                QR Forecolor
                                            </label>
                                            <div className="flex flex-wrap gap-2">
                                                {qrColors.map((color) => (
                                                    <button
                                                        key={color.hex}
                                                        onClick={() => setQrColor(color.hex)}
                                                        className={`w-7 h-7 rounded-full border transition-all flex items-center justify-center cursor-pointer ${color.class} ${
                                                            qrColor === color.hex 
                                                                ? 'border-white scale-110 shadow-lg ring-2 ring-[var(--theme-accent)]/50' 
                                                                : 'scale-100 hover:scale-105'
                                                        }`}
                                                        title={color.label}
                                                    >
                                                        {qrColor === color.hex && (
                                                            <div className={`w-1.5 h-1.5 rounded-full ${color.hex === 'ffffff' ? 'bg-black' : 'bg-white'}`} />
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Actions Area (Desktop) */}
                            <div className="hidden md:block space-y-4 pt-2">
                                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                                    <button
                                        onClick={handleShareCard}
                                        disabled={isGenerating}
                                        className="flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 px-3 sm:px-4 bg-[var(--theme-accent)] hover:opacity-90 active:scale-95 text-[var(--theme-bg)] font-bold rounded-xl sm:rounded-2xl transition-all shadow-lg disabled:opacity-50 text-xs sm:text-sm cursor-pointer"
                                    >
                                        <Share2 size={15} />
                                        <span>{isGenerating ? 'Exporting...' : 'Share Card'}</span>
                                    </button>

                                    <button
                                        onClick={handleDownloadCard}
                                        disabled={isGenerating}
                                        className="flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 px-3 sm:px-4 bg-[var(--theme-surface)] hover:bg-[var(--theme-card)] active:scale-95 text-[var(--theme-fg)] font-bold rounded-xl sm:rounded-2xl transition-all border border-[var(--theme-border)] text-xs sm:text-sm cursor-pointer disabled:opacity-50"
                                    >
                                        <Download size={15} />
                                        <span>Download PNG</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Mobile Sticky Action Footer */}
                    <div className="md:hidden flex items-center gap-2 p-3 border-t border-[var(--theme-border)] bg-[var(--theme-surface)]/95 backdrop-blur-md shrink-0 z-20">
                        <button
                            onClick={handleShareCard}
                            disabled={isGenerating}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 bg-[var(--theme-accent)] hover:opacity-90 active:scale-95 text-[var(--theme-bg)] font-bold rounded-xl transition-all shadow-md disabled:opacity-50 text-xs cursor-pointer"
                        >
                            <Share2 size={14} />
                            <span>{isGenerating ? 'Exporting...' : 'Share Card'}</span>
                        </button>
                        <button
                            onClick={handleDownloadCard}
                            disabled={isGenerating}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 bg-[var(--theme-surface)] hover:bg-[var(--theme-card)] active:scale-95 text-[var(--theme-fg)] font-bold rounded-xl transition-all border border-[var(--theme-border)] text-xs cursor-pointer disabled:opacity-50"
                        >
                            <Download size={14} />
                            <span>Download PNG</span>
                        </button>
                    </div>
                </motion.div>
            </motion.div>

            {/* Full-screen QR Modal */}
            {qrFullScreen && (
                <div 
                    className="fixed inset-0 bg-black/90 backdrop-blur-md z-[700] flex flex-col items-center justify-center p-4 sm:p-6"
                    onClick={() => setQrFullScreen(false)}
                >
                    <div className="max-w-md w-full flex flex-col items-center gap-5 sm:gap-6" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-base sm:text-lg font-bold text-white uppercase tracking-widest font-display">Scan QR Code</h3>
                        <div className="relative w-64 h-64 sm:w-80 sm:h-80 max-w-[85vw] max-h-[85vw] p-3 sm:p-4 bg-white border border-gray-200 rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-2xl">
                            <img src={qrApi} alt="QR Code" className="w-full h-full object-contain rounded-xl" crossOrigin="anonymous" />
                            {/* Centered Logo Overlay */}
                            <div className="absolute w-12 h-12 sm:w-16 sm:h-16 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-xl p-2 sm:p-2.5">
                                <img src="/in.svg" alt="Groove Logo" className="w-full h-full object-contain" crossOrigin="anonymous" />
                            </div>
                        </div>
                        <p className="text-xs sm:text-sm text-zinc-400 text-center max-w-[280px]">
                            Scan with your phone&apos;s camera to instantly open in Groove.
                        </p>
                        <button
                            onClick={() => setQrFullScreen(false)}
                            className="px-6 py-2.5 bg-[var(--theme-accent)] hover:opacity-90 text-[var(--theme-bg)] font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}
