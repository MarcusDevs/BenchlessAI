import { Pressable, StyleSheet, Text, View } from 'react-native';
import { benchlessColors, designTokens, type ColorScheme } from './tokens';

export type AppearancePreference = 'system' | ColorScheme;

const choices: { value: AppearancePreference; label: string; symbol: string }[] = [
  { value: 'system', label: 'System', symbol: '◐' },
  { value: 'light', label: 'Light', symbol: '☼' },
  { value: 'dark', label: 'Dark', symbol: '☾' },
];

export function AppearancePicker({ value, scheme, onChange }: {
  value: AppearancePreference;
  scheme: ColorScheme;
  onChange: (value: AppearancePreference) => void;
}) {
  const colors = benchlessColors[scheme];
  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.copy}>
        <Text style={[styles.title, { color: colors.text }]}>Appearance</Text>
        <Text style={[styles.detail, { color: colors.secondaryText }]}>Choose how Benchless looks</Text>
      </View>
      <View style={styles.choices} accessibilityRole="radiogroup" accessibilityLabel="Appearance">
        {choices.map((choice) => {
          const selected = value === choice.value;
          return (
            <Pressable key={choice.value} onPress={() => onChange(choice.value)} accessibilityRole="radio"
              accessibilityLabel={`${choice.label} appearance`} accessibilityState={{ selected }}
              style={({ pressed }) => [styles.choice, { borderColor: selected ? colors.accentStrong : colors.border, backgroundColor: selected ? colors.surfaceSelected : colors.background }, pressed && styles.pressed]}>
              <Text style={[styles.symbol, { color: selected ? colors.accentStrong : colors.secondaryText }]}>{choice.symbol}</Text>
              <Text style={[styles.label, { color: selected ? colors.text : colors.secondaryText }]}>{choice.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: designTokens.radius.card, padding: designTokens.spacing.md, gap: designTokens.spacing.sm },
  copy: { gap: 2 },
  title: { fontSize: designTokens.type.bodyCompact, lineHeight: designTokens.lineHeight.bodyCompact, fontWeight: '700' },
  detail: { fontSize: designTokens.type.footnote, lineHeight: designTokens.lineHeight.caption },
  choices: { flexDirection: 'row', gap: designTokens.spacing.xs },
  choice: { flex: 1, minHeight: designTokens.control.minimum, borderWidth: 1, borderRadius: designTokens.radius.control, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 5, paddingHorizontal: 4 },
  symbol: { fontSize: 16, fontWeight: '700' },
  label: { fontSize: designTokens.type.footnote, lineHeight: designTokens.lineHeight.caption, fontWeight: '600' },
  pressed: { opacity: 0.78 },
});
