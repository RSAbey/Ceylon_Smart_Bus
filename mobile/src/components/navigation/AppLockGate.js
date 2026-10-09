// Decides whether the app lock screen covers the app (Member 01, NFR-07).
// The lock is drawn over the navigator rather than instead of it, so navigation and the splash
// screen behave exactly as they always did and the lock is simply an opaque layer on top.
//
// It covers the app when both are true:
//   - the session was restored from storage, not created a moment ago by typing a password, and
//   - this device has recorded that the account has a PIN.
// A session that was not remembered is never restored, so an unticked "Remember me" means the app
// asks for the password instead and no PIN is needed.
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme';
import { getIsAppPinSet, setIsAppPinSet } from '../../utils/appLockStorage';
import { fetchAppPinStatus } from '../../features/profile/services/appPinApi';
import PinLockScreen from '../../features/auth/screens/PinLockScreen';

/** What the gate is doing: still deciding, covering the app, or out of the way. */
const GATE_STATES = Object.freeze({ DECIDING: 'deciding', LOCKED: 'locked', OPEN: 'open' });

/**
 * Wraps the app and shows the lock screen when it is needed.
 * @param {object} props - Component props.
 * @param {import('react').ReactNode} props.children - The navigator.
 * @returns {import('react').JSX.Element} The app, with the lock over it when locked.
 */
export default function AppLockGate({ children }) {
  const { user, wasSessionRestored } = useAuth();
  const [gateState, setGateState] = useState(GATE_STATES.DECIDING);

  // Keyed on the user's id, not the user object: editing a profile replaces that object, and
  // re-deciding then would lock the app again in the middle of someone using it.
  const signedInUserId = user?.id;

  useEffect(() => {
    let isEffectActive = true;

    /**
     * Works out whether this launch needs the PIN.
     * @returns {Promise<void>} Resolves once the gate has decided.
     */
    async function decideWhetherToCover() {
      if (!signedInUserId || !wasSessionRestored) {
        if (isEffectActive) setGateState(GATE_STATES.OPEN);
        return;
      }
      const isPinSet = await getIsAppPinSet();
      if (isEffectActive) {
        setGateState(isPinSet ? GATE_STATES.LOCKED : GATE_STATES.OPEN);
      }
    }

    decideWhetherToCover();
    return () => {
      isEffectActive = false;
    };
  }, [signedInUserId, wasSessionRestored]);

  useEffect(() => {
    if (!signedInUserId) return undefined;
    let isEffectActive = true;

    /**
     * Brings the device's record of the lock up to date with the server, so a PIN set on another
     * device is honoured from the next launch onwards.
     * @returns {Promise<void>} Resolves once the device has been told, or the attempt has failed.
     */
    async function refreshStoredPinState() {
      try {
        const pinStatus = await fetchAppPinStatus();
        if (isEffectActive) await setIsAppPinSet(pinStatus.isPinSet);
      } catch (refreshError) {
        // Out of reach: keep what the device already knows rather than unlocking by accident.
        console.warn('Could not refresh the app lock state:', refreshError.message);
      }
    }

    refreshStoredPinState();
    return () => {
      isEffectActive = false;
    };
  }, [signedInUserId]);

  // While the gate is still deciding, cover a signed-in app so the home screen cannot flash past
  // the lock. A signed-out app has nothing to hide, so the sign-in screen is never covered.
  const isCovering = gateState !== GATE_STATES.OPEN && Boolean(signedInUserId);

  return (
    <View style={styles.container}>
      {children}
      {isCovering && (
        <View style={styles.lockLayer}>
          {gateState === GATE_STATES.LOCKED && (
            <PinLockScreen onUnlocked={() => setGateState(GATE_STATES.OPEN)} />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  lockLayer: {
    ...StyleSheet.absoluteFillObject,
    // Opaque even for the instant before the lock screen itself is drawn, so nothing shows through.
    backgroundColor: colors.background,
  },
});
