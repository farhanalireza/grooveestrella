// src/components/GrooveLinkModal.js
import React, { useState, useEffect } from 'react';
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
import { COLORS } from '../constants/theme';
import { StorageService } from '../services/storage';
import { generateStreamingLinks } from '../services/api';

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
  title = '',
  artist = '',
  album = '',
  imageUrl = '',
  type = 'track',
  itemId = '',
  onOpenGrooveCard = null,
}) {
  const [preferredPlatform, setPreferredPlatform] = useState('none');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (visible) {
      StorageService.getPreferredPlatform().then(setPreferredPlatform);
    }
  }, [visible]);

  const links = generateStreamingLinks(title, artist);
  const universalUrl = `https://grooveestrella.app/${type}/${encodeURIComponent(itemId || title)}`;

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

  const handleCopy = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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

        <View style={styles.modalCard}>
          {/* Top ambient highlight gradient */}
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.25)', 'rgba(255, 255, 255, 0.05)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.topHighlight}
          />

          {/* Modal Header */}
          <View style={styles.header}>
            <View style={styles.headerInfo}>
              <Image
                source={{ uri: imageUrl || 'https://placehold.co/100x100/10141F/60A5FA?text=Music' }}
                style={styles.headerCover}
              />
              <View style={styles.headerTextCol}>
                <View style={styles.badgeRow}>
                  <Text style={styles.badgeText}>GROOVELINK ROUTER</Text>
                </View>
                <Text style={styles.headerTitle} numberOfLines={1}>{title || 'GrooveLink'}</Text>
                <Text style={styles.headerArtist} numberOfLines={1}>{artist || 'Universal Music Link'}</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <Ionicons name="close" size={20} color="#8992A5" />
            </TouchableOpacity>
          </View>

          {/* Subtitle guidance */}
          <View style={styles.subBar}>
            <Text style={styles.subText}>Select platform to open this {type}:</Text>
          </View>

          {/* Scrollable Platform List */}
          <ScrollView style={styles.platformList} showsVerticalScrollIndicator={false}>
            {PLATFORM_CONFIG.map((plat) => {
              const url = links[plat.id] || links.spotify;
              const isDefault = preferredPlatform === plat.id;

              return (
                <View key={plat.id} style={[styles.platformRow, { borderColor: isDefault ? plat.color : 'rgba(255, 255, 255, 0.08)' }]}>
                  <View style={styles.platLeft}>
                    <View style={[styles.iconBox, { backgroundColor: plat.bg }]}>
                      <Ionicons name={plat.icon} size={20} color={plat.color} />
                    </View>
                    <View style={styles.platInfo}>
                      <Text style={styles.platName}>{plat.name}</Text>
                      <TouchableOpacity
                        onPress={() => handleSetDefault(plat.id)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Text style={[styles.defaultBadge, isDefault && { color: plat.color, fontWeight: '700' }]}>
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
          <View style={styles.footerActions}>
            <TouchableOpacity style={styles.actionPill} onPress={handleCopy} activeOpacity={0.8}>
              <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={15} color={copied ? '#10B981' : '#F4F7FF'} />
              <Text style={[styles.actionPillText, copied && { color: '#10B981' }]}>
                {copied ? 'Link Copied!' : 'Copy Link'}
              </Text>
            </TouchableOpacity>

            {onOpenGrooveCard && (
              <TouchableOpacity
                style={[styles.actionPill, styles.grooveCardPill]}
                onPress={() => {
                  onClose();
                  onOpenGrooveCard();
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="sparkles" size={14} color="#F0ABFC" />
                <Text style={styles.grooveCardPillText}>GrooveCard</Text>
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
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '82%',
    backgroundColor: '#0D121F',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.6,
    shadowRadius: 28,
    elevation: 12,
  },
  topHighlight: {
    height: 1.5,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  headerCover: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#10141F',
  },
  headerTextCol: {
    marginLeft: 12,
    flex: 1,
  },
  badgeRow: {
    marginBottom: 2,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#60A5FA',
    letterSpacing: 1,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F4F7FF',
  },
  headerArtist: {
    fontSize: 11,
    color: '#8992A5',
    marginTop: 1,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  subBar: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  subText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8992A5',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  platformList: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  platformRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(16, 20, 31, 0.7)',
    borderWidth: 1,
    marginBottom: 8,
  },
  platLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  platInfo: {
    flex: 1,
  },
  platName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F4F7FF',
  },
  defaultBadge: {
    fontSize: 10,
    color: 'rgba(137, 146, 165, 0.7)',
    marginTop: 2,
  },
  playBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
  },
  playBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#000',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  footerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(7, 9, 15, 0.6)',
  },
  actionPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F4F7FF',
  },
  grooveCardPill: {
    backgroundColor: 'rgba(135, 0, 135, 0.25)',
    borderColor: 'rgba(232, 121, 249, 0.4)',
  },
  grooveCardPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F0ABFC',
  },
});
