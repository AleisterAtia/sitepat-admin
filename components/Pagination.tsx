// Kontrol paginasi sederhana: info rentang data + tombol Sebelumnya/Berikutnya.

import { Button } from "./ui";

export function Pagination({
  page,
  limit,
  total,
  onPageChange,
}: {
  page: number;
  limit: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="flex items-center justify-between gap-2 px-1 py-3 text-sm text-slate-600">
      <span>
        Menampilkan <span className="font-medium">{from}</span>–
        <span className="font-medium">{to}</span> dari{" "}
        <span className="font-medium">{total}</span>
      </span>
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          className="px-3 py-1"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Sebelumnya
        </Button>
        <span className="px-1">
          Hal. {page}/{totalPages}
        </span>
        <Button
          variant="secondary"
          className="px-3 py-1"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Berikutnya
        </Button>
      </div>
    </div>
  );
}
