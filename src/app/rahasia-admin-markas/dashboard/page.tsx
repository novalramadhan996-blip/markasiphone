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
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    const isLogin = localStorage.getItem("admin_logged_in");

    if (isLogin !== "true") {
      router.push("/rahasia-admin-markas/login");
    }
  }, [router]);

  const logout = () => {
    localStorage.removeItem("admin_logged_in");
    router.push("/rahasia-admin-markas/login");
  };

  return (
    <main className="min-h-screen overflow-hidden bg-black text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,#2563eb55_0%,transparent_32%),radial-gradient(circle_at_bottom_right,#9333ea55_0%,transparent_32%)]" />

      <section className="relative z-10 mx-auto max-w-7xl px-6 py-10">
        <div className="mb-10 flex flex-wrap items-center justify-between gap-5">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-black text-blue-300 backdrop-blur-xl">
              <Sparkles size={16} />
              Private CMS
            </div>

            <h1 className="text-6xl font-black tracking-[-0.07em] md:text-7xl">
              Dashboard CMS.
            </h1>

            <p className="mt-4 max-w-xl text-lg text-white/50">
              Kelola produk, banner, pesanan, dan database Markas iPhone dari satu tempat.
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

        <div className="mb-8 grid gap-5 md:grid-cols-4">
          <div className="rounded-[32px] border border-white/10 bg-white/10 p-6 backdrop-blur-2xl">
            <Package className="mb-4 text-blue-300" />
            <p className="text-sm font-bold text-white/40">Produk</p>
            <h2 className="text-4xl font-black">Ready</h2>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-white/10 p-6 backdrop-blur-2xl">
            <ShoppingBag className="mb-4 text-blue-300" />
            <p className="text-sm font-bold text-white/40">Pesanan</p>
            <h2 className="text-4xl font-black">Ready</h2>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-white/10 p-6 backdrop-blur-2xl">
            <Database className="mb-4 text-blue-300" />
            <p className="text-sm font-bold text-white/40">Database</p>
            <h2 className="text-4xl font-black">MySQL</h2>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-white/10 p-6 backdrop-blur-2xl">
            <ShieldCheck className="mb-4 text-blue-300" />
            <p className="text-sm font-bold text-white/40">Security</p>
            <h2 className="text-4xl font-black">Hidden</h2>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Link
            href="/rahasia-admin-markas/produk"
            className="group rounded-[40px] border border-white/10 bg-white/10 p-8 shadow-[0_30px_100px_rgba(0,0,0,0.35)] backdrop-blur-2xl transition hover:-translate-y-2 hover:bg-white/15"
          >
            <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-500/20 text-blue-300">
              <Package size={34} />
            </div>

            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-4xl font-black tracking-[-0.05em]">
                Produk
              </h2>

              <ArrowUpRight className="transition group-hover:translate-x-1 group-hover:-translate-y-1" />
            </div>

            <p className="text-lg leading-8 text-white/50">
              Tambah, edit, dan hapus produk. Data produk terhubung ke database MySQL.
            </p>
          </Link>

          <div className="rounded-[40px] border border-white/10 bg-white/10 p-8 shadow-[0_30px_100px_rgba(0,0,0,0.35)] backdrop-blur-2xl opacity-70">
            <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-3xl bg-purple-500/20 text-purple-300">
              <ImageIcon size={34} />
            </div>

            <h2 className="mb-5 text-4xl font-black tracking-[-0.05em]">
              Banner
            </h2>

            <p className="text-lg leading-8 text-white/50">
              Coming soon. Nanti bisa atur hero banner, promo, dan gambar homepage.
            </p>
          </div>

          <Link
            href="/rahasia-admin-markas/orders"
            className="group rounded-[40px] border border-white/10 bg-white/10 p-8 shadow-[0_30px_100px_rgba(0,0,0,0.35)] backdrop-blur-2xl transition hover:-translate-y-2 hover:bg-white/15"
          >
            <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-3xl bg-cyan-500/20 text-cyan-300">
              <ShoppingBag size={34} />
            </div>

            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-4xl font-black tracking-[-0.05em]">
                Pesanan
              </h2>

              <ArrowUpRight className="transition group-hover:translate-x-1 group-hover:-translate-y-1" />
            </div>

            <p className="text-lg leading-8 text-white/50">
              Lihat pesanan masuk dan cetak nota transaksi customer.
            </p>
          </Link>
        </div>
      </section>
    </main>
  );
}