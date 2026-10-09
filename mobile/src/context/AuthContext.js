// Holds the signed-in user for the whole app: restores the session on launch, signs in and signs out.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import apiClient, { registerUnauthorizedHandler } from '../services/apiClient';
import {
  clearAccessToken,
  getAccessToken,
  getShouldRememberSession,
  saveAccessToken,
} from '../utils/tokenStorage';
import { clearAppLockState } from '../utils/appLockStorage';

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
  /**
   * True when this session came back from storage on launch rather than from someone typing their
   * password just now. The app lock asks for a PIN only in the first case: a password typed a
   * moment ago is already proof of who is holding the phone.
   */
  const [wasSessionRestored, setWasSessionRestored] = useState(false);

  const signOut = useCallback(async () => {
    await clearAccessToken();
    // The next account to sign in on this phone must not inherit this one's lock.
    await clearAppLockState();
    setToken(null);
    setUser(null);
    setWasSessionRestored(false);
  }, []);

  const applySession = useCallback(async (issuedToken, signedInUser, shouldRemember = true) => {
    // Every role signs in here now: an admin lands in the (admin) route group, which carries the
    // management screens the web dashboard has.
    await saveAccessToken(issuedToken, shouldRemember);
    setToken(issuedToken);
    setUser(signedInUser);
    setWasSessionRestored(false);
    return signedInUser;
  }, []);

  const signIn = useCallback(
    async (identifier, password, shouldRemember = true) => {
      const loginEnvelope = await apiClient.post('/auth/login', { identifier, password });
      const { token: issuedToken, user: signedInUser } = loginEnvelope.data;
      return applySession(issuedToken, signedInUser, shouldRemember);
    },
    [applySession]
  );

  /** Keeps the cached user in step after the Edit Profile screen saves changes. */
  const replaceCurrentUser = useCallback((updatedUser) => setUser(updatedUser), []);

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
        // "Remember me" was left unticked last time, so the session ends when the app is closed.
        if (!(await getShouldRememberSession())) {
          await clearAccessToken();
          return;
        }
        const profileEnvelope = await apiClient.get('/users/me');
        setToken(storedToken);
        setUser(profileEnvelope.data);
        setWasSessionRestored(true);
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
    () => ({
      user,
      token,
      isLoading,
      wasSessionRestored,
      signIn,
      signOut,
      applySession,
      replaceCurrentUser,
    }),
    [user, token, isLoading, wasSessionRestored, signIn, signOut, applySession, replaceCurrentUser]
  );

  return <AuthContext.Provider value={authState}>{children}</AuthContext.Provider>;
}

/**
 * Reads the auth state; must be used inside <AuthProvider>.
 * @returns {{user: object | null, token: string | null, isLoading: boolean,
 *   wasSessionRestored: boolean, signIn: Function, signOut: Function, applySession: Function,
 *   replaceCurrentUser: Function}} Current auth state and actions.
 */
export function useAuth() {
  const authState = useContext(AuthContext);
  if (!authState) {
    throw new Error('useAuth must be used inside <AuthProvider>.');
  }
  return authState;
}
