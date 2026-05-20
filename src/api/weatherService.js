import {
  WEATHER_API_BASE,
  GEOCODING_API_BASE,
  REVERSE_GEOCODING_BASE,
  WEATHER_PARAMS,
} from '../constants/config';

export const fetchWeatherByCoords = async (latitude, longitude) => {
  const params = new URLSearchParams({
    latitude:     latitude.toFixed(4),
    longitude:    longitude.toFixed(4),
    current:      WEATHER_PARAMS.current,
    daily:        WEATHER_PARAMS.daily,
    timezone:     'auto',
    forecast_days: String(WEATHER_PARAMS.forecast_days),
  });

  const res = await fetch(`${WEATHER_API_BASE}/forecast?${params}`);
  if (!res.ok) throw new Error(`Weather API responded ${res.status}`);
  return res.json();
};

export const geocodeCity = async (cityName) => {
  const params = new URLSearchParams({
    name:     cityName,
    count:    '8',
    language: 'en',
    format:   'json',
  });

  const res = await fetch(`${GEOCODING_API_BASE}/search?${params}`);
  if (!res.ok) throw new Error(`Geocoding API responded ${res.status}`);
  const data = await res.json();

  if (!data.results?.length) throw new Error('No cities found for that name');
  return data.results.map((r) => ({
    id:          r.id,
    name:        r.name,
    country:     r.country_code?.toUpperCase() ?? '',
    country_name: r.country ?? '',
    admin1:      r.admin1 ?? '',
    latitude:    r.latitude,
    longitude:   r.longitude,
    timezone:    r.timezone,
  }));
};

export const reverseGeocode = async (latitude, longitude) => {
  try {
    const res = await fetch(
      `${REVERSE_GEOCODING_BASE}/reverse?format=json&lat=${latitude}&lon=${longitude}`,
      { headers: { 'User-Agent': 'WeatherQ/1.0 (mobile app)' } }
    );
    if (!res.ok) throw new Error('Reverse geocode failed');
    const data = await res.json();
    const addr = data.address ?? {};
    return {
      city:         addr.city || addr.town || addr.village || addr.county || 'Your Location',
      country:      addr.country_code?.toUpperCase() ?? '',
      country_name: addr.country ?? '',
    };
  } catch {
    return { city: 'Your Location', country: '', country_name: '' };
  }
};
