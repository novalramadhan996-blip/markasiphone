"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Pencil,
  Percent,
  Plus,
  Tag,
  ToggleLeft,
  ToggleRight,
  Trash2,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Promo = {
  id: number;
  product_id: number;
  product_name: string;
  discount_percent: number;
  is_active: number;
  valid_until: string | null;
  created_at: string;
  is_expired: boolean; // dikirim langsung dari API
};

type ProductOption = {
  id: number;
  name: string;
  category: string;
};

// ─── Toast ────────────────────────────────────────────────────────────────────

type ToastType = "success" | "error";
type Toast = { id: number; message: string; type: ToastType };

let _counter = 0;

function ToastContainer({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className={`flex items-center gap-3 rounded-2xl px-5 py-4 text-sm font-bold text-white shadow-2xl backdrop-blur-xl ${
              t.type === "success" ? "bg-emerald-500/90" : "bg-red-500/90"
            }`}
          >
            {t.type === "success" ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
            {t.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ─── Confirm Modal ────────────────────────────────────────────────────────────

function ConfirmModal({
  open,
  message,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mx-4 w-full max-w-md rounded-[32px] border border-white/10 bg-[#0d0d0d] p-8 shadow-2xl"
      >
        <div className="mb-5 flex items-center gap-3 text-red-400">
          <AlertTriangle size={24} />
          <h3 className="text-xl font-black">Konfirmasi Hapus</h3>
        </div>
        <p className="mb-8 text-white/60">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-white/10 bg-white/10 px-6 py-3 text-sm font-black text-white hover:bg-white/20"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-full bg-red-500 px-6 py-3 text-sm font-black text-white hover:bg-red-600"
          >
            Hapus
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "Tidak ada";
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PromosiPage() {
  const router = useRouter();

  const [promos, setPromos] = useState<Promo[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  const [form, setForm] = useState({
    product_id: "",
    discount_percent: "",
    valid_until: "",
  });

  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    promoId: number | null;
    promoName: string;
  }>({ open: false, promoId: null, promoName: "" });

  // ─── Auth check ──────────────────────────────────────────────────────────

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("markas_admin_logged_in");
    if (!isLoggedIn) router.replace("/rahasia-admin-markas/login");
  }, [router]);

  // ─── Toast helpers ────────────────────────────────────────────────────────

  function showToast(message: string, type: ToastType = "success") {
    _counter += 1;
    const id = _counter;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }

  // ─── Fetch ────────────────────────────────────────────────────────────────

  async function fetchPromos() {
    try {
      const res = await fetch("/api/promotions");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      // GET /api/promotions mengembalikan array langsung (bukan { promotions: [...] })
      const data = await res.json();
      setPromos(Array.isArray(data) ? data : []);
    } catch {
      showToast("Gagal memuat data promo", "error");
    } finally {
      setLoading(false);
    }
  }

  async function fetchProducts() {
    try {
      const res = await fetch("/api/products");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      // products-route-v2 mengembalikan array langsung
      const list = Array.isArray(data) ? data : (data.products ?? []);
      const active = list
        .filter((p: { is_active: number }) => p.is_active === 1)
        .map((p: { id: number; name: string; category: string }) => ({
          id: p.id,
          name: p.name,
          category: p.category,
        }));
      setProducts(active);
    } catch {
      showToast("Gagal memuat daftar produk", "error");
    }
  }

  useEffect(() => {
    fetchPromos();
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Form helpers ─────────────────────────────────────────────────────────

  function resetForm() {
    setForm({ product_id: "", discount_percent: "", valid_until: "" });
    setEditMode(false);
    setEditId(null);
    setShowForm(false);
  }

  function openAddForm() {
    resetForm();
    setShowForm(true);
  }

  function openEditForm(promo: Promo) {
    setForm({
      product_id: String(promo.product_id),
      discount_percent: String(promo.discount_percent),
      valid_until: promo.valid_until ? promo.valid_until.slice(0, 16) : "",
    });
    setEditMode(true);
    setEditId(promo.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ─── CRUD ─────────────────────────────────────────────────────────────────

  async function handleSubmit() {
    if (!form.product_id || !form.discount_percent) {
      showToast("Pilih produk dan masukkan persen diskon", "error");
      return;
    }

    const pct = Number(form.discount_percent);
    if (isNaN(pct) || pct < 1 || pct > 90) {
      showToast("Diskon harus antara 1–90%", "error");
      return;
    }

    setSubmitting(true);
    try {
      if (editMode && editId !== null) {
        const res = await fetch("/api/promotions", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editId,
            discount_percent: pct,
            valid_until: form.valid_until || null,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message ?? "Gagal update promo");
        showToast("Promo berhasil diupdate");
      } else {
        const res = await fetch("/api/promotions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            product_id: Number(form.product_id),
            discount_percent: pct,
            valid_until: form.valid_until || null,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message ?? "Gagal tambah promo");
        showToast("Promo berhasil ditambahkan");
      }

      resetForm();
      await fetchPromos();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Terjadi error", "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggle(promo: Promo) {
    try {
      const res = await fetch("/api/promotions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: promo.id,
          is_active: promo.is_active === 1 ? 0 : 1,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Gagal toggle promo");
      showToast(promo.is_active === 1 ? "Promo dinonaktifkan" : "Promo diaktifkan");
      await fetchPromos();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Terjadi error", "error");
    }
  }

  function askDelete(promo: Promo) {
    setConfirmModal({
      open: true,
      promoId: promo.id,
      promoName: `${promo.product_name} (${promo.discount_percent}%)`,
    });
  }

  async function handleDelete() {
    if (!confirmModal.promoId) return;
    setConfirmModal((prev) => ({ ...prev, open: false }));
    try {
      // ⚠️  Route DELETE pakai query string: DELETE /api/promotions?id=X
      const res = await fetch(`/api/promotions?id=${confirmModal.promoId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Gagal hapus promo");
      showToast("Promo berhasil dihapus");
      await fetchPromos();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Terjadi error", "error");
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  const inputClass =
    "w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-3.5 text-sm font-bold text-white outline-none placeholder:text-white/30 transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30";

  return (
    <main className="min-h-screen bg-[#080808] text-white">
      <ToastContainer toasts={toasts} />

      <ConfirmModal
        open={confirmModal.open}
        message={`Yakin hapus promo "${confirmModal.promoName}"? Tindakan ini tidak bisa dibatalkan.`}
        onConfirm={handleDelete}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, open: false }))}
      />

      <div className="mx-auto max-w-5xl px-6 py-12">
        {/* Header */}
        <div className="mb-10 flex items-center justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-blue-400">
              <Tag size={12} />
              Admin Panel
            </div>
            <h1 className="text-5xl font-black tracking-[-0.06em]">Promosi</h1>
            <p className="mt-2 text-white/40">
              Kelola diskon produk yang tampil otomatis di storefront.
            </p>
          </div>

          <button
            type="button"
            onClick={openAddForm}
            className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-3 text-sm font-black text-white shadow-[0_8px_30px_rgba(37,99,235,0.4)] transition hover:scale-[1.03] hover:bg-blue-500"
          >
            <Plus size={16} />
            Tambah Promo
          </button>
        </div>

        {/* Form tambah / edit */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-8 rounded-[40px] border border-white/10 bg-white/5 p-8 backdrop-blur-xl"
            >
              <h2 className="mb-6 text-2xl font-black">
                {editMode ? "Edit Promo" : "Tambah Promo Baru"}
              </h2>

              <div className="grid gap-4 md:grid-cols-3">
                {/* Pilih produk */}
                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-wider text-white/40">
                    Produk
                  </label>
                  <select
                    value={form.product_id}
                    onChange={(e) => setForm({ ...form, product_id: e.target.value })}
                    disabled={editMode}
                    className={`${inputClass} ${editMode ? "cursor-not-allowed opacity-50" : ""}`}
                  >
                    <option value="" disabled>
                      Pilih produk…
                    </option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.category})
                      </option>
                    ))}
                  </select>
                  {editMode && (
                    <p className="mt-1 text-xs text-white/30">
                      Produk tidak bisa diubah. Hapus dan buat promo baru.
                    </p>
                  )}
                </div>

                {/* Persen diskon */}
                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-wider text-white/40">
                    Diskon (%)
                  </label>
                  <div className="relative">
                    <Percent
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30"
                      size={16}
                    />
                    <input
                      type="number"
                      min={1}
                      max={90}
                      placeholder="Contoh: 10"
                      value={form.discount_percent}
                      onChange={(e) =>
                        setForm({ ...form, discount_percent: e.target.value })
                      }
                      className={inputClass}
                    />
                  </div>
                </div>

                {/* Tanggal expired */}
                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-wider text-white/40">
                    Berlaku Hingga (opsional)
                  </label>
                  <div className="relative">
                    <Calendar
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30"
                      size={16}
                    />
                    <input
                      type="datetime-local"
                      value={form.valid_until}
                      onChange={(e) =>
                        setForm({ ...form, valid_until: e.target.value })
                      }
                      className={`${inputClass} pl-11`}
                    />
                  </div>
                  <p className="mt-1 text-xs text-white/30">
                    Kosongkan jika tidak ada tanggal kadaluarsa.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-7 py-3.5 text-sm font-black text-white shadow-[0_8px_30px_rgba(37,99,235,0.35)] transition hover:bg-blue-500 disabled:opacity-50"
                >
                  <CheckCircle2 size={16} />
                  {submitting
                    ? "Menyimpan…"
                    : editMode
                    ? "Update Promo"
                    : "Simpan Promo"}
                </button>

                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-full border border-white/10 bg-white/5 px-7 py-3.5 text-sm font-black text-white/60 transition hover:text-white"
                >
                  Batal
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* List promo */}
        {loading ? (
          <div className="flex items-center justify-center py-20 text-white/30">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="h-8 w-8 rounded-full border-2 border-white/20 border-t-blue-400"
            />
          </div>
        ) : promos.length === 0 ? (
          <div className="rounded-[40px] border border-white/10 bg-white/5 py-20 text-center">
            <Tag size={40} className="mx-auto mb-4 text-white/20" />
            <p className="text-lg font-black text-white/30">Belum ada promo</p>
            <p className="mt-2 text-sm text-white/20">
              Klik "Tambah Promo" untuk membuat promo pertama.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {promos.map((promo, i) => {
              // Gunakan field is_expired dari API (sudah dihitung server-side)
              const expired = promo.is_expired;
              const active = promo.is_active === 1 && !expired;

              return (
                <motion.div
                  key={promo.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex flex-col gap-4 rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between"
                >
                  {/* Info */}
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-500/15 text-blue-400">
                      <Percent size={22} />
                    </div>

                    <div>
                      <p className="text-lg font-black">{promo.product_name}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        {expired ? (
                          <span className="rounded-full bg-neutral-700 px-3 py-0.5 text-xs font-black text-white/40">
                            EXPIRED
                          </span>
                        ) : active ? (
                          <span className="rounded-full bg-emerald-500/20 px-3 py-0.5 text-xs font-black text-emerald-400">
                            AKTIF
                          </span>
                        ) : (
                          <span className="rounded-full bg-yellow-500/15 px-3 py-0.5 text-xs font-black text-yellow-400">
                            NONAKTIF
                          </span>
                        )}

                        <span className="rounded-full bg-red-500/15 px-3 py-0.5 text-xs font-black text-red-400">
                          {promo.discount_percent}% OFF
                        </span>

                        <span className="text-xs text-white/30">
                          Hingga:{" "}
                          <span className="text-white/50">
                            {formatDate(promo.valid_until)}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {!expired && (
                      <button
                        type="button"
                        onClick={() => handleToggle(promo)}
                        title={promo.is_active === 1 ? "Nonaktifkan" : "Aktifkan"}
                        className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-black transition hover:bg-white/10"
                      >
                        {promo.is_active === 1 ? (
                          <ToggleRight size={18} className="text-emerald-400" />
                        ) : (
                          <ToggleLeft size={18} className="text-white/30" />
                        )}
                        {promo.is_active === 1 ? "Aktif" : "Nonaktif"}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => openEditForm(promo)}
                      title="Edit promo"
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/50 transition hover:bg-blue-500/20 hover:text-blue-400"
                    >
                      <Pencil size={15} />
                    </button>

                    <button
                      type="button"
                      onClick={() => askDelete(promo)}
                      title="Hapus promo"
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/50 transition hover:bg-red-500/20 hover:text-red-400"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}