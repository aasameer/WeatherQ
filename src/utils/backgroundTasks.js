import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';

import { fetchWeatherByCoords } from '../api/weatherService';
import { fetchRandomQuote } from '../api/quotesService';
import { loadFromCache, saveToCache } from './cache';
import { CACHE_KEYS, DEFAULT_SETTINGS } from '../constants/config';
import { rescheduleAllNotifications } from './notifications';
import { getTodayKey } from './dateHelpers';

/**
 * WeatherQ daily refresh task.
 *
 * Wakes up the app silently every ~12 hours (OS-decided) so the
 * notification that fires tomorrow morning carries today's REAL weather,
 * not a stale snapshot from when the user last opened the app.
 *
 * On iOS: scheduled by BGTaskScheduler; iOS decides exact run times.
 * On Android: WorkManager runs it at the minimumInterval (with some jitter).
 */

export const DAILY_REFRESH_TASK = 'WEATHERQ_DAILY_REFRESH';

/* ─── Task definition (must be at module top level) ───────────────────── */
TaskManager.defineTask(DAILY_REFRESH_TASK, async () => {
  try {
    /* 1. Need a known location to fetch weather */
    const cached = await loadFromCache(CACHE_KEYS.LAST_WEATHER);
    if (!cached?.lat || !cached?.lon) {
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    /* 2. Pull user prefs (language, hour, unit) */
    const settings = {
      ...DEFAULT_SETTINGS,
      ...(await loadFromCache(CACHE_KEYS.SETTINGS)),
    };

    if (!settings.notificationsEnabled && !settings.alarmEnabled && !settings.smartTipsEnabled) {
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    /* 3. Fetch fresh weather */
    const weather = await fetchWeatherByCoords(cached.lat, cached.lon);

    /* 4. Pick a fresh random quote
          (respect the daily lock — same quote for the whole day) */
    const today = getTodayKey();
    let quoteEntry = await loadFromCache(CACHE_KEYS.DAILY_QUOTE);
    if (
      !quoteEntry ||
      quoteEntry.date !== today ||
      quoteEntry.language !== settings.quoteLanguage
    ) {
      const fresh = await fetchRandomQuote(settings.quoteLanguage);
      if (fresh) {
        quoteEntry = {
          date:     today,
          language: settings.quoteLanguage,
          quote:    fresh,
        };
        await saveToCache(CACHE_KEYS.DAILY_QUOTE, quoteEntry);
      }
    }
    const quote = quoteEntry?.quote;

    /* 5. Persist refreshed weather */
    await saveToCache(CACHE_KEYS.LAST_WEATHER, {
      ...cached,
      weather,
    });

    /* 6. Reschedule all notifications (daily + alarms + smart tips) with FRESH content */
    await rescheduleAllNotifications({
      weather,
      cityInfo:           cached.city,
      quote,
      unit:               settings.temperatureUnit,
      dailyEnabled:       settings.notificationsEnabled,
      dailyHour:          settings.notificationHour,
      alarmEnabled:       settings.alarmEnabled,
      alarmHour:          settings.alarmHour,
      alarmMinute:        settings.alarmMinute,
      alarmDays:          settings.alarmDays,
      smartTipsEnabled:   settings.smartTipsEnabled,
      smartTipsMode:      settings.smartTipsMode,
      smartTipsHour:      settings.smartTipsHour,
      smartTipCategories: settings.smartTipCategories,
    });

    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (e) {
    console.warn('[BG] daily refresh failed:', e?.message);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

/* ─── Register / unregister ───────────────────────────────────────────── */

export const registerDailyRefreshTask = async () => {
  try {
    const status = await BackgroundFetch.getStatusAsync();
    if (status === BackgroundFetch.BackgroundFetchStatus.Restricted ||
        status === BackgroundFetch.BackgroundFetchStatus.Denied) {
      return false;
    }

    const isRegistered = await TaskManager.isTaskRegisteredAsync(DAILY_REFRESH_TASK);
    if (isRegistered) return true;

    await BackgroundFetch.registerTaskAsync(DAILY_REFRESH_TASK, {
      minimumInterval: 60 * 60 * 12, // ~12 hours (OS decides exact firing)
      stopOnTerminate: false,
      startOnBoot:     true,
    });
    return true;
  } catch (e) {
    console.warn('[BG] register failed:', e?.message);
    return false;
  }
};

export const unregisterDailyRefreshTask = async () => {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(DAILY_REFRESH_TASK);
    if (isRegistered) await BackgroundFetch.unregisterTaskAsync(DAILY_REFRESH_TASK);
  } catch {}
};

/* ─── Debug: force-run the task now ───────────────────────────────────── */
export const triggerRefreshNow = async () => {
  try {
    return await BackgroundFetch.performFetchAsync?.() ??
           BackgroundFetch.BackgroundFetchResult.NoData;
  } catch {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
};
