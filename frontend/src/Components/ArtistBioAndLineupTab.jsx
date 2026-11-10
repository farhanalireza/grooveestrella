// src/Components/ArtistBioAndLineupTab.jsx
"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { 
  Users, 
  Sparkles, 
  CheckCircle2, 
  ChevronRight, 
  Calendar, 
  MapPin, 
  Disc, 
  BookOpen, 
  Clock, 
  Layers, 
  HeartHandshake,
  Info
} from "lucide-react";

function formatSafeYear(val) {
  if (!val) return "";
  try {
    return String(val).split("-")[0];
  } catch (_) {
    return "";
  }
}

function formatYearSpan(begin, end, isEnded = false) {
  const b = formatSafeYear(begin);
  const e = formatSafeYear(end) || (isEnded ? "" : "Present");
  if (!b && !e) return isEnded ? "Past Member" : "";
  return `${b || "?"} – ${e || "Present"}`;
}

function formatSafeRoles(roles, isFounder = false) {
  if (!roles) return isFounder ? "Founder" : "Member";
  if (Array.isArray(roles)) {
    const clean = roles.filter(
      (r) => typeof r === "string" && !/original|founder/i.test(r)
    );
    return clean.length > 0 ? clean.join(", ") : isFounder ? "Founder" : "Member";
  }
  if (typeof roles === "string") return roles;
  return "Member";
}

