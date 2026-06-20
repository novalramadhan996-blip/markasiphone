"use client";

import {
  ArrowUpRight,
  Database,
  Globe,
  ImageIcon,
  LogOut,
  Package,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  FileText,
  Wallet,
  TrendingUp,
  Clock,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface DashboardStats {
  total_orders: number;
  pending_orders: number;
  completed_orders: number;
  total_revenue: number;
}

function formatRupiah(angka: number) {
  if (angka >= 1_000_000_000) {
    return `Rp ${(angka / 1_000_000_000).toFixed(1)}M`;
  }
  if (angka >= 1_000_000) {
    return `Rp ${(angka / 1_000_000).toFixed(1)}Jt`;
  }
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(angka);
}

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    const isLogin = localStorage.getItem("admin_logged_in");
    if (isLogin !== "true") {
      router.push("/rahasia-admin-markas/login");
      return;
    }
    fetchStats();
  }, [router]);

  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      const res = await fetch("/api/dashboard");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Gagal fetch stats:", err);
    } finally {
      setLoadingStats(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("admin_logged_in");
    router.push("/rahasia-admin-markas/login");
  };

  const statCards = [
    {
      icon: <ShoppingBag className="text-blue-300" />,
      label: "Total Pesanan",
      value: loadingStats ? null : stats?.total_orders ?? 0,
      suffix: "order",
    },
    {
      icon: <Clock className="text-yellow-300" />,
      label: "Pending",
      value: loadingStats ? null : stats?.pending_orders ?? 0,
      suffix: "order",
    },
    {
      icon: <CheckCircle2 className="text-green-300" />,
      label: "Selesai",
      value: loadingStats ? null : stats?.completed_orders ?? 0,
      suffix: "order",
    },
    {
      icon: <TrendingUp className="text-purple-300" />,
      label: "Total Omset",
      value: loadingStats
        ? null
        : stats
        ? formatRupiah(stats.total_revenue)
        : "Rp 0",
      isRupiah: true,
    },
  ];

  return (
    <main className="min-h-screen overflow-hidden bg-black text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,#2563eb55_0%,transparent_32%),radial-gradient(circle_at_bottom_right,#9333ea55_0%,transparent_32%)]" />

      <section className="relative z-10 mx-auto max-w-7xl px-6 py-10">
        {/* Header */}
        <div className="mb-10 flex flex-wrap items-center justify-between gap-5">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-black text-blue-300 backdrop-blur-xl">
              <Sparkles size={16} />
              Private CMS
            </div>
            <h1 className="text-5xl font-black tracking-[-0.07em] md:text-6xl">
              Dashboard CMS.
            </h1>
            <p className="mt-4 max-w-xl text-lg text-white/50">
              Kelola produk, pesanan, keuangan, dan laporan Markas iPhone.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-6 py-3 font-black text-white backdrop-blur-xl transition hover:bg-white/20"
            >
              <Globe size={18} />
              Lihat Website
            </Link>
            <button
              onClick={logout}
              className="inline-flex items-center gap-2 rounded-full bg-red-500 px-6 py-3 font-black text-white transition hover:bg-red-600"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>

        {/* Stats Cards — data real dari API */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((card, i) => (
            <div
              key={i}
              className="rounded-[28px] border border-white/10 bg-white/10 p-6 backdrop-blur-2xl"
            >
              <div className="mb-3">{card.icon}</div>
              <p className="text-sm font-bold text-white/40">{card.label}</p>
              {loadingStats ? (
                <div className="mt-2 flex items-center gap-2 text-white/40">
                  <Loader2 size={16} className="animate-spin" />
                  <span className="text-sm">Loading...</span>
                </div>
              ) : (
                <h2
                  className={`mt-1 font-black ${
                    card.isRupiah ? "text-2xl" : "text-4xl"
                  }`}
                >
                  {card.value}
                  {!card.isRupiah && (
                    <span className="ml-1 text-base font-normal text-white/40">
                      {card.suffix}
                    </span>
                  )}
                </h2>
              )}
            </div>
          ))}
        </div>

        {/* Info baris bawah */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-[20px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
            <Database size={18} className="mb-2 text-blue-300" />
            <p className="text-sm font-bold text-white/40">Database</p>
            <p className="font-bold text-white">MySQL • markas_iphone</p>
          </div>
          <div className="rounded-[20px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
            <ShieldCheck size={18} className="mb-2 text-green-300" />
            <p className="text-sm font-bold text-white/40">Security</p>
            <p className="font-bold text-white">URL tersembunyi • Login wajib</p>
          </div>
          <div className="rounded-[20px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
            <TrendingUp size={18} className="mb-2 text-purple-300" />
            <p className="text-sm font-bold text-white/40">Status</p>
            <p className="font-bold text-green-400">● Sistem aktif</p>
          </div>
        </div>

        {/* Menu Cards */}
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {/* Produk */}
          <Link
            href="/rahasia-admin-markas/produk"
            className="group rounded-[40px] border border-white/10 bg-white/10 p-8 shadow-[0_30px_100px_rgba(0,0,0,0.35)] backdrop-blur-2xl transition hover:-translate-y-2 hover:bg-white/15"
          >
            <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-500/20 text-blue-300">
              <Package size={34} />
            </div>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-4xl font-black tracking-[-0.05em]">Produk</h2>
              <ArrowUpRight className="transition group-hover:translate-x-1 group-hover:-translate-y-1" />
            </div>
            <p className="text-lg leading-8 text-white/50">
              Tambah, edit, dan hapus produk. Kelola stok dan foto produk.
            </p>
          </Link>

          {/* Pesanan */}
          <Link
            href="/rahasia-admin-markas/orders"
            className="group rounded-[40px] border border-white/10 bg-white/10 p-8 shadow-[0_30px_100px_rgba(0,0,0,0.35)] backdrop-blur-2xl transition hover:-translate-y-2 hover:bg-white/15"
          >
            <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-3xl bg-cyan-500/20 text-cyan-300">
              <ShoppingBag size={34} />
            </div>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-4xl font-black tracking-[-0.05em]">Pesanan</h2>
              <ArrowUpRight className="transition group-hover:translate-x-1 group-hover:-translate-y-1" />
            </div>
            <p className="text-lg leading-8 text-white/50">
              Lihat pesanan masuk, update status, dan kirim notifikasi ke customer.
            </p>
          </Link>

          {/* Keuangan */}
          <Link
            href="/rahasia-admin-markas/keuangan"
            className="group rounded-[40px] border border-white/10 bg-white/10 p-8 shadow-[0_30px_100px_rgba(0,0,0,0.35)] backdrop-blur-2xl transition hover:-translate-y-2 hover:bg-white/15"
          >
            <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-500/20 text-emerald-300">
              <Wallet size={34} />
            </div>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-4xl font-black tracking-[-0.05em]">Keuangan</h2>
              <ArrowUpRight className="transition group-hover:translate-x-1 group-hover:-translate-y-1" />
            </div>
            <p className="text-lg leading-8 text-white/50">
              Kelola modal awal, catat pengeluaran, dan pantau arus kas toko.
            </p>
          </Link>

          {/* Laporan */}
          <Link
            href="/rahasia-admin-markas/laporan"
            className="group rounded-[40px] border border-white/10 bg-white/10 p-8 shadow-[0_30px_100px_rgba(0,0,0,0.35)] backdrop-blur-2xl transition hover:-translate-y-2 hover:bg-white/15"
          >
            <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-500/20 text-emerald-300">
              <FileText size={34} />
            </div>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-4xl font-black tracking-[-0.05em]">Laporan</h2>
              <ArrowUpRight className="transition group-hover:translate-x-1 group-hover:-translate-y-1" />
            </div>
            <p className="text-lg leading-8 text-white/50">
              Rekap omset, transaksi, dan export laporan ke Excel.
            </p>
          </Link>

          {/* Banner — coming soon */}
          <div className="rounded-[40px] border border-white/10 bg-white/5 p-8 opacity-60">
            <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-3xl bg-purple-500/20 text-purple-300">
              <ImageIcon size={34} />
            </div>
            <h2 className="mb-5 text-4xl font-black tracking-[-0.05em]">Banner</h2>
            <p className="text-lg leading-8 text-white/40">
              Coming soon — atur hero banner, promo, dan gambar homepage.
            </p>
            <span className="mt-4 inline-block rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-bold text-white/50">
              Segera Hadir
            </span>
          </div>

          {/* Lihat Toko */}
          <Link
            href="/"
            className="group rounded-[40px] border border-dashed border-white/20 p-8 transition hover:border-white/40 hover:bg-white/5"
          >
            <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-3xl bg-white/10 text-white/60">
              <Globe size={34} />
            </div>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-4xl font-black tracking-[-0.05em] text-white/60">
                Toko
              </h2>
              <ArrowUpRight className="text-white/40 transition group-hover:translate-x-1 group-hover:-translate-y-1" />
            </div>
            <p className="text-lg leading-8 text-white/30">
              Lihat tampilan toko dari sisi customer.
            </p>
          </Link>
        </div>
      </section>
    </main>
  );
}