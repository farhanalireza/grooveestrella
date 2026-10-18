import AsyncStorage from '@react-native-async-storage/async-storage';

export const STORAGE_KEYS = {
  SAVED_SONGS: 'savedSongs',
  SAVED_ALBUMS: 'savedAlbums',
  SAVED_ARTISTS: 'savedArtists',
  SAVED_PLAYLISTS: 'savedPlaylists',
  CUSTOM_PLAYLISTS: 'customPlaylists',
  PREFERRED_PLATFORM: 'preferred_music_platform',
  USER_NAME: 'userName',
  FAVORITE_GENRES: 'favoriteGenres',
  USER_REVIEWS: 'userReviews',
  APP_THEME: 'app_theme',
};

// ==========================================
// Adjective + Noun Generator
// ==========================================
export const ADJECTIVES = [
  // Music people
  'Vinyl', 'Fuzzy', 'Funky', 'Dusty', 'Lo-Fi', 'Indie', 'Jazzy',
  'Tipsy', 'Groovy', 'Wonky', 'Feral', 'Sleepy', 'Moody', 'Cheeky',
  'Salty', 'Rusty', 'Freaky', 'Wonky', 'Shaggy', 'Scruffy',

  // Cool & characterful
  'Velvet', 'Lucky', 'Shady', 'Sneaky', 'Lazy', 'Wild', 'Local',
  'Weird', 'Happy', 'Grumpy', 'Lonely', 'Messy', 'Cosmic', 'Faded',
  'Golden', 'Electric', 'Plastic', 'Analog', 'Retro', 'Rogue',

  // Late-night music energy
  'Midnight', 'Sleepy', 'Tipsy', 'Drowsy', 'Hazy', 'Dreamy', 'Dusky',
  'Moonlit', 'Sunburnt', 'Restless', 'Wasted', 'Mellow', 'Bleary',
  'Afterhours', 'Sunday', 'Heartbreak', 'Blue', 'Smoky', 'Lovesick',

  // Music culture
  'Basement', 'Garage', 'Bedroom', 'Backstage', 'Underground', 'Forgotten',
  'Cult', 'Obscure', 'B-Side', 'Deepcut', 'Rare', 'Bootleg', 'Unplugged',
  'Overplayed', 'Underrated', 'Unreleased', 'Offbeat', 'OuttaTune',

  // Slightly ridiculous (in a good way)
  'Greasy', 'Goofy', 'Dizzy', 'Chunky', 'Spicy', 'Wobbly', 'Nerdy',
  'Dramatic', 'Chaotic', 'Unhinged', 'Grimy', 'Bizarre', 'Soggy',
  'Caffeinated', 'Broke', 'Restless', 'Delulu', 'Certified', 'Suspicious'
];

export const NOUNS = [
  // Music lovers
  'Groover', 'Headbanger', 'RecordNerd', 'VinylGoblin', 'MusicRat',
  'AlbumJunkie', 'TuneFiend', 'TrackHoarder', 'MusicGeek', 'Songbird',
  'BeatFreak', 'CrateDigger', 'DiscJockey', 'Melomaniac', 'Audiophile',
  'NoiseMaker', 'GigRat', 'JamBuddy', 'SoundAddict', 'TuneBandit',

  // Actual music things
  'B-Side', 'DeepCut', 'Mixtape', 'Cassette', 'Turntable', 'NeedleDrop',
  'Sleeve', 'Record', 'Groovebox', 'DrumKit', 'Riff', 'Bassline',
  'Feedback', 'Fuzzbox', 'Distortion', 'Backbeat', 'Soundcheck', 'Encore',
  'Setlist', 'DemoTape', 'Bootleg', 'Reverb', 'AmpStack', 'WahWah',

  // Characters
  'Gremlin', 'Goblin', 'Menace', 'Bandit', 'Outlaw', 'Rascal', 'Creature',
  'Bandito', 'Daydreamer', 'NightOwl', 'Wanderer', 'Drifter', 'Loner',
  'Troublemaker', 'Hooligan', 'Oddball', 'Misfit', 'Maniac', 'Muppet',
  'Nuisance', 'Legend', 'Dinosaur', 'Cryptid', 'Maverick', 'Rebel',

  // Album-listening culture
  'AlbumGoblin', 'SkipButton', 'TrackZero', 'HiddenTrack', 'BonusTrack',
  'VinylDealer', 'SleeveCollector', 'PlaylistGremlin', 'AlbumSnob',
  'TrackOne', 'LastTrack', 'SideA', 'SideB', 'RepeatButton',
  'Gatekeeper', 'ChartHater', 'TasteMaker', 'HotTake', 'CultClassic',

  // Atmospheric & aesthetic
  'Moonchild', 'Daytripper', 'Stargazer', 'Dreamboat', 'Heartbreaker',
  'Nightcrawler', 'Moonwalker', 'SpaceCadet', 'Sunflower', 'BlueNote',
  'GhostNote', 'Firestarter', 'SlowDancer', 'Roadie', 'Showstopper'
];

