import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Sharing from 'expo-sharing';
import { useFocusEffect } from '@react-navigation/native';
import api, { errorMessage } from '../api';
import { getStoredUser } from '../auth';
import CompanyHeader from '../components/CompanyHeader';
import FeedbackModal, { type FeedbackState } from '../components/FeedbackModal';
import { exportSlipPdf, printSlip } from '../printSlip';
import { colors, g, radius, spacing } from '../theme';
import { formatMoney } from '../slip';
import type { ScreenProps } from '../navigation';
import type { PaymentSlip, TransporterSettings } from '../types';

async function fetchSettings(current: TransporterSettings | null): Promise<TransporterSettings | null> {
  try {
    const res = await api.get('/settings');
    return res.data.settings as TransporterSettings;
  } catch {
    return current;
  }
}

export default function SlipDetailScreen({ navigation, route }: ScreenProps<'SlipDetail'>) {
  const { slipId } = route.params;
  const [slip, setSlip] = useState<PaymentSlip | null>(null);
  const [settings, setSettings] = useState<TransporterSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useFocusEffect(
    useCallback(() => {
      getStoredUser().then((user) => setIsAdmin(user?.role === 'SUPER_ADMIN'));
    }, []),
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [slipRes, settingsRes] = await Promise.allSettled([
        api.get(`/payment-slips/${slipId}`),
        api.get('/settings'),
      ]);

      if (slipRes.status === 'rejected') throw slipRes.reason;
      setSlip(slipRes.value.data.slip as PaymentSlip);

      if (settingsRes.status === 'fulfilled') {
        setSettings(settingsRes.value.data.settings as TransporterSettings);
      }
    } catch (err) {
      Alert.alert('Error', errorMessage(err));
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [slipId, navigation]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const print = async () => {
    if (!slip) return;
    try {
      const latestSettings = await fetchSettings(settings);
      if (latestSettings) setSettings(latestSettings);
      await printSlip(slip, latestSettings);
    } catch (err) {
      setFeedback({ kind: 'error', title: 'Print failed', message: errorMessage(err) });
    }
  };

  const sharePdf = async () => {
    if (!slip) return;
    setBusy(true);
    try {
      const latestSettings = await fetchSettings(settings);
      if (latestSettings) setSettings(latestSettings);
      const result = await exportSlipPdf(slip, latestSettings);
      if ('web' in result) {
        setFeedback({
          kind: 'success',
          title: 'PDF downloaded',
          message: `${result.filename} has been saved to your Downloads folder.`,
        });
      } else if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(result.uri, { mimeType: 'application/pdf', dialogTitle: `Slip ${slip.slipNo}` });
      } else {
        setFeedback({ kind: 'success', title: 'PDF saved', message: result.uri });
      }
    } catch (err) {
      setFeedback({ kind: 'error', title: 'Export failed', message: errorMessage(err) });
    } finally {
      setBusy(false);
    }
  };

  const remove = () => {
    if (!slip) return;
    Alert.alert('Delete slip', `Delete slip ${slip.slipNo}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/payment-slips/${slip.id}`);
            navigation.goBack();
          } catch (err) {
            Alert.alert('Error', errorMessage(err));
          }
        },
      },
    ]);
  };

  if (loading || !slip) {
    return (
      <View style={[g.screen, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const info = (label: string, value: string | number) => (
    <View style={styles.infoRow}>
      <Text style={styles.infoKey}>{label}</Text>
      <Text style={styles.infoVal}>{value === '' || value === undefined ? '—' : String(value)}</Text>
    </View>
  );

  const payRow = (label: string, value: number, strong = false) => (
    <View style={[styles.payRow, strong && styles.payRowStrong]}>
      <Text style={[styles.payLabel, strong && styles.payStrongText]}>{label}</Text>
      <Text style={[styles.payValue, strong && styles.payStrongText]}>{formatMoney(value)}</Text>
    </View>
  );

  return (
    <View style={g.screen}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 120 }}>
        <View style={g.card}>
          <CompanyHeader settings={settings} />
          <View style={styles.head}>
            <View style={{ flex: 1 }}>
              <Text style={styles.docTitle}>PAYMENT SLIP</Text>
              <Text style={styles.slipNo}>No: {slip.slipNo}</Text>
              <Text style={styles.date}>{new Date(slip.date || slip.createdAt).toLocaleDateString('en-IN')}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: slip.status === 'FINAL' ? colors.successBg : colors.warningBg }]}>
              <Text style={{ color: slip.status === 'FINAL' ? colors.success : colors.warning, fontWeight: '700', fontSize: 11 }}>
                {slip.status}
              </Text>
            </View>
          </View>
          <View style={styles.routeBox}>
            <Text style={styles.routeText}>{slip.fromLocation || '—'}</Text>
            <Text style={styles.arrow}>→</Text>
            <Text style={styles.routeText}>{slip.toLocation || '—'}</Text>
          </View>
          {isAdmin && slip.createdBy && (
            <Text style={styles.creator}>
              Created by {slip.createdBy.name} (@{slip.createdBy.username})
              {slip.createdBy.role === 'SUPER_ADMIN' ? ' · Admin' : ' · Driver'}
            </Text>
          )}
        </View>

        <View style={g.card}>
          <Text style={styles.section}>Vehicle & Documents</Text>
          {info('Truck No', slip.truckNo)}
          {info('GR No', slip.grNo)}
          {info('Invoice No', slip.invoiceNo)}
          {info('DO No', slip.doNo)}
        </View>

        <View style={g.card}>
          <Text style={styles.section}>Parties</Text>
          {info('Consignor', slip.consignor)}
          {info('Consignee', slip.consignee)}
          {info('Driver', slip.driverName)}
          {info('Owner', slip.ownerName)}
        </View>

        <View style={g.card}>
          <Text style={styles.section}>Cargo</Text>
          {info('Bags', slip.bags)}
          {info('Weight', slip.weight)}
          {info('Rate', slip.rate)}
        </View>

        <View style={g.card}>
          <Text style={styles.section}>Payment</Text>
          {payRow('Freight', slip.freight, true)}
          {payRow('Advance', slip.advance)}
          {payRow('Cash', slip.cash)}
          {payRow('Diesel', slip.diesel)}
          {payRow('Bank', slip.bank)}
          {payRow('Commission', slip.commission)}
          {payRow('Missing / Shortage', slip.missing)}
          {payRow('Balance Payable', slip.balance, true)}
        </View>

        {!!settings?.terms && (
          <View style={g.card}>
            <Text style={styles.section}>Terms & Conditions</Text>
            <Text style={styles.terms}>{settings.terms}</Text>
          </View>
        )}

        {!!settings?.footerText && (
          <Text style={styles.footer}>{settings.footerText}</Text>
        )}

        <View style={styles.actionsRow}>
          <TouchableOpacity style={[styles.action, { backgroundColor: colors.primary }]} onPress={print}>
            <Text style={styles.actionText}>🖨  Print</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.action, { backgroundColor: colors.accent }]} onPress={sharePdf} disabled={busy}>
            {busy ? <ActivityIndicator color={colors.white} /> : <Text style={styles.actionText}>📄  PDF / Share</Text>}
          </TouchableOpacity>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[g.buttonGhost, { flex: 1, marginRight: spacing.sm }]}
            onPress={() => navigation.navigate('CreateSlip', { slipId: slip.id })}
          >
            <Text style={g.buttonGhostText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.deleteBtn, { flex: 1 }]} onPress={remove}>
            <Text style={styles.deleteText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <FeedbackModal feedback={feedback} onClose={() => setFeedback(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'flex-start', marginTop: spacing.sm },
  docTitle: { fontSize: 14, fontWeight: '800', color: colors.primary, letterSpacing: 1 },
  slipNo: { fontSize: 15, fontWeight: '700', color: colors.ink, marginTop: 4 },
  date: { color: colors.muted, marginTop: 2, fontSize: 13 },
  badge: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.sm },
  routeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  routeText: { fontWeight: '800', color: colors.ink, fontSize: 15 },
  arrow: { marginHorizontal: spacing.md, color: colors.primary, fontSize: 18, fontWeight: '900' },
  creator: {
    color: colors.primaryDark,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: spacing.md,
  },
  section: { fontSize: 15, fontWeight: '800', color: colors.ink, marginBottom: spacing.sm },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.border },
  infoKey: { color: colors.muted },
  infoVal: { fontWeight: '600', color: colors.text, flexShrink: 1, textAlign: 'right', marginLeft: spacing.md },
  payRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  payRowStrong: { borderBottomWidth: 0, borderTopWidth: 2, borderTopColor: colors.primary, marginTop: 4 },
  payLabel: { color: colors.text },
  payValue: { fontWeight: '600', color: colors.text },
  payStrongText: { color: colors.primary, fontWeight: '900', fontSize: 16 },
  terms: { fontSize: 13, color: colors.muted, lineHeight: 20 },
  footer: { textAlign: 'center', color: colors.muted, fontSize: 12, marginBottom: spacing.md },
  actionsRow: { flexDirection: 'row', marginTop: spacing.sm },
  action: { flex: 1, paddingVertical: 14, borderRadius: radius.md, alignItems: 'center', marginRight: spacing.sm },
  actionText: { color: colors.white, fontWeight: '800', fontSize: 15 },
  deleteBtn: { backgroundColor: colors.dangerBg, paddingVertical: 14, borderRadius: radius.md, alignItems: 'center' },
  deleteText: { color: colors.danger, fontWeight: '700', fontSize: 15 },
});
