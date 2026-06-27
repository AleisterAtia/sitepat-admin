"use client";

import { useEffect, useState } from "react";
import type { ComponentType, SVGProps } from "react";
import Link from "next/link";

import * as api from "@/lib/api";
import { useServices, serviceName } from "@/lib/services-context";
import type { Transaction } from "@/lib/types";
import { formatDateTime } from "@/lib/format";
import { Alert, Card, Spinner, cn } from "@/components/ui";
import { TxStatusBadge } from "@/components/badges";
import { IconBadge, IconLayers, IconReceipt, IconUsers } from "@/components/icons";

interface Stats {
  citizens: number;
  users: number;
  transactions: number;
}

export default function OverviewPage() {
  const { byCode, services } = useServices();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recent, setRecent] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [citizens, users, txs, recentTxs] = await Promise.all([
          api.listCitizens({ limit: 1 }),
          api.listUsers({ limit: 1 }),
          api.listTransactions({ limit: 1 }),
          api.listTransactions({ limit: 5 }),
        ]);
        if (!active) return;
        setStats({
          citizens: citizens.pagination.total,
          users: users.pagination.total,
          transactions: txs.pagination.total,
        });
        setRecent(recentTxs.data);
      } catch (err) {
        if (active)
          setError(err instanceof Error ? err.message : "Gagal memuat data");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="h-8 w-8 text-emerald-600" />
      </div>
    );
  }

  const activeServices = services.filter((s) => s.is_active).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-800">Ringkasan</h1>
        <p className="text-sm text-slate-500">
          Pantauan singkat data warga, layanan, dan transaksi.
        </p>
      </div>

      {error && <Alert tone="error">{error}</Alert>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Warga"
          value={stats?.citizens ?? 0}
          href="/citizens"
          icon={IconUsers}
          tone="bg-emerald-100 text-emerald-700"
        />
        <StatCard
          label="Layanan Aktif"
          value={activeServices}
          href="/services"
          icon={IconLayers}
          tone="bg-teal-100 text-teal-700"
        />
        <StatCard
          label="Total Transaksi"
          value={stats?.transactions ?? 0}
          href="/transactions"
          icon={IconReceipt}
          tone="bg-sky-100 text-sky-700"
        />
        <StatCard
          label="Total Pengguna"
          value={stats?.users ?? 0}
          href="/users"
          icon={IconBadge}
          tone="bg-amber-100 text-amber-700"
        />
      </div>

      <Card>
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <h2 className="text-sm font-semibold text-slate-700">
            Transaksi Terbaru
          </h2>
          <Link
            href="/transactions"
            className="text-sm font-medium text-emerald-600 hover:underline"
          >
            Lihat semua
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="px-5 py-6 text-sm text-slate-500">Belum ada transaksi.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
                  <th className="px-5 py-2 font-medium">Waktu</th>
                  <th className="px-5 py-2 font-medium">NFC UID</th>
                  <th className="px-5 py-2 font-medium">Layanan</th>
                  <th className="px-5 py-2 font-medium">Status</th>
                  <th className="px-5 py-2 font-medium">Lokasi/Outlet</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((tx) => (
                  <tr
                    key={tx.id}
                    className="border-b border-slate-100 last:border-0"
                  >
                    <td className="px-5 py-2 text-slate-600">
                      {formatDateTime(tx.created_at)}
                    </td>
                    <td className="px-5 py-2 font-mono text-xs text-slate-700">
                      {tx.nfc_uid}
                    </td>
                    <td className="px-5 py-2 text-slate-700">
                      {serviceName(byCode, tx.service_code)}
                    </td>
                    <td className="px-5 py-2">
                      <TxStatusBadge status={tx.status} />
                    </td>
                    <td className="px-5 py-2 text-slate-600">
                      {tx.merchant_name || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function StatCard({
  label,
  value,
  href,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  href: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  tone: string;
}) {
  return (
    <Link href={href}>
      <Card className="flex items-center gap-4 p-5 transition-shadow hover:shadow-md">
        <div
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
            tone,
          )}
        >
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-0.5 text-2xl font-bold text-slate-800">
            {value.toLocaleString("id-ID")}
          </p>
        </div>
      </Card>
    </Link>
  );
}
