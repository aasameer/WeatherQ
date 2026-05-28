import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import ViewShot from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';

import { ShareCardSquare, ShareCardStory } from '../components/ShareCard';
import WeatherBackground from '../components/WeatherBackground';
import { CARD_TEMPLATES, DEFAULT_TEMPLATE } from '../constants/cardTemplates';
import { getWeatherInfo } from '../utils/weatherHelpers';
import { maybeShowShareInterstitial } from '../ads/AdService';
import { TEXT, GLASS } from '../constants/colors';

const FORMATS = [
  { id: 'square', label: 'Square', icon: '▣', subtitle: '1:1 · Instagram Post' },
  { id: 'story',  label: 'Story',  icon: '▯', subtitle: '9:16 · Stories / Reels' },
];

const ShareScreen = ({ navigation, route }) => {
  const { weather, cityInfo, quote, unit } = route.params ?? {};

  const [format,   setFormat]   = useState('square');
  const [template, setTemplate] = useState(DEFAULT_TEMPLATE);
  const [capturing, setCapturing] = useState(false);

  const viewShotRef = useRef(null);

  const weatherInfo = weather
    ? getWeatherInfo(weather.current.weather_code, weather.current.is_day === 1)
    : { type: 'night' };

  const captureCard = useCallback(async () => {
    if (!viewShotRef.current) return null;
    return viewShotRef.current.capture();
  }, []);

  const handleDownload = useCallback(async () => {
    setCapturing(true);
    try {
      // writeOnly=true → only requests "save to library" access,
      // never the broad READ_MEDIA_IMAGES permission (Play Store policy)
      const { status } = await MediaLibrary.requestPermissionsAsync(true);
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Allow photo library access to save the image.');
        return;
      }
      const uri = await captureCard();
      if (!uri) throw new Error('Capture failed');
      await MediaLibrary.saveToLibraryAsync(uri);
      Alert.alert('Saved! 🎉', 'Weather card saved to your photo library.');
      maybeShowShareInterstitial();
    } catch (e) {
      Alert.alert('Error', e.message ?? 'Could not save the image.');
    } finally {
      setCapturing(false);
    }
  }, [captureCard]);

  const handleShare = useCallback(async () => {
    setCapturing(true);
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Sharing not available', 'This device does not support sharing.');
        return;
      }
      const uri = await captureCard();
      if (!uri) throw new Error('Capture failed');
      await Sharing.shareAsync(uri, {
        mimeType:    'image/png',
        dialogTitle: 'Share your weather card',
        UTI:         'public.png',
      });
      maybeShowShareInterstitial();
    } catch (e) {
      Alert.alert('Error', e.message ?? 'Could not share the image.');
    } finally {
      setCapturing(false);
    }
  }, [captureCard]);

  const cardProps = { weather, cityInfo, quote, unit, template };

  return (
    <WeatherBackground weatherType={weatherInfo.type}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <SafeAreaView style={styles.flex}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={22} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Share Card</Text>
          <View style={{ width: 38 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* ── Format selector ── */}
          <View style={styles.formatRow}>
            {FORMATS.map((f) => (
              <TouchableOpacity
                key={f.id}
                style={[styles.formatBtn, format === f.id && styles.formatBtnActive]}
                onPress={() => setFormat(f.id)}
                activeOpacity={0.75}
              >
                <Text style={styles.formatIcon}>{f.icon}</Text>
                <Text style={[styles.formatLabel, format === f.id && styles.formatLabelActive]}>{f.label}</Text>
                <Text style={styles.formatSub}>{f.subtitle}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── Template picker ── */}
          <Text style={styles.sectionLabel}>TEMPLATE</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.templateRow}
          >
            {CARD_TEMPLATES.map((t) => {
              const active = template.id === t.id;
              const swatchColors = t.previewColors ?? t.gradient ?? ['#333', '#666'];
              return (
                <TouchableOpacity
                  key={t.id}
                  onPress={() => setTemplate(t)}
                  activeOpacity={0.8}
                  style={[styles.templateChip, active && styles.templateChipActive]}
                >
                  <LinearGradient
                    colors={swatchColors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.templateSwatch}
                  >
                    <Text style={styles.templateEmoji}>{t.emoji}</Text>
                  </LinearGradient>
                  <Text style={[styles.templateName, active && styles.templateNameActive]}>
                    {t.name}
                  </Text>
                  {active && <View style={styles.templateActiveDot} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* ── Card preview ── */}
          <Text style={[styles.sectionLabel, { marginTop: 20 }]}>PREVIEW</Text>
          <View style={styles.previewWrapper}>
            <ViewShot
              ref={viewShotRef}
              options={{ format: 'png', quality: 1.0 }}
              style={format === 'story' ? styles.storyContainer : styles.squareContainer}
            >
              {format === 'square'
                ? <ShareCardSquare {...cardProps} />
                : <ShareCardStory  {...cardProps} />
              }
            </ViewShot>
          </View>

          {/* ── Actions ── */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.downloadBtn]}
              onPress={handleDownload}
              disabled={capturing}
              activeOpacity={0.8}
            >
              {capturing
                ? <ActivityIndicator color="#FFF" size="small" />
                : <>
                    <Ionicons name="download-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
                    <Text style={styles.actionText}>Save</Text>
                  </>
              }
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.shareBtn]}
              onPress={handleShare}
              disabled={capturing}
              activeOpacity={0.8}
            >
              {capturing
                ? <ActivityIndicator color="#FFF" size="small" />
                : <>
                    <Ionicons name="share-social-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
                    <Text style={styles.actionText}>Share</Text>
                  </>
              }
            </TouchableOpacity>
          </View>

          <Text style={styles.hint}>
            Tip: Use "Story" format for Instagram Stories, WhatsApp Status, and TikTok.
          </Text>
        </ScrollView>
      </SafeAreaView>
    </WeatherBackground>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  backBtn: {
    padding: 8, backgroundColor: GLASS.background,
    borderRadius: 12, borderWidth: 1, borderColor: GLASS.border,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#FFF' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 48 },

  /* Format */
  formatRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  formatBtn: {
    flex: 1, alignItems: 'center', backgroundColor: GLASS.background,
    borderRadius: 16, borderWidth: 1, borderColor: GLASS.border,
    paddingVertical: 14, paddingHorizontal: 8,
  },
  formatBtnActive: { backgroundColor: GLASS.strong, borderColor: 'rgba(255,255,255,0.45)' },
  formatIcon:       { fontSize: 24, marginBottom: 6 },
  formatLabel:      { fontSize: 14, fontWeight: '700', color: TEXT.muted },
  formatLabelActive:{ color: TEXT.primary },
  formatSub:        { fontSize: 10, color: TEXT.muted, marginTop: 2 },

  /* Section label */
  sectionLabel: {
    fontSize: 12, fontWeight: '600', color: TEXT.muted,
    letterSpacing: 1, marginBottom: 10,
  },

  /* Template picker */
  templateRow: { paddingBottom: 4, gap: 12 },
  templateChip: {
    alignItems: 'center', width: 72,
  },
  templateChipActive: {},
  templateSwatch: {
    width: 60, height: 60, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  templateEmoji:     { fontSize: 26 },
  templateName:      { fontSize: 11, color: TEXT.muted, fontWeight: '500', textAlign: 'center' },
  templateNameActive:{ color: TEXT.primary, fontWeight: '700' },
  templateActiveDot: {
    width: 5, height: 5, borderRadius: 3,
    backgroundColor: '#63B3ED', marginTop: 3,
  },

  /* Preview */
  previewWrapper: { alignItems: 'center', marginBottom: 24 },
  squareContainer: {
    borderRadius: 16, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4, shadowRadius: 16, elevation: 10,
  },
  storyContainer: {
    borderRadius: 16, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4, shadowRadius: 16, elevation: 10,
    transform: [{ scale: 0.88 }],
  },

  /* Actions */
  actions: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderRadius: 16, paddingVertical: 16, borderWidth: 1,
  },
  downloadBtn: { backgroundColor: GLASS.background, borderColor: GLASS.border },
  shareBtn:    { backgroundColor: 'rgba(99,179,237,0.25)', borderColor: 'rgba(99,179,237,0.5)' },
  actionText:  { fontSize: 15, fontWeight: '600', color: '#FFF' },
  hint: { fontSize: 12, color: TEXT.muted, textAlign: 'center', lineHeight: 18 },
});

export default ShareScreen;
