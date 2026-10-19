// src/lib/shareHelper.js
import { toast } from '@/lib/toast';

/**
 * Builds the canonical share text, title, and URL for music items on GrooveEstrella:
 * Type 1: Link sharing format:
 * Check out "{name}" by "{artist}" ({type}) on GrooveEstrella
 * (Or for artists: Check out "{name}" (artist) on GrooveEstrella)
 */
export function getShareData({ name, title, artist, artists, type = 'track', id }) {
  const finalName = (name || title || 'Music').trim();
  const artistsStr = (
    Array.isArray(artists)
      ? artists.map((a) => (typeof a === 'object' ? a.name : a)).join(', ')
      : Array.isArray(artist)
      ? artist.map((a) => (typeof a === 'object' ? a.name : a)).join(', ')
      : typeof artist === 'string'
      ? artist
      : ''
  ).trim();

  const finalType = type ? type.toLowerCase() : 'track';
  const isArtist = finalType === 'artist';

  let shareTitle = '';
  let shareText = '';

  if (isArtist || !artistsStr || artistsStr.toLowerCase() === finalName.toLowerCase()) {
    shareTitle = `${finalName} on GrooveEstrella`;
    shareText = `Check out "${finalName}" (${finalType}) on GrooveEstrella`;
  } else {
    shareTitle = `${finalName} by ${artistsStr}`;
    shareText = `Check out "${finalName}" by "${artistsStr}" (${finalType}) on GrooveEstrella`;
  }

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const shareUrl = id ? `${origin}/${finalType}/${id}` : (typeof window !== 'undefined' ? window.location.href.split('?')[0] : '');

  return {
    title: shareTitle,
    text: shareText,
    url: shareUrl,
    fullText: `${shareText}\n${shareUrl}`,
  };
}

/**
 * Triggers native Web Share or falls back to clipboard copy with consistent toast feedback
 */
export async function shareLink(item) {
  const { title, text, url, fullText } = getShareData(item);

  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({
        title,
        text,
        url,
      });
      return true;
    } catch (err) {
      if (err.name === 'AbortError') return false;
    }
  }

  // Fallback to clipboard
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(fullText);
      toast.success('Link copied to clipboard! 📋');
      return true;
    } catch (_) {
      toast.info(url);
      return false;
    }
  } else {
    toast.info(url);
    return false;
  }
}
