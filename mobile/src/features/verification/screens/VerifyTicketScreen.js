// Verify Ticket (Member 03, FR-09): the driver scans a passenger QR code, or types the ticket code
// when the camera cannot read it. Both ways live on this one screen (NFR-06).
// The screen has two faces: the scanner, and the valid/invalid answer.
import { useCallback, useEffect, useState } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import ScreenContainer from '../../../components/ui/ScreenContainer';
import AppCard from '../../../components/ui/AppCard';
import AppButton from '../../../components/ui/AppButton';
import AppTextInput from '../../../components/ui/AppTextInput';
import LoadingState from '../../../components/feedback/LoadingState';
import VerificationResult from '../components/VerificationResult';
import { MIN_TOUCH_TARGET, colors, radii, sizes, spacing, typography } from '../../../theme';
import { formatValidUntil } from '../../tickets/formatters';
import { fetchMyTripOverview } from '../../tracking/services/trackingApi';
import { verifyTicket } from '../services/verificationApi';
import { QR_PAYLOAD_TYPE, VERIFICATION_MESSAGES } from '../constants';

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
 * The driver's ticket checking screen.
 * @returns {import('react').JSX.Element} The screen.
 */
export default function VerifyTicketScreen() {
  const router = useRouter();
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  const [tripOverview, setTripOverview] = useState(null);
  const [verification, setVerification] = useState(null);
  const [isCodeEntryOpen, setIsCodeEntryOpen] = useState(false);
  const [typedTicketKey, setTypedTicketKey] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [checkErrorMessage, setCheckErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [reloadCounter, setReloadCounter] = useState(0);

  const reloadTrip = useCallback(() => setReloadCounter((previousCount) => previousCount + 1), []);
  // The preview is only mounted while this tab is on screen: Android hands the camera to one view at
  // a time, and a preview left mounted in the background comes back black.
  const [isScreenFocused, setIsScreenFocused] = useState(false);

  // The driver may have started or ended the trip on another tab, so re-check on focus.
  useFocusEffect(reloadTrip);
  useFocusEffect(
    useCallback(() => {
      setIsScreenFocused(true);
      return () => setIsScreenFocused(false);
    }, [])
  );

  useEffect(() => {
    let isEffectActive = true;
    fetchMyTripOverview()
      .then((loadedOverview) => {
        if (isEffectActive) setTripOverview(loadedOverview);
      })
      .catch(() => {
        if (isEffectActive) setTripOverview(null);
      })
      .finally(() => {
        if (isEffectActive) setIsLoading(false);
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
  const runCheck = useCallback(async (checkRequest) => {
    setIsChecking(true);
    setCheckErrorMessage('');
    try {
      const checkAnswer = await verifyTicket(checkRequest);
      setVerification(checkAnswer);
      setTypedTicketKey('');
      setIsCodeEntryOpen(false);
    } catch (checkError) {
      setCheckErrorMessage(checkError.message);
    } finally {
      setIsChecking(false);
    }
  }, []);

  /**
   * Handles a QR code from the camera. Ignored while an answer is on screen, so one code is not
   * checked over and over while the driver reads the result.
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

  const runningRoute = tripOverview?.route;
  const screenHeader = (
    <View style={styles.header}>
      <View style={styles.headerTextBlock}>
        <Text style={typography.heading2}>Verify Ticket</Text>
        {runningRoute && (
          <Text style={[typography.bodySmall, styles.mutedText]}>
            Bus {runningRoute.routeNumber}, {runningRoute.origin} &#8594; {runningRoute.destination}
          </Text>
        )}
      </View>
      <AppButton
        label={VERIFICATION_MESSAGES.shiftTotals}
        variant="outline"
        size="small"
        iconName="receipt-outline"
        onPress={() => router.push('/(driver)/shift')}
      />
    </View>
  );

  const codeEntryDialog = (
    <Modal
      visible={isCodeEntryOpen}
      animationType="slide"
      transparent
      onRequestClose={() => setIsCodeEntryOpen(false)}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHeaderRow}>
            <Text style={typography.heading3}>Enter ticket code</Text>
            <AppButton
              label="Close"
              variant="text"
              size="small"
              onPress={() => setIsCodeEntryOpen(false)}
            />
          </View>
          <AppTextInput
            label="Ticket code"
            value={typedTicketKey}
            onChangeText={setTypedTicketKey}
            helperText={VERIFICATION_MESSAGES.typeHint}
            iconName="keypad-outline"
            autoCapitalize="characters"
          />
          <AppButton
            label="Check this ticket"
            size="large"
            isFullWidth
            isLoading={isChecking}
            isDisabled={typedTicketKey.trim().length === 0}
            onPress={() => runCheck({ ticketKey: typedTicketKey.trim().toUpperCase() })}
          />
        </View>
      </View>
    </Modal>
  );

  if (isLoading || !cameraPermission) {
    return (
      <ScreenContainer header={screenHeader}>
        <LoadingState message="Getting the scanner ready..." />
      </ScreenContainer>
    );
  }

  // Without a running trip the server has no bus to check a ticket against, so say so up front.
  if (!tripOverview?.isTripRunning) {
    return (
      <ScreenContainer header={screenHeader}>
        <AppCard>
          <View style={styles.noTripBlock}>
            <Ionicons name="bus-outline" size={sizes.iconHuge} color={colors.text.secondary} />
            <Text style={typography.heading3}>{VERIFICATION_MESSAGES.noTripTitle}</Text>
            <Text style={[typography.bodyMedium, styles.centredText]}>
              {VERIFICATION_MESSAGES.noTripMessage}
            </Text>
          </View>
        </AppCard>
        <AppButton
          label="Go to my trip"
          size="large"
          isFullWidth
          iconName="play-circle-outline"
          onPress={() => router.push('/(driver)/(tabs)/live')}
        />
      </ScreenContainer>
    );
  }

  if (verification) {
    return (
      <ScreenContainer
        isScrollable
        header={screenHeader}
        footer={
          <View style={styles.footerBar}>
            <AppButton
              label={VERIFICATION_MESSAGES.scanNext}
              size="large"
              isFullWidth
              onPress={() => {
                setVerification(null);
                setCheckErrorMessage('');
              }}
            />
            <AppButton
              label={VERIFICATION_MESSAGES.enterManually}
              variant="outline"
              size="large"
              isFullWidth
              onPress={() => {
                setVerification(null);
                setIsCodeEntryOpen(true);
              }}
            />
          </View>
        }
      >
        <VerificationResult
          verification={verification}
          validUntilText={
            verification.ticket?.validUntil ? formatValidUntil(verification.ticket.validUntil) : ''
          }
        />
        {codeEntryDialog}
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer
      hasPadding={false}
      header={screenHeader}
      footer={
        <View style={styles.footerBar}>
          <AppButton
            label="Enter Code"
            variant="outline"
            size="large"
            isFullWidth
            iconName="keypad-outline"
            onPress={() => setIsCodeEntryOpen(true)}
          />
        </View>
      }
    >
      <View style={styles.scannerWrapper}>
        <View style={styles.cameraFrame}>
          {cameraPermission.granted && isScreenFocused ? (
            <CameraView
              style={styles.camera}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={handleScannedCode}
            />
          ) : cameraPermission.granted ? (
            <View style={styles.camera} />
          ) : (
            <View style={styles.permissionBlock}>
              <Ionicons name="camera-outline" size={sizes.iconHuge} color={colors.text.onColor} />
              <Text style={[typography.bodyMedium, styles.onDarkText]}>
                {cameraPermission.canAskAgain
                  ? VERIFICATION_MESSAGES.cameraNeeded
                  : VERIFICATION_MESSAGES.cameraDenied}
              </Text>
              {cameraPermission.canAskAgain && (
                <AppButton label="Allow camera" iconName="camera" onPress={requestCameraPermission} />
              )}
            </View>
          )}

          {/* Corner marks and a centre line, so the driver knows where to hold the code. */}
          {cameraPermission.granted && (
            <View style={styles.reticle} pointerEvents="none">
              <View style={[styles.reticleCorner, styles.reticleTopLeft]} />
              <View style={[styles.reticleCorner, styles.reticleTopRight]} />
              <View style={styles.reticleLine} />
              <View style={[styles.reticleCorner, styles.reticleBottomLeft]} />
              <View style={[styles.reticleCorner, styles.reticleBottomRight]} />
            </View>
          )}

          <View style={styles.hintPill} pointerEvents="none">
            <Text style={[typography.bodyMedium, styles.onDarkText]}>
              {checkErrorMessage || VERIFICATION_MESSAGES.aimAtCode}
            </Text>
          </View>
        </View>
      </View>

      {codeEntryDialog}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: sizes.screenGutter,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
  },
  headerTextBlock: {
    flex: 1,
    gap: spacing.xxs,
  },
  mutedText: {
    color: colors.text.secondary,
  },
  centredText: {
    textAlign: 'center',
  },
  onDarkText: {
    color: colors.text.onColor,
    textAlign: 'center',
  },
  noTripBlock: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xxl,
  },
  scannerWrapper: {
    flex: 1,
    padding: sizes.screenGutter,
  },
  /* The camera preview is a native surface. Android clips it to black inside a rounded, overflowing
     container, and an absolutely positioned preview can come out with no size at all — which is why
     this frame has square corners, no overflow rule, and gives the preview a plain flex child. */
  cameraFrame: {
    flex: 1,
    backgroundColor: colors.text.primary,
  },
  camera: {
    flex: 1,
  },
  permissionBlock: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    padding: spacing.xl,
  },
  reticle: {
    ...StyleSheet.absoluteFillObject,
    margin: '18%',
    justifyContent: 'center',
  },
  reticleCorner: {
    position: 'absolute',
    width: sizes.iconXLarge,
    height: sizes.iconXLarge,
    borderColor: colors.secondary[500],
  },
  reticleTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: sizes.borderThick,
    borderLeftWidth: sizes.borderThick,
    borderTopLeftRadius: radii.sm,
  },
  reticleTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: sizes.borderThick,
    borderRightWidth: sizes.borderThick,
    borderTopRightRadius: radii.sm,
  },
  reticleBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: sizes.borderThick,
    borderLeftWidth: sizes.borderThick,
    borderBottomLeftRadius: radii.sm,
  },
  reticleBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: sizes.borderThick,
    borderRightWidth: sizes.borderThick,
    borderBottomRightRadius: radii.sm,
  },
  reticleLine: {
    height: sizes.borderThick,
    backgroundColor: colors.secondary[500],
  },
  /* Sits over the preview rather than below it, now that the preview fills the frame. */
  hintPill: {
    position: 'absolute',
    bottom: spacing.xl,
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.overlay,
  },
  footerBar: {
    gap: spacing.md,
    padding: sizes.screenGutter,
    borderTopWidth: sizes.borderThin,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.overlay,
  },
  modalSheet: {
    gap: spacing.lg,
    padding: sizes.screenGutter,
    paddingBottom: MIN_TOUCH_TARGET,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    backgroundColor: colors.surface,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
