// src/components/GrooveAppBar.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';

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
  onQRCode,
  showQR = false,
  transparent = false,
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (_) {}
    if (onBack) {
      onBack();
      return;
    }
    try {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)/explore');
      }
    } catch (_) {
      router.replace('/(tabs)/explore');
    }
  };

  const statusHeight = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 44;
  const topInset = Math.max(insets.top || 0, statusHeight);

  const content = (
    <View style={[styles.innerContainer, { paddingTop: topInset + 4 }]}>
      {/* Left Slot: Back Button */}
      <View style={styles.leftSlot}>
        {showBack && (
          <TouchableOpacity
            style={styles.circleBtn}
            onPress={handleBack}
            activeOpacity={0.7}
            hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
          >
            <Ionicons name="chevron-back" size={22} color="#F4F7FF" style={{ marginLeft: -1 }} />
          </TouchableOpacity>
        )}
      </View>

      {/* Center Slot: Title and Subtitle */}
      <View style={styles.centerSlot}>
        {title ? (
          <Text style={styles.appBarTitle} numberOfLines={1} ellipsizeMode="tail">
            {title}
          </Text>
        ) : null}
        {subtitle ? (
          <Text style={styles.appBarSubtitle} numberOfLines={1} ellipsizeMode="tail">
            {subtitle}
          </Text>
        ) : null}
      </View>

      {/* Right Slot: Unified Actions */}
      <View style={styles.rightSlot}>
        {rightActions ? (
          rightActions
        ) : (
          <View style={styles.defaultActionRow}>
            {onQRCode && (
              <TouchableOpacity
                style={[styles.circleBtn, showQR && styles.circleBtnActive]}
                onPress={() => {
                  try {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  } catch (_) {}
                  onQRCode();
                }}
                activeOpacity={0.7}
                hitSlop={{ top: 12, bottom: 12, left: 6, right: 6 }}
              >
                <Ionicons
                  name="qr-code-outline"
                  size={18}
                  color={showQR ? '#FFFFFF' : '#8992A5'}
                />
              </TouchableOpacity>
            )}

            {onOpenLink && (
              <TouchableOpacity
                style={styles.circleBtn}
                onPress={() => {
                  try {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  } catch (_) {}
                  onOpenLink();
                }}
                activeOpacity={0.7}
                hitSlop={{ top: 12, bottom: 12, left: 6, right: 6 }}
              >
                <Ionicons name="link-outline" size={18} color="#8992A5" />
              </TouchableOpacity>
            )}

            {onShare && (
              <TouchableOpacity
                style={styles.circleBtn}
                onPress={() => {
                  try {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  } catch (_) {}
                  onShare();
                }}
                activeOpacity={0.7}
                hitSlop={{ top: 12, bottom: 12, left: 6, right: 6 }}
              >
                <Ionicons name="share-social-outline" size={18} color="#8992A5" />
              </TouchableOpacity>
            )}

            {onToggleSave && (
              <TouchableOpacity
                style={[styles.circleBtn, saved && styles.circleBtnActive]}
                onPress={() => {
                  try {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  } catch (_) {}
                  onToggleSave();
                }}
                activeOpacity={0.7}
                hitSlop={{ top: 12, bottom: 12, left: 6, right: 6 }}
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
        <BlurView intensity={55} tint="dark" style={StyleSheet.absoluteFill} />
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
    zIndex: 999,
    elevation: 25,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  androidBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(7, 9, 15, 0.92)',
  },
  transparentWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    elevation: 25,
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
    minWidth: 42,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  centerSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  rightSlot: {
    minWidth: 42,
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
    backgroundColor: 'rgba(16, 20, 31, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 6,
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
