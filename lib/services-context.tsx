"use client";

// ServicesProvider memuat katalog layanan SEKALI lalu menyediakannya ke seluruh
// dashboard. Ini menggantikan COMMODITY_LABEL lama yang hardcoded: kini label & opsi
// layanan bersifat dinamis dari backend. Halaman Layanan memanggil refresh() setelah
// menamb/mengubah layanan agar seluruh dropdown & tabel ikut ter-update.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";

import * as api from "./api";
import type { Service } from "./types";

interface ServicesContextValue {
  services: Service[];
  byCode: Record<string, Service>;
  byId: Record<string, Service>;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const ServicesContext = createContext<ServicesContextValue | null>(null);

export function ServicesProvider({ children }: { children: ReactNode }) {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.listServices();
      setServices(res.data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat layanan");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = useMemo<ServicesContextValue>(() => {
    const byCode: Record<string, Service> = {};
    const byId: Record<string, Service> = {};
    for (const s of services) {
      byCode[s.code] = s;
      byId[s.id] = s;
    }
    return { services, byCode, byId, loading, error, refresh };
  }, [services, loading, error, refresh]);

  return (
    <ServicesContext.Provider value={value}>
      {children}
    </ServicesContext.Provider>
  );
}

export function useServices(): ServicesContextValue {
  const ctx = useContext(ServicesContext);
  if (!ctx)
    throw new Error("useServices harus dipakai di dalam <ServicesProvider>");
  return ctx;
}

// serviceName mengembalikan nama layanan dari kode, fallback ke kode mentah.
export function serviceName(
  byCode: Record<string, Service>,
  code?: string | null,
): string {
  if (!code) return "-";
  return byCode[code]?.name ?? code;
}
