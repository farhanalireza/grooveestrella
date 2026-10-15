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

export async function shareToInstagramStories(cardRef, universalUrl, title, artist) {
  try {
    // 1. Copy link to clipboard for Instagram Link Sticker
    if (universalUrl) {
      await Clipboard.setStringAsync(universalUrl);
    }

    // 2. Capture high-res card image if possible
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
        console.warn('captureRef failed for Instagram Story:', e);
      }
    }

    // 3. Share to Instagram Stories / System Sheet
    if (uri && (await Sharing.isAvailableAsync())) {
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
      if (universalUrl) {
        await Share.share({
          message: `🎵 Listen to "${title}" by ${artist} on Groove!\n${universalUrl}`,
          url: universalUrl,
        });
      }
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
