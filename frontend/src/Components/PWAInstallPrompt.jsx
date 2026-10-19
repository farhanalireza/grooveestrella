// src/Components/PWAInstallPrompt.jsx
"use client";

import React, { useState, useEffect } from "react";
import { Download, X, Share2, PlusSquare, Sparkles, CheckCircle2, Smartphone, ArrowUpRight } from "lucide-react";
import { toast } from "@/lib/toast";

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Detect if already installed / running in standalone mode
    const standaloneMode = 
      window.matchMedia("(display-mode: standalone)").matches || 
      window.navigator.standalone === true || 
      document.referrer.includes("android-app://");
    setIsStandalone(standaloneMode);

    if (standaloneMode) return;

    // 2. Detect iOS Safari
    const ua = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(ua) && !window.MSStream;
    const isSafari = /safari/.test(ua) && !/chrome|crios|fxios|edgios/.test(ua);
    setIsIOS(isIOSDevice);

    // 3. Listen for Android / Chromium beforeinstallprompt event
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      window.deferredPWAInstallPrompt = e;

      // Check if user dismissed recently (7-day cooldown)
      const dismissed = localStorage.getItem("pwa_install_dismissed");
      if (!dismissed || Date.now() - Number(dismissed) > 7 * 24 * 60 * 60 * 1000) {
        // Small delay so user isn't startled immediately on load
        const timer = setTimeout(() => setShowBanner(true), 2500);
        return () => clearTimeout(timer);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // 4. If iOS Safari and not standalone, show prompt after initial exploration
    if (isIOSDevice && isSafari) {
      const dismissed = localStorage.getItem("pwa_install_dismissed");
      if (!dismissed || Date.now() - Number(dismissed) > 7 * 24 * 60 * 60 * 1000) {
        const timer = setTimeout(() => setShowBanner(true), 3500);
        return () => clearTimeout(timer);
      }
    }

    // 5. Listen for successful installation
    const handleAppInstalled = () => {
      setIsStandalone(true);
      setShowBanner(false);
      setShowIOSGuide(false);
      setDeferredPrompt(null);
      window.deferredPWAInstallPrompt = null;
      toast.success("GrooveEstrella installed to home screen! 🎉");
    };

    window.addEventListener("appinstalled", handleAppInstalled);

    // 6. Global event to manually trigger installation from Settings or Menu
    const handleManualOpen = () => {
      if (isStandalone) {
        toast.info("GrooveEstrella is already installed as a standalone app! 💿");
        return;
      }
      if (isIOSDevice) {
        setShowIOSGuide(true);
      } else if (window.deferredPWAInstallPrompt) {
        triggerInstall(window.deferredPWAInstallPrompt);
      } else {
        setShowIOSGuide(true);
      }
    };

    window.addEventListener("open-pwa-install", handleManualOpen);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleAppInstalled);
      window.removeEventListener("open-pwa-install", handleManualOpen);
    };
  }, [isStandalone]);

  const triggerInstall = async (promptObj) => {
    const promptToUse = promptObj || deferredPrompt;
    if (!promptToUse) {
      setShowIOSGuide(true);
      return;
    }

    promptToUse.prompt();
    const { outcome } = await promptToUse.userChoice;
    if (outcome === "accepted") {
      setShowBanner(false);
      setDeferredPrompt(null);
      window.deferredPWAInstallPrompt = null;
    }
  };

  const handleInstallClick = () => {
    if (isIOS) {
      setShowIOSGuide(true);
    } else if (deferredPrompt) {
      triggerInstall(deferredPrompt);
    } else {
      setShowIOSGuide(true);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    if (typeof window !== "undefined") {
      localStorage.setItem("pwa_install_dismissed", String(Date.now()));
    }
  };

  // Do not render anything if already installed
  if (isStandalone) return null;

  return (
    <>
      {/* Sleek Floating Install Banner */}
      {showBanner && (
        <div className="fixed bottom-20 sm:bottom-6 left-4 right-4 max-w-md mx-auto z-[9990] animate-in fade-in slide-in-from-bottom-4 duration-300 pointer-events-auto">
          <div className="relative bg-[var(--theme-card)]/95 backdrop-blur-2xl border border-[var(--theme-border)] rounded-3xl p-3.5 sm:p-4 shadow-2xl flex items-center justify-between gap-3 text-[var(--theme-fg)]">
            {/* App Icon + Text */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-11 h-11 rounded-2xl p-1.5 bg-[var(--theme-surface)] border border-[var(--theme-border)] shrink-0 flex items-center justify-center shadow-md">
                <img src="/in.svg" alt="GrooveEstrella" className="w-full h-full object-contain" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-xs sm:text-sm font-extrabold tracking-tight truncate text-[var(--theme-fg)] flex items-center gap-1.5">
                  <span>Install GrooveEstrella</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[var(--theme-accent)]/20 text-[var(--theme-accent)] font-mono font-bold">
                    PWA
                  </span>
                </h4>
                <p className="text-[11px] text-[var(--theme-muted)] truncate mt-0.5">
                  {isIOS ? "Add to Home Screen for native experience" : "Fast fullscreen player & offline access"}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleInstallClick}
                className="px-3.5 py-2 bg-[var(--theme-accent)] hover:opacity-95 active:scale-95 text-[var(--theme-accent-fg)] font-bold text-xs rounded-full transition shadow-md flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <Download size={13} />
                <span>Install</span>
              </button>
              <button
                onClick={handleDismiss}
                className="p-1.5 rounded-full text-[var(--theme-muted)] hover:text-[var(--theme-fg)] hover:bg-[var(--theme-surface)] transition cursor-pointer"
                title="Dismiss"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* iOS / Fallback Installation Guide Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0" onClick={() => setShowIOSGuide(false)} />
          <div 
            className="relative max-w-sm w-full bg-[var(--theme-card)] border border-[var(--theme-border)] rounded-3xl p-6 shadow-2xl z-10 text-[var(--theme-fg)] space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl p-1 bg-[var(--theme-surface)] border border-[var(--theme-border)] flex items-center justify-center shadow-md">
                  <img src="/in.svg" alt="GrooveEstrella" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-[var(--theme-fg)]">Install GrooveEstrella</h3>
                  <p className="text-[11px] text-[var(--theme-muted)]">Add to your Home Screen</p>
                </div>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="p-1.5 rounded-full text-[var(--theme-muted)] hover:text-[var(--theme-fg)] hover:bg-[var(--theme-surface)] transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Step-by-Step Instructions */}
            <div className="space-y-3 bg-[var(--theme-surface)]/60 border border-[var(--theme-border)] rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[var(--theme-card)] border border-[var(--theme-border)] text-[var(--theme-accent)] flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                  1
                </div>
                <div className="text-xs text-[var(--theme-fg)]">
                  Tap the <strong className="font-bold text-[var(--theme-accent)]">Share button</strong> (
                  <Share2 size={13} className="inline mx-1 text-[var(--theme-accent)]" />
                  ) in the browser toolbar at the bottom of the screen.
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[var(--theme-card)] border border-[var(--theme-border)] text-[var(--theme-accent)] flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                  2
                </div>
                <div className="text-xs text-[var(--theme-fg)]">
                  Scroll down the share sheet and tap <strong className="font-bold text-[var(--theme-accent)]">"Add to Home Screen"</strong> (
                  <PlusSquare size={13} className="inline mx-1 text-[var(--theme-accent)]" />
                  ).
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[var(--theme-card)] border border-[var(--theme-border)] text-[var(--theme-accent)] flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                  3
                </div>
                <div className="text-xs text-[var(--theme-fg)]">
                  Tap <strong className="font-bold text-[var(--theme-accent)]">"Add"</strong> in the top-right corner to finish installing.
                </div>
              </div>
            </div>

            {/* Benefits */}
            <div className="flex items-center justify-around text-center pt-1 text-[11px] text-[var(--theme-muted)]">
              <span className="flex items-center gap-1">
                <CheckCircle2 size={13} className="text-[var(--theme-accent)]" /> Fullscreen
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <CheckCircle2 size={13} className="text-[var(--theme-accent)]" /> Offline Lore
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <CheckCircle2 size={13} className="text-[var(--theme-accent)]" /> Zero App Store
              </span>
            </div>

            {/* Got It Button */}
            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-2.5 bg-[var(--theme-accent)] hover:opacity-95 text-[var(--theme-accent-fg)] font-bold text-xs rounded-full transition shadow-md cursor-pointer"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}