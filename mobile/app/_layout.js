// Root layout: loads Inter, keeps the splash screen until ready, adds providers and keeps each role in its own area.
import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { ToastProvider } from '../src/components/ui/ToastMessage';
import AppLockGate from '../src/components/navigation/AppLockGate';
import { LOGIN_ROUTE, ROLE_HOME_ROUTES, USER_ROLES } from '../src/utils/constants';

// Keep the splash visible until fonts and the saved session are loaded (avoids a flash of the login screen).
SplashScreen.preventAutoHideAsync();

const AUTH_ROUTE_GROUP = '(auth)';
const ROLE_ROUTE_GROUPS = Object.freeze({
  [USER_ROLES.PASSENGER]: '(passenger)',
  [USER_ROLES.DRIVER]: '(driver)',
  [USER_ROLES.ADMIN]: '(admin)',
});

/**
 * Sends signed-out users to login, and keeps passengers and drivers inside their own route group.
 * The root index route (no group yet) is handled by app/index.js.
 * @returns {import('react').JSX.Element | null} The navigation stack once the session is known.
 */
function RootNavigator() {
  const { user, isLoading } = useAuth();
  const routeSegments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    SplashScreen.hideAsync();

    const currentRouteGroup = routeSegments[0];
    if (!currentRouteGroup) return;
    if (!user) {
      if (currentRouteGroup !== AUTH_ROUTE_GROUP) router.replace(LOGIN_ROUTE);
      return;
    }
    if (currentRouteGroup !== ROLE_ROUTE_GROUPS[user.role]) {
      router.replace(ROLE_HOME_ROUTES[user.role]);
    }
  }, [isLoading, user, routeSegments, router]);

  if (isLoading) return null;
  return <Stack screenOptions={{ headerShown: false }} />;
}

/**
 * App root: fonts first, then Safe Area, Auth and Toast providers around the navigator.
 * @returns {import('react').JSX.Element | null} The app, or null while fonts load (splash still visible).
 */
export default function RootLayout() {
  const [areFontsLoaded] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold });

  if (!areFontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ToastProvider>
          <StatusBar style="dark" />
          <AppLockGate>
            <RootNavigator />
          </AppLockGate>
        </ToastProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
