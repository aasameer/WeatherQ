import { useState, useCallback } from 'react';
import { fetchRandomQuote } from '../api/quotesService';
import { saveToCache, loadFromCache } from '../utils/cache';
import { CACHE_KEYS } from '../constants/config';
import { getTodayKey } from '../utils/dateHelpers';

/**
 * Daily quote behaviour:
 *   - Same quote shown for the entire calendar day.
 *   - A new random quote is picked when the date rolls over.
 *   - If language changes, a new random quote is picked immediately.
 *   - Manual refresh button forces a brand-new random pick (still cached for the rest of the day).
 */
export const useQuote = () => {
  const [quote, setQuote]     = useState(null);
  const [loading, setLoading] = useState(false);

  const loadQuote = useCallback(async (language = 'en', forceNew = false) => {
    setLoading(true);
    const todayKey = getTodayKey();

    if (!forceNew) {
      const cached = await loadFromCache(CACHE_KEYS.DAILY_QUOTE);
      if (cached?.date === todayKey && cached?.language === language && cached?.quote) {
        setQuote(cached.quote);
        setLoading(false);
        return cached.quote;
      }
    }

    const fresh = await fetchRandomQuote(language);
    if (fresh) {
      await saveToCache(CACHE_KEYS.DAILY_QUOTE, {
        date:     todayKey,
        language,
        quote:    fresh,
      });
      setQuote(fresh);
    }
    setLoading(false);
    return fresh;
  }, []);

  const refreshQuote = useCallback((language = 'en') => loadQuote(language, true), [loadQuote]);

  return { quote, loading, loadQuote, refreshQuote };
};
