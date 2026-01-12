import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User, AuthContextType, UserRole } from '@/types';
import api from '@/lib/api';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface LoginResponse {
  success: boolean;
  data: {
    user: User;
    token: string;
  };
  message?: string;
}

interface RegisterData {
  email: string;
  password: string;
  name: string;
  role: UserRole;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for persisted user and validate token
    const checkAuth = async () => {
      const token = localStorage.getItem('auth_token');
      const persistedUser = localStorage.getItem('user');

      if (token && persistedUser) {
        try {
          // Validate token by fetching current user
          const response = await api.get<{ success: boolean; data: { user: User } }>('/auth/me');
          if (response.data.success) {
            setUser(response.data.data.user);
            localStorage.setItem('user', JSON.stringify(response.data.data.user));
          }
        } catch {
          // Token invalid, clear storage
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user');
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);

    try {
      const response = await api.post<LoginResponse>('/auth/login', {
        email,
        password,
      });

      if (response.data.success) {
        const { user: userData, token } = response.data.data;

        // Persist auth data
        localStorage.setItem('auth_token', token);
        localStorage.setItem('user', JSON.stringify(userData));

        setUser(userData);
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      throw new Error(err.response?.data?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData): Promise<void> => {
    setIsLoading(true);

    try {
      const response = await api.post<{ success: boolean; message: string }>('/auth/register', data);

      if (!response.data.success) {
        throw new Error(response.data.message || 'Registration failed');
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      throw new Error(err.response?.data?.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const forgotPassword = async (email: string): Promise<void> => {
    try {
      await api.post('/auth/forgot-password', { email });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      throw new Error(err.response?.data?.message || 'Failed to send reset email');
    }
  };

  const resetPassword = async (token: string, password: string): Promise<void> => {
    try {
      await api.post('/auth/reset-password', { token, password });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      throw new Error(err.response?.data?.message || 'Failed to reset password');
    }
  };

  const verifyEmail = async (token: string): Promise<void> => {
    try {
      await api.post('/auth/verify-email', { token });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      throw new Error(err.response?.data?.message || 'Failed to verify email');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isLoading,
        register,
        forgotPassword,
        resetPassword,
        verifyEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Helper to quickly switch roles during development (removed - use real login)
export function useDevRoleSwitch() {
  const { login } = useAuth();

  const switchRole = async (role: UserRole) => {
    // In development, you can create test users with these emails
    const emailMap: Record<UserRole, string> = {
      PM: 'pm@qualitysync.com',
      QA: 'qa@qualitysync.com',
      ENG: 'eng@qualitysync.com',
    };
    await login(emailMap[role], 'Password123');
  };

  return { switchRole };
}
