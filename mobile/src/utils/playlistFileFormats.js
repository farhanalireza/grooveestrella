// mobile/src/utils/playlistFileFormats.js
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Clipboard from 'expo-clipboard';
import Toast from 'react-native-toast-message';

// Helper: Format milliseconds to mm:ss
function formatTime(ms) {
  if (!ms) return '00:00';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// Helper: Format milliseconds to CUE sheet mm:ss:ff (frames)
function formatCueTime(ms) {
  if (!ms) return '00:00:00';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const frames = Math.floor(((ms % 1000) / 1000) * 75);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}:${String(frames).padStart(2, '0')}`;
}

// Helper: Normalize tracks list
export function getTrackList(playlist, tracks) {
  if (Array.isArray(tracks) && tracks.length > 0) return tracks;
  if (Array.isArray(playlist?.tracks?.items)) return playlist.tracks.items;
  if (Array.isArray(playlist?.tracks)) return playlist.tracks;
  return [];
}

/**
 * Generates an Extended M3U or M3U8 string
 */
export function generateM3U(playlist, tracks = [], isM3U8 = false) {
  const trackList = getTrackList(playlist, tracks);
  const lines = [
    '#EXTM3U',
    `#PLAYLIST:${playlist?.name || 'GrooveEstrella Playlist'}`,
    `#EXTGENRE:${playlist?.genre || 'Curated Music'}`,
    '#EXTREM:Exported from GrooveEstrella Mobile',
    '',
  ];

  trackList.forEach((item, idx) => {
    const t = item.track || item;
    const title = t.name || t.title || `Track ${idx + 1}`;
    const artist = Array.isArray(t.artists)
      ? t.artists.map((a) => a.name).join(', ')
      : t.artist || 'Unknown Artist';
    const seconds = Math.floor((t.duration_ms || t.duration || 0) / 1000);
    const link = t.external_urls?.spotify || t.spoURL || t.YTURL || `grooveestrella:track:${t.id || idx}`;

    lines.push(`#EXTINF:${seconds},${artist} - ${title}`);
    lines.push(link);
    lines.push('');
  });

  return lines.join('\n');
}

/**
 * Generates an Audiophile CUE Sheet string
 */
export function generateCUE(playlist, tracks = []) {
  const trackList = getTrackList(playlist, tracks);
  const owner = playlist?.owner?.display_name || playlist?.owner || 'GrooveEstrella';
  const lines = [
    `TITLE "${playlist?.name || 'GrooveEstrella Playlist'}"`,
    `PERFORMER "${owner}"`,
    'REM GENRE "Music"',
    `REM DATE "${new Date().getFullYear()}"`,
    'REM COMMENT "Exported from GrooveEstrella Mobile"',
    'FILE "GrooveEstrella_Playlist.wav" WAVE',
    '',
  ];

  let cumulativeMs = 0;

  trackList.forEach((item, idx) => {
    const t = item.track || item;
    const title = t.name || t.title || `Track ${idx + 1}`;
    const artist = Array.isArray(t.artists)
      ? t.artists.map((a) => a.name).join(', ')
      : t.artist || 'Unknown Artist';
    const trackNum = String(idx + 1).padStart(2, '0');

    lines.push(`  TRACK ${trackNum} AUDIO`);
    lines.push(`    TITLE "${title.replace(/"/g, "'")}"`);
    lines.push(`    PERFORMER "${artist.replace(/"/g, "'")}"`);
    lines.push(`    INDEX 01 ${formatCueTime(cumulativeMs)}`);
    lines.push('');

    cumulativeMs += t.duration_ms || t.duration || 180000;
  });

  return lines.join('\n');
}

/**
 * Generates a clean Plain Text Tracklist (.txt)
 */
export function generateTXT(playlist, tracks = []) {
  const trackList = getTrackList(playlist, tracks);
  const owner = playlist?.owner?.display_name || playlist?.owner || 'GrooveEstrella';
  const lines = [
    '============================================================',
    `PLAYLIST: ${playlist?.name || 'Untitled Playlist'}`,
    `CURATOR:  ${owner}`,
    `TRACKS:   ${trackList.length} songs`,
    `EXPORTED: ${new Date().toLocaleDateString()}`,
    'SOURCE:   GrooveEstrella Mobile',
    '============================================================',
    '',
  ];

  trackList.forEach((item, idx) => {
    const t = item.track || item;
    const title = t.name || t.title || 'Unknown Title';
    const artist = Array.isArray(t.artists)
      ? t.artists.map((a) => a.name).join(', ')
      : t.artist || 'Unknown Artist';
    const duration = formatTime(t.duration_ms || t.duration);
    const num = String(idx + 1).padStart(2, ' ');

    lines.push(`${num}. ${artist} - ${title} [${duration}]`);
    if (t.album?.name || t.album) {
      lines.push(`    Album: ${t.album.name || t.album}`);
    }
    if (t.external_urls?.spotify || t.spoURL) {
      lines.push(`    Stream: ${t.external_urls?.spotify || t.spoURL}`);
    }
    lines.push('');
  });

  return lines.join('\n');
}

