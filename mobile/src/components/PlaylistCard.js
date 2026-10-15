// src/components/PlaylistCard.js
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { COLORS } from '../constants/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function PlaylistCard({
  playlist,
  onPress,
  onDelete,
  isCustom = false,
}) {
  const scale = useSharedValue(1);

  const name = playlist?.name || playlist?.title || 'Groove Playlist';
  const desc = playlist?.description || playlist?.creator || (isCustom ? 'Custom Collection' : 'Curated Mix');
  const count = playlist?.trackCount ?? playlist?.tracks?.length ?? 0;

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
      style={[styles.container, animatedStyle]}
    >
      <LinearGradient
        colors={isCustom ? ['#870087', '#2563EB'] : ['#1E1B4B', '#0D121F']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.artwork}
      >
        <Ionicons
          name={isCustom ? 'list' : 'musical-notes'}
          size={28}
          color="#FFFFFF"
        />
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{count} tracks</Text>
        </View>
      </LinearGradient>

      <View style={styles.info}>
        <View style={{ flex: 1 }}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          <Text style={styles.desc} numberOfLines={1}>
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
            <Ionicons name="trash-outline" size={18} color={COLORS.error} />
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
    backgroundColor: 'rgba(13, 18, 31, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
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
    backgroundColor: 'rgba(7, 9, 15, 0.75)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  badgeText: {
    color: COLORS.text,
    fontSize: 10,
    fontWeight: '700',
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
    color: COLORS.text,
    marginBottom: 2,
  },
  desc: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  deleteButton: {
    padding: 6,
  },
});
