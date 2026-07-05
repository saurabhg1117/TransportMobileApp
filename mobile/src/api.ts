import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from './config';

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});

/** Longer timeout for Google Sheets–backed list endpoints (cold start + multiple sheet reads). */
export const LIST_REQUEST_TIMEOUT_MS = 45000;

/**
 * GET with automatic retry — helps when Belmo cold-starts or Sheets is slow.
 */
export async function getWithRetry<T>(
  url: string,
  options?: { timeout?: number; retries?: number },
): Promise<T> {
  const timeout = options?.timeout ?? LIST_REQUEST_TIMEOUT_MS;
  const maxAttempts = (options?.retries ?? 1) + 1;
  let lastErr: unknown;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const res = await api.get<T>(url, { timeout });
      return res.data;
    } catch (err) {
      lastErr = err;
      if (attempt < maxAttempts - 1) {
        await new Promise((r) => setTimeout(r, 1500));
      }
    }
  }
  throw lastErr;
}

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
