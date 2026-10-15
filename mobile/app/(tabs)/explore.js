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
import { COLORS } from '../../src/constants/theme';
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
  const params = useLocalSearchParams();
  const [searchTerm, setSearchTerm] = useState(params.q ? String(params.q) : '');
  const [activeCategory, setActiveCategory] = useState('track');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const debounceTimer = useRef(null);

  const fetchResults = useCallback(async (query, type) => {
    setLoading(true);
    try {
      let searchQuery = query ? query.trim() : '';
      if (!searchQuery) {
        if (type === 'album') searchQuery = 'The Rise and Fall of Ziggy Stardust';
        else if (type === 'artist') searchQuery = 'David Bowie';
        else searchQuery = 'Ziggy Stardust';
      }
      const data = await ApiService.searchCatalog(searchQuery, type, 20);
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
      // Default initial recommendations
      fetchResults('', activeCategory);
    }
  }, [params.q, activeCategory, fetchResults]);

  // Debounced search handler (300ms)
  const handleTextChange = (text) => {
    setSearchTerm(text);
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      fetchResults(text, activeCategory);
    }, 300);
  };

  const handleCategoryPress = (catId) => {
    if (catId === activeCategory) return;
    setActiveCategory(catId);
    setResults([]);
    fetchResults(searchTerm, catId);
  };

  const handleClear = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSearchTerm('');
    fetchResults('', activeCategory);
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
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Search Header */}
      <View style={styles.header}>
        <Animated.View entering={FadeInDown.duration(400)}>
          <GlassCard style={styles.searchCard}>
            <View style={styles.searchInner}>
              <Ionicons
                name="search"
                size={18}
                color={COLORS.textSecondary}
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Search tracks, artists, albums..."
                placeholderTextColor="rgba(137, 146, 165, 0.55)"
                value={searchTerm}
                onChangeText={handleTextChange}
                returnKeyType="search"
                autoCapitalize="none"
              />
              {searchTerm.length > 0 && (
                <Pressable onPress={handleClear} style={styles.clearBtn} hitSlop={10}>
                  <Ionicons name="close-circle" size={18} color={COLORS.textSecondary} />
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
          <Ionicons name="search-outline" size={48} color={COLORS.textSecondary} style={{ opacity: 0.4 }} />
          <Text style={styles.emptyTitle}>
            {searchTerm ? `No ${activeCategory}s found` : 'Start Exploring'}
          </Text>
          <Text style={styles.emptyDesc}>
            {searchTerm
              ? `We couldn't find any results matching "${searchTerm}". Try another query.`
              : 'Search songs, albums, and artists across the decentralized music index.'}
          </Text>
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
    backgroundColor: COLORS.bg,
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
    color: COLORS.text,
    fontSize: 14,
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
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
