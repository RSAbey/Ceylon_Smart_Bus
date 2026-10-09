// Writing or editing an admin notification. One screen does both: with an announcementId it loads
// that draft and saves changes, without one it creates a new draft. Saving never notifies anybody —
// publishing from the list is what does that — so the button says "Save draft" and means it.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import ScreenContainer from '../../../components/ui/ScreenContainer';
import AppHeader from '../../../components/navigation/AppHeader';
import AppCard from '../../../components/ui/AppCard';
import AppButton from '../../../components/ui/AppButton';
import AppTextInput from '../../../components/ui/AppTextInput';
import LoadingState from '../../../components/feedback/LoadingState';
import ErrorState from '../../../components/feedback/ErrorState';
import { useToast } from '../../../components/ui/ToastMessage';
import { colors, typography } from '../../../theme';
import AdminPickerField from '../components/AdminPickerField';
import {
  ADMIN_MESSAGES,
  ANNOUNCEMENT_SEVERITIES,
  DATE_INPUT_HINT,
  DATE_INPUT_PATTERN,
  SEVERITY_LABELS,
} from '../constants';
import {
  createAnnouncement,
  fetchAnnouncements,
  fetchAudienceSize,
  fetchRoutesForPicker,
  updateAnnouncement,
} from '../services/adminNotificationApi';

const MAX_TITLE_LENGTH = 120;
const MIN_MESSAGE_LENGTH = 10;
const MAX_MESSAGE_LENGTH = 1000;
/** An ISO timestamp's date part, "2026-10-20", is this many characters. */
const DATE_PART_LENGTH = 10;
/** The picker key that means "no route", which the API expects as an absent field. */
const EVERY_PASSENGER = 'everyone';

/**
 * Admin notification form.
 * @returns {import('react').JSX.Element} The screen.
 */
