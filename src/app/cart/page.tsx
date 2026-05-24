"use client";

import { ShoppingBag, Trash2 } from "lucide-react";
import Link from "next/link";
import Navbar from "../../components/Navbar";
import { useCartStore } from "../../store/CartStore";

function parseRupiah(price: string) {
  return Number(price.replace(/[^0-9]/g, ""));
}

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function CartPage() {
  const { cart, removeFromCart, clearCart } = useCartStore();

  const total = cart.reduce(
    (sum, item) => sum + parseRupiah(item.price) * item.qty,
    0
  );

  const checkoutText = cart
    .map((item) => `${item.name} ${item.storage} x${item.qty}`)
    .join(", ");

  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />

      <section className="mx-auto max-w-7xl px-6 py-32">
        <h1 className="mb-10 text-6xl font-black tracking-[-0.07em]">
          Keranjang.
        </h1>

        {cart.length === 0 ? (
          <div className="rounded-[40px] border border-white/10 bg-white/10 p-10 text-center">
            <ShoppingBag className="mx-auto mb-5 text-blue-300" size={48} />
            <h2 className="mb-3 text-3xl font-black">Keranjang kosong</h2>
            <p className="mb-8 text-white/50">
              Tambahkan produk dulu dari halaman detail.
            </p>
            <Link
              href="/#produk"
              className="inline-flex rounded-full bg-white px-7 py-4 font-black text-black"
            >
              Lihat Produk
            </Link>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="space-y-5 lg:col-span-2">
              {cart.map((item) => (
                <div
                  key={`${item.id}-${item.storage}`}
                  className="flex gap-5 rounded-[34px] border border-white/10 bg-white/10 p-5 backdrop-blur-xl"
                >
                  <div className="flex h-32 w-32 items-center justify-center rounded-[26px] bg-white">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="max-h-24 object-contain"
                    />
                  </div>

                  <div className="flex flex-1 items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-black uppercase tracking-[0.2em] text-blue-300">
                        {item.storage}
                      </p>
                      <h2 className="text-2xl font-black">{item.name}</h2>
                      <p className="mt-2 text-white/50">
                        {item.price} x {item.qty}
                      </p>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.id, item.storage)}
                      className="rounded-full bg-red-500/20 p-4 text-red-300 hover:bg-red-500 hover:text-white"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="h-fit rounded-[40px] border border-white/10 bg-white/10 p-8 backdrop-blur-xl">
              <p className="mb-2 text-sm font-black uppercase tracking-[0.3em] text-blue-300">
                Summary
              </p>

              <h2 className="mb-8 text-4xl font-black tracking-[-0.05em]">
                Total Pesanan
              </h2>

              <div className="mb-8 flex items-center justify-between border-t border-white/10 pt-6">
                <p className="text-white/50">Total</p>
                <p className="text-3xl font-black">{formatRupiah(total)}</p>
              </div>

              <Link
                href={`/checkout?produk=${encodeURIComponent(
                  checkoutText
                )}&harga=${encodeURIComponent(formatRupiah(total))}`}
                className="block rounded-full bg-blue-600 py-5 text-center font-black text-white hover:bg-blue-700"
              >
                Checkout Sekarang
              </Link>

              <button
                onClick={clearCart}
                className="mt-4 w-full rounded-full border border-white/10 py-4 font-black text-white/70 hover:bg-white/10"
              >
                Kosongkan Keranjang
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}