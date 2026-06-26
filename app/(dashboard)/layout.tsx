"use client";

// Layout untuk semua halaman dashboard: menjaga akses (redirect ke /login bila belum
// login) dan menyediakan kerangka sidebar + topbar. Route group "(dashboard)" tidak
// memengaruhi URL — jadi app/(dashboard)/page.tsx tetap memetakan ke "/".

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuth } from "@/lib/auth";
import { Spinner, cn } from "@/components/ui";

const NAV = [
  { href: "/", label: "Ringkasan", exact: true },
  { href: "/citizens", label: "Warga" },
  { href: "/users", label: "Pengguna" },
  { href: "/transactions", label: "Transaksi" },
];

function isActive(pathname: string, item: { href: string; exact?: boolean }) {
  return item.exact ? pathname === item.href : pathname.startsWith(item.href);
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, ready, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (ready && !user) router.replace("/login");
  }, [ready, user, router]);

  // Tunggu pemulihan sesi; hindari menampilkan konten admin sebelum auth pasti.
  if (!ready || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-8 w-8 text-blue-600" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-slate-200 bg-white md:flex">
        <div className="border-b border-slate-200 px-5 py-4">
          <p className="text-lg font-bold text-blue-700">SI-TEPAT</p>
          <p className="text-xs text-slate-500">Dashboard Admin</p>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "block rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive(pathname, item)
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-600 hover:bg-slate-100",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
          <p className="text-base font-bold text-blue-700 md:hidden">SI-TEPAT</p>
          <div className="hidden md:block" />
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-slate-700">{user.username}</p>
              <p className="text-xs text-slate-500">Admin</p>
            </div>
            <button
              onClick={logout}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
            >
              Keluar
            </button>
          </div>
        </header>

        <nav className="flex gap-1 overflow-x-auto border-b border-slate-200 bg-white px-2 py-2 md:hidden">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium",
                isActive(pathname, item)
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-600 hover:bg-slate-100",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
