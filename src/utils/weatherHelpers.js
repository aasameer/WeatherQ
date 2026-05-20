export const WMO_CODES = {
  0:  { label: 'Clear Sky',           emoji: '☀️',  type: 'sunny' },
  1:  { label: 'Mainly Clear',        emoji: '🌤️',  type: 'partly_cloudy' },
  2:  { label: 'Partly Cloudy',       emoji: '⛅',  type: 'partly_cloudy' },
  3:  { label: 'Overcast',            emoji: '☁️',  type: 'cloudy' },
  45: { label: 'Foggy',               emoji: '🌫️',  type: 'fog' },
  48: { label: 'Icy Fog',             emoji: '🌫️',  type: 'fog' },
  51: { label: 'Light Drizzle',       emoji: '🌦️',  type: 'rainy' },
  53: { label: 'Drizzle',             emoji: '🌦️',  type: 'rainy' },
  55: { label: 'Heavy Drizzle',       emoji: '🌧️',  type: 'rainy' },
  61: { label: 'Light Rain',          emoji: '🌧️',  type: 'rainy' },
  63: { label: 'Rain',                emoji: '🌧️',  type: 'rainy' },
  65: { label: 'Heavy Rain',          emoji: '🌧️',  type: 'rainy' },
  71: { label: 'Light Snow',          emoji: '🌨️',  type: 'snowy' },
  73: { label: 'Snow',                emoji: '❄️',  type: 'snowy' },
  75: { label: 'Heavy Snow',          emoji: '❄️',  type: 'snowy' },
  77: { label: 'Snow Grains',         emoji: '❄️',  type: 'snowy' },
  80: { label: 'Light Showers',       emoji: '🌦️',  type: 'rainy' },
  81: { label: 'Showers',             emoji: '🌧️',  type: 'rainy' },
  82: { label: 'Heavy Showers',       emoji: '🌧️',  type: 'rainy' },
  85: { label: 'Snow Showers',        emoji: '🌨️',  type: 'snowy' },
  86: { label: 'Heavy Snow Showers',  emoji: '❄️',  type: 'snowy' },
  95: { label: 'Thunderstorm',        emoji: '⛈️',  type: 'stormy' },
  96: { label: 'Storm + Hail',        emoji: '⛈️',  type: 'stormy' },
  99: { label: 'Severe Storm',        emoji: '🌩️',  type: 'stormy' },
};

export const getWeatherInfo = (code, isDay = true) => {
  const info = WMO_CODES[code] ?? { label: 'Unknown', emoji: '🌡️', type: 'partly_cloudy' };
  if (!isDay && (info.type === 'sunny' || info.type === 'partly_cloudy')) {
    return { ...info, emoji: info.type === 'sunny' ? '🌕' : '🌙', type: 'night' };
  }
  return info;
};

export const celsiusToFahrenheit = (c) => Math.round((c * 9) / 5 + 32);

export const formatTemperature = (temp, unit = 'C') => {
  if (unit === 'F') return `${celsiusToFahrenheit(temp)}°`;
  return `${Math.round(temp)}°`;
};

export const formatTemperatureWithUnit = (temp, unit = 'C') => {
  if (unit === 'F') return `${celsiusToFahrenheit(temp)}°F`;
  return `${Math.round(temp)}°C`;
};

export const getWindDescription = (speed) => {
  if (speed < 1)  return 'Calm';
  if (speed < 6)  return 'Light air';
  if (speed < 12) return 'Light breeze';
  if (speed < 20) return 'Gentle breeze';
  if (speed < 29) return 'Moderate breeze';
  if (speed < 39) return 'Fresh breeze';
  if (speed < 50) return 'Strong breeze';
  return 'High wind';
};

export const getWindDirectionLabel = (degrees) => {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round(degrees / 45) % 8];
};
