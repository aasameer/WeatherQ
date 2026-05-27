import React, { useEffect, useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Animated,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import WeatherBackground from '../components/WeatherBackground';
import WeatherCard       from '../components/WeatherCard';
import QuoteDisplay      from '../components/QuoteDisplay';
import LoadingScreen     from '../components/LoadingScreen';
import ErrorView         from '../components/ErrorView';

import { useLocation }  from '../hooks/useLocation';
import { useWeather }   from '../hooks/useWeather';
import { useQuote }     from '../hooks/useQuote';
import { useSavedCities, CURRENT_LOCATION_ID } from '../hooks/useSavedCities';
import CitySwitcher     from '../components/CitySwitcher';
import { useSettings }  from '../context/SettingsContext';
import { getWeatherInfo } from '../utils/weatherHelpers';
import { rescheduleAllNotifications, cancelAllNotifications } from '../utils/notifications';
import { TEXT, GLASS }   from '../constants/colors';

const HomeScreen = ({ navigation }) => {
  const { settings } = useSettings();
  const {
    cities, activeId, activeCity, loaded: citiesLoaded,
    addCity, removeCity, switchTo,
  } = useSavedCities();

  const isCurrentLocation = activeCity?.id === CURRENT_LOCATION_ID;

  const { coords, loading: locLoading, denied, requestLocation } = useLocation(isCurrentLocation);
  const { weather, cityInfo, loading: wxLoading, error, fetchWeather, restoreFromCache } = useWeather();
  const { quote, loading: qLoading, loadQuote, refreshQuote } = useQuote();

  const [switcherOpen, setSwitcherOpen] = useState(false);

  const contentOpacity = useRef(new Animated.Value(0)).current;
  const isLoading      = locLoading || wxLoading;
  const lang           = settings.quoteLanguage;

  /* ── Initial load + cache restore ── */
  useEffect(() => {
    restoreFromCache();
  }, []);

  /* ── Re-fetch quote whenever language changes (and on first mount) ── */
  useEffect(() => {
    loadQuote(lang);
  }, [lang]);

  /* ── Fetch weather based on active city ── */
  useEffect(() => {
    if (!citiesLoaded) return;

    if (isCurrentLocation) {
      // Coords arrive via useLocation; the next useEffect handles fetching.
      if (coords) fetchWeather(coords.latitude, coords.longitude);
    } else if (activeCity) {
      fetchWeather(activeCity.latitude, activeCity.longitude, {
        city:         activeCity.city,
        country:      activeCity.country,
        country_name: activeCity.country_name,
      });
    }
  }, [citiesLoaded, activeId]);

  /* ── Watch coords (only active when "current location" is selected) ── */
  useEffect(() => {
    if (isCurrentLocation && coords) {
      fetchWeather(coords.latitude, coords.longitude);
    }
  }, [coords, isCurrentLocation]);

  /* ── Fade in once data is ready ── */
  useEffect(() => {
    if (weather) {
      Animated.timing(contentOpacity, {
        toValue: 1, duration: 600, useNativeDriver: true,
      }).start();
    }
  }, [weather]);

  /* ── Re-schedule notifications (daily + alarms) when anything changes ── */
  useEffect(() => {
    if (!settings.notificationsEnabled && !settings.alarmEnabled) {
      cancelAllNotifications();
      return;
    }
    if (weather && quote) {
      rescheduleAllNotifications({
        weather,
        cityInfo,
        quote,
        unit:         settings.temperatureUnit,
        dailyEnabled: settings.notificationsEnabled,
        dailyHour:    settings.notificationHour,
        alarmEnabled: settings.alarmEnabled,
        alarmHour:    settings.alarmHour,
        alarmMinute:  settings.alarmMinute,
        alarmDays:    settings.alarmDays,
      });
    }
  }, [
    weather,
    quote,
    cityInfo,
    settings.notificationsEnabled,
    settings.notificationHour,
    settings.alarmEnabled,
    settings.alarmHour,
    settings.alarmMinute,
    settings.alarmDays,
    settings.temperatureUnit,
  ]);

  /* ── Pull-to-refresh ── */
  const onRefresh = useCallback(async () => {
    if (isCurrentLocation) {
      if (coords) {
        await fetchWeather(coords.latitude, coords.longitude);
      } else {
        const loc = await requestLocation();
        if (loc) await fetchWeather(loc.latitude, loc.longitude);
      }
    } else if (activeCity) {
      await fetchWeather(activeCity.latitude, activeCity.longitude, {
        city:         activeCity.city,
        country:      activeCity.country,
        country_name: activeCity.country_name,
      });
    }
    await refreshQuote(lang);
  }, [coords, isCurrentLocation, activeCity, lang, refreshQuote, fetchWeather, requestLocation]);

  /* ── City picked from Search screen → save it AND switch to it ── */
  const handleCitySelect = useCallback(async (city) => {
    await addCity(city);  // useEffect on activeId will fetch its weather
  }, [addCity]);

  /* ── Open Search to add a new city ── */
  const openAddCity = useCallback(() => {
    setSwitcherOpen(false);
    navigation.navigate('Search', { onSelect: handleCitySelect });
  }, [navigation, handleCitySelect]);

  /* ── Location denied → ask user to search ── */
  if (denied && !weather) {
    return (
      <WeatherBackground weatherType="night">
        <SafeAreaView style={styles.flex}>
          <ErrorView
            message="Location access is needed to show your local weather."
            hint="Tap below to search for a city manually, or enable location in Settings → Privacy."
            onRetry={() => navigation.navigate('Search', { onSelect: handleCitySelect })}
          />
          <TouchableOpacity
            style={styles.searchFallback}
            onPress={() => navigation.navigate('Search', { onSelect: handleCitySelect })}
          >
            <Text style={styles.searchFallbackText}>Search a City</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </WeatherBackground>
    );
  }

  /* ── Loading (no cached data yet) ── */
  if (isLoading && !weather) {
    return <LoadingScreen message="Getting your weather…" />;
  }

  /* ── Error with no cached fallback ── */
  if (error && !weather) {
    return (
      <WeatherBackground weatherType="cloudy">
        <SafeAreaView style={styles.flex}>
          <ErrorView message={error} onRetry={onRefresh} />
        </SafeAreaView>
      </WeatherBackground>
    );
  }

  const weatherInfo = weather
    ? getWeatherInfo(weather.current.weather_code, weather.current.is_day === 1)
    : { type: 'night' };

  return (
    <WeatherBackground weatherType={weatherInfo.type}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <SafeAreaView style={styles.flex}>
        {/* ── Top bar ── */}
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Search', { onSelect: handleCitySelect })}
            style={styles.iconBtn}
            activeOpacity={0.7}
          >
            <Ionicons name="search-outline" size={24} color="rgba(255,255,255,0.85)" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setSwitcherOpen(true)}
            style={styles.cityChip}
            activeOpacity={0.75}
            hitSlop={{ top: 6, bottom: 6, left: 12, right: 12 }}
          >
            <Ionicons
              name={isCurrentLocation ? 'navigate' : 'location'}
              size={14} color="rgba(255,255,255,0.85)" style={{ marginRight: 5 }}
            />
            <Text style={styles.cityChipText} numberOfLines={1}>
              {cityInfo?.city || activeCity?.label || '—'}
            </Text>
            <Ionicons name="chevron-down" size={14} color="rgba(255,255,255,0.65)" style={{ marginLeft: 4 }} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('Settings')}
            style={styles.iconBtn}
            activeOpacity={0.7}
          >
            <Ionicons name="settings-outline" size={24} color="rgba(255,255,255,0.85)" />
          </TouchableOpacity>
        </View>

        <CitySwitcher
          visible={switcherOpen}
          cities={cities}
          activeId={activeId}
          onSelect={switchTo}
          onAdd={openAddCity}
          onRemove={removeCity}
          onClose={() => setSwitcherOpen(false)}
        />

        {/* ── Main scroll ── */}
        <Animated.ScrollView
          style={{ opacity: contentOpacity }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={onRefresh}
              tintColor="#FFFFFF"
              colors={['#FFFFFF']}
            />
          }
        >
          <WeatherCard
            weather={weather}
            cityInfo={cityInfo}
            unit={settings.temperatureUnit}
          />

          <QuoteDisplay
            quote={quote}
            loading={qLoading}
            language={lang}
            onRefresh={() => refreshQuote(lang)}
          />

          {/* Bottom spacer for share button */}
          <View style={{ height: 100 }} />
        </Animated.ScrollView>

        {/* ── Share floating button ── */}
        <View style={styles.fabContainer}>
          <TouchableOpacity
            style={styles.fab}
            activeOpacity={0.85}
            onPress={() =>
              navigation.navigate('Share', {
                weather,
                cityInfo,
                quote,
                unit: settings.temperatureUnit,
              })
            }
          >
            <Ionicons name="share-social-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
            <Text style={styles.fabText}>Share Today's Card</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </WeatherBackground>
  );
};

