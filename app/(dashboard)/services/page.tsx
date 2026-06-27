"use client";

import { useEffect, useState } from "react";

import * as api from "@/lib/api";
import { ApiError } from "@/lib/api";
import { useServices } from "@/lib/services-context";
import type { Service, ServiceKind } from "@/lib/types";
import {
  Alert,
  Badge,
  Button,
  Card,
  Field,
  Input,
  Select,
  Spinner,
} from "@/components/ui";
import { ActiveBadge, ServiceKindBadge } from "@/components/badges";
import { Modal } from "@/components/Modal";
import { IconPlus } from "@/components/icons";

export default function ServicesPage() {
  const { services, loading, error, refresh } = useServices();
  const [notice, setNotice] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Layanan</h1>
          <p className="text-sm text-slate-500">
            Katalog layanan yang bisa dijalankan lewat tap e-KTP.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <IconPlus className="h-4 w-4" /> Tambah Layanan
        </Button>
      </div>

      {notice && <Alert tone="success">{notice}</Alert>}
      {error && <Alert tone="error">{error}</Alert>}

      <Card>
        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner className="h-7 w-7 text-emerald-600" />
          </div>
        ) : services.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-slate-500">
            Belum ada layanan. Tambahkan layanan pertama Anda.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
                  <th className="px-5 py-3 font-medium">Kode</th>
                  <th className="px-5 py-3 font-medium">Nama</th>
                  <th className="px-5 py-3 font-medium">Jenis</th>
                  <th className="px-5 py-3 font-medium">Kelayakan default</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {services.map((s) => (
                  <tr
                    key={s.id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                  >
                    <td className="px-5 py-3 font-mono text-xs text-slate-700">
                      {s.code}
                    </td>
                    <td className="px-5 py-3 font-medium text-slate-800">
                      {s.name}
                    </td>
                    <td className="px-5 py-3">
                      <ServiceKindBadge kind={s.kind} />
                    </td>
                    <td className="px-5 py-3">
                      {s.kind === "log" ? (
                        <span className="text-xs text-slate-400">—</span>
                      ) : s.default_eligible ? (
                        <Badge tone="emerald">Layak otomatis</Badge>
                      ) : (
                        <Badge tone="gray">Perlu didaftarkan</Badge>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <ActiveBadge active={s.is_active} />
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => setEditing(s)}
                        className="text-sm font-medium text-emerald-600 hover:underline"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <ServiceFormModal
        mode="create"
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onDone={async () => {
          setCreateOpen(false);
          setNotice("Layanan baru dibuat.");
          await refresh();
        }}
      />
      <ServiceFormModal
        mode="edit"
        service={editing}
        open={!!editing}
        onClose={() => setEditing(null)}
        onDone={async () => {
          setEditing(null);
          setNotice("Perubahan layanan disimpan.");
          await refresh();
        }}
      />
    </div>
  );
}

const KIND_HINT: Record<ServiceKind, string> = {
  quota: "Mis. subsidi LPG/Pertalite — warga punya jatah per periode.",
  eligibility: "Mis. bantuan tertentu — verifikasi kelayakan lalu dicatat.",
  log: "Mis. pendaftaran klinik — semua warga terdaftar dilayani & dicatat.",
};

function ServiceFormModal({
  mode,
  service,
  open,
  onClose,
  onDone,
}: {
  mode: "create" | "edit";
  service?: Service | null;
  open: boolean;
  onClose: () => void;
  onDone: () => void | Promise<void>;
}) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [kind, setKind] = useState<ServiceKind>("quota");
  const [defaultEligible, setDefaultEligible] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (mode === "edit" && service) {
      setCode(service.code);
      setName(service.name);
      setKind(service.kind);
      setDefaultEligible(service.default_eligible);
      setIsActive(service.is_active);
      setError("");
    } else if (mode === "create" && open) {
      setCode("");
      setName("");
      setKind("quota");
      setDefaultEligible(false);
      setIsActive(true);
      setError("");
    }
  }, [mode, service, open]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (mode === "create" && !/^[A-Z0-9_]{2,32}$/.test(code.trim())) {
      setError(
        "Kode wajib 2–32 karakter huruf besar/angka/underscore (mis. LPG_3KG).",
      );
      return;
    }
    if (!name.trim()) {
      setError("Nama layanan wajib diisi.");
      return;
    }
    setSubmitting(true);
    try {
      const eligible = kind === "log" ? false : defaultEligible;
      if (mode === "create") {
        await api.createService({
          code: code.trim().toUpperCase(),
          name: name.trim(),
          kind,
          default_eligible: eligible,
        });
      } else if (service) {
        await api.updateService(service.id, {
          name: name.trim(),
          kind,
          default_eligible: eligible,
          is_active: isActive,
        });
      }
      await onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal menyimpan layanan.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === "create" ? "Tambah Layanan" : `Edit: ${service?.name ?? ""}`}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        {error && <Alert tone="error">{error}</Alert>}
        <Field
          label="Kode layanan"
          htmlFor="svc-code"
          hint={
            mode === "edit"
              ? "Kode tidak bisa diubah."
              : "Huruf besar, angka, underscore (mis. KLINIK_DAFTAR)."
          }
        >
          <Input
            id="svc-code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            disabled={mode === "edit"}
            placeholder="BANTUAN_KEL"
            autoComplete="off"
          />
        </Field>
        <Field label="Nama layanan" htmlFor="svc-name">
          <Input
            id="svc-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Bantuan Kelurahan"
            required
          />
        </Field>
        <Field label="Jenis" htmlFor="svc-kind" hint={KIND_HINT[kind]}>
          <Select
            id="svc-kind"
            value={kind}
            onChange={(e) => setKind(e.target.value as ServiceKind)}
          >
            <option value="quota">Kuota berkala — kelayakan + potong kuota</option>
            <option value="eligibility">Kelayakan — verifikasi, tanpa kuota</option>
            <option value="log">Catat kunjungan — semua warga terdaftar</option>
          </Select>
        </Field>
        {kind !== "log" && (
          <label className="flex items-start gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={defaultEligible}
              onChange={(e) => setDefaultEligible(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300"
            />
            <span>
              Warga otomatis layak (opt-out). Matikan agar warga harus didaftarkan
              dulu (opt-in).
            </span>
          </label>
        )}
        {mode === "edit" && (
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300"
            />
            Layanan aktif (nonaktifkan untuk menolak klaim baru)
          </label>
        )}
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
