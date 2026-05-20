import React, { useEffect, useCallback, useRef } from 'react';
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
import { useSettings }  from '../context/SettingsContext';
import { getWeatherInfo } from '../utils/weatherHelpers';
import { formatFullDate } from '../utils/dateHelpers';
import { scheduleDailyNotifications, cancelAllNotifications } from '../utils/notifications';
import { TEXT, GLASS }   from '../constants/colors';

const HomeScreen = ({ navigation }) => {
  const { settings }                                       = useSettings();
  const { coords, loading: locLoading, denied, requestLocation } = useLocation();
  const { weather, cityInfo, loading: wxLoading, error, fetchWeather, restoreFromCache } = useWeather();
  const { quote, loading: qLoading, loadQuote, refreshQuote } = useQuote();

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

  useEffect(() => {
    if (coords) {
      fetchWeather(coords.latitude, coords.longitude);
    }
  }, [coords]);

  /* ── Fade in once data is ready ── */
  useEffect(() => {
    if (weather) {
      Animated.timing(contentOpacity, {
        toValue: 1, duration: 600, useNativeDriver: true,
      }).start();
    }
  }, [weather]);

  /* ── Re-schedule daily notifications when data or prefs change ── */
  useEffect(() => {
    if (!settings.notificationsEnabled) {
      cancelAllNotifications();
      return;
    }
    if (weather && quote) {
      scheduleDailyNotifications({
        weather,
        cityInfo,
        quote,
        unit: settings.temperatureUnit,
        hour: settings.notificationHour,
      });
    }
  }, [
    weather,
    quote,
    cityInfo,
    settings.notificationsEnabled,
    settings.notificationHour,
    settings.temperatureUnit,
  ]);

  /* ── Pull-to-refresh ── */
  const onRefresh = useCallback(async () => {
    if (coords) {
      await fetchWeather(coords.latitude, coords.longitude);
    } else {
      const loc = await requestLocation();
      if (loc) await fetchWeather(loc.latitude, loc.longitude);
    }
    await refreshQuote(lang);
  }, [coords, lang, refreshQuote]);

  /* ── City selected from Search screen ── */
  const handleCitySelect = useCallback(async (city) => {
    await fetchWeather(city.latitude, city.longitude, {
      city:         city.name,
      country:      city.country,
      country_name: city.country_name,
    });
  }, [fetchWeather]);

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

          <Text style={styles.topDate}>{formatFullDate()}</Text>

          <TouchableOpacity
            onPress={() => navigation.navigate('Settings')}
            style={styles.iconBtn}
            activeOpacity={0.7}
          >
            <Ionicons name="settings-outline" size={24} color="rgba(255,255,255,0.85)" />
          </TouchableOpacity>
        </View>

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
  topDate: {
    fontSize:   13,
    color:      TEXT.secondary,
    fontWeight: '500',
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
