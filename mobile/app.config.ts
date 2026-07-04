import type { ExpoConfig, ConfigContext } from 'expo/config';

/** Merges app.json with build-time env (EAS, Netlify). */
export default ({ config }: ConfigContext): ExpoConfig =>
  ({
    ...config,
    extra: {
      ...config.extra,
      apiUrl: process.env.EXPO_PUBLIC_API_URL ?? '',
    },
  }) as ExpoConfig;
