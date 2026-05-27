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

// Tips are "critical" — bypass quiet hours (severe storm, heatstroke, etc.)
const CRITICAL_PRIORITY = 95;

/* ── Quiet hours check ───────────────────────────────────────────────── */
const inQuietHours = (hour, { enabled, start, end }) => {
  if (!enabled) return false;
  if (start === end) return false;
  // Range crosses midnight (e.g., 22 → 6)
  if (start > end) return hour >= start || hour < end;
  // Same-day range (e.g., 1 → 5)
  return hour >= start && hour < end;
};

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

/* ── SMART mode — multi-slot, with quiet hours + briefing-skip rules ─── */
const scheduleSmartTipsSmart = async ({
  weather, city, categories, days = 7,
  quietHours = { enabled: false }, skipBriefing = false,
}) => {
  const allTips = getActiveTips(weather, categories, 5);
  if (!allTips.length) return;

  const briefing = allTips.slice(0, 3);
  const urgent   = allTips.find((t) => t.priority >= URGENT_PRIORITY);
  const critical = allTips.find((t) => t.priority >= CRITICAL_PRIORITY);

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

      // Critical tips ALWAYS pass through; everything else respects quiet hours
      const isQuiet = inQuietHours(slot.hour, quietHours);
      if (isQuiet && !critical) continue;

      if (slot.type === 'briefing') {
        if (skipBriefing) continue;        // alarm fires nearby — skip the briefing
        if (isQuiet) continue;             // briefing is never critical
        await scheduleSmartTipOne({ fireAt, title: briefingTitle, body: briefingBody });
      } else if (slot.type === 'urgent-only' && urgent) {
        await scheduleSmartTipOne({ fireAt, title: urgentTitle, body: urgentBody });
      }
    }
  }
};

/* Smart Tips dispatcher removed — rescheduleAllNotifications now
 * inlines the smart/fixed routing so it can apply consolidation
 * rules (e.g. skip briefing when alarm fires nearby). */

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
  // Anti-spam coordination
  smartConsolidation  = true,
  quietHoursEnabled   = true,
  quietHoursStart     = 22,
  quietHoursEnd       = 6,
}) => {
  await ensureChannels();
  await Notifications.cancelAllScheduledNotificationsAsync();

  const content = buildContent(weather, cityInfo, quote, unit);
  const quietHours = {
    enabled: quietHoursEnabled,
    start:   quietHoursStart,
    end:     quietHoursEnd,
  };

  /* ─── Coordination rules ───────────────────────────────────────────── */
  // 1. If Smart Tips is on AND smart consolidation is on, the basic daily
  //    reminder is redundant (smart tips morning briefing already covers it)
  const effectiveDailyEnabled =
    dailyEnabled && !(smartConsolidation && smartTipsEnabled);

  // 2. If a wake-up alarm fires within 90 min of the 7 AM smart tips briefing
  //    AND smart consolidation is on, skip the briefing (alarm already wakes you)
  let skipSmartBriefing = false;
  if (smartConsolidation && alarmEnabled && smartTipsEnabled && smartTipsMode === 'smart' && alarmDays?.length) {
    const briefingMinutes = 7 * 60;
    const alarmMinutes    = alarmHour * 60 + alarmMinute;
    skipSmartBriefing     = Math.abs(briefingMinutes - alarmMinutes) <= 90;
  }
  /* ──────────────────────────────────────────────────────────────────── */

  if (effectiveDailyEnabled && !inQuietHours(dailyHour, quietHours)) {
    await scheduleDailyReminders({
      titleBase: content.titleBase,
      body:      content.body,
      hour:      dailyHour,
    });
  }

  if (alarmEnabled && alarmDays?.length) {
    // Alarms always fire — user explicitly set the time
    await scheduleWakeupAlarms({
      titleBase: content.titleBase,
      body:      content.body,
      hour:      alarmHour,
      minute:    alarmMinute,
      days:      alarmDays,
    });
  }

  if (smartTipsEnabled && weather) {
    if (smartTipsMode === 'fixed') {
      // Honor quiet hours for fixed-mode delivery
      if (!inQuietHours(smartTipsHour, quietHours)) {
        await scheduleSmartTipsFixed({
          weather,
          city:       cityInfo?.city,
          categories: smartTipCategories,
          hour:       smartTipsHour,
        });
      }
    } else {
      await scheduleSmartTipsSmart({
        weather,
        city:       cityInfo?.city,
        categories: smartTipCategories,
        quietHours,
        skipBriefing: skipSmartBriefing,
      });
    }
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
