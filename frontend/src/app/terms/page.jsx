// src/app/terms/page.jsx
"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Shield, FileText, ExternalLink, Mail, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function TermsOfServicePage() {
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
            <Shield className="w-5 h-5 text-amber-400" />
            <h1 className="text-[var(--theme-fg)] font-bold text-base sm:text-lg font-display">
              Terms of Service
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/privacy"
            className="text-xs font-semibold text-[var(--theme-muted)] hover:text-[var(--theme-fg)] px-3 py-1.5 rounded-full hover:bg-[var(--theme-surface)] transition"
          >
            Privacy Policy
          </Link>
          <Link
            href="/guidelines"
            className="text-xs font-semibold text-amber-300 hover:text-amber-200 px-3 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/25 transition"
          >
            Community Guidelines
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="bg-[var(--theme-card)]/85 border border-[var(--theme-border)] backdrop-blur-xl rounded-3xl shadow-2xl p-6 sm:p-10 space-y-8">
          {/* Document Title Header */}
          <div className="text-center pb-6 border-b border-[var(--theme-border)]/50 space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/25 text-amber-300 text-xs font-black uppercase tracking-wider">
              <FileText size={13} />
              <span>Legal Agreement</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-[var(--theme-fg)] font-display tracking-tight">
              Terms of Service
            </h1>
            <p className="text-xs sm:text-sm text-[var(--theme-muted)] font-medium">
              Last Updated: November 25, 2026
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-amber-400/10 border border-amber-400/20 text-xs text-amber-200/90 leading-relaxed">
            Welcome to GrooveEstrella. These Terms of Service (“Terms”) govern your access to and use of the GrooveEstrella website, applications, and related services (the “Service”). By creating an account or using the Service, you agree to these Terms. If you do not agree, do not use the Service.
          </div>

          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-xl font-black text-[var(--theme-fg)] font-display flex items-center gap-2">
              <span className="text-amber-400">1.</span> The Service
            </h2>
            <p className="text-sm text-[var(--theme-muted)] leading-relaxed font-body">
              GrooveEstrella is a music discovery, journaling, and community platform. We provide music metadata, links to third-party streaming services, user ratings, reviews, lists, and related features.
            </p>
            <p className="text-sm font-bold text-[var(--theme-fg)] bg-[var(--theme-surface)] p-3.5 rounded-xl border border-[var(--theme-border)]">
              We do <strong className="text-amber-300">not</strong> host, stream, sell, or distribute copyrighted musical recordings.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-xl font-black text-[var(--theme-fg)] font-display flex items-center gap-2">
              <span className="text-amber-400">2.</span> Eligibility
            </h2>
            <p className="text-sm text-[var(--theme-muted)] leading-relaxed font-body">
              You must be at least 16 years old to use the Service. By using the Service, you represent that you meet this requirement.
            </p>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-xl font-black text-[var(--theme-fg)] font-display flex items-center gap-2">
              <span className="text-amber-400">3.</span> Accounts
            </h2>
            <p className="text-sm text-[var(--theme-muted)] leading-relaxed font-body">
              You are responsible for maintaining the security of your account and for all activity that occurs under it. You must provide accurate information and promptly update it. You may not share your account or use another person’s account.
            </p>
            <p className="text-sm text-[var(--theme-muted)] leading-relaxed font-body">
              We may suspend or terminate accounts at our sole discretion.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-xl font-black text-[var(--theme-fg)] font-display flex items-center gap-2">
              <span className="text-amber-400">4.</span> User Content
            </h2>
            <p className="text-sm text-[var(--theme-muted)] leading-relaxed font-body">
              “User Content” means any text, ratings, reviews, journal entries, lists, profile information, or other materials you submit to the Service.
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-sm text-[var(--theme-muted)] font-body">
              <li>You retain ownership of your User Content.</li>
              <li>By submitting User Content, you grant GrooveEstrella a worldwide, non-exclusive, royalty-free, transferable, and sublicensable license to use, host, store, reproduce, modify, publish, display, and distribute that content in connection with operating and promoting the Service.</li>
              <li>You are solely responsible for your User Content.</li>
              <li>You represent and warrant that you have all necessary rights to submit the content and that it does not violate any law or infringe any third-party rights.</li>
            </ul>
            <div className="p-4 rounded-2xl bg-[var(--theme-surface)] border border-amber-400/30 text-xs text-[var(--theme-fg)] space-y-1">
              <strong className="text-amber-300 block font-bold">Important Notice Regarding Visibility:</strong>
              <p className="text-[var(--theme-muted)]">
                Star ratings are always public. Journal entries may be set to public or private. When a journal entry is public, its text is treated as a public review.
              </p>
            </div>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-xl font-black text-[var(--theme-fg)] font-display flex items-center gap-2">
              <span className="text-amber-400">5.</span> Prohibited Conduct
            </h2>
            <p className="text-sm text-[var(--theme-muted)] leading-relaxed font-body">
              You agree not to:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-sm text-[var(--theme-muted)] font-body">
              <li>Post content that is illegal, infringing, defamatory, harassing, hateful, or otherwise objectionable</li>
              <li>Impersonate others or misrepresent your identity</li>
              <li>Attempt to interfere with the Service or other users</li>
              <li>Scrape, reverse-engineer, or overload the Service</li>
              <li>Use the Service for any commercial purpose not expressly permitted by us</li>
            </ul>
            <p className="text-sm text-[var(--theme-muted)] leading-relaxed font-body">
              We reserve the right to remove any content and to suspend or terminate accounts at our sole discretion, with or without notice.
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-xl font-black text-[var(--theme-fg)] font-display flex items-center gap-2">
              <span className="text-amber-400">6.</span> Third-Party Services and Data
            </h2>
            <p className="text-sm text-[var(--theme-muted)] leading-relaxed font-body">
              The Service contains links to third-party platforms (including Spotify, Apple Music, and others) and uses data from third-party sources (including MusicBrainz and similar databases).
            </p>
            <p className="text-sm text-[var(--theme-muted)] leading-relaxed font-body">
              We do not control these third parties and are not responsible for their content, availability, accuracy, or practices. Your use of third-party services is governed by their own terms.
            </p>
          </section>

          {/* Section 7 */}
          <section className="space-y-3">
            <h2 className="text-xl font-black text-[var(--theme-fg)] font-display flex items-center gap-2">
              <span className="text-amber-400">7.</span> Paid Features
            </h2>
            <p className="text-sm text-[var(--theme-muted)] leading-relaxed font-body">
              The Service is currently free. We may introduce paid subscriptions or features in the future. Pricing, billing terms, renewal, and cancellation rules will be presented at the time of purchase. We reserve the right to change pricing with reasonable notice.
            </p>
          </section>

          {/* Section 8 */}
          <section className="space-y-3">
            <h2 className="text-xl font-black text-[var(--theme-fg)] font-display flex items-center gap-2">
              <span className="text-amber-400">8.</span> Intellectual Property
            </h2>
            <p className="text-sm text-[var(--theme-muted)] leading-relaxed font-body">
              The Service, including its design, branding, and original content (excluding User Content), is owned by us or our licensors and is protected by applicable intellectual property laws.
            </p>
          </section>

          {/* Section 9 */}
          <section className="space-y-3">
            <h2 className="text-xl font-black text-[var(--theme-fg)] font-display flex items-center gap-2">
              <span className="text-amber-400">9.</span> Disclaimer of Warranties
            </h2>
            <div className="p-4 rounded-2xl bg-[var(--theme-surface)] border border-[var(--theme-border)] text-xs text-[var(--theme-muted)] uppercase tracking-wide leading-relaxed space-y-2">
              <p>
                THE SERVICE IS PROVIDED “AS IS” AND “AS AVAILABLE” WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT.
              </p>
              <p>
                WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE, OR THAT METADATA, RATINGS, REVIEWS, OR LINKS WILL BE ACCURATE OR COMPLETE.
              </p>
            </div>
          </section>

          {/* Section 10 */}
          <section className="space-y-3">
            <h2 className="text-xl font-black text-[var(--theme-fg)] font-display flex items-center gap-2">
              <span className="text-amber-400">10.</span> Limitation of Liability
            </h2>
            <div className="p-4 rounded-2xl bg-[var(--theme-surface)] border border-[var(--theme-border)] text-xs text-[var(--theme-muted)] uppercase tracking-wide leading-relaxed space-y-2">
              <p>
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, GROOVEESTRELLA AND ITS OPERATORS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, PUNITIVE, OR EXEMPLARY DAMAGES, OR ANY LOSS OF PROFITS, DATA, OR GOODWILL, ARISING OUT OF OR RELATED TO YOUR USE OF THE SERVICE.
              </p>
              <p>
                OUR TOTAL LIABILITY FOR ANY CLAIM ARISING OUT OF THESE TERMS OR THE SERVICE SHALL NOT EXCEED THE AMOUNT YOU PAID TO US IN THE TWELVE (12) MONTHS PRIOR TO THE CLAIM (OR ₹0 IF YOU HAVE NOT PAID ANY AMOUNT).
              </p>
            </div>
          </section>

          {/* Section 11 */}
          <section className="space-y-3">
            <h2 className="text-xl font-black text-[var(--theme-fg)] font-display flex items-center gap-2">
              <span className="text-amber-400">11.</span> Indemnification
            </h2>
            <p className="text-sm text-[var(--theme-muted)] leading-relaxed font-body">
              You agree to indemnify, defend, and hold harmless GrooveEstrella and its operators from and against any claims, damages, losses, liabilities, costs, and expenses (including reasonable legal fees) arising out of or related to your User Content, your use of the Service, or your violation of these Terms.
            </p>
          </section>

          {/* Section 12 */}
          <section className="space-y-3">
            <h2 className="text-xl font-black text-[var(--theme-fg)] font-display flex items-center gap-2">
              <span className="text-amber-400">12.</span> Termination
            </h2>
            <p className="text-sm text-[var(--theme-muted)] leading-relaxed font-body">
              We may suspend or terminate your access to the Service at any time, for any reason or for no reason, without liability to you. Upon termination, your right to use the Service will immediately cease.
            </p>
          </section>

          {/* Section 13 */}
          <section className="space-y-3">
            <h2 className="text-xl font-black text-[var(--theme-fg)] font-display flex items-center gap-2">
              <span className="text-amber-400">13.</span> Changes to the Terms
            </h2>
            <p className="text-sm text-[var(--theme-muted)] leading-relaxed font-body">
              We may modify these Terms at any time. We will update the “Last Updated” date and, where appropriate, provide notice. Continued use of the Service after changes become effective constitutes acceptance of the revised Terms.
            </p>
          </section>

          {/* Section 14 */}
          <section className="space-y-3">
            <h2 className="text-xl font-black text-[var(--theme-fg)] font-display flex items-center gap-2">
              <span className="text-amber-400">14.</span> Governing Law and Dispute Resolution
            </h2>
            <p className="text-sm text-[var(--theme-muted)] leading-relaxed font-body">
              These Terms shall be governed by and construed in accordance with the laws of India, without regard to conflict of law principles.
            </p>
            <p className="text-sm text-[var(--theme-muted)] leading-relaxed font-body">
              Subject to applicable mandatory consumer protection laws in your country of residence, the courts located in Kolkata, West Bengal, India shall have exclusive jurisdiction over any dispute arising out of these Terms.
            </p>
          </section>

          {/* Section 15 */}
          <section className="space-y-3">
            <h2 className="text-xl font-black text-[var(--theme-fg)] font-display flex items-center gap-2">
              <span className="text-amber-400">15.</span> General
            </h2>
            <p className="text-sm text-[var(--theme-muted)] leading-relaxed font-body">
              If any provision of these Terms is found unenforceable, the remaining provisions will remain in effect. These Terms constitute the entire agreement between you and us regarding the Service.
            </p>
            <div className="pt-2">
              <p className="text-sm font-semibold text-[var(--theme-fg)] flex items-center gap-2">
                <Mail size={16} className="text-amber-400" />
                <span>Contact:</span>
                <a href="mailto:support@amplecen.com" className="text-amber-300 hover:underline">
                  support@amplecen.com
                </a>
                <span className="text-[var(--theme-muted)]">/</span>
                <a href="mailto:legal@amplecen.com" className="text-amber-300 hover:underline">
                  legal@amplecen.com
                </a>
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
