import React from 'react';
import {
  Modal, View, Text, ScrollView, TouchableOpacity, Pressable,
  Alert, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { GLASS, TEXT } from '../constants/colors';
import { CURRENT_LOCATION_ID } from '../hooks/useSavedCities';

const CitySwitcher = ({
  visible,
  cities,
  activeId,
  onSelect,
  onAdd,
  onRemove,
  onClose,
}) => {
  const handleRemove = (city) => {
    Alert.alert(
      'Remove city?',
      `Remove "${city.label}" from your saved cities?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => onRemove(city.id) },
      ]
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={s.backdrop} onPress={onClose}>
        <Pressable style={s.sheet} onPress={(e) => e.stopPropagation?.()}>
          <LinearGradient
            colors={['#1A1A4E', '#0D0D2B']}
            style={s.gradient}
          >
            <View style={s.handle} />
            <Text style={s.title}>My Cities</Text>
            <Text style={s.subtitle}>Tap a city to switch · long-press the trash to remove</Text>

            <ScrollView
              style={s.list}
              contentContainerStyle={{ paddingBottom: 12 }}
              showsVerticalScrollIndicator={false}
            >
              {cities.map((city) => {
                const isActive  = activeId === city.id;
                const isCurrent = city.id === CURRENT_LOCATION_ID;
                return (
                  <TouchableOpacity
                    key={city.id}
                    style={[s.row, isActive && s.rowActive]}
                    onPress={() => { onSelect(city.id); onClose(); }}
                    activeOpacity={0.75}
                  >
                    <View style={s.iconBox}>
                      <Ionicons
                        name={isCurrent ? 'navigate' : 'location'}
                        size={18}
                        color={isActive ? '#63B3ED' : 'rgba(255,255,255,0.65)'}
                      />
                    </View>

                    <View style={s.text}>
                      <Text style={[s.label, isActive && s.labelActive]}>
                        {city.label}
                      </Text>
                      {city.country_name ? (
                        <Text style={s.sub}>{city.country_name}</Text>
                      ) : isCurrent ? (
                        <Text style={s.sub}>Detected by GPS</Text>
                      ) : null}
                    </View>

                    {isActive && (
                      <Ionicons name="checkmark-circle" size={22} color="#63B3ED" style={{ marginRight: 4 }} />
                    )}

                    {!isCurrent && (
                      <TouchableOpacity
                        onPress={() => handleRemove(city)}
                        style={s.deleteBtn}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons name="trash-outline" size={16} color="rgba(255,80,80,0.7)" />
                      </TouchableOpacity>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity style={s.addBtn} onPress={onAdd} activeOpacity={0.8}>
              <Ionicons name="add-circle-outline" size={20} color="#FFF" />
              <Text style={s.addBtnText}>Add a City</Text>
            </TouchableOpacity>
          </LinearGradient>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const s = StyleSheet.create({
  backdrop: {
    flex: 1, justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheet: {
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    overflow: 'hidden', maxHeight: '78%',
  },
  gradient: {
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 28,
  },
  handle: {
    alignSelf: 'center', width: 44, height: 5, borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.25)', marginBottom: 16,
  },
  title: {
    fontSize: 22, fontWeight: '800', color: TEXT.primary, textAlign: 'center',
  },
  subtitle: {
    fontSize: 12, color: TEXT.muted, textAlign: 'center',
    marginTop: 4, marginBottom: 16,
  },
  list: { maxHeight: 420 },

  row: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: GLASS.background,
    borderWidth: 1, borderColor: GLASS.border,
    borderRadius: 14, padding: 14, marginBottom: 8,
  },
  rowActive: {
    backgroundColor: 'rgba(99,179,237,0.15)',
    borderColor:     'rgba(99,179,237,0.5)',
  },
  iconBox: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 12,
  },
  text: { flex: 1 },
  label:       { fontSize: 15, fontWeight: '600', color: TEXT.primary },
  labelActive: { color: '#FFF', fontWeight: '700' },
  sub:         { fontSize: 12, color: TEXT.muted, marginTop: 2 },
  deleteBtn:   { padding: 4, marginLeft: 4 },

  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(99,179,237,0.25)',
    borderWidth: 1, borderColor: 'rgba(99,179,237,0.5)',
    borderRadius: 16, paddingVertical: 14,
    marginTop: 8, gap: 8,
  },
  addBtnText: {
    fontSize: 15, fontWeight: '700', color: '#FFF',
  },
});

export default CitySwitcher;
