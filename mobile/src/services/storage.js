import AsyncStorage from '@react-native-async-storage/async-storage';

export const STORAGE_KEYS = {
  SAVED_SONGS: 'savedSongs',
  SAVED_ALBUMS: 'savedAlbums',
  SAVED_ARTISTS: 'savedArtists',
  SAVED_PLAYLISTS: 'savedPlaylists',
  CUSTOM_PLAYLISTS: 'customPlaylists',
  PREFERRED_PLATFORM: 'preferredPlatform',
  USER_NAME: 'userName',
  FAVORITE_GENRES: 'favoriteGenres',
};

// Generic JSON read helper
const getJson = async (key, defaultValue = []) => {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch (err) {
    console.error(`AsyncStorage error reading key "${key}":`, err);
    return defaultValue;
  }
};

// Generic JSON write helper
const setJson = async (key, value) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    console.error(`AsyncStorage error writing key "${key}":`, err);
    return false;
  }
};

// Helper to match song IDs across different formats (trackId, trackURI, id, mbid)
const matchesSongId = (item, id) => {
  if (!item || !id) return false;
  return (
    item.trackId === id ||
    item.trackURI === id ||
    item.id === id ||
    item.mbid === id
  );
};

// Helper to match entity IDs (albums, artists, playlists)
const matchesEntityId = (item, id) => {
  if (!item || !id) return false;
  return item.id === id || item.mbid === id || item.uri === id;
};

// ==========================================
// 1. Saved Songs
// ==========================================
export const getSavedSongs = async () => {
  return await getJson(STORAGE_KEYS.SAVED_SONGS, []);
};

export const saveSong = async (song) => {
  if (!song) return false;
  const songs = await getSavedSongs();
  const id = song.trackId || song.trackURI || song.id || song.mbid;

  // Prevent duplicates
  const exists = songs.some((item) => matchesSongId(item, id));
  if (exists) {
    return songs;
  }

  const updated = [song, ...songs];
  await setJson(STORAGE_KEYS.SAVED_SONGS, updated);
  return updated;
};

export const removeSong = async (id) => {
  if (!id) return [];
  const songs = await getSavedSongs();
  const updated = songs.filter((item) => !matchesSongId(item, id));
  await setJson(STORAGE_KEYS.SAVED_SONGS, updated);
  return updated;
};

export const isSongSaved = async (id) => {
  if (!id) return false;
  const songs = await getSavedSongs();
  return songs.some((item) => matchesSongId(item, id));
};

// ==========================================
// 2. Saved Albums
// ==========================================
export const getSavedAlbums = async () => {
  return await getJson(STORAGE_KEYS.SAVED_ALBUMS, []);
};

export const saveAlbum = async (album) => {
  if (!album) return false;
  const albums = await getSavedAlbums();
  const id = album.id || album.mbid;

  const exists = albums.some((item) => matchesEntityId(item, id));
  if (exists) {
    return albums;
  }

  const updated = [album, ...albums];
  await setJson(STORAGE_KEYS.SAVED_ALBUMS, updated);
  return updated;
};

export const removeAlbum = async (id) => {
  if (!id) return [];
  const albums = await getSavedAlbums();
  const updated = albums.filter((item) => !matchesEntityId(item, id));
  await setJson(STORAGE_KEYS.SAVED_ALBUMS, updated);
  return updated;
};

export const isAlbumSaved = async (id) => {
  if (!id) return false;
  const albums = await getSavedAlbums();
  return albums.some((item) => matchesEntityId(item, id));
};

// ==========================================
// 3. Saved Artists
// ==========================================
export const getSavedArtists = async () => {
  return await getJson(STORAGE_KEYS.SAVED_ARTISTS, []);
};

export const saveArtist = async (artist) => {
  if (!artist) return false;
  const artists = await getSavedArtists();
  const id = artist.id || artist.mbid;

  const exists = artists.some((item) => matchesEntityId(item, id));
  if (exists) {
    return artists;
  }

  const updated = [artist, ...artists];
  await setJson(STORAGE_KEYS.SAVED_ARTISTS, updated);
  return updated;
};

export const removeArtist = async (id) => {
  if (!id) return [];
  const artists = await getSavedArtists();
  const updated = artists.filter((item) => !matchesEntityId(item, id));
  await setJson(STORAGE_KEYS.SAVED_ARTISTS, updated);
  return updated;
};

export const isArtistSaved = async (id) => {
  if (!id) return false;
  const artists = await getSavedArtists();
  return artists.some((item) => matchesEntityId(item, id));
};

// ==========================================
// 4. Saved External/Curated Playlists
// ==========================================
export const getSavedPlaylists = async () => {
  return await getJson(STORAGE_KEYS.SAVED_PLAYLISTS, []);
};

export const savePlaylist = async (playlist) => {
  if (!playlist) return false;
  const playlists = await getSavedPlaylists();
  const id = playlist.id || playlist.uri;

  const exists = playlists.some((item) => matchesEntityId(item, id));
  if (exists) {
    return playlists;
  }

  const updated = [playlist, ...playlists];
  await setJson(STORAGE_KEYS.SAVED_PLAYLISTS, updated);
  return updated;
};

