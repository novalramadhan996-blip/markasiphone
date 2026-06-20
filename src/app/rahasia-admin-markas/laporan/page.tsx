"use client";

import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Download,
  Loader2,
  Receipt,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type OrderStatus = "pending" | "diproses" | "dikirim" | "selesai" | "dibatalkan";

type OrderReport = {
  id: number;
  customer_name: string;
  product: string;
  total_price: string;
  status: OrderStatus;
  created_at: string;
};

type KeuanganSummary = {
  income: number;
  expense: number;
  profit: number;
  totalModal: number;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bg: string }> = {
  pending:    { label: "Pending",    color: "text-yellow-300", bg: "bg-yellow-500/15" },
  diproses:   { label: "Diproses",   color: "text-blue-300",   bg: "bg-blue-500/15" },
  dikirim:    { label: "Dikirim",    color: "text-purple-300", bg: "bg-purple-500/15" },
  selesai:    { label: "Selesai",    color: "text-green-300",  bg: "bg-green-500/15" },
  dibatalkan: { label: "Dibatalkan", color: "text-red-300",    bg: "bg-red-500/15" },
};

const STATUS_FILTERS = [
  { key: "all",       label: "Semua" },
  { key: "selesai",   label: "Selesai" },
  { key: "pending",   label: "Pending" },
  { key: "diproses",  label: "Diproses" },
  { key: "dikirim",   label: "Dikirim" },
] as const;

const PAGE_SIZE = 10;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parsePrice(price: string): number {
  return Number(String(price).replace(/[^\d]/g, "") || 0);
}

