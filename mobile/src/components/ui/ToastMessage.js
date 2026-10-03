// Toast provider + useToast(): short success / error / info messages shown at the bottom of the screen.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, durations, radii, shadows, sizes, spacing, typography } from '../../theme';

/** Icon + palette colours per toast type (icon and text, never colour alone). */
const TOAST_APPEARANCES = Object.freeze({
  success: { iconName: 'checkmark-circle', tone: colors.success },
  error: { iconName: 'alert-circle', tone: colors.error },
  information: { iconName: 'information-circle', tone: colors.information },
});

const HIDDEN_OPACITY = 0;
const VISIBLE_OPACITY = 1;

const ToastContext = createContext(null);

/**
 * Wraps the app and renders the toast above every screen.
 * @param {object} props - Component props.
 * @param {import('react').ReactNode} props.children - App tree.
 * @returns {import('react').JSX.Element} Provider with the toast overlay.
 */
export function ToastProvider({ children }) {
  const [activeToast, setActiveToast] = useState(null);
  // useState initialiser creates the animated value once without reading a ref during render.
  const [toastOpacity] = useState(() => new Animated.Value(HIDDEN_OPACITY));
  const safeAreaInsets = useSafeAreaInsets();

  const showToast = useCallback((toastType, toastText) => {
    setActiveToast({ toastType, toastText, shownAt: Date.now() });
  }, []);

  useEffect(() => {
    if (!activeToast) return undefined;
    Animated.timing(toastOpacity, { toValue: VISIBLE_OPACITY, duration: durations.fast, useNativeDriver: true }).start();
    const hideTimerId = setTimeout(() => {
      Animated.timing(toastOpacity, { toValue: HIDDEN_OPACITY, duration: durations.fast, useNativeDriver: true }).start(
        () => setActiveToast(null)
      );
    }, durations.toastVisible);
    return () => clearTimeout(hideTimerId);
  }, [activeToast, toastOpacity]);

  const toastActions = useMemo(
    () => ({
      showSuccessToast: (toastText) => showToast('success', toastText),
      showErrorToast: (toastText) => showToast('error', toastText),
      showInfoToast: (toastText) => showToast('information', toastText),
    }),
    [showToast]
  );

  const toastAppearance = activeToast ? TOAST_APPEARANCES[activeToast.toastType] : null;

  return (
    <ToastContext.Provider value={toastActions}>
      {children}
      {activeToast && (
        <Animated.View
          accessibilityLiveRegion="polite"
          accessibilityRole="alert"
          style={[
            styles.toastBox,
            { opacity: toastOpacity, bottom: safeAreaInsets.bottom + sizes.bottomTabHeight + spacing.lg },
            { backgroundColor: toastAppearance.tone.light, borderColor: toastAppearance.tone.main },
          ]}
        >
          <Ionicons name={toastAppearance.iconName} size={sizes.iconLarge} color={toastAppearance.tone.dark} />
          <Text style={[typography.bodyMedium, styles.toastText, { color: toastAppearance.tone.dark }]}>
            {activeToast.toastText}
          </Text>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

/**
 * Returns { showSuccessToast, showErrorToast, showInfoToast }; must be used inside <ToastProvider>.
 * @returns {{showSuccessToast: Function, showErrorToast: Function, showInfoToast: Function}} Toast actions.
 */
export function useToast() {
  const toastActions = useContext(ToastContext);
  if (!toastActions) {
    throw new Error('useToast must be used inside <ToastProvider>.');
  }
  return toastActions;
}

const styles = StyleSheet.create({
  toastBox: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: sizes.borderThin,
    ...shadows.raised,
  },
  toastText: {
    flex: 1,
  },
});
