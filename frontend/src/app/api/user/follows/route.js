// src/app/api/user/follows/route.js
import { NextResponse } from 'next/server';
import { getPublicSupabaseClient } from '@/lib/supabase/publicServer';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const type = searchParams.get('type') || 'followers'; // 'followers' | 'following'
    const currentUserId = searchParams.get('currentUserId') || null;

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId parameter', users: [], total: 0 }, { status: 400 });
    }

    const supabase = getPublicSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ users: [], total: 0 });
    }

    let targetIds = [];
    if (type === 'following') {
      const { data: rows, error } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', userId);

      if (error) {
        console.error('Error fetching following IDs:', error);
        return NextResponse.json({ error: error.message, users: [], total: 0 }, { status: 500 });
      }
      targetIds = rows ? rows.map((r) => r.following_id) : [];
    } else {
      const { data: rows, error } = await supabase
        .from('follows')
        .select('follower_id')
        .eq('following_id', userId);

      if (error) {
        console.error('Error fetching followers IDs:', error);
        return NextResponse.json({ error: error.message, users: [], total: 0 }, { status: 500 });
      }
      targetIds = rows ? rows.map((r) => r.follower_id) : [];
    }

    if (targetIds.length === 0) {
      return NextResponse.json({ users: [], total: 0, type });
    }

    // Fetch profiles, viewer follow status, and follower counts IN PARALLEL
    const [profilesRes, curFollowsRes, fCountsRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url, bio')
        .in('id', targetIds),
      currentUserId
        ? supabase
            .from('follows')
            .select('following_id')
            .eq('follower_id', currentUserId)
            .in('following_id', targetIds)
        : Promise.resolve({ data: [] }),
      supabase
        .from('follows')
        .select('following_id')
        .in('following_id', targetIds),
    ]);

    if (profilesRes.error) {
      console.error('Error fetching profiles:', profilesRes.error);
      return NextResponse.json({ error: profilesRes.error.message, users: [], total: 0 }, { status: 500 });
    }

    const followingSet = new Set((curFollowsRes?.data || []).map((r) => r.following_id));
    const followerCountMap = {};
    for (const f of fCountsRes?.data || []) {
      followerCountMap[f.following_id] = (followerCountMap[f.following_id] || 0) + 1;
    }

    const formattedUsers = (profilesRes.data || []).map((p) => ({
      id: p.id,
      username: p.username || '',
      displayName: p.display_name || p.username || 'Critic',
      avatarUrl: p.avatar_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(p.username || p.id)}`,
      bio: p.bio || '',
      followersCount: followerCountMap[p.id] || 0,
      isFollowing: followingSet.has(p.id),
      isSelf: currentUserId === p.id,
    }));

    return NextResponse.json({
      users: formattedUsers,
      total: formattedUsers.length,
      type,
    });
  } catch (error) {
    console.error('Follows API Error:', error);
    return NextResponse.json({ error: 'Server error processing follows', users: [], total: 0 }, { status: 500 });
  }
}
