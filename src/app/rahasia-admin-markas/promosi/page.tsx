"use client";

import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Loader2,
  Package,
  Plus,
  RefreshCw,
  Save,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Product = {
  id: number;
  name: string;
  image_url: string;
  base_price: number;
  is_active: number;
};

type Promotion = {
  id: number;
  product_id: number;
  discount_percent: number;
  is_active: number;
  valid_until: string | null;
  is_expired: boolean;
  product_name: string;
  product_image: string;
  base_price: number;
};

type Toast = { id: number; message: string; type: "success" | "error" };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function rupiah(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);
}

function formatDate(iso: string | null) {
  if (!iso) return "Tanpa batas waktu";
  return new Date(iso).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

function finalPrice(base: number, discount: number) {
  return Math.round(base * (1 - discount / 100));
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

function DeleteModal({
  promo, onConfirm, onCancel, loading,
}: {
  promo: Promotion; onConfirm: () => void; onCancel: () => void; loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-[32px] border border-white/10 bg-[#0a0c14] p-8 shadow-2xl">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/20">
          <Trash2 size={24} className="text-red-400" />
        </div>
        <h2 className="text-2xl font-black text-white">Hapus Promo?</h2>
        <p className="mt-2 text-white/50">
          Promo <span className="font-bold text-white">{promo.discount_percent}% untuk {promo.product_name}</span> akan dihapus permanen.
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

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PromosiPage() {
  const router = useRouter();

  const [promotions, setPromotions]     = useState<Promotion[]>([]);
  const [products, setProducts]         = useState<Product[]>([]);
  const [loading, setLoading]           = useState(true);
  const [submitting, setSubmitting]     = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Promotion | null>(null);
  const [deletingId, setDeletingId]     = useState<number | null>(null);
  const [togglingId, setTogglingId]     = useState<number | null>(null);
  const [toasts, setToasts]             = useState<Toast[]>([]);
  const toastCounter                    = useRef(0);

  // Form state
  const [selectedProductId, setSelectedProductId] = useState("");
  const [discountPercent, setDiscountPercent]     = useState("");
  const [validUntil, setValidUntil]               = useState("");

  // ── Auth check ──
  useEffect(() => {
    if (localStorage.getItem("admin_logged_in") !== "true") {
      router.push("/rahasia-admin-markas/login");
      return;
    }
    fetchAll();
  }, [router]);

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

  async function fetchAll() {
    setLoading(true);
    await Promise.all([fetchPromotions(), fetchProducts()]);
    setLoading(false);
  }

  async function fetchPromotions() {
    try {
      const res  = await fetch("/api/promotions");
      const data = await res.json();
      setPromotions(Array.isArray(data) ? data : []);
    } catch {
      addToast("Gagal memuat data promosi", "error");
    }
  }

  async function fetchProducts() {
    try {
      const res  = await fetch("/api/products");
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch {
      /* silent */
    }
  }

  // Produk yang belum punya promo aktif — supaya admin tidak pilih produk yang sudah ada promonya
  const productsWithoutActivePromo = products.filter((p) => {
    const hasActivePromo = promotions.some(
      (promo) => promo.product_id === p.id && promo.is_active === 1 && !promo.is_expired
    );
    return !hasActivePromo;
  });

  function resetForm() {
    setSelectedProductId("");
    setDiscountPercent("");
    setValidUntil("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!selectedProductId || !discountPercent) {
      addToast("Pilih produk dan isi persentase diskon", "error");
      return;
    }

    const pct = Number(discountPercent);
    if (pct <= 0 || pct > 90) {
      addToast("Diskon harus antara 1% - 90%", "error");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/promotions", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          product_id:       Number(selectedProductId),
          discount_percent: pct,
          valid_until:      validUntil || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Gagal menambah promo");
      addToast("Promo berhasil ditambahkan", "success");
      resetForm();
      fetchAll();
    } catch (err: any) {
      addToast(err.message ?? "Terjadi kesalahan", "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleActive(promo: Promotion) {
    setTogglingId(promo.id);
    try {
      const res = await fetch("/api/promotions", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ id: promo.id, is_active: promo.is_active === 1 ? false : true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Gagal update status");
      addToast(promo.is_active === 1 ? "Promo dinonaktifkan" : "Promo diaktifkan", "success");
      fetchAll();
    } catch (err: any) {
      addToast(err.message ?? "Terjadi kesalahan", "error");
    } finally {
      setTogglingId(null);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeletingId(deleteTarget.id);
    try {
      const res  = await fetch(`/api/promotions?id=${deleteTarget.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Gagal hapus");
      addToast("Promo berhasil dihapus", "success");
      setDeleteTarget(null);
      fetchAll();
    } catch (err: any) {
      addToast(err.message ?? "Terjadi kesalahan", "error");
    } finally {
      setDeletingId(null);
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen overflow-hidden bg-black p-6 text-white">
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
            <p className="mb-2 text-xs font-black uppercase tracking-[0.3em] text-blue-300">Promotion Manager</p>
            <h1 className="text-5xl font-black tracking-[-0.06em] md:text-6xl">Promosi.</h1>
            <p className="mt-3 text-base text-white/50">Atur diskon otomatis per produk, langsung tampil di toko.</p>
          </div>

          <button
            onClick={fetchAll}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-5 py-3 font-bold text-white backdrop-blur-xl transition hover:bg-white/20 disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        <div className="grid gap-8 lg:grid-cols-[380px_1fr]">

          {/* ── Form Panel ── */}
          <form
            onSubmit={handleSubmit}
            className="sticky top-6 h-fit rounded-[40px] border border-white/10 bg-white/[0.06] p-7 backdrop-blur-2xl"
          >
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/20">
              <Plus size={26} className="text-emerald-300" />
            </div>
            <h2 className="mb-1 text-3xl font-black tracking-tight">Tambah Promo</h2>
            <p className="mb-7 text-sm text-white/40">
              Promo otomatis tampil di toko, customer tidak perlu kode apapun.
            </p>

            <div className="space-y-4">
              {/* Pilih produk */}
              <div>
                <label className="mb-1.5 block text-xs font-bold text-white/50">Produk *</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-[#0d1117] px-4 py-3.5 text-sm font-bold text-white outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/25"
                >
                  <option value="">Pilih produk…</option>
                  {productsWithoutActivePromo.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} — {rupiah(p.base_price)}</option>
                  ))}
                </select>
                {productsWithoutActivePromo.length === 0 && !loading && (
                  <p className="mt-1.5 text-xs text-yellow-400/80">
                    Semua produk sudah punya promo aktif.
                  </p>
                )}
              </div>

              {/* Diskon persen */}
              <div>
                <label className="mb-1.5 block text-xs font-bold text-white/50">Diskon (%) *</label>
                <input
                  type="number"
                  min={1}
                  max={90}
                  placeholder="Contoh: 10"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 text-sm font-bold text-white placeholder:text-white/25 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/25"
                />
                {selectedProductId && discountPercent && Number(discountPercent) > 0 && (
                  (() => {
                    const product = products.find((p) => p.id === Number(selectedProductId));
                    if (!product) return null;
                    return (
                      <p className="mt-1.5 text-sm">
                        <span className="text-white/40 line-through">{rupiah(product.base_price)}</span>{" "}
                        <span className="font-bold text-emerald-400">
                          {rupiah(finalPrice(product.base_price, Number(discountPercent)))}
                        </span>
                      </p>
                    );
                  })()
                )}
              </div>

              {/* Tanggal berakhir */}
              <div>
                <label className="mb-1.5 block text-xs font-bold text-white/50">
                  Berlaku Sampai <span className="font-normal text-white/30">(opsional)</span>
                </label>
                <input
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  min={new Date().toISOString().slice(0, 10)}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 text-sm font-bold text-white outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/25 [color-scheme:dark]"
                />
                <p className="mt-1.5 text-xs text-white/30">
                  Kosongkan untuk promo tanpa batas waktu — nonaktifkan manual kapan saja.
                </p>
              </div>

              <button
                type="submit"
                disabled={submitting || productsWithoutActivePromo.length === 0}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-4 font-black text-white transition hover:bg-emerald-700 disabled:opacity-50"
              >
                {submitting
                  ? <><Loader2 size={16} className="animate-spin" /> Menyimpan…</>
                  : <><Save size={16} /> Simpan Promo</>}
              </button>
            </div>
          </form>

          {/* ── Promo List ── */}
          <div>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-black tracking-tight">Daftar Promo</h2>
                <p className="text-sm text-white/40">
                  {loading ? "Memuat…" : `${promotions.length} promo terdaftar`}
                </p>
              </div>
            </div>

            {loading && (
              <div className="flex items-center justify-center py-16 text-white/30">
                <Loader2 size={32} className="animate-spin" />
              </div>
            )}

            {!loading && promotions.length === 0 && (
              <div className="rounded-[40px] border border-white/10 bg-white/5 p-14 text-center">
                <Tag size={48} className="mx-auto mb-4 text-white/20" />
                <h3 className="text-2xl font-black text-white/60">Belum ada promo</h3>
                <p className="mt-2 text-sm text-white/30">Tambahkan promo pertama dari form di sebelah kiri.</p>
              </div>
            )}

            {!loading && promotions.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-2">
                {promotions.map((promo) => {
                  const effectivelyActive = promo.is_active === 1 && !promo.is_expired;
                  return (
                    <div
                      key={promo.id}
                      className={`rounded-[28px] border p-5 transition ${
                        effectivelyActive
                          ? "border-emerald-500/30 bg-emerald-500/[0.06]"
                          : "border-white/10 bg-white/[0.04] opacity-70"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white p-2">
                          {promo.product_image
                            ? <img src={promo.product_image} alt={promo.product_name} className="max-h-full object-contain" />
                            : <Package size={24} className="text-neutral-300" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate font-black">{promo.product_name}</h3>
                          <div className="mt-1 flex items-center gap-2">
                            <span className="text-sm text-white/40 line-through">{rupiah(promo.base_price)}</span>
                            <span className="text-sm font-bold text-emerald-400">
                              {rupiah(finalPrice(promo.base_price, promo.discount_percent))}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="my-4 h-px bg-white/10" />

                      <div className="flex items-center justify-between">
                        <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-black text-emerald-300">
                          -{promo.discount_percent}%
                        </span>

                        {promo.is_expired ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-500/20 px-3 py-1 text-xs font-bold text-red-300">
                            <Clock size={12} /> Kedaluwarsa
                          </span>
                        ) : promo.is_active === 1 ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-500/20 px-3 py-1 text-xs font-bold text-green-300">
                            <CheckCircle2 size={12} /> Aktif
                          </span>
                        ) : (
                          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white/40">
                            Nonaktif
                          </span>
                        )}
                      </div>

                      <p className="mt-2 text-xs text-white/30">
                        Berlaku sampai: {formatDate(promo.valid_until)}
                      </p>

                      <div className="mt-4 flex gap-2">
                        {!promo.is_expired && (
                          <button
                            onClick={() => toggleActive(promo)}
                            disabled={togglingId === promo.id}
                            className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition disabled:opacity-50 ${
                              promo.is_active === 1
                                ? "bg-white/10 text-white/70 hover:bg-white/20"
                                : "bg-emerald-600 text-white hover:bg-emerald-700"
                            }`}
                          >
                            {togglingId === promo.id
                              ? <Loader2 size={14} className="mx-auto animate-spin" />
                              : promo.is_active === 1 ? "Nonaktifkan" : "Aktifkan"}
                          </button>
                        )}
                        <button
                          onClick={() => setDeleteTarget(promo)}
                          className="rounded-xl bg-red-500/10 px-4 py-2.5 text-sm font-bold text-red-400 transition hover:bg-red-500 hover:text-white"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      {deleteTarget && (
        <DeleteModal
          promo={deleteTarget}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deletingId === deleteTarget.id}
        />
      )}

      <ToastList toasts={toasts} onDismiss={dismissToast} />
    </main>
  );
}