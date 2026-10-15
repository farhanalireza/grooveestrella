// src/components/GrooveAppBar.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { COLORS } from '../constants/theme';

export default function GrooveAppBar({
  title = '',
  subtitle = '',
  showBack = true,
  onBack,
  rightActions,
  saved = false,
  onToggleSave,
  onShare,
  onOpenLink,
  transparent = false,
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (onBack) {
      onBack();
      return;
    }
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/explore');
    }
  };

  const paddingTop = Math.max(insets.top, Platform.OS === 'ios' ? 44 : 12);

  const content = (
    <View style={[styles.innerContainer, { paddingTop: paddingTop + 4 }]}>
      {/* Left Slot: Back Button */}
      <View style={styles.leftSlot}>
        {showBack && (
          <TouchableOpacity
            style={styles.circleBtn}
            onPress={handleBack}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="chevron-back" size={22} color="#F4F7FF" style={{ marginLeft: -1 }} />
          </TouchableOpacity>
        )}
      </View>

      {/* Center Slot: Title and Subtitle */}
      <View style={styles.centerSlot}>
        {title ? (
          <Text style={styles.appBarTitle} numberOfLines={1}>
            {title}
          </Text>
        ) : null}
        {subtitle ? (
          <Text style={styles.appBarSubtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {/* Right Slot: Actions */}
      <View style={styles.rightSlot}>
        {rightActions ? (
          rightActions
        ) : (
          <View style={styles.defaultActionRow}>
            {onOpenLink && (
              <TouchableOpacity
                style={styles.circleBtn}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onOpenLink();
                }}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
              >
                <Ionicons name="link-outline" size={18} color="#8992A5" />
              </TouchableOpacity>
            )}

            {onShare && (
              <TouchableOpacity
                style={styles.circleBtn}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  onShare();
                }}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
              >
                <Ionicons name="share-social-outline" size={18} color="#8992A5" />
              </TouchableOpacity>
            )}

            {onToggleSave && (
              <TouchableOpacity
                style={[styles.circleBtn, saved && styles.circleBtnActive]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  onToggleSave();
                }}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
              >
                <Ionicons
                  name={saved ? 'bookmark' : 'bookmark-outline'}
                  size={18}
                  color={saved ? '#FFFFFF' : '#8992A5'}
                />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </View>
  );

  if (transparent) {
    return <View style={styles.transparentWrapper}>{content}</View>;
  }

  return (
    <View style={styles.blurWrapper}>
      {Platform.OS === 'ios' ? (
        <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill} />
      ) : (
        <View style={styles.androidBackdrop} />
      )}
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  blurWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  androidBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(7, 9, 15, 0.88)',
  },
  transparentWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  innerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
    minHeight: 52,
  },
  leftSlot: {
    width: 48,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  centerSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  rightSlot: {
    minWidth: 48,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  defaultActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  circleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(16, 20, 31, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  circleBtnActive: {
    backgroundColor: '#870087',
    borderColor: '#E879F9',
  },
  appBarTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  appBarSubtitle: {
    fontSize: 11,
    color: '#8992A5',
    fontWeight: '500',
    marginTop: 1,
    textAlign: 'center',
  },
});
