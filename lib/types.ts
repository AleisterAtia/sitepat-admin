// Tipe data yang mencerminkan model & response dari backend Go (subsigo-backend).
// Disesuaikan dengan tag JSON di internal/models dan bentuk response handler.

export type Role = "admin" | "merchant";
export type Commodity = "LPG_3KG" | "PERTALITE";
export type TxStatus = "success" | "rejected";

export const COMMODITIES: Commodity[] = ["LPG_3KG", "PERTALITE"];

// Label tampilan untuk komoditas (UI berbahasa Indonesia).
export const COMMODITY_LABEL: Record<Commodity, string> = {
  LPG_3KG: "LPG 3 Kg",
  PERTALITE: "Pertalite",
};

export interface User {
  id: string;
  username: string;
  role: Role;
  merchant_name?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SubsidyQuota {
  id: string;
  citizen_id: string;
  commodity: Commodity;
  period: string; // "YYYY-MM"
  quota_total: number;
  quota_remaining: number;
  created_at: string;
  updated_at: string;
}

export interface Citizen {
  id: string;
  nik: string;
  nfc_uid: string;
  name: string;
  is_eligible: boolean;
  created_at: string;
  updated_at: string;
  quotas?: SubsidyQuota[]; // hanya terisi pada endpoint detail
}

export interface Transaction {
  id: string;
  citizen_id?: string | null;
  nfc_uid: string;
  user_id: string;
  commodity: Commodity;
  status: TxStatus;
  reason?: string;
  merchant_name?: string;
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
