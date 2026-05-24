"use client";

import { motion } from "framer-motion";
import {
  CheckCircle2,
  Copy,
  CreditCard,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  User,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import Navbar from "../../components/Navbar";

export default function CheckoutPage() {
  const searchParams = useSearchParams();

  const produk = searchParams.get("produk") || "Produk Apple";
  const harga = searchParams.get("harga") || "Rp 0";

  const rekening = "1234567890";
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    customer_name: "",
    customer_email: "",
    phone: "",
    address: "",
  });

  const inputClass =
    "w-full rounded-2xl border border-white/10 bg-black/40 py-4 pl-12 pr-4 font-bold text-white outline-none placeholder:text-white/35 shadow-[inset_0_0_0_9999px_rgba(0,0,0,0.25)] transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500";

  const copyRekening = async () => {
    await navigator.clipboard.writeText(rekening);
    alert("Nomor rekening berhasil disalin");
  };

  const handleOrder = async () => {
    if (!form.customer_name || !form.customer_email || !form.phone || !form.address) {
      alert("Lengkapi data checkout");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customer_name: form.customer_name,
          customer_email: form.customer_email,
          phone: form.phone,
          address: form.address,
          product: produk,
          total_price: harga,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Gagal membuat order");
        return;
      }

      const waText = encodeURIComponent(`Halo Admin Markas iPhone,

Saya sudah membuat pesanan.

Nama: ${form.customer_name}
Email: ${form.customer_email}
No WA: ${form.phone}

Produk: ${produk}
Total: ${harga}

Saya akan mengirim bukti transfer di chat ini.`);

      window.location.href = `https://wa.me/6281386824603?text=${waText}`;
    } catch (error) {
      console.error(error);
      alert("Terjadi error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen overflow-hidden bg-black text-white">
      <Navbar />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,#2563eb55_0%,transparent_35%),radial-gradient(circle_at_bottom_right,#9333ea55_0%,transparent_35%)]" />

      <section className="relative z-10 mx-auto max-w-7xl px-6 py-32">
        <div className="grid gap-8 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -35 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
            className="overflow-hidden rounded-[42px] border border-white/10 bg-white/10 p-8 shadow-[0_30px_100px_rgba(0,0,0,0.45)] backdrop-blur-2xl"
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-black text-white/80">
              <Sparkles size={15} />
              Secure Checkout
            </div>

            <h1 className="mb-3 text-6xl font-black tracking-[-0.07em]">
              Checkout.
            </h1>

            <p className="mb-10 max-w-lg text-lg leading-8 text-white/55">
              Lengkapi data checkout. Invoice akan dikirim ke email customer.
            </p>

            <div className="rounded-[34px] border border-white/10 bg-black/30 p-7">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-white/40">
                    Produk Dipilih
                  </p>
                  <h2 className="mt-2 text-3xl font-black">{produk}</h2>
                </div>

                <div className="rounded-2xl bg-blue-500/20 px-4 py-2 text-sm font-black text-blue-300">
                  Apple
                </div>
              </div>

              <div className="mb-6 h-px bg-white/10" />

              <div className="flex items-center justify-between">
                <p className="text-white/50">Total Pembayaran</p>
                <h3 className="text-4xl font-black tracking-[-0.05em]">
                  {harga}
                </h3>
              </div>
            </div>

            <div className="mt-8 space-y-4">
              <div className="relative">
                <User
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-300"
                  size={18}
                />
                <input
                  placeholder="Nama lengkap"
                  value={form.customer_name}
                  onChange={(e) =>
                    setForm({ ...form, customer_name: e.target.value })
                  }
                  className={inputClass}
                />
              </div>

              <div className="relative">
                <Mail
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-300"
                  size={18}
                />
                <input
                  type="email"
                  placeholder="Email customer"
                  value={form.customer_email}
                  onChange={(e) =>
                    setForm({ ...form, customer_email: e.target.value })
                  }
                  className={inputClass}
                />
              </div>

              <div className="relative">
                <Phone
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-300"
                  size={18}
                />
                <input
                  placeholder="Nomor WhatsApp"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className={inputClass}
                />
              </div>

              <div className="relative">
                <MapPin className="absolute left-4 top-6 text-blue-300" size={18} />
                <textarea
                  placeholder="Alamat lengkap"
                  value={form.address}
                  onChange={(e) =>
                    setForm({ ...form, address: e.target.value })
                  }
                  className={`${inputClass} h-32 resize-none`}
                />
              </div>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
                <ShieldCheck className="mb-4 text-blue-300" />
                <h3 className="mb-2 text-xl font-black">Pembayaran Aman</h3>
                <p className="text-sm leading-7 text-white/50">
                  Semua transaksi diverifikasi langsung oleh admin.
                </p>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
                <CreditCard className="mb-4 text-blue-300" />
                <h3 className="mb-2 text-xl font-black">Manual Transfer</h3>
                <p className="text-sm leading-7 text-white/50">
                  Bisa transfer via mBanking, ATM, atau QRIS.
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 35 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
            className="overflow-hidden rounded-[42px] border border-white/10 bg-white/10 p-8 shadow-[0_30px_100px_rgba(0,0,0,0.45)] backdrop-blur-2xl"
          >
            <p className="mb-3 text-sm font-black uppercase tracking-[0.3em] text-blue-300">
              Payment Method
            </p>

            <h2 className="mb-10 text-5xl font-black tracking-[-0.06em]">
              Transfer Bank
            </h2>

            <div className="mb-8 rounded-[34px] bg-white p-8 text-black">
              <p className="mb-2 text-sm font-bold text-neutral-400">
                Bank BCA
              </p>

              <h3 className="mb-4 text-5xl font-black tracking-[-0.05em]">
                {rekening}
              </h3>

              <p className="text-neutral-500">Atas Nama: Markas iPhone</p>

              <button
                type="button"
                onClick={copyRekening}
                className="mt-7 inline-flex items-center gap-2 rounded-full bg-black px-6 py-3 text-sm font-black text-white transition hover:bg-blue-600"
              >
                <Copy size={16} />
                Copy Rekening
              </button>
            </div>

            <button
              type="button"
              onClick={handleOrder}
              disabled={loading}
              className="flex w-full items-center justify-center gap-3 rounded-full bg-gradient-to-r from-blue-500 to-blue-700 py-5 text-lg font-black text-white shadow-[0_15px_60px_rgba(37,99,235,0.45)] transition hover:scale-[1.02] disabled:opacity-50"
            >
              <CheckCircle2 size={22} />
              {loading ? "Memproses..." : "Buat Pesanan & Kirim Invoice"}
            </button>

            <p className="mt-5 text-center text-sm text-white/35">
              Order masuk database, admin dapat email, customer dapat invoice.
            </p>
          </motion.div>
        </div>
      </section>
    </main>
  );
}