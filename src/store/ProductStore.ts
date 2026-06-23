"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Product = {
  id: string;
  name: string;
  category: string;
  price: string;           // format Rupiah string, misal "Rp 18.999.000"
  image: string;
  desc: string;
  is_active?: number;
  stock?: number;
  // ── Promo fields ─────────────────────────────────────────────
  promo_id?: number | null;
  discount_percent?: number | null;
  discounted_price?: number | null;   // number (bukan string), sudah dihitung di API
  promo_valid_until?: string | null;
};

/**
 * Shape yang datang dari /api/products (products-route-v2).
 * Promo di-nest di dalam field `promo` (null kalau tidak ada promo aktif).
 *
 * Contoh response:
 * {
 *   id: 3, name: "iPhone 15 Pro", base_price: 18999000, is_active: 1,
 *   promo: { id: 1, discount_percent: 10, valid_until: null, final_price: 17099100 },
 *   final_price: 17099100   // ← selalu ada, sama dengan base_price kalau tidak ada promo
 * }
 */
type ApiPromo = {
  id: number;
  discount_percent: number;
  valid_until: string | null;
  final_price: number;
};

type ApiProduct = {
  id: number | string;
  name: string;
  category: string;
  base_price: number;
  final_price: number;        // dihitung di API — base_price kalau tidak ada promo
  image_url?: string;
  description?: string;
  is_active?: number;
  stock?: number;
  promo: ApiPromo | null;     // null = tidak ada promo aktif
};

function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function mapApiProduct(p: ApiProduct): Product {
  const promo = p.promo ?? null;
  return {
    id: String(p.id),
    name: p.name,
    category: p.category,
    // `price` = harga normal (sebelum diskon), dipakai untuk tampilkan harga coret
    price: formatRupiah(p.base_price),
    image: p.image_url ?? "",
    desc: p.description ?? "",
    is_active: p.is_active,
    stock: p.stock,
    // Promo fields — null kalau tidak ada promo aktif
    promo_id: promo?.id ?? null,
    discount_percent: promo?.discount_percent ?? null,
    discounted_price: promo?.final_price ?? null,   // harga setelah diskon (number)
    promo_valid_until: promo?.valid_until ?? null,
  };
}

type ProductStore = {
  products: Product[];
  loading: boolean;
  error: string | null;

  setProducts: (products: Product[]) => void;
  addProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;

  /** Fetch dari /api/products dan update store. Kembalikan true kalau sukses. */
  fetchProducts: () => Promise<boolean>;
};

export const useProductStore = create<ProductStore>()(
  persist(
    (set) => ({
      products: [],
      loading: false,
      error: null,

      setProducts: (products) => set({ products }),

      addProduct: (product) =>
        set((state) => ({ products: [...state.products, product] })),

      deleteProduct: (id) =>
        set((state) => ({
          products: state.products.filter((item) => item.id !== id),
        })),

      fetchProducts: async () => {
        set({ loading: true, error: null });
        try {
          const res = await fetch("/api/products");
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = await res.json();

          // products-route-v2 mengembalikan array langsung: [...],
          // bukan object { products: [...] }
          const apiProducts: ApiProduct[] = Array.isArray(data) ? data : (data.products ?? []);
          const mapped = apiProducts
            .filter((p) => p.is_active === 1)
            .map(mapApiProduct);

          set({ products: mapped, loading: false });
          return true;
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Gagal memuat produk";
          set({ error: message, loading: false });
          return false;
        }
      },
    }),
    {
      name: "markas-iphone-products",
      // Hanya simpan products ke localStorage; loading/error tidak perlu dipersist
      partialize: (state) => ({ products: state.products }),
    }
  )
);