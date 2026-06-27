// Tipe data yang mencerminkan model & response dari backend Go (subsigo-backend).
// Disesuaikan dengan tag JSON di internal/models dan bentuk response handler.
//
// Catatan: model kini GENERIK multi-layanan. Konsep "commodity" lama digantikan
// "service" (Service.code menggantikan nilai komoditas seperti "LPG_3KG").

export type Role = "admin" | "merchant";
export type TxStatus = "success" | "rejected";
export type ServiceKind = "quota" | "eligibility" | "log";

// Label tampilan untuk jenis layanan (UI berbahasa Indonesia).
export const SERVICE_KIND_LABEL: Record<ServiceKind, string> = {
  quota: "Kuota berkala",
  eligibility: "Kelayakan",
  log: "Catat kunjungan",
};

export interface Service {
  id: string;
  code: string;
  name: string;
  kind: ServiceKind;
  default_eligible: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  username: string;
  role: Role;
  merchant_name?: string; // di UI ditampilkan sebagai "Lokasi/Outlet"
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ServiceQuota {
  id: string;
  citizen_id: string;
  service_id: string;
  service_code: string;
  period: string; // "YYYY-MM"
  quota_total: number;
  quota_remaining: number;
  created_at: string;
  updated_at: string;
}

export interface ServiceEligibility {
  id: string;
  citizen_id: string;
  service_id: string;
  is_eligible: boolean;
  created_at: string;
  updated_at: string;
}

export interface Citizen {
  id: string;
  nik: string;
  nfc_uid: string;
  name: string;
  created_at: string;
  updated_at: string;
  quotas?: ServiceQuota[]; // hanya terisi pada endpoint detail
  eligibilities?: ServiceEligibility[]; // hanya terisi pada endpoint detail
}

export interface Transaction {
  id: string;
  citizen_id?: string | null;
  nfc_uid: string;
  user_id: string;
  service_id?: string | null;
  service_code?: string;
  status: TxStatus;
  reason?: string;
  merchant_name?: string;
  metadata?: unknown;
  created_at: string;
}

// Bentuk response paginasi konsisten dari backend:
// { data: [...], pagination: { page, limit, total } }
export interface Paginated<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

export interface AuthUser {
  id: string;
  username: string;
  role: Role;
  merchant_name?: string;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}
