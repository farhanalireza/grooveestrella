// src/components/MusicLoreAndReviews.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, FONTS } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

export default function MusicLoreAndReviews({
  id = '',
  type = 'track', // 'track' | 'album' | 'artist'
  title = '',
  artist = '',
  description = null,
  tags = [],
  rating = null,
}) {
  const { colors, isDark } = useTheme();
  const [expandedDesc, setExpandedDesc] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [userRating, setUserRating] = useState(5);
  const [userNameInput, setUserNameInput] = useState('');
  const [userCommentInput, setUserCommentInput] = useState('');

  const storageKey = `groove_reviews_${id}`;

  // Default seed tags matching genre/style catalogs
  const displayTags = (tags && tags.length > 0)
    ? tags
    : [
        { label: 'album rock', count: 7 },
        { label: 'classic rock', count: 3 },
        { label: 'glam rock', count: 2 },
        { label: 'pop', count: 2 },
        { label: 'pop rock', count: 4 },
        { label: 'rock', count: 8 },
        { label: 'rock n roll', count: 3 },
        { label: 'rock/pop', count: 5 },
      ];

  // Default seed reviews
  useEffect(() => {
    let isMounted = true;
    async function loadReviews() {
      try {
        const stored = await AsyncStorage.getItem(storageKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            if (isMounted) setReviews(parsed);
            return;
          }
        }
      } catch {}

      const defaultReviews = [
        {
          id: 'seed-1',
          author: 'Groove Community',
          score: 5,
          badge: 'Verified Curator',
          date: 'Community Verified',
          text: `Outstanding ${type}. A quintessential representative with incredible musical craftsmanship and enduring appeal.`,
        },
        {
          id: 'seed-2',
          author: 'VinylCollector_99',
          score: 5,
          badge: 'Curator Pick',
          date: 'Curator Pick',
          text: `The arrangement and sound engineering on this ${type} are top tier. Always a highlight on any listening session.`,
        },
      ];
      if (isMounted) setReviews(defaultReviews);
    }

    loadReviews();
    return () => {
      isMounted = false;
    };
  }, [id, storageKey, type]);

  const handleSubmitReview = async () => {
    if (!userCommentInput.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Review text required',
        text2: 'Please write a brief comment for your review.',
      });
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const newRev = {
      id: `usr-${Date.now()}`,
      author: userNameInput.trim() || 'Groove Listener',
      score: userRating,
      badge: 'Community Listener',
      date: 'Just now',
      text: userCommentInput.trim(),
    };

    const updated = [newRev, ...reviews];
    setReviews(updated);
    await AsyncStorage.setItem(storageKey, JSON.stringify(updated));

    setUserCommentInput('');
    setShowReviewModal(false);
    Toast.show({
      type: 'success',
      text1: 'Review Submitted! ⭐',
      text2: 'Thank you for sharing your rating.',
    });
  };

  const avgScore = rating?.value ? Number(rating.value).toFixed(1) : type === 'artist' ? '4.8' : type === 'album' ? '4.5' : '4.7';
  const defaultLore =
    description ||
    `An acclaimed release by ${artist || 'the artist'}, featuring recognized styles and groundbreaking composition that left an indelible mark on modern music culture.`;

  return (
    <View style={styles.container}>
      {/* 1. All Community Tags & Musical Styles */}
      <View style={[styles.card, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
        <View style={styles.sectionHeader}>
          <View style={styles.headerTitleRow}>
            <Ionicons name="pricetag-outline" size={14} color={colors.accent} />
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>ALL COMMUNITY TAGS & MUSICAL STYLES</Text>
          </View>
          <Text style={[styles.tagCountHeader, { color: colors.textSecondary }]}>{displayTags.length} tags cataloged</Text>
        </View>

        <View style={styles.tagChipsWrap}>
          {displayTags.map((item, idx) => {
            const label = typeof item === 'string' ? item : item.label || item.name;
            const count = typeof item === 'object' ? item.count : null;
            return (
              <View
                key={idx}
                style={[
                  styles.tagChip,
                  {
                    backgroundColor: isDark ? 'rgba(232, 168, 124, 0.12)' : 'rgba(154, 74, 47, 0.1)',
                    borderColor: isDark ? 'rgba(232, 168, 124, 0.3)' : 'rgba(154, 74, 47, 0.25)',
                  },
                ]}
              >
                <Text style={[styles.tagChipText, { color: colors.accent }]}>#{label}</Text>
                {count ? <Text style={[styles.tagChipCount, { color: colors.textSecondary, backgroundColor: colors.border }]}>{count}</Text> : null}
              </View>
            );
          })}
        </View>
      </View>

      {/* 2. Lore & Background Section */}
      <View style={[styles.card, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
        <View style={styles.sectionHeader}>
          <View style={styles.headerTitleRow}>
            <Ionicons name="book-outline" size={14} color={colors.accent} />
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
              {type.toUpperCase()} INFORMATION & LORE
            </Text>
          </View>
        </View>

        <Text style={[styles.loreTitle, { color: colors.text }]}>About {title}</Text>
        <Text
          style={[styles.loreBody, !expandedDesc && styles.loreBodyClamped, { color: colors.textSecondary }]}
          numberOfLines={expandedDesc ? undefined : 3}
        >
          {defaultLore}
        </Text>

        {defaultLore.length > 140 && (
          <TouchableOpacity
            style={styles.expandBtn}
            onPress={() => setExpandedDesc(!expandedDesc)}
          >
            <Text style={[styles.expandBtnText, { color: colors.accent }]}>
              {expandedDesc ? 'Show less' : 'Read full overview >'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 3. Reviews & Community Ratings */}
      <View style={[styles.card, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
        <View style={styles.sectionHeader}>
          <View style={styles.headerTitleRow}>
            <Ionicons name="chatbubbles-outline" size={14} color={colors.accent} />
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>REVIEWS & COMMUNITY RATINGS</Text>
          </View>

          <TouchableOpacity
            style={[styles.writeReviewBtn, { backgroundColor: colors.accent }]}
            onPress={() => setShowReviewModal(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="star" size={12} color="#FFF" />
            <Text style={styles.writeReviewBtnText}>WRITE A REVIEW</Text>
          </TouchableOpacity>
        </View>

        {/* Rating Overview */}
        <View style={[styles.ratingOverviewBox, { backgroundColor: isDark ? 'rgba(7, 9, 15, 0.5)' : colors.cardBg, borderColor: colors.border }]}>
          <Text style={[styles.ratingSubLabel, { color: colors.textSecondary }]}>OVERALL COMMUNITY SCORE</Text>
          <View style={styles.scoreRow}>
            <Text style={[styles.largeScoreText, { color: colors.text }]}>{avgScore}</Text>
            <Text style={[styles.maxScoreText, { color: colors.textSecondary }]}>/ 5.0</Text>
          </View>

          {/* Stars */}
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((s) => (
              <Ionicons key={s} name="star" size={18} color="#F59E0B" style={{ marginHorizontal: 1 }} />
            ))}
          </View>
          <Text style={[styles.voteCountText, { color: colors.textSecondary }]}>Based on {reviews.length * 4 + 1} community ratings</Text>

          {/* Rating Distribution Bar Chart */}
          <View style={[styles.distributionChart, { borderTopColor: colors.border }]}>
            <Text style={[styles.distribTitle, { color: colors.textSecondary }]}>RATING DISTRIBUTION</Text>

            <View style={styles.distribBarRow}>
              <Text style={[styles.distribStarLabel, { color: colors.textSecondary }]}>5★</Text>
              <View style={[styles.distribTrack, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)' }]}>
                <View style={[styles.distribFill, { width: '70%', backgroundColor: '#F59E0B' }]} />
              </View>
              <Text style={[styles.distribPercentText, { color: colors.textSecondary }]}>70%</Text>
            </View>

            <View style={styles.distribBarRow}>
              <Text style={[styles.distribStarLabel, { color: colors.textSecondary }]}>4★</Text>
              <View style={[styles.distribTrack, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)' }]}>
                <View style={[styles.distribFill, { width: '21%', backgroundColor: '#F59E0B' }]} />
              </View>
              <Text style={[styles.distribPercentText, { color: colors.textSecondary }]}>21%</Text>
            </View>

            <View style={styles.distribBarRow}>
              <Text style={[styles.distribStarLabel, { color: colors.textSecondary }]}>3★</Text>
              <View style={[styles.distribTrack, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)' }]}>
                <View style={[styles.distribFill, { width: '6%', backgroundColor: '#F59E0B' }]} />
              </View>
              <Text style={[styles.distribPercentText, { color: colors.textSecondary }]}>6%</Text>
            </View>

            <View style={styles.distribBarRow}>
              <Text style={[styles.distribStarLabel, { color: colors.textSecondary }]}>2★</Text>
              <View style={[styles.distribTrack, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)' }]}>
                <View style={[styles.distribFill, { width: '2%', backgroundColor: '#F59E0B' }]} />
              </View>
              <Text style={[styles.distribPercentText, { color: colors.textSecondary }]}>2%</Text>
            </View>

            <View style={styles.distribBarRow}>
              <Text style={[styles.distribStarLabel, { color: colors.textSecondary }]}>1★</Text>
              <View style={[styles.distribTrack, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)' }]}>
                <View style={[styles.distribFill, { width: '1%', backgroundColor: '#F59E0B' }]} />
              </View>
              <Text style={[styles.distribPercentText, { color: colors.textSecondary }]}>1%</Text>
            </View>
          </View>
        </View>

        {/* Community Reviews List */}
        <View style={styles.reviewsList}>
          {reviews.map((rev) => (
            <View key={rev.id} style={[styles.reviewItem, { backgroundColor: isDark ? 'rgba(16, 20, 31, 0.65)' : colors.cardBg, borderColor: colors.border }]}>
              <View style={styles.reviewHeaderRow}>
                <View style={styles.reviewAuthorGroup}>
                  <Text style={[styles.reviewAuthor, { color: colors.text }]}>{rev.author}</Text>
                  {rev.badge ? (
                    <View style={[styles.curatorBadge, { backgroundColor: isDark ? 'rgba(232, 168, 124, 0.15)' : 'rgba(154, 74, 47, 0.12)' }]}>
                      <Ionicons name="checkmark-circle" size={11} color={colors.accent} />
                      <Text style={[styles.curatorBadgeText, { color: colors.accent }]}>{rev.badge}</Text>
                    </View>
                  ) : null}
                </View>

                {/* Star rating */}
                <View style={styles.miniStarsRow}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Ionicons
                      key={star}
                      name="star"
                      size={11}
                      color={star <= rev.score ? '#F59E0B' : (isDark ? '#5E6678' : '#D1D5DB')}
                    />
                  ))}
                  <Text style={[styles.reviewDate, { color: colors.textSecondary }]}>• {rev.date}</Text>
                </View>
              </View>

              <Text style={[styles.reviewText, { color: colors.text }]}>"{rev.text}"</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Write a Review Modal */}
      <Modal
        visible={showReviewModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowReviewModal(false)}
      >
        <View style={styles.reviewModalOverlay}>
          <View style={[styles.reviewModalCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Write a Review</Text>
              <TouchableOpacity onPress={() => setShowReviewModal(false)}>
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalItemTitle, { color: colors.textSecondary }]}>{title}</Text>

            {/* Star Selector */}
            <View style={styles.starPickerRow}>
              {[1, 2, 3, 4, 5].map((num) => (
                <TouchableOpacity
                  key={num}
                  onPress={() => setUserRating(num)}
                  style={{ padding: 6 }}
                >
                  <Ionicons
                    name="star"
                    size={32}
                    color={num <= userRating ? '#F59E0B' : (isDark ? '#5E6678' : '#D1D5DB')}
                  />
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={[styles.nameInput, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : colors.surface, borderColor: colors.border, color: colors.text }]}
              placeholder="Your name or handle"
              placeholderTextColor={colors.textSecondary}
              value={userNameInput}
              onChangeText={setUserNameInput}
            />

            <TextInput
              style={[styles.commentInput, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : colors.surface, borderColor: colors.border, color: colors.text }]}
              placeholder="What makes this music stand out to you?"
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={4}
              value={userCommentInput}
              onChangeText={setUserCommentInput}
            />

            <TouchableOpacity style={[styles.submitReviewBtn, { backgroundColor: colors.accent }]} onPress={handleSubmitReview}>
              <Text style={styles.submitReviewBtnText}>Submit Review</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
    marginTop: 10,
    marginBottom: 40,
  },
  card: {
    backgroundColor: 'rgba(13, 18, 31, 0.75)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    flexWrap: 'wrap',
    gap: 8,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: FONTS.displayBold,
    color: '#8992A5',
    letterSpacing: 1,
  },
  tagCountHeader: {
    fontSize: 10,
    fontFamily: FONTS.bodyMedium,
    color: '#8992A5',
  },
  tagChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(232, 168, 124, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(232, 168, 124, 0.3)',
  },
  tagChipText: {
    fontSize: 11,
    fontFamily: FONTS.bodySemiBold,
    color: '#D4A373',
  },
  tagChipCount: {
    fontSize: 9,
    fontFamily: FONTS.bodyBold,
    color: '#8992A5',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
  },
  loreTitle: {
    fontSize: 16,
    fontFamily: FONTS.displayBold,
    color: '#F4F7FF',
    marginBottom: 8,
  },
  loreBody: {
    fontSize: 13,
    fontFamily: FONTS.body,
    color: '#8992A5',
    lineHeight: 20,
  },
  loreBodyClamped: {
    opacity: 0.9,
  },
  expandBtn: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  expandBtnText: {
    fontSize: 11,
    fontFamily: FONTS.displayBold,
    color: '#D4A373',
  },
  writeReviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#D4A373',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  writeReviewBtnText: {
    fontSize: 10,
    fontFamily: FONTS.displayBold,
    color: '#FFF',
    letterSpacing: 0.6,
  },
  ratingOverviewBox: {
    alignItems: 'center',
    paddingVertical: 14,
    backgroundColor: 'rgba(7, 9, 15, 0.5)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 16,
  },
  ratingSubLabel: {
    fontSize: 9,
    fontFamily: FONTS.displayBold,
    color: '#8992A5',
    letterSpacing: 1.5,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginVertical: 4,
  },
  largeScoreText: {
    fontSize: 36,
    fontFamily: FONTS.displayBold,
    color: '#F4F7FF',
    fontVariant: ['tabular-nums'],
  },
  maxScoreText: {
    fontSize: 14,
    fontFamily: FONTS.displayBold,
    color: '#8992A5',
  },
  starsRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  voteCountText: {
    fontSize: 11,
    fontFamily: FONTS.bodyMedium,
    color: 'rgba(137, 146, 165, 0.8)',
  },
  distributionChart: {
    width: '90%',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  distribTitle: {
    fontSize: 9,
    fontFamily: FONTS.displayBold,
    color: '#8992A5',
    letterSpacing: 1,
    marginBottom: 8,
    textAlign: 'center',
  },
  distribBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 5,
  },
  distribStarLabel: {
    width: 20,
    fontSize: 11,
    fontFamily: FONTS.displayBold,
    color: '#8992A5',
  },
  distribTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  distribFill: {
    height: '100%',
    borderRadius: 4,
  },
  distribPercentText: {
    width: 30,
    fontSize: 10,
    fontFamily: FONTS.bodyMedium,
    color: '#8992A5',
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  reviewsList: {
    gap: 10,
  },
  reviewItem: {
    padding: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(16, 20, 31, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  reviewHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    flexWrap: 'wrap',
    gap: 6,
  },
  reviewAuthorGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reviewAuthor: {
    fontSize: 12,
    fontFamily: FONTS.bodyBold,
    color: '#F4F7FF',
  },
  curatorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(232, 168, 124, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  curatorBadgeText: {
    fontSize: 9,
    fontFamily: FONTS.bodySemiBold,
    color: '#D4A373',
  },
  miniStarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  reviewDate: {
    fontSize: 10,
    fontFamily: FONTS.body,
    color: 'rgba(137, 146, 165, 0.7)',
    marginLeft: 4,
  },
  reviewText: {
    fontSize: 12,
    fontFamily: FONTS.body,
    color: 'rgba(244, 247, 255, 0.85)',
    lineHeight: 18,
    fontStyle: 'italic',
  },
  reviewModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  reviewModalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#10141F',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: FONTS.displayBold,
    color: '#F4F7FF',
  },
  modalItemTitle: {
    fontSize: 12,
    fontFamily: FONTS.body,
    color: '#8992A5',
    marginBottom: 14,
  },
  starPickerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  nameInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#FFF',
    fontSize: 13,
    fontFamily: FONTS.body,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  commentInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#FFF',
    fontSize: 13,
    fontFamily: FONTS.body,
    height: 90,
    textAlignVertical: 'top',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  submitReviewBtn: {
    backgroundColor: '#D4A373',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  submitReviewBtnText: {
    fontSize: 13,
    fontFamily: FONTS.displayBold,
    color: '#FFF',
  },
});
