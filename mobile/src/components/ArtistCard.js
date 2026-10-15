// src/components/ArtistCard.js
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

export default function ArtistCard({
  artist,
  onRemove,
  showRemove = false,
  layout = 'grid', // 'grid' | 'list'
}) {
  const router = useRouter();
  const scale = useSharedValue(1);
  const [saved, setSaved] = useState(false);

  const id = artist?.id;
  const name = artist?.name || artist?.title || artist?.artist || 'Unknown Artist';
  const imageUrl = artist?.image || artist?.coverArt || artist?.url || 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=300&auto=format&fit=crop&q=80';
  const followers = artist?.followers?.total || artist?.followers;

  useEffect(() => {
    let mounted = true;
    if (id) {
      StorageService.isArtistSaved(id).then((isSaved) => {
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
      router.push(`/artist/${encodeURIComponent(id)}`);
    }
  };

  const toggleSave = async (e) => {
    e?.stopPropagation?.();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (saved) {
      await StorageService.removeSavedArtist(id);
      setSaved(false);
      Toast.show({
        type: 'info',
        text1: 'Removed from Library',
        text2: `"${name}" unbookmarked`,
      });
      if (onRemove) onRemove(id);
    } else {
      const artistData = {
        id,
        name,
        title: name,
        image: imageUrl,
        followers,
        type: 'artist',
      };
      await StorageService.saveArtist(artistData);
      setSaved(true);
      Toast.show({
        type: 'success',
        text1: 'Artist Saved 🎙️',
        text2: `"${name}" added to your followed artists`,
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
        style={[styles.listContainer, animatedStyle]}
      >
        <Image source={{ uri: imageUrl }} style={styles.listImage} resizeMode="cover" />

        <View style={styles.textContainer}>
          <Text style={styles.listName} numberOfLines={1}>
            {name}
          </Text>
          <Text style={styles.listSubtitle}>Artist</Text>
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

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handleCardPress}
      style={[styles.gridContainer, animatedStyle]}
    >
      <View style={styles.avatarWrapper}>
        <Image source={{ uri: imageUrl }} style={styles.avatar} resizeMode="cover" />
        <Pressable onPress={toggleSave} style={styles.floatingBookmark} hitSlop={8}>
          <Ionicons
            name={saved ? 'bookmark' : 'bookmark-outline'}
            size={14}
            color={saved ? COLORS.purpleLighter : COLORS.textSecondary}
          />
        </Pressable>
      </View>

      <Text style={styles.gridName} numberOfLines={1}>
        {name}
      </Text>
      <Text style={styles.gridSubtitle}>Artist</Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  gridContainer: {
    flex: 1,
    margin: 6,
    padding: 12,
    borderRadius: 18,
    backgroundColor: 'rgba(13, 18, 31, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
  },
  avatarWrapper: {
    width: 90,
    height: 90,
    borderRadius: 45,
    position: 'relative',
    marginBottom: 8,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 2,
    borderColor: 'rgba(96, 165, 250, 0.25)',
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 45,
  },
  floatingBookmark: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'rgba(7, 9, 15, 0.85)',
    borderRadius: 12,
    padding: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  gridName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 2,
  },
  gridSubtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  // List
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
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.surfaceElevated,
  },
  textContainer: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  listName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 3,
  },
  listSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
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
