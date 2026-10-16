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
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, PLATFORMS } from '../../src/constants/theme';
import { StorageService } from '../../src/services/storage';
import { useTheme } from '../../src/context/ThemeContext';
import GlassCard from '../../src/components/GlassCard';

export default function SettingsScreen() {
  const { theme, isDark, setTheme, colors } = useTheme();
  const [preferredPlatform, setPreferredPlatform] = useState('none');
  const [counts, setCounts] = useState({
    songs: 0,
    albums: 0,
    artists: 0,
    playlists: 0,
  });

  const handleSelectTheme = async (mode) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await setTheme(mode);
    Toast.show({
      type: 'success',
      text1: `${mode === 'dark' ? 'Dark' : 'Light'} Theme Activated`,
      text2: mode === 'dark' ? 'Background: #470B24 • Foreground: #FFEDD5' : 'Background: #FFEDD5 • Foreground: #470B24',
    });
  };

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
          <Text style={[styles.headerTitle, { color: colors.text }]}>App Settings</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Configure GrooveLinks auto-routing and manage local offline collections.
          </Text>
        </Animated.View>

        {/* Section 0: Appearance & Theme */}
        <Animated.View entering={FadeInDown.duration(450)}>
          <View style={styles.sectionHeader}>
            <Ionicons name="color-palette-outline" size={16} color={colors.accent} style={{ marginRight: 8 }} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>APPEARANCE & THEME</Text>
          </View>

          <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
            Unified with Burgundy Wine (#470B24), Copper (#D4A373), and Warm Bisque (#FFEDD5).
          </Text>

          {/* Theme Mode Selector */}
          <View style={styles.themeGrid}>
            {/* Dark Theme Option */}
            <Pressable
              onPress={() => handleSelectTheme('dark')}
              style={[
                styles.themeCard,
                { backgroundColor: isDark ? 'rgba(71, 11, 36, 0.95)' : colors.cardBg, borderColor: isDark ? colors.accent : colors.border },
              ]}
            >
              <View style={styles.themeCardHeader}>
                <View style={[styles.themeIconCircle, { backgroundColor: '#470B24', borderColor: colors.accent }]}>
                  <Ionicons name="moon" size={16} color="#FFEDD5" />
                </View>
                {isDark && (
                  <Ionicons name="checkmark-circle" size={18} color={colors.accent} />
                )}
              </View>
              <Text style={[styles.themeCardTitle, { color: isDark ? '#FFEDD5' : colors.text }]}>
                Dark Theme
              </Text>
              <Text style={[styles.themeCardDesc, { color: isDark ? 'rgba(255, 237, 213, 0.75)' : colors.textSecondary }]}>
                BG: #470B24 • FG: #FFEDD5
              </Text>
            </Pressable>

            {/* Light Theme Option */}
            <Pressable
              onPress={() => handleSelectTheme('light')}
              style={[
                styles.themeCard,
                { backgroundColor: !isDark ? 'rgba(255, 237, 213, 0.95)' : colors.cardBg, borderColor: !isDark ? colors.accent : colors.border },
              ]}
            >
              <View style={styles.themeCardHeader}>
                <View style={[styles.themeIconCircle, { backgroundColor: '#FFEDD5', borderColor: '#470B24' }]}>
                  <Ionicons name="sunny" size={16} color="#470B24" />
                </View>
                {!isDark && (
                  <Ionicons name="checkmark-circle" size={18} color="#470B24" />
                )}
              </View>
              <Text style={[styles.themeCardTitle, { color: !isDark ? '#470B24' : colors.text }]}>
                Light Theme
              </Text>
              <Text style={[styles.themeCardDesc, { color: !isDark ? 'rgba(71, 11, 36, 0.75)' : colors.textSecondary }]}>
                BG: #FFEDD5 • FG: #470B24
              </Text>
            </Pressable>
          </View>

          {/* Canonical Gradient Preview Bar */}
          <View style={[styles.gradientPreviewCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            <View style={styles.gradientPreviewHeader}>
              <Text style={[styles.gradientPreviewTitle, { color: colors.text }]}>Unified Theme Gradient</Text>
              <Text style={[styles.gradientHexText, { color: colors.textSecondary }]}>#470B24 → #D4A373 → #FFEDD5</Text>
            </View>
            <LinearGradient
              colors={['#470B24', '#D4A373', '#FFEDD5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientBar}
            />
          </View>
        </Animated.View>

        {/* Section 1: GrooveLinks Preferences */}
        <Animated.View entering={FadeInDown.duration(450).delay(100)} style={styles.sectionSpacing}>
          <View style={styles.sectionHeader}>
            <Ionicons name="link" size={16} color={colors.accent} style={{ marginRight: 8 }} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>GROOVELINKS PREFERENCES</Text>
          </View>

          <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
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
                    {
                      backgroundColor: isSelected
                        ? (isDark ? 'rgba(232, 168, 124, 0.18)' : 'rgba(154, 74, 47, 0.12)')
                        : colors.surfaceElevated,
                      borderColor: isSelected ? colors.accent : colors.border,
                    },
                  ]}
                >
                  <View style={styles.platformCardTop}>
                    <Ionicons
                      name={platform.icon}
                      size={20}
                      color={isSelected ? colors.accent : platform.color || colors.textSecondary}
                    />
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={18} color={colors.accent} />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.platformName,
                      { color: isSelected ? colors.accent : colors.text },
                    ]}
                    numberOfLines={1}
                  >
                    {platform.name}
                  </Text>
                  <Text style={[styles.platformDesc, { color: colors.textSecondary }]} numberOfLines={2}>
                    {platform.desc}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Reset Preferences Button */}
          <Pressable onPress={handleResetPreferences} style={styles.resetPrefBtn}>
            <Ionicons name="refresh-outline" size={14} color={colors.textSecondary} style={{ marginRight: 6 }} />
            <Text style={[styles.resetPrefText, { color: colors.textSecondary }]}>Reset Routing Preferences</Text>
          </Pressable>
        </Animated.View>

        {/* Section 2: Library Data Manager */}
        <Animated.View entering={FadeInDown.duration(500).delay(200)} style={styles.sectionSpacing}>
          <View style={styles.sectionHeader}>
            <Ionicons name="server-outline" size={16} color={colors.accent} style={{ marginRight: 8 }} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>LIBRARY DATA MANAGER</Text>
          </View>

          <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
            Manage local offline cache and wipe individual library storage items.
          </Text>

          <GlassCard style={styles.managerCard}>
            {/* Row 1: Songs */}
            <View style={[styles.managerRow, { borderBottomColor: colors.border }]}>
              <View style={styles.managerInfo}>
                <Ionicons name="musical-notes" size={18} color={colors.accent} style={{ marginRight: 10 }} />
                <View>
                  <Text style={[styles.managerName, { color: colors.text }]}>Saved Songs</Text>
                  <Text style={[styles.managerCount, { color: colors.textSecondary }]}>{counts.songs} items stored</Text>
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
            <View style={[styles.managerRow, { borderBottomColor: colors.border }]}>
              <View style={styles.managerInfo}>
                <Ionicons name="disc" size={18} color={colors.accent} style={{ marginRight: 10 }} />
                <View>
                  <Text style={[styles.managerName, { color: colors.text }]}>Saved Albums</Text>
                  <Text style={[styles.managerCount, { color: colors.textSecondary }]}>{counts.albums} items stored</Text>
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
            <View style={[styles.managerRow, { borderBottomColor: colors.border }]}>
              <View style={styles.managerInfo}>
                <Ionicons name="people" size={18} color="#34D399" style={{ marginRight: 10 }} />
                <View>
                  <Text style={[styles.managerName, { color: colors.text }]}>Followed Artists</Text>
                  <Text style={[styles.managerCount, { color: colors.textSecondary }]}>{counts.artists} items stored</Text>
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
                  <Text style={[styles.managerName, { color: colors.text }]}>Playlists</Text>
                  <Text style={[styles.managerCount, { color: colors.textSecondary }]}>{counts.playlists} items stored</Text>
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
        <Animated.View
          entering={FadeInDown.duration(500).delay(300)}
          style={[styles.privacyCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
        >
          <Ionicons name="shield-checkmark-outline" size={20} color={colors.accent} style={{ marginBottom: 8 }} />
          <Text style={[styles.privacyTitle, { color: colors.text }]}>Local-First & Privacy Conscious</Text>
          <Text style={[styles.privacyText, { color: colors.textSecondary }]}>
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
    backgroundColor: 'rgba(232, 168, 124, 0.18)',
    borderColor: 'rgba(232, 168, 124, 0.45)',
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
    backgroundColor: 'rgba(232, 168, 124, 0.08)',
    borderColor: 'rgba(232, 168, 124, 0.2)',
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
  themeGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  themeCard: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 14,
  },
  themeCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  themeIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  themeCardDesc: {
    fontSize: 10,
    fontWeight: '600',
    lineHeight: 14,
  },
  gradientPreviewCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    marginBottom: 8,
  },
  gradientPreviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  gradientPreviewTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  gradientHexText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  gradientBar: {
    height: 12,
    borderRadius: 6,
    width: '100%',
  },
});
