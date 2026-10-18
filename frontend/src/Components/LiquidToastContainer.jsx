// src/Components/LiquidToastContainer.jsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Sparkles, AlertCircle, AlertTriangle, X } from "lucide-react";

export default function LiquidToastContainer() {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    const handleAddToast = (e) => {
      const newToast = e.detail;
      if (!newToast || !newToast.id) return;

      setToasts((prev) => {
        // Keep max 3 toasts to maintain ultra-minimal aesthetics
        const next = [newToast, ...prev.filter((t) => t.id !== newToast.id)].slice(0, 3);
        return next;
      });

      // Auto dismiss
      if (newToast.duration && newToast.duration > 0) {
        setTimeout(() => {
          removeToast(newToast.id);
        }, newToast.duration);
      }
    };

    const handleDismissToast = (e) => {
      const { id } = e.detail || {};
      if (id) {
        removeToast(id);
      } else {
        setToasts([]);
      }
    };

    window.addEventListener("groove-liquid-toast", handleAddToast);
    window.addEventListener("groove-liquid-toast-dismiss", handleDismissToast);

    return () => {
      window.removeEventListener("groove-liquid-toast", handleAddToast);
      window.removeEventListener("groove-liquid-toast-dismiss", handleDismissToast);
    };
  }, [removeToast]);

  return (
    <div 
      className="fixed top-5 sm:top-6 inset-x-0 z-[999999] pointer-events-none flex flex-col items-center gap-2.5 px-4 select-none"
      aria-live="polite"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => {
          const type = toast.type || "info";

          // Liquid theme accent colors
          let glowColor = "from-[var(--theme-accent)]/35 via-[#E8A87C]/20 to-transparent";
          let badgeBg = "bg-[var(--theme-accent)]/15 border-[var(--theme-accent)]/30 text-[var(--theme-accent)]";
          let icon = <Check size={13} strokeWidth={3} className="text-[var(--theme-accent)]" />;

          if (type === "info") {
            glowColor = "from-sky-500/35 via-cyan-400/20 to-transparent";
            badgeBg = "bg-sky-500/15 border-sky-400/30 text-sky-400";
            icon = <Sparkles size={13} strokeWidth={2.5} className="text-sky-400" />;
          } else if (type === "error") {
            glowColor = "from-rose-500/40 via-red-500/20 to-transparent";
            badgeBg = "bg-rose-500/15 border-rose-400/30 text-rose-400";
            icon = <AlertCircle size={13} strokeWidth={2.5} className="text-rose-400" />;
          } else if (type === "warning") {
            glowColor = "from-amber-500/35 via-yellow-400/20 to-transparent";
            badgeBg = "bg-amber-500/15 border-amber-400/30 text-amber-400";
            icon = <AlertTriangle size={13} strokeWidth={2.5} className="text-amber-400" />;
          }

          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: -24, scale: 0.88, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -16, scale: 0.92, filter: "blur(6px)", transition: { duration: 0.2 } }}
              transition={{ type: "spring", stiffness: 480, damping: 28, mass: 0.8 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => removeToast(toast.id)}
              className="pointer-events-auto relative group flex items-center gap-3 px-4 py-2.5 sm:px-5 sm:py-3 rounded-full cursor-pointer overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.65),inset_0_1px_1px_rgba(255,255,255,0.35)] border border-white/20 backdrop-blur-3xl bg-[#17020B]/85 text-[#FFF2DF] max-w-md"
            >
              {/* Liquid Ambient Aura Behind Pill */}
              <div 
                className={`absolute inset-0 -z-10 bg-gradient-to-r ${glowColor} blur-xl opacity-75 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`}
              />

              {/* Liquid Specular Top Highlight Sweep */}
              <div className="absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />

              {/* Status Badge Icon */}
              <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border ${badgeBg} shadow-sm`}>
                {icon}
              </div>

              {/* Message text */}
              <span className="text-xs sm:text-[13px] font-semibold tracking-tight text-white/95 leading-snug">
                {toast.message}
              </span>

              {/* Subtle Dismiss Cross */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeToast(toast.id);
                }}
                className="ml-1 p-0.5 rounded-full text-white/40 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                title="Dismiss"
              >
                <X size={13} />
              </button>

              {/* Fluid Progress Bar Line */}
              {toast.duration > 0 && (
                <motion.div
                  initial={{ scaleX: 1 }}
                  animate={{ scaleX: 0 }}
                  transition={{ duration: toast.duration / 1000, ease: "linear" }}
                  style={{ transformOrigin: "left" }}
                  className="absolute bottom-0 inset-x-3 h-[2px] rounded-full bg-gradient-to-r from-[var(--theme-accent)] via-white/50 to-[var(--theme-accent)] opacity-80"
                />
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
