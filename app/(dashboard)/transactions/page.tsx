"use client";

import { useCallback, useEffect, useState } from "react";

import * as api from "@/lib/api";
import type { TransactionParams } from "@/lib/api";
import { useServices, serviceName } from "@/lib/services-context";
import type { Transaction, TxStatus } from "@/lib/types";
import { formatDateTime } from "@/lib/format";
import { Alert, Button, Card, Field, Input, Select, Spinner } from "@/components/ui";
import { TxStatusBadge } from "@/components/badges";
import { Pagination } from "@/components/Pagination";

const LIMIT = 20;

interface Filters {
  status: "" | TxStatus;
  service_code: string;
  merchant_name: string;
  from: string;
  to: string;
}

const EMPTY: Filters = {
  status: "",
  service_code: "",
  merchant_name: "",
  from: "",
  to: "",
};

export default function TransactionsPage() {
  const { services, byCode } = useServices();
  const [input, setInput] = useState<Filters>(EMPTY);
  const [applied, setApplied] = useState<Filters>(EMPTY);
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params: TransactionParams = {
        page,
        limit: LIMIT,
        status: applied.status || undefined,
        service_code: applied.service_code || undefined,
        merchant_name: applied.merchant_name || undefined,
        from: applied.from || undefined,
        to: applied.to || undefined,
      };
      const res = await api.listTransactions(params);
      setItems(res.data);
      setTotal(res.pagination.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat transaksi");
    } finally {
      setLoading(false);
    }
  }, [applied, page]);

  useEffect(() => {
    load();
  }, [load]);

  function applyFilters(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setApplied(input);
  }

  function resetFilters() {
    setInput(EMPTY);
    setApplied(EMPTY);
    setPage(1);
  }

  function set<K extends keyof Filters>(key: K, value: Filters[K]) {
    setInput((f) => ({ ...f, [key]: value }) as Filters);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-slate-800">Transaksi</h1>

      <Card className="p-4">
        <form onSubmit={applyFilters} className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <Field label="Status" htmlFor="f-status">
              <Select
                id="f-status"
                value={input.status}
                onChange={(e) => set("status", e.target.value as Filters["status"])}
              >
                <option value="">Semua</option>
                <option value="success">Berhasil</option>
                <option value="rejected">Ditolak</option>
              </Select>
            </Field>
            <Field label="Layanan" htmlFor="f-service">
              <Select
                id="f-service"
                value={input.service_code}
                onChange={(e) => set("service_code", e.target.value)}
              >
                <option value="">Semua</option>
                {services.map((s) => (
                  <option key={s.id} value={s.code}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Dari (WIB)" htmlFor="f-from">
              <Input
                id="f-from"
                type="date"
                value={input.from}
                onChange={(e) => set("from", e.target.value)}
              />
            </Field>
            <Field label="Sampai (WIB)" htmlFor="f-to">
              <Input
                id="f-to"
                type="date"
                value={input.to}
                onChange={(e) => set("to", e.target.value)}
              />
            </Field>
            <Field label="Lokasi/Outlet" htmlFor="f-merchant">
              <Input
                id="f-merchant"
                value={input.merchant_name}
                onChange={(e) => set("merchant_name", e.target.value)}
                placeholder="Nama lokasi…"
              />
            </Field>
          </div>
          <div className="flex gap-2">
            <Button type="submit" variant="secondary">
              Terapkan Filter
            </Button>
            <Button type="button" variant="ghost" onClick={resetFilters}>
              Reset
            </Button>
          </div>
        </form>
      </Card>

      {error && <Alert tone="error">{error}</Alert>}

      <Card>
        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner className="h-7 w-7 text-emerald-600" />
          </div>
        ) : items.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-slate-500">
            Tidak ada transaksi yang cocok dengan filter.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
                  <th className="px-5 py-3 font-medium">Waktu</th>
                  <th className="px-5 py-3 font-medium">NFC UID</th>
                  <th className="px-5 py-3 font-medium">Layanan</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Alasan</th>
                  <th className="px-5 py-3 font-medium">Lokasi/Outlet</th>
                </tr>
              </thead>
              <tbody>
                {items.map((tx) => (
                  <tr
                    key={tx.id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                  >
                    <td className="px-5 py-3 whitespace-nowrap text-slate-600">
                      {formatDateTime(tx.created_at)}
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-slate-700">
                      {tx.nfc_uid}
                    </td>
                    <td className="px-5 py-3 text-slate-700">
                      {serviceName(byCode, tx.service_code)}
                    </td>
                    <td className="px-5 py-3">
                      <TxStatusBadge status={tx.status} />
                    </td>
                    <td className="px-5 py-3 text-slate-600">{tx.reason || "-"}</td>
                    <td className="px-5 py-3 text-slate-600">
                      {tx.merchant_name || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && total > 0 && (
          <div className="border-t border-slate-200 px-3">
            <Pagination
              page={page}
              limit={LIMIT}
              total={total}
              onPageChange={setPage}
            />
          </div>
        )}
      </Card>
    </div>
  );
}
