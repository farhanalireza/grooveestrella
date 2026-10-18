// app/album/[id].js
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
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
import { COLORS } from '../../src/constants/theme';
import { ApiService } from '../../src/services/api';
import { StorageService } from '../../src/services/storage';
import {
  RatingPieChart,
  GrooveLinkModal,
  GrooveCardModal,
  MusicLoreAndReviews,
  GrooveLoader,
  GrooveAppBar,
  PlaylistPickerModal,
} from '../../src/components';

function formatDuration(ms) {
  if (!ms) return '00:00';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const paddedMinutes = String(minutes).padStart(2, '0');
  const paddedSeconds = String(seconds).padStart(2, '0');
  return `${paddedMinutes}:${paddedSeconds}`;
}

function formatTotalRuntime(ms) {
  if (!ms) return null;
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (hours > 0) return `${hours} hr ${mins} min`;
  return `${mins} min`;
}

export default function AlbumDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const [albumData, setAlbumData] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [expandedHeroDesc, setExpandedHeroDesc] = useState(false);
  const [selectedVariationId, setSelectedVariationId] = useState(null);

  // Modals state
  const [showGrooveLinkModal, setShowGrooveLinkModal] = useState(false);
  const [showGrooveCardModal, setShowGrooveCardModal] = useState(false);
  const [showPlaylistPickerModal, setShowPlaylistPickerModal] = useState(false);
  const [selectedTrackForPlaylist, setSelectedTrackForPlaylist] = useState(null);
  const [modalTrackTarget, setModalTrackTarget] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function loadAlbum() {
      if (!id) return;
      setLoading(true);
      try {
        const [result, isSaved] = await Promise.all([
          ApiService.fetchAlbum(String(id)),
          StorageService.isAlbumSaved(String(id)),
        ]);
        if (mounted) {
          const alb = result?.album || result;
          setAlbumData(alb);
          setTracks(result?.tracks || alb?.tracks || []);
          setSaved(isSaved);
          if (alb?.variations?.[0]?.id) {
            setSelectedVariationId(alb.variations[0].id);
          }
        }
      } catch (err) {
        console.warn('Album loading error:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadAlbum();
    return () => {
      mounted = false;
    };
  }, [id]);

  const handleToggleSave = async () => {
    if (!albumData) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const actualId = String(albumData.id || id);
    const albumName = albumData.title || albumData.name || 'Album';

    if (saved) {
      await StorageService.removeSavedAlbum(actualId);
      setSaved(false);
      Toast.show({
        type: 'info',
        text1: 'Removed from Library',
        text2: `"${albumName}" removed from your bookmarks`,
      });
    } else {
      await StorageService.saveAlbum({
        id: actualId,
        title: albumName,
        name: albumName,
        artist: albumData.artist,
        image: albumData.coverArt || albumData.image,
        releaseYear: albumData.releaseYear,
        type: 'album',
      });
      setSaved(true);
      Toast.show({
        type: 'success',
        text1: 'Saved to Library 💿',
        text2: `"${albumName}" bookmarked in your library`,
      });
    }
  };

  const handleSwitchVariation = async (variation) => {
    if (!variation || variation.id === selectedVariationId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedVariationId(variation.id);
    try {
      const result = await ApiService.fetchAlbum(String(id), variation.id);
      if (result) {
        const alb = result.album || result;
        setAlbumData(alb);
        if (result.tracks && result.tracks.length > 0) {
          setTracks(result.tracks);
        }
        Toast.show({
          type: 'info',
          text1: `Edition Switched: ${variation.label}`,
          text2: `${result.tracks?.length || tracks.length} tracks loaded`,
        });
      }
    } catch (_) {
      Toast.show({
        type: 'info',
        text1: `Edition Selected: ${variation.label}`,
        text2: `${tracks.length} tracks available`,
      });
    }
  };

  const openTrackInGrooveLink = (trackItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setModalTrackTarget(trackItem);
    setShowGrooveLinkModal(true);
  };

  const openTrackOptions = (trackItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const trackName = trackItem.title || trackItem.name || 'Track';
    Alert.alert(
      trackName,
      trackItem.artist || albumArtist,
      [
        {
          text: 'Add to Playlist',
          onPress: () => {
            setSelectedTrackForPlaylist({
              ...trackItem,
              image: coverUrl,
              coverArt: coverUrl,
              album: albumTitle,
            });
            setShowPlaylistPickerModal(true);
          },
        },
        {
          text: 'Open in GrooveLink',
          onPress: () => {
            setModalTrackTarget(trackItem);
            setShowGrooveLinkModal(true);
          },
        },
        {
          text: 'Share via GrooveCard',
          onPress: () => {
            setModalTrackTarget(trackItem);
            setShowGrooveCardModal(true);
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <GrooveLoader fullScreen text="Loading Album Details..." />
      </SafeAreaView>
    );
  }

  const albumTitle = albumData?.title || albumData?.name || 'Unknown Album';
  const albumArtist = albumData?.artist || 'Unknown Artist';
  const coverUrl = albumData?.coverArt || albumData?.image || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80';
  const releaseDate = albumData?.releaseDate || albumData?.releaseYear || '1972';
  const totalTracksCount = tracks.length || albumData?.total_tracks || 0;
  const totalRuntimeMs = albumData?.totalDurationMs || tracks.reduce((acc, t) => acc + (t.duration || t.duration_ms || 0), 0);
  const formattedRuntime = formatTotalRuntime(totalRuntimeMs);
  const variations = albumData?.variations || [
    { id: 'v1', label: `★ Original Release (${albumData?.releaseYear || '1972'})` },
    { id: 'v2', label: '1970s Pressings' },
    { id: 'v3', label: 'Early CD & Masters (1980s)' },
    { id: 'v4', label: 'Anniversary & Modern Remasters (2010+)' },
  ];

  const artistsList = Array.isArray(albumData?.artists)
    ? albumData.artists
    : [{ name: albumArtist }];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]} edges={['left', 'right']}>
      {/* Dynamic Ambient Album Art-Cover Gradient Backdrop */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <Image
          source={{ uri: coverUrl }}
          style={[StyleSheet.absoluteFillObject, { opacity: isDark ? 0.72 : 0.88 }]}
          blurRadius={Platform.OS === 'ios' ? 24 : 14}
          resizeMode="cover"
        />
        <LinearGradient
          colors={[
            'rgba(0, 0, 0, 0.3)',
            isDark ? 'rgba(23, 2, 11, 0.5)' : 'rgba(250, 244, 235, 0.5)',
            colors.bg,
          ]}
          locations={[0, 0.45, 0.95]}
          style={StyleSheet.absoluteFillObject}
        />
      </View>

      {/* Top Apple Music Style Unified App Bar */}
      <GrooveAppBar
        title={albumTitle}
        subtitle={albumArtist}
        saved={saved}
        onToggleSave={handleToggleSave}
        onShare={() => {
          setModalTrackTarget(null);
          setShowGrooveCardModal(true);
        }}
        onOpenLink={() => {
          setModalTrackTarget(null);
          setShowGrooveLinkModal(true);
        }}
      />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: (Platform.OS === 'ios' ? Math.max(insets.top, 44) : Math.max(insets.top, 24)) + 58,
            paddingBottom: insets.bottom + 36,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Card Container (Matches web app Album Card) */}
        <Animated.View entering={FadeInDown.duration(400)} style={[styles.heroCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          {/* Square Album Cover Artwork */}
          <View style={[styles.coverWrapper, { borderColor: colors.border, backgroundColor: colors.surfaceElevated }]}>
            <Image source={{ uri: coverUrl }} style={styles.coverImage} resizeMode="cover" />
          </View>

          {/* Album Metadata */}
          <View style={styles.metaContent}>
            {/* Category Label */}
            <View style={[styles.categoryBadgeRow, { backgroundColor: isDark ? 'rgba(181, 190, 221, 0.15)' : 'rgba(71, 11, 36, 0.08)', borderColor: colors.border, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 }]}>
              <Ionicons name="disc" size={13} color={colors.accent} />
              <Text style={[styles.categoryBadgeText, { color: colors.accent }]}>ALBUM RELEASE</Text>
            </View>

            {/* Album Title */}
            <Text style={[styles.albumTitleText, { color: colors.text }]}>{albumTitle}</Text>

            {/* Artist and Release Subtitle */}
            <Text style={[styles.subtitleText, { color: colors.textSecondary }]}>
              {artistsList.map((a, i) => (
                <Text
                  key={i}
                  style={[styles.clickableLink, { color: colors.accent, fontWeight: '700' }]}
                  onPress={() => {
                    if (a.id) {
                      router.push(`/artist/${a.id}`);
                    } else {
                      router.push(`/artist/${encodeURIComponent(a.name)}`);
                    }
                  }}
                >
                  {a.name}
                  {i < artistsList.length - 1 ? ', ' : ''}
                </Text>
              ))}
              <Text style={[styles.subtitleBullet, { color: colors.textSecondary }]}> • </Text>
              <Text style={[styles.releaseDateText, { color: colors.textSecondary }]}>{releaseDate}</Text>
            </Text>

            {/* Meta Row: Track count + Runtime + Genres */}
            <View style={styles.metaRow}>
              <Text style={[styles.metaItemText, { color: colors.textSecondary }]}>{totalTracksCount} tracks total</Text>
              {formattedRuntime && (
                <>
                  <Text style={[styles.metaDot, { color: colors.textSecondary }]}>•</Text>
                  <View style={styles.metaItem}>
                    <Ionicons name="time-outline" size={13} color={colors.accent} />
                    <Text style={[styles.metaItemHighlight, { color: colors.text }]}>{formattedRuntime}</Text>
                  </View>
                </>
              )}
              {albumData?.genres && albumData.genres.length > 0 && (
                <>
                  <Text style={[styles.metaDot, { color: colors.textSecondary }]}>•</Text>
                  <Text style={[styles.metaItemGenre, { color: colors.accent, fontWeight: '800' }]}>{albumData.genres.slice(0, 2).join(', ')}</Text>
                </>
              )}
            </View>

            {/* Circular Groove Score RatingPieChart */}
            <View style={styles.ratingRow}>
              <RatingPieChart rating={albumData?.rating || { value: 4.8 }} />
            </View>

            {/* Collapsible Lore Overview */}
            {albumData?.description ? (
              <View style={styles.overviewSection}>
                <Text
                  style={[
                    styles.overviewText,
                    { color: colors.textSecondary },
                    !expandedHeroDesc && styles.overviewTextClamped,
                  ]}
                >
                  {albumData.description}
                </Text>
                {albumData.description.length > 100 && (
                  <TouchableOpacity
                    onPress={() => setExpandedHeroDesc(!expandedHeroDesc)}
                    style={styles.readMoreBtn}
                  >
                    <Text style={[styles.readMoreText, { color: colors.accent }]}>
                      {expandedHeroDesc ? 'Show less' : 'Read full overview'}
                    </Text>
                    <Ionicons
                      name={expandedHeroDesc ? 'chevron-up' : 'chevron-down'}
                      size={12}
                      color={colors.accent}
                    />
                  </TouchableOpacity>
                )}
              </View>
            ) : null}

            {/* "Open GrooveLink" Pill Button */}
            <View style={styles.grooveLinkSection}>
              <TouchableOpacity
                style={[
                  styles.grooveLinkBtn,
                  {
                    backgroundColor: isDark ? 'rgba(232, 168, 124, 0.15)' : 'rgba(154, 74, 47, 0.12)',
                    borderColor: isDark ? 'rgba(232, 168, 124, 0.3)' : 'rgba(154, 74, 47, 0.25)',
                  },
                ]}
                activeOpacity={0.8}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setModalTrackTarget(null);
                  setShowGrooveLinkModal(true);
                }}
              >
                <Ionicons name="link" size={15} color={colors.accent} style={{ marginRight: 6 }} />
                <Text style={[styles.grooveLinkBtnText, { color: colors.accent }]}>Open GrooveLink</Text>
                <Ionicons name="chevron-forward" size={14} color={colors.accent} style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        {/* Variations / Editions Eras Switcher */}
        {variations.length > 0 && (
          <View style={styles.variationsSection}>
            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>EDITIONS & PRESSINGS</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.variationsScroll}>
              {variations.map((v) => {
                const isActive = (selectedVariationId === v.id);
                return (
                  <TouchableOpacity
                    key={v.id}
                    onPress={() => handleSwitchVariation(v)}
                    style={[
                      styles.variationPill,
                      {
                        backgroundColor: isActive
                          ? (isDark ? 'rgba(232, 168, 124, 0.25)' : 'rgba(154, 74, 47, 0.18)')
                          : colors.surfaceElevated,
                        borderColor: isActive ? colors.accent : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.variationPillText,
                        { color: isActive ? colors.accent : colors.textSecondary, fontWeight: isActive ? '800' : '600' },
                      ]}
                    >
                      {v.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Numbered Tracks Section (Matches web app Album Tracklist) */}
        <View style={[styles.tracksSection, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
          <View style={styles.tracksHeaderRow}>
            <View style={styles.tracksHeaderLeft}>
              <Text style={[styles.tracksHeaderTitle, { color: colors.text }]}>Tracks List</Text>
              <View style={[styles.tracksCountBadge, { backgroundColor: colors.border }]}>
                <Text style={[styles.tracksCountBadgeText, { color: colors.textSecondary }]}>{tracks.length}</Text>
              </View>
            </View>
            {formattedRuntime && (
              <View
                style={[
                  styles.runtimeBadge,
                  {
                    backgroundColor: isDark ? 'rgba(232, 168, 124, 0.15)' : 'rgba(154, 74, 47, 0.12)',
                    borderColor: isDark ? 'rgba(232, 168, 124, 0.3)' : 'rgba(154, 74, 47, 0.25)',
                  },
                ]}
              >
                <Ionicons name="time-outline" size={12} color={colors.accent} style={{ marginRight: 4 }} />
                <Text style={[styles.runtimeBadgeText, { color: colors.accent }]}>{formattedRuntime}</Text>
              </View>
            )}
          </View>

          {/* Track Rows */}
          {tracks.map((t, idx) => {
            const trackNum = String(t.trackNumber || idx + 1).padStart(2, '0');
            const trackName = t.title || t.name || `Track ${idx + 1}`;
            const trackArt = t.artist || albumArtist;
            const trackDur = formatDuration(t.duration || t.duration_ms);

            return (
              <TouchableOpacity
                key={t.id || idx}
                style={[styles.trackRow, { borderBottomColor: colors.border }]}
                activeOpacity={0.7}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push(`/track/${t.id || encodeURIComponent(trackName)}`);
                }}
              >
                {/* Track Number */}
                <Text style={[styles.trackNumText, { color: colors.textSecondary }]}>{trackNum}</Text>

                {/* Track Info */}
                <View style={styles.trackMainInfo}>
                  <Text style={[styles.trackRowTitle, { color: colors.text }]} numberOfLines={1}>
                    {trackName}
                  </Text>
                  <Text style={[styles.trackRowArtist, { color: colors.textSecondary }]} numberOfLines={1}>
                    {trackArt}
                  </Text>
                </View>

                {/* Duration */}
                <Text style={[styles.trackRowDuration, { color: colors.textSecondary }]}>{trackDur}</Text>

                {/* Quick Track Options Menu */}
                <TouchableOpacity
                  style={[
                    styles.trackRowLinkBtn,
                    { backgroundColor: isDark ? 'rgba(232, 168, 124, 0.15)' : 'rgba(154, 74, 47, 0.12)' },
                  ]}
                  hitSlop={8}
                  onPress={(e) => {
                    e.stopPropagation();
                    openTrackOptions(t);
                  }}
                >
                  <Ionicons name="ellipsis-horizontal" size={16} color={colors.accent} />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Reviews, Descriptions, Lore, Community Tags (Matches web app) */}
        <MusicLoreAndReviews
          id={albumData?.id || id}
          type="album"
          title={albumTitle}
          artist={albumArtist}
          description={albumData?.description}
          tags={albumData?.tags || []}
          rating={albumData?.rating}
          totalDurationMs={totalRuntimeMs}
        />
      </ScrollView>

      {/* In-Place Liquid Glass GrooveLink Routing Modal */}
      <GrooveLinkModal
        visible={showGrooveLinkModal}
        onClose={() => {
          setShowGrooveLinkModal(false);
          setModalTrackTarget(null);
        }}
        title={modalTrackTarget ? (modalTrackTarget.title || modalTrackTarget.name) : albumTitle}
        artist={modalTrackTarget ? (modalTrackTarget.artist || albumArtist) : albumArtist}
        album={albumTitle}
        imageUrl={coverUrl}
        type={modalTrackTarget ? 'track' : 'album'}
        itemId={modalTrackTarget ? (modalTrackTarget.id || modalTrackTarget.name) : (albumData?.id || id)}
        onOpenGrooveCard={() => {
          setShowGrooveLinkModal(false);
          setTimeout(() => setShowGrooveCardModal(true), 250);
        }}
      />

      {/* Apple Music Inspired GrooveCard Composer Modal */}
      <GrooveCardModal
        visible={showGrooveCardModal}
        onClose={() => setShowGrooveCardModal(false)}
        title={modalTrackTarget ? (modalTrackTarget.title || modalTrackTarget.name) : albumTitle}
        artist={modalTrackTarget ? (modalTrackTarget.artist || albumArtist) : albumArtist}
        album={albumTitle}
        imageUrl={coverUrl}
        releaseDate={releaseDate}
        type={modalTrackTarget ? 'track' : 'album'}
        itemId={modalTrackTarget ? (modalTrackTarget.id || modalTrackTarget.name) : (albumData?.id || id)}
      />

      {/* Universal Playlist Picker Modal */}
      <PlaylistPickerModal
        visible={showPlaylistPickerModal}
        onClose={() => {
          setShowPlaylistPickerModal(false);
          setSelectedTrackForPlaylist(null);
        }}
        track={selectedTrackForPlaylist}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#10141F',
  },
  backdropContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 420,
    overflow: 'hidden',
    zIndex: 0,
  },
  backdropImage: {
    width: '100%',
    height: '100%',
    opacity: 0.22,
  },
  backdropOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#10141F',
    opacity: 0.65,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    zIndex: 20,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(16, 20, 31, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(232, 168, 124, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleBtnActive: {
    backgroundColor: '#D4A373',
    borderColor: '#E8A87C',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 40,
    zIndex: 10,
  },
  heroCard: {
    backgroundColor: 'rgba(16, 20, 31, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(135, 0, 135, 0.2)',
    borderRadius: 28,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#870087',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.35,
        shadowRadius: 20,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  coverWrapper: {
    width: 200,
    height: 200,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    backgroundColor: '#10141F',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 8,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  metaContent: {
    width: '100%',
    alignItems: 'center',
  },
  categoryBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#E879F9',
    letterSpacing: 1.5,
  },
  albumTitleText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  subtitleText: {
    fontSize: 14,
    color: 'rgba(244, 247, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 10,
  },
  clickableLink: {
    color: '#F0ABFC',
    fontWeight: '600',
  },
  subtitleBullet: {
    color: '#8992A5',
  },
  releaseDateText: {
    color: '#8992A5',
    fontWeight: '500',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaItemText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8992A5',
    textTransform: 'uppercase',
  },
  metaItemHighlight: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F4F7FF',
  },
  metaItemGenre: {
    fontSize: 11,
    fontWeight: '700',
    color: '#E879F9',
  },
  metaDot: {
    color: '#8992A5',
    fontSize: 12,
  },
  ratingRow: {
    marginBottom: 14,
    width: '100%',
    alignItems: 'center',
  },
  overviewSection: {
    width: '100%',
    marginVertical: 10,
    paddingHorizontal: 8,
  },
  overviewText: {
    fontSize: 12,
    color: '#8992A5',
    lineHeight: 18,
    textAlign: 'left',
  },
  overviewTextClamped: {
    maxHeight: 36,
    overflow: 'hidden',
  },
  readMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  readMoreText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#E879F9',
  },
  grooveLinkSection: {
    width: '100%',
    alignItems: 'center',
    marginTop: 14,
  },
  grooveLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(232, 168, 124, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(232, 168, 124, 0.35)',
  },
  grooveLinkBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#D4A373',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  variationsSection: {
    marginBottom: 20,
  },
  sectionSubtitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#8992A5',
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  variationsScroll: {
    gap: 8,
    paddingRight: 16,
  },
  variationPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: 'rgba(16, 20, 31, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  variationPillActive: {
    backgroundColor: 'rgba(135, 0, 135, 0.3)',
    borderColor: '#E879F9',
  },
  variationPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8992A5',
  },
  variationPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  tracksSection: {
    marginBottom: 24,
    backgroundColor: 'rgba(16, 20, 31, 0.5)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: 16,
  },
  tracksHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  tracksHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tracksHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  tracksCountBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  tracksCountBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8992A5',
  },
  runtimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(232, 168, 124, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(232, 168, 124, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  runtimeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D4A373',
  },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  trackNumText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8992A5',
    width: 28,
  },
  trackMainInfo: {
    flex: 1,
    marginRight: 10,
  },
  trackRowTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  trackRowArtist: {
    fontSize: 11,
    color: '#8992A5',
  },
  trackRowDuration: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8992A5',
    marginRight: 12,
  },
  trackRowLinkBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(232, 168, 124, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
