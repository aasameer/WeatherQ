import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const LoadingScreen = ({ message = 'Fetching weather…' }) => {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1,   duration: 900, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, [opacity]);

  return (
    <LinearGradient colors={['#060818', '#0D1530', '#1A2A4A']} style={styles.container}>
      <Animated.Text style={[styles.icon, { opacity }]}>⛅</Animated.Text>
      <Text style={styles.app}>WeatherQ</Text>
      <Text style={styles.message}>{message}</Text>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems:     'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize:    64,
    marginBottom: 16,
  },
  app: {
    fontSize:    28,
    fontWeight:  '700',
    color:       '#FFFFFF',
    letterSpacing: 2,
    marginBottom: 12,
  },
  message: {
    fontSize:  14,
    color:     'rgba(255,255,255,0.6)',
    letterSpacing: 0.5,
  },
});

export default LoadingScreen;
