// Admin session: login via POST /auth/login, restore via GET /users/me, and only role "admin" may enter.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import apiClient, { ACCESS_TOKEN_STORAGE_KEY, registerUnauthorizedHandler } from '../services/apiClient';

const ADMIN_ROLE = 'admin';
const NOT_ADMIN_MESSAGE = 'Only administrators can use this dashboard. Passengers and drivers use the mobile app.';

const AuthContext = createContext(null);

/**
 * Provides { user, isLoading, login, logout } to the dashboard.
 * @param {object} props - Component props.
 * @param {import('react').ReactNode} props.children - App tree.
 * @returns {import('react').JSX.Element} Context provider.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // Only wait for a session check when a token is actually stored.
  const [isLoading, setIsLoading] = useState(() => Boolean(localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY)));

  const logout = useCallback(() => {
    localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
    setUser(null);
  }, []);

  const login = useCallback(async (identifier, password) => {
    const loginEnvelope = await apiClient.post('/auth/login', { identifier, password });
    const { token, user: signedInUser } = loginEnvelope.data;
    if (signedInUser.role !== ADMIN_ROLE) {
      throw { message: NOT_ADMIN_MESSAGE, status: 0, fieldErrors: {} };
    }
    localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, token);
    setUser(signedInUser);
    return signedInUser;
  }, []);

  useEffect(() => {
    registerUnauthorizedHandler(logout);
    return () => registerUnauthorizedHandler(null);
  }, [logout]);

  useEffect(() => {
    if (!localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY)) return;
    apiClient
      .get('/users/me')
      .then((profileEnvelope) => {
        if (profileEnvelope.data.role === ADMIN_ROLE) setUser(profileEnvelope.data);
        else logout();
      })
      .catch(logout)
      .finally(() => setIsLoading(false));
  }, [logout]);

  const authState = useMemo(() => ({ user, isLoading, login, logout }), [user, isLoading, login, logout]);

  return <AuthContext.Provider value={authState}>{children}</AuthContext.Provider>;
}

/**
 * Reads the admin auth state; must be used inside <AuthProvider>.
 * @returns {{user: object | null, isLoading: boolean, login: Function, logout: Function}} Auth state and actions.
 */
export function useAuth() {
  const authState = useContext(AuthContext);
  if (!authState) {
    throw new Error('useAuth must be used inside <AuthProvider>.');
  }
  return authState;
}
