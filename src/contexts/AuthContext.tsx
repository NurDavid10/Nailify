import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api } from '@/db/client';
import type { Profile } from '@/types/index';

interface LoginResponse {
  token: string;
  profile: Profile;
}

interface AuthContextType {
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null; profile?: Profile }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setProfile(null);
      return;
    }

    try {
      const response = await api.get<{ profile: Profile }>('/auth/me');
      setProfile(response.profile);
    } catch (error) {
      console.error('Failed to refresh profile:', error);
      // Token is invalid or expired, clear it
      localStorage.removeItem('auth_token');
      setProfile(null);
    }
  };

  // Check for existing session on mount
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      // Validate token by fetching profile
      refreshProfile().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const response = await api.post<LoginResponse>('/auth/login', {
        email,
        password,
      });

      // Store token in localStorage
      localStorage.setItem('auth_token', response.token);

      // Set profile immediately
      setProfile(response.profile);

      return { error: null, profile: response.profile };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    // Remove token from localStorage
    localStorage.removeItem('auth_token');
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ profile, loading, signIn, signOut, refreshProfile }}>
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
