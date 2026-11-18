import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { benchlessColors, designTokens, type ColorScheme } from '../../design/tokens';

export type AppStateKind = 'loading' | 'offline' | 'empty' | 'error';

type Props = {
  kind: AppStateKind;
  title: string;
  message: string;
  appearance: ColorScheme;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  accessibilityLabel?: string;
};

/** Shared states always explain what happened and expose a way to continue when possible. */
export function AppStateView({
  kind, title, message, appearance, actionLabel, onAction, secondaryActionLabel, onSecondaryAction,
  accessibilityLabel,
}: Props) {
  const colors = benchlessColors[appearance];
  const styles = makeStyles(appearance);
  return (
    <View style={styles.container} accessibilityLabel={accessibilityLabel ?? `${title}. ${message}`} accessibilityLiveRegion="polite">
      {kind === 'loading' ? (
        <ActivityIndicator size="large" color={colors.accentStrong} accessibilityLabel={title} />
      ) : (
        <View style={[styles.mark, kind === 'error' && styles.errorMark]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Text style={[styles.markText, kind === 'error' && styles.errorText]}>{kind === 'offline' ? '⌁' : kind === 'empty' ? '○' : '!'}</Text>
        </View>
      )}
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {actionLabel && onAction ? (
        <Pressable accessibilityRole="button" onPress={onAction} style={({ pressed }) => [styles.primary, pressed && styles.pressed]}>
          <Text style={styles.primaryText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
      {secondaryActionLabel && onSecondaryAction ? (
        <Pressable accessibilityRole="button" onPress={onSecondaryAction} style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}>
          <Text style={styles.secondaryText}>{secondaryActionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function makeStyles(appearance: ColorScheme) {
  const colors = benchlessColors[appearance];
  return StyleSheet.create({
    container: { width: '100%', flexGrow: 1, minHeight: 260, alignItems: 'center', justifyContent: 'center', gap: designTokens.spacing.md, padding: designTokens.spacing.lg },
    mark: { width: 56, height: 56, borderRadius: designTokens.radius.card, backgroundColor: colors.surfaceRaised, borderColor: colors.border, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    errorMark: { backgroundColor: colors.dangerSurface },
    markText: { fontSize: designTokens.type.title, color: colors.accentStrong },
    errorText: { color: colors.danger },
    title: { color: colors.text, fontSize: designTokens.type.title, lineHeight: designTokens.lineHeight.title, fontWeight: '700', textAlign: 'center' },
    message: { color: colors.secondaryText, fontSize: designTokens.type.bodyCompact, lineHeight: designTokens.lineHeight.bodyCompact, textAlign: 'center', maxWidth: 340 },
    primary: { minHeight: designTokens.control.minimum, minWidth: 180, borderRadius: designTokens.radius.control, paddingHorizontal: designTokens.spacing.lg, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent },
    primaryText: { color: colors.onAccent, fontSize: designTokens.type.bodyCompact, fontWeight: '700' },
    secondary: { minHeight: designTokens.control.minimum, minWidth: 180, borderRadius: designTokens.radius.control, paddingHorizontal: designTokens.spacing.lg, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
    secondaryText: { color: colors.text, fontSize: designTokens.type.bodyCompact, fontWeight: '600' },
    pressed: { opacity: 0.76 },
  });
}
