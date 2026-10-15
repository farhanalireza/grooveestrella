// src/constants/theme.js
import { Platform } from 'react-native';

export const COLORS = {
  // Backgrounds
  bg: '#07090F',
  background: '#07090F',
  surface: '#0D121F',
  surface80: 'rgba(13, 18, 31, 0.8)',
  surfaceElevated: '#10141F',
  surfaceElevated60: 'rgba(16, 20, 31, 0.6)',
  surfaceElevated80: 'rgba(16, 20, 31, 0.8)',
  surfaceHighlight: 'rgba(255, 255, 255, 0.05)',
  cardBg: 'rgba(13, 18, 31, 0.8)',

  // Typography
  text: '#F4F7FF',
  textPrimary: '#F4F7FF',
  textSecondary: '#8992A5',
  textSecondary50: 'rgba(137, 146, 165, 0.5)',
  textMuted: '#5E6678',
  white: '#FFFFFF',

  // Primary Accent (Blue)
  accent: '#2563EB',
  accentPrimary: '#2563EB',
  accentLight: '#60A5FA',
  accentMuted: 'rgba(37, 99, 235, 0.15)',

  // Purple Accent & Gradient
  purple: '#870087',
  purpleMid: '#A21CAF',
  purpleLight: '#C026D3',
  purpleLighter: '#E879F9',
  purpleLightest: '#F0ABFC',
  purpleGradient: ['#870087', '#A21CAF', '#C026D3'],
  purpleGradientStart: '#870087',
  purpleGradientVia: '#A21CAF',
  purpleGradientEnd: '#C026D3',

  // Borders
  border: 'rgba(255, 255, 255, 0.12)',
  glassBorder: 'rgba(255, 255, 255, 0.08)',
  borderActive: 'rgba(232, 121, 249, 0.4)',

  // Status & Utility
  error: '#EF4444',
  errorBg: 'rgba(239, 68, 68, 0.15)',
  errorBorder: 'rgba(239, 68, 68, 0.3)',
  success: '#10B981',
  warning: '#F59E0B',
  overlay: 'rgba(7, 9, 15, 0.75)',
  transparent: 'transparent',
};

// Lowercase alias
export const colors = COLORS;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  4: 4,
  8: 8,
  12: 12,
  16: 16,
  20: 20,
  24: 24,
  32: 32,
  40: 40,
  48: 48,
};

export const spacing = SPACING;

export const RADIUS = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  pill: 9999,
  full: 9999,
};

export const borderRadius = RADIUS;

export const fontSize = {
  xs: 10,
  sm: 12,
  base: 14,
  lg: 16,
  xl: 18,
  xxl: 22,
  title: 28,
  hero: 36,
};

export const fontWeight = {
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
};

export const GRADIENTS = {
  purple: ['#870087', '#A21CAF', '#C026D3'],
  purpleLight: ['rgba(135, 0, 135, 0.5)', 'rgba(192, 38, 211, 0.2)'],
  blue: ['#2563EB', '#60A5FA'],
  glass: ['rgba(255, 255, 255, 0.28)', 'rgba(255, 255, 255, 0.05)', 'transparent'],
};

export const AVAILABLE_GENRES = [
  'Rock', 'Pop', 'Indie', 'Electronic', 'Hip Hop',
  'Jazz', 'Classical', 'Alternative', 'Metal', 'R&B',
  'Blues', 'Folk', 'Punk', 'Ambient', 'Soul', 'Disco'
];

