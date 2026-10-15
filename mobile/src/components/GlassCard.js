// src/components/GlassCard.js
import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants/theme';

export default function GlassCard({
  children,
  style,
  intensity = 25,
  tint = 'dark',
  elevated = false,
  showHighlight = true,
  ...props
}) {
  return (
    <View
      style={[
        styles.container,
        elevated ? styles.elevated : styles.standard,
        style,
      ]}
      {...props}
    >
      {Platform.OS === 'ios' ? (
        <BlurView intensity={intensity} tint={tint} style={StyleSheet.absoluteFill} />
      ) : (
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: elevated ? COLORS.surfaceElevated : COLORS.surface, opacity: 0.94 },
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
    borderColor: COLORS.border,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: COLORS.cardBg,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.45,
        shadowRadius: 20,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  standard: {
    backgroundColor: 'rgba(13, 18, 31, 0.82)',
  },
  elevated: {
    backgroundColor: 'rgba(16, 20, 31, 0.92)',
    borderColor: 'rgba(255, 255, 255, 0.16)',
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.55,
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
