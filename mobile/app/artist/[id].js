// mobile/app/artist/[id].js
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
  Alert,
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

function formatFollowers(num) {
  if (!num) return '1M';
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${Math.floor(num / 1000)}K`;
  return String(num);
}

function formatDuration(ms) {
  if (!ms) return '03:30';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export default function ArtistDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const [artist, setArtist] = useState(null);
  const [topTracks, setTopTracks] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [expandedHeroDesc, setExpandedHeroDesc] = useState(false);

  // Modals state
  const [showGrooveLinkModal, setShowGrooveLinkModal] = useState(false);
  const [showGrooveCardModal, setShowGrooveCardModal] = useState(false);
  const [showPlaylistPickerModal, setShowPlaylistPickerModal] = useState(false);
  const [selectedTrackForPlaylist, setSelectedTrackForPlaylist] = useState(null);
  const [modalItemTarget, setModalItemTarget] = useState(null);

  // Filter strictly for studio albums in reverse chronological order (matching web app)
  const studioAlbums = useMemo(() => {
    if (!albums || !albums.length) return [];
    const filtered = albums.filter((alb) => {
      const pType = (alb.primaryType || alb.typeCategory || 'album').toLowerCase();
      const sTypes = alb.secondaryTypes || [];
      const isComp = sTypes.some(s => (s || '').toLowerCase().includes('compilation')) || (alb.title || alb.name || '').toLowerCase().includes('compilation');
      const isLive = sTypes.some(s => (s || '').toLowerCase().includes('live')) || (alb.title || alb.name || '').toLowerCase().includes('live');
      const isRemix = sTypes.some(s => (s || '').toLowerCase().includes('remix'));
      const isEp = pType === 'ep' || (alb.title || alb.name || '').toLowerCase().includes(' ep');
      const isSingle = pType === 'single';
      return !isComp && !isLive && !isRemix && !isEp && !isSingle;
    });

    return [...filtered].sort((a, b) => {
      const ya = a.releaseYear || (a.releaseDate ? new Date(a.releaseDate).getFullYear() : 0);
      const yb = b.releaseYear || (b.releaseDate ? new Date(b.releaseDate).getFullYear() : 0);
      if (ya !== yb) return yb - ya;
      return (b.releaseDate || '').localeCompare(a.releaseDate || '');
    });
  }, [albums]);

  // Clean Genre Filter: Discard hashtags, numbers, catalog tags
  const validGenres = useMemo(() => {
    const rawList = artist?.genres || artist?.tags || [];
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
    return valid.slice(0, 6);
  }, [artist?.genres, artist?.tags]);

  useEffect(() => {
    let mounted = true;
    async function loadArtistData() {
      if (!id) return;
      setLoading(true);
      try {
        const [artistData, isSaved] = await Promise.all([
          ApiService.fetchArtist(String(id)),
          StorageService.isArtistSaved(String(id)),
        ]);
        if (mounted) {
          setArtist(artistData);
          setTopTracks(artistData?.topTracks || []);
          setAlbums(artistData?.albums || []);
          setSaved(isSaved);
        }
      } catch (err) {
        console.warn('Artist loading error:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadArtistData();
    return () => {
      mounted = false;
    };
  }, [id]);

  const handleToggleSave = async () => {
    if (!artist) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const actualId = String(artist.id || id);
    const artistName = artist.name || artist.title || 'Artist';

    if (saved) {
      await StorageService.removeSavedArtist(actualId);
      setSaved(false);
      Toast.show({
        type: 'info',
        text1: 'Unfollowed Artist',
        text2: `You unfollowed ${artistName}`,
      });
    } else {
      await StorageService.saveArtist({
        id: actualId,
        name: artistName,
        title: artistName,
        image: artist.coverArt || artist.image || artist.images?.[0]?.url,
        followers: artist.followers,
        type: 'artist',
      });
      setSaved(true);
      Toast.show({
        type: 'success',
        text1: 'Following Artist 🎙️',
        text2: `${artistName} added to your followed artists`,
      });
    }
  };

  const openTrackOptions = (trackItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const trackName = trackItem.title || trackItem.name || 'Track';

    Alert.alert(
      trackName,
      artistName,
      [
        {
          text: 'Add to Playlist',
          onPress: () => {
            setSelectedTrackForPlaylist({
              ...trackItem,
              image: trackItem.coverArt || avatarUrl,
              coverArt: trackItem.coverArt || avatarUrl,
              artist: artistName,
            });
            setShowPlaylistPickerModal(true);
          },
        },
        {
          text: 'Open in GrooveLink',
          onPress: () => {
            setModalItemTarget(trackItem);
            setShowGrooveLinkModal(true);
          },
        },
        {
          text: 'Share via GrooveCard',
          onPress: () => {
            setModalItemTarget(trackItem);
            setShowGrooveCardModal(true);
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
        <GrooveLoader fullScreen text="Loading Artist..." />
      </SafeAreaView>
    );
  }

  const artistName = artist?.name || artist?.title || 'Unknown Artist';
  const avatarUrl = artist?.coverArt || artist?.image || artist?.images?.[0]?.url || 'https://placehold.co/600x600/17020B/E8A87C?text=Artist';
  const followersCount = formatFollowers(artist?.followers || 15000000);
  const popularityScore = artist?.popularity || 85;

  const shareTitle = `${artistName} on GrooveEstrella`;
  const shareMessage = `Explore "${artistName}" on GrooveEstrella! 🎙️`;
  const shareUrl = `https://grooveestrella.com/artist/${id}`;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]} edges={['left', 'right']}>
      {/* Dynamic Ambient Blur Backdrop */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <Image
          source={{ uri: avatarUrl }}
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
        title={artistName}
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
          {/* Circular Artist Avatar */}
          <View style={styles.avatarWrapper}>
            <Image source={{ uri: avatarUrl }} style={styles.avatarImage} resizeMode="cover" />
          </View>

          {/* Artist Name */}
          <View style={styles.titleRow}>
            <Text style={[styles.artistNameText, { color: colors.text }]}>{artistName}</Text>
          </View>

          {/* Clean Genre Pills */}
          {validGenres.length > 0 && (
            <View style={styles.genresRow}>
              {validGenres.map((g, idx) => (
                <View key={idx} style={[styles.genrePill, { backgroundColor: 'rgba(255, 255, 255, 0.08)', borderColor: 'rgba(255, 255, 255, 0.12)' }]}>
                  <Text style={[styles.genrePillText, { color: colors.accent }]}>{g}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Meta: Country · Followers · Score */}
          <Text style={[styles.metaSubtitle, { color: colors.textSecondary }]}>
            {artist?.country ? `${artist.country} · ` : ''}{followersCount} followers · Score: {popularityScore}
          </Text>

          {/* Rating Pie Chart */}
          <View style={styles.ratingRow}>
            <RatingPieChart rating={artist?.rating || { value: popularityScore / 20 }} />
          </View>

          {/* Action Row: Sparkles (GrooveCard) | Open GrooveLink | Follow/Bookmark */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setModalItemTarget(null);
                setShowGrooveCardModal(true);
              }}
              style={styles.circleActionBtn}
              activeOpacity={0.8}
            >
              <Ionicons name="sparkles" size={19} color="#FFF2DF" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setModalItemTarget(null);
                setShowGrooveLinkModal(true);
              }}
              style={[styles.grooveLinkPillBtn, { backgroundColor: colors.accent }]}
              activeOpacity={0.85}
            >
              <GrooveLogo size={16} color="#17020B" style={{ marginRight: 6 }} />
              <Text style={styles.grooveLinkPillText}>Open GrooveLink</Text>
              <Ionicons name="chevron-forward" size={14} color="#17020B" style={{ marginLeft: 2 }} />
            </TouchableOpacity>

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
          </View>

          {/* Overview & Lore */}
          {artist?.description ? (
            <View style={styles.overviewSection}>
              <Text
                style={[
                  styles.overviewText,
                  { color: colors.textSecondary },
                  !expandedHeroDesc && styles.overviewTextClamped,
                ]}
              >
                {artist.description}
              </Text>
              {artist.description.length > 80 && (
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

        {/* Top Songs List */}
        {topTracks.length > 0 && (
          <View style={styles.sectionBlock}>
            <View style={[styles.sectionHeaderRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.sectionTitleText, { color: colors.text }]}>Top Songs</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
            </View>

            <View style={styles.trackList}>
              {topTracks.map((track, index) => {
                const trackTitle = track.title || track.name;
                const albumTitle = track.album?.name || track.album || artistName;
                const releaseYear = track.releaseYear || (track.releaseDate ? new Date(track.releaseDate).getFullYear() : null);
                const coverImg = track.url || track.coverArt || avatarUrl;
                const isExplicit = Boolean(track.explicit);
                const dur = formatDuration(track.duration || track.duration_ms);

                return (
                  <TouchableOpacity
                    key={`${track.id || 'track'}-${index}`}
                    onPress={() => {
                      if (track.id) router.push(`/track/${track.id}`);
                    }}
                    activeOpacity={0.7}
                    style={[styles.trackRow, { borderBottomColor: 'rgba(255, 255, 255, 0.08)' }]}
                  >
                    <Image source={{ uri: coverImg }} style={styles.trackThumb} resizeMode="cover" />

                    <View style={styles.trackCenter}>
                      <View style={styles.trackTitleRow}>
                        <Text style={[styles.trackTitle, { color: colors.text }]} numberOfLines={1}>
                          {trackTitle}
                        </Text>
                        {isExplicit && (
                          <View style={styles.trackExplicitBadge}>
                            <Text style={styles.trackExplicitBadgeText}>E</Text>
                          </View>
                        )}
                      </View>
                      <Text style={[styles.trackSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
                        {albumTitle}{releaseYear ? ` (${releaseYear})` : ''}
                      </Text>
                    </View>

                    <Text style={[styles.trackDuration, { color: colors.textSecondary }]}>
                      {dur}
                    </Text>

                    <TouchableOpacity
                      onPress={() => openTrackOptions(track)}
                      style={styles.moreBtn}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="ellipsis-horizontal" size={18} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Studio Albums Grid (Reverse Chronological) */}
        {studioAlbums.length > 0 && (
          <View style={styles.sectionBlock}>
            <View style={[styles.sectionHeaderRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.sectionTitleText, { color: colors.text }]}>Studio Albums</Text>
              <Text style={[styles.sectionCountText, { color: colors.accent }]}>
                {studioAlbums.length} albums
              </Text>
            </View>

            <View style={styles.albumsGrid}>
              {studioAlbums.map((alb, index) => {
                const albId = alb.id;
                const albTitle = alb.title || alb.name;
                const albCover = alb.coverArt || alb.image || alb.images?.[0]?.url || avatarUrl;
                const albYear = alb.releaseYear || (alb.releaseDate ? new Date(alb.releaseDate).getFullYear() : null);

                return (
                  <TouchableOpacity
                    key={`${albId}-${index}`}
                    onPress={() => {
                      if (albId) router.push(`/album/${albId}`);
                    }}
                    style={styles.albumGridCard}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.albumCoverContainer, { borderColor: colors.border }]}>
                      <Image source={{ uri: albCover }} style={styles.albumCoverImg} resizeMode="cover" />
                    </View>
                    <Text style={[styles.albumGridTitle, { color: colors.text }]} numberOfLines={1}>
                      {albTitle}
                    </Text>
                    <Text style={[styles.albumGridYear, { color: colors.textSecondary }]}>
                      {albYear || 'Album'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Music Lore & Reviews Section */}
        <MusicLoreAndReviews
          entityType="artist"
          entityId={String(artist?.id || id)}
          entityTitle={artistName}
          entityArtist={artistName}
          entityImage={avatarUrl}
        />
      </ScrollView>

      {/* GrooveLink Modal */}
      <GrooveLinkModal
        visible={showGrooveLinkModal}
        onClose={() => setShowGrooveLinkModal(false)}
        target={modalItemTarget || { ...artist, type: 'artist' }}
      />

      {/* GrooveCard Modal */}
      <GrooveCardModal
        visible={showGrooveCardModal}
        onClose={() => setShowGrooveCardModal(false)}
        item={modalItemTarget || { ...artist, type: 'artist' }}
      />

      {/* Playlist Picker Modal */}
      <PlaylistPickerModal
        visible={showPlaylistPickerModal}
        onClose={() => setShowPlaylistPickerModal(false)}
        track={selectedTrackForPlaylist}
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
  avatarWrapper: {
    width: 200,
    height: 200,
    borderRadius: 100,
    overflow: 'hidden',
    backgroundColor: 'rgba(71, 11, 36, 0.4)',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
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
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  titleRow: {
    marginTop: 18,
    paddingHorizontal: 12,
  },
  artistNameText: {
    fontSize: 26,
    fontWeight: '800',
    fontFamily: FONTS.display,
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  genresRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
  },
  genrePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    borderWidth: 1,
  },
  genrePillText: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: FONTS.display,
    letterSpacing: 0.5,
  },
  metaSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: FONTS.body,
    marginTop: 6,
    opacity: 0.75,
  },
  ratingRow: {
    marginTop: 8,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 18,
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
  grooveLinkPillBtn: {
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
  grooveLinkPillText: {
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
  sectionBlock: {
    marginBottom: 28,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
    marginBottom: 10,
    borderBottomWidth: 1,
  },
  sectionTitleText: {
    fontSize: 16,
    fontWeight: '800',
    fontFamily: FONTS.display,
  },
  sectionCountText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: FONTS.bodyBold,
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
  trackThumb: {
    width: 42,
    height: 42,
    borderRadius: 8,
    marginRight: 10,
  },
  trackCenter: {
    flex: 1,
    minWidth: 0,
    marginRight: 10,
  },
  trackTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trackTitle: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: FONTS.displaySemiBold,
    flexShrink: 1,
  },
  trackExplicitBadge: {
    width: 14,
    height: 14,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackExplicitBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    fontFamily: FONTS.display,
    color: '#FFF2DF',
  },
  trackSubtitle: {
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
  albumsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  albumGridCard: {
    width: '48%',
    marginBottom: 8,
  },
  albumCoverContainer: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    marginBottom: 6,
    backgroundColor: 'rgba(71, 11, 36, 0.4)',
  },
  albumCoverImg: {
    width: '100%',
    height: '100%',
  },
  albumGridTitle: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: FONTS.displaySemiBold,
  },
  albumGridYear: {
    fontSize: 11,
    fontFamily: FONTS.body,
    marginTop: 1,
    opacity: 0.7,
  },
});
