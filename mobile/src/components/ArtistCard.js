// src/components/ArtistCard.js
import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';
import { COLORS, FONTS } from '../constants/theme';
import { StorageService } from '../services/storage';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function ArtistCard({
  artist,
  onRemove,
  showRemove = false,
  layout = 'grid', // 'grid' | 'list'
}) {
  const router = useRouter();
  const { colors, isDark } = useTheme();
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
          <Text style={[styles.listName, { color: colors.text }]} numberOfLines={1}>
            {name}
          </Text>
          <Text style={[styles.listSubtitle, { color: colors.textSecondary }]}>Artist</Text>
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
      <View
        style={[
          styles.avatarWrapper,
          {
            backgroundColor: colors.surfaceElevated,
            borderColor: isDark ? 'rgba(232, 168, 124, 0.35)' : 'rgba(154, 74, 47, 0.3)',
          },
        ]}
      >
        <Image source={{ uri: imageUrl }} style={styles.avatar} resizeMode="cover" />
        <Pressable
          onPress={toggleSave}
          style={[
            styles.floatingBookmark,
            {
              backgroundColor: isDark
                ? 'rgba(23, 2, 11, 0.85)'
                : 'rgba(250, 244, 235, 0.85)',
              borderColor: colors.border,
            },
          ]}
          hitSlop={8}
        >
          <Ionicons
            name={saved ? 'bookmark' : 'bookmark-outline'}
            size={14}
            color={saved ? colors.accent : colors.textSecondary}
          />
        </Pressable>
      </View>

      <Text style={[styles.gridName, { color: colors.text }]} numberOfLines={1}>
        {name}
      </Text>
      <Text style={[styles.gridSubtitle, { color: colors.textSecondary }]}>Artist</Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  gridContainer: {
    flex: 1,
    margin: 6,
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
  },
  avatarWrapper: {
    width: 90,
    height: 90,
    borderRadius: 45,
    position: 'relative',
    marginBottom: 8,
    borderWidth: 2,
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
    borderRadius: 12,
    padding: 5,
    borderWidth: 1,
  },
  gridName: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: FONTS.displaySemiBold,
    textAlign: 'center',
    marginBottom: 2,
  },
  gridSubtitle: {
    fontSize: 11,
    fontFamily: FONTS.body,
    textAlign: 'center',
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
    borderRadius: 26,
  },
  textContainer: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  listName: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: FONTS.displaySemiBold,
    marginBottom: 3,
  },
  listSubtitle: {
    fontSize: 12,
    fontFamily: FONTS.body,
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
