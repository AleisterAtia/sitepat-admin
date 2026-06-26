"use client";

import { useCallback, useEffect, useState } from "react";

import * as api from "@/lib/api";
import { ApiError } from "@/lib/api";
import type { Role, User } from "@/lib/types";
import { formatDate } from "@/lib/format";
import { Alert, Button, Card, Field, Input, Select, Spinner } from "@/components/ui";
import { ActiveBadge, RoleBadge } from "@/components/badges";
import { Modal } from "@/components/Modal";
import { Pagination } from "@/components/Pagination";

const LIMIT = 20;

export default function UsersPage() {
  const [items, setItems] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.listUsers({ search, page, limit: LIMIT });
      setItems(res.data);
      setTotal(res.pagination.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data pengguna");
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
        <h1 className="text-xl font-semibold text-slate-800">Pengguna</h1>
        <Button onClick={() => setCreateOpen(true)}>+ Tambah Pengguna</Button>
      </div>

      <form onSubmit={onSearch} className="flex gap-2">
        <Input
          placeholder="Cari username atau nama SPBU…"
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

      {notice && <Alert tone="success">{notice}</Alert>}
      {error && <Alert tone="error">{error}</Alert>}

      <Card>
        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner className="h-7 w-7 text-blue-600" />
          </div>
        ) : items.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-slate-500">
            {search ? "Tidak ada pengguna yang cocok." : "Belum ada pengguna."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
                  <th className="px-5 py-3 font-medium">Username</th>
                  <th className="px-5 py-3 font-medium">Role</th>
                  <th className="px-5 py-3 font-medium">Nama SPBU/Pangkalan</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Dibuat</th>
                  <th className="px-5 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((u) => (
                  <tr key={u.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="px-5 py-3 font-medium text-slate-800">{u.username}</td>
                    <td className="px-5 py-3"><RoleBadge role={u.role} /></td>
                    <td className="px-5 py-3 text-slate-600">{u.merchant_name || "-"}</td>
                    <td className="px-5 py-3"><ActiveBadge active={u.is_active} /></td>
                    <td className="px-5 py-3 text-slate-600">{formatDate(u.created_at)}</td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => setEditing(u)}
                        className="text-sm font-medium text-blue-600 hover:underline"
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
        {!loading && total > 0 && (
          <div className="border-t border-slate-200 px-3">
            <Pagination page={page} limit={LIMIT} total={total} onPageChange={setPage} />
          </div>
        )}
      </Card>

      <CreateUserModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => {
          setCreateOpen(false);
          setNotice("Pengguna baru berhasil dibuat.");
          setPage(1);
          setSearch("");
          setSearchInput("");
          load();
        }}
      />

      <EditUserModal
        user={editing}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          setNotice("Perubahan pengguna disimpan.");
          load();
        }}
      />
    </div>
  );
}

function CreateUserModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("merchant");
  const [merchantName, setMerchantName] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setUsername("");
    setPassword("");
    setRole("merchant");
    setMerchantName("");
    setError("");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!username.trim()) {
      setError("Username wajib diisi.");
      return;
    }
    if (password.length < 6 || password.length > 72) {
      setError("Password harus 6–72 karakter.");
      return;
    }
    setSubmitting(true);
    try {
      await api.createUser({
        username: username.trim(),
        password,
        role,
        merchant_name: role === "merchant" ? merchantName.trim() : "",
      });
      reset();
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal membuat pengguna.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Tambah Pengguna">
      <form onSubmit={onSubmit} className="space-y-4">
        {error && <Alert tone="error">{error}</Alert>}
        <Field label="Username" htmlFor="cu-username">
          <Input
            id="cu-username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="off"
            required
          />
        </Field>
        <Field label="Password" htmlFor="cu-password" hint="6–72 karakter">
          <Input
            id="cu-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
        </Field>
        <Field label="Role" htmlFor="cu-role">
          <Select id="cu-role" value={role} onChange={(e) => setRole(e.target.value as Role)}>
            <option value="merchant">Petugas (merchant)</option>
            <option value="admin">Admin</option>
          </Select>
        </Field>
        {role === "merchant" && (
          <Field label="Nama SPBU/Pangkalan" htmlFor="cu-merchant">
            <Input
              id="cu-merchant"
              value={merchantName}
              onChange={(e) => setMerchantName(e.target.value)}
              placeholder="SPBU 34-401 Merdeka"
            />
          </Field>
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

function EditUserModal({
  user,
  onClose,
  onSaved,
}: {
  user: User | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [role, setRole] = useState<Role>("merchant");
  const [merchantName, setMerchantName] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Sinkronkan form saat user yang diedit berubah.
  useEffect(() => {
    if (user) {
      setRole(user.role);
      setMerchantName(user.merchant_name ?? "");
      setIsActive(user.is_active);
      setPassword("");
      setError("");
    }
  }, [user]);

  if (!user) return null;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password && (password.length < 6 || password.length > 72)) {
      setError("Password baru harus 6–72 karakter.");
      return;
    }
    setSubmitting(true);
    try {
      await api.updateUser(user!.id, {
        role,
        merchant_name: role === "merchant" ? merchantName.trim() : "",
        is_active: isActive,
        ...(password ? { password } : {}),
      });
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal menyimpan perubahan.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={!!user} onClose={onClose} title={`Edit: ${user.username}`}>
      <form onSubmit={onSubmit} className="space-y-4">
        {error && <Alert tone="error">{error}</Alert>}
        <Field label="Role" htmlFor="eu-role">
          <Select id="eu-role" value={role} onChange={(e) => setRole(e.target.value as Role)}>
            <option value="merchant">Petugas (merchant)</option>
            <option value="admin">Admin</option>
          </Select>
        </Field>
        {role === "merchant" && (
          <Field label="Nama SPBU/Pangkalan" htmlFor="eu-merchant">
            <Input
              id="eu-merchant"
              value={merchantName}
              onChange={(e) => setMerchantName(e.target.value)}
            />
          </Field>
        )}
        <Field label="Password baru" htmlFor="eu-password" hint="Kosongkan bila tidak diubah">
          <Input
            id="eu-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
        </Field>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300"
          />
          Akun aktif (nonaktifkan untuk memblokir login)
        </label>
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
