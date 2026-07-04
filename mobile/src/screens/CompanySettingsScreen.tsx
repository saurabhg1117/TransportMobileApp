import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import api, { errorMessage } from '../api';
import FeedbackModal, { type FeedbackState } from '../components/FeedbackModal';
import { colors, g, spacing } from '../theme';
import { SLIP_FIELD_GROUPS, SLIP_FIELD_LABELS, type SlipFieldKey } from '../lib/slipFields';
import type { ScreenProps } from '../navigation';
import type { TransporterSettings } from '../types';

type Editable = Omit<TransporterSettings, 'id' | 'slipCounter' | 'updatedAt'>;

export default function CompanySettingsScreen(_props: ScreenProps<'CompanySettings'>) {
  const [settings, setSettings] = useState<TransporterSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/settings');
        setSettings(res.data.settings as TransporterSettings);
      } catch (err) {
        setFeedback({ kind: 'error', title: 'Error', message: errorMessage(err) });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const set = <K extends keyof TransporterSettings>(key: K, value: TransporterSettings[K]) => {
    setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const save = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const payload = {
        companyName: settings.companyName,
        ownerName: settings.ownerName,
        mobile: settings.mobile,
        alternateMobile: settings.alternateMobile,
        gst: settings.gst,
        pan: settings.pan,
        officeAddress: settings.officeAddress,
        city: settings.city,
        district: settings.district,
        state: settings.state,
        pin: settings.pin,
        logoUrl: settings.logoUrl,
        headerText: settings.headerText,
        footerText: settings.footerText,
        slipPrefix: settings.slipPrefix,
        paperSize: settings.paperSize,
        autoNumber: settings.autoNumber,
        terms: settings.terms,
        mandatorySlipFields: settings.mandatorySlipFields ?? [],
      };
      const res = await api.put('/settings', payload);
      setSettings(res.data.settings as TransporterSettings);
      setFeedback({
        kind: 'success',
        title: 'Saved',
        message: 'Company settings have been saved successfully.',
      });
    } catch (err) {
      setFeedback({ kind: 'error', title: 'Error', message: errorMessage(err) });
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return (
      <View style={[g.screen, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const toggleMandatory = (key: SlipFieldKey) => {
    setSettings((prev) => {
      if (!prev) return prev;
      const list = prev.mandatorySlipFields ?? [];
      const next = list.includes(key) ? list.filter((k) => k !== key) : [...list, key];
      return { ...prev, mandatorySlipFields: next };
    });
  };

  const field = (
    key: keyof Editable,
    label: string,
    opts: { keyboard?: 'default' | 'phone-pad' | 'numeric'; multiline?: boolean; placeholder?: string } = {},
  ) => (
    <View>
      <Text style={g.label}>{label}</Text>
      <TextInput
        style={[g.input, opts.multiline && { height: 90, textAlignVertical: 'top' }]}
        value={String(settings[key] ?? '')}
        onChangeText={(v) => set(key, v as never)}
        keyboardType={opts.keyboard ?? 'default'}
        multiline={opts.multiline}
        placeholder={opts.placeholder ?? label}
        placeholderTextColor={colors.muted}
      />
    </View>
  );

  return (
    <>
    <ScrollView style={g.screen} contentContainerStyle={{ padding: spacing.lg, paddingBottom: 48 }}>
      <View style={g.card}>
        <Text style={styles.section}>Company Information</Text>
        {field('companyName', 'Transporter name')}
        {field('ownerName', 'Owner name')}
        {field('mobile', 'Mobile number', { keyboard: 'phone-pad' })}
        {field('alternateMobile', 'Alternate mobile number', { keyboard: 'phone-pad' })}
        {field('gst', 'GST number')}
        {field('pan', 'PAN')}
      </View>

      <View style={g.card}>
        <Text style={styles.section}>Address</Text>
        {field('officeAddress', 'Office address', { multiline: true })}
        {field('city', 'City')}
        {field('district', 'District')}
        {field('state', 'State')}
        {field('pin', 'PIN code', { keyboard: 'numeric' })}
      </View>

      <View style={g.card}>
        <Text style={styles.section}>Branding</Text>
        {field('logoUrl', 'Logo URL', { placeholder: 'https://...' })}
        {field('headerText', 'Header text')}
        {field('footerText', 'Footer text')}
      </View>

      <View style={g.card}>
        <Text style={styles.section}>Slip Configuration</Text>
        {field('slipPrefix', 'Slip number prefix', { placeholder: 'e.g. TPS-' })}
        {field('paperSize', 'Paper size', { placeholder: 'A4 or A5' })}
        <View style={styles.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: '700', color: colors.ink }}>Auto slip numbering</Text>
            <Text style={g.subtitle}>Generate slip numbers automatically</Text>
          </View>
          <Switch
            value={settings.autoNumber}
            onValueChange={(v) => set('autoNumber', v)}
            trackColor={{ true: colors.primary, false: colors.border }}
          />
        </View>
        <Text style={styles.counter}>Next number will follow #{settings.slipCounter}</Text>
      </View>

      <View style={g.card}>
        <Text style={styles.section}>Mandatory Slip Fields</Text>
        <Text style={[g.subtitle, { marginBottom: spacing.md }]}>
          Choose which fields drivers must fill when creating a payment slip.
        </Text>
        {SLIP_FIELD_GROUPS.map((group) => (
          <View key={group.title} style={styles.mandatoryGroup}>
            <Text style={styles.mandatoryGroupTitle}>{group.title}</Text>
            {group.keys.map((key) => {
              const on = (settings.mandatorySlipFields ?? []).includes(key);
              return (
                <View key={key} style={styles.switchRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.mandatoryLabel}>{SLIP_FIELD_LABELS[key]}</Text>
                  </View>
                  <Switch
                    value={on}
                    onValueChange={() => toggleMandatory(key)}
                    trackColor={{ true: colors.primary, false: colors.border }}
                  />
                </View>
              );
            })}
          </View>
        ))}
      </View>

      <View style={g.card}>
        <Text style={styles.section}>Terms & Conditions</Text>
        {field('terms', 'Terms shown on slips', { multiline: true })}
      </View>

      <TouchableOpacity style={g.button} onPress={save} disabled={saving}>
        {saving ? <ActivityIndicator color={colors.white} /> : <Text style={g.buttonText}>Save Settings</Text>}
      </TouchableOpacity>
    </ScrollView>
    <FeedbackModal feedback={feedback} onClose={() => setFeedback(null)} />
    </>
  );
}

const styles = StyleSheet.create({
  section: { fontSize: 16, fontWeight: '800', color: colors.ink, marginBottom: spacing.md },
  switchRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm },
  counter: { color: colors.muted, fontSize: 12, marginTop: spacing.xs },
  mandatoryGroup: { marginBottom: spacing.md },
  mandatoryGroupTitle: { fontSize: 13, fontWeight: '800', color: colors.primaryDark, marginBottom: spacing.xs },
  mandatoryLabel: { fontWeight: '600', color: colors.text, fontSize: 15 },
});
