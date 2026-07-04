import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, g, radius, spacing } from '../theme';

interface Props {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Cross-platform confirm dialog — works on web where Alert.alert buttons do not. */
export default function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.actions}>
            <TouchableOpacity style={[styles.btn, styles.cancelBtn]} onPress={onCancel}>
              <Text style={styles.cancelText}>{cancelLabel}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, destructive ? styles.destructiveBtn : g.button]}
              onPress={onConfirm}
            >
              <Text style={[g.buttonText, destructive && styles.destructiveText]}>{confirmLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 340,
  },
  title: { fontSize: 20, fontWeight: '800', color: colors.ink, textAlign: 'center' },
  message: {
    fontSize: 15,
    color: colors.muted,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 22,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  btn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelText: { color: colors.text, fontWeight: '700', fontSize: 15 },
  destructiveBtn: { backgroundColor: colors.danger },
  destructiveText: { color: colors.white },
});
