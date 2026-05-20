import { useState, useCallback } from 'react';
import { fetchWeatherByCoords, reverseGeocode } from '../api/weatherService';
import { saveToCache, loadFromCache } from '../utils/cache';
import { CACHE_KEYS } from '../constants/config';

export const useWeather = () => {
  const [weather, setWeather]   = useState(null);
  const [cityInfo, setCityInfo] = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);

  const fetchWeather = useCallback(async (lat, lon, overrideCity = null) => {
    setLoading(true);
    setError(null);

    try {
      const [weatherData, locationData] = await Promise.all([
        fetchWeatherByCoords(lat, lon),
        overrideCity ?? reverseGeocode(lat, lon),
      ]);

      setWeather(weatherData);
      setCityInfo(locationData);
      await saveToCache(CACHE_KEYS.LAST_WEATHER, { weather: weatherData, city: locationData, lat, lon });
      setLoading(false);
      return { weather: weatherData, city: locationData };
    } catch (e) {
      setError(e.message ?? 'Failed to load weather');
      const cached = await loadFromCache(CACHE_KEYS.LAST_WEATHER);
      if (cached) {
        setWeather(cached.weather);
        setCityInfo(cached.city);
      }
      setLoading(false);
      return null;
    }
  }, []);

  const restoreFromCache = useCallback(async () => {
    const cached = await loadFromCache(CACHE_KEYS.LAST_WEATHER);
    if (cached) {
      setWeather(cached.weather);
      setCityInfo(cached.city);
    }
    return cached ?? null;
  }, []);

  return { weather, cityInfo, loading, error, fetchWeather, restoreFromCache };
};
