// src/components/GrooveAppBar.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  StatusBar,
  Share,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { useTheme } from '../context/ThemeContext';
import GrooveLogo from './GrooveLogo';
import { FONTS } from '../constants/theme';

export default function GrooveAppBar({
  variant = 'pill', // 'pill' (default for detail pages) or 'bar'
  title = '',
  subtitle = '',
  showBack = true,
  onBack,
  onShare,
  shareData = null, // { title, message, url }
  rightActions,
  saved = false,
  onToggleSave,
  onOpenLink,
  onQRCode,
  showQR = false,
  transparent = false,
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

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

  const handleShare = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (_) {}
    if (onShare) {
      onShare();
      return;
    }
    if (shareData) {
      try {
        await Share.share({
          title: shareData.title || 'GrooveEstrella',
          message: Platform.OS === 'ios'
            ? (shareData.message || 'Check out this music on GrooveEstrella!')
            : `${shareData.message || 'Check out this music on GrooveEstrella!'}\n${shareData.url || 'https://grooveestrella.com'}`,
          url: shareData.url || 'https://grooveestrella.com',
        });
      } catch (err) {
        // dismissed or canceled
      }
    }
  };

  const statusHeight = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 44;
  const topInset = Math.max(insets.top || 0, statusHeight);

  // Compact Floating Pill Bar Variant (Identical to Web App Mobile Layout)
  if (variant === 'pill') {
    return (
      <View
        pointerEvents="box-none"
        style={[styles.floatingPillWrapper, { top: topInset + 6 }]}
      >
        <View style={styles.pillContainer}>
          {Platform.OS === 'ios' ? (
            <BlurView intensity={70} tint="dark" style={StyleSheet.absoluteFill} />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(23, 2, 11, 0.88)' }]} />
          )}

          {/* Left Circular Back Button */}
          {showBack ? (
            <TouchableOpacity
              onPress={handleBack}
              activeOpacity={0.75}
              style={styles.pillCircleBtn}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="arrow-back" size={17} color="#FFF2DF" />
            </TouchableOpacity>
          ) : (
            <View style={styles.pillCirclePlaceholder} />
          )}

          {/* Center Brand Identity: GrooveLogo + GrooveEstrella Wordmark */}
          <TouchableOpacity
            onPress={() => router.replace('/(tabs)/index')}
            activeOpacity={0.8}
            style={styles.pillBrandCenter}
          >
            <GrooveLogo size={18} color="#E8A87C" style={{ marginRight: 6 }} />
            <Text style={styles.pillBrandWordmark}>GrooveEstrella</Text>
          </TouchableOpacity>

          {/* Right Circular Share Button (Native Share Sheet) */}
          {(onShare || shareData) ? (
            <TouchableOpacity
              onPress={handleShare}
              activeOpacity={0.75}
              style={styles.pillCircleBtn}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="share-outline" size={17} color="#FFF2DF" />
            </TouchableOpacity>
          ) : (
            <View style={styles.pillCirclePlaceholder} />
          )}
        </View>
      </View>
    );
  }

  // Standard Header Bar (for settings/account or legacy views)
  const dynamicBtnStyle = {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
  };
  const dynamicActiveBtnStyle = {
    backgroundColor: colors.accent,
    borderColor: colors.text,
  };

  const content = (
    <View style={[styles.innerContainer, { paddingTop: topInset + 4 }]}>
      <View style={styles.leftSlot}>
        {showBack && (
          <TouchableOpacity
            style={[styles.circleBtn, dynamicBtnStyle]}
            onPress={handleBack}
            activeOpacity={0.7}
            hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
          >
            <Ionicons name="chevron-back" size={20} color={colors.text} style={{ marginLeft: -1 }} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.centerSlot}>
        <View style={styles.brandRow}>
          <GrooveLogo size={18} color={colors.accent || '#E8A87C'} style={{ marginRight: 6 }} />
          <Text style={[styles.brandWordmark, { color: colors.text }]}>GrooveEstrella</Text>
        </View>
        {title ? (
          <Text style={[styles.appBarSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
            {title}{subtitle ? ` • ${subtitle}` : ''}
          </Text>
        ) : null}
      </View>

      <View style={styles.rightSlot}>
        {rightActions ? (
          rightActions
        ) : (
          <View style={styles.defaultActionRow}>
            {onQRCode && (
              <TouchableOpacity
                style={[styles.circleBtn, dynamicBtnStyle, showQR && dynamicActiveBtnStyle]}
                onPress={onQRCode}
                activeOpacity={0.7}
              >
                <Ionicons name="qr-code-outline" size={17} color={showQR ? colors.bg : colors.textSecondary} />
              </TouchableOpacity>
            )}
            {onShare && (
              <TouchableOpacity
                style={[styles.circleBtn, dynamicBtnStyle]}
                onPress={handleShare}
                activeOpacity={0.7}
              >
                <Ionicons name="share-social-outline" size={17} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
            {onToggleSave && (
              <TouchableOpacity
                style={[styles.circleBtn, dynamicBtnStyle, saved && dynamicActiveBtnStyle]}
                onPress={onToggleSave}
                activeOpacity={0.7}
              >
                <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={17} color={saved ? colors.bg : colors.textSecondary} />
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
    <View style={[styles.blurWrapper, { borderBottomColor: colors.border }]}>
      <BlurView intensity={90} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
      <View style={[styles.glassTintOverlay, { backgroundColor: isDark ? 'rgba(71, 11, 36, 0.88)' : 'rgba(255, 237, 213, 0.88)' }]} />
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  // Floating Compact Pill Styles (Matching Web Mobile Top Bar)
  floatingPillWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillContainer: {
    width: 310,
    height: 48,
    borderRadius: 9999,
    backgroundColor: 'rgba(23, 2, 11, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.45,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  pillCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillCirclePlaceholder: {
    width: 36,
    height: 36,
  },
  pillBrandCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  pillBrandWordmark: {
    fontSize: 14,
    fontWeight: '800',
    fontFamily: FONTS.display,
    color: '#FFF2DF',
    letterSpacing: -0.3,
  },

  // Standard Bar Styles
  blurWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    elevation: 30,
    borderBottomWidth: 1,
    overflow: 'hidden',
  },
  glassTintOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  transparentWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    elevation: 30,
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
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandWordmark: {
    fontSize: 14,
    fontWeight: '800',
    fontFamily: FONTS.display,
    letterSpacing: -0.3,
  },
  appBarSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    fontFamily: FONTS.body,
    marginTop: 1,
    textAlign: 'center',
  },
});
