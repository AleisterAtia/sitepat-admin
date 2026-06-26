// Badge khusus domain SI-TEPAT, dipakai ulang di beberapa halaman.

import { Badge } from "./ui";
import type { Role, TxStatus } from "@/lib/types";

export function TxStatusBadge({ status }: { status: TxStatus }) {
  return status === "success" ? (
    <Badge tone="green">Berhasil</Badge>
  ) : (
    <Badge tone="red">Ditolak</Badge>
  );
}

export function EligibilityBadge({ eligible }: { eligible: boolean }) {
  return eligible ? (
    <Badge tone="green">Layak</Badge>
  ) : (
    <Badge tone="gray">Tidak Layak</Badge>
  );
}

export function ActiveBadge({ active }: { active: boolean }) {
  return active ? (
    <Badge tone="green">Aktif</Badge>
  ) : (
    <Badge tone="red">Nonaktif</Badge>
  );
}

export function RoleBadge({ role }: { role: Role }) {
  return role === "admin" ? (
    <Badge tone="blue">Admin</Badge>
  ) : (
    <Badge tone="amber">Petugas</Badge>
  );
}
