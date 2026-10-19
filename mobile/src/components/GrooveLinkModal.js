// src/components/GrooveLinkModal.js
import React, { useState, useEffect, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Platform,
} from 'react-native';
import * as Linking from 'expo-linking';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '../context/ThemeContext';
import { COLORS, FONTS } from '../constants/theme';
import { StorageService } from '../services/storage';
import { generateStreamingLinks } from '../services/api';
import GrooveLogo from './GrooveLogo';

const PLATFORM_CONFIG = [
  {
    id: 'spotify',
    name: 'Spotify',
    icon: 'musical-notes',
    color: '#1DB954',
    bg: 'rgba(29, 185, 84, 0.15)',
    actionText: 'Play',
  },
  {
    id: 'apple_music',
    name: 'Apple Music',
    icon: 'logo-apple',
    color: '#FC3C44',
    bg: 'rgba(252, 60, 68, 0.15)',
    actionText: 'Play',
  },
  {
    id: 'youtube_music',
    name: 'YouTube Music',
    icon: 'play-circle',
    color: '#FF0000',
    bg: 'rgba(255, 0, 0, 0.15)',
    actionText: 'Play',
  },
  {
    id: 'youtube',
    name: 'YouTube',
    icon: 'logo-youtube',
    color: '#FF0000',
    bg: 'rgba(255, 0, 0, 0.12)',
    actionText: 'Watch',
  },
  {
    id: 'deezer',
    name: 'Deezer',
    icon: 'disc',
    color: '#A238FF',
    bg: 'rgba(162, 56, 255, 0.15)',
    actionText: 'Play',
  },
  {
    id: 'tidal',
    name: 'TIDAL',
    icon: 'infinite',
    color: '#00FFFF',
    bg: 'rgba(0, 255, 255, 0.15)',
    actionText: 'Play',
  },
  {
    id: 'soundcloud',
    name: 'SoundCloud',
    icon: 'cloud-outline',
    color: '#FF5500',
    bg: 'rgba(255, 85, 0, 0.15)',
    actionText: 'Play',
  },
  {
    id: 'musicbrainz',
    name: 'MusicBrainz',
    icon: 'library-outline',
    color: '#BA478F',
    bg: 'rgba(186, 71, 143, 0.18)',
    actionText: 'Open',
  },
];