export const PLATFORMS = [
  { id: 'none', name: 'Always Ask (Show GrooveCard)', desc: 'Show options list instead of auto-redirecting', icon: 'options-outline', accentColor: '#8992A5', bgColor: 'rgba(137, 146, 165, 0.15)' },
  { id: 'spotify', name: 'Spotify', desc: 'Launch directly in Spotify app', icon: 'musical-notes', accentColor: '#1DB954', bgColor: 'rgba(29, 185, 84, 0.15)' },
  { id: 'apple_music', name: 'Apple Music', desc: 'Open inside Apple Music player', icon: 'logo-apple', accentColor: '#FC3C44', bgColor: 'rgba(252, 60, 68, 0.15)' },
  { id: 'youtube_music', name: 'YouTube Music', desc: 'Redirect to YouTube Music', icon: 'play-circle', accentColor: '#FF0000', bgColor: 'rgba(255, 0, 0, 0.15)' },
  { id: 'youtube', name: 'YouTube', desc: 'Open standard YouTube stream', icon: 'logo-youtube', accentColor: '#FF0000', bgColor: 'rgba(255, 0, 0, 0.12)' },
  { id: 'deezer', name: 'Deezer', desc: 'Open in Deezer player', icon: 'disc', accentColor: '#A238FF', bgColor: 'rgba(162, 56, 255, 0.15)' },
  { id: 'tidal', name: 'TIDAL', desc: 'Open in TIDAL player', icon: 'infinite', accentColor: '#00FFFF', bgColor: 'rgba(0, 255, 255, 0.15)' },
  { id: 'soundcloud', name: 'SoundCloud', desc: 'Open inside SoundCloud player', icon: 'cloud-outline', accentColor: '#FF5500', bgColor: 'rgba(255, 85, 0, 0.15)' },
  { id: 'musicbrainz', name: 'MusicBrainz', desc: 'Open in MusicBrainz metadata catalog', icon: 'library-outline', accentColor: '#BA478F', bgColor: 'rgba(186, 71, 143, 0.18)' },
];
// Attach key-based lookup to PLATFORMS array
PLATFORMS.forEach((p) => {
  PLATFORMS[p.id] = p;
});

export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: Platform.select({
    ios: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
    },
    android: {
      elevation: 2,
    },
    default: {},
  }),
  md: Platform.select({
    ios: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
    },
    android: {
      elevation: 4,
    },
    default: {},
  }),
  lg: Platform.select({
    ios: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.35,
      shadowRadius: 16,
    },
    android: {
      elevation: 8,
    },
    default: {},
  }),
  glass: Platform.select({
    ios: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.4,
      shadowRadius: 18,
    },
    android: {
      elevation: 6,
    },
    default: {},
  }),
  glassElevated: Platform.select({
    ios: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.45,
      shadowRadius: 24,
    },
    android: {
      elevation: 10,
    },
    default: {},
  }),
  purpleGlow: Platform.select({
    ios: {
      shadowColor: '#C026D3',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.45,
      shadowRadius: 16,
    },
    android: {
      elevation: 8,
    },
    default: {},
  }),
  blueGlow: Platform.select({
    ios: {
      shadowColor: '#2563EB',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 14,
    },
    android: {
      elevation: 8,
    },
    default: {},
  }),
};

export const glassCard = {
  default: {
    backgroundColor: COLORS.surface80,
    borderColor: COLORS.glassBorder,
    borderWidth: 1,
    borderRadius: RADIUS.xl,
    ...shadows.glass,
  },
  elevated: {
    backgroundColor: COLORS.surfaceElevated80,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: RADIUS.xxl,
    ...shadows.glassElevated,
  },
  interactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderColor: COLORS.glassBorder,
    borderWidth: 1,
    borderRadius: RADIUS.lg,
  },
};

export const blur = {
  tint: 'dark',
  intensity: Platform.OS === 'ios' ? 45 : 30,
  heavyIntensity: Platform.OS === 'ios' ? 70 : 45,
};

export const theme = {
  COLORS,
  colors: COLORS,
  SPACING,
  spacing: SPACING,
  RADIUS,
  borderRadius: RADIUS,
  fontSize,
  fontWeight,
  shadows,
  glassCard,
  blur,
  GRADIENTS,
  AVAILABLE_GENRES,
  PLATFORMS,
};

export default theme;
