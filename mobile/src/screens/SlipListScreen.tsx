import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api, { errorMessage } from '../api';
import { getStoredUser } from '../auth';
import { colors, g, radius, spacing } from '../theme';
import { formatMoney } from '../slip';
import type { ScreenProps } from '../navigation';
import type { PaymentSlip } from '../types';

function creatorLabel(slip: PaymentSlip): string {
  if (!slip.createdBy) return '';
  const role = slip.createdBy.role === 'SUPER_ADMIN' ? 'Admin' : 'Driver';
  return `${slip.createdBy.name} (@${slip.createdBy.username}) · ${role}`;
}

export default function SlipListScreen({ navigation }: ScreenProps<'SlipList'>) {
  const [slips, setSlips] = useState<PaymentSlip[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    getStoredUser().then((user) => setIsAdmin(user?.role === 'SUPER_ADMIN'));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/payment-slips');
      const list = (res.data.slips as PaymentSlip[]).sort((a, b) =>
        (b.createdAt || '').localeCompare(a.createdAt || ''),
      );
      setSlips(list);
    } catch (err) {
      console.warn(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return slips;
    return slips.filter((s) =>
      [s.slipNo, s.truckNo, s.fromLocation, s.toLocation, s.consignor, s.consignee, s.driverName, s.createdBy?.name, s.createdBy?.username]
        .join(' ')
        .toLowerCase()
        .includes(q),
    );
  }, [slips, query]);

  const renderItem = ({ item }: { item: PaymentSlip }) => (
    <TouchableOpacity
      style={g.card}
      activeOpacity={0.85}
      onPress={() => navigation.navigate('SlipDetail', { slipId: item.id })}
    >
      <View style={styles.rowBetween}>
        <Text style={styles.slipNo}>{item.slipNo}</Text>
        <View style={[styles.badge, { backgroundColor: item.status === 'FINAL' ? colors.successBg : colors.warningBg }]}>
          <Text style={{ color: item.status === 'FINAL' ? colors.success : colors.warning, fontWeight: '700', fontSize: 11 }}>
            {item.status}
          </Text>
        </View>
      </View>
      <Text style={styles.route}>
        {item.fromLocation || '—'} → {item.toLocation || '—'}
      </Text>
      <View style={styles.metaRow}>
        <Text style={styles.meta}>🚛 {item.truckNo || 'N/A'}</Text>
        <Text style={styles.meta}>{new Date(item.date || item.createdAt).toLocaleDateString()}</Text>
      </View>
      {isAdmin && !!item.createdBy && (
        <Text style={styles.creator}>Created by {creatorLabel(item)}</Text>
      )}
      <View style={styles.footer}>
        <Text style={styles.freight}>Freight {formatMoney(item.freight)}</Text>
        <Text style={styles.balance}>Balance {formatMoney(item.balance)}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={g.screen}>
      <View style={styles.searchWrap}>
        <TextInput
          style={styles.search}
          placeholder="Search slip no, truck, route, party…"
          placeholderTextColor={colors.muted}
          value={query}
          onChangeText={setQuery}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.xxl }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(s) => s.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: 96 }}
          ListEmptyComponent={
            <Text style={styles.empty}>{query ? 'No slips match your search.' : 'No slips yet. Tap + to create one.'}</Text>
          }
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('CreateSlip')} activeOpacity={0.9}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  searchWrap: { padding: spacing.lg, paddingBottom: 0 },
  search: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
  },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  slipNo: { fontSize: 17, fontWeight: '800', color: colors.primaryDark },
  badge: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.sm },
  route: { fontSize: 15, fontWeight: '600', color: colors.ink, marginTop: spacing.sm },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xs },
  meta: { color: colors.muted, fontSize: 13 },
  creator: { color: colors.primaryDark, fontSize: 12, fontWeight: '600', marginTop: spacing.xs },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  freight: { color: colors.text, fontWeight: '600' },
  balance: { color: colors.primary, fontWeight: '800' },
  empty: { textAlign: 'center', color: colors.muted, marginTop: spacing.xxl },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    width: 60,
    height: 60,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  fabText: { color: colors.white, fontSize: 34, fontWeight: '300', marginTop: -2 },
});
