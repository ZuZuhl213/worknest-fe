import React, { createContext, useContext, useState, useEffect } from 'react';
import { CurrentUser, AuthResponse } from '../../types';
import apiClient from '../../shared/api/client';

interface AuthContextType {
  user: CurrentUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AuthResponse>;
  register: (email: string, password: string, fullName: string) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchCurrentUser = async () => {
    try {
      const response = await apiClient.get<CurrentUser>('/api/auth/me');
      setUser(response.data);
      setIsAuthenticated(true);
    } catch (error) {
      // Clear credentials if token is invalid
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const hasToken = localStorage.getItem('accessToken');
    if (hasToken) {
      fetchCurrentUser();
    } else {
      setIsLoading(false);
    }

    const handleLogoutEvent = () => {
      setUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
    };

    window.addEventListener('auth-logout', handleLogoutEvent);
    return () => {
      window.removeEventListener('auth-logout', handleLogoutEvent);
    };
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await apiClient.post<AuthResponse>('/api/auth/login', { email, password });
      const { accessToken, refreshToken } = response.data;
      
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      
      // Map AuthUserResponse to CurrentUser
      const authUser = response.data.user;
      const currentUser: CurrentUser = {
        id: authUser.id,
        email: authUser.email,
        fullName: authUser.fullName,
        avatarUrl: authUser.avatarUrl,
        emailVerified: authUser.emailVerified,
        isActive: true,
      };
      
      setUser(currentUser);
      setIsAuthenticated(true);
      return response.data;
    } catch (error) {
      setIsAuthenticated(false);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, fullName: string) => {
    setIsLoading(true);
    try {
      const response = await apiClient.post<AuthResponse>('/api/auth/register', { 
        email, 
        password, 
        fullName
      });
      const { accessToken, refreshToken } = response.data;
      
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      
      const authUser = response.data.user;
      const currentUser: CurrentUser = {
        id: authUser.id,
        email: authUser.email,
        fullName: authUser.fullName,
        avatarUrl: authUser.avatarUrl,
        emailVerified: authUser.emailVerified,
        isActive: true,
      };
      
      setUser(currentUser);
      setIsAuthenticated(true);
      return response.data;
    } catch (error) {
      setIsAuthenticated(false);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      try {
        await apiClient.post('/api/auth/logout', { refreshToken });
      } catch (e) {
        // Suppress logout network errors
      }
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
    setIsAuthenticated(false);
  };

  const refreshUser = async () => {
    try {
      const response = await apiClient.get<CurrentUser>('/api/auth/me');
      setUser(response.data);
    } catch (error) {
      // Do not force logout on background profile checks
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
