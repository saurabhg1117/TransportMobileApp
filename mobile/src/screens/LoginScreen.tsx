import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { saveSession } from '../auth';
import { colors, g, radius, spacing } from '../theme';
import type { ScreenProps } from '../navigation';
import type { User } from '../types';

export default function LoginScreen({ navigation }: ScreenProps<'Login'>) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password) {
      Alert.alert('Missing details', 'Please enter your username and password.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { username: username.trim(), password });
      const { token, user } = res.data as { token: string; user: User };
      await saveSession(token, user);
      navigation.reset({ index: 0, routes: [{ name: 'Dashboard' }] });
    } catch (err) {
      Alert.alert('Login failed', errorMessage(err, 'Invalid credentials.'));
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async () => {
    if (!username.trim()) {
      Alert.alert('Enter username', 'Type your username first, then tap Forgot Password.');
      return;
    }
    try {
      const res = await api.post('/auth/forgot-password', { username: username.trim() });
      Alert.alert('Request sent', res.data?.message ?? 'Your administrator has been notified.');
    } catch (err) {
      Alert.alert('Error', errorMessage(err));
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.primaryDark }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.brand}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoText}>TP</Text>
          </View>
          <Text style={styles.appName}>TPSMS</Text>
          <Text style={styles.tagline}>Transport Payment Slip Management</Text>
        </View>

        <View style={styles.card}>
          <Text style={g.title}>Sign in</Text>
          <Text style={[g.subtitle, { marginBottom: spacing.lg }]}>
            Use the credentials provided by your transporter.
          </Text>

          <Text style={g.label}>Username</Text>
          <TextInput
            style={g.input}
            placeholder="e.g. ravi"
            placeholderTextColor={colors.muted}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={g.label}>Password</Text>
          <TextInput
            style={g.input}
            placeholder="Your password"
            placeholderTextColor={colors.muted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity style={g.button} onPress={handleLogin} disabled={loading}>
            {loading ? <ActivityIndicator color={colors.white} /> : <Text style={g.buttonText}>Sign In</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={handleForgot} style={{ marginTop: spacing.lg, alignItems: 'center' }}>
            <Text style={{ color: colors.primary, fontWeight: '600' }}>Forgot password?</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>Contact your administrator to create an account.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, justifyContent: 'center', padding: spacing.xl },
  brand: { alignItems: 'center', marginBottom: spacing.xl },
  logoBadge: {
    width: 72,
    height: 72,
    borderRadius: radius.lg,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  logoText: { color: colors.ink, fontSize: 28, fontWeight: '900' },
  appName: { color: colors.white, fontSize: 30, fontWeight: '900', letterSpacing: 1 },
  tagline: { color: colors.primaryLight, fontSize: 13, marginTop: 4 },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.xl,
  },
  footer: { color: colors.primaryLight, textAlign: 'center', marginTop: spacing.xl, fontSize: 12 },
});