export default function GrooveLinkModal({
  visible,
  onClose,
  item = null,
  target = null,
  title = '',
  artist = '',
  album = '',
  imageUrl = '',
  type = 'track',
  itemId = '',
  onOpenGrooveCard = null,
}) {
  const { colors, isDark } = useTheme();
  const [preferredPlatform, setPreferredPlatform] = useState('none');
  const [copied, setCopied] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Normalize input item / target across tracks, albums, artists, playlists
  const t = item?.track || item || target?.track || target || {};

  const effectiveTitle = useMemo(() => {
    return (t.title || t.name || title || 'GrooveLink').trim();
  }, [t, title]);

  const effectiveArtist = useMemo(() => {
    if (t.artist && typeof t.artist === 'string') return t.artist;
    if (t.artistLabel && typeof t.artistLabel === 'string') return t.artistLabel;
    if (Array.isArray(t.artists) && t.artists.length > 0) {
      return t.artists
        .map((a) => (typeof a === 'string' ? a : a.name || a.title || ''))
        .filter(Boolean)
        .join(', ');
    }
    if (Array.isArray(t.artistCredits) && t.artistCredits.length > 0) {
      return t.artistCredits
        .map((a) => (typeof a === 'string' ? a : a.name || ''))
        .filter(Boolean)
        .join(', ');
    }
    if (t.artist && typeof t.artist === 'object' && t.artist.name) return t.artist.name;
    if (artist && typeof artist === 'string') return artist;
    return 'Universal Music Link';
  }, [t, artist]);

  const effectiveImageUrl = useMemo(() => {
    return (
      t.imageUrl ||
      t.coverUrl ||
      t.coverArt ||
      t.image ||
      t.album?.images?.[0]?.url ||
      t.images?.[0]?.url ||
      imageUrl ||
      ''
    );
  }, [t, imageUrl]);

  useEffect(() => {
    setImgError(false);
  }, [effectiveImageUrl]);

  const effectiveType = useMemo(() => {
    return t.type || type || 'track';
  }, [t, type]);

  const effectiveId = useMemo(() => {
    return (
      t.id ||
      t.itemId ||
      t.musicbrainzId ||
      t.trackId ||
      t.trackURI ||
      itemId ||
      ''
    );
  }, [t, itemId]);

  useEffect(() => {
    if (visible) {
      StorageService.getPreferredPlatform().then(setPreferredPlatform);
    }
  }, [visible]);

  const links = useMemo(() => {
    const queryArtist = effectiveArtist === 'Universal Music Link' ? '' : effectiveArtist;
    return generateStreamingLinks(effectiveTitle, queryArtist);
  }, [effectiveTitle, effectiveArtist]);

  const universalUrl = useMemo(() => {
    if (effectiveId) {
      return `https://grooveestrella.com/${effectiveType}/${effectiveId}?groovelink=true`;
    }
    return `https://grooveestrella.com/${effectiveType}/${encodeURIComponent(effectiveTitle)}?groovelink=true`;
  }, [effectiveId, effectiveType, effectiveTitle]);

  const handleOpenUrl = async (platformId, url) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Linking.openURL(url);
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Could not open link',
        text2: `Make sure the app or browser is installed.`,
      });
    }
  };

  const handleSetDefault = async (platformId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const newPref = preferredPlatform === platformId ? 'none' : platformId;
    setPreferredPlatform(newPref);
    await StorageService.setPreferredPlatform(newPref);
    Toast.show({
      type: 'success',
      text1: newPref === 'none' ? 'Preference Reset' : 'Default Platform Set',
      text2: newPref === 'none' ? 'Always ask mode enabled' : `Universal links will open in ${platformId}`,
    });
  };

  const handleCopy = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Clipboard.setStringAsync(universalUrl);
    setCopied(true);
    Toast.show({
      type: 'success',
      text1: 'Link Copied! 📋',
      text2: universalUrl,
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />

        <View style={[styles.modalCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
          {/* Top ambient highlight gradient */}
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.25)', 'rgba(255, 255, 255, 0.05)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.topHighlight}
          />

          {/* Modal Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerInfo}>
              {effectiveImageUrl && !imgError ? (
                <Image
                  source={{ uri: effectiveImageUrl }}
                  style={[styles.headerCover, { backgroundColor: colors.surface }]}
                  onError={() => setImgError(true)}
                />
              ) : (
                <View style={[styles.headerCover, { backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }]}>
                  <GrooveLogo size={24} />
                </View>
              )}
              <View style={styles.headerTextCol}>
                <View style={styles.badgeRow}>
                  <Text style={[styles.badgeText, { color: colors.accent }]}>GROOVELINK ROUTER</Text>
                </View>
                <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
                  {effectiveTitle}
                </Text>
                <Text style={[styles.headerArtist, { color: colors.textSecondary }]} numberOfLines={1}>
                  {effectiveArtist}
                </Text>
              </View>
            </View>

            <TouchableOpacity style={[styles.closeBtn, { backgroundColor: colors.surfaceHighlight }]} onPress={onClose} activeOpacity={0.7}>
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Subtitle guidance */}
          <View style={[styles.subBar, { backgroundColor: colors.surfaceHighlight }]}>
            <Text style={[styles.subText, { color: colors.textSecondary }]}>Select platform to open this {effectiveType}:</Text>
          </View>

          {/* Scrollable Platform List */}
          <ScrollView style={styles.platformList} showsVerticalScrollIndicator={false}>
            {PLATFORM_CONFIG.map((plat) => {
              const url = links[plat.id] || links.spotify;
              const isDefault = preferredPlatform === plat.id;

              return (
                <View
                  key={plat.id}
                  style={[
                    styles.platformRow,
                    {
                      backgroundColor: colors.cardBg,
                      borderColor: isDefault ? plat.color : colors.border,
                    },
                  ]}
                >
                  <View style={styles.platLeft}>
                    <View style={[styles.iconBox, { backgroundColor: plat.bg }]}>
                      <Ionicons name={plat.icon} size={20} color={plat.color} />
                    </View>
                    <View style={styles.platInfo}>
                      <Text style={[styles.platName, { color: colors.text }]}>{plat.name}</Text>
                      <TouchableOpacity
                        onPress={() => handleSetDefault(plat.id)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Text style={[styles.defaultBadge, { color: colors.textSecondary }, isDefault && { color: plat.color, fontWeight: '700' }]}>
                          {isDefault ? '★ Your default preference' : 'Set as default platform'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[styles.playBtn, { backgroundColor: plat.color }]}
                    onPress={() => handleOpenUrl(plat.id, url)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.playBtnText}>{plat.actionText}</Text>
                    <Ionicons name="open-outline" size={12} color="#000" style={{ marginLeft: 3 }} />
                  </TouchableOpacity>
                </View>
              );
            })}
          </ScrollView>

          {/* Bottom Actions */}
          <View style={[styles.footerActions, { borderTopColor: colors.border, backgroundColor: colors.surface }]}>
            <TouchableOpacity
              style={[styles.actionPill, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
              onPress={handleCopy}
              activeOpacity={0.8}
            >
              <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={15} color={copied ? '#10B981' : colors.text} />
              <Text style={[styles.actionPillText, { color: colors.text }, copied && { color: '#10B981' }]}>
                {copied ? 'Link Copied!' : 'Copy Link'}
              </Text>
            </TouchableOpacity>

            {onOpenGrooveCard && (
              <TouchableOpacity
                style={[
                  styles.actionPill,
                  {
                    backgroundColor: isDark ? 'rgba(71, 11, 36, 0.6)' : 'rgba(212, 163, 115, 0.25)',
                    borderColor: colors.accent,
                  },
                ]}
                onPress={() => {
                  onClose();
                  onOpenGrooveCard(t);
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="sparkles" size={14} color={colors.accent} />
                <Text style={[styles.grooveCardPillText, { color: colors.accent }]}>GrooveCard</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(7, 9, 15, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '85%',
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
    elevation: 10,
  },
  topHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  headerCover: {
    width: 48,
    height: 48,
    borderRadius: 10,
    marginRight: 12,
  },
  headerTextCol: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  badgeText: {
    fontSize: 9,
    fontFamily: FONTS.displayBold,
    letterSpacing: 1.2,
  },
  headerTitle: {
    fontSize: 15,
    fontFamily: FONTS.displayBold,
  },
  headerArtist: {
    fontSize: 12,
    fontFamily: FONTS.bodyMedium,
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subBar: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  subText: {
    fontSize: 11,
    fontFamily: FONTS.bodyMedium,
  },
  platformList: {
    padding: 16,
  },
  platformRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  platLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  platInfo: {
    flex: 1,
  },
  platName: {
    fontSize: 14,
    fontFamily: FONTS.bodySemiBold,
  },
  defaultBadge: {
    fontSize: 10,
    fontFamily: FONTS.body,
    marginTop: 2,
  },
  playBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  playBtnText: {
    fontSize: 12,
    fontFamily: FONTS.displayBold,
    color: '#000000',
  },
  footerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: 12,
    borderTopWidth: 1,
    gap: 8,
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
  },
  actionPillText: {
    fontSize: 12,
    fontFamily: FONTS.bodySemiBold,
  },
  grooveCardPillText: {
    fontSize: 12,
    fontFamily: FONTS.displayBold,
  },
});
