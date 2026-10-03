// Passenger bottom navigation: Home · Explore · Tickets · Alerts · Profile (custom BottomTabBar).
import { Tabs } from 'expo-router/js-tabs';
import BottomTabBar from '../../../src/components/navigation/BottomTabBar';
import useUnreadNotificationCount from '../../../src/features/home/hooks/useUnreadNotificationCount';

const PASSENGER_TAB_ICONS = Object.freeze({
  home: 'home-outline',
  explore: 'compass-outline',
  tickets: 'ticket-outline',
  alerts: 'notifications-outline',
  profile: 'person-outline',
});

/**
 * Passenger tabs. To add a tab: add the route file, a <Tabs.Screen> and an icon above.
 * @returns {import('react').JSX.Element} Tab navigator.
 */
export default function PassengerTabsLayout() {
  const unreadAlertCount = useUnreadNotificationCount();

  return (
    <Tabs
      tabBar={(tabBarProps) => (
        <BottomTabBar {...tabBarProps} tabIconMap={PASSENGER_TAB_ICONS} unreadAlertCount={unreadAlertCount} />
      )}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="home" options={{ title: 'Home' }} />
      <Tabs.Screen name="explore" options={{ title: 'Explore' }} />
      <Tabs.Screen name="tickets" options={{ title: 'Tickets' }} />
      <Tabs.Screen name="alerts" options={{ title: 'Alerts' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
