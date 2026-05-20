import AsyncStorage from '@react-native-async-storage/async-storage';

export const saveToCache = async (key, data) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn('[Cache] save error:', e.message);
  }
};

export const loadFromCache = async (key) => {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.warn('[Cache] load error:', e.message);
    return null;
  }
};

export const removeFromCache = async (key) => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (e) {
    console.warn('[Cache] remove error:', e.message);
  }
};

export const clearAllCache = async () => {
  try {
    await AsyncStorage.clear();
  } catch (e) {
    console.warn('[Cache] clear error:', e.message);
  }
};
