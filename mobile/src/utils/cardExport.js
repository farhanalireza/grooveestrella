// src/utils/cardExport.js
import { Platform, Share } from 'react-native';
import * as Sharing from 'expo-sharing';
import * as Clipboard from 'expo-clipboard';
import Toast from 'react-native-toast-message';

function getViewShot() {
  try {
    return require('react-native-view-shot');
  } catch (_) {
    return null;
  }
}

function getSAF() {
  try {
    const legacy = require('expo-file-system/legacy');
    if (legacy?.StorageAccessFramework) return { saf: legacy.StorageAccessFramework, fs: legacy };
  } catch (_) {}
  try {
    const main = require('expo-file-system');
    if (main?.StorageAccessFramework) return { saf: main.StorageAccessFramework, fs: main };
  } catch (_) {}
  return null;
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

    // 1. Android: Direct save to Gallery/Storage via StorageAccessFramework
    if (Platform.OS === 'android') {
      try {
        const safHelper = getSAF();
        if (safHelper?.saf && typeof safHelper.saf.requestDirectoryPermissionsAsync === 'function') {
          const permissions = await safHelper.saf.requestDirectoryPermissionsAsync();
          if (permissions?.granted && permissions?.directoryUri) {
            const fsModule = safHelper.fs;
            const base64 = await fsModule.readAsStringAsync(uri, {
              encoding: fsModule.EncodingType?.Base64 || 'base64',
            });
            const safeTitle = (title || 'card').replace(/[^a-zA-Z0-9_-]/g, '_');
            const fileUri = await safHelper.saf.createFileAsync(
              permissions.directoryUri,
              `groovecard_${safeTitle}_${Date.now()}.png`,
              'image/png'
            );
            await fsModule.writeAsStringAsync(fileUri, base64, {
              encoding: fsModule.EncodingType?.Base64 || 'base64',
            });
            Toast.show({
              type: 'success',
              text1: 'Saved to Gallery! 📸',
              text2: 'GrooveCard saved directly to your device',
            });
            return true;
          }
        }
      } catch (safErr) {
        console.warn('StorageAccessFramework save attempt:', safErr);
      }
    }

    // 2. iOS & Fallback: Universal high-res image saving / system export
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
      text2: 'Could not access device storage',
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
      } catch (_) {}
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
    console.warn('Share error:', err);
  }
}

export const shareToInstagramStories = shareCard;
