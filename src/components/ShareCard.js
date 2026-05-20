import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { WEATHER_GRADIENTS } from '../constants/colors';
import { getWeatherInfo, formatTemperatureWithUnit } from '../utils/weatherHelpers';
import { formatFullDate } from '../utils/dateHelpers';

const isRtl = (text = '') => /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/.test(text);

/* ─── Square Card  1:1  ──────────────────────────────────────── */
export const ShareCardSquare = ({ weather, cityInfo, quote, unit = 'C' }) => {
  const current  = weather?.current;
  const info     = getWeatherInfo(current?.weather_code ?? 0, current?.is_day === 1);
  const colors   = WEATHER_GRADIENTS[info.type] ?? WEATHER_GRADIENTS.partly_cloudy;
  const temp     = formatTemperatureWithUnit(current?.temperature_2m ?? 0, unit);
  const humidity = current?.relative_humidity_2m ?? '--';
  const wind     = current?.wind_speed_10m != null ? `${Math.round(current.wind_speed_10m)} km/h` : '--';
  const cityName = cityInfo?.city ?? '';
  const country  = cityInfo?.country_name ?? cityInfo?.country ?? '';

  return (
    <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={sq.card}>
      {/* Top */}
      <View style={sq.topRow}>
        <View>
          <Text style={sq.city}>{cityName}</Text>
          <Text style={sq.country}>{country}</Text>
        </View>
        <Text style={sq.date}>{formatFullDate()}</Text>
      </View>

      {/* Centre */}
      <View style={sq.centre}>
        <Text style={sq.emoji}>{info.emoji}</Text>
        <Text style={sq.temp}>{temp}</Text>
        <Text style={sq.condition}>{info.label}</Text>

        <View style={sq.statsRow}>
          <View style={sq.stat}>
            <Text style={sq.statIcon}>💧</Text>
            <Text style={sq.statVal}>{humidity}%</Text>
          </View>
          <View style={sq.divider} />
          <View style={sq.stat}>
            <Text style={sq.statIcon}>💨</Text>
            <Text style={sq.statVal}>{wind}</Text>
          </View>
        </View>
      </View>

      {/* Quote */}
      <View style={sq.quoteBox}>
        <Text
          style={[sq.quoteText, isRtl(quote?.text) && { textAlign: 'right', writingDirection: 'rtl', fontStyle: 'normal' }]}
          numberOfLines={4}
        >
          "{quote?.text}"
        </Text>
        {quote?.author && (
          <Text style={[sq.quoteAuthor, isRtl(quote?.text) && { textAlign: 'left' }]}>
            — {quote.author}
          </Text>
        )}
      </View>

      {/* Branding */}
      <View style={sq.brand}>
        <Text style={sq.brandIcon}>⛅</Text>
        <Text style={sq.brandName}>WeatherQ</Text>
      </View>
    </LinearGradient>
  );
};

/* ─── Story Card  9:16  ─────────────────────────────────────── */
export const ShareCardStory = ({ weather, cityInfo, quote, unit = 'C' }) => {
  const current  = weather?.current;
  const info     = getWeatherInfo(current?.weather_code ?? 0, current?.is_day === 1);
  const colors   = WEATHER_GRADIENTS[info.type] ?? WEATHER_GRADIENTS.partly_cloudy;
  const temp     = formatTemperatureWithUnit(current?.temperature_2m ?? 0, unit);
  const feels    = formatTemperatureWithUnit(current?.apparent_temperature ?? 0, unit);
  const humidity = current?.relative_humidity_2m ?? '--';
  const wind     = current?.wind_speed_10m != null ? `${Math.round(current.wind_speed_10m)} km/h` : '--';
  const cityName = cityInfo?.city ?? '';
  const country  = cityInfo?.country_name ?? cityInfo?.country ?? '';

  return (
    <LinearGradient colors={colors} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={st.card}>
      {/* Date strip */}
      <Text style={st.date}>{formatFullDate()}</Text>

      {/* City */}
      <Text style={st.city}>{cityName}</Text>
      <Text style={st.country}>{country}</Text>

      {/* Weather hero */}
      <Text style={st.emoji}>{info.emoji}</Text>
      <Text style={st.temp}>{temp}</Text>
      <Text style={st.condition}>{info.label}</Text>

      {/* Stats */}
      <View style={st.statsRow}>
        <View style={st.stat}>
          <Text style={st.statIcon}>🌡️</Text>
          <Text style={st.statLabel}>Feels like</Text>
          <Text style={st.statVal}>{feels}</Text>
        </View>
        <View style={st.stat}>
          <Text style={st.statIcon}>💧</Text>
          <Text style={st.statLabel}>Humidity</Text>
          <Text style={st.statVal}>{humidity}%</Text>
        </View>
        <View style={st.stat}>
          <Text style={st.statIcon}>💨</Text>
          <Text style={st.statLabel}>Wind</Text>
          <Text style={st.statVal}>{wind}</Text>
        </View>
      </View>

      {/* Divider */}
      <View style={st.divider} />

      {/* Quote */}
      <View style={st.quoteSection}>
        <Text style={st.openQuote}>"</Text>
        <Text
          style={[st.quoteText, isRtl(quote?.text) && { writingDirection: 'rtl', fontStyle: 'normal' }]}
        >
          "{quote?.text}"
        </Text>
        {quote?.author && <Text style={st.quoteAuthor}>— {quote.author}</Text>}
      </View>

      {/* Branding */}
      <View style={st.brand}>
        <Text style={st.brandIcon}>⛅</Text>
        <Text style={st.brandName}>WeatherQ</Text>
      </View>
    </LinearGradient>
  );
};

