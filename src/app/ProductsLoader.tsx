"use client";

import { useEffect } from "react";
import { useProductStore } from "../store/ProductStore";

/**
 * Komponen ini tidak merender apapun ke UI.
 * Tugasnya cuma satu: panggil fetchProducts() sekali saat app dimuat
 * supaya semua halaman (homepage, cart, dll.) selalu punya data produk terbaru
 * dari database — termasuk field promo (discount_percent, discounted_price).
 *
 * Diletakkan di layout.tsx agar aktif di semua route.
 */
export default function ProductsLoader() {
  const fetchProducts = useProductStore((s) => s.fetchProducts);

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}