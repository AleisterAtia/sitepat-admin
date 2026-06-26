"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

import * as api from "@/lib/api";
import { ApiError } from "@/lib/api";
import type { Citizen, Commodity } from "@/lib/types";
import { COMMODITIES, COMMODITY_LABEL } from "@/lib/types";
import { formatDate, currentPeriodWIB } from "@/lib/format";
import { Alert, Button, Card, Field, Input, Select, Spinner } from "@/components/ui";
import { EligibilityBadge } from "@/components/badges";
import { Modal } from "@/components/Modal";

export default function CitizenDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [citizen, setCitizen] = useState<Citizen | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [togglingElig, setTogglingElig] = useState(false);
  const [quotaModal, setQuotaModal] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setCitizen(await api.getCitizen(id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data warga");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleEligibility() {
    if (!citizen) return;
    setTogglingElig(true);
    setNotice("");
    setError("");
    try {
      const next = !citizen.is_eligible;
      await api.setEligibility(citizen.id, next);
      setCitizen({ ...citizen, is_eligible: next });
      setNotice(next ? "Warga ditandai LAYAK menerima subsidi." : "Warga ditandai TIDAK LAYAK.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memperbarui kelayakan");
    } finally {
      setTogglingElig(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="h-8 w-8 text-blue-600" />
      </div>
    );
  }

  if (!citizen) {
    return (
      <div className="space-y-4">
        <Alert tone="error">{error || "Warga tidak ditemukan."}</Alert>
        <Link href="/citizens" className="text-sm text-blue-600 hover:underline">
          ← Kembali ke daftar warga
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Link href="/citizens" className="text-sm text-blue-600 hover:underline">
        ← Kembali ke daftar warga
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">{citizen.name}</h1>
          <p className="font-mono text-sm text-slate-500">{citizen.nik}</p>
        </div>
        <EligibilityBadge eligible={citizen.is_eligible} />
      </div>

      {notice && <Alert tone="success">{notice}</Alert>}
      {error && <Alert tone="error">{error}</Alert>}

      <Card className="p-5">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Informasi Warga</h2>
        <dl className="grid grid-cols-1 gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
          <Info label="NIK" value={citizen.nik} mono />
          <Info label="NFC UID" value={citizen.nfc_uid} mono />
          <Info label="Nama" value={citizen.name} />
          <Info label="Terdaftar" value={formatDate(citizen.created_at)} />
        </dl>
        <div className="mt-4 border-t border-slate-100 pt-4">
          <Button
            variant={citizen.is_eligible ? "danger" : "primary"}
            loading={togglingElig}
            onClick={toggleEligibility}
          >
            {citizen.is_eligible ? "Tandai Tidak Layak" : "Tandai Layak"}
          </Button>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <h2 className="text-sm font-semibold text-slate-700">Kuota Subsidi</h2>
          <Button className="px-3 py-1.5" onClick={() => setQuotaModal(true)}>
            + Atur Kuota
          </Button>
        </div>
        {!citizen.quotas || citizen.quotas.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-slate-500">
            Belum ada kuota yang diatur.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
                  <th className="px-5 py-2 font-medium">Komoditas</th>
                  <th className="px-5 py-2 font-medium">Periode</th>
                  <th className="px-5 py-2 font-medium">Total</th>
                  <th className="px-5 py-2 font-medium">Sisa</th>
                </tr>
              </thead>
              <tbody>
                {citizen.quotas.map((q) => (
                  <tr key={q.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-5 py-2 text-slate-700">{COMMODITY_LABEL[q.commodity]}</td>
                    <td className="px-5 py-2 font-mono text-slate-600">{q.period}</td>
                    <td className="px-5 py-2 text-slate-700">{q.quota_total}</td>
                    <td className="px-5 py-2 font-medium text-slate-800">{q.quota_remaining}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <SetQuotaModal
        open={quotaModal}
        citizenId={citizen.id}
        onClose={() => setQuotaModal(false)}
        onSaved={() => {
          setQuotaModal(false);
          setNotice("Kuota berhasil disimpan.");
          load();
        }}
      />
    </div>
  );
}

function Info({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs uppercase text-slate-500">{label}</dt>
      <dd className={mono ? "font-mono text-slate-800" : "text-slate-800"}>{value}</dd>
    </div>
  );
}

function SetQuotaModal({
  open,
  citizenId,
  onClose,
  onSaved,
}: {
  open: boolean;
  citizenId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [commodity, setCommodity] = useState<Commodity>("LPG_3KG");
  const [period, setPeriod] = useState(currentPeriodWIB());
  const [total, setTotal] = useState("1");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const qt = Number(total);
    if (!Number.isInteger(qt) || qt < 0) {
      setError("Total kuota harus bilangan bulat ≥ 0.");
      return;
    }
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(period)) {
      setError("Periode harus berformat YYYY-MM (mis. 2026-06).");
      return;
    }
    setSubmitting(true);
    try {
      await api.setQuota(citizenId, { commodity, period, quota_total: qt });
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal menyimpan kuota.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Atur Kuota Subsidi">
      <form onSubmit={onSubmit} className="space-y-4">
        {error && <Alert tone="error">{error}</Alert>}
        <Field label="Komoditas" htmlFor="commodity">
          <Select
            id="commodity"
            value={commodity}
            onChange={(e) => setCommodity(e.target.value as Commodity)}
          >
            {COMMODITIES.map((c) => (
              <option key={c} value={c}>
                {COMMODITY_LABEL[c]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Periode" htmlFor="period" hint="Format YYYY-MM (WIB)">
          <Input
            id="period"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            placeholder="2026-06"
            required
          />
        </Field>
        <Field
          label="Total Kuota"
          htmlFor="total"
          hint="Menyetel total & mereset sisa kuota ke nilai ini"
        >
          <Input
            id="total"
            type="number"
            min={0}
            value={total}
            onChange={(e) => setTotal(e.target.value)}
            required
          />
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" loading={submitting}>
            Simpan
          </Button>
        </div>
      </form>
    </Modal>
  );
}
