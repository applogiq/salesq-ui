'use client';

import {
  createContext, useContext, useState, useEffect, useCallback, ReactNode,
} from 'react';
import { authApi, tokenStore } from '@/lib/api';
import type { User, UIRole } from '@/lib/api.types';

// ── Map backend role → UI sidebar role ───────────────────────────────────────

export function toUIRole(backendRole: string): UIRole {
  if (backendRole === 'admin')   return 'admin';
  if (backendRole === 'manager') return 'team-lead';
  return 'executive';
}

// ── Context types ─────────────────────────────────────────────────────────────

export interface AuthContextValue {
  user: User | null;
  uiRole: UIRole;
  loading: boolean;
  login: (email: string, password: string, totp_code?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Rehydrate from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('salesq_user');
    const token = tokenStore.getAccess();
    if (stored && token) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        tokenStore.clear();
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string, totp_code?: string) => {
    const tokens = await authApi.login(email, password, totp_code);
    tokenStore.set(tokens);
    // Fetch full user profile
    const me = await authApi.me();
    localStorage.setItem('salesq_user', JSON.stringify(me));
    setUser(me);
  }, []);

  const logout = useCallback(async () => {
    try { await authApi.logout(); } catch {}
    tokenStore.clear();
    setUser(null);
  }, []);

  const uiRole: UIRole = user ? toUIRole(user.role) : 'executive';

  return (
    <AuthContext.Provider value={{ user, uiRole, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}

/** Backward-compat shim — returns the UI role string used by Sidebar/TopBar. */
export function useRole() {
  const { uiRole } = useAuth();
  return { role: uiRole };
}