export const removePlaylist = async (id) => {
  if (!id) return [];
  const playlists = await getSavedPlaylists();
  const updated = playlists.filter((item) => !matchesEntityId(item, id));
  await setJson(STORAGE_KEYS.SAVED_PLAYLISTS, updated);
  return updated;
};

// ==========================================
// 5. Custom User Playlists
// ==========================================
export const getCustomPlaylists = async () => {
  return await getJson(STORAGE_KEYS.CUSTOM_PLAYLISTS, []);
};

export const createPlaylist = async (name, desc = '') => {
  const playlists = await getCustomPlaylists();
  const newPlaylist = {
    id: `pl_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    name: name?.trim() || 'Untitled Playlist',
    description: desc?.trim() || '',
    tracks: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const updated = [newPlaylist, ...playlists];
  await setJson(STORAGE_KEYS.CUSTOM_PLAYLISTS, updated);
  return newPlaylist;
};

export const deletePlaylist = async (id) => {
  if (!id) return [];
  const playlists = await getCustomPlaylists();
  const updated = playlists.filter((p) => p.id !== id);
  await setJson(STORAGE_KEYS.CUSTOM_PLAYLISTS, updated);
  return updated;
};

export const addTrackToPlaylist = async (playlistId, track) => {
  if (!playlistId || !track) return null;
  const playlists = await getCustomPlaylists();
  const trackId = track.trackId || track.trackURI || track.id || track.mbid;

  const updated = playlists.map((p) => {
    if (p.id !== playlistId) return p;

    // Check if track already exists in playlist
    const trackExists = (p.tracks || []).some((t) => matchesSongId(t, trackId));
    if (trackExists) return p;

    return {
      ...p,
      tracks: [...(p.tracks || []), track],
      updatedAt: new Date().toISOString(),
    };
  });

  await setJson(STORAGE_KEYS.CUSTOM_PLAYLISTS, updated);
  return updated.find((p) => p.id === playlistId) || null;
};

export const removeTrackFromPlaylist = async (playlistId, trackId) => {
  if (!playlistId || !trackId) return null;
  const playlists = await getCustomPlaylists();

  const updated = playlists.map((p) => {
    if (p.id !== playlistId) return p;
    return {
      ...p,
      tracks: (p.tracks || []).filter((t) => !matchesSongId(t, trackId)),
      updatedAt: new Date().toISOString(),
    };
  });

  await setJson(STORAGE_KEYS.CUSTOM_PLAYLISTS, updated);
  return updated.find((p) => p.id === playlistId) || null;
};

// ==========================================
// 6. User Preferences
// ==========================================
export const getPreferredPlatform = async () => {
  try {
    const val = await AsyncStorage.getItem(STORAGE_KEYS.PREFERRED_PLATFORM);
    return val || 'spotify';
  } catch (err) {
    console.error('Error fetching preferred platform:', err);
    return 'spotify';
  }
};

export const setPreferredPlatform = async (platform) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.PREFERRED_PLATFORM, platform);
    return true;
  } catch (err) {
    console.error('Error saving preferred platform:', err);
    return false;
  }
};

export const getUserName = async () => {
  try {
    const val = await AsyncStorage.getItem(STORAGE_KEYS.USER_NAME);
    return val || 'Groover';
  } catch (err) {
    console.error('Error fetching user name:', err);
    return 'Groover';
  }
};

export const setUserName = async (name) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.USER_NAME, name);
    return true;
  } catch (err) {
    console.error('Error saving user name:', err);
    return false;
  }
};

export const getFavoriteGenres = async () => {
  return await getJson(STORAGE_KEYS.FAVORITE_GENRES, []);
};

export const setFavoriteGenres = async (genres) => {
  return await setJson(STORAGE_KEYS.FAVORITE_GENRES, Array.isArray(genres) ? genres : []);
};

// ==========================================
// 7. Cleanup & Diagnostics
// ==========================================
export const clearStorage = async () => {
  try {
    await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
    return true;
  } catch (err) {
    console.error('Error clearing storage:', err);
    return false;
  }
};

const storageService = {
  getSavedSongs,
  saveSong,
  removeSong,
  isSongSaved,
  getSavedAlbums,
  saveAlbum,
  removeAlbum,
  isAlbumSaved,
  getSavedArtists,
  saveArtist,
  removeArtist,
  isArtistSaved,
  getSavedPlaylists,
  savePlaylist,
  removePlaylist,
  getCustomPlaylists,
  createPlaylist,
  deletePlaylist,
  addTrackToPlaylist,
  removeTrackFromPlaylist,
  getPreferredPlatform,
  setPreferredPlatform,
  getUserName,
  setUserName,
  getFavoriteGenres,
  setFavoriteGenres,
  clearStorage,
};

export default storageService;
