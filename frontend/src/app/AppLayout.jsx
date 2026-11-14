// src/app/AppLayout.jsx
"use client";
import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import AppBar from '@/Components/AppBar';
import GrooveLoader from '@/Components/GrooveLoader';
import PlaylistPickerModal from '@/Components/PlaylistPickerModal';
import PWAInstallPrompt from '@/Components/PWAInstallPrompt';
import OnboardingModal from '@/Components/OnboardingModal';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { isSupabaseConfigured } from '@/lib/supabase/client';

export default function AppLayout({ children }) {
  const [mounted, setMounted] = useState(false);
  const [section, setSection] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading: authLoading } = useSupabaseAuth();

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

  const isAuthPage = pathname === "/login" || pathname === "/signup";
  const isLanding = !authLoading && !user && pathname === "/";
  const hideAppChrome = isAuthPage || isLanding;

  // Protect internal routes if unauthenticated
  useEffect(() => {
    if (!authLoading && !user && isSupabaseConfigured()) {
      if (pathname && pathname !== "/" && !isAuthPage && !pathname.startsWith("/api") && !pathname.startsWith("/s/")) {
        router.push(`/login?returnTo=${encodeURIComponent(pathname)}`);
      }
    }
  }, [user, authLoading, pathname, isAuthPage, router]);

  return (
    <div className="min-h-screen bg-[var(--theme-bg)] text-[var(--theme-fg)] font-sans flex flex-col lg:flex-row transition-colors duration-300">
      {!hideAppChrome && (
        <AppBar 
          selectedSection={section} 
          setSection={setSection} 
          isCollapsed={sidebarCollapsed}
          onToggleSidebar={handleToggleSidebar}
        />
      )}
      {/* Content wrapper: responsive margins/padding for sidebar without top header gap */}
      <div 
        className={`flex-1 w-full min-w-0 transition-all duration-300 ${
          hideAppChrome ? "" : sidebarCollapsed ? "pb-28 lg:pb-8 lg:ml-20" : "pb-28 lg:pb-8 lg:ml-64"
        }`}
      >
        {children}
      </div>
      {mounted && !hideAppChrome && (
        <>
          <PlaylistPickerModal />
          <PWAInstallPrompt />
          {user && <OnboardingModal />}
        </>
      )}
    </div>
  );
}
