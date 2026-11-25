// src/Components/LandingPage.jsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Star,
  Disc,
  Disc3,
  Sparkles,
  ArrowRight,
  Share2,
  ListOrdered,
  Award,
  Layers,
  Heart,
  Headphones,
  CheckCircle2,
  Calendar,
  Flame,
  Radio,
  Sliders,
  ExternalLink,
  Shield,
  Check,
} from "lucide-react";
import UserProfileBadge, { NOISE_GRAIN_BG } from "./UserProfileBadge";

export default function LandingPage({ onExplore }) {
  const [activeTab, setActiveTab] = useState("diary"); // 'diary' | 'editions' | 'groovecard' | 'critics'

  return (
    <div className="w-full min-h-screen bg-[var(--theme-bg)] text-[var(--theme-fg)] font-sans overflow-x-hidden selection:bg-amber-400 selection:text-zinc-950">
      {/* TOP NAVIGATION BAR */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-[var(--theme-bg)]/80 border-b border-[var(--theme-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-black/40 border border-amber-400/30 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <img src="/in.svg" alt="GrooveEstrella" className="w-6 h-6 object-contain" />
            </div>
            <div>
              <span className="text-lg sm:text-xl font-black tracking-tight font-display text-[var(--theme-fg)]">
                GrooveEstrella
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full bg-amber-400/15 text-amber-300 border border-amber-400/30">
                Music Sanctuary
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold text-[var(--theme-fg)] hover:text-amber-300 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 text-zinc-950 font-black text-xs sm:text-sm tracking-wide hover:scale-105 active:scale-95 transition-all shadow-lg shadow-amber-400/20 flex items-center gap-1.5 cursor-pointer"
            >
              <span>Get Started</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative pt-12 pb-20 sm:pt-20 sm:pb-32 overflow-hidden">
        {/* Ambient Backdrops */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-amber-500/15 via-rose-500/10 to-purple-600/15 rounded-full filter blur-[120px] pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          {/* Tag Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/25 text-amber-300 text-xs font-black uppercase tracking-widest shadow-sm">
            <Sparkles size={14} className="animate-spin-slow" />
            <span>The Letterboxd for Music Lovers</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-[var(--theme-fg)] font-display tracking-tight max-w-4xl mx-auto leading-[1.08]">
            Your Life in Music. <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-amber-400 via-amber-200 to-amber-500 bg-clip-text text-transparent">
              Logged, Rated & Remembered.
            </span>
          </h1>

          {/* Subhead */}
          <p className="text-base sm:text-lg md:text-xl text-[var(--theme-muted)] max-w-2xl mx-auto leading-relaxed">
            Track every album you spin in a personal music diary, dive into deep MusicBrainz collector pressings, share retro GrooveCards, and earn your verified critic badge.
          </p>

          {/* Hero CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/signup"
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 text-zinc-950 font-black text-sm sm:text-base tracking-wide hover:scale-105 active:scale-95 transition-all shadow-xl shadow-amber-400/25 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Start Your Free Music Journal</span>
              <ArrowRight size={18} />
            </Link>
            {onExplore ? (
              <button
                type="button"
                onClick={onExplore}
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-[var(--theme-surface)] hover:bg-[var(--theme-card)] border border-[var(--theme-border)] hover:border-amber-400/50 text-sm sm:text-base font-bold text-[var(--theme-fg)] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <span>Explore as Guest</span>
                <ArrowRight size={16} />
              </button>
            ) : (
              <Link
                href="/?explore=true"
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-[var(--theme-surface)] hover:bg-[var(--theme-card)] border border-[var(--theme-border)] hover:border-amber-400/50 text-sm sm:text-base font-bold text-[var(--theme-fg)] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <span>Explore as Guest</span>
                <ArrowRight size={16} />
              </Link>
            )}
            <Link
              href="/search"
              className="w-full sm:w-auto px-6 py-4 rounded-full text-xs sm:text-sm font-semibold text-[var(--theme-muted)] hover:text-[var(--theme-fg)] transition-all flex items-center justify-center gap-1.5"
            >
              <span>Search catalog</span>
            </Link>
          </div>

          {/* Interactive Feature Visual Preview Mockup */}
          <div className="pt-12 sm:pt-16 max-w-5xl mx-auto">
            <div className="relative rounded-3xl bg-zinc-950/80 border border-amber-400/25 shadow-2xl overflow-hidden p-6 sm:p-10 text-left">
              {/* Glow overlay */}
              <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent pointer-events-none" />

              <div className="flex items-center justify-between pb-6 border-b border-zinc-800 flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-300">
                    <BookOpen size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white font-display">
                      Music Listening Diary Preview
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Organized by Year, Month, and Date with ambient cover artwork radiance
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                    2026 Archive
                  </span>
                </div>
              </div>

              {/* Sample Diary Entry Row */}
              <div className="py-6 space-y-4">
                <div className="flex items-center justify-between text-xs text-zinc-400 font-bold uppercase tracking-wider pb-2 border-b border-zinc-800/60">
                  <span>November 2026 · 14 Albums Logged</span>
                  <span>Score & Review</span>
                </div>

                <div className="relative rounded-2xl overflow-hidden p-4 bg-zinc-900/60 border border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  {/* Album artwork glow backdrop */}
                  <div
                    className="absolute -left-10 top-0 bottom-0 w-48 opacity-25 filter blur-2xl pointer-events-none"
                    style={{
                      backgroundImage:
                        "radial-gradient(circle, rgba(234, 179, 8, 0.4) 0%, transparent 70%)",
                    }}
                  />

                  <div className="flex items-center gap-4 relative z-10">
                    <div className="text-center font-mono w-10 shrink-0">
                      <div className="text-2xl font-black text-amber-400">14</div>
                      <div className="text-[10px] text-zinc-500 uppercase font-bold">Sat</div>
                    </div>
                    <img
                      src="https://coverartarchive.org/release-group/f5093c06-23e3-404f-aeaa-40f72885ee3a/front-500"
                      alt="The Dark Side of the Moon"
                      className="w-14 h-14 rounded-xl object-cover shadow-lg border border-white/10 shrink-0"
                    />
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <span>The Dark Side of the Moon</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-400 font-normal">
                          1973
                        </span>
                      </h4>
                      <p className="text-xs text-zinc-400">Pink Floyd</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 relative z-10 self-end sm:self-auto">
                    <div className="flex items-center gap-1 text-amber-400">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star key={i} size={15} className="fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <span className="text-xs font-black text-amber-300 px-2.5 py-1 rounded-full bg-amber-400/15 border border-amber-400/30">
                      10.0 / 10
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4 CORE VALUE PILLARS */}
      <section className="py-20 border-t border-[var(--theme-border)] bg-[var(--theme-surface)]/40 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-black text-[var(--theme-fg)] font-display tracking-tight">
              Built for Those Who Truly Listen
            </h2>
            <p className="text-sm sm:text-base text-[var(--theme-muted)]">
              No generic feeds or noisy algorithmic chaos. GrooveEstrella is an editorial haven designed around albums, intentional listening, and critical discourse.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Pillar 1 */}
            <div className="p-6 rounded-3xl bg-[var(--theme-card)]/70 border border-[var(--theme-border)] space-y-4 hover:border-amber-400/40 transition-colors shadow-md">
              <div className="w-12 h-12 rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400">
                <BookOpen size={24} />
              </div>
              <h3 className="text-lg font-black text-[var(--theme-fg)] font-display">
                Letterboxd for Music
              </h3>
              <p className="text-xs sm:text-sm text-[var(--theme-muted)] leading-relaxed">
                Log albums as you listen. Rate with stars or decimal scores, record your mood, write reviews, and watch your monthly listening stats unfold.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="p-6 rounded-3xl bg-[var(--theme-card)]/70 border border-[var(--theme-border)] space-y-4 hover:border-amber-400/40 transition-colors shadow-md">
              <div className="w-12 h-12 rounded-2xl bg-purple-400/10 border border-purple-400/20 flex items-center justify-center text-purple-400">
                <Disc size={24} />
              </div>
              <h3 className="text-lg font-black text-[var(--theme-fg)] font-display">
                Deep Pressings & Editions
              </h3>
              <p className="text-xs sm:text-sm text-[var(--theme-muted)] leading-relaxed">
                MusicBrainz integration organizes full discographies into an intuitive tree: Master releases, Collector's Editions, vinyl remasters, and regional pressings.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="p-6 rounded-3xl bg-[var(--theme-card)]/70 border border-[var(--theme-border)] space-y-4 hover:border-amber-400/40 transition-colors shadow-md">
              <div className="w-12 h-12 rounded-2xl bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center text-emerald-400">
                <Share2 size={24} />
              </div>
              <h3 className="text-lg font-black text-[var(--theme-fg)] font-display">
                Retro GrooveCards
              </h3>
              <p className="text-xs sm:text-sm text-[var(--theme-muted)] leading-relaxed">
                Generate collectible vinyl-sleeve GrooveCards with live audio snippets, holographic stickers, and smart streaming links for any platform.
              </p>
            </div>

            {/* Pillar 4 */}
            <div className="p-6 rounded-3xl bg-[var(--theme-card)]/70 border border-[var(--theme-border)] space-y-4 hover:border-amber-400/40 transition-colors shadow-md">
              <div className="w-12 h-12 rounded-2xl bg-rose-400/10 border border-rose-400/20 flex items-center justify-center text-rose-400">
                <Award size={24} />
              </div>
              <h3 className="text-lg font-black text-[var(--theme-fg)] font-display">
                Critic Badges & Identity
              </h3>
              <p className="text-xs sm:text-sm text-[var(--theme-muted)] leading-relaxed">
                Earn the Textured Gold Critic Disc, Verified Disc, or Glowing Red Admin badge. Your badge customizes your entire profile theme and styling.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* COMMUNITY BADGES SHOWCASE */}
      <section className="py-20 border-t border-[var(--theme-border)] relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <span className="text-xs font-black uppercase tracking-widest text-amber-400">
              Identity & Reputation
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-[var(--theme-fg)] font-display tracking-tight">
              Wear Your Sonic Credentials
            </h2>
            <p className="text-xs sm:text-sm text-[var(--theme-muted)]">
              GrooveEstrella profiles reflect your dedication to the craft with distinct visual badges.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {/* Critic Badge */}
            <div className="p-6 rounded-3xl bg-gradient-to-b from-amber-950/40 via-zinc-900 to-black border border-amber-500/40 text-center space-y-4 relative overflow-hidden shadow-xl">
              <div className="w-16 h-16 rounded-2xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300 mx-auto shadow-inner">
                <Disc3 size={32} />
              </div>
              <div>
                <UserProfileBadge badge="critic" size="md" />
                <h4 className="text-base font-bold text-white mt-3">Critic Badge</h4>
                <p className="text-xs text-amber-200/70 mt-1 leading-relaxed">
                  Deep textured gold background with film grain and golden vinyl disc. Awarded to passionate music reviewers.
                </p>
              </div>
            </div>

            {/* Verified Badge */}
            <div className="p-6 rounded-3xl bg-gradient-to-b from-blue-950/30 via-zinc-900 to-black border border-blue-500/30 text-center space-y-4 relative overflow-hidden shadow-xl">
              <div className="w-16 h-16 rounded-2xl bg-blue-400/20 border border-blue-400/30 flex items-center justify-center text-blue-300 mx-auto shadow-inner">
                <CheckCircle2 size={32} />
              </div>
              <div>
                <UserProfileBadge badge="verified" size="md" />
                <h4 className="text-base font-bold text-white mt-3">Verified Disc Badge</h4>
                <p className="text-xs text-blue-200/70 mt-1 leading-relaxed">
                  Authentic GrooveEstrella vinyl insignia for verified artists, publications, and recognized tastemakers.
                </p>
              </div>
            </div>

            {/* Admin Badge */}
            <div className="p-6 rounded-3xl bg-gradient-to-b from-red-950/30 via-zinc-900 to-black border border-red-500/40 text-center space-y-4 relative overflow-hidden shadow-xl">
              <div className="w-16 h-16 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 mx-auto shadow-inner">
                <Shield size={32} />
              </div>
              <div>
                <UserProfileBadge badge="admin" size="md" />
                <h4 className="text-base font-bold text-white mt-3">Admin Badge</h4>
                <p className="text-xs text-red-200/70 mt-1 leading-relaxed">
                  Glowing red insignia representing the platform curating team and system stewards.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CALL TO ACTION */}
      <section className="py-24 border-t border-[var(--theme-border)] bg-gradient-to-b from-transparent via-amber-500/5 to-transparent text-center relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center text-zinc-950 mx-auto shadow-xl shadow-amber-400/25">
            <Disc size={36} className="animate-spin-slow" />
          </div>

          <div className="space-y-3">
            <h2 className="text-3xl sm:text-5xl font-black text-[var(--theme-fg)] font-display tracking-tight">
              Begin Your Musical Diary Today
            </h2>
            <p className="text-sm sm:text-base text-[var(--theme-muted)] max-w-xl mx-auto leading-relaxed">
              Log albums, curate lists, write reviews, and build an immortal record of the music that soundtracked your life.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="w-full sm:w-auto px-9 py-4 rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 text-zinc-950 font-black text-base hover:scale-105 active:scale-95 transition-all shadow-xl shadow-amber-400/25 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Create Free Account</span>
              <ArrowRight size={18} />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-[var(--theme-surface)] hover:bg-[var(--theme-card)] border border-[var(--theme-border)] text-sm font-bold text-[var(--theme-fg)] transition-all"
            >
              <span>Already a member? Sign In</span>
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[var(--theme-border)] py-10 bg-[var(--theme-bg)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--theme-muted)]">
          <div className="flex items-center gap-2">
            <img src="/in.svg" alt="" className="w-5 h-5 object-contain" />
            <span className="font-bold text-[var(--theme-fg)]">GrooveEstrella</span>
            <span>· The Music Collector & Journal Platform</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            <Link href="/terms" className="hover:text-[var(--theme-fg)] transition">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-[var(--theme-fg)] transition">
              Privacy
            </Link>
            <Link href="/guidelines" className="hover:text-[var(--theme-fg)] transition">
              Guidelines
            </Link>
            <Link href="/login" className="hover:text-[var(--theme-fg)] transition">
              Sign In
            </Link>
            <Link href="/signup" className="hover:text-[var(--theme-fg)] transition">
              Create Account
            </Link>
            <Link href="/feedback" className="hover:text-[var(--theme-fg)] transition">
              Feedback
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
