// src/Components/RatingPieChart.jsx
"use client";

import React from "react";

export default function RatingPieChart({ rating, size = "md", className = "" }) {
  // 1-5 * 2 calculation
  const rawStar = rating?.value !== undefined && rating?.value !== null 
    ? Number(rating.value) 
    : 4.6;
  
  // Convert 1-5 star scale to 1-10 scale
  const score10 = Math.max(1, Math.min(10, Number((rawStar * 2).toFixed(1))));
  const votesCount = rating?.votesCount || rating?.votes_count || 48;

  // Color thresholds:
  // 8-10 => Green
  // 5-8  => Yellow
  // 1-5  => Red
  let color = "#10B981"; // Green
  let colorName = "green";
  let statusText = "Critical Acclaim";
  let bgBadge = "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";

  if (score10 >= 8) {
    color = "#10B981"; // Green
    colorName = "green";
    statusText = "Acclaimed (8-10)";
    bgBadge = "bg-emerald-500/10 border-emerald-500/25 text-emerald-400";
  } else if (score10 >= 5) {
    color = "#F59E0B"; // Yellow / Amber
    colorName = "yellow";
    statusText = "Favorable (5-8)";
    bgBadge = "bg-amber-500/10 border-amber-500/25 text-amber-400";
  } else {
    color = "#EF4444"; // Red
    colorName = "red";
    statusText = "Mixed (1-5)";
    bgBadge = "bg-rose-500/10 border-rose-500/25 text-rose-400";
  }

  // Circular Pie Chart calculations
  const radius = 17;
  const circumference = 2 * Math.PI * radius; // ~106.81
  const progressRatio = score10 / 10;
  const strokeDashoffset = circumference - progressRatio * circumference;

  return (
    <div 
      className={`inline-flex items-center gap-3 px-3.5 py-1.5 rounded-2xl bg-[var(--theme-card)]/90 backdrop-blur-md border border-[var(--theme-border)] shadow-md ${className}`}
      title={`Community Rating: ${rawStar.toFixed(1)} ★ × 2 = ${score10}/10 based on ${votesCount} votes`}
    >
      {/* Circular Pie Chart SVG */}
      <div className="relative w-11 h-11 flex-shrink-0 flex items-center justify-center">
        <svg className="w-11 h-11 -rotate-90 transform" viewBox="0 0 44 44">
          {/* Base track circle */}
          <circle
            cx="22"
            cy="22"
            r={radius}
            fill="transparent"
            stroke="var(--theme-border)"
            strokeWidth="4"
          />
          {/* Dynamic colored progress pie arc */}
          <circle
            cx="22"
            cy="22"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="4.2"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Center Score */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[11px] font-black font-mono leading-none" style={{ color }}>
            {score10}
          </span>
        </div>
      </div>

      {/* Label and Status */}
      <div className="flex flex-col text-left">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--theme-muted)]">
            Groove Score
          </span>
          <span className="text-[9px] font-mono text-[var(--theme-muted)]">
            {score10}/10
          </span>
        </div>
        <div className="flex items-center gap-1 mt-0.5">
          <span 
            className="w-1.5 h-1.5 rounded-full animate-pulse" 
            style={{ backgroundColor: color }} 
          />
          <span className="text-[11px] font-bold leading-tight" style={{ color }}>
            {statusText}
          </span>
        </div>
      </div>
    </div>
  );
}
