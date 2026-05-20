import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { GLASS, TEXT } from '../constants/colors';
import { getLanguageMeta } from '../constants/quotes';

const QuoteDisplay = ({ quote, loading, onRefresh, language = 'en' }) => {
  const meta = getLanguageMeta(language);
  const rtl  = meta.rtl;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>
          {language === 'ar' ? 'اقتباس اليوم' : "TODAY'S QUOTE"}
        </Text>
        <TouchableOpacity
          onPress={onRefresh}
          disabled={loading}
          style={styles.refreshBtn}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          {loading
            ? <ActivityIndicator size="small" color="rgba(255,255,255,0.7)" />
            : <Text style={styles.refreshIcon}>↻</Text>
          }
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={[styles.openQuote, rtl && styles.alignRight]}>"</Text>
        <Text
          style={[
            styles.quoteText,
            rtl && styles.rtl,
          ]}
        >
          {quote?.text ?? (rtl ? '...جاري التحميل' : 'Loading a beautiful quote for you…')}
        </Text>
        {quote?.author && (
          <Text style={[styles.author, rtl && styles.authorRtl]}>
            — {quote.author}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop:         24,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    marginBottom:   10,
  },
  sectionTitle: {
    fontSize:      13,
    fontWeight:    '600',
    color:         TEXT.muted,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  refreshBtn: { padding: 4 },
  refreshIcon: {
    fontSize:   20,
    color:      TEXT.muted,
    fontWeight: '300',
  },
  card: {
    backgroundColor: GLASS.background,
    borderRadius:    20,
    borderWidth:     1,
    borderColor:     GLASS.border,
    padding:         20,
  },
  openQuote: {
    fontSize:     48,
    color:        'rgba(255,255,255,0.25)',
    fontWeight:   '800',
    lineHeight:   40,
    marginBottom: 4,
  },
  alignRight: { textAlign: 'right' },
  quoteText: {
    fontSize:   17,
    color:      TEXT.accent,
    lineHeight: 27,
    fontStyle:  'italic',
    fontWeight: '400',
  },
  rtl: {
    textAlign:   'right',
    writingDirection: 'rtl',
    fontStyle:   'normal',
  },
  author: {
    fontSize:   14,
    color:      TEXT.secondary,
    fontWeight: '600',
    marginTop:  14,
    textAlign:  'right',
  },
  authorRtl: {
    textAlign:        'left',
    writingDirection: 'rtl',
  },
});

export default QuoteDisplay;
