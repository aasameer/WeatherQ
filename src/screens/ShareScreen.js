import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  StyleSheet,
  StatusBar,
  Modal,
  Pressable,
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
import { registerPositiveAction } from '../utils/rateApp';
import { isMotionCardUnlocked } from '../utils/featureUnlocks';
import { shareWeatherQ } from '../utils/referral';
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
  const [motionUnlocked, setMotionUnlocked] = useState(false);
  const [unlockOpen,     setUnlockOpen]     = useState(false);

  const viewShotRef = useRef(null);

  // Load unlock state on mount and refresh when returning to this screen
  useEffect(() => {
    let alive = true;
    isMotionCardUnlocked().then((u) => alive && setMotionUnlocked(!!u));
    const unsub = navigation.addListener('focus', () => {
      isMotionCardUnlocked().then((u) => alive && setMotionUnlocked(!!u));
    });
    return () => { alive = false; unsub && unsub(); };
  }, [navigation]);

  const openMotionCard = useCallback(() => {
    if (motionUnlocked) {
      navigation.navigate('MotionCard', { weather, cityInfo, quote, unit });
    } else {
      setUnlockOpen(true);
    }
  }, [motionUnlocked, navigation, weather, cityInfo, quote, unit]);

  const handleUnlockShare = useCallback(async () => {
    const ok = await shareWeatherQ({ cityName: cityInfo?.city });
    if (ok) {
      setMotionUnlocked(true);
      setUnlockOpen(false);
      // Small confirmation then jump straight into the Motion Card
      setTimeout(() => {
        Alert.alert(
          '🎉 Unlocked!',
          'Motion Cards are ready. Screen-record the animated preview for Reels and TikTok.',
          [{
            text: 'Open Motion Card',
            onPress: () => navigation.navigate('MotionCard', { weather, cityInfo, quote, unit }),
          }]
        );
      }, 400);
    }
  }, [cityInfo, navigation, weather, quote, unit]);

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
      registerPositiveAction();
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
      registerPositiveAction();
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

          <TouchableOpacity
            style={[styles.motionBtn, !motionUnlocked && styles.motionBtnLocked]}
            activeOpacity={0.85}
            onPress={openMotionCard}
          >
            <Ionicons
              name={motionUnlocked ? 'videocam-outline' : 'lock-closed-outline'}
              size={16} color="#FFF" style={{ marginRight: 6 }}
            />
            <Text style={styles.motionBtnText}>
              {motionUnlocked
                ? 'Try Motion Card — animated for Reels & TikTok'
                : 'Motion Card — invite 1 friend to unlock'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.hint}>
            Tip: Use "Story" format for Instagram Stories, WhatsApp Status, and TikTok.
          </Text>
        </ScrollView>

        {/* Unlock Motion Card modal */}
        <Modal visible={unlockOpen} transparent animationType="fade" onRequestClose={() => setUnlockOpen(false)}>
          <Pressable style={styles.mBackdrop} onPress={() => setUnlockOpen(false)}>
            <Pressable style={styles.mSheet} onPress={(e) => e.stopPropagation?.()}>
              <LinearGradient
                colors={['#1A1A4E', '#0D0D2B']}
                style={styles.mGradient}
              >
                <View style={styles.mIconWrap}>
                  <Ionicons name="videocam" size={32} color="#63B3ED" />
                </View>
                <Text style={styles.mTitle}>Unlock Motion Cards</Text>
                <Text style={styles.mBody}>
                  Invite a friend to try WeatherQ and instantly unlock our animated
                  card format — perfect for Instagram Reels, TikTok, and Stories.
                </Text>
                <View style={styles.mPerks}>
                  <Text style={styles.mPerk}>🎥  Animated share card preview</Text>
                  <Text style={styles.mPerk}>📱  Screen-record for social media</Text>
                  <Text style={styles.mPerk}>💛  Unlocked forever after 1 invite</Text>
                </View>
                <TouchableOpacity
                  style={styles.mPrimaryBtn}
                  onPress={handleUnlockShare}
                  activeOpacity={0.85}
                >
                  <Ionicons name="paper-plane-outline" size={16} color="#FFF" style={{ marginRight: 6 }} />
                  <Text style={styles.mPrimaryText}>Invite a friend now</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.mSecondaryBtn}
                  onPress={() => setUnlockOpen(false)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.mSecondaryText}>Maybe later</Text>
                </TouchableOpacity>
              </LinearGradient>
            </Pressable>
          </Pressable>
        </Modal>

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
  motionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginTop: 12, marginBottom: 20,
    paddingVertical: 12, borderRadius: 14,
    backgroundColor: 'rgba(239,68,68,0.20)',
    borderColor: 'rgba(239,68,68,0.55)', borderWidth: 1,
  },
  motionBtnText: { fontSize: 13, color: '#FFF', fontWeight: '600' },
  motionBtnLocked: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor:     'rgba(255,255,255,0.15)',
  },

  /* Unlock modal */
  mBackdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center', alignItems: 'center', padding: 24,
  },
  mSheet: { width: '100%', maxWidth: 420, borderRadius: 24, overflow: 'hidden' },
  mGradient: { padding: 24, alignItems: 'center' },
  mIconWrap: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: 'rgba(99,179,237,0.20)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 14,
  },
  mTitle: { fontSize: 20, fontWeight: '800', color: '#FFF', marginBottom: 8, textAlign: 'center' },
  mBody:  {
    fontSize: 13, color: TEXT.accent, lineHeight: 19,
    textAlign: 'center', marginBottom: 18,
  },
  mPerks: {
    alignSelf: 'stretch',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12, padding: 14, marginBottom: 22,
    gap: 6,
  },
  mPerk: { fontSize: 13, color: '#FFF' },
  mPrimaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(99,179,237,0.35)',
    borderColor: 'rgba(99,179,237,0.7)', borderWidth: 1,
    borderRadius: 14, paddingVertical: 14, paddingHorizontal: 20,
    alignSelf: 'stretch',
  },
  mPrimaryText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  mSecondaryBtn: {
    marginTop: 10, alignSelf: 'stretch',
    paddingVertical: 12, alignItems: 'center',
  },
  mSecondaryText: { color: TEXT.muted, fontSize: 13, fontWeight: '500' },
  hint: { fontSize: 12, color: TEXT.muted, textAlign: 'center', lineHeight: 18 },
});

export default ShareScreen;
