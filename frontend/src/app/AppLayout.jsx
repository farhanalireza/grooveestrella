// src/app/AppLayout.jsx
"use client";
import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import AppBar from '@/Components/AppBar';
import GrooveLoader from '@/Components/GrooveLoader';
import PlaylistPickerModal from '@/Components/PlaylistPickerModal';

export default function AppLayout({ children }) {
  const [mounted, setMounted] = useState(false);
  const [section, setSection] = useState("");
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[var(--theme-bg)] flex items-center justify-center text-[var(--theme-fg)] font-sans">
        <GrooveLoader size={64} fullScreen={true} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--theme-bg)] text-[var(--theme-fg)] font-sans flex flex-col transition-colors duration-300">
      <AppBar selectedSection={section} setSection={setSection} />
      {/* Content wrapper with responsive padding to prevent fixed bar overlap */}
      <div className="flex-1 w-full lg:pt-16 pb-28 lg:pb-0">
        {children}
      </div>
      <PlaylistPickerModal />
    </div>
  );
}


