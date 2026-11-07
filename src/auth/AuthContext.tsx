import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from 'react';
import type { User, Company, RegisterData, AuthMutationResult, ResolvedAuthSession } from './types';
import authService from './authService';
import { AuthBootScreen } from './AuthBootScreen';

interface AuthContextValue {
  user: User | null;
  company: Company | null;
  isAuthenticated: boolean;
  isApproved: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<AuthMutationResult>;
  register: (data: RegisterData) => Promise<AuthMutationResult>;
  logout: () => Promise<void>;
  clearSession: () => void;
  updateUser: (data: Partial<Omit<User, 'id' | 'role' | 'validationStatus' | 'approvalSource'>>) => Promise<User | null>;
  updateCompany: (data: Partial<Omit<Company, 'id'>>) => Promise<Company | null>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const restoreGenerationRef = useRef(0);

  const applyResolvedSession = (session: ResolvedAuthSession) => {
    setUser(session.user);
    setCompany(session.company);
  };

  const loadFromStorage = async ({ silent = false }: { silent?: boolean } = {}): Promise<void> => {
    const restoreGeneration = ++restoreGenerationRef.current;
    if (!silent) setLoading(true);
    const session = await authService.getCurrentSession();
    if (restoreGeneration !== restoreGenerationRef.current) {
      if (!silent) setLoading(false);
      return;
    }
    applyResolvedSession(session);
    if (!silent) setLoading(false);
  };

  useEffect(() => {
    loadFromStorage();
  }, []);

  const login = async (email: string, password: string) => {
    const result = await authService.login(email, password);
    if (result.success) {
      if (result.session) {
        applyResolvedSession(result.session);
      }
      void loadFromStorage({ silent: true });
    }
    return result;
  };

  const register = async (data: RegisterData) => {
    const result = await authService.register(data);
    if (result.success) {
      if (result.session) {
        applyResolvedSession(result.session);
      }
      void loadFromStorage({ silent: true });
    }
    return result;
  };

  const logout = async () => {
    restoreGenerationRef.current += 1;
    await authService.logout();
    setUser(null);
    setCompany(null);
  };

  const clearSession = () => {
    restoreGenerationRef.current += 1;
    authService.clearLocalSession();
    setUser(null);
    setCompany(null);
  };

  const updateUser = async (data: Partial<Omit<User, 'id' | 'role'>>): Promise<User | null> => {
    if (!user) return null;
    const updated = await authService.updateUser(user.id, data);
    if (updated) setUser(updated);
    return updated;
  };

  const updateCompany = async (data: Partial<Omit<Company, 'id'>>): Promise<Company | null> => {
    if (!company) return null;
    const updated = await authService.updateCompany(company.id, data);
    if (updated) setCompany(updated);
    return updated;
  };

  if (loading) {
    return <AuthBootScreen />;
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        company,
        isAuthenticated: !!user,
        isApproved: user?.validationStatus === 'approved',
        isAdmin: user?.role === 'admin' && user?.validationStatus === 'approved',
        login,
        register,
        logout,
        clearSession,
        updateUser,
        updateCompany,
        refreshUser: loadFromStorage,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
