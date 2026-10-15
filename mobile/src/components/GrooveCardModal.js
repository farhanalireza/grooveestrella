// src/components/GrooveCardModal.js
import React, { useState, useMemo, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Share,
  Platform,
  ActivityIndicator,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import * as Clipboard from 'expo-clipboard';
import { COLORS } from '../constants/theme';

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
  title = '',
  artist = '',
  album = '',
  imageUrl = '',
  releaseDate = '',
  type = 'track',
  itemId = '',
}) {
  const cardRef = useRef(null);
  const [selectedTheme, setSelectedTheme] = useState('obsidian');
  const [selectedQrColor, setSelectedQrColor] = useState('000000');
  const [showQR, setShowQR] = useState(true);
  const [showYear, setShowYear] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [qrFullScreen, setQrFullScreen] = useState(false);

  // Exact UTC Date calculation matching web app GrooveCardComposer
  const displayReleaseDate = useMemo(() => {
    if (releaseDate) {
      const raw = String(releaseDate).trim();
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
  }, [releaseDate]);

  const activeThemeObj = THEMES.find((t) => t.id === selectedTheme) || THEMES[0];

  // Universal Groove routing link matching web app
  const universalUrl = itemId
    ? `https://grooveestrella.com/s/musicbrainz/${type}/${itemId}`
    : `https://grooveestrella.com/${type}/${encodeURIComponent(title)}`;

  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(universalUrl)}&color=${selectedQrColor}&bgcolor=ffffff&ecc=H&format=png`;

  // Apple Music-style Instagram Stories sharing
  const handleShareInstagramStories = async () => {
    if (!cardRef.current || isExporting) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsExporting(true);

    try {
      // 1. Copy link so user can paste it as an Instagram Link Sticker
      await Clipboard.setStringAsync(universalUrl);

      // 2. Capture high-res card image
      const uri = await captureRef(cardRef, {
        format: 'png',
        quality: 1.0,
        result: 'tmpfile',
      });

      // 3. Share image
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        Toast.show({
          type: 'success',
          text1: 'Opening Stories... 📸',
          text2: 'GrooveLink copied to clipboard! Paste it as a link sticker.',
          visibilityTime: 4000,
        });
        await Sharing.shareAsync(uri, {
          dialogTitle: 'Share to Instagram Stories',
          mimeType: 'image/png',
          UTI: 'public.png',
        });
      } else {
        Toast.show({
          type: 'info',
          text1: 'GrooveLink Copied! 📋',
          text2: 'Paste on your Instagram Story',
        });
      }
    } catch (err) {
      console.warn('Instagram Stories share error:', err);
      Toast.show({
        type: 'error',
        text1: 'Share Failed',
        text2: 'Could not export card image',
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Download Card as high-res PNG into user camera roll
  const handleDownloadCard = async () => {
    if (!cardRef.current || isExporting) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsExporting(true);

    try {
      const uri = await captureRef(cardRef, {
        format: 'png',
        quality: 1.0,
        result: 'tmpfile',
      });

      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status === 'granted') {
        await MediaLibrary.saveToLibraryAsync(uri);
        Toast.show({
          type: 'success',
          text1: 'Saved to Photos! 📸',
          text2: 'GrooveCard saved in high resolution',
        });
      } else {
        // Fallback to system share sheet so user can save directly
        await Sharing.shareAsync(uri, {
          dialogTitle: 'Save GrooveCard Image',
          mimeType: 'image/png',
          UTI: 'public.png',
        });
      }
    } catch (err) {
      console.warn('Download card error:', err);
      Toast.show({
        type: 'error',
        text1: 'Download Failed',
        text2: 'Could not save card to device',
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Direct System Share
  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!cardRef.current) return;
    try {
      const uri = await captureRef(cardRef, {
        format: 'png',
        quality: 1.0,
        result: 'tmpfile',
      });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          dialogTitle: `Share ${title}`,
          mimeType: 'image/png',
          UTI: 'public.png',
        });
      } else {
        await Share.share({
          title: `GrooveCard: ${title}`,
          message: `🎵 Listen to "${title}" by ${artist} on Groove!\n${universalUrl}`,
          url: universalUrl,
        });
      }
    } catch (err) {
      console.warn('Share error:', err);
    }
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

        <View style={styles.sheetContainer}>
          {/* Grab handle */}
          <View style={styles.grabHandle} />

          {/* Sheet Header */}
          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.sheetTitle}>GrooveCard Composer</Text>
              <Text style={styles.sheetSubtitle}>Personalize and export your music card</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={22} color="#8992A5" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* The Live GrooveCard (Apple Music inspired) wrapped in capture container */}
            <View style={styles.cardPreviewWrapper}>
              <View ref={cardRef} collapsable={false} style={styles.cardCaptureBox}>
                <LinearGradient
                  colors={activeThemeObj.colors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.grooveCard, { borderColor: activeThemeObj.border }]}
                >
                  {/* Header row */}
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.cardLogoGroup}>
                      <Ionicons name="musical-notes" size={13} color="#E879F9" />
                      <Text style={styles.cardLogoText}>GROOVECARD</Text>
                    </View>
                    <View style={styles.musicLayerBadge}>
                      <Text style={styles.musicLayerBadgeText}>MUSIC LAYER</Text>
                    </View>
                  </View>

                  {/* Album artwork */}
                  <Image
                    source={{ uri: imageUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80' }}
                    style={styles.cardArtwork}
                  />

                  {/* Metadata & QR code row */}
                  <View style={styles.cardInfoRow}>
                    <View style={styles.cardTextCol}>
                      <Text style={styles.cardTitle} numberOfLines={2}>{title || 'Untitled'}</Text>
                      <Text style={styles.cardArtist} numberOfLines={1}>{artist || 'Unknown Artist'}</Text>
                      {album && album !== title ? (
                        <Text style={styles.cardAlbum} numberOfLines={1}>Album: {album}</Text>
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
                          <Image
                            source={require('../../assets/icon.png')}
                            style={styles.qrAppLogo}
                            resizeMode="contain"
                          />
                        </View>
                      </TouchableOpacity>
                    )}
                  </View>
                </LinearGradient>
              </View>
            </View>

            {/* Featured Action: Instagram Stories (Apple Music style) */}
            <TouchableOpacity
              style={styles.instagramStoryBtn}
              onPress={handleShareInstagramStories}
              disabled={isExporting}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#833ab4', '#fd1d1d', '#fcb045']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.instagramGradient}
              >
                {isExporting ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Ionicons name="logo-instagram" size={20} color="#FFFFFF" />
                    <Text style={styles.instagramBtnText}>Share to Instagram Stories</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Customizer: Theme Selection */}
            <View style={styles.customSection}>
              <Text style={styles.customLabel}>CARD THEME</Text>
              <View style={styles.themeGrid}>
                {THEMES.map((t) => {
                  const isSelected = selectedTheme === t.id;
                  return (
                    <TouchableOpacity
                      key={t.id}
                      style={[
                        styles.themeOptionBtn,
                        isSelected && { borderColor: '#E879F9', backgroundColor: 'rgba(135, 0, 135, 0.25)' },
                      ]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSelectedTheme(t.id);
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.themeSwatch, { backgroundColor: t.colors[1] }]} />
                      <Text style={[styles.themeOptionText, isSelected && { color: '#F4F7FF', fontWeight: '700' }]}>
                        {t.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Customizer: QR Color chips */}
            {showQR && (
              <View style={styles.customSection}>
                <Text style={styles.customLabel}>QR COLOR ACCENT</Text>
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
                style={[styles.toggleBtn, showQR && styles.toggleBtnActive]}
                onPress={() => setShowQR(!showQR)}
              >
                <Ionicons name={showQR ? 'qr-code' : 'qr-code-outline'} size={15} color={showQR ? '#F0ABFC' : '#8992A5'} />
                <Text style={[styles.toggleBtnText, showQR && { color: '#F4F7FF', fontWeight: '700' }]}>
                  {showQR ? 'QR Visible' : 'QR Hidden'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.toggleBtn, showYear && styles.toggleBtnActive]}
                onPress={() => setShowYear(!showYear)}
              >
                <Ionicons name="calendar-outline" size={15} color={showYear ? '#F0ABFC' : '#8992A5'} />
                <Text style={[styles.toggleBtnText, showYear && { color: '#F4F7FF', fontWeight: '700' }]}>
                  {showYear ? 'Date Shown' : 'Date Hidden'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Action buttons */}
          <View style={styles.footerRow}>
            {/* Download card image */}
            <TouchableOpacity
              style={styles.actionBtnSecondary}
              onPress={handleDownloadCard}
              disabled={isExporting}
              activeOpacity={0.8}
            >
              <Ionicons name="download-outline" size={16} color="#F4F7FF" />
              <Text style={styles.actionBtnText}>Download</Text>
            </TouchableOpacity>

            {/* Copy universal link */}
            <TouchableOpacity style={styles.actionBtnSecondary} onPress={handleCopyLink} activeOpacity={0.8}>
              <Ionicons name="copy-outline" size={16} color="#F4F7FF" />
              <Text style={styles.actionBtnText}>Copy Link</Text>
            </TouchableOpacity>

            {/* System Share sheet */}
            <TouchableOpacity style={styles.actionBtnPrimary} onPress={handleShare} activeOpacity={0.8}>
              <Ionicons name="share-social" size={16} color="#000" />
              <Text style={styles.actionBtnPrimaryText}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Full-screen QR Modal */}
      {qrFullScreen && (
        <Modal visible={qrFullScreen} transparent animationType="fade" onRequestClose={() => setQrFullScreen(false)}>
          <View style={styles.fullQrOverlay}>
            <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setQrFullScreen(false)} />
            <View style={styles.fullQrBox}>
              <Text style={styles.fullQrTitle}>Scan Groove QR</Text>
              <View style={styles.fullQrImageWrapper}>
                <Image source={{ uri: qrApiUrl }} style={styles.fullQrImage} />
                <View style={styles.fullQrLogoBadge}>
                  <Image source={require('../../assets/icon.png')} style={styles.fullQrLogoIcon} resizeMode="contain" />
                </View>
              </View>
              <Text style={styles.fullQrSubtitle}>
                Scan with your phone's camera to instantly open in Groove
              </Text>
              <TouchableOpacity style={styles.fullQrCloseBtn} onPress={() => setQrFullScreen(false)}>
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
    backgroundColor: '#0D121F',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
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
    fontWeight: '900',
    color: '#F4F7FF',
  },
  sheetSubtitle: {
    fontSize: 12,
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
  cardCaptureBox: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: 'transparent',
  },
  grooveCard: {
    width: '100%',
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
    fontWeight: '900',
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
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.9)',
    letterSpacing: 1,
  },
  cardArtwork: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 16,
    backgroundColor: '#10141F',
    marginBottom: 14,
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
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
    lineHeight: 20,
  },
  cardArtist: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8992A5',
    marginBottom: 4,
  },
  cardAlbum: {
    fontSize: 11,
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
    fontWeight: '600',
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
  qrAppLogo: {
    width: 14,
    height: 14,
  },
  instagramStoryBtn: {
    width: '100%',
    borderRadius: 18,
    overflow: 'hidden',
    marginTop: 4,
    marginBottom: 16,
    shadowColor: '#fd1d1d',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  instagramGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 10,
  },
  instagramBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  customSection: {
    marginBottom: 16,
  },
  customLabel: {
    fontSize: 11,
    fontWeight: '800',
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
    color: '#8992A5',
    fontWeight: '600',
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
  toggleBtnActive: {
    backgroundColor: 'rgba(135, 0, 135, 0.25)',
    borderColor: 'rgba(232, 121, 249, 0.4)',
  },
  toggleBtnText: {
    fontSize: 12,
    color: '#8992A5',
    fontWeight: '600',
  },
  footerRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F4F7FF',
  },
  actionBtnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: '#F0ABFC',
  },
  actionBtnPrimaryText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#000000',
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
    backgroundColor: '#10141F',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    padding: 24,
    alignItems: 'center',
  },
  fullQrTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
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
  fullQrLogoIcon: {
    width: 26,
    height: 26,
  },
  fullQrSubtitle: {
    fontSize: 12,
    color: '#8992A5',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  fullQrCloseBtn: {
    backgroundColor: '#870087',
    paddingVertical: 10,
    paddingHorizontal: 28,
    borderRadius: 12,
  },
  fullQrCloseText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
