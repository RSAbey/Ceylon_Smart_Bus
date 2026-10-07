// Verify Ticket (Member 03, FR-09): the driver scans a passenger's QR code, or types the ticket
// code when the camera cannot read it. Both ways live on this one screen (NFR-06).
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import ScreenContainer from '../../../components/ui/ScreenContainer';
import AppHeader from '../../../components/navigation/AppHeader';
import AppCard from '../../../components/ui/AppCard';
import AppButton from '../../../components/ui/AppButton';
import AppTextInput from '../../../components/ui/AppTextInput';
import StatusBadge from '../../../components/ui/StatusBadge';
import LoadingState from '../../../components/feedback/LoadingState';
import { useDrawer } from '../../../components/navigation/DrawerContext';
import { CURRENCY_PREFIX } from '../../tickets/constants';
import { MIN_TOUCH_TARGET, colors, radii, sizes, spacing, typography } from '../../../theme';
import { fetchMyVerifications, verifyTicket } from '../services/verificationApi';
import {
  QR_PAYLOAD_TYPE,
  VERIFICATION_MESSAGES,
  VERIFICATION_METHODS,
  VERIFICATION_MODES,
  VERIFICATION_RESULTS,
} from '../constants';

/**
 * Reads a scanned QR code and pulls out the ticket fields, or returns null when it is not one of ours.
 * @param {string} scannedText - Raw text inside the QR code.
 * @returns {{ticketKey: string, qrSignature: string} | null} Ticket fields, or null.
 */
function readTicketQrCode(scannedText) {
  try {
    const scannedPayload = JSON.parse(scannedText);
    if (scannedPayload.type !== QR_PAYLOAD_TYPE) return null;
    if (!scannedPayload.ticketKey || !scannedPayload.qrSignature) return null;
    return { ticketKey: scannedPayload.ticketKey, qrSignature: scannedPayload.qrSignature };
  } catch {
    // Any QR code that is not our JSON belongs to something else entirely.
    return null;
  }
}

/**
 * The answer card shown after a check: a clear icon, wording and colour together.
 * @param {object} props - Component props.
 * @param {object} props.verification - What the server replied.
 * @param {Function} props.onCheckAnother - Clears the result so the scanner is ready again.
 * @returns {import('react').JSX.Element} The result card.
 */
function VerificationResultCard({ verification, onCheckAnother }) {
  return (
    <AppCard>
      <View style={styles.resultHeaderRow}>
        <Ionicons
          name={verification.isValid ? 'checkmark-circle' : 'close-circle'}
          size={sizes.iconHuge}
          color={verification.isValid ? colors.success.dark : colors.error.dark}
        />
        <View style={styles.resultHeaderText}>
          <Text style={typography.heading3}>
            {verification.isValid ? 'Valid ticket' : 'Not valid'}
          </Text>
          <Text style={[typography.bodyMedium, styles.mutedText]}>{verification.reason}</Text>
        </View>
      </View>

      {verification.ticket && (
        <View style={styles.resultDetailBlock}>
          <Text style={typography.bodyLarge}>{verification.ticket.passengerName}</Text>
          <Text style={[typography.bodySmall, styles.mutedText]}>
            {verification.ticket.boardingStopName} to {verification.ticket.alightingStopName}
          </Text>
          <Text style={[typography.bodySmall, styles.mutedText]}>
            {verification.ticket.seatNumbers?.length === 1 ? 'Seat' : 'Seats'}{' '}
            {verification.ticket.seatNumbers?.join(', ') || 'released'} · {CURRENCY_PREFIX}{' '}
            {verification.ticket.fareAmount} · {verification.ticket.ticketKey}
          </Text>
        </View>
      )}

      <AppButton
        label={VERIFICATION_MESSAGES.scanAnother}
        size="large"
        isFullWidth
        iconName="refresh"
        onPress={onCheckAnother}
      />
    </AppCard>
  );
}

/**
 * The driver's ticket checking screen.
 * @returns {import('react').JSX.Element} The screen.
 */
