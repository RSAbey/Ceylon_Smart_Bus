// Write / Edit Inquiry (Member 03, FR-08). One form for both: with an inquiryId it edits, otherwise
// it creates. Editing is only offered inside the server's short edit window.
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ScreenContainer from '../../../components/ui/ScreenContainer';
import AppHeader from '../../../components/navigation/AppHeader';
import AppCard from '../../../components/ui/AppCard';
import AppButton from '../../../components/ui/AppButton';
import AppTextInput from '../../../components/ui/AppTextInput';
import LoadingState from '../../../components/feedback/LoadingState';
import ErrorState from '../../../components/feedback/ErrorState';
import { useToast } from '../../../components/ui/ToastMessage';
import { MIN_TOUCH_TARGET, colors, radii, sizes, spacing, typography } from '../../../theme';
import { createInquiry, fetchInquiryDetails, updateInquiry } from '../services/inquiryApi';
import {
  INQUIRY_PRIORITIES,
  INQUIRY_PRIORITY_OPTIONS,
  INQUIRY_TAG_OPTIONS,
  MAX_INQUIRY_MESSAGE_LENGTH,
  MIN_INQUIRY_MESSAGE_LENGTH,
} from '../constants';

/** Height of the message box, so a complaint does not have to be typed on one line. */
const MESSAGE_FIELD_LINES = 5;

/**
 * A row of pill choices, used for both the tag and the priority.
 * @param {object} props - Component props.
 * @param {string} props.groupLabel - What is being chosen.
 * @param {object[]} props.choices - Each choice with its own key and label.
 * @param {string} props.choiceKeyName - Which field of a choice holds its stored value.
 * @param {string} props.chosenKey - The value currently chosen.
 * @param {Function} props.onChoose - Called with the newly chosen value.
 * @returns {import('react').JSX.Element} The pill group.
 */
