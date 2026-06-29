"use client";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}

export default function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages: (number | "...")[] = [];

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("...");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      pages.push(i);
    }
    if (page < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }

  return (
    <div className="flex items-center justify-center gap-1 mt-6 flex-wrap">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className="px-3 py-2 rounded-xl text-sm font-semibold bg-white/[0.06] text-white/60 
                   hover:bg-white/10 hover:text-white disabled:opacity-30 
                   disabled:cursor-not-allowed transition-all"
      >
        ← Prev
      </button>

      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`dots-${i}`} className="px-2 text-white/30 text-sm">…</span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p as number)}
            className={`w-9 h-9 rounded-xl text-sm font-bold transition-all ${
              p === page
                ? "bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg"
                : "bg-white/[0.06] text-white/60 hover:bg-white/10 hover:text-white"
            }`}
          >
            {p}
          </button>
        )
      )}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        className="px-3 py-2 rounded-xl text-sm font-semibold bg-white/[0.06] text-white/60 
                   hover:bg-white/10 hover:text-white disabled:opacity-30 
                   disabled:cursor-not-allowed transition-all"
      >
        Next →
      </button>
    </div>
  );
}