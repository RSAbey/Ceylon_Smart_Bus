// Delays a fast-changing input (such as a search box) so the API is not called on every keystroke.
import { useEffect, useState } from 'react';
import { SEARCH_DEBOUNCE_MS } from '../utils/constants';

/**
 * Returns `latestInput` only after it has stopped changing for `delayMs`.
 * @template InputType
 * @param {InputType} latestInput - The value that changes quickly.
 * @param {number} [delayMs] - Quiet period before updating (default SEARCH_DEBOUNCE_MS).
 * @returns {InputType} The debounced copy.
 */
export default function useDebouncedValue(latestInput, delayMs = SEARCH_DEBOUNCE_MS) {
  const [debouncedInput, setDebouncedInput] = useState(latestInput);

  useEffect(() => {
    const debounceTimerId = setTimeout(() => setDebouncedInput(latestInput), delayMs);
    return () => clearTimeout(debounceTimerId);
  }, [latestInput, delayMs]);

  return debouncedInput;
}
