// One inquiry and everything an administrator can do with it: read the thread, answer it, take it
// on or hand it back, and close or reopen it. The passenger's own thread screen shows the same
// replies, so an answer written here is what they read in the app.
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import ScreenContainer from '../../../components/ui/ScreenContainer';
import AppHeader from '../../../components/navigation/AppHeader';
import AppCard from '../../../components/ui/AppCard';
import AppButton from '../../../components/ui/AppButton';
import AppTextInput from '../../../components/ui/AppTextInput';
import LoadingState from '../../../components/feedback/LoadingState';
import ErrorState from '../../../components/feedback/ErrorState';
import { useToast } from '../../../components/ui/ToastMessage';
import { useAuth } from '../../../context/AuthContext';
import { colors, radii, spacing, typography } from '../../../theme';
import AdminStatusChip from '../components/AdminStatusChip';
import {
  INQUIRY_PRIORITY_TONES,
  INQUIRY_STATUSES,
  INQUIRY_STATUS_TONES,
  INQUIRY_TAG_LABELS,
} from '../constants';
import {
  assignInquiry,
  closeInquiry,
  fetchInquiryDetails,
  reopenInquiry,
  replyToInquiry,
} from '../services/adminInquiryApi';

const MIN_REPLY_LENGTH = 2;

/**
 * Formats a timestamp as "8 Oct, 14:26".
 * @param {string} isoDate - ISO date from the API.
 * @returns {string} Day, month and time.
 */
function formatMoment(isoDate) {
  const moment = new Date(isoDate);
  return `${moment.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}, ${moment.toLocaleTimeString(
    'en-GB',
    { hour: '2-digit', minute: '2-digit' }
  )}`;
}

/**
 * One message in the thread: the passenger's own words, or an administrator's reply.
 * @param {object} props - Component props.
 * @param {string} props.authorName - Who wrote it.
 * @param {string} props.message - What they wrote.
 * @param {string} props.writtenAt - When, already formatted.
 * @param {boolean} props.isFromAdmin - Changes the bubble's colour and side.
 * @returns {import('react').JSX.Element} The bubble.
 */
function ThreadMessage({ authorName, message, writtenAt, isFromAdmin }) {
  return (
    <View style={[styles.bubble, isFromAdmin ? styles.bubbleFromAdmin : styles.bubbleFromPassenger]}>
      <Text style={[typography.caption, styles.mutedText]}>{`${authorName} · ${writtenAt}`}</Text>
      <Text style={typography.bodyMedium}>{message}</Text>
    </View>
  );
}

/**
 * Admin inquiry conversation.
 * @returns {import('react').JSX.Element} The screen.
 */
