import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StatusBar, StyleSheet, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';

import { AMBIENT_SOUNDS, AMBIENT_TIMERS } from '../constants/ambientSounds';
import { TEXT, GLASS } from '../constants/colors';

const AmbientScreen = ({ navigation }) => {
  const [activeId, setActiveId] = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [timerMin, setTimerMin] = useState(0);
  const [remaining, setRemaining] = useState(0);

  const soundRef      = useRef(null);
  const timerRef      = useRef(null);
  const countdownRef  = useRef(null);

  const activeSound = AMBIENT_SOUNDS.find((s) => s.id === activeId);

  useEffect(() => {
    Audio.setAudioModeAsync({
      allowsRecordingIOS:    false,
      staysActiveInBackground: true,
      playsInSilentModeIOS:   true,
      shouldDuckAndroid:      true,
    }).catch(() => {});

    return () => {
      stopAndUnload();
      if (timerRef.current)     clearTimeout(timerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  const stopAndUnload = async () => {
    if (soundRef.current) {
      try { await soundRef.current.stopAsync();  } catch {}
      try { await soundRef.current.unloadAsync(); } catch {}
      soundRef.current = null;
    }
    if (timerRef.current)     { clearTimeout(timerRef.current);   timerRef.current = null; }
    if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
  };

  const startTimer = (minutes) => {
    if (minutes <= 0) return;
    setRemaining(minutes * 60);
    countdownRef.current = setInterval(() => {
      setRemaining((r) => (r > 0 ? r - 1 : 0));
    }, 1000);
    timerRef.current = setTimeout(async () => {
      await stopAndUnload();
      setActiveId(null);
    }, minutes * 60 * 1000);
  };

  const play = useCallback(async (sound) => {
    setLoading(true);
    try {
      await stopAndUnload();
      const { sound: player } = await Audio.Sound.createAsync(
        { uri: sound.url },
        { shouldPlay: true, isLooping: true, volume: 0.7 }
      );
      soundRef.current = player;
      setActiveId(sound.id);
      if (timerMin > 0) startTimer(timerMin);
    } catch (e) {
      Alert.alert('Could not play sound', e?.message ?? 'Please try again.');
      setActiveId(null);
    } finally {
      setLoading(false);
    }
  }, [timerMin]);

  const stop = useCallback(async () => {
    await stopAndUnload();
    setActiveId(null);
    setRemaining(0);
  }, []);

  const onTimerChange = (minutes) => {
    setTimerMin(minutes);
    // If something is playing, restart timer with new duration
    if (activeId) {
      if (timerRef.current)     clearTimeout(timerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
      setRemaining(0);
      if (minutes > 0) startTimer(minutes);
    }
  };

  const formatRemaining = (s) => {
    if (s <= 0) return null;
    const m = Math.floor(s / 60);
    const sec = String(s % 60).padStart(2, '0');
    return `${m}:${sec}`;
  };

  const gradient = activeSound?.gradient ?? ['#1A1A4E', '#0D0D2B'];

  return (
    <LinearGradient colors={gradient} style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <SafeAreaView style={styles.flex}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.iconBtn}
            activeOpacity={0.75}
          >
            <Ionicons name="arrow-back" size={22} color="#FFF" />
          </TouchableOpacity>
          <View>
            <Text style={styles.title}>Ambient Sounds</Text>
            <Text style={styles.subtitle}>Focus · Sleep · Relax</Text>
          </View>
          <View style={{ width: 38 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

          {/* Active player display */}
          {activeSound && (
            <View style={styles.player}>
              <Text style={styles.playerEmoji}>{activeSound.emoji}</Text>
              <Text style={styles.playerLabel}>{activeSound.label}</Text>
              {formatRemaining(remaining) && (
                <Text style={styles.playerTimer}>⏱ {formatRemaining(remaining)}</Text>
              )}
              <TouchableOpacity style={styles.stopBtn} onPress={stop} activeOpacity={0.8}>
                <Ionicons name="stop" size={20} color="#FFF" />
                <Text style={styles.stopBtnText}>Stop</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Sound cards */}
          <Text style={styles.sectionLabel}>SOUNDS</Text>
          <View style={styles.grid}>
            {AMBIENT_SOUNDS.map((sound) => {
              const isActive = activeId === sound.id;
              return (
                <TouchableOpacity
                  key={sound.id}
                  style={[styles.card, isActive && styles.cardActive]}
                  onPress={() => (isActive ? stop() : play(sound))}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  <Text style={styles.cardEmoji}>{sound.emoji}</Text>
                  <Text style={[styles.cardLabel, isActive && styles.cardLabelActive]}>
                    {sound.label}
                  </Text>
                  {isActive && (
                    <View style={styles.playingBadge}>
                      <Ionicons name="volume-medium" size={12} color="#FFF" />
                      <Text style={styles.playingBadgeText}>Playing</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Timer */}
          <Text style={styles.sectionLabel}>SLEEP TIMER</Text>
          <View style={styles.timerRow}>
            {AMBIENT_TIMERS.map((t) => {
              const isActive = timerMin === t.minutes;
              return (
                <TouchableOpacity
                  key={t.minutes}
                  style={[styles.timerChip, isActive && styles.timerChipActive]}
                  onPress={() => onTimerChange(t.minutes)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.timerChipText, isActive && styles.timerChipTextActive]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.hint}>
            💤 Sound will keep playing in the background. Tap the app icon to return.
          </Text>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  iconBtn: {
    padding: 8, backgroundColor: GLASS.background,
    borderRadius: 12, borderWidth: 1, borderColor: GLASS.border,
  },
  title:    { fontSize: 18, fontWeight: '800', color: '#FFF', textAlign: 'center' },
  subtitle: { fontSize: 11, color: 'rgba(255,255,255,0.55)', textAlign: 'center', marginTop: 2 },

  content:  { paddingHorizontal: 20, paddingBottom: 48 },

  /* Player */
  player: {
    alignItems:    'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)',
    borderRadius: 20, padding: 24, marginBottom: 20,
  },
  playerEmoji: { fontSize: 56 },
  playerLabel: { fontSize: 18, fontWeight: '800', color: '#FFF', marginTop: 8 },
  playerTimer: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 6 },
  stopBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14,
    backgroundColor: 'rgba(255,80,80,0.35)',
    borderWidth: 1, borderColor: 'rgba(255,80,80,0.6)',
    paddingVertical: 10, paddingHorizontal: 22, borderRadius: 24,
  },
  stopBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },

  sectionLabel: {
    fontSize: 12, fontWeight: '600', letterSpacing: 1,
    color: 'rgba(255,255,255,0.55)',
    marginTop: 6, marginBottom: 10,
  },

  /* Grid of sound cards */
  grid: {
    flexDirection: 'row', flexWrap: 'wrap',
    justifyContent: 'space-between', gap: 12,
  },
  card: {
    width: '47%', aspectRatio: 1.15,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
    borderRadius: 18, padding: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  cardActive: {
    backgroundColor: 'rgba(99,179,237,0.25)',
    borderColor:     'rgba(99,179,237,0.6)',
  },
  cardEmoji:     { fontSize: 40, marginBottom: 6 },
  cardLabel:     { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.85)', textAlign: 'center' },
  cardLabelActive:{ color: '#FFF', fontWeight: '800' },
  playingBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    marginTop: 6, paddingHorizontal: 8, paddingVertical: 2,
    backgroundColor: 'rgba(99,179,237,0.5)', borderRadius: 10,
  },
  playingBadgeText: { fontSize: 10, color: '#FFF', fontWeight: '700' },

  /* Timer */
  timerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  timerChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },
  timerChipActive: {
    backgroundColor: 'rgba(99,179,237,0.3)',
    borderColor:     'rgba(99,179,237,0.6)',
  },
  timerChipText:       { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.7)' },
  timerChipTextActive: { color: '#FFF', fontWeight: '800' },

  hint: {
    marginTop: 30, textAlign: 'center',
    fontSize: 11, color: 'rgba(255,255,255,0.55)',
    lineHeight: 16,
  },
});

export default AmbientScreen;
