import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

function Stars({ value, size }) {
  return (
    <View style={{ flexDirection: 'row' }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Ionicons
          key={s}
          name={s <= Math.round(value) ? 'star' : 'star-outline'}
          size={size}
          color={s <= Math.round(value) ? '#F59E0B' : '#CBD5E1'}
        />
      ))}
    </View>
  );
}

/**
 * Tap-to-expand per-criterion breakdown: [{ name, score }].
 * Renders nothing when the list is empty (e.g. old reviews with no criteria).
 */
export default function CriteriaBreakdown({ criteria = [], accentColor = '#3B82F6', defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const list = Array.isArray(criteria) ? criteria : [];
  if (list.length === 0) return null;

  return (
    <View>
      <Pressable
        onPress={() => setOpen((v) => !v)}
        style={styles.toggle}
        hitSlop={6}
      >
        <Text style={[styles.toggleText, { color: accentColor }]}>Criteria breakdown</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color={accentColor} />
      </Pressable>

      {open ? (
        <View style={styles.box}>
          {list.map((c, i) => (
            <View key={`${c?.name ?? 'c'}-${i}`} style={styles.row}>
              <Text style={styles.name} numberOfLines={2}>{c?.name}</Text>
              <View style={styles.right}>
                <Stars value={c?.score ?? 0} size={12} />
                <Text style={styles.score}>{c?.score ?? 0}</Text>
              </View>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  toggleText: { fontSize: 12, fontWeight: '700' },
  box: { marginTop: 10 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  name: { fontSize: 12, color: '#334155', flex: 1, marginRight: 8 },
  right: { flexDirection: 'row', alignItems: 'center' },
  score: { fontSize: 12, fontWeight: '700', color: '#0F172A', marginLeft: 6 },
});
