// Driver area layout: header-less stack (tabs, delay history, inquiries). Drivers have no drawer menu.
import { Stack } from 'expo-router';

/**
 * Stack for the driver screens.
 * @returns {import('react').JSX.Element} Driver stack.
 */
export default function DriverLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
