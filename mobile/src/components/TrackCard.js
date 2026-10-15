// src/components/TrackCard.js
import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { COLORS } from '../constants/theme';
import { StorageService } from '../services/storage';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function TrackCard({
  track,
  onRemove,
  showRemove = false,
  layout = 'list', // 'list' | 'grid'
}) {
  const router = useRouter();
  const scale = useSharedValue(1);
  const [saved, setSaved] = useState(false);

  const id = track?.id || track?.trackId || track?.trackURI;
  const title = track?.title || track?.name || 'Untitled Track';
  const artist = Array.isArray(track?.artist)
    ? track.artist.map((a) => (typeof a === 'string' ? a : a.name)).join(', ')
    : track?.artist || 'Unknown Artist';
  const imageUrl = track?.image || track?.url || track?.coverArt || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=300&auto=format&fit=crop&q=80';

  useEffect(() => {
    let mounted = true;
    if (id) {
      StorageService.isSongSaved(id).then((isSaved) => {
        if (mounted) setSaved(isSaved);
      });
    }
    return () => {
      mounted = false;
    };
  }, [id]);

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const handleCardPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (id) {
      router.push(`/track/${encodeURIComponent(id)}`);
    }
  };

  const toggleSave = async (e) => {
    e?.stopPropagation?.();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (saved) {
      await StorageService.removeSavedSong(id);
      setSaved(false);
      Toast.show({
        type: 'info',
        text1: 'Removed from Library',
        text2: `"${title}" has been unbookmarked`,
      });
      if (onRemove) onRemove(id);
    } else {
      const songData = {
        id,
        trackId: id,
        title,
        name: title,
        artist,
        image: imageUrl,
        album: track?.album || '',
        type: 'track',
      };
      await StorageService.saveSong(songData);
      setSaved(true);
      Toast.show({
        type: 'success',
        text1: 'Saved to Library 🎶',
        text2: `"${title}" saved successfully`,
      });
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (layout === 'grid') {
    return (
      <AnimatedPressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handleCardPress}
        style={[styles.gridContainer, animatedStyle]}
      >
        <View style={styles.gridImageWrapper}>
          <Image source={{ uri: imageUrl }} style={styles.gridImage} resizeMode="cover" />
          <Pressable onPress={toggleSave} style={styles.floatingBookmark} hitSlop={10}>
            <Ionicons
              name={saved ? 'bookmark' : 'bookmark-outline'}
              size={18}
              color={saved ? COLORS.purpleLighter : COLORS.textSecondary}
            />
          </Pressable>
        </View>

        <Text style={styles.gridTitle} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.gridArtist} numberOfLines={1}>
          {artist}
        </Text>
      </AnimatedPressable>
    );
  }

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handleCardPress}
      style={[styles.listContainer, animatedStyle]}
    >
      <Image source={{ uri: imageUrl }} style={styles.listImage} resizeMode="cover" />

      <View style={styles.textContainer}>
        <Text style={styles.listTitle} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.listArtist} numberOfLines={1}>
          {artist}
        </Text>
      </View>

      <View style={styles.actions}>
        {showRemove ? (
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onRemove?.(id);
            }}
            style={styles.iconButton}
            hitSlop={8}
          >
            <Ionicons name="trash-outline" size={19} color={COLORS.error} />
          </Pressable>
        ) : (
          <Pressable onPress={toggleSave} style={styles.iconButton} hitSlop={8}>
            <Ionicons
              name={saved ? 'bookmark' : 'bookmark-outline'}
              size={19}
              color={saved ? COLORS.purpleLighter : COLORS.textSecondary}
            />
          </Pressable>
        )}

        <Ionicons name="chevron-forward" size={16} color={COLORS.textSecondary} style={{ opacity: 0.5 }} />
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  listContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 16,
    backgroundColor: 'rgba(13, 18, 31, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 8,
  },
  listImage: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: COLORS.surfaceElevated,
  },
  textContainer: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
    justifyContent: 'center',
  },
  listTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 3,
  },
  listArtist: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    padding: 6,
    borderRadius: 8,
  },
  // Grid Styles
  gridContainer: {
    flex: 1,
    margin: 6,
    padding: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(13, 18, 31, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  gridImageWrapper: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: COLORS.surfaceElevated,
    marginBottom: 8,
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  floatingBookmark: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(7, 9, 15, 0.7)',
    borderRadius: 20,
    padding: 5,
  },
  gridTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  gridArtist: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
});