export function generateRandomName() {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  return `${adj} ${noun}`;
}

// Generic JSON read helper
const getJson = async (key, defaultValue = []) => {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch (err) {
    console.warn(`AsyncStorage read error for "${key}":`, err);
    return defaultValue;
  }
};

// Generic JSON write helper
const setJson = async (key, value) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    console.warn(`AsyncStorage write error for "${key}":`, err);
    return false;
  }
};

const matchesId = (item, id) => {
  if (!item || !id) return false;
  return (
    item.id === id ||
    item.trackId === id ||
    item.trackURI === id ||
    item.mbid === id ||
    item.uri === id
  );
};

// ==========================================
// Saved Songs
// ==========================================
export const getSavedSongs = async () => getJson(STORAGE_KEYS.SAVED_SONGS, []);

export const saveSong = async (song) => {
  if (!song) return false;
  const songs = await getSavedSongs();
  const songId = song.id || song.trackId || song.trackURI;
  if (!songId) return false;
  const filtered = songs.filter((s) => !matchesId(s, songId));
  filtered.unshift({
    id: songId,
    trackId: song.trackId || songId,
    title: song.title || song.name || 'Untitled Track',
    artist: song.artist || song.artists || 'Unknown Artist',
    album: song.album || song.albumTitle || '',
    image: song.image || song.coverArt || song.url || '',
    type: 'track',
    savedAt: new Date().toISOString(),
  });
  return await setJson(STORAGE_KEYS.SAVED_SONGS, filtered);
};

export const removeSavedSong = async (id) => {
  const songs = await getSavedSongs();
  const updated = songs.filter((s) => !matchesId(s, id));
  return await setJson(STORAGE_KEYS.SAVED_SONGS, updated);
};
export const removeSong = removeSavedSong;

export const isSongSaved = async (id) => {
  if (!id) return false;
  const songs = await getSavedSongs();
  return songs.some((s) => matchesId(s, id));
};

// ==========================================
// Saved Albums
// ==========================================
export const getSavedAlbums = async () => getJson(STORAGE_KEYS.SAVED_ALBUMS, []);

export const saveAlbum = async (album) => {
  if (!album) return false;
  const albums = await getSavedAlbums();
  const albumId = album.id || album.albumId;
  if (!albumId) return false;
  const filtered = albums.filter((a) => !matchesId(a, albumId));
  filtered.unshift({
    id: albumId,
    title: album.title || album.name || 'Untitled Album',
    artist: album.artist || album.artists || 'Unknown Artist',
    image: album.image || album.coverArt || album.url || '',
    releaseYear: album.releaseYear || album.releaseDate || '',
    type: 'album',
    savedAt: new Date().toISOString(),
  });
  return await setJson(STORAGE_KEYS.SAVED_ALBUMS, filtered);
};

export const removeSavedAlbum = async (id) => {
  const albums = await getSavedAlbums();
  const updated = albums.filter((a) => !matchesId(a, id));
  return await setJson(STORAGE_KEYS.SAVED_ALBUMS, updated);
};
export const removeAlbum = removeSavedAlbum;

