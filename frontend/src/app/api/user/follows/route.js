// src/app/api/user/follows/route.js
import { NextResponse } from 'next/server';
import { createClient, isSupabaseServerConfigured } from '@/lib/supabase/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const type = searchParams.get('type') || 'followers'; // 'followers' | 'following'
    const currentUserId = searchParams.get('currentUserId') || null;

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId parameter', users: [], total: 0 }, { status: 400 });
    }

    if (!isSupabaseServerConfigured()) {
      return NextResponse.json({ users: [], total: 0 });
    }

    const supabase = await createClient();

    let targetIds = [];
    if (type === 'following') {
      // Users that userId is following
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
      // Users that follow userId
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
      return NextResponse.json({ users: [], total: 0 });
    }

    // Fetch user profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url, bio, created_at')
      .in('id', targetIds);

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      return NextResponse.json({ error: profilesError.message, users: [], total: 0 }, { status: 500 });
    }

    // Check which ones the current viewer is following
    let followingSet = new Set();
    if (currentUserId && targetIds.length > 0) {
      const { data: curFollows } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', currentUserId)
        .in('following_id', targetIds);

      if (curFollows) {
        for (const row of curFollows) {
          followingSet.add(row.following_id);
        }
      }
    }

    // Also fetch followers counts for these users to display social proof
    const followerCountMap = {};
    if (targetIds.length > 0) {
      const { data: fCounts } = await supabase
        .from('follows')
        .select('following_id')
        .in('following_id', targetIds);

      if (fCounts) {
        for (const f of fCounts) {
          followerCountMap[f.following_id] = (followerCountMap[f.following_id] || 0) + 1;
        }
      }
    }

    const formattedUsers = (profiles || []).map((p) => ({
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
