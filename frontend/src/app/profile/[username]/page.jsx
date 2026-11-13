// src/app/profile/[username]/page.jsx
import { cache } from "react";
import { getPublicSupabaseClient } from "@/lib/supabase/publicServer";
import { getUserPublicAverageRating, normalizeToTenScale } from "@/lib/supabase/journals";
import ProfileClient from "./ProfileClient";

export const dynamic = "force-dynamic";

const getPublicProfileData = cache(async (rawUsername) => {
  const normalizedUsername = (rawUsername || "").trim().toLowerCase();
  if (!normalizedUsername) {
    return {
      profile: null,
      journalLogs: [],
      followersCount: 0,
      followingCount: 0,
      avgRating: null,
    };
  }

  const supabase = getPublicSupabaseClient();
  if (!supabase) {
    return {
      profile: null,
      journalLogs: [],
      followersCount: 0,
      followingCount: 0,
      avgRating: null,
    };
  }

  try {
    const { data: dbProfile, error: profileErr } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url, bio, badge, is_admin, created_at")
      .ilike("username", normalizedUsername)
      .maybeSingle();

    if (profileErr || !dbProfile) {
      return {
        profile: null,
        journalLogs: [],
        followersCount: 0,
        followingCount: 0,
        avgRating: null,
      };
    }

    const [journalsRes, followersRes, followingRes, ratingStats, userRatingsRes] = await Promise.all([
      supabase
        .from("journals")
        .select(`
          id,
          entity_id,
          entry_text,
          mood,
          listened_date,
          is_public,
          created_at,
          user_ratings ( score, rating_type ),
          music_entities ( id, mbid, type, title, artist_credit, cover_art_url )
        `)
        .eq("user_id", dbProfile.id)
        .eq("is_public", true)
        .order("listened_date", { ascending: false }),
      supabase
        .from("follows")
        .select("follower_id", { count: "exact", head: true })
        .eq("following_id", dbProfile.id),
      supabase
        .from("follows")
        .select("following_id", { count: "exact", head: true })
        .eq("follower_id", dbProfile.id),
      getUserPublicAverageRating(dbProfile.id),
      supabase
        .from("user_ratings")
        .select("entity_id, score, rating_type")
        .eq("user_id", dbProfile.id),
    ]);

    const ratingByEntity = new Map();
    for (const r of userRatingsRes?.data || []) {
      if (!ratingByEntity.has(r.entity_id) || r.rating_type === "stars") {
        ratingByEntity.set(r.entity_id, r);
      }
    }

    const journalLogs = Array.isArray(journalsRes?.data)
      ? journalsRes.data
          .filter((j) => j.is_public === true)
          .map((j) => {
            const ratingRow = j.user_ratings || ratingByEntity.get(j.entity_id) || null;
            const normalizedRating = ratingRow
              ? normalizeToTenScale(ratingRow.score, ratingRow.rating_type)
              : 0;

            return {
              id: j.id,
              targetId: j.music_entities?.mbid,
              targetType: j.music_entities?.type || "album",
              title: j.music_entities?.title || "Untitled",
              subtitle: j.music_entities?.artist_credit || "",
              image: j.music_entities?.cover_art_url || "",
              rating: normalizedRating || 0,
              numericalScore: ratingRow?.score ? Number(ratingRow.score) : 0,
              ratingSystem: ratingRow?.rating_type || "stars",
              date: j.listened_date,
              review: j.entry_text || "",
              mood: j.mood || "",
              is_public: true,
              createdAt: j.created_at ? new Date(j.created_at).getTime() : Date.now(),
            };
          })
      : [];

    return {
      profile: dbProfile,
      journalLogs,
      followersCount: followersRes?.count || 0,
      followingCount: followingRes?.count || 0,
      avgRating: ratingStats?.avgRating || null,
    };
  } catch (err) {
    console.warn("SSR public profile load failed:", err?.message);
    return {
      profile: null,
      journalLogs: [],
      followersCount: 0,
      followingCount: 0,
      avgRating: null,
    };
  }
});

export async function generateMetadata({ params }) {
  const { username } = await params;
  const rawUsername = username ? decodeURIComponent(username) : "";
  const { profile } = await getPublicProfileData(rawUsername);

  const displayName = profile?.display_name || profile?.username || rawUsername || "Music Critic";
  const bio = profile?.bio || `Explore @${rawUsername}'s public listening journal and music ratings on GrooveEstrella.`;

  return {
    title: `${displayName} (@${profile?.username || rawUsername})`,
    description: bio,
  };
}

export default async function UserProfilePage({ params }) {
  const { username } = await params;
  const rawUsername = username ? decodeURIComponent(username) : "";
  const { profile, journalLogs, followersCount, followingCount, avgRating } =
    await getPublicProfileData(rawUsername);

  return (
    <ProfileClient
      key={rawUsername}
      rawUsername={rawUsername}
      initialProfile={profile}
      initialJournalLogs={journalLogs}
      initialFollowersCount={followersCount}
      initialFollowingCount={followingCount}
      initialAvgRating={avgRating}
    />
  );
}
