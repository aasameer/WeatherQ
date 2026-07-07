import * as Sharing from 'expo-sharing';
import { Alert, Platform, Linking } from 'react-native';
import { registerPositiveAction } from './rateApp';
import { registerFriendInvite } from './featureUnlocks';

const PLAY_URL = 'https://play.google.com/store/apps/details?id=com.weatherq.app';
const APP_URL  = null; // set when live on App Store — e.g. 'https://apps.apple.com/app/idXXXXXXXXXX'

const message = (cityName) => {
  const city = cityName ? ` in ${cityName}` : '';
  return (
`Hey! I've been using WeatherQ${city} — daily weather + an inspirational quote in one beautiful card. Highly recommend 💛

Get it here:
${PLAY_URL}${APP_URL ? `\n(iOS: ${APP_URL})` : ''}`
  );
};

/**
 * Share the app.
 * If `imageUri` is provided (a captured share card), we attach it so the
 * friend sees the actual output BEFORE installing.
 */
export const shareWeatherQ = async ({ imageUri = null, cityName = null } = {}) => {
  try {
    // Register as a positive action (drives smart rate prompt later)
    registerPositiveAction();
    // Unlock Motion Card as a reward for growing WeatherQ
    registerFriendInvite();

    // With image — much higher conversion (friends see the product upfront)
    if (imageUri && (await Sharing.isAvailableAsync())) {
      await Sharing.shareAsync(imageUri, {
        mimeType:    'image/png',
        dialogTitle: 'Invite a friend to WeatherQ',
        UTI:         'public.png',
      });
      return true;
    }

    // Fallback: no image — plain text/link share
    if (Platform.OS === 'android' || Platform.OS === 'ios') {
      // On iOS the built-in Share API from react-native works well
      const { Share } = require('react-native');
      await Share.share({
        message: message(cityName),
        url:     APP_URL ?? PLAY_URL,
      });
      return true;
    }

    // Ultimate fallback — just open store
    await Linking.openURL(PLAY_URL);
    return true;
  } catch (e) {
    if (e?.message?.includes('canceled') || e?.message?.includes('cancelled')) return false;
    Alert.alert('Could not share', e?.message ?? 'Please try again.');
    return false;
  }
};