export default function VerifyTicketScreen() {
  const drawer = useDrawer();
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  const [activeMethod, setActiveMethod] = useState(VERIFICATION_METHODS.QR);
  const [typedTicketKey, setTypedTicketKey] = useState('');
  const [verification, setVerification] = useState(null);
  const [recentChecks, setRecentChecks] = useState([]);
  const [isChecking, setIsChecking] = useState(false);
  const [checkErrorMessage, setCheckErrorMessage] = useState('');
  const [reloadCounter, setReloadCounter] = useState(0);

  const reloadRecentChecks = useCallback(
    () => setReloadCounter((previousCount) => previousCount + 1),
    []
  );

  useEffect(() => {
    let isEffectActive = true;
    fetchMyVerifications()
      .then((loadedChecks) => {
        if (isEffectActive) setRecentChecks(loadedChecks);
      })
      .catch(() => {
        // The recent list is a convenience; failing to load it must not block checking tickets.
        if (isEffectActive) setRecentChecks([]);
      });
    return () => {
      isEffectActive = false;
    };
  }, [reloadCounter]);

  /**
   * Sends one check to the server and keeps the answer on screen.
   * @param {object} checkRequest - ticketKey, plus qrSignature when it came from a scan.
   * @returns {Promise<void>} Resolves once the answer is stored.
   */
  const runCheck = useCallback(
    async (checkRequest) => {
      setIsChecking(true);
      setCheckErrorMessage('');
      try {
        const checkAnswer = await verifyTicket(checkRequest);
        setVerification(checkAnswer);
        setTypedTicketKey('');
        reloadRecentChecks();
      } catch (checkError) {
        setCheckErrorMessage(checkError.message);
      } finally {
        setIsChecking(false);
      }
    },
    [reloadRecentChecks]
  );

  /**
   * Handles a QR code coming from the camera. Ignored while a result is on screen so one code is
   * not checked over and over.
   * @param {object} scanEvent - What the camera read.
   * @param {string} scanEvent.data - Raw text inside the QR code.
   * @returns {void}
   */
  function handleScannedCode({ data: scannedText }) {
    if (verification || isChecking) return;
    const scannedTicket = readTicketQrCode(scannedText);
    if (!scannedTicket) {
      setCheckErrorMessage(VERIFICATION_MESSAGES.unreadableCode);
      return;
    }
    runCheck(scannedTicket);
  }

  const screenHeader = (
    <AppHeader
      variant="back"
      title="Verify Ticket"
      onMenuPress={drawer ? drawer.openDrawer : undefined}
    />
  );

  const methodToggle = (
    <View style={styles.toggleRow}>
      {VERIFICATION_MODES.map((verificationMode) => {
        const isActiveMode = verificationMode.method === activeMethod;
        return (
          <Pressable
            key={verificationMode.method}
            onPress={() => {
              setActiveMethod(verificationMode.method);
              setCheckErrorMessage('');
            }}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActiveMode }}
            accessibilityLabel={verificationMode.label}
            style={[styles.toggleButton, isActiveMode && styles.toggleButtonActive]}
          >
            <Ionicons
              name={verificationMode.iconName}
              size={sizes.iconMedium}
              color={isActiveMode ? colors.primary[600] : colors.text.secondary}
            />
            <Text style={[typography.label, isActiveMode && styles.toggleTextActive]}>
              {verificationMode.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );

  if (!cameraPermission) {
    return (
      <ScreenContainer header={screenHeader}>
        <LoadingState message="Checking camera access..." />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer isScrollable header={screenHeader}>
      {methodToggle}

      {verification ? (
        <VerificationResultCard
          verification={verification}
          onCheckAnother={() => {
            setVerification(null);
            setCheckErrorMessage('');
          }}
        />
      ) : (
        <AppCard>
          {activeMethod === VERIFICATION_METHODS.QR ? (
            <View>
              {cameraPermission.granted ? (
                <View style={styles.cameraFrame}>
                  <CameraView
                    style={styles.camera}
                    facing="back"
                    barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                    onBarcodeScanned={handleScannedCode}
                  />
                </View>
              ) : (
                <View style={styles.permissionBlock}>
                  <Ionicons
                    name="camera-outline"
                    size={sizes.iconHuge}
                    color={colors.text.secondary}
                  />
                  <Text style={[typography.bodyMedium, styles.centredText]}>
                    {cameraPermission.canAskAgain
                      ? VERIFICATION_MESSAGES.cameraNeeded
                      : VERIFICATION_MESSAGES.cameraDenied}
                  </Text>
                  {cameraPermission.canAskAgain && (
                    <AppButton
                      label="Allow camera"
                      iconName="camera"
                      onPress={requestCameraPermission}
                    />
                  )}
                </View>
              )}
              <Text style={[typography.bodySmall, styles.cameraHint]}>
                {cameraPermission.granted
                  ? VERIFICATION_MESSAGES.aimAtCode
                  : VERIFICATION_MESSAGES.typeHint}
              </Text>
            </View>
          ) : (
            <View style={styles.typedBlock}>
              <AppTextInput
                label="Ticket code"
                value={typedTicketKey}
                onChangeText={setTypedTicketKey}
                helperText={VERIFICATION_MESSAGES.typeHint}
                iconName="keypad-outline"
              />
              <AppButton
                label="Check this ticket"
                size="large"
                isFullWidth
                isLoading={isChecking}
                isDisabled={typedTicketKey.trim().length === 0}
                onPress={() => runCheck({ ticketKey: typedTicketKey.trim() })}
              />
            </View>
          )}
        </AppCard>
      )}

      {checkErrorMessage.length > 0 && (
        <View style={styles.errorRow}>
          <Ionicons name="alert-circle" size={sizes.iconMedium} color={colors.error.dark} />
          <Text style={[typography.bodySmall, styles.errorText]}>{checkErrorMessage}</Text>
        </View>
      )}

      <Text style={[typography.sectionHeading, styles.mutedText]}>Recent checks</Text>
      {recentChecks.length === 0 ? (
        <Text style={[typography.bodySmall, styles.mutedText]}>
          {VERIFICATION_MESSAGES.noChecksYet}
        </Text>
      ) : (
        recentChecks.map((recentCheck) => (
          <AppCard key={recentCheck.id}>
            <View style={styles.recentRow}>
              <View style={styles.recentText}>
                <Text style={typography.bodyLarge}>{recentCheck.ticketKey}</Text>
                <Text style={[typography.caption, styles.mutedText]}>
                  {recentCheck.method === VERIFICATION_METHODS.QR ? 'Scanned' : 'Typed'} ·{' '}
                  {new Date(recentCheck.verifiedAt).toLocaleTimeString()}
                </Text>
              </View>
              <StatusBadge
                status={
                  recentCheck.verificationResult === VERIFICATION_RESULTS.VALID ? 'valid' : 'invalid'
                }
              />
            </View>
          </AppCard>
        ))
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  mutedText: {
    color: colors.text.secondary,
  },
  centredText: {
    textAlign: 'center',
  },
  toggleRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    minHeight: MIN_TOUCH_TARGET,
    borderRadius: radii.md,
    borderWidth: sizes.borderThin,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  toggleButtonActive: {
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[100],
  },
  toggleTextActive: {
    color: colors.primary[600],
  },
  cameraFrame: {
    aspectRatio: 1,
    borderRadius: radii.lg,
    overflow: 'hidden',
    backgroundColor: colors.text.primary,
  },
  camera: {
    flex: 1,
  },
  cameraHint: {
    marginTop: spacing.md,
    textAlign: 'center',
    color: colors.text.secondary,
  },
  permissionBlock: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xxl,
  },
  typedBlock: {
    gap: spacing.lg,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.error.light,
  },
  errorText: {
    flex: 1,
    color: colors.error.dark,
  },
  resultHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  resultHeaderText: {
    flex: 1,
    gap: spacing.xxs,
  },
  resultDetailBlock: {
    gap: spacing.xxs,
    marginVertical: spacing.lg,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.background,
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  recentText: {
    flex: 1,
    gap: spacing.xxs,
  },
});
