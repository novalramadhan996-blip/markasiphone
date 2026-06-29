"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Pencil,
  Trash2,
  Image as ImageIcon,
  GripVertical,
  Eye,
  EyeOff,
  X,
  Save,
  Loader2,
  ExternalLink,
  LayoutDashboard,
} from "lucide-react";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

type Banner = {
  id: number;
  title: string;
  subtitle: string | null;
  image_url: string;
  link_url: string | null;
  sort_order: number;
  is_active: 0 | 1;
  created_at: string;
};

type FormState = {
  title: string;
  subtitle: string;
  image_url: string;
  link_url: string;
  sort_order: number;
  is_active: boolean;
};

const EMPTY_FORM: FormState = {
  title: "",
  subtitle: "",
  image_url: "",
  link_url: "",
  sort_order: 0,
  is_active: true,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ADMIN_HEADERS = {
  "Content-Type": "application/json",
  "x-admin-request": "true",
};

function toast(msg: string, type: "success" | "error" = "success") {
  const el = document.createElement("div");
  const bg = type === "success" ? "#22c55e" : "#ef4444";
  el.style.cssText = `
    position:fixed;bottom:24px;right:24px;z-index:9999;
    background:${bg};color:#fff;padding:12px 20px;
    border-radius:12px;font-weight:700;font-size:14px;
    box-shadow:0 8px 32px rgba(0,0,0,.4);
    animation:slideIn .25s ease;
  `;
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

// ─── Modal ────────────────────────────────────────────────────────────────────

type ModalProps = {
  banner: Banner | null; // null = create mode
  onClose: () => void;
  onSaved: () => void;
};

function BannerModal({ banner, onClose, onSaved }: ModalProps) {
  const [form, setForm] = useState<FormState>(
    banner
      ? {
          title: banner.title,
          subtitle: banner.subtitle ?? "",
          image_url: banner.image_url,
          link_url: banner.link_url ?? "",
          sort_order: banner.sort_order,
          is_active: banner.is_active === 1,
        }
      : EMPTY_FORM
  );
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (k: keyof FormState, v: FormState[keyof FormState]) =>
    setForm((p) => ({ ...p, [k]: v }));

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.imageUrl) set("image_url", data.imageUrl);
      else toast("Upload gagal", "error");
    } catch {
      toast("Upload gagal", "error");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit() {
    if (!form.title.trim()) return toast("Judul wajib diisi", "error");
    if (!form.image_url.trim()) return toast("Gambar wajib diupload", "error");

    setSaving(true);
    try {
      const payload = {
        ...form,
        id: banner?.id,
        is_active: form.is_active ? 1 : 0,
      };
      const res = await fetch("/api/banners", {
        method: banner ? "PATCH" : "POST",
        headers: ADMIN_HEADERS,
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      toast(banner ? "Banner diperbarui" : "Banner ditambahkan");
      onSaved();
      onClose();
    } catch {
      toast("Gagal menyimpan banner", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-lg bg-[#111] border border-white/10 rounded-[28px] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
          <h2 className="text-lg font-black text-white">
            {banner ? "Edit Banner" : "Tambah Banner"}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Image Upload */}
          <div>
            <label className="text-xs font-bold text-white/50 uppercase tracking-wider mb-2 block">
              Gambar Banner <span className="text-red-400">*</span>
            </label>
            <div
              className="relative h-40 rounded-[16px] border-2 border-dashed border-white/20 overflow-hidden cursor-pointer hover:border-indigo-500/60 transition-colors group"
              onClick={() => fileRef.current?.click()}
            >
              {form.image_url ? (
                <>
                  <img
                    src={form.image_url}
                    alt="preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white text-sm font-bold">
                      Ganti Gambar
                    </span>
                  </div>
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center gap-2">
                  {uploading ? (
                    <Loader2 className="w-8 h-8 text-white/40 animate-spin" />
                  ) : (
                    <>
                      <ImageIcon className="w-8 h-8 text-white/30" />
                      <span className="text-white/40 text-sm">
                        Klik untuk upload
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleUpload}
            />
          </div>

          {/* Title */}
          <div>
            <label className="text-xs font-bold text-white/50 uppercase tracking-wider mb-2 block">
              Judul <span className="text-red-400">*</span>
            </label>
            <input
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="Promo Spesial Lebaran..."
              className="w-full bg-white/[0.06] border border-white/10 rounded-[12px] px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-indigo-500/60 transition-colors"
            />
          </div>

          {/* Subtitle */}
          <div>
            <label className="text-xs font-bold text-white/50 uppercase tracking-wider mb-2 block">
              Subtitle
            </label>
            <input
              value={form.subtitle}
              onChange={(e) => set("subtitle", e.target.value)}
              placeholder="Diskon hingga 30% untuk semua iPhone..."
              className="w-full bg-white/[0.06] border border-white/10 rounded-[12px] px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-indigo-500/60 transition-colors"
            />
          </div>

          {/* Link */}
          <div>
            <label className="text-xs font-bold text-white/50 uppercase tracking-wider mb-2 block">
              Link URL
            </label>
            <input
              value={form.link_url}
              onChange={(e) => set("link_url", e.target.value)}
              placeholder="https://... atau /produk"
              className="w-full bg-white/[0.06] border border-white/10 rounded-[12px] px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-indigo-500/60 transition-colors"
            />
          </div>

          {/* Sort Order + Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-white/50 uppercase tracking-wider mb-2 block">
                Urutan
              </label>
              <input
                type="number"
                min={0}
                value={form.sort_order}
                onChange={(e) => set("sort_order", Number(e.target.value))}
                className="w-full bg-white/[0.06] border border-white/10 rounded-[12px] px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500/60 transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-white/50 uppercase tracking-wider mb-2 block">
                Status
              </label>
              <button
                type="button"
                onClick={() => set("is_active", !form.is_active)}
                className={`w-full h-[46px] rounded-[12px] border font-bold text-sm transition-all ${
                  form.is_active
                    ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                    : "bg-white/[0.06] border-white/10 text-white/40"
                }`}
              >
                {form.is_active ? "Aktif" : "Nonaktif"}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-[12px] bg-white/[0.06] text-white/70 text-sm font-bold hover:bg-white/10 transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-5 py-2.5 rounded-[12px] bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-black disabled:opacity-50 flex items-center gap-2 hover:opacity-90 transition-opacity"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────

function DeleteModal({
  banner,
  onClose,
  onDeleted,
}: {
  banner: Banner;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [loading, setLoading] = useState(false);

  async function confirm() {
    setLoading(true);
    try {
      const res = await fetch(`/api/banners?id=${banner.id}`, {
        method: "DELETE",
        headers: ADMIN_HEADERS,
      });
      if (!res.ok) throw new Error();
      toast("Banner dihapus");
      onDeleted();
      onClose();
    } catch {
      toast("Gagal menghapus", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-sm bg-[#111] border border-white/10 rounded-[24px] p-6 shadow-2xl">
        <h3 className="text-lg font-black text-white mb-2">Hapus Banner?</h3>
        <p className="text-white/50 text-sm mb-6">
          Banner{" "}
          <span className="text-white font-bold">"{banner.title}"</span> akan
          dihapus permanen.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-[12px] bg-white/[0.06] text-white/70 font-bold text-sm hover:bg-white/10 transition-colors"
          >
            Batal
          </button>
          <button
            onClick={confirm}
            disabled={loading}
            className="flex-1 py-2.5 rounded-[12px] bg-red-500/80 text-white font-black text-sm hover:bg-red-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Hapus
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Banner Row ───────────────────────────────────────────────────────────────

function BannerRow({
  banner,
  onEdit,
  onDelete,
  onToggle,
}: {
  banner: Banner;
  onEdit: (b: Banner) => void;
  onDelete: (b: Banner) => void;
  onToggle: (b: Banner) => void;
}) {
  return (
    <div className="flex items-center gap-4 bg-white/[0.04] hover:bg-white/[0.07] border border-white/10 rounded-[20px] p-4 transition-colors group">
      {/* Drag Handle (visual only) */}
      <GripVertical className="w-4 h-4 text-white/20 shrink-0" />

      {/* Thumbnail */}
      <div className="w-20 h-12 rounded-[10px] overflow-hidden shrink-0 bg-white/10">
        {banner.image_url ? (
          <img
            src={banner.image_url}
            alt={banner.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="w-4 h-4 text-white/20" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-bold text-white text-sm truncate">{banner.title}</p>
        {banner.subtitle && (
          <p className="text-white/40 text-xs truncate mt-0.5">
            {banner.subtitle}
          </p>
        )}
        {banner.link_url && (
          <a
            href={banner.link_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-indigo-400 text-xs mt-1 hover:text-indigo-300 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="w-3 h-3" />
            <span className="truncate max-w-[160px]">{banner.link_url}</span>
          </a>
        )}
      </div>

      {/* Order */}
      <span className="text-white/30 text-xs font-bold w-6 text-center shrink-0">
        #{banner.sort_order}
      </span>

      {/* Status */}
      <span
        className={`px-3 py-1 rounded-full text-[11px] font-black shrink-0 ${
          banner.is_active === 1
            ? "bg-emerald-500/20 text-emerald-400"
            : "bg-white/10 text-white/30"
        }`}
      >
        {banner.is_active === 1 ? "Aktif" : "Nonaktif"}
      </span>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => onToggle(banner)}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-white/[0.06] hover:bg-white/10 transition-colors"
          title={banner.is_active ? "Nonaktifkan" : "Aktifkan"}
        >
          {banner.is_active ? (
            <Eye className="w-3.5 h-3.5 text-white/50" />
          ) : (
            <EyeOff className="w-3.5 h-3.5 text-white/30" />
          )}
        </button>
        <button
          onClick={() => onEdit(banner)}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-white/[0.06] hover:bg-indigo-500/30 transition-colors"
        >
          <Pencil className="w-3.5 h-3.5 text-white/50" />
        </button>
        <button
          onClick={() => onDelete(banner)}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-white/[0.06] hover:bg-red-500/30 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5 text-white/50" />
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BannerPage() {
  const router = useRouter();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalState, setModalState] = useState<
    | { type: "create" }
    | { type: "edit"; banner: Banner }
    | { type: "delete"; banner: Banner }
    | null
  >(null);

  // Auth guard
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isLogged = localStorage.getItem("markas_admin_logged_in");
      if (!isLogged) router.replace("/rahasia-admin-markas/login");
    }
  }, [router]);

  async function loadBanners() {
    setLoading(true);
    try {
      const res = await fetch("/api/banners", { headers: ADMIN_HEADERS });
      const data = await res.json();
      setBanners(Array.isArray(data) ? data : (data.banners ?? []));
    } catch {
      toast("Gagal memuat banner", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBanners();
  }, []);

  async function handleToggle(banner: Banner) {
    try {
      const res = await fetch("/api/banners", {
        method: "PATCH",
        headers: ADMIN_HEADERS,
        body: JSON.stringify({
          id: banner.id,
          is_active: banner.is_active === 1 ? 0 : 1,
          // preserve required fields
          title: banner.title,
          image_url: banner.image_url,
          sort_order: banner.sort_order,
        }),
      });
      if (!res.ok) throw new Error();
      toast(
        banner.is_active === 1
          ? "Banner dinonaktifkan"
          : "Banner diaktifkan"
      );
      loadBanners();
    } catch {
      toast("Gagal mengubah status", "error");
    }
  }

  const activeBanners = banners.filter((b) => b.is_active === 1);
  const inactiveBanners = banners.filter((b) => b.is_active === 0);

  return (
    <>
      <style>{`@keyframes slideIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>

      <div className="min-h-screen bg-[#0a0a0a] p-6 lg:p-8">
        {/* Gradient blobs */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
          <div className="absolute top-0 left-0 w-[600px] h-[600px] rounded-full opacity-20"
            style={{ background: "radial-gradient(circle, #2563eb44 0%, transparent 70%)" }} />
          <div className="absolute bottom-0 right-0 w-[600px] h-[600px] rounded-full opacity-20"
            style={{ background: "radial-gradient(circle, #9333ea44 0%, transparent 70%)" }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link
                href="/rahasia-admin-markas/dashboard"
                className="text-white/30 hover:text-white/60 transition-colors"
              >
                <LayoutDashboard className="w-4 h-4" />
              </Link>
              <span className="text-white/20 text-sm">/</span>
              <span className="text-white/50 text-sm">Banner</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-black text-white">
              Manajemen Banner
            </h1>
            <p className="text-white/40 text-sm mt-1">
              {activeBanners.length} aktif · {inactiveBanners.length} nonaktif
            </p>
          </div>

          <button
            onClick={() => setModalState({ type: "create" })}
            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-[16px] text-white font-black text-sm hover:opacity-90 transition-opacity shadow-lg shadow-indigo-900/30"
          >
            <Plus className="w-4 h-4" />
            Tambah Banner
          </button>
        </div>

        {/* Preview hint */}
        <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-[20px] px-5 py-4 mb-6 flex items-start gap-3">
          <ImageIcon className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-indigo-300 text-sm font-bold">
              Banner tampil di halaman utama
            </p>
            <p className="text-indigo-400/60 text-xs mt-0.5">
              Urutkan berdasarkan angka sort order (terkecil tampil duluan). Banner harus
              diset <span className="font-bold">Aktif</span> agar muncul di homepage.
            </p>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
          </div>
        ) : banners.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-16 h-16 rounded-[20px] bg-white/[0.04] flex items-center justify-center">
              <ImageIcon className="w-8 h-8 text-white/20" />
            </div>
            <p className="text-white/40 font-bold">Belum ada banner</p>
            <button
              onClick={() => setModalState({ type: "create" })}
              className="text-indigo-400 text-sm hover:text-indigo-300 transition-colors font-bold"
            >
              + Tambah banner pertama
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Active banners */}
            {activeBanners.length > 0 && (
              <section>
                <h2 className="text-xs font-black text-emerald-400 uppercase tracking-widest mb-3">
                  Aktif ({activeBanners.length})
                </h2>
                <div className="space-y-2">
                  {activeBanners.map((b) => (
                    <BannerRow
                      key={b.id}
                      banner={b}
                      onEdit={(b) => setModalState({ type: "edit", banner: b })}
                      onDelete={(b) => setModalState({ type: "delete", banner: b })}
                      onToggle={handleToggle}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Inactive banners */}
            {inactiveBanners.length > 0 && (
              <section>
                <h2 className="text-xs font-black text-white/20 uppercase tracking-widest mb-3">
                  Nonaktif ({inactiveBanners.length})
                </h2>
                <div className="space-y-2">
                  {inactiveBanners.map((b) => (
                    <BannerRow
                      key={b.id}
                      banner={b}
                      onEdit={(b) => setModalState({ type: "edit", banner: b })}
                      onDelete={(b) => setModalState({ type: "delete", banner: b })}
                      onToggle={handleToggle}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {modalState?.type === "create" && (
        <BannerModal
          banner={null}
          onClose={() => setModalState(null)}
          onSaved={loadBanners}
        />
      )}
      {modalState?.type === "edit" && (
        <BannerModal
          banner={modalState.banner}
          onClose={() => setModalState(null)}
          onSaved={loadBanners}
        />
      )}
      {modalState?.type === "delete" && (
        <DeleteModal
          banner={modalState.banner}
          onClose={() => setModalState(null)}
          onDeleted={loadBanners}
        />
      )}
    </>
  );
}