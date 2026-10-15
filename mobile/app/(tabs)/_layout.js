// app/(tabs)/_layout.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { COLORS } from '../../src/constants/theme';

const TAB_CONFIG = {
  index: { label: 'Music', icon: 'musical-notes' },
  explore: { label: 'Explore', icon: 'search' },
  account: { label: 'Account', icon: 'person' },
  library: { label: 'Library', icon: 'library' },
  settings: { label: 'Settings', icon: 'settings-sharp' },
};

function TabButton({ route, isFocused, onPress, onLayout }) {
  const scale = useSharedValue(1);
  const config = TAB_CONFIG[route.name] || { label: route.name, icon: 'musical-notes' };

  const handlePressIn = () => {
    scale.value = withSpring(0.92, { damping: 14, stiffness: 350 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 14, stiffness: 350 });
  };

  const buttonAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const iconAnimStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: withSpring(isFocused ? 1.12 : 1, { damping: 12 }) },
      { translateY: withSpring(isFocused ? -1 : 0, { damping: 12 }) },
    ],
  }));

  return (
    <Animated.View style={[styles.tabButtonWrapper, buttonAnimStyle]}>
      <Pressable
        onLayout={onLayout}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        style={styles.tabButton}
      >
        <Animated.View style={iconAnimStyle}>
          <Ionicons
            name={config.icon}
            size={20}
            color={isFocused ? COLORS.purpleLightest : COLORS.textSecondary}
            style={isFocused ? styles.activeIconGlow : undefined}
          />
        </Animated.View>
        <Text
          style={[
            styles.tabLabel,
            isFocused ? styles.tabLabelActive : styles.tabLabelInactive,
          ]}
        >
          {config.label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

function CustomTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();
  const [tabLayouts, setTabLayouts] = useState({});
  const activeX = useSharedValue(0);
  const activeWidth = useSharedValue(0);

  const handleTabLayout = (index, layout) => {
    setTabLayouts((prev) => {
      const next = { ...prev, [index]: layout };
      if (index === state.index) {
        activeX.value = withSpring(layout.x, { damping: 18, stiffness: 220 });
        activeWidth.value = withSpring(layout.width, { damping: 18, stiffness: 220 });
      }
      return next;
    });
  };

  // When active index changes, animate sliding pill
  React.useEffect(() => {
    const layout = tabLayouts[state.index];
    if (layout) {
      activeX.value = withSpring(layout.x, { damping: 18, stiffness: 220 });
      activeWidth.value = withSpring(layout.width, { damping: 18, stiffness: 220 });
    }
  }, [state.index, tabLayouts, activeX, activeWidth]);

  const pillAnimStyle = useAnimatedStyle(() => {
    if (activeWidth.value === 0) return { opacity: 0 };
    return {
      opacity: 1,
      transform: [{ translateX: activeX.value }],
      width: activeWidth.value,
    };
  });

  return (
    <View
      style={[
        styles.floatingBarContainer,
        { bottom: insets.bottom > 0 ? insets.bottom + 8 : 16 },
      ]}
    >
      <View style={styles.floatingBar}>
        {/* Blur effect */}
        {Platform.OS === 'ios' ? (
          <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
        ) : (
          <View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: COLORS.surface, opacity: 0.92 },
            ]}
          />
        )}

        {/* Top Highlight line */}
        <LinearGradient
          colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.05)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.topHighlight}
        />

        {/* Sliding Active Pill Background */}
        <Animated.View style={[styles.slidingPill, pillAnimStyle]}>
          <LinearGradient
            colors={['rgba(135,0,135,0.5)', 'rgba(192,38,211,0.2)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.pillGradient}
          />
        </Animated.View>

        {/* Tab Items */}
        <View style={styles.tabsRow}>
          {state.routes.map((route, index) => {
            const isFocused = state.index === index;

            const onPress = () => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            return (
              <TabButton
                key={route.key}
                route={route}
                isFocused={isFocused}
                onPress={onPress}
                onLayout={(e) => handleTabLayout(index, e.nativeEvent.layout)}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: COLORS.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Music' }} />
      <Tabs.Screen name="explore" options={{ title: 'Explore' }} />
      <Tabs.Screen name="account" options={{ title: 'Account' }} />
      <Tabs.Screen name="library" options={{ title: 'Library' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  floatingBarContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    alignItems: 'center',
    zIndex: 999,
  },
  floatingBar: {
    width: '100%',
    height: 64,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: 'rgba(13, 18, 31, 0.8)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.65,
        shadowRadius: 40,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  topHighlight: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    height: 1,
  },
  slidingPill: {
    position: 'absolute',
    top: 6,
    bottom: 6,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: 'rgba(232, 121, 249, 0.4)',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#870087',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.45,
        shadowRadius: 16,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  pillGradient: {
    flex: 1,
    borderRadius: 9999,
  },
  tabsRow: {
    flexDirection: 'row',
    height: '100%',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  tabButtonWrapper: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
  },
  tabButton: {
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  tabLabel: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginTop: 3,
  },
  tabLabelActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  tabLabelInactive: {
    color: 'rgba(137, 146, 165, 0.7)',
  },
  activeIconGlow: {
    ...Platform.select({
      ios: {
        shadowColor: COLORS.purpleLightest,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 6,
      },
    }),
  },
});
