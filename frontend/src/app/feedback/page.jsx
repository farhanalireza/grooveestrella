// src/app/feedback/page.jsx
"use client";

import React from 'react';
import { MessageCircleMore, Sparkles } from 'lucide-react';

export default function FeedbackPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white px-4 py-8 md:px-12 pt-12">
      <div className="max-w-3xl mx-auto text-center space-y-4 mb-6">
        <div className="flex justify-center items-center gap-3">
          <MessageCircleMore className="text-emerald-400 w-8 h-8" />
          <h1 className="text-2xl md:text-3xl font-bold">We'd Love Your Feedback</h1>
        </div>
        <p className="text-gray-400 text-sm md:text-base">
          GrooveEstrella is in <span className="text-yellow-400 font-semibold">Beta</span> — help us shape the future of intuitive music discovery.
        </p>
        <p className="text-sm italic text-gray-500 font-sans">Your voice = real improvements. No fluff.</p>
      </div>

      <div className="w-full max-w-4xl mx-auto border border-white/10 rounded-xl overflow-hidden shadow-lg">
        <iframe
          src="https://docs.google.com/forms/d/e/1FAIpQLSfZsJ9qZs5qNXrJylrSvm4pq0dxWegQyP7-Ucodm2u_6Qo-1A/viewform?embedded=true"
          width="100%"
          height="1200"
          frameBorder="0"
          marginHeight="0"
          marginWidth="0"
          title="GrooveEstrella Feedback"
          className="rounded-xl"
        >
          Loading…
        </iframe>
      </div>

      <div className="mt-10 text-center text-xs text-gray-500">
        <p>Built with 💚 by The Code Breakers</p>
        <p className="mt-1 flex justify-center items-center gap-1">
          <Sparkles className="w-3 h-3 text-yellow-300" />
          Real feedback fuels real innovation.
        </p>
      </div>
    </div>
  );
}
