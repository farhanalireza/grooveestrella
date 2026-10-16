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
import { useTheme } from '../context/ThemeContext';
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
  const { colors, isDark } = useTheme();
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

  const activeGradient = isDark
    ? ['rgba(71, 11, 36, 0.85)', 'rgba(212, 163, 115, 0.45)']
    : ['rgba(212, 163, 115, 0.7)', 'rgba(154, 74, 47, 0.45)'];

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      style={[
        styles.pill,
        active
          ? [styles.pillActive, { borderColor: colors.accent }]
          : [styles.pillInactive, { backgroundColor: colors.surface, borderColor: colors.border }],
        animatedStyle,
        style,
      ]}
    >
      {active && (
        <LinearGradient
          colors={activeGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      )}

      {icon && (
        <Ionicons
          name={icon}
          size={14}
          color={active ? (isDark ? '#FFF2DF' : '#FFFFFF') : colors.textSecondary}
          style={styles.icon}
        />
      )}

      <Text
        style={[
          styles.label,
          active
            ? [styles.labelActive, { color: isDark ? '#FFF2DF' : '#FFFFFF' }]
            : [styles.labelInactive, { color: colors.textSecondary }],
        ]}
      >
        {label}
      </Text>

      {count !== undefined && (
        <Text
          style={[
            styles.countBadge,
            active
              ? [
                  styles.countActive,
                  {
                    backgroundColor: isDark ? 'rgba(232, 168, 124, 0.25)' : 'rgba(154, 74, 47, 0.25)',
                    color: isDark ? '#FFF2DF' : '#FFFFFF',
                  },
                ]
              : [
                  styles.countInactive,
                  { backgroundColor: colors.surfaceHighlight, color: colors.textSecondary },
                ],
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
    borderColor: '#D4A373',
    ...Platform.select({
      ios: {
        shadowColor: '#D4A373',
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
    borderWidth: 1,
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
    fontWeight: '800',
  },
  labelInactive: {},
  countBadge: {
    marginLeft: 6,
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  countActive: {},
  countInactive: {},
});