export const isAlbumSaved = async (id) => {
  if (!id) return false;
  const albums = await getSavedAlbums();
  return albums.some((a) => matchesId(a, id));
};

// ==========================================
// Saved Artists
// ==========================================
export const getSavedArtists = async () => getJson(STORAGE_KEYS.SAVED_ARTISTS, []);

export const saveArtist = async (artist) => {
  if (!artist) return false;
  const artists = await getSavedArtists();
  const artistId = artist.id || artist.artistId;
  if (!artistId) return false;
  const filtered = artists.filter((a) => !matchesId(a, artistId));
  filtered.unshift({
    id: artistId,
    title: artist.title || artist.name || 'Unknown Artist',
    name: artist.name || artist.title || 'Unknown Artist',
    image: artist.image || artist.url || '',
    type: 'artist',
    savedAt: new Date().toISOString(),
  });
  return await setJson(STORAGE_KEYS.SAVED_ARTISTS, filtered);
};

export const removeSavedArtist = async (id) => {
  const artists = await getSavedArtists();
  const updated = artists.filter((a) => !matchesId(a, id));
  return await setJson(STORAGE_KEYS.SAVED_ARTISTS, updated);
};
export const removeArtist = removeSavedArtist;

export const isArtistSaved = async (id) => {
  if (!id) return false;
  const artists = await getSavedArtists();
  return artists.some((a) => matchesId(a, id));
};

// ==========================================
// Playlists & Custom Playlists
// ==========================================
export const getSavedPlaylists = async () => getJson(STORAGE_KEYS.SAVED_PLAYLISTS, []);

export const savePlaylist = async (playlist) => {
  if (!playlist) return false;
  const playlists = await getSavedPlaylists();
  const plId = playlist.id;
  if (!plId) return false;
  const filtered = playlists.filter((p) => !matchesId(p, plId));
  filtered.unshift(playlist);
  return await setJson(STORAGE_KEYS.SAVED_PLAYLISTS, filtered);
};

export const removePlaylist = async (id) => {
  const playlists = await getSavedPlaylists();
  const updated = playlists.filter((p) => !matchesId(p, id));
  return await setJson(STORAGE_KEYS.SAVED_PLAYLISTS, updated);
};

export const getCustomPlaylists = async () => getJson(STORAGE_KEYS.CUSTOM_PLAYLISTS, []);

export const setCustomPlaylists = async (playlists) => {
  return await setJson(STORAGE_KEYS.CUSTOM_PLAYLISTS, Array.isArray(playlists) ? playlists : []);
};

export const createCustomPlaylist = async (name, desc = '') => {
  const playlists = await getCustomPlaylists();
  const newPl = {
    id: `custom-${Date.now()}`,
    name: (name || 'New Playlist').trim(),
    title: (name || 'New Playlist').trim(),
    description: desc.trim() || 'Custom playlist created on GroovEstrella.',
    image: '',
    images: [],
    tracks: { total: 0, items: [] },
    createdAt: new Date().toISOString(),
  };
  playlists.unshift(newPl);
  await setJson(STORAGE_KEYS.CUSTOM_PLAYLISTS, playlists);
  return newPl;
};
export const createPlaylist = createCustomPlaylist;

export const removeCustomPlaylist = async (id) => {
  const playlists = await getCustomPlaylists();
  const updated = playlists.filter((p) => p.id !== id);
  return await setJson(STORAGE_KEYS.CUSTOM_PLAYLISTS, updated);
};
export const deletePlaylist = removeCustomPlaylist;

export const getCustomPlaylistById = async (id) => {
  const playlists = await getCustomPlaylists();
  return playlists.find((p) => p.id === id) || null;
};

export const updateCustomPlaylist = async (id, updates) => {
  const playlists = await getCustomPlaylists();
  const idx = playlists.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  playlists[idx] = { ...playlists[idx], ...updates };
  await setJson(STORAGE_KEYS.CUSTOM_PLAYLISTS, playlists);
  return playlists[idx];
};

