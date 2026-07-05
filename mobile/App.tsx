import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import api from './src/api';
import { getToken } from './src/auth';
import { applyRemoteUpdates } from './src/updates';
import { colors } from './src/theme';
import type { RootStackParamList } from './src/navigation';

import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import DriverManagementScreen from './src/screens/DriverManagementScreen';
import CompanySettingsScreen from './src/screens/CompanySettingsScreen';
import SlipListScreen from './src/screens/SlipListScreen';
import CreateSlipScreen from './src/screens/CreateSlipScreen';
import SlipDetailScreen from './src/screens/SlipDetailScreen';
import ProfileScreen from './src/screens/ProfileScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

const navHeader = {
  headerStyle: { backgroundColor: colors.primary },
  headerTintColor: colors.white,
  headerTitleStyle: { fontWeight: '700' as const },
};

export default function App() {
  const [loading, setLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList>('Login');

  useEffect(() => {
    (async () => {
      try {
        await applyRemoteUpdates();

        const token = await getToken();
        if (token) {
          // Validate the stored token; if valid, skip the login screen.
          await api.get('/auth/me');
          setInitialRoute('Dashboard');
        }
      } catch {
        // Invalid/expired token -> stay on Login.
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <NavigationContainer>
        <Stack.Navigator initialRouteName={initialRoute} screenOptions={navHeader}>
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen
            name="Dashboard"
            component={DashboardScreen}
            options={{ title: 'Dashboard', headerBackVisible: false }}
          />
          <Stack.Screen
            name="DriverManagement"
            component={DriverManagementScreen}
            options={{ title: 'Driver Management' }}
          />
          <Stack.Screen
            name="CompanySettings"
            component={CompanySettingsScreen}
            options={{ title: 'Company Settings' }}
          />
          <Stack.Screen name="SlipList" component={SlipListScreen} options={{ title: 'Payment Slips' }} />
          <Stack.Screen name="CreateSlip" component={CreateSlipScreen} options={{ title: 'Payment Slip' }} />
          <Stack.Screen name="SlipDetail" component={SlipDetailScreen} options={{ title: 'Slip Preview' }} />
          <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
