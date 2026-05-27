/**
 * Smart Weather Recommendations — rule engine.
 *
 * Each rule has:
 *   - id            unique
 *   - category      one of TIP_CATEGORIES
 *   - icon          emoji shown in the tip
 *   - title         short headline (5-30 chars)
 *   - body          one-line explanation (under 60 chars)
 *   - priority      0-100 (higher = shown first)
 *   - when(ctx)     boolean — `ctx` exposes parsed weather values
 *
 * `getActiveTips(weather, enabledCategories, max)` returns the top
 * matching tips, sorted by priority desc.
 */

export const TIP_CATEGORIES = [
  { id: 'clothing',   label: 'Clothing',   emoji: '👕' },
  { id: 'activities', label: 'Activities', emoji: '🏃' },
  { id: 'driving',    label: 'Driving',    emoji: '🚗' },
  { id: 'health',     label: 'Health',     emoji: '💧' },
  { id: 'home',       label: 'Home',       emoji: '🏠' },
  { id: 'mood',       label: 'Mood',       emoji: '😌' },
  { id: 'pets',       label: 'Pets',       emoji: '🐾' },
  { id: 'sleep',      label: 'Sleep',      emoji: '🌙' },
];

const isRain  = (code) => code != null && ((code >= 51 && code <= 67) || (code >= 80 && code <= 82));
const isSnow  = (code) => code != null && ((code >= 71 && code <= 77) || (code >= 85 && code <= 86));
const isFog   = (code) => code === 45 || code === 48;
const isStorm = (code) => code >= 95;
const isClear = (code) => code === 0 || code === 1;