export default function ArtistBioAndLineupTab({
  artist = {},
  isGroup = false,
  members = { og: [], current: [], past: [], supporting: [] },
  bands = [],
  collaborations = [],
  description = "",
}) {
  const currentMembers = Array.isArray(members?.current) ? members.current : [];
  const ogMembers = Array.isArray(members?.og) ? members.og : [];
  const pastMembers = Array.isArray(members?.past) ? members.past : [];
  const bandList = Array.isArray(bands) ? bands : [];
  const collabList = Array.isArray(collaborations) ? collaborations : [];

  const lifeSpan = artist.lifeSpan || {};
  const beginYear = formatSafeYear(lifeSpan.begin);
  const endYear = formatSafeYear(lifeSpan.end);
  const isEnded = lifeSpan.ended || !!endYear;

  const hasLineup =
    isGroup ||
    currentMembers.length > 0 ||
    ogMembers.length > 0 ||
    pastMembers.length > 0 ||
    bandList.length > 0 ||
    collabList.length > 0;

  // Split bio into clean paragraphs
  const paragraphs = useMemo(() => {
    if (!description || typeof description !== "string") return [];
    return description
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
  }, [description]);

  return (
    <div className="relative z-10 space-y-12 animate-fade-in max-w-4xl mx-auto pb-16">
      
      {/* 1. BAND LINEUP & PERSONNEL SECTION */}
      {hasLineup && (
        <section className="space-y-8">
          <div className="border-b border-[var(--theme-border)]/50 pb-3.5">
            <div className="flex items-center gap-2 text-xs font-bold text-[var(--theme-accent)] uppercase tracking-widest">
              <Users size={15} />
              <span>{isGroup ? "Band Personnel & Lineup History" : "Musical Projects & Bands"}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[var(--theme-fg)] tracking-tight font-display mt-0.5">
              {isGroup ? `${artist.name || "Band"} Lineup` : `Groups & Projects with ${artist.name || "Artist"}`}
            </h2>
          </div>

          {/* Founding Members */}
          {ogMembers.length > 0 && (
            <div className="space-y-3.5">
              <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={14} />
                <span>Founding Members ({ogMembers.length})</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {ogMembers.map((m, idx) => {
                  const years = formatYearSpan(m.begin, m.end, m.ended);
                  return (
                    <Link
                      key={`${m.id || idx}-founder`}
                      href={m.id ? `/artist/${m.id}` : "#"}
                      className="p-3.5 rounded-2xl bg-[var(--theme-surface)]/70 hover:bg-[var(--theme-card)] border border-amber-400/25 hover:border-amber-400 transition-all flex items-center justify-between group cursor-pointer shadow-xs"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-[var(--theme-fg)] group-hover:text-amber-300 transition-colors truncate">
                            {m.name || "Musician"}
                          </span>
                          <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-400/15 text-amber-300 border border-amber-400/30 shrink-0">
                            Founder
                          </span>
                        </div>
                        <p className="text-[11px] text-[var(--theme-muted)] truncate mt-0.5">
                          {formatSafeRoles(m.roles, true)}
                          {years ? ` (${years})` : ""}
                        </p>
                      </div>
                      <ChevronRight
                        size={14}
                        className="text-[var(--theme-muted)] group-hover:text-amber-300 transition-transform group-hover:translate-x-0.5 shrink-0"
                      />
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Current Active Lineup */}
          {currentMembers.length > 0 && (
            <div className="space-y-3.5">
              <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 size={14} />
                <span>Current Active Lineup ({currentMembers.length})</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {currentMembers.map((m, idx) => {
                  const isFounder = Array.isArray(m?.roles) && m.roles.some((r) => typeof r === "string" && /original|founder/i.test(r));
                  const years = formatYearSpan(m.begin, m.end, false);
                  return (
                    <Link
                      key={`${m.id || idx}-current`}
                      href={m.id ? `/artist/${m.id}` : "#"}
                      className="p-3.5 rounded-2xl bg-[var(--theme-surface)]/70 hover:bg-[var(--theme-card)] border border-[var(--theme-border)] hover:border-[var(--theme-accent)] transition-all flex items-center justify-between group cursor-pointer shadow-xs"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-[var(--theme-fg)] group-hover:text-[var(--theme-accent)] transition-colors truncate">
                            {m.name || "Musician"}
                          </span>
                          {isFounder && (
                            <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-400/15 text-amber-300 border border-amber-400/30 shrink-0">
                              Founder
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[var(--theme-muted)] truncate mt-0.5">
                          {formatSafeRoles(m.roles, isFounder)}
                          {years ? ` (${years})` : ""}
                        </p>
                      </div>
                      <ChevronRight
                        size={14}
                        className="text-[var(--theme-muted)] group-hover:text-[var(--theme-accent)] transition-transform group-hover:translate-x-0.5 shrink-0"
                      />
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Past Members */}
          {pastMembers.length > 0 && (
            <div className="space-y-3.5">
              <h3 className="text-xs font-bold text-[var(--theme-muted)] uppercase tracking-wider flex items-center gap-1.5">
                <Clock size={13} />
                <span>Past Members & Lineup History ({pastMembers.length})</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {pastMembers.map((m, idx) => {
                  const years = formatYearSpan(m.begin, m.end, true);
                  return (
                    <Link
                      key={`${m.id || idx}-past`}
                      href={m.id ? `/artist/${m.id}` : "#"}
                      className="p-3 rounded-2xl bg-[var(--theme-surface)]/50 hover:bg-[var(--theme-card)] border border-[var(--theme-border)]/70 hover:border-[var(--theme-border)] transition-all flex items-center justify-between group cursor-pointer"
                    >
                      <div className="min-w-0 pr-2">
                        <span className="text-xs sm:text-sm font-semibold text-[var(--theme-fg)]/90 group-hover:text-[var(--theme-fg)] truncate block">
                          {m.name || "Musician"}
                        </span>
                        <p className="text-[11px] text-[var(--theme-muted)] truncate mt-0.5">
                          {formatSafeRoles(m.roles, false)}
                          {years ? ` (${years})` : ""}
                        </p>
                      </div>
                      <ChevronRight
                        size={13}
                        className="text-[var(--theme-muted)] group-hover:text-[var(--theme-fg)] shrink-0"
                      />
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Associated Bands / Side Projects */}
          {bandList.length > 0 && (
            <div className="space-y-3.5">
              <h3 className="text-xs font-bold text-[var(--theme-muted)] uppercase tracking-wider flex items-center gap-1.5">
                <Layers size={13} />
                <span>Bands & Associated Groups ({bandList.length})</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {bandList.map((b, idx) => {
                  const years = formatYearSpan(b.begin, b.end, b.ended);
                  return (
                    <Link
                      key={`${b.id || idx}-band`}
                      href={b.id ? `/artist/${b.id}` : "#"}
                      className="p-3.5 rounded-2xl bg-[var(--theme-surface)]/70 hover:bg-[var(--theme-card)] border border-[var(--theme-border)] hover:border-[var(--theme-accent)] transition-all flex items-center justify-between group cursor-pointer"
                    >
                      <div className="min-w-0 pr-2">
                        <span className="text-sm font-bold text-[var(--theme-fg)] group-hover:text-[var(--theme-accent)] transition-colors truncate block">
                          {b.name || "Group"}
                        </span>
                        <p className="text-[11px] text-[var(--theme-muted)] truncate mt-0.5">
                          {formatSafeRoles(b.roles, false)}
                          {years ? ` (${years})` : ""}
                        </p>
                      </div>
                      <ChevronRight
                        size={14}
                        className="text-[var(--theme-muted)] group-hover:text-[var(--theme-accent)] shrink-0"
                      />
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Collaborations */}
          {collabList.length > 0 && (
            <div className="space-y-3.5">
              <h3 className="text-xs font-bold text-[var(--theme-muted)] uppercase tracking-wider flex items-center gap-1.5">
                <HeartHandshake size={13} />
                <span>Key Collaborations & Projects ({collabList.length})</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {collabList.map((c, idx) => (
                  <Link
                    key={`${c.id || idx}-collab`}
                    href={c.id ? `/artist/${c.id}` : "#"}
                    className="p-3 rounded-2xl bg-[var(--theme-surface)]/50 hover:bg-[var(--theme-card)] border border-[var(--theme-border)]/70 hover:border-[var(--theme-border)] transition-all flex items-center justify-between group cursor-pointer"
                  >
                    <div className="min-w-0 pr-2">
                      <span className="text-xs sm:text-sm font-semibold text-[var(--theme-fg)] truncate block">
                        {c.name || "Collaborator"}
                      </span>
                      <p className="text-[11px] text-[var(--theme-muted)] truncate mt-0.5">
                        {c.relationType ? c.relationType.replace(/-/g, " ") : "Collaborator"}
                      </p>
                    </div>
                    <ChevronRight
                      size={13}
                      className="text-[var(--theme-muted)] group-hover:text-[var(--theme-fg)] shrink-0"
                    />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* 2. ARCHIVAL SPECS & METADATA GRID */}
      <section className="space-y-4 pt-4 border-t border-[var(--theme-border)]/50">
        <h3 className="text-xs font-bold text-[var(--theme-fg)] uppercase tracking-wider">
          Archival Timeline & Geographic Roots
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="p-3.5 rounded-2xl bg-[var(--theme-surface)]/70 border border-[var(--theme-border)]/60 space-y-1">
            <span className="text-[11px] font-semibold text-[var(--theme-muted)] flex items-center gap-1.5">
              <Calendar size={13} className="text-[var(--theme-accent)]" />
              <span>Formed / Started</span>
            </span>
            <p className="text-sm font-bold text-[var(--theme-fg)]">
              {beginYear ? `${beginYear}` : "Archive Active"}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-[var(--theme-surface)]/70 border border-[var(--theme-border)]/60 space-y-1">
            <span className="text-[11px] font-semibold text-[var(--theme-muted)] flex items-center gap-1.5">
              <Clock size={13} className="text-[var(--theme-accent)]" />
              <span>Status</span>
            </span>
            <p className="text-sm font-bold text-[var(--theme-fg)]">
              {isEnded ? `Disbanded (${endYear || ""})` : "Active"}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-[var(--theme-surface)]/70 border border-[var(--theme-border)]/60 space-y-1">
            <span className="text-[11px] font-semibold text-[var(--theme-muted)] flex items-center gap-1.5">
              <MapPin size={13} className="text-[var(--theme-accent)]" />
              <span>Country / Origin</span>
            </span>
            <p className="text-sm font-bold text-[var(--theme-fg)] truncate">
              {artist.country || artist.area || "Global"}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-[var(--theme-surface)]/70 border border-[var(--theme-border)]/60 space-y-1">
            <span className="text-[11px] font-semibold text-[var(--theme-muted)] flex items-center gap-1.5">
              <Disc size={13} className="text-[var(--theme-accent)]" />
              <span>Entity Format</span>
            </span>
            <p className="text-sm font-bold text-[var(--theme-fg)] truncate">
              {isGroup ? "Musical Band / Group" : "Solo Artist"}
            </p>
          </div>
        </div>
      </section>

      {/* 3. FULL EDITORIAL BIOGRAPHY */}
      <section className="space-y-4 pt-4 border-t border-[var(--theme-border)]/50">
        <div className="flex items-center gap-2 text-xs font-bold text-[var(--theme-accent)] uppercase tracking-widest">
          <BookOpen size={15} />
          <span>Biography & History</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-[var(--theme-fg)] tracking-tight font-display">
          About {artist.name || "Artist"}
        </h2>

        {paragraphs.length > 0 ? (
          <div className="space-y-4 text-sm sm:text-base text-[var(--theme-muted)] leading-relaxed font-body">
            {paragraphs.map((p, idx) => (
              <p key={`bio-para-${idx}`} className="leading-relaxed">
                {p}
              </p>
            ))}
          </div>
        ) : (
          <div className="p-6 rounded-2xl bg-[var(--theme-surface)]/50 border border-[var(--theme-border)] text-center text-xs text-[var(--theme-muted)]">
            No long-form biography currently cataloged for this artist in MusicBrainz.
          </div>
        )}
      </section>
    </div>
  );
}
