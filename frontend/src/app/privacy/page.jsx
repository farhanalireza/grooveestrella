// src/app/privacy/page.jsx
"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Shield, Lock, FileText, Mail, Eye, Database, Users, Globe, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function PrivacyPolicyPage() {
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
            <Shield className="w-5 h-5 text-cyan-400" />
            <h1 className="text-[var(--theme-fg)] font-bold text-base sm:text-lg font-display">
              Privacy Policy
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
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-400/10 border border-cyan-400/25 text-cyan-300 text-xs font-black uppercase tracking-wider">
              <Lock size={13} />
              <span>Data Protection</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-[var(--theme-fg)] font-display tracking-tight">
              Privacy Policy
            </h1>
            <p className="text-xs sm:text-sm text-[var(--theme-muted)] font-medium">
              Last Updated: November 25, 2026
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-cyan-400/10 border border-cyan-400/20 text-xs text-cyan-200/90 leading-relaxed">
            This Privacy Policy explains how GrooveEstrella (“we”, “us”, or “our”) collects, uses, and shares information when you use our Service.
          </div>

          {/* Section 1 */}
          <section className="space-y-4">
            <h2 className="text-xl font-black text-[var(--theme-fg)] font-display flex items-center gap-2">
              <span className="text-cyan-400">1.</span> Information We Collect
            </h2>
            
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-[var(--theme-fg)] uppercase tracking-wider text-cyan-300">
                Account Information
              </h3>
              <ul className="list-disc pl-5 text-sm text-[var(--theme-muted)] space-y-1.5 font-body">
                <li><strong className="text-[var(--theme-fg)]">Email address</strong>: Used for account access and service communications.</li>
                <li><strong className="text-[var(--theme-fg)]">Username / display name</strong>: You may choose any name; it does not have to be your real name.</li>
                <li><strong className="text-[var(--theme-fg)]">Profile information</strong>: Bio, avatar, and public details.</li>
                <li><strong className="text-[var(--theme-fg)]">Onboarding preferences</strong>: Favorite genres, favorite artists, streaming service preference, and similar data you provide.</li>
              </ul>
            </div>

            <div className="space-y-3 pt-2">
              <h3 className="text-sm font-bold text-[var(--theme-fg)] uppercase tracking-wider text-cyan-300">
                User Content
              </h3>
              <ul className="list-disc pl-5 text-sm text-[var(--theme-muted)] space-y-1.5 font-body">
                <li><strong className="text-[var(--theme-fg)]">Ratings</strong>: Star ratings and scores you submit for music.</li>
                <li><strong className="text-[var(--theme-fg)]">Journal entries and reviews</strong>: Written logs, notes, and music reflections.</li>
                <li><strong className="text-[var(--theme-fg)]">Lists and other content</strong>: Curated listening lists, favorites, and library pins you create.</li>
              </ul>
            </div>

            <div className="space-y-3 pt-2">
              <h3 className="text-sm font-bold text-[var(--theme-fg)] uppercase tracking-wider text-cyan-300">
                Technical and Usage Information
              </h3>
              <ul className="list-disc pl-5 text-sm text-[var(--theme-muted)] space-y-1.5 font-body">
                <li>IP address, device type, browser type, and operating system</li>
                <li>Pages visited, features used, and approximate timestamps</li>
                <li>Diagnostic, performance, and crash data</li>
              </ul>
            </div>

            <div className="p-3.5 rounded-xl bg-[var(--theme-surface)] border border-[var(--theme-border)] text-xs text-[var(--theme-muted)] font-medium">
              We do <strong className="text-[var(--theme-fg)]">not</strong> intentionally collect sensitive personal data.
            </div>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-xl font-black text-[var(--theme-fg)] font-display flex items-center gap-2">
              <span className="text-cyan-400">2.</span> How We Use Information
            </h2>
            <p className="text-sm text-[var(--theme-muted)] font-body">We use the information we collect to:</p>
            <ul className="list-disc pl-5 text-sm text-[var(--theme-muted)] space-y-1.5 font-body">
              <li>Provide, maintain, and improve the Service</li>
              <li>Create and manage your account</li>
              <li>Display public ratings and public reviews</li>
              <li>Personalize aspects of the experience and recommendation discovery</li>
              <li>Communicate with you about the Service</li>
              <li>Moderate content and enforce our Terms and Community Guidelines</li>
              <li>Analyze usage and fix technical issues</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-xl font-black text-[var(--theme-fg)] font-display flex items-center gap-2">
              <span className="text-cyan-400">3.</span> Public Information
            </h2>
            <div className="p-4 rounded-2xl bg-amber-400/10 border border-amber-400/25 space-y-2">
              <p className="text-xs font-bold text-amber-300 uppercase tracking-wider">Please note:</p>
              <ul className="list-disc pl-5 text-xs text-amber-200/90 space-y-1 font-body">
                <li><strong className="text-white">Star ratings are always public.</strong></li>
                <li><strong className="text-white">Journal entries</strong> you mark as public will be visible to other users and appear as reviews on relevant pages.</li>
                <li>Your <strong className="text-white">username and profile information</strong> are visible according to your settings.</li>
              </ul>
            </div>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-xl font-black text-[var(--theme-fg)] font-display flex items-center gap-2">
              <span className="text-cyan-400">4.</span> How We Share Information
            </h2>
            <p className="text-sm font-bold text-[var(--theme-fg)] bg-[var(--theme-surface)] p-3.5 rounded-xl border border-[var(--theme-border)]">
              We do <strong className="text-cyan-300">not</strong> sell your personal information.
            </p>
            <p className="text-sm text-[var(--theme-muted)] font-body">We may share information with:</p>
            <ul className="list-disc pl-5 text-sm text-[var(--theme-muted)] space-y-1.5 font-body">
              <li>Service providers who help us operate the Service (hosting, databases, analytics, email delivery, etc.), under contractual confidentiality obligations</li>
              <li>When required by law or to protect legal rights, safety, and security</li>
              <li>In connection with a business transfer (merger, acquisition, or sale of assets)</li>
            </ul>
            <p className="text-xs text-[var(--theme-muted)] italic pt-1">
              Public ratings and public reviews are visible to other users by design.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-xl font-black text-[var(--theme-fg)] font-display flex items-center gap-2">
              <span className="text-cyan-400">5.</span> Data Retention
            </h2>
            <p className="text-sm text-[var(--theme-muted)] leading-relaxed font-body">
              We retain your information for as long as your account is active and as needed to provide the Service. We may retain certain information for legitimate business or legal purposes after account deletion.
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-xl font-black text-[var(--theme-fg)] font-display flex items-center gap-2">
              <span className="text-cyan-400">6.</span> Your Rights and Choices
            </h2>
            <p className="text-sm text-[var(--theme-muted)] font-body">Depending on your location, you may have rights to:</p>
            <ul className="list-disc pl-5 text-sm text-[var(--theme-muted)] space-y-1.5 font-body">
              <li>Access the personal data we hold about you</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Object to or restrict certain processing</li>
              <li>Withdraw consent where processing is based on consent</li>
            </ul>
            <p className="text-sm text-[var(--theme-muted)] leading-relaxed font-body">
              To exercise these rights, contact us at{" "}
              <a href="mailto:privacy@amplecen.com" className="text-cyan-300 font-semibold hover:underline">
                privacy@amplecen.com
              </a>{" "}
              or{" "}
              <a href="mailto:support@amplecen.com" className="text-cyan-300 font-semibold hover:underline">
                support@amplecen.com
              </a>
              . We will respond in accordance with applicable law.
            </p>
            <p className="text-xs text-[var(--theme-muted)] italic">
              You can also update certain profile information directly in the app via your Account Settings.
            </p>
          </section>

          {/* Section 7 */}
          <section className="space-y-3">
            <h2 className="text-xl font-black text-[var(--theme-fg)] font-display flex items-center gap-2">
              <span className="text-cyan-400">7.</span> Children’s Privacy
            </h2>
            <p className="text-sm text-[var(--theme-muted)] leading-relaxed font-body">
              The Service is not directed at children under 16. We do not knowingly collect personal information from children under 16. If you believe we have collected such information, please contact us and we will take appropriate steps to delete it.
            </p>
          </section>

          {/* Section 8 */}
          <section className="space-y-3">
            <h2 className="text-xl font-black text-[var(--theme-fg)] font-display flex items-center gap-2">
              <span className="text-cyan-400">8.</span> International Users
            </h2>
            <p className="text-sm text-[var(--theme-muted)] leading-relaxed font-body">
              The Service is operated from India. If you access the Service from outside India, your information may be transferred to and processed in India and other countries where our service providers operate. By using the Service, you consent to such transfers.
            </p>
            <p className="text-sm text-[var(--theme-muted)] leading-relaxed font-body">
              Users in the European Economic Area, United Kingdom, California, and certain other regions may have additional rights under local law. We will honor applicable requests.
            </p>
          </section>

          {/* Section 9 */}
          <section className="space-y-3">
            <h2 className="text-xl font-black text-[var(--theme-fg)] font-display flex items-center gap-2">
              <span className="text-cyan-400">9.</span> Security
            </h2>
            <p className="text-sm text-[var(--theme-muted)] leading-relaxed font-body">
              We take reasonable measures to protect your information. However, no method of transmission or storage is completely secure, and we cannot guarantee absolute security.
            </p>
          </section>

          {/* Section 10 */}
          <section className="space-y-3">
            <h2 className="text-xl font-black text-[var(--theme-fg)] font-display flex items-center gap-2">
              <span className="text-cyan-400">10.</span> Third-Party Links and Services
            </h2>
            <p className="text-sm text-[var(--theme-muted)] leading-relaxed font-body">
              The Service contains links to third-party platforms (such as Spotify, Apple Music, and others) and uses metadata from third-party sources (including MusicBrainz and Cover Art Archive). We are not responsible for the privacy practices of these third parties. We encourage you to read their privacy policies.
            </p>
          </section>

          {/* Section 11 */}
          <section className="space-y-3">
            <h2 className="text-xl font-black text-[var(--theme-fg)] font-display flex items-center gap-2">
              <span className="text-cyan-400">11.</span> Changes to This Policy
            </h2>
            <p className="text-sm text-[var(--theme-muted)] leading-relaxed font-body">
              We may update this Privacy Policy from time to time. We will post the updated version and revise the “Last Updated” date. Continued use of the Service after changes constitutes acceptance.
            </p>
          </section>

          {/* Section 12 */}
          <section className="space-y-3">
            <h2 className="text-xl font-black text-[var(--theme-fg)] font-display flex items-center gap-2">
              <span className="text-cyan-400">12.</span> Contact Us
            </h2>
            <p className="text-sm text-[var(--theme-muted)] leading-relaxed font-body">
              For privacy-related questions or requests, contact us at:
            </p>
            <div className="pt-2">
              <p className="text-sm font-semibold text-[var(--theme-fg)] flex items-center gap-2">
                <Mail size={16} className="text-cyan-400" />
                <a href="mailto:privacy@amplecen.com" className="text-cyan-300 hover:underline">
                  privacy@amplecen.com
                </a>
                <span className="text-[var(--theme-muted)]">/</span>
                <a href="mailto:support@amplecen.com" className="text-cyan-300 hover:underline">
                  support@amplecen.com
                </a>
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
