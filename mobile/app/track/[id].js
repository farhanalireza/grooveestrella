// app/track/[id].js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  Pressable,
  Share,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { COLORS } from '../../src/constants/theme';
import { ApiService } from '../../src/services/api';
import { StorageService } from '../../src/services/storage';
import GlassCard from '../../src/components/GlassCard';
import GrooveLoader from '../../src/components/GrooveLoader';

const STREAMING_PLATFORMS = [
  { id: 'spotify', name: 'Spotify', icon: 'musical-notes', color: '#1DB954', getUrl: (title, artist) => `https://open.spotify.com/search/${encodeURIComponent(title + ' ' + artist)}` },
  { id: 'apple_music', name: 'Apple Music', icon: 'logo-apple', color: '#FA243C', getUrl: (title, artist) => `https://music.apple.com/search?term=${encodeURIComponent(title + ' ' + artist)}` },
  { id: 'youtube_music', name: 'YouTube Music', icon: 'play-circle', color: '#FF0000', getUrl: (title, artist) => `https://music.youtube.com/search?q=${encodeURIComponent(title + ' ' + artist)}` },
  { id: 'youtube', name: 'YouTube', icon: 'logo-youtube', color: '#FF0000', getUrl: (title, artist) => `https://www.youtube.com/results?search_query=${encodeURIComponent(title + ' ' + artist)}` },
  { id: 'deezer', name: 'Deezer', icon: 'disc', color: '#A238FF', getUrl: (title, artist) => `https://www.deezer.com/search/${encodeURIComponent(title + ' ' + artist)}` },
  { id: 'tidal', name: 'TIDAL', icon: 'diamond-outline', color: '#00FFFF', getUrl: (title, artist) => `https://listen.tidal.com/search?q=${encodeURIComponent(title + ' ' + artist)}` },
  { id: 'soundcloud', name: 'SoundCloud', icon: 'cloud-outline', color: '#FF5500', getUrl: (title, artist) => `https://soundcloud.com/search?q=${encodeURIComponent(title + ' ' + artist)}` },
];

