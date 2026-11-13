// src/app/AppLayout.jsx
"use client";
import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import AppBar from '@/Components/AppBar';
import GrooveLoader from '@/Components/GrooveLoader';
import PlaylistPickerModal from '@/Components/PlaylistPickerModal';
import PWAInstallPrompt from '@/Components/PWAInstallPrompt';
import OnboardingModal from '@/Components/OnboardingModal';

export default function AppLayout({ children }) {
  const [mounted, setMounted] = useState(false);
  const [section, setSection] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("groove_sidebar_collapsed");
    if (saved !== null) {
      setSidebarCollapsed(saved === "true");
    }
  }, []);

  const handleToggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("groove_sidebar_collapsed", String(next));
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-[var(--theme-bg)] text-[var(--theme-fg)] font-sans flex flex-col lg:flex-row transition-colors duration-300">
      <AppBar 
        selectedSection={section} 
        setSection={setSection} 
        isCollapsed={sidebarCollapsed}
        onToggleSidebar={handleToggleSidebar}
      />
      {/* Content wrapper: responsive margins/padding for sidebar without top header gap */}
      <div 
        className={`flex-1 w-full min-w-0 pb-28 lg:pb-8 transition-all duration-300 ${
          sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"
        }`}
      >
        {children}
      </div>
      {mounted && (
        <>
          <PlaylistPickerModal />
          <PWAInstallPrompt />
          <OnboardingModal />
        </>
      )}
    </div>
  );
}


