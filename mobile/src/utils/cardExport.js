// src/utils/cardExport.js
import { Platform, Share } from 'react-native';
import * as Sharing from 'expo-sharing';
import * as Clipboard from 'expo-clipboard';
import * as MediaLibrary from 'expo-media-library';
import Toast from 'react-native-toast-message';

function getViewShot() {
  try {
    return require('react-native-view-shot');
  } catch (_) {
    return null;
  }
}

export async function downloadCardImage(cardRef, fallbackImageUrl, title = 'groovecard') {
  try {
    let uri = null;
    const viewShot = getViewShot();
    const captureRef = viewShot?.captureRef;

    if (captureRef && cardRef?.current) {
      try {
        uri = await captureRef(cardRef, {
          format: 'png',
          quality: 1.0,
          result: 'tmpfile',
        });
      } catch (e) {
        console.warn('captureRef failed:', e);
      }
    }

    if (!uri && fallbackImageUrl) {
      uri = fallbackImageUrl;
    }

    if (!uri) {
      Toast.show({
        type: 'error',
        text1: 'Download Failed',
        text2: 'Could not capture card preview',
      });
      return false;
    }

    // 1. Save directly to Media Library (Photos / Camera Roll)
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status === 'granted') {
        await MediaLibrary.saveToLibraryAsync(uri);
        Toast.show({
          type: 'success',
          text1: 'Saved to Photos! 📸',
          text2: 'GrooveCard saved directly to your device gallery',
        });
        return true;
      }
    } catch (mediaErr) {
      console.warn('MediaLibrary save attempt error:', mediaErr);
    }

    // 2. Fallback: System Share sheet (User can tap Save Image / Save to Files / Share)
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        dialogTitle: 'Save GrooveCard to Photos',
        mimeType: 'image/png',
        UTI: 'public.png',
      });
      return true;
    }

    Toast.show({
      type: 'error',
      text1: 'Save Failed',
      text2: 'Could not access device photo library',
    });
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

export async function shareCard(cardRef, universalUrl, title, artist) {
  try {
    if (universalUrl) {
      await Clipboard.setStringAsync(universalUrl);
    }

    let uri = null;
    const viewShot = getViewShot();
    const captureRef = viewShot?.captureRef;

    if (captureRef && cardRef?.current) {
      try {
        uri = await captureRef(cardRef, {
          format: 'png',
          quality: 1.0,
          result: 'tmpfile',
        });
      } catch (e) {
        console.warn('captureRef for share failed:', e);
      }
    }

    if (uri && (await Sharing.isAvailableAsync())) {
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
    console.warn('Share card error:', err);
  }
}

export const shareToInstagramStories = shareCard;
