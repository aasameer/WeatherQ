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

## [1.4.0] — 2026-05-24

### Added
- **Multiple saved cities** — switch between Home, Work, Family, anywhere
  - New "city chip" in the home top bar — tap to open the cities sheet
  - Bottom-sheet picker shows all saved cities + "Current Location" entry
  - Tap a row to switch · trash icon to remove (with confirmation)
  - "+ Add a City" button → opens existing Search screen
  - Active city + city list persist across app restarts via AsyncStorage
- `src/hooks/useSavedCities.js` — add/remove/switch/rename API
- `src/components/CitySwitcher.js` — animated modal sheet UI

### Changed
- HomeScreen now fetches weather based on the *active* saved city
  (instead of always using device location)
- `useLocation(autoRequest)` now only fires when the user is on
  "Current Location" — avoids unnecessary GPS prompts when viewing a fixed city
- Picking a city in Search now **saves** it (instead of single-use)
- Pull-to-refresh respects the active city
- Top bar layout: search · **city chip (tappable)** · settings
  (removed the static date — date already shown on share cards)

---

## [1.3.0] — 2026-05-24

### Added
- **Animated weather icons** — replaced all emoji weather icons (☀️, ⛅, 🌧️ etc.)
  with custom-drawn animated SVG illustrations:
  - **Sun** — rotating rays + pulsing body
  - **Moon** — twinkling stars beside crescent
  - **Cloud** — gentle horizontal drift
  - **Partly cloudy (day/night)** — sun/moon + drifting cloud
  - **Rain** — cloud + 3 staggered falling raindrops in loop
  - **Snow** — cloud + 3 staggered falling snowflakes
  - **Storm** — dark cloud + irregular lightning flash (double-flash pattern)
  - **Fog** — 3 horizontal lines fading in opposite cycles
- `src/components/WeatherIcon.js` — single component, maps weather type to icon
- Works in **Expo Go AND production** (pure react-native-svg + Animated, no Lottie deps)

### Updated
- `WeatherCard.js` — replaced large emoji with animated icon (88px)
- `ShareCard.js` — both Square (60px) and Story (110px) cards use animated icons

### Updated About screen
- Version bumped to 1.3.0

---

## [1.2.1] — 2026-05-24

### Changed
- Full proper branding: **Digital Development Pioneers** (was "DDP Development")
- Real DDP logo (downloaded from devpioneers.sa) shown on About screen + landing page
- About screen: dedicated "Developed By" card with DDP logo, tagline, devpioneers.sa link
- Privacy policy: company name, link to devpioneers.sa, logo in header
- Landing page: "Built by [DDP logo] Digital Development Pioneers" chip
- About screen wired up real links (Privacy Policy → GitHub Pages, Send Feedback → email)

### Added
- assets/ddp-logo.png + docs/ddp-logo.png

---

## [1.2.0] — 2026-05-21

### Added
- Background weather refresh — `expo-background-fetch` task wakes up
  every ~12 h to fetch fresh weather + quote and reschedule notifications.
  Notifications no longer show stale "yesterday's weather".
- iOS `UIBackgroundModes` + `BGTaskSchedulerPermittedIdentifiers` registered.
- Initial "DDP Development" branding on About screen, privacy policy
  and landing page (replaced by full name in v1.2.1).

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