export default function AdminNotificationFormScreen() {
  const router = useRouter();
  const { announcementId } = useLocalSearchParams();
  const { showSuccessToast } = useToast();

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState(ANNOUNCEMENT_SEVERITIES.INFO);
  const [targetRouteKey, setTargetRouteKey] = useState(EVERY_PASSENGER);
  const [expiresOn, setExpiresOn] = useState('');
  const [routeOptions, setRouteOptions] = useState([]);
  const [audienceCount, setAudienceCount] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [loadErrorMessage, setLoadErrorMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const isEditing = Boolean(announcementId);

  useEffect(() => {
    let isEffectActive = true;

    /**
     * Loads the route picker and, when editing, the draft being changed.
     * @returns {Promise<void>} Resolves once the form is ready.
     */
    async function loadFormContents() {
      try {
        const pickerRoutes = await fetchRoutesForPicker();
        if (!isEffectActive) return;
        setRouteOptions(pickerRoutes);

        if (!isEditing) return;
        // There is no single-announcement endpoint, so the draft comes from the same list the
        // previous screen showed. One request either way.
        const announcementList = await fetchAnnouncements();
        if (!isEffectActive) return;
        const matchingRow = announcementList.announcements.find(
          (announcementRow) => announcementRow.announcement.id === announcementId
        );
        if (!matchingRow) {
          setLoadErrorMessage('That notification no longer exists.');
          return;
        }
        const { announcement } = matchingRow;
        setTitle(announcement.title);
        setMessage(announcement.message);
        setSeverity(announcement.severity);
        setTargetRouteKey(announcement.targetRouteId?.id || EVERY_PASSENGER);
        setExpiresOn(announcement.expiresAt ? announcement.expiresAt.slice(0, DATE_PART_LENGTH) : '');
      } catch (loadError) {
        if (isEffectActive) setLoadErrorMessage(loadError.message);
      } finally {
        if (isEffectActive) setIsLoading(false);
      }
    }

    loadFormContents();
    return () => {
      isEffectActive = false;
    };
  }, [announcementId, isEditing]);

  const targetRouteId = targetRouteKey === EVERY_PASSENGER ? undefined : targetRouteKey;

  useEffect(() => {
    let isEffectActive = true;
    // How many passengers this would reach, so nobody publishes to an audience of nobody.
    fetchAudienceSize(targetRouteId)
      .then((countedAudience) => {
        if (isEffectActive) setAudienceCount(countedAudience);
      })
      .catch(() => {
        if (isEffectActive) setAudienceCount(null);
      });
    return () => {
      isEffectActive = false;
    };
  }, [targetRouteId]);

  const routePickerOptions = useMemo(
    () => [
      { key: EVERY_PASSENGER, label: 'Every passenger' },
      ...routeOptions.map((pickerRoute) => ({
        key: pickerRoute.id,
        label: `Route ${pickerRoute.routeNumber}`,
      })),
    ],
    [routeOptions]
  );

  const severityOptions = Object.values(ANNOUNCEMENT_SEVERITIES).map((severityValue) => ({
    key: severityValue,
    label: SEVERITY_LABELS[severityValue],
  }));

  const saveAnnouncement = useCallback(async () => {
    const formErrors = {};
    if (!title.trim()) formErrors.title = 'Enter a title.';
    else if (title.trim().length > MAX_TITLE_LENGTH) {
      formErrors.title = `Keep the title under ${MAX_TITLE_LENGTH} characters.`;
    }
    const trimmedMessage = message.trim();
    if (trimmedMessage.length < MIN_MESSAGE_LENGTH || trimmedMessage.length > MAX_MESSAGE_LENGTH) {
      formErrors.message = `Write between ${MIN_MESSAGE_LENGTH} and ${MAX_MESSAGE_LENGTH} characters.`;
    }
    if (expiresOn && !DATE_INPUT_PATTERN.test(expiresOn)) {
      formErrors.expiresAt = ADMIN_MESSAGES.invalidDate;
    }
    setFieldErrors(formErrors);
    if (Object.keys(formErrors).length > 0) return;

    const announcementForm = {
      title: title.trim(),
      message: trimmedMessage,
      severity,
      targetRouteId: targetRouteId || null,
      expiresAt: expiresOn || null,
    };

    setIsSaving(true);
    try {
      if (isEditing) await updateAnnouncement(announcementId, announcementForm);
      else await createAnnouncement(announcementForm);
      showSuccessToast(isEditing ? 'Draft updated.' : 'Draft saved. Publish it when you are ready.');
      router.back();
    } catch (saveError) {
      setFieldErrors(saveError.fieldErrors || {});
      if (Object.keys(saveError.fieldErrors || {}).length === 0) {
        setLoadErrorMessage(saveError.message);
      }
    } finally {
      setIsSaving(false);
    }
  }, [
    title,
    message,
    severity,
    targetRouteId,
    expiresOn,
    isEditing,
    announcementId,
    router,
    showSuccessToast,
  ]);

  const screenHeader = (
    <AppHeader
      variant="back"
      title={isEditing ? 'Edit notification' : 'New notification'}
      onBackPress={router.canGoBack() ? router.back : undefined}
    />
  );

  if (isLoading) {
    return (
      <ScreenContainer header={screenHeader}>
        <LoadingState message="Loading the form..." />
      </ScreenContainer>
    );
  }

  if (loadErrorMessage && !isSaving) {
    return (
      <ScreenContainer header={screenHeader}>
        <ErrorState message={loadErrorMessage} onRetry={router.back} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer header={screenHeader} isScrollable>
      <AppTextInput
        label="Title"
        placeholder="Night service from Monday"
        value={title}
        onChangeText={setTitle}
        errorText={fieldErrors.title}
        maxLength={MAX_TITLE_LENGTH}
      />
      <AppTextInput
        label="Message"
        placeholder="What do passengers need to know?"
        value={message}
        onChangeText={setMessage}
        errorText={fieldErrors.message}
        helperText={`${message.trim().length} of ${MAX_MESSAGE_LENGTH} characters`}
        multiline
        maxLength={MAX_MESSAGE_LENGTH}
      />
      <AdminPickerField
        label="How urgent is it?"
        options={severityOptions}
        selectedKey={severity}
        onSelect={setSeverity}
        helperText="Critical alerts are shown first in a passenger's list."
      />
      <AdminPickerField
        label="Who receives it?"
        options={routePickerOptions}
        selectedKey={targetRouteKey}
        onSelect={setTargetRouteKey}
        errorText={fieldErrors.targetRouteId}
      />
      <AppTextInput
        label="Stop showing it after (optional)"
        placeholder={DATE_INPUT_HINT}
        value={expiresOn}
        onChangeText={setExpiresOn}
        errorText={fieldErrors.expiresAt}
        helperText={`Type the date as ${DATE_INPUT_HINT}, or leave it empty to keep it until archived.`}
        keyboardType="numbers-and-punctuation"
      />

      <AppCard>
        <Text style={typography.sectionHeading}>Who this would reach</Text>
        <Text style={[typography.bodyMedium, styles.mutedText]}>
          {audienceCount === null
            ? 'Counting the audience...'
            : `${audienceCount} passenger${audienceCount === 1 ? '' : 's'} would be notified when you publish this.`}
        </Text>
      </AppCard>

      <AppButton
        label={isEditing ? 'Save changes' : 'Save draft'}
        size="large"
        isFullWidth
        isLoading={isSaving}
        onPress={saveAnnouncement}
      />
      <Text style={[typography.caption, styles.mutedText]}>
        Saving does not notify anybody. Publish it from the list when you are ready.
      </Text>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  mutedText: {
    color: colors.text.secondary,
  },
});
