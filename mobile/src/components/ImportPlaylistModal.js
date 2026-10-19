// mobile/src/components/ImportPlaylistModal.js
import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import Toast from 'react-native-toast-message';
import { useTheme } from '../context/ThemeContext';
import { FONTS } from '../constants/theme';
import { parsePlaylistFile } from '../utils/playlistFileFormats';
import { StorageService } from '../services/storage';

export default function ImportPlaylistModal({
  visible,
  onClose,
  onImportSuccess,
}) {
  const { colors, isDark } = useTheme();
  const [inputText, setInputText] = useState('');
  const [playlistName, setPlaylistName] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePasteClipboard = async () => {
    try {
      const text = await Clipboard.getStringAsync();
      if (text) {
        setInputText(text);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        Toast.show({
          type: 'info',
          text1: 'Pasted from Clipboard',
        });
      }
    } catch (_) {}
  };

  const handleImport = async () => {
    if (!inputText.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Empty Input',
        text2: 'Please paste playlist file text (.m3u, .json, or tracklist)',
      });
      return;
    }

    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const parsed = parsePlaylistFile(inputText, playlistName || 'Imported Playlist');
      if (!parsed || !parsed.tracks || parsed.tracks.length === 0) {
        throw new Error('No songs found in input text');
      }

      const finalName = (playlistName.trim() || parsed.name || 'Imported Playlist').trim();
      const newPlaylist = {
        id: `custom-${Date.now()}`,
        name: finalName,
        title: finalName,
        description: parsed.description || 'Imported playlist',
        image: parsed.image || (parsed.tracks[0]?.track?.image || ''),
        images: parsed.image ? [{ url: parsed.image }] : (parsed.tracks[0]?.track?.image ? [{ url: parsed.tracks[0].track.image }] : []),
        tracks: {
          total: parsed.tracks.length,
          items: parsed.tracks,
        },
        createdAt: new Date().toISOString(),
      };

      const existing = await StorageService.getCustomPlaylists();
      existing.unshift(newPlaylist);
      await StorageService.setCustomPlaylists(existing);

      Toast.show({
        type: 'success',
        text1: 'Playlist Imported! 🎉',
        text2: `"${finalName}" with ${parsed.tracks.length} tracks`,
      });

      setInputText('');
      setPlaylistName('');
      if (onImportSuccess) {
        onImportSuccess(newPlaylist);
      }
      onClose();
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Import Failed',
        text2: err.message || 'Could not parse playlist file',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

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
                <Ionicons name="cloud-download-outline" size={18} color={colors.accent || '#00F0FF'} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.title, { color: colors.text }]}>Import Playlist</Text>
                <Text style={[styles.subtitle, { color: colors.subtext }]}>
                  Supports M3U, M3U8, CUE, JSON, or text
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close-circle-outline" size={24} color={colors.subtext} />
            </TouchableOpacity>
          </View>

          {/* Optional Title Input */}
          <Text style={[styles.label, { color: colors.subtext }]}>PLAYLIST NAME (OPTIONAL)</Text>
          <TextInput
            style={[styles.nameInput, { color: colors.text, borderColor: colors.border, backgroundColor: 'rgba(255, 255, 255, 0.04)' }]}
            placeholder="e.g. Midnight Grooves"
            placeholderTextColor={colors.subtext}
            value={playlistName}
            onChangeText={setPlaylistName}
          />

          {/* Content Input */}
          <View style={styles.contentHeaderRow}>
            <Text style={[styles.label, { color: colors.subtext }]}>PASTE PLAYLIST CONTENT</Text>
            <TouchableOpacity onPress={handlePasteClipboard} style={styles.pasteButton}>
              <Ionicons name="clipboard-outline" size={12} color={colors.accent || '#00F0FF'} />
              <Text style={[styles.pasteButtonText, { color: colors.accent || '#00F0FF' }]}>Paste</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={[styles.textArea, { color: colors.text, borderColor: colors.border, backgroundColor: 'rgba(255, 255, 255, 0.04)' }]}
            placeholder="#EXTM3U&#10;#EXTINF:180,Artist - Song&#10;...or paste JSON, CUE sheet, tracklist"
            placeholderTextColor={colors.subtext}
            value={inputText}
            onChangeText={setInputText}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.importButton, { backgroundColor: colors.accent || '#00F0FF' }]}
              onPress={handleImport}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <>
                  <Ionicons name="cloud-download" size={16} color="#000" />
                  <Text style={styles.importButtonText}>Import to Library</Text>
                </>
              )}
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
    fontFamily: FONTS.displayBold,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 11,
    fontFamily: FONTS.body,
    marginTop: 2,
  },
  label: {
    fontSize: 10,
    fontFamily: FONTS.displayBold,
    letterSpacing: 1,
    marginTop: 14,
    marginBottom: 6,
  },
  nameInput: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    fontFamily: FONTS.body,
  },
  contentHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pasteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  pasteButtonText: {
    fontSize: 11,
    fontFamily: FONTS.bodySemiBold,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    height: 120,
  },
  actions: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  importButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  importButtonText: {
    color: '#000',
    fontSize: 14,
    fontFamily: FONTS.displayBold,
  },
});
