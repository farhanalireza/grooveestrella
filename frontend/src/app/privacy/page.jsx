// src/app/privacy/page.jsx
"use client";

import React, { useEffect } from 'react';
import { ArrowLeft, Shield, Database, Lock, Eye, Headphones, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function PrivacyPolicy() {
  const router = useRouter();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#07090F] via-[#10141F] to-[#07090F] text-[#F4F7FF]">
      {/* Header */}
      <div className="bg-[#07090F]/70 backdrop-blur-md border-b border-[#2563EB]/15 px-4 py-3 flex items-center gap-3 sticky top-0 z-40">
        <button
          onClick={() => router.back()}
          className="text-[#F4F7FF]/80 hover:text-[#F4F7FF] transition-colors p-2 hover:bg-[#2563EB]/15 rounded-lg cursor-pointer bg-transparent border-none"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-[#F4F7FF]/80" />
          <h1 className="text-[#F4F7FF] font-semibold text-lg">Privacy Policy</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-[#10141F]/80 border border-[#2563EB]/15 backdrop-blur-sm rounded-xl shadow-2xl p-8 space-y-6">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[#F4F7FF] mb-2">Privacy Policy</h1>
            <p className="text-[#8992A5]">Last Updated: {new Date().toLocaleDateString()}</p>
          </div>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-[#F4F7FF] flex items-center gap-2">
              <Eye className="w-6 h-6 text-[#60A5FA]" />
              1. Introduction
            </h2>
            <p className="text-[#8992A5] leading-relaxed">
              This Privacy Policy describes how our music discovery web application collects, uses, and protects your information. We are committed to protecting your privacy and being transparent about our data practices, including our integration with Spotify's services.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-[#F4F7FF] flex items-center gap-2">
              <Database className="w-6 h-6 text-[#60A5FA]" />
              2. Information We Collect
            </h2>
            
            <h3 className="text-lg font-medium text-[#F4F7FF]/90">2.1 Information You Provide</h3>
            <ul className="list-disc pl-6 space-y-1 text-[#8992A5]">
              <li><strong>Music Preferences:</strong> Musical tastes, favorite genres, artists, and songs you share</li>
              <li><strong>Mood and Context Data:</strong> Information about your current mood, activities, or situations</li>
              <li><strong>Survey Responses:</strong> Responses to music preference surveys and questionnaires</li>
              <li><strong>Chat Interactions:</strong> Messages and queries you send to our music recommendation chatbot</li>
            </ul>

            <h3 className="text-lg font-medium text-[#F4F7FF]/90">2.2 Spotify Integration Data</h3>
            <div className="bg-[#2563EB]/10 border border-[#2563EB]/35 rounded-lg p-4">
              <h4 className="font-semibold text-[#60A5FA] mb-2 flex items-center gap-2">
                <Headphones className="w-5 h-5" />
                Data from Spotify API
              </h4>
              <ul className="list-disc pl-4 space-y-1 text-[#F4F7FF]/80 text-sm">
                <li>Track metadata (song titles, artists, albums, duration, popularity)</li>
                <li>Album artwork and artist images for display purposes</li>
                <li>Audio features and characteristics for recommendation matching</li>
                <li>Playlist information when relevant to recommendations</li>
                <li>Playback state and controls (when using integrated player)</li>
              </ul>
              <p className="text-[#8992A5] text-xs mt-2">
                <strong>Note:</strong> This data is sourced from Spotify's public API and is not stored permanently on our servers.
              </p>
            </div>

            <h3 className="text-lg font-medium text-[#F4F7FF]/90">2.3 Information We Do NOT Collect</h3>
            <div className="bg-red-500/10 border border-red-500/35 rounded-lg p-4">
              <ul className="list-disc pl-4 space-y-1 text-red-400 text-sm">
                <li>Personal identity information (names, email addresses, phone numbers)</li>
                <li>Your Spotify login credentials or authentication tokens</li>
                <li>Your Spotify listening history or personal playlists</li>
                <li>Location data or geographic information</li>
                <li>Social media data or contacts</li>
                <li>Payment or financial information</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">3. How We Use Your Information</h2>
            
            <h3 className="text-lg font-medium text-gray-800">3.1 Primary Uses</h3>
            <ul className="list-disc pl-6 space-y-1 text-gray-700">
              <li><strong>Music Recommendations:</strong> Generate personalized suggestions using Spotify data</li>
              <li><strong>App Improvement:</strong> Enhance our recommendation algorithms</li>
              <li><strong>User Experience:</strong> Customize the interface and features</li>
              <li><strong>Playback Integration:</strong> Enable Spotify playback controls and features</li>
            </ul>

            <h3 className="text-lg font-medium text-[#F4F7FF]/90">3.2 Chatbot Processing</h3>
            <div className="bg-[#2563EB]/10 border border-[#2563EB]/35 rounded-lg p-4">
              <p className="text-[#60A5FA] mb-2">Our chatbot processes your input through the following steps:</p>
              <ol className="list-decimal pl-4 space-y-1 text-[#F4F7FF]/80 text-sm">
                <li><strong>Input Processing:</strong> Receive and analyze your messages for context and mood</li>
                <li><strong>Keyword Matching:</strong> Identify relevant keywords and phrases</li>
                <li><strong>Database Querying:</strong> Match preferences against our curated music database</li>
                <li><strong>Spotify Integration:</strong> Fetch accurate track data and metadata from Spotify</li>
                <li><strong>Response Generation:</strong> Provide relevant recommendations with proper attribution</li>
              </ol>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-[#F4F7FF] flex items-center gap-2">
              <Lock className="w-6 h-6 text-[#60A5FA]" />
              4. Data Storage and Security
            </h2>
            
            <h3 className="text-lg font-medium text-[#F4F7FF]/90">4.1 Local Storage Only</h3>
            <div className="bg-[#10141F] border border-[#2563EB]/20 rounded-lg p-4">
              <ul className="list-disc pl-4 space-y-1 text-[#60A5FA] text-sm">
                <li><strong>Device-Only Storage:</strong> All personal data is stored exclusively on your device using localStorage</li>
                <li><strong>No External Servers:</strong> We do not store your personal data on our servers or external databases</li>
                <li><strong>Spotify Data:</strong> Music data from Spotify is fetched in real-time and not permanently stored</li>
                <li><strong>User Control:</strong> You have complete control over your data and can clear it at any time</li>
              </ul>
            </div>

            <h3 className="text-lg font-medium text-[#F4F7FF]/90">4.2 Required Consent</h3>
            <p className="text-[#8992A5] leading-relaxed">
              You must explicitly consent to local data storage before using the App. We clearly explain what data is stored and how it's used. You can withdraw consent by clearing your browser's local storage.
            </p>

            <h3 className="text-lg font-medium text-[#F4F7FF]/90">4.3 Third-Party API Security</h3>
            <p className="text-[#8992A5] leading-relaxed">
              Our integration with Spotify follows their security guidelines and best practices. All API communications are encrypted and we do not store sensitive Spotify data.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-[#F4F7FF] flex items-center gap-2">
              <AlertCircle className="w-6 h-6 text-orange-400" />
              5. Content and Explicit Material
            </h2>
            <div className="bg-orange-500/10 border border-orange-500/35 rounded-lg p-4">
              <h3 className="font-semibold text-orange-400 mb-2">Important Notice:</h3>
              <p className="text-[#F4F7FF]/80 mb-2">
                Since we use Spotify's API for music data, our recommendations may include explicit content. We have no control over the explicit nature of content in Spotify's database.
              </p>
              <ul className="list-disc pl-4 space-y-1 text-orange-400 text-sm">
                <li>Explicit content warnings are based on Spotify's content flags</li>
                <li>We cannot filter or control explicit content beyond what Spotify provides</li>
                <li>Users are responsible for their own content consumption choices</li>
                <li>Parental supervision is recommended for younger users</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-[#F4F7FF]">6. Data Sharing and Third Parties</h2>
            
            <h3 className="text-lg font-medium text-[#F4F7FF]/90">6.1 No Data Selling</h3>
            <p className="text-[#8992A5] leading-relaxed">
              We do not sell, rent, or trade your personal information to third parties for commercial purposes.
            </p>

            <h3 className="text-lg font-medium text-[#F4F7FF]/90">6.2 Spotify Integration</h3>
            <div className="bg-[#10141F] border border-[#2563EB]/15 rounded-lg p-4">
              <ul className="list-disc pl-4 space-y-1 text-[#8992A5] text-sm">
                <li>We use Spotify's Web API to fetch music data and enable playback features</li>
                <li>No personal user data is shared with Spotify beyond standard API requests</li>
                <li>Your Spotify account remains under your control and Spotify's privacy policy</li>
                <li>We do not access your private Spotify data or listening history</li>
              </ul>
            </div>

            <h3 className="text-lg font-medium text-[#F4F7FF]/90">6.3 Anonymous Analytics</h3>
            <p className="text-[#8992A5] leading-relaxed">
              We may use anonymized, aggregated data that cannot identify individual users for improving our recommendation algorithms and understanding general usage patterns.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-[#F4F7FF]">7. Data Retention and Deletion</h2>
            
            <h3 className="text-lg font-medium text-[#F4F7FF]/90">7.1 Local Data Control</h3>
            <ul className="list-disc pl-6 space-y-1 text-[#8992A5]">
              <li>Data persists on your device until you choose to delete it</li>
              <li>Clearing your browser data will remove all stored information</li>
              <li>Uninstalling the App will delete all associated data</li>
            </ul>

            <h3 className="text-lg font-medium text-[#F4F7FF]/90">7.2 Server-Side Processing</h3>
            <ul className="list-disc pl-6 space-y-1 text-[#8992A5]">
              <li>Chatbot inputs are processed temporarily and not stored long-term</li>
              <li>Spotify API requests are made in real-time without permanent storage</li>
              <li>System logs are anonymized and retained for up to 30 days for security purposes</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-[#F4F7FF]">8. Your Rights and Choices</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-[#2563EB]/10 border border-[#2563EB]/35 rounded-lg p-4">
                <h3 className="font-semibold text-[#60A5FA] mb-2">Data Access & Control</h3>
                <ul className="list-disc pl-4 space-y-1 text-[#F4F7FF]/80 text-sm">
                  <li>View all locally stored data</li>
                  <li>Delete data at any time</li>
                  <li>Modify preferences</li>
                  <li>Export your data</li>
                </ul>
              </div>
              <div className="bg-[#2563EB]/10 border border-[#2563EB]/35 rounded-lg p-4">
                <h3 className="font-semibold text-[#60A5FA] mb-2">Consent Management</h3>
                <ul className="list-disc pl-4 space-y-1 text-[#F4F7FF]/80 text-sm">
                  <li>Withdraw consent anytime</li>
                  <li>Granular control options</li>
                  <li>Clear consent indicators</li>
                  <li>Easy opt-out process</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-[#F4F7FF]">9. Children's Privacy</h2>
            <p className="text-[#8992A5] leading-relaxed">
              Our App is not directed to children under 13 years of age. We do not knowingly collect personal information from children under 13. Given the potential for explicit content through Spotify integration, parental supervision is strongly recommended.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-[#F4F7FF]">10. Contact Information</h2>
            <div className="bg-[#2563EB]/10 border border-[#2563EB]/35 rounded-lg p-4">
              <p className="text-[#60A5FA] mb-2">
                For any questions, concerns, or requests regarding this Privacy Policy or our data practices:
              </p>
              <div className="space-y-1 text-[#F4F7FF]/80">
                <p><strong>Privacy Email:</strong> soumocollage@gmail.com</p>
                <p><strong>General Contact:</strong> seinheim@gmail.com</p>
                <p><strong>Response Time:</strong> We aim to respond within 72 hours</p>
              </div>
            </div>
          </section>

          <div className="border-t border-[#2563EB]/15 pt-6 mt-8">
            <p className="text-sm text-[#8992A5] italic text-center">
              This Privacy Policy is effective as of the date listed above and applies to all users of our music discovery application.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
