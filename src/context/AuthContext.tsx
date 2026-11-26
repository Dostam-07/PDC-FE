import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '../types/user';

const USER_STORAGE_KEY = 'pdc_user_profile_v1';

const DEFAULT_USER: UserProfile = {
  id: 'user-default-1',
  name: 'Dostam A.',
  phone: '+91 98765 43210',
  role: 'State Program Manager',
  organization: 'State Education Transformation Cell',
  state: 'Rajasthan',
  focusArea: 'Foundational Literacy & Numeracy (FLN)',
  language: 'English',
  onboarded: true,
};

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  updateProfile: (updated: Partial<UserProfile>) => Promise<void>;
  completeOnboarding: (data: Partial<UserProfile>) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(USER_STORAGE_KEY);
      if (saved) {
        setUser(JSON.parse(saved));
      } else {
        setUser(DEFAULT_USER);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(DEFAULT_USER));
      }
    } catch {
      setUser(DEFAULT_USER);
    }
    setLoading(false);
  }, []);

  const updateProfile = async (updated: Partial<UserProfile>) => {
    setUser(prev => {
      const newUser = { ...(prev || DEFAULT_USER), ...updated };
      try {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser));
      } catch {}
      return newUser;
    });
  };

  const completeOnboarding = async (data: Partial<UserProfile>) => {
    setUser(prev => {
      const newUser = { ...(prev || DEFAULT_USER), ...data, onboarded: true };
      try {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser));
      } catch {}
      return newUser;
    });
  };

  const logout = () => {
    if (user) {
      const newUser = { ...user, onboarded: false };
      setUser(newUser);
      try {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser));
      } catch {}
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, updateProfile, completeOnboarding, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    return {
      user: DEFAULT_USER,
      loading: false,
      updateProfile: async () => {},
      completeOnboarding: async () => {},
      logout: () => {},
    };
  }
  return context;
};
