import { ArrowUpRight, Gem, ShieldCheck, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { Product } from "../store/ProductStore";

export default function ProductCard({ product }: { product: Product }) {
  return (
    <div className="group block overflow-hidden rounded-[42px] border border-black/5 bg-white p-4 shadow-[0_20px_80px_rgba(0,0,0,0.08)] transition-all duration-500 hover:-translate-y-3 hover:shadow-[0_35px_110px_rgba(37,99,235,0.22)]">
      <Link href={`/produk/${product.id}`}>
        <div className="relative mb-5 flex h-72 items-center justify-center overflow-hidden rounded-[34px] bg-gradient-to-br from-[#f8fbff] via-[#f5f5f7] to-[#eaf1ff] p-7">
          <div className="absolute left-5 top-5 rounded-full border border-white/60 bg-white/70 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-blue-600 backdrop-blur-xl">
            New
          </div>

          <div className="absolute h-44 w-44 rounded-full bg-blue-300/30 blur-3xl transition duration-500 group-hover:scale-150" />

          <img
            src={product.image}
            alt={product.name}
            className="relative z-10 max-h-full object-contain transition duration-700 group-hover:scale-110 group-hover:rotate-2"
          />

          <div className="absolute bottom-5 right-5 flex h-11 w-11 items-center justify-center rounded-full bg-black text-white shadow-xl transition group-hover:bg-blue-600">
            <ArrowUpRight size={18} />
          </div>
        </div>
      </Link>

      <div className="px-3 pb-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-600">
            {product.category}
          </p>

          <div className="flex items-center gap-1 text-[11px] font-black text-neutral-400">
            <Gem size={13} />
            Premium
          </div>
        </div>

        <Link href={`/produk/${product.id}`}>
          <h3 className="mb-2 text-3xl font-black tracking-[-0.06em] text-black">
            {product.name}
          </h3>
        </Link>

        <p className="mb-5 min-h-12 text-sm leading-6 text-neutral-500">
          {product.desc}
        </p>

        <div className="mb-5 flex items-center gap-2 text-xs font-bold text-neutral-500">
          <ShieldCheck size={15} className="text-blue-600" />
          Garansi resmi & produk original
        </div>

        <div className="flex items-center justify-between border-t border-black/5 pt-5">
          <div>
            <p className="text-xs font-bold text-neutral-400">Mulai dari</p>
            <p className="text-xl font-black text-black">{product.price}</p>
          </div>

          <Link
            href={`/checkout?produk=${encodeURIComponent(product.name)}&harga=${encodeURIComponent(product.price)}`}
            className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-3 text-xs font-black text-white transition hover:bg-black"
          >
            <ShoppingBag size={15} />
            Checkout
          </Link>
        </div>
      </div>
    </div>
  );
}