function rupiah(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("id-ID", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function exportToCSV(reports: OrderReport[]) {
  const header = "Invoice,Customer,Produk,Total,Status,Tanggal";
  const rows = reports.map((r) =>
    `#${r.id},"${r.customer_name}","${r.product}",${r.total_price},${STATUS_CONFIG[r.status]?.label ?? r.status},${formatDate(r.created_at)}`
  );
  const csv  = [header, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `laporan-pesanan-markas-iphone-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function LaporanPage() {
  const router = useRouter();

  const [reports, setReports]           = useState<OrderReport[]>([]);
  const [keuangan, setKeuangan]         = useState<KeuanganSummary | null>(null);
  const [loading, setLoading]           = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // ── Auth check ──
  useEffect(() => {
    if (localStorage.getItem("admin_logged_in") !== "true") {
      router.push("/rahasia-admin-markas/login");
      return;
    }
    fetchAll();
  }, [router]);

  async function fetchAll() {
    setLoading(true);
    await Promise.all([fetchReports(), fetchKeuangan()]);
    setLoading(false);
  }

  async function fetchReports() {
    try {
      const res  = await fetch("/api/reports");
      const data = await res.json();
      setReports(Array.isArray(data) ? data : []);
    } catch {
      setReports([]);
    }
  }

  async function fetchKeuangan() {
    try {
      const res  = await fetch("/api/keuangan");
      const data = await res.json();
      setKeuangan(data);
    } catch {
      setKeuangan(null);
    }
  }

  // ── Derived data ──
  const completedOrders = reports.filter((r) => r.status === "selesai");
  const pendingOrders    = reports.filter((r) => r.status === "pending");
  const totalOmsetOrders = completedOrders.reduce((sum, r) => sum + parsePrice(r.total_price), 0);

  const filteredReports = statusFilter === "all"
    ? reports
    : reports.filter((r) => r.status === statusFilter);

  const visibleReports = filteredReports.slice(0, visibleCount);
  const hasMore        = filteredReports.length > visibleCount;

  // Profit yang AKURAT diambil dari modul Keuangan (omset - modal - pengeluaran)
  // bukan disamakan dengan omset seperti versi sebelumnya
  const profitBersih = keuangan?.profit ?? null;

  return (
    <main className="min-h-screen overflow-hidden bg-black p-6 text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,#2563eb44_0%,transparent_40%),radial-gradient(circle_at_bottom_right,#9333ea44_0%,transparent_40%)]" />

      <section className="relative z-10 mx-auto max-w-7xl">

        {/* ── Header ── */}
        <Link
          href="/rahasia-admin-markas/dashboard"
          className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-5 py-2.5 text-sm font-bold text-white/70 backdrop-blur-xl transition hover:text-white"
        >
          <ArrowLeft size={15} /> Dashboard
        </Link>

        <div className="mb-10 flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="mb-2 text-xs font-black uppercase tracking-[0.3em] text-blue-300">Financial Report</p>
            <h1 className="text-5xl font-black tracking-[-0.06em] md:text-6xl">Laporan.</h1>
            <p className="mt-3 text-base text-white/50">Rekap omset, pesanan, dan transaksi toko.</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={fetchAll}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-5 py-3 font-bold text-white backdrop-blur-xl transition hover:bg-white/20 disabled:opacity-50"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
            <button
              onClick={() => exportToCSV(reports)}
              disabled={reports.length === 0}
              className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-3 font-bold text-white transition hover:bg-blue-700 disabled:opacity-40"
            >
              <Download size={16} />
              Export CSV
            </button>
          </div>
        </div>

        {/* ── Summary cards ── */}
        <div className="mb-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-[28px] border border-white/10 bg-white/10 p-6 backdrop-blur-2xl">
            <Wallet size={20} className="mb-4 text-blue-300" />
            <p className="text-xs font-bold text-white/45">Omset (Pesanan Selesai)</p>
            {loading
              ? <div className="mt-2 h-8 w-32 animate-pulse rounded-lg bg-white/10" />
              : <h2 className="mt-1 text-2xl font-black">{rupiah(totalOmsetOrders)}</h2>}
          </div>

          <div className="rounded-[28px] border border-green-500/20 bg-green-500/10 p-6">
            <CheckCircle2 size={20} className="mb-4 text-green-300" />
            <p className="text-xs font-bold text-green-300/80">Transaksi Selesai</p>
            {loading
              ? <div className="mt-2 h-8 w-16 animate-pulse rounded-lg bg-white/10" />
              : <h2 className="mt-1 text-2xl font-black">{completedOrders.length}</h2>}
          </div>

          <div className="rounded-[28px] border border-yellow-500/20 bg-yellow-500/10 p-6">
            <Clock size={20} className="mb-4 text-yellow-300" />
            <p className="text-xs font-bold text-yellow-300/80">Pending</p>
            {loading
              ? <div className="mt-2 h-8 w-16 animate-pulse rounded-lg bg-white/10" />
              : <h2 className="mt-1 text-2xl font-black">{pendingOrders.length}</h2>}
          </div>

          <div className="rounded-[28px] border border-purple-500/20 bg-purple-500/10 p-6">
            <TrendingUp size={20} className="mb-4 text-purple-300" />
            <p className="text-xs font-bold text-purple-300/80">Profit Bersih</p>
            {loading ? (
              <div className="mt-2 h-8 w-32 animate-pulse rounded-lg bg-white/10" />
            ) : profitBersih === null ? (
              <p className="mt-1 text-sm text-white/30">Data keuangan belum tersedia</p>
            ) : (
              <h2 className={`mt-1 text-2xl font-black ${profitBersih < 0 ? "text-red-300" : ""}`}>
                {rupiah(profitBersih)}
              </h2>
            )}
          </div>
        </div>

        {/* Penjelasan profit — supaya tidak disalahartikan sebagai omset */}
        {!loading && keuangan && (
          <div className="mb-8 flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-white/50">
            <TrendingDown size={14} className="text-white/30" />
            Profit bersih dihitung dari modul Keuangan: omset dikurangi modal ({rupiah(keuangan.totalModal)}) dan pengeluaran ({rupiah(keuangan.expense)}).
            <Link href="/rahasia-admin-markas/keuangan" className="font-bold text-blue-300 hover:underline">
              Lihat detail →
            </Link>
          </div>
        )}

        {/* ── Status filter ── */}
        <div className="mb-6 flex flex-wrap gap-2">
          {STATUS_FILTERS.map((f) => {
            const count = f.key === "all" ? reports.length : reports.filter((r) => r.status === f.key).length;
            return (
              <button
                key={f.key}
                onClick={() => { setStatusFilter(f.key); setVisibleCount(PAGE_SIZE); }}
                className={`rounded-full border px-4 py-2 text-sm font-bold transition ${
                  statusFilter === f.key
                    ? "border-blue-500 bg-blue-600 text-white"
                    : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                }`}
              >
                {f.label}
                <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-black ${
                  statusFilter === f.key ? "bg-white/20" : "bg-white/10"
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Transaction list ── */}
        <div className="rounded-[40px] border border-white/10 bg-white/[0.06] p-7 backdrop-blur-2xl">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-black tracking-tight">Riwayat Transaksi</h2>
            <span className="text-sm text-white/40">{filteredReports.length} pesanan</span>
          </div>

          {/* Loading */}
          {loading && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-20 animate-pulse rounded-[24px] bg-white/5" />)}
            </div>
          )}

          {/* Empty */}
          {!loading && filteredReports.length === 0 && (
            <div className="rounded-2xl bg-white/5 p-12 text-center">
              <Receipt size={40} className="mx-auto mb-3 text-white/20" />
              <p className="font-bold text-white/40">
                {statusFilter === "all" ? "Belum ada transaksi" : "Tidak ada transaksi dengan status ini"}
              </p>
            </div>
          )}

          {/* List */}
          {!loading && visibleReports.length > 0 && (
            <div className="space-y-3">
              {visibleReports.map((item) => {
                const sc = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.pending;
                return (
                  <div
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-4 rounded-[24px] border border-white/5 bg-black/20 p-5"
                  >
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-300/80">
                        Invoice #{item.id}
                      </p>
                      <h3 className="mt-1 text-xl font-black">{item.customer_name}</h3>
                      <p className="mt-0.5 text-sm text-white/45">{item.product}</p>
                      <p className="mt-1 text-xs text-white/30">{formatDate(item.created_at)}</p>
                    </div>

                    <div className="text-right">
                      <span className={`inline-block rounded-full px-3 py-1 text-xs font-black ${sc.bg} ${sc.color}`}>
                        {sc.label}
                      </span>
                      <p className="mt-2 text-xl font-black">{item.total_price}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Load more */}
          {!loading && hasMore && (
            <button
              onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 py-3.5 font-bold text-white/70 transition hover:bg-white/10"
            >
              Tampilkan {Math.min(PAGE_SIZE, filteredReports.length - visibleCount)} lagi
            </button>
          )}
        </div>
      </section>
    </main>
  );
}