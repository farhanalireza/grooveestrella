// src/components/LiquidPill.js
import React from 'react';
import { Pressable, Text, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function LiquidPill({
  label,
  icon,
  active,
  onPress,
  count,
  style,
}) {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.94, { damping: 15, stiffness: 250 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 250 });
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      style={[
        styles.pill,
        active ? styles.pillActive : styles.pillInactive,
        animatedStyle,
        style,
      ]}
    >
      {active && (
        <LinearGradient
          colors={['rgba(135,0,135,0.5)', 'rgba(192,38,211,0.2)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      )}

      {icon && (
        <Ionicons
          name={icon}
          size={14}
          color={active ? COLORS.purpleLightest : COLORS.textSecondary}
          style={styles.icon}
        />
      )}

      <Text
        style={[
          styles.label,
          active ? styles.labelActive : styles.labelInactive,
        ]}
      >
        {label}
      </Text>

      {count !== undefined && (
        <Text
          style={[
            styles.countBadge,
            active ? styles.countActive : styles.countInactive,
          ]}
        >
          {count}
        </Text>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 9999,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    marginRight: 8,
  },
  pillActive: {
    borderColor: 'rgba(232, 121, 249, 0.45)',
    ...Platform.select({
      ios: {
        shadowColor: '#870087',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.45,
        shadowRadius: 10,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  pillInactive: {
    backgroundColor: 'rgba(13, 18, 31, 0.65)',
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  icon: {
    marginRight: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  labelActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  labelInactive: {
    color: COLORS.textSecondary,
  },
  countBadge: {
    marginLeft: 6,
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  countActive: {
    backgroundColor: 'rgba(240, 171, 252, 0.25)',
    color: '#FFFFFF',
  },
  countInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    color: COLORS.textSecondary,
  },
});
