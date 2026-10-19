// mobile/src/components/ExportPlaylistModal.js
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import Toast from 'react-native-toast-message';
import { useTheme } from '../context/ThemeContext';
import { FONTS } from '../constants/theme';
import {
  getPlaylistExportString,
  sharePlaylistFile,
  getTrackList,
} from '../utils/playlistFileFormats';

const FORMATS = [
  {
    id: 'm3u',
    name: 'Extended M3U',
    ext: '.m3u',
    desc: 'Standard music player & streaming playlist format with song metadata',
    icon: 'disc-outline',
    color: '#E8A87C',
  },
  {
    id: 'm3u8',
    name: 'UTF-8 M3U8',
    ext: '.m3u8',
    desc: 'Unicode-compatible playlist format for global players & mobile',
    icon: 'musical-notes-outline',
    color: '#38bdf8',
  },
  {
    id: 'cue',
    name: 'Audiophile CUE Sheet',
    ext: '.cue',
    desc: 'High-fidelity album/CD track index sheet with performers and timestamps',
    icon: 'sparkles-outline',
    color: '#f59e0b',
  },
  {
    id: 'txt',
    name: 'Clean Text Tracklist',
    ext: '.txt',
    desc: 'Human-readable list of songs, artists, durations, and links',
    icon: 'document-text-outline',
    color: '#10b981',
  },
  {
    id: 'json',
    name: 'Portable Groove JSON',
    ext: '.json',
    desc: 'Lossless backup that can be imported back into GrooveEstrella anytime',
    icon: 'code-slash-outline',
    color: '#f43f5e',
  },
];

export default function ExportPlaylistModal({
  visible,
  onClose,
  playlist,
  tracks = [],
}) {
  const { colors, isDark } = useTheme();
  const [selectedFormat, setSelectedFormat] = useState('m3u');
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);

  const effectiveTracks = useMemo(() => {
    return getTrackList(playlist, tracks);
  }, [playlist, tracks]);

  if (!visible || !playlist) return null;

  const handleSelectFormat = (fmtId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedFormat(fmtId);
  };

  const handleShareFile = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSharing(true);
    try {
      await sharePlaylistFile(playlist, effectiveTracks, selectedFormat);
      onClose();
    } finally {
      setSharing(false);
    }
  };

  const handleCopyClipboard = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const { content } = getPlaylistExportString(playlist, effectiveTracks, selectedFormat);
      await Clipboard.setStringAsync(content);
      setCopied(true);
      Toast.show({
        type: 'success',
        text1: 'Copied to Clipboard 📋',
        text2: `Copied ${selectedFormat.toUpperCase()} playlist text`,
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Copy Failed',
        text2: err.message,
      });
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <TouchableOpacity
          style={styles.backdropTouchable}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={[styles.headerIconContainer, { backgroundColor: 'rgba(0, 240, 255, 0.15)' }]}>
                <Ionicons name="download-outline" size={18} color={colors.accent || '#00F0FF'} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.title, { color: colors.text }]}>Export & Share Playlist</Text>
                <Text style={[styles.subtitle, { color: colors.subtext }]}>
                  {effectiveTracks.length} tracks ready for export
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close-circle-outline" size={24} color={colors.subtext} />
            </TouchableOpacity>
          </View>

          {/* Format Picker */}
          <Text style={[styles.sectionLabel, { color: colors.subtext }]}>SELECT PLAYLIST FORMAT</Text>
          <ScrollView style={styles.formatsScroll} contentContainerStyle={styles.formatsContent}>
            {FORMATS.map((fmt) => {
              const isSelected = selectedFormat === fmt.id;
              return (
                <TouchableOpacity
                  key={fmt.id}
                  style={[
                    styles.formatItem,
                    {
                      borderColor: isSelected ? (colors.accent || '#00F0FF') : colors.border,
                      backgroundColor: isSelected ? 'rgba(0, 240, 255, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                    },
                  ]}
                  onPress={() => handleSelectFormat(fmt.id)}
                  activeOpacity={0.7}
                >
                  <Ionicons name={fmt.icon} size={20} color={fmt.color} style={styles.formatIcon} />
                  <View style={styles.formatTextContainer}>
                    <View style={styles.formatRow}>
                      <Text style={[styles.formatName, { color: colors.text }]}>{fmt.name}</Text>
                      <View style={[styles.badge, { backgroundColor: 'rgba(255, 255, 255, 0.08)' }]}>
                        <Text style={[styles.badgeText, { color: colors.subtext }]}>{fmt.ext}</Text>
                      </View>
                    </View>
                    <Text style={[styles.formatDesc, { color: colors.subtext }]}>{fmt.desc}</Text>
                  </View>
                  <View
                    style={[
                      styles.radioCircle,
                      {
                        borderColor: isSelected ? (colors.accent || '#00F0FF') : colors.subtext,
                        backgroundColor: isSelected ? (colors.accent || '#00F0FF') : 'transparent',
                      },
                    ]}
                  >
                    {isSelected && <Ionicons name="checkmark" size={12} color="#000" />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: colors.accent || '#00F0FF' }]}
              onPress={handleShareFile}
              disabled={sharing}
              activeOpacity={0.8}
            >
              <Ionicons name="share-outline" size={18} color="#000" />
              <Text style={styles.primaryButtonText}>Share File</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.secondaryButton, { borderColor: colors.border }]}
              onPress={handleCopyClipboard}
              activeOpacity={0.7}
            >
              <Ionicons
                name={copied ? 'checkmark-outline' : 'copy-outline'}
                size={18}
                color={copied ? '#10b981' : colors.text}
              />
              <Text style={[styles.secondaryButtonText, { color: copied ? '#10b981' : colors.text }]}>
                {copied ? 'Copied!' : 'Copy to Clipboard'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  backdropTouchable: {
    ...StyleSheet.absoluteFillObject,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '82%',
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: FONTS.displaySemiBold,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 11,
    fontFamily: FONTS.body,
    marginTop: 2,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    fontFamily: FONTS.display,
    letterSpacing: 1,
    marginTop: 14,
    marginBottom: 8,
  },
  formatsScroll: {
    maxHeight: 250,
  },
  formatsContent: {
    gap: 8,
    paddingBottom: 4,
  },
  formatItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
  },
  formatIcon: {
    marginTop: 2,
  },
  formatTextContainer: {
    flex: 1,
  },
  formatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  formatName: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: FONTS.displaySemiBold,
  },
  badge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 9,
    fontFamily: FONTS.mono,
    fontWeight: '700',
  },
  formatDesc: {
    fontSize: 10,
    lineHeight: 14,
    fontFamily: FONTS.body,
    marginTop: 3,
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  actionButtons: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    gap: 10,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 25,
    gap: 8,
  },
  primaryButtonText: {
    color: '#17020B',
    fontSize: 14,
    fontWeight: '800',
    fontFamily: FONTS.display,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: FONTS.bodySemiBold,
  },
});
