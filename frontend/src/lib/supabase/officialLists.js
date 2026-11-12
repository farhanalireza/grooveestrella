// src/lib/supabase/officialLists.js
import { getPublicSupabaseClient } from './publicServer';

export function slugifyListTitle(title = '') {
  const base = String(title)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return base || `official-list-${Date.now()}`;
}

export function isUuidString(value) {
  return (
    typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
  );
}

/**
 * Fetch all public Official Curated Lists with item counts and preview covers.
 */
export async function getOfficialLists() {
  const supabase = getPublicSupabaseClient();
  if (!supabase) return [];

  try {
    const { data: lists, error } = await supabase
      .from('official_lists')
      .select(`
        id,
        slug,
        title,
        description,
        cover_image_url,
        list_type,
        category,
        badge_label,
        is_public,
        created_at,
        updated_at,
        official_list_items (
          id,
          position,
          music_entities (
            cover_art_url,
            title
          )
        )
      `)
      .eq('is_public', true)
      .order('created_at', { ascending: false });

    if (error || !Array.isArray(lists)) {
      return [];
    }

    return lists.map((list) => {
      const sortedItems = [...(list.official_list_items || [])].sort(
        (a, b) => (a.position || 0) - (b.position || 0)
      );
      const previewCovers = sortedItems
        .map((it) => it.music_entities?.cover_art_url)
        .filter(Boolean)
        .slice(0, 4);

      return {
        id: list.id,
        slug: list.slug,
        title: list.title,
        description: list.description || '',
        cover_image_url: list.cover_image_url || null,
        list_type: list.list_type === 'unranked' ? 'unranked' : 'ranked',
        category: list.category || 'Curated',
        badge_label: list.badge_label || null,
        is_public: true,
        item_count: sortedItems.length,
        preview_covers: previewCovers,
        created_at: list.created_at,
        updated_at: list.updated_at,
      };
    });
  } catch (err) {
    console.warn('getOfficialLists warning:', err?.message);
    return [];
  }
}

/**
 * Fetch a single public Official Curated List by slug or UUID, with ordered items.
 */
export async function getOfficialListBySlugOrId(slugOrId) {
  if (!slugOrId) return { list: null, items: [] };
  const supabase = getPublicSupabaseClient();
  if (!supabase) return { list: null, items: [] };

  try {
    const query = supabase
      .from('official_lists')
      .select(`
        id,
        slug,
        title,
        description,
        cover_image_url,
        list_type,
        category,
        badge_label,
        is_public,
        created_at,
        updated_at
      `)
      .eq('is_public', true);

    const { data: list, error } = isUuidString(slugOrId)
      ? await query.eq('id', slugOrId).maybeSingle()
      : await query.eq('slug', slugOrId).maybeSingle();

    if (error || !list) {
      return { list: null, items: [] };
    }

    const { data: rawItems } = await supabase
      .from('official_list_items')
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
      .eq('list_id', list.id)
      .order('position', { ascending: true });

    const items = (rawItems || [])
      .filter((it) => it.music_entities)
      .map((it, idx) => ({
        id: it.id,
        list_id: it.list_id,
        entity_id: it.entity_id,
        position: it.position || idx + 1,
        note: it.note || '',
        badge_text: it.badge_text || null,
        entity: {
          id: it.music_entities.id,
          mbid: it.music_entities.mbid,
          type: it.music_entities.type === 'release-group' ? 'album' : it.music_entities.type,
          title: it.music_entities.title,
          artist_credit: it.music_entities.artist_credit || '',
          year: it.music_entities.year || null,
          cover_art_url: it.music_entities.cover_art_url || '',
        },
      }));

    return {
      list: {
        ...list,
        item_count: items.length,
        preview_covers: items
          .map((i) => i.entity.cover_art_url)
          .filter(Boolean)
          .slice(0, 4),
      },
      items,
    };
  } catch (err) {
    console.warn('getOfficialListBySlugOrId warning:', err?.message);
    return { list: null, items: [] };
  }
}

/**
 * Query future-ready Official List badges for any entity MBID.
 */
export async function getEntityOfficialBadges(mbid) {
  if (!mbid) return [];
  const supabase = getPublicSupabaseClient();
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('entity_official_badges')
      .select('*')
      .eq('mbid', mbid)
      .order('position', { ascending: true });

    if (error || !Array.isArray(data)) return [];
    return data;
  } catch (_) {
    return [];
  }
}