export const addTrackToCustomPlaylist = async (playlistId, track) => {
  const playlists = await getCustomPlaylists();
  const idx = playlists.findIndex((p) => p.id === playlistId);
  if (idx === -1) return false;
  const pl = playlists[idx];
  pl.tracks = pl.tracks || { total: 0, items: [] };
  const items = pl.tracks.items || [];
  
  const trackId = track.id || track.trackId || track.trackURI;
  const alreadyExists = items.some((item) => {
    const t = item?.track || item;
    return (t.id || t.trackId || t.trackURI) === trackId;
  });
  if (alreadyExists) return false;

  const trackItem = {
    added_at: new Date().toISOString(),
    track: {
      id: trackId,
      name: track.title || track.name || 'Untitled Track',
      title: track.title || track.name || 'Untitled Track',
      artists: track.artists || (track.artist ? [{ name: track.artist }] : [{ name: 'Unknown Artist' }]),
      artist: track.artist || (Array.isArray(track.artists) ? track.artists.map(a => a.name || a).join(', ') : 'Unknown Artist'),
      album: track.album ? {
        name: track.album.name || track.album.title || track.album,
        images: track.album.images || (track.album.coverArt || track.album.image || track.image ? [{ url: track.album.coverArt || track.album.image || track.image }] : [])
      } : {
        name: track.albumTitle || 'Unknown Album',
        images: track.image ? [{ url: track.image }] : []
      },
      image: track.image || track.coverArt || '',
      duration_ms: track.duration_ms || track.duration || 0,
      external_urls: track.external_urls || {},
      spoURL: track.spoURL || track.external_urls?.spotify,
      YTURL: track.YTURL || track.external_urls?.youtube,
    }
  };

  items.unshift(trackItem);
  pl.tracks.items = items;
  pl.tracks.total = items.length;

  if (!pl.image) {
    pl.image = trackItem.track.image || (trackItem.track.album?.images?.[0]?.url) || '';
  }
  if (!pl.images || pl.images.length === 0) {
    if (pl.image) pl.images = [{ url: pl.image }];
  }

  playlists[idx] = pl;
  await setJson(STORAGE_KEYS.CUSTOM_PLAYLISTS, playlists);
  return true;
};

export const removeTrackFromCustomPlaylist = async (playlistId, trackId) => {
  const playlists = await getCustomPlaylists();
  const idx = playlists.findIndex((p) => p.id === playlistId);
  if (idx === -1) return false;
  const pl = playlists[idx];
  pl.tracks = pl.tracks || { total: 0, items: [] };
  const items = (pl.tracks.items || []).filter((item) => {
    const t = item?.track || item;
    return (t.id || t.trackId || t.trackURI) !== trackId;
  });
  pl.tracks.items = items;
  pl.tracks.total = items.length;

  playlists[idx] = pl;
  await setJson(STORAGE_KEYS.CUSTOM_PLAYLISTS, playlists);
  return true;
};

// ==========================================
// User Profile & Preferences
// ==========================================
export const getUserName = async () => {
  try {
    const name = await AsyncStorage.getItem(STORAGE_KEYS.USER_NAME);
    if (name && name.trim()) return name;
    const generated = generateRandomName();
    await AsyncStorage.setItem(STORAGE_KEYS.USER_NAME, generated);
    return generated;
  } catch {
    return 'CosmicGroover';
  }
};

export const setUserName = async (name) => {
  try {
    const finalName = (name || generateRandomName()).trim();
    await AsyncStorage.setItem(STORAGE_KEYS.USER_NAME, finalName);
    return finalName;
  } catch {
    return 'CosmicGroover';
  }
};

export const getFavoriteGenres = async () => getJson(STORAGE_KEYS.FAVORITE_GENRES, []);

export const setFavoriteGenres = async (genres) => {
  return await setJson(STORAGE_KEYS.FAVORITE_GENRES, Array.isArray(genres) ? genres : []);
};

