// app/(tabs)/index.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { COLORS, GRADIENTS } from '../../src/constants/theme';
import { ApiService, isUrl } from '../../src/services/api';
import GlassCard from '../../src/components/GlassCard';
import GrooveLogo from '../../src/components/GrooveLogo';

export default function HomeScreen() {
  const router = useRouter();
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    const query = inputText.trim();
    if (!query || loading) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setError(null);

    // Flow A: URL conversion
    if (isUrl(query)) {
      setLoading(true);
      try {
        const result = await ApiService.convertUrl(query);
        setLoading(false);
        if (result?.redirectUrl) {
          router.push(result.redirectUrl);
        } else if (result?.id) {
          router.push(`/track/${encodeURIComponent(result.id)}`);
        } else {
          setError('Could not resolve music link. Please check the URL.');
        }
      } catch (err) {
        setLoading(false);
        setError(err.message || 'Failed to convert link. Make sure it is a valid Spotify, YouTube, or Apple Music link.');
      }
    } else {
      // Flow B: Text Music Search - navigate to explore screen
      router.push(`/explore?q=${encodeURIComponent(query)}`);
    }
  };

  const handleClear = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setInputText('');
    setError(null);
  };

  const isLink = isUrl(inputText);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Mission Tag Pill */}
          <Animated.View
            entering={FadeInDown.duration(600).delay(100)}
            style={styles.missionTagWrapper}
          >
            <View style={styles.missionTag}>
              <GrooveLogo size={18} style={{ marginRight: 8 }} />
              <Text style={styles.missionTagText}>MUSIC LAYER</Text>
            </View>
          </Animated.View>

          {/* Large Title */}
          <Animated.View
            entering={FadeInDown.duration(650).delay(200)}
            style={styles.titleContainer}
          >
            <Text style={styles.titleLineOne}>Share and open music</Text>
            <Text style={styles.titleLineTwo}>across all platforms</Text>
          </Animated.View>

          {/* Subtitle */}
          <Animated.Text
            entering={FadeInDown.duration(700).delay(300)}
            style={styles.subtitle}
          >
            Paste a link from Spotify, Apple Music, YouTube—or search for any song title to create a universal link and customizable GrooveCard sharing badge.
          </Animated.Text>

          {/* Search Input Bar */}
          <Animated.View
            entering={FadeInUp.duration(750).delay(400)}
            style={styles.searchBarWrapper}
          >
            <GlassCard elevated style={styles.searchBarCard}>
              <View style={styles.searchBarInner}>
                <Ionicons
                  name="search"
                  size={20}
                  color={COLORS.textSecondary}
                  style={styles.searchIcon}
                />

                <TextInput
                  style={styles.textInput}
                  placeholder="Paste link or search song title..."
                  placeholderTextColor="rgba(137, 146, 165, 0.55)"
                  value={inputText}
                  onChangeText={(text) => {
                    setInputText(text);
                    if (error) setError(null);
                  }}
                  editable={!loading}
                  returnKeyType="search"
                  onSubmitEditing={handleSubmit}
                  autoCapitalize="none"
                  autoCorrect={false}
                />

                {inputText.length > 0 && (
                  <Pressable
                    onPress={handleClear}
                    style={styles.clearButton}
                    hitSlop={10}
                  >
                    <Ionicons name="close-circle" size={18} color={COLORS.textSecondary} />
                  </Pressable>
                )}

                <Pressable
                  onPress={handleSubmit}
                  disabled={loading || !inputText.trim()}
                  style={[
                    styles.submitButton,
                    (!inputText.trim() || loading) && styles.submitButtonDisabled,
                  ]}
                >
                  <LinearGradient
                    colors={['#870087', '#A21CAF', '#C026D3']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.submitGradient}
                  >
                    <Text style={styles.submitText}>
                      {loading ? 'Routing...' : isLink ? 'Convert' : 'Search'}
                    </Text>
                    <Ionicons
                      name="arrow-forward"
                      size={15}
                      color="#FFFFFF"
                      style={{ marginLeft: 4 }}
                    />
                  </LinearGradient>
                </Pressable>
              </View>
            </GlassCard>
          </Animated.View>

          {/* Error Message Card */}
          {error && (
            <Animated.View
              entering={FadeInDown.duration(400)}
              style={styles.errorWrapper}
            >
              <View style={styles.errorCard}>
                <Ionicons name="alert-circle" size={18} color={COLORS.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            </Animated.View>
          )}

          {/* Quick Info Tip */}
          <Animated.View
            entering={FadeInUp.duration(700).delay(500)}
            style={styles.tipContainer}
          >
            <Ionicons
              name="information-circle-outline"
              size={16}
              color={COLORS.textSecondary}
              style={{ opacity: 0.7 }}
            />
            <Text style={styles.tipText}>
              Search title/artist or paste direct links to get universal routing paths.
            </Text>
          </Animated.View>

          {/* Featured Quick Suggestions */}
          <Animated.View
            entering={FadeInUp.duration(700).delay(600)}
            style={styles.quickSuggestions}
          >
            <Text style={styles.suggestionsTitle}>POPULAR SEARCHES</Text>
            <View style={styles.suggestionChips}>
              {['Starboy', 'Blinding Lights', 'Midnight City', 'Random Access Memories'].map(
                (term) => (
                  <Pressable
                    key={term}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setInputText(term);
                      router.push(`/explore?q=${encodeURIComponent(term)}`);
                    }}
                    style={styles.suggestionChip}
                  >
                    <Ionicons name="trending-up" size={12} color={COLORS.purpleLighter} style={{ marginRight: 5 }} />
                    <Text style={styles.suggestionChipText}>{term}</Text>
                  </Pressable>
                )
              )}
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 110, // Avoid bottom tab bar overlap
  },
  missionTagWrapper: {
    marginBottom: 20,
  },
  missionTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 9999,
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.25)',
  },
  sparkleIcon: {
    marginRight: 6,
  },
  missionTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.accentLight,
    letterSpacing: 2,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 14,
  },
  titleLineOne: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  titleLineTwo: {
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.accentLight,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 22,
    color: COLORS.textSecondary,
    textAlign: 'center',
    maxWidth: 320,
    marginBottom: 32,
  },
  searchBarWrapper: {
    width: '100%',
    maxWidth: 420,
    marginBottom: 16,
  },
  searchBarCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
  },
  searchBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  searchIcon: {
    marginLeft: 6,
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '500',
    paddingVertical: 10,
    paddingRight: 6,
  },
  clearButton: {
    padding: 6,
    marginRight: 4,
  },
  submitButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  errorWrapper: {
    width: '100%',
    maxWidth: 420,
    marginBottom: 16,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.errorBg,
    borderColor: COLORS.errorBorder,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
  },
  errorText: {
    marginLeft: 8,
    flex: 1,
    color: '#F87171',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 18,
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: 340,
    marginBottom: 36,
  },
  tipText: {
    marginLeft: 8,
    fontSize: 12,
    color: 'rgba(137, 146, 165, 0.65)',
    textAlign: 'center',
  },
  quickSuggestions: {
    width: '100%',
    alignItems: 'center',
  },
  suggestionsTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(137, 146, 165, 0.6)',
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  suggestionChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 20, 31, 0.8)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  suggestionChipText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
});
