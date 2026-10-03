// THE sidebar menu list. Add a page by adding one object here and one route in App.jsx.
import {
  Bus,
  ChartColumn,
  Clock,
  IdCard,
  LayoutDashboard,
  MapPin,
  Megaphone,
  MessageSquare,
  Route,
  Wallet,
} from 'lucide-react';

export const ADMIN_NAVIGATION_ITEMS = Object.freeze([
  { key: 'overview', label: 'Overview', path: '/', icon: LayoutDashboard },
  { key: 'fleet', label: 'Live Fleet', path: '/fleet', icon: MapPin },
  { key: 'routes', label: 'Routes', path: '/routes', icon: Route },
  { key: 'buses', label: 'Buses', path: '/buses', icon: Bus },
  { key: 'drivers', label: 'Drivers', path: '/drivers', icon: IdCard },
  { key: 'delays', label: 'Delays', path: '/delays', icon: Clock },
  { key: 'finance', label: 'Tickets & Finance', path: '/finance', icon: Wallet },
  { key: 'inquiries', label: 'Inquiries', path: '/inquiries', icon: MessageSquare },
  { key: 'announcements', label: 'Announcements', path: '/announcements', icon: Megaphone },
  { key: 'performance', label: 'Performance', path: '/performance', icon: ChartColumn },
]);
