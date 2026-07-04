import { Platform } from 'react-native';

/**
 * Base URL of the TPSMS backend.
 *
 * Defaults are chosen so the app "just works" during local development:
 *  - Web / iOS simulator: localhost
 *  - Android emulator:     10.0.2.2 (the emulator's alias for the host machine)
 *
 * Running on a PHYSICAL device? Replace the host with your computer's LAN IP
 * (e.g. http://192.168.1.5:5000/api) — localhost/10.0.2.2 won't reach it.
 * You can also override at runtime via the EXPO_PUBLIC_API_URL env var.
 */
const DEV_HOST = Platform.select({ android: '10.0.2.2', default: 'localhost' });

export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? `http://${DEV_HOST}:5000/api`;
