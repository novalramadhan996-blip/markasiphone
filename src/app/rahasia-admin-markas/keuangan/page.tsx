"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Plus,
  Download,
  Wallet,
  TrendingUp,
  TrendingDown,
  DollarSign,
  X,
  Save,
  Trash2,
} from "lucide-react";

export default function KeuanganPage() {
  const [data, setData] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    type: "income",
    title: "",
    amount: "",
  });

  const getKeuangan = async () => {
    try {
      const res = await fetch("/api/keuangan");
      const result = await res.json();
      setData(result);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    getKeuangan();
  }, []);

  const rupiah = (n: number) =>
    new Intl.NumberFormat("id-ID").format(n || 0);

  const handleSubmit = async () => {
    if (!form.title || !form.amount) {
      alert("Nama transaksi dan nominal wajib diisi");
      return;
    }

    const res = await fetch("/api/keuangan", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: form.type,
        title: form.title,
        amount: Number(form.amount),
      }),
    });

    const result = await res.json();

    if (!res.ok) {
      alert(result.message || "Gagal tambah transaksi");
      return;
    }

    setForm({
      type: "income",
      title: "",
      amount: "",
    });

    setShowModal(false);
    getKeuangan();
  };

  const handleUpdateModal = async () => {
    const value = prompt(
      "Masukkan Modal Baru",
      String(data?.totalModal || 0)
    );

    if (!value) return;

    const res = await fetch("/api/keuangan/modal", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        total_modal: Number(value),
      }),
    });

    if (!res.ok) {
      alert("Gagal update modal");
      return;
    }

    getKeuangan();
  };

  return (
    <main className="min-h-screen overflow-hidden bg-black text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,#2563eb55_0%,transparent_32%),radial-gradient(circle_at_bottom_right,#9333ea55_0%,transparent_32%)]" />

      <section className="relative z-10 mx-auto max-w-7xl px-6 py-10">
        <Link
          href="/rahasia-admin-markas/dashboard"
          className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-5 py-3 font-black text-white backdrop-blur-xl"
        >
          <ArrowLeft size={16} />
          Dashboard
        </Link>

        <div className="mb-10 flex flex-wrap items-center justify-between gap-5">
          <div>
            <p className="mb-3 text-sm font-black uppercase tracking-[0.3em] text-blue-300">
              Financial Manager
            </p>

            <h1 className="text-6xl font-black tracking-[-0.08em] md:text-7xl">
              Keuangan.
            </h1>

            <p className="mt-4 text-lg text-white/50">
              Kelola omset, modal, pengeluaran, dan keuntungan toko.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button className="rounded-full border border-white/10 bg-white/10 px-6 py-3 font-black backdrop-blur-xl">
              <Download className="mr-2 inline" size={18} />
              Export
            </button>

            <button
              onClick={() => setShowModal(true)}
              className="rounded-full bg-blue-600 px-6 py-3 font-black text-white transition hover:bg-blue-700"
            >
              <Plus className="mr-2 inline" size={18} />
              Tambah Transaksi
            </button>
          </div>
        </div>

        <div className="mb-10 grid gap-5 md:grid-cols-4">
          <div className="rounded-[32px] border border-white/10 bg-white/10 p-6 backdrop-blur-2xl">
            <Wallet className="mb-4 text-blue-300" />
            <p className="text-sm font-bold text-white/40">
              Harga Terjual (Omset)
            </p>

            <h2 className="mt-3 text-4xl font-black">
              Rp {rupiah(data?.income)}
            </h2>
          </div>

          <div className="rounded-[32px] border border-cyan-500/20 bg-cyan-500/10 p-6 backdrop-blur-2xl">
            <DollarSign className="mb-4 text-cyan-300" />
            <p className="text-sm font-bold text-cyan-300">
              Total Modal
            </p>

            <h2 className="mt-3 text-4xl font-black text-cyan-300">
              Rp {rupiah(data?.totalModal)}
            </h2>

            <button
              onClick={handleUpdateModal}
              className="mt-4 rounded-xl bg-cyan-500 px-3 py-2 text-sm font-bold text-white hover:bg-cyan-600"
            >
              Ubah Modal
            </button>
          </div>

          <div className="rounded-[32px] border border-red-500/20 bg-red-500/10 p-6 backdrop-blur-2xl">
            <TrendingDown className="mb-4 text-red-300" />
            <p className="text-sm font-bold text-red-300">
              Pengeluaran
            </p>

            <h2 className="mt-3 text-4xl font-black text-red-300">
              Rp {rupiah(data?.expense)}
            </h2>
          </div>

          <div className="rounded-[32px] border border-green-500/20 bg-green-500/10 p-6 backdrop-blur-2xl">
            <TrendingUp className="mb-4 text-green-300" />
            <p className="text-sm font-bold text-green-300">
              Keuntungan Bersih
            </p>

            <h2 className="mt-3 text-4xl font-black text-green-300">
              Rp {rupiah(data?.profit)}
            </h2>
          </div>
        </div>

        <div className="rounded-[40px] border border-white/10 bg-white/10 p-8 backdrop-blur-2xl">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-4xl font-black tracking-[-0.05em]">
              Arus Kas
            </h2>

            <span className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-black text-white/60">
              Semua Waktu
            </span>
          </div>

          <div className="space-y-4">
            {data?.transactions?.length === 0 && (
              <div className="rounded-[24px] bg-black/20 p-8 text-center text-white/40">
                Belum ada transaksi.
              </div>
            )}

            {data?.transactions?.map((trx: any) => (
              <div
                key={trx.id}
                className="flex items-center justify-between rounded-[24px] bg-black/20 p-5"
              >
                <div>
                  <p className="font-black">
                    {trx.title}
                  </p>

                  <p className="mt-1 text-sm text-white/40">
                    {new Date(trx.created_at).toLocaleDateString("id-ID")}
                  </p>
                </div>

            <div className="flex items-center gap-3">
  <span
    className={`font-black ${
      trx.type === "income"
        ? "text-green-400"
        : "text-red-400"
    }`}
  >
    {trx.type === "income" ? "+" : "-"} Rp{" "}
    {rupiah(trx.amount)}
  </span>

  <button
    onClick={async () => {
      if (!confirm("Hapus transaksi ini?")) return;

      await fetch("/api/keuangan", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: trx.id,
        }),
      });

      getKeuangan();
    }}
    className="rounded-xl bg-red-500/20 p-2 text-red-400 hover:bg-red-500/30"
  >
    <Trash2 size={18} />
  </button>
</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[36px] border border-white/10 bg-[#090b12] p-7 shadow-[0_30px_100px_rgba(0,0,0,0.55)]">
            <div className="mb-7 flex items-center justify-between">
              <div>
                <p className="mb-2 text-sm font-black uppercase tracking-[0.25em] text-blue-300">
                  Cashflow
                </p>

                <h2 className="text-4xl font-black tracking-[-0.05em]">
                  Tambah Transaksi
                </h2>
              </div>

              <button
                onClick={() => setShowModal(false)}
                className="rounded-full bg-white/10 p-3 text-white hover:bg-white/20"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <select
                value={form.type}
                onChange={(e) =>
                  setForm({
                    ...form,
                    type: e.target.value,
                  })
                }
                className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-4 font-bold text-white outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="income">Pemasukan</option>
                <option value="expense">Pengeluaran</option>
              </select>

              <input
                value={form.title}
                onChange={(e) =>
                  setForm({
                    ...form,
                    title: e.target.value,
                  })
                }
                placeholder="Nama transaksi"
                className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-4 font-bold text-white outline-none placeholder:text-white/30 focus:ring-2 focus:ring-blue-500"
              />

              <input
                type="number"
                value={form.amount}
                onChange={(e) =>
                  setForm({
                    ...form,
                    amount: e.target.value,
                  })
                }
                placeholder="Nominal, contoh: 350000"
                className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-4 font-bold text-white outline-none placeholder:text-white/30 focus:ring-2 focus:ring-blue-500"
              />

              <button
                onClick={handleSubmit}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-4 font-black text-white transition hover:bg-blue-700"
              >
                <Save size={18} />
                Simpan Transaksi
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}