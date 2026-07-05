import * as Updates from 'expo-updates';

/** Download and apply JS updates from EAS (production APK only). */
export async function applyRemoteUpdates(): Promise<void> {
  if (__DEV__ || !Updates.isEnabled) return;

  try {
    const check = await Updates.checkForUpdateAsync();
    if (!check.isAvailable) return;

    await Updates.fetchUpdateAsync();
    await Updates.reloadAsync();
  } catch {
    // Offline or update server unreachable — keep running the bundled app.
  }
}
