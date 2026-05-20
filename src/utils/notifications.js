import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { getWeatherInfo, formatTemperatureWithUnit } from './weatherHelpers';

/* ── Foreground display behaviour ─────────────────────────────────────── */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge:  false,
    shouldShowBanner: true,
    shouldShowList:   true,
  }),
});

/* ── Permissions ──────────────────────────────────────────────────────── */
export const requestNotificationPermission = async () => {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('daily-weather', {
      name: 'Daily Weather & Quote',
      importance:  Notifications.AndroidImportance.DEFAULT,
      lightColor:  '#3B8FD4',
      sound:       'default',
      description: 'Your daily weather snapshot with an inspirational quote.',
    });
  }

  const existing = await Notifications.getPermissionsAsync();
  if (existing.status === 'granted') return true;

  const req = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowBadge: false, allowSound: true },
  });
  return req.status === 'granted';
};

/* ── Build notification body from current data ────────────────────────── */
const buildContent = (weather, cityInfo, quote, unit) => {
  const current = weather?.current;
  const info    = current
    ? getWeatherInfo(current.weather_code, current.is_day === 1)
    : { emoji: '⛅', label: 'Today' };
  const temp    = current ? formatTemperatureWithUnit(current.temperature_2m, unit) : '';
  const city    = cityInfo?.city ?? '';

  const title = city
    ? `${info.emoji} ${temp} · ${city}`
    : `${info.emoji} Your daily weather`;

  const body  = quote?.text
    ? `"${quote.text}"${quote.author ? ` — ${quote.author}` : ''}`
    : `Open WeatherQ to see today's forecast.`;

  return { title, body };
};

/* ── Schedule the next N daily notifications ──────────────────────────── */
/**
 * Cancels any pending notifications, then schedules `days` notifications
 * at `hour` o'clock starting tomorrow. Each fires with the current
 * weather + quote data. Best called from the app's first stable render,
 * so the data shown reflects what the user just saw.
 */
export const scheduleDailyNotifications = async ({
  weather,
  cityInfo,
  quote,
  unit  = 'C',
  hour  = 8,
  days  = 7,
}) => {
  await Notifications.cancelAllScheduledNotificationsAsync();

  const { title, body } = buildContent(weather, cityInfo, quote, unit);

  const now = new Date();
  for (let i = 1; i <= days; i += 1) {
    const fireAt = new Date(now);
    fireAt.setDate(now.getDate() + i);
    fireAt.setHours(hour, 0, 0, 0);

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
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

/* ── Stop all notifications ───────────────────────────────────────────── */
export const cancelAllNotifications = async () => {
  await Notifications.cancelAllScheduledNotificationsAsync();
};

/* ── Debug helper ─────────────────────────────────────────────────────── */
export const getScheduledCount = async () => {
  const list = await Notifications.getAllScheduledNotificationsAsync();
  return list.length;
};
