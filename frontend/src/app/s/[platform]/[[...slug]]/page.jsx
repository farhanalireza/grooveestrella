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

  let metadata = null;
  try {
    metadata = await Promise.race([
      getTrackMetadata(platform, type, id),
      new Promise((res) => setTimeout(() => res(null), 5000)),
    ]);
  } catch (_) {}

  const capitalizedType = type.charAt(0).toUpperCase() + type.slice(1);
  const title = (metadata?.title || decodeURIComponent(id || 'Music')).replace(/[-_]/g, ' ').trim();
  const artist = (metadata?.artist || '').trim();
  const titleText = artist ? `${title} - ${artist}` : title;
  const descText = `Open and share this ${type} "${title}" ${artist ? `by ${artist} ` : ''}across Spotify, Apple Music, YouTube Music, TIDAL, Deezer and more via GrooveLink.`;
  const rawCover = metadata?.coverArt;
  const coverUrl = (rawCover && typeof rawCover === 'string' && rawCover.startsWith('http'))
    ? rawCover
    : 'https://groove.amplecen.com/icon-512.png';

  const canonicalUrl = `https://groove.amplecen.com/s/${encodeURIComponent(platform)}/${slug ? slug.map(encodeURIComponent).join('/') : ''}`;

  return {
    title: `${titleText} | Universal Music ${capitalizedType}`,
    description: descText,
    openGraph: {
      title: titleText,
      description: descText,
      url: canonicalUrl,
      siteName: 'GrooveEstrella',
      images: [
        {
          url: coverUrl,
          width: 640,
          height: 640,
          alt: `${title} cover art`,
        },
      ],
      type: type === 'track' ? 'music.song' : type === 'album' ? 'music.album' : 'profile',
    },
    twitter: {
      card: 'summary_large_image',
      title: titleText,
      description: descText,
      images: [coverUrl],
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
    if (type === 'track') {
      redirect(`/track/${encodeURIComponent(id)}?groovelink=true`);
    } else if (type === 'album') {
      redirect(`/album/${encodeURIComponent(id)}?groovelink=true`);
    } else if (type === 'artist') {
      redirect(`/artist/${encodeURIComponent(id)}?groovelink=true`);
    }
  }

  redirect('/');
}
