import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
  StatusBar,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useSettings }  from '../context/SettingsContext';
import { clearAllCache } from '../utils/cache';
import { UI, TEXT, GLASS } from '../constants/colors';
import { SUPPORTED_LANGUAGES, getLanguageMeta } from '../constants/quotes';
import { requestNotificationPermission, cancelAllNotifications } from '../utils/notifications';
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

const SettingsScreen = ({ navigation }) => {
  const { settings, updateSettings } = useSettings();

  const isCelsius = settings.temperatureUnit === 'C';

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
              label="Rate the App"
              subtitle="Share your feedback"
              isLast
              onPress={() =>
                Alert.alert('Rate WeatherQ', 'Thank you! Rating will be available after publishing.')
              }
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
  version: {
    fontSize:  12,
    color:     TEXT.muted,
    textAlign: 'center',
    marginTop: 32,
  },
});

export default SettingsScreen;
