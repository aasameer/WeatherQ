import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StatusBar, StyleSheet,
  Animated, Easing, Platform, Alert, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { ShareCardStory } from '../components/ShareCard';
import WeatherBackground from '../components/WeatherBackground';
import { DEFAULT_TEMPLATE } from '../constants/cardTemplates';
import { getWeatherInfo } from '../utils/weatherHelpers';
import { isMotionCardUnlocked } from '../utils/featureUnlocks';
import { TEXT, GLASS } from '../constants/colors';

/**
 * Motion Card — a beautifully animated version of the story share card.
 * Because Expo can't encode MP4 without native code, we deliver the
 * animation live on-screen and guide the user through the native OS
 * screen recorder — that lets them save the MP4 straight to Photos.
 */

const MotionCardScreen = ({ navigation, route }) => {
  const { weather, cityInfo, quote, unit } = route.params ?? {};

  const [showGuide, setShowGuide] = useState(true);

  // Deep-link safety: if somebody navigates here without unlocking, bounce
  useEffect(() => {
    isMotionCardUnlocked().then((ok) => {
      if (!ok) navigation.goBack();
    });
  }, [navigation]);

  const scale       = useRef(new Animated.Value(1)).current;
  const shimmerX    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Subtle pulsing scale — evokes life without being distracting
    Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.02, duration: 2400,
          easing: Easing.inOut(Easing.ease), useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1, duration: 2400,
          easing: Easing.inOut(Easing.ease), useNativeDriver: true,
        }),
      ])
    ).start();

    // Shimmer sweeps horizontally
    Animated.loop(
      Animated.timing(shimmerX, {
        toValue: 1, duration: 4200,
        easing: Easing.linear, useNativeDriver: true,
      })
    ).start();
  }, []);

  const shimmerLeft = shimmerX.interpolate({
    inputRange:  [0, 1],
    outputRange: [-100, 400],
  });

  const weatherInfo = weather
    ? getWeatherInfo(weather.current.weather_code, weather.current.is_day === 1)
    : { type: 'night' };

  return (
    <WeatherBackground weatherType={weatherInfo.type}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <SafeAreaView style={styles.flex}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={22} color="#FFF" />
          </TouchableOpacity>
          <View>
            <Text style={styles.title}>Motion Card</Text>
            <Text style={styles.subtitle}>Screen record for Reels & TikTok</Text>
          </View>
          <TouchableOpacity onPress={() => setShowGuide(true)} style={styles.iconBtn} activeOpacity={0.7}>
            <Ionicons name="help-circle-outline" size={22} color="#FFF" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

          <Text style={styles.sectionLabel}>PREVIEW</Text>
          <View style={styles.cardWrapper}>
            <Animated.View style={[styles.cardOuter, { transform: [{ scale }] }]}>
              <View style={styles.cardInner}>
                <ShareCardStory
                  weather={weather}
                  cityInfo={cityInfo}
                  quote={quote}
                  unit={unit}
                  template={DEFAULT_TEMPLATE}
                />
                {/* Shimmer overlay */}
                <Animated.View style={[styles.shimmer, { left: shimmerLeft }]}>
                  <LinearGradient
                    colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.28)', 'rgba(255,255,255,0)']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={styles.shimmerFill}
                  />
                </Animated.View>
              </View>
            </Animated.View>
          </View>

          <View style={styles.recordCTA}>
            <TouchableOpacity
              style={styles.recordBtn}
              activeOpacity={0.85}
              onPress={() => showRecordingSteps(setShowGuide)}
            >
              <Ionicons name="videocam-outline" size={20} color="#FFF" />
              <Text style={styles.recordBtnText}>Start Screen Recording</Text>
            </TouchableOpacity>
            <Text style={styles.recordHint}>
              Record for ~3 seconds, then post directly to Instagram Reels,
              TikTok, Stories, or WhatsApp Status.
            </Text>
          </View>

        </ScrollView>

        {/* Guide modal */}
        <Modal visible={showGuide} transparent animationType="fade" onRequestClose={() => setShowGuide(false)}>
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>How to record</Text>
              {Platform.OS === 'ios' ? (
                <>
                  <Text style={styles.modalStep}>1. Swipe down from top-right → Control Center</Text>
                  <Text style={styles.modalStep}>2. Tap the ⏺ record button</Text>
                  <Text style={styles.modalStep}>3. Return here — wait 3 seconds</Text>
                  <Text style={styles.modalStep}>4. Stop recording — video saves to Photos</Text>
                  <Text style={styles.modalTip}>
                    💡 Don't see the record button? iOS Settings → Control Center → add Screen Recording.
                  </Text>
                </>
              ) : (
                <>
                  <Text style={styles.modalStep}>1. Swipe down twice → quick settings</Text>
                  <Text style={styles.modalStep}>2. Tap Screen record</Text>
                  <Text style={styles.modalStep}>3. Return here — wait 3 seconds</Text>
                  <Text style={styles.modalStep}>4. Stop from the notification — video saves to Gallery</Text>
                  <Text style={styles.modalTip}>
                    💡 Some phones use "Smart record" or need a manufacturer's screen-recorder app.
                  </Text>
                </>
              )}
              <TouchableOpacity
                onPress={() => setShowGuide(false)}
                style={styles.modalCloseBtn}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCloseText}>Got it</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

      </SafeAreaView>
    </WeatherBackground>
  );
};

