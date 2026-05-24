"use client";

import { Search, ShoppingBag, UserRound, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useCartStore } from "../store/CartStore";
import { useProductStore } from "../store/ProductStore";

export default function Navbar() {
  const [openSearch, setOpenSearch] = useState(false);
  const [keyword, setKeyword] = useState("");

  const { products } = useProductStore();
  const { cart } = useCartStore();

  const cartCount = cart.reduce((total, item) => total + item.qty, 0);

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(keyword.toLowerCase())
  );

  return (
    <>
      <header className="fixed top-0 z-50 w-full border-b border-white/10 bg-black/45 backdrop-blur-2xl">
        <nav className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-3">
            <img
              src="/logo-markas-iphone.png"
              alt="Markas iPhone"
              className="h-12 w-12 rounded-2xl object-cover shadow-[0_0_40px_rgba(59,130,246,0.45)]"
            />

            <div>
              <p className="text-xl font-black tracking-[-0.05em] text-white">
                Markas iPhone
              </p>
              <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-white/40">
                Premium Store
              </p>
            </div>
          </Link>

          <div className="hidden items-center rounded-full border border-white/10 bg-white/10 px-2 py-2 text-[13px] font-bold text-white/70 backdrop-blur-xl md:flex">
            <Link className="rounded-full px-5 py-2 hover:bg-white/10 hover:text-white" href="/#produk">
              iPhone
            </Link>
            <Link className="rounded-full px-5 py-2 hover:bg-white/10 hover:text-white" href="/#produk">
              Mac
            </Link>
            <Link className="rounded-full px-5 py-2 hover:bg-white/10 hover:text-white" href="/#produk">
              iPad
            </Link>
            <Link className="rounded-full px-5 py-2 hover:bg-white/10 hover:text-white" href="/#produk">
              Watch
            </Link>
          </div>

          <div className="flex items-center gap-3 text-white">
            <button
              type="button"
              onClick={() => setOpenSearch(true)}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/10 shadow-lg backdrop-blur-xl transition hover:scale-105 hover:bg-white/20"
            >
              <Search size={18} />
            </button>

            <Link
              href="/cart"
              className="relative flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/10 shadow-lg backdrop-blur-xl transition hover:scale-105 hover:bg-white/20"
            >
              <ShoppingBag size={18} />

              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-[10px] font-black text-white">
                  {cartCount}
                </span>
              )}
            </Link>

            <Link
              href="/admin/login"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-gradient-to-br from-white/25 to-white/5 shadow-lg backdrop-blur-xl transition hover:scale-105 hover:bg-white/20"
            >
              <UserRound size={18} />
            </Link>
          </div>
        </nav>
      </header>

      {openSearch && (
        <div className="fixed inset-0 z-[999] bg-black/80 px-6 py-10 backdrop-blur-2xl">
          <div className="mx-auto max-w-3xl">
            <div className="mb-8 flex items-center justify-between">
              <h2 className="text-4xl font-black tracking-[-0.05em] text-white">
                Cari Produk
              </h2>

              <button
                type="button"
                onClick={() => {
                  setOpenSearch(false);
                  setKeyword("");
                }}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
              >
                <X />
              </button>
            </div>

            <input
              autoFocus
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Cari iPhone, MacBook, iPad..."
              className="mb-8 w-full rounded-[28px] border border-white/10 bg-white/10 px-6 py-5 text-xl font-bold text-white outline-none placeholder:text-white/35 focus:ring-2 focus:ring-blue-500"
            />

            <div className="space-y-4">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <Link
                    key={product.id}
                    href={`/produk/${product.id}`}
                    onClick={() => {
                      setOpenSearch(false);
                      setKeyword("");
                    }}
                    className="flex items-center gap-5 rounded-[28px] border border-white/10 bg-white/10 p-4 text-white transition hover:bg-white/20"
                  >
                    <div className="flex h-24 w-24 items-center justify-center rounded-[22px] bg-white">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="max-h-20 object-contain"
                      />
                    </div>

                    <div>
                      <p className="text-sm font-black uppercase tracking-[0.2em] text-blue-300">
                        {product.category}
                      </p>
                      <h3 className="text-2xl font-black">{product.name}</h3>
                      <p className="text-white/50">{product.price}</p>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="rounded-[28px] bg-white/10 p-8 text-center text-white/50">
                  Produk tidak ditemukan.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}