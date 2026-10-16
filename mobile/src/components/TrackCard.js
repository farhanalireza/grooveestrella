// src/components/TrackCard.js
import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';
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
  const { colors, isDark } = useTheme();
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
        style={[
          styles.gridContainer,
          { backgroundColor: colors.cardBg, borderColor: colors.border },
          animatedStyle,
        ]}
      >
        <View style={[styles.gridImageWrapper, { backgroundColor: colors.surfaceElevated }]}>
          <Image source={{ uri: imageUrl }} style={styles.gridImage} resizeMode="cover" />
          <Pressable
            onPress={toggleSave}
            style={[
              styles.floatingBookmark,
              {
                backgroundColor: isDark
                  ? 'rgba(23, 2, 11, 0.75)'
                  : 'rgba(250, 244, 235, 0.85)',
              },
            ]}
            hitSlop={10}
          >
            <Ionicons
              name={saved ? 'bookmark' : 'bookmark-outline'}
              size={18}
              color={saved ? colors.accent : colors.textSecondary}
            />
          </Pressable>
        </View>

        <Text style={[styles.gridTitle, { color: colors.text }]} numberOfLines={1}>
          {title}
        </Text>
        <Text style={[styles.gridArtist, { color: colors.textSecondary }]} numberOfLines={1}>
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
      style={[
        styles.listContainer,
        { backgroundColor: colors.cardBg, borderColor: colors.border },
        animatedStyle,
      ]}
    >
      <Image
        source={{ uri: imageUrl }}
        style={[styles.listImage, { backgroundColor: colors.surfaceElevated }]}
        resizeMode="cover"
      />

      <View style={styles.textContainer}>
        <Text style={[styles.listTitle, { color: colors.text }]} numberOfLines={1}>
          {title}
        </Text>
        <Text style={[styles.listArtist, { color: colors.textSecondary }]} numberOfLines={1}>
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
            <Ionicons name="trash-outline" size={19} color={colors.error} />
          </Pressable>
        ) : (
          <Pressable onPress={toggleSave} style={styles.iconButton} hitSlop={8}>
            <Ionicons
              name={saved ? 'bookmark' : 'bookmark-outline'}
              size={19}
              color={saved ? colors.accent : colors.textSecondary}
            />
          </Pressable>
        )}

        <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} style={{ opacity: 0.5 }} />
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
    borderWidth: 1,
    marginBottom: 8,
  },
  listImage: {
    width: 48,
    height: 48,
    borderRadius: 10,
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
    marginBottom: 3,
  },
  listArtist: {
    fontSize: 12,
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
    borderWidth: 1,
  },
  gridImageWrapper: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
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
    borderRadius: 20,
    padding: 5,
  },
  gridTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  gridArtist: {
    fontSize: 11,
  },
});
