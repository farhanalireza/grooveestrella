// src/modules/chipSelector.js
import { fetchSpotifyRecommendations } from '../hooks/useSpotify';

export async function handleChipSelect({ chipText, chipMap, setChipKey, spotifyToken, setTrackData, setPaginationStates, setLoading }) {
  const key = chipMap ? chipMap[chipText] : chipText;
  if (setChipKey) setChipKey(key);

  try {
    if (setLoading) setLoading(true);
    const genreQuery = key || chipText || 'pop';
    const results = await fetchSpotifyRecommendations(genreQuery, 12, spotifyToken);
    
    if (setTrackData) setTrackData(results);
    if (setPaginationStates) {
      setPaginationStates({
        nextUrl: null,
        prevUrl: null,
        totalCount: results.length,
        currentPage: 1,
      });
    }
  } catch (error) {
    console.error('Error handling chip select:', error);
    if (setTrackData) setTrackData([]);
  } finally {
    if (setLoading) setLoading(false);
  }
}