export default function AdminInquiryDetailScreen() {
  const router = useRouter();
  const { inquiryId } = useLocalSearchParams();
  const { user } = useAuth();
  const { showSuccessToast, showErrorToast } = useToast();

  const [thread, setThread] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replyErrorMessage, setReplyErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [loadErrorMessage, setLoadErrorMessage] = useState('');
  const [isWorking, setIsWorking] = useState(false);
  const [reloadCounter, setReloadCounter] = useState(0);

  const reload = useCallback(() => setReloadCounter((previousCount) => previousCount + 1), []);

  useEffect(() => {
    let isEffectActive = true;
    fetchInquiryDetails(inquiryId)
      .then((loadedThread) => {
        if (!isEffectActive) return;
        setThread(loadedThread);
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

  /**
   * Runs one action on the inquiry and reloads the thread.
   * @param {Function} runAction - The API call to make.
   * @param {string} successMessage - What to tell the administrator afterwards.
   * @returns {Promise<void>} Resolves once the thread has been reloaded.
   */
  const runInquiryAction = async (runAction, successMessage) => {
    setIsWorking(true);
    try {
      await runAction();
      showSuccessToast(successMessage);
      reload();
    } catch (actionError) {
      showErrorToast(actionError.message);
    } finally {
      setIsWorking(false);
    }
  };

  const sendReply = async () => {
    if (replyText.trim().length < MIN_REPLY_LENGTH) {
      setReplyErrorMessage('Write an answer before sending it.');
      return;
    }
    setReplyErrorMessage('');
    setIsWorking(true);
    try {
      await replyToInquiry(inquiryId, replyText.trim());
      setReplyText('');
      showSuccessToast('Answer sent. The passenger has been alerted.');
      reload();
    } catch (replyError) {
      setReplyErrorMessage(replyError.fieldErrors?.message || replyError.message);
    } finally {
      setIsWorking(false);
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
        <LoadingState message="Loading the conversation..." />
      </ScreenContainer>
    );
  }

  if (loadErrorMessage) {
    return (
      <ScreenContainer header={screenHeader}>
        <ErrorState message={loadErrorMessage} onRetry={reload} />
      </ScreenContainer>
    );
  }

  const { inquiry, replies } = thread;
  const isClosed = inquiry.status === INQUIRY_STATUSES.CLOSED;
  const isMine = inquiry.assigneeId?.id === user?.id;

  return (
    <ScreenContainer header={screenHeader} isScrollable>
      <AppCard>
        <View style={styles.headingBlock}>
          <Text style={typography.heading3}>{inquiry.subject}</Text>
          <View style={styles.chipRow}>
            <AdminStatusChip label={inquiry.status} tone={INQUIRY_STATUS_TONES[inquiry.status]} />
            <AdminStatusChip
              label={`${inquiry.priority} priority`}
              tone={INQUIRY_PRIORITY_TONES[inquiry.priority]}
            />
            <AdminStatusChip label={INQUIRY_TAG_LABELS[inquiry.tag] || inquiry.tag} />
          </View>
          <Text style={[typography.bodySmall, styles.mutedText]}>
            {`Raised by ${inquiry.userId?.fullName || 'a passenger'} · ${formatMoment(inquiry.createdAt)}`}
          </Text>
          <Text style={[typography.bodySmall, styles.mutedText]}>
            {inquiry.assigneeId
              ? `Taken by ${inquiry.assigneeId.fullName}`
              : 'Nobody has taken this yet'}
          </Text>
        </View>
      </AppCard>

      <View style={styles.threadBlock}>
        <ThreadMessage
          authorName={inquiry.userId?.fullName || 'Passenger'}
          message={inquiry.message}
          writtenAt={formatMoment(inquiry.createdAt)}
          isFromAdmin={false}
        />
        {replies.map((threadReply) => (
          <ThreadMessage
            key={threadReply.id}
            authorName={threadReply.adminId?.fullName || 'Support'}
            message={threadReply.message}
            writtenAt={formatMoment(threadReply.createdAt)}
            isFromAdmin
          />
        ))}
      </View>

      {isClosed ? (
        <AppCard>
          <Text style={[typography.bodyMedium, styles.mutedText]}>
            This inquiry is closed. Reopen it to answer again.
          </Text>
        </AppCard>
      ) : (
        <View style={styles.replyBlock}>
          <AppTextInput
            label="Your answer"
            placeholder="Write the reply the passenger will read"
            value={replyText}
            onChangeText={setReplyText}
            errorText={replyErrorMessage}
            multiline
          />
          <AppButton
            label="Send the answer"
            iconName="send-outline"
            size="large"
            isFullWidth
            isLoading={isWorking}
            onPress={sendReply}
          />
        </View>
      )}

      <View style={styles.actionBlock}>
        <AppButton
          label={isMine ? 'Hand it back' : 'Take this on'}
          iconName={isMine ? 'person-remove-outline' : 'person-add-outline'}
          variant="outline"
          isFullWidth
          isDisabled={isWorking}
          onPress={() =>
            runInquiryAction(
              () => assignInquiry(inquiryId, isMine ? null : user.id),
              isMine ? 'Put back in the unassigned queue.' : 'You have taken this on.'
            )
          }
        />
        {isClosed ? (
          <AppButton
            label="Reopen"
            iconName="refresh-outline"
            variant="outline"
            isFullWidth
            isDisabled={isWorking}
            onPress={() => runInquiryAction(() => reopenInquiry(inquiryId), 'Reopened.')}
          />
        ) : (
          <AppButton
            label="Close this inquiry"
            iconName="checkmark-done-outline"
            variant="outline"
            isFullWidth
            isDisabled={isWorking}
            onPress={() => runInquiryAction(() => closeInquiry(inquiryId), 'Closed.')}
          />
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  mutedText: {
    color: colors.text.secondary,
  },
  headingBlock: {
    gap: spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  threadBlock: {
    gap: spacing.md,
  },
  bubble: {
    gap: spacing.xs,
    padding: spacing.lg,
    borderRadius: radii.lg,
    maxWidth: '92%',
  },
  bubbleFromPassenger: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
  },
  bubbleFromAdmin: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary[100],
  },
  replyBlock: {
    gap: spacing.md,
  },
  actionBlock: {
    gap: spacing.sm,
  },
});