export default function TrackDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [track, setTrack] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [preferredPlatform, setPreferredPlatform] = useState('none');
  const [showGrooveCardModal, setShowGrooveCardModal] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      if (!id) return;
      setLoading(true);
      try {
        const [trackData, isSaved, pref] = await Promise.all([
          ApiService.fetchTrack(String(id)),
          StorageService.isSongSaved(String(id)),
          StorageService.getPreferredPlatform(),
        ]);
        if (mounted) {
          setTrack(trackData);
          setSaved(isSaved);
          setPreferredPlatform(pref);
        }
      } catch {
        // Handled
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

    const actualId = String(id);
    if (saved) {
      await StorageService.removeSavedSong(actualId);
      setSaved(false);
      Toast.show({
        type: 'info',
        text1: 'Removed from Library',
        text2: `"${track.title}" has been unbookmarked`,
      });
    } else {
      await StorageService.saveSong({
        id: actualId,
        trackId: actualId,
        title: track.title,
        artist: track.artist,
        album: track.album,
        image: track.image,
        type: 'track',
      });
      setSaved(true);
      Toast.show({
        type: 'success',
        text1: 'Saved to Library 🎶',
        text2: `"${track.title}" is in your saved songs`,
      });
    }
  };

  const handleOpenPlatform = async (platformItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const url = platformItem.getUrl(track?.title || '', track?.artist || '');
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        await Linking.openURL(url);
      }
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Could Not Open Link',
        text2: `Check your internet connection or app support for ${platformItem.name}`,
      });
    }
  };

  const handleCopyLink = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const shareUrl = `https://grooveestrella.app/track/${encodeURIComponent(String(id))}`;
    try {
      await Share.share({
        message: `Listen to "${track?.title}" by ${track?.artist} on GrooveEstrella: ${shareUrl}`,
        url: shareUrl,
        title: track?.title,
      });
      Toast.show({
        type: 'success',
        text1: 'Link Shared',
        text2: 'Universal routing URL ready to send',
      });
    } catch {
      // Ignored
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <GrooveLoader fullScreen text="Resolving universal track metadata..." />
      </SafeAreaView>
    );
  }

  const title = track?.title || 'Unknown Track';
  const artist = track?.artist || 'Unknown Artist';
  const album = track?.album || 'Single';
  const releaseDate = track?.releaseDate || '2024';
  const imageUrl = track?.image || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=600&auto=format&fit=crop&q=80';

  const preferredPlatObj = STREAMING_PLATFORMS.find((p) => p.id === preferredPlatform);

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
          Universal Groove
        </Text>

        <Pressable onPress={handleToggleSave} style={styles.headerBtn} hitSlop={10}>
          <Ionicons
            name={saved ? 'bookmark' : 'bookmark-outline'}
            size={22}
            color={saved ? COLORS.purpleLighter : COLORS.text}
          />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Auto-redirect preference Banner */}
        {preferredPlatObj && (
          <Animated.View entering={FadeInDown.duration(400)} style={styles.autoRedirectBanner}>
            <View style={styles.autoRedirectLeft}>
              <Ionicons name={preferredPlatObj.icon} size={18} color={preferredPlatObj.color} />
              <Text style={styles.autoRedirectText}>
                Preferred platform: <Text style={{ fontWeight: '800', color: '#FFFFFF' }}>{preferredPlatObj.name}</Text>
              </Text>
            </View>
            <Pressable
              onPress={() => handleOpenPlatform(preferredPlatObj)}
              style={styles.autoRedirectLaunch}
            >
              <Text style={styles.autoRedirectLaunchText}>Launch</Text>
              <Ionicons name="arrow-forward" size={12} color="#FFFFFF" style={{ marginLeft: 3 }} />
            </Pressable>
          </Animated.View>
        )}

        {/* Center Artwork */}
        <Animated.View entering={FadeInDown.duration(500).delay(100)} style={styles.artworkContainer}>
          <View style={styles.artworkCard}>
            <Image source={{ uri: imageUrl }} style={styles.artworkImage} resizeMode="cover" />
          </View>
        </Animated.View>

        {/* Track Title and Artist Details */}
        <Animated.View entering={FadeInDown.duration(500).delay(200)} style={styles.metaContainer}>
          <Text style={styles.trackTitle}>{title}</Text>
          <Text style={styles.artistName}>{artist}</Text>

          <View style={styles.albumMetaBadge}>
            <Ionicons name="disc-outline" size={13} color={COLORS.textSecondary} style={{ marginRight: 5 }} />
            <Text style={styles.albumMetaText}>
              {album} {releaseDate ? `• ${releaseDate.slice(0, 4)}` : ''}
            </Text>
          </View>
        </Animated.View>

        {/* Sharing & Badge Action Buttons */}
        <Animated.View entering={FadeInDown.duration(500).delay(300)} style={styles.actionButtons}>
          <Pressable onPress={handleCopyLink} style={styles.actionBtn}>
            <LinearGradient
              colors={['#2563EB', '#1D4ED8']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.actionBtnGradient}
            >
              <Ionicons name="share-social-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.actionBtnText}>Copy Universal Link</Text>
            </LinearGradient>
          </Pressable>

          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setShowGrooveCardModal(!showGrooveCardModal);
            }}
            style={styles.grooveCardToggleBtn}
          >
            <Ionicons name="card-outline" size={16} color={COLORS.purpleLightest} style={{ marginRight: 6 }} />
            <Text style={styles.grooveCardToggleText}>
              {showGrooveCardModal ? 'Hide GrooveCard' : 'Create GrooveCard'}
            </Text>
          </Pressable>
        </Animated.View>

        {/* GrooveCard Preview Section if toggled */}
        {showGrooveCardModal && (
          <Animated.View entering={FadeInDown.duration(400)} style={styles.grooveCardWrapper}>
            <GlassCard elevated style={styles.grooveCard}>
              <View style={styles.grooveCardHeader}>
                <View style={styles.grooveCardBrand}>
                  <Ionicons name="sparkles" size={12} color={COLORS.purpleLighter} style={{ marginRight: 5 }} />
                  <Text style={styles.grooveCardBrandText}>GROOVECARD BADGE</Text>
                </View>
                <Ionicons name="qr-code" size={18} color={COLORS.textSecondary} />
              </View>

              <View style={styles.grooveCardBody}>
                <Image source={{ uri: imageUrl }} style={styles.grooveCardThumb} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.grooveCardTitle} numberOfLines={1}>{title}</Text>
                  <Text style={styles.grooveCardArtist} numberOfLines={1}>{artist}</Text>
                  <Text style={styles.grooveCardUrl}>grooveestrella.app/track/{id}</Text>
                </View>
              </View>

              <Text style={styles.grooveCardTip}>Scan or share this card to stream seamlessly on any provider.</Text>
            </GlassCard>
          </Animated.View>
        )}

        {/* Platform Links List */}
        <Animated.View entering={FadeInUp.duration(500).delay(400)} style={styles.platformsSection}>
          <Text style={styles.sectionHeaderTitle}>STREAM & OPEN ON</Text>

          {STREAMING_PLATFORMS.map((platform) => (
            <GlassCard key={platform.id} style={styles.platformRow}>
              <View style={styles.platformLeft}>
                <View style={[styles.platformIconWrapper, { backgroundColor: `${platform.color}22` }]}>
                  <Ionicons name={platform.icon} size={20} color={platform.color} />
                </View>
                <View>
                  <Text style={styles.platformRowName}>{platform.name}</Text>
                  <Text style={styles.platformRowSub}>Open track stream</Text>
                </View>
              </View>

              <Pressable
                onPress={() => handleOpenPlatform(platform)}
                style={styles.playButton}
              >
                <Text style={styles.playButtonText}>Play</Text>
                <Ionicons name="open-outline" size={13} color="#FFFFFF" style={{ marginLeft: 4 }} />
              </Pressable>
            </GlassCard>
          ))}
        </Animated.View>
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  autoRedirectBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(37, 99, 235, 0.15)',
    borderColor: 'rgba(37, 99, 235, 0.3)',
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 20,
  },
  autoRedirectLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  autoRedirectText: {
    marginLeft: 8,
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  autoRedirectLaunch: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accent,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  autoRedirectLaunchText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  artworkContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  artworkCard: {
    width: 240,
    height: 240,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    ...Platform.select({
      ios: {
        shadowColor: '#870087',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.35,
        shadowRadius: 24,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  artworkImage: {
    width: '100%',
    height: '100%',
  },
  metaContainer: {
    alignItems: 'center',
    marginBottom: 22,
  },
  trackTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 4,
  },
  artistName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 10,
  },
  albumMetaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  albumMetaText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 22,
  },
  actionBtn: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  actionBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  grooveCardToggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(135, 0, 135, 0.15)',
    borderColor: 'rgba(232, 121, 249, 0.35)',
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 12,
  },
  grooveCardToggleText: {
    color: COLORS.purpleLightest,
    fontSize: 12,
    fontWeight: '800',
  },
  grooveCardWrapper: {
    marginBottom: 22,
  },
  grooveCard: {
    padding: 16,
    borderRadius: 20,
    borderColor: 'rgba(232, 121, 249, 0.35)',
  },
  grooveCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  grooveCardBrand: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  grooveCardBrandText: {
    color: COLORS.purpleLightest,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  grooveCardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  grooveCardThumb: {
    width: 50,
    height: 50,
    borderRadius: 10,
  },
  grooveCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
  },
  grooveCardArtist: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  grooveCardUrl: {
    fontSize: 10,
    color: COLORS.accentLight,
    fontWeight: '600',
  },
  grooveCardTip: {
    fontSize: 10,
    color: 'rgba(137, 146, 165, 0.65)',
    fontStyle: 'italic',
  },
  platformsSection: {
    marginBottom: 20,
  },
  sectionHeaderTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textSecondary,
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  platformRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
  },
  platformLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  platformIconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  platformRowName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  platformRowSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.16)',
    borderWidth: 1,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  playButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
