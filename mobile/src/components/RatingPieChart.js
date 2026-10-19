import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { COLORS, FONTS } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

export default function RatingPieChart({ rating, size = 'md', style = {} }) {
  const { colors, isDark } = useTheme();
  const rawStar =
    rating?.value !== undefined && rating?.value !== null
      ? Number(rating.value)
      : 4.6;

  // Convert 1-5 star scale to 1-10 scale
  const score10 = Math.max(1, Math.min(10, Number((rawStar * 2).toFixed(1))));

  let color = '#10B981'; // Green
  let statusText = 'Acclaimed (8-10)';

  if (score10 >= 8) {
    color = '#10B981'; // Green
    statusText = 'Acclaimed (8-10)';
  } else if (score10 >= 5) {
    color = '#F59E0B'; // Yellow / Amber
    statusText = 'Favorable (5-8)';
  } else {
    color = '#EF4444'; // Red
    statusText = 'Mixed (1-5)';
  }

  // Circular Pie Chart calculations
  const radius = 17;
  const strokeWidth = 4;
  const circumference = 2 * Math.PI * radius; // ~106.81
  const progressRatio = score10 / 10;
  const strokeDashoffset = circumference - progressRatio * circumference;

  return (
    <View style={[styles.container, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }, style]}>
      {/* Circular Pie Chart SVG */}
      <View style={styles.svgWrapper}>
        <Svg width={44} height={44} viewBox="0 0 44 44" style={styles.svg}>
          {/* Base track circle */}
          <Circle
            cx="22"
            cy="22"
            r={radius}
            fill={isDark ? "rgba(0, 0, 0, 0.4)" : "rgba(0, 0, 0, 0.04)"}
            stroke={colors.border}
            strokeWidth={strokeWidth}
          />
          {/* Dynamic colored progress pie arc */}
          <Circle
            cx="22"
            cy="22"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </Svg>

        {/* Center Score */}
        <View style={styles.centerScore}>
          <Text style={[styles.scoreText, { color }]}>{score10}</Text>
        </View>
      </View>

      {/* Label and Status */}
      <View style={styles.textWrapper}>
        <View style={styles.headerRow}>
          <Text style={[styles.grooveScoreLabel, { color: colors.textSecondary }]}>GROOVE SCORE</Text>
          <Text style={[styles.scoreRatioText, { color: colors.textSecondary }]}>{score10}/10</Text>
        </View>
        <View style={styles.statusRow}>
          <View style={[styles.pulsingDot, { backgroundColor: color }]} />
          <Text style={[styles.statusText, { color }]}>+ {statusText}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(7, 9, 15, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  svgWrapper: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  svg: {
    transform: [{ rotate: '-90deg' }],
  },
  centerScore: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreText: {
    fontSize: 12,
    fontFamily: FONTS.displayBold,
    fontVariant: ['tabular-nums'],
  },
  textWrapper: {
    marginLeft: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  grooveScoreLabel: {
    fontSize: 10,
    fontFamily: FONTS.displayBold,
    color: '#8992A5',
    letterSpacing: 0.8,
  },
  scoreRatioText: {
    fontSize: 9,
    color: 'rgba(137, 146, 165, 0.7)',
    fontFamily: FONTS.bodySemiBold,
    fontVariant: ['tabular-nums'],
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  pulsingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontFamily: FONTS.bodySemiBold,
  },
});
