export const WEATHER_API_BASE = 'https://api.open-meteo.com/v1';
export const GEOCODING_API_BASE = 'https://geocoding-api.open-meteo.com/v1';
export const REVERSE_GEOCODING_BASE = 'https://nominatim.openstreetmap.org';
export const QUOTES_API_URL = 'https://zenquotes.io/api/random';

export const CACHE_KEYS = {
  DAILY_QUOTE:  'weatherq_daily_quote',
  LAST_WEATHER: 'weatherq_last_weather',
  SETTINGS:     'weatherq_settings',
  LAST_CITY:    'weatherq_last_city',
  SAVED_CITIES: 'weatherq_saved_cities',
};

export const DEFAULT_SETTINGS = {
  temperatureUnit:       'C',
  quoteLanguage:         'en',
  notificationsEnabled:  false,
  notificationHour:      8,
  /* ── Wake-up Alarm ── */
  alarmEnabled:          false,
  alarmHour:             6,
  alarmMinute:           30,
  alarmDays:             [2, 3, 4, 5, 6], // ISO: 1=Sun, 2=Mon, ..., 7=Sat
  /* ── Smart Tips Notification ── */
  smartTipsEnabled:      false,
  smartTipsHour:         7,
  smartTipCategories:    ['clothing', 'activities', 'driving', 'health', 'home', 'mood', 'pets', 'sleep'],
};

export const WEATHER_PARAMS = {
  current: [
    'temperature_2m',
    'relative_humidity_2m',
    'apparent_temperature',
    'is_day',
    'precipitation',
    'weather_code',
    'wind_speed_10m',
    'wind_direction_10m',
  ].join(','),
  daily: [
    'temperature_2m_max',
    'temperature_2m_min',
    'sunrise',
    'sunset',
  ].join(','),
  forecast_days: 1,
};
