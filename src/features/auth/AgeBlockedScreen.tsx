import { Pressable, StyleSheet, Text, View } from 'react-native';
import { benchlessColors, designTokens, type ColorScheme } from '../../design/tokens';

export function AgeBlockedScreen({ appearance, onReviewBirthYear }: { appearance: ColorScheme; onReviewBirthYear: () => void }) {
  const c = benchlessColors[appearance];
  const s = StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.background, alignItems: 'center', justifyContent: 'center', padding: designTokens.spacing.xl, gap: designTokens.spacing.md },
    mark: { minWidth: 64, height: 64, paddingHorizontal: 10, borderRadius: designTokens.radius.sheet, backgroundColor: c.dangerSurface, borderWidth: 1, borderColor: c.danger, alignItems: 'center', justifyContent: 'center' },
    markText: { color: c.danger, fontSize: designTokens.type.body, fontWeight: '700' },
    title: { color: c.text, fontSize: designTokens.type.title, lineHeight: designTokens.lineHeight.title, fontWeight: '700', textAlign: 'center' },
    body: { color: c.secondaryText, fontSize: designTokens.type.bodyCompact, lineHeight: designTokens.lineHeight.bodyCompact, textAlign: 'center' },
    action: { minHeight: designTokens.control.minimum, paddingHorizontal: designTokens.spacing.lg, borderRadius: designTokens.radius.control, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, alignItems: 'center', justifyContent: 'center', marginTop: designTokens.spacing.sm },
    actionText: { color: c.text, fontSize: designTokens.type.bodyCompact, fontWeight: '600' },
  });
  return <View style={s.screen} accessibilityRole="alert">
    <View style={s.mark}><Text style={s.markText}>18+</Text></View>
    <Text style={s.title}>Benchless AI is for adults 18 and over.</Text>
    <Text style={s.body}>Training and account access are unavailable with the year of birth entered. No account details have been collected.</Text>
    <Pressable accessibilityRole="button" onPress={onReviewBirthYear} style={s.action}><Text style={s.actionText}>Review year of birth</Text></Pressable>
  </View>;
}
