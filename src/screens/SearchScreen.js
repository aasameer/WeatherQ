import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  StatusBar,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { geocodeCity } from '../api/weatherService';
import { UI, TEXT, GLASS } from '../constants/colors';

const SearchScreen = ({ navigation, route }) => {
  const { onSelect } = route.params ?? {};

  const [query,   setQuery]   = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const debounceTimer = useRef(null);
  const inputRef      = useRef(null);

  const search = useCallback(async (text) => {
    const trimmed = text.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const found = await geocodeCity(trimmed);
      setResults(found);
    } catch (e) {
      setError(e.message ?? 'Search failed');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const onChangeText = (text) => {
    setQuery(text);
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => search(text), 400);
  };

  const onSelectCity = useCallback((city) => {
    Keyboard.dismiss();
    if (onSelect) onSelect(city);
    navigation.goBack();
  }, [onSelect, navigation]);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.resultItem}
      onPress={() => onSelectCity(item)}
      activeOpacity={0.75}
    >
      <View style={styles.resultIconWrap}>
        <Ionicons name="location-outline" size={18} color="rgba(255,255,255,0.6)" />
      </View>
      <View style={styles.resultTextWrap}>
        <Text style={styles.resultCity}>{item.name}</Text>
        <Text style={styles.resultSub}>
          {[item.admin1, item.country_name].filter(Boolean).join(', ')}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.3)" />
    </TouchableOpacity>
  );

  return (
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
          <Text style={styles.headerTitle}>Search City</Text>
          <View style={{ width: 38 }} />
        </View>

        {/* Search input */}
        <View style={styles.inputWrap}>
          <Ionicons name="search-outline" size={18} color="rgba(255,255,255,0.5)" style={styles.inputIcon} />
          <TextInput
            ref={inputRef}
            autoFocus
            style={styles.input}
            placeholder="City name…"
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={query}
            onChangeText={onChangeText}
            returnKeyType="search"
            onSubmitEditing={() => search(query)}
            clearButtonMode="while-editing"
          />
          {loading && (
            <ActivityIndicator size="small" color="rgba(255,255,255,0.6)" style={{ marginRight: 12 }} />
          )}
        </View>

        {/* Error */}
        {error && (
          <Text style={styles.errorText}>{error}</Text>
        )}

        {/* Results */}
        <FlatList
          data={results}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            !loading && query.length >= 2 && !error ? (
              <Text style={styles.emptyText}>No cities found for "{query}"</Text>
            ) : null
          }
        />
      </SafeAreaView>
    </View>
  );
};

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
  headerTitle: {
    fontSize:   18,
    fontWeight: '700',
    color:      '#FFF',
  },
  inputWrap: {
    flexDirection:     'row',
    alignItems:        'center',
    backgroundColor:   UI.inputBg,
    borderRadius:      16,
    borderWidth:       1,
    borderColor:       UI.inputBorder,
    marginHorizontal:  16,
    marginBottom:      16,
    paddingHorizontal: 14,
  },
  inputIcon: { marginRight: 8 },
  input: {
    flex:       1,
    height:     48,
    fontSize:   16,
    color:      '#FFF',
    fontWeight: '400',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom:     32,
  },
  resultItem: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: GLASS.background,
    borderRadius:    14,
    borderWidth:     1,
    borderColor:     GLASS.border,
    marginBottom:    8,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  resultIconWrap: {
    width:           34,
    height:          34,
    borderRadius:    10,
    backgroundColor: GLASS.strong,
    alignItems:      'center',
    justifyContent:  'center',
    marginRight:     12,
  },
  resultTextWrap: { flex: 1 },
  resultCity:     { fontSize: 16, fontWeight: '600', color: TEXT.primary },
  resultSub:      { fontSize: 13, color: TEXT.muted, marginTop: 2 },
  errorText: {
    color:            '#FF6B6B',
    fontSize:         14,
    textAlign:        'center',
    marginHorizontal: 16,
    marginBottom:     12,
  },
  emptyText: {
    color:     TEXT.muted,
    fontSize:  14,
    textAlign: 'center',
    marginTop: 40,
  },
});

export default SearchScreen;
