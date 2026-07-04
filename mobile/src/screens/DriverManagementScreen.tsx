import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api, { errorMessage } from '../api';
import { colors, g, radius, spacing } from '../theme';
import type { ScreenProps } from '../navigation';
import type { User } from '../types';

interface FormState {
  id?: string;
  name: string;
  username: string;
  password: string;
  mobile: string;
}

const EMPTY: FormState = { name: '', username: '', password: '', mobile: '' };

export default function DriverManagementScreen(_props: ScreenProps<'DriverManagement'>) {
  const [drivers, setDrivers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);

  const isEditing = !!form.id;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/drivers');
      setDrivers(res.data.drivers as User[]);
    } catch (err) {
      Alert.alert('Error', errorMessage(err, 'Failed to load drivers.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const openCreate = () => {
    setForm(EMPTY);
    setModalOpen(true);
  };

  const openEdit = (d: User) => {
    setForm({ id: d.id, name: d.name, username: d.username, password: '', mobile: d.mobile });
    setModalOpen(true);
  };

  const save = async () => {
    if (!form.name.trim() || (!isEditing && (!form.username.trim() || !form.password))) {
      Alert.alert('Missing details', 'Name, username and password are required.');
      return;
    }
    setSaving(true);
    try {
      if (isEditing) {
        const payload: Record<string, string> = { name: form.name, mobile: form.mobile };
        if (form.password) payload.password = form.password;
        await api.put(`/drivers/${form.id}`, payload);
      } else {
        await api.post('/drivers', {
          name: form.name,
          username: form.username.trim(),
          password: form.password,
          mobile: form.mobile,
        });
      }
      setModalOpen(false);
      setForm(EMPTY);
      load();
    } catch (err) {
      Alert.alert('Error', errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const toggleAccess = async (d: User) => {
    try {
      await api.patch(`/drivers/${d.id}/access`, { grant: d.status !== 'ACTIVE' });
      load();
    } catch (err) {
      Alert.alert('Error', errorMessage(err));
    }
  };

  const remove = (d: User) => {
    Alert.alert('Delete driver', `Delete ${d.name}? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/drivers/${d.id}`);
            load();
          } catch (err) {
            Alert.alert('Error', errorMessage(err));
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: User }) => {
    const active = item.status === 'ACTIVE';
    return (
      <View style={g.card}>
        <View style={styles.rowBetween}>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={g.subtitle}>@{item.username}</Text>
            {!!item.mobile && <Text style={styles.meta}>{item.mobile}</Text>}
          </View>
          <View style={[styles.badge, { backgroundColor: active ? colors.successBg : colors.dangerBg }]}>
            <Text style={{ color: active ? colors.success : colors.danger, fontWeight: '700', fontSize: 11 }}>
              {active ? 'ACTIVE' : 'REVOKED'}
            </Text>
          </View>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.primaryLight }]} onPress={() => openEdit(item)}>
            <Text style={[styles.actionText, { color: colors.primaryDark }]}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: active ? colors.warningBg : colors.successBg }]}
            onPress={() => toggleAccess(item)}
          >
            <Text style={[styles.actionText, { color: active ? colors.warning : colors.success }]}>
              {active ? 'Revoke' : 'Grant'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.dangerBg }]} onPress={() => remove(item)}>
            <Text style={[styles.actionText, { color: colors.danger }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={g.screen}>
      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.xxl }} />
      ) : (
        <FlatList
          data={drivers}
          keyExtractor={(d) => d.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: 96 }}
          ListEmptyComponent={<Text style={styles.empty}>No drivers yet. Tap + to add one.</Text>}
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={openCreate} activeOpacity={0.9}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <Modal visible={modalOpen} animationType="slide" onRequestClose={() => setModalOpen(false)}>
        <ScrollView style={{ flex: 1, backgroundColor: colors.card }} contentContainerStyle={{ padding: spacing.xl }}>
          <Text style={[g.title, { marginBottom: spacing.lg }]}>{isEditing ? 'Edit Driver' : 'New Driver'}</Text>

          <Text style={g.label}>Driver name *</Text>
          <TextInput style={g.input} value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} placeholder="Full name" placeholderTextColor={colors.muted} />

          <Text style={g.label}>Login username {isEditing ? '(cannot change)' : '*'}</Text>
          <TextInput
            style={[g.input, isEditing && { backgroundColor: colors.bg, color: colors.muted }]}
            value={form.username}
            onChangeText={(v) => setForm({ ...form, username: v })}
            placeholder="e.g. ravi"
            placeholderTextColor={colors.muted}
            autoCapitalize="none"
            editable={!isEditing}
          />

          <Text style={g.label}>{isEditing ? 'Reset password (optional)' : 'Password *'}</Text>
          <TextInput
            style={g.input}
            value={form.password}
            onChangeText={(v) => setForm({ ...form, password: v })}
            placeholder={isEditing ? 'Leave blank to keep current' : 'At least 6 characters'}
            placeholderTextColor={colors.muted}
            secureTextEntry
          />

          <Text style={g.label}>Mobile</Text>
          <TextInput style={g.input} value={form.mobile} onChangeText={(v) => setForm({ ...form, mobile: v })} placeholder="Mobile number" placeholderTextColor={colors.muted} keyboardType="phone-pad" />

          <TouchableOpacity style={g.button} onPress={save} disabled={saving}>
            {saving ? <ActivityIndicator color={colors.white} /> : <Text style={g.buttonText}>{isEditing ? 'Save Changes' : 'Create Driver'}</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={[g.buttonGhost, { marginTop: spacing.md }]} onPress={() => setModalOpen(false)}>
            <Text style={g.buttonGhostText}>Cancel</Text>
          </TouchableOpacity>
        </ScrollView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  rowBetween: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  name: { fontSize: 17, fontWeight: '800', color: colors.ink },
  meta: { color: colors.text, marginTop: 2 },
  badge: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.sm },
  actions: { flexDirection: 'row', marginTop: spacing.md },
  actionBtn: { flex: 1, paddingVertical: 10, borderRadius: radius.sm, alignItems: 'center', marginRight: spacing.sm },
  actionText: { fontWeight: '700', fontSize: 13 },
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
