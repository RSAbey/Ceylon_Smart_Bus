// THE passenger drawer menu list. Add a menu entry by adding one object here (and its route file).
// Travel History and Settings from the Figma drawer are omitted: no member owns them in Milestone 03
// (recorded in docs/evidence/m04/deviations.md). Logout is rendered separately in the destructive style.

export const DRAWER_MENU_ITEMS = Object.freeze([
  { key: 'home', label: 'Home', iconName: 'home-outline', route: '/(passenger)/(tabs)/home', activePath: '/home' },
  {
    key: 'explore',
    label: 'Explore Routes',
    iconName: 'git-network-outline',
    route: '/(passenger)/(tabs)/explore',
    activePath: '/explore',
  },
  {
    key: 'tracking',
    label: 'Live Bus Tracking',
    iconName: 'location-outline',
    route: '/(passenger)/live-tracking',
    activePath: '/live-tracking',
  },
  { key: 'tickets', label: 'My Tickets', iconName: 'ticket-outline', route: '/(passenger)/(tabs)/tickets', activePath: '/tickets' },
  {
    key: 'alerts',
    label: 'Alerts',
    iconName: 'notifications-outline',
    route: '/(passenger)/(tabs)/alerts',
    activePath: '/alerts',
  },
  {
    key: 'help',
    label: 'Help & Support',
    iconName: 'help-circle-outline',
    route: '/(passenger)/inquiries',
    activePath: '/inquiries',
  },
]);

export const DRAWER_PROFILE_ROUTE = '/(passenger)/(tabs)/profile';