/* ─── Square Styles ─────────────────────────────────────────── */
const sq = StyleSheet.create({
  card: {
    width:   375,
    height:  375,
    padding: 24,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'flex-start',
  },
  city:    { fontSize: 18, fontWeight: '700', color: '#FFF' },
  country: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  date:    { fontSize: 11, color: 'rgba(255,255,255,0.65)', textAlign: 'right', maxWidth: 120 },
  centre:  { alignItems: 'center' },
  emoji:   { fontSize: 40, marginBottom: 4 },
  temp:    { fontSize: 56, fontWeight: '800', color: '#FFF', lineHeight: 64 },
  condition: { fontSize: 16, color: 'rgba(255,255,255,0.85)', fontWeight: '500' },
  statsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  stat:    { alignItems: 'center', paddingHorizontal: 14 },
  statIcon: { fontSize: 16, marginBottom: 2 },
  statVal:  { fontSize: 13, fontWeight: '700', color: '#FFF' },
  divider:  { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.3)', marginHorizontal: 4 },
  quoteBox: {
    backgroundColor: 'rgba(0,0,0,0.20)',
    borderRadius:    12,
    padding:         12,
  },
  quoteText:   { fontSize: 13, color: 'rgba(255,255,255,0.9)', lineHeight: 20, fontStyle: 'italic' },
  quoteAuthor: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 6, textAlign: 'right', fontWeight: '600' },
  brand: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' },
  brandIcon: { fontSize: 14, marginRight: 4 },
  brandName: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.75)', letterSpacing: 1 },
});

/* ─── Story Styles ──────────────────────────────────────────── */
const st = StyleSheet.create({
  card: {
    width:          375,
    height:         667,
    paddingVertical: 40,
    paddingHorizontal: 28,
    alignItems:     'center',
    justifyContent: 'space-evenly',
  },
  date:      { fontSize: 12, color: 'rgba(255,255,255,0.65)', letterSpacing: 0.5 },
  city:      { fontSize: 32, fontWeight: '800', color: '#FFF', textAlign: 'center' },
  country:   { fontSize: 16, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  emoji:     { fontSize: 72, marginVertical: 8 },
  temp:      { fontSize: 80, fontWeight: '800', color: '#FFF', lineHeight: 88 },
  condition: { fontSize: 20, color: 'rgba(255,255,255,0.85)', fontWeight: '500' },
  statsRow:  { flexDirection: 'row', gap: 16, marginTop: 4 },
  stat:      { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 14, paddingVertical: 10, paddingHorizontal: 16 },
  statIcon:  { fontSize: 22, marginBottom: 4 },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.65)', marginBottom: 2 },
  statVal:   { fontSize: 15, fontWeight: '700', color: '#FFF' },
  divider:   { width: '80%', height: 1, backgroundColor: 'rgba(255,255,255,0.22)', marginVertical: 4 },
  quoteSection: { alignItems: 'center', paddingHorizontal: 8 },
  openQuote:    { fontSize: 56, color: 'rgba(255,255,255,0.2)', fontWeight: '800', alignSelf: 'flex-start', lineHeight: 48, marginBottom: 4 },
  quoteText:    { fontSize: 17, color: 'rgba(255,255,255,0.92)', lineHeight: 27, fontStyle: 'italic', textAlign: 'center' },
  quoteAuthor:  { fontSize: 14, color: 'rgba(255,255,255,0.75)', marginTop: 12, fontWeight: '600' },
  brand:    { flexDirection: 'row', alignItems: 'center' },
  brandIcon: { fontSize: 18, marginRight: 6 },
  brandName: { fontSize: 16, fontWeight: '700', color: 'rgba(255,255,255,0.7)', letterSpacing: 1.5 },
});
