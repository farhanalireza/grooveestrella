// app/artist/[id].js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
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
import AlbumCard from '../../src/components/AlbumCard';

export default function ArtistDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [artist, setArtist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadArtist() {
      if (!id) return;
      setLoading(true);
      try {
        const [artistData, isSaved] = await Promise.all([
          ApiService.fetchArtist(String(id)),
          StorageService.isArtistSaved(String(id)),
        ]);
        if (mounted) {
          setArtist(artistData);
          setSaved(isSaved);
        }
      } catch {
        // Handled
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadArtist();
    return () => {
      mounted = false;
    };
  }, [id]);

  const handleToggleFollow = async () => {
    if (!artist) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const actualId = String(id);
    const name = artist.name || artist.title || 'Artist';

    if (saved) {
      await StorageService.removeSavedArtist(actualId);
      setSaved(false);
      Toast.show({
        type: 'info',
        text1: 'Unfollowed Artist',
        text2: `You unfollowed ${name}`,
      });
    } else {
      await StorageService.saveArtist({
        id: actualId,
        name,
        title: name,
        image: artist.image,
        followers: artist.followers,
        type: 'artist',
      });
      setSaved(true);
      Toast.show({
        type: 'success',
        text1: 'Following Artist 🎙️',
        text2: `${name} added to your followed artists`,
      });
    }
  };

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const name = artist?.name || artist?.title || 'Artist';
    const shareUrl = `https://grooveestrella.app/artist/${encodeURIComponent(String(id))}`;
    try {
      await Share.share({
        message: `Check out ${name} on GrooveEstrella: ${shareUrl}`,
        url: shareUrl,
        title: name,
      });
    } catch {
      // Ignored
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <GrooveLoader fullScreen text="Loading artist discography..." />
      </SafeAreaView>
    );
  }

  const name = artist?.name || artist?.title || 'Unknown Artist';
  const imageUrl = artist?.image || 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=600&auto=format&fit=crop&q=80';
  const topTracks = artist?.topTracks || [];
  const albums = artist?.albums || [];

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header Bar */}
      <View style={styles.header}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          style={styles.headerBtn}
          hitSlop={10}
        >
          <Ionicons name="chevron-down" size={24} color={COLORS.text} />
        </Pressable>

        <Text style={styles.headerTitle} numberOfLines={1}>
          Artist Profile
        </Text>

        <Pressable onPress={handleShare} style={styles.headerBtn} hitSlop={10}>
          <Ionicons name="share-social-outline" size={20} color={COLORS.text} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Large Circular Artist Image */}
        <Animated.View entering={FadeInDown.duration(450)} style={styles.avatarWrapper}>
          <View style={styles.avatarCircle}>
            <Image source={{ uri: imageUrl }} style={styles.avatarImage} resizeMode="cover" />
          </View>
        </Animated.View>

        {/* Artist Name & Badge */}
        <Animated.View entering={FadeInDown.duration(500).delay(100)} style={styles.metaContainer}>
          <Text style={styles.artistName}>{name}</Text>
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={14} color={COLORS.accentLight} style={{ marginRight: 4 }} />
            <Text style={styles.verifiedText}>VERIFIED ARTIST CATALOG</Text>
          </View>
        </Animated.View>

        {/* Follow / Save Button */}
        <Animated.View entering={FadeInDown.duration(500).delay(200)} style={styles.actionsRow}>
          <Pressable
            onPress={handleToggleFollow}
            style={[styles.followBtn, saved && styles.followBtnActive]}
          >
            <Ionicons
              name={saved ? 'checkmark' : 'add'}
              size={18}
              color={saved ? COLORS.purpleLightest : '#FFFFFF'}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.followBtnText, saved && styles.followBtnTextActive]}>
              {saved ? 'Following' : 'Follow Artist'}
            </Text>
          </Pressable>

          <Pressable onPress={handleShare} style={styles.secondaryActionBtn}>
            <Ionicons name="share-outline" size={18} color={COLORS.text} style={{ marginRight: 6 }} />
            <Text style={styles.secondaryActionText}>Share</Text>
          </Pressable>
        </Animated.View>

        {/* Top Tracks Section */}
        {topTracks.length > 0 && (
          <Animated.View entering={FadeInUp.duration(500).delay(300)} style={styles.section}>
            <Text style={styles.sectionTitle}>POPULAR RELEASES</Text>
            {topTracks.map((track) => (
              <TrackCard key={track.id} track={track} layout="list" />
            ))}
          </Animated.View>
        )}

        {/* Albums Grid Section */}
        {albums.length > 0 && (
          <Animated.View entering={FadeInUp.duration(500).delay(400)} style={styles.section}>
            <Text style={styles.sectionTitle}>DISCOGRAPHY & ALBUMS</Text>
            <View style={styles.albumsGrid}>
              {albums.map((album) => (
                <AlbumCard key={album.id} album={album} layout="grid" />
              ))}
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  headerBtn: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: 0.5,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  avatarWrapper: {
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    overflow: 'hidden',
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 3,
    borderColor: 'rgba(96, 165, 250, 0.35)',
    ...Platform.select({
      ios: {
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.45,
        shadowRadius: 20,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  metaContainer: {
    alignItems: 'center',
    marginBottom: 18,
  },
  artistName: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 6,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
    borderColor: 'rgba(37, 99, 235, 0.25)',
    borderWidth: 1,
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 9999,
  },
  verifiedText: {
    color: COLORS.accentLight,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 26,
    width: '100%',
    maxWidth: 320,
    alignSelf: 'center',
  },
  followBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accent,
    paddingVertical: 11,
    borderRadius: 14,
  },
  followBtnActive: {
    backgroundColor: 'rgba(135, 0, 135, 0.3)',
    borderColor: 'rgba(232, 121, 249, 0.5)',
    borderWidth: 1,
  },
  followBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  followBtnTextActive: {
    color: COLORS.purpleLightest,
  },
  secondaryActionBtn: {
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
  secondaryActionText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '700',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textSecondary,
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  albumsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});
