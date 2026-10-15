import { Platform } from 'react-native';

export const colors = {
  // Backgrounds
  background: '#07090F', // deep navy-black
  surface: '#0D121F', // card backgrounds
  surface80: 'rgba(13, 18, 31, 0.8)', // 80% opacity for glass cards
  surfaceElevated: '#10141F', // elevated cards
  surfaceElevated80: 'rgba(16, 20, 31, 0.8)',
  surfaceHighlight: 'rgba(255, 255, 255, 0.05)',

  // Typography
  text: '#F4F7FF', // near-white (primary)
  textPrimary: '#F4F7FF',
  textSecondary: '#8992A5', // muted gray-blue
  textMuted: '#5E6678',

  // Primary Accent (Blue)
  accent: '#2563EB', // blue
  accentPrimary: '#2563EB',
  accentLight: '#60A5FA', // light blue
  accentMuted: 'rgba(37, 99, 235, 0.15)',

  // Purple Accent & Gradient (Magenta-Purple)
  purpleGradient: ['#870087', '#A21CAF', '#C026D3'],
  purpleGradientStart: '#870087',
  purpleGradientVia: '#A21CAF',
  purpleGradientEnd: '#C026D3',
  purpleLight: '#E879F9',
  purpleLightActive: '#F0ABFC', // active states & highlights

  // Borders
  border: 'rgba(255, 255, 255, 0.12)',
  glassBorder: 'rgba(255, 255, 255, 0.08)',
  borderActive: 'rgba(232, 121, 249, 0.4)',

  // Status & Utility
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  overlay: 'rgba(7, 9, 15, 0.75)',
  transparent: 'transparent',
};

export const spacing = {
  4: 4,
  8: 8,
  12: 12,
  16: 16,
  20: 20,
  24: 24,
  32: 32,
  40: 40,
  48: 48,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  pill: 9999,
  full: 9999,
};

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
    backgroundColor: colors.surface80,
    borderColor: colors.glassBorder,
    borderWidth: 1,
    borderRadius: borderRadius.xl,
    ...shadows.glass,
  },
  elevated: {
    backgroundColor: colors.surfaceElevated80,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: borderRadius.xxl,
    ...shadows.glassElevated,
  },
  interactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderColor: colors.glassBorder,
    borderWidth: 1,
    borderRadius: borderRadius.lg,
  },
};

export const blur = {
  tint: 'dark',
  intensity: Platform.OS === 'ios' ? 45 : 30,
  heavyIntensity: Platform.OS === 'ios' ? 70 : 45,
};

export const theme = {
  colors,
  spacing,
  borderRadius,
  fontSize,
  fontWeight,
  shadows,
  glassCard,
  blur,
};

export default theme;
