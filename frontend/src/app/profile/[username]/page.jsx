// src/app/profile/[username]/page.jsx
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { getPublicSupabaseClient } from "@/lib/supabase/publicServer";
import ProfileClient from "./ProfileClient";

export const revalidate = 15;

const fetchProfileCached = unstable_cache(
  async (normalizedUsername) => {
    if (!normalizedUsername) {
      return { profile: null, journalLogs: [], followersCount: 0, followingCount: 0 };
    }

    const supabase = getPublicSupabaseClient();
    if (!supabase) {
      return { profile: null, journalLogs: [], followersCount: 0, followingCount: 0 };
    }

    try {
      const { data: dbProfile, error: profileErr } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url, bio, created_at")
        .ilike("username", normalizedUsername)
        .maybeSingle();

      if (profileErr || !dbProfile) {
        return { profile: null, journalLogs: [], followersCount: 0, followingCount: 0 };
      }

      const [journalsRes, followersRes, followingRes] = await Promise.all([
        supabase
          .from("journals")
          .select(`
            id,
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
      ]);

      const journalLogs = Array.isArray(journalsRes?.data)
        ? journalsRes.data.map((j) => ({
            id: j.id,
            targetId: j.music_entities?.mbid,
            targetType: j.music_entities?.type || "album",
            title: j.music_entities?.title || "Untitled",
            subtitle: j.music_entities?.artist_credit || "",
            image: j.music_entities?.cover_art_url || "",
            rating:
              j.user_ratings?.rating_type === "stars"
                ? j.user_ratings.score
                : Math.round((j.user_ratings?.score || 0) / 10),
            numericalScore: j.user_ratings?.score || 0,
            ratingSystem: j.user_ratings?.rating_type || "stars",
            date: j.listened_date,
            review: j.entry_text || "",
            mood: j.mood || "",
            is_public: true,
            createdAt: j.created_at ? new Date(j.created_at).getTime() : Date.now(),
          }))
        : [];

      return {
        profile: dbProfile,
        journalLogs,
        followersCount: followersRes?.count || 0,
        followingCount: followingRes?.count || 0,
      };
    } catch (err) {
      console.warn("SSR public profile load failed:", err?.message);
      return { profile: null, journalLogs: [], followersCount: 0, followingCount: 0 };
    }
  },
  ["public-profile-page"],
  { revalidate: 15 }
);

const getPublicProfileData = cache(async (rawUsername) => {
  const key = (rawUsername || "").trim().toLowerCase();
  return fetchProfileCached(key);
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
  const { profile, journalLogs, followersCount, followingCount } = await getPublicProfileData(rawUsername);

  return (
    <ProfileClient
      rawUsername={rawUsername}
      initialProfile={profile}
      initialJournalLogs={journalLogs}
      initialFollowersCount={followersCount}
      initialFollowingCount={followingCount}
    />
  );
}