/**
 * Generates a portable JSON playlist file (.json)
 */
export function generateJSON(playlist, tracks = []) {
  const trackList = getTrackList(playlist, tracks);
  const normalizedTracks = trackList.map((item) => {
    const t = item.track || item;
    return {
      id: t.id || '',
      title: t.name || t.title || 'Track',
      name: t.name || t.title || 'Track',
      artists: Array.isArray(t.artists) ? t.artists : [{ name: t.artist || 'Unknown' }],
      artist: Array.isArray(t.artists) ? t.artists.map((a) => a.name).join(', ') : t.artist || 'Unknown',
      album: t.album?.name || t.album || '',
      duration_ms: t.duration_ms || t.duration || 0,
      image: t.album?.images?.[0]?.url || t.image || t.coverArt || '',
      spotifyUrl: t.external_urls?.spotify || t.spoURL || '',
      youtubeUrl: t.YTURL || '',
    };
  });

  const payload = {
    version: '1.0',
    app: 'GrooveEstrella',
    type: 'playlist',
    name: playlist?.name || 'Groove Playlist',
    description: playlist?.description || 'Shared from GrooveEstrella',
    owner: playlist?.owner?.display_name || playlist?.owner || 'GrooveEstrella Curator',
    image: playlist?.images?.[0]?.url || playlist?.image || '',
    exportedAt: new Date().toISOString(),
    tracks: normalizedTracks,
  };

  return JSON.stringify(payload, null, 2);
}

/**
 * Gets file content for a given format
 */
export function getPlaylistExportString(playlist, tracks = [], format = 'm3u') {
  switch (format) {
    case 'm3u':
      return { content: generateM3U(playlist, tracks, false), mime: 'audio/x-mpegurl', ext: 'm3u' };
    case 'm3u8':
      return { content: generateM3U(playlist, tracks, true), mime: 'application/x-mpegurl', ext: 'm3u8' };
    case 'cue':
      return { content: generateCUE(playlist, tracks), mime: 'application/x-cue', ext: 'cue' };
    case 'txt':
      return { content: generateTXT(playlist, tracks), mime: 'text/plain', ext: 'txt' };
    case 'json':
      return { content: generateJSON(playlist, tracks), mime: 'application/json', ext: 'json' };
    default:
      return { content: generateM3U(playlist, tracks, false), mime: 'text/plain', ext: 'm3u' };
  }
}

/**
 * Saves and shares a playlist file via native device share sheet
 */
export async function sharePlaylistFile(playlist, tracks = [], format = 'm3u') {
  try {
    const { content, ext } = getPlaylistExportString(playlist, tracks, format);
    const cleanName = (playlist?.name || 'playlist').replace(/[^a-zA-Z0-9_\-]/g, '_');
    const fileName = `${cleanName}.${ext}`;
    const fileUri = `${FileSystem.cacheDirectory}${fileName}`;

    await FileSystem.writeAsStringAsync(fileUri, content, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(fileUri, {
        mimeType: ext === 'json' ? 'application/json' : 'text/plain',
        dialogTitle: `Share ${playlist?.name || 'Playlist'}`,
        UTI: ext === 'json' ? 'public.json' : 'public.plain-text',
      });
      return true;
    } else {
      await Clipboard.setStringAsync(content);
      Toast.show({
        type: 'info',
        text1: 'Content Copied 📋',
        text2: 'File sharing not available, copied to clipboard',
      });
      return true;
    }
  } catch (err) {
    console.error('Error sharing playlist file:', err);
    Toast.show({
      type: 'error',
      text1: 'Export Failed',
      text2: err.message || 'Could not export playlist',
    });
    return false;
  }
}

/**
 * Auto-detect and parse any playlist file string (.json, .m3u, .m3u8, .cue, .txt)
 */
