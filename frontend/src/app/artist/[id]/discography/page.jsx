// src/app/artist/[id]/discography/page.jsx
import { fetchMusicBrainzArtistServer, searchMusicBrainzArtistsServer } from '@/lib/musicbrainzServer';
import ArtistDiscographyClient from './ArtistDiscographyClient';

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
      title: 'Discography Not Found | GrooveEstrella',
      description: 'The requested artist discography could not be found.',
    };
  }

  return {
    title: `${artist.name} - Discography & All Releases | GrooveEstrella`,
    description: `Browse all studio albums, singles, EPs, compilations, and live recordings by ${artist.name} on GrooveEstrella.`,
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
    <ArtistDiscographyClient 
      id={id} 
      artist={artistData} 
      allReleases={artistData?.allReleases || artistData?.albums || []} 
    />
  );
}
