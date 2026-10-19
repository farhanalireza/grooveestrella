// mobile/src/components/PlaylistPickerModal.js
import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';
import { useTheme } from '../context/ThemeContext';
import { COLORS, FONTS } from '../constants/theme';
import { StorageService } from '../services/storage';
import PlaylistCover from './PlaylistCover';

export default function PlaylistPickerModal({
  visible,
  onClose,
  track,
}) {
  const { colors, isDark } = useTheme();
  const [customPlaylists, setCustomPlaylists] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDesc, setNewPlaylistDesc] = useState('');

  useEffect(() => {
    if (visible) {
      loadPlaylists();
      setShowCreateForm(false);
      setNewPlaylistName('');
      setNewPlaylistDesc('');
    }
  }, [visible]);

  const loadPlaylists = async () => {
    const list = await StorageService.getCustomPlaylists();
    setCustomPlaylists(list || []);
  };

  const extractTrackData = (raw) => {
    if (!raw) return null;
    const realId =
      raw.id ||
      raw.trackId ||
      raw.trackID ||
      (raw.trackURI && typeof raw.trackURI === 'string' && raw.trackURI.split(':')[2]) ||
      (raw.uri && typeof raw.uri === 'string' && raw.uri.split(':')[2]) ||
      '';
    const title = raw.name || raw.title || 'Untitled Track';
    const artists = Array.isArray(raw.artists)
      ? raw.artists
      : Array.isArray(raw.artist)
      ? raw.artist
      : [{ name: raw.artist || 'Unknown Artist' }];
    const coverUrl =
      raw.album?.images?.[0]?.url ||
      raw.image ||
      raw.coverArt ||
      raw.url ||
      '';
    const albumName =
      raw.album?.name || (typeof raw.album === 'string' ? raw.album : '') || '';
    const duration = raw.duration_ms || raw.durationMs || raw.duration || 180000;
    const spoURL = raw.external_urls?.spotify || raw.spoURL || '';
    const YTURL = raw.YTURL || '';
    const explicit = Boolean(raw.explicit);

    return {
      id: realId,
      name: title,
      title: title,
      artists: artists,
      duration_ms: duration,
      album: {
        id: raw.album?.id || '',
        name: albumName,
        images: coverUrl ? [{ url: coverUrl }] : [],
      },
      image: coverUrl,
      external_urls: { spotify: spoURL },
      spoURL: spoURL,
      YTURL: YTURL,
      explicit: explicit,
    };
  };

  const handleSelectPlaylist = async (playlistId) => {
    if (!track) return;
    const cleanTrack = extractTrackData(track);
    if (!cleanTrack) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const playlists = await StorageService.getCustomPlaylists();
    const index = playlists.findIndex((p) => p.id === playlistId);

    if (index === -1) {
      Toast.show({ type: 'error', text1: 'Playlist not found' });
      return;
    }

    const pl = playlists[index];
    pl.tracks = pl.tracks || { total: 0, items: [] };

    // Check if already in playlist
    const exists = pl.tracks.items.some(
      (item) =>
        (cleanTrack.id && item.track?.id === cleanTrack.id) ||
        (cleanTrack.spoURL && item.track?.external_urls?.spotify === cleanTrack.spoURL)
    );

    if (exists) {
      Toast.show({
        type: 'info',
        text1: 'Already in Playlist',
        text2: `"${cleanTrack.title}" is already in "${pl.name}"`,
      });
      onClose();
      return;
    }

    pl.tracks.items.push({
      added_at: new Date().toISOString(),
      track: cleanTrack,
    });
    pl.tracks.total = pl.tracks.items.length;

    // Update cover if needed
    if (cleanTrack.image) {
      pl.image = cleanTrack.image;
      pl.images = [{ url: cleanTrack.image }];
    }

    playlists[index] = pl;
    await StorageService.setCustomPlaylists(playlists);

    Toast.show({
      type: 'success',
      text1: 'Added to Playlist 🎵',
      text2: `"${cleanTrack.title}" added to "${pl.name}"`,
    });
    onClose();
  };

  const handleCreateAndAdd = async () => {
    if (!newPlaylistName.trim() || !track) {
      Toast.show({ type: 'error', text1: 'Name required' });
      return;
    }
    const cleanTrack = extractTrackData(track);
    if (!cleanTrack) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const playlists = await StorageService.getCustomPlaylists();
    const userName = (await StorageService.getUserName()) || 'You';

    const newPlaylist = {
      id: `custom-${Date.now()}`,
      name: newPlaylistName.trim(),
      title: newPlaylistName.trim(),
      description: newPlaylistDesc.trim() || 'Custom playlist created on GrooveEstrella.',
      image: cleanTrack.image || '',
      images: cleanTrack.image ? [{ url: cleanTrack.image }] : [],
      owner: { display_name: userName },
      tracks: {
        total: 1,
        items: [
          {
            added_at: new Date().toISOString(),
            track: cleanTrack,
          },
        ],
      },
      createdAt: new Date().toISOString(),
    };

    playlists.unshift(newPlaylist);
    await StorageService.setCustomPlaylists(playlists);

    Toast.show({
      type: 'success',
      text1: 'Playlist Created 🎉',
      text2: `Created "${newPlaylist.name}" and added "${cleanTrack.title}"`,
    });
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.backdrop}
      >
        <TouchableOpacity style={styles.backdropTouch} activeOpacity={1} onPress={onClose} />
        <View style={[styles.modalSheet, { backgroundColor: isDark ? '#161622' : '#FFFFFF' }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={[styles.iconCircle, { backgroundColor: COLORS.accent + '20' }]}>
                <Ionicons name="musical-notes" size={18} color={COLORS.accent} />
              </View>
              <View>
                <Text style={[styles.title, { color: isDark ? '#FFF' : '#111' }]}>
                  Add to Playlist
                </Text>
                <Text style={[styles.trackName, { color: isDark ? 'rgba(255,255,255,0.6)' : '#666' }]} numberOfLines={1}>
                  {track?.name || track?.title || 'Selected Track'}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={isDark ? '#FFF' : '#111'} />
            </TouchableOpacity>
          </View>

          {/* Form or List */}
          {showCreateForm ? (
            <View style={styles.createForm}>
              <Text style={[styles.inputLabel, { color: isDark ? '#CCC' : '#333' }]}>Playlist Name</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F3F4F6',
                    color: isDark ? '#FFF' : '#111',
                    borderColor: isDark ? 'rgba(255,255,255,0.15)' : '#E5E7EB',
                  },
                ]}
                placeholder="My Awesome Playlist"
                placeholderTextColor={isDark ? 'rgba(255,255,255,0.35)' : '#999'}
                value={newPlaylistName}
                onChangeText={setNewPlaylistName}
                autoFocus
              />

              <Text style={[styles.inputLabel, { color: isDark ? '#CCC' : '#333', marginTop: 12 }]}>
                Description (Optional)
              </Text>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  {
                    backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F3F4F6',
                    color: isDark ? '#FFF' : '#111',
                    borderColor: isDark ? 'rgba(255,255,255,0.15)' : '#E5E7EB',
                  },
                ]}
                placeholder="What's the vibe of this playlist?"
                placeholderTextColor={isDark ? 'rgba(255,255,255,0.35)' : '#999'}
                value={newPlaylistDesc}
                onChangeText={setNewPlaylistDesc}
                multiline
                numberOfLines={3}
              />

              <View style={styles.formBtnRow}>
                <TouchableOpacity
                  onPress={() => setShowCreateForm(false)}
                  style={[styles.cancelBtn, { borderColor: isDark ? 'rgba(255,255,255,0.2)' : '#CCC' }]}
                >
                  <Text style={[styles.cancelBtnText, { color: isDark ? '#FFF' : '#111' }]}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleCreateAndAdd} style={styles.submitBtn}>
                  <Text style={styles.submitBtnText}>Create & Add</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <ScrollView style={styles.playlistList} showsVerticalScrollIndicator={false}>
              {/* Create New Playlist row */}
              <TouchableOpacity
                onPress={() => setShowCreateForm(true)}
                style={[styles.createRow, { borderColor: COLORS.accent + '40' }]}
              >
                <View style={[styles.newPlIcon, { backgroundColor: COLORS.accent }]}>
                  <Ionicons name="add" size={22} color="#000" />
                </View>
                <View style={styles.plInfo}>
                  <Text style={[styles.plTitle, { color: COLORS.accent }]}>Create New Playlist</Text>
                  <Text style={[styles.plSubtitle, { color: isDark ? 'rgba(255,255,255,0.5)' : '#888' }]}>
                    Start a brand new collection
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={COLORS.accent} />
              </TouchableOpacity>

              {customPlaylists.map((pl) => {
                const count = pl.tracks?.total || pl.tracks?.items?.length || 0;
                return (
                  <TouchableOpacity
                    key={pl.id}
                    onPress={() => handleSelectPlaylist(pl.id)}
                    style={[styles.plRow, { borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : '#EEE' }]}
                  >
                    <PlaylistCover tracks={pl.tracks?.items || []} name={pl.name} defaultCover={pl.image} size={48} />
                    <View style={styles.plInfo}>
                      <Text style={[styles.plTitle, { color: isDark ? '#FFF' : '#111' }]} numberOfLines={1}>
                        {pl.name}
                      </Text>
                      <Text style={[styles.plSubtitle, { color: isDark ? 'rgba(255,255,255,0.5)' : '#888' }]}>
                        {count} {count === 1 ? 'song' : 'songs'}
                      </Text>
                    </View>
                    <Ionicons name="add-circle-outline" size={22} color={COLORS.accent} />
                  </TouchableOpacity>
                );
              })}

              {customPlaylists.length === 0 && (
                <View style={styles.emptyContainer}>
                  <Text style={[styles.emptyText, { color: isDark ? 'rgba(255,255,255,0.5)' : '#888' }]}>
                    You haven't created any playlists yet. Tap above to create your first one!
                  </Text>
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  backdropTouch: {
    flex: 1,
  },
  modalSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontFamily: FONTS.displayBold,
  },
  trackName: {
    fontSize: 12,
    fontFamily: FONTS.bodyMedium,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  playlistList: {
    marginTop: 12,
    maxHeight: 380,
  },
  createRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 18,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    marginBottom: 10,
    gap: 12,
  },
  newPlIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  plInfo: {
    flex: 1,
  },
  plTitle: {
    fontSize: 14,
    fontFamily: FONTS.displayBold,
  },
  plSubtitle: {
    fontSize: 11,
    fontFamily: FONTS.body,
    marginTop: 2,
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 12,
    fontFamily: FONTS.body,
    textAlign: 'center',
    lineHeight: 18,
  },
  createForm: {
    marginTop: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontFamily: FONTS.displayBold,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: FONTS.body,
  },
  textArea: {
    height: 72,
    textAlignVertical: 'top',
    fontFamily: FONTS.body,
  },
  formBtnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 100,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontFamily: FONTS.displayBold,
  },
  submitBtn: {
    flex: 2,
    paddingVertical: 13,
    borderRadius: 100,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
  },
  submitBtnText: {
    fontSize: 13,
    fontFamily: FONTS.displayBold,
    color: '#000',
  },
});
