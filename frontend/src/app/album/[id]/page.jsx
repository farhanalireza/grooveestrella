// src/app/album/[id]/page.jsx
import { cache } from 'react';
import { fetchMusicBrainzAlbumServer, searchMusicBrainzAlbumsServer } from '@/lib/musicbrainzServer';
import AlbumDetailClient from './AlbumDetailClient';

// Enable Incremental Static Regeneration (ISR) at Vercel Edge for 24 hours
// Instant < 100ms response time on all cached visits
export const revalidate = 86400;

// Deduplicate server fetch between generateMetadata and Page component
const getAlbumData = cache(async (id) => {
  if (!id) return { album: null, tracks: [] };
  let res = await fetchMusicBrainzAlbumServer(id);
  if (!res?.album && id) {
    try {
      const searchRes = await searchMusicBrainzAlbumsServer(decodeURIComponent(id), 1);
      if (searchRes && searchRes.length > 0) {
        res = await fetchMusicBrainzAlbumServer(searchRes[0].id);
      }
    } catch (_) {}
  }
  return res || { album: null, tracks: [] };
});

export async function generateMetadata({ params }) {
  const { id } = await params;
  let album = null;

  try {
    const data = await Promise.race([
      getAlbumData(id),
      new Promise((res) => setTimeout(() => res(null), 4000)),
    ]);
    album = data?.album;
  } catch (_) {}

  const cleanName = (album?.name || album?.title || decodeURIComponent(id || 'Album')).replace(/[-_]/g, ' ').trim();
  const artistsName = (
    Array.isArray(album?.artists)
      ? album.artists.map((a) => (typeof a === 'object' ? a.name : a)).join(', ')
      : typeof album?.artist === 'string'
      ? album.artist
      : ''
  ).trim();

  const titleDisplay = artistsName ? `${cleanName} by ${artistsName}` : cleanName;
  const descDisplay = artistsName
    ? `Explore "${cleanName}" by ${artistsName} on GrooveEstrella • ${album?.total_tracks ? `${album.total_tracks} tracks, ` : ''}editions, pressings, and universal streaming links.`
    : `Explore the album "${cleanName}" on GrooveEstrella. View pressings, tracks, and stream across platforms.`;

  const rawCover = album?.images?.[0]?.url || album?.coverArt || album?.url;
  const coverUrl = (rawCover && typeof rawCover === 'string' && rawCover.startsWith('http'))
    ? rawCover
    : 'https://groove.amplecen.com/icon-512.png';

  const canonicalUrl = `https://groove.amplecen.com/album/${encodeURIComponent(id)}`;

  return {
    title: `${titleDisplay} | GrooveEstrella`,
    description: descDisplay,
    openGraph: {
      title: titleDisplay,
      description: descDisplay,
      url: canonicalUrl,
      siteName: 'GrooveEstrella',
      images: [
        {
          url: coverUrl,
          width: 640,
          height: 640,
          alt: cleanName,
        },
      ],
      type: 'music.album',
    },
    twitter: {
      card: 'summary_large_image',
      title: titleDisplay,
      description: descDisplay,
      images: [coverUrl],
    },
  };
}

export default async function Page({ params }) {
  const { id } = await params;
  const { album, tracks } = await getAlbumData(id);

  return <AlbumDetailClient id={id} initialAlbum={album} initialTracks={tracks} />;
}
