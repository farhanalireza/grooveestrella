// src/app/AppLayout.jsx
"use client";
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import AppBar from '@/Components/AppBar';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { isSupabaseConfigured } from '@/lib/supabase/client';

// Defer non-critical modals out of the initial critical rendering path
const PlaylistPickerModal = dynamic(() => import('@/Components/PlaylistPickerModal'), { ssr: false });
const PWAInstallPrompt = dynamic(() => import('@/Components/PWAInstallPrompt'), { ssr: false });
const OnboardingModal = dynamic(() => import('@/Components/OnboardingModal'), { ssr: false });
const LiquidToastContainer = dynamic(() => import('@/Components/LiquidToastContainer'), { ssr: false });

const PROTECTED_PREFIXES = [
  "/account",
  "/settings",
  "/library",
  "/journal/new",
  "/journal/edit",
  "/lists/new",
];

export default function AppLayout({ children }) {
  const [mounted, setMounted] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading: authLoading } = useSupabaseAuth();

  const [isGuestExplore, setIsGuestExplore] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("groove_sidebar_collapsed");
    if (saved !== null) {
      setSidebarCollapsed(saved === "true");
    }
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("explore") === "true") {
        setIsGuestExplore(true);
      }
    }
  }, [pathname]);

  const handleToggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("groove_sidebar_collapsed", String(next));
      return next;
    });
  }, []);

  const isAuthPage = pathname === "/login" || pathname === "/signup";
  // Landing page on '/' for unauthenticated visitors hides the internal sidebar chrome unless exploring
  const isLanding = pathname === "/" && !user && !isGuestExplore;
  const hideAppChrome = isAuthPage || isLanding;

  // Protect ONLY authenticated private routes; public music/info pages load freely
  const isProtectedRoute = useMemo(() => {
    if (!pathname) return false;
    return PROTECTED_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(prefix + "/")
    );
  }, [pathname]);

  useEffect(() => {
    if (!authLoading && !user && isSupabaseConfigured() && isProtectedRoute) {
      router.push(`/login?returnTo=${encodeURIComponent(pathname)}`);
    }
  }, [user, authLoading, isProtectedRoute, pathname, router]);

  return (
    <div className="min-h-screen bg-[var(--theme-bg)] text-[var(--theme-fg)] font-sans flex flex-col lg:flex-row transition-colors duration-300">
      {!hideAppChrome && (
        <AppBar 
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
          <OnboardingModal />
        </>
      )}
      {mounted && <LiquidToastContainer />}
    </div>
  );
}
