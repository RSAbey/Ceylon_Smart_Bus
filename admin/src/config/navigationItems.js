// THE sidebar menu list. Add a page by adding one object here and one route in App.jsx.
import {
  Bus,
  ChartColumn,
  Clock,
  LayoutDashboard,
  MapPin,
  Megaphone,
  MessageSquare,
  Route,
  UserRound,
  Wallet,
} from 'lucide-react';

export const ADMIN_NAVIGATION_ITEMS = Object.freeze([
  { key: 'overview', label: 'Overview', path: '/', icon: LayoutDashboard },
  { key: 'fleet', label: 'Live Fleet', path: '/fleet', icon: MapPin },
  { key: 'routes', label: 'Routes', path: '/routes', icon: Route },
  { key: 'transport', label: 'Transport Data', path: '/transport', icon: Bus },
  { key: 'delays', label: 'Delays', path: '/delays', icon: Clock },
  { key: 'finance', label: 'Tickets & Finance', path: '/finance', icon: Wallet },
  { key: 'inquiries', label: 'Inquiries', path: '/inquiries', icon: MessageSquare },
  { key: 'passengers', label: 'Passengers', path: '/passengers', icon: UserRound },
  { key: 'announcements', label: 'Announcements', path: '/announcements', icon: Megaphone },
  { key: 'performance', label: 'Performance', path: '/performance', icon: ChartColumn },
]);
