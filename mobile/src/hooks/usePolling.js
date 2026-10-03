// Runs a function every N milliseconds while the app is in the foreground (used for live tracking and notifications).
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

const ACTIVE_APP_STATE = 'active';

/**
 * Calls `pollCallback` on an interval, pauses while the app is in the background and stops on unmount.
 * @param {Function} pollCallback - Work to repeat (may be async).
 * @param {number} intervalMs - Delay between calls in milliseconds.
 * @param {{runImmediately?: boolean}} [pollingOptions] - runImmediately (default true) also calls it at start/resume.
 * @returns {void}
 */
export default function usePolling(pollCallback, intervalMs, { runImmediately = true } = {}) {
  const latestPollCallback = useRef(pollCallback);

  // Keep the newest callback without restarting the timer on every render.
  useEffect(() => {
    latestPollCallback.current = pollCallback;
  }, [pollCallback]);

  useEffect(() => {
    let pollTimerId = null;

    const startPolling = () => {
      if (pollTimerId) return;
      if (runImmediately) latestPollCallback.current();
      pollTimerId = setInterval(() => latestPollCallback.current(), intervalMs);
    };
    const stopPolling = () => {
      clearInterval(pollTimerId);
      pollTimerId = null;
    };

    if (AppState.currentState === ACTIVE_APP_STATE) startPolling();
    // Polling in the background wastes battery and mobile data, so pause until the app is visible again.
    const appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === ACTIVE_APP_STATE) startPolling();
      else stopPolling();
    });

    return () => {
      stopPolling();
      appStateSubscription.remove();
    };
  }, [intervalMs, runImmediately]);
}
