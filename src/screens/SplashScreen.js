import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const SplashScreen = ({ onFinish }) => {
  const scale   = useRef(new Animated.Value(0.6)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const tagline = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(scale,   { toValue: 1,   tension: 60, friction: 7, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1,   duration: 600, useNativeDriver: true }),
      ]),
      Animated.timing(tagline,  { toValue: 1,   duration: 400, delay: 100, useNativeDriver: true }),
    ]).start(() => {
      setTimeout(onFinish, 800);
    });
  }, []);

  return (
    <LinearGradient colors={['#060818', '#0D1530', '#1A2A4A']} style={styles.container}>
      <Animated.View style={{ transform: [{ scale }], opacity }}>
        <Text style={styles.icon}>⛅</Text>
      </Animated.View>

      <Animated.View style={{ opacity }}>
        <Text style={styles.title}>WeatherQ</Text>
      </Animated.View>

      <Animated.Text style={[styles.tagline, { opacity: tagline }]}>
        Weather that speaks to you
      </Animated.Text>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    gap:            8,
  },
  icon: {
    fontSize:    80,
    marginBottom: 8,
  },
  title: {
    fontSize:      36,
    fontWeight:    '800',
    color:         '#FFFFFF',
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  tagline: {
    fontSize:      14,
    color:         'rgba(255,255,255,0.50)',
    letterSpacing: 0.8,
    marginTop:     4,
  },
});

export default SplashScreen;
