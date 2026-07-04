import React, { useEffect, useMemo, useState } from 'react';

import {

  ActivityIndicator,

  KeyboardAvoidingView,

  Platform,

  ScrollView,

  StyleSheet,

  Text,

  TextInput,

  TouchableOpacity,

  View,

} from 'react-native';

import api, { errorMessage } from '../api';

import FeedbackModal, { type FeedbackState } from '../components/FeedbackModal';

import SuggestInput from '../components/SuggestInput';

import { validateMandatorySlipFields, type SlipFieldKey } from '../lib/slipFields';

import { buildSuggestionMap, type SuggestionField, type SuggestionMap } from '../lib/slipSuggestions';

import { colors, g, radius, spacing } from '../theme';

import { computeBalance, formatMoney } from '../slip';

import type { ScreenProps } from '../navigation';

import type { PaymentSlip, TransporterSettings } from '../types';



type Form = Record<string, string>;



const TEXT_GROUPS: { title: string; fields: { key: SlipFieldKey; label: string; multiline?: boolean }[] }[] = [

  {

    title: 'Vehicle & Documents',

    fields: [

      { key: 'truckNo', label: 'Truck number' },

      { key: 'grNo', label: 'GR number' },

      { key: 'invoiceNo', label: 'Invoice number' },

      { key: 'doNo', label: 'DO number' },

    ],

  },

  {

    title: 'Parties',

    fields: [

      { key: 'consignor', label: 'Consignor' },

      { key: 'consignee', label: 'Consignee' },

    ],

  },

  {

    title: 'Route',

    fields: [

      { key: 'fromLocation', label: 'From' },

      { key: 'toLocation', label: 'To' },

    ],

  },

  {

    title: 'Driver',

    fields: [

      { key: 'driverName', label: 'Driver name' },

      { key: 'driverAddress', label: 'Driver address', multiline: true },

    ],

  },

  {

    title: 'Owner',

    fields: [

      { key: 'ownerName', label: 'Owner name' },

      { key: 'ownerAddress', label: 'Owner address', multiline: true },

    ],

  },

];



const CARGO_FIELDS: { key: SlipFieldKey; label: string }[] = [

  { key: 'bags', label: 'Bags' },

  { key: 'weight', label: 'Weight' },

  { key: 'rate', label: 'Rate' },

];



const PAYMENT_FIELDS: { key: SlipFieldKey; label: string }[] = [

  { key: 'freight', label: 'Freight' },

  { key: 'advance', label: 'Advance' },

  { key: 'cash', label: 'Cash' },

  { key: 'diesel', label: 'Diesel' },

  { key: 'bank', label: 'Bank' },

  { key: 'commission', label: 'Commission' },

  { key: 'missing', label: 'Missing / Shortage' },

];



const num = (v: string | undefined) => Number(v) || 0;



