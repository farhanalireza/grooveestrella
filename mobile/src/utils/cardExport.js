// src/utils/cardExport.js
import { Platform, Share } from 'react-native';
import * as Sharing from 'expo-sharing';
import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system';
import Toast from 'react-native-toast-message';

function getLegacyMediaLibrary() {
  try {
    return require('expo-media-library/build/legacy');
  } catch (_) {
    try {
      return require('expo-media-library');
    } catch (_) {
      return null;
    }
  }
}

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

    if (uri) {
      // 1. First attempt: Direct save via Media Library (iOS & native standalone builds)
      const MediaLibrary = getLegacyMediaLibrary();
      if (MediaLibrary && (MediaLibrary.createAssetAsync || MediaLibrary.saveToLibraryAsync)) {
        try {
          const { status } = MediaLibrary.requestPermissionsAsync
            ? await MediaLibrary.requestPermissionsAsync(true)
            : { status: 'granted' };

          if (status === 'granted') {
            if (MediaLibrary.createAssetAsync) {
              await MediaLibrary.createAssetAsync(uri);
            } else {
              await MediaLibrary.saveToLibraryAsync(uri);
            }
            Toast.show({
              type: 'success',
              text1: 'Saved to Gallery! 📸',
              text2: 'GrooveCard saved directly to Photos',
            });
            return true;
          }
        } catch (mlErr) {
          console.warn('MediaLibrary direct save failed:', mlErr);
        }
      }

      // 2. Second attempt for Android: StorageAccessFramework (bypasses Expo Go permissions restrictions)
      if (Platform.OS === 'android') {
        try {
          const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
          if (permissions.granted) {
            const base64 = await FileSystem.readAsStringAsync(uri, {
              encoding: FileSystem.EncodingType.Base64,
            });
            const safeTitle = (title || 'card').replace(/[^a-zA-Z0-9_-]/g, '_');
            const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(
              permissions.directoryUri,
              `groovecard_${safeTitle}_${Date.now()}.png`,
              'image/png'
            );
            await FileSystem.writeAsStringAsync(fileUri, base64, {
              encoding: FileSystem.EncodingType.Base64,
            });
            Toast.show({
              type: 'success',
              text1: 'Saved to Gallery / Storage! 📸',
              text2: 'GrooveCard saved to selected folder',
            });
            return true;
          }
        } catch (safErr) {
          console.warn('StorageAccessFramework save failed:', safErr);
        }
      }

      // 3. Last fallback only if native gallery writing is refused:
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          dialogTitle: 'Save GrooveCard Image',
          mimeType: 'image/png',
          UTI: 'public.png',
        });
        return true;
      }
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
