import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { getWeatherInfo, formatTemperatureWithUnit } from './weatherHelpers';

/* ── Foreground display behaviour ─────────────────────────────────────── */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound:  true,
    shouldSetBadge:   false,
    shouldShowBanner: true,
    shouldShowList:   true,
  }),
});

/* ── Channels (Android) ──────────────────────────────────────────────── */
const ensureChannels = async () => {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync('daily-weather', {
    name:        'Daily Weather & Quote',
    importance:  Notifications.AndroidImportance.DEFAULT,
    lightColor:  '#3B8FD4',
    sound:       'default',
    description: 'Your daily weather snapshot with an inspirational quote.',
  });

  // Alarm channel — high importance, alarm-style sound (rings even in silent mode)
  await Notifications.setNotificationChannelAsync('wake-alarm', {
    name:        'Wake-up Alarm',
    importance:  Notifications.AndroidImportance.HIGH,
    lightColor:  '#F6C84B',
    sound:       'default',
    vibrationPattern: [0, 300, 200, 300, 200, 600],
    enableVibrate: true,
    bypassDnd:   true,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    description: 'Wake-up alarm with weather and inspirational quote.',
  });
};

/* ── Permissions ──────────────────────────────────────────────────────── */
export const requestNotificationPermission = async () => {
  await ensureChannels();

  const existing = await Notifications.getPermissionsAsync();
  if (existing.status === 'granted') return true;

  const req = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert:                true,
      allowBadge:                false,
      allowSound:                true,
      allowCriticalAlerts:       false,
      allowProvisional:          false,
      provideAppNotificationSettings: false,
      allowAnnouncements:        false,
    },
  });
  return req.status === 'granted';
};

/* ── Build content from current data ──────────────────────────────────── */
const buildContent = (weather, cityInfo, quote, unit) => {
  const current = weather?.current;
  const info    = current
    ? getWeatherInfo(current.weather_code, current.is_day === 1)
    : { emoji: '⛅', label: 'Today' };
  const temp    = current ? formatTemperatureWithUnit(current.temperature_2m, unit) : '';
  const city    = cityInfo?.city ?? '';

  const titleBase = city
    ? `${info.emoji} ${temp} · ${city}`
    : `${info.emoji} Your daily weather`;

  const body  = quote?.text
    ? `"${quote.text}"${quote.author ? ` — ${quote.author}` : ''}`
    : `Open WeatherQ to see today's forecast.`;

  return { titleBase, body };
};

/* ── Schedule daily reminders ─────────────────────────────────────────── */
const scheduleDailyReminders = async ({ titleBase, body, hour, days = 7 }) => {
  const now = new Date();
  for (let i = 1; i <= days; i += 1) {
    const fireAt = new Date(now);
    fireAt.setDate(now.getDate() + i);
    fireAt.setHours(hour, 0, 0, 0);

    await Notifications.scheduleNotificationAsync({
      content: {
        title: titleBase,
        body,
        sound: 'default',
        data:  { type: 'daily-weather-quote' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: fireAt,
        channelId: Platform.OS === 'android' ? 'daily-weather' : undefined,
      },
    });
  }
};

/* ── Schedule weekly wake-up alarms ───────────────────────────────────── */
const scheduleWakeupAlarms = async ({ titleBase, body, hour, minute, days }) => {
  if (!days?.length) return;

  for (const weekday of days) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `⏰  ${titleBase}`,
        body,
        sound: 'default',
        interruptionLevel: 'timeSensitive', // iOS — pierces Focus modes
        data:  { type: 'wake-alarm', weekday },
      },
      trigger: {
        type:    Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday,        // 1=Sunday … 7=Saturday
        hour,
        minute,
        channelId: Platform.OS === 'android' ? 'wake-alarm' : undefined,
      },
    });
  }
};

/* ── Public: reschedule everything ────────────────────────────────────── */
/**
 * Cancels all pending notifications, then re-schedules:
 *  - Up to 7 daily reminders (if dailyEnabled)
 *  - Weekly recurring alarms (if alarmEnabled)
 *
 * Call this whenever data or notification prefs change.
 */
export const rescheduleAllNotifications = async ({
  weather,
  cityInfo,
  quote,
  unit = 'C',
  dailyEnabled = false,
  dailyHour    = 8,
  alarmEnabled = false,
  alarmHour    = 6,
  alarmMinute  = 30,
  alarmDays    = [],
}) => {
  await ensureChannels();
  await Notifications.cancelAllScheduledNotificationsAsync();

  const content = buildContent(weather, cityInfo, quote, unit);

  if (dailyEnabled) {
    await scheduleDailyReminders({
      titleBase: content.titleBase,
      body:      content.body,
      hour:      dailyHour,
    });
  }

  if (alarmEnabled && alarmDays?.length) {
    await scheduleWakeupAlarms({
      titleBase: content.titleBase,
      body:      content.body,
      hour:      alarmHour,
      minute:    alarmMinute,
      days:      alarmDays,
    });
  }
};

/* ── Back-compat alias (older HomeScreen call) ────────────────────────── */
export const scheduleDailyNotifications = async (args) => {
  await rescheduleAllNotifications({ ...args, dailyEnabled: true, dailyHour: args.hour });
};

/* ── Stop all notifications ───────────────────────────────────────────── */
export const cancelAllNotifications = async () => {
  await Notifications.cancelAllScheduledNotificationsAsync();
};

/* ── Debug helper ─────────────────────────────────────────────────────── */
export const getScheduledCount = async () => {
  const list = await Notifications.getAllScheduledNotificationsAsync();
  return list.length;
};
