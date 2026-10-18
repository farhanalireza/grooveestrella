// mobile/app/playlist/[id].js
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../src/context/ThemeContext';
import { StorageService } from '../../src/services/storage';
import { ApiService } from '../../src/services/api';
import {
  PlaylistCover,
  extractPlaylistCovers,
  ExportPlaylistModal,
  AddTrackToPlaylistModal,
  PlaylistPickerModal,
  GrooveLinkModal,
  GrooveCardModal,
  GrooveLoader,
  GrooveAppBar,
} from '../../src/components';

function formatDuration(ms) {
  if (!ms) return '00:00';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function formatTotalRuntime(ms) {
  if (!ms) return null;
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (hours > 0) return `${hours} hr ${mins} min`;
  return `${mins} min`;
}

export default function PlaylistDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const [playlist, setPlaylist] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [expandedHeroDesc, setExpandedHeroDesc] = useState(false);

  // Modals state
  const [showExportModal, setShowExportModal] = useState(false);
  const [showAddTrackModal, setShowAddTrackModal] = useState(false);
  const [showPlaylistPickerModal, setShowPlaylistPickerModal] = useState(false);
  const [selectedTrackForPlaylist, setSelectedTrackForPlaylist] = useState(null);
  const [showGrooveLinkModal, setShowGrooveLinkModal] = useState(false);
  const [showGrooveCardModal, setShowGrooveCardModal] = useState(false);
  const [modalTrackTarget, setModalTrackTarget] = useState(null);

  const isCustom = Boolean(id && String(id).startsWith('custom-'));

  const loadPlaylistData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      if (isCustom) {
        const customPlaylists = await StorageService.getCustomPlaylists();
        const found = customPlaylists.find((p) => p.id === id);
        if (found) {
          setPlaylist(found);
          const trackItems = found.tracks?.items || [];
          setTracks(trackItems);
        } else {
          Toast.show({
            type: 'error',
            text1: 'Playlist Not Found',
            text2: 'This custom playlist could not be located.',
          });
        }
      } else {
        // Public / Saved playlist check
        const savedPlaylists = await StorageService.getSavedPlaylists();
        const found = savedPlaylists.find((p) => p.id === id);
        if (found) {
          setPlaylist(found);
          setTracks(found.tracks?.items || found.tracks || []);
        } else {
          // Fallback minimal object
          setPlaylist({
            id: String(id),
            name: 'Playlist',
            title: 'Playlist',
            description: 'Curated Playlist on GrooveEstrella',
            tracks: { items: [], total: 0 },
          });
        }
      }

      // Check if saved
      const savedList = await StorageService.getSavedPlaylists();
      const isSaved = savedList.some((p) => p.id === id);
      setSaved(isSaved);
    } catch (err) {
      console.warn('Failed to load playlist:', err);
    } finally {
      setLoading(false);
    }
  }, [id, isCustom]);

  useEffect(() => {
    loadPlaylistData();
  }, [loadPlaylistData]);

  const handleToggleSave = async () => {
    if (!playlist) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (saved) {
      await StorageService.removePlaylist(String(id));
      setSaved(false);
      Toast.show({
        type: 'info',
        text1: 'Removed from Library',
        text2: `"${playlist.name || playlist.title}" removed`,
      });
    } else {
      await StorageService.savePlaylist({
        id: String(id),
        name: playlist.name || playlist.title || 'Playlist',
        title: playlist.name || playlist.title || 'Playlist',
        image: playlist.image || playlist.images?.[0]?.url || '',
        images: playlist.images || (playlist.image ? [{ url: playlist.image }] : []),
        tracks: {
          total: tracks.length,
          items: tracks,
        },
      });
      setSaved(true);
      Toast.show({
        type: 'success',
        text1: 'Saved to Library 📁',
        text2: `"${playlist.name || playlist.title}" bookmarked`,
      });
    }
  };

  const handleDeleteCustomPlaylist = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(
      'Delete Playlist',
      `Are you sure you want to delete "${playlist?.name || 'this playlist'}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await StorageService.removeCustomPlaylist(String(id));
            Toast.show({
              type: 'info',
              text1: 'Playlist Deleted',
              text2: `"${playlist?.name || 'Playlist'}" has been deleted`,
            });
            router.replace('/(tabs)/library');
          },
        },
      ]
    );
  };

  const handleRemoveTrack = (trackId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Remove Track',
      'Remove this track from the playlist?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await StorageService.removeTrackFromCustomPlaylist(String(id), trackId);
            setTracks((prev) =>
              prev.filter((item) => {
                const t = item?.track || item;
                return (t.id || t.trackId || t.trackURI) !== trackId;
              })
            );
            Toast.show({
              type: 'info',
              text1: 'Track Removed',
              text2: 'Track removed from playlist',
            });
          },
        },
      ]
    );
  };

  const openTrackActionModal = (trackItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const t = trackItem.track || trackItem;
    const trackId = t.id || t.trackId || t.trackURI;
    const trackTitle = t.name || t.title || 'Track';

    const options = [
      {
        text: 'Add to Another Playlist',
        onPress: () => {
          setSelectedTrackForPlaylist(t);
          setShowPlaylistPickerModal(true);
        },
      },
      {
        text: 'Open in GrooveLink',
        onPress: () => {
          setModalTrackTarget(t);
          setShowGrooveLinkModal(true);
        },
      },
      {
        text: 'Share via GrooveCard',
        onPress: () => {
          setModalTrackTarget(t);
          setShowGrooveCardModal(true);
        },
      },
    ];

    if (isCustom) {
      options.push({
        text: 'Remove from this Playlist',
        style: 'destructive',
        onPress: () => handleRemoveTrack(trackId),
      });
    }

    options.push({ text: 'Cancel', style: 'cancel' });

    Alert.alert(trackTitle, t.artist || (Array.isArray(t.artists) ? t.artists.map(a => a.name).join(', ') : 'Track Options'), options);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
        <GrooveLoader fullScreen text="Loading Playlist Details..." />
      </SafeAreaView>
    );
  }

  const playlistTitle = playlist?.name || playlist?.title || 'Untitled Playlist';
  const ownerName = playlist?.owner?.display_name || playlist?.owner || 'You';
  const totalTracksCount = tracks.length;
  const totalRuntimeMs = tracks.reduce((acc, item) => {
    const t = item?.track || item;
    return acc + (t.duration_ms || t.duration || 180000);
  }, 0);
  const formattedRuntime = formatTotalRuntime(totalRuntimeMs);
  const covers = extractPlaylistCovers(tracks);
  const backdropCover = covers[0] || playlist?.image || null;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]} edges={['left', 'right']}>
      {/* Dynamic Ambient Cover Art Backdrop */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        {backdropCover ? (
          <Image
            source={{ uri: backdropCover }}
            style={[StyleSheet.absoluteFillObject, { opacity: isDark ? 0.6 : 0.75 }]}
            blurRadius={Platform.OS === 'ios' ? 24 : 14}
            resizeMode="cover"
          />
        ) : (
          <LinearGradient
            colors={[isDark ? '#31102f' : '#faeedd', isDark ? '#1a0924' : '#fdf6ee', colors.bg]}
            style={StyleSheet.absoluteFillObject}
          />
        )}
        <LinearGradient
          colors={[
            'rgba(0, 0, 0, 0.35)',
            isDark ? 'rgba(23, 2, 11, 0.6)' : 'rgba(250, 244, 235, 0.6)',
            colors.bg,
          ]}
          locations={[0, 0.45, 0.95]}
          style={StyleSheet.absoluteFillObject}
        />
      </View>

      {/* Top Bar with back, title, share, and save */}
      <GrooveAppBar
        title={playlistTitle}
        subtitle={`Curated by ${ownerName}`}
        saved={saved}
        onToggleSave={handleToggleSave}
        onShare={() => setShowExportModal(true)}
      />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: (Platform.OS === 'ios' ? Math.max(insets.top, 44) : Math.max(insets.top, 24)) + 58,
            paddingBottom: insets.bottom + 40,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Card Container (Apple Music Layout) */}
        <Animated.View
          entering={FadeInDown.duration(400)}
          style={[styles.heroCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}
        >
          {/* 3-State Playlist Cover */}
          <View style={styles.coverWrapper}>
            <PlaylistCover
              playlist={playlist}
              tracks={tracks}
              size={200}
              style={styles.coverShadow}
            />
          </View>

          {/* Playlist Metadata */}
          <View style={styles.metaContent}>
            {/* Category Label */}
            <View
              style={[
                styles.categoryBadgeRow,
                {
                  backgroundColor: isDark ? 'rgba(181, 190, 221, 0.15)' : 'rgba(71, 11, 36, 0.08)',
                  borderColor: colors.border,
                },
              ]}
            >
              <Ionicons name="musical-notes" size={13} color={colors.accent || '#00F0FF'} />
              <Text style={[styles.categoryBadgeText, { color: colors.accent || '#00F0FF' }]}>PLAYLIST</Text>
            </View>

            {/* Playlist Title */}
            <Text style={[styles.playlistTitleText, { color: colors.text }]}>
              {playlistTitle}
            </Text>

            {/* Curator Subtitle */}
            <Text style={[styles.subtitleText, { color: colors.textSecondary }]}>
              Curated by <Text style={{ color: colors.accent || '#00F0FF', fontWeight: '700' }}>{ownerName}</Text>
            </Text>

            {/* Meta Row: Track count + Runtime */}
            <View style={styles.metaRow}>
              <Text style={[styles.metaItemText, { color: colors.textSecondary }]}>
                {totalTracksCount} songs total
              </Text>
              {formattedRuntime && (
                <>
                  <Text style={[styles.metaDot, { color: colors.textSecondary }]}>•</Text>
                  <View style={styles.metaItem}>
                    <Ionicons name="time-outline" size={13} color={colors.accent || '#00F0FF'} />
                    <Text style={[styles.metaItemHighlight, { color: colors.text }]}>
                      {formattedRuntime}
                    </Text>
                  </View>
                </>
              )}
            </View>

            {/* Collapsible Overview */}
            {playlist?.description ? (
              <View style={styles.overviewSection}>
                <Text
                  style={[
                    styles.overviewText,
                    { color: colors.textSecondary },
                    !expandedHeroDesc && styles.overviewTextClamped,
                  ]}
                >
                  {playlist.description}
                </Text>
                {playlist.description.length > 80 && (
                  <TouchableOpacity
                    onPress={() => setExpandedHeroDesc(!expandedHeroDesc)}
                    style={styles.readMoreBtn}
                  >
                    <Text style={[styles.readMoreText, { color: colors.accent || '#00F0FF' }]}>
                      {expandedHeroDesc ? 'Show less' : 'Read more'}
                    </Text>
                    <Ionicons
                      name={expandedHeroDesc ? 'chevron-up' : 'chevron-down'}
                      size={12}
                      color={colors.accent || '#00F0FF'}
                    />
                  </TouchableOpacity>
                )}
              </View>
            ) : null}

            {/* Smart Action Buttons (NO GrooveLink button in playlist hero!) */}
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={[styles.primaryActionBtn, { backgroundColor: colors.accent || '#00F0FF' }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setShowExportModal(true);
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="download-outline" size={16} color="#000" />
                <Text style={styles.primaryActionBtnText}>Export & Share File</Text>
              </TouchableOpacity>

              {isCustom && (
                <TouchableOpacity
                  style={[styles.secondaryActionBtn, { borderColor: colors.border }]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setShowAddTrackModal(true);
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add" size={17} color={colors.text} />
                  <Text style={[styles.secondaryActionBtnText, { color: colors.text }]}>Add Songs</Text>
                </TouchableOpacity>
              )}

              {isCustom && (
                <TouchableOpacity
                  style={[styles.iconActionBtn, { borderColor: colors.border }]}
                  onPress={handleDeleteCustomPlaylist}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="trash-outline" size={17} color="#ef4444" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Animated.View>

        {/* Tracks List Section (Apple Music Tracklist) */}
        <View style={[styles.tracksSection, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
          <View style={styles.tracksHeaderRow}>
            <View style={styles.tracksHeaderLeft}>
              <Text style={[styles.tracksHeaderTitle, { color: colors.text }]}>Tracks List</Text>
              <View style={[styles.tracksCountBadge, { backgroundColor: colors.border }]}>
                <Text style={[styles.tracksCountBadgeText, { color: colors.textSecondary }]}>
                  {tracks.length}
                </Text>
              </View>
            </View>
            {formattedRuntime && (
              <View
                style={[
                  styles.runtimeBadge,
                  {
                    backgroundColor: isDark ? 'rgba(0, 240, 255, 0.12)' : 'rgba(0, 180, 216, 0.12)',
                    borderColor: isDark ? 'rgba(0, 240, 255, 0.25)' : 'rgba(0, 180, 216, 0.25)',
                  },
                ]}
              >
                <Ionicons name="time-outline" size={12} color={colors.accent || '#00F0FF'} style={{ marginRight: 4 }} />
                <Text style={[styles.runtimeBadgeText, { color: colors.accent || '#00F0FF' }]}>
                  {formattedRuntime}
                </Text>
              </View>
            )}
          </View>

          {tracks.length === 0 ? (
            <View style={styles.emptyPlaylistState}>
              <Ionicons name="musical-notes-outline" size={36} color={colors.subtext} style={{ opacity: 0.5, marginBottom: 10 }} />
              <Text style={[styles.emptyPlaylistTitle, { color: colors.text }]}>No Songs in this Playlist</Text>
              <Text style={[styles.emptyPlaylistSubtext, { color: colors.subtext }]}>
                Tap &quot;Add Songs&quot; above to search the catalog and build your playlist.
              </Text>
              {isCustom && (
                <TouchableOpacity
                  style={[styles.emptyAddBtn, { backgroundColor: colors.accent || '#00F0FF' }]}
                  onPress={() => setShowAddTrackModal(true)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="add" size={16} color="#000" />
                  <Text style={styles.emptyAddBtnText}>Add Songs Now</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            tracks.map((item, idx) => {
              const t = item?.track || item;
              const trackNum = String(idx + 1).padStart(2, '0');
              const trackName = t.name || t.title || `Track ${idx + 1}`;
              const artistName = Array.isArray(t.artists)
                ? t.artists.map((a) => a.name || a).join(', ')
                : t.artist || 'Unknown Artist';
              const trackDur = formatDuration(t.duration_ms || t.duration);
              const trackCover = t.image || t.album?.images?.[0]?.url || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=120&auto=format&fit=crop&q=80';
              const trackId = t.id || t.trackId || t.trackURI;

              return (
                <TouchableOpacity
                  key={`${trackId || idx}-${idx}`}
                  style={[styles.trackRow, { borderBottomColor: colors.border }]}
                  activeOpacity={0.7}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    if (t.id) {
                      router.push(`/track/${t.id}`);
                    }
                  }}
                >
                  {/* Track Number */}
                  <Text style={[styles.trackNumText, { color: colors.textSecondary }]}>
                    {trackNum}
                  </Text>

                  {/* Artwork Thumbnail */}
                  <Image source={{ uri: trackCover }} style={styles.trackThumb} />

                  {/* Track Main Info */}
                  <View style={styles.trackMainInfo}>
                    <Text style={[styles.trackRowTitle, { color: colors.text }]} numberOfLines={1}>
                      {trackName}
                    </Text>
                    <Text style={[styles.trackRowArtist, { color: colors.textSecondary }]} numberOfLines={1}>
                      {artistName}
                    </Text>
                  </View>

                  {/* Duration */}
                  <Text style={[styles.trackRowDuration, { color: colors.textSecondary }]}>
                    {trackDur}
                  </Text>

                  {/* 3-Dot Track Options Trigger */}
                  <TouchableOpacity
                    style={[
                      styles.trackRowOptionsBtn,
                      { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)' },
                    ]}
                    hitSlop={8}
                    onPress={(e) => {
                      e.stopPropagation();
                      openTrackActionModal(item);
                    }}
                  >
                    <Ionicons name="ellipsis-horizontal" size={16} color={colors.textSecondary} />
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Export Playlist Modal */}
      <ExportPlaylistModal
        visible={showExportModal}
        onClose={() => setShowExportModal(false)}
        playlist={playlist}
        tracks={tracks}
      />

      {/* Add Track to Playlist Modal */}
      <AddTrackToPlaylistModal
        visible={showAddTrackModal}
        onClose={() => setShowAddTrackModal(false)}
        playlistId={String(id)}
        existingTrackIds={tracks.map((item) => {
          const t = item?.track || item;
          return t.id || t.trackId || t.trackURI;
        })}
        onTrackAdded={() => {
          loadPlaylistData();
        }}
      />

      {/* Universal Playlist Picker Modal for Track options */}
      <PlaylistPickerModal
        visible={showPlaylistPickerModal}
        onClose={() => {
          setShowPlaylistPickerModal(false);
          setSelectedTrackForPlaylist(null);
        }}
        track={selectedTrackForPlaylist}
      />

      {/* Track GrooveLink Modal */}
      <GrooveLinkModal
        visible={showGrooveLinkModal}
        onClose={() => {
          setShowGrooveLinkModal(false);
          setModalTrackTarget(null);
        }}
        title={modalTrackTarget ? (modalTrackTarget.title || modalTrackTarget.name) : playlistTitle}
        artist={modalTrackTarget ? (modalTrackTarget.artist || (Array.isArray(modalTrackTarget.artists) ? modalTrackTarget.artists.map(a => a.name).join(', ') : 'Unknown')) : ownerName}
        album={modalTrackTarget?.album?.name || modalTrackTarget?.album || playlistTitle}
        imageUrl={modalTrackTarget?.image || modalTrackTarget?.album?.images?.[0]?.url || backdropCover}
        type="track"
        itemId={modalTrackTarget?.id || modalTrackTarget?.trackId}
        onOpenGrooveCard={() => {
          setShowGrooveLinkModal(false);
          setTimeout(() => setShowGrooveCardModal(true), 250);
        }}
      />

      {/* Track GrooveCard Modal */}
      <GrooveCardModal
        visible={showGrooveCardModal}
        onClose={() => {
          setShowGrooveCardModal(false);
          setModalTrackTarget(null);
        }}
        title={modalTrackTarget ? (modalTrackTarget.title || modalTrackTarget.name) : playlistTitle}
        artist={modalTrackTarget ? (modalTrackTarget.artist || (Array.isArray(modalTrackTarget.artists) ? modalTrackTarget.artists.map(a => a.name).join(', ') : 'Unknown')) : ownerName}
        album={modalTrackTarget?.album?.name || modalTrackTarget?.album || playlistTitle}
        imageUrl={modalTrackTarget?.image || modalTrackTarget?.album?.images?.[0]?.url || backdropCover}
        type="track"
        itemId={modalTrackTarget?.id || modalTrackTarget?.trackId}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  heroCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  coverWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  coverShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  metaContent: {
    alignItems: 'center',
    width: '100%',
  },
  categoryBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 5,
    marginBottom: 10,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  playlistTitleText: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitleText: {
    fontSize: 13,
    marginBottom: 8,
    textAlign: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 12,
  },
  metaItemText: {
    fontSize: 12,
    fontWeight: '500',
  },
  metaDot: {
    fontSize: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaItemHighlight: {
    fontSize: 12,
    fontWeight: '700',
  },
  overviewSection: {
    width: '100%',
    paddingHorizontal: 8,
    marginTop: 4,
    marginBottom: 14,
  },
  overviewText: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  overviewTextClamped: {
    // clamped
  },
  readMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 4,
  },
  readMoreText: {
    fontSize: 11,
    fontWeight: '700',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
    width: '100%',
    justifyContent: 'center',
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 22,
    gap: 6,
  },
  primaryActionBtnText: {
    color: '#000',
    fontSize: 13,
    fontWeight: '700',
  },
  secondaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 22,
    borderWidth: 1,
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  secondaryActionBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  iconActionBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  tracksSection: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  tracksHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 8,
  },
  tracksHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tracksHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  tracksCountBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  tracksCountBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  runtimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  runtimeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  trackNumText: {
    fontSize: 12,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    width: 20,
    textAlign: 'center',
  },
  trackThumb: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  trackMainInfo: {
    flex: 1,
    minWidth: 0,
  },
  trackRowTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  trackRowArtist: {
    fontSize: 11,
  },
  trackRowDuration: {
    fontSize: 11,
    fontVariant: ['tabular-nums'],
  },
  trackRowOptionsBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyPlaylistState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyPlaylistTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptyPlaylistSubtext: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  emptyAddBtnText: {
    color: '#000',
    fontSize: 13,
    fontWeight: '700',
  },
});
