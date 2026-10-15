import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import GlassCard from './GlassCard';
import { COLORS, RADIUS, SPACING } from '../constants/theme';

const SPRING_CONFIG = {
  stiffness: 450,
  damping: 30,
};

/**
 * @typedef {Object} EmptyStateProps
 * @property {React.ReactNode | ((props: { color: string; size: number }) => React.ReactNode)} [icon] - Large configurable icon element or render function.
 * @property {string} title - Main headline (bold, white).
 * @property {string} [description] - Subtitle or explanation (secondary text).
 * @property {string} [buttonText] - Optional CTA button label.
 * @property {() => void} [onButtonPress] - Optional CTA button press callback.
 * @property {React.ReactNode} [buttonIcon] - Optional icon inside CTA button.
 * @property {import('react-native').StyleProp<import('react-native').ViewStyle>} [style] - Outer container style.
 * @property {import('react-native').StyleProp<import('react-native').ViewStyle>} [cardStyle] - Inner GlassCard style.
 */

/**
 * EmptyState - Liquid glass empty state placeholder with configurable icon,
 * descriptive messaging, and optional accent CTA button.
 *
 * @param {EmptyStateProps} props
 * @returns {JSX.Element}
 */
const EmptyState = ({
  icon,
  title = 'Nothing here yet',
  description,
  buttonText,
  onButtonPress,
  buttonIcon,
  style,
  cardStyle,
}) => {
  const btnScale = useSharedValue(1);

  const handleBtnPressIn = () => {
    btnScale.value = withSpring(0.94, SPRING_CONFIG);
  };

  const handleBtnPressOut = () => {
    btnScale.value = withSpring(1, SPRING_CONFIG);
  };

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    if (onButtonPress) onButtonPress();
  };

  const btnAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: btnScale.value }],
    };
  });

  const renderIcon = () => {
    if (!icon) {
      return <Ionicons name="musical-notes-outline" size={44} color={COLORS.purpleLighter} />;
    }
    if (typeof icon === 'function') {
      return icon({ color: COLORS.purpleLighter, size: 44 });
    }
    return icon;
  };

  return (
    <Animated.View entering={FadeIn.duration(450)} style={[styles.outerWrapper, style]}>
      <GlassCard style={[styles.card, cardStyle]} contentStyle={styles.cardContent}>
        {/* Icon Badge */}
        <View style={styles.iconCircle}>
          {renderIcon()}
        </View>

        {/* Title */}
        <Text style={styles.title}>{title}</Text>

        {/* Description */}
        {description ? (
          <Text style={styles.description}>{description}</Text>
        ) : null}

        {/* Optional Accent CTA Button */}
        {buttonText ? (
          <Animated.View style={[styles.buttonWrapper, btnAnimatedStyle]}>
            <Pressable
              onPressIn={handleBtnPressIn}
              onPressOut={handleBtnPressOut}
              onPress={handlePress}
              style={styles.ctaButton}
              android_ripple={{ color: 'rgba(255, 255, 255, 0.2)' }}
              accessibilityRole="button"
            >
              {buttonIcon ? <View style={styles.btnIcon}>{buttonIcon}</View> : null}
              <Text style={styles.btnText}>{buttonText}</Text>
            </Pressable>
          </Animated.View>
        ) : null}
      </GlassCard>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  outerWrapper: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 420,
  },
  cardContent: {
    paddingVertical: SPACING.xxxl,
    paddingHorizontal: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(232, 121, 249, 0.1)',
    borderWidth: 1.5,
    borderColor: 'rgba(232, 121, 249, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    shadowColor: COLORS.purple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  title: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: SPACING.sm,
    letterSpacing: 0.3,
  },
  description: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 280,
    marginBottom: SPACING.lg,
  },
  buttonWrapper: {
    marginTop: SPACING.sm,
    borderRadius: RADIUS.full,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  ctaButton: {
    backgroundColor: COLORS.accent,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: RADIUS.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnIcon: {
    marginRight: 8,
  },
  btnText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});

export default EmptyState;
