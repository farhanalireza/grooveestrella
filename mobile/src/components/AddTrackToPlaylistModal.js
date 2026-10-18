// mobile/src/components/AddTrackToPlaylistModal.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';
import { useTheme } from '../context/ThemeContext';
import { ApiService } from '../services/api';
import { StorageService } from '../services/storage';

export default function AddTrackToPlaylistModal({
  visible,
  onClose,
  playlistId,
  onTrackAdded,
  existingTrackIds = [],
}) {
  const { colors, isDark } = useTheme();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addedIds, setAddedIds] = useState(new Set());
  const debounceTimer = useRef(null);

  useEffect(() => {
    if (visible) {
      setAddedIds(new Set(Array.isArray(existingTrackIds) ? existingTrackIds : []));
    } else {
      setQuery('');
      setResults([]);
      setLoading(false);
    }
  }, [visible, existingTrackIds]);

  const handleSearchChange = (text) => {
    setQuery(text);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    if (!text.trim() || text.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceTimer.current = setTimeout(async () => {
      try {
        const tracks = await ApiService.searchCatalog(text.trim(), 'track', 15);
        setResults(tracks || []);
      } catch (err) {
        console.warn('Track search error in modal:', err);
      } finally {
        setLoading(false);
      }
    }, 400);
  };

  const handleAddTrack = async (track) => {
    if (!playlistId || !track) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const trackId = track.id || track.trackId;
    if (addedIds.has(trackId)) {
      Toast.show({
        type: 'info',
        text1: 'Already in Playlist',
        text2: `"${track.title || track.name}" is already in this playlist`,
      });
      return;
    }

    const success = await StorageService.addTrackToCustomPlaylist(playlistId, track);
    if (success) {
      setAddedIds((prev) => new Set([...prev, trackId]));
      Toast.show({
        type: 'success',
        text1: 'Added to Playlist 🎵',
        text2: `Added "${track.title || track.name}"`,
      });
      if (onTrackAdded) {
        onTrackAdded(track);
      }
    } else {
      Toast.show({
        type: 'info',
        text1: 'Already in Playlist',
        text2: `"${track.title || track.name}" is already in this playlist`,
      });
      setAddedIds((prev) => new Set([...prev, trackId]));
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
                <Ionicons name="musical-notes-outline" size={18} color={colors.accent || '#00F0FF'} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.title, { color: colors.text }]}>Add Songs to Playlist</Text>
                <Text style={[styles.subtitle, { color: colors.subtext }]}>
                  Search catalog to append songs
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close-circle-outline" size={24} color={colors.subtext} />
            </TouchableOpacity>
          </View>

          {/* Search Input */}
          <View style={[styles.searchBar, { borderColor: colors.border, backgroundColor: 'rgba(255, 255, 255, 0.04)' }]}>
            <Ionicons name="search-outline" size={18} color={colors.subtext} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search title, artist or album..."
              placeholderTextColor={colors.subtext}
              value={query}
              onChangeText={handleSearchChange}
              autoFocus
              returnKeyType="search"
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => handleSearchChange('')}>
                <Ionicons name="close-circle" size={16} color={colors.subtext} />
              </TouchableOpacity>
            )}
          </View>

          {/* Results List */}
          <View style={styles.listContainer}>
            {loading ? (
              <View style={styles.emptyContainer}>
                <ActivityIndicator size="small" color={colors.accent || '#00F0FF'} />
                <Text style={[styles.emptyText, { color: colors.subtext, marginTop: 10 }]}>Searching catalog...</Text>
              </View>
            ) : results.length > 0 ? (
              <FlatList
                data={results}
                keyExtractor={(item, index) => `${item.id || item.trackId}-${index}`}
                contentContainerStyle={styles.listContent}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => {
                  const trackId = item.id || item.trackId;
                  const isAdded = addedIds.has(trackId);
                  const artistName = Array.isArray(item.artists)
                    ? item.artists.map((a) => a.name || a).join(', ')
                    : item.artist || 'Unknown Artist';
                  const cover = item.image || item.coverArt || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&auto=format&fit=crop&q=80';

                  return (
                    <View style={styles.trackItem}>
                      <Image source={{ uri: cover }} style={styles.trackImage} />
                      <View style={styles.trackInfo}>
                        <Text style={[styles.trackTitle, { color: colors.text }]} numberOfLines={1}>
                          {item.title || item.name}
                        </Text>
                        <Text style={[styles.trackArtist, { color: colors.subtext }]} numberOfLines={1}>
                          {artistName}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={[
                          styles.addButton,
                          isAdded
                            ? { backgroundColor: 'rgba(255, 255, 255, 0.08)' }
                            : { backgroundColor: colors.accent || '#00F0FF' },
                        ]}
                        onPress={() => handleAddTrack(item)}
                        disabled={isAdded}
                        activeOpacity={0.8}
                      >
                        <Ionicons
                          name={isAdded ? 'checkmark' : 'add'}
                          size={15}
                          color={isAdded ? colors.subtext : '#000'}
                        />
                        <Text
                          style={[
                            styles.addButtonText,
                            { color: isAdded ? colors.subtext : '#000' },
                          ]}
                        >
                          {isAdded ? 'Added' : 'Add'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  );
                }}
              />
            ) : query.trim().length >= 2 ? (
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: colors.subtext }]}>
                  No tracks found matching "{query}"
                </Text>
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="search" size={28} color={colors.subtext} style={{ opacity: 0.5, marginBottom: 8 }} />
                <Text style={[styles.emptyText, { color: colors.subtext }]}>
                  Type a song or artist name to search
                </Text>
              </View>
            )}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.doneButton, { backgroundColor: 'rgba(255, 255, 255, 0.08)' }]}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={[styles.doneButtonText, { color: colors.text }]}>Done</Text>
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
    maxWidth: 440,
    height: '75%',
    maxHeight: 560,
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
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 14,
    marginBottom: 10,
    gap: 8,
  },
  searchIcon: {
    opacity: 0.7,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    padding: 0,
  },
  listContainer: {
    flex: 1,
    minHeight: 180,
  },
  listContent: {
    gap: 8,
    paddingVertical: 4,
  },
  trackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 12,
    gap: 10,
  },
  trackImage: {
    width: 42,
    height: 42,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  trackInfo: {
    flex: 1,
    minWidth: 0,
  },
  trackTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  trackArtist: {
    fontSize: 11,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  addButtonText: {
    fontSize: 11,
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
  },
  emptyText: {
    fontSize: 12,
    textAlign: 'center',
  },
  footer: {
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'flex-end',
  },
  doneButton: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
  },
  doneButtonText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
