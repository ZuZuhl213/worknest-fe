import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { AuthResponse, CurrentUser } from '../../types';
import apiClient, {
  fetchCsrfToken,
  beginSession,
  getSessionVersion,
  refreshAccessToken,
  setAccessToken,
} from '../../shared/api/client';

interface AuthContextType {
  user: CurrentUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AuthResponse>;
  loginWithGoogle: (credential: string) => Promise<AuthResponse>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateCurrentUser: (user: CurrentUser) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();
  const isMounted = useRef(false);

  const clearSession = useCallback(() => {
    setAccessToken(null);
    queryClient.clear();
    if (isMounted.current) {
      setUser(null);
      setIsAuthenticated(false);
    }
  }, [queryClient]);

  const loadCurrentUser = useCallback(async (expectedSessionVersion = getSessionVersion()) => {
    const response = await apiClient.get<CurrentUser>('/api/auth/me');
    if (!isMounted.current || expectedSessionVersion !== getSessionVersion()) return;
    setUser(response.data);
    setIsAuthenticated(true);
  }, []);

  useEffect(() => {
    isMounted.current = true;
    const bootstrap = async () => {
      const expectedSessionVersion = getSessionVersion();
      try {
        await refreshAccessToken();
        if (expectedSessionVersion !== getSessionVersion()) return;
        await loadCurrentUser(expectedSessionVersion);
      } catch {
        if (expectedSessionVersion === getSessionVersion()) clearSession();
      } finally {
        if (isMounted.current) setIsLoading(false);
      }
    };

    void bootstrap();
    const handleLogoutEvent = () => {
      clearSession();
      setIsLoading(false);
    };
    window.addEventListener('auth-logout', handleLogoutEvent);
    return () => {
      isMounted.current = false;
      window.removeEventListener('auth-logout', handleLogoutEvent);
    };
  }, [clearSession, loadCurrentUser]);

  const establishSession = async (response: AuthResponse, expectedSessionVersion: number) => {
    if (!setAccessToken(response.accessToken, expectedSessionVersion)) return response;
    queryClient.clear();
    await loadCurrentUser(expectedSessionVersion);
    return response;
  };

  const login = async (email: string, password: string) => {
    const expectedSessionVersion = beginSession();
    try {
      await fetchCsrfToken();
      const response = await apiClient.post<AuthResponse>('/api/auth/login', { email, password });
      return await establishSession(response.data, expectedSessionVersion);
    } catch (error) {
      if (expectedSessionVersion === getSessionVersion()) clearSession();
      throw error;
    }
  };

  const loginWithGoogle = async (credential: string) => {
    const expectedSessionVersion = beginSession();
    try {
      await fetchCsrfToken();
      const response = await apiClient.post<AuthResponse>('/api/auth/google', { credential });
      return await establishSession(response.data, expectedSessionVersion);
    } catch (error) {
      if (expectedSessionVersion === getSessionVersion()) clearSession();
      throw error;
    }
  };

  const register = async (email: string, password: string, fullName: string) => {
    try {
      await fetchCsrfToken();
      await apiClient.post('/api/auth/register', {
        email,
        password,
        fullName,
      });
    } catch (error) {
      clearSession();
      throw error;
    }
  };

  const logout = async () => {
    try {
      await fetchCsrfToken();
      await apiClient.post('/api/auth/logout');
    } catch {
      // Local logout still succeeds if the network is unavailable.
    } finally {
      clearSession();
    }
  };

  const refreshUser = async () => {
    try {
      await loadCurrentUser();
    } catch {
      // The response interceptor handles expired sessions.
    }
  };

  const updateCurrentUser = (nextUser: CurrentUser) => {
    if (!isMounted.current) return;
    setUser(nextUser);
    setIsAuthenticated(true);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, loginWithGoogle, register, logout, refreshUser, updateCurrentUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
