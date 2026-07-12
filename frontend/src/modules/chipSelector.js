import { fetchTracksFromDB } from './trackFetcher';
import dailyTracks from './dailyTracks';
import loadTracks from '../hooks/useTrackLoader';
import { fetchSpotifyRecommendations } from '../hooks/useSpotify';

export async function handleChipSelect({ chipText, chipMap, setChipKey, spotifyToken, setTrackData, setPaginationStates, setLoading }) {
  const key = chipMap[chipText];
  setChipKey(key);

  // TEMPORARY: Direct Spotify Recommendations API for instant, database-free loading
  // To revert back to DB fetching, comment this block and uncomment the legacy block below.
  if (key) {
    setLoading(true);
    const results = await fetchSpotifyRecommendations(key, 12, spotifyToken);
    setTrackData(results);
    setPaginationStates({
      nextUrl: null,
      prevUrl: null,
      totalCount: results.length,
      currentPage: 1,
    });
    setLoading(false);
  } else {
    setLoading(true);
    const results = await fetchSpotifyRecommendations(null, 12, spotifyToken);
    setTrackData(results);
    setPaginationStates({
      nextUrl: null,
      prevUrl: null,
      totalCount: results.length,
      currentPage: 1,
    });
    setLoading(false);
  }

  /* Legacy DB-backed selection flow:
  if (key) {
    await fetchTracksFromDB({
      keyOrUrl: key,
      limit: 10,
      spotifyToken,
      setTrackData,
      setPaginationStates,
      setLoading,
    });
  } else {
    await loadTracks(dailyTracks, spotifyToken, setTrackData, setLoading);
  }
  */
}
