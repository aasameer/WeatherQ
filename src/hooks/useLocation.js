import { useState, useCallback, useEffect } from 'react';
import * as Location from 'expo-location';

export const useLocation = (autoRequest = true) => {
  const [coords, setCoords]   = useState(null);
  const [error, setError]     = useState(null);
  const [loading, setLoading] = useState(autoRequest);
  const [denied, setDenied]   = useState(false);

  const requestLocation = useCallback(async () => {
    setLoading(true);
    setError(null);
    setDenied(false);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setDenied(true);
        setLoading(false);
        return null;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setCoords(loc.coords);
      setLoading(false);
      return loc.coords;
    } catch (e) {
      setError(e.message ?? 'Location unavailable');
      setLoading(false);
      return null;
    }
  }, []);

  useEffect(() => {
    if (autoRequest) {
      requestLocation();
    }
  }, [autoRequest, requestLocation]);

  return { coords, error, loading, denied, requestLocation };
};
