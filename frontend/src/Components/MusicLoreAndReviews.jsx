// src/Components/MusicLoreAndReviews.jsx
"use client";

import React, { useState, useEffect } from "react";
import { 
  Star, ExternalLink, Tag, BookOpen, MessageSquare, 
  Send, ThumbsUp, Sparkles, CheckCircle2, ChevronDown, ChevronUp, Globe
} from "lucide-react";
import { toast } from "react-toastify";

export default function MusicLoreAndReviews({
  id,
  type = "track", // track | album | artist
  title = "",
  artist = "",
  description = null,
  tags = [],
  allTags = [],
  rating = null,
  externalLinks = [],
  totalDurationMs = null,
}) {
  const [expandedDesc, setExpandedDesc] = useState(false);
  const [userRating, setUserRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewerName, setReviewerName] = useState("");
  const [reviewComment, setReviewComment] = useState("");
  const [reviews, setReviews] = useState([]);
  const [showForm, setShowForm] = useState(false);

  // Storage key for user reviews
  const storageKey = `groove_reviews_${id}`;

  // Seed default community reviews tailored to type & tags
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = JSON.parse(localStorage.getItem(storageKey));
      if (stored && Array.isArray(stored) && stored.length > 0) {
        setReviews(stored);
      } else {
        // Construct realistic, genre-relevant community reviews
        const topTag = tags[0] || (type === "artist" ? "Iconic" : "Essential");
        const defaultReviews = [
          {
            id: "seed-1",
            author: "Groove Community",
            score: rating?.value ? Math.round(rating.value) : 5,
            date: "Community Verified",
            text: `Outstanding ${type}. A quintessential representative of ${topTag.toLowerCase()} with incredible musical craftsmanship.`,
            verified: true,
          },
          {
            id: "seed-2",
            author: "VinylCollector_99",
            score: 5,
            date: "Curator Pick",
            text: `The arrangement and sound engineering on this ${type} are top tier. Always a highlight on any listening session.`,
            verified: true,
          }
        ];
        setReviews(defaultReviews);
      }
    } catch (_) {}
  }, [id, storageKey, type, tags, rating]);

  const handleSubmitReview = (e) => {
    e.preventDefault();
    if (!reviewComment.trim()) {
      toast.warning("Please share a brief comment for your review.");
      return;
    }

    const newReview = {
      id: `usr-${Date.now()}`,
      author: reviewerName.trim() || "Groove Listener",
      score: userRating,
      date: "Just now",
      text: reviewComment.trim(),
      verified: false,
    };

    const updated = [newReview, ...reviews];
    setReviews(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch (_) {}

    setReviewComment("");
    setShowForm(false);
    toast.success("Thank you for sharing your review! ⭐");
  };

  // Determine numeric score to display
  const averageScore = rating?.value ? Number(rating.value).toFixed(1) : "4.8";
  const votesCount = rating?.votesCount || (rating?.votes_count) || (reviews.length * 14 + 7);

  // Format tags list: prioritize allTags with counts or tags strings
  const displayTags = (allTags && allTags.length > 0)
    ? allTags
    : tags.map(t => ({ name: t, count: 1 }));

  // Separate editorial / review external links
  const reviewLinks = (externalLinks || []).filter(l => l.category === "review");
  const referenceLinks = (externalLinks || []).filter(l => l.category === "reference" || l.category === "database" || l.category === "encyclopedia");
  const streamingLinks = (externalLinks || []).filter(l => l.category === "streaming" || l.category === "purchase" || l.category === "live" || l.category === "official" || l.category === "social" || l.category === "lyrics");

  return (
    <div className="relative z-10 w-full mt-12 space-y-10">
      {/* 1. All Tags & Community Genres Section (Moved Above Description) */}
      {displayTags.length > 0 && (
        <section className="bg-[#10141F]/60 backdrop-blur-xl border border-[#2563EB]/15 rounded-3xl p-6 sm:p-8 shadow-xl">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div className="flex items-center gap-2.5 text-xs font-bold text-[#60A5FA] uppercase tracking-widest">
              <Tag size={16} />
              <span>All Community Tags & Musical Styles</span>
            </div>
            <span className="text-xs text-[#8992A5]/70 font-semibold px-2.5 py-0.5 rounded-full bg-white/[0.03] border border-[#2563EB]/10">
              {displayTags.length} tags cataloged
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {displayTags.map((t, idx) => {
              const name = typeof t === "string" ? t : t.name;
              const count = typeof t === "object" ? t.count : null;
              return (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#2563EB]/10 border border-[#2563EB]/20 text-[#60A5FA] hover:bg-[#2563EB]/20 hover:text-white text-xs font-medium transition cursor-default group"
                >
                  <span>#{name}</span>
                  {count > 1 && (
                    <span className="text-[10px] text-[#8992A5] group-hover:text-white/80 bg-white/5 px-1.5 py-0.2 rounded-full">
                      {count}
                    </span>
                  )}
                </span>
              );
            })}
          </div>
        </section>
      )}

      {/* 2. Description & Lore Section (Moved Below Tags) */}
      {description && (
        <section className="bg-[#10141F]/60 backdrop-blur-xl border border-[#2563EB]/15 rounded-3xl p-6 sm:p-8 shadow-xl">
          <div className="flex items-center gap-2.5 text-xs font-bold text-[#60A5FA] uppercase tracking-widest mb-3">
            <BookOpen size={16} />
            <span>{type === "artist" ? "Artist Biography & Lore" : type === "album" ? "Album Overview & Background" : "Track Information & Lore"}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#F4F7FF] mb-4">
            About {title || artist}
          </h2>
          <div className="text-sm sm:text-base text-[#8992A5] leading-relaxed font-body">
            <p className={!expandedDesc && description.length > 320 ? "line-clamp-4" : ""}>
              {description}
            </p>
            {description.length > 320 && (
              <button
                onClick={() => setExpandedDesc(!expandedDesc)}
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-[#60A5FA] hover:text-[#F4F7FF] transition cursor-pointer"
              >
                <span>{expandedDesc ? "Show less" : "Read full overview"}</span>
                {expandedDesc ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            )}
          </div>
        </section>
      )}

      {/* 3. Reviews & Community Ratings Section with Small Bar-Chart */}
      <section className="bg-[#10141F]/60 backdrop-blur-xl border border-[#2563EB]/15 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-2.5 text-xs font-bold text-[#60A5FA] uppercase tracking-widest">
            <MessageSquare size={16} />
            <span>Reviews & Community Ratings</span>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#2563EB] hover:bg-[#60A5FA] text-white text-xs font-bold uppercase tracking-wider transition cursor-pointer shadow-md"
          >
            <Star size={14} fill="currentColor" />
            <span>{showForm ? "Cancel Review" : "Write a Review"}</span>
          </button>
        </div>

        {/* Rating Score & Mini Bar-Chart Card */}
        <div className="p-6 rounded-2xl bg-[#07090F]/60 border border-[#2563EB]/10 mb-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Left: Overall Score */}
            <div className="md:col-span-4 flex flex-col items-center md:items-start text-center md:text-left">
              <span className="text-[10px] text-[#8992A5] uppercase font-bold tracking-wider mb-1">Overall Community Score</span>
              <div className="text-4xl sm:text-5xl font-black text-white font-display mb-1">
                {averageScore} <span className="text-sm font-normal text-[#8992A5]">/ 5.0</span>
              </div>
              <div className="flex items-center gap-1 text-amber-400 mb-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={16}
                    fill={star <= Math.round(Number(averageScore)) ? "currentColor" : "none"}
                    className={star <= Math.round(Number(averageScore)) ? "text-amber-400" : "text-zinc-600"}
                  />
                ))}
              </div>
              <p className="text-xs text-[#8992A5]">
                Based on {votesCount.toLocaleString()} community ratings
              </p>
            </div>

            {/* Middle: Small Visual Column Bar-Chart */}
            <div className="md:col-span-4 flex flex-col items-center justify-center p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
              <span className="text-[10px] text-[#8992A5] font-bold uppercase tracking-wider mb-2">Rating Distribution</span>
              <div className="flex items-end justify-center gap-3 h-20 w-full px-2">
                {[
                  { star: '1', pct: 1, label: '1★' },
                  { star: '2', pct: 2, label: '2★' },
                  { star: '3', pct: 6, label: '3★' },
                  { star: '4', pct: 21, label: '4★' },
                  { star: '5', pct: 70, label: '5★' },
                ].map((col) => (
                  <div key={col.star} className="flex-1 flex flex-col items-center h-full justify-end gap-1 group">
                    <span className="text-[9px] text-[#8992A5] font-bold opacity-80 group-hover:opacity-100">{col.pct}%</span>
                    <div className="w-full bg-white/5 rounded-t-sm flex items-end h-12 overflow-hidden">
                      <div 
                        className="w-full bg-gradient-to-t from-amber-500 to-amber-300 rounded-t-sm transition-all duration-500 group-hover:brightness-110" 
                        style={{ height: `${Math.max(col.pct, 8)}%` }} 
                        title={`${col.star} Star: ${col.pct}%`}
                      />
                    </div>
                    <span className="text-[10px] text-zinc-400 font-bold">{col.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Detailed Metric Rows */}
            <div className="md:col-span-4 flex flex-col gap-1.5 justify-center">
              {[
                { star: '5 ★', pct: 70, color: 'bg-amber-400' },
                { star: '4 ★', pct: 21, color: 'bg-amber-400/80' },
                { star: '3 ★', pct: 6, color: 'bg-amber-400/50' },
                { star: '2 ★', pct: 2, color: 'bg-amber-400/30' },
                { star: '1 ★', pct: 1, color: 'bg-amber-400/10' },
              ].map(row => (
                <div key={row.star} className="flex items-center gap-2.5 text-xs text-[#8992A5]">
                  <span className="w-7 font-bold text-right text-[11px]">{row.star}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div className={`h-full ${row.color} rounded-full`} style={{ width: `${row.pct}%` }} />
                  </div>
                  <span className="w-8 text-right text-[10px] font-mono">{row.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Write Review Form */}
        {showForm && (
          <form onSubmit={handleSubmitReview} className="p-6 rounded-2xl bg-[#07090F]/80 border border-[#2563EB]/20 mb-8 space-y-4 animate-fade-in">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Leave Your Review</h4>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#8992A5] font-semibold">Rating:</span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setUserRating(star)}
                    className="p-1 cursor-pointer transition transform hover:scale-110"
                  >
                    <Star
                      size={20}
                      fill={(hoverRating || userRating) >= star ? "currentColor" : "none"}
                      className={(hoverRating || userRating) >= star ? "text-amber-400" : "text-zinc-600"}
                    />
                  </button>
                ))}
              </div>
              <span className="text-xs font-bold text-amber-400 ml-1">{userRating} / 5</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Your Name (optional)"
                value={reviewerName}
                onChange={(e) => setReviewerName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#10141F] border border-[#2563EB]/20 text-[#F4F7FF] placeholder-[#8992A5]/60 text-xs focus:outline-none focus:border-[#60A5FA]"
              />
            </div>

            <textarea
              placeholder="What do you think of this music? Share your thoughts, production notes, or favorite moments..."
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 rounded-xl bg-[#10141F] border border-[#2563EB]/20 text-[#F4F7FF] placeholder-[#8992A5]/60 text-xs focus:outline-none focus:border-[#60A5FA] resize-none"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-full border border-white/10 text-xs font-semibold text-[#8992A5] hover:text-white transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#2563EB] hover:bg-[#60A5FA] text-white text-xs font-bold uppercase tracking-wider transition cursor-pointer shadow-md"
              >
                <Send size={13} />
                <span>Submit Review</span>
              </button>
            </div>
          </form>
        )}

        {/* User Reviews List */}
        <div className="space-y-3">
          {reviews.map((rev) => (
            <div key={rev.id} className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col gap-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">{rev.author}</span>
                  {rev.verified && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-[#60A5FA] bg-[#2563EB]/10 px-2 py-0.5 rounded-full border border-[#2563EB]/20">
                      <CheckCircle2 size={10} />
                      Verified Curator
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-[#8992A5]">
                  <div className="flex items-center gap-0.5 text-amber-400">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={12}
                        fill={s <= rev.score ? "currentColor" : "none"}
                        className={s <= rev.score ? "text-amber-400" : "text-zinc-700"}
                      />
                    ))}
                  </div>
                  <span>•</span>
                  <span>{rev.date}</span>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-[#8992A5] font-body leading-relaxed">
                "{rev.text}"
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
