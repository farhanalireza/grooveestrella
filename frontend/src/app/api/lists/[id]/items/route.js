// src/app/api/lists/[id]/items/route.js
import { NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/supabase/admin';
import { ensureMusicEntity } from '@/lib/supabase/musicEntities';
import { isUuidString } from '@/lib/supabase/officialLists';

async function resolveListId(client, idOrSlug) {
  const q = client.from('official_lists').select('id');
  const { data } = isUuidString(idOrSlug)
    ? await q.eq('id', idOrSlug).maybeSingle()
    : await q.eq('slug', idOrSlug).maybeSingle();
  return data?.id || null;
}

export async function POST(request, { params }) {
  try {
    const auth = await requireAdminSession();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = await params;
    const listId = await resolveListId(auth.adminClient, decodeURIComponent(id || ''));
    if (!listId) {
      return NextResponse.json({ error: 'Official list not found' }, { status: 404 });
    }

    const body = await request.json();
    const mbid = typeof body?.mbid === 'string' ? body.mbid.trim() : '';
    const type = body?.type === 'artist' || body?.type === 'track' ? body.type : 'album';
    const note = typeof body?.note === 'string' ? body.note.trim() : null;
    const badgeText = typeof body?.badge_text === 'string' ? body.badge_text.trim() : null;

    if (!mbid) {
      return NextResponse.json({ error: 'MusicBrainz MBID is required.' }, { status: 400 });
    }

    // Ensure entity exists in music_entities via MBID
    const entity = await ensureMusicEntity({
      mbid,
      type,
      title: body?.title,
      artist: body?.artist,
      year: Number.isInteger(body?.year) ? body.year : undefined,
      cover_art_url: body?.cover_art_url || null,
    });

    if (!entity?.id || String(entity.id).startsWith('local_')) {
      return NextResponse.json({ error: 'Failed to sync music entity in database.' }, { status: 500 });
    }

    // Check if already in list
    const { data: existingItem } = await auth.adminClient
      .from('official_list_items')
      .select('id')
      .eq('list_id', listId)
      .eq('entity_id', entity.id)
      .maybeSingle();

    if (existingItem?.id) {
      return NextResponse.json({ error: 'This release/artist is already in the list.' }, { status: 409 });
    }

    // Determine next position
    const { data: lastRow } = await auth.adminClient
      .from('official_list_items')
      .select('position')
      .eq('list_id', listId)
      .order('position', { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextPosition = Number.isInteger(body?.position)
      ? Math.max(1, body.position)
      : (lastRow?.position || 0) + 1;

    const { data: inserted, error } = await auth.adminClient
      .from('official_list_items')
      .insert({
        list_id: listId,
        entity_id: entity.id,
        position: nextPosition,
        note: note || null,
        badge_text: badgeText || null,
      })
      .select(`
        id,
        list_id,
        entity_id,
        position,
        note,
        badge_text,
        created_at,
        music_entities (
          id,
          mbid,
          type,
          title,
          artist_credit,
          year,
          cover_art_url
        )
      `)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message || 'Failed to add list item' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      item: {
        id: inserted.id,
        list_id: inserted.list_id,
        entity_id: inserted.entity_id,
        position: inserted.position,
        note: inserted.note || '',
        badge_text: inserted.badge_text || null,
        entity: inserted.music_entities,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('POST /api/lists/[id]/items error:', error);
    return NextResponse.json({ error: 'Server error adding list item' }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const auth = await requireAdminSession();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = await params;
    const listId = await resolveListId(auth.adminClient, decodeURIComponent(id || ''));
    if (!listId) {
      return NextResponse.json({ error: 'Official list not found' }, { status: 404 });
    }

    const body = await request.json();

    // Case 1: Reorder all items via orderedItemIds array
    if (Array.isArray(body?.orderedItemIds)) {
      const ordered = body.orderedItemIds.filter(Boolean);
      await Promise.all(
        ordered.map((itemId, index) =>
          auth.adminClient
            .from('official_list_items')
            .update({ position: index + 1, updated_at: new Date().toISOString() })
            .eq('id', itemId)
            .eq('list_id', listId)
        )
      );
      return NextResponse.json({ success: true });
    }

    // Case 2: Update a single item's note / badge_text / position
    const itemId = body?.itemId;
    if (!itemId) {
      return NextResponse.json({ error: 'itemId or orderedItemIds is required.' }, { status: 400 });
    }

    const updates = { updated_at: new Date().toISOString() };
    if (body.note !== undefined) {
      updates.note = typeof body.note === 'string' && body.note.trim() ? body.note.trim() : null;
    }
    if (body.badge_text !== undefined) {
      updates.badge_text =
        typeof body.badge_text === 'string' && body.badge_text.trim()
          ? body.badge_text.trim()
          : null;
    }
    if (Number.isInteger(body.position)) {
      updates.position = Math.max(1, body.position);
    }

    const { data: updated, error } = await auth.adminClient
      .from('official_list_items')
      .update(updates)
      .eq('id', itemId)
      .eq('list_id', listId)
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message || 'Failed to update item' }, { status: 500 });
    }

    return NextResponse.json({ success: true, item: updated });
  } catch (error) {
    console.error('PATCH /api/lists/[id]/items error:', error);
    return NextResponse.json({ error: 'Server error updating list items' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const auth = await requireAdminSession();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = await params;
    const listId = await resolveListId(auth.adminClient, decodeURIComponent(id || ''));
    if (!listId) {
      return NextResponse.json({ error: 'Official list not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId');
    if (!itemId) {
      return NextResponse.json({ error: 'itemId query parameter is required.' }, { status: 400 });
    }

    const { error } = await auth.adminClient
      .from('official_list_items')
      .delete()
      .eq('id', itemId)
      .eq('list_id', listId);

    if (error) {
      return NextResponse.json({ error: error.message || 'Failed to remove item' }, { status: 500 });
    }

    // Re-normalize remaining item positions 1..N
    const { data: remaining } = await auth.adminClient
      .from('official_list_items')
      .select('id')
      .eq('list_id', listId)
      .order('position', { ascending: true });

    if (Array.isArray(remaining) && remaining.length > 0) {
      await Promise.all(
        remaining.map((row, index) =>
          auth.adminClient
            .from('official_list_items')
            .update({ position: index + 1 })
            .eq('id', row.id)
        )
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/lists/[id]/items error:', error);
    return NextResponse.json({ error: 'Server error removing list item' }, { status: 500 });
  }
}
