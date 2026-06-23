'use client';

// src/app/rahasia-admin-markas/testimoni/page.tsx
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// ─── types ────────────────────────────────────────────────────────────────────

interface Testimoni {
  id: number;
  customer_name: string;
  customer_email: string;
  order_id: number | null;
  rating: number;
  message: string;
  photo_url: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

type FilterStatus = 'all' | 'pending' | 'approved' | 'rejected';

// ─── helpers ──────────────────────────────────────────────────────────────────

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

const STATUS_BADGE: Record<string, string> = {
  pending:  'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

// ─── main component ───────────────────────────────────────────────────────────

export default function AdminTestimoniPage() {
  const router = useRouter();

  const [data, setData]         = useState<Testimoni[]>([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState<FilterStatus>('pending');
  const [toast, setToast]       = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // ─── auth check ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const loggedIn = localStorage.getItem('markas_admin_logged_in');
      if (loggedIn !== 'true') router.replace('/rahasia-admin-markas/login');
    }
  }, [router]);

  // ─── fetch ───────────────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const url = filter === 'all' ? '/api/testimonials' : `/api/testimonials?status=${filter}`;
      const res  = await fetch(url);
      const json = await res.json();
      setData(json.data ?? []);
    } catch {
      showToast('error', 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ─── actions ─────────────────────────────────────────────────────────────────

  function showToast(type: 'success' | 'error', msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  }

  async function handleStatus(id: number, status: 'approved' | 'rejected') {
    try {
      const res  = await fetch('/api/testimonials', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      const json = await res.json();
      if (json.success) {
        showToast('success', json.message);
        fetchData();
      } else {
        showToast('error', json.message ?? 'Gagal update');
      }
    } catch {
      showToast('error', 'Terjadi kesalahan');
    }
  }

  async function handleDelete(id: number) {
    setDeletingId(null);
    try {
      const res  = await fetch('/api/testimonials', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const json = await res.json();
      if (json.success) {
        showToast('success', 'Testimoni dihapus');
        fetchData();
      } else {
        showToast('error', json.message ?? 'Gagal hapus');
      }
    } catch {
      showToast('error', 'Terjadi kesalahan');
    }
  }

  // ─── counts ──────────────────────────────────────────────────────────────────

  const pendingCount = data.filter(d => d.status === 'pending').length;

  // ─── render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium
          ${toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
          {toast.msg}
        </div>
      )}

      {/* Modal konfirmasi hapus */}
      {deletingId !== null && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl p-6 shadow-xl max-w-sm w-full mx-4">
            <h3 className="font-semibold text-gray-800 mb-2">Hapus Testimoni?</h3>
            <p className="text-sm text-gray-500 mb-5">Testimoni akan dihapus permanen dan tidak bisa dikembalikan.</p>
            <div className="flex gap-3">
              <button onClick={() => handleDelete(deletingId)}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-xl text-sm font-medium">
                Ya, Hapus
              </button>
              <button onClick={() => setDeletingId(null)}
                className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-xl text-sm hover:bg-gray-50">
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Testimoni</h1>
          <p className="text-sm text-gray-500 mt-0.5">Kelola ulasan dari pelanggan</p>
        </div>
        <button onClick={() => router.back()}
          className="text-sm text-gray-500 hover:text-gray-700 border border-gray-200 px-4 py-2 rounded-xl">
          ← Kembali
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {(['pending', 'approved', 'rejected', 'all'] as FilterStatus[]).map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors capitalize
              ${filter === s
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            {s === 'all' ? 'Semua' : s}
            {s === 'pending' && pendingCount > 0 && filter !== 'pending' && (
              <span className="ml-1.5 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tabel / grid */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse h-28" />
          ))}
        </div>
      ) : data.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-3">📭</div>
          <p className="text-gray-500">Tidak ada testimoni {filter !== 'all' ? filter : ''}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {data.map((t) => (
            <div key={t.id}
              className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex gap-5"
            >
              {/* foto */}
              {t.photo_url && (
                <img src={t.photo_url} alt="" className="w-20 h-20 rounded-xl object-cover flex-shrink-0" />
              )}

              {/* konten */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <p className="font-semibold text-gray-800">{t.customer_name}</p>
                    <p className="text-xs text-gray-400">{t.customer_email}</p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_BADGE[t.status]}`}>
                    {t.status}
                  </span>
                </div>

                <div className="mt-1.5 mb-2">
                  <StarDisplay rating={t.rating} />
                </div>

                <p className="text-sm text-gray-700 leading-relaxed">{t.message}</p>

                <p className="text-xs text-gray-400 mt-2">
                  {new Date(t.created_at).toLocaleString('id-ID')}
                  {t.order_id && <span className="ml-2">· Order #{t.order_id}</span>}
                </p>
              </div>

              {/* aksi */}
              <div className="flex flex-col gap-2 flex-shrink-0">
                {t.status === 'pending' && (
                  <>
                    <button onClick={() => handleStatus(t.id, 'approved')}
                      className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg font-medium">
                      ✓ Setujui
                    </button>
                    <button onClick={() => handleStatus(t.id, 'rejected')}
                      className="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1.5 rounded-lg font-medium">
                      ✗ Tolak
                    </button>
                  </>
                )}
                {t.status === 'rejected' && (
                  <button onClick={() => handleStatus(t.id, 'approved')}
                    className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg font-medium">
                    ✓ Setujui
                  </button>
                )}
                {t.status === 'approved' && (
                  <button onClick={() => handleStatus(t.id, 'rejected')}
                    className="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1.5 rounded-lg font-medium">
                    ✗ Tolak
                  </button>
                )}
                <button onClick={() => setDeletingId(t.id)}
                  className="text-xs border border-gray-200 hover:bg-gray-50 text-gray-500 px-3 py-1.5 rounded-lg">
                  🗑 Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}