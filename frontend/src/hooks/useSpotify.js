import { useState, useEffect } from "react";
import { API_BASE_URL } from "../lib/apiClient";

async function getSpotifyToken(retries = 25, delay = 3000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/token`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data && data.access_token) {
        return data.access_token;
      }
      throw new Error("Invalid token response data");
    } catch (error) {
      console.warn(`Attempt ${attempt}/${retries} to fetch Spotify token failed:`, error.message || error);
      if (attempt === retries) {
        console.error("Max retries reached. Failed to fetch Spotify token:", error);
        return null;
      }
      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  return null;
}

// Fetch Spotify Track Data
async function fetchSpotifyData(title, token) {
  const response = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(
      title
    )}&type=track&limit=1`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) throw new Error(`API Error: ${response.status}`);
  const data = await response.json();

  const track = data.tracks.items[0];
  if (!track)
    return {
      title,
      url: "https://placehold.co/300x300?text=No+Image",
      artists: "Unknown",
      spoURL: "#",
      popularity: 0,
    };

        return {
          title: track.name,
          url: track.album.images[0]?.url,
          artists: track.artists.map((artist) => ({
            name: artist.name,
            id: artist.id,
          })),
          spoURL: track.external_urls?.spotify,
          popularity: track.popularity,
          type: "track",
          explicit: track.explicit,
        //   next: nextResults,
        //   prev: prevResults,
          trackURI: track.uri,
          albumID: track.album.id,
          trackId: track.id,
        };
}

async function fetchSpotifySearchResults(
  query,
  type,
  setSearchResults,
  setLoading
) {
  try {
    setLoading(true); // Optional: only if you need to show loading state

    const spotifyToken = await getSpotifyToken();
    if (!spotifyToken) {
      console.error("No Spotify token found");
      setSearchResults([]);
      return;
    }

    const response = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(
        query
      )}&type=${type}&limit=20`,
      {
        headers: {
          Authorization: `Bearer ${spotifyToken}`,
        },
      }
    );

    const data = await response.json();
    console.log("API Response:", data);

    const resultsArray = data[type + "s"]?.items || [];
    const nextResults = data?.previous;
    const prevResults = data?.next;

    if (!resultsArray.length) {
      setSearchResults([]);
      return;
    }

    const results = resultsArray.map((item) => {
      if (type === "track") {
        return {
          title: item.name,
          url: item.album.images[0]?.url,
          artists: item.artists.map((artist) => ({
            name: artist.name,
            id: artist.id,
          })),
          spoURL: item.external_urls?.spotify,
          popularity: item.popularity,
          type: "track",
          explicit: item.explicit,
          trackURI: item.uri,
          albumID: item.album.id,
          trackId: item.id,
        };
      } else if (type === "artist") {
        return {
          title: item.name,
          url: item.images?.[0]?.url,
          spoURL: item.external_urls?.spotify,
          popularity: item.popularity,
          followers: item.followers.total,
          type: "artist",
          explicit: item.explicit,
          trackURI: item.uri,
          id: item.id,
        };
      } else if (type === "album") {
        return {
          id: item.id,
          title: item.name,
          url: item.images?.[0]?.url,
          artists: item.artists.map((artist) => ({
            name: artist.name,
            id: artist.id,
          })),
          type: "album",
          explicit: item.explicit,
          trackURI: item.uri,
        };
      } else if (type === "playlist") {
        return {
          id: item?.id,
          title: item?.name || "#",
          url: item?.images?.[0]?.url || "#",
          owner: item?.owner?.display_name,
          spoURL: item?.external_urls?.spotify || "#",
          trackURI: item?.uri,
          public: item?.public,
          type: "playlist",
        };
      } else if (type === "show") {
        return {
          title: item.name,
          url: item.images?.[0]?.url,
          artists: item.publisher + item.languages,
          spoURL: item.external_urls?.spotify,
          description: item.description,
          type: "show",
          explicit: item.explicit,
          next: nextResults,
          prev: prevResults,
          // trackURI: item.uri,
        };
      } else if (type === "episode") {
        return {
          title: item.name,
          url: item.images?.[0]?.url,
          artists: item.type + ", " + item.languages,
          spoURL: item.external_urls?.spotify,
          description: item.description,
          type: "episode",
          explicit: item.explicit,
          next: nextResults,
          prev: prevResults,
          // trackURI: item.uri,
        };
      }
    });

    setSearchResults(results);
  } catch (err) {
    console.error("Error fetching search results:", err);
    setSearchResults([]);
  } finally {
    setLoading(false); // Optional, only if used
  }
}

async function fetchSpotifyRecommendations(seedGenres, limit = 12, spotifyToken) {
  try {
    const token = spotifyToken || await getSpotifyToken();
    if (!token) return [];

    let genre = seedGenres;
    if (!genre) {
      const defaultSeeds = ["pop", "rock", "hip-hop", "jazz", "electronic", "classical", "k-pop", "dance", "country", "romance"];
      genre = defaultSeeds[Math.floor(Math.random() * defaultSeeds.length)];
    }

    // List of common English characters to inject diversity and filter for standard songs
    const chars = ['a', 'e', 'i', 'o', 'u', 's', 't', 'r', 'n', 'd', 'l', 'c'];
    const randomChar = chars[Math.floor(Math.random() * chars.length)];

    // Combine genre filter and wildcard character query, and apply US market filter
    const query = `genre:"${genre}" ${randomChar}`;
    
    // Keep offset small (0 to 10) so we get the most relevant/popular matches for that wildcard
    const offset = Math.floor(Math.random() * 10);

    const response = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=${limit}&offset=${offset}&market=US`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      console.error(`Spotify recommendations API search error: ${response.status}`);
      return [];
    }

    const data = await response.json();
    const tracksList = data.tracks?.items || [];
    
    return tracksList.map((track) => ({
      title: track.name,
      url: track.album?.images?.[0]?.url || "https://placehold.co/300x300?text=No+Image",
      artists: track.artists.map((artist) => ({
        name: artist.name,
        id: artist.id,
      })),
      spoURL: track.external_urls?.spotify,
      popularity: track.popularity,
      type: "track",
      explicit: track.explicit,
      trackURI: track.uri,
      albumID: track.album?.id,
      trackId: track.id,
    }));
  } catch (error) {
    console.error("Error fetching Spotify recommendations via search:", error);
    return [];
  }
}

export { getSpotifyToken, fetchSpotifyData, fetchSpotifySearchResults, fetchSpotifyRecommendations };
