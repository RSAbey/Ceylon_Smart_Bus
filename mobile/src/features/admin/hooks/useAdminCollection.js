// Loading a list for an admin screen. All four management screens do the same three things — load,
// show a loading or error state, and reload after a change — so that lives here once instead of
// four times. Each screen still owns its own filters and its own rendering.
//
// The caller passes its loader wrapped in useCallback, listing the filters it reads. That is what
// makes this a plain dependency: when a filter changes the loader changes, and the list reloads.
//
// It also reloads when the screen is focused again, which is how a list shows a change that was
// saved on a form screen. The very first focus is the mount, which has already loaded, so that one
// is skipped rather than fetching the same list twice.
import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';

/**
 * Loads a list and reloads it whenever the loader changes or reload() is called.
 * @param {Function} loadCollection - Memoised async function that fetches and returns the payload.
 * @returns {{collection: object | null, isLoading: boolean, loadErrorMessage: string,
 *   reload: Function}} The list and its state.
 */
export default function useAdminCollection(loadCollection) {
  const [collection, setCollection] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadErrorMessage, setLoadErrorMessage] = useState('');
  const [reloadCounter, setReloadCounter] = useState(0);

  const reload = useCallback(() => setReloadCounter((previousCount) => previousCount + 1), []);

  useEffect(() => {
    let isEffectActive = true;

    loadCollection()
      .then((loadedCollection) => {
        if (!isEffectActive) return;
        setCollection(loadedCollection);
        setLoadErrorMessage('');
      })
      .catch((loadError) => {
        if (isEffectActive) setLoadErrorMessage(loadError.message);
      })
      .finally(() => {
        if (isEffectActive) setIsLoading(false);
      });

    // Ignore a reply that arrives after the filters have changed again.
    return () => {
      isEffectActive = false;
    };
  }, [loadCollection, reloadCounter]);

  const hasBeenFocusedBefore = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (hasBeenFocusedBefore.current) reload();
      hasBeenFocusedBefore.current = true;
    }, [reload])
  );

  return { collection, isLoading, loadErrorMessage, reload };
}
