// mobile/app/album/[id].js
import React, { useState, useEffect, useMemo, useCallback } from 'react';
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

export default function AlbumDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const [albumData, setAlbumData] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingTracks, setLoadingTracks] = useState(false);
  const [saved, setSaved] = useState(false);
  const [expandedHeroDesc, setExpandedHeroDesc] = useState(false);
  const [selectedReleaseId, setSelectedReleaseId] = useState(null);

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
          if (alb?.selectedReleaseId || alb?.variations?.[0]?.id) {
            setSelectedReleaseId(alb.selectedReleaseId || alb.variations[0].id);
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

  const handleRestoreMainCover = () => {
    if (!albumData?.mainCoverArt) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAlbumData((prev) => prev ? {
      ...prev,
      image: prev.mainCoverArt,
      coverArt: prev.mainCoverArt,
    } : prev);
    Toast.show({
      type: 'success',
      text1: 'Main Artwork Restored',
      text2: 'Showing canonical album cover',
    });
  };

  const handleSwitchEdition = async (relId) => {
    if (!relId || relId === selectedReleaseId || loadingTracks) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const prevReleaseId = selectedReleaseId;
    setSelectedReleaseId(relId);
    setLoadingTracks(true);

    // Optimistically update cover art to the selected edition
    setAlbumData((prev) => prev ? {
      ...prev,
      image: `https://coverartarchive.org/release/${relId}/front-500`,
      coverArt: `https://coverartarchive.org/release/${relId}/front-500`,
    } : prev);
    try {
      const result = await ApiService.fetchAlbum(String(id), relId);
      if (result) {
        const alb = result.album || result;
        setAlbumData(alb);
        if (result.tracks && result.tracks.length > 0) {
          setTracks(result.tracks);
        }
        const labelYear = alb?.releaseYear || alb?.releaseDate || 'Selected';
        Toast.show({
          type: 'success',
          text1: `Switched Edition: ${labelYear}`,
          text2: `${result.tracks?.length || tracks.length} tracks loaded 💿`,
        });
      }
    } catch {
      setSelectedReleaseId(prevReleaseId);
      Toast.show({
        type: 'error',
        text1: 'Edition Error',
        text2: 'Could not load selected edition',
      });
    } finally {
      setLoadingTracks(false);
    }
  };

  const openTrackOptions = (trackItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const trackName = trackItem.title || trackItem.name || 'Track';
    const artistName = trackItem.artist || albumArtist;

    Alert.alert(
      trackName,
      artistName,
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
            setModalTrackTarget({
              ...trackItem,
              artist: trackItem.artist || artistName,
              album: albumTitle,
              imageUrl: trackItem.imageUrl || coverUrl,
              coverArt: trackItem.coverArt || coverUrl,
              releaseDate: albumData?.releaseDate || albumData?.firstReleaseDate || albumData?.releaseYear || '',
              type: 'track',
            });
            setShowGrooveLinkModal(true);
          },
        },
        {
          text: 'Share via GrooveCard',
          onPress: () => {
            setModalTrackTarget({
              ...trackItem,
              artist: trackItem.artist || artistName,
              album: albumTitle,
              imageUrl: trackItem.imageUrl || coverUrl,
              coverArt: trackItem.coverArt || coverUrl,
              releaseDate: albumData?.releaseDate || albumData?.firstReleaseDate || albumData?.releaseYear || '',
              type: 'track',
            });
            setShowGrooveCardModal(true);
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  // Group variations into clear, meaningful eras (matching web app)
  const groupedVariations = useMemo(() => {
    if (!albumData?.variations || !albumData.variations.length) return [];

    const originalYear = albumData.originalReleaseYear || (albumData.variations.find(v => v.isOriginal)?.year) || albumData.releaseYear;
    const eraMap = new Map();

    albumData.variations.forEach((v) => {
      let eraKey = 'other';
      let eraName = 'Other Editions';
      let order = 99;

      if (v.isOriginal || (originalYear && v.year === originalYear)) {
        eraKey = 'original';
        eraName = `★ Original Release (${originalYear || 'Classic'})`;
        order = 1;
      } else if (v.year && v.year < 1980) {
        eraKey = '1970s';
        eraName = '1970s Pressings';
        order = 2;
      } else if (v.year && v.year < 1990) {
        eraKey = '1980s';
        eraName = 'Early CD & Masters (1980s)';
        order = 3;
      } else if (v.year && v.year < 2000) {
        eraKey = '1990s';
        eraName = 'Remasters & Bonus Tracks (1990s)';
        order = 4;
      } else if (v.year && v.year < 2010) {
        eraKey = '2000s';
        eraName = '2000s Reissues & Digital';
        order = 5;
      } else {
        eraKey = 'modern';
        eraName = 'Anniversary & Modern Remasters (2010+)';
        order = 6;
      }

      if (!eraMap.has(eraKey)) {
        eraMap.set(eraKey, {
          key: eraKey,
          name: eraName,
          order: order,
          items: [],
        });
      }
      eraMap.get(eraKey).items.push(v);
    });

    return Array.from(eraMap.values()).sort((a, b) => a.order - b.order);
  }, [albumData?.variations, albumData?.originalReleaseYear, albumData?.releaseYear]);

  // Clean Genre Filter: Discards hashtags, numbers, #1973, 70s, and non-musical catalog tags
  const validGenres = useMemo(() => {
    const rawList = albumData?.genres || albumData?.tags || [];
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
  }, [albumData?.genres, albumData?.tags]);

  const displayGenre = validGenres.length > 0 ? validGenres[0] : null;

  // Group tracks into distinct Discs (Disc 1, Disc 2, Disc 3, etc.)
  const discGroups = useMemo(() => {
    if (!tracks || tracks.length === 0) return [];

    const groups = new Map();
    let currentDisc = 1;
    let lastPos = 0;

    tracks.forEach((track, idx) => {
      let discNum = track.disc;
      if (!discNum) {
        const pos = Number(track.pos) || (idx + 1);
        if (idx > 0 && pos <= lastPos && pos === 1) {
          currentDisc += 1;
        }
        discNum = currentDisc;
        lastPos = pos;
      } else {
        currentDisc = discNum;
        lastPos = Number(track.pos) || (idx + 1);
      }

      if (!groups.has(discNum)) {
        groups.set(discNum, {
          discNumber: discNum,
          title: track.discTitle ? `Disc ${discNum}: ${track.discTitle}` : `Disc ${discNum}`,
          tracks: [],
        });
      }
      groups.get(discNum).tracks.push(track);
    });

    return Array.from(groups.values()).sort((a, b) => a.discNumber - b.discNumber);
  }, [tracks]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
        <GrooveLoader fullScreen text="Loading Album..." />
      </SafeAreaView>
    );
  }

  const albumTitle = albumData?.title || albumData?.name || 'Unknown Album';
  const albumArtist = albumData?.artist || 'Various Artists';
  const coverUrl = albumData?.coverArt || albumData?.image || albumData?.images?.[0]?.url || 'https://placehold.co/600x600/17020B/E8A87C?text=Album';
  const releaseYear = albumData?.releaseYear || (albumData?.releaseDate ? new Date(albumData.releaseDate).getFullYear() : 'Album');
  const totalRuntimeMs = albumData?.totalDurationMs || tracks.reduce((acc, t) => acc + (t.duration || t.duration_ms || 0), 0);
  const formattedRuntime = formatTotalRuntime(totalRuntimeMs);

  const artistsList = Array.isArray(albumData?.artists)
    ? albumData.artists
    : [{ name: albumArtist }];

  const shareTitle = `${albumTitle} by ${albumArtist}`;
  const shareMessage = `Check out "${albumTitle}" by ${albumArtist} on GrooveEstrella! 💿`;
  const shareUrl = `https://groove.amplecen.com/album/${id}`;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]} edges={['left', 'right']}>
      {/* Dynamic Ambient Cover Art Blur Backdrop */}
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

      {/* Floating Pill Top Bar (Back Button + Logo/Wordmark + Native Share) */}
      <GrooveAppBar
        variant="pill"
        title={albumTitle}
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
          {/* Square Album Cover Artwork */}
          <View style={styles.coverWrapper}>
            <Image source={{ uri: coverUrl }} style={styles.coverImage} resizeMode="cover" />
          </View>

          {/* Album Title + Explicit [E] Badge */}
          <View style={styles.titleRow}>
            <Text style={[styles.albumTitleText, { color: colors.text }]}>{albumTitle}</Text>
            {Boolean(albumData?.explicit) && (
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

          {/* Subtitle: Genre · Year */}
          <Text style={[styles.metaSubtitle, { color: colors.textSecondary }]}>
            {displayGenre ? `${displayGenre} · ` : ''}{releaseYear}
          </Text>

          {/* Multi-Disc Info: No. of Discs · Combined Timing */}
          {discGroups.length > 1 && (
            <View style={styles.multiDiscRow}>
              <Ionicons name="disc-outline" size={13} color={colors.accent} />
              <Text style={[styles.multiDiscText, { color: colors.textSecondary }]}>
                {discGroups.length} Discs
                {formattedRuntime ? ` · ${formattedRuntime}` : ''}
              </Text>
            </View>
          )}

          {/* Centered Action Controls Row: Sparkles (GrooveCard) | Open GrooveLink | Bookmark */}
          <View style={styles.actionRow}>
            {/* Create GrooveCard Button */}
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setModalTrackTarget(null);
                setShowGrooveCardModal(true);
              }}
              style={styles.circleActionBtn}
              activeOpacity={0.8}
            >
              <Ionicons name="sparkles" size={19} color="#FFF2DF" />
            </TouchableOpacity>

            {/* Prominent Open GrooveLink Pill Button */}
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setModalTrackTarget(null);
                setShowGrooveLinkModal(true);
              }}
              style={[styles.grooveLinkPillBtn, { backgroundColor: colors.accent }]}
              activeOpacity={0.85}
            >
              <GrooveLogo size={16} color="#17020B" style={{ marginRight: 6 }} />
              <Text style={styles.grooveLinkPillText}>Open GrooveLink</Text>
              <Ionicons name="chevron-forward" size={14} color="#17020B" style={{ marginLeft: 2 }} />
            </TouchableOpacity>

            {/* Bookmark / Save to Library Button */}
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

          {/* Description / Editorial Notes */}
          {albumData?.description ? (
            <View style={styles.overviewSection}>
              <Text
                style={[
                  styles.overviewText,
                  { color: colors.textSecondary },
                  !expandedHeroDesc && styles.overviewTextClamped,
                ]}
              >
                <Text style={[styles.overviewPrefix, { color: colors.text }]}>Editor's Notes  </Text>
                {albumData.description}
              </Text>
              {albumData.description.length > 80 && (
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

        {/* Grouped Editions & Variations Switcher */}
        {groupedVariations.length > 0 && (
          <View style={[styles.variationsCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            <View style={styles.variationsHeader}>
              <View style={styles.variationsTitleRow}>
                <Ionicons name="layers-outline" size={14} color={colors.accent} />
                <Text style={[styles.variationsTitle, { color: colors.accent }]}>
                  EDITIONS & VARIATIONS ({albumData.variations?.length || 0} pressings)
                </Text>
              </View>
              {loadingTracks && (
                <Text style={[styles.switchingText, { color: colors.accent }]}>
                  Switching edition...
                </Text>
              )}
            </View>

            {/* Era Tabs Row */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.variationsScroll}>
              {groupedVariations.map((group, groupIdx) => {
                const isGroupActive = group.items.some(
                  item => (selectedReleaseId === item.id) || (!selectedReleaseId && item.isOriginal)
                );
                return (
                  <TouchableOpacity
                    key={`${group.key}-${groupIdx}`}
                    disabled={loadingTracks}
                    onPress={() => {
                      const firstItem = group.items[0];
                      if (firstItem) handleSwitchEdition(firstItem.id);
                    }}
                    style={[
                      styles.eraPill,
                      {
                        backgroundColor: isGroupActive ? colors.accent : colors.surface,
                        borderColor: isGroupActive ? colors.accent : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.eraPillText,
                        { color: isGroupActive ? '#17020B' : colors.textSecondary, fontWeight: isGroupActive ? '800' : '600' },
                      ]}
                    >
                      {group.name}
                    </Text>
                    <View style={[styles.eraCountBadge, { backgroundColor: isGroupActive ? 'rgba(23, 2, 11, 0.2)' : 'rgba(255, 255, 255, 0.08)' }]}>
                      <Text style={[styles.eraCountText, { color: isGroupActive ? '#17020B' : colors.textSecondary }]}>
                        {group.items.length}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Sub-level: Regional Pressings in Active Era */}
            {(() => {
              const activeGroup = groupedVariations.find(group =>
                group.items.some(item => (selectedReleaseId === item.id) || (!selectedReleaseId && item.isOriginal))
              ) || groupedVariations[0];

              if (!activeGroup || activeGroup.items.length <= 1) return null;

              return (
                <View style={[styles.regionalRow, { borderTopColor: colors.border }]}>
                  <Text style={[styles.regionalLabel, { color: colors.textSecondary }]}>REGIONAL:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.regionalScroll}>
                    {activeGroup.items.map((item, itemIdx) => {
                      const isSelected = (selectedReleaseId === item.id) || (!selectedReleaseId && item.isOriginal);
                      return (
                        <TouchableOpacity
                          key={`${item.id}-${itemIdx}`}
                          disabled={loadingTracks}
                          onPress={() => handleSwitchEdition(item.id)}
                          style={[
                            styles.regionalPill,
                            isSelected && { backgroundColor: 'rgba(232, 168, 124, 0.2)', borderColor: colors.accent },
                          ]}
                        >
                          <Text style={[styles.regionalPillText, { color: isSelected ? colors.accent : colors.textSecondary }]}>
                            {item.country || 'Global'}{item.year ? ` (${item.year})` : ''}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              );
            })()}
          </View>
        )}

        {/* Tracks List Grouped by Discs */}
        <View style={styles.tracksSection}>
          {discGroups.map((discGroup) => {
            const discDurationMs = discGroup.tracks.reduce((acc, t) => acc + (t.duration || t.duration_ms || 0), 0);
            const discFormattedTime = formatTotalRuntime(discDurationMs);

            return (
              <View key={`disc-group-${discGroup.discNumber}`} style={styles.discBlock}>
                {/* Disc Header */}
                <View style={[styles.discHeaderRow, { borderBottomColor: colors.border }]}>
                  <View style={styles.discHeaderLeft}>
                    <Text style={[styles.discTitleText, { color: colors.text }]}>
                      {discGroup.title}
                    </Text>
                    {discGroups.length > 1 && (
                      <View style={[styles.discBadge, { borderColor: colors.border }]}>
                        <Text style={[styles.discBadgeText, { color: colors.accent }]}>
                          {discGroup.tracks.length} songs
                        </Text>
                      </View>
                    )}
                  </View>
                  {discFormattedTime && (
                    <Text style={[styles.discRuntimeText, { color: colors.textSecondary }]}>
                      {discFormattedTime}
                    </Text>
                  )}
                </View>

                {/* Tracks in this Disc */}
                <View style={styles.trackList}>
                  {discGroup.tracks.map((track, index) => {
                    const trackTitle = track.title || track.name;
                    const trackArtists = Array.isArray(track.artists) ? track.artists : Array.isArray(track.artist) ? track.artist : artistsList;
                    const artistsStr = trackArtists.map(a => a.name).join(', ');
                    const isExplicit = Boolean(track.explicit);
                    const dur = formatDuration(track.duration || track.duration_ms);

                    return (
                      <TouchableOpacity
                        key={`${track.id || track.trackID || 'track'}-${index}`}
                        onPress={() => {
                          const targetId = track.id || track.trackID;
                          if (targetId) router.push(`/track/${targetId}`);
                        }}
                        activeOpacity={0.7}
                        style={[styles.trackRow, { borderBottomColor: 'rgba(255, 255, 255, 0.08)' }]}
                      >
                        <Text style={[styles.trackPos, { color: colors.textSecondary }]}>
                          {track.trackNumber || track.pos || index + 1}
                        </Text>

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
                          {artistsStr && artistsStr !== albumArtist && (
                            <Text style={[styles.trackArtist, { color: colors.textSecondary }]} numberOfLines={1}>
                              {artistsStr}
                            </Text>
                          )}
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
            );
          })}
        </View>

        {/* Music Lore & Reviews Section */}
        <MusicLoreAndReviews
          entityType="album"
          entityId={String(albumData?.id || id)}
          entityTitle={albumTitle}
          entityArtist={albumArtist}
          entityImage={coverUrl}
        />

        {/* Rating Pie Chart */}
        <View style={styles.ratingSection}>
          <RatingPieChart rating={albumData?.rating || { value: 4.8 }} />
        </View>
      </ScrollView>

      {/* GrooveLink Modal */}
      <GrooveLinkModal
        visible={showGrooveLinkModal}
        onClose={() => setShowGrooveLinkModal(false)}
        target={modalTrackTarget || { ...albumData, type: 'album' }}
        onOpenGrooveCard={(item) => {
          if (item) setModalTrackTarget(item);
          setShowGrooveCardModal(true);
        }}
      />

      {/* GrooveCard Modal */}
      <GrooveCardModal
        visible={showGrooveCardModal}
        onClose={() => setShowGrooveCardModal(false)}
        item={modalTrackTarget || { ...albumData, type: 'album' }}
        rating={albumData?.rating}
        duration={albumData?.totalDurationMs}
        discCount={groupedVariations.length || 1}
        totalTracks={tracks.length}
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
  restoreCoverBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: -8,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  restoreCoverText: {
    fontSize: 11,
    fontFamily: FONTS.bodySemiBold,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: 20,
    paddingHorizontal: 12,
  },
  albumTitleText: {
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
  metaSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: FONTS.body,
    marginTop: 4,
    opacity: 0.75,
  },
  multiDiscRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
  },
  multiDiscText: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: FONTS.body,
    opacity: 0.7,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
  variationsCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
    marginBottom: 24,
  },
  variationsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  variationsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  variationsTitle: {
    fontSize: 11,
    fontWeight: '800',
    fontFamily: FONTS.display,
    letterSpacing: 0.5,
  },
  switchingText: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: FONTS.bodyBold,
  },
  variationsScroll: {
    gap: 8,
    paddingBottom: 4,
  },
  eraPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 9999,
    borderWidth: 1,
    gap: 6,
  },
  eraPillText: {
    fontSize: 12,
    fontFamily: FONTS.bodySemiBold,
  },
  eraCountBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 9999,
  },
  eraCountText: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: FONTS.mono,
  },
  regionalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    gap: 6,
  },
  regionalLabel: {
    fontSize: 10,
    fontWeight: '800',
    fontFamily: FONTS.display,
    letterSpacing: 0.5,
  },
  regionalScroll: {
    gap: 6,
  },
  regionalPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  regionalPillText: {
    fontSize: 11,
    fontFamily: FONTS.bodyMedium,
  },
  tracksSection: {
    marginBottom: 28,
  },
  discBlock: {
    marginBottom: 20,
  },
  discHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
    marginBottom: 4,
    borderBottomWidth: 1,
  },
  discHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  discTitleText: {
    fontSize: 15,
    fontWeight: '800',
    fontFamily: FONTS.display,
  },
  discBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 9999,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  discBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: FONTS.bodyBold,
  },
  discRuntimeText: {
    fontSize: 11,
    fontFamily: FONTS.bodyMedium,
  },
  trackList: {
    flexDirection: 'col',
  },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
  },
  trackPos: {
    width: 24,
    fontSize: 12,
    fontWeight: '600',
    fontFamily: FONTS.mono,
    textAlign: 'center',
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
  ratingSection: {
    alignItems: 'center',
    marginVertical: 16,
  },
});
