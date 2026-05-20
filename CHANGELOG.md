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

## Upcoming — v1.1.0
- More share card templates (feature/share-card-templates)
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
