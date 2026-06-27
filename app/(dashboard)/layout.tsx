"use client";

// Layout untuk semua halaman dashboard: menjaga akses (redirect ke /login bila belum
// login), menyediakan kerangka sidebar + topbar, dan memuat katalog layanan
// (ServicesProvider) sekali untuk seluruh halaman. Route group "(dashboard)" tidak
// memengaruhi URL — app/(dashboard)/page.tsx tetap memetakan ke "/".

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import type { ComponentType, SVGProps } from "react";

import { useAuth } from "@/lib/auth";
import { ServicesProvider } from "@/lib/services-context";
import { Spinner, cn } from "@/components/ui";
import {
  IconBadge,
  IconHome,
  IconLayers,
  IconLogout,
  IconReceipt,
  IconUsers,
} from "@/components/icons";

type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  exact?: boolean;
};

const NAV: NavItem[] = [
  { href: "/", label: "Ringkasan", icon: IconHome, exact: true },
  { href: "/citizens", label: "Warga", icon: IconUsers },
  { href: "/services", label: "Layanan", icon: IconLayers },
  { href: "/transactions", label: "Transaksi", icon: IconReceipt },
  { href: "/users", label: "Pengguna", icon: IconBadge },
];

function isActive(pathname: string, item: NavItem) {
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
        <Spinner className="h-8 w-8 text-emerald-600" />
      </div>
    );
  }

  const initials = user.username.slice(0, 2).toUpperCase();

  return (
    <ServicesProvider>
      <div className="flex min-h-screen flex-col md:flex-row">
        {/* Sidebar (desktop) */}
        <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white md:flex">
          <div className="flex items-center gap-3 px-5 py-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-base font-bold text-white shadow-sm">
              SP
            </div>
            <div>
              <p className="text-sm font-bold tracking-tight text-slate-900">
                SI-TEPAT
              </p>
              <p className="text-xs text-slate-500">Dashboard Admin</p>
            </div>
          </div>
          <nav className="flex-1 space-y-1 px-3 py-2">
            {NAV.map((item) => {
              const active = isActive(pathname, item);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-emerald-50 text-emerald-700"
                      : "text-slate-600 hover:bg-slate-100",
                  )}
                >
                  <Icon
                    className={cn(
                      "h-5 w-5 shrink-0",
                      active ? "text-emerald-600" : "text-slate-400",
                    )}
                  />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="px-3 py-3">
            <button
              onClick={logout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100"
            >
              <IconLogout className="h-5 w-5 shrink-0 text-slate-400" />
              Keluar
            </button>
          </div>
        </aside>

        <div className="flex flex-1 flex-col">
          {/* Topbar */}
          <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur">
            <div className="flex items-center gap-2 md:hidden">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-xs font-bold text-white">
                SP
              </div>
              <span className="text-base font-bold text-slate-900">SI-TEPAT</span>
            </div>
            <div className="hidden md:block" />
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700">
                {initials}
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-slate-700">
                  {user.username}
                </p>
                <p className="text-xs text-slate-500">Administrator</p>
              </div>
              <button
                onClick={logout}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 transition-colors hover:bg-slate-50"
              >
                Keluar
              </button>
            </div>
          </header>

          {/* Nav mobile */}
          <nav className="flex gap-1 overflow-x-auto border-b border-slate-200 bg-white px-2 py-2 md:hidden">
            {NAV.map((item) => {
              const active = isActive(pathname, item);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium",
                    active
                      ? "bg-emerald-50 text-emerald-700"
                      : "text-slate-600 hover:bg-slate-100",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <main className="flex-1 p-4 md:p-6">{children}</main>
        </div>
      </div>
    </ServicesProvider>
  );
}
