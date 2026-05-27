import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
  StatusBar,
  Switch,
  Platform,
  Linking,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useSettings }  from '../context/SettingsContext';
import { clearAllCache, loadFromCache } from '../utils/cache';
import { UI, TEXT, GLASS } from '../constants/colors';
import { CACHE_KEYS } from '../constants/config';
import { SUPPORTED_LANGUAGES, getLanguageMeta } from '../constants/quotes';
import { requestNotificationPermission, cancelAllNotifications } from '../utils/notifications';
import { getActiveTips, TIP_CATEGORIES } from '../utils/smartRecommendations';
import { adsAvailable, getAdsDebugInfo, maybeShowShareInterstitial } from '../ads/AdService';

const SectionHeader = ({ title }) => (
  <Text style={styles.sectionHeader}>{title}</Text>
);

const SettingsRow = ({ icon, label, subtitle, right, onPress, isLast }) => (
  <TouchableOpacity
    style={[styles.row, isLast && styles.rowLast]}
    onPress={onPress}
    disabled={!onPress}
    activeOpacity={onPress ? 0.7 : 1}
  >
    <View style={styles.rowLeft}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={18} color="rgba(255,255,255,0.75)" />
      </View>
      <View>
        <Text style={styles.rowLabel}>{label}</Text>
        {subtitle ? <Text style={styles.rowSub}>{subtitle}</Text> : null}
      </View>
    </View>
    {right ?? (
      onPress ? <Ionicons name="chevron-forward" size={16} color={TEXT.muted} /> : null
    )}
  </TouchableOpacity>
);

const NOTIFICATION_HOURS = [6, 7, 8, 9, 12, 18, 20, 21];

const formatHourLabel = (h) => {
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:00 ${period}`;
};

const formatTimeLabel = (h, m) => {
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
};

// ISO weekday: 1=Sun, 2=Mon ... 7=Sat (matches expo-notifications WEEKLY trigger)
const WEEKDAYS = [
  { id: 2, label: 'Mon' },
  { id: 3, label: 'Tue' },
  { id: 4, label: 'Wed' },
  { id: 5, label: 'Thu' },
  { id: 6, label: 'Fri' },
  { id: 7, label: 'Sat' },
  { id: 1, label: 'Sun' },
];

/* ─── Store rating deep-link ──────────────────────────────────────────── */
// Android package name matches app.json android.package
// iOS App ID will be filled in once the app is approved on the App Store
const PLAY_STORE_PACKAGE = 'com.weatherq.app';
const APP_STORE_ID       = null; // e.g. '1234567890' once approved

const openStoreRating = async () => {
  try {
    if (Platform.OS === 'android') {
      // market://… first (opens Play Store app directly); fall back to web
      const marketUrl = `market://details?id=${PLAY_STORE_PACKAGE}`;
      const webUrl    = `https://play.google.com/store/apps/details?id=${PLAY_STORE_PACKAGE}`;
      const canOpen = await Linking.canOpenURL(marketUrl);
      await Linking.openURL(canOpen ? marketUrl : webUrl);
    } else if (Platform.OS === 'ios' && APP_STORE_ID) {
      // Opens App Store directly on the Reviews tab
      await Linking.openURL(`itms-apps://apps.apple.com/app/id${APP_STORE_ID}?action=write-review`);
    } else {
      Alert.alert(
        'Coming soon!',
        'WeatherQ for iOS is still under review. Try again in a few days.'
      );
    }
  } catch (e) {
    Alert.alert('Could not open store', e?.message ?? 'Please try again later.');
  }
};

const summariseDays = (days = []) => {
  if (!days.length) return 'No days selected';
  if (days.length === 7) return 'Every day';
  const weekdays = [2, 3, 4, 5, 6];
  const weekend  = [1, 7];
  const isWeekdays = weekdays.every(d => days.includes(d)) && !weekend.some(d => days.includes(d));
  const isWeekend  = weekend.every(d => days.includes(d)) && !weekdays.some(d => days.includes(d));
  if (isWeekdays) return 'Weekdays';
  if (isWeekend)  return 'Weekends';
  return WEEKDAYS.filter(w => days.includes(w.id)).map(w => w.label).join(' · ');
};

