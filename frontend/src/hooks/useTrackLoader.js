// src/hooks/useTrackLoader.js
import { fetchSpotifyData } from './useSpotify';

const loadTracks = async (tracks, token = null, setTrackData = null, setLoading = null) => {
  try {
    if (!Array.isArray(tracks) || tracks.length === 0) {
      if (typeof setTrackData === 'function') setTrackData([]);
      return [];
    }

    const trackPromises = tracks.map((item) => {
      const title = typeof item === 'string' ? item : (item?.title || item?.name || '');
      return fetchSpotifyData(title, token);
    });

    const results = await Promise.all(trackPromises);

    if (typeof setTrackData === 'function') {
      setTrackData(results);
    }

    return results;
  } catch (error) {
    console.error("loadTracks error:", error);
    if (typeof setTrackData === 'function') setTrackData([]);
    return [];
  } finally {
    if (typeof setLoading === 'function') {
      setLoading(false);
    }
  }
};

export default loadTracks;
