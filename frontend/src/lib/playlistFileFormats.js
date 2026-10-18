// src/lib/playlistFileFormats.js
/**
 * GrooveEstrella Playlist File Importer & Exporter
 * Supports M3U, M3U8, CUE, TXT, and GrooveEstrella JSON
 */

// Helper: Format milliseconds to mm:ss
function formatTime(ms) {
  if (!ms) return "00:00";
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

// Helper: Format milliseconds to CUE sheet mm:ss:ff (frames)
function formatCueTime(ms) {
  if (!ms) return "00:00:00";
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const frames = Math.floor(((ms % 1000) / 1000) * 75);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}:${String(frames).padStart(2, "0")}`;
}

// Helper: Normalize tracks from either parameter or playlist object
function getTrackList(playlist, tracks) {
  if (Array.isArray(tracks) && tracks.length > 0) return tracks;
  if (Array.isArray(playlist?.tracks?.items)) return playlist.tracks.items;
  if (Array.isArray(playlist?.tracks)) return playlist.tracks;
  return [];
}

/**
 * Generates an Extended M3U or M3U8 string
 */
export function generateM3U(playlist, tracks, isM3U8 = false) {
  const trackList = getTrackList(playlist, tracks);
  const lines = [
    "#EXTM3U",
    `#PLAYLIST:${playlist?.name || "GrooveEstrella Playlist"}`,
    `#EXTGENRE:${playlist?.genre || "Curated Music"}`,
    `#EXTREM:Exported from GrooveEstrella (https://grooveestrella.com)`,
    ""
  ];

  trackList.forEach((item, idx) => {
    const t = item.track || item;
    const title = t.name || t.title || `Track ${idx + 1}`;
    const artist = Array.isArray(t.artists)
      ? t.artists.map((a) => a.name).join(", ")
      : (t.artist || "Unknown Artist");
    const seconds = Math.floor((t.duration_ms || t.duration || 0) / 1000);
    const link = t.external_urls?.spotify || t.spoURL || t.YTURL || `grooveestrella:track:${t.id || idx}`;

    lines.push(`#EXTINF:${seconds},${artist} - ${title}`);
    lines.push(link);
    lines.push("");
  });

  return lines.join("\n");
}

/**
 * Generates an Audiophile CUE Sheet string
 */
export function generateCUE(playlist, tracks) {
  const trackList = getTrackList(playlist, tracks);
  const owner = playlist.owner?.display_name || playlist.owner || "GrooveEstrella";
  const lines = [
    `TITLE "${playlist.name || "GrooveEstrella Playlist"}"`,
    `PERFORMER "${owner}"`,
    `REM GENRE "Music"`,
    `REM DATE "${new Date().getFullYear()}"`,
    `REM COMMENT "Exported from GrooveEstrella"`,
    `FILE "GrooveEstrella_Playlist.wav" WAVE`,
    ""
  ];

  let cumulativeMs = 0;

  trackList.forEach((item, idx) => {
    const t = item.track || item;
    const title = t.name || t.title || `Track ${idx + 1}`;
    const artist = Array.isArray(t.artists)
      ? t.artists.map((a) => a.name).join(", ")
      : (t.artist || "Unknown Artist");
    const trackNum = String(idx + 1).padStart(2, "0");

    lines.push(`  TRACK ${trackNum} AUDIO`);
    lines.push(`    TITLE "${title.replace(/"/g, "'")}"`);
    lines.push(`    PERFORMER "${artist.replace(/"/g, "'")}"`);
    lines.push(`    INDEX 01 ${formatCueTime(cumulativeMs)}`);
    lines.push("");

    cumulativeMs += (t.duration_ms || t.duration || 180000);
  });

  return lines.join("\n");
}

/**
 * Generates a clean Plain Text Tracklist (.txt)
 */
