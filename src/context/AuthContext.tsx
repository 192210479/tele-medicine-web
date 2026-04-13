import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { saveAuth, clearAuth, getAuth } from '../utils/auth';

export interface AuthPayload {
  user_id: number;
  role: string;
  name?: string;       // LoginScreen passes this key
  full_name?: string;  // alternative key
  email?: string;
}
export type AuthUser = AuthPayload;

interface AuthContextType {
  userId: number | null;
  role: string | null;
  name: string | null;
  email: string | null;
  login: (userData: AuthPayload) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  user?: any;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [userId,  setUserId]  = useState<number | null>(() => getAuth()?.user_id ?? null);
  const [role,    setRole]    = useState<string | null>(() => getAuth()?.role   ?? null);
  const [name,    setName]    = useState<string | null>(() => localStorage.getItem("name"));
  const [email,   setEmail]   = useState<string | null>(() => localStorage.getItem("email"));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { setIsLoading(false); }, []);

  const login = (userData: AuthPayload) => {
    saveAuth({ user_id: userData.user_id, role: userData.role as "patient" | "doctor" | "admin" });
    localStorage.setItem("user_id", String(userData.user_id));
    localStorage.setItem("role",    userData.role);
    // Accept both "name" and "full_name" keys
    const displayName = userData.name ?? userData.full_name ?? null;
    if (displayName)    localStorage.setItem("name",  displayName);
    if (userData.email) localStorage.setItem("email", userData.email);

    setUserId(userData.user_id);
    setRole(userData.role);
    setName(displayName);
    setEmail(userData.email ?? null);
  };

  const logout = () => {
    clearAuth();
    ["user_id","role","name","full_name","email",
     "userId","userEmail","auth_token","profile_image","resetEmail"]
      .forEach(k => { localStorage.removeItem(k); sessionStorage.removeItem(k); });
    setUserId(null); setRole(null); setName(null); setEmail(null);
  };

  return (
    <AuthContext.Provider value={{
      userId, role, name, email,
      login, logout,
      isAuthenticated: !!userId,
      isLoading,
      user: { name, email, role, id: userId },
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
