// mobile/src/components/LiquidToast.js
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { FONTS } from '../constants/theme';

export default function LiquidToast({
  type = 'info',
  text1 = '',
  text2 = '',
  onPress,
  hide,
}) {
  const progressAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: 0,
      duration: 3500,
      useNativeDriver: false,
    }).start();
  }, [progressAnim]);

  // Color config matching web LiquidToastContainer
  let badgeBorder = 'rgba(232, 168, 124, 0.35)';
  let badgeBg = 'rgba(232, 168, 124, 0.18)';
  let iconName = 'checkmark';
  let iconColor = '#E8A87C';
  let glowColor = 'rgba(232, 168, 124, 0.25)';

  if (type === 'info') {
    badgeBorder = 'rgba(56, 189, 248, 0.35)';
    badgeBg = 'rgba(56, 189, 248, 0.18)';
    iconName = 'sparkles';
    iconColor = '#38BDF8';
    glowColor = 'rgba(56, 189, 248, 0.25)';
  } else if (type === 'error') {
    badgeBorder = 'rgba(244, 63, 94, 0.35)';
    badgeBg = 'rgba(244, 63, 94, 0.18)';
    iconName = 'alert-circle';
    iconColor = '#F43F5E';
    glowColor = 'rgba(244, 63, 94, 0.25)';
  }

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => {
        if (onPress) onPress();
        if (hide) hide();
      }}
      style={styles.toastOuter}
    >
      <View style={styles.toastPill}>
        {/* Frosted Glass Backdrop */}
        {Platform.OS === 'ios' ? (
          <BlurView intensity={55} tint="dark" style={StyleSheet.absoluteFill} />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(23, 2, 11, 0.94)' }]} />
        )}

        {/* Ambient Glow Aura */}
        <View style={[styles.ambientGlow, { backgroundColor: glowColor }]} />

        {/* Specular Top Sweep Highlight Line */}
        <LinearGradient
          colors={['transparent', 'rgba(255, 255, 255, 0.45)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.specularTop}
        />

        {/* Content Row */}
        <View style={styles.contentRow}>
          {/* Circular Status Icon Badge */}
          <View style={[styles.statusBadge, { borderColor: badgeBorder, backgroundColor: badgeBg }]}>
            <Ionicons name={iconName} size={13} color={iconColor} />
          </View>

          {/* Text Content */}
          <View style={styles.textContainer}>
            <Text style={styles.text1} numberOfLines={1}>
              {text1}
            </Text>
            {Boolean(text2) && (
              <Text style={styles.text2} numberOfLines={1}>
                {text2}
              </Text>
            )}
          </View>

          {/* Dismiss Icon */}
          <TouchableOpacity
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            onPress={hide}
            style={styles.closeBtn}
          >
            <Ionicons name="close" size={14} color="rgba(255, 242, 223, 0.45)" />
          </TouchableOpacity>
        </View>

        {/* Fluid Animated Progress Line */}
        <View style={styles.progressBarWrapper}>
          <Animated.View
            style={[
              styles.progressBar,
              {
                backgroundColor: iconColor,
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  toastOuter: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: Platform.OS === 'ios' ? 10 : 20,
    zIndex: 999999,
  },
  toastPill: {
    maxWidth: 360,
    width: '100%',
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    overflow: 'hidden',
    backgroundColor: 'rgba(23, 2, 11, 0.88)',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.55,
        shadowRadius: 24,
      },
      android: {
        elevation: 14,
      },
    }),
  },
  ambientGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.35,
  },
  specularTop: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    height: 1,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  statusBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  text1: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: FONTS.displaySemiBold,
    color: '#FFF2DF',
    letterSpacing: -0.2,
  },
  text2: {
    fontSize: 11,
    fontWeight: '500',
    fontFamily: FONTS.body,
    color: 'rgba(255, 242, 223, 0.65)',
    marginTop: 1,
  },
  closeBtn: {
    padding: 4,
    marginLeft: 6,
  },
  progressBarWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 16,
    right: 16,
    height: 2,
    borderRadius: 1,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 1,
    opacity: 0.75,
  },
});
