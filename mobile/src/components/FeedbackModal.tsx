import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, g, radius, spacing } from '../theme';

export type FeedbackKind = 'success' | 'error';

export interface FeedbackState {
  kind: FeedbackKind;
  title: string;
  message: string;
}

interface Props {
  feedback: FeedbackState | null;
  onClose: () => void;
}

/** Cross-platform alert replacement — visible on web and native. */
export default function FeedbackModal({ feedback, onClose }: Props) {
  const isSuccess = feedback?.kind === 'success';

  return (
    <Modal visible={!!feedback} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={[styles.iconWrap, { backgroundColor: isSuccess ? colors.successBg : colors.dangerBg }]}>
            <Text style={[styles.icon, { color: isSuccess ? colors.success : colors.danger }]}>
              {isSuccess ? '✓' : '!'}
            </Text>
          </View>
          <Text style={styles.title}>{feedback?.title}</Text>
          <Text style={styles.message}>{feedback?.message}</Text>
          <TouchableOpacity
            style={[g.button, { backgroundColor: isSuccess ? colors.success : colors.primary, marginTop: spacing.lg }]}
            onPress={onClose}
          >
            <Text style={g.buttonText}>OK</Text>
          </TouchableOpacity>
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
    alignItems: 'center',
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  icon: { fontSize: 28, fontWeight: '900' },
  title: { fontSize: 20, fontWeight: '800', color: colors.ink, textAlign: 'center' },
  message: { fontSize: 15, color: colors.muted, textAlign: 'center', marginTop: spacing.sm, lineHeight: 22 },
});
