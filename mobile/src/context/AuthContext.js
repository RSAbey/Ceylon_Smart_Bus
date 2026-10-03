// Holds the signed-in user for the whole app: restores the session on launch, signs in and signs out.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import apiClient, { registerUnauthorizedHandler } from '../services/apiClient';
import { clearAccessToken, getAccessToken, saveAccessToken } from '../utils/tokenStorage';
import { USER_ROLES } from '../utils/constants';

const ADMIN_ON_MOBILE_MESSAGE = 'Admins use the web dashboard. Please sign in there.';

const AuthContext = createContext(null);

/**
 * Provides { user, token, isLoading, signIn, signOut } to every screen.
 * @param {object} props - Component props.
 * @param {import('react').ReactNode} props.children - The app tree.
 * @returns {import('react').JSX.Element} Context provider.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const signOut = useCallback(async () => {
    await clearAccessToken();
    setToken(null);
    setUser(null);
  }, []);

  const signIn = useCallback(async (identifier, password) => {
    const loginEnvelope = await apiClient.post('/auth/login', { identifier, password });
    const { token: issuedToken, user: signedInUser } = loginEnvelope.data;

    // The mobile app is for passengers and drivers only; admins are never given a mobile session.
    if (signedInUser.role === USER_ROLES.ADMIN) {
      throw { message: ADMIN_ON_MOBILE_MESSAGE, status: 0, fieldErrors: {} };
    }

    await saveAccessToken(issuedToken);
    setToken(issuedToken);
    setUser(signedInUser);
    return signedInUser;
  }, []);

  useEffect(() => {
    registerUnauthorizedHandler(signOut);
    return () => registerUnauthorizedHandler(null);
  }, [signOut]);

  useEffect(() => {
    /**
     * Restores the previous session from secure storage by asking the API who the token belongs to.
     * @returns {Promise<void>} Resolves when loading is finished.
     */
    async function restoreSession() {
      try {
        const storedToken = await getAccessToken();
        if (!storedToken) return;
        const profileEnvelope = await apiClient.get('/users/me');
        setToken(storedToken);
        setUser(profileEnvelope.data);
      } catch {
        // An expired or invalid token simply means the user has to sign in again.
        await clearAccessToken();
      } finally {
        setIsLoading(false);
      }
    }
    restoreSession();
  }, []);

  const authState = useMemo(
    () => ({ user, token, isLoading, signIn, signOut }),
    [user, token, isLoading, signIn, signOut]
  );

  return <AuthContext.Provider value={authState}>{children}</AuthContext.Provider>;
}

/**
 * Reads the auth state; must be used inside <AuthProvider>.
 * @returns {{user: object | null, token: string | null, isLoading: boolean, signIn: Function, signOut: Function}}
 *   Current auth state and actions.
 */
export function useAuth() {
  const authState = useContext(AuthContext);
  if (!authState) {
    throw new Error('useAuth must be used inside <AuthProvider>.');
  }
  return authState;
}
