import { StyleSheet } from 'react-native';

/** Shared design tokens for a clean, modern logistics-style UI. */
export const colors = {
  primary: '#1d4ed8',
  primaryDark: '#1e3a8a',
  primaryLight: '#dbeafe',
  accent: '#f59e0b',
  bg: '#f1f5f9',
  card: '#ffffff',
  ink: '#0f172a',
  text: '#1e293b',
  muted: '#64748b',
  border: '#e2e8f0',
  success: '#16a34a',
  successBg: '#dcfce7',
  danger: '#dc2626',
  dangerBg: '#fee2e2',
  warning: '#d97706',
  warningBg: '#fef3c7',
  white: '#ffffff',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 6,
  md: 10,
  lg: 16,
  pill: 999,
};

export const shadow = {
  shadowColor: '#0f172a',
  shadowOpacity: 0.08,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 3,
};

/** Reusable styles shared across screens. */
export const g = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadow,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.muted,
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    marginBottom: spacing.md,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 15,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  buttonGhost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 14,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  buttonGhostText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.ink,
  },
  subtitle: {
    fontSize: 14,
    color: colors.muted,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
