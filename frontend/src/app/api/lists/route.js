// src/app/api/lists/route.js
import { NextResponse } from 'next/server';
import { getOfficialLists, slugifyListTitle } from '@/lib/supabase/officialLists';
import { requireAdminSession } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const lists = await getOfficialLists();
    return NextResponse.json(
      { lists },
      {
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  } catch (error) {
    console.error('GET /api/lists error:', error);
    return NextResponse.json({ lists: [], error: 'Failed to load official lists' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const auth = await requireAdminSession();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const title = typeof body?.title === 'string' ? body.title.trim() : '';
    const description = typeof body?.description === 'string' ? body.description.trim() : '';
    const coverImageUrl =
      typeof body?.cover_image_url === 'string' && body.cover_image_url.trim()
        ? body.cover_image_url.trim()
        : null;
    const listType = body?.list_type === 'unranked' ? 'unranked' : 'ranked';
    const category =
      typeof body?.category === 'string' && body.category.trim() ? body.category.trim() : 'Curated';
    const badgeLabel =
      typeof body?.badge_label === 'string' && body.badge_label.trim()
        ? body.badge_label.trim()
        : null;

    if (!title) {
      return NextResponse.json({ error: 'List title is required.' }, { status: 400 });
    }

    let slug = slugifyListTitle(body?.slug || title);
    // Ensure slug uniqueness
    const { data: existingSlug } = await auth.adminClient
      .from('official_lists')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();

    if (existingSlug?.id) {
      slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
    }

    const { data: created, error } = await auth.adminClient
      .from('official_lists')
      .insert({
        slug,
        title,
        description: description || null,
        cover_image_url: coverImageUrl,
        list_type: listType,
        category,
        badge_label: badgeLabel,
        is_public: true,
        created_by: auth.user.id,
      })
      .select('*')
      .single();

    if (error) {
      console.error('Insert official list error:', error);
      return NextResponse.json({ error: error.message || 'Failed to create official list' }, { status: 500 });
    }

    return NextResponse.json({ success: true, list: created }, { status: 201 });
  } catch (error) {
    console.error('POST /api/lists error:', error);
    return NextResponse.json({ error: 'Server error creating list' }, { status: 500 });
  }
}
