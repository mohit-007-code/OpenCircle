// contexts/AuthContext.tsx
'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import Cookies from 'js-cookie';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import { User, AuthTokens, AuthContextType } from '@/types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async (): Promise<void> => {
    const token = Cookies.get('access_token');
    if (token) {
      try {
        const response = await api.get<User>('/auth/profile/');
        setUser(response.data);
      } catch (error) {
        console.error('Auth check failed:', error);
        Cookies.remove('access_token');
        Cookies.remove('refresh_token');
        setUser(null);
      }
    }
    setLoading(false);
  };

  const login = (userData: User, tokens: AuthTokens): void => {
    Cookies.set('access_token', tokens.access, { expires: 1/24 }); // 1 hour
    Cookies.set('refresh_token', tokens.refresh, { expires: 7 }); // 7 days
    setUser(userData);
  };

  const logout = async (): Promise<void> => {
    try {
      const refreshToken = Cookies.get('refresh_token');
      if (refreshToken) {
        await api.post('/auth/logout/', { refresh: refreshToken });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      Cookies.remove('access_token');
      Cookies.remove('refresh_token');
      setUser(null);
      router.push('/');
    }
  };

  const updateProfile = (updatedUser: User): void => {
    setUser(updatedUser);
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    updateProfile,
    checkAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
