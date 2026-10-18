// src/Components/ExportPlaylistModal.jsx
"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, FileText, Share2, Disc, Code, Sparkles, Check, Copy } from "lucide-react";
import { 
  generateM3U, 
  generateCUE, 
  generateTXT, 
  generateJSON, 
  downloadFile 
} from "@/lib/playlistFileFormats";
import { toast } from "@/lib/toast";

export default function ExportPlaylistModal({ 
  isOpen, 
  onClose, 
  playlist, 
  tracks = [] 
}) {
  const [selectedFormat, setSelectedFormat] = useState("m3u");
  const [copied, setCopied] = useState(false);

  const effectiveTracks = useMemo(() => {
    if (Array.isArray(tracks) && tracks.length > 0) return tracks;
    if (Array.isArray(playlist?.tracks?.items)) return playlist.tracks.items;
    if (Array.isArray(playlist?.tracks)) return playlist.tracks;
    return [];
  }, [tracks, playlist]);

  if (!isOpen || !playlist) return null;

  const formats = [
    {
      id: "m3u",
      name: "Extended M3U",
      ext: ".m3u",
      desc: "Standard music player & streaming playlist format with song metadata",
      icon: <Disc size={18} className="text-[var(--theme-accent)]" />
    },
    {
      id: "m3u8",
      name: "UTF-8 M3U8",
      ext: ".m3u8",
      desc: "Unicode-compatible playlist format for global players & mobile",
      icon: <Disc size={18} className="text-sky-400" />
    },
    {
      id: "cue",
      name: "Audiophile CUE Sheet",
      ext: ".cue",
      desc: "High-fidelity album/CD track index sheet with performers and timestamps",
      icon: <Sparkles size={18} className="text-amber-400" />
    },
    {
      id: "txt",
      name: "Clean Text Tracklist",
      ext: ".txt",
      desc: "Human-readable list of songs, artists, durations, and links",
      icon: <FileText size={18} className="text-emerald-400" />
    },
    {
      id: "json",
      name: "Portable Groove JSON",
      ext: ".json",
      desc: "Complete lossless backup that can be imported back into GrooveEstrella anytime",
      icon: <Code size={18} className="text-rose-400" />
    }
  ];

  const sanitizeName = (name) => {
    return (name || "playlist").replace(/[^a-z0-9_\-\s]/gi, "").trim().replace(/\s+/g, "_");
  };

  const getFileContent = (fmt) => {
    switch (fmt) {
      case "m3u":
        return { content: generateM3U(playlist, effectiveTracks, false), mime: "audio/x-mpegurl" };
      case "m3u8":
        return { content: generateM3U(playlist, effectiveTracks, true), mime: "application/x-mpegurl" };
      case "cue":
        return { content: generateCUE(playlist, effectiveTracks), mime: "application/x-cue" };
      case "txt":
        return { content: generateTXT(playlist, effectiveTracks), mime: "text/plain" };
      case "json":
        return { content: generateJSON(playlist, effectiveTracks), mime: "application/json" };
      default:
        return { content: generateM3U(playlist, effectiveTracks, false), mime: "text/plain" };
    }
  };

  const handleDownload = () => {
    const { content, mime } = getFileContent(selectedFormat);
    const filename = `${sanitizeName(playlist.name)}.${selectedFormat}`;
    downloadFile(filename, content, mime);
    toast.success(`Downloaded "${filename}"! 📁`);
    onClose();
  };

  const handleNativeShareFile = async () => {
    const { content, mime } = getFileContent(selectedFormat);
    const filename = `${sanitizeName(playlist.name)}.${selectedFormat}`;

    try {
      const file = new File([content], filename, { type: mime });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: playlist.name,
          text: `Check out my playlist "${playlist.name}" on GrooveEstrella!`
        });
        toast.success("Shared playlist file!");
        onClose();
        return;
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        console.warn("Native file sharing not supported, downloading instead:", err);
      } else {
        return;
      }
    }

    // Fallback: download directly
    handleDownload();
  };

  const handleCopyTracklist = () => {
    const { content } = getFileContent("txt");
    if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText(content);
      setCopied(true);
      toast.success("Tracklist text copied to clipboard! 📋");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/75 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 16 }}
          transition={{ type: "spring", stiffness: 450, damping: 30 }}
          className="relative w-full max-w-md bg-[var(--theme-card)]/95 backdrop-blur-2xl border border-[var(--theme-border)] rounded-3xl p-6 shadow-2xl z-10 text-[var(--theme-fg)]"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[var(--theme-accent)]/20 text-[var(--theme-accent)] flex items-center justify-center">
                <Download size={16} />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold tracking-tight">Export & Share Playlist</h3>
                <p className="text-[11px] text-[var(--theme-muted)]">{effectiveTracks.length} tracks ready for export</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition"
            >
              <X size={18} />
            </button>
          </div>

          {/* Formats Selection List */}
          <div className="mt-4 space-y-2">
            <label className="text-[11px] font-bold tracking-wider uppercase text-[var(--theme-muted)]">
              Select Playlist Format
            </label>
            <div className="space-y-1.5 max-h-[260px] overflow-y-auto pr-1">
              {formats.map((fmt) => {
                const isSelected = selectedFormat === fmt.id;
                return (
                  <div
                    key={fmt.id}
                    onClick={() => setSelectedFormat(fmt.id)}
                    className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition ${
                      isSelected
                        ? "bg-white/10 border-[var(--theme-accent)] shadow-sm"
                        : "bg-white/[0.02] border-white/10 hover:border-white/20 hover:bg-white/5"
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">{fmt.icon}</div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs sm:text-sm font-bold text-white">{fmt.name}</span>
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-white/10 text-white/70">
                          {fmt.ext}
                        </span>
                      </div>
                      <p className="text-[11px] text-white/50 leading-tight mt-0.5">{fmt.desc}</p>
                    </div>
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-1 ${
                      isSelected ? "border-[var(--theme-accent)] bg-[var(--theme-accent)] text-[var(--theme-bg)]" : "border-white/30"
                    }`}>
                      {isSelected && <Check size={10} strokeWidth={4} />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center gap-2.5">
            <button
              onClick={handleDownload}
              className="w-full sm:flex-1 py-3 px-4 rounded-full bg-[var(--theme-accent)] hover:opacity-95 active:scale-95 text-[var(--theme-accent-fg)] text-xs sm:text-sm font-bold tracking-wide flex items-center justify-center gap-2 shadow-lg transition cursor-pointer"
            >
              <Download size={15} />
              <span>Download File</span>
            </button>

            <button
              onClick={handleNativeShareFile}
              className="w-full sm:w-auto py-3 px-4 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white text-xs sm:text-sm font-bold tracking-wide flex items-center justify-center gap-2 transition border border-white/15 cursor-pointer"
              title="Share File Directly via Device Sheet"
            >
              <Share2 size={15} />
              <span className="sm:inline">Share</span>
            </button>

            <button
              onClick={handleCopyTracklist}
              className="w-full sm:w-auto py-3 px-4 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white text-xs sm:text-sm font-bold tracking-wide flex items-center justify-center gap-2 transition border border-white/15 cursor-pointer whitespace-nowrap"
              title="Copy Tracklist to Clipboard"
            >
              {copied ? <Check size={15} className="text-emerald-400" /> : <Copy size={15} />}
              <span>{copied ? "Copied!" : "Copy to Clipboard"}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
