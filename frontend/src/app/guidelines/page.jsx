// src/app/guidelines/page.jsx
"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Users, Shield, FileText, Mail, Heart, MessageSquare, AlertTriangle, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

export default function CommunityGuidelinesPage() {
  const router = useRouter();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-[var(--theme-bg)] text-[var(--theme-fg)] font-sans pb-24">
      {/* Sticky Header */}
      <header className="bg-[var(--theme-card)]/80 backdrop-blur-md border-b border-[var(--theme-border)] px-4 sm:px-6 py-3.5 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="text-[var(--theme-muted)] hover:text-[var(--theme-fg)] transition-colors p-2 hover:bg-[var(--theme-surface)] rounded-xl cursor-pointer bg-transparent border-none"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            <h1 className="text-[var(--theme-fg)] font-bold text-base sm:text-lg font-display">
              Community Guidelines
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/terms"
            className="text-xs font-semibold text-[var(--theme-muted)] hover:text-[var(--theme-fg)] px-3 py-1.5 rounded-full hover:bg-[var(--theme-surface)] transition"
          >
            Terms of Service
          </Link>
          <Link
            href="/privacy"
            className="text-xs font-semibold text-[var(--theme-muted)] hover:text-[var(--theme-fg)] px-3 py-1.5 rounded-full hover:bg-[var(--theme-surface)] transition"
          >
            Privacy Policy
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="bg-[var(--theme-card)]/85 border border-[var(--theme-border)] backdrop-blur-xl rounded-3xl shadow-2xl p-6 sm:p-10 space-y-8">
          {/* Document Title Header */}
          <div className="text-center pb-6 border-b border-[var(--theme-border)]/50 space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-400/10 border border-emerald-400/25 text-emerald-300 text-xs font-black uppercase tracking-wider">
              <Heart size={13} />
              <span>Community Standards</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-[var(--theme-fg)] font-display tracking-tight">
              Community Guidelines
            </h1>
            <p className="text-xs sm:text-sm text-[var(--theme-muted)] font-medium">
              Last Updated: November 25, 2026
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-400/10 border border-emerald-400/20 text-xs text-emerald-200/90 leading-relaxed space-y-2">
            <p>
              GrooveEstrella is a place for people who love music to discover, journal, rate, and talk about it. These guidelines exist to keep the community useful, respectful, and focused on music.
            </p>
            <p className="font-bold text-emerald-300">
              By using the Service, you agree to follow these rules in addition to our Terms of Service.
            </p>
          </div>

          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-xl font-black text-[var(--theme-fg)] font-display flex items-center gap-2">
              <span className="text-emerald-400">1.</span> Be Respectful
            </h2>
            <p className="text-sm text-[var(--theme-muted)] leading-relaxed font-body">
              Treat other users with basic respect. Disagreements about music are normal and welcome. Personal attacks, harassment, bullying, or targeted insults are not.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-xl font-black text-[var(--theme-fg)] font-display flex items-center gap-2">
              <span className="text-emerald-400">2.</span> Keep It About the Music
            </h2>
            <p className="text-sm text-[var(--theme-muted)] leading-relaxed font-body">
              Reviews, journal entries, and comments should primarily be about the music — the songs, albums, artists, production, lyrics, performance, or your personal experience with it.
            </p>
            <p className="text-sm text-[var(--theme-muted)] leading-relaxed font-body">
              Avoid turning discussions into personal fights, political arguments, or unrelated drama.
            </p>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-xl font-black text-[var(--theme-fg)] font-display flex items-center gap-2">
              <span className="text-emerald-400">3.</span> No Hate or Discrimination
            </h2>
            <p className="text-sm text-[var(--theme-muted)] leading-relaxed font-body">
              Content that attacks or demeans people based on race, ethnicity, national origin, religion, gender, gender identity, sexual orientation, disability, or similar characteristics is not allowed.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-xl font-black text-[var(--theme-fg)] font-display flex items-center gap-2">
              <span className="text-emerald-400">4.</span> Honest Ratings and Reviews
            </h2>
            <ul className="list-disc pl-5 text-sm text-[var(--theme-muted)] space-y-1.5 font-body">
              <li>Rate and review based on your actual experience.</li>
              <li>Do not try to artificially inflate or tank ratings.</li>
              <li>Do not coordinate mass voting to manipulate scores.</li>
              <li>Fake reviews or misleading content may be removed.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-xl font-black text-[var(--theme-fg)] font-display flex items-center gap-2">
              <span className="text-emerald-400">5.</span> No Spam or Self-Promotion Abuse
            </h2>
            <p className="text-sm text-[var(--theme-muted)] leading-relaxed font-body">
              Occasional relevant mentions are fine. Repeated spam, excessive self-promotion, misleading links, or using multiple accounts to promote something is not.
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-xl font-black text-[var(--theme-fg)] font-display flex items-center gap-2">
              <span className="text-emerald-400">6.</span> Illegal and Harmful Content
            </h2>
            <p className="text-sm text-[var(--theme-muted)] leading-relaxed font-body">
              Do not post content that is illegal, encourages illegal activity, or involves the exploitation of anyone. This includes content that infringes copyright beyond fair discussion of music.
            </p>
            <p className="text-sm font-bold text-[var(--theme-fg)] bg-[var(--theme-surface)] p-3.5 rounded-xl border border-[var(--theme-border)]">
              <strong className="text-emerald-300">Note:</strong> GrooveEstrella does not host or stream music files. Only metadata, links, and written opinions are allowed.
            </p>
          </section>

          {/* Section 7 */}
          <section className="space-y-3">
            <h2 className="text-xl font-black text-[var(--theme-fg)] font-display flex items-center gap-2">
              <span className="text-emerald-400">7.</span> Public vs Private Entries
            </h2>
            <ul className="list-disc pl-5 text-sm text-[var(--theme-muted)] space-y-1.5 font-body">
              <li><strong className="text-[var(--theme-fg)]">Star ratings are always public.</strong></li>
              <li>You control whether your journal text is public or private.</li>
              <li>Once you make a journal entry public, it can appear as a review on the album, artist, or track page and on your profile.</li>
            </ul>
            <p className="text-xs text-[var(--theme-muted)] italic pt-1">
              Be mindful of what you choose to make public.
            </p>
          </section>

          {/* Section 8 */}
          <section className="space-y-3">
            <h2 className="text-xl font-black text-[var(--theme-fg)] font-display flex items-center gap-2">
              <span className="text-emerald-400">8.</span> Reporting and Enforcement
            </h2>
            <p className="text-sm text-[var(--theme-muted)] leading-relaxed font-body">
              If you see something that breaks these guidelines, report it.
            </p>
            <p className="text-sm text-[var(--theme-muted)] leading-relaxed font-body">
              We may remove content, limit features, or suspend/terminate accounts that violate these guidelines or our Terms of Service. We reserve the right to act at our discretion.
            </p>
          </section>

          {/* Section 9 */}
          <section className="space-y-3">
            <h2 className="text-xl font-black text-[var(--theme-fg)] font-display flex items-center gap-2">
              <span className="text-emerald-400">9.</span> Spirit of the Community
            </h2>
            <div className="p-4 rounded-2xl bg-[var(--theme-surface)] border border-[var(--theme-border)] space-y-2">
              <p className="text-sm font-semibold text-[var(--theme-fg)]">
                The goal is simple: help people discover music, record what they listen to, and share honest opinions without unnecessary toxicity.
              </p>
              <p className="text-xs text-[var(--theme-muted)] italic">
                When in doubt, ask yourself: “Does this help the conversation about music, or does it just create noise or harm?”
              </p>
            </div>
          </section>

          {/* Contact / Reports */}
          <section className="pt-4 border-t border-[var(--theme-border)]/50 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-[var(--theme-fg)] flex items-center gap-2">
                  <Mail size={16} className="text-emerald-400" />
                  <span>Contact / Reports:</span>
                  <a href="mailto:support@amplecen.com" className="text-emerald-300 hover:underline">
                    support@amplecen.com
                  </a>
                </p>
                <p className="text-xs text-[var(--theme-muted)] mt-0.5">
                  or use the in-app report function when available.
                </p>
              </div>
            </div>
            <p className="text-xs text-[var(--theme-muted)] pt-2">
              These guidelines may be updated from time to time. Continued use of the Service constitutes acceptance of the current version.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
