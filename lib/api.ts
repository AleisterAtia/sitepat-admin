// Klien API untuk berkomunikasi dengan backend Go (subsigo-backend).
//
// Strategi auth: token JWT disimpan di localStorage dan dikirim lewat header
// `Authorization: Bearer <token>` (backend memakai CORS tanpa credentials/cookie).
// Catatan keamanan: localStorage rawan XSS — untuk produksi pertimbangkan httpOnly
// cookie via route handler proxy (lihat README, bagian "Catatan keamanan").

import type {
  AuthUser,
  Citizen,
  LoginResponse,
  Paginated,
  Role,
  Service,
  ServiceKind,
  ServiceQuota,
  Transaction,
  TxStatus,
  User,
} from "./types";

const API_BASE = (
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://subsigo-backend.vercel.app"
).replace(/\/$/, "");

const TOKEN_KEY = "sitepat_token";
const USER_KEY = "sitepat_user";

// --- Penyimpanan token & user (client-side) ---

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setSession(token: string, user: AuthUser) {
  window.localStorage.setItem(TOKEN_KEY, token);
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function clearSession() {
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
}

// --- Error API ---

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

const LOGIN_PATH = "/api/v1/auth/login";

// apiFetch adalah pembungkus fetch dengan auth header, parsing JSON, dan
// penanganan error yang konsisten. Pada 401 (selain saat login) sesi dibersihkan
// dan pengguna diarahkan ke /login.
async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  } catch {
    throw new ApiError(0, "Tidak dapat terhubung ke server. Cek koneksi/API.");
  }

  if (res.status === 401 && path !== LOGIN_PATH) {
    clearSession();
    if (typeof window !== "undefined") window.location.href = "/login";
    throw new ApiError(401, "Sesi berakhir, silakan login kembali.");
  }

  // 204 atau body kosong
  const text = await res.text();
  const body = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const msg =
      (body && (body.error || body.message)) || `Permintaan gagal (${res.status})`;
    throw new ApiError(res.status, msg);
  }
  return body as T;
}

function qs(params: Record<string, string | number | undefined | null>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

// --- Auth ---

export function login(username: string, password: string) {
  return apiFetch<LoginResponse>(LOGIN_PATH, {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export function getMe() {
  return apiFetch<{ user_id: string; role: Role; merchant_name?: string }>(
    "/api/v1/me",
  );
}

// --- Warga (citizens) ---

// type (bukan interface) agar punya implicit index signature → cocok dengan qs().
export type ListParams = {
  search?: string;
  page?: number;
  limit?: number;
};

export function listCitizens(params: ListParams = {}) {
  return apiFetch<Paginated<Citizen>>(`/api/v1/admin/citizens${qs(params)}`);
}

export function getCitizen(id: string) {
  return apiFetch<Citizen>(`/api/v1/admin/citizens/${id}`);
}

export function registerCitizen(input: {
  nik: string;
  nfc_uid: string;
  name: string;
}) {
  return apiFetch<Citizen>("/api/v1/admin/citizens", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

// setEligibility menetapkan kelayakan warga. Bila service_code dikosongkan, backend
// menerapkannya ke semua layanan aktif yang membutuhkan kelayakan (quota/eligibility).
export function setEligibility(
  id: string,
  input: { is_eligible: boolean; service_code?: string },
) {
  return apiFetch<{ id: string; service_code: string; is_eligible: boolean }>(
    `/api/v1/admin/citizens/${id}/eligibility`,
    { method: "PATCH", body: JSON.stringify(input) },
  );
}

export function setQuota(
  id: string,
  input: { service_code: string; period?: string; quota_total: number },
) {
  return apiFetch<ServiceQuota>(`/api/v1/admin/citizens/${id}/quotas`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

// --- Layanan (services) ---

export function listServices() {
  return apiFetch<{ data: Service[] }>("/api/v1/admin/services");
}

export function createService(input: {
  code: string;
  name: string;
  kind: ServiceKind;
  default_eligible: boolean;
}) {
  return apiFetch<Service>("/api/v1/admin/services", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateService(
  id: string,
  input: {
    name?: string;
    kind?: ServiceKind;
    default_eligible?: boolean;
    is_active?: boolean;
  },
) {
  return apiFetch<Service>(`/api/v1/admin/services/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

// --- Pengguna (users) ---

export function listUsers(params: ListParams = {}) {
  return apiFetch<Paginated<User>>(`/api/v1/admin/users${qs(params)}`);
}

export function createUser(input: {
  username: string;
  password: string;
  role: Role;
  merchant_name?: string;
}) {
  return apiFetch<User>("/api/v1/admin/users", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateUser(
  id: string,
  input: {
    role?: Role;
    merchant_name?: string;
    password?: string;
    is_active?: boolean;
  },
) {
  return apiFetch<User>(`/api/v1/admin/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

// --- Transaksi (monitoring) ---

export type TransactionParams = {
  status?: TxStatus;
  service_code?: string;
  user_id?: string;
  merchant_name?: string;
  from?: string; // YYYY-MM-DD (WIB)
  to?: string; // YYYY-MM-DD (WIB)
  page?: number;
  limit?: number;
};

export function listTransactions(params: TransactionParams = {}) {
  return apiFetch<Paginated<Transaction>>(
    `/api/v1/admin/transactions${qs(params)}`,
  );
}
