// src/hooks/useSpotify.js
// SPOTIFY PULLED, MACHINERY INTACT:
// Delegated to open MusicBrainz endpoints while keeping legacy caller signatures intact.
import { API_BASE_URL } from "../lib/apiClient";

async function getSpotifyToken() {
  return "musicbrainz-public-token";
}

// Fetch single track data by title using open catalog
async function fetchSpotifyData(title, token) {
  if (!title || !title.trim()) {
    return {
      title: "Unknown",
      url: "https://placehold.co/300x300/10141F/60A5FA?text=Groove",
      artists: [{ name: "Unknown Artist", id: "" }],
      spoURL: "#",
      popularity: 0,
      trackId: "",
      trackURI: "",
    };
  }

  try {
    const res = await fetch(`${API_BASE_URL}/search?q=${encodeURIComponent(title.trim())}&type=track&limit=1`);
    if (!res.ok) throw new Error(`Search error ${res.status}`);
    const data = await res.json();
    const track = data.results?.[0];

    if (!track) {
      return {
        title,
        url: "https://placehold.co/300x300/10141F/60A5FA?text=No+Cover",
        artists: [{ name: "Various Artists", id: "" }],
        spoURL: `https://open.spotify.com/search/${encodeURIComponent(title)}`,
        popularity: 75,
        type: "track",
        explicit: false,
        trackURI: `musicbrainz:track:${encodeURIComponent(title)}`,
        albumID: "",
        trackId: encodeURIComponent(title),
      };
    }

    return {
      title: track.title,
      name: track.title,
      url: track.url || track.coverArt,
      artists: track.artists,
      artist: track.artists,
      spoURL: track.spoURL,
      popularity: track.popularity || 80,
      type: "track",
      explicit: track.explicit || false,
      trackURI: track.trackURI,
      albumID: track.albumID,
      trackId: track.id || track.trackId,
    };
  } catch (err) {
    console.warn(`Failed to resolve track "${title}" from catalog:`, err.message);
    return {
      title,
      url: "https://placehold.co/300x300/10141F/60A5FA?text=Track",
      artists: [{ name: "Various Artists", id: "" }],
      spoURL: `https://open.spotify.com/search/${encodeURIComponent(title)}`,
      popularity: 70,
      type: "track",
      explicit: false,
      trackURI: `musicbrainz:track:${encodeURIComponent(title)}`,
      albumID: "",
      trackId: encodeURIComponent(title),
    };
  }
}

async function fetchSpotifySearchResults(query, type, setSearchResults, setLoading) {
  try {
    if (setLoading) setLoading(true);
    const res = await fetch(`${API_BASE_URL}/search?q=${encodeURIComponent(query)}&type=${type || 'track'}&limit=20`);
    if (!res.ok) throw new Error(`Search error: ${res.status}`);
    const data = await res.json();
    setSearchResults(data.results || []);
  } catch (err) {
    console.error("Error fetching search results:", err);
    setSearchResults([]);
  } finally {
    if (setLoading) setLoading(false);
  }
}

async function fetchSpotifyRecommendations(seedGenres, limit = 12, token) {
  try {
    let genre = seedGenres;
    if (!genre) {
      const defaultSeeds = ["pop", "rock", "hip-hop", "jazz", "electronic", "classical", "k-pop", "dance", "country"];
      genre = defaultSeeds[Math.floor(Math.random() * defaultSeeds.length)];
    }

    const res = await fetch(`${API_BASE_URL}/search?q=${encodeURIComponent(genre)}&type=track&limit=${limit}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.results || [];
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    return [];
  }
}

export { getSpotifyToken, fetchSpotifyData, fetchSpotifySearchResults, fetchSpotifyRecommendations };
