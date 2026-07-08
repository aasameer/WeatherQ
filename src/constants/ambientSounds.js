/**
 * Ambient/white-noise catalogue.
 *
 * Uses SoundJay's freely-hosted MP3 loops (CC-BY-3.0). These are direct
 * MP3 URLs, iOS-AVPlayer-compatible, and cross-origin-safe. If a URL
 * ever 404s, the player shows a friendly retry state instead of crashing.
 *
 * To bundle your own sounds instead of streaming:
 *   1. Upload MP3s to  https://aasameer.github.io/sounds/<name>.mp3
 *   2. Swap each `url` below with your hosted URL
 * (bundled `require()`d files also work — just import the file here)
 */

export const AMBIENT_SOUNDS = [
  {
    id:        'rain',
    label:     'Gentle Rain',
    emoji:     '🌧',
    gradient:  ['#4A5568', '#2D3748', '#1A202C'],
    matchesWeather: (type) => type === 'rainy',
    url:       'https://www.soundjay.com/nature/sounds/rain-01.mp3',
    fallback:  'https://cdn.pixabay.com/download/audio/2022/03/10/audio_c8c8a73467.mp3?filename=light-rain-ambient-114354.mp3',
  },
  {
    id:        'ocean',
    label:     'Ocean Waves',
    emoji:     '🌊',
    gradient:  ['#0EA5E9', '#0369A1', '#082F49'],
    matchesWeather: (type) => type === 'sunny' || type === 'partly_cloudy',
    url:       'https://www.soundjay.com/nature/sounds/ocean-wave-1.mp3',
    fallback:  'https://cdn.pixabay.com/download/audio/2022/03/15/audio_942d6cd82f.mp3?filename=ocean-waves-112906.mp3',
  },
  {
    id:        'fire',
    label:     'Fireplace',
    emoji:     '🔥',
    gradient:  ['#C2410C', '#7C2D12', '#431407'],
    matchesWeather: (type) => type === 'snowy' || type === 'stormy',
    url:       'https://www.soundjay.com/nature/sounds/fireplace-1.mp3',
    fallback:  'https://cdn.pixabay.com/download/audio/2022/03/07/audio_c4f8f8f7f9.mp3?filename=fireplace-crackling-6231.mp3',
  },
  {
    id:        'forest',
    label:     'Forest Birds',
    emoji:     '🌲',
    gradient:  ['#166534', '#14532D', '#052E16'],
    matchesWeather: () => false,
    url:       'https://www.soundjay.com/nature/sounds/forest-1.mp3',
    fallback:  'https://cdn.pixabay.com/download/audio/2022/03/17/audio_87c11e37a3.mp3?filename=forest-with-small-river-birds-and-nature-field-recording-6735.mp3',
  },
  {
    id:        'cafe',
    label:     'Coffee Shop',
    emoji:     '☕',
    gradient:  ['#78350F', '#451A03', '#292524'],
    matchesWeather: () => false,
    url:       'https://cdn.pixabay.com/download/audio/2023/06/07/audio_5e51c8b4e0.mp3?filename=cafe-ambience-160840.mp3',
    fallback:  'https://cdn.pixabay.com/download/audio/2022/10/16/audio_8f0e0dfef1.mp3?filename=coffee-shop-ambience-6362.mp3',
  },
  {
    id:        'whitenoise',
    label:     'White Noise',
    emoji:     '📻',
    gradient:  ['#374151', '#1F2937', '#0B1220'],
    matchesWeather: () => false,
    url:       'https://cdn.pixabay.com/download/audio/2022/09/28/audio_a9dcefaefd.mp3?filename=white-noise-127275.mp3',
    fallback:  'https://cdn.pixabay.com/download/audio/2023/04/13/audio_9b1c73dd6c.mp3?filename=white-noise-146597.mp3',
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
