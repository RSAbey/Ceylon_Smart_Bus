// Entry route "/": sends the user to login or to the home screen of their role.
import { Redirect } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { LOGIN_ROUTE, ROLE_HOME_ROUTES } from '../src/utils/constants';

/**
 * Role-based redirect (the root layout waits for the session before this renders).
 * @returns {import('react').JSX.Element} Redirect to the right starting screen.
 */
export default function IndexRedirect() {
  const { user } = useAuth();
  const startRoute = user ? ROLE_HOME_ROUTES[user.role] : LOGIN_ROUTE;
  return <Redirect href={startRoute} />;
}
