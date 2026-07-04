import React, { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api, { errorMessage } from '../api';
import { getStoredUser } from '../auth';
import { colors, g, radius, shadow, spacing } from '../theme';
import type { ScreenProps } from '../navigation';
import type { PaymentSlip, TransporterSettings, User } from '../types';

interface Tile {
  key: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  onPress: () => void;
}

export default function DashboardScreen({ navigation }: ScreenProps<'Dashboard'>) {
  const [user, setUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<TransporterSettings | null>(null);
  const [slipCount, setSlipCount] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const isAdmin = user?.role === 'SUPER_ADMIN';

  const load = useCallback(async () => {
    try {
      const stored = await getStoredUser();
      setUser(stored);
      const [settingsRes, slipsRes] = await Promise.all([
        api.get('/settings').catch(() => null),
        api.get('/payment-slips').catch(() => null),
      ]);
      if (settingsRes) setSettings(settingsRes.data.settings as TransporterSettings);
      if (slipsRes) setSlipCount((slipsRes.data.slips as PaymentSlip[]).length);
    } catch (err) {
      console.warn(errorMessage(err));
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const tiles: Tile[] = [
    {
      key: 'create',
      title: 'Create Slip',
      subtitle: 'New payment slip',
      icon: '+',
      color: colors.primary,
      onPress: () => navigation.navigate('CreateSlip'),
    },
    {
      key: 'slips',
      title: 'Payment Slips',
      subtitle: isAdmin ? 'All records' : 'Your records',
      icon: '≡',
      color: colors.accent,
      onPress: () => navigation.navigate('SlipList'),
    },
  ];

  if (isAdmin) {
    tiles.push(
      {
        key: 'drivers',
        title: 'Drivers',
        subtitle: 'Manage accounts',
        icon: '◎',
        color: colors.success,
        onPress: () => navigation.navigate('DriverManagement'),
      },
      {
        key: 'settings',
        title: 'Company',
        subtitle: 'Branding & config',
        icon: '⚙',
        color: colors.primaryDark,
        onPress: () => navigation.navigate('CompanySettings'),
      },
    );
  }

  tiles.push({
    key: 'profile',
    title: 'Profile',
    subtitle: 'Account & logout',
    icon: '☺',
    color: colors.muted,
    onPress: () => navigation.navigate('Profile'),
  });

  return (
    <ScrollView
      style={g.screen}
      contentContainerStyle={{ padding: spacing.lg }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.hero}>
        <Text style={styles.company}>{settings?.companyName || 'Set up your company →'}</Text>
        <Text style={styles.greeting}>Hello, {user?.name?.split(' ')[0] ?? 'there'}</Text>
        <View style={styles.statRow}>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{slipCount ?? '—'}</Text>
            <Text style={styles.statLabel}>{isAdmin ? 'Total slips' : 'Your slips'}</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{isAdmin ? 'Admin' : 'Driver'}</Text>
            <Text style={styles.statLabel}>Role</Text>
          </View>
        </View>
      </View>

      <View style={styles.grid}>
        {tiles.map((t) => (
          <TouchableOpacity key={t.key} style={styles.tile} onPress={t.onPress} activeOpacity={0.85}>
            <View style={[styles.tileIcon, { backgroundColor: t.color }]}>
              <Text style={styles.tileIconText}>{t.icon}</Text>
            </View>
            <Text style={styles.tileTitle}>{t.title}</Text>
            <Text style={styles.tileSub}>{t.subtitle}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: colors.primaryDark,
    borderRadius: radius.lg,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    ...shadow,
  },
  company: { color: colors.primaryLight, fontSize: 13, fontWeight: '600', marginBottom: 4 },
  greeting: { color: colors.white, fontSize: 26, fontWeight: '900' },
  statRow: { flexDirection: 'row', marginTop: spacing.lg },
  stat: { marginRight: spacing.xxl },
  statNum: { color: colors.white, fontSize: 22, fontWeight: '800' },
  statLabel: { color: colors.primaryLight, fontSize: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  tile: {
    width: '48%',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadow,
  },
  tileIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  tileIconText: { color: colors.white, fontSize: 22, fontWeight: '900' },
  tileTitle: { fontSize: 16, fontWeight: '800', color: colors.ink },
  tileSub: { fontSize: 12, color: colors.muted, marginTop: 2 },
});
