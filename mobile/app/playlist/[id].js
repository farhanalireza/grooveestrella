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
import { FONTS } from '../../src/constants/theme';
import { StorageService } from '../../src/services/storage';
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
import GrooveLogo from '../../src/components/GrooveLogo';

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
        const savedPlaylists = await StorageService.getSavedPlaylists();
        const found = savedPlaylists.find((p) => p.id === id);
        if (found) {
          setPlaylist(found);
          setTracks(found.tracks?.items || found.tracks || []);
        } else {
          setPlaylist({
            id: String(id),
            name: 'Playlist',
            title: 'Playlist',
            description: 'Curated Playlist on GrooveEstrella',
            tracks: { items: [], total: 0 },
          });
        }
      }

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
    const t = trackItem?.track || trackItem;
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

  const shareTitle = `${playlistTitle} on GrooveEstrella`;
  const shareMessage = `Explore "${playlistTitle}" on GrooveEstrella! 🎧`;
  const shareUrl = `https://grooveestrella.com/playlist/${id}`;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]} edges={['left', 'right']}>
      {/* Dynamic Ambient Cover Art Blur Backdrop */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        {backdropCover ? (
          <Image
            source={{ uri: backdropCover }}
            style={[StyleSheet.absoluteFillObject, { opacity: isDark ? 0.6 : 0.75 }]}
            blurRadius={Platform.OS === 'ios' ? 26 : 16}
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
            'rgba(0, 0, 0, 0.45)',
            isDark ? 'rgba(23, 2, 11, 0.65)' : 'rgba(250, 244, 235, 0.65)',
            colors.bg,
          ]}
          locations={[0, 0.45, 0.95]}
          style={StyleSheet.absoluteFillObject}
        />
      </View>

      {/* Floating Pill Top Bar (Back + Logo/Wordmark + Native Share) */}
      <GrooveAppBar
        variant="pill"
        title={playlistTitle}
        shareData={{ title: shareTitle, message: shareMessage, url: shareUrl }}
      />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: (Platform.OS === 'ios' ? Math.max(insets.top, 44) : Math.max(insets.top, 24)) + 60,
            paddingBottom: insets.bottom + 48,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Centered Apple Music Style Hero */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.heroCenterContainer}>
          {/* 3-State Playlist Cover */}
          <View style={styles.coverWrapper}>
            <PlaylistCover
              playlist={playlist}
              tracks={tracks}
              size={230}
              style={styles.coverShadow}
            />
          </View>

          {/* Playlist Title */}
          <View style={styles.titleRow}>
            <Text style={[styles.playlistTitleText, { color: colors.text }]}>{playlistTitle}</Text>
          </View>

          {/* Curator Subtitle */}
          <Text style={[styles.curatorText, { color: colors.textSecondary }]}>
            Curated by <Text style={[styles.curatorHighlight, { color: colors.accent }]}>{ownerName}</Text>
          </Text>

          {/* Subtitle: Playlist · X songs · Total duration */}
          <Text style={[styles.metaSubtitle, { color: colors.textSecondary }]}>
            Playlist · {totalTracksCount} {totalTracksCount === 1 ? 'song' : 'songs'}
            {formattedRuntime ? ` · ${formattedRuntime}` : ''}
          </Text>

          {/* Centered Action Controls Row: Export | Add Songs (if custom) | Delete/Bookmark */}
          <View style={styles.actionRow}>
            {/* 1. Export / Download Playlist File */}
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowExportModal(true);
              }}
              style={styles.circleActionBtn}
              activeOpacity={0.8}
            >
              <Ionicons name="download-outline" size={20} color="#FFF2DF" />
            </TouchableOpacity>

            {/* 2. Primary Action: Add Songs Button (for custom playlist) */}
            {isCustom && (
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowAddTrackModal(true);
                }}
                style={[styles.primaryPillBtn, { backgroundColor: colors.accent }]}
                activeOpacity={0.85}
              >
                <Ionicons name="add-circle" size={17} color="#17020B" style={{ marginRight: 6 }} />
                <Text style={styles.primaryPillText}>Add Songs</Text>
              </TouchableOpacity>
            )}

            {/* 3. Delete Custom Playlist OR Save External Playlist */}
            {isCustom ? (
              <TouchableOpacity
                onPress={handleDeleteCustomPlaylist}
                style={[styles.circleActionBtn, { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.3)' }]}
                activeOpacity={0.8}
              >
                <Ionicons name="trash-outline" size={19} color="#EF4444" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={handleToggleSave}
                style={[
                  styles.primaryPillBtn,
                  saved
                    ? { backgroundColor: colors.accent }
                    : { backgroundColor: 'rgba(255, 255, 255, 0.1)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.15)' },
                ]}
                activeOpacity={0.85}
              >
                <Ionicons
                  name={saved ? 'checkmark' : 'add'}
                  size={18}
                  color={saved ? '#17020B' : '#FFF2DF'}
                  style={{ marginRight: 6 }}
                />
                <Text style={[styles.primaryPillText, { color: saved ? '#17020B' : '#FFF2DF' }]}>
                  {saved ? 'In Library' : 'Save to Library'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Description */}
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
                  <Text style={[styles.readMoreText, { color: colors.accent }]}>
                    {expandedHeroDesc ? 'LESS' : 'MORE'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ) : null}
        </Animated.View>

        {/* Tracks List */}
        <View style={styles.tracksSection}>
          <View style={[styles.tracksHeaderRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.tracksHeaderTitle, { color: colors.text }]}>Tracks List</Text>
            <View style={[styles.tracksBadge, { borderColor: colors.border }]}>
              <Text style={[styles.tracksBadgeText, { color: colors.accent }]}>{tracks.length} songs</Text>
            </View>
          </View>

          {tracks.length === 0 ? (
            <View style={[styles.emptyTracksBox, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
              <Ionicons name="musical-notes-outline" size={36} color={colors.textSecondary} />
              <Text style={[styles.emptyTracksTitle, { color: colors.text }]}>No songs in this playlist yet</Text>
              {isCustom && (
                <TouchableOpacity
                  onPress={() => setShowAddTrackModal(true)}
                  style={[styles.addSongsBtn, { backgroundColor: colors.accent }]}
                >
                  <Text style={styles.addSongsBtnText}>Add Songs Now</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.trackList}>
              {tracks.map((item, index) => {
                const track = item?.track || item;
                const trackId = track.id || track.trackId || track.trackURI;
                const trackTitle = track.name || track.title || 'Unknown Track';
                const trackArtist = track.artist || (Array.isArray(track.artists) ? track.artists.map(a => a.name).join(', ') : 'Unknown Artist');
                const dur = formatDuration(track.duration_ms || track.duration);
                const thumb = track.album?.images?.[0]?.url || track.coverArt || track.image || null;

                return (
                  <TouchableOpacity
                    key={`${trackId || 'track'}-${index}`}
                    onPress={() => {
                      if (trackId && !String(trackId).startsWith('local-')) {
                        router.push(`/track/${trackId}`);
                      }
                    }}
                    activeOpacity={0.7}
                    style={[styles.trackRow, { borderBottomColor: 'rgba(255, 255, 255, 0.08)' }]}
                  >
                    <Text style={[styles.trackPos, { color: colors.textSecondary }]}>
                      {index + 1}
                    </Text>

                    {thumb ? (
                      <Image source={{ uri: thumb }} style={styles.trackThumb} resizeMode="cover" />
                    ) : (
                      <View style={[styles.trackThumbPlaceholder, { backgroundColor: colors.surface }]}>
                        <Ionicons name="musical-notes" size={14} color={colors.accent} />
                      </View>
                    )}

                    <View style={styles.trackCenter}>
                      <Text style={[styles.trackTitle, { color: colors.text }]} numberOfLines={1}>
                        {trackTitle}
                      </Text>
                      <Text style={[styles.trackArtist, { color: colors.textSecondary }]} numberOfLines={1}>
                        {trackArtist}
                      </Text>
                    </View>

                    <Text style={[styles.trackDuration, { color: colors.textSecondary }]}>
                      {dur}
                    </Text>

                    <TouchableOpacity
                      onPress={() => openTrackActionModal(item)}
                      style={styles.moreBtn}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="ellipsis-horizontal" size={18} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              })}
            </View>
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
        existingTrackIds={tracks.map((t) => (t?.track || t).id || (t?.track || t).trackId || (t?.track || t).trackURI)}
        onTrackAdded={() => loadPlaylistData()}
      />

      {/* Playlist Picker Modal (for copying to another playlist) */}
      <PlaylistPickerModal
        visible={showPlaylistPickerModal}
        onClose={() => setShowPlaylistPickerModal(false)}
        track={selectedTrackForPlaylist}
      />

      {/* GrooveLink Modal */}
      <GrooveLinkModal
        visible={showGrooveLinkModal}
        onClose={() => setShowGrooveLinkModal(false)}
        target={modalTrackTarget}
        onOpenGrooveCard={(item) => {
          if (item) setModalTrackTarget(item);
          setShowGrooveCardModal(true);
        }}
      />

      {/* GrooveCard Modal */}
      <GrooveCardModal
        visible={showGrooveCardModal}
        onClose={() => setShowGrooveCardModal(false)}
        item={modalTrackTarget}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  heroCenterContainer: {
    alignItems: 'center',
    textAlign: 'center',
    marginBottom: 28,
  },
  coverWrapper: {
    width: 230,
    height: 230,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: 'rgba(71, 11, 36, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.6,
        shadowRadius: 28,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  coverShadow: {
    width: '100%',
    height: '100%',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: 20,
    paddingHorizontal: 12,
  },
  playlistTitleText: {
    fontSize: 24,
    fontWeight: '800',
    fontFamily: FONTS.display,
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  curatorText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: FONTS.body,
    marginTop: 4,
  },
  curatorHighlight: {
    fontWeight: '700',
    fontFamily: FONTS.bodyBold,
  },
  metaSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: FONTS.body,
    marginTop: 4,
    opacity: 0.75,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 22,
  },
  circleActionBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  primaryPillBtn: {
    height: 46,
    paddingHorizontal: 22,
    borderRadius: 23,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  primaryPillText: {
    fontSize: 13,
    fontWeight: '800',
    fontFamily: FONTS.display,
    color: '#17020B',
    letterSpacing: 0.2,
  },
  overviewSection: {
    marginTop: 18,
    width: '100%',
    paddingHorizontal: 4,
  },
  overviewText: {
    fontSize: 13,
    lineHeight: 19,
    fontFamily: FONTS.body,
    textAlign: 'left',
  },
  overviewTextClamped: {
    maxHeight: 40,
    overflow: 'hidden',
  },
  readMoreBtn: {
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  readMoreText: {
    fontSize: 11,
    fontWeight: '800',
    fontFamily: FONTS.display,
    letterSpacing: 1,
  },
  tracksSection: {
    marginBottom: 28,
  },
  tracksHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
    marginBottom: 12,
    borderBottomWidth: 1,
  },
  tracksHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    fontFamily: FONTS.display,
  },
  tracksBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 9999,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  tracksBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: FONTS.bodyBold,
  },
  emptyTracksBox: {
    padding: 32,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTracksTitle: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: FONTS.displaySemiBold,
    marginTop: 10,
    marginBottom: 16,
  },
  addSongsBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 9999,
  },
  addSongsBtnText: {
    fontSize: 12,
    fontWeight: '800',
    fontFamily: FONTS.display,
    color: '#17020B',
  },
  trackList: {
    flexDirection: 'column',
  },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
  },
  trackPos: {
    width: 22,
    fontSize: 12,
    fontWeight: '600',
    fontFamily: FONTS.mono,
    textAlign: 'center',
    marginRight: 8,
  },
  trackThumb: {
    width: 38,
    height: 38,
    borderRadius: 6,
    marginRight: 10,
  },
  trackThumbPlaceholder: {
    width: 38,
    height: 38,
    borderRadius: 6,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackCenter: {
    flex: 1,
    minWidth: 0,
    marginRight: 10,
  },
  trackTitle: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: FONTS.displaySemiBold,
  },
  trackArtist: {
    fontSize: 11,
    fontFamily: FONTS.body,
    marginTop: 2,
  },
  trackDuration: {
    fontSize: 11,
    fontFamily: FONTS.mono,
    marginRight: 10,
  },
  moreBtn: {
    padding: 4,
  },
});
