// src/Components/ArtistBioAndLineupTab.jsx
"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import {
  Users,
  CheckCircle2,
  ChevronRight,
  Calendar,
  MapPin,
  Disc,
  BookOpen,
  Clock,
  Layers,
  HeartHandshake,
} from "lucide-react";

function formatSafeYear(val) {
  if (!val) return "";
  try {
    return String(val).split("-")[0];
  } catch (_) {
    return "";
  }
}

function formatYearSpan(begin, end, isEnded = false, bandEndYear = "") {
  const b = formatSafeYear(begin);
  const e = formatSafeYear(end) || (isEnded ? bandEndYear : "Present");
  if (!b && !e) return "";
  if (b && e && b === e) return b;
  return `${b || "?"}–${e || (isEnded ? "?" : "Present")}`;
}

function formatMemberPeriods(member, isDisbandedBand = false, bandEndYear = "") {
  const periods = Array.isArray(member?.periods) && member.periods.length > 0
    ? member.periods
    : [{ begin: member?.begin, end: member?.end, ended: member?.ended }];

  const formatted = periods
    .map((p) => {
      const isOpen = !p.ended && !p.end;
      if (isOpen && isDisbandedBand) {
        return formatYearSpan(p.begin, bandEndYear || null, true, bandEndYear);
      }
      return formatYearSpan(p.begin, p.end, p.ended || isDisbandedBand, bandEndYear);
    })
    .filter(Boolean);

  // Deduplicate identical year strings
  return Array.from(new Set(formatted)).join(", ");
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

function checkIsFounder(member, ogIdSet) {
  if (member?.isFounder) return true;
  if (member?.id && ogIdSet.has(member.id)) return true;
  return (
    Array.isArray(member?.roles) &&
    member.roles.some((r) => typeof r === "string" && /original|founder/i.test(r))
  );
}

/**
 * Determine whether a member stayed until the band disbanded (Final Lineup)
 * vs left before the band ended (Former Members).
 */
function wasMemberInFinalLineup(member, lifeSpan) {
  const bandEnd = lifeSpan?.end ? String(lifeSpan.end).trim() : "";
  const periods =
    Array.isArray(member?.periods) && member.periods.length > 0
      ? member.periods
      : [{ begin: member?.begin, end: member?.end, ended: member?.ended }];

  // 1. If any tenure was never marked ended in MusicBrainz, they stayed until disbandment
  if (periods.some((p) => !p.ended && !p.end)) {
    return true;
  }

  // 2. Otherwise inspect the member's latest end date
  const latestEnd = periods
    .map((p) => (p.end ? String(p.end).trim() : ""))
    .filter(Boolean)
    .sort()
    .pop();

  if (!latestEnd || !bandEnd) {
    return false;
  }

  if (latestEnd === bandEnd) return true;

  // Match precision safely (e.g. bandEnd="2014" vs memberEnd="2014-05", or bandEnd="1970-04-10" vs memberEnd="1970-04")
  if (bandEnd.length === 4) {
    return latestEnd.slice(0, 4) >= bandEnd;
  }
  if (bandEnd.length === 7) {
    return latestEnd.slice(0, 7) >= bandEnd;
  }
  if (latestEnd.length === 4) {
    return latestEnd === bandEnd.slice(0, 4);
  }
  if (latestEnd.length === 7) {
    return latestEnd >= bandEnd.slice(0, 7);
  }
  return latestEnd >= bandEnd;
}

function MemberCard({ member, isFounder, periodLabel, accentBorder = false }) {
  const roleLabel = formatSafeRoles(member.roles, isFounder);
  return (
    <Link
      href={member.id ? `/artist/${member.id}` : "#"}
      className={`p-3.5 rounded-2xl transition-all flex items-center justify-between group cursor-pointer shadow-xs border ${
        accentBorder
          ? "bg-[var(--theme-surface)]/80 hover:bg-[var(--theme-card)] border-[var(--theme-border)] hover:border-amber-400/50"
          : "bg-[var(--theme-surface)]/55 hover:bg-[var(--theme-card)] border-[var(--theme-border)]/70 hover:border-[var(--theme-border)]"
      }`}
    >
      <div className="min-w-0 pr-2 space-y-0.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-bold text-[var(--theme-fg)] group-hover:text-amber-300 transition-colors truncate">
            {member.name || "Musician"}
          </span>
          {isFounder && (
            <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-400/15 text-amber-300 border border-amber-400/35 shrink-0">
              Founder
            </span>
          )}
        </div>
        <p className="text-[11px] text-[var(--theme-muted)] truncate">
          {roleLabel}
          {periodLabel ? ` · ${periodLabel}` : ""}
        </p>
      </div>
      <ChevronRight
        size={14}
        className="text-[var(--theme-muted)] group-hover:text-amber-300 transition-transform group-hover:translate-x-0.5 shrink-0"
      />
    </Link>
  );
}

export default function ArtistBioAndLineupTab({
  artist = {},
  isGroup = false,
  members = { og: [], current: [], past: [], supporting: [] },
  bands = [],
  collaborations = [],
  description = "",
}) {
  const currentMembers = useMemo(
    () => (Array.isArray(members?.current) ? members.current : []),
    [members]
  );
  const ogMembers = useMemo(
    () => (Array.isArray(members?.og) ? members.og : []),
    [members]
  );
  const pastMembers = useMemo(
    () => (Array.isArray(members?.past) ? members.past : []),
    [members]
  );
  const bandList = Array.isArray(bands) ? bands : [];
  const collabList = Array.isArray(collaborations) ? collaborations : [];

  const lifeSpan = useMemo(() => artist.lifeSpan || {}, [artist.lifeSpan]);
  const beginYear = formatSafeYear(lifeSpan.begin);
  const endYear = formatSafeYear(lifeSpan.end);
  const isEnded = Boolean(lifeSpan.ended || endYear);
  const isDisbandedBand = Boolean(isGroup && isEnded);

  // Build deduplicated list of all band members & founder lookup
  const { ogIdSet, allBandMembers } = useMemo(() => {
    const founders = new Set(ogMembers.map((m) => m.id).filter(Boolean));
    const map = new Map();
    for (const list of [currentMembers, pastMembers, ogMembers]) {
      for (const m of list) {
        if (!m) continue;
        const key = m.id || m.name;
        if (!key) continue;
        if (!map.has(key)) {
          map.set(key, m);
        }
      }
    }
    return { ogIdSet: founders, allBandMembers: Array.from(map.values()) };
  }, [currentMembers, pastMembers, ogMembers]);

  // Disbanded band split: Final Lineup vs Former Members
  const { finalLineup, formerMembers } = useMemo(() => {
    if (!isDisbandedBand) {
      return { finalLineup: [], formerMembers: [] };
    }
    const finalList = [];
    const formerList = [];
    for (const m of allBandMembers) {
      if (wasMemberInFinalLineup(m, lifeSpan)) {
        finalList.push(m);
      } else {
        formerList.push(m);
      }
    }
    // Sort founders first inside final lineup
    finalList.sort((a, b) => {
      const aF = checkIsFounder(a, ogIdSet) ? 1 : 0;
      const bF = checkIsFounder(b, ogIdSet) ? 1 : 0;
      return bF - aF;
    });
    return { finalLineup: finalList, formerMembers: formerList };
  }, [isDisbandedBand, allBandMembers, lifeSpan, ogIdSet]);

  // Active band split: Current Members vs Former Members
  const { activeCurrentMembers, activeFormerMembers } = useMemo(() => {
    if (isDisbandedBand) {
      return { activeCurrentMembers: [], activeFormerMembers: [] };
    }
    const currentIds = new Set(currentMembers.map((m) => m.id || m.name));
    const curr = [...currentMembers].sort((a, b) => {
      const aF = checkIsFounder(a, ogIdSet) ? 1 : 0;
      const bF = checkIsFounder(b, ogIdSet) ? 1 : 0;
      return bF - aF;
    });
    const past = pastMembers.filter((m) => !currentIds.has(m.id || m.name));
    return { activeCurrentMembers: curr, activeFormerMembers: past };
  }, [isDisbandedBand, currentMembers, pastMembers, ogIdSet]);

  const hasLineup =
    isGroup ||
    allBandMembers.length > 0 ||
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
    <div className="relative z-10 space-y-10 animate-fade-in max-w-4xl mx-auto px-4 sm:px-6 md:px-8 pb-16">
      {/* 1. FULL EDITORIAL BIOGRAPHY */}
      <section className="space-y-4">
        <div className="border-b border-[var(--theme-border)]/50 pb-3.5">
          <div className="flex items-center gap-2 text-xs font-bold text-[var(--theme-accent)] uppercase tracking-widest">
            <BookOpen size={15} />
            <span>Biography &amp; Overview</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-[var(--theme-fg)] tracking-tight font-display mt-0.5">
            About {artist.name || "Artist"}
          </h2>
        </div>

        {paragraphs.length > 0 ? (
          <div className="space-y-4 text-sm sm:text-base text-[var(--theme-fg)]/90 leading-relaxed font-body">
            {paragraphs.map((p, idx) => (
              <p key={`bio-para-${idx}`} className="leading-relaxed">
                {p}
              </p>
            ))}
          </div>
        ) : description ? (
          <p className="text-sm sm:text-base text-[var(--theme-fg)]/90 leading-relaxed font-body">
            {description}
          </p>
        ) : (
          <div className="p-6 rounded-2xl bg-[var(--theme-surface)]/50 border border-[var(--theme-border)] text-center text-xs text-[var(--theme-muted)]">
            No long-form biography currently cataloged for this artist.
          </div>
        )}
      </section>

      {/* 2. ARCHIVAL SPECS & METADATA GRID */}
      <section className="space-y-4 pt-2">
        <h3 className="text-xs font-bold text-[var(--theme-muted)] uppercase tracking-wider">
          Archival Timeline &amp; Geographic Roots
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="p-3.5 rounded-2xl bg-[var(--theme-surface)]/70 border border-[var(--theme-border)]/60 space-y-1">
            <span className="text-[11px] font-semibold text-[var(--theme-muted)] flex items-center gap-1.5">
              <Calendar size={13} className="text-[var(--theme-accent)]" />
              <span>{isGroup ? "Formed" : "Born / Started"}</span>
            </span>
            <p className="text-sm font-bold text-[var(--theme-fg)]">
              {beginYear || "Unknown"}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-[var(--theme-surface)]/70 border border-[var(--theme-border)]/60 space-y-1">
            <span className="text-[11px] font-semibold text-[var(--theme-muted)] flex items-center gap-1.5">
              <Clock size={13} className="text-[var(--theme-accent)]" />
              <span>Status</span>
            </span>
            <p className="text-sm font-bold text-[var(--theme-fg)]">
              {isEnded
                ? `${isGroup ? "Disbanded" : "Deceased"}${endYear ? ` (${endYear})` : ""}`
                : "Active"}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-[var(--theme-surface)]/70 border border-[var(--theme-border)]/60 space-y-1">
            <span className="text-[11px] font-semibold text-[var(--theme-muted)] flex items-center gap-1.5">
              <MapPin size={13} className="text-[var(--theme-accent)]" />
              <span>Origin / Country</span>
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

      {/* CLEAR VISUAL DIVISION */}
      {hasLineup && (
        <div className="relative py-2">
          <div className="h-px bg-gradient-to-r from-transparent via-[var(--theme-border)] to-transparent" />
        </div>
      )}

      {/* 3. BAND PERSONNEL & LINEUP HISTORY */}
      {hasLineup && (
        <section className="space-y-8">
          <div className="border-b border-[var(--theme-border)]/50 pb-3.5">
            <div className="flex items-center gap-2 text-xs font-bold text-[var(--theme-accent)] uppercase tracking-widest">
              <Users size={15} />
              <span>
                {isDisbandedBand
                  ? `Band Lineup · Disbanded${endYear ? ` ${endYear}` : ""}`
                  : isGroup
                  ? "Band Personnel & Lineup"
                  : "Musical Projects & Groups"}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[var(--theme-fg)] tracking-tight font-display mt-0.5">
              {isGroup
                ? `${artist.name || "Band"} Lineup`
                : `Groups & Projects with ${artist.name || "Artist"}`}
            </h2>
          </div>

          {/* DISBANDED BAND LOGIC (Section 5) */}
          {isDisbandedBand ? (
            <>
              {/* Section 1: Final Lineup */}
              {finalLineup.length > 0 && (
                <div className="space-y-3.5">
                  <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Users size={14} />
                    <span>Final Lineup ({finalLineup.length})</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {finalLineup.map((m, idx) => (
                      <MemberCard
                        key={`${m.id || idx}-final`}
                        member={m}
                        isFounder={checkIsFounder(m, ogIdSet)}
                        periodLabel={formatMemberPeriods(m, true, endYear)}
                        accentBorder={true}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Section 2: Former Members */}
              {formerMembers.length > 0 && (
                <div className="space-y-3.5">
                  <h3 className="text-xs font-bold text-[var(--theme-muted)] uppercase tracking-wider flex items-center gap-1.5">
                    <Clock size={13} />
                    <span>Former Members ({formerMembers.length})</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {formerMembers.map((m, idx) => (
                      <MemberCard
                        key={`${m.id || idx}-former`}
                        member={m}
                        isFounder={checkIsFounder(m, ogIdSet)}
                        periodLabel={formatMemberPeriods(m, true, endYear)}
                        accentBorder={false}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* ACTIVE BAND LOGIC (Normal Current Members + Past Former Members) */
            <>
              {activeCurrentMembers.length > 0 && (
                <div className="space-y-3.5">
                  <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 size={14} />
                    <span>Current Members ({activeCurrentMembers.length})</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {activeCurrentMembers.map((m, idx) => (
                      <MemberCard
                        key={`${m.id || idx}-current`}
                        member={m}
                        isFounder={checkIsFounder(m, ogIdSet)}
                        periodLabel={formatMemberPeriods(m, false, "")}
                        accentBorder={true}
                      />
                    ))}
                  </div>
                </div>
              )}

              {activeFormerMembers.length > 0 && (
                <div className="space-y-3.5">
                  <h3 className="text-xs font-bold text-[var(--theme-muted)] uppercase tracking-wider flex items-center gap-1.5">
                    <Clock size={13} />
                    <span>Former Members ({activeFormerMembers.length})</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {activeFormerMembers.map((m, idx) => (
                      <MemberCard
                        key={`${m.id || idx}-past`}
                        member={m}
                        isFounder={checkIsFounder(m, ogIdSet)}
                        periodLabel={formatMemberPeriods(m, false, "")}
                        accentBorder={false}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Associated Bands / Side Projects (Solo artists) */}
          {bandList.length > 0 && (
            <div className="space-y-3.5">
              <h3 className="text-xs font-bold text-[var(--theme-muted)] uppercase tracking-wider flex items-center gap-1.5">
                <Layers size={13} />
                <span>Bands &amp; Associated Groups ({bandList.length})</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {bandList.map((b, idx) => (
                  <MemberCard
                    key={`${b.id || idx}-band`}
                    member={b}
                    isFounder={checkIsFounder(b, ogIdSet)}
                    periodLabel={formatMemberPeriods(b, false, "")}
                    accentBorder={true}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Collaborations */}
          {collabList.length > 0 && (
            <div className="space-y-3.5">
              <h3 className="text-xs font-bold text-[var(--theme-muted)] uppercase tracking-wider flex items-center gap-1.5">
                <HeartHandshake size={13} />
                <span>Key Collaborations &amp; Projects ({collabList.length})</span>
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
    </div>
  );
}