const SettingsScreen = ({ navigation }) => {
  const { settings, updateSettings } = useSettings();
  const [timePickerOpen, setTimePickerOpen] = useState(false);
  const [cachedWeather, setCachedWeather]   = useState(null);

  /* Load cached weather to power the live tip preview */
  useEffect(() => {
    loadFromCache(CACHE_KEYS.LAST_WEATHER).then((c) => {
      if (c?.weather) setCachedWeather({ weather: c.weather, city: c.city });
    });
  }, []);

  const isCelsius = settings.temperatureUnit === 'C';

  const handleToggleSmartTips = async (next) => {
    if (next) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        Alert.alert(
          'Permission needed',
          'Enable notifications in your device settings to receive smart weather tips.'
        );
        return;
      }
      await updateSettings({ smartTipsEnabled: true });
    } else {
      await updateSettings({ smartTipsEnabled: false });
    }
  };

  const toggleTipCategory = (catId) => {
    const current = settings.smartTipCategories ?? [];
    const next = current.includes(catId)
      ? current.filter((c) => c !== catId)
      : [...current, catId];
    updateSettings({ smartTipCategories: next });
  };

  const activeTips = cachedWeather?.weather
    ? getActiveTips(cachedWeather.weather, settings.smartTipCategories, 5)
    : [];

  const handleToggleAlarm = async (next) => {
    if (next) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        Alert.alert(
          'Permission needed',
          'Enable notifications in your device settings to receive wake-up alarms.'
        );
        return;
      }
      await updateSettings({ alarmEnabled: true });
    } else {
      await updateSettings({ alarmEnabled: false });
    }
  };

  const toggleDay = (dayId) => {
    const current = settings.alarmDays ?? [];
    const next = current.includes(dayId)
      ? current.filter((d) => d !== dayId)
      : [...current, dayId].sort();
    updateSettings({ alarmDays: next });
  };

  const onTimeChange = (event, selectedDate) => {
    if (Platform.OS === 'android') setTimePickerOpen(false);
    if (event?.type === 'dismissed' || !selectedDate) return;
    updateSettings({
      alarmHour:   selectedDate.getHours(),
      alarmMinute: selectedDate.getMinutes(),
    });
  };

  const handleToggleNotifications = async (next) => {
    if (next) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        Alert.alert(
          'Permission needed',
          'Enable notifications in your device settings to receive daily weather + quote reminders.'
        );
        return;
      }
      await updateSettings({ notificationsEnabled: true });
    } else {
      await updateSettings({ notificationsEnabled: false });
      await cancelAllNotifications();
    }
  };

  const toggleUnit = () =>
    updateSettings({ temperatureUnit: isCelsius ? 'F' : 'C' });

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'This will remove saved weather data and today\'s quote. A fresh fetch will happen next time you open the app.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await clearAllCache();
            Alert.alert('Done', 'Cache cleared successfully.');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={UI.settingsBg} />
      <SafeAreaView style={styles.flex}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={22} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={{ width: 38 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {/* Units */}
          <SectionHeader title="Display" />
          <View style={styles.card}>
            <SettingsRow
              icon="thermometer-outline"
              label="Temperature Unit"
              subtitle={isCelsius ? 'Celsius (°C)' : 'Fahrenheit (°F)'}
              isLast
              right={
                <View style={styles.unitToggle}>
                  <TouchableOpacity
                    style={[styles.unitBtn, isCelsius && styles.unitBtnActive]}
                    onPress={() => updateSettings({ temperatureUnit: 'C' })}
                  >
                    <Text style={[styles.unitBtnText, isCelsius && styles.unitBtnTextActive]}>°C</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.unitBtn, !isCelsius && styles.unitBtnActive]}
                    onPress={() => updateSettings({ temperatureUnit: 'F' })}
                  >
                    <Text style={[styles.unitBtnText, !isCelsius && styles.unitBtnTextActive]}>°F</Text>
                  </TouchableOpacity>
                </View>
              }
            />
          </View>

          {/* Quote Language */}
          <SectionHeader title="Quotes" />
          <View style={styles.card}>
            <View style={styles.langRow}>
              <View style={styles.rowLeft}>
                <View style={styles.iconWrap}>
                  <Ionicons name="language-outline" size={18} color="rgba(255,255,255,0.75)" />
                </View>
                <View>
                  <Text style={styles.rowLabel}>Quote Language</Text>
                  <Text style={styles.rowSub}>
                    Currently: {getLanguageMeta(settings.quoteLanguage).native}
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.langGrid}>
              {SUPPORTED_LANGUAGES.map((l) => {
                const active = settings.quoteLanguage === l.code;
                return (
                  <TouchableOpacity
                    key={l.code}
                    style={[styles.langChip, active && styles.langChipActive]}
                    onPress={() => updateSettings({ quoteLanguage: l.code })}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.langChipText, active && styles.langChipTextActive]}>
                      {l.native}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Notifications */}
          <SectionHeader title="Notifications" />
          <View style={styles.card}>
            <SettingsRow
              icon="notifications-outline"
              label="Daily Weather + Quote"
              subtitle={
                settings.notificationsEnabled
                  ? `Every day at ${formatHourLabel(settings.notificationHour)}`
                  : 'Get a daily reminder with weather and quote'
              }
              isLast={!settings.notificationsEnabled}
              right={
                <Switch
                  value={settings.notificationsEnabled}
                  onValueChange={handleToggleNotifications}
                  trackColor={{ false: 'rgba(255,255,255,0.15)', true: 'rgba(99,179,237,0.6)' }}
                  thumbColor={settings.notificationsEnabled ? '#FFF' : '#CFD8DC'}
                  ios_backgroundColor="rgba(255,255,255,0.15)"
                />
              }
            />

            {settings.notificationsEnabled && (
              <View style={styles.hourPickerWrap}>
                <Text style={styles.hourPickerLabel}>Notification time</Text>
                <View style={styles.hourGrid}>
                  {NOTIFICATION_HOURS.map((h) => {
                    const active = settings.notificationHour === h;
                    return (
                      <TouchableOpacity
                        key={h}
                        style={[styles.hourChip, active && styles.hourChipActive]}
                        onPress={() => updateSettings({ notificationHour: h })}
                        activeOpacity={0.75}
                      >
                        <Text style={[styles.hourChipText, active && styles.hourChipTextActive]}>
                          {formatHourLabel(h)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}
          </View>

          {/* ── Wake-up Alarm ── */}
          <SectionHeader title="Wake-up Alarm" />
          <View style={styles.card}>
            <SettingsRow
              icon="alarm-outline"
              label="Smart Wake-up Alarm"
              subtitle={
                settings.alarmEnabled
                  ? `${formatTimeLabel(settings.alarmHour, settings.alarmMinute)} · ${summariseDays(settings.alarmDays)}`
                  : 'Wake up with today\'s weather and quote'
              }
              isLast={!settings.alarmEnabled}
              right={
                <Switch
                  value={settings.alarmEnabled}
                  onValueChange={handleToggleAlarm}
                  trackColor={{ false: 'rgba(255,255,255,0.15)', true: 'rgba(246,200,75,0.6)' }}
                  thumbColor={settings.alarmEnabled ? '#FFF' : '#CFD8DC'}
                  ios_backgroundColor="rgba(255,255,255,0.15)"
                />
              }
            />

            {settings.alarmEnabled && (
              <View style={styles.alarmConfig}>
                {/* Time picker trigger */}
                <TouchableOpacity
                  style={styles.timeBig}
                  onPress={() => setTimePickerOpen(true)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.timeBigText}>
                    {formatTimeLabel(settings.alarmHour, settings.alarmMinute)}
                  </Text>
                  <Text style={styles.timeBigHint}>Tap to change</Text>
                </TouchableOpacity>

                {/* Day chips */}
                <Text style={styles.hourPickerLabel}>Repeat on</Text>
                <View style={styles.dayGrid}>
                  {WEEKDAYS.map((day) => {
                    const active = (settings.alarmDays ?? []).includes(day.id);
                    return (
                      <TouchableOpacity
                        key={day.id}
                        style={[styles.dayChip, active && styles.dayChipActive]}
                        onPress={() => toggleDay(day.id)}
                        activeOpacity={0.75}
                      >
                        <Text style={[styles.dayChipText, active && styles.dayChipTextActive]}>
                          {day.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={styles.alarmHint}>
                  ⏰ Your alarm will play with today's weather and a fresh motivational quote.
                </Text>
              </View>
            )}
          </View>

          {timePickerOpen && (
            <DateTimePicker
              value={new Date(2000, 0, 1, settings.alarmHour, settings.alarmMinute)}
              mode="time"
              is24Hour={false}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onTimeChange}
            />
          )}

          {/* ── Smart Tips ── */}
          <SectionHeader title="Smart Tips" />
          <View style={styles.card}>
            <SettingsRow
              icon="bulb-outline"
              label="Daily Smart Tips"
              subtitle={
                settings.smartTipsEnabled
                  ? settings.smartTipsMode === 'smart'
                    ? `Smart delivery · ${activeTips.length} active`
                    : `Every day at ${formatHourLabel(settings.smartTipsHour)} · ${activeTips.length} active`
                  : 'Personalized tips based on today\'s weather'
              }
              isLast={!settings.smartTipsEnabled}
              right={
                <Switch
                  value={settings.smartTipsEnabled}
                  onValueChange={handleToggleSmartTips}
                  trackColor={{ false: 'rgba(255,255,255,0.15)', true: 'rgba(99,179,237,0.6)' }}
                  thumbColor={settings.smartTipsEnabled ? '#FFF' : '#CFD8DC'}
                  ios_backgroundColor="rgba(255,255,255,0.15)"
                />
              }
            />

            {settings.smartTipsEnabled && (
              <View style={styles.alarmConfig}>
                {/* Mode selector — Smart vs Fixed */}
                <Text style={styles.hourPickerLabel}>Delivery</Text>
                <View style={styles.modeRow}>
                  <TouchableOpacity
                    style={[styles.modeBtn, settings.smartTipsMode === 'smart' && styles.modeBtnActive]}
                    onPress={() => updateSettings({ smartTipsMode: 'smart' })}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name="sparkles"
                      size={14}
                      color={settings.smartTipsMode === 'smart' ? '#FFF' : TEXT.muted}
                      style={{ marginRight: 4 }}
                    />
                    <Text style={[styles.modeBtnText, settings.smartTipsMode === 'smart' && styles.modeBtnTextActive]}>
                      Smart
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modeBtn, settings.smartTipsMode === 'fixed' && styles.modeBtnActive]}
                    onPress={() => updateSettings({ smartTipsMode: 'fixed' })}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name="time-outline"
                      size={14}
                      color={settings.smartTipsMode === 'fixed' ? '#FFF' : TEXT.muted}
                      style={{ marginRight: 4 }}
                    />
                    <Text style={[styles.modeBtnText, settings.smartTipsMode === 'fixed' && styles.modeBtnTextActive]}>
                      Fixed time
                    </Text>
                  </TouchableOpacity>
                </View>

                {settings.smartTipsMode === 'smart' ? (
                  <View style={styles.smartHint}>
                    <Text style={styles.smartHintText}>
                      ✨ Morning briefing at 7 AM, plus urgent alerts (storms, heatwave,
                      black ice…) at midday, afternoon, and evening when they matter.
                    </Text>
                  </View>
                ) : (
                  <>
                    <Text style={[styles.hourPickerLabel, { marginTop: 12 }]}>Delivery time</Text>
                    <View style={styles.hourGrid}>
                      {NOTIFICATION_HOURS.map((h) => {
                        const active = settings.smartTipsHour === h;
                        return (
                          <TouchableOpacity
                            key={h}
                            style={[styles.hourChip, active && styles.hourChipActive]}
                            onPress={() => updateSettings({ smartTipsHour: h })}
                            activeOpacity={0.75}
                          >
                            <Text style={[styles.hourChipText, active && styles.hourChipTextActive]}>
                              {formatHourLabel(h)}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </>
                )}

                {/* Categories */}
                <Text style={[styles.hourPickerLabel, { marginTop: 14 }]}>Categories</Text>
                <View style={styles.tipCatGrid}>
                  {TIP_CATEGORIES.map((cat) => {
                    const active = (settings.smartTipCategories ?? []).includes(cat.id);
                    return (
                      <TouchableOpacity
                        key={cat.id}
                        style={[styles.tipCatChip, active && styles.tipCatChipActive]}
                        onPress={() => toggleTipCategory(cat.id)}
                        activeOpacity={0.75}
                      >
                        <Text style={styles.tipCatEmoji}>{cat.emoji}</Text>
                        <Text style={[styles.tipCatText, active && styles.tipCatTextActive]}>
                          {cat.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Live preview */}
                <Text style={[styles.hourPickerLabel, { marginTop: 14 }]}>
                  Preview {cachedWeather?.city?.city ? `· ${cachedWeather.city.city}` : ''}
                </Text>
                {activeTips.length === 0 ? (
                  <View style={styles.tipPreviewEmpty}>
                    <Text style={styles.tipPreviewEmptyText}>
                      {!cachedWeather
                        ? 'Open the home screen first so we can load your weather…'
                        : 'No tips active for the selected categories right now.'}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.tipPreviewList}>
                    {activeTips.map((tip) => (
                      <View key={tip.id} style={styles.tipPreviewRow}>
                        <Text style={styles.tipPreviewIcon}>{tip.icon}</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.tipPreviewTitle}>{tip.title}</Text>
                          <Text style={styles.tipPreviewBody}>{tip.body}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>

          {/* ── Don't Bother Me (anti-spam coordination) ── */}
          <SectionHeader title="Don't Bother Me" />
          <View style={styles.card}>
            <SettingsRow
              icon="layers-outline"
              label="Smart Consolidation"
              subtitle="Auto-merge overlapping notifications"
              right={
                <Switch
                  value={settings.smartConsolidation}
                  onValueChange={(v) => updateSettings({ smartConsolidation: v })}
                  trackColor={{ false: 'rgba(255,255,255,0.15)', true: 'rgba(99,179,237,0.6)' }}
                  thumbColor={settings.smartConsolidation ? '#FFF' : '#CFD8DC'}
                  ios_backgroundColor="rgba(255,255,255,0.15)"
                />
              }
            />
            <SettingsRow
              icon="moon-outline"
              label="Quiet Hours"
              subtitle={
                settings.quietHoursEnabled
                  ? `${formatHourLabel(settings.quietHoursStart)} → ${formatHourLabel(settings.quietHoursEnd)}`
                  : 'Always allowed'
              }
              isLast
              right={
                <Switch
                  value={settings.quietHoursEnabled}
                  onValueChange={(v) => updateSettings({ quietHoursEnabled: v })}
                  trackColor={{ false: 'rgba(255,255,255,0.15)', true: 'rgba(99,179,237,0.6)' }}
                  thumbColor={settings.quietHoursEnabled ? '#FFF' : '#CFD8DC'}
                  ios_backgroundColor="rgba(255,255,255,0.15)"
                />
              }
            />
            <View style={styles.consolidationHint}>
              <Text style={styles.consolidationHintText}>
                {settings.quietHoursEnabled
                  ? '🛡  Your wake-up alarm and critical safety alerts (severe storms, heatstroke, black ice) always come through.\n\n'
                  : ''}
                {settings.smartConsolidation
                  ? '✓ Daily reminder is auto-skipped when Smart Tips is on.\n✓ Smart Tips briefing is skipped when your wake-up alarm fires nearby.'
                  : '⚠️ Consolidation off — you may receive overlapping notifications.'}
              </Text>
            </View>
          </View>

          {/* ── Dev / Ad Testing (only visible in __DEV__) ── */}
          {__DEV__ && (
            <>
              <SectionHeader title="🛠 Ad Testing (Dev Only)" />
              <View style={styles.card}>
                <SettingsRow
                  icon="play-circle-outline"
                  label="Force Interstitial Ad"
                  subtitle="Bypasses rate limit — shows test ad immediately"
                  onPress={async () => {
                    if (!adsAvailable()) {
                      Alert.alert(
                        'Ads not available',
                        'Running in Expo Go or AdMob native module not loaded.\n\nBuild a development client to test ads:\nnpx eas build --profile development --platform android'
                      );
                      return;
                    }
                    const shown = await maybeShowShareInterstitial(true);
                    if (!shown) Alert.alert('Ad not ready', 'Interstitial not loaded yet — wait a few seconds and try again.');
                  }}
                />
                <SettingsRow
                  icon="information-circle-outline"
                  label="Ad Status"
                  subtitle="Check SDK state and share counter"
                  isLast
                  onPress={async () => {
                    const info = await getAdsDebugInfo();
                    Alert.alert(
                      'Ad Debug Info',
                      `Available: ${info.available}\n` +
                      `Initialized: ${info.initialized}\n` +
                      `Interstitial ready: ${info.interstitialReady}\n` +
                      `Using test IDs: ${info.useTestAds}\n` +
                      `Share count: ${info.shareCount}\n` +
                      `Next ad on share #: ${info.nextOnShare}\n` +
                      `Last shown: ${info.lastShownAt ? new Date(info.lastShownAt).toLocaleTimeString() : 'never'}`
                    );
                  }}
                />
              </View>
            </>
          )}

          {/* Data */}
          <SectionHeader title="Data" />
          <View style={styles.card}>
            <SettingsRow
              icon="trash-outline"
              label="Clear Cache"
              subtitle="Remove saved weather & quote data"
              onPress={handleClearCache}
              isLast
            />
          </View>

          {/* About */}
          <SectionHeader title="Info" />
          <View style={styles.card}>
            <SettingsRow
              icon="information-circle-outline"
              label="About WeatherQ"
              onPress={() => navigation.navigate('About')}
            />
            <SettingsRow
              icon="star-outline"
              label="Rate WeatherQ"
              subtitle="Loved it? A 5-star review helps a lot 💛"
              isLast
              onPress={openStoreRating}
            />
          </View>

          {/* Monetization placeholder — easy to extend */}
          <SectionHeader title="Premium" />
          <View style={styles.card}>
            <SettingsRow
              icon="diamond-outline"
              label="WeatherQ Pro"
              subtitle="More themes, no ads — coming soon"
              isLast
              onPress={() =>
                Alert.alert('Coming Soon', 'Premium features are coming in a future update!')
              }
            />
          </View>

          <Text style={styles.version}>WeatherQ v1.0.0</Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: UI.settingsBg },
  flex:    { flex: 1 },
  header: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: 16,
    paddingVertical:   12,
  },
  backBtn: {
    padding:         8,
    backgroundColor: GLASS.background,
    borderRadius:    12,
    borderWidth:     1,
    borderColor:     GLASS.border,
  },
  headerTitle: {
    fontSize:   18,
    fontWeight: '700',
    color:      '#FFF',
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom:     48,
  },
  sectionHeader: {
    fontSize:      12,
    fontWeight:    '600',
    color:         TEXT.muted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop:     24,
    marginBottom:  8,
    paddingHorizontal: 4,
  },
  card: {
    backgroundColor: UI.settingsCard,
    borderRadius:    16,
    overflow:        'hidden',
  },
  row: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingVertical:   14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.07)',
  },
  rowLast:  { borderBottomWidth: 0 },
  rowLeft: {
    flexDirection: 'row',
    alignItems:    'center',
    flex:          1,
  },
  iconWrap: {
    width:           34,
    height:          34,
    borderRadius:    10,
    backgroundColor: GLASS.background,
    alignItems:      'center',
    justifyContent:  'center',
    marginRight:     12,
  },
  rowLabel: { fontSize: 15, fontWeight: '500', color: TEXT.primary },
  rowSub:   { fontSize: 12, color: TEXT.muted, marginTop: 2 },
  unitToggle: {
    flexDirection: 'row',
    gap:           4,
  },
  unitBtn: {
    paddingVertical:   6,
    paddingHorizontal: 12,
    borderRadius:      8,
    backgroundColor:   GLASS.background,
    borderWidth:       1,
    borderColor:       GLASS.border,
  },
  unitBtnActive: {
    backgroundColor: 'rgba(99,179,237,0.3)',
    borderColor:     'rgba(99,179,237,0.6)',
  },
  unitBtnText:       { fontSize: 13, fontWeight: '600', color: TEXT.muted },
  unitBtnTextActive: { color: '#FFF' },
  langRow: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingVertical:   14,
    paddingHorizontal: 16,
  },
  langGrid: {
    flexDirection:    'row',
    flexWrap:         'wrap',
    gap:              8,
    paddingHorizontal: 16,
    paddingBottom:    16,
  },
  langChip: {
    paddingVertical:   8,
    paddingHorizontal: 14,
    borderRadius:      20,
    backgroundColor:   GLASS.background,
    borderWidth:       1,
    borderColor:       GLASS.border,
  },
  langChipActive: {
    backgroundColor: 'rgba(99,179,237,0.3)',
    borderColor:     'rgba(99,179,237,0.6)',
  },
  langChipText:       { fontSize: 14, fontWeight: '500', color: TEXT.muted },
  langChipTextActive: { color: '#FFF', fontWeight: '700' },
  hourPickerWrap: {
    paddingHorizontal: 16,
    paddingBottom:     16,
    borderTopWidth:    1,
    borderTopColor:    'rgba(255,255,255,0.07)',
    paddingTop:        12,
  },
  hourPickerLabel: {
    fontSize:      11,
    fontWeight:    '600',
    color:         TEXT.muted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom:  10,
  },
  hourGrid: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           8,
  },
  hourChip: {
    paddingVertical:   7,
    paddingHorizontal: 12,
    borderRadius:      18,
    backgroundColor:   GLASS.background,
    borderWidth:       1,
    borderColor:       GLASS.border,
  },
  hourChipActive: {
    backgroundColor: 'rgba(99,179,237,0.3)',
    borderColor:     'rgba(99,179,237,0.6)',
  },
  hourChipText:       { fontSize: 13, fontWeight: '500', color: TEXT.muted },
  hourChipTextActive: { color: '#FFF', fontWeight: '700' },

  /* Wake-up Alarm */
  alarmConfig: {
    paddingHorizontal: 16,
    paddingBottom:     16,
    borderTopWidth:    1,
    borderTopColor:    'rgba(255,255,255,0.07)',
    paddingTop:        14,
  },
  timeBig: {
    alignItems:        'center',
    paddingVertical:   12,
    marginBottom:      8,
  },
  timeBigText: {
    fontSize:   52,
    fontWeight: '800',
    color:      '#F6C84B',
    letterSpacing: 1.5,
  },
  timeBigHint: {
    fontSize: 11,
    color:    TEXT.muted,
    marginTop: 2,
    letterSpacing: 0.5,
  },
  dayGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 14,
  },
  dayChip: {
    width:           40,
    height:          40,
    borderRadius:    20,
    backgroundColor: GLASS.background,
    borderWidth:     1,
    borderColor:     GLASS.border,
    alignItems:      'center',
    justifyContent:  'center',
  },
  dayChipActive: {
    backgroundColor: 'rgba(246,200,75,0.3)',
    borderColor:     'rgba(246,200,75,0.6)',
  },
  dayChipText:       { fontSize: 12, fontWeight: '600', color: TEXT.muted },
  dayChipTextActive: { color: '#FFF', fontWeight: '800' },
  alarmHint: {
    fontSize:  11,
    color:     TEXT.muted,
    textAlign: 'center',
    lineHeight: 16,
  },

  /* Smart Tips mode selector */
  modeRow: {
    flexDirection: 'row', gap: 8, marginTop: 8,
  },
  modeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, borderRadius: 12,
    backgroundColor: GLASS.background,
    borderWidth: 1, borderColor: GLASS.border,
  },
  modeBtnActive: {
    backgroundColor: 'rgba(99,179,237,0.30)',
    borderColor:     'rgba(99,179,237,0.65)',
  },
  modeBtnText:       { fontSize: 13, fontWeight: '600', color: TEXT.muted },
  modeBtnTextActive: { color: '#FFF', fontWeight: '700' },

  smartHint: {
    backgroundColor: 'rgba(99,179,237,0.10)',
    borderRadius:    10, padding: 12, marginTop: 10,
    borderWidth: 1, borderColor: 'rgba(99,179,237,0.20)',
  },
  smartHintText: {
    fontSize: 12, color: 'rgba(255,255,255,0.78)', lineHeight: 18,
  },

  /* Smart Tips */
  tipCatGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8,
  },
  tipCatChip: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: GLASS.background,
    borderWidth: 1, borderColor: GLASS.border,
  },
  tipCatChipActive: {
    backgroundColor: 'rgba(99,179,237,0.30)',
    borderColor:     'rgba(99,179,237,0.65)',
  },
  tipCatEmoji:      { fontSize: 14, marginRight: 5 },
  tipCatText:       { fontSize: 12, fontWeight: '500', color: TEXT.muted },
  tipCatTextActive: { color: '#FFF', fontWeight: '700' },

  tipPreviewEmpty: {
    paddingVertical: 14, paddingHorizontal: 12, marginTop: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  tipPreviewEmptyText: {
    fontSize: 12, color: TEXT.muted, textAlign: 'center', lineHeight: 18,
  },

  tipPreviewList: { gap: 6, marginTop: 6 },
  tipPreviewRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    padding: 12, borderRadius: 12,
    backgroundColor: 'rgba(99,179,237,0.10)',
    borderWidth: 1, borderColor: 'rgba(99,179,237,0.25)',
  },
  tipPreviewIcon:  { fontSize: 22, marginRight: 10, marginTop: -2 },
  tipPreviewTitle: { fontSize: 14, fontWeight: '700', color: TEXT.primary },
  tipPreviewBody:  { fontSize: 12, color: TEXT.muted, marginTop: 2, lineHeight: 16 },

  /* Don't Bother Me hint */
  consolidationHint: {
    paddingHorizontal: 16,
    paddingBottom:     14,
    paddingTop:        4,
  },
  consolidationHintText: {
    fontSize:   11,
    color:      TEXT.muted,
    lineHeight: 16,
  },
  version: {
    fontSize:  12,
    color:     TEXT.muted,
    textAlign: 'center',
    marginTop: 32,
  },
});

export default SettingsScreen;
