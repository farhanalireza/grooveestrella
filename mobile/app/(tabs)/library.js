// app/(tabs)/library.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { COLORS, FONTS } from '../../src/constants/theme';
import { useTheme } from '../../src/context/ThemeContext';
import { StorageService } from '../../src/services/storage';
import GlassCard from '../../src/components/GlassCard';
import LiquidPill from '../../src/components/LiquidPill';
import TrackCard from '../../src/components/TrackCard';
import AlbumCard from '../../src/components/AlbumCard';
import ArtistCard from '../../src/components/ArtistCard';
import PlaylistCard from '../../src/components/PlaylistCard';
import ImportPlaylistModal from '../../src/components/ImportPlaylistModal';

const TABS = [
  { id: 'songs', label: 'Songs', icon: 'musical-notes' },
  { id: 'albums', label: 'Albums', icon: 'disc' },
  { id: 'artists', label: 'Artists', icon: 'people' },
  { id: 'playlists', label: 'Playlists', icon: 'list' },
];

export default function LibraryScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('songs');
  const [songs, setSongs] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [artists, setArtists] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [customPlaylists, setCustomPlaylists] = useState([]);

  // Create Playlist Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPlName, setNewPlName] = useState('');
  const [newPlDesc, setNewPlDesc] = useState('');

  // Import Playlist Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const loadData = useCallback(async () => {
    const [savedS, savedA, savedArt, savedPl, customPl] = await Promise.all([
      StorageService.getSavedSongs(),
      StorageService.getSavedAlbums(),
      StorageService.getSavedArtists(),
      StorageService.getSavedPlaylists(),
      StorageService.getCustomPlaylists(),
    ]);
    setSongs(savedS);
    setAlbums(savedA);
    setArtists(savedArt);
    setPlaylists(savedPl);
    setCustomPlaylists(customPl);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreatePlaylist = async () => {
    if (!newPlName.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Name Required',
        text2: 'Please enter a name for your playlist',
      });
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const created = await StorageService.createCustomPlaylist(newPlName, newPlDesc);
    if (created) {
      setCustomPlaylists((prev) => [created, ...prev]);
      setNewPlName('');
      setNewPlDesc('');
      setIsModalOpen(false);
      Toast.show({
        type: 'success',
        text1: 'Playlist Created 📁',
        text2: `"${created.name}" is now in your library`,
      });
    }
  };

  const handleDeleteCustomPlaylist = async (id) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await StorageService.removeCustomPlaylist(id);
    setCustomPlaylists((prev) => prev.filter((p) => p.id !== id));
    Toast.show({
      type: 'info',
      text1: 'Playlist Deleted',
      text2: 'Custom playlist removed from your library',
    });
  };

  const allPlaylists = [...customPlaylists, ...playlists];

  const renderHeader = () => (
    <View>
      {/* Title */}
      <Animated.View entering={FadeInDown.duration(400)} style={styles.titleRow}>
        <View
          style={[
            styles.iconBadge,
            {
              backgroundColor: isDark ? 'rgba(232, 168, 124, 0.15)' : 'rgba(154, 74, 47, 0.12)',
              borderColor: isDark ? 'rgba(232, 168, 124, 0.3)' : 'rgba(154, 74, 47, 0.25)',
            },
          ]}
        >
          <Ionicons name="folder-open" size={20} color={colors.accent} />
        </View>
        <Text style={[styles.titleText, { color: colors.text }]}>Your Library Collection</Text>
      </Animated.View>

      {/* Stats Grid (4 Cards) */}
      <Animated.View entering={FadeInDown.duration(450).delay(100)} style={styles.statsGrid}>
        <GlassCard style={styles.statCard}>
          <View style={styles.statTop}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>TRACKS</Text>
            <Ionicons name="musical-notes" size={14} color={colors.accent} />
          </View>
          <Text style={[styles.statNumber, { color: colors.text }]}>{songs.length}</Text>
        </GlassCard>

        <GlassCard style={styles.statCard}>
          <View style={styles.statTop}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>ALBUMS</Text>
            <Ionicons name="disc" size={14} color={colors.accent} />
          </View>
          <Text style={[styles.statNumber, { color: colors.text }]}>{albums.length}</Text>
        </GlassCard>

        <GlassCard style={styles.statCard}>
          <View style={styles.statTop}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>ARTISTS</Text>
            <Ionicons name="people" size={14} color="#34D399" />
          </View>
          <Text style={[styles.statNumber, { color: colors.text }]}>{artists.length}</Text>
        </GlassCard>

        <GlassCard style={styles.statCard}>
          <View style={styles.statTop}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>PLAYLISTS</Text>
            <Ionicons name="list" size={14} color="#FBBF24" />
          </View>
          <Text style={[styles.statNumber, { color: colors.text }]}>{allPlaylists.length}</Text>
        </GlassCard>
      </Animated.View>

      {/* Tab Pills */}
      <Animated.ScrollView
        entering={FadeInDown.duration(450).delay(200)}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsRow}
      >
        {TABS.map((tab) => {
          let count = songs.length;
          if (tab.id === 'albums') count = albums.length;
          if (tab.id === 'artists') count = artists.length;
          if (tab.id === 'playlists') count = allPlaylists.length;

          return (
            <LiquidPill
              key={tab.id}
              label={tab.label}
              icon={tab.icon}
              count={count}
              active={activeTab === tab.id}
              onPress={() => setActiveTab(tab.id)}
            />
          );
        })}
      </Animated.ScrollView>

      {/* Playlists Create & Import Button Bar */}
      {activeTab === 'playlists' && (
        <Animated.View entering={FadeIn.duration(300)} style={styles.createPlBar}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setIsModalOpen(true);
            }}
            style={[styles.createPlBtn, { flex: 1 }]}
          >
            <LinearGradient
              colors={['#470B24', '#D4A373']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.createPlGradient}
            >
              <Ionicons name="add" size={18} color="#FFFFFF" style={{ marginRight: 4 }} />
              <Text style={styles.createPlText}>Create</Text>
            </LinearGradient>
          </Pressable>

          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setIsImportModalOpen(true);
            }}
            style={[styles.importPlBtn, { borderColor: colors.border }]}
          >
            <Ionicons name="cloud-download-outline" size={17} color={colors.text} style={{ marginRight: 6 }} />
            <Text style={[styles.importPlText, { color: colors.text }]}>Import File</Text>
          </Pressable>
        </Animated.View>
      )}
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="musical-notes-outline" size={48} color={colors.textSecondary} style={{ opacity: 0.35 }} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>Empty {activeTab}</Text>
      <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
        You haven&apos;t saved any {activeTab} yet. Discover and bookmark tracks across GrooveEstrella.
      </Text>
      <Pressable
        onPress={() => router.push('/explore')}
        style={[styles.exploreBtn, { backgroundColor: colors.accent }]}
      >
        <Text style={styles.exploreBtnText}>Go to Explore</Text>
        <Ionicons name="arrow-forward" size={14} color="#FFFFFF" style={{ marginLeft: 6 }} />
      </Pressable>
    </View>
  );

  const isGrid = activeTab === 'albums' || activeTab === 'artists';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]} edges={['top', 'left', 'right']}>
      {activeTab === 'songs' && (
        <FlatList
          ListHeaderComponent={renderHeader}
          data={songs}
          keyExtractor={(item) => item.id || item.trackId}
          renderItem={({ item }) => (
            <TrackCard
              track={item}
              showRemove
              onRemove={async (id) => {
                await StorageService.removeSavedSong(id);
                setSongs((prev) => prev.filter((s) => s.id !== id && s.trackId !== id));
              }}
            />
          )}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {activeTab === 'albums' && (
        <FlatList
          key="albums-grid"
          ListHeaderComponent={renderHeader}
          data={albums}
          numColumns={2}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <AlbumCard
              album={item}
              layout="grid"
              showRemove
              onRemove={async (id) => {
                await StorageService.removeSavedAlbum(id);
                setAlbums((prev) => prev.filter((a) => a.id !== id));
              }}
            />
          )}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {activeTab === 'artists' && (
        <FlatList
          key="artists-grid"
          ListHeaderComponent={renderHeader}
          data={artists}
          numColumns={2}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ArtistCard
              artist={item}
              layout="grid"
              showRemove
              onRemove={async (id) => {
                await StorageService.removeSavedArtist(id);
                setArtists((prev) => prev.filter((a) => a.id !== id));
              }}
            />
          )}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {activeTab === 'playlists' && (
        <FlatList
          ListHeaderComponent={renderHeader}
          data={allPlaylists}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const isCustom = item.id?.startsWith('custom-') || item.id?.startsWith('pl-');
            return (
              <PlaylistCard
                playlist={item}
                isCustom={isCustom}
                onDelete={isCustom ? () => handleDeleteCustomPlaylist(item.id) : undefined}
                onPress={() => {
                  router.push(`/playlist/${item.id}`);
                }}
              />
            );
          }}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Create Playlist Modal */}
      <Modal
        visible={isModalOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setIsModalOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalBackdrop}>
            <GlassCard elevated style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Create New Playlist</Text>
                <Pressable onPress={() => setIsModalOpen(false)} hitSlop={10}>
                  <Ionicons name="close" size={20} color={colors.textSecondary} />
                </Pressable>
              </View>

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>PLAYLIST NAME</Text>
              <TextInput
                style={[
                  styles.modalInput,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : colors.surface,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                placeholder="e.g. Midnight Chill, Synthwave Roads"
                placeholderTextColor={colors.textSecondary}
                value={newPlName}
                onChangeText={setNewPlName}
                autoFocus
              />

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>DESCRIPTION (OPTIONAL)</Text>
              <TextInput
                style={[
                  styles.modalInput,
                  styles.modalInputArea,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : colors.surface,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                placeholder="Short description of this mix..."
                placeholderTextColor={colors.textSecondary}
                value={newPlDesc}
                onChangeText={setNewPlDesc}
                multiline
                numberOfLines={3}
              />

              <View style={styles.modalActions}>
                <Pressable
                  onPress={() => setIsModalOpen(false)}
                  style={styles.modalCancelBtn}
                >
                  <Text style={[styles.modalCancelText, { color: colors.textSecondary }]}>Cancel</Text>
                </Pressable>

                <Pressable
                  onPress={handleCreatePlaylist}
                  style={styles.modalSaveBtn}
                >
                  <LinearGradient
                    colors={['#470B24', '#D4A373']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.modalSaveGradient}
                  >
                    <Text style={styles.modalSaveText}>Create Playlist</Text>
                  </LinearGradient>
                </Pressable>
              </View>
            </GlassCard>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Import Playlist File Modal */}
      <ImportPlaylistModal
        visible={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportSuccess={(newPl) => {
          setCustomPlaylists((prev) => [newPl, ...prev]);
          loadData();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 110,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(232, 168, 124, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(232, 168, 124, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  titleText: {
    fontSize: 22,
    fontWeight: '800',
    fontFamily: FONTS.display,
    color: COLORS.text,
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
  tabsRow: {
    flexDirection: 'row',
    paddingVertical: 4,
    marginBottom: 14,
  },
  createPlBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  createPlBtn: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  createPlGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 14,
  },
  createPlText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    fontFamily: FONTS.display,
  },
  importPlBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  importPlText: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: FONTS.displaySemiBold,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    paddingHorizontal: 30,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    fontFamily: FONTS.display,
    color: COLORS.text,
    marginTop: 14,
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: 13,
    fontFamily: FONTS.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  exploreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accent,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  exploreBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: FONTS.displaySemiBold,
  },
  // Modal
  modalOverlay: {
    flex: 1,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    padding: 20,
    borderRadius: 22,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    fontFamily: FONTS.display,
    color: COLORS.text,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    fontFamily: FONTS.display,
    color: COLORS.textSecondary,
    letterSpacing: 1,
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.text,
    fontSize: 14,
    fontFamily: FONTS.body,
    marginBottom: 14,
  },
  modalInputArea: {
    height: 70,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 8,
  },
  modalCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    justifyContent: 'center',
  },
  modalCancelText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    fontFamily: FONTS.bodySemiBold,
  },
  modalSaveBtn: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalSaveGradient: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
  },
  modalSaveText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    fontFamily: FONTS.display,
  },
});
