// src/app/s/[platform]/[[...slug]]/page.jsx
import { redirect } from 'next/navigation';
import { getTrackMetadata } from '@/lib/musicProviders';

// Generate dynamic metadata for SEO and rich previews in social apps
export async function generateMetadata({ params }) {
  const { platform, slug } = await params;
  
  let type = 'track';
  let id = '';
  if (slug && slug.length === 1) {
    id = slug[0];
  } else if (slug && slug.length >= 2) {
    type = slug[0];
    id = slug[1];
  }

  const metadata = await getTrackMetadata(platform, type, id);

  if (!metadata) {
    return {
      title: 'Music Item Not Found | GrooveLink',
      description: 'The requested music item could not be resolved.',
    };
  }

  const capitalizedType = type.charAt(0).toUpperCase() + type.slice(1);
  const titleText = `${metadata.title} - ${metadata.artist}`;
  return {
    title: `${titleText} | Universal Music ${capitalizedType}`,
    description: `Open and share this ${type} "${metadata.title}" by ${metadata.artist} across Spotify, Apple Music, YouTube Music, TIDAL, Deezer and more.`,
    openGraph: {
      title: titleText,
      description: `Access this ${type} on your preferred streaming service instantly via GrooveLink.`,
      images: [
        {
          url: metadata.coverArt,
          width: 500,
          height: 500,
          alt: `${metadata.title} cover art`,
        },
      ],
      type: type === 'track' ? 'music.song' : type === 'album' ? 'music.album' : 'profile',
    },
    twitter: {
      card: 'summary_large_image',
      title: titleText,
      description: `Access this ${type} on your preferred streaming service instantly.`,
      images: [metadata.coverArt],
    },
  };
}

export default async function UniversalLinkPage({ params }) {
  const { slug } = await params;

  let type = 'track';
  let id = '';
  if (slug && slug.length === 1) {
    id = slug[0];
  } else if (slug && slug.length >= 2) {
    type = slug[0];
    id = slug[1];
  }

  if (id) {
    redirect(`/${type}/${encodeURIComponent(id)}?groovelink=true`);
  }

  redirect('/');
}
