// Inquiry Details (Member 03, FR-08): the question as sent, the admin replies, and edit / delete
// while the server's short edit window is still open.
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, usePathname, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ScreenContainer from '../../../components/ui/ScreenContainer';
import AppHeader from '../../../components/navigation/AppHeader';
import AppCard from '../../../components/ui/AppCard';
import AppButton from '../../../components/ui/AppButton';
import StatusBadge from '../../../components/ui/StatusBadge';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import LoadingState from '../../../components/feedback/LoadingState';
import ErrorState from '../../../components/feedback/ErrorState';
import { useToast } from '../../../components/ui/ToastMessage';
import { colors, radii, sizes, spacing, typography } from '../../../theme';
import { deleteInquiry, fetchInquiryDetails } from '../services/inquiryApi';
import {
  INQUIRY_BADGES,
  INQUIRY_MESSAGES,
  INQUIRY_PRIORITY_OPTIONS,
  INQUIRY_TAG_OPTIONS,
} from '../constants';

/** Both roles reach this screen, and each must stay inside its own Expo Router group. */
const ROUTE_GROUPS = Object.freeze({ driver: '/(driver)', passenger: '/(passenger)' });

/**
 * One inquiry with its replies.
 * @returns {import('react').JSX.Element} The screen.
 */
export default function InquiryDetailsScreen() {
  const router = useRouter();
  const currentPath = usePathname();
  const { inquiryId } = useLocalSearchParams();
  const { showSuccessToast, showErrorToast } = useToast();

  const [inquiryView, setInquiryView] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadErrorMessage, setLoadErrorMessage] = useState('');
  const [isDeleteDialogVisible, setIsDeleteDialogVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [reloadCounter, setReloadCounter] = useState(0);

  const reloadInquiry = useCallback(() => setReloadCounter((previousCount) => previousCount + 1), []);
  const routeGroup = currentPath.includes('driver') ? ROUTE_GROUPS.driver : ROUTE_GROUPS.passenger;

  // Editing happens on the form screen, so refresh whenever this screen comes back into view.
  useFocusEffect(reloadInquiry);

  useEffect(() => {
    let isEffectActive = true;
    fetchInquiryDetails(inquiryId)
      .then((loadedInquiry) => {
        if (!isEffectActive) return;
        setInquiryView(loadedInquiry);
        setLoadErrorMessage('');
      })
      .catch((loadError) => {
        if (isEffectActive) setLoadErrorMessage(loadError.message);
      })
      .finally(() => {
        if (isEffectActive) setIsLoading(false);
      });
    return () => {
      isEffectActive = false;
    };
  }, [inquiryId, reloadCounter]);

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteInquiry(inquiryId);
      showSuccessToast('Inquiry deleted.');
      setIsDeleteDialogVisible(false);
      router.back();
    } catch (deleteError) {
      showErrorToast(deleteError.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const screenHeader = (
    <AppHeader
      variant="back"
      title="Inquiry"
      onBackPress={router.canGoBack() ? router.back : undefined}
    />
  );

  if (isLoading) {
    return (
      <ScreenContainer header={screenHeader}>
        <LoadingState message="Loading your inquiry..." />
      </ScreenContainer>
    );
  }
  if (loadErrorMessage) {
    return (
      <ScreenContainer header={screenHeader}>
        <ErrorState message={loadErrorMessage} onRetry={reloadInquiry} />
      </ScreenContainer>
    );
  }

  const { inquiry, replies, isEditable, editWindowMinutes } = inquiryView;
  const inquiryBadge = INQUIRY_BADGES[inquiry.status];
  const tagOption = INQUIRY_TAG_OPTIONS.find((tagEntry) => tagEntry.tag === inquiry.tag);
  const priorityOption = INQUIRY_PRIORITY_OPTIONS.find(
    (priorityEntry) => priorityEntry.priority === inquiry.priority
  );

  return (
    <ScreenContainer isScrollable header={screenHeader}>
      <AppCard>
        <View style={styles.cardHeaderRow}>
          <Text style={[typography.heading3, styles.subjectText]}>{inquiry.subject}</Text>
          <StatusBadge status={inquiryBadge.status} label={inquiryBadge.label} />
        </View>

        <Text style={typography.bodyLarge}>{inquiry.message}</Text>

        <View style={styles.metaRow}>
          <Ionicons name="pricetag-outline" size={sizes.iconSmall} color={colors.text.secondary} />
          <Text style={[typography.caption, styles.mutedText]}>{tagOption?.label}</Text>
          <Ionicons name="flag-outline" size={sizes.iconSmall} color={colors.text.secondary} />
          <Text style={[typography.caption, styles.mutedText]}>
            {priorityOption?.label} priority
          </Text>
        </View>
        <Text style={[typography.caption, styles.mutedText]}>
          Sent {new Date(inquiry.createdAt).toLocaleString()}
        </Text>
      </AppCard>

      <Text style={[typography.sectionHeading, styles.mutedText]}>
        {replies.length === 0
          ? 'Waiting for a reply'
          : `${replies.length} ${replies.length === 1 ? 'reply' : 'replies'} from support`}
      </Text>

      {replies.length === 0 ? (
        <View style={styles.waitingRow}>
          <Ionicons name="time-outline" size={sizes.iconMedium} color={colors.information.dark} />
          <Text style={[typography.bodySmall, styles.waitingText]}>
            Our support team has not answered yet. You will get a notification when they do.
          </Text>
        </View>
      ) : (
        replies.map((reply) => (
          <AppCard key={reply.id} style={styles.replyCard}>
            <View style={styles.replyHeaderRow}>
              <View style={styles.supportBadge}>
                <Ionicons
                  name="headset-outline"
                  size={sizes.iconSmall}
                  color={colors.primary[600]}
                />
              </View>
              <Text style={[typography.label, styles.mutedText]}>Ceylon Smart Bus support</Text>
            </View>
            <Text style={typography.bodyLarge}>{reply.message}</Text>
            <Text style={[typography.caption, styles.mutedText]}>
              {new Date(reply.createdAt).toLocaleString()}
            </Text>
          </AppCard>
        ))
      )}

      {isEditable ? (
        <View style={styles.actionRow}>
          <AppButton
            label="Edit"
            variant="outline"
            isFullWidth
            iconName="create-outline"
            style={styles.actionButton}
            onPress={() => router.push(`${routeGroup}/inquiries/edit/${inquiry.id}`)}
          />
          <AppButton
            label="Delete"
            variant="error"
            isFullWidth
            iconName="trash-outline"
            style={styles.actionButton}
            onPress={() => setIsDeleteDialogVisible(true)}
          />
        </View>
      ) : (
        <Text style={[typography.caption, styles.mutedText]}>
          {INQUIRY_MESSAGES.editWindowOver} Inquiries can be changed for {editWindowMinutes} minutes
          after sending.
        </Text>
      )}

      <ConfirmDialog
        isVisible={isDeleteDialogVisible}
        title={INQUIRY_MESSAGES.deleteConfirmTitle}
        message={INQUIRY_MESSAGES.deleteConfirmMessage}
        confirmLabel="Delete"
        isDestructive
        isConfirming={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => setIsDeleteDialogVisible(false)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  subjectText: {
    flex: 1,
  },
  mutedText: {
    color: colors.text.secondary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  waitingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.information.light,
  },
  waitingText: {
    flex: 1,
    color: colors.information.dark,
  },
  replyCard: {
    borderLeftWidth: sizes.borderThick,
    borderLeftColor: colors.primary[500],
  },
  replyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  supportBadge: {
    width: sizes.iconXLarge,
    height: sizes.iconXLarge,
    borderRadius: radii.pill,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionButton: {
    flex: 1,
  },
});
