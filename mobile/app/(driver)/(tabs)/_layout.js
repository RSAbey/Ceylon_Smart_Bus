// Driver bottom navigation: Dashboard · Trip · Verify · Delay · Profile (same BottomTabBar, driver icon map).
import { Tabs } from 'expo-router/js-tabs';
import BottomTabBar from '../../../src/components/navigation/BottomTabBar';

const DRIVER_TAB_ICONS = Object.freeze({
  dashboard: 'speedometer-outline',
  trip: 'bus-outline',
  'verify-ticket': 'qr-code-outline',
  'delay-report': 'time-outline',
  profile: 'person-outline',
});

/**
 * Driver tabs with large, icon + label targets for use while on duty.
 * @returns {import('react').JSX.Element} Tab navigator.
 */
export default function DriverTabsLayout() {
  return (
    <Tabs
      tabBar={(tabBarProps) => <BottomTabBar {...tabBarProps} tabIconMap={DRIVER_TAB_ICONS} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="dashboard" options={{ title: 'Dashboard' }} />
      <Tabs.Screen name="trip" options={{ title: 'Trip' }} />
      <Tabs.Screen name="verify-ticket" options={{ title: 'Verify' }} />
      <Tabs.Screen name="delay-report" options={{ title: 'Delay' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
