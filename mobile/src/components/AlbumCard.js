// src/components/AlbumCard.js
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

export default function AlbumCard({
  album,
  onRemove,
  showRemove = false,
  layout = 'grid', // 'grid' | 'list'
}) {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const scale = useSharedValue(1);
  const [saved, setSaved] = useState(false);

  const id = album?.id;
  const title = album?.title || album?.name || 'Untitled Album';
  const artist = Array.isArray(album?.artist)
    ? album.artist.map((a) => (typeof a === 'string' ? a : a.name)).join(', ')
    : album?.artist || 'Various Artists';
  const year = album?.releaseYear || album?.releaseDate?.slice(0, 4) || '';
  const imageUrl = album?.image || album?.coverArt || album?.url || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&auto=format&fit=crop&q=80';

  useEffect(() => {
    let mounted = true;
    if (id) {
      StorageService.isAlbumSaved(id).then((isSaved) => {
        if (mounted) setSaved(isSaved);
      });
    }
    return () => {
      mounted = false;
    };
  }, [id]);

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const handleCardPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (id) {
      router.push(`/album/${encodeURIComponent(id)}`);
    }
  };

  const toggleSave = async (e) => {
    e?.stopPropagation?.();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (saved) {
      await StorageService.removeSavedAlbum(id);
      setSaved(false);
      Toast.show({
        type: 'info',
        text1: 'Removed from Library',
        text2: `"${title}" has been unbookmarked`,
      });
      if (onRemove) onRemove(id);
    } else {
      const albumData = {
        id,
        title,
        name: title,
        artist,
        image: imageUrl,
        releaseYear: year,
        type: 'album',
      };
      await StorageService.saveAlbum(albumData);
      setSaved(true);
      Toast.show({
        type: 'success',
        text1: 'Album Saved 💿',
        text2: `"${title}" added to library`,
      });
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (layout === 'list') {
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
            {artist} {year ? `• ${year}` : ''}
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
      <View style={[styles.imageWrapper, { backgroundColor: colors.surfaceElevated }]}>
        <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
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
            size={16}
            color={saved ? colors.accent : colors.textSecondary}
          />
        </Pressable>
        {year ? (
          <View
            style={[
              styles.yearBadge,
              {
                backgroundColor: isDark
                  ? 'rgba(23, 2, 11, 0.75)'
                  : 'rgba(250, 244, 235, 0.85)',
              },
            ]}
          >
            <Text style={[styles.yearText, { color: colors.textSecondary }]}>{year}</Text>
          </View>
        ) : null}
      </View>

      <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
        {title}
      </Text>
      <Text style={[styles.artist, { color: colors.textSecondary }]} numberOfLines={1}>
        {artist}
      </Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  gridContainer: {
    flex: 1,
    margin: 6,
    padding: 10,
    borderRadius: 18,
    borderWidth: 1,
  },
  imageWrapper: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 8,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  floatingBookmark: {
    position: 'absolute',
    top: 6,
    right: 6,
    borderRadius: 16,
    padding: 6,
  },
  yearBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  yearText: {
    fontSize: 10,
    fontWeight: '700',
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  artist: {
    fontSize: 11,
  },
  // List
  listContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 8,
  },
  listImage: {
    width: 52,
    height: 52,
    borderRadius: 12,
  },
  textContainer: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  listTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 3,
  },
  listArtist: {
    fontSize: 12,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    padding: 6,
  },
});