export const getPreferredPlatform = async () => {
  try {
    const pref = await AsyncStorage.getItem(STORAGE_KEYS.PREFERRED_PLATFORM);
    return pref || 'none';
  } catch {
    return 'none';
  }
};

export const getTheme = async () => {
  try {
    const val = await AsyncStorage.getItem(STORAGE_KEYS.APP_THEME);
    return val || 'dark';
  } catch {
    return 'dark';
  }
};

export const setTheme = async (theme) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.APP_THEME, theme);
    return true;
  } catch (err) {
    console.warn('Storage setTheme error:', err);
    return false;
  }
};

export const setPreferredPlatform = async (platform) => {
  try {
    if (!platform || platform === 'none') {
      await AsyncStorage.removeItem(STORAGE_KEYS.PREFERRED_PLATFORM);
    } else {
      await AsyncStorage.setItem(STORAGE_KEYS.PREFERRED_PLATFORM, platform);
    }
    return true;
  } catch {
    return false;
  }
};

export const getUserReviews = async () => getJson(STORAGE_KEYS.USER_REVIEWS, []);

export const getCounts = async () => {
  const [songs, albums, artists, playlists, custom] = await Promise.all([
    getSavedSongs(),
    getSavedAlbums(),
    getSavedArtists(),
    getSavedPlaylists(),
    getCustomPlaylists(),
  ]);
  return {
    songs: songs.length,
    albums: albums.length,
    artists: artists.length,
    playlists: playlists.length + custom.length,
  };
};

export const clearLibraryType = async (type) => {
  if (type === 'songs') await AsyncStorage.removeItem(STORAGE_KEYS.SAVED_SONGS);
  if (type === 'albums') await AsyncStorage.removeItem(STORAGE_KEYS.SAVED_ALBUMS);
  if (type === 'artists') await AsyncStorage.removeItem(STORAGE_KEYS.SAVED_ARTISTS);
  if (type === 'playlists') {
    await AsyncStorage.removeItem(STORAGE_KEYS.SAVED_PLAYLISTS);
    await AsyncStorage.removeItem(STORAGE_KEYS.CUSTOM_PLAYLISTS);
  }
  return true;
};

export const clearAllLibrary = async () => {
  await Promise.all([
    AsyncStorage.removeItem(STORAGE_KEYS.SAVED_SONGS),
    AsyncStorage.removeItem(STORAGE_KEYS.SAVED_ALBUMS),
    AsyncStorage.removeItem(STORAGE_KEYS.SAVED_ARTISTS),
    AsyncStorage.removeItem(STORAGE_KEYS.SAVED_PLAYLISTS),
    AsyncStorage.removeItem(STORAGE_KEYS.CUSTOM_PLAYLISTS),
    AsyncStorage.removeItem(STORAGE_KEYS.USER_REVIEWS),
  ]);
  return true;
};

export const resetAll = async () => {
  await AsyncStorage.clear();
  return true;
};
export const clearStorage = resetAll;

// StorageService unified object for both named and default exports
export const StorageService = {
  getUserName,
  setUserName,
  generateRandomName,
  getFavoriteGenres,
  setFavoriteGenres,
  getSavedSongs,
  saveSong,
  removeSavedSong,
  removeSong,
  isSongSaved,
  getSavedAlbums,
  saveAlbum,
  removeSavedAlbum,
  removeAlbum,
  isAlbumSaved,
  getSavedArtists,
  saveArtist,
  removeSavedArtist,
  removeArtist,
  isArtistSaved,
  getSavedPlaylists,
  savePlaylist,
  removePlaylist,
  getCustomPlaylists,
  setCustomPlaylists,
  createCustomPlaylist,
  createPlaylist,
  removeCustomPlaylist,
  deletePlaylist,
  getCustomPlaylistById,
  updateCustomPlaylist,
  addTrackToCustomPlaylist,
  removeTrackFromCustomPlaylist,
  getPreferredPlatform,
  setPreferredPlatform,
  getTheme,
  setTheme,
  getUserReviews,
  getCounts,
  clearLibraryType,
  clearAllLibrary,
  resetAll,
  clearStorage,
};

export default StorageService;
