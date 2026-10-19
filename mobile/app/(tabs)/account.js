// app/(tabs)/account.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Share,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { COLORS, AVAILABLE_GENRES, FONTS } from '../../src/constants/theme';
import { useTheme } from '../../src/context/ThemeContext';
import { StorageService, generateRandomName } from '../../src/services/storage';
import GlassCard from '../../src/components/GlassCard';
import LiquidPill from '../../src/components/LiquidPill';
import TrackCard from '../../src/components/TrackCard';
import AlbumCard from '../../src/components/AlbumCard';
import ArtistCard from '../../src/components/ArtistCard';
import PlaylistCard from '../../src/components/PlaylistCard';

const TABS = [
  { id: 'tracks', label: 'Tracks', icon: 'musical-notes' },
  { id: 'albums', label: 'Albums', icon: 'disc' },
  { id: 'artists', label: 'Artists', icon: 'people' },
  { id: 'playlists', label: 'Playlists', icon: 'list' },
  { id: 'reviews', label: 'Reviews', icon: 'chatbubbles' },
  { id: 'taste', label: 'Music Taste', icon: 'sparkles' },
];

export default function AccountScreen() {
  const { colors, isDark } = useTheme();
  const [userName, setUserName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState('');
  const [activeTab, setActiveTab] = useState('tracks');

  const [savedSongs, setSavedSongs] = useState([]);
  const [savedAlbums, setSavedAlbums] = useState([]);
  const [savedArtists, setSavedArtists] = useState([]);
  const [savedPlaylists, setSavedPlaylists] = useState([]);
  const [favoriteGenres, setFavoriteGenres] = useState([]);
  const [userReviews, setUserReviews] = useState([]);

  const loadUserData = useCallback(async () => {
    const [name, genres, songs, albums, artists, playlists, custom, reviews] = await Promise.all([
      StorageService.getUserName(),
      StorageService.getFavoriteGenres(),
      StorageService.getSavedSongs(),
      StorageService.getSavedAlbums(),
      StorageService.getSavedArtists(),
      StorageService.getSavedPlaylists(),
      StorageService.getCustomPlaylists(),
      StorageService.getUserReviews(),
    ]);

    setUserName(name);
    setTempName(name);
    setFavoriteGenres(genres);
    setSavedSongs(songs);
    setSavedAlbums(albums);
    setSavedArtists(artists);
    setSavedPlaylists([...custom, ...playlists]);
    setUserReviews(reviews);
  }, []);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  const handleRollName = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const fresh = generateRandomName();
    await StorageService.setUserName(fresh);
    setUserName(fresh);
    setTempName(fresh);
    Toast.show({
      type: 'info',
      text1: 'Identity Updated',
      text2: `You are now ${fresh}`,
    });
  };

  const handleSaveName = async () => {
    if (!tempName.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await StorageService.setUserName(tempName.trim());
    setUserName(tempName.trim());
    setIsEditingName(false);
    Toast.show({
      type: 'success',
      text1: 'Username Saved',
      text2: `Updated to ${tempName.trim()}`,
    });
  };

  const handleToggleGenre = async (genre) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    let updated;
    if (favoriteGenres.includes(genre)) {
      updated = favoriteGenres.filter((g) => g !== genre);
    } else {
      updated = [...favoriteGenres, genre];
    }
    setFavoriteGenres(updated);
    await StorageService.setFavoriteGenres(updated);
  };

  const handleExportData = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const payload = {
      user: userName,
      exportedAt: new Date().toISOString(),
      favoriteGenres,
      songsCount: savedSongs.length,
      albumsCount: savedAlbums.length,
      artistsCount: savedArtists.length,
      playlistsCount: savedPlaylists.length,
      savedSongs,
      savedAlbums,
      savedArtists,
      savedPlaylists,
      reviews: userReviews,
    };

    try {
      await Share.share({
        title: 'GrooveEstrella Library Export',
        message: JSON.stringify(payload, null, 2),
      });
    } catch {
      Toast.show({
        type: 'info',
        text1: 'Export Prepared',
        text2: 'Library data ready to export',
      });
    }
  };

  const firstLetter = (userName || 'G').charAt(0).toUpperCase();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <Animated.View entering={FadeInDown.duration(450)}>
          <GlassCard elevated style={styles.profileCard}>
            <View style={styles.profileHeader}>
              {/* Large Avatar */}
              <LinearGradient
                colors={['#470B24', '#D4A373']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.avatarGradient}
              >
                <Text style={styles.avatarLetter}>{firstLetter}</Text>
              </LinearGradient>

              {/* User Identity info */}
              <View style={styles.profileInfo}>
                <View
                  style={[
                    styles.citizenBadge,
                    {
                      backgroundColor: isDark ? 'rgba(232, 168, 124, 0.15)' : 'rgba(154, 74, 47, 0.12)',
                      borderColor: isDark ? 'rgba(232, 168, 124, 0.3)' : 'rgba(154, 74, 47, 0.25)',
                    },
                  ]}
                >
                  <Ionicons name="sparkles" size={11} color={colors.accent} style={{ marginRight: 4 }} />
                  <Text style={[styles.citizenBadgeText, { color: colors.accent }]}>MUSIC LAYER • CITIZEN</Text>
                </View>

                {isEditingName ? (
                  <View style={styles.nameEditRow}>
                    <TextInput
                      style={[
                        styles.nameInput,
                        {
                          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : colors.surface,
                          color: colors.text,
                        },
                      ]}
                      value={tempName}
                      onChangeText={setTempName}
                      autoFocus
                    />
                    <Pressable onPress={handleSaveName} style={styles.nameActionBtn} hitSlop={8}>
                      <Ionicons name="checkmark" size={18} color={COLORS.success} />
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        setTempName(userName);
                        setIsEditingName(false);
                      }}
                      style={styles.nameActionBtn}
                      hitSlop={8}
                    >
                      <Ionicons name="close" size={18} color={COLORS.error} />
                    </Pressable>
                  </View>
                ) : (
                  <View style={styles.nameRow}>
                    <Text style={[styles.userName, { color: colors.text }]} numberOfLines={1}>
                      {userName}
                    </Text>
                    <Pressable
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setIsEditingName(true);
                      }}
                      style={styles.editBtn}
                      hitSlop={8}
                    >
                      <Ionicons name="pencil" size={14} color={colors.textSecondary} />
                    </Pressable>
                  </View>
                )}
              </View>
            </View>

            {/* Action Buttons Row */}
            <View style={styles.actionButtonsRow}>
              <Pressable
                onPress={handleRollName}
                style={[
                  styles.secondaryBtn,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Ionicons name="dice-outline" size={16} color={colors.accent} style={{ marginRight: 6 }} />
                <Text style={[styles.secondaryBtnText, { color: colors.text }]}>Roll Name</Text>
              </Pressable>

              <Pressable
                onPress={handleExportData}
                style={[
                  styles.secondaryBtn,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Ionicons name="download-outline" size={16} color={colors.accent} style={{ marginRight: 6 }} />
                <Text style={[styles.secondaryBtnText, { color: colors.text }]}>Export Data</Text>
              </Pressable>
            </View>

            {/* Favorite Genre pills overview */}
            {favoriteGenres.length > 0 && (
              <View style={[styles.profileGenresRow, { borderTopColor: colors.border }]}>
                {favoriteGenres.slice(0, 4).map((g) => (
                  <View
                    key={g}
                    style={[
                      styles.miniGenrePill,
                      {
                        backgroundColor: isDark ? 'rgba(232, 168, 124, 0.15)' : 'rgba(154, 74, 47, 0.12)',
                        borderColor: isDark ? 'rgba(232, 168, 124, 0.3)' : 'rgba(154, 74, 47, 0.25)',
                      },
                    ]}
                  >
                    <Text style={[styles.miniGenreText, { color: colors.accent }]}>{g}</Text>
                  </View>
                ))}
                {favoriteGenres.length > 4 && (
                  <View
                    style={[
                      styles.miniGenrePill,
                      {
                        backgroundColor: isDark ? 'rgba(232, 168, 124, 0.15)' : 'rgba(154, 74, 47, 0.12)',
                        borderColor: isDark ? 'rgba(232, 168, 124, 0.3)' : 'rgba(154, 74, 47, 0.25)',
                      },
                    ]}
                  >
                    <Text style={[styles.miniGenreText, { color: colors.accent }]}>+{favoriteGenres.length - 4}</Text>
                  </View>
                )}
              </View>
            )}
          </GlassCard>
        </Animated.View>

        {/* Stats Grid: 4 Cards */}
        <Animated.View entering={FadeInDown.duration(500).delay(100)} style={styles.statsGrid}>
          <GlassCard style={styles.statCard}>
            <View style={styles.statTop}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>TRACKS</Text>
              <Ionicons name="musical-notes" size={15} color={colors.accent} />
            </View>
            <Text style={[styles.statNumber, { color: colors.text }]}>{savedSongs.length}</Text>
          </GlassCard>

          <GlassCard style={styles.statCard}>
            <View style={styles.statTop}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>ALBUMS</Text>
              <Ionicons name="disc" size={15} color={colors.accent} />
            </View>
            <Text style={[styles.statNumber, { color: colors.text }]}>{savedAlbums.length}</Text>
          </GlassCard>

          <GlassCard style={styles.statCard}>
            <View style={styles.statTop}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>ARTISTS</Text>
              <Ionicons name="people" size={15} color="#34D399" />
            </View>
            <Text style={[styles.statNumber, { color: colors.text }]}>{savedArtists.length}</Text>
          </GlassCard>

          <GlassCard style={styles.statCard}>
            <View style={styles.statTop}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>REVIEWS</Text>
              <Ionicons name="chatbubbles" size={15} color="#FBBF24" />
            </View>
            <Text style={[styles.statNumber, { color: colors.text }]}>{userReviews.length}</Text>
          </GlassCard>
        </Animated.View>

        {/* Tab Navigation Horizontal Scroll */}
        <Animated.ScrollView
          entering={FadeInDown.duration(500).delay(200)}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScroll}
        >
          {TABS.map((tab) => (
            <LiquidPill
              key={tab.id}
              label={tab.label}
              icon={tab.icon}
              active={activeTab === tab.id}
              onPress={() => {
                setActiveTab(tab.id);
              }}
            />
          ))}
        </Animated.ScrollView>

        {/* Tab Content Display */}
        <View style={styles.tabContentArea}>
          {activeTab === 'tracks' && (
            <View>
              {savedSongs.length === 0 ? (
                <View style={styles.emptyTab}>
                  <Ionicons name="musical-notes-outline" size={40} color={colors.textSecondary} style={{ opacity: 0.4 }} />
                  <Text style={[styles.emptyTabText, { color: colors.text }]}>No saved songs yet</Text>
                  <Text style={[styles.emptyTabSub, { color: colors.textSecondary }]}>Bookmark tracks from the search or track page</Text>
                </View>
              ) : (
                savedSongs.map((track) => (
                  <TrackCard
                    key={track.id || track.trackId}
                    track={track}
                    showRemove
                    onRemove={async (id) => {
                      await StorageService.removeSavedSong(id);
                      setSavedSongs((prev) => prev.filter((s) => s.id !== id && s.trackId !== id));
                    }}
                  />
                ))
              )}
            </View>
          )}

          {activeTab === 'albums' && (
            <View>
              {savedAlbums.length === 0 ? (
                <View style={styles.emptyTab}>
                  <Ionicons name="disc-outline" size={40} color={colors.textSecondary} style={{ opacity: 0.4 }} />
                  <Text style={[styles.emptyTabText, { color: colors.text }]}>No saved albums yet</Text>
                </View>
              ) : (
                <View style={styles.gridRow}>
                  {savedAlbums.map((album) => (
                    <AlbumCard
                      key={album.id}
                      album={album}
                      layout="grid"
                      showRemove
                      onRemove={async (id) => {
                        await StorageService.removeSavedAlbum(id);
                        setSavedAlbums((prev) => prev.filter((a) => a.id !== id));
                      }}
                    />
                  ))}
                </View>
              )}
            </View>
          )}

          {activeTab === 'artists' && (
            <View>
              {savedArtists.length === 0 ? (
                <View style={styles.emptyTab}>
                  <Ionicons name="people-outline" size={40} color={colors.textSecondary} style={{ opacity: 0.4 }} />
                  <Text style={[styles.emptyTabText, { color: colors.text }]}>No followed artists</Text>
                </View>
              ) : (
                <View style={styles.gridRow}>
                  {savedArtists.map((artist) => (
                    <ArtistCard
                      key={artist.id}
                      artist={artist}
                      layout="grid"
                      showRemove
                      onRemove={async (id) => {
                        await StorageService.removeSavedArtist(id);
                        setSavedArtists((prev) => prev.filter((a) => a.id !== id));
                      }}
                    />
                  ))}
                </View>
              )}
            </View>
          )}

          {activeTab === 'playlists' && (
            <View>
              {savedPlaylists.length === 0 ? (
                <View style={styles.emptyTab}>
                  <Ionicons name="list-outline" size={40} color={colors.textSecondary} style={{ opacity: 0.4 }} />
                  <Text style={[styles.emptyTabText, { color: colors.text }]}>No playlists found</Text>
                  <Text style={[styles.emptyTabSub, { color: colors.textSecondary }]}>Create custom playlists inside the Library tab</Text>
                </View>
              ) : (
                savedPlaylists.map((pl) => (
                  <PlaylistCard
                    key={pl.id}
                    playlist={pl}
                    isCustom={pl.id?.startsWith('pl-')}
                  />
                ))
              )}
            </View>
          )}

          {activeTab === 'reviews' && (
            <View>
              {userReviews.length === 0 ? (
                <View style={styles.emptyTab}>
                  <Ionicons name="chatbubbles-outline" size={40} color={colors.textSecondary} style={{ opacity: 0.4 }} />
                  <Text style={[styles.emptyTabText, { color: colors.text }]}>No reviews published</Text>
                  <Text style={[styles.emptyTabSub, { color: colors.textSecondary }]}>Leave track impressions and ratings to build your music review history</Text>
                </View>
              ) : (
                userReviews.map((rev) => (
                  <GlassCard key={rev.id} style={styles.reviewCard}>
                    <View style={styles.reviewHeader}>
                      <Text style={[styles.reviewTitle, { color: colors.text }]}>{rev.trackTitle || 'Track Review'}</Text>
                      <View style={styles.ratingBadge}>
                        <Ionicons name="star" size={12} color="#FBBF24" />
                        <Text style={styles.ratingText}>{rev.rating || 5}/5</Text>
                      </View>
                    </View>
                    <Text style={[styles.reviewComment, { color: colors.textSecondary }]}>{rev.comment}</Text>
                    <Text style={[styles.reviewDate, { color: colors.textSecondary }]}>{new Date(rev.createdAt).toLocaleDateString()}</Text>
                  </GlassCard>
                ))
              )}
            </View>
          )}

          {activeTab === 'taste' && (
            <View style={styles.tasteContainer}>
              <Text style={[styles.tasteInstruction, { color: colors.textSecondary }]}>
                Select your favorite music genres to personalize discovery recommendations:
              </Text>
              <View style={styles.genresGrid}>
                {AVAILABLE_GENRES.map((genre) => {
                  const isSelected = favoriteGenres.includes(genre);
                  return (
                    <Pressable
                      key={genre}
                      onPress={() => handleToggleGenre(genre)}
                      style={[
                        styles.genreToggleBtn,
                        {
                          backgroundColor: isSelected
                            ? (isDark ? 'rgba(232, 168, 124, 0.18)' : 'rgba(154, 74, 47, 0.12)')
                            : colors.surfaceElevated,
                          borderColor: isSelected ? colors.accent : colors.border,
                        },
                      ]}
                    >
                      <Ionicons
                        name={isSelected ? 'checkmark-circle' : 'add-circle-outline'}
                        size={15}
                        color={isSelected ? colors.accent : colors.textSecondary}
                        style={{ marginRight: 6 }}
                      />
                      <Text
                        style={[
                          styles.genreToggleText,
                          { color: isSelected ? colors.accent : colors.textSecondary },
                        ]}
                      >
                        {genre}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 110,
  },
  profileCard: {
    padding: 16,
    borderRadius: 22,
    marginBottom: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarGradient: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  avatarLetter: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
    fontFamily: FONTS.display,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  citizenBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(232, 168, 124, 0.15)',
    borderColor: 'rgba(232, 168, 124, 0.3)',
    borderWidth: 1,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 9999,
    marginBottom: 6,
  },
  citizenBadgeText: {
    color: '#D4A373',
    fontSize: 9,
    fontWeight: '800',
    fontFamily: FONTS.display,
    letterSpacing: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    fontSize: 20,
    fontWeight: '800',
    fontFamily: FONTS.display,
    color: COLORS.text,
    marginRight: 8,
  },
  editBtn: {
    padding: 4,
  },
  nameEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nameInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    color: COLORS.text,
    fontSize: 16,
    fontFamily: FONTS.bodySemiBold,
    fontWeight: '700',
  },
  nameActionBtn: {
    padding: 6,
    marginLeft: 4,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 9,
  },
  secondaryBtnText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '700',
    fontFamily: FONTS.bodySemiBold,
  },
  profileGenresRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    paddingTop: 10,
  },
  miniGenrePill: {
    backgroundColor: 'rgba(232, 168, 124, 0.15)',
    borderColor: 'rgba(232, 168, 124, 0.3)',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  miniGenreText: {
    color: '#D4A373',
    fontSize: 10,
    fontWeight: '700',
    fontFamily: FONTS.bodyMedium,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    padding: 10,
    borderRadius: 16,
  },
  statTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '800',
    fontFamily: FONTS.display,
    color: COLORS.textSecondary,
    letterSpacing: 0.8,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '900',
    fontFamily: FONTS.display,
    color: COLORS.text,
  },
  tabsScroll: {
    paddingVertical: 4,
    marginBottom: 12,
  },
  tabContentArea: {
    marginTop: 4,
  },
  emptyTab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyTabText: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '700',
    fontFamily: FONTS.displaySemiBold,
    marginTop: 12,
  },
  emptyTabSub: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontFamily: FONTS.body,
    marginTop: 4,
    textAlign: 'center',
  },
  gridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  reviewCard: {
    padding: 14,
    borderRadius: 16,
    marginBottom: 10,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  reviewTitle: {
    fontSize: 14,
    fontFamily: FONTS.displaySemiBold,
    color: COLORS.text,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  ratingText: {
    color: '#FBBF24',
    fontSize: 11,
    fontFamily: FONTS.displayBold,
  },
  reviewComment: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontFamily: FONTS.body,
    lineHeight: 18,
    marginBottom: 6,
  },
  reviewDate: {
    color: 'rgba(137, 146, 165, 0.5)',
    fontSize: 10,
    fontFamily: FONTS.body,
  },
  tasteContainer: {
    paddingVertical: 8,
  },
  tasteInstruction: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontFamily: FONTS.body,
    marginBottom: 14,
    lineHeight: 18,
  },
  genresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  genreToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(232, 168, 124, 0.08)',
    borderColor: 'rgba(232, 168, 124, 0.2)',
    borderWidth: 1,
  },
  genreToggleBtnActive: {
    backgroundColor: 'rgba(232, 168, 124, 0.25)',
    borderColor: 'rgba(232, 168, 124, 0.5)',
  },
  genreToggleText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontFamily: FONTS.bodySemiBold,
  },
  genreToggleTextActive: {
    color: '#FFFFFF',
    fontFamily: FONTS.bodyBold,
  },
});
