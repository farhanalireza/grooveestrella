// src/app/api/lists/[id]/route.js
import { NextResponse } from 'next/server';
import { getOfficialListBySlugOrId, isUuidString } from '@/lib/supabase/officialLists';
import { requireAdminSession } from '@/lib/supabase/admin';

async function resolveListRecord(client, idOrSlug) {
  const q = client.from('official_lists').select('id, slug');
  const { data } = isUuidString(idOrSlug)
    ? await q.eq('id', idOrSlug).maybeSingle()
    : await q.eq('slug', idOrSlug).maybeSingle();
  return data;
}

export async function GET(_request, { params }) {
  try {
    const { id } = await params;
    const decoded = decodeURIComponent(id || '');
    const data = await getOfficialListBySlugOrId(decoded);

    if (!data?.list) {
      return NextResponse.json({ error: 'Official list not found' }, { status: 404 });
    }

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('GET /api/lists/[id] error:', error);
    return NextResponse.json({ error: 'Failed to load official list' }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const auth = await requireAdminSession();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = await params;
    const decoded = decodeURIComponent(id || '');
    const existing = await resolveListRecord(auth.adminClient, decoded);
    if (!existing) {
      return NextResponse.json({ error: 'Official list not found' }, { status: 404 });
    }

    const body = await request.json();
    const updates = {};

    if (typeof body.title === 'string') {
      const trimmed = body.title.trim();
      if (!trimmed) {
        return NextResponse.json({ error: 'Title cannot be empty.' }, { status: 400 });
      }
      updates.title = trimmed;
    }
    if (body.description !== undefined) {
      updates.description = typeof body.description === 'string' && body.description.trim()
        ? body.description.trim()
        : null;
    }
    if (body.cover_image_url !== undefined) {
      updates.cover_image_url =
        typeof body.cover_image_url === 'string' && body.cover_image_url.trim()
          ? body.cover_image_url.trim()
          : null;
    }
    if (body.list_type === 'ranked' || body.list_type === 'unranked') {
      updates.list_type = body.list_type;
    }
    if (body.category !== undefined) {
      updates.category = typeof body.category === 'string' && body.category.trim()
        ? body.category.trim()
        : 'Curated';
    }
    if (body.badge_label !== undefined) {
      updates.badge_label =
        typeof body.badge_label === 'string' && body.badge_label.trim()
          ? body.badge_label.trim()
          : null;
    }
    updates.is_public = true;
    updates.updated_at = new Date().toISOString();

    const { data: updated, error } = await auth.adminClient
      .from('official_lists')
      .update(updates)
      .eq('id', existing.id)
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message || 'Failed to update list' }, { status: 500 });
    }

    return NextResponse.json({ success: true, list: updated });
  } catch (error) {
    console.error('PATCH /api/lists/[id] error:', error);
    return NextResponse.json({ error: 'Server error updating list' }, { status: 500 });
  }
}

export async function DELETE(_request, { params }) {
  try {
    const auth = await requireAdminSession();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = await params;
    const decoded = decodeURIComponent(id || '');
    const existing = await resolveListRecord(auth.adminClient, decoded);
    if (!existing) {
      return NextResponse.json({ error: 'Official list not found' }, { status: 404 });
    }

    const { error } = await auth.adminClient
      .from('official_lists')
      .delete()
      .eq('id', existing.id);

    if (error) {
      return NextResponse.json({ error: error.message || 'Failed to delete list' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/lists/[id] error:', error);
    return NextResponse.json({ error: 'Server error deleting list' }, { status: 500 });
  }
}
