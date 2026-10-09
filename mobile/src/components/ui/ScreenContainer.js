// Screen wrapper: safe-area padding, palette background and optional scrolling with keyboard avoidance.
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, sizes, spacing } from '../../theme';

/** The bottom edge is usually covered by the tab bar, which handles its own safe area. */
const DEFAULT_SAFE_EDGES = ['top', 'left', 'right'];

/**
 * Outer container for every screen.
 * @param {object} props - Component props.
 * @param {import('react').ReactNode} props.children - Screen content.
 * @param {import('react').ReactNode} [props.header] - Header rendered above the content (does not scroll).
 * @param {boolean} [props.isScrollable] - Wrap the content in a ScrollView (forms, long pages).
 * @param {boolean} [props.hasPadding] - Apply the 16 px screen gutter (default true).
 * @param {import('react').ReactNode} [props.footer] - Bar pinned below the content (does not scroll),
 *   for a running total or a primary action that must stay visible while the content scrolls.
 * @param {Array<string>} [props.safeEdges] - Safe-area edges to pad.
 * @returns {import('react').JSX.Element} The container.
 */
export default function ScreenContainer({
  children,
  header,
  isScrollable = false,
  hasPadding = true,
  footer,
  safeEdges = DEFAULT_SAFE_EDGES,
}) {
  const contentStyle = [styles.content, hasPadding && styles.contentPadding];

  return (
    <SafeAreaView style={styles.screen} edges={safeEdges}>
      {header}
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {isScrollable ? (
          <ScrollView contentContainerStyle={contentStyle} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.screen, contentStyle]}>{children}</View>
        )}
        {footer}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flexGrow: 1,
    gap: spacing.lg,
  },
  contentPadding: {
    padding: sizes.screenGutter,
  },
});
