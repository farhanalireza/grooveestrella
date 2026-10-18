// src/Components/ImportPlaylistModal.jsx
"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, UploadCloud, FileText, Check, Music } from "lucide-react";
import { parsePlaylistFile } from "@/lib/playlistFileFormats";
import { toast } from "@/lib/toast";
import { extractPlaylistCovers } from "@/Components/PlaylistCover";

export default function ImportPlaylistModal({ 
  isOpen, 
  onClose, 
  onPlaylistImported 
}) {
  const router = useRouter();
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  if (!isOpen) return null;

  const handleFileProcess = (selectedFile) => {
    if (!selectedFile) return;

    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      try {
        const parsed = parsePlaylistFile(text, selectedFile.name);
        setPreview(parsed);
      } catch (err) {
        console.error("Error parsing playlist file:", err);
        toast.error("Could not parse this file format.");
        setPreview(null);
      }
    };
    reader.readAsText(selectedFile);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer?.files?.[0];
    if (droppedFile) {
      handleFileProcess(droppedFile);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleConfirmImport = () => {
    if (!preview || !preview.tracks || preview.tracks.length === 0) {
      toast.error("No valid songs found in the file.");
      return;
    }

    setLoading(true);
    try {
      const customPlaylists = JSON.parse(localStorage.getItem("customPlaylists") || "[]");
      const newId = `custom-${Date.now()}`;
      const newPlaylist = {
        id: newId,
        name: preview.name || "Imported Playlist",
        description: preview.description || `Imported from ${file?.name || "file"}`,
        createdAt: new Date().toISOString(),
        owner: { display_name: "Local Library" },
        image: preview.image || extractPlaylistCovers(preview.tracks)[0] || "",
        images: (preview.image || extractPlaylistCovers(preview.tracks)[0]) ? [{ url: preview.image || extractPlaylistCovers(preview.tracks)[0] }] : [],
        tracks: {
          total: preview.tracks.length,
          items: preview.tracks
        }
      };

      customPlaylists.unshift(newPlaylist);
      localStorage.setItem("customPlaylists", JSON.stringify(customPlaylists));

      toast.success(`Imported "${newPlaylist.name}" with ${newPlaylist.tracks.total} songs! 🎶`);
      onClose();

      if (onPlaylistImported) {
        onPlaylistImported(newPlaylist);
      }

      router.push(`/playlist/${newId}`);
    } catch (err) {
      console.error("Failed to save imported playlist:", err);
      toast.error("Failed to import playlist.");
    } finally {
      setLoading(false);
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
                <UploadCloud size={16} />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold tracking-tight">Import Playlist File</h3>
                <p className="text-[11px] text-[var(--theme-muted)]">Supports M3U, M3U8, CUE, TXT, JSON</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition"
            >
              <X size={18} />
            </button>
          </div>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".m3u,.m3u8,.cue,.txt,.json"
            className="hidden"
            onChange={(e) => handleFileProcess(e.target.files?.[0])}
          />

          {/* Drag & Drop Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`mt-4 p-6 rounded-2xl border-2 border-dashed transition cursor-pointer flex flex-col items-center justify-center text-center gap-2.5 ${
              isDragging
                ? "border-[var(--theme-accent)] bg-[var(--theme-accent)]/10"
                : "border-white/15 bg-white/[0.02] hover:bg-white/5 hover:border-white/25"
            }`}
          >
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-[var(--theme-accent)]">
              <UploadCloud size={24} />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-white">
                {file ? file.name : "Click to browse or drop file here"}
              </p>
              <p className="text-[11px] text-white/50 mt-0.5">
                .m3u, .m3u8, .cue, .txt, or .json
              </p>
            </div>
          </div>

          {/* File Preview */}
          {preview && (
            <div className="mt-4 p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-[var(--theme-accent)]/20 text-[var(--theme-accent)] flex items-center justify-center shrink-0">
                  <Music size={15} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-bold text-white truncate">{preview.name}</p>
                  <p className="text-[11px] text-white/50">{preview.tracks?.length || 0} songs detected</p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 shrink-0">
                <Check size={10} strokeWidth={3} />
                <span>Ready</span>
              </span>
            </div>
          )}

          {/* Footer actions */}
          <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-end gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-full text-xs font-bold text-white/70 hover:text-white transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmImport}
              disabled={!preview || loading}
              className="py-2.5 px-6 rounded-full bg-[var(--theme-accent)] hover:opacity-95 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-[var(--theme-accent-fg)] text-xs sm:text-sm font-bold tracking-wide shadow-lg transition cursor-pointer flex items-center gap-1.5"
            >
              <span>{loading ? "Importing..." : "Import Playlist"}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
