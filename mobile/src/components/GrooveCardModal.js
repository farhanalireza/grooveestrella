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
import RatingPieChart from './RatingPieChart';
import { useTheme } from '../context/ThemeContext';
import { COLORS, FONTS } from '../constants/theme';

const THEMES = [
  { id: 'obsidian', label: 'Obsidian', colors: ['#1f2029', '#0d0e13', '#050608'], border: 'rgba(255, 255, 255, 0.12)', accent: '#E8A87C' },
  { id: 'midnight', label: 'Midnight', colors: ['#17223b', '#0b1122', '#04070e'], border: 'rgba(56, 189, 248, 0.25)', accent: '#38BDF8' },
  { id: 'amber', label: 'Amber', colors: ['#2b1a0e', '#160c06', '#080402'], border: 'rgba(245, 158, 11, 0.25)', accent: '#F59E0B' },
  { id: 'slate', label: 'Slate', colors: ['#262933', '#14151a', '#090a0d'], border: 'rgba(255, 255, 255, 0.14)', accent: '#E2E8F0' },
  { id: 'emerald', label: 'Emerald', colors: ['#11261d', '#081610', '#030805'], border: 'rgba(16, 185, 129, 0.25)', accent: '#10B981' },
  { id: 'bordeaux', label: 'Bordeaux', colors: ['#2b0d1c', '#17060e', '#080205'], border: 'rgba(244, 63, 94, 0.25)', accent: '#F43F5E' },
  { id: 'monochrome', label: 'Carbon', colors: ['#18181b', '#111113', '#09090b'], border: 'rgba(255, 255, 255, 0.15)', accent: '#FFFFFF' },
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
  rating = null,
  duration = null,
  discCount = null,
  totalTracks = null,
  type = 'track',
  itemId = '',
}) {
  const { colors, isDark } = useTheme();
  const cardRef = useRef(null);
  const [selectedTheme, setSelectedTheme] = useState('obsidian');
  const [cornerWidget, setCornerWidget] = useState('rating'); // 'rating' (default) | 'qr' | 'none'
  const [selectedQrColor, setSelectedQrColor] = useState('000000');
  const [dateMode, setDateMode] = useState('year'); // 'year' (default) | 'full' | 'monthYear' | 'none'
  const [showDuration, setShowDuration] = useState(false);
  const [showDiscs, setShowDiscs] = useState(false);
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

  // Date parsing: Year primarily, month/date selectable
  const dateInfo = useMemo(() => {
    if (!rawDate) return { year: null, full: null, monthYear: null };
    const raw = String(rawDate).trim();
    const yearMatch = raw.match(/\b(19\d{2}|20\d{2})\b/);
    const year = yearMatch ? yearMatch[1] : raw;
    let full = year;
    let monthYear = year;

    const parsed = new Date(raw);
    if (!isNaN(parsed.getTime())) {
      try {
        full = parsed.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          timeZone: 'UTC',
        });
        monthYear = parsed.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          timeZone: 'UTC',
        });
      } catch (_) {}
    }

    return { year, full, monthYear };
  }, [rawDate]);

  const displayDate = useMemo(() => {
    if (dateMode === 'none') return null;
    if (dateMode === 'year') return dateInfo.year;
    if (dateMode === 'full') return dateInfo.full || dateInfo.year;
    if (dateMode === 'monthYear') return dateInfo.monthYear || dateInfo.year;
    return dateInfo.year;
  }, [dateMode, dateInfo]);

  // Duration formatting
  const effectiveDuration = duration || t.duration || t.duration_ms || null;
  const formattedDuration = useMemo(() => {
    if (!effectiveDuration || effectiveDuration <= 0) return null;
    const totalSecs = Math.floor(effectiveDuration > 1000 ? effectiveDuration / 1000 : effectiveDuration);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    if (mins >= 60) {
      const hours = Math.floor(mins / 60);
      const remMins = mins % 60;
      return `${hours}h ${remMins}m`;
    }
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }, [effectiveDuration]);

  // Discs / Tracks formatting
  const effectiveDiscs = discCount || t.disc || t.disc_number || null;
  const effectiveTracks = totalTracks || t.total_tracks || t.trackCount || null;
  const formattedDiscs = useMemo(() => {
    const dCount = effectiveDiscs && Number(effectiveDiscs) > 0 ? Number(effectiveDiscs) : null;
    const tCount = effectiveTracks && Number(effectiveTracks) > 0 ? Number(effectiveTracks) : null;
    if (dCount && dCount > 1) {
      return tCount ? `${dCount} Discs · ${tCount} Tracks` : `${dCount} Discs`;
    }
    if (tCount && tCount > 1) {
      return `${tCount} Tracks`;
    }
    if (dCount === 1 && effectiveType === 'track') {
      return 'Disc 1';
    }
    return null;
  }, [effectiveDiscs, effectiveTracks, effectiveType]);

  // Rating for Pie Chart
  const effectiveRating = useMemo(() => {
    if (rating && (rating.value !== undefined || typeof rating === 'number')) {
      return typeof rating === 'number' ? { value: rating } : rating;
    }
    if (t.rating) return t.rating;
    if (t.popularity) return { value: Math.max(1, Math.min(5, (t.popularity / 20))) };
    return { value: 4.4 };
  }, [rating, t]);

  const activeThemeObj = THEMES.find((theme) => theme.id === selectedTheme) || THEMES[0];

  // Universal Groove routing link
  const universalUrl = useMemo(() => {
    if (effectiveId) {
      return `https://groove.amplecen.com/${effectiveType}/${effectiveId}?groovelink=true`;
    }
    return `https://groove.amplecen.com/${effectiveType}/${encodeURIComponent(effectiveTitle)}?groovelink=true`;
  }, [effectiveId, effectiveType, effectiveTitle]);

  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(
    universalUrl
  )}&color=${selectedQrColor}&bgcolor=ffffff&ecc=H&format=png`;

  // Download Card as high-res PNG
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
              <Text style={[styles.sheetSubtitle, { color: colors.textSecondary }]}>Abstract backgrounds & customizable widgets</Text>
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

                {/* Subtle Ambient Radial Glow */}
                <View
                  style={[
                    styles.cardAmbientGlow,
                    { backgroundColor: activeThemeObj.accent },
                  ]}
                />

                {/* Header row: Unboxed, Minimal Typography */}
                <View style={styles.cardHeaderRow}>
                  <View style={styles.cardLogoGroup}>
                    <GrooveLogo size={14} style={{ marginRight: 6 }} />
                    <Text style={styles.cardLogoText}>GROOVECARD</Text>
                  </View>
                  <Text style={styles.cardTypeIndicator}>{(type || 'MUSIC').toUpperCase()}</Text>
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

                {/* Metadata & Bottom Right Widget row */}
                <View style={styles.cardInfoRow}>
                  <View style={styles.cardTextCol}>
                    <Text style={styles.cardTitle} numberOfLines={2}>{effectiveTitle}</Text>
                    <Text style={styles.cardArtist} numberOfLines={1}>{effectiveArtist}</Text>
                    {effectiveAlbum && effectiveAlbum !== effectiveTitle ? (
                      <Text style={styles.cardAlbum} numberOfLines={1}>{effectiveAlbum}</Text>
                    ) : null}

                    {/* Unboxed Dot-Separated Metadata Row */}
                    {(displayDate || (showDuration && formattedDuration) || (showDiscs && formattedDiscs)) ? (
                      <View style={styles.metaTextRow}>
                        {displayDate ? (
                          <Text style={styles.metaInlineText}>{displayDate}</Text>
                        ) : null}

                        {showDuration && formattedDuration ? (
                          <>
                            {displayDate ? <Text style={styles.metaDot}>•</Text> : null}
                            <Text style={styles.metaInlineText}>{formattedDuration}</Text>
                          </>
                        ) : null}

                        {showDiscs && formattedDiscs ? (
                          <>
                            {(displayDate || (showDuration && formattedDuration)) ? <Text style={styles.metaDot}>•</Text> : null}
                            <Text style={styles.metaInlineText}>{formattedDiscs}</Text>
                          </>
                        ) : null}
                      </View>
                    ) : null}
                  </View>

                  {/* Bottom Right Corner Widget: Unboxed Rating Pie (DEFAULT) OR QR Code OR None */}
                  {cornerWidget === 'rating' && (
                    <View style={styles.ratingCornerWidget}>
                      <RatingPieChart
                        rating={effectiveRating}
                        size="sm"
                        style={{ backgroundColor: 'transparent', borderWidth: 0, padding: 0 }}
                      />
                      <Text style={styles.ratingTinyLabel}>RATING</Text>
                    </View>
                  )}

                  {cornerWidget === 'qr' && (
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

            {/* Customizer Section 1: Abstract Themes */}
            <View style={styles.customSection}>
              <Text style={[styles.customLabel, { color: colors.textSecondary }]}>ABSTRACT BACKGROUND</Text>
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

            {/* Customizer Section 2: Corner Widget (Rating Pie vs QR vs None) */}
            <View style={styles.customSection}>
              <Text style={[styles.customLabel, { color: colors.textSecondary }]}>BOTTOM-RIGHT WIDGET</Text>
              <View style={styles.segmentedRow}>
                {[
                  { id: 'rating', label: 'Rating Pie (Default)', icon: 'star' },
                  { id: 'qr', label: 'QR Code', icon: 'qr-code' },
                  { id: 'none', label: 'None', icon: 'close-circle' },
                ].map((item) => {
                  const isSelected = cornerWidget === item.id;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.segmentedBtn,
                        { borderColor: colors.border },
                        isSelected && {
                          borderColor: colors.accent,
                          backgroundColor: colors.accent,
                        },
                      ]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setCornerWidget(item.id);
                      }}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name={item.icon}
                        size={13}
                        color={isSelected ? '#FFFFFF' : colors.textSecondary}
                        style={{ marginRight: 4 }}
                      />
                      <Text
                        style={[
                          styles.segmentedBtnText,
                          { color: isSelected ? '#FFFFFF' : colors.textSecondary },
                          isSelected && { fontWeight: '700' },
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* QR Color Accent row if QR is selected */}
              {cornerWidget === 'qr' && (
                <View style={[styles.qrColorRow, { marginTop: 12 }]}>
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
              )}
            </View>

            {/* Customizer Section 3: Date Format (Year Primary) */}
            <View style={styles.customSection}>
              <Text style={[styles.customLabel, { color: colors.textSecondary }]}>RELEASE DATE FORMAT (YEAR PRIMARY)</Text>
              <View style={styles.segmentedRow}>
                {[
                  { id: 'year', label: 'Year' },
                  { id: 'full', label: 'Full Date' },
                  { id: 'monthYear', label: 'Month/Year' },
                  { id: 'none', label: 'Hide' },
                ].map((d) => {
                  const isSelected = dateMode === d.id;
                  return (
                    <TouchableOpacity
                      key={d.id}
                      style={[
                        styles.segmentedBtn,
                        { borderColor: colors.border },
                        isSelected && {
                          borderColor: colors.accent,
                          backgroundColor: colors.accent,
                        },
                      ]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setDateMode(d.id);
                      }}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.segmentedBtnText,
                          { color: isSelected ? '#FFFFFF' : colors.textSecondary },
                          isSelected && { fontWeight: '700' },
                        ]}
                      >
                        {d.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Customizer Section 4: Optional Audio Info Toggles */}
            <View style={styles.customSection}>
              <Text style={[styles.customLabel, { color: colors.textSecondary }]}>AUDIO INFO (OPTIONAL)</Text>
              <View style={styles.toggleRow}>
                <TouchableOpacity
                  style={[
                    styles.toggleBtn,
                    { borderColor: colors.border },
                    showDuration && {
                      backgroundColor: isDark ? 'rgba(71, 11, 36, 0.6)' : 'rgba(212, 163, 115, 0.25)',
                      borderColor: colors.accent,
                    },
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setShowDuration(!showDuration);
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="time-outline"
                    size={15}
                    color={showDuration ? colors.accent : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.toggleBtnText,
                      { color: colors.textSecondary },
                      showDuration && { color: colors.text, fontWeight: '700' },
                    ]}
                  >
                    {showDuration ? 'Duration Shown' : 'Duration Hidden'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.toggleBtn,
                    { borderColor: colors.border },
                    showDiscs && {
                      backgroundColor: isDark ? 'rgba(71, 11, 36, 0.6)' : 'rgba(212, 163, 115, 0.25)',
                      borderColor: colors.accent,
                    },
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setShowDiscs(!showDiscs);
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="disc-outline"
                    size={15}
                    color={showDiscs ? colors.accent : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.toggleBtnText,
                      { color: colors.textSecondary },
                      showDiscs && { color: colors.text, fontWeight: '700' },
                    ]}
                  >
                    {showDiscs ? 'Discs Shown' : 'Discs Hidden'}
                  </Text>
                </TouchableOpacity>
              </View>
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
    position: 'relative',
  },
  cardAmbientGlow: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
    opacity: 0.25,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    zIndex: 10,
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
  cardTypeIndicator: {
    fontSize: 9,
    fontFamily: FONTS.bodySemiBold,
    color: 'rgba(255, 255, 255, 0.4)',
    letterSpacing: 1.5,
  },
  cardArtworkContainer: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#10141F',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    zIndex: 10,
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
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 10,
    zIndex: 10,
  },
  cardTextCol: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontFamily: FONTS.displayBold,
    color: '#FFFFFF',
    marginBottom: 2,
    lineHeight: 19,
  },
  cardArtist: {
    fontSize: 12,
    fontFamily: FONTS.bodySemiBold,
    color: 'rgba(255, 255, 255, 0.75)',
    marginBottom: 2,
  },
  cardAlbum: {
    fontSize: 10,
    fontFamily: FONTS.body,
    color: 'rgba(255, 255, 255, 0.5)',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  metaTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 3,
  },
  metaInlineText: {
    fontSize: 11,
    fontFamily: FONTS.bodyMedium,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  metaDot: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 1,
  },
  ratingCornerWidget: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    backgroundColor: 'transparent',
  },
  ratingTinyLabel: {
    fontSize: 8,
    fontFamily: FONTS.displayBold,
    color: 'rgba(255, 255, 255, 0.6)',
    letterSpacing: 1.5,
    marginTop: 2,
  },
  qrContainer: {
    width: 76,
    height: 76,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
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
    borderRadius: 10,
  },
  qrLogoOverlay: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
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
    letterSpacing: 1.2,
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
    fontSize: 11,
    fontFamily: FONTS.bodyMedium,
    color: '#8992A5',
  },
  segmentedRow: {
    flexDirection: 'row',
    gap: 6,
    padding: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 14,
  },
  segmentedBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
  },
  segmentedBtnText: {
    fontSize: 10,
    fontFamily: FONTS.bodyMedium,
  },
  qrColorRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  qrColorChip: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
  },
  fullQrLogoBadge: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullQrSubtitle: {
    fontSize: 12,
    fontFamily: FONTS.body,
    textAlign: 'center',
    marginBottom: 20,
  },
  fullQrCloseBtn: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullQrCloseText: {
    fontSize: 13,
    fontFamily: FONTS.displayBold,
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