export default function CreateSlipScreen({ navigation, route }: ScreenProps<'CreateSlip'>) {

  const slipId = route.params?.slipId;

  const isEditing = !!slipId;



  const [form, setForm] = useState<Form>({});

  const [loading, setLoading] = useState(isEditing);

  const [saving, setSaving] = useState(false);

  const [suggestions, setSuggestions] = useState<SuggestionMap>(() => buildSuggestionMap([]));

  const [settings, setSettings] = useState<TransporterSettings | null>(null);

  const [feedback, setFeedback] = useState<FeedbackState | null>(null);



  const mandatory = useMemo(() => new Set(settings?.mandatorySlipFields ?? []), [settings]);

  const isRequired = (key: string) => mandatory.has(key);



  useEffect(() => {

    (async () => {

      try {

        const [slipsRes, settingsRes] = await Promise.all([

          api.get('/payment-slips'),

          api.get('/settings'),

        ]);

        setSuggestions(buildSuggestionMap(slipsRes.data.slips as PaymentSlip[]));

        setSettings(settingsRes.data.settings as TransporterSettings);

      } catch {

        // Optional helpers; form still works without them.

      }

    })();

  }, []);



  useEffect(() => {

    navigation.setOptions({ title: isEditing ? 'Edit Slip' : 'Create Slip' });

    if (!slipId) return;

    (async () => {

      try {

        const res = await api.get(`/payment-slips/${slipId}`);

        const s = res.data.slip as PaymentSlip;

        const next: Form = {};

        Object.entries(s).forEach(([k, v]) => {

          next[k] = v === null || v === undefined ? '' : String(v);

        });

        setForm(next);

      } catch (err) {

        setFeedback({ kind: 'error', title: 'Error', message: errorMessage(err) });

        navigation.goBack();

      } finally {

        setLoading(false);

      }

    })();

  }, [slipId, isEditing, navigation]);



  const set = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));



  const balance = useMemo(

    () =>

      computeBalance({

        freight: num(form.freight),

        advance: num(form.advance),

        cash: num(form.cash),

        diesel: num(form.diesel),

        bank: num(form.bank),

        commission: num(form.commission),

        missing: num(form.missing),

      }),

    [form],

  );



  const save = async () => {

    const validationError = validateMandatorySlipFields(settings?.mandatorySlipFields ?? [], { ...form });

    if (validationError) {

      setFeedback({ kind: 'error', title: 'Required fields', message: validationError });

      return;

    }



    setSaving(true);

    try {

      const payload: Record<string, unknown> = { ...form };

      delete payload.balance;

      if (!isEditing && !form.slipNo) delete payload.slipNo;



      let saved: PaymentSlip;

      if (isEditing) {

        const res = await api.put(`/payment-slips/${slipId}`, payload);

        saved = res.data.slip as PaymentSlip;

      } else {

        const res = await api.post('/payment-slips', payload);

        saved = res.data.slip as PaymentSlip;

      }

      navigation.replace('SlipDetail', { slipId: saved.id });

    } catch (err) {

      setFeedback({ kind: 'error', title: 'Error', message: errorMessage(err) });

    } finally {

      setSaving(false);

    }

  };



  if (loading) {

    return (

      <View style={[g.screen, { justifyContent: 'center' }]}>

        <ActivityIndicator size="large" color={colors.primary} />

      </View>

    );

  }



  const suggestInput = (key: SuggestionField, label: string, multiline?: boolean) => (

    <SuggestInput

      key={key}

      label={label}

      value={form[key] ?? ''}

      onChangeText={(v) => set(key, v)}

      suggestions={suggestions[key]}

      multiline={multiline}

      placeholder={label}

      required={isRequired(key)}

    />

  );



  const numberInput = (key: SlipFieldKey, label: string) => (

    <View key={key} style={styles.half}>

      <Text style={g.label}>

        {label}

        {isRequired(key) ? <Text style={styles.required}> *</Text> : null}

      </Text>

      <TextInput

        style={g.input}

        value={form[key] ?? ''}

        onChangeText={(v) => set(key, v.replace(/[^0-9.]/g, ''))}

        keyboardType="numeric"

        placeholder="0"

        placeholderTextColor={colors.muted}

      />

    </View>

  );



  return (

    <>

      <KeyboardAvoidingView style={g.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 120 }} keyboardShouldPersistTaps="handled">

          {mandatory.size > 0 && (

            <Text style={styles.requiredHint}>Fields marked with * are required by your transporter.</Text>

          )}



          <View style={g.card}>

            <Text style={styles.section}>General</Text>

            <Text style={g.label}>Slip number {isEditing ? '' : '(leave blank to auto-generate)'}</Text>

            <TextInput

              style={[g.input, isEditing && { backgroundColor: colors.bg, color: colors.muted }]}

              value={form.slipNo ?? ''}

              onChangeText={(v) => set('slipNo', v)}

              editable={!isEditing}

              placeholder="Auto"

              placeholderTextColor={colors.muted}

            />

          </View>



          {TEXT_GROUPS.map((group) => (

            <View style={g.card} key={group.title}>

              <Text style={styles.section}>{group.title}</Text>

              {group.fields.map((f) => suggestInput(f.key as SuggestionField, f.label, f.multiline))}

            </View>

          ))}



          <View style={g.card}>

            <Text style={styles.section}>Cargo</Text>

            <View style={styles.grid}>{CARGO_FIELDS.map((f) => numberInput(f.key, f.label))}</View>

          </View>



          <View style={g.card}>

            <Text style={styles.section}>Payment</Text>

            <View style={styles.grid}>{PAYMENT_FIELDS.map((f) => numberInput(f.key, f.label))}</View>

            <View style={styles.balanceBox}>

              <Text style={styles.balanceLabel}>Balance Payable</Text>

              <Text style={styles.balanceValue}>{formatMoney(balance)}</Text>

            </View>

            <Text style={styles.hint}>Auto-calculated: freight − (advance + cash + diesel + bank + commission + missing)</Text>

          </View>



          <TouchableOpacity style={g.button} onPress={save} disabled={saving}>

            {saving ? <ActivityIndicator color={colors.white} /> : <Text style={g.buttonText}>{isEditing ? 'Save Slip' : 'Create Slip'}</Text>}

          </TouchableOpacity>

        </ScrollView>

      </KeyboardAvoidingView>

      <FeedbackModal feedback={feedback} onClose={() => setFeedback(null)} />

    </>

  );

}



const styles = StyleSheet.create({

  section: { fontSize: 16, fontWeight: '800', color: colors.ink, marginBottom: spacing.md },

  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },

  half: { width: '48%' },

  required: { color: colors.danger, fontWeight: '800' },

  requiredHint: { color: colors.muted, fontSize: 13, marginBottom: spacing.md, paddingHorizontal: spacing.xs },

  balanceBox: {

    flexDirection: 'row',

    justifyContent: 'space-between',

    alignItems: 'center',

    backgroundColor: colors.primaryLight,

    borderRadius: radius.md,

    padding: spacing.md,

    marginTop: spacing.sm,

  },

  balanceLabel: { color: colors.primaryDark, fontWeight: '700', fontSize: 15 },

  balanceValue: { color: colors.primaryDark, fontWeight: '900', fontSize: 20 },

  hint: { color: colors.muted, fontSize: 11, marginTop: spacing.sm },

});


