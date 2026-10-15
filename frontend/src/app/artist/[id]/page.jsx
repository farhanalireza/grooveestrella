// src/app/artist/[id]/page.jsx
import { fetchMusicBrainzArtistServer, searchMusicBrainzArtistsServer } from '@/lib/musicbrainzServer';
import ArtistDetailClient from './ArtistDetailClient';

export async function generateMetadata({ params }) {
  const { id } = await params;
  let artist = await fetchMusicBrainzArtistServer(id);
  if (!artist) {
    const searchRes = await searchMusicBrainzArtistsServer(decodeURIComponent(id), 1);
    if (searchRes.length > 0) {
      artist = await fetchMusicBrainzArtistServer(searchRes[0].id);
    }
  }

  if (!artist) {
    return {
      title: 'Artist Not Found | GrooveEstrella',
      description: 'The requested artist could not be found on GrooveEstrella.',
    };
  }

  const coverUrl = artist.images?.[0]?.url || artist.coverArt || 'https://placehold.co/600x600/10141F/60A5FA?text=Artist';

  return {
    title: `${artist.name} | GrooveEstrella`,
    description: `Explore "${artist.name}" on GrooveEstrella. View discography, top tracks, and share artist cards with custom designs.`,
    openGraph: {
      title: artist.name,
      description: `Genres: ${artist.genres?.join(', ') || 'Music'}`,
      images: [{ url: coverUrl, width: 640, height: 640 }],
      type: 'profile',
    },
    twitter: {
      card: 'summary_large_image',
      title: artist.name,
      description: `Discover ${artist.name} on GrooveEstrella`,
      images: [coverUrl],
    }
  };
}

export default async function Page({ params }) {
  const { id } = await params;
  let artistData = await fetchMusicBrainzArtistServer(id);
  if (!artistData) {
    const searchRes = await searchMusicBrainzArtistsServer(decodeURIComponent(id), 1);
    if (searchRes.length > 0) {
      artistData = await fetchMusicBrainzArtistServer(searchRes[0].id);
    }
  }

  return (
    <ArtistDetailClient 
      id={id} 
      initialArtist={artistData} 
      initialTopTracks={artistData?.topTracks || []} 
      initialAlbums={artistData?.albums || []} 
    />
  );
}
