# WeatherQ — Changelog

All notable changes to WeatherQ are documented here.
Format: [Semantic Versioning](https://semver.org) — MAJOR.MINOR.PATCH

---

## [1.0.0] — 2026-05-21 🚀 Initial Release

### Features
- Auto location detection with permission handling
- Current weather via Open-Meteo API (temp, feels-like, humidity, wind, sunrise/sunset, high/low)
- Manual city search with geocoding
- Daily random quote — same quote all day, fresh one each new day
- 4 quote languages: English (+ ZenQuotes API), Arabic, Spanish, French
- RTL support for Arabic quotes
- Weather-based dynamic backgrounds (sunny, cloudy, rainy, stormy, night)
- Beautiful share cards — Square (1080×1080) and Story (1080×1920) formats
- Download card to photo library
- Native share sheet integration
- Daily push notifications with weather + quote at user-chosen time
- Language picker in Settings
- Temperature unit toggle (°C / °F)
- AdMob interstitial ads after every 3rd share (max once per 6 hours)
- Offline cache for weather and quote data
- Splash screen animation

### Technical
- Expo SDK 54 / React Native 0.81
- Open-Meteo (weather), ZenQuotes (English quotes)
- expo-notifications, expo-location, expo-media-library, expo-sharing
- react-native-google-mobile-ads 16.x
- EAS Build — Android production AAB submitted to Play Store

---

## [1.2.0] — 2026-05-21

### Added
- Background weather refresh — `expo-background-fetch` task wakes up
  every ~12 h to fetch fresh weather + quote and reschedule notifications.
  Notifications no longer show stale "yesterday's weather".
- iOS `UIBackgroundModes` + `BGTaskSchedulerPermittedIdentifiers` registered.
- "Powered by DDP Development" branding on About screen, privacy policy
  and landing page.

### Changed
- Copyright: © 2026 DDP Development (was generic "WeatherQ").
- About screen version bumped to 1.2.0 with DDP byline.

---

## [1.1.0] — 2026-05-21

### Added
- 4 share card templates with visual picker:
  Weather (dynamic), Midnight, Sunset, Ocean
- Horizontal template chips with gradient swatch + emoji + active dot
- Each template defines its own gradient, text, quote box, stat colors
- RTL Arabic quote support already preserved across all templates

---

## Upcoming — v1.3.0
- Saved favourite quotes
- Hourly forecast strip
- Air Quality Index

---

<!-- Template for future releases:

## [X.Y.Z] — YYYY-MM-DD

### Added
- 

### Changed
- 

### Fixed
- 

### Removed
- 

-->
