/**
 * Share card visual templates.
 * Each defines colors for the card gradient, text, quote box, and stats.
 * gradient: null → use the dynamic weather gradient (current weather-adaptive behaviour).
 */

export const CARD_TEMPLATES = [
  {
    id:             'weather',
    name:           'Weather',
    emoji:          '⛅',
    gradient:       null,                          // weather-adaptive
    previewColors:  ['#FF9500', '#FF6B35', '#1A1AFF'],
    textPrimary:    '#FFFFFF',
    textMuted:      'rgba(255,255,255,0.70)',
    textAccent:     'rgba(255,255,255,0.92)',
    quoteBg:        'rgba(0,0,0,0.20)',
    quoteBorder:    'rgba(255,255,255,0.15)',
    statBg:         'rgba(255,255,255,0.12)',
    brandColor:     'rgba(255,255,255,0.70)',
    openQuoteColor: 'rgba(255,255,255,0.20)',
    dividerColor:   'rgba(255,255,255,0.22)',
  },
  {
    id:             'midnight',
    name:           'Midnight',
    emoji:          '🌙',
    gradient:       ['#0D1B3E', '#0A2463', '#1B1B4E'],
    previewColors:  ['#0D1B3E', '#0A2463', '#1B1B4E'],
    textPrimary:    '#FFFFFF',
    textMuted:      'rgba(255,255,255,0.65)',
    textAccent:     'rgba(255,255,255,0.90)',
    quoteBg:        'rgba(255,255,255,0.08)',
    quoteBorder:    'rgba(255,255,255,0.12)',
    statBg:         'rgba(255,255,255,0.10)',
    brandColor:     'rgba(255,255,255,0.60)',
    openQuoteColor: 'rgba(99,179,237,0.30)',
    dividerColor:   'rgba(255,255,255,0.18)',
  },
  {
    id:             'sunset',
    name:           'Sunset',
    emoji:          '🌅',
    gradient:       ['#C94B4B', '#E96D3F', '#F7C59F'],
    previewColors:  ['#C94B4B', '#E96D3F', '#F7C59F'],
    textPrimary:    '#FFFFFF',
    textMuted:      'rgba(255,255,255,0.78)',
    textAccent:     '#FFFFFF',
    quoteBg:        'rgba(0,0,0,0.18)',
    quoteBorder:    'rgba(255,255,255,0.20)',
    statBg:         'rgba(255,255,255,0.18)',
    brandColor:     'rgba(255,255,255,0.78)',
    openQuoteColor: 'rgba(255,255,255,0.28)',
    dividerColor:   'rgba(255,255,255,0.28)',
  },
  {
    id:             'ocean',
    name:           'Ocean',
    emoji:          '🌊',
    gradient:       ['#005C97', '#0099CC', '#36D1DC'],
    previewColors:  ['#005C97', '#0099CC', '#36D1DC'],
    textPrimary:    '#FFFFFF',
    textMuted:      'rgba(255,255,255,0.75)',
    textAccent:     '#FFFFFF',
    quoteBg:        'rgba(255,255,255,0.12)',
    quoteBorder:    'rgba(255,255,255,0.22)',
    statBg:         'rgba(255,255,255,0.16)',
    brandColor:     'rgba(255,255,255,0.72)',
    openQuoteColor: 'rgba(255,255,255,0.25)',
    dividerColor:   'rgba(255,255,255,0.25)',
  },
];

export const DEFAULT_TEMPLATE = CARD_TEMPLATES[0];

export const getTemplate = (id) =>
  CARD_TEMPLATES.find((t) => t.id === id) ?? DEFAULT_TEMPLATE;
