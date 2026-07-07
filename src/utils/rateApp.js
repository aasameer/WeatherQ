import { Alert, Platform, Linking } from 'react-native';
import * as StoreReview from 'expo-store-review';
import { saveToCache, loadFromCache } from './cache';

const CACHE_KEY = 'weatherq_rate_state';

/* When should we ask? */
const POLICY = {
  minPositiveActions:      3,     // shares + saves + successful launches
  minDaysSinceInstall:     3,
  minDaysSinceLastPrompt:  60,
  minDaysAfterDismissal:   90,
};

const PLAY_STORE_PACKAGE = 'com.weatherq.app';
const APP_STORE_ID       = null;  // set once approved on App Store

const dayInMs = 24 * 60 * 60 * 1000;

/* ── State I/O ────────────────────────────────────────────────────────── */
const loadState = async () => {
  const state = (await loadFromCache(CACHE_KEY)) ?? {};
  return {
    installedAt:      state.installedAt      ?? Date.now(),
    positiveActions:  state.positiveActions  ?? 0,
    lastPromptedAt:   state.lastPromptedAt   ?? 0,
    lastRatedVersion: state.lastRatedVersion ?? null,
    dismissed:        state.dismissed        ?? false,
    dismissedAt:      state.dismissedAt      ?? 0,
  };
};

const persist = (state) => saveToCache(CACHE_KEY, state);

/* ── Public API ───────────────────────────────────────────────────────── */

/** Fire this after any "the user liked something" moment (share, save, refresh). */
export const registerPositiveAction = async () => {
  const state = await loadState();
  state.positiveActions += 1;
  if (!state.installedAt) state.installedAt = Date.now();
  await persist(state);
};

/** Non-blocking check. Runs on app open / after positive actions. */
export const maybePromptForRating = async () => {
  const state = await loadState();

  const now      = Date.now();
  const ageDays  = (now - state.installedAt)    / dayInMs;
  const sinceP   = (now - state.lastPromptedAt) / dayInMs;
  const sinceD   = (now - state.dismissedAt)    / dayInMs;

  if (state.positiveActions < POLICY.minPositiveActions) return false;
  if (ageDays < POLICY.minDaysSinceInstall)             return false;
  if (state.lastPromptedAt && sinceP < POLICY.minDaysSinceLastPrompt) return false;
  if (state.dismissed      && sinceD < POLICY.minDaysAfterDismissal)  return false;

  // Try native in-app review first
  try {
    const available = await StoreReview.isAvailableAsync();
    if (available) {
      const hasAction = await StoreReview.hasAction();
      if (hasAction) {
        await StoreReview.requestReview();
        state.lastPromptedAt = now;
        await persist(state);
        return true;
      }
    }
  } catch {}

  // Fall back to a friendly alert with a direct store link
  return new Promise((resolve) => {
    Alert.alert(
      'Enjoying WeatherQ?',
      'Would you leave us a quick review? It genuinely helps us reach more people 💛',
      [
        { text: 'Not now',
          style: 'cancel',
          onPress: async () => {
            state.dismissed    = true;
            state.dismissedAt  = now;
            state.lastPromptedAt = now;
            await persist(state);
            resolve(false);
          }
        },
        { text: 'Rate 5 stars',
          onPress: async () => {
            await openStoreRating();
            state.lastPromptedAt = now;
            await persist(state);
            resolve(true);
          }
        },
      ],
      { cancelable: true, onDismiss: () => resolve(false) }
    );
  });
};

/** Deep-link to the store's rating screen. Also used by Settings row. */
export const openStoreRating = async () => {
  try {
    if (Platform.OS === 'android') {
      const marketUrl = `market://details?id=${PLAY_STORE_PACKAGE}`;
      const webUrl    = `https://play.google.com/store/apps/details?id=${PLAY_STORE_PACKAGE}`;
      const canOpen   = await Linking.canOpenURL(marketUrl);
      await Linking.openURL(canOpen ? marketUrl : webUrl);
    } else if (Platform.OS === 'ios' && APP_STORE_ID) {
      await Linking.openURL(`itms-apps://apps.apple.com/app/id${APP_STORE_ID}?action=write-review`);
    } else {
      Alert.alert('Coming soon!', 'WeatherQ for iOS is under review. Try again in a few days.');
    }
  } catch (e) {
    Alert.alert('Could not open store', e?.message ?? 'Please try again later.');
  }
};

/** Also lets Settings force-clear the state during debugging. */
export const resetRateState = () => saveToCache(CACHE_KEY, {});
