import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Keep contract-ending reasons separate from the reviewer's own remarks.
export function getReviewReasonDetails(endType, reason) {
  const type = String(endType ?? '').trim().toLowerCase();
  let label = 'Contract end reason';

  if (type === 'terminated' || type === 'termination') {
    label = 'Termination reason';
  } else if (
    type === 'resigned' ||
    type === 'resignation' ||
    type === 'resignationpending'
  ) {
    label = 'Resignation reason';
  }

  const text = typeof reason === 'string' ? reason.trim() : '';
  return { label, text: text || 'Reason not provided.' };
}

export default function ReviewEndReason({ endType = '', reason = '' }) {
  const { label, text } = getReviewReasonDetails(endType, reason);

  return (
    <View
      style={styles.container}
      accessible
      accessibilityLabel={`${label}: ${text}`}
    >
      <Text style={styles.label}>{label}:</Text>
      <Text style={styles.reason}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 6,
    marginBottom: 8,
  },
  label: { fontSize: 12, fontWeight: '700', color: '#334155', marginBottom: 3 },
  reason: { fontSize: 13, lineHeight: 19, color: '#475569' },
});
