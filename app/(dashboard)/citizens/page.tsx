"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import * as api from "@/lib/api";
import { ApiError } from "@/lib/api";
import type { Citizen } from "@/lib/types";
import { formatDate } from "@/lib/format";
import { Alert, Button, Card, Field, Input, Spinner } from "@/components/ui";
import { EligibilityBadge } from "@/components/badges";
import { Modal } from "@/components/Modal";
import { Pagination } from "@/components/Pagination";

const LIMIT = 20;

export default function CitizensPage() {
  const [items, setItems] = useState<Citizen[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.listCitizens({ search, page, limit: LIMIT });
      setItems(res.data);
      setTotal(res.pagination.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data warga");
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    load();
  }, [load]);

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-slate-800">Warga</h1>
        <Button onClick={() => setModalOpen(true)}>+ Tambah Warga</Button>
      </div>

      <form onSubmit={onSearch} className="flex gap-2">
        <Input
          placeholder="Cari NIK, NFC UID, atau nama…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="max-w-md"
        />
        <Button type="submit" variant="secondary">
          Cari
        </Button>
        {search && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setSearchInput("");
              setSearch("");
              setPage(1);
            }}
          >
            Reset
          </Button>
        )}
      </form>

      {error && <Alert tone="error">{error}</Alert>}

      <Card>
        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner className="h-7 w-7 text-blue-600" />
          </div>
        ) : items.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-slate-500">
            {search ? "Tidak ada warga yang cocok." : "Belum ada warga terdaftar."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
                  <th className="px-5 py-3 font-medium">NIK</th>
                  <th className="px-5 py-3 font-medium">Nama</th>
                  <th className="px-5 py-3 font-medium">NFC UID</th>
                  <th className="px-5 py-3 font-medium">Kelayakan</th>
                  <th className="px-5 py-3 font-medium">Terdaftar</th>
                  <th className="px-5 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((c) => (
                  <tr key={c.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="px-5 py-3 font-mono text-xs text-slate-700">{c.nik}</td>
                    <td className="px-5 py-3 font-medium text-slate-800">{c.name}</td>
                    <td className="px-5 py-3 font-mono text-xs text-slate-600">{c.nfc_uid}</td>
                    <td className="px-5 py-3"><EligibilityBadge eligible={c.is_eligible} /></td>
                    <td className="px-5 py-3 text-slate-600">{formatDate(c.created_at)}</td>
                    <td className="px-5 py-3 text-right">
                      <Link href={`/citizens/${c.id}`} className="text-sm font-medium text-blue-600 hover:underline">
                        Detail
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && total > 0 && (
          <div className="border-t border-slate-200 px-3">
            <Pagination page={page} limit={LIMIT} total={total} onPageChange={setPage} />
          </div>
        )}
      </Card>

      <RegisterCitizenModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={() => {
          setModalOpen(false);
          setPage(1);
          setSearch("");
          setSearchInput("");
          load();
        }}
      />
    </div>
  );
}

function RegisterCitizenModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [nik, setNik] = useState("");
  const [nfcUid, setNfcUid] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setNik("");
    setNfcUid("");
    setName("");
    setError("");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!/^\d{16}$/.test(nik)) {
      setError("NIK harus 16 digit angka.");
      return;
    }
    if (!nfcUid.trim() || !name.trim()) {
      setError("NFC UID dan nama wajib diisi.");
      return;
    }
    setSubmitting(true);
    try {
      await api.registerCitizen({
        nik,
        nfc_uid: nfcUid.trim(),
        name: name.trim(),
      });
      reset();
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal mendaftarkan warga.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Tambah Warga">
      <form onSubmit={onSubmit} className="space-y-4">
        {error && <Alert tone="error">{error}</Alert>}
        <Field label="NIK" htmlFor="nik" hint="16 digit angka">
          <Input
            id="nik"
            value={nik}
            onChange={(e) => setNik(e.target.value.replace(/\D/g, "").slice(0, 16))}
            inputMode="numeric"
            placeholder="3201234567890001"
            required
          />
        </Field>
        <Field label="NFC UID" htmlFor="nfc_uid" hint="UID chip e-KTP">
          <Input
            id="nfc_uid"
            value={nfcUid}
            onChange={(e) => setNfcUid(e.target.value)}
            placeholder="04A1B2C3D4E5F6"
            required
          />
        </Field>
        <Field label="Nama" htmlFor="name">
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
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
