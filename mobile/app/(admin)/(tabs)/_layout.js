// Admin bottom navigation: Notifications · Inquiries · Routes · Transport · Account.
// It uses AdminTabBar, not the passenger BottomTabBar, because the admin area carries the web
// dashboard's dark chrome and badges the number of inquiries waiting.
import { Tabs } from 'expo-router/js-tabs';
import AdminTabBar from '../../../src/features/admin/components/AdminTabBar';
import useOpenInquiryCount from '../../../src/features/admin/hooks/useOpenInquiryCount';
import { ADMIN_TAB_ICONS } from '../../../src/features/admin/constants';

/**
 * Admin tabs. To add a tab: add the route file, a <Tabs.Screen> and an icon in ADMIN_TAB_ICONS.
 * @returns {import('react').JSX.Element} Tab navigator.
 */
export default function AdminTabsLayout() {
  const openInquiryCount = useOpenInquiryCount();

  return (
    <Tabs
      tabBar={(tabBarProps) => (
        <AdminTabBar
          {...tabBarProps}
          tabIconMap={ADMIN_TAB_ICONS}
          tabBadgeCounts={{ inquiries: openInquiryCount }}
        />
      )}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="notifications" options={{ title: 'Notices' }} />
      <Tabs.Screen name="inquiries" options={{ title: 'Inquiries' }} />
      <Tabs.Screen name="routes" options={{ title: 'Routes' }} />
      <Tabs.Screen name="transport" options={{ title: 'Transport' }} />
      <Tabs.Screen name="account" options={{ title: 'Account' }} />
    </Tabs>
  );
}
