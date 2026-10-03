// Toast provider + useToast(): short success / error / information messages in the bottom-right corner.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { CircleAlert, CircleCheck, Megaphone } from 'lucide-react';
import { ICON_SIZES } from '../../theme/iconSizes';

const TOAST_VISIBLE_MS = 3000;
const TOAST_ICONS = Object.freeze({ success: CircleCheck, error: CircleAlert, information: Megaphone });

const ToastContext = createContext(null);

/**
 * Wraps the app and renders the active toast.
 * @param {object} props - Component props.
 * @param {import('react').ReactNode} props.children - App tree.
 * @returns {import('react').JSX.Element} Provider.
 */
export function ToastProvider({ children }) {
  const [activeToast, setActiveToast] = useState(null);

  const showToast = useCallback((toastType, toastText) => {
    setActiveToast({ toastType, toastText, shownAt: Date.now() });
  }, []);

  useEffect(() => {
    if (!activeToast) return undefined;
    const hideTimerId = setTimeout(() => setActiveToast(null), TOAST_VISIBLE_MS);
    return () => clearTimeout(hideTimerId);
  }, [activeToast]);

  const toastActions = useMemo(
    () => ({
      showSuccessToast: (toastText) => showToast('success', toastText),
      showErrorToast: (toastText) => showToast('error', toastText),
      showInfoToast: (toastText) => showToast('information', toastText),
    }),
    [showToast]
  );

  const ToastIcon = activeToast ? TOAST_ICONS[activeToast.toastType] : null;

  return (
    <ToastContext.Provider value={toastActions}>
      {children}
      {activeToast && (
        <div className={`toast toast--${activeToast.toastType}`} role="status" aria-live="polite">
          <ToastIcon size={ICON_SIZES.medium} aria-hidden="true" />
          <span>{activeToast.toastText}</span>
        </div>
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