export function parsePlaylistFile(fileContent, fileName = 'playlist') {
  if (!fileContent || typeof fileContent !== 'string') {
    throw new Error('Empty file content');
  }

  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  const trimmed = fileContent.trim();

  // 1. JSON format
  if (ext === 'json' || trimmed.startsWith('{')) {
    try {
      const data = JSON.parse(trimmed);
      const name = data.name || data.title || fileName.replace(/\.[^/.]+$/, '');
      const description = data.description || `Imported playlist from ${fileName}`;
      const rawTracks = data.tracks || data.items || [];
      const parsedTracks = rawTracks.map((t, idx) => {
        const title = t.title || t.name || `Track ${idx + 1}`;
        const artists = Array.isArray(t.artists)
          ? t.artists
          : [{ name: t.artist || 'Unknown Artist' }];
        const img = t.image || t.album?.images?.[0]?.url || '';

        return {
          added_at: new Date().toISOString(),
          track: {
            id: t.id || '',
            name: title,
            title: title,
            artists: artists,
            duration_ms: t.duration_ms || t.duration || 180000,
            album: {
              name: t.album?.name || t.album || 'Imported Release',
              images: img ? [{ url: img }] : [],
            },
            external_urls: {
              spotify: t.spotifyUrl || t.spoURL || '',
            },
            spoURL: t.spotifyUrl || t.spoURL || '',
            YTURL: t.youtubeUrl || t.YTURL || '',
          },
        };
      });

      return {
        name,
        description,
        tracks: parsedTracks,
        image: data.image || '',
      };
    } catch (e) {
      console.warn('JSON parse failed in mobile:', e);
    }
  }

  // 2. M3U / M3U8
  if (trimmed.includes('#EXTM3U') || ext === 'm3u' || ext === 'm3u8') {
    const lines = trimmed.split(/\r?\n/);
    let playlistName = fileName.replace(/\.[^/.]+$/, '');
    const parsedTracks = [];
    let currentExtInf = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      if (line.startsWith('#PLAYLIST:')) {
        playlistName = line.replace('#PLAYLIST:', '').trim() || playlistName;
      } else if (line.startsWith('#EXTINF:')) {
        const info = line.substring(8);
        const commaIdx = info.indexOf(',');
        const secondsStr = commaIdx !== -1 ? info.substring(0, commaIdx) : '0';
        const artistAndTitle = commaIdx !== -1 ? info.substring(commaIdx + 1).trim() : info.trim();
        const seconds = parseInt(secondsStr, 10) || 0;

        let artist = 'Unknown Artist';
        let title = artistAndTitle;
        if (artistAndTitle.includes(' - ')) {
          const parts = artistAndTitle.split(' - ');
          artist = parts[0].trim();
          title = parts.slice(1).join(' - ').trim();
        }

        currentExtInf = { artist, title, seconds };
      } else if (!line.startsWith('#')) {
        const artist = currentExtInf?.artist || 'Unknown Artist';
        const title = currentExtInf?.title || line.split('/').pop().replace(/\.[^/.]+$/, '') || 'Track';
        const seconds = currentExtInf?.seconds || 180;
        const link = line.startsWith('http') ? line : '';

        parsedTracks.push({
          added_at: new Date().toISOString(),
          track: {
            id: '',
            name: title,
            title: title,
            artists: [{ name: artist }],
            duration_ms: seconds * 1000,
            album: { name: 'Imported from M3U', images: [] },
            external_urls: { spotify: link },
            spoURL: link,
            YTURL: '',
          },
        });
        currentExtInf = null;
      }
    }

    if (parsedTracks.length > 0) {
      return {
        name: playlistName,
        description: `Imported from M3U file "${fileName}"`,
        tracks: parsedTracks,
        image: '',
      };
    }
  }

  // 3. Plain Text fallback
  const textLines = trimmed.split(/\r?\n/).filter(Boolean);
  const parsedTracks = [];
  let playlistName = fileName.replace(/\.[^/.]+$/, '');

  for (const rawLine of textLines) {
    let line = rawLine.trim();
    if (line.startsWith('PLAYLIST:')) {
      playlistName = line.replace('PLAYLIST:', '').trim() || playlistName;
      continue;
    }
    if (line.startsWith('=') || line.startsWith('CURATOR:') || line.startsWith('TRACKS:') || line.startsWith('EXPORTED:') || line.startsWith('SOURCE:')) {
      continue;
    }
    line = line.replace(/^\d+[\.\)]\s*/, '').trim();
    line = line.replace(/\[\d+:\d+\]/, '').trim();

    if (!line) continue;

    let artist = 'Unknown Artist';
    let title = line;
    if (line.includes(' - ')) {
      const parts = line.split(' - ');
      artist = parts[0].trim();
      title = parts.slice(1).join(' - ').trim();
    }

    parsedTracks.push({
      added_at: new Date().toISOString(),
      track: {
        id: '',
        name: title,
        title: title,
        artists: [{ name: artist }],
        duration_ms: 180000,
        album: { name: 'Imported from Text', images: [] },
        external_urls: { spotify: '' },
        spoURL: '',
        YTURL: '',
      },
    });
  }

  return {
    name: playlistName,
    description: `Imported from file "${fileName}"`,
    tracks: parsedTracks,
    image: '',
  };
}
