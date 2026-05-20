import { useState, useCallback } from 'react';
import { fetchRandomQuote } from '../api/quotesService';
import { saveToCache, loadFromCache } from '../utils/cache';
import { CACHE_KEYS } from '../constants/config';
import { getTodayKey } from '../utils/dateHelpers';

export const useQuote = () => {
  const [quote, setQuote]     = useState(null);
  const [loading, setLoading] = useState(false);

  const loadDailyQuote = useCallback(async (forceNew = false) => {
    setLoading(true);
    const todayKey = getTodayKey();

    if (!forceNew) {
      const cached = await loadFromCache(CACHE_KEYS.DAILY_QUOTE);
      if (cached?.date === todayKey && cached?.quote) {
        setQuote(cached.quote);
        setLoading(false);
        return cached.quote;
      }
    }

    const fresh = await fetchRandomQuote();
    await saveToCache(CACHE_KEYS.DAILY_QUOTE, { date: todayKey, quote: fresh });
    setQuote(fresh);
    setLoading(false);
    return fresh;
  }, []);

  const refreshQuote = useCallback(() => loadDailyQuote(true), [loadDailyQuote]);

  return { quote, loading, loadDailyQuote, refreshQuote };
};
