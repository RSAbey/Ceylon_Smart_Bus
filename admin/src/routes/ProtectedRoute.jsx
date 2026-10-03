// Guards every dashboard page: waits for the session check, then sends signed-out visitors to /login.
import { Navigate, useLocation } from 'react-router-dom';
import { LoaderCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/**
 * Renders the protected content only for a signed-in admin.
 * @param {object} props - Component props.
 * @param {import('react').ReactNode} props.children - Protected content (the AdminLayout).
 * @returns {import('react').JSX.Element} Content, loading indicator or redirect.
 */
export default function ProtectedRoute({ children }) {
  const { user, isLoading } = useAuth();
  const currentLocation = useLocation();

  if (isLoading) {
    return (
      <div className="full-page-center" role="status" aria-label="Checking your session">
        <LoaderCircle className="spinner" aria-hidden="true" />
      </div>
    );
  }
  if (!user) {
    // Remember where the admin was going so login can send them back there.
    return <Navigate to="/login" replace state={{ redirectTo: currentLocation.pathname }} />;
  }
  return children;
}
