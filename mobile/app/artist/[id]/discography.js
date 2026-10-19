// mobile/app/artist/[id]/discography.js
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '../../../src/context/ThemeContext';
import { FONTS } from '../../../src/constants/theme';
import { ApiService } from '../../../src/services/api';
import { GrooveLoader, GrooveAppBar } from '../../../src/components';

export default function ArtistDiscographyScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const [artist, setArtist] = useState(null);
  const [allReleases, setAllReleases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    let mounted = true;
    async function loadDiscography() {
      if (!id) return;
      setLoading(true);
      try {
        const artistData = await ApiService.fetchArtist(String(id));
        if (mounted && artistData) {
          setArtist(artistData);
          setAllReleases(artistData.allReleases || artistData.albums || []);
        }
      } catch (err) {
        console.warn('Failed to load discography:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadDiscography();
    return () => {
      mounted = false;
    };
  }, [id]);

  const filteredReleases = useMemo(() => {
    if (!allReleases) return [];
    if (activeTab === 'all') return allReleases;
    if (activeTab === 'album') return allReleases.filter((r) => r.typeCategory === 'album' || r.type === 'album');
    if (activeTab === 'single_ep') return allReleases.filter((r) => r.typeCategory === 'single' || r.typeCategory === 'ep' || r.type === 'single');
    if (activeTab === 'compilation') return allReleases.filter((r) => r.typeCategory === 'compilation');
    if (activeTab === 'live') return allReleases.filter((r) => r.typeCategory === 'live');
    return allReleases;
  }, [allReleases, activeTab]);

  const artistName = artist?.name || artist?.title || 'Artist';

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
        <GrooveLoader fullScreen text="Loading Discography..." />
      </SafeAreaView>
    );
  }

  const tabs = [
    { id: 'all', label: `All (${allReleases.length})` },
    { id: 'album', label: 'Studio Albums' },
    { id: 'single_ep', label: 'Singles & EPs' },
    { id: 'compilation', label: 'Compilations' },
    { id: 'live', label: 'Live' },
  ];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]} edges={['left', 'right']}>
      {/* App Bar */}
      <GrooveAppBar
        title={`${artistName} Discography`}
        subtitle={`${filteredReleases.length} releases`}
      />

      <View style={[styles.container, { paddingTop: (Platform.OS === 'ios' ? Math.max(insets.top, 44) : Math.max(insets.top, 24)) + 58 }]}>
        {/* Filter Tabs Scroll */}
        <View style={styles.tabsWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsRow}>
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  style={[
                    styles.tabPill,
                    {
                      backgroundColor: isActive
                        ? (colors.accent || '#00F0FF')
                        : 'rgba(255, 255, 255, 0.05)',
                      borderColor: isActive ? (colors.accent || '#00F0FF') : colors.border,
                    },
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setActiveTab(tab.id);
                  }}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.tabPillText,
                      { color: isActive ? '#000' : colors.textSecondary, fontWeight: isActive ? '800' : '600' },
                    ]}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Releases Grid */}
        <FlatList
          data={filteredReleases}
          keyExtractor={(item, index) => `${item.id || item.title}-${index}`}
          numColumns={2}
          contentContainerStyle={[styles.gridContent, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => {
            const albTitle = item.title || item.name || 'Untitled Release';
            const albCover = item.coverArt || item.image || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80';
            const albYear = item.year || item.releaseYear || '';

            return (
              <Animated.View entering={FadeInDown.duration(300).delay(Math.min(index * 30, 300))} style={styles.gridItemWrapper}>
                <TouchableOpacity
                  style={[styles.releaseCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
                  activeOpacity={0.8}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push(`/album/${item.id || encodeURIComponent(albTitle)}`);
                  }}
                >
                  <Image source={{ uri: albCover }} style={styles.releaseCover} resizeMode="cover" />
                  <View style={styles.releaseInfo}>
                    <Text style={[styles.releaseTitle, { color: colors.text }]} numberOfLines={1}>
                      {albTitle}
                    </Text>
                    <View style={styles.releaseMetaRow}>
                      {albYear ? <Text style={[styles.releaseYear, { color: colors.textSecondary }]}>{albYear}</Text> : null}
                      {item.typeCategory ? (
                        <View style={[styles.typeBadge, { backgroundColor: 'rgba(255, 255, 255, 0.08)' }]}>
                          <Text style={[styles.typeBadgeText, { color: colors.subtext }]}>{item.typeCategory.toUpperCase()}</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            );
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  tabsWrapper: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  tabsRow: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tabPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  tabPillText: {
    fontSize: 12,
    fontFamily: FONTS.displaySemiBold,
  },
  gridContent: {
    padding: 12,
  },
  gridItemWrapper: {
    flex: 1,
    padding: 6,
  },
  releaseCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  releaseCover: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  releaseInfo: {
    padding: 10,
  },
  releaseTitle: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: FONTS.displaySemiBold,
    marginBottom: 4,
  },
  releaseMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  releaseYear: {
    fontSize: 11,
    fontFamily: FONTS.body,
  },
  typeBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  typeBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    fontFamily: FONTS.display,
  },
});
