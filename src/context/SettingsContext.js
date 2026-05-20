import React, { createContext, useContext, useState, useEffect } from 'react';
import { loadFromCache, saveToCache } from '../utils/cache';
import { CACHE_KEYS, DEFAULT_SETTINGS } from '../constants/config';

const SettingsContext = createContext({
  settings: DEFAULT_SETTINGS,
  updateSettings: async () => {},
});

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  useEffect(() => {
    loadFromCache(CACHE_KEYS.SETTINGS).then((cached) => {
      if (cached) setSettings({ ...DEFAULT_SETTINGS, ...cached });
    });
  }, []);

  const updateSettings = async (patch) => {
    const updated = { ...settings, ...patch };
    setSettings(updated);
    await saveToCache(CACHE_KEYS.SETTINGS, updated);
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
