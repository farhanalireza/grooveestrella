// app/(tabs)/settings.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { COLORS, PLATFORMS } from '../../src/constants/theme';
import { StorageService } from '../../src/services/storage';
import GlassCard from '../../src/components/GlassCard';

export default function SettingsScreen() {
  const [preferredPlatform, setPreferredPlatform] = useState('none');
  const [counts, setCounts] = useState({
    songs: 0,
    albums: 0,
    artists: 0,
    playlists: 0,
  });

  const loadSettingsData = useCallback(async () => {
    const [plat, countData] = await Promise.all([
      StorageService.getPreferredPlatform(),
      StorageService.getCounts(),
    ]);
    setPreferredPlatform(plat);
    setCounts(countData);
  }, []);

  useEffect(() => {
    loadSettingsData();
  }, [loadSettingsData]);

  const handleSelectPlatform = async (id) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPreferredPlatform(id);
    await StorageService.setPreferredPlatform(id);
    const platName = PLATFORMS.find((p) => p.id === id)?.name || id;
    Toast.show({
      type: 'success',
      text1: 'Routing Preference Saved',
      text2: `Default platform set to ${platName}`,
    });
  };

  const handleResetPreferences = () => {
    Alert.alert(
      'Reset GrooveLinks',
      'Reset your music routing preference back to "Always Ask"?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          onPress: async () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            await StorageService.setPreferredPlatform('none');
            setPreferredPlatform('none');
            Toast.show({
              type: 'info',
              text1: 'Preferences Reset',
              text2: 'Set back to Always Ask (Show GrooveCard)',
            });
          },
        },
      ]
    );
  };

  const handleClearCategory = (type, label) => {
    Alert.alert(
      `Clear Saved ${label}`,
      `Are you sure you want to delete all saved ${label.toLowerCase()}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            await StorageService.clearLibraryType(type);
            const freshCounts = await StorageService.getCounts();
            setCounts(freshCounts);
            Toast.show({
              type: 'info',
              text1: 'Library Updated',
              text2: `Cleared all saved ${label.toLowerCase()}`,
            });
          },
        },
      ]
    );
  };

  const handleClearAllLibrary = () => {
    Alert.alert(
      'Clear Entire Library',
      'Are you sure you want to delete ALL saved songs, albums, artists, and playlists from your device?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            await StorageService.clearAllLibrary();
            const freshCounts = await StorageService.getCounts();
            setCounts(freshCounts);
            Toast.show({
              type: 'success',
              text1: 'Library Cleared',
              text2: 'All saved media has been removed',
            });
          },
        },
      ]
    );
  };

  const handleFullReset = () => {
    Alert.alert(
      'Reset All App Data',
      'WARNING: This will wipe your local username, preferred music platform, custom playlists, and entire library. Proceed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Everything',
          style: 'destructive',
          onPress: async () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            await StorageService.resetAll();
            await loadSettingsData();
            Toast.show({
              type: 'error',
              text1: 'Full Reset Complete',
              text2: 'All data has been wiped back to defaults',
            });
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
          <Text style={styles.headerTitle}>App Settings</Text>
          <Text style={styles.headerSubtitle}>
            Configure GrooveLinks auto-routing and manage local offline collections.
          </Text>
        </Animated.View>

        {/* Section 1: GrooveLinks Preferences */}
        <Animated.View entering={FadeInDown.duration(450).delay(100)}>
          <View style={styles.sectionHeader}>
            <Ionicons name="link" size={16} color={COLORS.purpleLighter} style={{ marginRight: 8 }} />
            <Text style={styles.sectionTitle}>GROOVELINKS PREFERENCES</Text>
          </View>

          <Text style={styles.sectionDescription}>
            Choose which platform opens automatically when you click universal links.
          </Text>

          {/* Platform selector 2-column grid */}
          <View style={styles.platformGrid}>
            {PLATFORMS.map((platform) => {
              const isSelected = preferredPlatform === platform.id;
              return (
                <Pressable
                  key={platform.id}
                  onPress={() => handleSelectPlatform(platform.id)}
                  style={[
                    styles.platformCard,
                    isSelected && styles.platformCardSelected,
                  ]}
                >
                  <View style={styles.platformCardTop}>
                    <Ionicons
                      name={platform.icon}
                      size={20}
                      color={isSelected ? COLORS.purpleLightest : platform.color || COLORS.textSecondary}
                    />
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={18} color={COLORS.purpleLightest} />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.platformName,
                      isSelected && styles.platformNameSelected,
                    ]}
                    numberOfLines={1}
                  >
                    {platform.name}
                  </Text>
                  <Text style={styles.platformDesc} numberOfLines={2}>
                    {platform.desc}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Reset Preferences Button */}
          <Pressable onPress={handleResetPreferences} style={styles.resetPrefBtn}>
            <Ionicons name="refresh-outline" size={14} color={COLORS.textSecondary} style={{ marginRight: 6 }} />
            <Text style={styles.resetPrefText}>Reset Routing Preferences</Text>
          </Pressable>
        </Animated.View>

        {/* Section 2: Library Data Manager */}
        <Animated.View entering={FadeInDown.duration(500).delay(200)} style={styles.sectionSpacing}>
          <View style={styles.sectionHeader}>
            <Ionicons name="server-outline" size={16} color={COLORS.accentLight} style={{ marginRight: 8 }} />
            <Text style={styles.sectionTitle}>LIBRARY DATA MANAGER</Text>
          </View>

          <Text style={styles.sectionDescription}>
            Manage local offline cache and wipe individual library storage items.
          </Text>

          <GlassCard style={styles.managerCard}>
            {/* Row 1: Songs */}
            <View style={styles.managerRow}>
              <View style={styles.managerInfo}>
                <Ionicons name="musical-notes" size={18} color={COLORS.accentLight} style={{ marginRight: 10 }} />
                <View>
                  <Text style={styles.managerName}>Saved Songs</Text>
                  <Text style={styles.managerCount}>{counts.songs} items stored</Text>
                </View>
              </View>
              <Pressable
                onPress={() => handleClearCategory('songs', 'Songs')}
                style={styles.deleteMiniBtn}
                disabled={counts.songs === 0}
              >
                <Ionicons name="trash-outline" size={16} color={counts.songs === 0 ? 'rgba(137, 146, 165, 0.4)' : COLORS.error} />
              </Pressable>
            </View>

            {/* Row 2: Albums */}
            <View style={styles.managerRow}>
              <View style={styles.managerInfo}>
                <Ionicons name="disc" size={18} color={COLORS.purpleLighter} style={{ marginRight: 10 }} />
                <View>
                  <Text style={styles.managerName}>Saved Albums</Text>
                  <Text style={styles.managerCount}>{counts.albums} items stored</Text>
                </View>
              </View>
              <Pressable
                onPress={() => handleClearCategory('albums', 'Albums')}
                style={styles.deleteMiniBtn}
                disabled={counts.albums === 0}
              >
                <Ionicons name="trash-outline" size={16} color={counts.albums === 0 ? 'rgba(137, 146, 165, 0.4)' : COLORS.error} />
              </Pressable>
            </View>

            {/* Row 3: Artists */}
            <View style={styles.managerRow}>
              <View style={styles.managerInfo}>
                <Ionicons name="people" size={18} color="#34D399" style={{ marginRight: 10 }} />
                <View>
                  <Text style={styles.managerName}>Followed Artists</Text>
                  <Text style={styles.managerCount}>{counts.artists} items stored</Text>
                </View>
              </View>
              <Pressable
                onPress={() => handleClearCategory('artists', 'Artists')}
                style={styles.deleteMiniBtn}
                disabled={counts.artists === 0}
              >
                <Ionicons name="trash-outline" size={16} color={counts.artists === 0 ? 'rgba(137, 146, 165, 0.4)' : COLORS.error} />
              </Pressable>
            </View>

            {/* Row 4: Playlists */}
            <View style={[styles.managerRow, { borderBottomWidth: 0 }]}>
              <View style={styles.managerInfo}>
                <Ionicons name="list" size={18} color="#FBBF24" style={{ marginRight: 10 }} />
                <View>
                  <Text style={styles.managerName}>Playlists</Text>
                  <Text style={styles.managerCount}>{counts.playlists} items stored</Text>
                </View>
              </View>
              <Pressable
                onPress={() => handleClearCategory('playlists', 'Playlists')}
                style={styles.deleteMiniBtn}
                disabled={counts.playlists === 0}
              >
                <Ionicons name="trash-outline" size={16} color={counts.playlists === 0 ? 'rgba(137, 146, 165, 0.4)' : COLORS.error} />
              </Pressable>
            </View>
          </GlassCard>

          {/* Destructive Buttons */}
          <View style={styles.destructiveActions}>
            <Pressable onPress={handleClearAllLibrary} style={styles.clearLibraryBtn}>
              <Ionicons name="trash" size={16} color={COLORS.error} style={{ marginRight: 6 }} />
              <Text style={styles.clearLibraryText}>Clear Entire Library</Text>
            </Pressable>

            <Pressable onPress={handleFullReset} style={styles.resetAllBtn}>
              <Ionicons name="warning" size={16} color="#F59E0B" style={{ marginRight: 6 }} />
              <Text style={styles.resetAllText}>Reset All App Data</Text>
            </Pressable>
          </View>
        </Animated.View>

        {/* Privacy Notice */}
        <Animated.View entering={FadeInDown.duration(500).delay(300)} style={styles.privacyCard}>
          <Ionicons name="shield-checkmark-outline" size={20} color={COLORS.accentLight} style={{ marginBottom: 8 }} />
          <Text style={styles.privacyTitle}>Local-First & Privacy Conscious</Text>
          <Text style={styles.privacyText}>
            All preferences, library bookmarks, and playlist caches are stored strictly on your local device. GrooveEstrella does not require account logins or capture telemetry without permission.
          </Text>
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
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 110,
  },
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.purpleLightest,
    letterSpacing: 1.2,
  },
  sectionDescription: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 14,
    lineHeight: 18,
  },
  platformGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  platformCard: {
    width: '48.5%',
    backgroundColor: 'rgba(13, 18, 31, 0.75)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
  },
  platformCardSelected: {
    backgroundColor: 'rgba(135, 0, 135, 0.25)',
    borderColor: 'rgba(232, 121, 249, 0.55)',
  },
  platformCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  platformName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 3,
  },
  platformNameSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  platformDesc: {
    fontSize: 10,
    color: COLORS.textSecondary,
    lineHeight: 14,
  },
  resetPrefBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  resetPrefText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  sectionSpacing: {
    marginTop: 20,
  },
  managerCard: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 14,
  },
  managerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  managerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  managerName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  managerCount: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  deleteMiniBtn: {
    padding: 8,
  },
  destructiveActions: {
    gap: 8,
    marginBottom: 24,
  },
  clearLibraryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderWidth: 1,
    paddingVertical: 12,
    borderRadius: 14,
  },
  clearLibraryText: {
    color: '#F87171',
    fontSize: 13,
    fontWeight: '800',
  },
  resetAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderWidth: 1,
    paddingVertical: 12,
    borderRadius: 14,
  },
  resetAllText: {
    color: '#FBBF24',
    fontSize: 13,
    fontWeight: '800',
  },
  privacyCard: {
    backgroundColor: 'rgba(16, 20, 31, 0.6)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
  },
  privacyTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 4,
  },
  privacyText: {
    fontSize: 11,
    color: 'rgba(137, 146, 165, 0.75)',
    textAlign: 'center',
    lineHeight: 16,
  },
});
