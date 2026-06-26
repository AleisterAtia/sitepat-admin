"use client";

// AuthProvider menyimpan sesi admin (token + user) dan memulihkannya dari
// localStorage saat halaman dimuat ulang. Dashboard ini KHUSUS admin, jadi login
// menolak akun non-admin (petugas/merchant) sejak awal.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { ReactNode } from "react";

import * as api from "./api";
import type { AuthUser } from "./types";

interface AuthContextValue {
  user: AuthUser | null;
  ready: boolean; // true setelah pemulihan sesi awal selesai
  login: (username: string, password: string) => Promise<AuthUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  // Pulihkan sesi dari localStorage sekali di awal (hindari flicker logout).
  useEffect(() => {
    setUser(api.getStoredUser());
    setReady(true);
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const res = await api.login(username, password);
    if (res.user.role !== "admin") {
      throw new Error("Akun ini bukan admin. Dashboard hanya untuk admin.");
    }
    api.setSession(res.token, res.user);
    setUser(res.user);
    return res.user;
  }, []);

  const logout = useCallback(() => {
    api.clearSession();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, ready, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth harus dipakai di dalam <AuthProvider>");
  return ctx;
}
