// src/utils/cardExport.web.js
import * as Clipboard from 'expo-clipboard';
import Toast from 'react-native-toast-message';

export async function downloadCardImage(cardRef, fallbackImageUrl, title = 'groovecard') {
  try {
    const filename = `groovecard_${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png`;
    if (fallbackImageUrl) {
      const a = document.createElement('a');
      a.href = fallbackImageUrl;
      a.download = filename;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      Toast.show({
        type: 'success',
        text1: 'Downloading Card... 📸',
        text2: 'Image download initiated in browser',
      });
      return true;
    }
    return false;
  } catch (err) {
    console.warn('Web download error:', err);
    Toast.show({
      type: 'error',
      text1: 'Download Failed',
      text2: 'Could not trigger browser download',
    });
    return false;
  }
}

export async function shareToInstagramStories(cardRef, universalUrl, title, artist) {
  try {
    await Clipboard.setStringAsync(universalUrl);
    Toast.show({
      type: 'success',
      text1: 'Link Copied for Instagram! 📸',
      text2: 'GrooveLink copied to clipboard — paste it as a Link Sticker on your Story!',
      visibilityTime: 4000,
    });
    if (typeof navigator !== 'undefined' && navigator.share) {
      await navigator.share({
        title: `GrooveCard: ${title}`,
        text: `🎵 Open "${title}" by ${artist} on Groove!\n${universalUrl}`,
        url: universalUrl,
      });
    }
    return true;
  } catch (err) {
    console.warn('Web Instagram share:', err);
    return false;
  }
}

export async function shareCard(cardRef, universalUrl, title, artist) {
  try {
    if (typeof navigator !== 'undefined' && navigator.share) {
      await navigator.share({
        title: `GrooveCard: ${title}`,
        text: `🎵 Listen to "${title}" by ${artist} on Groove!\n${universalUrl}`,
        url: universalUrl,
      });
    } else {
      await Clipboard.setStringAsync(universalUrl);
      Toast.show({
        type: 'success',
        text1: 'Universal Link Copied! 📋',
        text2: universalUrl,
      });
    }
  } catch (err) {
    console.warn('Web share error:', err);
  }
}
