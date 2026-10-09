// A sheet that slides up from the bottom of the App lock screen (Member 01). Both PIN dialogs look
// the same, so the frame lives here once and each dialog supplies only its own fields.
import { Modal, StyleSheet, Text, View } from 'react-native';
import AppButton from '../../../components/ui/AppButton';
import { colors, radii, spacing, typography } from '../../../theme';

/**
 * The sheet frame: a dimmed backdrop, a rounded card, a title, an explanation and a Cancel button.
 * @param {object} props - Component props.
 * @param {boolean} props.isVisible - Whether the sheet is open.
 * @param {string} props.title - Heading at the top of the card.
 * @param {string} props.explanation - One paragraph under the heading.
 * @param {Function} props.onClose - Closes the sheet without saving.
 * @param {import('react').ReactNode} props.children - The dialog's own fields and action button.
 * @returns {import('react').JSX.Element} The sheet.
 */
export default function BottomSheetCard({ isVisible, title, explanation, onClose, children }) {
  return (
    <Modal visible={isVisible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={typography.heading3}>{title}</Text>
          <Text style={[typography.bodyMedium, styles.mutedText]}>{explanation}</Text>
          {children}
          <AppButton label="Cancel" variant="text" isFullWidth onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.overlay,
  },
  card: {
    gap: spacing.lg,
    padding: spacing.xl,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    backgroundColor: colors.surface,
  },
  mutedText: {
    color: colors.text.secondary,
  },
});
