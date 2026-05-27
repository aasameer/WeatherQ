import { useState, useEffect, useCallback } from 'react';
import { saveToCache, loadFromCache } from '../utils/cache';
import { CACHE_KEYS } from '../constants/config';

/**
 * Manages the user's list of saved cities.
 * "Current Location" is always pinned as the first entry — it uses
 * device GPS instead of fixed coordinates and cannot be removed.
 */

export const CURRENT_LOCATION_ID = 'current';

const CURRENT_LOCATION_ENTRY = {
  id:    CURRENT_LOCATION_ID,
  type:  'auto',
  label: 'Current Location',
};

const makeCityEntry = (city) => ({
  id:           `city_${city.latitude.toFixed(3)}_${city.longitude.toFixed(3)}`,
  type:         'manual',
  label:        city.name,
  city:         city.name,
  country:      city.country,
  country_name: city.country_name,
  admin1:       city.admin1,
  latitude:     city.latitude,
  longitude:    city.longitude,
});

export const useSavedCities = () => {
  const [cities,   setCities]   = useState([CURRENT_LOCATION_ENTRY]);
  const [activeId, setActiveId] = useState(CURRENT_LOCATION_ID);
  const [loaded,   setLoaded]   = useState(false);

  /* ── Load persisted state on mount ── */
  useEffect(() => {
    (async () => {
      const stored = await loadFromCache(CACHE_KEYS.SAVED_CITIES);
      if (stored?.cities?.length) {
        setCities([CURRENT_LOCATION_ENTRY, ...stored.cities]);
      }
      if (stored?.activeId) setActiveId(stored.activeId);
      setLoaded(true);
    })();
  }, []);

  /* ── Persist (don't include the auto "current" entry) ── */
  const persist = useCallback(async (nextCities, nextActive) => {
    const custom = nextCities.filter((c) => c.id !== CURRENT_LOCATION_ID);
    await saveToCache(CACHE_KEYS.SAVED_CITIES, {
      cities:   custom,
      activeId: nextActive,
    });
  }, []);

  /* ── Add or focus existing ── */
  const addCity = useCallback(async (city) => {
    const entry    = makeCityEntry(city);
    const existing = cities.find((c) => c.id === entry.id);
    let nextCities = cities;

    if (!existing) {
      nextCities = [...cities, entry];
      setCities(nextCities);
    }
    setActiveId(entry.id);
    await persist(nextCities, entry.id);
    return entry;
  }, [cities, persist]);

  /* ── Remove ── */
  const removeCity = useCallback(async (id) => {
    if (id === CURRENT_LOCATION_ID) return; // can't remove the auto entry
    const nextCities = cities.filter((c) => c.id !== id);
    const nextActive = activeId === id ? CURRENT_LOCATION_ID : activeId;
    setCities(nextCities);
    setActiveId(nextActive);
    await persist(nextCities, nextActive);
  }, [cities, activeId, persist]);

  /* ── Switch active ── */
  const switchTo = useCallback(async (id) => {
    setActiveId(id);
    await persist(cities, id);
  }, [cities, persist]);

  /* ── Rename (lets user customise "New York" → "Mom's House") ── */
  const renameCity = useCallback(async (id, newLabel) => {
    const nextCities = cities.map((c) =>
      c.id === id ? { ...c, label: newLabel } : c
    );
    setCities(nextCities);
    await persist(nextCities, activeId);
  }, [cities, activeId, persist]);

  const activeCity = cities.find((c) => c.id === activeId) ?? CURRENT_LOCATION_ENTRY;

  return {
    cities,
    activeId,
    activeCity,
    loaded,
    addCity,
    removeCity,
    switchTo,
    renameCity,
  };
};
