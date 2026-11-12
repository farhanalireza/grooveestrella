// src/lib/journalLinks.js

/**
 * Build a clean URL to the dedicated full-page Journal Creation / Editor page.
 */
export function buildJournalEditorHref({
  mbid = '',
  type = 'album',
  title = '',
  subtitle = '',
  image = '',
  year = null,
  entryId = '',
  returnTo = '',
} = {}) {
  const params = new URLSearchParams();
  if (mbid && !String(mbid).startsWith('custom_log') && !String(mbid).startsWith('log_')) {
    params.set('mbid', mbid);
  }
  if (type) params.set('type', type);
  if (title && title !== 'Personal Listen' && title !== 'New Album Listen') {
    params.set('title', title);
  }
  if (subtitle) params.set('subtitle', subtitle);
  if (image) params.set('image', image);
  if (year) params.set('year', String(year));
  if (entryId) params.set('entryId', entryId);
  if (returnTo) params.set('returnTo', returnTo);

  const qs = params.toString();
  return qs ? `/journal/new?${qs}` : '/journal/new';
}
