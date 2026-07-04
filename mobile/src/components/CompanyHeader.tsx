import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { formatCompanyAddress, formatCompanyPhones, formatGstPan } from '../slip';
import { colors, radius, spacing } from '../theme';
import type { TransporterSettings } from '../types';

interface Props {
  settings: TransporterSettings | null | undefined;
}

/** Branded company header shown on slip preview (matches PDF layout). */
export default function CompanyHeader({ settings }: Props) {
  const address = formatCompanyAddress(settings);
  const phones = formatCompanyPhones(settings);
  const gstPan = formatGstPan(settings);

  return (
    <View style={styles.wrap}>
      {!!settings?.logoUrl && (
        <Image source={{ uri: settings.logoUrl }} style={styles.logo} resizeMode="contain" />
      )}
      <View style={styles.body}>
        <Text style={styles.company}>{settings?.companyName || 'Transport Company'}</Text>
        {!!settings?.ownerName && <Text style={styles.owner}>{settings.ownerName}</Text>}
        {!!address && <Text style={styles.line}>{address}</Text>}
        {!!phones && <Text style={styles.line}>{phones}</Text>}
        {!!gstPan && <Text style={styles.line}>{gstPan}</Text>}
        {!!settings?.headerText && <Text style={styles.headerText}>{settings.headerText}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderBottomWidth: 3,
    borderBottomColor: colors.primary,
    paddingBottom: spacing.md,
    marginBottom: spacing.md,
  },
  logo: {
    width: 56,
    height: 56,
    marginRight: spacing.md,
    borderRadius: radius.sm,
  },
  body: { flex: 1 },
  company: { fontSize: 18, fontWeight: '900', color: colors.primaryDark },
  owner: { fontSize: 13, fontWeight: '600', color: colors.text, marginTop: 2 },
  line: { fontSize: 12, color: colors.muted, marginTop: 3, lineHeight: 18 },
  headerText: { fontSize: 12, color: colors.muted, marginTop: 4, fontStyle: 'italic' },
});
