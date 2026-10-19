// mobile/app/track/[id].js
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
  Modal,
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
import GrooveLogo from '../../src/components/GrooveLogo';

function msToMmSs(ms) {
  if (!ms) return '00:00';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
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
  const [qrFullScreen, setQrFullScreen] = useState(false);

  // Modals state
  const [showGrooveLinkModal, setShowGrooveLinkModal] = useState(false);
  const [showGrooveCardModal, setShowGrooveCardModal] = useState(false);
  const [showPlaylistPickerModal, setShowPlaylistPickerModal] = useState(false);

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

  // Clean Genre Filter: Discard hashtags, numbers, catalog tags
  const validGenres = useMemo(() => {
    const rawList = track?.genres || track?.tags || [];
    const valid = [];
    const seen = new Set();
    for (const t of rawList) {
      const raw = typeof t === 'string' ? t : (t?.name || '');
      if (!raw) continue;
      const clean = raw.trim();
      const lower = clean.toLowerCase();
      if (lower.includes('#') || /^\d/.test(lower) || /^#?\d{2,4}s?$/i.test(lower) || lower.length < 3) continue;

      const ignored = new Set([
        'album', 'albums', 'ep', 'single', 'singles', 'lp', 'cd', 'vinyl', 'audio',
        'favorite', 'favourites', 'favorites', 'favourite', 'seen live',
        'owned', 'wishlist', 'my collection', 'all time favorite', 'classic'
      ]);
      if (ignored.has(lower)) continue;

      if (!seen.has(lower)) {
        seen.add(lower);
        valid.push(clean.split(/[\s-]+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' '));
      }
    }
    return valid;
  }, [track?.genres, track?.tags]);

  const displayGenre = validGenres.length > 0 ? validGenres[0] : null;

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
        <GrooveLoader fullScreen text="Loading Track Details..." />
      </SafeAreaView>
    );
  }

  const trackTitle = track?.title || track?.name || 'Unknown Track';
  const trackArtist = track?.artist || 'Unknown Artist';
  const albumName = track?.album?.name || track?.album || '';
  const albumId = track?.album?.id || track?.albumID || '';
  const coverUrl = track?.coverArt || track?.image || track?.album?.images?.[0]?.url || 'https://placehold.co/600x600/17020B/E8A87C?text=Track';
  const durationText = msToMmSs(track?.duration_ms || track?.duration);
  const releaseYear = track?.releaseYear || (track?.releaseDate ? new Date(track.releaseDate).getFullYear() : 'Track');
  const popularityScore = track?.popularity || 85;
  const canonicalUrl = `https://groove.amplecen.com/track/${id}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&color=d4af37&bgcolor=ffffff&ecc=H&data=${encodeURIComponent(canonicalUrl)}`;

  const artistsList = Array.isArray(track?.artists)
    ? track.artists
    : [{ name: trackArtist }];

  const shareTitle = `${trackTitle} - ${trackArtist}`;
  const shareMessage = `Check out "${trackTitle}" by ${trackArtist} on GrooveEstrella! 🎵`;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]} edges={['left', 'right']}>
      {/* Dynamic Ambient Blur Backdrop */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <Image
          source={{ uri: coverUrl }}
          style={[StyleSheet.absoluteFillObject, { opacity: isDark ? 0.68 : 0.82 }]}
          blurRadius={Platform.OS === 'ios' ? 26 : 16}
          resizeMode="cover"
        />
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
        title={trackTitle}
        shareData={{ title: shareTitle, message: shareMessage, url: canonicalUrl }}
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
          {/* Square Artwork */}
          <View style={styles.coverWrapper}>
            <Image source={{ uri: coverUrl }} style={styles.coverImage} resizeMode="cover" />
          </View>

          {/* Track Title + Explicit [E] Badge */}
          <View style={styles.titleRow}>
            <Text style={[styles.trackTitleText, { color: colors.text }]}>{trackTitle}</Text>
            {Boolean(track?.explicit) && (
              <View style={styles.explicitBadge}>
                <Text style={styles.explicitBadgeText}>E</Text>
              </View>
            )}
          </View>

          {/* Clickable Artists List */}
          <View style={styles.artistRow}>
            {artistsList.map((a, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => {
                  if (a.id) {
                    router.push(`/artist/${a.id}`);
                  } else {
                    router.push(`/artist/${encodeURIComponent(a.name)}`);
                  }
                }}
              >
                <Text style={[styles.artistNameText, { color: colors.textSecondary }]}>
                  {a.name}{i < artistsList.length - 1 ? ', ' : ''}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Clickable Album Name */}
          {Boolean(albumName) && (
            <TouchableOpacity
              onPress={() => {
                if (albumId) router.push(`/album/${albumId}`);
              }}
              style={styles.albumLinkBtn}
            >
              <Text style={[styles.albumLinkText, { color: colors.accent }]}>
                {albumName}
              </Text>
            </TouchableOpacity>
          )}

          {/* Subtitle: Genre · Year · Duration */}
          <Text style={[styles.metaSubtitle, { color: colors.textSecondary }]}>
            {displayGenre ? `${displayGenre} · ` : ''}{releaseYear}
            {durationText ? ` · ${durationText}` : ''}
          </Text>

          {/* Centered Action Controls Row (5 buttons matching web) */}
          <View style={styles.actionRow}>
            {/* 1. Sparkles (GrooveCard) */}
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowGrooveCardModal(true);
              }}
              style={styles.circleActionBtn}
              activeOpacity={0.8}
            >
              <Ionicons name="sparkles" size={19} color="#FFF2DF" />
            </TouchableOpacity>

            {/* 2. Open GrooveLink Pill Button */}
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowGrooveLinkModal(true);
              }}
              style={[styles.grooveLinkPillBtn, { backgroundColor: colors.accent }]}
              activeOpacity={0.85}
            >
              <GrooveLogo size={16} color="#17020B" style={{ marginRight: 6 }} />
              <Text style={styles.grooveLinkPillText}>Open GrooveLink</Text>
              <Ionicons name="chevron-forward" size={14} color="#17020B" style={{ marginLeft: 2 }} />
            </TouchableOpacity>

            {/* 3. Add to Playlist Button */}
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowPlaylistPickerModal(true);
              }}
              style={styles.circleActionBtn}
              activeOpacity={0.8}
            >
              <Ionicons name="list" size={20} color="#FFF2DF" />
            </TouchableOpacity>

            {/* 4. Bookmark / Save to Library Button */}
            <TouchableOpacity
              onPress={handleToggleSave}
              style={[
                styles.circleActionBtn,
                saved && { backgroundColor: colors.accent, borderColor: colors.accent },
              ]}
              activeOpacity={0.8}
            >
              <Ionicons
                name={saved ? 'checkmark' : 'add'}
                size={22}
                color={saved ? '#17020B' : '#FFF2DF'}
              />
            </TouchableOpacity>

            {/* 5. QR Code Button (Direct full screen) */}
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setQrFullScreen(true);
              }}
              style={styles.circleActionBtn}
              activeOpacity={0.8}
            >
              <Ionicons
                name="qr-code-outline"
                size={19}
                color="#FFF2DF"
              />
            </TouchableOpacity>
          </View>

          {/* Score & Rating Pie Chart Badge */}
          <View style={styles.scoreRow}>
            <View style={[styles.scoreBadge, { backgroundColor: 'rgba(255, 255, 255, 0.08)', borderColor: 'rgba(255, 255, 255, 0.12)' }]}>
              <Ionicons name="trophy-outline" size={13} color={colors.accent} />
              <Text style={[styles.scoreText, { color: colors.text }]}>Score: {popularityScore}</Text>
            </View>
            <RatingPieChart rating={track?.rating || { value: popularityScore / 20 }} />
          </View>

          {/* Description / Overview & Lore */}
          {track?.description ? (
            <View style={styles.overviewSection}>
              <Text
                style={[
                  styles.overviewText,
                  { color: colors.textSecondary },
                  !expandedHeroDesc && styles.overviewTextClamped,
                ]}
              >
                <Text style={[styles.overviewPrefix, { color: colors.text }]}>Overview & Lore  </Text>
                {track.description}
              </Text>
              {track.description.length > 80 && (
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

        {/* Music Lore & Reviews Section */}
        <MusicLoreAndReviews
          entityType="track"
          entityId={String(track?.id || id)}
          entityTitle={trackTitle}
          entityArtist={trackArtist}
          entityImage={coverUrl}
        />
      </ScrollView>

      {/* Full-Screen QR Modal */}
      <Modal
        visible={qrFullScreen}
        transparent
        animationType="fade"
        onRequestClose={() => setQrFullScreen(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setQrFullScreen(false)}>
          <View
            style={[styles.modalCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
            onStartShouldSetResponder={() => true}
          >
            <Text style={[styles.modalTitle, { color: colors.text }]}>SCAN QR CODE</Text>
            <View style={[styles.modalQrWrapper, { backgroundColor: '#ffffff', borderRadius: 24, padding: 14 }]}>
              <Image source={{ uri: qrCodeUrl }} style={styles.modalQrImage} resizeMode="contain" />
              <View style={[styles.modalQrCenterLogo, { backgroundColor: '#ffffff', borderColor: '#e5e7eb' }]}>
                <GrooveLogo size={28} color="#d4af37" />
              </View>
            </View>
            <Text style={[styles.qrHint, { color: colors.textSecondary, textAlign: 'center', marginTop: 12 }]}>
              Scan with your phone camera to share or open this track instantly.
            </Text>
            <TouchableOpacity
              onPress={() => setQrFullScreen(false)}
              style={[styles.closeModalBtn, { backgroundColor: colors.accent, marginTop: 16 }]}
            >
              <Text style={styles.closeModalBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* GrooveLink Modal */}
      <GrooveLinkModal
        visible={showGrooveLinkModal}
        onClose={() => setShowGrooveLinkModal(false)}
        target={{
          ...track,
          id: track?.id || id,
          title: trackTitle,
          name: trackTitle,
          artist: trackArtist,
          album: albumName,
          imageUrl: coverUrl,
          coverArt: coverUrl,
          releaseDate: releaseYear,
          releaseYear: releaseYear,
          type: 'track',
        }}
        onOpenGrooveCard={() => setShowGrooveCardModal(true)}
      />

      {/* GrooveCard Modal */}
      <GrooveCardModal
        visible={showGrooveCardModal}
        onClose={() => setShowGrooveCardModal(false)}
        item={{
          ...track,
          id: track?.id || id,
          title: trackTitle,
          name: trackTitle,
          artist: trackArtist,
          album: albumName,
          imageUrl: coverUrl,
          coverArt: coverUrl,
          releaseDate: releaseYear,
          releaseYear: releaseYear,
          type: 'track',
        }}
      />

      {/* Playlist Picker Modal */}
      <PlaylistPickerModal
        visible={showPlaylistPickerModal}
        onClose={() => setShowPlaylistPickerModal(false)}
        track={{
          ...track,
          id: track?.id || id,
          title: trackTitle,
          name: trackTitle,
          artist: trackArtist,
          image: coverUrl,
          coverArt: coverUrl,
          album: albumName,
        }}
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
  coverImage: {
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
  trackTitleText: {
    fontSize: 24,
    fontWeight: '800',
    fontFamily: FONTS.display,
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  explicitBadge: {
    width: 17,
    height: 17,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  explicitBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    fontFamily: FONTS.display,
    color: '#FFF2DF',
  },
  artistRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 4,
  },
  artistNameText: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: FONTS.bodySemiBold,
    textAlign: 'center',
  },
  albumLinkBtn: {
    marginTop: 4,
  },
  albumLinkText: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: FONTS.bodyMedium,
    textAlign: 'center',
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
    gap: 10,
    marginTop: 22,
  },
  circleActionBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
  grooveLinkPillBtn: {
    height: 44,
    paddingHorizontal: 20,
    borderRadius: 22,
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
  grooveLinkPillText: {
    fontSize: 13,
    fontWeight: '800',
    fontFamily: FONTS.display,
    color: '#17020B',
    letterSpacing: 0.2,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 18,
  },
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
    borderWidth: 1,
    gap: 6,
  },
  scoreText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: FONTS.bodyBold,
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
  overviewPrefix: {
    fontWeight: '800',
    fontFamily: FONTS.display,
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
  qrCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  qrTitle: {
    fontSize: 11,
    fontWeight: '800',
    fontFamily: FONTS.display,
    letterSpacing: 1,
    marginBottom: 14,
  },
  qrCodeWrapper: {
    width: 170,
    height: 170,
    borderRadius: 18,
    borderWidth: 1,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  qrImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  qrCenterLogo: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrHint: {
    fontSize: 12,
    fontFamily: FONTS.body,
    textAlign: 'center',
    marginTop: 12,
    maxWidth: 240,
    lineHeight: 17,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 28,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 13,
    fontWeight: '800',
    fontFamily: FONTS.display,
    letterSpacing: 1,
    marginBottom: 18,
  },
  modalQrWrapper: {
    width: 220,
    height: 220,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalQrImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  modalQrCenterLogo: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeModalBtn: {
    marginTop: 22,
    paddingVertical: 10,
    paddingHorizontal: 28,
    borderRadius: 9999,
  },
  closeModalBtnText: {
    fontSize: 13,
    fontWeight: '800',
    fontFamily: FONTS.display,
    color: '#17020B',
  },
});
