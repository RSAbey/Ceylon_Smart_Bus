// Driver bottom navigation: Home · Route · Live · Scan · Booking (same BottomTabBar, driver icon map).
// Profile, Report Delay and Shift totals are reached from inside those tabs, not from the bar itself.
import { Tabs } from 'expo-router/js-tabs';
import BottomTabBar from '../../../src/components/navigation/BottomTabBar';

const DRIVER_TAB_ICONS = Object.freeze({
  home: 'home-outline',
  route: 'git-network-outline',
  live: 'navigate-outline',
  scan: 'scan-outline',
  booking: 'list-outline',
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
      <Tabs.Screen name="home" options={{ title: 'Home' }} />
      <Tabs.Screen name="route" options={{ title: 'Route' }} />
      <Tabs.Screen name="live" options={{ title: 'Live' }} />
      <Tabs.Screen name="scan" options={{ title: 'Scan' }} />
      <Tabs.Screen name="booking" options={{ title: 'Booking' }} />
    </Tabs>
  );
}