export function generateTXT(playlist, tracks) {
  const trackList = getTrackList(playlist, tracks);
  const owner = playlist.owner?.display_name || playlist.owner || "GrooveEstrella";
  const lines = [
    `============================================================`,
    `PLAYLIST: ${playlist.name || "Untitled Playlist"}`,
    `CURATOR:  ${owner}`,
    `TRACKS:   ${trackList.length} songs`,
    `EXPORTED: ${new Date().toLocaleDateString()}`,
    `SOURCE:   GrooveEstrella (https://grooveestrella.com)`,
    `============================================================`,
    ""
  ];

  trackList.forEach((item, idx) => {
    const t = item.track || item;
    const title = t.name || t.title || "Unknown Title";
    const artist = Array.isArray(t.artists)
      ? t.artists.map((a) => a.name).join(", ")
      : (t.artist || "Unknown Artist");
    const duration = formatTime(t.duration_ms || t.duration);
    const num = String(idx + 1).padStart(2, " ");

    lines.push(`${num}. ${artist} - ${title} [${duration}]`);
    if (t.album?.name || t.album) {
      lines.push(`    Album: ${t.album.name || t.album}`);
    }
    if (t.external_urls?.spotify || t.spoURL) {
      lines.push(`    Stream: ${t.external_urls?.spotify || t.spoURL}`);
    }
    lines.push("");
  });

  return lines.join("\n");
}

/**
 * Generates a portable JSON playlist file (.json)
 */
export function generateJSON(playlist, tracks) {
  const trackList = getTrackList(playlist, tracks);
  const normalizedTracks = trackList.map((item) => {
    const t = item.track || item;
    return {
      id: t.id || "",
      title: t.name || t.title || "Track",
      name: t.name || t.title || "Track",
      artists: Array.isArray(t.artists) ? t.artists : [{ name: t.artist || "Unknown" }],
      artist: Array.isArray(t.artists) ? t.artists.map((a) => a.name).join(", ") : (t.artist || "Unknown"),
      album: t.album?.name || t.album || "",
      duration_ms: t.duration_ms || t.duration || 0,
      image: t.album?.images?.[0]?.url || t.image || t.coverArt || "",
      spotifyUrl: t.external_urls?.spotify || t.spoURL || "",
      youtubeUrl: t.YTURL || "",
    };
  });

  const payload = {
    version: "1.0",
    app: "GrooveEstrella",
    type: "playlist",
    name: playlist.name || "Groove Playlist",
    description: playlist.description || "Shared from GrooveEstrella",
    owner: playlist.owner?.display_name || playlist.owner || "GrooveEstrella Curator",
    image: playlist.images?.[0]?.url || playlist.image || "",
    exportedAt: new Date().toISOString(),
    tracks: normalizedTracks,
  };

  return JSON.stringify(payload, null, 2);
}

/**
 * Browser file download helper
 */
