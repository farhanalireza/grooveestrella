// src/components/GrooveCardModal.js
import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Platform,
  ActivityIndicator,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';
import * as Clipboard from 'expo-clipboard';
import {
  downloadCardImage,
  shareCard,
} from '../utils/cardExport';
import GrooveLogo from './GrooveLogo';
import { useTheme } from '../context/ThemeContext';
import { COLORS, FONTS } from '../constants/theme';

const THEMES = [
  { id: 'obsidian', label: 'Obsidian Dusk', colors: ['#0A0A0C', '#121216', '#050507'], border: 'rgba(255, 255, 255, 0.12)' },
  { id: 'cosmic', label: 'Cosmic Purple', colors: ['#1e1035', '#2e0854', '#0d0718'], border: 'rgba(232, 121, 249, 0.3)' },
  { id: 'ocean', label: 'Ocean Blue', colors: ['#061a2f', '#092b4c', '#030d18'], border: 'rgba(96, 165, 250, 0.3)' },
  { id: 'sunset', label: 'Sunset Rose', colors: ['#2d0e19', '#471426', '#14060b'], border: 'rgba(244, 63, 94, 0.3)' },
];

const QR_COLORS = [
  { id: '000000', label: 'Black', color: '#000000' },
  { id: '9333ea', label: 'Purple', color: '#9333ea' },
  { id: '10b981', label: 'Emerald', color: '#10b981' },
  { id: '06b6d4', label: 'Cyan', color: '#06b6d4' },
  { id: 'ec4899', label: 'Rose', color: '#ec4899' },
  { id: 'f59e0b', label: 'Amber', color: '#f59e0b' },
];

