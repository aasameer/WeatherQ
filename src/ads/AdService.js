import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { saveToCache, loadFromCache } from '../utils/cache';

/* ─── Configuration ───────────────────────────────────────────────────── */

const CACHE_KEY = 'weatherq_ads_state';

/**
 * Rate-limit policy for interstitials shown after a share/download.
 * Keep these conservative — the goal is "feels free, monetises lightly".
 */
const POLICY = {
  // Only show an interstitial every Nth successful share action.
  shareCountInterval: 3,

  // And only if at least this many ms have passed since the last shown ad.
  minMillisBetween: 6 * 60 * 60 * 1000, // 6 hours

  // Wait this long after app start before any ad can be served
  // (prevents a fresh launch → immediate ad situation).
  coldStartGraceMs: 60 * 1000, // 60 seconds
};

/* ─── Test unit IDs (Google's official, always safe in dev) ──────────── */

const TEST_UNITS = {
  android: {
    interstitial: 'ca-app-pub-3940256099942544/1033173712',
    banner:       'ca-app-pub-3940256099942544/6300978111',
    rewarded:     'ca-app-pub-3940256099942544/5224354917',
  },
  ios: {
    interstitial: 'ca-app-pub-3940256099942544/4411468910',
    banner:       'ca-app-pub-3940256099942544/2934735716',
    rewarded:     'ca-app-pub-3940256099942544/1712485313',
  },
};

const useTestAds = __DEV__;

const getUnitId = (type) => {
  const platform = Platform.OS === 'ios' ? 'ios' : 'android';

  if (useTestAds) return TEST_UNITS[platform][type];

  const envMap = {
    interstitial:
      Platform.OS === 'ios'
        ? process.env.EXPO_PUBLIC_ADMOB_IOS_INTERSTITIAL_ID
        : process.env.EXPO_PUBLIC_ADMOB_ANDROID_INTERSTITIAL_ID,
    banner:
      Platform.OS === 'ios'
        ? process.env.EXPO_PUBLIC_ADMOB_IOS_BANNER_ID
        : process.env.EXPO_PUBLIC_ADMOB_ANDROID_BANNER_ID,
    rewarded:
      Platform.OS === 'ios'
        ? process.env.EXPO_PUBLIC_ADMOB_IOS_REWARDED_ID
        : process.env.EXPO_PUBLIC_ADMOB_ANDROID_REWARDED_ID,
  };
  return envMap[type] || TEST_UNITS[platform][type];
};

/* ─── Detect whether native module is available ──────────────────────── */

/**
 * AdMob requires a custom dev/production build — it is NOT available in
 * Expo Go. We detect that and silently no-op rather than crashing.
 */
const isExpoGo = Constants.appOwnership === 'expo';

let admob = null;
let InterstitialAd = null;
let AdEventType = null;

if (!isExpoGo) {
  try {
    // Lazy require so Expo Go never even tries to load native bindings.
    const mod = require('react-native-google-mobile-ads');
    admob = mod.default;
    InterstitialAd = mod.InterstitialAd;
    AdEventType = mod.AdEventType;
  } catch (e) {
    console.warn('[Ads] Native module unavailable:', e.message);
  }
}

export const adsAvailable = () => !isExpoGo && !!admob;

/* ─── One-time init at app startup ────────────────────────────────────── */

let initialized = false;
let appStartTime = Date.now();

export const initAds = async () => {
  appStartTime = Date.now();
  if (!adsAvailable() || initialized) return;
  try {
    await admob().initialize();
    initialized = true;
  } catch (e) {
    console.warn('[Ads] init failed:', e.message);
  }
};

/* ─── Interstitial: preload + show ────────────────────────────────────── */

let cachedInterstitial = null;
let cachedInterstitialReady = false;

const preloadInterstitial = () => {
  if (!adsAvailable() || !InterstitialAd) return;
  try {
    cachedInterstitial = InterstitialAd.createForAdRequest(getUnitId('interstitial'), {
      requestNonPersonalizedAdsOnly: true,
    });
    cachedInterstitialReady = false;

    cachedInterstitial.addAdEventListener(AdEventType.LOADED, () => {
      cachedInterstitialReady = true;
    });
    cachedInterstitial.addAdEventListener(AdEventType.CLOSED, () => {
      cachedInterstitialReady = false;
      // Pre-load the next one so it's ready when the policy allows
      preloadInterstitial();
    });
    cachedInterstitial.addAdEventListener(AdEventType.ERROR, (err) => {
      console.warn('[Ads] interstitial error:', err?.message);
      cachedInterstitialReady = false;
    });

    cachedInterstitial.load();
  } catch (e) {
    console.warn('[Ads] preload error:', e.message);
  }
};

/* ─── Public: rate-limited "show after share" trigger ─────────────────── */

/**
 * Called after a successful share / download. Returns true if an ad
 * was actually shown (so the caller can choose to delay any post-action
 * UI feedback). Otherwise resolves quickly without blocking.
 */
export const maybeShowShareInterstitial = async () => {
  if (!adsAvailable() || !initialized) return false;

  // Cold-start grace period
  if (Date.now() - appStartTime < POLICY.coldStartGraceMs) return false;

  const state = (await loadFromCache(CACHE_KEY)) ?? { shareCount: 0, lastShownAt: 0 };

  const nextCount = state.shareCount + 1;
  const sinceLast = Date.now() - state.lastShownAt;

  const counterHit  = nextCount % POLICY.shareCountInterval === 0;
  const timeAllowed = sinceLast >= POLICY.minMillisBetween;

  await saveToCache(CACHE_KEY, { ...state, shareCount: nextCount });

  if (!counterHit || !timeAllowed) {
    // Make sure something is loading for next time
    if (!cachedInterstitial) preloadInterstitial();
    return false;
  }

  if (!cachedInterstitialReady) {
    preloadInterstitial();
    return false;
  }

  try {
    await cachedInterstitial.show();
    await saveToCache(CACHE_KEY, { ...state, shareCount: nextCount, lastShownAt: Date.now() });
    return true;
  } catch (e) {
    console.warn('[Ads] show failed:', e.message);
    return false;
  }
};

/* ─── Diagnostics ─────────────────────────────────────────────────────── */

export const getAdsDebugInfo = async () => {
  const state = (await loadFromCache(CACHE_KEY)) ?? { shareCount: 0, lastShownAt: 0 };
  return {
    available:    adsAvailable(),
    initialized,
    interstitialReady: cachedInterstitialReady,
    useTestAds,
    shareCount:        state.shareCount,
    lastShownAt:       state.lastShownAt,
    nextOnShare:       POLICY.shareCountInterval - (state.shareCount % POLICY.shareCountInterval),
  };
};
