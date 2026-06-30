"use client";

import { ArrowUpRight, Gem, ShieldCheck, ShoppingBag, Tag } from "lucide-react";
import Link from "next/link";
import { Product } from "../store/ProductStore";

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function parseRupiah(price: string) {
  return Number(price.replace(/[^0-9]/g, ""));
}

export default function ProductCard({ product }: { product: Product }) {
  const hasPromo =
    product.discount_percent != null &&
    product.discount_percent > 0 &&
    product.discounted_price != null;

  const displayPrice = hasPromo
    ? formatRupiah(product.discounted_price!)
    : product.price;

  const originalPrice = product.price;

  // Harga yang dikirim ke checkout — pakai harga diskon kalau ada promo
  const checkoutPrice = hasPromo
    ? formatRupiah(product.discounted_price!)
    : product.price;

  return (
<div className="group block overflow-hidden rounded-[42px] border border-black/5 bg-white p-4 shadow-[0_20px_80px_rgba(0,0,0,0.04)] dark:border-white/5 dark:bg-[#161617] dark:shadow-[0_20px_80px_rgba(0,0,0,0.4)] transition-all duration-500 hover:-translate-y-3 hover:shadow-[0_35px_110px_rgba(37,99,235,0.15)] dark:hover:shadow-[0_35px_110px_rgba(37,99,235,0.25)]">
      <Link href={`/produk/${product.id}`}>
        <div className="relative mb-5 flex h-72 items-center justify-center overflow-hidden rounded-[34px] bg-gradient-to-br from-[#f8fbff] via-[#f5f5f7] to-[#eaf1ff] dark:from-neutral-900 dark:via-[#1e1e1f] dark:to-neutral-900 p-7 transition-colors duration-500">
          {/* Badge NEW atau DISKON */}
          {hasPromo ? (
            <div className="absolute left-5 top-5 z-20 flex items-center gap-1 rounded-full border border-red-200 bg-red-500 px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-white shadow-md">
              <Tag size={10} />
              DISKON {product.discount_percent}%
            </div>
          ) : (
            <div className="absolute left-5 top-5 z-20 rounded-full border border-black/5 bg-white/80 dark:border-white/10 dark:bg-white/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-blue-600 dark:text-blue-300 backdrop-blur-xl">
              New
            </div>
          )}

          <div className="absolute h-44 w-44 rounded-full bg-blue-400/20 dark:bg-blue-500/20 blur-3xl transition duration-500 group-hover:scale-150" />

          <img
            src={product.image}
            alt={product.name}
            className="relative z-10 max-h-full object-contain transition duration-700 group-hover:scale-110 group-hover:rotate-2"
          />

          <div className="absolute bottom-5 right-5 flex h-11 w-11 items-center justify-center rounded-full bg-neutral-900 text-white dark:bg-white dark:text-black shadow-xl transition-all duration-300 group-hover:bg-blue-600 group-hover:text-white">
            <ArrowUpRight size={18} />
          </div>
        </div>
      </Link>

      <div className="px-3 pb-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-600 dark:text-blue-400">
            {product.category}
          </p>

          <div className="flex items-center gap-1 text-[11px] font-black text-neutral-400 dark:text-neutral-500">
            <Gem size={13} className="text-blue-500/60" />
            Premium
          </div>
        </div>

        <Link href={`/produk/${product.id}`}>
          <h3 className="mb-2 text-3xl font-black tracking-[-0.06em] text-neutral-900 dark:text-white transition-colors duration-500">
            {product.name}
          </h3>
        </Link>

        <p className="mb-5 min-h-12 text-sm leading-6 text-neutral-500 dark:text-neutral-400 transition-colors duration-500">
          {product.desc}
        </p>

        <div className="mb-5 flex items-center gap-2 text-xs font-bold text-neutral-400 dark:text-neutral-500 transition-colors duration-500">
          <ShieldCheck size={15} className="text-blue-600 dark:text-blue-400" />
          Garansi resmi & produk original
        </div>

        <div className="flex items-center justify-between border-t border-black/5 dark:border-white/5 pt-5 transition-colors duration-500">
          <div>
            <p className="text-xs font-bold text-neutral-400 dark:text-neutral-500">Mulai dari</p>
            {hasPromo ? (
              <div>
                <p className="text-sm font-bold text-neutral-400 dark:text-neutral-500 line-through">
                  {originalPrice}
                </p>
                <p className="text-xl font-black text-red-500 dark:text-red-400">{displayPrice}</p>
              </div>
            ) : (
              <p className="text-xl font-black text-neutral-900 dark:text-white transition-colors duration-500">{displayPrice}</p>
            )}
          </div>

          <Link
            href={`/checkout?produk=${encodeURIComponent(product.name)}&harga=${encodeURIComponent(checkoutPrice)}`}
            className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-3 text-xs font-black text-white transition-all duration-300 hover:bg-neutral-900 dark:hover:bg-white dark:hover:text-black shadow-md"
          >
            <ShoppingBag size={15} />
            Checkout
          </Link>
        </div>
      </div>
    </div>
  );
}