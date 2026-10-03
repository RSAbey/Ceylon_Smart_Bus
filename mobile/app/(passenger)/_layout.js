// Passenger area layout: stack of passenger screens plus the slide-in DrawerMenu available to all of them.
import { Stack } from 'expo-router';
import { DrawerProvider } from '../../src/components/navigation/DrawerContext';
import DrawerMenu from '../../src/components/navigation/DrawerMenu';

/**
 * Hosts the drawer once so every passenger screen header can open it.
 * @returns {import('react').JSX.Element} Passenger stack with drawer.
 */
export default function PassengerLayout() {
  return (
    <DrawerProvider>
      <Stack screenOptions={{ headerShown: false }} />
      <DrawerMenu />
    </DrawerProvider>
  );
}
