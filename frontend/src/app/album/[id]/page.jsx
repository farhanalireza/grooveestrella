// src/app/album/[id]/page.jsx
import { fetchMusicBrainzAlbumServer, searchMusicBrainzAlbumsServer } from '@/lib/musicbrainzServer';
import AlbumDetailClient from './AlbumDetailClient';

export async function generateMetadata({ params }) {
  const { id } = await params;
  let album = null;
  try {
    const data = await Promise.race([
      fetchMusicBrainzAlbumServer(id),
      new Promise((res) => setTimeout(() => res(null), 1200)),
    ]);
    album = data?.album;
  } catch (_) {}

  if (!album) {
    return {
      title: 'Album | GrooveEstrella',
      description: 'Discover albums, explore tracklists, and stream across platforms on GrooveEstrella.',
    };
  }

  const artistsName = Array.isArray(album.artists)
    ? album.artists.map(a => a.name).join(', ')
    : (album.artist || 'Various Artists');
  const coverUrl = album.images?.[0]?.url || album.coverArt || 'https://placehold.co/600x600/10141F/60A5FA?text=No+Cover';

  return {
    title: `${album.name || album.title} by ${artistsName} | GrooveEstrella`,
    description: `Discover the album "${album.name || album.title}" by ${artistsName} on GrooveEstrella. Explore tracks and stream across platforms.`,
    openGraph: {
      title: album.name || album.title,
      description: `Artist: ${artistsName} • ${album.total_tracks || 0} tracks`,
      images: [{ url: coverUrl, width: 640, height: 640 }],
      type: 'music.album',
    },
    twitter: {
      card: 'summary_large_image',
      title: album.name || album.title,
      description: `Album: ${album.name || album.title} by ${artistsName}`,
      images: [coverUrl],
    }
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