const styles = StyleSheet.create({
  flex:       { flex: 1 },
  topBar: {
    flexDirection:     'row',
    justifyContent:    'space-between',
    alignItems:        'center',
    paddingHorizontal: 16,
    paddingVertical:   10,
  },
  iconBtn: {
    padding:         8,
    backgroundColor: GLASS.background,
    borderRadius:    12,
    borderWidth:     1,
    borderColor:     GLASS.border,
  },
  cityChip: {
    flexDirection:     'row',
    alignItems:        'center',
    backgroundColor:   GLASS.background,
    borderWidth:       1,
    borderColor:       GLASS.border,
    borderRadius:      20,
    paddingHorizontal: 14,
    paddingVertical:   7,
    maxWidth:          '60%',
  },
  cityChipText: {
    fontSize:   14,
    fontWeight: '700',
    color:      TEXT.primary,
    letterSpacing: 0.3,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop:        8,
  },
  fabContainer: {
    position:          'absolute',
    bottom:            32,
    left:              24,
    right:             24,
    alignItems:        'center',
  },
  fab: {
    flexDirection:     'row',
    alignItems:        'center',
    backgroundColor:   'rgba(255,255,255,0.22)',
    borderRadius:      32,
    borderWidth:       1,
    borderColor:       'rgba(255,255,255,0.35)',
    paddingVertical:   16,
    paddingHorizontal: 32,
    shadowColor:       '#000',
    shadowOffset:      { width: 0, height: 4 },
    shadowOpacity:     0.3,
    shadowRadius:      8,
    elevation:         6,
  },
  fabText: {
    fontSize:      16,
    fontWeight:    '700',
    color:         '#FFFFFF',
    letterSpacing: 0.3,
  },
  searchFallback: {
    marginHorizontal: 48,
    marginTop:        8,
    padding:          16,
    backgroundColor:  GLASS.strong,
    borderRadius:     24,
    borderWidth:      1,
    borderColor:      GLASS.border,
    alignItems:       'center',
  },
  searchFallbackText: {
    fontSize:   16,
    fontWeight: '600',
    color:      '#FFF',
  },
});

export default HomeScreen;