export function downloadFile(filename, content, mimeType = "text/plain") {
  if (typeof window === "undefined") return;

  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Universal Playlist File Parser:
 * Automatically parses .json, .m3u, .m3u8, .cue, and .txt files.
 */
export function parsePlaylistFile(fileContent, fileName = "") {
  const ext = fileName.split(".").pop().toLowerCase();
  const trimmed = fileContent.trim();

  // 1. Try JSON parser
  if (ext === "json" || trimmed.startsWith("{")) {
    try {
      const data = JSON.parse(trimmed);
      const name = data.name || data.title || fileName.replace(/\.[^/.]+$/, "");
      const description = data.description || `Imported playlist from ${fileName}`;
      const rawTracks = data.tracks || data.items || [];
      const parsedTracks = rawTracks.map((t, idx) => {
        const title = t.title || t.name || `Track ${idx + 1}`;
        const artists = Array.isArray(t.artists)
          ? t.artists
          : [{ name: t.artist || "Unknown Artist" }];
        const img = t.image || t.album?.images?.[0]?.url || "";

        return {
          added_at: new Date().toISOString(),
          track: {
            id: t.id || `imported-${Date.now()}-${idx}`,
            name: title,
            title: title,
            artists: artists,
            duration_ms: t.duration_ms || t.duration || 180000,
            album: {
              name: t.album?.name || t.album || "Imported Release",
              images: img ? [{ url: img }] : []
            },
            external_urls: {
              spotify: t.spotifyUrl || t.spoURL || `https://open.spotify.com/search/${encodeURIComponent(title + " " + (artists[0]?.name || ""))}`
            },
            spoURL: t.spotifyUrl || t.spoURL || `https://open.spotify.com/search/${encodeURIComponent(title + " " + (artists[0]?.name || ""))}`,
            YTURL: t.youtubeUrl || t.YTURL || `https://www.youtube.com/results?search_query=${encodeURIComponent(title + " " + (artists[0]?.name || ""))}`
          }
        };
      });

      return {
        name,
        description,
        tracks: parsedTracks,
        image: data.image || parsedTracks[0]?.track?.album?.images?.[0]?.url || ""
      };
    } catch (e) {
      console.warn("JSON parse failed, falling back to text parsers", e);
    }
  }

  // 2. Try M3U / M3U8 parser
  if (trimmed.includes("#EXTM3U") || ext === "m3u" || ext === "m3u8") {
    const lines = trimmed.split(/\r?\n/);
    let playlistName = fileName.replace(/\.[^/.]+$/, "");
    const parsedTracks = [];
    let currentExtInf = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      if (line.startsWith("#PLAYLIST:")) {
        playlistName = line.replace("#PLAYLIST:", "").trim() || playlistName;
      } else if (line.startsWith("#EXTINF:")) {
        // Format: #EXTINF:seconds,Artist - Title
        const info = line.substring(8);
        const commaIdx = info.indexOf(",");
        const secondsStr = commaIdx !== -1 ? info.substring(0, commaIdx) : "0";
        const artistAndTitle = commaIdx !== -1 ? info.substring(commaIdx + 1).trim() : info.trim();
        const seconds = parseInt(secondsStr, 10) || 0;

        let artist = "Unknown Artist";
        let title = artistAndTitle;
        if (artistAndTitle.includes(" - ")) {
          const parts = artistAndTitle.split(" - ");
          artist = parts[0].trim();
          title = parts.slice(1).join(" - ").trim();
        }

        currentExtInf = { artist, title, seconds };
      } else if (!line.startsWith("#")) {
        // Track URL or local file path
        const artist = currentExtInf?.artist || "Unknown Artist";
        const title = currentExtInf?.title || line.split("/").pop().replace(/\.[^/.]+$/, "") || "Track";
        const seconds = currentExtInf?.seconds || 180;
        const link = line.startsWith("http") ? line : `https://open.spotify.com/search/${encodeURIComponent(title + " " + artist)}`;

        parsedTracks.push({
          added_at: new Date().toISOString(),
          track: {
            id: `imported-${Date.now()}-${parsedTracks.length}`,
            name: title,
            title: title,
            artists: [{ name: artist }],
            duration_ms: seconds * 1000,
            album: { name: "Imported from M3U", images: [] },
            external_urls: { spotify: link },
            spoURL: link,
            YTURL: `https://www.youtube.com/results?search_query=${encodeURIComponent(title + " " + artist)}`
          }
        });
        currentExtInf = null;
      }
    }

    if (parsedTracks.length > 0) {
      return {
        name: playlistName,
        description: `Imported from M3U file "${fileName}"`,
        tracks: parsedTracks,
        image: ""
      };
    }
  }

  // 3. Try CUE Sheet parser
  if (trimmed.includes("TRACK 01 AUDIO") || ext === "cue") {
    const lines = trimmed.split(/\r?\n/);
    let playlistName = fileName.replace(/\.[^/.]+$/, "");
    let globalPerformer = "Various Artists";
    const parsedTracks = [];
    let currentTrack = null;

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      if (line.startsWith("TITLE ") && !currentTrack) {
        playlistName = line.replace(/TITLE\s+"?([^"]+)"?/i, "$1").trim();
      } else if (line.startsWith("PERFORMER ") && !currentTrack) {
        globalPerformer = line.replace(/PERFORMER\s+"?([^"]+)"?/i, "$1").trim();
      } else if (line.match(/^TRACK\s+\d+\s+AUDIO/i)) {
        if (currentTrack) {
          parsedTracks.push(currentTrack);
        }
        currentTrack = {
          title: "Track",
          performer: globalPerformer,
        };
      } else if (currentTrack) {
        if (line.startsWith("TITLE ")) {
          currentTrack.title = line.replace(/TITLE\s+"?([^"]+)"?/i, "$1").trim();
        } else if (line.startsWith("PERFORMER ")) {
          currentTrack.performer = line.replace(/PERFORMER\s+"?([^"]+)"?/i, "$1").trim();
        }
      }
    }
    if (currentTrack) parsedTracks.push(currentTrack);

    if (parsedTracks.length > 0) {
      return {
        name: playlistName,
        description: `Imported from CUE sheet "${fileName}"`,
        tracks: parsedTracks.map((t, idx) => ({
          added_at: new Date().toISOString(),
          track: {
            id: `imported-${Date.now()}-${idx}`,
            name: t.title,
            title: t.title,
            artists: [{ name: t.performer || globalPerformer }],
            duration_ms: 180000,
            album: { name: playlistName, images: [] },
            external_urls: {
              spotify: `https://open.spotify.com/search/${encodeURIComponent(t.title + " " + t.performer)}`
            },
            spoURL: `https://open.spotify.com/search/${encodeURIComponent(t.title + " " + t.performer)}`,
            YTURL: `https://www.youtube.com/results?search_query=${encodeURIComponent(t.title + " " + t.performer)}`
          }
        })),
        image: ""
      };
    }
  }

  // 4. Fallback: Line-by-line Text parser (.txt)
  const lines = trimmed.split(/\r?\n/).filter(Boolean);
  const parsedTracks = [];
  let playlistName = fileName.replace(/\.[^/.]+$/, "") || "Custom Playlist";

  for (let line of lines) {
    if (line.startsWith("===") || line.startsWith("---") || line.toLowerCase().startsWith("curator:") || line.toLowerCase().startsWith("source:")) {
      continue;
    }
    if (line.toLowerCase().startsWith("playlist:")) {
      playlistName = line.substring(9).trim() || playlistName;
      continue;
    }

    // Strip leading track numbers like "1. ", "01 - ", etc.
    line = line.replace(/^[\d]+\s*[\.\-:]\s*/, "").trim();
    if (!line) continue;

    // Remove trailing duration in brackets like "[03:45]" or "(3:45)"
    let durationSeconds = 180;
    const durMatch = line.match(/[\[\(](\d+):(\d+)[\]\)]/);
    if (durMatch) {
      durationSeconds = parseInt(durMatch[1], 10) * 60 + parseInt(durMatch[2], 10);
      line = line.replace(/[\[\(]\d+:\d+[\]\)]/, "").trim();
    }

    let artist = "Unknown Artist";
    let title = line;
    if (line.includes(" - ")) {
      const parts = line.split(" - ");
      artist = parts[0].trim();
      title = parts.slice(1).join(" - ").trim();
    }

    parsedTracks.push({
      added_at: new Date().toISOString(),
      track: {
        id: `imported-${Date.now()}-${parsedTracks.length}`,
        name: title,
        title: title,
        artists: [{ name: artist }],
        duration_ms: durationSeconds * 1000,
        album: { name: "Imported Track", images: [] },
        external_urls: {
          spotify: `https://open.spotify.com/search/${encodeURIComponent(title + " " + artist)}`
        },
        spoURL: `https://open.spotify.com/search/${encodeURIComponent(title + " " + artist)}`,
        YTURL: `https://www.youtube.com/results?search_query=${encodeURIComponent(title + " " + artist)}`
      }
    });
  }

  return {
    name: playlistName,
    description: `Imported from "${fileName}"`,
    tracks: parsedTracks,
    image: ""
  };
}
