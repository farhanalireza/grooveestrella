// src/app/album/[id]/page.jsx
import { fetchMusicBrainzAlbumServer, searchMusicBrainzAlbumsServer } from '@/lib/musicbrainzServer';
import AlbumDetailClient from './AlbumDetailClient';

export async function generateMetadata({ params }) {
  const { id } = await params;
  let album = null;

  try {
    const data = await Promise.race([
      fetchMusicBrainzAlbumServer(id),
      new Promise((res) => setTimeout(() => res(null), 6000)),
    ]);
    album = data?.album;

    if (!album && id) {
      const searchRes = await Promise.race([
        searchMusicBrainzAlbumsServer(decodeURIComponent(id), 1),
        new Promise((res) => setTimeout(() => res([]), 3500)),
      ]);
      if (searchRes && searchRes.length > 0) {
        const found = await fetchMusicBrainzAlbumServer(searchRes[0].id);
        album = found.album;
      }
    }
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
    : 'https://grooveestrella.com/icon-512.png';

  const canonicalUrl = `https://grooveestrella.com/album/${encodeURIComponent(id)}`;

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
  let { album, tracks } = await fetchMusicBrainzAlbumServer(id);
  if (!album) {
    const searchRes = await searchMusicBrainzAlbumsServer(decodeURIComponent(id), 1);
    if (searchRes.length > 0) {
      const found = await fetchMusicBrainzAlbumServer(searchRes[0].id);
      album = found.album;
      tracks = found.tracks;
    }
  }

  return <AlbumDetailClient id={id} initialAlbum={album} initialTracks={tracks} />;
}
