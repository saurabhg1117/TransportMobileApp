import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User } from './types';

const TOKEN_KEY = 'token';
const USER_KEY = 'user';

export async function saveSession(token: string, user: User): Promise<void> {
  await AsyncStorage.multiSet([
    [TOKEN_KEY, token],
    [USER_KEY, JSON.stringify(user)],
  ]);
}

export async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function getStoredUser(): Promise<User | null> {
  const raw = await AsyncStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export async function updateStoredUser(user: User): Promise<void> {
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
}

export async function clearSession(): Promise<void> {
  await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
}
