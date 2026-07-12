// src/app/AppLayout.jsx
"use client";
import React, { useState, useEffect } from 'react';

export default function AppLayout({ children }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#07090F] flex items-center justify-center text-[#F4F7FF] font-sans">
        <span className="text-sm tracking-widest uppercase animate-pulse text-[#8992A5]">Loading Groove...</span>
      </div>
    );
  }

  return <>{children}</>;
}

