// Admin router: public /login, every other page inside ProtectedRoute + AdminLayout (all pages already routed).
import { Navigate, RouterProvider, createBrowserRouter } from 'react-router-dom';
import ProtectedRoute from './routes/ProtectedRoute';
import AdminLayout from './components/layout/AdminLayout';
import LoginPage from './pages/auth/LoginPage';
import OverviewPage from './pages/overview/OverviewPage';
import LiveFleetPage from './pages/fleet/LiveFleetPage';
import RoutesPage from './pages/routes/RoutesPage';
import TransportDataPage from './pages/transport/TransportDataPage';
import DelaysPage from './pages/delays/DelaysPage';
import FinancePage from './pages/finance/FinancePage';
import InquiriesPage from './pages/inquiries/InquiriesPage';
import AnnouncementsPage from './pages/announcements/AnnouncementsPage';
import PerformancePage from './pages/performance/PerformancePage';

const adminRouter = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <OverviewPage /> },
      { path: 'fleet', element: <LiveFleetPage /> },
      { path: 'routes', element: <RoutesPage /> },
      { path: 'transport', element: <TransportDataPage /> },
      // Old paths kept so a bookmarked Buses or Drivers link still lands somewhere useful.
      { path: 'buses', element: <Navigate to="/transport" replace /> },
      { path: 'drivers', element: <Navigate to="/transport" replace /> },
      { path: 'delays', element: <DelaysPage /> },
      { path: 'finance', element: <FinancePage /> },
      { path: 'inquiries', element: <InquiriesPage /> },
      { path: 'announcements', element: <AnnouncementsPage /> },
      { path: 'performance', element: <PerformancePage /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);

/**
 * Root component of the admin dashboard.
 * @returns {import('react').JSX.Element} Router.
 */
export default function App() {
  return <RouterProvider router={adminRouter} />;
}
