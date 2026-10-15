// src/app/AppLayout.jsx
"use client";
import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import AppBar from '@/Components/AppBar';
import GrooveLoader from '@/Components/GrooveLoader';

export default function AppLayout({ children }) {
  const [mounted, setMounted] = useState(false);
  const [section, setSection] = useState("");
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#07090F] flex items-center justify-center text-[#F4F7FF] font-sans">
        <GrooveLoader size={44} text="Loading Groove..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07090F] text-[#F4F7FF] font-sans flex flex-col">
      <AppBar selectedSection={section} setSection={setSection} />
      {/* Content wrapper with responsive padding to prevent fixed bar overlap */}
      <div className="flex-1 w-full lg:pt-16 pb-28 lg:pb-0">
        {children}
      </div>
    </div>
  );
}


