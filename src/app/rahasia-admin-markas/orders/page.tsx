"use client";

import {
  ArrowLeft,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  Loader2,
  Package,
  RefreshCw,
  Search,
  ShoppingBag,
  Trash2,
  TrendingUp,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type OrderStatus =
  | "pending"
  | "diproses"
  | "dikirim"
  | "selesai"
  | "dibatalkan";

type Order = {
  id: number;
  customer_name: string;
  customer_email?: string;
  phone: string;
  address: string;
  product: string;
  total_price: string;
  status: OrderStatus;
  created_at: string;
};

type PaginationMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

type Stats = {
  total_orders: number;
  pending_orders: number;
  completed_orders: number;
  total_revenue: number;
};

type Toast = { id: number; message: string; type: "success" | "error" };

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  OrderStatus,
  {
    label: string;
    color: string;
    bg: string;
    next: OrderStatus | null;
  }
> = {
  pending: {
    label: "Pending",
    color: "text-yellow-300",
    bg: "bg-yellow-500/20 border-yellow-500/30",
    next: "diproses",
  },
  diproses: {
    label: "Diproses",
    color: "text-blue-300",
    bg: "bg-blue-500/20 border-blue-500/30",
    next: "dikirim",
  },
  dikirim: {
    label: "Dikirim",
    color: "text-purple-300",
    bg: "bg-purple-500/20 border-purple-500/30",
    next: "selesai",
  },
  selesai: {
    label: "Selesai",
    color: "text-green-300",
    bg: "bg-green-500/20 border-green-500/30",
    next: null,
  },
  dibatalkan: {
    label: "Dibatalkan",
    color: "text-red-300",
    bg: "bg-red-500/20 border-red-500/30",
    next: null,
  },
};

const FILTER_TABS = [
  { key: "all", label: "Semua" },
  { key: "pending", label: "Pending" },
  { key: "diproses", label: "Diproses" },
  { key: "dikirim", label: "Dikirim" },
  { key: "selesai", label: "Selesai" },
  { key: "dibatalkan", label: "Dibatalkan" },
] as const;

const PAGE_LIMIT = 20;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRevenue(n: number) {
  if (n >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(1)}M`;
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)}Jt`;
  return `Rp ${n.toLocaleString("id-ID")}`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ToastList({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: number) => void;
}) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-3 rounded-2xl border px-5 py-4 text-sm font-bold shadow-xl backdrop-blur-xl transition-all ${
            t.type === "success"
              ? "border-green-500/30 bg-green-900/80 text-green-200"
              : "border-red-500/30 bg-red-900/80 text-red-200"
          }`}
        >
          {t.type === "success" ? (
            <CheckCircle2 size={16} className="shrink-0" />
          ) : (
            <X size={16} className="shrink-0" />
          )}
          {t.message}
          <button
            onClick={() => onDismiss(t.id)}
            className="ml-2 opacity-60 hover:opacity-100"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

function DeleteModal({
  order,
  onConfirm,
  onCancel,
  loading,
}: {
  order: Order;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-[32px] border border-white/10 bg-[#0a0c14] p-8 shadow-2xl">
        <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/20">
          <Trash2 size={24} className="text-red-400" />
        </div>
        <h2 className="mt-4 text-2xl font-black text-white">Hapus Pesanan?</h2>
        <p className="mt-2 text-white/50">
          Pesanan{" "}
          <span className="font-bold text-white">
            #{order.id} – {order.customer_name}
          </span>{" "}
          akan dihapus permanen dan tidak bisa dikembalikan.
        </p>
        <div className="mt-6 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-2xl border border-white/10 bg-white/10 py-3 font-bold text-white transition hover:bg-white/20"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-red-600 py-3 font-bold text-white transition hover:bg-red-700 disabled:opacity-60"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Trash2 size={16} />
            )}
            Hapus
          </button>
        </div>
      </div>
    </div>
  );
}

function InvoicePrint({ order }: { order: Order }) {
  return (
    <div
      style={{
        width: "794px",
        minHeight: "1123px",
        background: "#fff",
        color: "#111",
        padding: "56px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 900, margin: 0 }}>
            Markas iPhone
          </h1>
          <p style={{ color: "#666", marginTop: "4px" }}>
            Premium Apple Store
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontSize: "12px", color: "#999", margin: 0 }}>INVOICE</p>
          <p
            style={{
              fontSize: "28px",
              fontWeight: 900,
              margin: "4px 0 0",
            }}
          >
            #{order.id}
          </p>
        </div>
      </div>

      <hr style={{ margin: "32px 0", borderColor: "#eee" }} />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "32px",
        }}
      >
        <div>
          <p
            style={{
              fontSize: "11px",
              color: "#999",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            Data Customer
          </p>
          <p
            style={{ marginTop: "8px", fontWeight: 700, fontSize: "18px" }}
          >
            {order.customer_name}
          </p>
          <p style={{ color: "#555" }}>{order.phone}</p>
          <p style={{ color: "#555" }}>{order.address}</p>
        </div>
        <div>
          <p
            style={{
              fontSize: "11px",
              color: "#999",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            Detail Invoice
          </p>
          <p style={{ marginTop: "8px", color: "#555" }}>
            Tanggal: {formatDate(order.created_at)}
          </p>
          <p style={{ color: "#555" }}>
            Status:{" "}
            <span style={{ fontWeight: 700 }}>
              {STATUS_CONFIG[order.status]?.label ?? order.status}
            </span>
          </p>
          <p style={{ color: "#555" }}>Pembayaran: Transfer BCA</p>
          <p style={{ color: "#555" }}>Pembayaran: SeaBank</p>
        </div>
      </div>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginTop: "32px",
        }}
      >
        <thead>
          <tr style={{ background: "#f5f5f7" }}>
            <th
              style={{ padding: "14px 16px", textAlign: "left", fontSize: "13px" }}
            >
              Produk
            </th>
            <th
              style={{
                padding: "14px 16px",
                textAlign: "right",
                fontSize: "13px",
              }}
            >
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td
              style={{ padding: "16px", borderBottom: "1px solid #eee" }}
            >
              {order.product}
            </td>
            <td
              style={{
                padding: "16px",
                borderBottom: "1px solid #eee",
                textAlign: "right",
                fontWeight: 700,
              }}
            >
              {order.total_price}
            </td>
          </tr>
          <tr>
            <td style={{ padding: "16px", fontWeight: 700 }}>
              Total Pembayaran
            </td>
            <td
              style={{
                padding: "16px",
                textAlign: "right",
                fontWeight: 900,
                fontSize: "20px",
              }}
            >
              {order.total_price}
            </td>
          </tr>
        </tbody>
      </table>

      <p style={{ marginTop: "60px", color: "#999", fontSize: "13px" }}>
        Terima kasih sudah berbelanja di Markas iPhone. Barang garansi resmi
        Apple Indonesia.
      </p>
    </div>
  );
}

// ─── Pagination Component ─────────────────────────────────────────────────────

function Pagination({
  meta,
  onPageChange,
}: {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
}) {
  const { page, totalPages, total, limit } = meta;
  if (totalPages <= 1) return null;

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  // Build page numbers with ellipsis
  const pages: (number | "...")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("...");
    for (
      let i = Math.max(2, page - 1);
      i <= Math.min(totalPages - 1, page + 1);
      i++
    ) {
      pages.push(i);
    }
    if (page < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }

  return (
    <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
      <p className="text-sm text-white/40">
        Menampilkan{" "}
        <span className="font-bold text-white/70">
          {from}–{to}
        </span>{" "}
        dari <span className="font-bold text-white/70">{total}</span> pesanan
      </p>

      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/60 transition hover:bg-white/10 hover:text-white disabled:pointer-events-none disabled:opacity-30"
        >
          <ChevronLeft size={16} />
        </button>

        {pages.map((p, i) =>
          p === "..." ? (
            <span
              key={`ellipsis-${i}`}
              className="flex h-9 w-9 items-center justify-center text-white/30"
            >
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p as number)}
              className={`flex h-9 w-9 items-center justify-center rounded-xl border text-sm font-bold transition ${
                p === page
                  ? "border-blue-500 bg-blue-600 text-white"
                  : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
              }`}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/60 transition hover:bg-white/10 hover:text-white disabled:pointer-events-none disabled:opacity-30"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function OrdersPage() {
  const router = useRouter();
  const invoiceRef = useRef<HTMLDivElement>(null);
  const toastCounter = useRef(0);
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [orders, setOrders] = useState<Order[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: PAGE_LIMIT,
    totalPages: 1,
  });
  const [stats, setStats] = useState<Stats | null>(null);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Order | null>(null);
  const [printTarget, setPrintTarget] = useState<Order | null>(null);
  const [search, setSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState(""); // debounced
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // ── Auth check ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (localStorage.getItem("markas_admin_logged_in") !== "true") {
      router.push("/rahasia-admin-markas/login");
    }
  }, [router]);

  // ── Auto-dismiss toasts ─────────────────────────────────────────────────────
  useEffect(() => {
    if (toasts.length === 0) return;
    const timer = setTimeout(() => setToasts((t) => t.slice(1)), 4000);
    return () => clearTimeout(timer);
  }, [toasts]);

  // ── Debounce search ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => {
      setSearchQuery(search);
      setCurrentPage(1); // reset to first page on new search
    }, 350);
    return () => {
      if (searchDebounce.current) clearTimeout(searchDebounce.current);
    };
  }, [search]);

  // ── Reset page on filter change ─────────────────────────────────────────────
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus]);

  // ── Fetch orders ─────────────────────────────────────────────────────────────
  const fetchOrders = useCallback(async () => {
    setLoadingOrders(true);
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: String(PAGE_LIMIT),
      });
      if (filterStatus !== "all") params.set("status", filterStatus);
      if (searchQuery) params.set("search", searchQuery);

      const res = await fetch(`/api/orders?${params.toString()}`, {
        headers: { "x-admin-request": "true" },
      });
      const data = await res.json();

      setOrders(Array.isArray(data.data) ? data.data : []);
      if (data.meta) setMeta(data.meta);
    } catch {
      addToast("Gagal memuat pesanan", "error");
    } finally {
      setLoadingOrders(false);
    }
  }, [currentPage, filterStatus, searchQuery]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard");
      const data = await res.json();
      setStats(data);
    } catch {
      /* silent */
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // ── Toast helpers ────────────────────────────────────────────────────────────
  function addToast(message: string, type: "success" | "error") {
    const id = ++toastCounter.current;
    setToasts((prev) => [...prev, { id, message, type }]);
  }

  function dismissToast(id: number) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  // ── Update status ─────────────────────────────────────────────────────────────
  async function updateStatus(order: Order, status: OrderStatus) {
    setUpdatingId(order.id);
    try {
      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-request": "true",
        },
        body: JSON.stringify({ id: order.id, status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      addToast(`Status diubah ke "${STATUS_CONFIG[status].label}"`, "success");
      fetchOrders();
      fetchStats();
    } catch (err: unknown) {
      addToast(
        err instanceof Error ? err.message : "Gagal update status",
        "error"
      );
    } finally {
      setUpdatingId(null);
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────────
  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeletingId(deleteTarget.id);
    try {
      const res = await fetch(`/api/orders?id=${deleteTarget.id}`, {
        method: "DELETE",
        headers: { "x-admin-request": "true" },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      addToast("Pesanan dihapus", "success");
      setDeleteTarget(null);
      // If last item on page, go back one page
      if (orders.length === 1 && currentPage > 1) {
        setCurrentPage((p) => p - 1);
      } else {
        fetchOrders();
      }
      fetchStats();
    } catch (err: unknown) {
      addToast(
        err instanceof Error ? err.message : "Gagal hapus pesanan",
        "error"
      );
    } finally {
      setDeletingId(null);
    }
  }

  // ── Download invoice ──────────────────────────────────────────────────────────
  async function downloadInvoice(order: Order) {
    setPrintTarget(order);
    await new Promise((r) => setTimeout(r, 300));

    try {
      const { default: html2canvas } = await import("html2canvas");
      const { default: jsPDF } = await import("jspdf");

      if (!invoiceRef.current) return;

      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        backgroundColor: "#fff",
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const width = pdf.internal.pageSize.getWidth();
      const height = (canvas.height * width) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, width, height);
      pdf.save(`invoice-markas-iphone-${order.id}.pdf`);
      addToast("Invoice berhasil diunduh", "success");
    } catch {
      addToast("Gagal mengunduh invoice", "error");
    } finally {
      setPrintTarget(null);
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen overflow-hidden bg-black p-6 text-white">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,#2563eb44_0%,transparent_40%),radial-gradient(circle_at_bottom_right,#9333ea44_0%,transparent_40%)]" />

      <section className="relative z-10 mx-auto max-w-7xl">

        {/* ── Header ── */}
        <div className="mb-10 flex flex-wrap items-start justify-between gap-5">
          <div>
            <Link
              href="/rahasia-admin-markas/dashboard"
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-5 py-2.5 text-sm font-bold text-white/70 backdrop-blur-xl transition hover:text-white"
            >
              <ArrowLeft size={15} /> Dashboard
            </Link>
            <p className="mb-2 text-xs font-black uppercase tracking-[0.3em] text-blue-300">
              Order Manager
            </p>
            <h1 className="text-5xl font-black tracking-[-0.06em] md:text-6xl">
              Pesanan.
            </h1>
            <p className="mt-3 text-base text-white/50">
              Kelola pesanan, ubah status, dan cetak invoice.
            </p>
          </div>

          <button
            onClick={() => fetchOrders()}
            disabled={loadingOrders}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-5 py-3 font-bold text-white backdrop-blur-xl transition hover:bg-white/20 disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={loadingOrders ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>

        {/* ── Stats ── */}
        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            {
              icon: <ShoppingBag size={18} className="text-blue-300" />,
              label: "Total Pesanan",
              value: stats?.total_orders ?? "–",
              color: "border-white/10 bg-white/10",
            },
            {
              icon: <Clock size={18} className="text-yellow-300" />,
              label: "Pending",
              value: stats?.pending_orders ?? "–",
              color: "border-yellow-500/20 bg-yellow-500/10",
            },
            {
              icon: <CheckCircle2 size={18} className="text-green-300" />,
              label: "Selesai",
              value: stats?.completed_orders ?? "–",
              color: "border-green-500/20 bg-green-500/10",
            },
            {
              icon: <TrendingUp size={18} className="text-purple-300" />,
              label: "Total Omset",
              value: stats ? formatRevenue(stats.total_revenue) : "–",
              color: "border-purple-500/20 bg-purple-500/10",
            },
          ].map((s, i) => (
            <div
              key={i}
              className={`rounded-3xl border p-5 backdrop-blur-xl ${s.color}`}
            >
              {s.icon}
              <p className="mt-3 text-xs font-bold text-white/50">{s.label}</p>
              <p className="mt-1 text-2xl font-black">{s.value}</p>
            </div>
          ))}
        </div>

        {/* ── Search ── */}
        <div className="mb-6">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-5 top-1/2 -translate-y-1/2 text-white/40"
            />
            <input
              type="text"
              placeholder="Cari nama, invoice, HP, atau produk…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/5 py-4 pl-12 pr-5 font-bold text-white placeholder:text-white/30 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-lg p-1 text-white/40 transition hover:text-white"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* ── Filter tabs ── */}
        <div className="mb-6 flex flex-wrap gap-2">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilterStatus(tab.key)}
              className={`rounded-full border px-4 py-2 text-sm font-bold transition ${
                filterStatus === tab.key
                  ? "border-blue-500 bg-blue-600 text-white"
                  : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Loading ── */}
        {loadingOrders && (
          <div className="flex items-center justify-center py-20 text-white/40">
            <Loader2 size={32} className="animate-spin" />
          </div>
        )}

        {/* ── Empty state ── */}
        {!loadingOrders && orders.length === 0 && (
          <div className="rounded-[40px] border border-white/10 bg-white/5 p-14 text-center">
            <Package size={48} className="mx-auto mb-4 text-white/20" />
            <h3 className="text-2xl font-black text-white/60">
              {search || filterStatus !== "all"
                ? "Tidak ada pesanan yang cocok"
                : "Belum ada pesanan"}
            </h3>
            <p className="mt-2 text-white/30">
              {search || filterStatus !== "all"
                ? "Coba ubah kata kunci atau filter status."
                : "Pesanan dari halaman checkout akan muncul di sini."}
            </p>
          </div>
        )}

        {/* ── Order list ── */}
        {!loadingOrders && orders.length > 0 && (
          <>
            <div className="grid gap-5">
              {orders.map((order) => {
                const sc = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending;
                const busy = updatingId === order.id;

                return (
                  <div
                    key={order.id}
                    className="rounded-[32px] border border-white/10 bg-white/[0.06] p-6 backdrop-blur-xl"
                  >
                    {/* Top row */}
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-300/80">
                          Invoice #{order.id}
                        </p>
                        <h2 className="mt-1 text-2xl font-black">
                          {order.customer_name}
                        </h2>
                        <p className="mt-1 text-sm text-white/50">
                          {order.phone}
                        </p>
                        {order.customer_email && (
                          <p className="text-sm text-white/40">
                            {order.customer_email}
                          </p>
                        )}
                        <p className="mt-1 text-sm text-white/40">
                          {order.address}
                        </p>
                      </div>
                      <div className="text-right">
                        <span
                          className={`inline-block rounded-full border px-4 py-1.5 text-xs font-black ${sc.bg} ${sc.color}`}
                        >
                          {sc.label}
                        </span>
                        <p className="mt-3 text-2xl font-black">
                          {order.total_price}
                        </p>
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="my-5 h-px bg-white/10" />

                    {/* Bottom row */}
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-bold text-white/40">
                          Produk
                        </p>
                        <p className="mt-0.5 font-bold text-white">
                          {order.product}
                        </p>
                        <p className="mt-1 text-xs text-white/30">
                          {formatDate(order.created_at)}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {sc.next && (
                          <button
                            onClick={() => updateStatus(order, sc.next!)}
                            disabled={busy}
                            className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-50"
                          >
                            {busy ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <CheckCircle2 size={14} />
                            )}
                            Tandai {STATUS_CONFIG[sc.next].label}
                          </button>
                        )}

                        {order.status !== "selesai" &&
                          order.status !== "dibatalkan" && (
                            <button
                              onClick={() => updateStatus(order, "dibatalkan")}
                              disabled={busy}
                              className="rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm font-bold text-red-300 transition hover:bg-red-500/20 disabled:opacity-50"
                            >
                              Batalkan
                            </button>
                          )}

                        <button
                          onClick={() => downloadInvoice(order)}
                          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/20"
                        >
                          <Download size={14} />
                          Invoice
                        </button>

                        <button
                          onClick={() => setDeleteTarget(order)}
                          className="rounded-full border border-red-500/20 bg-transparent p-2.5 text-red-400 transition hover:bg-red-500/20"
                          title="Hapus pesanan"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── Pagination ── */}
            <Pagination meta={meta} onPageChange={setCurrentPage} />
          </>
        )}
      </section>

      {/* ── Hidden invoice template ── */}
      <div className="fixed -left-[9999px] top-0 opacity-0">
        {printTarget && (
          <div ref={invoiceRef}>
            <InvoicePrint order={printTarget} />
          </div>
        )}
      </div>

      {/* ── Delete modal ── */}
      {deleteTarget && (
        <DeleteModal
          order={deleteTarget}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deletingId === deleteTarget.id}
        />
      )}

      {/* ── Toasts ── */}
      <ToastList toasts={toasts} onDismiss={dismissToast} />
    </main>
  );
}