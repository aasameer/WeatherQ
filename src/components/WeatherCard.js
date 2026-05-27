import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GLASS, TEXT } from '../constants/colors';
import { getWeatherInfo, formatTemperature, formatTemperatureWithUnit } from '../utils/weatherHelpers';
import { formatTime } from '../utils/dateHelpers';
import WeatherIcon from './WeatherIcon';

const StatPill = ({ icon, label, value }) => (
  <View style={styles.pill}>
    <Text style={styles.pillIcon}>{icon}</Text>
    <Text style={styles.pillValue}>{value}</Text>
    <Text style={styles.pillLabel}>{label}</Text>
  </View>
);

const WeatherCard = ({ weather, cityInfo, unit = 'C' }) => {
  if (!weather?.current) return null;

  const { current, daily } = weather;
  const info    = getWeatherInfo(current.weather_code, current.is_day === 1);
  const temp    = formatTemperature(current.temperature_2m, unit);
  const feels   = formatTemperatureWithUnit(current.apparent_temperature, unit);
  const sunrise = daily?.sunrise?.[0] ? formatTime(daily.sunrise[0]) : null;
  const sunset  = daily?.sunset?.[0]  ? formatTime(daily.sunset[0])  : null;
  const highLow = daily
    ? `${formatTemperature(daily.temperature_2m_max[0], unit)} / ${formatTemperature(daily.temperature_2m_min[0], unit)}`
    : null;

  return (
    <View style={styles.container}>
      {/* City */}
      <Text style={styles.city}>
        {cityInfo?.city ?? 'Loading…'}
        {cityInfo?.country ? `, ${cityInfo.country}` : ''}
      </Text>

      {/* Big temperature + animated icon */}
      <View style={styles.heroRow}>
        <Text style={styles.tempText}>{temp}</Text>
        <View style={styles.iconBox}>
          <WeatherIcon type={info.type} size={88} isDay={current.is_day === 1} />
        </View>
      </View>

      <Text style={styles.condition}>{info.label}</Text>
      {highLow && <Text style={styles.highLow}>{highLow}</Text>}

      {/* Stats row */}
      <View style={styles.statsRow}>
        <StatPill icon="🌡️" label="Feels like" value={feels} />
        <StatPill icon="💧" label="Humidity"   value={`${current.relative_humidity_2m}%`} />
        <StatPill icon="💨" label="Wind"        value={`${Math.round(current.wind_speed_10m)} km/h`} />
      </View>

      {/* Sunrise / Sunset */}
      {(sunrise || sunset) && (
        <View style={styles.sunRow}>
          {sunrise && <StatPill icon="🌅" label="Sunrise" value={sunrise} />}
          {sunset  && <StatPill icon="🌇" label="Sunset"  value={sunset}  />}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingTop: 8,
  },
  city: {
    fontSize:      16,
    fontWeight:    '600',
    color:         TEXT.secondary,
    letterSpacing: 0.5,
    marginBottom:  4,
  },
  heroRow: {
    flexDirection:  'row',
    alignItems:     'center',
    marginVertical: 4,
  },
  tempText: {
    fontSize:    96,
    fontWeight:  '800',
    color:       TEXT.primary,
    lineHeight:  110,
  },
  iconBox: {
    marginLeft: 8,
    marginTop:  16,
  },
  condition: {
    fontSize:    20,
    fontWeight:  '500',
    color:       TEXT.secondary,
    marginBottom: 4,
  },
  highLow: {
    fontSize:    14,
    color:       TEXT.muted,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection:  'row',
    justifyContent: 'space-around',
    width:          '100%',
    marginTop:      8,
  },
  sunRow: {
    flexDirection:  'row',
    justifyContent: 'center',
    gap:            16,
    width:          '100%',
    marginTop:      12,
  },
  pill: {
    alignItems:      'center',
    backgroundColor: GLASS.background,
    borderRadius:    16,
    borderWidth:     1,
    borderColor:     GLASS.border,
    paddingVertical:   12,
    paddingHorizontal: 16,
    minWidth:          90,
  },
  pillIcon:  { fontSize: 20, marginBottom: 4 },
  pillValue: { fontSize: 15, fontWeight: '700', color: TEXT.primary },
  pillLabel: { fontSize: 11, color: TEXT.muted, marginTop: 2 },
});

export default WeatherCard;
