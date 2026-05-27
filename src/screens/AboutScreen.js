import React from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, Linking, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { UI, TEXT, GLASS } from '../constants/colors';

const DDP_LOGO = require('../../assets/ddp-logo.png');

const ExternalLink = ({ icon, title, subtitle, url }) => (
  <TouchableOpacity
    style={styles.linkRow}
    onPress={() => url && Linking.openURL(url)}
    activeOpacity={0.7}
  >
    <View style={styles.linkIcon}>
      <Ionicons name={icon} size={18} color="rgba(255,255,255,0.7)" />
    </View>
    <View style={styles.linkText}>
      <Text style={styles.linkTitle}>{title}</Text>
      {subtitle ? <Text style={styles.linkSub}>{subtitle}</Text> : null}
    </View>
    {url && <Ionicons name="open-outline" size={14} color={TEXT.muted} />}
  </TouchableOpacity>
);

const AboutScreen = ({ navigation }) => (
  <View style={styles.root}>
    <StatusBar barStyle="light-content" backgroundColor={UI.settingsBg} />
    <SafeAreaView style={styles.flex}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* App identity */}
        <LinearGradient
          colors={['#1A6FBF', '#3B8FD4']}
          style={styles.hero}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.heroIcon}>⛅</Text>
          <Text style={styles.heroName}>WeatherQ</Text>
          <Text style={styles.heroVersion}>Version 1.6.1</Text>
          <Text style={styles.heroTagline}>Weather that speaks to you</Text>
        </LinearGradient>

        {/* Developer card */}
        <Text style={styles.sectionHeader}>DEVELOPED BY</Text>
        <TouchableOpacity
          style={styles.devCard}
          activeOpacity={0.85}
          onPress={() => Linking.openURL('https://devpioneers.sa')}
        >
          <Image source={DDP_LOGO} style={styles.devLogo} resizeMode="contain" />
          <View style={styles.devText}>
            <Text style={styles.devName}>Digital Development Pioneers</Text>
            <Text style={styles.devTagline}>Where creativity meets technology</Text>
            <Text style={styles.devLink}>devpioneers.sa</Text>
          </View>
          <Ionicons name="open-outline" size={16} color={TEXT.muted} />
        </TouchableOpacity>

        {/* Description */}
        <Text style={styles.sectionHeader}>ABOUT</Text>
        <View style={styles.card}>
          <Text style={styles.descText}>
            WeatherQ combines live weather data with daily inspirational quotes to give you
            a reason to check the weather every day. Share beautiful weather cards with friends,
            family, and followers on any platform.
          </Text>
        </View>

        {/* Data sources */}
        <Text style={styles.sectionHeader}>DATA SOURCES</Text>
        <View style={styles.card}>
          <ExternalLink
            icon="partly-sunny-outline"
            title="Open-Meteo"
            subtitle="Free weather API · open-meteo.com"
            url="https://open-meteo.com"
          />
          <ExternalLink
            icon="chatbubble-ellipses-outline"
            title="ZenQuotes"
            subtitle="Inspirational quotes API · zenquotes.io"
            url="https://zenquotes.io"
          />
          <ExternalLink
            icon="map-outline"
            title="OpenStreetMap / Nominatim"
            subtitle="Reverse geocoding · nominatim.org"
            url="https://nominatim.org"
          />
        </View>

        {/* Legal */}
        <Text style={styles.sectionHeader}>LEGAL</Text>
        <View style={styles.card}>
          <ExternalLink
            icon="document-text-outline"
            title="Privacy Policy"
            subtitle="How we handle your data"
            url="https://aasameer.github.io/WeatherQ/privacy-policy.html"
          />
        </View>

        {/* Contact */}
        <Text style={styles.sectionHeader}>CONTACT</Text>
        <View style={styles.card}>
          <ExternalLink
            icon="mail-outline"
            title="Send Feedback"
            subtitle="sam.helmi90@gmail.com"
            url="mailto:sam.helmi90@gmail.com?subject=WeatherQ%20Feedback"
          />
          <ExternalLink
            icon="globe-outline"
            title="Visit DDP"
            subtitle="devpioneers.sa"
            url="https://devpioneers.sa"
          />
        </View>

        <Text style={styles.footer}>
          © 2026 Digital Development Pioneers. All rights reserved.{'\n'}
          Made with ❤️ in Riyadh using React Native + Expo{'\n'}
          Weather data © Open-Meteo contributors{'\n'}
          Quotes © ZenQuotes.io
        </Text>
      </ScrollView>
    </SafeAreaView>
  </View>
);

const styles = StyleSheet.create({
  root:  { flex: 1, backgroundColor: UI.settingsBg },
  flex:  { flex: 1 },
  header: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: 16,
    paddingVertical:   12,
  },
  backBtn: {
    padding:         8,
    backgroundColor: GLASS.background,
    borderRadius:    12,
    borderWidth:     1,
    borderColor:     GLASS.border,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#FFF' },
  content:     { paddingHorizontal: 16, paddingBottom: 48 },
  hero: {
    borderRadius:   20,
    alignItems:     'center',
    paddingVertical: 32,
    marginBottom:   8,
  },
  heroIcon:    { fontSize: 56, marginBottom: 8 },
  heroName:    { fontSize: 28, fontWeight: '800', color: '#FFF', letterSpacing: 2 },
  heroVersion: { fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 4 },
  heroTagline: { fontSize: 14, color: 'rgba(255,255,255,0.75)', marginTop: 8, fontStyle: 'italic' },
  devCard: {
    flexDirection:     'row',
    alignItems:        'center',
    backgroundColor:   UI.settingsCard,
    borderRadius:      16,
    padding:           14,
    gap:               14,
  },
  devLogo:    { width: 48, height: 48, tintColor: '#FFF' },
  devText:    { flex: 1 },
  devName:    { fontSize: 15, fontWeight: '700', color: TEXT.primary },
  devTagline: { fontSize: 12, color: TEXT.muted, marginTop: 2, fontStyle: 'italic' },
  devLink:    { fontSize: 11, color: '#63B3ED', marginTop: 4, letterSpacing: 0.5 },
  sectionHeader: {
    fontSize:      12,
    fontWeight:    '600',
    color:         TEXT.muted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop:     24,
    marginBottom:  8,
    paddingHorizontal: 4,
  },
  card: {
    backgroundColor: UI.settingsCard,
    borderRadius:    16,
    overflow:        'hidden',
  },
  descText: {
    fontSize:   14,
    color:      TEXT.secondary,
    lineHeight: 22,
    padding:    16,
  },
  linkRow: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingVertical:   13,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.07)',
  },
  linkIcon: {
    width:           34,
    height:          34,
    borderRadius:    10,
    backgroundColor: GLASS.background,
    alignItems:      'center',
    justifyContent:  'center',
    marginRight:     12,
  },
  linkText:  { flex: 1 },
  linkTitle: { fontSize: 15, fontWeight: '500', color: TEXT.primary },
  linkSub:   { fontSize: 12, color: TEXT.muted, marginTop: 2 },
  footer: {
    fontSize:  12,
    color:     TEXT.muted,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 32,
  },
});

export default AboutScreen;
