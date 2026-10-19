// app/(tabs)/explore.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  FlatList,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useTheme } from '../../src/context/ThemeContext';
import { COLORS, FONTS } from '../../src/constants/theme';
import { ApiService } from '../../src/services/api';
import GlassCard from '../../src/components/GlassCard';
import LiquidPill from '../../src/components/LiquidPill';
import GrooveLoader from '../../src/components/GrooveLoader';
import TrackCard from '../../src/components/TrackCard';
import AlbumCard from '../../src/components/AlbumCard';
import ArtistCard from '../../src/components/ArtistCard';
import PlaylistCard from '../../src/components/PlaylistCard';

const CATEGORIES = [
  { id: 'track', label: 'Songs', icon: 'musical-notes' },
  { id: 'artist', label: 'Artists', icon: 'people' },
  { id: 'album', label: 'Albums', icon: 'disc' },
  { id: 'playlist', label: 'Playlists', icon: 'list' },
];

export default function ExploreScreen() {
  const { colors, isDark } = useTheme();
  const params = useLocalSearchParams();
  const [searchTerm, setSearchTerm] = useState(params.q ? String(params.q) : '');
  const [activeCategory, setActiveCategory] = useState('track');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const debounceTimer = useRef(null);

  const fetchResults = useCallback(async (query, type) => {
    const cleanQuery = (query || '').trim();
    if (!cleanQuery || cleanQuery.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await ApiService.searchCatalog(cleanQuery, type, 20);
      setResults(data || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load or search param change
  useEffect(() => {
    if (params.q) {
      const q = String(params.q);
      setSearchTerm(q);
      fetchResults(q, activeCategory);
    } else {
      // Clean slate on initial load - do NOT auto-search
      setResults([]);
      setLoading(false);
    }
  }, [params.q, activeCategory, fetchResults]);

  // Debounced search handler with 600ms latency so user has time to type
  const handleTextChange = (text) => {
    setSearchTerm(text);
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    const clean = (text || '').trim();
    if (clean.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceTimer.current = setTimeout(() => {
      fetchResults(clean, activeCategory);
    }, 600);
  };

  const handleCategoryPress = (catId) => {
    if (catId === activeCategory) return;
    setActiveCategory(catId);
    setResults([]);
    if (searchTerm.trim().length >= 2) {
      fetchResults(searchTerm, catId);
    }
  };

  const handleClear = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSearchTerm('');
    setResults([]);
    setLoading(false);
  };

  const renderItem = ({ item }) => {
    if (activeCategory === 'artist') {
      return <ArtistCard artist={item} layout="grid" />;
    }
    if (activeCategory === 'album') {
      return <AlbumCard album={item} layout="grid" />;
    }
    if (activeCategory === 'playlist') {
      return <PlaylistCard playlist={item} />;
    }
    return <TrackCard track={item} layout="list" />;
  };

  const isGrid = activeCategory === 'album' || activeCategory === 'artist' || activeCategory === 'playlist';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]} edges={['top', 'left', 'right']}>
      {/* Search Header */}
      <View style={styles.header}>
        <Animated.View entering={FadeInDown.duration(400)}>
          <GlassCard style={[styles.searchCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            <View style={styles.searchInner}>
              <Ionicons
                name="search"
                size={18}
                color={colors.textSecondary}
                style={styles.searchIcon}
              />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Search tracks, artists, albums..."
                placeholderTextColor={isDark ? 'rgba(255, 242, 223, 0.45)' : 'rgba(84, 30, 48, 0.45)'}
                value={searchTerm}
                onChangeText={handleTextChange}
                returnKeyType="search"
                autoCapitalize="none"
              />
              {searchTerm.length > 0 && (
                <Pressable onPress={handleClear} style={styles.clearBtn} hitSlop={10}>
                  <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
                </Pressable>
              )}
            </View>
          </GlassCard>
        </Animated.View>

        {/* Category Selector Pills */}
        <Animated.ScrollView
          entering={FadeInDown.duration(400).delay(100)}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryRow}
        >
          {CATEGORIES.map((cat) => (
            <LiquidPill
              key={cat.id}
              label={cat.label}
              icon={cat.icon}
              active={activeCategory === cat.id}
              onPress={() => handleCategoryPress(cat.id)}
            />
          ))}
        </Animated.ScrollView>
      </View>

      {/* Main Results Body */}
      {loading ? (
        <View style={styles.loaderCenter}>
          <GrooveLoader size={40} text="Searching catalog..." />
        </View>
      ) : results.length === 0 ? (
        <Animated.View entering={FadeIn.duration(400)} style={styles.emptyCenter}>
          <Ionicons
            name={searchTerm ? 'search-outline' : 'compass-outline'}
            size={48}
            color={colors.textSecondary}
            style={{ opacity: 0.4 }}
          />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            {searchTerm ? `No ${activeCategory}s found` : 'Search Groove'}
          </Text>
          <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
            {searchTerm
              ? `We couldn't find any results matching "${searchTerm}". Try another query.`
              : 'Search songs, albums, and artists across the decentralized music index.'}
          </Text>

          {!searchTerm && (
            <View style={styles.suggestSection}>
              <Text style={[styles.suggestTitle, { color: colors.textMuted }]}>POPULAR SEARCHES</Text>
              <View style={styles.suggestRow}>
                {['Pink Floyd', 'David Bowie', 'The Beatles', 'Queen', 'Michael Jackson', 'Led Zeppelin'].map((item) => (
                  <Pressable
                    key={item}
                    style={[
                      styles.suggestChip,
                      {
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : colors.cardBg,
                        borderColor: colors.border,
                      },
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSearchTerm(item);
                      fetchResults(item, activeCategory);
                    }}
                  >
                    <Ionicons name="trending-up" size={13} color={colors.accent} style={{ marginRight: 6 }} />
                    <Text style={[styles.suggestChipText, { color: colors.text }]}>{item}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}
        </Animated.View>
      ) : (
        <FlatList
          key={isGrid ? 'grid-2' : 'list-1'}
          data={results}
          keyExtractor={(item, index) => item.id || `res-${index}`}
          numColumns={isGrid ? 2 : 1}
          renderItem={renderItem}
          contentContainerStyle={[
            styles.listContainer,
            isGrid && styles.gridListContainer,
          ]}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  searchCard: {
    borderRadius: 18,
    marginBottom: 12,
  },
  searchInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontFamily: FONTS.bodyMedium,
    fontWeight: '500',
    paddingVertical: 10,
  },
  clearBtn: {
    padding: 6,
  },
  categoryRow: {
    flexDirection: 'row',
    paddingVertical: 4,
    paddingRight: 16,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 110, // Avoid bottom tab bar
  },
  gridListContainer: {
    paddingHorizontal: 10,
  },
  loaderCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 60,
  },
  emptyCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    fontFamily: FONTS.display,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDesc: {
    fontSize: 13,
    fontFamily: FONTS.body,
    textAlign: 'center',
    lineHeight: 20,
  },
  suggestSection: {
    marginTop: 28,
    alignItems: 'center',
    width: '100%',
  },
  suggestTitle: {
    fontSize: 11,
    fontWeight: '800',
    fontFamily: FONTS.display,
    color: '#8992A5',
    letterSpacing: 1.5,
    marginBottom: 14,
  },
  suggestRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  suggestChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  suggestChipText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: FONTS.bodySemiBold,
    color: '#F4F7FF',
  },
});
