// src/utils/cardExport.js
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import * as Clipboard from 'expo-clipboard';
import { Share } from 'react-native';
import Toast from 'react-native-toast-message';

export async function downloadCardImage(cardRef, fallbackImageUrl, title = 'groovecard') {
  if (!cardRef?.current) return false;
  try {
    const uri = await captureRef(cardRef, {
      format: 'png',
      quality: 1.0,
      result: 'tmpfile',
    });

    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status === 'granted') {
        await MediaLibrary.saveToLibraryAsync(uri);
        Toast.show({
          type: 'success',
          text1: 'Saved to Photos! 📸',
          text2: 'GrooveCard saved in high resolution',
        });
        return true;
      }
    } catch (_) {
      // If MediaLibrary fails, fallback to sharing
    }

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        dialogTitle: 'Save GrooveCard Image',
        mimeType: 'image/png',
        UTI: 'public.png',
      });
      return true;
    }
    return false;
  } catch (err) {
    console.warn('Download card error:', err);
    Toast.show({
      type: 'error',
      text1: 'Download Failed',
      text2: 'Could not save card to device',
    });
    return false;
  }
}

export async function shareToInstagramStories(cardRef, universalUrl, title, artist) {
  if (!cardRef?.current) return false;
  try {
    // 1. Copy link to clipboard for Instagram Link Sticker
    await Clipboard.setStringAsync(universalUrl);

    // 2. Capture high-res card image
    const uri = await captureRef(cardRef, {
      format: 'png',
      quality: 1.0,
      result: 'tmpfile',
    });

    // 3. Share to Instagram Stories / System Sheet
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
      return true;
    } else {
      Toast.show({
        type: 'info',
        text1: 'GrooveLink Copied! 📋',
        text2: 'Paste on your Instagram Story',
      });
      return true;
    }
  } catch (err) {
    console.warn('Instagram Stories share error:', err);
    Toast.show({
      type: 'error',
      text1: 'Share Failed',
      text2: 'Could not export card image',
    });
    return false;
  }
}

export async function shareCard(cardRef, universalUrl, title, artist) {
  if (!cardRef?.current) return false;
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
}
