// Asks for the device location once and reports it, so screens do not each repeat the permission dance.
// The position is used in the session only and never stored on the server (NFR-08).
import { useCallback, useEffect, useState } from 'react';
import * as Location from 'expo-location';

/**
 * Requests permission and reads the current position.
 * @returns {{position: {latitude: number, longitude: number} | null, isLocating: boolean,
 *   locationErrorMessage: string, retryLocation: Function}} Location state and a retry action.
 */
export default function useCurrentLocation() {
  const [position, setPosition] = useState(null);
  const [isLocating, setIsLocating] = useState(true);
  const [locationErrorMessage, setLocationErrorMessage] = useState('');
  const [attemptCount, setAttemptCount] = useState(0);

  const retryLocation = useCallback(() => setAttemptCount((previousCount) => previousCount + 1), []);

  useEffect(() => {
    let isEffectActive = true;

    Location.requestForegroundPermissionsAsync()
      .then((permission) => {
        if (permission.status !== 'granted') {
          throw new Error('Allow location access to see buses near you.');
        }
        return Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      })
      .then((devicePosition) => {
        if (!isEffectActive) return;
        setPosition({
          latitude: devicePosition.coords.latitude,
          longitude: devicePosition.coords.longitude,
        });
        setLocationErrorMessage('');
      })
      .catch((locationError) => {
        if (isEffectActive) setLocationErrorMessage(locationError.message);
      })
      .finally(() => {
        if (isEffectActive) setIsLocating(false);
      });

    return () => {
      isEffectActive = false;
    };
  }, [attemptCount]);

  return { position, isLocating, locationErrorMessage, retryLocation };
}
