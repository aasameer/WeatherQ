import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { WEATHER_GRADIENTS } from '../constants/colors';
import { DEFAULT_TEMPLATE } from '../constants/cardTemplates';
import { getWeatherInfo, formatTemperatureWithUnit } from '../utils/weatherHelpers';
import { formatFullDate } from '../utils/dateHelpers';
import WeatherIcon from './WeatherIcon';

const isRtl = (text = '') => /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/.test(text);

/* ─── Resolve gradient: template override OR weather-adaptive ─── */
const resolveGradient = (template, weatherType) => {
  if (template?.gradient) return template.gradient;
  return WEATHER_GRADIENTS[weatherType] ?? WEATHER_GRADIENTS.partly_cloudy;
};

/* ─── Square Card  1:1  ──────────────────────────────────────── */
export const ShareCardSquare = ({ weather, cityInfo, quote, unit = 'C', template = DEFAULT_TEMPLATE }) => {
  const current   = weather?.current;
  const info      = getWeatherInfo(current?.weather_code ?? 0, current?.is_day === 1);
  const colors    = resolveGradient(template, info.type);
  const temp      = formatTemperatureWithUnit(current?.temperature_2m ?? 0, unit);
  const humidity  = current?.relative_humidity_2m ?? '--';
  const wind      = current?.wind_speed_10m != null ? `${Math.round(current.wind_speed_10m)} km/h` : '--';
  const cityName  = cityInfo?.city ?? '';
  const country   = cityInfo?.country_name ?? cityInfo?.country ?? '';

  const t = template;

  return (
    <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={sq.card}>
      {/* Top */}
      <View style={sq.topRow}>
        <View>
          <Text style={[sq.city, { color: t.textPrimary }]}>{cityName}</Text>
          <Text style={[sq.country, { color: t.textMuted }]}>{country}</Text>
        </View>
        <Text style={[sq.date, { color: t.textMuted }]}>{formatFullDate()}</Text>
      </View>

      {/* Centre */}
      <View style={sq.centre}>
        <WeatherIcon type={info.type} size={60} isDay={current?.is_day === 1} />
        <Text style={[sq.temp, { color: t.textPrimary }]}>{temp}</Text>
        <Text style={[sq.condition, { color: t.textMuted }]}>{info.label}</Text>

        <View style={sq.statsRow}>
          <View style={sq.stat}>
            <Text style={sq.statIcon}>💧</Text>
            <Text style={[sq.statVal, { color: t.textPrimary }]}>{humidity}%</Text>
          </View>
          <View style={[sq.divider, { backgroundColor: t.dividerColor }]} />
          <View style={sq.stat}>
            <Text style={sq.statIcon}>💨</Text>
            <Text style={[sq.statVal, { color: t.textPrimary }]}>{wind}</Text>
          </View>
        </View>
      </View>

      {/* Quote */}
      <View style={[sq.quoteBox, { backgroundColor: t.quoteBg, borderColor: t.quoteBorder }]}>
        <Text
          style={[sq.quoteText, { color: t.textAccent }, isRtl(quote?.text) && { textAlign: 'right', writingDirection: 'rtl', fontStyle: 'normal' }]}
          numberOfLines={4}
        >
          "{quote?.text}"
        </Text>
        {quote?.author && (
          <Text style={[sq.quoteAuthor, { color: t.textMuted }, isRtl(quote?.text) && { textAlign: 'left' }]}>
            — {quote.author}
          </Text>
        )}
      </View>

      {/* Branding */}
      <View style={sq.brand}>
        <Text style={sq.brandIcon}>⛅</Text>
        <Text style={[sq.brandName, { color: t.brandColor }]}>WeatherQ</Text>
      </View>
    </LinearGradient>
  );
};

