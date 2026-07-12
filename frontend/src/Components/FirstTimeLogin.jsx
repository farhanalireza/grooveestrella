// src/Components/FirstTimeLogin.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    User, 
    Music2, 
    ArrowRight, 
    ArrowLeft, 
    Sparkles, 
    Info, 
    Compass, 
    Share2, 
    Bookmark 
} from 'lucide-react';

const FirstTimeLogin = ({ onSubmit }) => {
    const [step, setStep] = useState(1);
    const [name, setName] = useState('');
    const [selectedGenres, setSelectedGenres] = useState([]);
    const [direction, setDirection] = useState(1);

    const genresList = [
        "Pop", "Hip Hop", "Electronic", "Rock", "R & B",
        "K-Pop", "Jazz", "Classical", "Blues", "Country"
    ];

    const toggleGenre = (genre) => {
        if (selectedGenres.includes(genre)) {
            setSelectedGenres(selectedGenres.filter(g => g !== genre));
        } else {
            setSelectedGenres([...selectedGenres, genre]);
        }
    };

    const handleNext = () => {
        setDirection(1);
        setStep(prev => Math.min(prev + 1, 3));
    };

    const handleBack = () => {
        setDirection(-1);
        setStep(prev => Math.max(prev - 1, 1));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const userName = name.trim() === "" ? "User" : name;
        
        // Save to localStorage
        localStorage.setItem('userName', userName);
        localStorage.setItem('favoriteGenres', JSON.stringify(selectedGenres));

        // Call the parent app callback for dynamic layout transition
        if (onSubmit) {
            onSubmit(userName);
        }
    };

    // Animation settings
    const slideVariants = {
        enter: (dir) => ({
            x: dir > 0 ? 50 : -50,
            opacity: 0
        }),
        center: {
            x: 0,
            opacity: 1
        },
        exit: (dir) => ({
            x: dir < 0 ? 50 : -50,
            opacity: 0
        })
    };

    return (
        <div className="relative w-full max-w-lg bg-zinc-900/40 border border-white/5 backdrop-blur-xl rounded-3xl p-6 sm:p-8 text-white shadow-2xl flex flex-col overflow-hidden min-h-[480px]">
            {/* Blurry Backdrop Glow */}
            <div className="absolute top-0 left-0 w-40 h-40 bg-emerald-500/10 rounded-full filter blur-[80px] pointer-events-none z-0" />
            <div className="absolute bottom-0 right-0 w-40 h-40 bg-teal-500/10 rounded-full filter blur-[80px] pointer-events-none z-0" />

            {/* Step Indicators */}
            <div className="flex justify-between items-center mb-8 relative z-10">
                <div className="flex gap-2 w-full">
                    {[1, 2, 3].map((num) => (
                        <div 
                            key={num}
                            className={`h-1.5 rounded-full transition-all duration-300 w-1/3 ${
                                step >= num ? 'bg-emerald-500' : 'bg-white/10'
                            }`}
                        />
                    ))}
                </div>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 flex flex-col relative z-10">
                <AnimatePresence mode="wait" custom={direction}>
                    {/* Step 1: Profile Customization */}
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            custom={direction}
                            variants={slideVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ duration: 0.2, ease: "easeInOut" }}
                            className="flex-grow flex flex-col justify-between"
                        >
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2">
                                        Welcome <Sparkles className="text-emerald-400 animate-pulse" size={24} />
                                    </h1>
                                    <p className="text-sm text-zinc-400">
                                        Let's get started. Enter your name to personalize your GrooveEstrella dashboard.
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-xs uppercase tracking-wider text-zinc-400 font-bold block">
                                        What should we call you?
                                    </label>
                                    <div className="relative flex items-center">
                                        <User className="absolute left-4 text-zinc-500" size={18} />
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="Enter your name (optional)"
                                            className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/5 focus:border-emerald-500/30 rounded-2xl text-white outline-none focus:ring-1 focus:ring-emerald-500/30 transition font-medium placeholder-zinc-600"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 p-4 bg-white/5 rounded-2xl border border-white/5">
                                    <Info className="text-emerald-400 flex-shrink-0 mt-0.5" size={16} />
                                    <p className="text-xs text-zinc-400 leading-relaxed">
                                        Your name is only used for interface greetings. It is saved directly to your device and is never shared.
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={handleNext}
                                className="mt-8 py-3 w-full bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-black font-extrabold rounded-2xl flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-500/10 cursor-pointer"
                            >
                                <span>Continue</span>
                                <ArrowRight size={18} />
                            </button>
                        </motion.div>
                    )}

                    {/* Step 2: Music Taste Selection */}
                    {step === 2 && (
                        <motion.div
                            key="step2"
                            custom={direction}
                            variants={slideVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ duration: 0.2, ease: "easeInOut" }}
                            className="flex-grow flex flex-col justify-between"
                        >
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                                        Your Taste
                                    </h1>
                                    <p className="text-sm text-zinc-400">
                                        Select your favorite genres. We'll use these to prioritize recommendations.
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1 no-scrollbar">
                                    {genresList.map((genre) => {
                                        const isSelected = selectedGenres.includes(genre);
                                        return (
                                            <button
                                                key={genre}
                                                type="button"
                                                onClick={() => toggleGenre(genre)}
                                                className={`p-3 rounded-2xl border text-sm font-semibold transition flex items-center gap-2 cursor-pointer ${
                                                    isSelected 
                                                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-md' 
                                                        : 'bg-white/5 border-white/5 text-zinc-300 hover:bg-white/10 hover:border-white/10'
                                                }`}
                                            >
                                                <Music2 size={14} className={isSelected ? 'text-emerald-400' : 'text-zinc-500'} />
                                                <span>{genre}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="flex gap-3 mt-8">
                                <button
                                    type="button"
                                    onClick={handleBack}
                                    className="py-3 px-5 bg-white/5 hover:bg-white/10 active:scale-95 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition border border-white/5 cursor-pointer"
                                >
                                    <ArrowLeft size={18} />
                                </button>
                                <button
                                    type="button"
                                    onClick={handleNext}
                                    className="py-3 flex-1 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-black font-extrabold rounded-2xl flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-500/10 cursor-pointer"
                                >
                                    <span>Continue</span>
                                    <ArrowRight size={18} />
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* Step 3: Tour & Finish */}
                    {step === 3 && (
                        <motion.div
                            key="step3"
                            custom={direction}
                            variants={slideVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ duration: 0.2, ease: "easeInOut" }}
                            className="flex-grow flex flex-col justify-between"
                        >
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                                        Quick Tour
                                    </h1>
                                    <p className="text-sm text-zinc-400">
                                        Welcome to your new music sharing hub.
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-start gap-4">
                                        <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400">
                                            <Compass size={20} />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-white mb-0.5">Smart Music Discovery</h3>
                                            <p className="text-xs text-zinc-400 leading-relaxed">
                                                Search and discover albums, artists, and playlists. Talk to the mood chatbot for tailored suggestions.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4">
                                        <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400">
                                            <Share2 size={20} />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-white mb-0.5">High-Res Share Cards & QR Codes</h3>
                                            <p className="text-xs text-zinc-400 leading-relaxed">
                                                Share music cards on social media, customize themes, and let friends scan QR codes to discover with you.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4">
                                        <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400">
                                            <Bookmark size={20} />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-white mb-0.5">Local Music Library</h3>
                                            <p className="text-xs text-zinc-400 leading-relaxed">
                                                Bookmark your favorite discoveries to save them directly to your local library.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-8">
                                <button
                                    type="button"
                                    onClick={handleBack}
                                    className="py-3 px-5 bg-white/5 hover:bg-white/10 active:scale-95 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition border border-white/5 cursor-pointer"
                                >
                                    <ArrowLeft size={18} />
                                </button>
                                <button
                                    type="submit"
                                    className="py-3 flex-1 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-black font-extrabold rounded-2xl flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-500/10 cursor-pointer"
                                >
                                    <span>Get Started</span>
                                    <Sparkles size={18} />
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </form>
        </div>
    );
};

export default FirstTimeLogin;
