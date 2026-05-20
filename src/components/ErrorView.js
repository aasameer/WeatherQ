import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { TEXT, GLASS } from '../constants/colors';

const ErrorView = ({ message, onRetry, hint }) => (
  <View style={styles.container}>
    <Text style={styles.icon}>⚠️</Text>
    <Text style={styles.title}>Something went wrong</Text>
    <Text style={styles.message}>{message}</Text>
    {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    {onRetry && (
      <TouchableOpacity style={styles.button} onPress={onRetry} activeOpacity={0.75}>
        <Text style={styles.buttonText}>Try Again</Text>
      </TouchableOpacity>
    )}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
  },
  icon: {
    fontSize:     48,
    marginBottom: 16,
  },
  title: {
    fontSize:     20,
    fontWeight:   '700',
    color:        TEXT.primary,
    marginBottom: 10,
    textAlign:    'center',
  },
  message: {
    fontSize:  15,
    color:     TEXT.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  hint: {
    fontSize:   13,
    color:      TEXT.muted,
    textAlign:  'center',
    marginTop:  8,
    lineHeight: 20,
  },
  button: {
    marginTop:     24,
    paddingVertical: 12,
    paddingHorizontal: 32,
    backgroundColor: GLASS.strong,
    borderRadius:  24,
    borderWidth:   1,
    borderColor:   GLASS.border,
  },
  buttonText: {
    fontSize:   15,
    fontWeight: '600',
    color:      TEXT.primary,
  },
});

export default ErrorView;