/* ─── Story Card  9:16  ─────────────────────────────────────── */
export const ShareCardStory = ({ weather, cityInfo, quote, unit = 'C', template = DEFAULT_TEMPLATE }) => {
  const current   = weather?.current;
  const info      = getWeatherInfo(current?.weather_code ?? 0, current?.is_day === 1);
  const colors    = resolveGradient(template, info.type);
  const temp      = formatTemperatureWithUnit(current?.temperature_2m ?? 0, unit);
  const feels     = formatTemperatureWithUnit(current?.apparent_temperature ?? 0, unit);
  const humidity  = current?.relative_humidity_2m ?? '--';
  const wind      = current?.wind_speed_10m != null ? `${Math.round(current.wind_speed_10m)} km/h` : '--';
  const cityName  = cityInfo?.city ?? '';
  const country   = cityInfo?.country_name ?? cityInfo?.country ?? '';

  const t = template;

  return (
    <LinearGradient colors={colors} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={st.card}>
      {/* Date strip */}
      <Text style={[st.date, { color: t.textMuted }]}>{formatFullDate()}</Text>

      {/* City */}
      <Text style={[st.city, { color: t.textPrimary }]}>{cityName}</Text>
      <Text style={[st.country, { color: t.textMuted }]}>{country}</Text>

      {/* Weather hero */}
      <View style={st.iconBox}>
        <WeatherIcon type={info.type} size={110} isDay={current?.is_day === 1} />
      </View>
      <Text style={[st.temp, { color: t.textPrimary }]}>{temp}</Text>
      <Text style={[st.condition, { color: t.textMuted }]}>{info.label}</Text>

      {/* Stats */}
      <View style={st.statsRow}>
        {[
          { icon: '🌡️', label: 'Feels like', val: feels },
          { icon: '💧', label: 'Humidity',   val: `${humidity}%` },
          { icon: '💨', label: 'Wind',        val: wind },
        ].map(({ icon, label, val }) => (
          <View key={label} style={[st.stat, { backgroundColor: t.statBg }]}>
            <Text style={st.statIcon}>{icon}</Text>
            <Text style={[st.statLabel, { color: t.textMuted }]}>{label}</Text>
            <Text style={[st.statVal, { color: t.textPrimary }]}>{val}</Text>
          </View>
        ))}
      </View>

      {/* Divider */}
      <View style={[st.divider, { backgroundColor: t.dividerColor }]} />

      {/* Quote */}
      <View style={st.quoteSection}>
        <Text style={[st.openQuote, { color: t.openQuoteColor }]}>"</Text>
        <Text style={[st.quoteText, { color: t.textAccent }, isRtl(quote?.text) && { writingDirection: 'rtl', fontStyle: 'normal' }]}>
          "{quote?.text}"
        </Text>
        {quote?.author && (
          <Text style={[st.quoteAuthor, { color: t.textMuted }]}>— {quote.author}</Text>
        )}
      </View>

      {/* Branding */}
      <View style={st.brand}>
        <Text style={st.brandIcon}>⛅</Text>
        <Text style={[st.brandName, { color: t.brandColor }]}>WeatherQ</Text>
      </View>
    </LinearGradient>
  );
};

/* ─── Square Styles ─────────────────────────────────────────── */
const sq = StyleSheet.create({
  card:      { width: 375, height: 375, padding: 24, justifyContent: 'space-between' },
  topRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  city:      { fontSize: 18, fontWeight: '700' },
  country:   { fontSize: 13, marginTop: 2 },
  date:      { fontSize: 11, textAlign: 'right', maxWidth: 120 },
  centre:    { alignItems: 'center' },
  temp:      { fontSize: 56, fontWeight: '800', lineHeight: 64 },
  condition: { fontSize: 16, fontWeight: '500' },
  statsRow:  { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  stat:      { alignItems: 'center', paddingHorizontal: 14 },
  statIcon:  { fontSize: 16, marginBottom: 2 },
  statVal:   { fontSize: 13, fontWeight: '700' },
  divider:   { width: 1, height: 30, marginHorizontal: 4 },
  quoteBox:  { borderRadius: 12, borderWidth: 1, padding: 12 },
  quoteText: { fontSize: 13, lineHeight: 20, fontStyle: 'italic' },
  quoteAuthor: { fontSize: 11, marginTop: 6, textAlign: 'right', fontWeight: '600' },
  brand:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' },
  brandIcon: { fontSize: 14, marginRight: 4 },
  brandName: { fontSize: 13, fontWeight: '700', letterSpacing: 1 },
});

/* ─── Story Styles ──────────────────────────────────────────── */
const st = StyleSheet.create({
  card:      { width: 375, height: 667, paddingVertical: 40, paddingHorizontal: 28, alignItems: 'center', justifyContent: 'space-evenly' },
  date:      { fontSize: 12, letterSpacing: 0.5 },
  city:      { fontSize: 32, fontWeight: '800', textAlign: 'center' },
  country:   { fontSize: 16, marginTop: 4 },
  iconBox:   { marginVertical: 8, alignItems: 'center' },
  temp:      { fontSize: 80, fontWeight: '800', lineHeight: 88 },
  condition: { fontSize: 20, fontWeight: '500' },
  statsRow:  { flexDirection: 'row', gap: 16, marginTop: 4 },
  stat:      { alignItems: 'center', borderRadius: 14, paddingVertical: 10, paddingHorizontal: 16 },
  statIcon:  { fontSize: 22, marginBottom: 4 },
  statLabel: { fontSize: 11, marginBottom: 2 },
  statVal:   { fontSize: 15, fontWeight: '700' },
  divider:   { width: '80%', height: 1, marginVertical: 4 },
  quoteSection: { alignItems: 'center', paddingHorizontal: 8 },
  openQuote:    { fontSize: 56, fontWeight: '800', alignSelf: 'flex-start', lineHeight: 48, marginBottom: 4 },
  quoteText:    { fontSize: 17, lineHeight: 27, fontStyle: 'italic', textAlign: 'center' },
  quoteAuthor:  { fontSize: 14, marginTop: 12, fontWeight: '600' },
  brand:     { flexDirection: 'row', alignItems: 'center' },
  brandIcon: { fontSize: 18, marginRight: 6 },
  brandName: { fontSize: 16, fontWeight: '700', letterSpacing: 1.5 },
});
