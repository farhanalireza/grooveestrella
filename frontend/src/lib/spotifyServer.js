// src/lib/spotifyServer.js
// SPOTIFY PULLED, MACHINERY INTACT:
// Delegating all data requests directly to the open MusicBrainz & Cover Art Archive integration.

import {
  getSpotifyToken as mbGetToken,
  fetchSpotifyDataServer as mbFetchData,
  searchSpotifyTrackServer as mbSearchTrack,
  searchSpotifyTracksServer as mbSearchTracks,
} from './musicbrainzServer';

export async function getSpotifyToken() {
  return await mbGetToken();
}

export async function fetchSpotifyDataServer(type, id) {
  return await mbFetchData(type, id);
}

export async function searchSpotifyTrackServer(query) {
  return await mbSearchTrack(query);
}

export async function searchSpotifyTracksServer(query, limit = 6) {
  return await mbSearchTracks(query, limit);
}
