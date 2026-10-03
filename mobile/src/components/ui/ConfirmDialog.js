// Modal yes/no dialog for actions that need confirmation; destructive actions get the red error style.
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii, shadows, spacing, typography } from '../../theme';
import AppButton from './AppButton';

/**
 * Confirmation dialog (for example "Cancel this ticket?").
 * @param {object} props - Component props.
 * @param {boolean} props.isVisible - Whether the dialog is open.
 * @param {string} props.title - Question shown in bold.
 * @param {string} [props.message] - Extra explanation.
 * @param {string} [props.confirmLabel] - Confirm button text.
 * @param {string} [props.cancelLabel] - Cancel button text.
 * @param {boolean} [props.isDestructive] - Uses the error button style for the confirm action.
 * @param {boolean} [props.isConfirming] - Shows the loading state on the confirm button.
 * @param {Function} props.onConfirm - Called when the user confirms.
 * @param {Function} props.onCancel - Called when the user cancels or taps outside.
 * @returns {import('react').JSX.Element} The dialog.
 */
export default function ConfirmDialog({
  isVisible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDestructive = false,
  isConfirming = false,
  onConfirm,
  onCancel,
}) {
  return (
    <Modal transparent visible={isVisible} animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel} accessibilityLabel="Close dialog">
        {/* Inner Pressable stops taps on the card from closing the dialog. */}
        <Pressable style={styles.dialogCard} accessibilityRole="alert" onPress={() => {}}>
          <Text style={[typography.heading3, styles.titleText]}>{title}</Text>
          {Boolean(message) && <Text style={[typography.bodyMedium, styles.messageText]}>{message}</Text>}
          <View style={styles.actionRow}>
            <AppButton label={cancelLabel} variant="outline" onPress={onCancel} isDisabled={isConfirming} />
            <AppButton
              label={confirmLabel}
              variant={isDestructive ? 'error' : 'primary'}
              iconName={isDestructive ? 'trash-outline' : undefined}
              onPress={onConfirm}
              isLoading={isConfirming}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  dialogCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.xxl,
    gap: spacing.md,
    ...shadows.raised,
  },
  titleText: {
    color: colors.text.primary,
  },
  messageText: {
    color: colors.text.secondary,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
});