const RULES = [
  /* ── Clothing ───────────────────────────────────────────────────────── */
  { id: 'cloth-arctic',     category: 'clothing',  icon: '❄️',  title: 'Winter coat & gloves',     body: 'Freezing temperatures today',           priority: 90,
    when: ({ tempC }) => tempC < 0 },
  { id: 'cloth-cold',       category: 'clothing',  icon: '🧥',  title: 'Bundle up — it\'s cold',    body: 'Below 10°C — heavy jacket recommended', priority: 85,
    when: ({ tempC }) => tempC >= 0 && tempC < 10 },
  { id: 'cloth-mild',       category: 'clothing',  icon: '🧥',  title: 'Light jacket weather',     body: '10–15°C — bring a light layer',          priority: 60,
    when: ({ tempC }) => tempC >= 10 && tempC < 15 },
  { id: 'cloth-tshirt',     category: 'clothing',  icon: '👕',  title: 'T-shirt weather',           body: '18–25°C — perfect short sleeves',        priority: 55,
    when: ({ tempC }) => tempC >= 18 && tempC <= 25 },
  { id: 'cloth-hot',        category: 'clothing',  icon: '🥵',  title: 'Stay cool & loose',         body: 'Over 30°C — wear light colors',          priority: 80,
    when: ({ tempC }) => tempC > 30 },
  { id: 'cloth-layers',     category: 'clothing',  icon: '🧣',  title: 'Wear layers',               body: 'Big day-to-night temperature swing',     priority: 70,
    when: ({ daily }) => daily && (daily.temperature_2m_max?.[0] - daily.temperature_2m_min?.[0]) > 15 },
  { id: 'cloth-umbrella',   category: 'clothing',  icon: '☂️',  title: 'Take an umbrella',          body: 'Rain expected today',                    priority: 95,
    when: ({ code }) => isRain(code) },
  { id: 'cloth-shades',     category: 'clothing',  icon: '🕶',  title: 'Sunglasses recommended',    body: 'Clear sky + bright sun',                 priority: 65,
    when: ({ code, isDay }) => isClear(code) && isDay },
  { id: 'cloth-snow-boots', category: 'clothing',  icon: '👢',  title: 'Snow boots today',          body: 'Snow on the ground — grippy soles',      priority: 88,
    when: ({ code }) => isSnow(code) },

  /* ── Activities ─────────────────────────────────────────────────────── */
  { id: 'act-walk',         category: 'activities', icon: '🚶', title: 'Perfect for a walk',        body: 'Mild + dry + low wind',                  priority: 60,
    when: ({ tempC, code, wind }) => tempC >= 17 && tempC <= 24 && !isRain(code) && !isSnow(code) && wind < 25 },
  { id: 'act-hike',         category: 'activities', icon: '🥾', title: 'Great hiking weather',      body: 'Dry trails + comfortable temps',         priority: 55,
    when: ({ tempC, code, wind }) => tempC >= 14 && tempC <= 22 && !isRain(code) && !isSnow(code) && wind < 30 },
  { id: 'act-beach',        category: 'activities', icon: '🏖',  title: 'Beach-worthy day',          body: 'Sunny, warm, light breeze',              priority: 70,
    when: ({ tempC, code, wind, isDay }) => tempC >= 24 && isClear(code) && wind < 25 && isDay },
  { id: 'act-cycling',      category: 'activities', icon: '🚴', title: 'Excellent for cycling',     body: 'Mild + low wind',                        priority: 50,
    when: ({ tempC, code, wind }) => tempC >= 16 && tempC <= 26 && !isRain(code) && wind < 20 },
  { id: 'act-indoor-storm', category: 'activities', icon: '⛔', title: 'Stay indoors — storm',      body: 'Thunderstorm warning active',            priority: 100,
    when: ({ code }) => isStorm(code) },
  { id: 'act-run-later',    category: 'activities', icon: '🏃', title: 'Run early or late',          body: 'Too hot for midday workouts',             priority: 72,
    when: ({ tempC, isDay }) => tempC > 30 && isDay },

  /* ── Driving ────────────────────────────────────────────────────────── */
  { id: 'drv-good',         category: 'driving',   icon: '✅',  title: 'Good driving conditions',   body: 'Clear and dry roads',                    priority: 40,
    when: ({ code, wind }) => isClear(code) && wind < 30 },
  { id: 'drv-wet',          category: 'driving',   icon: '💧',  title: 'Wet roads — drive carefully', body: 'Rain reduces traction',                priority: 85,
    when: ({ code }) => isRain(code) },
  { id: 'drv-fog',          category: 'driving',   icon: '🌫',  title: 'Low visibility — fog lights', body: 'Slow down and increase distance',      priority: 92,
    when: ({ code }) => isFog(code) },
  { id: 'drv-snow',         category: 'driving',   icon: '❄️',  title: 'Snow on roads — slow down', body: 'Reduce speed, increase gap',             priority: 95,
    when: ({ code }) => isSnow(code) },
  { id: 'drv-ice',          category: 'driving',   icon: '🧊',  title: 'Watch for black ice',       body: 'Near-freezing + recent precipitation',   priority: 96,
    when: ({ tempC, code }) => tempC <= 2 && (isRain(code) || isSnow(code)) },
  { id: 'drv-wind',         category: 'driving',   icon: '💨',  title: 'Strong crosswinds expected', body: 'Grip the wheel — gusts over 50 km/h',   priority: 78,
    when: ({ wind }) => wind > 50 },
  { id: 'drv-storm',        category: 'driving',   icon: '🚫',  title: 'Avoid driving if possible', body: 'Severe storm conditions',                priority: 99,
    when: ({ code }) => isStorm(code) },

  /* ── Health ─────────────────────────────────────────────────────────── */
  { id: 'hlt-hydrate',      category: 'health',    icon: '🚰',  title: 'Drink plenty of water',     body: 'Hot day — stay hydrated',                priority: 82,
    when: ({ tempC }) => tempC > 28 },
  { id: 'hlt-heat-warn',    category: 'health',    icon: '🥵',  title: 'Heatwave — limit outdoor time', body: 'Over 35°C — risk of heatstroke',     priority: 98,
    when: ({ tempC }) => tempC > 35 },
  { id: 'hlt-muggy',        category: 'health',    icon: '💦',  title: 'Muggy — stay hydrated',     body: 'High humidity makes it feel hotter',     priority: 60,
    when: ({ tempC, humidity }) => tempC > 24 && humidity > 75 },
  { id: 'hlt-dry-air',      category: 'health',    icon: '🧴',  title: 'Dry air — moisturize',      body: 'Low humidity today',                     priority: 35,
    when: ({ humidity }) => humidity < 25 },
  { id: 'hlt-cold-flu',     category: 'health',    icon: '🤧',  title: 'Cold & flu weather',         body: 'Dress warmly — chilly + windy',          priority: 55,
    when: ({ tempC, wind }) => tempC < 8 && wind > 15 },
  { id: 'hlt-sunscreen',    category: 'health',    icon: '🧴',  title: 'Apply sunscreen',           body: 'Clear sun = high UV exposure',           priority: 70,
    when: ({ code, isDay }) => isClear(code) && isDay },

  /* ── Home ───────────────────────────────────────────────────────────── */
  { id: 'home-windows-open', category: 'home',     icon: '🪟',  title: 'Open windows — fresh air',  body: 'Mild outside — let it in',               priority: 30,
    when: ({ tempC, code, wind }) => tempC >= 18 && tempC <= 24 && !isRain(code) && wind < 25 },
  { id: 'home-plants-in',   category: 'home',      icon: '🪴',  title: 'Bring potted plants inside', body: 'Storm or strong wind coming',           priority: 75,
    when: ({ code, wind }) => isStorm(code) || wind > 50 },
  { id: 'home-pipes',       category: 'home',      icon: '🚿',  title: 'Cover outdoor pipes',       body: 'Frost expected tonight',                 priority: 78,
    when: ({ daily }) => daily?.temperature_2m_min?.[0] != null && daily.temperature_2m_min[0] < 0 },
  { id: 'home-charge',      category: 'home',      icon: '🔌',  title: 'Charge devices',            body: 'Storm risk — possible power outage',     priority: 80,
    when: ({ code }) => isStorm(code) },
  { id: 'home-close-windows', category: 'home',    icon: '🪟',  title: 'Close windows',              body: 'Dust or storm conditions',               priority: 70,
    when: ({ code, wind }) => isFog(code) || isStorm(code) || wind > 45 },

  /* ── Mood ───────────────────────────────────────────────────────────── */
  { id: 'mood-cozy-rain',   category: 'mood',      icon: '☕',  title: 'Cozy day for reading',      body: 'Rainy and cool outside',                 priority: 40,
    when: ({ tempC, code }) => isRain(code) && tempC < 22 },
  { id: 'mood-perfect',     category: 'mood',      icon: '✨',  title: 'Nature is showing off',     body: 'Clear sky + perfect temperature',        priority: 45,
    when: ({ tempC, code, isDay }) => isClear(code) && tempC >= 20 && tempC <= 25 && isDay },
  { id: 'mood-slow',        category: 'mood',      icon: '🧘',  title: 'Slow morning vibes',        body: 'Soft, cloudy & mild',                    priority: 30,
    when: ({ tempC, code }) => code === 3 && tempC >= 15 && tempC <= 22 },
  { id: 'mood-storm-watch', category: 'mood',      icon: '⛈',  title: 'Storm-watching weather',    body: 'Stay safe and enjoy the show',           priority: 50,
    when: ({ code }) => isStorm(code) },

  /* ── Pets ───────────────────────────────────────────────────────────── */
  { id: 'pet-walk-cool',    category: 'pets',      icon: '🐕',  title: 'Walk pets before 9 AM',     body: 'Pavement gets hot fast today',           priority: 78,
    when: ({ tempC }) => tempC > 28 },
  { id: 'pet-no-car',       category: 'pets',      icon: '🚫',  title: 'Don\'t leave pets in cars',  body: 'Cars heat up dangerously fast',          priority: 95,
    when: ({ tempC }) => tempC > 30 },
  { id: 'pet-paws',         category: 'pets',      icon: '🐾',  title: 'Short walks — protect paws', body: 'Cold ground hurts pet pads',             priority: 70,
    when: ({ tempC }) => tempC < 0 },

  /* ── Sleep ──────────────────────────────────────────────────────────── */
  { id: 'sleep-perfect',    category: 'sleep',     icon: '😴',  title: 'Perfect sleeping weather',  body: 'Cool, dry, comfortable',                 priority: 35,
    when: ({ daily, humidity }) => {
      const min = daily?.temperature_2m_min?.[0];
      return min != null && min >= 17 && min <= 20 && humidity < 70;
    } },
  { id: 'sleep-hot',        category: 'sleep',     icon: '🌡',   title: 'Hot night — run a fan',     body: 'Bedroom won\'t cool naturally',          priority: 65,
    when: ({ daily }) => daily?.temperature_2m_min?.[0] != null && daily.temperature_2m_min[0] > 25 },
  { id: 'sleep-cold',       category: 'sleep',     icon: '🛏',   title: 'Extra blanket tonight',     body: 'Freezing nighttime temperatures',        priority: 70,
    when: ({ daily }) => daily?.temperature_2m_min?.[0] != null && daily.temperature_2m_min[0] < 5 },
];

