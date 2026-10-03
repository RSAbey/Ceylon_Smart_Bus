// Auth area layout (Member 01 screens): login, register, OTP in a header-less stack.
import { Stack } from 'expo-router';

/**
 * Stack for the signed-out screens.
 * @returns {import('react').JSX.Element} Auth stack.
 */
export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
