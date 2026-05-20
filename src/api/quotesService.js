import { QUOTES_API_URL } from '../constants/config';
import { QUOTES } from '../constants/quotes';

const pickRandom = (arr, exclude = null) => {
  if (!arr?.length) return null;
  if (arr.length === 1) return arr[0];

  let pick;
  let attempts = 0;
  do {
    pick = arr[Math.floor(Math.random() * arr.length)];
    attempts += 1;
  } while (exclude && pick.text === exclude && attempts < 5);
  return pick;
};

const fetchFromZenQuotes = async () => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(QUOTES_API_URL, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`ZenQuotes responded ${res.status}`);
    const data = await res.json();
    if (Array.isArray(data) && data[0]?.q) {
      return { text: data[0].q, author: data[0].a || 'Unknown' };
    }
    throw new Error('Unexpected response shape');
  } catch {
    clearTimeout(timer);
    return null;
  }
};

/**
 * fetchRandomQuote(language, lastQuoteText)
 * - For English: tries ZenQuotes first; on failure, picks from local English list.
 * - For other languages: picks randomly from the curated local list.
 * - Avoids returning the same quote twice in a row when possible.
 */
export const fetchRandomQuote = async (language = 'en', lastQuoteText = null) => {
  const localList = QUOTES[language] ?? QUOTES.en;

  if (language === 'en') {
    const remote = await fetchFromZenQuotes();
    if (remote && remote.text !== lastQuoteText) return remote;
  }

  return pickRandom(localList, lastQuoteText) ?? localList[0];
};
