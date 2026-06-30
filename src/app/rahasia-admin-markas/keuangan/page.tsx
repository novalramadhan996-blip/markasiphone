"use client";

import {
  ArrowLeft,
  CheckCircle2,
  DollarSign,
  Download,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  TrendingDown,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type TransactionType = "income" | "expense";

type Transaction = {
  id: number;
  type: TransactionType;
  title: string;
  amount: number;
  created_at: string;
};

type KeuanganData = {
  income: number;
  expense: number;
  profit: number;
  totalModal: number;
  transactions: Transaction[];
};

type ModalForm = { type: TransactionType; title: string; amount: string };
type ModalFormField = keyof ModalForm;
type Toast = { id: number; message: string; type: "success" | "error" };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function rupiah(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n || 0);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

function exportToCSV(transactions: Transaction[]) {
  const header = "ID,Tipe,Keterangan,Nominal,Tanggal";
  const rows = transactions.map((t) =>
    `${t.id},${t.type === "income" ? "Pemasukan" : "Pengeluaran"},${t.title},${t.amount},${formatDate(t.created_at)}`
  );
  const csv  = [header, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `laporan-keuangan-markas-iphone-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ToastList({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-3 rounded-2xl border px-5 py-4 text-sm font-bold shadow-xl backdrop-blur-xl ${
            t.type === "success"
              ? "border-green-500/30 bg-green-900/80 text-green-200"
              : "border-red-500/30 bg-red-900/80 text-red-200"
          }`}
        >
          {t.type === "success" ? <CheckCircle2 size={16} className="shrink-0" /> : <X size={16} className="shrink-0" />}
          {t.message}
          <button onClick={() => onDismiss(t.id)} className="ml-2 opacity-60 hover:opacity-100">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

function DeleteTransactionModal({
  trx, onConfirm, onCancel, loading,
}: {
  trx: Transaction; onConfirm: () => void; onCancel: () => void; loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-[32px] border border-white/10 bg-[#0a0c14] p-8 shadow-2xl">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/20">
          <Trash2 size={24} className="text-red-400" />
        </div>
        <h2 className="text-2xl font-black text-white">Hapus Transaksi?</h2>
        <p className="mt-2 text-white/50">
          <span className="font-bold text-white">{trx.title}</span> senilai{" "}
          <span className={`font-bold ${trx.type === "income" ? "text-green-400" : "text-red-400"}`}>
            {rupiah(trx.amount)}
          </span>{" "}
          akan dihapus permanen.
        </p>
        <div className="mt-6 flex gap-3">
          <button onClick={onCancel} className="flex-1 rounded-2xl border border-white/10 bg-white/10 py-3 font-bold text-white transition hover:bg-white/20">
            Batal
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-red-600 py-3 font-bold text-white transition hover:bg-red-700 disabled:opacity-60"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
            Hapus
          </button>
        </div>
      </div>
    </div>
  );
}

function UpdateModalForm({
  current, onSave, onCancel, loading,
}: {
  current: number; onSave: (val: number) => void; onCancel: () => void; loading: boolean;
}) {
  const [value, setValue] = useState(String(current));
  const isValid = Number(value) >= 0 && value !== "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-[32px] border border-white/10 bg-[#0a0c14] p-8 shadow-2xl">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/20">
          <DollarSign size={24} className="text-cyan-400" />
        </div>
        <h2 className="text-2xl font-black text-white">Update Modal</h2>
        <p className="mt-1 text-sm text-white/40">Modal awal toko sebelum pengeluaran dan pemasukan.</p>
        <div className="mt-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-bold text-white/50">Nominal Modal (Rp)</label>
            <input
              type="number"
              min={0}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Contoh: 5000000"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-4 font-bold text-white placeholder:text-white/25 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/25"
            />
            {value !== "" && (
              <p className="mt-1.5 text-sm font-bold text-cyan-400">{rupiah(Number(value))}</p>
            )}
          </div>
          <div className="flex gap-3">
            <button onClick={onCancel} className="flex-1 rounded-2xl border border-white/10 bg-white/10 py-3 font-bold text-white transition hover:bg-white/20">
              Batal
            </button>
            <button
              onClick={() => onSave(Number(value))}
              disabled={!isValid || loading}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-cyan-600 py-3 font-bold text-white transition hover:bg-cyan-700 disabled:opacity-60"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Simpan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AddTransactionModal({
  onSave, onClose, loading,
}: {
  onSave: (form: ModalForm) => void; onClose: () => void; loading: boolean;
}) {
  const EMPTY: ModalForm = { type: "income", title: "", amount: "" };
  const [form, setForm] = useState<ModalForm>(EMPTY);

  function setField<K extends ModalFormField>(key: K, value: ModalForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const isValid = form.title.trim() !== "" && Number(form.amount) > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[36px] border border-white/10 bg-[#0a0c14] p-8 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-300">Cashflow</p>
            <h2 className="mt-1 text-3xl font-black tracking-tight text-white">Tambah Transaksi</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full border border-white/10 bg-white/10 p-2.5 text-white transition hover:bg-white/20"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Tipe */}
          <div>
            <label className="mb-1.5 block text-xs font-bold text-white/50">Tipe Transaksi</label>
            <div className="grid grid-cols-2 gap-2">
              {(["income", "expense"] as TransactionType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setField("type", t)}
                  className={`rounded-2xl border py-3 text-sm font-bold transition ${
                    form.type === t
                      ? t === "income"
                        ? "border-green-500/50 bg-green-500/20 text-green-300"
                        : "border-red-500/50 bg-red-500/20 text-red-300"
                      : "border-white/10 bg-white/5 text-white/50 hover:bg-white/10"
                  }`}
                >
                  {t === "income" ? "📈 Pemasukan" : "📉 Pengeluaran"}
                </button>
              ))}
            </div>
          </div>

          {/* Keterangan */}
          <div>
            <label className="mb-1.5 block text-xs font-bold text-white/50">Keterangan *</label>
            <input
              value={form.title}
              onChange={(e) => setField("title", e.target.value)}
              placeholder="Contoh: Penjualan iPhone 15 Pro"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 text-sm font-bold text-white placeholder:text-white/25 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25"
            />
          </div>

          {/* Nominal */}
          <div>
            <label className="mb-1.5 block text-xs font-bold text-white/50">Nominal (Rp) *</label>
            <input
              type="number"
              min={0}
              value={form.amount}
              onChange={(e) => setField("amount", e.target.value)}
              placeholder="Contoh: 18999000"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 text-sm font-bold text-white placeholder:text-white/25 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25"
            />
            {form.amount && Number(form.amount) > 0 && (
              <p className={`mt-1.5 text-sm font-bold ${form.type === "income" ? "text-green-400" : "text-red-400"}`}>
                {form.type === "income" ? "+" : "−"} {rupiah(Number(form.amount))}
              </p>
            )}
          </div>

          <button
            onClick={() => onSave(form)}
            disabled={!isValid || loading}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-4 font-black text-white transition hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Simpan Transaksi
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function KeuanganPage() {
  const router = useRouter();

  const [data, setData]                       = useState<KeuanganData | null>(null);
  const [loading, setLoading]                 = useState(true);
  const [showAddModal, setShowAddModal]       = useState(false);
  const [showModalForm, setShowModalForm]     = useState(false);
  const [savingTrx, setSavingTrx]             = useState(false);
  const [savingModal, setSavingModal]         = useState(false);
  const [deleteTarget, setDeleteTarget]       = useState<Transaction | null>(null);
  const [deletingId, setDeletingId]           = useState<number | null>(null);
  const [toasts, setToasts]                   = useState<Toast[]>([]);
  const toastCounter                          = useRef(0);

  // ── Auth check ──
  useEffect(() => {
    if (localStorage.getItem("markas_admin_logged_in") !== "true") {
      router.push("/rahasia-admin-markas/login");
      return;
    }
    fetchKeuangan();
  }, [router]);

  // ── Auto-dismiss toasts ──
  useEffect(() => {
    if (toasts.length === 0) return;
    const t = setTimeout(() => setToasts((prev) => prev.slice(1)), 4000);
    return () => clearTimeout(t);
  }, [toasts]);

  function addToast(message: string, type: "success" | "error") {
    const id = ++toastCounter.current;
    setToasts((prev) => [...prev, { id, message, type }]);
  }

  function dismissToast(id: number) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  // ── Fetch ──
  async function fetchKeuangan() {
    try {
      setLoading(true);
      const res  = await fetch("/api/keuangan");
      const json = await res.json();
      setData(json);
    } catch {
      addToast("Gagal memuat data keuangan", "error");
    } finally {
      setLoading(false);
    }
  }

  // ── Add transaction ──
  async function handleAddTransaction(form: ModalForm) {
    setSavingTrx(true);
    try {
      const res = await fetch("/api/keuangan", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ type: form.type, title: form.title.trim(), amount: Number(form.amount) }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? "Gagal menyimpan");
      addToast("Transaksi berhasil ditambahkan", "success");
      setShowAddModal(false);
      fetchKeuangan();
    } catch (err: any) {
      addToast(err.message ?? "Terjadi kesalahan", "error");
    } finally {
      setSavingTrx(false);
    }
  }

  // ── Update modal ──
  async function handleUpdateModal(value: number) {
    setSavingModal(true);
    try {
      const res = await fetch("/api/keuangan/modal", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ total_modal: value }),
      });
      if (!res.ok) throw new Error("Gagal update modal");
      addToast("Modal berhasil diupdate", "success");
      setShowModalForm(false);
      fetchKeuangan();
    } catch (err: any) {
      addToast(err.message ?? "Terjadi kesalahan", "error");
    } finally {
      setSavingModal(false);
    }
  }

  // ── Delete transaction ──
  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeletingId(deleteTarget.id);
    try {
      const res = await fetch("/api/keuangan", {
        method:  "DELETE",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ id: deleteTarget.id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? "Gagal hapus");
      addToast("Transaksi dihapus", "success");
      setDeleteTarget(null);
      fetchKeuangan();
    } catch (err: any) {
      addToast(err.message ?? "Terjadi kesalahan", "error");
    } finally {
      setDeletingId(null);
    }
  }

  // ── Summary cards ──
  const summaryCards = [
    {
      icon: <Wallet size={20} className="text-blue-300" />,
      label: "Omset (Pemasukan)",
      value: data ? rupiah(data.income) : "–",
      color: "border-white/10 bg-white/10",
    },
    {
      icon: <DollarSign size={20} className="text-cyan-300" />,
      label: "Modal",
      value: data ? rupiah(data.totalModal) : "–",
      color: "border-cyan-500/20 bg-cyan-500/10",
      action: { label: "Ubah", onClick: () => setShowModalForm(true) },
    },
    {
      icon: <TrendingDown size={20} className="text-red-300" />,
      label: "Pengeluaran",
      value: data ? rupiah(data.expense) : "–",
      color: "border-red-500/20 bg-red-500/10",
    },
    {
      icon: <TrendingUp size={20} className="text-green-300" />,
      label: "Keuntungan Bersih",
      value: data ? rupiah(data.profit) : "–",
      color: "border-green-500/20 bg-green-500/10",
    },
  ];

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen overflow-hidden bg-black text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,#2563eb44_0%,transparent_40%),radial-gradient(circle_at_bottom_right,#9333ea44_0%,transparent_40%)]" />

      <section className="relative z-10 mx-auto max-w-7xl px-6 py-10">

        {/* ── Header ── */}
        <Link
          href="/rahasia-admin-markas/dashboard"
          className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-5 py-2.5 text-sm font-bold text-white/70 backdrop-blur-xl transition hover:text-white"
        >
          <ArrowLeft size={15} /> Dashboard
        </Link>

        <div className="mb-10 flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="mb-2 text-xs font-black uppercase tracking-[0.3em] text-blue-300">Financial Manager</p>
            <h1 className="text-5xl font-black tracking-[-0.06em] md:text-6xl">Keuangan.</h1>
            <p className="mt-3 text-base text-white/50">Pantau omset, modal, pengeluaran, dan keuntungan toko.</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={fetchKeuangan}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-5 py-3 font-bold text-white backdrop-blur-xl transition hover:bg-white/20 disabled:opacity-50"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>

            <button
              onClick={() => data?.transactions && exportToCSV(data.transactions)}
              disabled={!data?.transactions?.length}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-5 py-3 font-bold text-white backdrop-blur-xl transition hover:bg-white/20 disabled:opacity-40"
            >
              <Download size={16} />
              Export CSV
            </button>

            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-3 font-bold text-white transition hover:bg-blue-700"
            >
              <Plus size={16} />
              Tambah Transaksi
            </button>
          </div>
        </div>

        {/* ── Summary cards ── */}
        <div className="mb-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {summaryCards.map((card, i) => (
            <div key={i} className={`rounded-[32px] border p-6 backdrop-blur-2xl ${card.color}`}>
              {card.icon}
              <p className="mt-3 text-xs font-bold text-white/50">{card.label}</p>
              {loading
                ? <div className="mt-2 h-8 w-24 animate-pulse rounded-lg bg-white/10" />
                : <h2 className="mt-1 text-2xl font-black">{card.value}</h2>
              }
              {card.action && (
                <button
                  onClick={card.action.onClick}
                  className="mt-3 rounded-xl bg-cyan-500/80 px-4 py-1.5 text-xs font-bold text-white transition hover:bg-cyan-500"
                >
                  {card.action.label}
                </button>
              )}
            </div>
          ))}
        </div>

        {/* ── Arus Kas ── */}
        <div className="rounded-[40px] border border-white/10 bg-white/[0.06] p-8 backdrop-blur-2xl">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-3xl font-black tracking-tight">Arus Kas</h2>
            <span className="rounded-full border border-white/10 bg-white/10 px-4 py-1.5 text-xs font-bold text-white/50">
              {data?.transactions?.length ?? 0} transaksi
            </span>
          </div>

          {/* Loading skeleton */}
          {loading && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-2xl bg-white/5" />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && (!data?.transactions || data.transactions.length === 0) && (
            <div className="rounded-2xl bg-white/5 p-10 text-center">
              <Wallet size={36} className="mx-auto mb-3 text-white/20" />
              <p className="font-bold text-white/40">Belum ada transaksi</p>
              <p className="mt-1 text-sm text-white/25">Klik "Tambah Transaksi" untuk mulai mencatat.</p>
            </div>
          )}

          {/* Transaction list */}
          {!loading && data?.transactions && data.transactions.length > 0 && (
            <div className="space-y-3">
              {data.transactions.map((trx) => (
                <div
                  key={trx.id}
                  className="flex items-center justify-between rounded-2xl border border-white/5 bg-black/20 px-5 py-4"
                >
                  <div className="flex items-center gap-4">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                      trx.type === "income" ? "bg-green-500/20" : "bg-red-500/20"
                    }`}>
                      {trx.type === "income"
                        ? <TrendingUp size={16} className="text-green-400" />
                        : <TrendingDown size={16} className="text-red-400" />}
                    </div>
                    <div>
                      <p className="font-bold text-white">{trx.title}</p>
                      <p className="text-xs text-white/40">{formatDate(trx.created_at)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`text-right text-base font-black ${
                      trx.type === "income" ? "text-green-400" : "text-red-400"
                    }`}>
                      {trx.type === "income" ? "+" : "−"} {rupiah(trx.amount)}
                    </span>
                    <button
                      onClick={() => setDeleteTarget(trx)}
                      className="rounded-xl border border-red-500/20 bg-red-500/10 p-2 text-red-400 transition hover:bg-red-500/20"
                      title="Hapus transaksi"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Modals ── */}
      {showAddModal && (
        <AddTransactionModal
          onSave={handleAddTransaction}
          onClose={() => setShowAddModal(false)}
          loading={savingTrx}
        />
      )}

      {showModalForm && data && (
        <UpdateModalForm
          current={data.totalModal}
          onSave={handleUpdateModal}
          onCancel={() => setShowModalForm(false)}
          loading={savingModal}
        />
      )}

      {deleteTarget && (
        <DeleteTransactionModal
          trx={deleteTarget}
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