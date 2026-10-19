import React, { useState } from 'react';
import {
  StyleSheet,
  TextInput,
  View,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Feather } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../context/ThemeContext';
import { COLORS, FONTS, RADIUS, SPACING } from '../constants/theme';

/**
 * @typedef {Object} GlassInputProps
 * @property {string} value - Current input value.
 * @property {(text: string) => void} onChangeText - Callback on text change.
 * @property {string} [placeholder='Search tracks, artists, albums...'] - Placeholder text.
 * @property {string} [leftIconName='search'] - Feather icon name for left icon.
 * @property {boolean} [showClearButton=true] - Whether to show clear (X) button when text is present.
 * @property {() => void} [onClear] - Custom callback when cleared.
 * @property {import('react-native').StyleProp<import('react-native').ViewStyle>} [containerStyle] - Outer wrapper style.
 * @property {import('react-native').StyleProp<import('react-native').TextStyle>} [inputStyle] - TextInput custom style.
 * @property {() => void} [onFocus] - Focus callback.
 * @property {() => void} [onBlur] - Blur callback.
 * @property {() => void} [onSubmitEditing] - Submit editing callback.
 */

/**
 * GlassInput - Liquid glass search/text input with dynamic focus glow,
 * backdrop blur, search icon, and haptic clear button.
 *
 * @param {GlassInputProps & import('react-native').TextInputProps} props
 * @returns {JSX.Element}
 */
const GlassInput = ({
  value = '',
  onChangeText,
  placeholder = 'Search tracks, artists, albums...',
  leftIconName = 'search',
  showClearButton = true,
  onClear,
  containerStyle,
  inputStyle,
  onFocus,
  onBlur,
  onSubmitEditing,
  ...textInputProps
}) => {
  const { colors, isDark } = useTheme();
  const [isFocusedState, setIsFocusedState] = useState(false);
  const focusAnim = useSharedValue(0);

  const handleFocus = (e) => {
    setIsFocusedState(true);
    focusAnim.value = withTiming(1, { duration: 220 });
    if (onFocus) onFocus(e);
  };

  const handleBlur = (e) => {
    setIsFocusedState(false);
    focusAnim.value = withTiming(0, { duration: 220 });
    if (onBlur) onBlur(e);
  };

  const handleClear = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    if (onChangeText) onChangeText('');
    if (onClear) onClear();
  };

  // Dynamic animated border and glow
  const animatedBorderStyle = useAnimatedStyle(() => {
    const borderColor = interpolateColor(
      focusAnim.value,
      [0, 1],
      [colors.border, colors.accent]
    );

    const shadowOpacity = focusAnim.value * 0.45;

    return {
      borderColor,
      shadowColor: colors.accent,
      shadowOpacity,
      shadowRadius: focusAnim.value * 10,
      shadowOffset: { width: 0, height: 0 },
      elevation: focusAnim.value * 4,
    };
  });

  return (
    <Animated.View style={[styles.outerContainer, { borderColor: colors.border }, animatedBorderStyle, containerStyle]}>
      {/* Liquid blur layer */}
      <BlurView intensity={35} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFillObject} />
      <View style={[styles.surfaceOverlay, { backgroundColor: colors.surfaceElevated60 }]} />

      <View style={styles.contentRow}>
        {/* Left Icon */}
        {leftIconName ? (
          <View style={styles.iconWrapper}>
            <Feather
              name={leftIconName}
              size={18}
              color={isFocusedState ? colors.accent : colors.textSecondary}
            />
          </View>
        ) : null}

        {/* Text Input */}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary50 || colors.textSecondary}
          selectionColor={colors.accent}
          style={[styles.input, { color: colors.text }, inputStyle]}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onSubmitEditing={onSubmitEditing}
          returnKeyType="search"
          {...textInputProps}
        />

        {/* Clear (X) Button */}
        {showClearButton && value && value.length > 0 ? (
          <TouchableOpacity
            onPress={handleClear}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={[styles.clearButton, { backgroundColor: colors.surfaceHighlight }]}
            accessibilityLabel="Clear text"
            accessibilityRole="button"
          >
            <Feather name="x" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        ) : null}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    height: 50,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    backgroundColor: Platform.select({
      android: COLORS.surfaceElevated60,
      default: 'transparent',
    }),
  },
  surfaceOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.surfaceElevated60,
  },
  contentRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    zIndex: 2,
  },
  iconWrapper: {
    marginRight: SPACING.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: '100%',
    color: COLORS.text,
    fontSize: 15,
    paddingVertical: 0,
    fontFamily: FONTS.body,
  },
  clearButton: {
    padding: SPACING.xs,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginLeft: SPACING.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default GlassInput;
