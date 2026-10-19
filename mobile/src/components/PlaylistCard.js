// src/components/PlaylistCard.js
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';
import { COLORS, FONTS } from '../constants/theme';
import PlaylistCover from './PlaylistCover';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function PlaylistCard({
  playlist,
  onPress,
  onDelete,
  isCustom = false,
}) {
  const { colors, isDark } = useTheme();
  const scale = useSharedValue(1);

  const name = playlist?.name || playlist?.title || 'Groove Playlist';
  const desc = playlist?.description || playlist?.creator || (isCustom ? 'Custom Collection' : 'Curated Mix');
  const count = playlist?.tracks?.total ?? playlist?.tracks?.items?.length ?? playlist?.tracks?.length ?? playlist?.trackCount ?? 0;

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress?.();
      }}
      style={[
        styles.container,
        { backgroundColor: colors.cardBg, borderColor: colors.border },
        animatedStyle,
      ]}
    >
      <View style={styles.artwork}>
        <PlaylistCover
          playlist={playlist}
          tracks={playlist?.tracks?.items || playlist?.tracks}
          size={110}
          style={{ width: '100%', height: 110, borderRadius: 12 }}
        />
        <View
          style={[
            styles.badge,
            {
              backgroundColor: isDark
                ? 'rgba(23, 2, 11, 0.75)'
                : 'rgba(250, 244, 235, 0.85)',
            },
          ]}
        >
          <Text style={[styles.badgeText, { color: colors.text }]}>{count} tracks</Text>
        </View>
      </View>

      <View style={styles.info}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
            {name}
          </Text>
          <Text style={[styles.desc, { color: colors.textSecondary }]} numberOfLines={1}>
            {desc}
          </Text>
        </View>

        {onDelete && (
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onDelete();
            }}
            style={styles.deleteButton}
            hitSlop={8}
          >
            <Ionicons name="trash-outline" size={18} color={colors.error} />
          </Pressable>
        )}
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 6,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    padding: 10,
  },
  artwork: {
    width: '100%',
    height: 110,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: FONTS.mono,
  },
  info: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    justifyContent: 'space-between',
  },
  name: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: FONTS.displaySemiBold,
    marginBottom: 2,
  },
  desc: {
    fontSize: 11,
    fontFamily: FONTS.body,
  },
  deleteButton: {
    padding: 6,
  },
});
