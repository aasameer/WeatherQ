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

## [1.7.2] — 2026-05-27

### Fixed — Play Store Policy Compliance
- **Removed invalid media permissions** flagged by Google Play:
  - WeatherQ only SAVES share cards (write) — it never reads the
    user's photos/videos, so READ_MEDIA_IMAGES / READ_MEDIA_VIDEO /
    READ_MEDIA_AUDIO / READ_EXTERNAL_STORAGE / READ_MEDIA_VISUAL_USER_SELECTED
    are now explicitly blocked via `android.blockedPermissions`
  - Cleaned up the bloated auto-generated permissions array down to
    just ACCESS_FINE_LOCATION + ACCESS_COARSE_LOCATION
  - `MediaLibrary.requestPermissionsAsync(true)` → write-only request
  - `expo-media-library` plugin: `isPhotosAccessRequired: false`
- Saving cards still works perfectly (uses scoped MediaStore on Android 10+)

---

## [1.7.1] — 2026-05-24

### Fixed
- Quiet Hours subtitle text was overlapping with the toggle switch.
  Subtitle now shows only the time range; the safety-alert explanation
  moved to the dedicated hint card below the toggles.

### Added
- **Rate WeatherQ** in Settings → Info is now wired to the live
  Play Store listing for `com.weatherq.app`:
  - Android → opens `market://details?id=…` directly
  - iOS → opens "Write Review" sheet (once App Store ID is set)
  - Graceful fallback to web Play Store URL if `market://` unavailable

---

## [1.7.0] — 2026-05-24

### Added — Anti-Spam Coordination
- **Smart Consolidation** (default ON) — auto-suppresses overlapping
  notifications so the user is never flooded:
  - If Smart Tips is on, the basic Daily Reminder is auto-skipped
    (they're redundant — both show weather and a daily message)
  - If Wake-up Alarm fires within 90 min of the 7 AM Smart Tips briefing,
    the briefing is skipped (alarm already serves morning purpose)
- **Quiet Hours** (default 10 PM → 6 AM) — no non-critical notifications
  during sleep:
  - Wake-up alarm always fires (user explicitly set the time)
  - Critical alerts (priority ≥ 95) bypass quiet hours — severe storms,
    heatstroke warnings, etc.
  - All other notifications skipped during quiet window
- New Settings → "Don't Bother Me" section with both toggles + a live
  explainer card showing which rules are active

### Internals
- `inQuietHours(hour, config)` helper — handles ranges crossing midnight
- `rescheduleAllNotifications()` extended with `smartConsolidation`,
  `quietHoursEnabled`, `quietHoursStart`, `quietHoursEnd`
- Critical-priority tips (≥ 95) defined separately from "urgent" (≥ 80)
  to allow life-safety alerts to bypass quiet hours

---

## [1.6.1] — 2026-05-24

### Changed
- **Smart Tips now enabled by default** (was opt-in)
- **New "Smart" delivery mode** (default) — engine picks times:
  - Morning briefing at **7 AM** (always, with top 3 tips)
  - Urgent alerts at **11 AM · 2 PM · 5 PM · 8 PM** — only if there's
    a tip with priority ≥ 80 (storms, heatwave, black ice, fog,
    severe wind, freezing pipes, hot-car-pets…)
- Old behaviour preserved as **"Fixed time"** mode — pick a single
  delivery hour just like before
- Settings UI: new Smart vs Fixed mode selector with explainer card

### Notes
- Smart mode notifications still require user to grant notification
  permission. Existing toggle handler in Settings requests it.
- All scheduled notifications continue to be background-refreshed
  every ~12h so content reflects current weather.

---

## [1.6.0] — 2026-05-24

### Added
- **Smart Weather Tips** — daily notification with personalized tips
  based on today's actual weather (no UI clutter on home screen)
- 40+ rules across 8 categories: Clothing, Activities, Driving,
  Health, Home, Mood, Pets, Sleep
  - Priority-ranked (severe weather like storms, black ice always shown first)
  - Each rule evaluates `tempC`, `feelsC`, `weather_code`, `humidity`,
    `wind`, `isDay`, daily highs/lows
- New Settings → Smart Tips section:
  - Toggle on/off (requests notification permission)
  - Delivery time picker (chip-based hours)
  - **8 category chips** — tap to include/exclude each category
  - **Live preview** card — shows the tips that would fire RIGHT NOW
    for the current city/weather (updates when you toggle categories)
- Notification format: "💡 Today's Tips for <city>" + up to 3 bulleted tips
- Android: dedicated `smart-tips` channel (DEFAULT importance)
- Fully background-refreshes — tips reflect today's real weather

---

## [1.5.0] — 2026-05-24

### Added
- **Smart Wake-up Alarm** — wake up to today's weather + fresh quote
  - Toggle in Settings → Wake-up Alarm
  - Custom time picker (HH:MM, any time you want, not just preset hours)
  - 7 day-of-week chips (Mon-Sun) for repeat schedule — defaults to weekdays
  - Pretty summary like "6:30 AM · Weekdays" or "7:15 AM · Mon · Wed · Fri"
  - Dedicated Android channel `wake-alarm` with HIGH importance, bypasses DnD,
    custom vibration pattern (300/200/300/200/600 ms)
  - iOS `interruptionLevel: timeSensitive` — pierces Focus modes
  - Notification title prefixed with ⏰ and body contains the day's quote
  - Fully integrated with background refresh — content stays fresh

### Refactored
- `notifications.js` → new `rescheduleAllNotifications()` handles both
  daily reminders + weekly alarms in a single call
- HomeScreen + backgroundTasks both call the new function
- Old `scheduleDailyNotifications` kept as a back-compat alias

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
