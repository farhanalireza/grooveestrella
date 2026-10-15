// app/album/[id].js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  FlatList,
  Pressable,
  Share,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { COLORS } from '../../src/constants/theme';
import { ApiService } from '../../src/services/api';
import { StorageService } from '../../src/services/storage';
import GrooveLoader from '../../src/components/GrooveLoader';
import TrackCard from '../../src/components/TrackCard';

export default function AlbumDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [albumData, setAlbumData] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

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
          setAlbumData(result?.album || null);
          setTracks(result?.tracks || []);
          setSaved(isSaved);
        }
      } catch {
        // Handled
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

    const actualId = String(id);
    if (saved) {
      await StorageService.removeSavedAlbum(actualId);
      setSaved(false);
      Toast.show({
        type: 'info',
        text1: 'Removed from Library',
        text2: `"${albumData.title}" has been unbookmarked`,
      });
    } else {
      await StorageService.saveAlbum({
        id: actualId,
        title: albumData.title,
        artist: albumData.artist,
        image: albumData.image,
        releaseYear: albumData.releaseYear,
        type: 'album',
      });
      setSaved(true);
      Toast.show({
        type: 'success',
        text1: 'Album Saved 💿',
        text2: `"${albumData.title}" is saved in your library`,
      });
    }
  };

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const shareUrl = `https://grooveestrella.app/album/${encodeURIComponent(String(id))}`;
    try {
      await Share.share({
        message: `Listen to "${albumData?.title}" by ${albumData?.artist} on GrooveEstrella: ${shareUrl}`,
        url: shareUrl,
        title: albumData?.title,
      });
    } catch {
      // Ignored
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <GrooveLoader fullScreen text="Loading album tracklist..." />
      </SafeAreaView>
    );
  }

  const title = albumData?.title || 'Unknown Album';
  const artist = albumData?.artist || 'Unknown Artist';
  const year = albumData?.releaseYear || '2024';
  const imageUrl = albumData?.image || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80';

  const renderHeader = () => (
    <View style={styles.headerContent}>
      {/* Album Artwork */}
      <Animated.View entering={FadeInDown.duration(450)} style={styles.artworkContainer}>
        <View style={styles.artworkCard}>
          <Image source={{ uri: imageUrl }} style={styles.artworkImage} resizeMode="cover" />
        </View>
      </Animated.View>

      {/* Title & Artist */}
      <Animated.View entering={FadeInDown.duration(500).delay(100)} style={styles.metaContainer}>
        <Text style={styles.albumTitle}>{title}</Text>
        <Text style={styles.albumArtist}>{artist}</Text>
        <Text style={styles.albumSub}>
          Album • {year} • {tracks.length} tracks
        </Text>
      </Animated.View>

      {/* Buttons */}
      <Animated.View entering={FadeInDown.duration(500).delay(200)} style={styles.buttonsRow}>
        <Pressable
          onPress={handleToggleSave}
          style={[styles.saveBtn, saved && styles.saveBtnActive]}
        >
          <Ionicons
            name={saved ? 'bookmark' : 'bookmark-outline'}
            size={18}
            color={saved ? COLORS.purpleLightest : COLORS.text}
            style={{ marginRight: 6 }}
          />
          <Text style={[styles.saveBtnText, saved && styles.saveBtnTextActive]}>
            {saved ? 'Saved' : 'Save Album'}
          </Text>
        </Pressable>

        <Pressable onPress={handleShare} style={styles.shareBtn}>
          <Ionicons name="share-outline" size={18} color={COLORS.text} style={{ marginRight: 6 }} />
          <Text style={styles.shareBtnText}>Share</Text>
        </Pressable>
      </Animated.View>

      <Text style={styles.tracklistHeading}>TRACKLIST</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          style={styles.backBtn}
          hitSlop={10}
        >
          <Ionicons name="chevron-down" size={24} color={COLORS.text} />
        </Pressable>

        <Text style={styles.topBarTitle} numberOfLines={1}>
          Album
        </Text>

        <Pressable onPress={handleShare} style={styles.backBtn} hitSlop={10}>
          <Ionicons name="share-social-outline" size={20} color={COLORS.text} />
        </Pressable>
      </View>

      <FlatList
        ListHeaderComponent={renderHeader}
        data={tracks}
        keyExtractor={(item, index) => item.id || `tr-${index}`}
        renderItem={({ item }) => (
          <TrackCard track={{ ...item, album: title }} layout="list" />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  backBtn: {
    padding: 8,
  },
  topBarTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: 0.5,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  headerContent: {
    alignItems: 'center',
    marginBottom: 20,
  },
  artworkContainer: {
    marginBottom: 18,
  },
  artworkCard: {
    width: 220,
    height: 220,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    ...Platform.select({
      ios: {
        shadowColor: '#870087',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.35,
        shadowRadius: 22,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  artworkImage: {
    width: '100%',
    height: '100%',
  },
  metaContainer: {
    alignItems: 'center',
    marginBottom: 18,
  },
  albumTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 4,
  },
  albumArtist: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  albumSub: {
    fontSize: 12,
    color: 'rgba(137, 146, 165, 0.7)',
    fontWeight: '500',
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
    width: '100%',
    maxWidth: 320,
  },
  saveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'rgba(255, 255, 255, 0.14)',
    borderWidth: 1,
    paddingVertical: 11,
    borderRadius: 14,
  },
  saveBtnActive: {
    backgroundColor: 'rgba(135, 0, 135, 0.25)',
    borderColor: 'rgba(232, 121, 249, 0.5)',
  },
  saveBtnText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '700',
  },
  saveBtnTextActive: {
    color: COLORS.purpleLightest,
    fontWeight: '800',
  },
  shareBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'rgba(255, 255, 255, 0.14)',
    borderWidth: 1,
    paddingVertical: 11,
    borderRadius: 14,
  },
  shareBtnText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '700',
  },
  tracklistHeading: {
    alignSelf: 'flex-start',
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textSecondary,
    letterSpacing: 1.5,
    marginBottom: 10,
  },
});
