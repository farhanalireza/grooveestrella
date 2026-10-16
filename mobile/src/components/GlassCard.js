// src/components/GlassCard.js
import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { COLORS } from '../constants/theme';

export default function GlassCard({
  children,
  style,
  intensity = 25,
  tint,
  elevated = false,
  showHighlight = true,
  ...props
}) {
  const { colors, isDark } = useTheme();
  const activeTint = tint || (isDark ? 'dark' : 'light');

  return (
    <View
      style={[
        styles.container,
        {
          borderColor: colors.border,
          backgroundColor: elevated ? colors.surfaceElevated : colors.cardBg,
        },
        elevated ? styles.elevated : styles.standard,
        style,
      ]}
      {...props}
    >
      {Platform.OS === 'ios' ? (
        <BlurView intensity={intensity} tint={activeTint} style={StyleSheet.absoluteFill} />
      ) : (
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: elevated ? colors.surfaceElevated : colors.surface, opacity: isDark ? 0.94 : 0.98 },
          ]}
        />
      )}

      {showHighlight && (
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.28)', 'rgba(255, 255, 255, 0.05)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.topHighlight}
        />
      )}

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.35,
        shadowRadius: 20,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  standard: {},
  elevated: {
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.45,
        shadowRadius: 28,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  topHighlight: {
    position: 'absolute',
    top: 0,
    left: '10%',
    right: '10%',
    height: 1,
  },
});
