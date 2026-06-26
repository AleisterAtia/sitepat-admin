# SI-TEPAT — Dashboard Admin

Dashboard web admin untuk **SI-TEPAT** (Sistem Integrasi e-KTP Tepat Sasaran).
Dibangun dengan **Next.js (App Router) + TypeScript + Tailwind CSS**, memanggil
backend Go [`subsigo-backend`](../subsigo-backend) lewat REST API + JWT.

## Fitur

- **Login admin** (khusus role `admin`; petugas/`merchant` ditolak).
- **Warga**: daftar + pencarian (NIK/NFC UID/nama), registrasi, detail, ubah
  kelayakan subsidi, atur/reset kuota per komoditas & periode.
- **Pengguna**: daftar + pencarian, tambah admin/petugas, edit role, nama SPBU,
  reset password, dan nonaktifkan akun (`is_active`).
- **Transaksi**: monitoring dengan filter (status, komoditas, rentang tanggal WIB,
  SPBU) + paginasi.

## Prasyarat

- Node.js 20+ (diuji pada Node 24).
- Backend `subsigo-backend` berjalan & sudah dimigrasi + di-seed:
  ```bash
  cd ../subsigo-backend
  go run ./cmd/migrate   # termasuk kolom users.is_active
  go run ./cmd/seed      # membuat admin awal (admin / admin123)
  go run ./cmd/api       # server di http://localhost:8080
  ```

## Menjalankan

```bash
cp .env.example .env.local     # set NEXT_PUBLIC_API_BASE_URL bila perlu
npm install                    # (sudah terpasang bila project ini di-scaffold)
npm run dev                    # http://localhost:3000
```

Login dengan kredensial admin dari seed backend (default `admin` / `admin123`).

## Konfigurasi

| Variabel | Default | Keterangan |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:8080` | Base URL backend Go. Di produksi arahkan ke domain Vercel backend. |

> Backend membatasi `CORS_ALLOW_ORIGINS`. Saat deploy, set origin dashboard ini
> (mis. `https://<admin>.vercel.app`) di environment backend.

## Struktur

```
app/
  layout.tsx              Root layout + AuthProvider + font/CSS global
  login/page.tsx          Halaman login
  (dashboard)/            Route group terproteksi (URL tanpa prefix)
    layout.tsx            Guard auth + sidebar/topbar
    page.tsx              Ringkasan (/)
    citizens/             Daftar + detail warga
    users/                Manajemen pengguna
    transactions/         Monitoring transaksi
lib/
  api.ts                  Klien API (fetch + JWT + error)
  auth.tsx                AuthProvider + useAuth
  types.ts                Tipe data (mirror model backend)
  format.ts               Format tanggal WIB & util periode
components/               UI primitif, Modal, Pagination, Badge
```

## Deploy (Vercel)

1. Import repo ini ke Vercel (Framework Preset: **Next.js**, terdeteksi otomatis).
2. Set env `NEXT_PUBLIC_API_BASE_URL` ke URL backend produksi.
3. Set `CORS_ALLOW_ORIGINS` di backend ke domain dashboard ini.

## Catatan keamanan

Token JWT disimpan di `localStorage` agar sederhana dan cocok dengan kontrak
backend (`Authorization: Bearer`). Ini rawan XSS. Untuk hardening produksi,
pertimbangkan memindahkan token ke **httpOnly cookie** lewat Route Handler proxy
di Next.js. Pencabutan token sisi server (logout paksa) menyusul backend GAP-08.