const showRecordingSteps = (setShowGuide) => {
  Alert.alert(
    'Ready to record?',
    'Open your device\'s screen recorder from Control Center, then come back to this screen and wait 3 seconds for the animation loop.',
    [
      { text: 'Show me how',  onPress: () => setShowGuide(true) },
      { text: 'Got it', style: 'default' },
    ]
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  iconBtn: {
    padding: 8, backgroundColor: GLASS.background,
    borderRadius: 12, borderWidth: 1, borderColor: GLASS.border,
  },
  title:    { fontSize: 17, fontWeight: '800', color: '#FFF', textAlign: 'center' },
  subtitle: { fontSize: 10, color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginTop: 2 },

  content:  { paddingHorizontal: 20, paddingBottom: 48 },
  sectionLabel: {
    fontSize: 12, fontWeight: '600', color: TEXT.muted,
    letterSpacing: 1, marginBottom: 10,
  },

  cardWrapper: { alignItems: 'center' },
  cardOuter:   {},
  cardInner:   {
    borderRadius: 16, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4, shadowRadius: 20, elevation: 12,
    transform: [{ scale: 0.86 }],
  },
  shimmer: {
    position: 'absolute', top: 0, bottom: 0, width: 100,
  },
  shimmerFill: { flex: 1 },

  recordCTA: {
    marginTop: 32,
    alignItems: 'center',
  },
  recordBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 15, paddingHorizontal: 26,
    backgroundColor: 'rgba(239,68,68,0.35)',
    borderColor: 'rgba(239,68,68,0.8)', borderWidth: 1,
    borderRadius: 30,
  },
  recordBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700', letterSpacing: 0.3 },
  recordHint: {
    fontSize: 12, color: TEXT.muted, marginTop: 14,
    textAlign: 'center', lineHeight: 18,
  },

  /* Modal */
  modalBackdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center', alignItems: 'center', padding: 24,
  },
  modalCard: {
    backgroundColor: '#1A1A4E', borderRadius: 20, padding: 24,
    width: '100%', maxWidth: 400,
    borderColor: GLASS.border, borderWidth: 1,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#FFF', marginBottom: 14 },
  modalStep:  { fontSize: 14, color: TEXT.accent, marginBottom: 6, lineHeight: 20 },
  modalTip:   { fontSize: 12, color: TEXT.muted, marginTop: 10, lineHeight: 16, fontStyle: 'italic' },
  modalCloseBtn: {
    marginTop: 20, alignSelf: 'flex-end',
    paddingVertical: 10, paddingHorizontal: 20,
    backgroundColor: 'rgba(99,179,237,0.3)',
    borderColor: 'rgba(99,179,237,0.6)', borderWidth: 1,
    borderRadius: 20,
  },
  modalCloseText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
});

export default MotionCardScreen;
