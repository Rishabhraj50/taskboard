import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types/index.ts';
import { api, getStoredToken, getStoredUser, setStoredAuth, clearStoredAuth, setOnUnauthorized } from '../api/client.ts';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, password?: string) => Promise<void>;
  register: (name: string, email: string, password?: string) => Promise<void>;
  logout: () => void;
  switchDemoUser: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const DEMO_ACCOUNTS = [
  { name: 'Alex Rivera', email: 'alex@team.dev', role: 'Engineering Lead' },
  { name: 'Priya Sharma', email: 'priya@team.dev', role: 'Product Manager' },
  { name: 'Carlos Mendez', email: 'carlos@team.dev', role: 'Full-Stack Eng' },
  { name: 'Sunidhi Alok', email: 'sunidhi@team.dev', role: 'Tech Reviewer' },
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(getStoredUser());
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setOnUnauthorized(() => {
      setUser(null);
      setToken(null);
      setError('Your session has expired. Please sign in again.');
    });

    const initAuth = async () => {
      const stored = getStoredToken();
      if (stored) {
        try {
          const res = await api.getMe();
          setUser(res.user);
        } catch {
          clearStoredAuth();
          setUser(null);
          setToken(null);
        }
      } else {
        // Auto-login default demo user (Alex) on initial load for instant demo review
        try {
          const res = await api.login('alex@team.dev', 'password123');
          setStoredAuth(res.token, res.user);
          setUser(res.user);
          setToken(res.token);
        } catch {
          // If server still initializing, will try again
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password = 'password123') => {
    setError(null);
    try {
      const res = await api.login(email, password);
      setStoredAuth(res.token, res.user);
      setUser(res.user);
      setToken(res.token);
    } catch (err) {
      const msg = (err as Error).message || 'Failed to sign in';
      setError(msg);
      throw err;
    }
  };

  const register = async (name: string, email: string, password = 'password123') => {
    setError(null);
    try {
      const res = await api.register(name, email, password);
      setStoredAuth(res.token, res.user);
      setUser(res.user);
      setToken(res.token);
    } catch (err) {
      const msg = (err as Error).message || 'Failed to create account';
      setError(msg);
      throw err;
    }
  };

  const logout = () => {
    clearStoredAuth();
    setUser(null);
    setToken(null);
  };

  const switchDemoUser = async (email: string) => {
    await login(email, 'password123');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        loading,
        error,
        login,
        register,
        logout,
        switchDemoUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
