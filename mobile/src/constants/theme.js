// src/constants/theme.js
import { Platform } from 'react-native';

export const THEME_PALETTE = {
  // Canonical Palette
  plum: '#470B24',
  copper: '#D4A373',
  peach: '#FFEDD5',
  gradient: ['#470B24', '#D4A373', '#FFEDD5'],
};

export const DARK_COLORS = {
  // Backgrounds: Deep Obsidian Wine BG for deeper dark mode
  bg: '#17020B',
  background: '#17020B',
  surface: 'rgba(71, 11, 36, 0.5)',
  surface80: 'rgba(71, 11, 36, 0.75)',
  surfaceElevated: '#2D0516',
  surfaceElevated60: 'rgba(45, 5, 22, 0.6)',
  surfaceElevated80: 'rgba(45, 5, 22, 0.8)',
  surfaceHighlight: 'rgba(255, 242, 223, 0.08)',
  cardBg: 'rgba(71, 11, 36, 0.6)',

  // Typography: Warm Soft Cream
  text: '#FFF2DF',
  textPrimary: '#FFF2DF',
  textSecondary: 'rgba(255, 242, 223, 0.72)',
  textSecondary50: 'rgba(255, 242, 223, 0.5)',
  textMuted: 'rgba(255, 242, 223, 0.45)',
  white: '#FFF2DF',

  // Accent: Warm Peach-Copper
  accent: '#E8A87C',
  accentPrimary: '#E8A87C',
  accentLight: '#F0C9A8',
  accentMuted: 'rgba(232, 168, 124, 0.2)',

  // Brand Gradients & Accents (copper family, no blue)
  purple: '#E8A87C',
  purpleMid: '#D4A373',
  purpleLight: '#E8A87C',
  purpleLighter: '#F0C9A8',
  purpleLightest: '#FFEDD5',
  purpleGradient: ['#470B24', '#D4A373', '#FFEDD5'],
  purpleGradientStart: '#470B24',
  purpleGradientVia: '#D4A373',
  purpleGradientEnd: '#FFEDD5',

  // Borders
  border: 'rgba(181, 150, 130, 0.18)',
  glassBorder: 'rgba(181, 150, 130, 0.14)',
  borderActive: '#E8A87C',

  // Status & Utility
  error: '#EF4444',
  errorBg: 'rgba(239, 68, 68, 0.18)',
  errorBorder: 'rgba(239, 68, 68, 0.35)',
  success: '#10B981',
  warning: '#F59E0B',
  overlay: 'rgba(23, 2, 11, 0.85)',
  transparent: 'transparent',
};

export const LIGHT_COLORS = {
  // Backgrounds: Clean Warm Peach Cream BG
  bg: '#FAF4EB',
  background: '#FAF4EB',
  surface: 'rgba(255, 245, 235, 0.92)',
  surface80: 'rgba(255, 245, 235, 0.8)',
  surfaceElevated: '#FFFFFF',
  surfaceElevated60: 'rgba(255, 255, 255, 0.6)',
  surfaceElevated80: 'rgba(255, 255, 255, 0.8)',
  surfaceHighlight: 'rgba(26, 10, 16, 0.05)',
  cardBg: '#FFFFFF',

  // Typography: Deep Crisp Wine-Black (dark for razor sharp readability)
  text: '#1A0A10',
  textPrimary: '#1A0A10',
  textSecondary: '#6B3040',
  textSecondary50: 'rgba(107, 48, 64, 0.65)',
  textMuted: '#8A4458',
  white: '#FFFFFF',

  // Accent: Terracotta Copper — warm, high contrast, zero blue
  accent: '#9A4A2F',
  accentPrimary: '#9A4A2F',
  accentLight: '#E8C4A0',
  accentMuted: 'rgba(154, 74, 47, 0.2)',

  // Brand Gradients & Accents (copper family, reversed for light)
  purple: '#9A4A2F',
  purpleMid: '#B87333',
  purpleLight: '#D4A373',
  purpleLighter: '#E8C4A0',
  purpleLightest: '#1A0A10',
  purpleGradient: ['#FAF4EB', '#D4A373', '#470B24'],
  purpleGradientStart: '#FAF4EB',
  purpleGradientVia: '#D4A373',
  purpleGradientEnd: '#470B24',

  // Borders
  border: 'rgba(71, 11, 36, 0.12)',
  glassBorder: 'rgba(71, 11, 36, 0.08)',
  borderActive: '#9A4A2F',

  // Status & Utility
  error: '#DC2626',
  errorBg: 'rgba(220, 38, 38, 0.15)',
  errorBorder: 'rgba(220, 38, 38, 0.3)',
  success: '#059669',
  warning: '#D97706',
  overlay: 'rgba(255, 237, 213, 0.85)',
  transparent: 'transparent',
};

export const getThemeColors = (mode = 'dark') => {
  return mode === 'light' ? LIGHT_COLORS : DARK_COLORS;
};

export const COLORS = { ...DARK_COLORS };

export function updateGlobalColors(mode) {
  const next = getThemeColors(mode);
  Object.assign(COLORS, next);
}

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
  theme: ['#470B24', '#D4A373', '#FFEDD5'],
  purple: ['#470B24', '#D4A373', '#FFEDD5'],
  purpleLight: ['rgba(71, 11, 36, 0.6)', 'rgba(212, 163, 115, 0.35)'],
  blue: ['#470B24', '#D4A373'],
  accent: ['#D4A373', '#FFEDD5'],
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
      shadowColor: '#D4A373',
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
      shadowColor: '#E8A87C',
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