export default function GrooveCardModal({
  visible,
  onClose,
  item = null,
  target = null,
  title = '',
  artist = '',
  album = '',
  imageUrl = '',
  releaseDate = '',
  releaseYear = '',
  type = 'track',
  itemId = '',
}) {
  const { colors, isDark } = useTheme();
  const cardRef = useRef(null);
  const [selectedTheme, setSelectedTheme] = useState('obsidian');
  const [selectedQrColor, setSelectedQrColor] = useState('000000');
  const [showQR, setShowQR] = useState(true);
  const [showYear, setShowYear] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [qrFullScreen, setQrFullScreen] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Normalize input item / target across tracks, albums, artists, playlists
  const t = item?.track || item || target?.track || target || {};

  const effectiveTitle = useMemo(() => {
    return (t.title || t.name || title || 'Untitled').trim();
  }, [t, title]);

  const effectiveArtist = useMemo(() => {
    if (t.artist && typeof t.artist === 'string') return t.artist;
    if (t.artistLabel && typeof t.artistLabel === 'string') return t.artistLabel;
    if (Array.isArray(t.artists) && t.artists.length > 0) {
      return t.artists
        .map((a) => (typeof a === 'string' ? a : a.name || a.title || ''))
        .filter(Boolean)
        .join(', ');
    }
    if (Array.isArray(t.artistCredits) && t.artistCredits.length > 0) {
      return t.artistCredits
        .map((a) => (typeof a === 'string' ? a : a.name || ''))
        .filter(Boolean)
        .join(', ');
    }
    if (t.artist && typeof t.artist === 'object' && t.artist.name) return t.artist.name;
    if (artist && typeof artist === 'string') return artist;
    return 'Unknown Artist';
  }, [t, artist]);

  const effectiveAlbum = useMemo(() => {
    if (typeof t.album === 'string') return t.album;
    if (t.album && typeof t.album === 'object' && t.album.title) return t.album.title;
    if (t.album && typeof t.album === 'object' && t.album.name) return t.album.name;
    if (album && typeof album === 'string') return album;
    return '';
  }, [t, album]);

  const effectiveImageUrl = useMemo(() => {
    return (
      t.imageUrl ||
      t.coverUrl ||
      t.coverArt ||
      t.image ||
      t.album?.images?.[0]?.url ||
      t.images?.[0]?.url ||
      imageUrl ||
      ''
    );
  }, [t, imageUrl]);

  useEffect(() => {
    setImgError(false);
  }, [effectiveImageUrl]);

  const effectiveType = useMemo(() => {
    return t.type || type || 'track';
  }, [t, type]);

  const effectiveId = useMemo(() => {
    return (
      t.id ||
      t.itemId ||
      t.musicbrainzId ||
      t.trackId ||
      t.trackURI ||
      itemId ||
      ''
    );
  }, [t, itemId]);

  const rawDate = useMemo(() => {
    return (
      t.releaseDate ||
      t.firstReleaseDate ||
      t.date ||
      t.year ||
      t.releaseYear ||
      releaseDate ||
      releaseYear ||
      ''
    );
  }, [t, releaseDate, releaseYear]);

  // Exact UTC Date calculation matching web app GrooveCardComposer
  const displayReleaseDate = useMemo(() => {
    if (rawDate) {
      const raw = String(rawDate).trim();
      if (/^\d{4}$/.test(raw)) return raw;
      const parsed = new Date(raw);
      if (!isNaN(parsed.getTime())) {
        try {
          return parsed.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            timeZone: 'UTC',
          });
        } catch (_) {
          return raw;
        }
      }
      return raw;
    }
    return null;
  }, [rawDate]);

  const activeThemeObj = THEMES.find((theme) => theme.id === selectedTheme) || THEMES[0];

  // Universal Groove routing link matching web app
  const universalUrl = useMemo(() => {
    if (effectiveId) {
      return `https://groove.amplecen.com/${effectiveType}/${effectiveId}?groovelink=true`;
    }
    return `https://groove.amplecen.com/${effectiveType}/${encodeURIComponent(effectiveTitle)}?groovelink=true`;
  }, [effectiveId, effectiveType, effectiveTitle]);

  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(
    universalUrl
  )}&color=${selectedQrColor}&bgcolor=ffffff&ecc=H&format=png`;

  // Download Card as high-res PNG into user camera roll
  const handleDownloadCard = async () => {
    if (isExporting) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsExporting(true);
    try {
      await downloadCardImage(cardRef, effectiveImageUrl, effectiveTitle);
    } finally {
      setIsExporting(false);
    }
  };

  // Direct System Share
  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await shareCard(cardRef, universalUrl, effectiveTitle, effectiveArtist);
  };

  const handleCopyLink = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Clipboard.setStringAsync(universalUrl);
    Toast.show({
      type: 'success',
      text1: 'Universal Link Copied! 📋',
      text2: universalUrl,
    });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />

        <View style={[styles.sheetContainer, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
          {/* Grab handle */}
          <View style={styles.grabHandle} />

          {/* Sheet Header */}
          <View style={styles.sheetHeader}>
            <View>
              <Text style={[styles.sheetTitle, { color: colors.text }]}>GrooveCard Composer</Text>
              <Text style={[styles.sheetSubtitle, { color: colors.textSecondary }]}>Personalize and export your music card</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* The Live GrooveCard Preview wrapped in capture container */}
            <View style={styles.cardPreviewWrapper}>
              <View
                ref={cardRef}
                collapsable={false}
                style={[
                  styles.grooveCard,
                  { borderColor: activeThemeObj.border, overflow: 'hidden' },
                ]}
              >
                <LinearGradient
                  colors={activeThemeObj.colors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />

                {/* Header row */}
                <View style={styles.cardHeaderRow}>
                  <View style={styles.cardLogoGroup}>
                    <GrooveLogo size={15} style={{ marginRight: 6 }} />
                    <Text style={styles.cardLogoText}>GROOVECARD</Text>
                  </View>
                  <View style={styles.musicLayerBadge}>
                    <Text style={styles.musicLayerBadgeText}>MUSIC LAYER</Text>
                  </View>
                </View>

                {/* Album artwork */}
                <View style={styles.cardArtworkContainer}>
                  {effectiveImageUrl && !imgError ? (
                    <Image
                      source={{ uri: effectiveImageUrl }}
                      style={styles.cardArtwork}
                      onError={() => setImgError(true)}
                    />
                  ) : (
                    <View style={styles.artworkFallback}>
                      <LinearGradient
                        colors={['rgba(212, 163, 115, 0.25)', 'rgba(71, 11, 36, 0.55)']}
                        style={StyleSheet.absoluteFill}
                      />
                      <GrooveLogo size={46} />
                      <Text style={styles.artworkFallbackTitle} numberOfLines={2}>
                        {effectiveTitle}
                      </Text>
                      <Text style={styles.artworkFallbackArtist} numberOfLines={1}>
                        {effectiveArtist}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Metadata & QR code row */}
                <View style={styles.cardInfoRow}>
                  <View style={styles.cardTextCol}>
                    <Text style={styles.cardTitle} numberOfLines={2}>{effectiveTitle}</Text>
                    <Text style={styles.cardArtist} numberOfLines={1}>{effectiveArtist}</Text>
                    {effectiveAlbum && effectiveAlbum !== effectiveTitle ? (
                      <Text style={styles.cardAlbum} numberOfLines={1}>Album: {effectiveAlbum}</Text>
                    ) : null}
                    {showYear && displayReleaseDate ? (
                      <View style={styles.yearPill}>
                        <Text style={styles.yearText}>{displayReleaseDate}</Text>
                      </View>
                    ) : null}
                  </View>

                  {/* QR code with centered app logo overlay */}
                  {showQR && (
                    <TouchableOpacity
                      style={styles.qrContainer}
                      activeOpacity={0.85}
                      onPress={() => setQrFullScreen(true)}
                    >
                      <Image source={{ uri: qrApiUrl }} style={styles.qrImage} />
                      <View style={styles.qrLogoOverlay}>
                        <GrooveLogo size={16} />
                      </View>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>

            {/* Customizer: Theme Selection */}
            <View style={styles.customSection}>
              <Text style={[styles.customLabel, { color: colors.textSecondary }]}>CARD THEME</Text>
              <View style={styles.themeGrid}>
                {THEMES.map((tItem) => {
                  const isSelected = selectedTheme === tItem.id;
                  return (
                    <TouchableOpacity
                      key={tItem.id}
                      style={[
                        styles.themeOptionBtn,
                        { borderColor: colors.border },
                        isSelected && {
                          borderColor: colors.accent,
                          backgroundColor: isDark ? 'rgba(71, 11, 36, 0.6)' : 'rgba(212, 163, 115, 0.25)',
                        },
                      ]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSelectedTheme(tItem.id);
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.themeSwatch, { backgroundColor: tItem.colors[1] }]} />
                      <Text
                        style={[
                          styles.themeOptionText,
                          { color: colors.textSecondary },
                          isSelected && { color: colors.text, fontWeight: '700' },
                        ]}
                      >
                        {tItem.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Customizer: QR Color chips */}
            {showQR && (
              <View style={styles.customSection}>
                <Text style={[styles.customLabel, { color: colors.textSecondary }]}>QR COLOR ACCENT</Text>
                <View style={styles.qrColorRow}>
                  {QR_COLORS.map((c) => {
                    const isSelected = selectedQrColor === c.id;
                    return (
                      <TouchableOpacity
                        key={c.id}
                        style={[
                          styles.qrColorChip,
                          { backgroundColor: c.color },
                          isSelected && styles.qrColorChipSelected,
                        ]}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setSelectedQrColor(c.id);
                        }}
                        activeOpacity={0.8}
                      >
                        {isSelected && <Ionicons name="checkmark" size={14} color="#FFF" />}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Toggles */}
            <View style={styles.toggleRow}>
              <TouchableOpacity
                style={[
                  styles.toggleBtn,
                  { borderColor: colors.border },
                  showQR && {
                    backgroundColor: isDark ? 'rgba(71, 11, 36, 0.6)' : 'rgba(212, 163, 115, 0.25)',
                    borderColor: colors.accent,
                  },
                ]}
                onPress={() => setShowQR(!showQR)}
              >
                <Ionicons
                  name={showQR ? 'qr-code' : 'qr-code-outline'}
                  size={15}
                  color={showQR ? colors.accent : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.toggleBtnText,
                    { color: colors.textSecondary },
                    showQR && { color: colors.text, fontWeight: '700' },
                  ]}
                >
                  {showQR ? 'QR Visible' : 'QR Hidden'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.toggleBtn,
                  { borderColor: colors.border },
                  showYear && {
                    backgroundColor: isDark ? 'rgba(71, 11, 36, 0.6)' : 'rgba(212, 163, 115, 0.25)',
                    borderColor: colors.accent,
                  },
                ]}
                onPress={() => setShowYear(!showYear)}
              >
                <Ionicons
                  name="calendar-outline"
                  size={15}
                  color={showYear ? colors.accent : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.toggleBtnText,
                    { color: colors.textSecondary },
                    showYear && { color: colors.text, fontWeight: '700' },
                  ]}
                >
                  {showYear ? 'Date Shown' : 'Date Hidden'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Action buttons */}
          <View style={[styles.footerRow, { borderTopColor: colors.border }]}>
            {/* Download card image */}
            <TouchableOpacity
              style={[styles.actionBtnSecondary, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={handleDownloadCard}
              disabled={isExporting}
              activeOpacity={0.8}
            >
              {isExporting ? (
                <ActivityIndicator size="small" color={colors.text} />
              ) : (
                <Ionicons name="download-outline" size={16} color={colors.text} />
              )}
              <Text style={[styles.actionBtnText, { color: colors.text }]}>
                {isExporting ? 'Saving...' : 'Download'}
              </Text>
            </TouchableOpacity>

            {/* Copy universal link */}
            <TouchableOpacity
              style={[styles.actionBtnSecondary, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={handleCopyLink}
              activeOpacity={0.8}
            >
              <Ionicons name="copy-outline" size={16} color={colors.text} />
              <Text style={[styles.actionBtnText, { color: colors.text }]}>Copy Link</Text>
            </TouchableOpacity>

            {/* System Share sheet */}
            <TouchableOpacity
              style={[styles.actionBtnPrimary, { backgroundColor: colors.accent }]}
              onPress={handleShare}
              activeOpacity={0.8}
            >
              <Ionicons name="share-social" size={16} color="#FFFFFF" />
              <Text style={[styles.actionBtnPrimaryText, { color: '#FFFFFF' }]}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Full-screen QR Modal */}
      {qrFullScreen && (
        <Modal visible={qrFullScreen} transparent animationType="fade" onRequestClose={() => setQrFullScreen(false)}>
          <View style={styles.fullQrOverlay}>
            <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setQrFullScreen(false)} />
            <View style={[styles.fullQrBox, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
              <Text style={[styles.fullQrTitle, { color: colors.text }]}>Scan Groove QR</Text>
              <View style={styles.fullQrImageWrapper}>
                <Image source={{ uri: qrApiUrl }} style={styles.fullQrImage} />
                <View style={styles.fullQrLogoBadge}>
                  <GrooveLogo size={24} />
                </View>
              </View>
              <Text style={[styles.fullQrSubtitle, { color: colors.textSecondary }]}>
                Scan with your phone's camera to instantly open in Groove
              </Text>
              <TouchableOpacity
                style={[styles.fullQrCloseBtn, { backgroundColor: colors.accent }]}
                onPress={() => setQrFullScreen(false)}
              >
                <Text style={styles.fullQrCloseText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(7, 9, 15, 0.88)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    maxHeight: '90%',
  },
  grabHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignSelf: 'center',
    marginBottom: 12,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  sheetTitle: {
    fontSize: 18,
    fontFamily: FONTS.displayBold,
    color: '#F4F7FF',
  },
  sheetSubtitle: {
    fontSize: 12,
    fontFamily: FONTS.body,
    color: '#8992A5',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  cardPreviewWrapper: {
    alignItems: 'center',
    marginVertical: 10,
  },
  grooveCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 8,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardLogoGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardLogoText: {
    fontSize: 10,
    fontFamily: FONTS.displayBold,
    letterSpacing: 2,
    color: '#8992A5',
  },
  musicLayerBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  musicLayerBadgeText: {
    fontSize: 9,
    fontFamily: FONTS.displayBold,
    color: 'rgba(255, 255, 255, 0.9)',
    letterSpacing: 1,
  },
  cardArtworkContainer: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#10141F',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  cardArtwork: {
    width: '100%',
    height: '100%',
  },
  artworkFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  artworkFallbackTitle: {
    fontSize: 14,
    fontFamily: FONTS.displayBold,
    color: '#FFFFFF',
    marginTop: 10,
    textAlign: 'center',
  },
  artworkFallbackArtist: {
    fontSize: 12,
    fontFamily: FONTS.bodyMedium,
    color: '#8992A5',
    marginTop: 4,
    textAlign: 'center',
  },
  cardInfoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  cardTextCol: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: FONTS.displayBold,
    color: '#FFFFFF',
    marginBottom: 4,
    lineHeight: 20,
  },
  cardArtist: {
    fontSize: 13,
    fontFamily: FONTS.bodySemiBold,
    color: '#8992A5',
    marginBottom: 4,
  },
  cardAlbum: {
    fontSize: 11,
    fontFamily: FONTS.body,
    color: 'rgba(137, 146, 165, 0.8)',
    fontStyle: 'italic',
    marginBottom: 6,
  },
  yearPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 2,
  },
  yearText: {
    fontSize: 10,
    fontFamily: FONTS.bodySemiBold,
    color: '#8992A5',
  },
  qrContainer: {
    width: 80,
    height: 80,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  qrImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  qrLogoOverlay: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  customSection: {
    marginBottom: 16,
  },
  customLabel: {
    fontSize: 11,
    fontFamily: FONTS.displayBold,
    color: '#8992A5',
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  themeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  themeOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    width: '48%',
  },
  themeSwatch: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  themeOptionText: {
    fontSize: 12,
    fontFamily: FONTS.bodyMedium,
    color: '#8992A5',
  },
  qrColorRow: {
    flexDirection: 'row',
    gap: 12,
  },
  qrColorChip: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrColorChipSelected: {
    borderColor: '#FFFFFF',
    transform: [{ scale: 1.1 }],
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  toggleBtnText: {
    fontSize: 12,
    fontFamily: FONTS.bodySemiBold,
  },
  footerRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: 1,
    gap: 10,
  },
  actionBtnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1,
  },
  actionBtnText: {
    fontSize: 13,
    fontFamily: FONTS.displayBold,
  },
  actionBtnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    borderRadius: 14,
  },
  actionBtnPrimaryText: {
    fontSize: 13,
    fontFamily: FONTS.displayBold,
  },
  fullQrOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  fullQrBox: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 28,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
  },
  fullQrTitle: {
    fontSize: 16,
    fontFamily: FONTS.displayBold,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 16,
  },
  fullQrImageWrapper: {
    width: 220,
    height: 220,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  fullQrImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  fullQrLogoBadge: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  fullQrSubtitle: {
    fontSize: 12,
    fontFamily: FONTS.body,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  fullQrCloseBtn: {
    paddingVertical: 10,
    paddingHorizontal: 28,
    borderRadius: 12,
  },
  fullQrCloseText: {
    fontSize: 13,
    fontFamily: FONTS.displayBold,
    color: '#FFFFFF',
  },
});
