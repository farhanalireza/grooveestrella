// mobile/src/components/PlaylistCover.js
import React, { useMemo } from 'react';
import { View, Text, Image, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export function extractPlaylistCovers(tracks = []) {
  if (!Array.isArray(tracks)) return [];
  const covers = [];
  const seen = new Set();

  for (const item of tracks) {
    const t = item?.track || item;
    const url = t?.album?.images?.[0]?.url || t?.image || t?.coverArt || t?.url;
    if (url && typeof url === 'string' && !url.includes('placehold') && !seen.has(url)) {
      seen.add(url);
      covers.push(url);
    }
  }
  return covers;
}

export default function PlaylistCover({ 
  tracks = [], 
  name = 'Playlist', 
  defaultCover = null, 
  size = 220, 
  style,
  playlist = null,
}) {
  const effectiveName = playlist?.name || playlist?.title || name;
  const effectiveTracks = useMemo(() => {
    if (Array.isArray(tracks) && tracks.length > 0) return tracks;
    if (Array.isArray(playlist?.tracks?.items)) return playlist.tracks.items;
    if (Array.isArray(playlist?.tracks)) return playlist.tracks;
    return [];
  }, [tracks, playlist]);

  const covers = useMemo(() => {
    const extracted = extractPlaylistCovers(effectiveTracks);
    if (extracted.length > 0) return extracted;
    const fallbackCover = playlist?.image || playlist?.images?.[0]?.url || defaultCover;
    if (fallbackCover && typeof fallbackCover === 'string' && !fallbackCover.includes('placehold')) {
      return [fallbackCover];
    }
    return [];
  }, [effectiveTracks, playlist, defaultCover]);

  const containerStyle = [
    styles.container,
    { width: size, height: size, borderRadius: size > 150 ? 24 : 16 },
    style,
  ];

  // Case 1: 4 or more covers -> 2x2 grid collage
  if (covers.length >= 4) {
    const half = size / 2;
    return (
      <View style={containerStyle}>
        <View style={styles.collageRow}>
          <Image source={{ uri: covers[0] }} style={{ width: half, height: half }} resizeMode="cover" />
          <Image source={{ uri: covers[1] }} style={{ width: half, height: half }} resizeMode="cover" />
        </View>
        <View style={styles.collageRow}>
          <Image source={{ uri: covers[2] }} style={{ width: half, height: half }} resizeMode="cover" />
          <Image source={{ uri: covers[3] }} style={{ width: half, height: half }} resizeMode="cover" />
        </View>
      </View>
    );
  }

  // Case 2: 1 to 3 covers -> First track's cover
  if (covers.length >= 1) {
    return (
      <View style={containerStyle}>
        <Image source={{ uri: covers[0] }} style={styles.fullImage} resizeMode="cover" />
      </View>
    );
  }

  // Case 3: 0 covers -> Vibrant dynamic gradient with playlist name
  return (
    <View style={containerStyle}>
      <LinearGradient
        colors={['#E8A87C', '#C38D9E', '#41B3A3']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.overlay} />
        <Text style={styles.gradientTitle} numberOfLines={3} ellipsizeMode="tail">
          {effectiveName}
        </Text>
        <Text style={styles.gradientSubtitle}>
          GROOVE PLAYLIST
        </Text>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: '#1E1E2E',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
  collageRow: {
    flexDirection: 'row',
    width: '100%',
  },
  gradient: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  gradientTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    fontFamily: 'SpaceGrotesk-Bold',
    textAlign: 'center',
    letterSpacing: -0.3,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
    lineHeight: 22,
  },
  gradientSubtitle: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 9,
    fontWeight: '800',
    fontFamily: 'SpaceGrotesk-SemiBold',
    letterSpacing: 1.5,
    marginTop: 6,
  },
});
