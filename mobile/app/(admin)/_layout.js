// Admin area layout: a header-less stack holding the tabs and the form screens they push.
import { Stack } from 'expo-router';

/**
 * Stack for the admin screens.
 * @returns {import('react').JSX.Element} Admin stack.
 */
export default function AdminLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
