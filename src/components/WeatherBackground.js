import React from 'react';
import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { WEATHER_GRADIENTS } from '../constants/colors';

const WeatherBackground = ({ weatherType = 'partly_cloudy', children, style }) => {
  const colors = WEATHER_GRADIENTS[weatherType] ?? WEATHER_GRADIENTS.partly_cloudy;

  return (
    <LinearGradient
      colors={colors}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={[styles.container, style]}
    >
      {children}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
});

export default WeatherBackground;
