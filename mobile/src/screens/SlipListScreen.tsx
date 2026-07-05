import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { errorMessage, getWithRetry } from '../api';
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
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const loadedOnceRef = useRef(false);

  useEffect(() => {
    getStoredUser().then((user) => setIsAdmin(user?.role === 'SUPER_ADMIN'));
  }, []);

  const load = useCallback(async (pull = false) => {
    if (pull) {
      setRefreshing(true);
    } else if (!loadedOnceRef.current) {
      setLoading(true);
    }

    try {
      const data = await getWithRetry<{ slips: PaymentSlip[] }>('/payment-slips');
      const list = [...data.slips].sort((a, b) =>
        (b.createdAt || '').localeCompare(a.createdAt || ''),
      );
      setSlips(list);
      setError(null);
      loadedOnceRef.current = true;
    } catch (err) {
      const msg = errorMessage(err, 'Could not load payment slips.');
      console.warn(msg);
      if (!loadedOnceRef.current) setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
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

  const emptyMessage = () => {
    if (error) {
      return (
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>Could not load slips</Text>
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.errorHint}>The server may be waking up. Pull down to refresh or tap below.</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => load(true)} activeOpacity={0.85}>
            <Text style={styles.retryBtnText}>Try again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    if (query) {
      return <Text style={styles.empty}>No slips match your search.</Text>;
    }
    return <Text style={styles.empty}>No slips yet. Tap + to create one.</Text>;
  };

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

      {loading && slips.length === 0 ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingHint}>Loading slips…</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(s) => s.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: 96, flexGrow: 1 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load(true)}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={emptyMessage}
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
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.md },
  loadingHint: { color: colors.muted, fontSize: 14 },
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
  errorBox: {
    marginTop: spacing.xl,
    padding: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  errorTitle: { fontSize: 16, fontWeight: '700', color: colors.ink, textAlign: 'center' },
  errorText: { color: colors.muted, textAlign: 'center', marginTop: spacing.sm, lineHeight: 20 },
  errorHint: { color: colors.muted, textAlign: 'center', marginTop: spacing.sm, fontSize: 13 },
  retryBtn: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  retryBtnText: { color: colors.white, fontWeight: '700', fontSize: 15 },
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
