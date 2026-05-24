# WeatherQ ⛅

> Weather that speaks to you — daily weather + inspirational quotes in a shareable card.

A React Native (Expo) app that combines live weather data with daily motivational quotes. Users can generate beautiful shareable image cards for Instagram, WhatsApp, Stories, and more.

---

## Features

- **Live weather** via Open-Meteo (free, no API key needed)
- **7-day forecast** with daily high/low temperatures
- **Daily quote** via ZenQuotes API with local caching (same quote all day, refresh on demand)
- **Dynamic backgrounds** that change with weather conditions (sunny, rainy, stormy, night, snow, fog…)
- **Share cards** in two formats — Square (1:1) and Story (9:16)
- **Download to Camera Roll** or **native share sheet**
- **City search** with geocoding
- **Auto location** detection
- **Temperature toggle** °C / °F in Settings
- **Offline support** — last weather response cached locally

---

## Screenshots

```
Home Screen             Search Screen           Share Screen
┌──────────────┐        ┌──────────────┐        ┌──────────────┐
│  ⛅  Cairo   │        │ 🔍 Search... │        │ [Square][Story]│
│  Mon Jan 15  │        │              │        │              │
│    24°       │        │ Cairo, EG    │        │   PREVIEW    │
│ Partly Cloudy│        │ London, GB   │        │  [card here] │
│ 🌡️ 💧 💨    │        │ Paris, FR    │        │              │
│  7-Day fore. │        │              │        │ ↓ Save  ↗ Share│
│  "Quote..."  │        │              │        │              │
│ [Share Card] │        │              │        │              │
└──────────────┘        └──────────────┘        └──────────────┘
```

---

## Setup

### 1. Prerequisites

- Node.js 18+
- [Expo CLI](https://docs.expo.dev/get-started/installation/): `npm install -g expo-cli`
- iOS Simulator (macOS) or Android Emulator, **or** the [Expo Go](https://expo.dev/client) app on your phone

### 2. Install dependencies

```bash
cd WeatherQ
npm install
```

### 3. Environment variables

No API keys are required to run the app — both Open-Meteo and ZenQuotes are free and keyless.

If you later want to switch weather provider to OpenWeatherMap, copy `.env.example` to `.env` and fill in the key:

```bash
cp .env.example .env
```

### 4. Start the development server

```bash
npx expo start
```

- Press `i` to open on iOS Simulator
- Press `a` to open on Android Emulator
- Scan the QR code with Expo Go on your phone

---

## Project Structure

```
WeatherQ/
├── App.js                          ← Entry point, splash + context
├── app.json                        ← Expo config (permissions, icons)
├── babel.config.js
├── .env.example                    ← API key placeholders
└── src/
    ├── api/
    │   ├── weatherService.js       ← Open-Meteo + Nominatim geocoding
    │   └── quotesService.js        ← ZenQuotes + 25 fallback quotes
    ├── components/
    │   ├── ErrorView.js
    │   ├── ForecastStrip.js        ← Horizontal 7-day scroll
    │   ├── LoadingScreen.js        ← Animated loading state
    │   ├── QuoteDisplay.js         ← Quote card with refresh button
    │   ├── ShareCard.js            ← Square & Story card components
    │   ├── WeatherBackground.js    ← Dynamic LinearGradient wrapper
    │   └── WeatherCard.js          ← Main weather display card
    ├── constants/
    │   ├── colors.js               ← Gradients, glass tokens, text
    │   └── config.js               ← API URLs, cache keys, defaults
    ├── context/
    │   └── SettingsContext.js      ← Global settings (unit, etc.)
    ├── hooks/
    │   ├── useLocation.js          ← expo-location wrapper
    │   ├── useQuote.js             ← Daily quote + cache logic
    │   └── useWeather.js           ← Weather fetch + cache
    ├── navigation/
    │   └── AppNavigator.js         ← Stack navigator
    ├── screens/
    │   ├── AboutScreen.js
    │   ├── HomeScreen.js           ← Main weather + quote view
    │   ├── SearchScreen.js         ← City search
    │   ├── SettingsScreen.js
    │   ├── ShareScreen.js          ← Card preview + download/share
    │   └── SplashScreen.js         ← Animated launch screen
    └── utils/
        ├── cache.js                ← AsyncStorage helpers
        ├── dateHelpers.js
        └── weatherHelpers.js       ← WMO code mappings, temp conversion
```

---

## APIs Used

| API | Purpose | Cost | Key needed |
|-----|---------|------|-----------|
| [Open-Meteo](https://open-meteo.com) | Weather forecast | Free | ✗ |
| [Open-Meteo Geocoding](https://open-meteo.com/en/docs/geocoding-api) | City name → lat/lon | Free | ✗ |
| [Nominatim (OSM)](https://nominatim.org) | lat/lon → city name | Free | ✗ |
| [ZenQuotes](https://zenquotes.io) | Inspirational quotes | Free | ✗ |

All APIs have generous free tiers and require no registration. The app includes 25 fallback quotes so it works fully offline or if ZenQuotes is unreachable.

---

## Weather Conditions Supported

| Condition | Background |
|-----------|-----------|
| Clear sky (day) | Warm orange/amber gradient |
| Clear sky (night) | Deep navy gradient |
| Partly cloudy | Blue gradient |
| Overcast | Steel grey gradient |
| Rain / Drizzle | Dark navy gradient |
| Snow | Ice blue gradient |
| Thunderstorm | Near-black dramatic gradient |
| Fog | Grey-teal gradient |

---

## Monetization Readiness

The app structure is ready for these additions:

```
src/
├── ads/
│   ├── BannerAd.js          ← Banner on HomeScreen bottom
│   ├── InterstitialAd.js    ← Before sharing/downloading
│   └── RewardedAd.js        ← Unlock premium card themes
└── screens/
    └── PremiumScreen.js     ← Paywall / IAP screen
```

Suggested integration points:
- **Banner ads**: Below the quote section on `HomeScreen`
- **Interstitial ads**: In `ShareScreen.handleDownload()` / `handleShare()` (wrap with ad then action)
- **Rewarded ads**: Gate premium card themes in `ShareScreen` format picker
- **IAP / Remove Ads**: Settings screen already has a "WeatherQ Pro" placeholder row

Recommended packages: `react-native-google-mobile-ads`, `expo-in-app-purchases`.

---

## Building for Production

### iOS (requires macOS + Xcode)

```bash
npx expo build:ios
# or with EAS Build:
eas build --platform ios
```

### Android

```bash
npx expo build:android
# or with EAS Build:
eas build --platform android
```

### Store Checklist

- [ ] Replace placeholder icon in `/assets/icon.png` (1024×1024 PNG)
- [ ] Replace splash screen in `/assets/splash.png` (1284×2778 recommended)
- [ ] Fill in `app.json` → `ios.bundleIdentifier` and `android.package`
- [ ] Set up EAS credentials: `eas credentials`
- [ ] Add Privacy Policy URL to App Store listing
- [ ] Test location permission flow on real device

---

## License

MIT — free to use, modify, and publish.
