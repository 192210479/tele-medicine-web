import React, { useState, createContext, useContext, ReactNode } from 'react';
import { apiPost } from '../services/api';

export type UserRole = 'patient' | 'doctor' | 'admin' | null;

interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  role: UserRole;
  userId: number | null;
  login: (role: UserRole, email: string, password: string) => Promise<any>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('telemedicine_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const login = async (role: UserRole, email: string, password: string) => {
    try {
      const response = await apiPost('/api/login', {
        email,
        password,
        role,
        device_name: navigator.userAgent.substring(0, 100),
        location: 'Web Client'
      });

      const newUser: User = {
        id: response.user_id,
        name: response.role === 'patient' ? 'Patient' : response.role === 'doctor' ? 'Doctor' : 'Admin',
        email: email,
        role: response.role as UserRole,
      };

      setUser(newUser);
      localStorage.setItem('telemedicine_user', JSON.stringify(newUser));
      localStorage.setItem('user_id', response.user_id.toString());
      localStorage.setItem('role', response.role);
      return response;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('telemedicine_user');
    localStorage.removeItem('user_id');
    localStorage.removeItem('role');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        userId: user?.id || null,
        login,
        logout,
        isAuthenticated: !!user
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