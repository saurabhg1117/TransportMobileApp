import React, { useMemo, useState } from 'react';
import { Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { filterSuggestions } from '../lib/slipSuggestions';
import { colors, g, radius, spacing } from '../theme';

interface Props {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  suggestions?: string[];
  multiline?: boolean;
  placeholder?: string;
  required?: boolean;
}

export default function SuggestInput({
  label,
  value,
  onChangeText,
  suggestions = [],
  multiline,
  placeholder,
  required,
}: Props) {
  const [focused, setFocused] = useState(false);

  const matches = useMemo(() => filterSuggestions(suggestions, value), [suggestions, value]);
  const showList = focused && matches.length > 0;

  const pick = (item: string) => {
    onChangeText(item);
    setFocused(false);
  };

  return (
    <View style={styles.wrap}>
      <Text style={g.label}>
        {label}
        {required ? <Text style={styles.required}> *</Text> : null}
      </Text>
      <TextInput
        style={[
          styles.input,
          multiline && styles.multiline,
          focused && styles.inputFocused,
          Platform.OS === 'web' && styles.inputWeb,
        ]}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 180)}
        multiline={multiline}
        placeholder={placeholder ?? label}
        placeholderTextColor={colors.muted}
      />
      {showList && (
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Pick from earlier entries</Text>
          {matches.map((item) => (
            <TouchableOpacity key={item} style={styles.row} onPress={() => pick(item)} activeOpacity={0.7}>
              <Text style={styles.rowText} numberOfLines={multiline ? 2 : 1}>
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.md,
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
  },
  inputWeb: {
    outlineStyle: 'none',
  } as object,
  inputFocused: {
    borderColor: colors.primary,
    borderWidth: 1.5,
  },
  multiline: {
    height: 80,
    textAlignVertical: 'top',
  },
  panel: {
    marginTop: spacing.sm,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  panelTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.muted,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  row: {
    paddingHorizontal: spacing.md,
    paddingVertical: 11,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowText: {
    color: colors.text,
    fontSize: 15,
  },
  required: {
    color: colors.danger,
    fontWeight: '800',
  },
});