/* ─── Public API ──────────────────────────────────────────────────────── */

const buildContext = (weather) => {
  const c = weather?.current ?? {};
  const d = weather?.daily   ?? {};
  return {
    tempC:    c.temperature_2m ?? 20,
    feelsC:   c.apparent_temperature ?? c.temperature_2m ?? 20,
    code:     c.weather_code,
    humidity: c.relative_humidity_2m ?? 50,
    wind:     c.wind_speed_10m ?? 0,
    isDay:    c.is_day === 1,
    daily:    d,
  };
};

/**
 * getActiveTips(weather, enabledCategories?, max?) → Tip[]
 * Returns matching tips sorted by priority desc.
 * `enabledCategories` defaults to all. `max` defaults to 5.
 */
export const getActiveTips = (weather, enabledCategories = null, max = 5) => {
  if (!weather) return [];
  const ctx     = buildContext(weather);
  const allowed = enabledCategories ?? TIP_CATEGORIES.map((c) => c.id);

  return RULES
    .filter((r) => allowed.includes(r.category))
    .filter((r) => {
      try { return r.when(ctx); } catch { return false; }
    })
    .sort((a, b) => b.priority - a.priority)
    .slice(0, max);
};

/* ─── Format for notification body ────────────────────────────────────── */
export const formatTipsForNotification = (tips) => {
  if (!tips.length) return '';
  return tips
    .slice(0, 3)
    .map((t) => `${t.icon} ${t.title}`)
    .join('\n');
};
