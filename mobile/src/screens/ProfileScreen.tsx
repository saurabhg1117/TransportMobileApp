import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import api, { errorMessage } from '../api';
import { clearSession, getStoredUser } from '../auth';
import ConfirmModal from '../components/ConfirmModal';
import { colors, g, radius, spacing } from '../theme';
import type { ScreenProps } from '../navigation';
import type { User } from '../types';

export default function ProfileScreen({ navigation }: ScreenProps<'Profile'>) {
  const [user, setUser] = useState<User | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [logoutConfirm, setLogoutConfirm] = useState(false);

  useEffect(() => {
    getStoredUser().then(setUser);
  }, []);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      Alert.alert('Missing details', 'Enter your current and new password.');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Weak password', 'New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirm) {
      Alert.alert('Mismatch', 'New password and confirmation do not match.');
      return;
    }
    setSaving(true);
    try {
      await api.post('/auth/change-password', { currentPassword, newPassword });
      Alert.alert('Success', 'Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirm('');
    } catch (err) {
      Alert.alert('Error', errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => setLogoutConfirm(true);

  const confirmLogout = async () => {
    setLogoutConfirm(false);
    await clearSession();
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  return (
    <ScrollView style={g.screen} contentContainerStyle={{ padding: spacing.lg }}>
      <View style={g.card}>
        <View style={styles.avatarRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(user?.name || '?').charAt(0).toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{user?.name ?? '—'}</Text>
            <Text style={g.subtitle}>@{user?.username ?? '—'}</Text>
            <View style={[styles.roleBadge, { backgroundColor: colors.primaryLight }]}>
              <Text style={{ color: colors.primaryDark, fontWeight: '700', fontSize: 11 }}>
                {user?.role === 'SUPER_ADMIN' ? 'SUPER ADMIN' : 'DRIVER'}
              </Text>
            </View>
          </View>
        </View>
        {!!user?.mobile && <Text style={styles.meta}>Mobile: {user.mobile}</Text>}
      </View>

      <View style={g.card}>
        <Text style={[g.title, { fontSize: 18, marginBottom: spacing.md }]}>Change Password</Text>
        <Text style={g.label}>Current password</Text>
        <TextInput
          style={g.input}
          value={currentPassword}
          onChangeText={setCurrentPassword}
          secureTextEntry
          placeholder="Current password"
          placeholderTextColor={colors.muted}
        />
        <Text style={g.label}>New password</Text>
        <TextInput
          style={g.input}
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
          placeholder="At least 6 characters"
          placeholderTextColor={colors.muted}
        />
        <Text style={g.label}>Confirm new password</Text>
        <TextInput
          style={g.input}
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry
          placeholder="Re-enter new password"
          placeholderTextColor={colors.muted}
        />
        <TouchableOpacity style={g.button} onPress={handleChangePassword} disabled={saving}>
          {saving ? <ActivityIndicator color={colors.white} /> : <Text style={g.buttonText}>Update Password</Text>}
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logout} onPress={handleLogout}>
        <Text style={styles.logoutText}>Log out</Text>
      </TouchableOpacity>

      <ConfirmModal
        visible={logoutConfirm}
        title="Log out"
        message="Are you sure you want to log out?"
        confirmLabel="Log out"
        destructive
        onCancel={() => setLogoutConfirm(false)}
        onConfirm={confirmLogout}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  avatarRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarText: { color: colors.white, fontSize: 24, fontWeight: '800' },
  name: { fontSize: 20, fontWeight: '800', color: colors.ink },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
    marginTop: spacing.xs,
  },
  meta: { color: colors.text, marginTop: spacing.md },
  logout: {
    backgroundColor: colors.dangerBg,
    paddingVertical: 15,
    borderRadius: radius.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  logoutText: { color: colors.danger, fontWeight: '700', fontSize: 16 },
});
