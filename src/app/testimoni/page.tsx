'use client';

// src/app/testimoni/page.tsx
import { useEffect, useState, useRef } from 'react';

// ─── types ────────────────────────────────────────────────────────────────────

interface Testimoni {
  id: number;
  customer_name: string;
  rating: number;
  message: string;
  photo_url: string | null;
  created_at: string;
}

// ─── sub-components ───────────────────────────────────────────────────────────

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg key={s} className={`w-4 h-4 ${s <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
          fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462
            c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755
            1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197
            -1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588
            -1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function StarInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s} type="button"
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(s)}
          aria-label={`${s} bintang`}
        >
          <svg className={`w-8 h-8 transition-colors ${s <= (hover || value) ? 'text-yellow-400' : 'text-gray-300'}`}
            fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462
              c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755
              1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197
              -1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588
              -1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>
      ))}
    </div>
  );
}

// ─── main component ───────────────────────────────────────────────────────────

export default function TestimoniPage() {
  const [testimonis, setTestimonis]   = useState<Testimoni[]>([]);
  const [loading, setLoading]         = useState(true);
  const [showForm, setShowForm]       = useState(false);

  // form state
  const [form, setForm]               = useState({ customer_name: '', customer_email: '', rating: 0, message: '' });
  const [photo, setPhoto]             = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting]   = useState(false);
  const [toast, setToast]             = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const fileRef                       = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchTestimonis(); }, []);

  async function fetchTestimonis() {
    setLoading(true);
    try {
      const res  = await fetch('/api/testimonials');
      const data = await res.json();
      setTestimonis(data.data ?? []);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }

  function showToast(type: 'success' | 'error', msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast('error', 'Foto maksimal 5MB');
      return;
    }
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.rating === 0) { showToast('error', 'Pilih rating bintang terlebih dahulu'); return; }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('customer_name',  form.customer_name);
      fd.append('customer_email', form.customer_email);
      fd.append('rating',         String(form.rating));
      fd.append('message',        form.message);
      if (photo) fd.append('photo', photo);

      const res  = await fetch('/api/testimonials', { method: 'POST', body: fd });
      const data = await res.json();

      if (data.success) {
        showToast('success', data.message);
        setShowForm(false);
        setForm({ customer_name: '', customer_email: '', rating: 0, message: '' });
        setPhoto(null);
        setPhotoPreview(null);
      } else {
        showToast('error', data.message ?? 'Gagal mengirim testimoni');
      }
    } catch {
      showToast('error', 'Terjadi kesalahan, coba lagi');
    } finally {
      setSubmitting(false);
    }
  }

  // ─── render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium transition-all
          ${toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-10 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Testimoni Pelanggan</h1>
          <p className="text-gray-500 mb-6">Apa kata mereka yang sudah berbelanja di Markas iPhone</p>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-colors"
          >
            {showForm ? 'Tutup Form' : '✍️ Tulis Testimoni'}
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">

        {/* Form Submit */}
        {showForm && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-800 mb-5">Tulis Pengalaman Anda</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap *</label>
                  <input
                    type="text" required
                    value={form.customer_name}
                    onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))}
                    placeholder="Nama kamu"
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email" required
                    value={form.customer_email}
                    onChange={e => setForm(f => ({ ...f, customer_email: e.target.value }))}
                    placeholder="Email yang dipakai saat order"
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-400 mt-1">Harus sama dengan email saat checkout</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rating *</label>
                <StarInput value={form.rating} onChange={v => setForm(f => ({ ...f, rating: v }))} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Testimoni *</label>
                <textarea
                  required rows={4}
                  value={form.message}
                  onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  placeholder="Ceritakan pengalaman berbelanja kamu di Markas iPhone..."
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Foto (opsional, maks. 5MB)</label>
                <div
                  onClick={() => fileRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-xl p-4 cursor-pointer hover:border-blue-400 transition-colors text-center"
                >
                  {photoPreview ? (
                    <img src={photoPreview} alt="preview" className="h-24 mx-auto rounded-lg object-cover" />
                  ) : (
                    <p className="text-sm text-gray-400">Klik untuk upload foto</p>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit" disabled={submitting}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-colors"
                >
                  {submitting ? 'Mengirim...' : 'Kirim Testimoni'}
                </button>
                <button
                  type="button" onClick={() => setShowForm(false)}
                  className="border border-gray-300 text-gray-600 px-5 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Grid testimoni */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse h-44" />
            ))}
          </div>
        ) : testimonis.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-3">💬</div>
            <p className="text-gray-500">Belum ada testimoni yang disetujui.</p>
            <p className="text-sm text-gray-400 mt-1">Jadilah yang pertama berbagi pengalaman!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {testimonis.map((t) => (
              <div key={t.id}
                className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-3"
              >
                {/* foto */}
                {t.photo_url && (
                  <img
                    src={t.photo_url} alt={`Foto dari ${t.customer_name}`}
                    className="w-full h-36 object-cover rounded-xl"
                  />
                )}

                {/* rating */}
                <StarDisplay rating={t.rating} />

                {/* pesan */}
                <p className="text-sm text-gray-700 leading-relaxed flex-1">
                  &ldquo;{t.message}&rdquo;
                </p>

                {/* footer */}
                <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold uppercase">
                    {t.customer_name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{t.customer_name}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(t.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}