import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { getWeatherInfo, formatTemperatureWithUnit } from './weatherHelpers';
import { getActiveTips, formatTipsForNotification } from './smartRecommendations';

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

  // Smart tips channel — low-key informational
  await Notifications.setNotificationChannelAsync('smart-tips', {
    name:        'Smart Weather Tips',
    importance:  Notifications.AndroidImportance.DEFAULT,
    lightColor:  '#63B3ED',
    sound:       'default',
    description: 'Personalized tips based on today\'s weather.',
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

/* ── Smart Tips: helpers ─────────────────────────────────────────────── */
// Time slots used in smart mode (24h)
const SMART_SLOTS = [
  { hour:  7, label: 'Morning briefing',  type: 'briefing' },
  { hour: 11, label: 'Late morning',      type: 'urgent-only' },
  { hour: 14, label: 'Afternoon',         type: 'urgent-only' },
  { hour: 17, label: 'Evening commute',   type: 'urgent-only' },
  { hour: 20, label: 'Evening',           type: 'urgent-only' },
];

// Tips are "urgent" if their priority crosses this threshold (storms,
// heatwave, black ice, fog, severe wind, freezing pipes, no-car-pets…)
const URGENT_PRIORITY = 80;

const scheduleSmartTipOne = async ({ fireAt, title, body }) => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: 'default',
      data:  { type: 'smart-tips' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: fireAt,
      channelId: Platform.OS === 'android' ? 'smart-tips' : undefined,
    },
  });
};

/* ── FIXED mode — one notification per day at chosen hour ────────────── */
const scheduleSmartTipsFixed = async ({ weather, city, categories, hour, days = 7 }) => {
  const tips = getActiveTips(weather, categories, 3);
  if (!tips.length) return;

  const body  = formatTipsForNotification(tips);
  const title = city ? `💡 Today's Tips for ${city}` : "💡 Today's Smart Tips";

  const now = new Date();
  for (let i = 1; i <= days; i += 1) {
    const fireAt = new Date(now);
    fireAt.setDate(now.getDate() + i);
    fireAt.setHours(hour, 0, 0, 0);
    await scheduleSmartTipOne({ fireAt, title, body });
  }
};

/* ── SMART mode — multiple time slots, only urgent fires outside briefing ─ */
const scheduleSmartTipsSmart = async ({ weather, city, categories, days = 7 }) => {
  const allTips = getActiveTips(weather, categories, 5);
  if (!allTips.length) return;

  const briefing = allTips.slice(0, 3);
  const urgent   = allTips.find((t) => t.priority >= URGENT_PRIORITY);

  const briefingTitle = city ? `💡 Today's Tips for ${city}` : "💡 Today's Smart Tips";
  const briefingBody  = formatTipsForNotification(briefing);

  const urgentTitle   = urgent ? `${urgent.icon}  ${urgent.title}` : null;
  const urgentBody    = urgent ? urgent.body : null;

  const now = new Date();
  for (let i = 1; i <= days; i += 1) {
    for (const slot of SMART_SLOTS) {
      const fireAt = new Date(now);
      fireAt.setDate(now.getDate() + i);
      fireAt.setHours(slot.hour, 0, 0, 0);

      if (slot.type === 'briefing') {
        await scheduleSmartTipOne({ fireAt, title: briefingTitle, body: briefingBody });
      } else if (slot.type === 'urgent-only' && urgent) {
        await scheduleSmartTipOne({ fireAt, title: urgentTitle, body: urgentBody });
      }
    }
  }
};

/* ── Smart Tips dispatcher ───────────────────────────────────────────── */
const scheduleSmartTips = async ({ weather, city, categories, mode = 'smart', hour, days }) => {
  if (mode === 'fixed') {
    return scheduleSmartTipsFixed({ weather, city, categories, hour, days });
  }
  return scheduleSmartTipsSmart({ weather, city, categories, days });
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
  smartTipsEnabled    = false,
  smartTipsMode       = 'smart',
  smartTipsHour       = 7,
  smartTipCategories  = [],
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

  if (smartTipsEnabled && weather) {
    await scheduleSmartTips({
      weather,
      city:       cityInfo?.city,
      categories: smartTipCategories,
      mode:       smartTipsMode,
      hour:       smartTipsHour,
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
