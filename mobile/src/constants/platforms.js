/**
 * Platform metadata for supported streaming and music catalog services.
 * Matches web app colors, branding, and deep-linking conventions.
 */

export const PLATFORMS = {
  spotify: {
    id: 'spotify',
    name: 'Spotify',
    accentColor: '#1DB954',
    accent: '#1DB954',
    bgColor: 'rgba(29, 185, 84, 0.15)',
    textColor: '#FFFFFF',
    icon: 'musical-notes',
    iconAlt: 'play-circle',
    iconFamily: 'Ionicons',
    domain: 'open.spotify.com',
    searchBaseUrl: 'https://open.spotify.com/search/',
  },
  apple_music: {
    id: 'apple_music',
    name: 'Apple Music',
    accentColor: '#FC3C44',
    accent: '#FC3C44',
    bgColor: 'rgba(252, 60, 68, 0.15)',
    textColor: '#FFFFFF',
    icon: 'logo-apple',
    iconFamily: 'Ionicons',
    domain: 'music.apple.com',
    searchBaseUrl: 'https://music.apple.com/us/search?term=',
  },
  youtube_music: {
    id: 'youtube_music',
    name: 'YouTube Music',
    accentColor: '#FF0000',
    accent: '#FF0000',
    bgColor: 'rgba(255, 0, 0, 0.15)',
    textColor: '#FFFFFF',
    icon: 'play-circle',
    iconAlt: 'logo-youtube',
    iconFamily: 'Ionicons',
    domain: 'music.youtube.com',
    searchBaseUrl: 'https://music.youtube.com/search?q=',
  },
  youtube: {
    id: 'youtube',
    name: 'YouTube',
    accentColor: '#FF0000',
    accent: '#FF0000',
    bgColor: 'rgba(255, 0, 0, 0.12)',
    textColor: '#FFFFFF',
    icon: 'logo-youtube',
    iconFamily: 'Ionicons',
    domain: 'youtube.com',
    searchBaseUrl: 'https://www.youtube.com/results?search_query=',
  },
  deezer: {
    id: 'deezer',
    name: 'Deezer',
    accentColor: '#A238FF',
    accent: '#A238FF',
    bgColor: 'rgba(162, 56, 255, 0.15)',
    textColor: '#FFFFFF',
    icon: 'disc',
    iconFamily: 'Ionicons',
    domain: 'deezer.com',
    searchBaseUrl: 'https://www.deezer.com/search/',
  },
  tidal: {
    id: 'tidal',
    name: 'TIDAL',
    accentColor: '#00FFFF',
    accent: '#00FFFF',
    bgColor: 'rgba(0, 255, 255, 0.15)',
    textColor: '#FFFFFF',
    icon: 'infinite',
    iconAlt: 'diamond',
    iconFamily: 'Ionicons',
    domain: 'listen.tidal.com',
    searchBaseUrl: 'https://listen.tidal.com/search?q=',
  },
  soundcloud: {
    id: 'soundcloud',
    name: 'SoundCloud',
    accentColor: '#FF5500',
    accent: '#FF5500',
    bgColor: 'rgba(255, 85, 0, 0.15)',
    textColor: '#FFFFFF',
    icon: 'logo-soundcloud',
    iconFamily: 'Ionicons',
    domain: 'soundcloud.com',
    searchBaseUrl: 'https://soundcloud.com/search?q=',
  },
  musicbrainz: {
    id: 'musicbrainz',
    name: 'MusicBrainz',
    accentColor: '#BA478F',
    accent: '#BA478F',
    bgColor: 'rgba(186, 71, 143, 0.18)',
    textColor: '#FFFFFF',
    icon: 'library',
    iconFamily: 'Ionicons',
    domain: 'musicbrainz.org',
    searchBaseUrl: 'https://musicbrainz.org/search?query=',
  },
};

/**
 * Array of all supported platforms for iterate/render
 */
export const PLATFORMS_LIST = Object.values(PLATFORMS);

/**
 * Get platform metadata safely with fallback
 * @param {string} platformKey
 */
export const getPlatform = (platformKey) => {
  if (!platformKey) return PLATFORMS.spotify;
  const normalizedKey = platformKey.toLowerCase().replace(/[-\s]/g, '_');
  return PLATFORMS[normalizedKey] || PLATFORMS.spotify;
};

/**
 * Check if platform is supported
 * @param {string} platformKey
 */
export const isPlatformSupported = (platformKey) => {
  if (!platformKey) return false;
  const normalizedKey = platformKey.toLowerCase().replace(/[-\s]/g, '_');
  return Boolean(PLATFORMS[normalizedKey]);
};

/**
 * Generate deep-link or web search link for a track/album/artist
 * @param {string} platformKey
 * @param {string} query
 * @param {'track' | 'album' | 'artist'} [type='track']
 */
export const generatePlatformUrl = (platformKey, query, type = 'track') => {
  const platform = getPlatform(platformKey);
  const typeSuffix = type === 'album' ? ' album' : type === 'artist' ? ' artist' : '';
  const fullQuery = encodeURIComponent(`${query}${typeSuffix}`);

  if (platformKey === 'musicbrainz') {
    const mbType = type === 'album' ? 'release_group' : type === 'artist' ? 'artist' : 'recording';
    return `${platform.searchBaseUrl}${fullQuery}&type=${mbType}&method=indexed`;
  }

  return `${platform.searchBaseUrl}${fullQuery}`;
};

export default PLATFORMS;
