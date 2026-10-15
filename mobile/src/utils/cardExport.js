// src/utils/cardExport.js
import * as Sharing from 'expo-sharing';
import * as Clipboard from 'expo-clipboard';
import { Share } from 'react-native';
import Toast from 'react-native-toast-message';

// Safely obtain native modules without breaking Expo Go or builds where ExpoMediaLibraryNext is unavailable
function getMediaLibrary() {
  try {
    return require('expo-media-library');
  } catch (_) {
    return null;
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

    if (uri) {
      const MediaLibrary = getMediaLibrary();
      if (MediaLibrary?.requestPermissionsAsync && MediaLibrary?.saveToLibraryAsync) {
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
        } catch (_) {}
      }

      // Universal fallback using expo-sharing (works everywhere without native permissions)
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          dialogTitle: 'Save GrooveCard Image',
          mimeType: 'image/png',
          UTI: 'public.png',
        });
        return true;
      }
    }

    // Fallback if viewShot could not capture tmpfile
    if (fallbackImageUrl && (await Sharing.isAvailableAsync())) {
      await Sharing.shareAsync(fallbackImageUrl, {
        dialogTitle: 'Save Artwork Image',
      });
      return true;
    }

    Toast.show({
      type: 'info',
      text1: 'Card Ready',
      text2: 'Use system share to save or send',
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
    // Copy link to clipboard first
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
