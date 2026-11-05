// src/Components/ArtistDetailsDrawer.jsx
"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Users, 
  User, 
  Calendar, 
  MapPin, 
  Sparkles, 
  Music, 
  Award, 
  ChevronRight, 
  FileText, 
  Info, 
  Layers,
  HeartHandshake,
  CheckCircle2,
  Clock
} from "lucide-react";

export default function ArtistDetailsDrawer({
  isOpen,
  onClose,
  artist = {},
  members = { og: [], current: [], past: [], supporting: [] },
  bands = [],
  collaborations = [],
  description = "",
  isGroup = false,
}) {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("lineup");

  useEffect(() => {
    setMounted(true);
  }, []);

  // Set default tab based on whether it's a group or solo artist
  useEffect(() => {
    if (isGroup) {
      setActiveTab("lineup");
    } else if (bands && bands.length > 0) {
      setActiveTab("bands");
    } else {
      setActiveTab("bio");
    }
  }, [isGroup, bands?.length]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose?.();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!mounted) return null;

  const lifeSpan = artist.lifeSpan || {};
  const beginYear = lifeSpan.begin ? lifeSpan.begin.split("-")[0] : null;
  const endYear = lifeSpan.end ? lifeSpan.end.split("-")[0] : null;
  const isEnded = lifeSpan.ended || !!endYear;

  const currentMembersList = members.current || [];
  const ogMembersList = members.og || [];
  const pastMembersList = members.past || [];
  const supportingMusiciansList = members.supporting || [];

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex flex-col justify-end md:justify-center items-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-md cursor-pointer"
          />

          {/* Movable Pull-Down Sheet Container */}
          <motion.div
            initial={{ y: "100%", opacity: 0.8 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.05, bottom: 0.7 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 70 || info.velocity.y > 250) {
                onClose?.();
              }
            }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-xl md:max-w-2xl bg-[var(--theme-card)] border-t md:border border-[var(--theme-border)] rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col max-h-[88vh] z-10 font-sans overflow-hidden touch-pan-y"
          >
            {/* Grab Handle for Pull-Down Gesture */}
            <div 
              className="flex flex-col items-center justify-center pt-2.5 pb-2 cursor-grab active:cursor-grabbing select-none w-full border-b border-[var(--theme-border)]/50 active:bg-white/5 transition-colors shrink-0"
              onClick={onClose}
              title="Pull down or tap to close"
            >
              <div className="w-12 h-1.5 rounded-full bg-[var(--theme-fg)]/25 hover:bg-[var(--theme-fg)]/40 transition-colors" />
              <span className="text-[9px] font-bold tracking-widest uppercase text-[var(--theme-muted)] mt-1">
                Pull down to close
              </span>
            </div>

            {/* Drawer Header */}
            <div className="px-5 py-4 border-b border-[var(--theme-border)] bg-[var(--theme-surface)]/85 backdrop-blur-xl flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-[var(--theme-accent)]/15 border border-[var(--theme-accent)]/30 flex items-center justify-center shrink-0 text-[var(--theme-accent)]">
                  {isGroup ? <Users size={20} /> : <User size={20} />}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-extrabold text-[var(--theme-fg)] truncate">
                      {artist.name || "Artist Details"}
                    </h2>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[var(--theme-accent)]/20 text-[var(--theme-accent)] shrink-0 border border-[var(--theme-accent)]/30">
                      {isGroup ? "Band / Group" : "Solo Artist"}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--theme-muted)] truncate flex items-center gap-1.5 mt-0.5">
                    {artist.area || artist.country ? (
                      <span className="flex items-center gap-1">
                        <MapPin size={12} />
                        {artist.area ? `${artist.area}, ` : ""}{artist.country || "Global"}
                      </span>
                    ) : null}
                    {beginYear && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          {isGroup 
                            ? `Formed ${beginYear}${endYear ? ` · Disbanded ${endYear}` : " · Active"}`
                            : `${beginYear}${endYear ? ` – ${endYear}` : " – Present"}`
                          }
                        </span>
                      </>
                    )}
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 active:scale-95 text-[var(--theme-fg)] flex items-center justify-center transition border border-[var(--theme-border)] cursor-pointer shrink-0 ml-3"
                title="Close Drawer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="px-4 py-2.5 border-b border-[var(--theme-border)] bg-[var(--theme-bg)]/40 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
              {isGroup && (
                <button
                  onClick={() => setActiveTab("lineup")}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    activeTab === "lineup"
                      ? "bg-[var(--theme-accent)] text-[var(--theme-accent-fg)] shadow-sm"
                      : "bg-[var(--theme-surface)] text-[var(--theme-muted)] hover:text-[var(--theme-fg)] border border-[var(--theme-border)]"
                  }`}
                >
                  <Users size={14} />
                  <span>Band Lineup</span>
                  <span className="text-[10px] opacity-80 font-mono">
                    ({currentMembersList.length + pastMembersList.length})
                  </span>
                </button>
              )}

              {!isGroup && bands.length > 0 && (
                <button
                  onClick={() => setActiveTab("bands")}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    activeTab === "bands"
                      ? "bg-[var(--theme-accent)] text-[var(--theme-accent-fg)] shadow-sm"
                      : "bg-[var(--theme-surface)] text-[var(--theme-muted)] hover:text-[var(--theme-fg)] border border-[var(--theme-border)]"
                  }`}
                >
                  <Layers size={14} />
                  <span>Bands & Groups</span>
                  <span className="text-[10px] opacity-80 font-mono">({bands.length})</span>
                </button>
              )}

              {collaborations.length > 0 && (
                <button
                  onClick={() => setActiveTab("collabs")}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    activeTab === "collabs"
                      ? "bg-[var(--theme-accent)] text-[var(--theme-accent-fg)] shadow-sm"
                      : "bg-[var(--theme-surface)] text-[var(--theme-muted)] hover:text-[var(--theme-fg)] border border-[var(--theme-border)]"
                  }`}
                >
                  <HeartHandshake size={14} />
                  <span>Collaborations</span>
                  <span className="text-[10px] opacity-80 font-mono">({collaborations.length})</span>
                </button>
              )}

              <button
                onClick={() => setActiveTab("bio")}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  activeTab === "bio"
                    ? "bg-[var(--theme-accent)] text-[var(--theme-accent-fg)] shadow-sm"
                    : "bg-[var(--theme-surface)] text-[var(--theme-muted)] hover:text-[var(--theme-fg)] border border-[var(--theme-border)]"
                }`}
              >
                <FileText size={14} />
                <span>Biography & Lore</span>
              </button>

              <button
                onClick={() => setActiveTab("facts")}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  activeTab === "facts"
                    ? "bg-[var(--theme-accent)] text-[var(--theme-accent-fg)] shadow-sm"
                    : "bg-[var(--theme-surface)] text-[var(--theme-muted)] hover:text-[var(--theme-fg)] border border-[var(--theme-border)]"
                }`}
              >
                <Info size={14} />
                <span>Facts & Origins</span>
              </button>
            </div>

            {/* Tab Content Body */}
            <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5 space-y-6">
              {/* GROUP LINEUP TAB */}
              {activeTab === "lineup" && isGroup && (
                <div className="space-y-6">
                  {/* Current Active Lineup */}
                  {currentMembersList.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <CheckCircle2 size={16} className="text-emerald-500" />
                        <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-[var(--theme-fg)]">
                          Active / Current Lineup ({currentMembersList.length})
                        </h3>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {currentMembersList.map((m, idx) => (
                          <Link
                            key={`${m.id || idx}-current`}
                            href={`/artist/${m.id}`}
                            onClick={onClose}
                            className="group p-3 rounded-2xl bg-[var(--theme-surface)]/70 hover:bg-[var(--theme-surface)] border border-[var(--theme-border)] hover:border-[var(--theme-accent)]/50 transition flex items-center justify-between shadow-sm cursor-pointer"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs sm:text-sm font-bold text-[var(--theme-fg)] group-hover:text-[var(--theme-accent)] transition-colors truncate">
                                  {m.name}
                                </span>
                                {m.roles?.some(r => /original|founder/i.test(r)) && (
                                  <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
                                    OG
                                  </span>
                                )}
                              </div>
                              {m.roles && m.roles.length > 0 && (
                                <p className="text-[11px] text-[var(--theme-muted)] truncate mt-0.5">
                                  {m.roles.filter(r => !/original|founder/i.test(r)).join(", ") || "Member"}
                                </p>
                              )}
                            </div>
                            <ChevronRight size={15} className="text-[var(--theme-muted)] group-hover:text-[var(--theme-accent)] transition shrink-0 ml-2" />
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* OG / Founding Members (if distinct from current) */}
                  {ogMembersList.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles size={16} className="text-amber-400" />
                        <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-[var(--theme-fg)]">
                          Founding / OG Members ({ogMembersList.length})
                        </h3>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {ogMembersList.map((m, idx) => (
                          <Link
                            key={`${m.id || idx}-og`}
                            href={`/artist/${m.id}`}
                            onClick={onClose}
                            className="group p-3 rounded-2xl bg-[var(--theme-surface)]/70 hover:bg-[var(--theme-surface)] border border-[var(--theme-border)] hover:border-amber-400/50 transition flex items-center justify-between shadow-sm cursor-pointer"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs sm:text-sm font-bold text-[var(--theme-fg)] group-hover:text-amber-400 transition-colors truncate">
                                  {m.name}
                                </span>
                                <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
                                  Founder
                                </span>
                              </div>
                              <p className="text-[11px] text-[var(--theme-muted)] truncate mt-0.5">
                                {m.roles?.filter(r => !/original|founder/i.test(r)).join(", ") || (m.ended ? "Former Member" : "Current Member")}
                                {m.begin || m.end ? ` (${m.begin?.split("-")[0] || ""} – ${m.end?.split("-")[0] || (m.ended ? "" : "Present")})` : ""}
                              </p>
                            </div>
                            <ChevronRight size={15} className="text-[var(--theme-muted)] group-hover:text-amber-400 transition shrink-0 ml-2" />
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Past Members */}
                  {pastMembersList.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Clock size={16} className="text-[var(--theme-muted)]" />
                        <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-[var(--theme-muted)]">
                          Past Members ({pastMembersList.length})
                        </h3>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {pastMembersList.map((m, idx) => (
                          <Link
                            key={`${m.id || idx}-past`}
                            href={`/artist/${m.id}`}
                            onClick={onClose}
                            className="group p-3 rounded-2xl bg-[var(--theme-surface)]/50 hover:bg-[var(--theme-surface)] border border-[var(--theme-border)]/70 hover:border-[var(--theme-accent)]/50 transition flex items-center justify-between shadow-sm cursor-pointer"
                          >
                            <div className="min-w-0 flex-1">
                              <span className="text-xs sm:text-sm font-bold text-[var(--theme-fg)] group-hover:text-[var(--theme-accent)] transition-colors truncate block">
                                {m.name}
                              </span>
                              <p className="text-[11px] text-[var(--theme-muted)] truncate mt-0.5">
                                {m.roles?.join(", ") || "Former Member"}
                                {m.begin || m.end ? ` · ${m.begin?.split("-")[0] || ""} – ${m.end?.split("-")[0] || ""}` : ""}
                              </p>
                            </div>
                            <ChevronRight size={15} className="text-[var(--theme-muted)] group-hover:text-[var(--theme-accent)] transition shrink-0 ml-2" />
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Supporting / Touring Musicians */}
                  {supportingMusiciansList.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Music size={16} className="text-blue-400" />
                        <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-[var(--theme-muted)]">
                          Supporting & Touring Musicians ({supportingMusiciansList.length})
                        </h3>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {supportingMusiciansList.map((m, idx) => (
                          <Link
                            key={`${m.id || idx}-support`}
                            href={`/artist/${m.id}`}
                            onClick={onClose}
                            className="group p-3 rounded-2xl bg-[var(--theme-surface)]/40 hover:bg-[var(--theme-surface)] border border-[var(--theme-border)]/60 hover:border-blue-400/50 transition flex items-center justify-between shadow-sm cursor-pointer"
                          >
                            <div className="min-w-0 flex-1">
                              <span className="text-xs sm:text-sm font-bold text-[var(--theme-fg)] group-hover:text-blue-400 transition-colors truncate block">
                                {m.name}
                              </span>
                              <p className="text-[11px] text-[var(--theme-muted)] truncate mt-0.5">
                                {m.roles?.join(", ") || "Touring / Guest Musician"}
                              </p>
                            </div>
                            <ChevronRight size={15} className="text-[var(--theme-muted)] group-hover:text-blue-400 transition shrink-0 ml-2" />
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {currentMembersList.length === 0 && ogMembersList.length === 0 && pastMembersList.length === 0 && (
                    <div className="py-8 text-center text-[var(--theme-muted)]">
                      <p className="text-sm">Detailed member relations not cataloged in open database.</p>
                      <p className="text-xs mt-1">See the biography tab for editorial band history.</p>
                    </div>
                  )}
                </div>
              )}

              {/* SOLO ARTIST BANDS TAB */}
              {activeTab === "bands" && !isGroup && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Layers size={16} className="text-[var(--theme-accent)]" />
                    <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-[var(--theme-fg)]">
                      Bands & Groups Belonged To ({bands.length})
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {bands.map((b, idx) => (
                      <Link
                        key={`${b.id || idx}-band`}
                        href={`/artist/${b.id}`}
                        onClick={onClose}
                        className="group p-3.5 rounded-2xl bg-[var(--theme-surface)]/70 hover:bg-[var(--theme-surface)] border border-[var(--theme-border)] hover:border-[var(--theme-accent)]/50 transition flex items-center justify-between shadow-sm cursor-pointer"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-extrabold text-[var(--theme-fg)] group-hover:text-[var(--theme-accent)] transition-colors truncate">
                              {b.name}
                            </span>
                            <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-[var(--theme-card)] text-[var(--theme-accent)] border border-[var(--theme-border)] shrink-0">
                              Band
                            </span>
                          </div>
                          {b.roles && b.roles.length > 0 && (
                            <p className="text-xs text-[var(--theme-muted)] truncate mt-1">
                              Role: {b.roles.join(", ")}
                            </p>
                          )}
                          {(b.begin || b.end) && (
                            <p className="text-[11px] font-mono text-[var(--theme-muted)] mt-0.5">
                              {b.begin?.split("-")[0] || ""} – {b.end?.split("-")[0] || (b.ended ? "" : "Present")}
                            </p>
                          )}
                        </div>
                        <ChevronRight size={16} className="text-[var(--theme-muted)] group-hover:text-[var(--theme-accent)] transition shrink-0 ml-2" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* COLLABORATIONS TAB */}
              {activeTab === "collabs" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-3">
                    <HeartHandshake size={16} className="text-[var(--theme-accent)]" />
                    <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-[var(--theme-fg)]">
                      Collaborations & Associated Acts ({collaborations.length})
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {collaborations.map((c, idx) => (
                      <Link
                        key={`${c.id || idx}-collab`}
                        href={`/artist/${c.id}`}
                        onClick={onClose}
                        className="group p-3.5 rounded-2xl bg-[var(--theme-surface)]/70 hover:bg-[var(--theme-surface)] border border-[var(--theme-border)] hover:border-[var(--theme-accent)]/50 transition flex items-center justify-between shadow-sm cursor-pointer"
                      >
                        <div className="min-w-0 flex-1">
                          <span className="text-sm font-extrabold text-[var(--theme-fg)] group-hover:text-[var(--theme-accent)] transition-colors truncate block">
                            {c.name}
                          </span>
                          <p className="text-xs text-[var(--theme-muted)] capitalize truncate mt-0.5">
                            {(c.relationType || "collaborator").replace(/_/g, " ")}
                          </p>
                        </div>
                        <ChevronRight size={16} className="text-[var(--theme-muted)] group-hover:text-[var(--theme-accent)] transition shrink-0 ml-2" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* BIOGRAPHY & LORE TAB */}
              {activeTab === "bio" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText size={16} className="text-[var(--theme-accent)]" />
                    <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-[var(--theme-fg)]">
                      Biography & History
                    </h3>
                  </div>
                  {description ? (
                    <div className="p-4 rounded-2xl bg-[var(--theme-surface)]/60 border border-[var(--theme-border)] leading-relaxed text-xs sm:text-sm text-[var(--theme-fg)]/90 space-y-3 font-body">
                      {description.split("\n\n").map((para, i) => (
                        <p key={i}>{para}</p>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-[var(--theme-muted)]">
                      <p className="text-sm">No editorial biography available for this artist.</p>
                    </div>
                  )}
                </div>
              )}

              {/* FACTS & ORIGINS TAB */}
              {activeTab === "facts" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Info size={16} className="text-[var(--theme-accent)]" />
                    <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-[var(--theme-fg)]">
                      Catalog Facts & Origins
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-2xl bg-[var(--theme-surface)]/60 border border-[var(--theme-border)]">
                      <span className="text-[10px] uppercase font-bold text-[var(--theme-muted)] block">Entity Type</span>
                      <p className="text-sm font-extrabold text-[var(--theme-fg)] mt-0.5">
                        {artist.type || (isGroup ? "Group / Band" : "Person / Artist")}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-[var(--theme-surface)]/60 border border-[var(--theme-border)]">
                      <span className="text-[10px] uppercase font-bold text-[var(--theme-muted)] block">
                        {isGroup ? "Origin Country" : "Country of Citizenship"}
                      </span>
                      <p className="text-sm font-extrabold text-[var(--theme-fg)] mt-0.5">
                        {artist.country || "Global"}
                      </p>
                    </div>

                    {artist.area && (
                      <div className="p-3.5 rounded-2xl bg-[var(--theme-surface)]/60 border border-[var(--theme-border)]">
                        <span className="text-[10px] uppercase font-bold text-[var(--theme-muted)] block">
                          {isGroup ? "Formed In / Base" : "Birthplace / Area"}
                        </span>
                        <p className="text-sm font-extrabold text-[var(--theme-fg)] mt-0.5">
                          {artist.area}
                        </p>
                      </div>
                    )}

                    {beginYear && (
                      <div className="p-3.5 rounded-2xl bg-[var(--theme-surface)]/60 border border-[var(--theme-border)]">
                        <span className="text-[10px] uppercase font-bold text-[var(--theme-muted)] block">
                          {isGroup ? "Formation Year" : "Birth Date"}
                        </span>
                        <p className="text-sm font-extrabold text-[var(--theme-fg)] mt-0.5 font-mono">
                          {lifeSpan.begin || beginYear}
                        </p>
                      </div>
                    )}

                    {endYear && (
                      <div className="p-3.5 rounded-2xl bg-[var(--theme-surface)]/60 border border-[var(--theme-border)]">
                        <span className="text-[10px] uppercase font-bold text-[var(--theme-muted)] block">
                          {isGroup ? "Disbanded / Hiatus" : "Death Date"}
                        </span>
                        <p className="text-sm font-extrabold text-[var(--theme-fg)] mt-0.5 font-mono">
                          {lifeSpan.end || endYear}
                        </p>
                      </div>
                    )}

                    {artist.gender && (
                      <div className="p-3.5 rounded-2xl bg-[var(--theme-surface)]/60 border border-[var(--theme-border)]">
                        <span className="text-[10px] uppercase font-bold text-[var(--theme-muted)] block">Gender</span>
                        <p className="text-sm font-extrabold text-[var(--theme-fg)] mt-0.5 capitalize">
                          {artist.gender}
                        </p>
                      </div>
                    )}

                    {artist.disambiguation && (
                      <div className="p-3.5 rounded-2xl bg-[var(--theme-surface)]/60 border border-[var(--theme-border)] sm:col-span-2">
                        <span className="text-[10px] uppercase font-bold text-[var(--theme-muted)] block">Catalog Note</span>
                        <p className="text-xs text-[var(--theme-fg)] mt-0.5">
                          {artist.disambiguation}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Footer */}
            <div className="p-3 border-t border-[var(--theme-border)] bg-[var(--theme-surface)]/80 flex items-center justify-between text-[11px] text-[var(--theme-muted)] shrink-0 px-4">
              <span>Catalog Entity ID: {artist.id ? `${artist.id.slice(0, 8)}...` : "Open Data"}</span>
              <button
                onClick={onClose}
                className="px-3 py-1 rounded-xl bg-[var(--theme-surface)] hover:bg-[var(--theme-card)] text-[var(--theme-fg)] font-bold text-xs transition cursor-pointer border border-[var(--theme-border)]"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
