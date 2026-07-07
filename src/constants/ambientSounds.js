/**
 * Ambient/white-noise catalogue. URLs point to freely-hosted CC0
 * ambient loops. You can replace with your own hosted files anytime.
 * Format: MP3, ~2-4 MB, ~1-3 min loops (fine because we loop=true).
 */

export const AMBIENT_SOUNDS = [
  {
    id:        'rain',
    label:     'Gentle Rain',
    emoji:     '🌧',
    gradient:  ['#4A5568', '#2D3748', '#1A202C'],
    // Suggested when weather condition is rainy
    matchesWeather: (type) => type === 'rainy',
    url:       'https://cdn.pixabay.com/audio/2022/03/10/audio_23fa9b41f4.mp3',
  },
  {
    id:        'ocean',
    label:     'Ocean Waves',
    emoji:     '🌊',
    gradient:  ['#0EA5E9', '#0369A1', '#082F49'],
    matchesWeather: (type) => type === 'sunny' || type === 'partly_cloudy',
    url:       'https://cdn.pixabay.com/audio/2022/03/15/audio_c8a0d5b5aa.mp3',
  },
  {
    id:        'fire',
    label:     'Fireplace',
    emoji:     '🔥',
    gradient:  ['#C2410C', '#7C2D12', '#431407'],
    matchesWeather: (type) => type === 'snowy' || type === 'stormy',
    url:       'https://cdn.pixabay.com/audio/2022/11/22/audio_febc508537.mp3',
  },
  {
    id:        'forest',
    label:     'Forest Birds',
    emoji:     '🌲',
    gradient:  ['#166534', '#14532D', '#052E16'],
    matchesWeather: () => false,
    url:       'https://cdn.pixabay.com/audio/2022/10/30/audio_a20a97e0cd.mp3',
  },
  {
    id:        'cafe',
    label:     'Coffee Shop',
    emoji:     '☕',
    gradient:  ['#78350F', '#451A03', '#292524'],
    matchesWeather: () => false,
    url:       'https://cdn.pixabay.com/audio/2022/03/25/audio_59e5da8d4d.mp3',
  },
  {
    id:        'whitenoise',
    label:     'White Noise',
    emoji:     '📻',
    gradient:  ['#374151', '#1F2937', '#0B1220'],
    matchesWeather: () => false,
    url:       'https://cdn.pixabay.com/audio/2022/05/13/audio_10d0d16385.mp3',
  },
];

export const AMBIENT_TIMERS = [
  { minutes: 0,   label: 'Off'    },
  { minutes: 10,  label: '10 min' },
  { minutes: 30,  label: '30 min' },
  { minutes: 60,  label: '1 hour' },
  { minutes: 120, label: '2 hours'},
];

/* Suggested sound for the current weather */
export const suggestForWeather = (weatherType) =>
  AMBIENT_SOUNDS.find((s) => s.matchesWeather(weatherType));
