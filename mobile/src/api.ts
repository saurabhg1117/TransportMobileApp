import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from './config';

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/** Pull a human-friendly message out of an axios error. */
export function errorMessage(err: unknown, fallback = 'Something went wrong.'): string {
  if (axios.isAxiosError(err)) {
    if (err.response?.data?.error) return String(err.response.data.error);
    if (err.code === 'ECONNABORTED') return 'Request timed out. Is the server reachable?';
    if (!err.response) return 'Cannot reach the server. Check your network / API URL.';
  }
  return fallback;
}

export default api;
