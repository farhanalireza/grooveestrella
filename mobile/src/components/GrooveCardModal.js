// src/components/GrooveCardModal.js
import React, { useState } from 'react';
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
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';
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
  const [selectedTheme, setSelectedTheme] = useState('obsidian');
  const [selectedQrColor, setSelectedQrColor] = useState('000000');
  const [showQR, setShowQR] = useState(true);
  const [showYear, setShowYear] = useState(true);

  const activeThemeObj = THEMES.find((t) => t.id === selectedTheme) || THEMES[0];
  const universalUrl = `https://grooveestrella.app/${type}/${encodeURIComponent(itemId || title)}`;
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(universalUrl)}&color=${selectedQrColor}&bgcolor=ffffff&ecc=H&format=png`;

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await Share.share({
        title: `GrooveCard: ${title}`,
        message: `🎵 Listen to "${title}" by ${artist} on Groove!\n${universalUrl}`,
        url: universalUrl,
      });
    } catch (err) {
      console.warn('Share error:', err);
    }
  };

  const handleCopyLink = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
              <Text style={styles.sheetSubtitle}>Personalize and share your music card</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={20} color="#8992A5" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* The Live GrooveCard (Apple Music inspired) */}
            <View style={styles.cardPreviewWrapper}>
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
                  source={{ uri: imageUrl || 'https://placehold.co/400x400/10141F/60A5FA?text=Music' }}
                  style={styles.cardArtwork}
                />

                {/* Metadata & QR code row */}
                <View style={styles.cardInfoRow}>
                  <View style={styles.cardTextCol}>
                    <Text style={styles.cardTitle} numberOfLines={2}>{title || 'Untitled'}</Text>
                    <Text style={styles.cardArtist} numberOfLines={1}>{artist || 'Unknown Artist'}</Text>
                    {album && album !== title && (
                      <Text style={styles.cardAlbum} numberOfLines={1}>Album: {album}</Text>
                    )}
                    {showYear && releaseDate ? (
                      <View style={styles.yearPill}>
                        <Text style={styles.yearText}>{releaseDate}</Text>
                      </View>
                    ) : null}
                  </View>

                  {/* QR code */}
                  {showQR && (
                    <View style={styles.qrContainer}>
                      <Image source={{ uri: qrApiUrl }} style={styles.qrImage} />
                    </View>
                  )}
                </View>
              </LinearGradient>
            </View>

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
                  {showYear ? 'Year Shown' : 'Year Hidden'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Action buttons */}
          <View style={styles.footerRow}>
            <TouchableOpacity style={styles.copyBtn} onPress={handleCopyLink} activeOpacity={0.8}>
              <Ionicons name="copy-outline" size={16} color="#F4F7FF" />
              <Text style={styles.copyBtnText}>Copy Link</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.8}>
              <Ionicons name="share-social" size={16} color="#000" />
              <Text style={styles.shareBtnText}>Share GrooveCard</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
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
    maxHeight: '92%',
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
  },
  grabHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 8,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F4F7FF',
  },
  sheetSubtitle: {
    fontSize: 11,
    color: '#8992A5',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  cardPreviewWrapper: {
    alignItems: 'center',
    marginVertical: 10,
  },
  grooveCard: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 26,
    padding: 18,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  cardLogoGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardLogoText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#E879F9',
    letterSpacing: 1.5,
  },
  musicLayerBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  musicLayerBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: 'rgba(244, 247, 255, 0.9)',
    letterSpacing: 0.5,
  },
  cardArtwork: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 18,
    backgroundColor: '#10141F',
    marginBottom: 14,
  },
  cardInfoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  cardTextCol: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFF',
    lineHeight: 19,
  },
  cardArtist: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8992A5',
    marginTop: 3,
  },
  cardAlbum: {
    fontSize: 10,
    color: 'rgba(137, 146, 165, 0.7)',
    fontStyle: 'italic',
    marginTop: 2,
  },
  yearPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 6,
  },
  yearText: {
    fontSize: 9,
    color: '#8992A5',
    fontWeight: '600',
  },
  qrContainer: {
    width: 68,
    height: 68,
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrImage: {
    width: '100%',
    height: '100%',
  },
  customSection: {
    marginTop: 16,
  },
  customLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#8992A5',
    letterSpacing: 1.2,
    marginBottom: 8,
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
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    flexBasis: '48%',
  },
  themeSwatch: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  themeOptionText: {
    fontSize: 11,
    color: '#8992A5',
    fontWeight: '600',
  },
  qrColorRow: {
    flexDirection: 'row',
    gap: 10,
  },
  qrColorChip: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrColorChipSelected: {
    borderWidth: 2,
    borderColor: '#FFF',
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
    marginBottom: 6,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  toggleBtnActive: {
    borderColor: 'rgba(232, 121, 249, 0.35)',
    backgroundColor: 'rgba(135, 0, 135, 0.15)',
  },
  toggleBtnText: {
    fontSize: 11,
    color: '#8992A5',
    fontWeight: '600',
  },
  footerRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  copyBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  copyBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F4F7FF',
  },
  shareBtn: {
    flex: 1.3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    borderRadius: 16,
    backgroundColor: '#F0ABFC',
  },
  shareBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#000',
  },
});
