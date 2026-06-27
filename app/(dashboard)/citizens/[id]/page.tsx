"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

import * as api from "@/lib/api";
import { ApiError } from "@/lib/api";
import { useServices } from "@/lib/services-context";
import type { Citizen, Service } from "@/lib/types";
import { formatDate, currentPeriodWIB } from "@/lib/format";
import {
  Alert,
  Button,
  Card,
  Field,
  Input,
  Select,
  Spinner,
} from "@/components/ui";
import { EligibilityBadge, ServiceKindBadge } from "@/components/badges";
import { Modal } from "@/components/Modal";

export default function CitizenDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { services } = useServices();

  const [citizen, setCitizen] = useState<Citizen | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [quotaService, setQuotaService] = useState<Service | null>(null);

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

  const period = currentPeriodWIB();
  // Layanan yang dikelola per-warga: aktif & butuh kelayakan (quota/eligibility).
  const managed = services.filter((s) => s.is_active && s.kind !== "log");
  const quotaServices = services.filter((s) => s.is_active && s.kind === "quota");

  function effectiveEligible(s: Service): boolean {
    const row = citizen?.eligibilities?.find((e) => e.service_id === s.id);
    return row ? row.is_eligible : s.default_eligible;
  }
  function quotaFor(s: Service) {
    return citizen?.quotas?.find(
      (q) => q.service_id === s.id && q.period === period,
    );
  }

  async function toggleEligibility(s: Service) {
    if (!citizen) return;
    setTogglingId(s.id);
    setNotice("");
    setError("");
    try {
      const next = !effectiveEligible(s);
      await api.setEligibility(citizen.id, {
        service_code: s.code,
        is_eligible: next,
      });
      await load();
      setNotice(
        `Kelayakan "${s.name}" diperbarui: ${next ? "LAYAK" : "TIDAK LAYAK"}.`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memperbarui kelayakan");
    } finally {
      setTogglingId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="h-8 w-8 text-emerald-600" />
      </div>
    );
  }

  if (!citizen) {
    return (
      <div className="space-y-4">
        <Alert tone="error">{error || "Warga tidak ditemukan."}</Alert>
        <Link href="/citizens" className="text-sm text-emerald-600 hover:underline">
          ← Kembali ke daftar warga
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Link href="/citizens" className="text-sm text-emerald-600 hover:underline">
        ← Kembali ke daftar warga
      </Link>

      <div>
        <h1 className="text-xl font-semibold text-slate-800">{citizen.name}</h1>
        <p className="font-mono text-sm text-slate-500">{citizen.nik}</p>
      </div>

      {notice && <Alert tone="success">{notice}</Alert>}
      {error && <Alert tone="error">{error}</Alert>}

      <Card className="p-5">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">
          Informasi Warga
        </h2>
        <dl className="grid grid-cols-1 gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
          <Info label="NIK" value={citizen.nik} mono />
          <Info label="NFC UID" value={citizen.nfc_uid} mono />
          <Info label="Nama" value={citizen.name} />
          <Info label="Terdaftar" value={formatDate(citizen.created_at)} />
        </dl>
      </Card>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-5 py-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-700">
              Kelayakan &amp; Kuota per Layanan
            </h2>
            <p className="text-xs text-slate-500">
              Periode kuota berjalan: {period} (WIB)
            </p>
          </div>
          {quotaServices.length > 0 && (
            <Button
              className="px-3 py-1.5"
              onClick={() => setQuotaService(quotaServices[0])}
            >
              + Atur Kuota
            </Button>
          )}
        </div>

        {managed.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-slate-500">
            Belum ada layanan aktif yang memerlukan kelayakan. Tambahkan di menu
            Layanan.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
                  <th className="px-5 py-2 font-medium">Layanan</th>
                  <th className="px-5 py-2 font-medium">Kelayakan</th>
                  <th className="px-5 py-2 font-medium">Kuota ({period})</th>
                  <th className="px-5 py-2 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {managed.map((s) => {
                  const eligible = effectiveEligible(s);
                  const q = quotaFor(s);
                  return (
                    <tr
                      key={s.id}
                      className="border-b border-slate-100 last:border-0"
                    >
                      <td className="px-5 py-3">
                        <div className="font-medium text-slate-800">{s.name}</div>
                        <div className="mt-1">
                          <ServiceKindBadge kind={s.kind} />
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <EligibilityBadge eligible={eligible} />
                      </td>
                      <td className="px-5 py-3">
                        {s.kind === "quota" ? (
                          q ? (
                            <span className="text-slate-700">
                              <span className="font-semibold text-slate-900">
                                {q.quota_remaining}
                              </span>{" "}
                              / {q.quota_total}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">
                              belum diatur
                            </span>
                          )
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-3 whitespace-nowrap">
                          <button
                            onClick={() => toggleEligibility(s)}
                            disabled={togglingId === s.id}
                            className="text-sm font-medium text-emerald-600 hover:underline disabled:opacity-50"
                          >
                            {eligible ? "Tandai tidak layak" : "Tandai layak"}
                          </button>
                          {s.kind === "quota" && (
                            <button
                              onClick={() => setQuotaService(s)}
                              className="text-sm font-medium text-slate-600 hover:underline"
                            >
                              Atur kuota
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <SetQuotaModal
        service={quotaService}
        citizenId={citizen.id}
        quotaServices={quotaServices}
        onClose={() => setQuotaService(null)}
        onSaved={() => {
          setQuotaService(null);
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
      <dd className={mono ? "font-mono text-slate-800" : "text-slate-800"}>
        {value}
      </dd>
    </div>
  );
}

function SetQuotaModal({
  service,
  citizenId,
  quotaServices,
  onClose,
  onSaved,
}: {
  service: Service | null;
  citizenId: string;
  quotaServices: Service[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [code, setCode] = useState("");
  const [period, setPeriod] = useState(currentPeriodWIB());
  const [total, setTotal] = useState("1");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (service) {
      setCode(service.code);
      setPeriod(currentPeriodWIB());
      setTotal("1");
      setError("");
    }
  }, [service]);

  if (!service) return null;

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
      await api.setQuota(citizenId, { service_code: code, period, quota_total: qt });
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal menyimpan kuota.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={!!service} onClose={onClose} title="Atur Kuota">
      <form onSubmit={onSubmit} className="space-y-4">
        {error && <Alert tone="error">{error}</Alert>}
        <Field label="Layanan" htmlFor="q-service">
          <Select
            id="q-service"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          >
            {quotaServices.map((s) => (
              <option key={s.id} value={s.code}>
                {s.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Periode" htmlFor="q-period" hint="Format YYYY-MM (WIB)">
          <Input
            id="q-period"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            placeholder="2026-06"
            required
          />
        </Field>
        <Field
          label="Total Kuota"
          htmlFor="q-total"
          hint="Menyetel total & mereset sisa kuota ke nilai ini"
        >
          <Input
            id="q-total"
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