function PillChoiceGroup({ groupLabel, choices, choiceKeyName, chosenKey, onChoose }) {
  return (
    <View>
      <Text style={[typography.label, styles.fieldLabel]}>{groupLabel}</Text>
      <View style={styles.pillRow}>
        {choices.map((choice) => {
          const isChosen = choice[choiceKeyName] === chosenKey;
          return (
            <Pressable
              key={choice[choiceKeyName]}
              onPress={() => onChoose(choice[choiceKeyName])}
              accessibilityRole="radio"
              accessibilityState={{ checked: isChosen }}
              accessibilityLabel={`${groupLabel}: ${choice.label}`}
              style={[styles.pill, isChosen && styles.pillChosen]}
            >
              {isChosen && (
                <Ionicons name="checkmark" size={sizes.iconSmall} color={colors.primary[600]} />
              )}
              <Text style={[typography.bodySmall, isChosen && styles.pillTextChosen]}>
                {choice.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/**
 * The inquiry form.
 * @returns {import('react').JSX.Element} The screen.
 */
export default function InquiryFormScreen() {
  const router = useRouter();
  const { inquiryId } = useLocalSearchParams();
  const { showSuccessToast, showErrorToast } = useToast();

  const [subject, setSubject] = useState('');
  const [inquiryMessage, setInquiryMessage] = useState('');
  const [chosenTag, setChosenTag] = useState('');
  const [chosenPriority, setChosenPriority] = useState(INQUIRY_PRIORITIES.MEDIUM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [isLoading, setIsLoading] = useState(Boolean(inquiryId));
  const [loadErrorMessage, setLoadErrorMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [reloadCounter, setReloadCounter] = useState(0);

  const reloadInquiry = useCallback(() => setReloadCounter((previousCount) => previousCount + 1), []);
  const isEditing = Boolean(inquiryId);

  useEffect(() => {
    if (!inquiryId) return undefined;
    let isEffectActive = true;
    fetchInquiryDetails(inquiryId)
      .then((inquiryView) => {
        if (!isEffectActive) return;
        setSubject(inquiryView.inquiry.subject);
        setInquiryMessage(inquiryView.inquiry.message);
        setChosenTag(inquiryView.inquiry.tag);
        setChosenPriority(inquiryView.inquiry.priority);
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
   * Checks the form the same way the server does, so mistakes are caught before a round trip.
   * @returns {boolean} True when the form can be sent.
   */
  function isFormValid() {
    const foundErrors = {};
    if (subject.trim().length === 0) foundErrors.subject = 'Enter a short subject.';
    if (inquiryMessage.trim().length < MIN_INQUIRY_MESSAGE_LENGTH) {
      foundErrors.message = `Describe the issue in at least ${MIN_INQUIRY_MESSAGE_LENGTH} characters.`;
    }
    if (inquiryMessage.trim().length > MAX_INQUIRY_MESSAGE_LENGTH) {
      foundErrors.message = `Keep it under ${MAX_INQUIRY_MESSAGE_LENGTH} characters.`;
    }
    if (!chosenTag) foundErrors.tag = 'Choose what the inquiry is about.';
    setFieldErrors(foundErrors);
    return Object.keys(foundErrors).length === 0;
  }

  const submitInquiry = async () => {
    if (!isFormValid()) return;
    setIsSaving(true);
    try {
      const inquiryDetails = {
        subject: subject.trim(),
        message: inquiryMessage.trim(),
        tag: chosenTag,
        priority: chosenPriority,
      };
      if (isEditing) {
        await updateInquiry(inquiryId, inquiryDetails);
        showSuccessToast('Inquiry updated.');
      } else {
        await createInquiry(inquiryDetails);
        showSuccessToast('Inquiry sent. Support will reply in the app.');
      }
      router.back();
    } catch (saveError) {
      showErrorToast(saveError.message);
      setFieldErrors(saveError.fieldErrors || {});
    } finally {
      setIsSaving(false);
    }
  };

  const screenHeader = (
    <AppHeader
      variant="back"
      title={isEditing ? 'Edit Inquiry' : 'New Inquiry'}
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

  return (
    <ScreenContainer isScrollable header={screenHeader}>
      <AppCard>
        <AppTextInput
          label="Subject"
          value={subject}
          onChangeText={setSubject}
          errorText={fieldErrors.subject}
          helperText="One line describing the issue."
          iconName="text-outline"
        />
      </AppCard>

      <AppCard>
        <PillChoiceGroup
          groupLabel="What is it about?"
          choices={INQUIRY_TAG_OPTIONS}
          choiceKeyName="tag"
          chosenKey={chosenTag}
          onChoose={setChosenTag}
        />
        {fieldErrors.tag && (
          <View style={styles.fieldErrorRow}>
            <Ionicons name="alert-circle" size={sizes.iconSmall} color={colors.error.dark} />
            <Text style={[typography.caption, styles.fieldErrorText]}>{fieldErrors.tag}</Text>
          </View>
        )}
      </AppCard>

      <AppCard>
        <PillChoiceGroup
          groupLabel="How urgent is it?"
          choices={INQUIRY_PRIORITY_OPTIONS}
          choiceKeyName="priority"
          chosenKey={chosenPriority}
          onChoose={setChosenPriority}
        />
      </AppCard>

      <AppCard>
        <AppTextInput
          label="Tell us what happened"
          value={inquiryMessage}
          onChangeText={setInquiryMessage}
          errorText={fieldErrors.message}
          helperText={`${inquiryMessage.trim().length} of ${MAX_INQUIRY_MESSAGE_LENGTH} characters.`}
          iconName="chatbubble-ellipses-outline"
          multiline
          numberOfLines={MESSAGE_FIELD_LINES}
          maxLength={MAX_INQUIRY_MESSAGE_LENGTH}
        />
      </AppCard>

      <AppButton
        label={isEditing ? 'Save changes' : 'Send inquiry'}
        size="large"
        isFullWidth
        iconName={isEditing ? 'save-outline' : 'send'}
        isLoading={isSaving}
        onPress={submitInquiry}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  fieldLabel: {
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: MIN_TOUCH_TARGET,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.pill,
    borderWidth: sizes.borderThin,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  pillChosen: {
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[100],
  },
  pillTextChosen: {
    color: colors.primary[600],
  },
  fieldErrorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  fieldErrorText: {
    color: colors.error.dark,
  },
});
