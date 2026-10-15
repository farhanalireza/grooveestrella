// src/components/GrooveLoader.js
import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { COLORS } from '../constants/theme';
import GrooveLogo from './GrooveLogo';

export default function GrooveLoader({ size = 48, fullScreen = false }) {
  const rotation = useSharedValue(0);
  const pulse = useSharedValue(1);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, {
        duration: 1600,
        easing: Easing.linear,
      }),
      -1,
      false
    );

    pulse.value = withRepeat(
      withSequence(
        withTiming(1.25, { duration: 900, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.9, { duration: 900, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, [rotation, pulse]);

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: pulse.value > 1 ? 0.65 : 0.3,
  }));

  const content = (
    <View style={styles.center}>
      <View style={[styles.discContainer, { width: size * 1.5, height: size * 1.5 }]}>
        {/* Ambient Pulsing Glow */}
        <Animated.View
          style={[
            styles.glow,
            glowStyle,
            {
              width: size * 1.4,
              height: size * 1.4,
              borderRadius: (size * 1.4) / 2,
            },
          ]}
        />

        {/* Spinning Vinyl in.svg Logo */}
        <Animated.View style={[styles.spinner, spinStyle, { width: size, height: size }]}>
          <GrooveLogo size={size} />
        </Animated.View>
      </View>
    </View>
  );

  if (fullScreen) {
    return <View style={styles.fullScreen}>{content}</View>;
  }

  return content;
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  fullScreen: {
    flex: 1,
    backgroundColor: '#07090F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  discContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  glow: {
    position: 'absolute',
    backgroundColor: '#870087',
    shadowColor: '#E879F9',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 8,
  },
  spinner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
