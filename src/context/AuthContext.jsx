import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  getStoredToken,
  setStoredToken,
  setUnauthorizedHandler
} from '../services/api.js';
import { fetchCurrentUser, loginRequest } from '../services/authService.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  const logout = useCallback(() => {
    setStoredToken(null);
    setUser(null);
  }, []);

  const applySession = useCallback((token, authenticatedUser) => {
    setStoredToken(token);
    setUser(authenticatedUser);
    return authenticatedUser;
  }, []);

  const login = useCallback(
    async (email, password) => {
      const { token, user: authenticatedUser } = await loginRequest(email, password);
      return applySession(token, authenticatedUser);
    },
    [applySession]
  );

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setStoredToken(null);
      setUser(null);
    });
  }, []);

  useEffect(() => {
    const restoreSession = async () => {
      if (!getStoredToken()) {
        setInitializing(false);
        return;
      }

      try {
        const currentUser = await fetchCurrentUser();
        setUser(currentUser);
      } catch {
        setStoredToken(null);
        setUser(null);
      } finally {
        setInitializing(false);
      }
    };

    restoreSession();
  }, []);

  const value = useMemo(
    () => ({
      user,
      initializing,
      isAuthenticated: Boolean(user),
      login,
      logout,
      applySession
    }),
    [user, initializing, login, logout, applySession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
