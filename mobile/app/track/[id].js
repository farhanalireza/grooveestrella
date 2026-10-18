// app/track/[id].js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  FadeInDown,
} from 'react-native-reanimated';
import { COLORS } from '../../src/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../src/context/ThemeContext';
import { ApiService } from '../../src/services/api';
import { StorageService } from '../../src/services/storage';
import {
  RatingPieChart,
  GrooveLinkModal,
  GrooveCardModal,
  MusicLoreAndReviews,
  GrooveLoader,
  GrooveAppBar,
} from '../../src/components';

function msToMmSs(ms) {
  if (!ms) return '00:00';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const paddedMinutes = String(minutes).padStart(2, '0');
  const paddedSeconds = String(seconds).padStart(2, '0');
  return `${paddedMinutes}:${paddedSeconds}`;
}

export default function TrackDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const [track, setTrack] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [expandedHeroDesc, setExpandedHeroDesc] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [qrFullScreen, setQrFullScreen] = useState(false);
  const [showGrooveLinkModal, setShowGrooveLinkModal] = useState(false);
  const [showGrooveCardModal, setShowGrooveCardModal] = useState(false);

  // Spinning Vinyl Animation
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, {
        duration: 15000,
        easing: Easing.linear,
      }),
      -1,
      false
    );
  }, [rotation]);

  const spinStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });

  useEffect(() => {
    let mounted = true;
    async function loadData() {
      if (!id) return;
      setLoading(true);
      try {
        const [trackData, isSaved] = await Promise.all([
          ApiService.fetchTrack(String(id)),
          StorageService.isSongSaved(String(id)),
        ]);
        if (mounted) {
          setTrack(trackData);
          setSaved(isSaved);
        }
      } catch (err) {
        console.warn('Track loading error:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      mounted = false;
    };
  }, [id]);

  const handleToggleSave = async () => {
    if (!track) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const actualId = String(track.id || id);
    const trackName = track.title || track.name || 'Track';

    if (saved) {
      await StorageService.removeSavedSong(actualId);
      setSaved(false);
      Toast.show({
        type: 'info',
        text1: 'Removed from Library',
        text2: `"${trackName}" removed from your bookmarks`,
      });
    } else {
      await StorageService.saveSong({
        id: actualId,
        trackId: actualId,
        title: trackName,
        name: trackName,
        artist: track.artist,
        album: track.album,
        image: track.coverArt || track.image,
        type: 'track',
      });
      setSaved(true);
      Toast.show({
        type: 'success',
        text1: 'Saved to Library 🎶',
        text2: `"${trackName}" bookmarked in your collection`,
      });
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
        <GrooveLoader fullScreen text="Loading Track Details..." />
      </SafeAreaView>
    );
  }

  const trackTitle = track?.title || track?.name || 'Unknown Track';
  const trackArtist = track?.artist || 'Unknown Artist';
  const trackAlbum = track?.album || '';
  const coverUrl = track?.coverArt || track?.image || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=600&auto=format&fit=crop&q=80';
  const durationText = msToMmSs(track?.duration_ms || track?.duration);
  const popularityScore = track?.popularity || 85;
  const canonicalMbid = track?.id || id;
  const canonicalTrackUrl = `https://grooveestrella.com/s/musicbrainz/track/${canonicalMbid}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&color=${(colors.accent || '#E8A87C').replace('#', '')}&bgcolor=${(colors.bg || '#17020B').replace('#', '')}&ecc=H&data=${encodeURIComponent(canonicalTrackUrl)}`;

  const artistsList = Array.isArray(track?.artists)
    ? track.artists
    : [{ name: trackArtist }];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]} edges={['left', 'right']}>
      {/* Dynamic Ambient Art-Cover Gradient Backdrop */}
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

      {/* Apple Music Style Unified App Bar */}
      <GrooveAppBar
        title={trackTitle}
        subtitle={trackArtist}
        saved={saved}
        onToggleSave={handleToggleSave}
        showQR={showQR}
        onQRCode={() => setShowQR(!showQR)}
        onShare={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          setShowGrooveCardModal(true);
        }}
        onOpenLink={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
        {/* Hero Card Container (matches web app Track Card) */}
        <Animated.View entering={FadeInDown.duration(400)} style={[styles.heroCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          {/* Spinning Vinyl Record Hero Component */}
          <View style={styles.vinylContainer}>
            {/* Spinning Vinyl Grooved Disc */}
            <Animated.View style={[styles.vinylDisc, spinStyle, { backgroundColor: isDark ? '#2D0717' : '#FFF5EB', borderColor: colors.border }]}>
              <View style={[styles.vinylGroove1, { borderColor: colors.border }]}>
                <View style={[styles.vinylGroove2, { borderColor: colors.border }]}>
                  <View style={[styles.vinylGroove3, { borderColor: colors.border }]} />
                </View>
              </View>
            </Animated.View>

            {/* Spinning Center Artwork Cover Label */}
            <Animated.View style={[styles.artworkLabelWrapper, spinStyle]}>
              <Image source={{ uri: coverUrl }} style={styles.artworkLabelImage} resizeMode="cover" />
            </Animated.View>
          </View>

          {/* Track Metadata */}
          <View style={styles.metaContent}>
            {/* Category Label */}
            <View style={[styles.categoryBadgeRow, { backgroundColor: isDark ? 'rgba(181, 190, 221, 0.15)' : 'rgba(71, 11, 36, 0.08)', borderColor: colors.border, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 }]}>
              <Ionicons name="musical-notes" size={13} color={colors.accent} />
              <Text style={[styles.categoryBadgeText, { color: colors.accent }]}>TRACK DETAILS</Text>
            </View>

            {/* Track Title */}
            <Text style={[styles.trackTitleText, { color: colors.text }]}>{trackTitle}</Text>

            {/* Artist and Album Subtitle */}
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
              {trackAlbum ? (
                <>
                  <Text style={[styles.subtitleBullet, { color: colors.textSecondary }]}> • </Text>
                  <Text
                    style={[styles.clickableAlbum, { color: colors.textSecondary, fontWeight: '600' }]}
                    onPress={() => {
                      if (track.albumId) {
                        router.push(`/album/${track.albumId}`);
                      } else {
                        router.push(`/album/${encodeURIComponent(trackAlbum)}`);
                      }
                    }}
                  >
                    {trackAlbum}
                  </Text>
                </>
              ) : null}
            </Text>

            {/* Meta Row: Duration + Score */}
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                <Text style={[styles.metaItemText, { color: colors.textSecondary }]}>{durationText}</Text>
              </View>
              <Text style={[styles.metaDot, { color: colors.textSecondary }]}>•</Text>
              <View style={styles.metaItem}>
                <Ionicons name="trophy-outline" size={14} color={colors.textSecondary} />
                <Text style={[styles.metaItemText, { color: colors.textSecondary }]}>Score: {popularityScore}</Text>
              </View>
            </View>

            {/* Circular Groove Score RatingPieChart */}
            <View style={styles.ratingRow}>
              <RatingPieChart rating={track?.rating || { value: popularityScore / 20 }} />
            </View>

            {/* Collapsible Lore Overview */}
            {track?.description ? (
              <View style={styles.overviewSection}>
                <Text
                  style={[
                    styles.overviewText,
                    !expandedHeroDesc && styles.overviewTextClamped,
                    { color: colors.textSecondary },
                  ]}
                >
                  {track.description}
                </Text>
                {track.description.length > 100 && (
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
                    backgroundColor: isDark ? 'rgba(232, 168, 124, 0.12)' : 'rgba(154, 74, 47, 0.08)',
                    borderColor: isDark ? 'rgba(232, 168, 124, 0.3)' : 'rgba(154, 74, 47, 0.25)',
                  },
                ]}
                activeOpacity={0.8}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowGrooveLinkModal(true);
                }}
              >
                <Ionicons name="link" size={15} color={colors.accent} style={{ marginRight: 6 }} />
                <Text style={[styles.grooveLinkBtnText, { color: colors.text }]}>Open GrooveLink</Text>
                <Ionicons name="chevron-forward" size={14} color={colors.accent} style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        {/* QR Code Sharing Banner (if toggled) */}
        {showQR && (
          <Animated.View entering={FadeInDown.duration(300)} style={[styles.qrCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            <Text style={[styles.qrTitle, { color: colors.text }]}>SCAN TO SHARE TRACK</Text>
            <TouchableOpacity
              activeOpacity={0.9}
              style={[
                styles.qrImageWrapper,
                {
                  backgroundColor: colors.cardBg,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => setQrFullScreen(true)}
            >
              <Image source={{ uri: qrCodeUrl }} style={styles.qrImage} />
              <View style={[styles.qrLogoBadge, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                <Image
                  source={require('../../assets/icon.png')}
                  style={styles.qrAppLogo}
                  resizeMode="contain"
                />
              </View>
            </TouchableOpacity>
            <Text style={[styles.qrDescription, { color: colors.textSecondary }]}>
              Scan this QR code with any camera to open this track card instantly. Tap code to view full-screen.
            </Text>
          </Animated.View>
        )}

        {/* Fullscreen QR Modal */}
        {qrFullScreen && (
          <Modal transparent animationType="fade" visible={qrFullScreen} onRequestClose={() => setQrFullScreen(false)}>
            <Pressable style={styles.modalBackdrop} onPress={() => setQrFullScreen(false)}>
              <View style={[styles.modalContent, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]} onStartShouldSetResponder={() => true}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>SCAN QR CODE</Text>
                <View style={[styles.modalQrWrapper, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                  <Image source={{ uri: qrCodeUrl }} style={styles.modalQrImage} />
                  <View style={[styles.modalQrLogo, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                    <Image
                      source={require('../../assets/icon.png')}
                      style={styles.modalQrLogoIcon}
                      resizeMode="contain"
                    />
                  </View>
                </View>
                <Text style={[styles.modalSub, { color: colors.textSecondary }]}>Scan with your phone's camera to instantly view and share this track card.</Text>
                <TouchableOpacity
                  style={[styles.modalCloseBtn, { backgroundColor: colors.accent }]}
                  onPress={() => setQrFullScreen(false)}
                >
                  <Text style={[styles.modalCloseText, { color: isDark ? '#17020B' : '#FFFFFF' }]}>CLOSE</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Modal>
        )}

        {/* Reviews, Descriptions, Lore, Community Tags (Matches web app) */}
        <MusicLoreAndReviews
          id={track?.id || id}
          type="track"
          title={trackTitle}
          artist={trackArtist}
          description={track?.description}
          tags={track?.tags || []}
          rating={track?.rating}
          totalDurationMs={track?.duration_ms || track?.duration}
        />
      </ScrollView>

      {/* In-Place Liquid Glass GrooveLink Routing Modal */}
      <GrooveLinkModal
        visible={showGrooveLinkModal}
        onClose={() => setShowGrooveLinkModal(false)}
        title={trackTitle}
        artist={trackArtist}
        album={trackAlbum}
        imageUrl={coverUrl}
        type="track"
        itemId={track?.id || id}
        onOpenGrooveCard={() => {
          setShowGrooveLinkModal(false);
          setTimeout(() => setShowGrooveCardModal(true), 250);
        }}
      />

      {/* Apple Music Inspired GrooveCard Composer Modal */}
      <GrooveCardModal
        visible={showGrooveCardModal}
        onClose={() => setShowGrooveCardModal(false)}
        title={trackTitle}
        artist={trackArtist}
        album={trackAlbum}
        imageUrl={coverUrl}
        releaseDate={track?.releaseDate || track?.releaseYear}
        type="track"
        itemId={track?.id || id}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#17020B',
  },
  backdropContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 380,
    overflow: 'hidden',
    zIndex: 0,
  },
  backdropImage: {
    width: '100%',
    height: '100%',
    opacity: 0.18,
  },
  backdropOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#17020B',
    opacity: 0.7,
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
    backgroundColor: 'rgba(23, 2, 11, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(232, 168, 124, 0.2)',
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
    backgroundColor: 'rgba(23, 2, 11, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(232, 168, 124, 0.15)',
    borderRadius: 28,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.4,
        shadowRadius: 20,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  vinylContainer: {
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  vinylDisc: {
    position: 'absolute',
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: '#17020B',
    borderWidth: 4,
    borderColor: '#2D0717',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
    elevation: 8,
  },
  vinylGroove1: {
    width: '90%',
    height: '90%',
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(232, 168, 124, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vinylGroove2: {
    width: '80%',
    height: '80%',
    borderRadius: 90,
    borderWidth: 1,
    borderColor: 'rgba(232, 168, 124, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vinylGroove3: {
    width: '70%',
    height: '70%',
    borderRadius: 80,
    borderWidth: 1,
    borderColor: 'rgba(232, 168, 124, 0.12)',
  },
  artworkLabelWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#2D0717',
    backgroundColor: '#17020B',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  artworkLabelImage: {
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
    color: '#E8A87C',
    letterSpacing: 1.5,
  },
  trackTitleText: {
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
    color: '#FFFFFF',
    fontWeight: '600',
  },
  subtitleBullet: {
    color: '#A89E92',
  },
  clickableAlbum: {
    color: '#A89E92',
    fontWeight: '500',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaItemText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#A89E92',
    textTransform: 'uppercase',
  },
  metaDot: {
    color: '#A89E92',
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
    color: '#A89E92',
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
    color: '#E8A87C',
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
    backgroundColor: 'rgba(232, 168, 124, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(232, 168, 124, 0.3)',
  },
  grooveLinkBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#F4F7FF',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  qrCard: {
    backgroundColor: 'rgba(23, 2, 11, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(232, 168, 124, 0.15)',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  qrTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1.2,
    marginBottom: 14,
  },
  qrImageWrapper: {
    width: 160,
    height: 160,
    borderRadius: 16,
    backgroundColor: '#17020B',
    borderWidth: 1,
    borderColor: 'rgba(232, 168, 124, 0.25)',
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 12,
  },
  qrImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  qrLogoBadge: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2D0717',
    borderWidth: 1.5,
    borderColor: 'rgba(232, 168, 124, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  qrAppLogo: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
  },
  qrDescription: {
    fontSize: 11,
    color: '#A89E92',
    textAlign: 'center',
    lineHeight: 16,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#230413',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(232, 168, 124, 0.3)',
    padding: 24,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1.5,
    marginBottom: 16,
  },
  modalQrWrapper: {
    width: 200,
    height: 200,
    borderRadius: 20,
    backgroundColor: '#17020B',
    borderWidth: 1,
    borderColor: 'rgba(232, 168, 124, 0.3)',
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 16,
  },
  modalQrImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  modalQrLogo: {
    position: 'absolute',
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#2D0717',
    borderWidth: 2,
    borderColor: 'rgba(232, 168, 124, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 5,
  },
  modalQrLogoIcon: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
  },
  modalSub: {
    fontSize: 12,
    color: '#A89E92',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
  },
  modalCloseBtn: {
    backgroundColor: '#D4A373',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 14,
  },
  modalCloseText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#17020B',
    letterSpacing: 1,
  },
});
