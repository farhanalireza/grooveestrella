// app/artist/[id].js
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
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';
import Animated, { FadeInDown } from 'react-native-reanimated';
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
} from '../../src/components';

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

  const [artist, setArtist] = useState(null);
  const [topTracks, setTopTracks] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [expandedHeroDesc, setExpandedHeroDesc] = useState(false);

  // Modals state
  const [showGrooveLinkModal, setShowGrooveLinkModal] = useState(false);
  const [showGrooveCardModal, setShowGrooveCardModal] = useState(false);
  const [modalItemTarget, setModalItemTarget] = useState(null);

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
        image: artist.coverArt || artist.image,
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

  const openItemInGrooveLink = (item, type = 'track') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setModalItemTarget({ ...item, type });
    setShowGrooveLinkModal(true);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <GrooveLoader fullScreen text="Loading Artist Profile..." />
      </SafeAreaView>
    );
  }

  const artistName = artist?.name || artist?.title || 'Unknown Artist';
  const avatarUrl = artist?.coverArt || artist?.image || 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=800&auto=format&fit=crop&q=80';
  const genres = artist?.genres || ['Rock', 'Classic Rock'];
  const followersCount = formatFollowers(artist?.followers || 15000000);
  const popularityScore = artist?.popularity || 90;

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
      {/* Ambient Backdrop Glow */}
      <View style={styles.backdropContainer}>
        <Image source={{ uri: avatarUrl }} style={styles.backdropImage} blurRadius={Platform.OS === 'ios' ? 70 : 25} />
        <View style={styles.backdropOverlay} />
      </View>

      {/* Top Apple Music Style Unified App Bar */}
      <GrooveAppBar
        title={artistName}
        subtitle="Artist Profile"
        saved={saved}
        onToggleSave={handleToggleSave}
        onShare={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          setModalItemTarget(null);
          setShowGrooveCardModal(true);
        }}
        onOpenLink={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setModalItemTarget(null);
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
        {/* Hero Card Container (Matches web app Artist Card - Image 3) */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.heroCard}>
          {/* Circular Artist Avatar */}
          <View style={styles.avatarWrapper}>
            <Image source={{ uri: avatarUrl }} style={styles.avatarImage} resizeMode="cover" />
          </View>

          {/* Artist Metadata */}
          <View style={styles.metaContent}>
            {/* Category Label */}
            <View style={styles.categoryBadgeRow}>
              <Ionicons name="people" size={14} color="#60A5FA" />
              <Text style={styles.categoryBadgeText}>ARTIST PROFILE</Text>
            </View>

            {/* Artist Name */}
            <Text style={styles.artistNameText}>{artistName}</Text>

            {/* Genre Pills */}
            {genres.length > 0 && (
              <View style={styles.genresRow}>
                {genres.map((g, idx) => (
                  <View key={idx} style={styles.genrePill}>
                    <Text style={styles.genrePillText}>{g}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Meta Row: Followers + Score */}
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Ionicons name="people-outline" size={14} color="#8992A5" />
                <Text style={styles.metaItemText}>{followersCount} followers</Text>
              </View>
              <Text style={styles.metaDot}>•</Text>
              <View style={styles.metaItem}>
                <Ionicons name="trophy-outline" size={14} color="#8992A5" />
                <Text style={styles.metaItemText}>Score: {popularityScore}</Text>
              </View>
            </View>

            {/* Circular Groove Score RatingPieChart */}
            <View style={styles.ratingRow}>
              <RatingPieChart rating={artist?.rating || { value: popularityScore / 20 }} />
            </View>

            {/* Collapsible Lore Overview */}
            {artist?.description ? (
              <View style={styles.overviewSection}>
                <Text
                  style={[
                    styles.overviewText,
                    !expandedHeroDesc && styles.overviewTextClamped,
                  ]}
                >
                  {artist.description}
                </Text>
                {artist.description.length > 100 && (
                  <TouchableOpacity
                    onPress={() => setExpandedHeroDesc(!expandedHeroDesc)}
                    style={styles.readMoreBtn}
                  >
                    <Text style={styles.readMoreText}>
                      {expandedHeroDesc ? 'Show less' : 'Read full overview'}
                    </Text>
                    <Ionicons
                      name={expandedHeroDesc ? 'chevron-up' : 'chevron-down'}
                      size={12}
                      color="#60A5FA"
                    />
                  </TouchableOpacity>
                )}
              </View>
            ) : null}

            {/* "Open in GrooveLink" Pill Button */}
            <View style={styles.grooveLinkSection}>
              <TouchableOpacity
                style={styles.grooveLinkBtn}
                activeOpacity={0.8}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setModalItemTarget(null);
                  setShowGrooveLinkModal(true);
                }}
              >
                <Ionicons name="link" size={15} color="#F4F7FF" style={{ marginRight: 6 }} />
                <Text style={styles.grooveLinkBtnText}>Open in GrooveLink</Text>
                <Ionicons name="chevron-forward" size={14} color="#60A5FA" style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        {/* Discography Section (Albums in Chronological Order) */}
        {albums.length > 0 && (
          <View style={styles.discographySection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="disc-outline" size={16} color="#E879F9" style={{ marginRight: 6 }} />
              <Text style={styles.sectionTitle}>Discography & Releases</Text>
              <Text style={styles.sectionBadgeText}>{albums.length} Releases • Chronological</Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.albumsScroll}>
              {albums.map((album, idx) => {
                const albTitle = album.title || album.name;
                const albCover = album.coverArt || album.image || avatarUrl;
                const albYear = album.releaseYear || 'Album';

                return (
                  <TouchableOpacity
                    key={album.id || idx}
                    style={styles.albumGridCard}
                    activeOpacity={0.8}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      router.push(`/album/${album.id || encodeURIComponent(albTitle)}`);
                    }}
                  >
                    <Image source={{ uri: albCover }} style={styles.albumGridCover} />
                    <Text style={styles.albumGridTitle} numberOfLines={1}>
                      {albTitle}
                    </Text>
                    <Text style={styles.albumGridYear}>{albYear}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Popular Tracks Section (Top Hit Songs) */}
        {topTracks.length > 0 && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="musical-notes-outline" size={16} color="#60A5FA" style={{ marginRight: 6 }} />
              <Text style={styles.sectionTitle}>Top Hit Songs</Text>
            </View>

            {topTracks.slice(0, 8).map((track, idx) => {
              const trackTitle = track.title || track.name;
              const trackDur = formatDuration(track.duration || track.duration_ms);
              const trackCover = track.coverArt || track.image || avatarUrl;

              return (
                <TouchableOpacity
                  key={track.id || idx}
                  style={styles.popularTrackRow}
                  activeOpacity={0.7}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push(`/track/${track.id || encodeURIComponent(trackTitle)}`);
                  }}
                >
                  <Text style={styles.popularTrackIndex}>{idx + 1}</Text>
                  <Image source={{ uri: trackCover }} style={styles.popularTrackThumb} />
                  <View style={styles.popularTrackInfo}>
                    <Text style={styles.popularTrackTitle} numberOfLines={1}>
                      {trackTitle}
                    </Text>
                    <Text style={styles.popularTrackAlbum} numberOfLines={1}>
                      {track.album || artistName}
                    </Text>
                  </View>
                  <Text style={styles.popularTrackDur}>{trackDur}</Text>
                  <TouchableOpacity
                    style={styles.popularTrackLinkBtn}
                    hitSlop={8}
                    onPress={(e) => {
                      e.stopPropagation();
                      openItemInGrooveLink(track, 'track');
                    }}
                  >
                    <Ionicons name="link-outline" size={15} color="#60A5FA" />
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Reviews, Descriptions, Lore, Community Tags (Matches web app) */}
        <MusicLoreAndReviews
          id={artist?.id || id}
          type="artist"
          title={artistName}
          artist={artistName}
          description={artist?.description}
          tags={artist?.tags || []}
          rating={artist?.rating}
        />
      </ScrollView>

      {/* In-Place Liquid Glass GrooveLink Routing Modal */}
      <GrooveLinkModal
        visible={showGrooveLinkModal}
        onClose={() => {
          setShowGrooveLinkModal(false);
          setModalItemTarget(null);
        }}
        title={modalItemTarget ? (modalItemTarget.title || modalItemTarget.name) : artistName}
        artist={artistName}
        album={modalItemTarget?.album || ''}
        imageUrl={modalItemTarget ? (modalItemTarget.coverArt || modalItemTarget.image) : avatarUrl}
        type={modalItemTarget ? modalItemTarget.type : 'artist'}
        itemId={modalItemTarget ? (modalItemTarget.id || modalItemTarget.name) : (artist?.id || id)}
        onOpenGrooveCard={() => {
          setShowGrooveLinkModal(false);
          setTimeout(() => setShowGrooveCardModal(true), 250);
        }}
      />

      {/* Apple Music Inspired GrooveCard Composer Modal */}
      <GrooveCardModal
        visible={showGrooveCardModal}
        onClose={() => setShowGrooveCardModal(false)}
        title={modalItemTarget ? (modalItemTarget.title || modalItemTarget.name) : artistName}
        artist={artistName}
        album={modalItemTarget?.album || ''}
        imageUrl={modalItemTarget ? (modalItemTarget.coverArt || modalItemTarget.image) : avatarUrl}
        releaseDate=""
        type={modalItemTarget ? modalItemTarget.type : 'artist'}
        itemId={modalItemTarget ? (modalItemTarget.id || modalItemTarget.name) : (artist?.id || id)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#07090F',
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
    backgroundColor: '#07090F',
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
    backgroundColor: 'rgba(16, 20, 31, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleBtnActive: {
    backgroundColor: '#2563EB',
    borderColor: '#60A5FA',
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
    borderColor: 'rgba(37, 99, 235, 0.15)',
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
  avatarWrapper: {
    width: 170,
    height: 170,
    borderRadius: 85,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: 'rgba(37, 99, 235, 0.35)',
    backgroundColor: '#10141F',
    marginBottom: 16,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 15,
    elevation: 8,
  },
  avatarImage: {
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
    color: '#60A5FA',
    letterSpacing: 1.5,
  },
  artistNameText: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  genresRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 12,
  },
  genrePill: {
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  genrePillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#60A5FA',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
    color: '#8992A5',
    textTransform: 'uppercase',
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
    color: '#60A5FA',
  },
  grooveLinkSection: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(37, 99, 235, 0.15)',
    paddingTop: 14,
    width: '100%',
    alignItems: 'center',
    marginTop: 4,
  },
  grooveLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.3)',
  },
  grooveLinkBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#F4F7FF',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  sectionCard: {
    backgroundColor: 'rgba(16, 20, 31, 0.5)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: 16,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  sectionBadgeText: {
    marginLeft: 'auto',
    fontSize: 10,
    fontWeight: '700',
    color: '#8992A5',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  popularTrackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  popularTrackIndex: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8992A5',
    width: 22,
  },
  popularTrackThumb: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: 10,
  },
  popularTrackInfo: {
    flex: 1,
    marginRight: 10,
  },
  popularTrackTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  popularTrackAlbum: {
    fontSize: 11,
    color: '#8992A5',
  },
  popularTrackDur: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8992A5',
    marginRight: 10,
  },
  popularTrackLinkBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  discographySection: {
    marginBottom: 20,
  },
  albumsScroll: {
    gap: 12,
    paddingRight: 16,
  },
  albumGridCard: {
    width: 140,
    backgroundColor: 'rgba(16, 20, 31, 0.6)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 10,
  },
  albumGridCover: {
    width: 120,
    height: 120,
    borderRadius: 12,
    marginBottom: 8,
  },
  albumGridTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  albumGridYear: {
    fontSize: 10,
    color: '#8992A5',
    fontWeight: '500',
  },
});
