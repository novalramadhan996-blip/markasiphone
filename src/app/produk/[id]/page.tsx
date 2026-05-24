"use client";

import { motion } from "framer-motion";
import {
    ArrowLeft,
    Gem,
    MessageCircle,
    Plus,
    ShieldCheck,
    ShoppingBag,
    Truck,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

import Navbar from "../../../components/Navbar";
import { useCartStore } from "../../../store/CartStore";
import { useProductStore } from "../../../store/ProductStore";

const storageOptions = [
  { label: "128GB", add: 0 },
  { label: "256GB", add: 2000000 },
  { label: "512GB", add: 5000000 },
];

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

export default function ProductDetailPage() {
  const params = useParams();
  const { products } = useProductStore();
  const { addToCart } = useCartStore();

  const [selectedStorage, setSelectedStorage] = useState(storageOptions[0]);

  const product = products.find((item) => item.id === params.id);

  if (!product) {
    return (
      <main className="min-h-screen bg-black text-white">
        <Navbar />
        <div className="mx-auto max-w-7xl px-6 py-40 text-center">
          <h1 className="text-6xl font-black tracking-[-0.06em]">
            Produk tidak ditemukan.
          </h1>
          <Link
            href="/"
            className="mt-8 inline-flex rounded-full bg-white px-7 py-4 font-black text-black"
          >
            Kembali
          </Link>
        </div>
      </main>
    );
  }

  const basePrice = parseRupiah(product.price);
  const finalPrice = formatRupiah(basePrice + selectedStorage.add);
  const productWithStorage = `${product.name} ${selectedStorage.label}`;

  return (
    <main className="min-h-screen overflow-hidden bg-black text-white">
      <Navbar />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,#2563eb55_0%,transparent_35%),radial-gradient(circle_at_80%_20%,#9333ea55_0%,transparent_30%)]" />

      <section className="relative z-10 mx-auto grid max-w-7xl gap-10 px-6 py-32 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, x: -35 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
          className="flex min-h-[620px] items-center justify-center rounded-[50px] border border-white/10 bg-white/10 p-10 shadow-[0_30px_100px_rgba(0,0,0,0.45)] backdrop-blur-2xl"
        >
          <motion.img
            animate={{ y: [0, -18, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            src={product.image}
            alt={product.name}
            className="max-h-[520px] object-contain drop-shadow-[0_40px_90px_rgba(59,130,246,0.45)]"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 35 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
          className="flex flex-col justify-center"
        >
          <Link
            href="/"
            className="mb-8 inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/10 px-5 py-3 text-sm font-black text-white/70 backdrop-blur-xl hover:text-white"
          >
            <ArrowLeft size={16} />
            Kembali
          </Link>

          <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/10 px-5 py-2 text-sm font-black text-blue-300">
            <Gem size={16} />
            {product.category} Premium
          </div>

          <h1 className="mb-6 text-7xl font-black leading-none tracking-[-0.08em] md:text-8xl">
            {product.name}
          </h1>

          <p className="mb-8 max-w-xl text-xl leading-9 text-white/55">
            {product.desc}
          </p>

          <div className="mb-8 rounded-[34px] border border-white/10 bg-white/10 p-7 backdrop-blur-2xl">
            <p className="mb-2 text-sm font-bold text-white/40">
              Harga untuk {selectedStorage.label}
            </p>
            <h2 className="text-5xl font-black tracking-[-0.06em]">
              {finalPrice}
            </h2>
          </div>

          <div className="mb-8 grid grid-cols-3 gap-3">
            {storageOptions.map((storage) => (
              <button
                key={storage.label}
                type="button"
                onClick={() => setSelectedStorage(storage)}
                className={`rounded-2xl border px-4 py-4 font-black backdrop-blur-xl transition ${
                  selectedStorage.label === storage.label
                    ? "border-blue-400 bg-blue-500/25 text-white shadow-[0_0_35px_rgba(59,130,246,0.35)]"
                    : "border-white/10 bg-white/10 text-white hover:border-blue-400 hover:bg-blue-500/20"
                }`}
              >
                {storage.label}
              </button>
            ))}
          </div>

          <div className="mb-8 grid gap-3 md:grid-cols-3">
            <div className="rounded-[24px] border border-white/10 bg-white/10 p-5">
              <ShieldCheck className="mb-3 text-blue-300" />
              <p className="text-sm font-black">Garansi Resmi</p>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-white/10 p-5">
              <Truck className="mb-3 text-blue-300" />
              <p className="text-sm font-black">Gratis Ongkir</p>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-white/10 p-5">
              <Gem className="mb-3 text-blue-300" />
              <p className="text-sm font-black">Original</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <button
              type="button"
              onClick={() => {
                addToCart({
                  id: product.id,
                  name: product.name,
                  price: finalPrice,
                  image: product.image,
                  storage: selectedStorage.label,
                  qty: 1,
                });

                alert("Produk berhasil ditambahkan ke keranjang");
              }}
              className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/10 px-8 py-5 font-black text-white backdrop-blur-xl transition hover:bg-white/20"
            >
              <Plus size={20} />
              Tambah Keranjang
            </button>

            <Link
              href={`/checkout?produk=${encodeURIComponent(
                productWithStorage
              )}&harga=${encodeURIComponent(finalPrice)}`}
              className="inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-blue-500 to-blue-700 px-8 py-5 font-black text-white shadow-[0_15px_60px_rgba(37,99,235,0.45)] transition hover:scale-[1.03]"
            >
              <ShoppingBag size={20} />
              Checkout Sekarang
            </Link>

            <a
              href={`https://wa.me/6281386824603?text=${encodeURIComponent(
                `Halo Admin Markas iPhone, saya mau tanya ${productWithStorage} harga ${finalPrice}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/10 px-8 py-5 font-black text-white backdrop-blur-xl transition hover:bg-white/20"
            >
              <MessageCircle size={20} />
              Tanya Admin
            </a>
          </div>
        </motion.div>
      </section>
    </main>
  );
}