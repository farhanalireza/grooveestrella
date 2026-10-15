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
import { COLORS, AVAILABLE_GENRES } from '../../src/constants/theme';
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
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
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
                colors={['#2563EB', '#60A5FA']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.avatarGradient}
              >
                <Text style={styles.avatarLetter}>{firstLetter}</Text>
              </LinearGradient>

              {/* User Identity info */}
              <View style={styles.profileInfo}>
                <View style={styles.citizenBadge}>
                  <Ionicons name="sparkles" size={11} color={COLORS.accentLight} style={{ marginRight: 4 }} />
                  <Text style={styles.citizenBadgeText}>MUSIC LAYER • CITIZEN</Text>
                </View>

                {isEditingName ? (
                  <View style={styles.nameEditRow}>
                    <TextInput
                      style={styles.nameInput}
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
                    <Text style={styles.userName} numberOfLines={1}>
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
                      <Ionicons name="pencil" size={14} color={COLORS.textSecondary} />
                    </Pressable>
                  </View>
                )}
              </View>
            </View>

            {/* Action Buttons Row */}
            <View style={styles.actionButtonsRow}>
              <Pressable onPress={handleRollName} style={styles.secondaryBtn}>
                <Ionicons name="dice-outline" size={16} color={COLORS.purpleLighter} style={{ marginRight: 6 }} />
                <Text style={styles.secondaryBtnText}>Roll Name</Text>
              </Pressable>

              <Pressable onPress={handleExportData} style={styles.secondaryBtn}>
                <Ionicons name="download-outline" size={16} color={COLORS.accentLight} style={{ marginRight: 6 }} />
                <Text style={styles.secondaryBtnText}>Export Data</Text>
              </Pressable>
            </View>

            {/* Favorite Genre pills overview */}
            {favoriteGenres.length > 0 && (
              <View style={styles.profileGenresRow}>
                {favoriteGenres.slice(0, 4).map((g) => (
                  <View key={g} style={styles.miniGenrePill}>
                    <Text style={styles.miniGenreText}>{g}</Text>
                  </View>
                ))}
                {favoriteGenres.length > 4 && (
                  <View style={styles.miniGenrePill}>
                    <Text style={styles.miniGenreText}>+{favoriteGenres.length - 4}</Text>
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
              <Text style={styles.statLabel}>TRACKS</Text>
              <Ionicons name="musical-notes" size={15} color={COLORS.accentLight} />
            </View>
            <Text style={styles.statNumber}>{savedSongs.length}</Text>
          </GlassCard>

          <GlassCard style={styles.statCard}>
            <View style={styles.statTop}>
              <Text style={styles.statLabel}>ALBUMS</Text>
              <Ionicons name="disc" size={15} color={COLORS.purpleLighter} />
            </View>
            <Text style={styles.statNumber}>{savedAlbums.length}</Text>
          </GlassCard>

          <GlassCard style={styles.statCard}>
            <View style={styles.statTop}>
              <Text style={styles.statLabel}>ARTISTS</Text>
              <Ionicons name="people" size={15} color="#34D399" />
            </View>
            <Text style={styles.statNumber}>{savedArtists.length}</Text>
          </GlassCard>

          <GlassCard style={styles.statCard}>
            <View style={styles.statTop}>
              <Text style={styles.statLabel}>REVIEWS</Text>
              <Ionicons name="chatbubbles" size={15} color="#FBBF24" />
            </View>
            <Text style={styles.statNumber}>{userReviews.length}</Text>
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
                  <Ionicons name="musical-notes-outline" size={40} color={COLORS.textSecondary} style={{ opacity: 0.4 }} />
                  <Text style={styles.emptyTabText}>No saved songs yet</Text>
                  <Text style={styles.emptyTabSub}>Bookmark tracks from the search or track page</Text>
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
                  <Ionicons name="disc-outline" size={40} color={COLORS.textSecondary} style={{ opacity: 0.4 }} />
                  <Text style={styles.emptyTabText}>No saved albums yet</Text>
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
                  <Ionicons name="people-outline" size={40} color={COLORS.textSecondary} style={{ opacity: 0.4 }} />
                  <Text style={styles.emptyTabText}>No followed artists</Text>
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
                  <Ionicons name="list-outline" size={40} color={COLORS.textSecondary} style={{ opacity: 0.4 }} />
                  <Text style={styles.emptyTabText}>No playlists found</Text>
                  <Text style={styles.emptyTabSub}>Create custom playlists inside the Library tab</Text>
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
                  <Ionicons name="chatbubbles-outline" size={40} color={COLORS.textSecondary} style={{ opacity: 0.4 }} />
                  <Text style={styles.emptyTabText}>No reviews published</Text>
                  <Text style={styles.emptyTabSub}>Leave track impressions and ratings to build your music review history</Text>
                </View>
              ) : (
                userReviews.map((rev) => (
                  <GlassCard key={rev.id} style={styles.reviewCard}>
                    <View style={styles.reviewHeader}>
                      <Text style={styles.reviewTitle}>{rev.trackTitle || 'Track Review'}</Text>
                      <View style={styles.ratingBadge}>
                        <Ionicons name="star" size={12} color="#FBBF24" />
                        <Text style={styles.ratingText}>{rev.rating || 5}/5</Text>
                      </View>
                    </View>
                    <Text style={styles.reviewComment}>{rev.comment}</Text>
                    <Text style={styles.reviewDate}>{new Date(rev.createdAt).toLocaleDateString()}</Text>
                  </GlassCard>
                ))
              )}
            </View>
          )}

          {activeTab === 'taste' && (
            <View style={styles.tasteContainer}>
              <Text style={styles.tasteInstruction}>
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
                        isSelected && styles.genreToggleBtnActive,
                      ]}
                    >
                      <Ionicons
                        name={isSelected ? 'checkmark-circle' : 'add-circle-outline'}
                        size={15}
                        color={isSelected ? COLORS.purpleLightest : COLORS.textSecondary}
                        style={{ marginRight: 6 }}
                      />
                      <Text
                        style={[
                          styles.genreToggleText,
                          isSelected && styles.genreToggleTextActive,
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
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  citizenBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
    borderColor: 'rgba(37, 99, 235, 0.3)',
    borderWidth: 1,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 9999,
    marginBottom: 6,
  },
  citizenBadgeText: {
    color: COLORS.accentLight,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    fontSize: 20,
    fontWeight: '800',
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
    backgroundColor: 'rgba(135, 0, 135, 0.2)',
    borderColor: 'rgba(232, 121, 249, 0.25)',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  miniGenreText: {
    color: COLORS.purpleLightest,
    fontSize: 10,
    fontWeight: '700',
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
    color: COLORS.textSecondary,
    letterSpacing: 0.8,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '900',
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
    marginTop: 12,
  },
  emptyTabSub: {
    color: COLORS.textSecondary,
    fontSize: 12,
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
    fontWeight: '700',
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
    fontWeight: '800',
  },
  reviewComment: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 6,
  },
  reviewDate: {
    color: 'rgba(137, 146, 165, 0.5)',
    fontSize: 10,
  },
  tasteContainer: {
    paddingVertical: 8,
  },
  tasteInstruction: {
    color: COLORS.textSecondary,
    fontSize: 13,
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
    backgroundColor: 'rgba(13, 18, 31, 0.8)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
  },
  genreToggleBtnActive: {
    backgroundColor: 'rgba(135, 0, 135, 0.25)',
    borderColor: 'rgba(232, 121, 249, 0.5)',
  },
  genreToggleText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  genreToggleTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
});
